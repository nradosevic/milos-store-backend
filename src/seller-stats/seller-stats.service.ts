import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProxyAgent } from 'undici';
import { SettingsService } from '../settings/settings.service';
import { parseKpProfile } from './kp-parser';
import {
  SELLER_STATS_KEY,
  SELLER_STATS_STATUS_KEY,
  SellerStats,
  RefreshStatus,
} from './seller-stats.types';

/**
 * Values shipped before the first successful refresh. Mirrors the frontend's
 * FALLBACK_STATS — read off Miloš's KP profile by hand on 2026-09-22.
 */
const SEED: SellerStats = {
  positiveRatings: 1381,
  negativeRatings: 0,
  memberSince: '22.11.2012.',
  profileUrl: null,
  proofImageUrl: '/proof/kp-rating-overview.png',
  capturedAt: '2026-09-22T00:00:00.000Z',
  source: 'manual',
};

/**
 * A single run may not move the count by more than this. Ratings accrue a
 * handful a day, so a jump this large means we parsed the wrong element, not
 * that Miloš had a record week.
 */
const MAX_DELTA_PER_RUN = 300;

@Injectable()
export class SellerStatsService {
  private readonly logger = new Logger(SellerStatsService.name);

  constructor(private readonly settings: SettingsService) {}

  /** Profile to scrape. Without it the cron stays dormant. */
  private get profileUrl(): string | null {
    return process.env.KP_PROFILE_URL?.trim() || null;
  }

  /**
   * Residential egress. KP hard-blocks datacenter IPs and, per the server-wide
   * rule, we never touch it from the bare host — so no proxy means no scrape.
   */
  private get proxyUrl(): string | null {
    return process.env.KP_PROXY_URL?.trim() || null;
  }

  isConfigured(): boolean {
    return Boolean(this.profileUrl && this.proxyUrl);
  }

  async getStats(): Promise<SellerStats> {
    try {
      const row = await this.settings.findByKey(SELLER_STATS_KEY);
      return { ...SEED, ...JSON.parse(row.value) } as SellerStats;
    } catch {
      return SEED;
    }
  }

  async getStatus(): Promise<RefreshStatus | null> {
    try {
      const row = await this.settings.findByKey(SELLER_STATS_STATUS_KEY);
      return JSON.parse(row.value) as RefreshStatus;
    } catch {
      return null;
    }
  }

  /** Publish figures, whatever their origin. Validated before it lands. */
  async setStats(patch: Partial<SellerStats>): Promise<SellerStats> {
    const current = await this.getStats();
    const next: SellerStats = {
      ...current,
      ...patch,
      capturedAt: patch.capturedAt ?? new Date().toISOString(),
    };

    if (
      !Number.isInteger(next.positiveRatings) ||
      next.positiveRatings < 0 ||
      next.positiveRatings >= 1_000_000 ||
      !Number.isInteger(next.negativeRatings) ||
      next.negativeRatings < 0
    ) {
      throw new BadRequestException('Rating counts out of range');
    }

    await this.settings.upsert(SELLER_STATS_KEY, JSON.stringify(next), 'json');
    return next;
  }

  private async writeStatus(status: RefreshStatus): Promise<void> {
    await this.settings.upsert(
      SELLER_STATS_STATUS_KEY,
      JSON.stringify(status),
      'json',
    );
  }

  private async fetchProfileHtml(): Promise<string> {
    const dispatcher = new ProxyAgent(this.proxyUrl!);
    try {
      const res = await fetch(this.profileUrl!, {
        dispatcher,
        headers: {
          // A plain fetch UA is an instant block; mirror a real browser.
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
          'Accept-Language': 'sr-RS,sr;q=0.9,en;q=0.8',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(30_000),
      } as RequestInit & { dispatcher: ProxyAgent });

      if (!res.ok) {
        throw new Error(`KP returned HTTP ${res.status}`);
      }
      return await res.text();
    } finally {
      await dispatcher.close().catch(() => undefined);
    }
  }

  /**
   * Read the profile and publish the figures if they pass every guard.
   * Returns what happened; never throws for an expected failure, because the
   * cron treats "couldn't read today" as normal — the old value stays up.
   */
  async refreshFromKp(): Promise<RefreshStatus> {
    const lastRunAt = new Date().toISOString();

    if (!this.isConfigured()) {
      const status: RefreshStatus = {
        lastRunAt,
        ok: false,
        error: 'Not configured — set KP_PROFILE_URL and KP_PROXY_URL',
      };
      await this.writeStatus(status);
      return status;
    }

    let html: string;
    try {
      html = await this.fetchProfileHtml();
    } catch (err: any) {
      const status: RefreshStatus = {
        lastRunAt,
        ok: false,
        error: `Fetch failed: ${err?.message ?? err}`,
      };
      await this.writeStatus(status);
      return status;
    }

    const parsed = parseKpProfile(html);
    if (!parsed) {
      const status: RefreshStatus = {
        lastRunAt,
        ok: false,
        error: 'Could not parse rating counts from the profile page',
        snippet: html.replace(/\s+/g, ' ').slice(0, 600),
      };
      await this.writeStatus(status);
      this.logger.warn('KP parse failed — markup may have changed');
      return status;
    }

    const current = await this.getStats();

    // Ratings are cumulative and a seller cannot lose them. A drop means we
    // read the wrong element (or KP served a stale/partial page).
    if (parsed.positiveRatings < current.positiveRatings) {
      const status: RefreshStatus = {
        lastRunAt,
        ok: false,
        read: {
          positiveRatings: parsed.positiveRatings,
          negativeRatings: parsed.negativeRatings,
        },
        error: `Refusing a decrease: read ${parsed.positiveRatings}, have ${current.positiveRatings}`,
      };
      await this.writeStatus(status);
      return status;
    }

    if (parsed.positiveRatings - current.positiveRatings > MAX_DELTA_PER_RUN) {
      const status: RefreshStatus = {
        lastRunAt,
        ok: false,
        read: {
          positiveRatings: parsed.positiveRatings,
          negativeRatings: parsed.negativeRatings,
        },
        error: `Refusing an implausible jump of ${parsed.positiveRatings - current.positiveRatings}`,
      };
      await this.writeStatus(status);
      return status;
    }

    const changed =
      parsed.positiveRatings !== current.positiveRatings ||
      parsed.negativeRatings !== current.negativeRatings;

    await this.setStats({
      positiveRatings: parsed.positiveRatings,
      negativeRatings: parsed.negativeRatings,
      memberSince: parsed.memberSince ?? current.memberSince,
      profileUrl: this.profileUrl,
      capturedAt: lastRunAt,
      source: 'kp-scrape',
    });

    const status: RefreshStatus = {
      lastRunAt,
      ok: true,
      read: {
        positiveRatings: parsed.positiveRatings,
        negativeRatings: parsed.negativeRatings,
      },
      changed,
    };
    await this.writeStatus(status);
    this.logger.log(
      `KP stats refreshed via ${parsed.strategy}: ${parsed.positiveRatings}+/${parsed.negativeRatings}- (${changed ? 'changed' : 'unchanged'})`,
    );
    return status;
  }
}

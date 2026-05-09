import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, IsNull, LessThan } from 'typeorm';
import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';
import { Product } from '../products/entities/product.entity';
import { SiteSettings } from '../settings/entities/site-settings.entity';

const REFRESH_TOKEN_KEY = 'google_indexing_refresh_token';
const INDEXING_SCOPE = 'https://www.googleapis.com/auth/indexing';
const SITE_URL_DEFAULT = 'https://rariteti.rs';

export interface SubmitResult {
  ok: boolean;
  status?: number;
  error?: string;
}

@Injectable()
export class IndexingApiService {
  private readonly logger = new Logger(IndexingApiService.name);
  private cachedClient: OAuth2Client | null = null;

  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(SiteSettings)
    private readonly settingsRepository: Repository<SiteSettings>,
    private readonly config: ConfigService,
  ) {}

  private get clientId(): string {
    return this.config.get<string>('GOOGLE_OAUTH_CLIENT_ID') ?? '';
  }

  private get clientSecret(): string {
    return this.config.get<string>('GOOGLE_OAUTH_CLIENT_SECRET') ?? '';
  }

  private get redirectUri(): string {
    return (
      this.config.get<string>('GOOGLE_OAUTH_REDIRECT_URI') ??
      'https://api.rariteti.rs/admin/indexing-oauth/callback'
    );
  }

  private get siteUrl(): string {
    return this.config.get<string>('SITE_URL') ?? SITE_URL_DEFAULT;
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret);
  }

  buildAuthUrl(): string {
    if (!this.isConfigured()) {
      throw new BadRequestException(
        'GOOGLE_OAUTH_CLIENT_ID/SECRET env vars not set',
      );
    }
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    return oauth2.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [INDEXING_SCOPE],
    });
  }

  async exchangeCode(code: string): Promise<void> {
    const oauth2 = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    const { tokens } = await oauth2.getToken(code);
    if (!tokens.refresh_token) {
      throw new BadRequestException(
        'No refresh_token returned. Revoke prior consent at ' +
          'https://myaccount.google.com/permissions and retry.',
      );
    }
    await this.upsertSetting(REFRESH_TOKEN_KEY, tokens.refresh_token);
    this.cachedClient = null;
    this.logger.log('Stored Google Indexing refresh token');
  }

  async hasRefreshToken(): Promise<boolean> {
    const s = await this.settingsRepository.findOne({
      where: { key: REFRESH_TOKEN_KEY },
    });
    return Boolean(s?.value);
  }

  private async getOAuthClient(): Promise<OAuth2Client> {
    if (this.cachedClient) return this.cachedClient;

    const setting = await this.settingsRepository.findOne({
      where: { key: REFRESH_TOKEN_KEY },
    });
    if (!setting?.value) {
      throw new BadRequestException(
        'Google Indexing OAuth not connected. Visit /admin/indexing-oauth/start',
      );
    }
    const client = new google.auth.OAuth2(
      this.clientId,
      this.clientSecret,
      this.redirectUri,
    );
    client.setCredentials({ refresh_token: setting.value });
    this.cachedClient = client;
    return client;
  }

  async notifyUrlUpdate(url: string): Promise<SubmitResult> {
    return this.notify(url, 'URL_UPDATED');
  }

  async notifyUrlDelete(url: string): Promise<SubmitResult> {
    return this.notify(url, 'URL_DELETED');
  }

  private async notify(
    url: string,
    type: 'URL_UPDATED' | 'URL_DELETED',
  ): Promise<SubmitResult> {
    if (!this.isConfigured()) return { ok: false, error: 'not_configured' };
    if (!(await this.hasRefreshToken())) {
      return { ok: false, error: 'oauth_not_connected' };
    }

    try {
      const auth = await this.getOAuthClient();
      const indexing = google.indexing({ version: 'v3', auth });
      await indexing.urlNotifications.publish({
        requestBody: { url, type },
      });
      return { ok: true };
    } catch (err: any) {
      const status = err?.code ?? err?.response?.status;
      const message =
        err?.response?.data?.error?.message ?? err?.message ?? String(err);
      this.logger.warn(`Indexing API ${type} ${url} failed (${status}): ${message}`);
      return { ok: false, status, error: message };
    }
  }

  productUrl(slug: string): string {
    return `${this.siteUrl}/predmet/${slug}`;
  }

  async submitProductUpdate(slug: string): Promise<SubmitResult> {
    const result = await this.notifyUrlUpdate(this.productUrl(slug));
    if (result.ok) {
      await this.productRepository.update(
        { slug },
        { lastIndexedAt: new Date() },
      );
    }
    return result;
  }

  async submitProductDelete(slug: string): Promise<SubmitResult> {
    return this.notifyUrlDelete(this.productUrl(slug));
  }

  async runBackfillBatch(maxUrls = 200): Promise<{
    attempted: number;
    succeeded: number;
    failed: number;
    quotaExhausted: boolean;
  }> {
    if (!this.isConfigured() || !(await this.hasRefreshToken())) {
      return { attempted: 0, succeeded: 0, failed: 0, quotaExhausted: false };
    }

    // Pick products that have never been indexed (NULL first), then those
    // indexed more than 30 days ago (re-ping for freshness).
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const candidates = await this.productRepository.find({
      where: [
        { isActive: true, lastIndexedAt: IsNull() },
        { isActive: true, lastIndexedAt: LessThan(thirtyDaysAgo) },
      ],
      order: { lastIndexedAt: { direction: 'ASC', nulls: 'FIRST' } },
      select: ['id', 'slug'],
      take: maxUrls,
    });

    let succeeded = 0;
    let failed = 0;
    let quotaExhausted = false;

    for (const p of candidates) {
      const result = await this.submitProductUpdate(p.slug);
      if (result.ok) {
        succeeded++;
      } else {
        failed++;
        if (result.status === 429) {
          quotaExhausted = true;
          this.logger.warn('Indexing API quota exhausted; stopping batch');
          break;
        }
      }
      // Soft pacing: stay under per-minute limits (~100/100s)
      await new Promise((r) => setTimeout(r, 700));
    }

    this.logger.log(
      `Backfill batch: attempted=${candidates.length} ok=${succeeded} failed=${failed} quota_exhausted=${quotaExhausted}`,
    );
    return {
      attempted: candidates.length,
      succeeded,
      failed,
      quotaExhausted,
    };
  }

  async getStatus(): Promise<{
    configured: boolean;
    connected: boolean;
    totalProducts: number;
    indexed: number;
    pending: number;
    stale: number;
  }> {
    const totalProducts = await this.productRepository.count({
      where: { isActive: true },
    });
    const indexed = await this.productRepository.count({
      where: { isActive: true, lastIndexedAt: LessThan(new Date(8640000000000000)) },
    });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const stale = await this.productRepository.count({
      where: { isActive: true, lastIndexedAt: LessThan(thirtyDaysAgo) },
    });
    const pending = totalProducts - indexed;
    return {
      configured: this.isConfigured(),
      connected: await this.hasRefreshToken(),
      totalProducts,
      indexed,
      pending,
      stale,
    };
  }

  private async upsertSetting(key: string, value: string): Promise<void> {
    let s = await this.settingsRepository.findOne({ where: { key } });
    if (s) {
      s.value = value;
      s.type = 'text';
    } else {
      s = this.settingsRepository.create({ key, value, type: 'text' });
    }
    await this.settingsRepository.save(s);
  }
}

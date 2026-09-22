import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SellerStatsService } from './seller-stats.service';

const RETRY_DELAYS_MS = [60_000, 180_000];

@Injectable()
export class SellerStatsCron {
  private readonly logger = new Logger(SellerStatsCron.name);

  constructor(private readonly service: SellerStatsService) {}

  // Every day at 04:15 UTC — off-peak for KP, and clear of the 03:30 indexing
  // backfill so the two jobs never contend.
  @Cron('15 4 * * *')
  async dailyRefresh() {
    if (!this.service.isConfigured()) {
      this.logger.debug('KP stats refresh skipped — not configured');
      return;
    }

    // A block or a 4G hiccup is transient; spread the attempts over a few
    // minutes rather than writing the day off on the first failure.
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      const status = await this.service.refreshFromKp();
      if (status.ok) {
        this.logger.log(
          `KP stats refresh ok: ${status.read?.positiveRatings}+ (${status.changed ? 'changed' : 'unchanged'})`,
        );
        return;
      }

      // A parse failure or a rejected value will not fix itself on a retry —
      // only fetch-level failures are worth going again for.
      if (!status.error?.startsWith('Fetch failed')) {
        this.logger.warn(`KP stats refresh not retryable: ${status.error}`);
        return;
      }

      const delay = RETRY_DELAYS_MS[attempt];
      if (delay === undefined) break;
      this.logger.warn(
        `KP stats fetch failed (${status.error}); retrying in ${delay / 1000}s`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }

    this.logger.error('KP stats refresh failed after retries — keeping last known value');
  }
}

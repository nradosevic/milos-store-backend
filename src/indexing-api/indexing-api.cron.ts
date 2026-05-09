import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IndexingApiService } from './indexing-api.service';

@Injectable()
export class IndexingApiCron {
  private readonly logger = new Logger(IndexingApiCron.name);

  constructor(private readonly service: IndexingApiService) {}

  // Every day at 03:30 UTC. Submits up to 200 URLs (Indexing API daily quota).
  @Cron('30 3 * * *')
  async dailyBackfill() {
    if (!this.service.isConfigured() || !(await this.service.hasRefreshToken())) {
      return;
    }
    this.logger.log('Starting daily Indexing API backfill batch');
    const result = await this.service.runBackfillBatch(200);
    this.logger.log(`Daily backfill done: ${JSON.stringify(result)}`);
  }
}

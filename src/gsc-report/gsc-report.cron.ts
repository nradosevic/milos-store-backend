import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GscReportService } from './gsc-report.service';

@Injectable()
export class GscReportCron {
  private readonly logger = new Logger(GscReportCron.name);

  constructor(private readonly service: GscReportService) {}

  // Monday 07:00 UTC = 09:00 Belgrade time (CET) / 08:00 in winter.
  @Cron('0 7 * * 1')
  async weeklyReport() {
    if (!this.service.isConfigured()) {
      this.logger.debug('GSC report skipped — not configured');
      return;
    }
    try {
      const result = await this.service.runOnce();
      this.logger.log(
        `Weekly GSC report ${result.sent ? 'sent' : 'built but not sent'}` +
          (result.error ? `: ${result.error}` : ''),
      );
    } catch (err: any) {
      this.logger.error(`Weekly GSC report failed: ${err?.message ?? err}`);
    }
  }
}

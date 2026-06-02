import { Controller, Get, Post } from '@nestjs/common';
import { GscReportService } from './gsc-report.service';

@Controller('api/admin/gsc-report')
export class GscReportController {
  constructor(private readonly service: GscReportService) {}

  @Get('preview')
  async preview() {
    return await this.service.buildReport();
  }

  @Post('send')
  async send() {
    return await this.service.runOnce();
  }
}

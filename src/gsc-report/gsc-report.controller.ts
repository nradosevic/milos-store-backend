import { Controller, Get, Post } from '@nestjs/common';
import { GscReportService } from './gsc-report.service';

@Controller()
export class GscReportController {
  constructor(private readonly service: GscReportService) {}

  @Get('admin/gsc-report/preview')
  async preview() {
    return await this.service.buildReport();
  }

  @Post('admin/gsc-report/send')
  async send() {
    return await this.service.runOnce();
  }
}

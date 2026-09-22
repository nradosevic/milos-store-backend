import { Controller, Get, Post, Body } from '@nestjs/common';
import { SellerStatsService } from './seller-stats.service';
import { SellerStats } from './seller-stats.types';

/**
 * Admin surface for the KP reputation figures. Guarded by the global
 * JwtAuthGuard; the storefront reads the published value through the public
 * GET /api/settings/seller_stats instead.
 */
@Controller('admin/seller-stats')
export class SellerStatsController {
  constructor(private readonly service: SellerStatsService) {}

  /** Current published figures plus how the last refresh went. */
  @Get()
  async get() {
    return {
      stats: await this.service.getStats(),
      status: await this.service.getStatus(),
      configured: this.service.isConfigured(),
    };
  }

  /**
   * Set the figures by hand. This is the escape hatch that keeps the site
   * current when scraping is unavailable — no redeploy needed.
   */
  @Post()
  async set(@Body() body: Partial<SellerStats>) {
    return this.service.setStats({ ...body, source: 'manual' });
  }

  /** Run the scrape now instead of waiting for the nightly cron. */
  @Post('refresh')
  async refresh() {
    return this.service.refreshFromKp();
  }
}

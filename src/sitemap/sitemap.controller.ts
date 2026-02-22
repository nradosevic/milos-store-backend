import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SitemapService } from './sitemap.service';
import { Public } from '../common/decorators/public.decorator';

@Public()
@Controller()
export class SitemapController {
  constructor(private readonly sitemapService: SitemapService) {}

  @Get('sitemap.xml')
  async getSitemap(@Res() res: Response) {
    const xml = await this.sitemapService.generateSitemap();
    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  }
}

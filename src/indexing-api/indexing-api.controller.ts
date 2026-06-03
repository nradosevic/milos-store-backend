import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  Body,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { IndexingApiService } from './indexing-api.service';
import { Public } from '../common/decorators/public.decorator';

@Controller()
export class IndexingApiController {
  constructor(private readonly service: IndexingApiService) {}

  // --- OAuth flow (public — these are entry points the site owner opens once) ---

  @Public()
  @Get('admin/indexing-oauth/start')
  start(@Res() res: Response) {
    const url = this.service.buildAuthUrl();
    res.redirect(url);
  }

  @Public()
  @Get('admin/indexing-oauth/callback')
  async callback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    if (error) {
      res
        .status(400)
        .send(`<h1>OAuth error</h1><p>${error}</p>`);
      return;
    }
    if (!code) {
      res.status(400).send('<h1>Missing ?code</h1>');
      return;
    }
    try {
      await this.service.exchangeCode(code);
      res.send(
        '<h1>Connected ✓</h1><p>Google Indexing API is now linked. You can close this tab.</p>',
      );
    } catch (e: any) {
      res
        .status(400)
        .send(`<h1>Failed</h1><pre>${e?.message ?? String(e)}</pre>`);
    }
  }

  // --- Admin endpoints (under /api/admin/* via global prefix; JWT-protected) ---

  @Get('admin/indexing-api/status')
  status() {
    return this.service.getStatus();
  }

  @Post('admin/indexing-api/notify')
  async notify(@Body() body: { url?: string; slug?: string; type?: string }) {
    const action = (body.type ?? 'URL_UPDATED').toUpperCase();
    if (body.slug) {
      return action === 'URL_DELETED'
        ? this.service.submitProductDelete(body.slug)
        : this.service.submitProductUpdate(body.slug);
    }
    if (body.url) {
      return action === 'URL_DELETED'
        ? this.service.notifyUrlDelete(body.url)
        : this.service.notifyUrlUpdate(body.url);
    }
    throw new BadRequestException('Provide either { slug } or { url }');
  }

  @Post('admin/indexing-api/submit-sitemap')
  submitSitemap() {
    return this.service.submitSitemap();
  }

  @Post('admin/indexing-api/run-backfill')
  runBackfill(@Body() body: { max?: number }) {
    const max = Math.min(Math.max(body.max ?? 200, 1), 200);
    // Fire-and-forget — a 200-URL batch takes ~140s, longer than Cloudflare's
    // 100s proxy timeout. Return immediately and let the batch run on the server.
    this.service.runBackfillBatch(max).catch(() => {
      /* logged inside the service */
    });
    return { started: true, max };
  }
}

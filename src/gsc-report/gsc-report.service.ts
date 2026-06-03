import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, IsNull, Not } from 'typeorm';
import { google, webmasters_v3 } from 'googleapis';
import { IndexingApiService } from '../indexing-api/indexing-api.service';
import { Product } from '../products/entities/product.entity';

interface SearchAnalyticsRow {
  keys?: string[] | null;
  clicks?: number | null;
  impressions?: number | null;
  ctr?: number | null;
  position?: number | null;
}

export interface CoverageReport {
  generatedAt: string;
  sitemap: {
    feedpath: string;
    lastSubmitted?: string;
    lastDownloaded?: string;
    submitted: number;
    indexed: number;
    coverage: number;
    warnings?: number;
    errors?: number;
  } | null;
  searchAnalytics: {
    rangeFrom: string;
    rangeTo: string;
    totals: { clicks: number; impressions: number; ctr: number; position: number };
    topQueries: SearchAnalyticsRow[];
    topPages: SearchAnalyticsRow[];
  } | null;
  pipeline: {
    activeProducts: number;
    pingedViaIndexingApi: number;
    pendingPing: number;
  };
}

@Injectable()
export class GscReportService {
  private readonly logger = new Logger(GscReportService.name);

  constructor(
    private readonly indexingApi: IndexingApiService,
    private readonly config: ConfigService,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  private get gscSiteUrl(): string {
    // Accepts URL-prefix property ("https://rariteti.rs/") or domain
    // property ("sc-domain:rariteti.rs"). Defaults to the URL-prefix form
    // which matches the sitemap we submit.
    return this.config.get<string>('GSC_SITE_URL') ?? 'https://rariteti.rs/';
  }

  private get sitemapFeedpath(): string {
    return this.config.get<string>('GSC_SITEMAP_URL') ?? 'https://rariteti.rs/sitemap.xml';
  }

  private get reportTo(): string {
    return this.config.get<string>('GSC_REPORT_TO') ?? '';
  }

  private get sendgridApiKey(): string {
    return this.config.get<string>('SENDGRID_API_KEY') ?? '';
  }

  private get sendgridFrom(): { email: string; name: string } {
    return {
      email: this.config.get<string>('SENDGRID_FROM_EMAIL') ?? 'noreply@rariteti.rs',
      name: this.config.get<string>('SENDGRID_FROM_NAME') ?? 'Rariteti.rs Indexing',
    };
  }

  isConfigured(): boolean {
    return (
      Boolean(this.reportTo) &&
      Boolean(this.sendgridApiKey) &&
      this.indexingApi.isConfigured()
    );
  }

  async buildReport(): Promise<CoverageReport> {
    if (!this.indexingApi.isConfigured()) {
      throw new BadRequestException(
        'GOOGLE_OAUTH_CLIENT_ID/SECRET not set — cannot reach Search Console',
      );
    }
    if (!(await this.indexingApi.hasRefreshToken())) {
      throw new BadRequestException(
        'Google OAuth not connected. Re-run /admin/indexing-oauth/start so the consent grants the webmasters.readonly scope.',
      );
    }

    const auth = await this.indexingApi.getAuthorizedClient();
    const webmasters = google.webmasters({ version: 'v3', auth });

    const [sitemap, analytics, pipeline] = await Promise.all([
      this.fetchSitemap(webmasters).catch((err) => {
        this.logger.warn(`Sitemap fetch failed: ${err?.message ?? err}`);
        return null;
      }),
      this.fetchSearchAnalytics(webmasters).catch((err) => {
        this.logger.warn(`searchAnalytics fetch failed: ${err?.message ?? err}`);
        return null;
      }),
      this.fetchPipelineStats(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      sitemap,
      searchAnalytics: analytics,
      pipeline,
    };
  }

  private async fetchSitemap(
    webmasters: webmasters_v3.Webmasters,
  ): Promise<CoverageReport['sitemap']> {
    const res = await webmasters.sitemaps.get({
      siteUrl: this.gscSiteUrl,
      feedpath: this.sitemapFeedpath,
    });
    const data = res.data;
    const content = data.contents?.[0];
    return {
      feedpath: this.sitemapFeedpath,
      lastSubmitted: data.lastSubmitted ?? undefined,
      lastDownloaded: data.lastDownloaded ?? undefined,
      submitted: Number(content?.submitted ?? 0),
      indexed: Number(content?.indexed ?? 0),
      coverage:
        Number(content?.submitted ?? 0) > 0
          ? Number(content?.indexed ?? 0) / Number(content?.submitted ?? 0)
          : 0,
      warnings: Number(data.warnings ?? 0),
      errors: Number(data.errors ?? 0),
    };
  }

  private async fetchSearchAnalytics(
    webmasters: webmasters_v3.Webmasters,
  ): Promise<CoverageReport['searchAnalytics']> {
    const end = new Date();
    end.setUTCDate(end.getUTCDate() - 3); // Google's data lags ~2-3 days
    const start = new Date(end);
    start.setUTCDate(start.getUTCDate() - 7);

    const rangeFrom = start.toISOString().slice(0, 10);
    const rangeTo = end.toISOString().slice(0, 10);

    const [totals, byQuery, byPage] = await Promise.all([
      webmasters.searchanalytics.query({
        siteUrl: this.gscSiteUrl,
        requestBody: { startDate: rangeFrom, endDate: rangeTo, rowLimit: 1 },
      }),
      webmasters.searchanalytics.query({
        siteUrl: this.gscSiteUrl,
        requestBody: {
          startDate: rangeFrom,
          endDate: rangeTo,
          dimensions: ['query'],
          rowLimit: 10,
        },
      }),
      webmasters.searchanalytics.query({
        siteUrl: this.gscSiteUrl,
        requestBody: {
          startDate: rangeFrom,
          endDate: rangeTo,
          dimensions: ['page'],
          rowLimit: 10,
        },
      }),
    ]);

    const totalRow = totals.data.rows?.[0] ?? {};

    return {
      rangeFrom,
      rangeTo,
      totals: {
        clicks: Number(totalRow.clicks ?? 0),
        impressions: Number(totalRow.impressions ?? 0),
        ctr: Number(totalRow.ctr ?? 0),
        position: Number(totalRow.position ?? 0),
      },
      topQueries: byQuery.data.rows ?? [],
      topPages: byPage.data.rows ?? [],
    };
  }

  private async fetchPipelineStats(): Promise<CoverageReport['pipeline']> {
    const [active, pinged] = await Promise.all([
      this.productRepository.count({ where: { isActive: true } }),
      this.productRepository.count({
        where: { isActive: true, lastIndexedAt: Not(IsNull()) },
      }),
    ]);
    return {
      activeProducts: active,
      pingedViaIndexingApi: pinged,
      pendingPing: Math.max(0, active - pinged),
    };
  }

  async sendReport(report: CoverageReport): Promise<void> {
    if (!this.reportTo) {
      throw new BadRequestException('GSC_REPORT_TO not set');
    }
    if (!this.sendgridApiKey) {
      throw new BadRequestException('SENDGRID_API_KEY not set');
    }

    const html = this.renderHtml(report);
    const subject = `[Rariteti.rs] Indexing report — ${report.generatedAt.slice(0, 10)}`;

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.sendgridApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: this.reportTo }] }],
        from: this.sendgridFrom,
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`SendGrid ${res.status}: ${body.slice(0, 300)}`);
    }
    this.logger.log(`Coverage report sent to ${this.reportTo} via SendGrid`);
  }

  private renderHtml(r: CoverageReport): string {
    const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
    const num = (n: number) => n.toLocaleString('en-US');

    const sitemapBlock = r.sitemap
      ? `
        <h3>Sitemap status</h3>
        <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td>Submitted URLs</td><td><b>${num(r.sitemap.submitted)}</b></td></tr>
          <tr><td>Indexed by Google</td><td><b>${num(r.sitemap.indexed)}</b> (${pct(r.sitemap.coverage)})</td></tr>
          <tr><td>Last submitted</td><td>${r.sitemap.lastSubmitted ?? '—'}</td></tr>
          <tr><td>Last downloaded</td><td>${r.sitemap.lastDownloaded ?? '—'}</td></tr>
          <tr><td>Warnings / errors</td><td>${r.sitemap.warnings ?? 0} / ${r.sitemap.errors ?? 0}</td></tr>
        </table>`
      : `<p><i>Sitemap data unavailable — check that <code>${this.sitemapFeedpath}</code> is registered in Search Console under property <code>${this.gscSiteUrl}</code>.</i></p>`;

    const sa = r.searchAnalytics;
    const analyticsBlock = sa
      ? `
        <h3>Search performance (${sa.rangeFrom} → ${sa.rangeTo})</h3>
        <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:14px">
          <tr><td>Clicks</td><td><b>${num(sa.totals.clicks)}</b></td></tr>
          <tr><td>Impressions</td><td><b>${num(sa.totals.impressions)}</b></td></tr>
          <tr><td>CTR</td><td>${pct(sa.totals.ctr)}</td></tr>
          <tr><td>Avg position</td><td>${sa.totals.position.toFixed(1)}</td></tr>
        </table>
        <h4>Top queries (by clicks)</h4>
        ${this.renderTable(sa.topQueries, 'Query')}
        <h4>Top pages (by clicks)</h4>
        ${this.renderTable(sa.topPages, 'Page')}`
      : `<p><i>Search analytics data unavailable.</i></p>`;

    const pipelineBlock = `
      <h3>Indexing pipeline (DB)</h3>
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:14px">
        <tr><td>Active products</td><td><b>${num(r.pipeline.activeProducts)}</b></td></tr>
        <tr><td>Pinged via Indexing API</td><td><b>${num(r.pipeline.pingedViaIndexingApi)}</b></td></tr>
        <tr><td>Pending first ping</td><td>${num(r.pipeline.pendingPing)}</td></tr>
      </table>`;

    return `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#222;max-width:680px;margin:0 auto;padding:16px">
        <h2 style="margin-bottom:4px">Rariteti.rs — Indexing report</h2>
        <div style="color:#666;font-size:13px;margin-bottom:18px">Generated ${r.generatedAt}</div>
        ${sitemapBlock}
        ${analyticsBlock}
        ${pipelineBlock}
        <p style="margin-top:24px;font-size:12px;color:#888">
          Reports run every Monday at 09:00 Belgrade time. Adjust the schedule in
          <code>gsc-report.cron.ts</code>.
        </p>
      </div>`;
  }

  private renderTable(rows: SearchAnalyticsRow[], label: string): string {
    if (!rows.length) return '<p>No data.</p>';
    const trs = rows
      .map((row) => {
        const key = row.keys?.[0] ?? '—';
        return `
          <tr>
            <td>${this.escape(key)}</td>
            <td>${Number(row.clicks ?? 0)}</td>
            <td>${Number(row.impressions ?? 0)}</td>
            <td>${((Number(row.ctr ?? 0)) * 100).toFixed(1)}%</td>
            <td>${Number(row.position ?? 0).toFixed(1)}</td>
          </tr>`;
      })
      .join('');
    return `
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:13px;width:100%">
        <thead style="background:#f3f3f3">
          <tr><th align="left">${label}</th><th>Clicks</th><th>Impr.</th><th>CTR</th><th>Pos.</th></tr>
        </thead>
        <tbody>${trs}</tbody>
      </table>`;
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  async runOnce(): Promise<{ sent: boolean; report: CoverageReport; error?: string }> {
    const report = await this.buildReport();
    try {
      await this.sendReport(report);
      return { sent: true, report };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      this.logger.warn(`Report built but send failed: ${message}`);
      return { sent: false, report, error: message };
    }
  }
}

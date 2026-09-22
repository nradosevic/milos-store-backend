import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SellerStatsService } from './seller-stats.service';
import { SettingsService } from '../settings/settings.service';
import { SELLER_STATS_KEY, SELLER_STATS_STATUS_KEY } from './seller-stats.types';

/** In-memory stand-in for the SiteSettings table. */
class FakeSettings {
  store = new Map<string, string>();

  async findByKey(key: string) {
    const value = this.store.get(key);
    if (value === undefined) throw new Error(`no setting ${key}`);
    return { id: 1, key, value, type: 'json' };
  }

  async upsert(key: string, value: string) {
    this.store.set(key, value);
    return { id: 1, key, value, type: 'json' };
  }
}

describe('SellerStatsService', () => {
  let service: SellerStatsService;
  let settings: FakeSettings;

  const statusOf = () => JSON.parse(settings.store.get(SELLER_STATS_STATUS_KEY)!);
  const statsOf = () => JSON.parse(settings.store.get(SELLER_STATS_KEY)!);

  beforeEach(async () => {
    settings = new FakeSettings();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SellerStatsService,
        { provide: SettingsService, useValue: settings },
      ],
    }).compile();
    service = moduleRef.get(SellerStatsService);

    process.env.KP_PROFILE_URL = 'https://www.kupujemprodajem.com/x/svi-oglasi/1/1';
    process.env.KP_PROXY_URL = 'http://user:pass@127.0.0.1:13128';
  });

  afterEach(() => {
    delete process.env.KP_PROFILE_URL;
    delete process.env.KP_PROXY_URL;
    jest.restoreAllMocks();
  });

  describe('seed behaviour', () => {
    it('serves the seeded figures before anything has been stored', async () => {
      const stats = await service.getStats();
      expect(stats.positiveRatings).toBe(1381);
      expect(stats.negativeRatings).toBe(0);
      expect(stats.source).toBe('manual');
    });
  });

  describe('setStats', () => {
    it('publishes a manual value and stamps capturedAt', async () => {
      const result = await service.setStats({ positiveRatings: 1400 });
      expect(result.positiveRatings).toBe(1400);
      expect(Date.parse(result.capturedAt)).not.toBeNaN();
      expect(statsOf().positiveRatings).toBe(1400);
    });

    it.each([
      ['a negative count', { positiveRatings: -5 }],
      ['a non-integer count', { positiveRatings: 12.5 }],
      ['an absurd count', { positiveRatings: 5_000_000 }],
      ['negative negatives', { negativeRatings: -1 }],
    ])('rejects %s', async (_label, patch) => {
      await expect(service.setStats(patch)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('refreshFromKp', () => {
    const mockHtml = (html: string) =>
      jest
        .spyOn(service as any, 'fetchProfileHtml')
        .mockResolvedValue(html);

    const headerHtml = (positive: string, negative: string) => `
      <h1>Svi oglasi korisnika: Miloš Dimitrijević</h1>
      <span>Beograd | Savski venac</span><span>Član od: 22.11.2012.</span>
      <span>${positive}</span><span>${negative}</span>
      <a>Dodajte u adresar</a>`;

    it('publishes a higher count read from the profile', async () => {
      mockHtml(headerHtml('1.402', '0'));

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(true);
      expect(status.changed).toBe(true);
      expect(statsOf().positiveRatings).toBe(1402);
      expect(statsOf().source).toBe('kp-scrape');
    });

    it('reports unchanged when the count has not moved', async () => {
      mockHtml(headerHtml('1.381', '0'));

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(true);
      expect(status.changed).toBe(false);
    });

    it('refuses a decrease and leaves the published value alone', async () => {
      await service.setStats({ positiveRatings: 1381 });
      mockHtml(headerHtml('27', '0'));

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(false);
      expect(status.error).toMatch(/decrease/i);
      expect(statsOf().positiveRatings).toBe(1381);
    });

    it('refuses an implausible jump', async () => {
      mockHtml(headerHtml('99.999', '0'));

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(false);
      expect(status.error).toMatch(/implausible/i);
      // Nothing should have been published at all — not even a no-op write.
      expect(settings.store.has(SELLER_STATS_KEY)).toBe(false);
      expect(await service.getStats()).toMatchObject({ positiveRatings: 1381 });
    });

    it('records a snippet when the markup cannot be parsed', async () => {
      mockHtml('<html><body>Uskoro ćemo ponovo biti dostupni.</body></html>');

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(false);
      expect(status.snippet).toContain('Uskoro');
      expect(settings.store.has(SELLER_STATS_KEY)).toBe(false);
    });

    it('survives a fetch failure without touching the published value', async () => {
      jest
        .spyOn(service as any, 'fetchProfileHtml')
        .mockRejectedValue(new Error('proxy unreachable'));

      const status = await service.refreshFromKp();

      expect(status.ok).toBe(false);
      expect(status.error).toMatch(/Fetch failed/);
      expect(await service.getStats()).toMatchObject({ positiveRatings: 1381 });
    });

    it('stays dormant when no proxy is configured', async () => {
      delete process.env.KP_PROXY_URL;

      expect(service.isConfigured()).toBe(false);
      const status = await service.refreshFromKp();
      expect(status.error).toMatch(/Not configured/);
    });
  });
});

/** Key in SiteSettings holding the published figures the storefront reads. */
export const SELLER_STATS_KEY = 'seller_stats';

/** Key holding the last refresh attempt's diagnostics (never the figures). */
export const SELLER_STATS_STATUS_KEY = 'seller_stats_status';

/**
 * Shape published to the storefront. Mirrors `SellerStats` in
 * v0-frontend/lib/seller-stats.ts — keep the two in sync.
 */
export interface SellerStats {
  positiveRatings: number;
  negativeRatings: number;
  memberSince: string;
  profileUrl: string | null;
  proofImageUrl: string;
  /** ISO timestamp of the reading these figures came from. */
  capturedAt: string;
  source: 'manual' | 'kp-scrape';
}

export interface RefreshStatus {
  lastRunAt: string;
  ok: boolean;
  /** Present when ok — what we read. */
  read?: Pick<SellerStats, 'positiveRatings' | 'negativeRatings'>;
  /** Whether the read actually changed the published value. */
  changed?: boolean;
  error?: string;
  /**
   * On a parse failure, a short snippet of what we fetched. KP markup will
   * change eventually and this is what makes the next fix a five-minute job
   * instead of a blind rewrite.
   */
  snippet?: string;
}

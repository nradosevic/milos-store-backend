/**
 * Parsers for the KupujemProdajem "Svi oglasi korisnika" profile page.
 *
 * KP renders with Next.js, so the figures are available three ways and we try
 * them in order of how likely they are to survive a redesign. Every strategy
 * must agree with the guards in seller-stats.service.ts before anything is
 * published — a wrong number on the storefront is worse than a stale one.
 */

export interface ParsedKpProfile {
  positiveRatings: number;
  negativeRatings: number;
  memberSince: string | null;
  /** Which strategy produced the result, for the status log. */
  strategy: string;
}

/** "1.381" / "1,381" / "1 381" → 1381. Returns null for anything else. */
export function parseSrNumber(raw: string): number | null {
  const cleaned = raw.trim().replace(/[.\s ,]/g, '');
  if (!/^\d+$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Walk any nested JSON and yield every object node. */
function* walk(node: unknown): Generator<Record<string, unknown>> {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const child of node) yield* walk(child);
    return;
  }
  yield node as Record<string, unknown>;
  for (const child of Object.values(node as Record<string, unknown>)) {
    yield* walk(child);
  }
}

const POSITIVE_KEYS = [
  'positiveRatings',
  'positiveRating',
  'positiveCount',
  'positiveReviews',
  'numberOfPositiveRatings',
  'kpPositive',
];
const NEGATIVE_KEYS = [
  'negativeRatings',
  'negativeRating',
  'negativeCount',
  'negativeReviews',
  'numberOfNegativeRatings',
  'kpNegative',
];

function coerceCount(v: unknown): number | null {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') return parseSrNumber(v);
  return null;
}

/**
 * Strategy 1 — an object carrying both a positive and a negative rating field.
 * Requiring BOTH on the same object is what stops us latching onto an unrelated
 * counter that happens to be called "positive".
 */
export function fromEmbeddedJson(html: string): ParsedKpProfile | null {
  const blobs: string[] = [];

  const nextData = html.match(
    /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i,
  );
  if (nextData) blobs.push(nextData[1]);

  // App Router streams its payload as self.__next_f.push([1,"...json..."]).
  for (const m of html.matchAll(/self\.__next_f\.push\(\[\d+,"([\s\S]*?)"\]\)/g)) {
    try {
      blobs.push(JSON.parse(`"${m[1]}"`));
    } catch {
      /* not a decodable chunk — skip */
    }
  }

  for (const blob of blobs) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(blob);
    } catch {
      // Streamed chunks are usually a JSON fragment, not a whole document.
      const embedded = blob.match(/\{[\s\S]*\}/);
      if (!embedded) continue;
      try {
        parsed = JSON.parse(embedded[0]);
      } catch {
        continue;
      }
    }

    for (const node of walk(parsed)) {
      const posKey = POSITIVE_KEYS.find((k) => k in node);
      const negKey = NEGATIVE_KEYS.find((k) => k in node);
      if (!posKey || !negKey) continue;

      const positive = coerceCount(node[posKey]);
      const negative = coerceCount(node[negKey]);
      if (positive === null || negative === null) continue;

      const memberSince =
        typeof node['memberSince'] === 'string'
          ? (node['memberSince'] as string)
          : typeof node['registeredAt'] === 'string'
            ? (node['registeredAt'] as string)
            : null;

      return {
        positiveRatings: positive,
        negativeRatings: negative,
        memberSince,
        strategy: `embedded-json:${posKey}/${negKey}`,
      };
    }
  }
  return null;
}

/**
 * Strategy 2 — the visible header. The profile card renders the two counts as
 * the only standalone numbers between the heading and the "Dodajte u adresar"
 * link, positive first.
 */
export function fromVisibleHeader(html: string): ParsedKpProfile | null {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/[ \t]+/g, ' ');

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const start = lines.findIndex((l) => /Svi oglasi korisnika/i.test(l));
  if (start === -1) return null;

  const end = lines.findIndex(
    (l, i) => i > start && /Dodajte u adresar|Pošalji poruku/i.test(l),
  );
  const window = lines.slice(start, end === -1 ? start + 20 : end);

  const counts = window
    .map((l) => (/^[\d.,\s ]+$/.test(l) ? parseSrNumber(l) : null))
    .filter((n): n is number => n !== null);

  if (counts.length < 2) return null;

  const memberSince =
    window
      .map((l) => l.match(/Član od:\s*([\d.]+)/i)?.[1])
      .find((v): v is string => Boolean(v)) ?? null;

  return {
    positiveRatings: counts[0],
    negativeRatings: counts[1],
    memberSince,
    strategy: 'visible-header',
  };
}

/** Run the strategies in order and return the first confident result. */
export function parseKpProfile(html: string): ParsedKpProfile | null {
  return fromEmbeddedJson(html) ?? fromVisibleHeader(html);
}

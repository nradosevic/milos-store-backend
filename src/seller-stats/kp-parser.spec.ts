import {
  parseSrNumber,
  parseKpProfile,
  fromEmbeddedJson,
  fromVisibleHeader,
} from './kp-parser';

describe('parseSrNumber', () => {
  it.each([
    ['1.381', 1381],
    ['1,381', 1381],
    ['1 381', 1381],
    ['0', 0],
    ['27', 27],
  ])('parses %s', (raw, expected) => {
    expect(parseSrNumber(raw)).toBe(expected);
  });

  it.each(['', 'abc', '1.2a', '—'])('rejects %s', (raw) => {
    expect(parseSrNumber(raw)).toBeNull();
  });
});

describe('fromVisibleHeader', () => {
  /** Mirrors the profile card: heading, meta line, the two counts, then the link. */
  const page = `
    <div class="card">
      <h1>Svi oglasi korisnika: Miloš Dimitrijević</h1>
      <div><span>Beograd | Savski venac</span><span>Član od: 22.11.2012.</span></div>
      <div><svg/><span>1.381</span><svg/><span>0</span><a href="#">Dodajte u adresar</a></div>
    </div>`;

  it('reads both counts and the member-since date', () => {
    expect(fromVisibleHeader(page)).toMatchObject({
      positiveRatings: 1381,
      negativeRatings: 0,
      memberSince: '22.11.2012.',
      strategy: 'visible-header',
    });
  });

  it('ignores numbers from scripts and styles', () => {
    const noisy = page.replace(
      '<div class="card">',
      '<div class="card"><script>var x = 999999;</script><style>.a{width:4242px}</style>',
    );
    expect(fromVisibleHeader(noisy)).toMatchObject({ positiveRatings: 1381 });
  });

  it('returns null on a block page', () => {
    expect(
      fromVisibleHeader('<html><body>Uskoro ćemo ponovo biti dostupni.</body></html>'),
    ).toBeNull();
  });

  it('does not run past the header into listing prices', () => {
    const withListings = `${page}<div>1.000 din</div><div>2.500 din</div>`;
    expect(fromVisibleHeader(withListings)).toMatchObject({
      positiveRatings: 1381,
      negativeRatings: 0,
    });
  });
});

describe('fromEmbeddedJson', () => {
  it('reads counts from __NEXT_DATA__', () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      {
        props: {
          pageProps: {
            user: {
              name: 'Miloš Dimitrijević',
              positiveRatings: 1381,
              negativeRatings: 0,
              memberSince: '22.11.2012.',
            },
          },
        },
      },
    )}</script>`;

    expect(fromEmbeddedJson(html)).toMatchObject({
      positiveRatings: 1381,
      negativeRatings: 0,
      memberSince: '22.11.2012.',
    });
  });

  it('requires both counts on the same object', () => {
    const html = `<script id="__NEXT_DATA__" type="application/json">${JSON.stringify(
      { props: { somethingElse: { positiveRatings: 9 } } },
    )}</script>`;
    expect(fromEmbeddedJson(html)).toBeNull();
  });

  it('ignores malformed JSON rather than throwing', () => {
    expect(
      fromEmbeddedJson('<script id="__NEXT_DATA__">{not json</script>'),
    ).toBeNull();
  });
});

describe('parseKpProfile', () => {
  it('prefers embedded JSON over scraping the header', () => {
    const html = `
      <script id="__NEXT_DATA__" type="application/json">${JSON.stringify({
        user: { positiveRatings: 1381, negativeRatings: 0 },
      })}</script>
      <h1>Svi oglasi korisnika: Miloš Dimitrijević</h1>
      <span>999</span><span>9</span><a>Dodajte u adresar</a>`;

    expect(parseKpProfile(html)?.strategy).toMatch(/^embedded-json/);
    expect(parseKpProfile(html)?.positiveRatings).toBe(1381);
  });

  it('falls back to the header when there is no embedded JSON', () => {
    const html = `
      <h1>Svi oglasi korisnika: Miloš Dimitrijević</h1>
      <span>1.381</span><span>0</span><a>Dodajte u adresar</a>`;
    expect(parseKpProfile(html)?.strategy).toBe('visible-header');
  });

  it('returns null when neither strategy applies', () => {
    expect(parseKpProfile('<html><body>nothing here</body></html>')).toBeNull();
  });
});

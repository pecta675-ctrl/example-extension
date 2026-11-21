import { http, log, cacheGet, cacheSet } from 'anilili:provider/host@1.0.0';

export function info() {
  return {
    name: 'AnimeSalt',
    hosts: ['animesalt.cx', 'ravok.buzz'],
  };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function stringToBytes(s) {
  return Array.from(new TextEncoder().encode(s));
}

function findSlug(title) {
  const key = 'slug:' + title.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;

  const searchUrl = 'https://animesalt.cx/?s=' + encodeURIComponent(title);
  const res = http({
    method: 'GET',
    url: searchUrl,
    headers: [['Accept', 'text/html']],
    body: undefined,
  });
  if (!res || res.status !== 200) return null;

  const html = bytesToString(res.body);
  const needle = 'animesalt.cx/series/';
  let idx = 0;
  while (true) {
    const pos = html.indexOf(needle, idx);
    if (pos === -1) break;
    const abs = pos + needle.length;
    let end = abs;
    while (end < html.length && !['/', '"', "'", '<', ' ', '\n', '\r', '\t'].includes(html[end])) {
      end++;
    }
    const slug = html.slice(abs, end);
    if (slug) {
      cacheSet(key, slug, 86400);
      return slug;
    }
    idx = abs;
  }
  return null;
}

function detectSeason(titles) {
  for (const t of titles) {
    const low = t.toLowerCase();
    const i = low.indexOf('season');
    if (i !== -1) {
      const rest = low.slice(i + 6);
      let digits = '';
      for (const ch of rest) {
        if (/[0-9]/.test(ch)) digits += ch;
        else if (digits) break;
      }
      if (digits) return parseInt(digits, 10);
    }
  }
  return 1;
}

function extractAfter(html, needle) {
  const i = html.indexOf(needle);
  if (i === -1) return null;
  const start = i + needle.length;
  const rest = html.slice(start);
  let end = 0;
  while (end < rest.length && !['"', "'", '<', ' ', '\n', '\r', '\t'].includes(rest[end])) {
    end++;
  }
  if (end === 0) return null;
  return rest.slice(0, end);
}

export function servers(query) {
  log('AnimeSalt lookup: ' + JSON.stringify(query.titles) + ' ep=' + query.episode + ' dub=' + query.dub);

  let slug = null;
  for (const t of query.titles) {
    slug = findSlug(t);
    if (slug) break;
  }
  if (!slug) {
    throw new Error('AnimeSalt: no matching series found');
  }

  const season = detectSeason(query.titles);
  const epStr = String(query.episode);

  let pageUrl = `https://animesalt.cx/episode/${slug}-${season}x${epStr}/`;
  let res = http({
    method: 'GET',
    url: pageUrl,
    headers: [['Accept', 'text/html']],
    body: undefined,
  });

  if (!res || res.status !== 200) {
    if (season !== 1) {
      const fallback = `https://animesalt.cx/episode/${slug}-1x${epStr}/`;
      res = http({
        method: 'GET',
        url: fallback,
        headers: [['Accept', 'text/html']],
        body: undefined,
      });
      if (!res || res.status !== 200) {
        throw new Error('AnimeSalt: HTTP ' + (res ? res.status : 'none') + ' for episode page');
      }
    } else {
      throw new Error('AnimeSalt: HTTP ' + (res ? res.status : 'none') + ' for episode page');
    }
  }

  const html = bytesToString(res.body);
  const hash = extractAfter(html, 'ravok.buzz/video/');
  if (!hash) {
    throw new Error('AnimeSalt: no ravok embed found');
  }
  log('AnimeSalt ravok hash: ' + hash);

  const postUrl = `https://ravok.buzz/player/index.php?data=${hash}&do=getVideo`;
  const refUrl = `https://ravok.buzz/video/${hash}`;
  const body = `hash=${encodeURIComponent(hash)}&r=${encodeURIComponent(refUrl)}`;

  const res2 = http({
    method: 'POST',
    url: postUrl,
    headers: [
      ['Content-Type', 'application/x-www-form-urlencoded'],
      ['X-Requested-With', 'XMLHttpRequest'],
    ],
    body: stringToBytes(body),
  });

  if (!res2 || res2.status !== 200) {
    throw new Error('AnimeSalt: ravok HTTP ' + (res2 ? res2.status : 'none'));
  }

  const text = bytesToString(res2.body);
  log('AnimeSalt ravok resp: ' + text.slice(0, 200));

  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error('AnimeSalt: invalid ravok JSON');
  }

  const videoUrl = json.videoSource;
  if (!videoUrl) {
    throw new Error('AnimeSalt: no videoSource');
  }

  const hls = json.hls !== false;

  return [
    {
      name: 'AnimeSalt',
      dub: query.dub,
      headers: [['Referer', 'https://ravok.buzz/']],
      streams: [
        {
          url: videoUrl,
          quality: undefined,
          format: hls ? 'hls' : 'mp4',
        },
      ],
    },
  ];
}

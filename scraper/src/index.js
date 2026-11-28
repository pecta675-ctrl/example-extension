import { http, browserFetch, log } from 'anilili:provider/host@1.0.0';

const base = 'https://hentaihand.com';
const searchPaths = ['/en/search?q=', '/en/?s=', '/search?q='];

export function info() {
  return { name: 'HentaiHand', hosts: ['hentaihand.com', 'cdn.hentaihand.com'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function request(url) {
  return { method: 'GET', url, headers: [['Accept', 'text/html'], ['Referer', base + '/']], body: undefined };
}

function get(url, origin) {
  let res = null;
  try {
    res = origin ? browserFetch(origin, request(url)) : http(request(url));
  } catch (e) {
    res = null;
  }
  if (!res || res.status !== 200) {
    try {
      res = http(request(url));
    } catch (e) {
      res = null;
    }
  }
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function mediaUrls(html) {
  const found = html.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return Array.from(new Set(found)).slice(0, 10);
}

function firstSeriesLink(html) {
  const links = html.match(/href="(https?:\/\/hentaihand\.com\/(?:en\/)?[^"?#]+)"/g) || [];
  const skip = /\/(tag|category|genre|page|author|search|wp-|feed|dmca|contact|terms|privacy|login|register)\b/i;
  for (const raw of links) {
    const url = raw.slice(6, -1);
    const depth = url.replace(/^https?:\/\/hentaihand\.com\/?/, '').split('/').filter(Boolean).length;
    if (depth >= 1 && !skip.test(url)) return url;
  }
  return null;
}

export function servers(query) {
  log('HentaiHand lookup: ' + JSON.stringify(query.titles));
  for (const title of query.titles) {
    for (const path of searchPaths) {
      const html = get(base + path + encodeURIComponent(title), base);
      if (!html) continue;
      const pageUrl = firstSeriesLink(html);
      if (!pageUrl) continue;
      const page = get(pageUrl, base);
      const urls = mediaUrls(page || html);
      if (urls.length === 0) continue;
      return [{
        name: 'HentaiHand',
        dub: false,
        headers: [['Referer', base + '/']],
        streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
      }];
    }
  }
  throw new Error('HentaiHand: no playable source found');
}
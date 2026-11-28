import { http, log } from 'anilili:provider/host@1.0.0';

const base = 'https://hentaiv.net';
const searchPaths = ['/search?q=', '/?s='];

export function info() {
  return { name: 'HentaiV', hosts: ['hentaiv.net'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function get(url) {
  const res = http({ method: 'GET', url, headers: [['Accept', 'text/html'], ['Referer', base + '/']], body: undefined });
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function mediaUrls(text) {
  const found = text.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return Array.from(new Set(found)).slice(0, 10);
}

function firstVideoLink(html) {
  const links = html.match(/href="(https?:\/\/hentaiv\.net\/[^"?#]+)"/g) || [];
  const skip = /\/(tag|category|genre|page|author|search|dmca|contact|terms|privacy|login|register|feed)\b/i;
  for (const raw of links) {
    const url = raw.slice(6, -1);
    if (!skip.test(url)) return url;
  }
  return null;
}

export function servers(query) {
  log('HentaiV lookup: ' + JSON.stringify(query.titles));
  for (const title of query.titles) {
    for (const prefix of searchPaths) {
      const html = get(base + prefix + encodeURIComponent(title));
      if (!html) continue;
      const pageUrl = firstVideoLink(html);
      if (!pageUrl) continue;
      const urls = mediaUrls(get(pageUrl) || html);
      if (urls.length === 0) continue;
      return [{
        name: 'HentaiV',
        dub: false,
        headers: [['Referer', base + '/']],
        streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
      }];
    }
  }
  throw new Error('HentaiV: no playable source found');
}
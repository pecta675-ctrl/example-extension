import { http, browserFetch, log } from 'anilili:provider/host@1.0.0';

const base = 'https://hentaihaven.xxx';

export function info() {
  return { name: 'HentaiHaven', hosts: ['hentaihaven.xxx', 'hentaihaven.com'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function request(url) {
  return { method: 'GET', url, headers: [['Accept', 'text/html'], ['Referer', base + '/']], body: undefined };
}

function get(url) {
  let res = null;
  try {
    res = browserFetch(base, request(url));
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

function mediaUrls(text) {
  const found = text.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return Array.from(new Set(found)).slice(0, 10);
}

function firstVideoLink(html) {
  const links = html.match(/href="(https?:\/\/hentaihaven\.xxx\/[^"?#]+)"/g) || [];
  const skip = /\/(tag|category|genre|page|author|search|dmca|contact|terms|privacy|login|register|feed|wp-|about)\b/i;
  for (const raw of links) {
    const url = raw.slice(6, -1);
    if (!skip.test(url)) return url;
  }
  return null;
}

function playerUrl(html) {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  return match ? match[1].replace(/&amp;/g, '&') : null;
}

export function servers(query) {
  log('HentaiHaven lookup: ' + JSON.stringify(query.titles));
  for (const title of query.titles) {
    const html = get(base + '/?s=' + encodeURIComponent(title));
    if (!html) continue;
    const pageUrl = firstVideoLink(html);
    const page = pageUrl ? get(pageUrl) : '';
    const direct = mediaUrls(page || html);
    if (direct.length === 0) {
      const embed = playerUrl(page);
      const embedded = embed ? mediaUrls(get(embed)) : [];
      if (embedded.length === 0) continue;
      direct.push(...embedded);
    }
    return [{
      name: 'HentaiHaven',
      dub: false,
      headers: [['Referer', base + '/']],
      streams: direct.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
    }];
  }
  throw new Error('HentaiHaven: no playable source found');
}
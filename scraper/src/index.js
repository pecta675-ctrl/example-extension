import { http, log } from 'anilili:provider/host@1.0.0';

const base = 'https://e-hentai.org';
const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36';

export function info() {
  return { name: 'E-Hentai', hosts: ['e-hentai.org', 'ehgt.org', 'hentaiverse.org'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function get(url) {
  const res = http({ method: 'GET', url, headers: [['Accept', 'text/html'], ['User-Agent', ua], ['Cookie', 'nw=1']], body: undefined });
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function mediaUrls(text) {
  const found = text.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return Array.from(new Set(found)).slice(0, 10);
}

function firstGallery(html) {
  const match = html.match(/https:\/\/e-hentai\.org\/g\/\d+\/[0-9a-f]+\//);
  return match ? match[0] : null;
}

export function servers(query) {
  log('E-Hentai lookup: ' + JSON.stringify(query.titles));
  for (const title of query.titles) {
    const html = get(base + '/?f_search=' + encodeURIComponent(title));
    const gallery = firstGallery(html);
    if (!gallery) continue;
    const urls = mediaUrls(get(gallery) + html);
    if (urls.length > 0) {
      return [{
        name: 'E-Hentai',
        dub: false,
        headers: [['Referer', base + '/']],
        streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
      }];
    }
  }
  throw new Error('E-Hentai: gallery site exposes images, no video stream');
}
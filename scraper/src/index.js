import { http, log } from 'anilili:provider/host@1.0.0';

const base = 'https://rokuhentai.com';

export function info() {
  return { name: 'RokuHentai', hosts: ['rokuhentai.com', 'cdn.rokuhentai.com'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function get(url, accept) {
  const res = http({ method: 'GET', url, headers: [['Accept', accept], ['Referer', base + '/']], body: undefined });
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function searchIds(title) {
  const raw = get(base + '/_search?q=' + encodeURIComponent(title), 'application/json');
  try {
    const ids = JSON.parse(raw)['manga-ids'];
    return Array.isArray(ids) ? ids.slice(0, 3) : [];
  } catch (e) {
    return [];
  }
}

function mediaUrls(html) {
  const found = html.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return Array.from(new Set(found)).slice(0, 10);
}

export function servers(query) {
  log('RokuHentai lookup: ' + JSON.stringify(query.titles));
  for (const title of query.titles) {
    for (const id of searchIds(title)) {
      const urls = mediaUrls(get(base + '/' + id, 'text/html'));
      if (urls.length > 0) {
        return [{
          name: 'RokuHentai',
          dub: false,
          headers: [['Referer', base + '/']],
          streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
        }];
      }
    }
  }
  throw new Error('RokuHentai: gallery site exposes images, no video stream');
}
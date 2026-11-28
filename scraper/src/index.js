import { http, log } from 'anilili:provider/host@1.0.0';

const hosts = ['lampac.top', 'lampac.online'];

export function info() {
  return { name: 'Lampac', hosts };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function unique(list) {
  return Array.from(new Set(list));
}

function mediaUrls(text) {
  const found = text.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/g) || [];
  return unique(found.map((url) => url.replace(/\\\//g, '/')));
}

function fetchPage(url) {
  const res = http({ method: 'GET', url, headers: [['Accept', 'text/html']], body: undefined });
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function query(host, title) {
  const url = 'https://' + host + '/lite/sisi?title=' + encodeURIComponent(title);
  return mediaUrls(fetchPage(url));
}

export function servers(search) {
  log('Lampac lookup: ' + JSON.stringify(search.titles) + ' ep=' + search.episode);
  for (const title of search.titles) {
    for (const host of hosts) {
      const urls = query(host, title);
      if (urls.length > 0) {
        return [{
          name: 'Lampac',
          dub: search.dub,
          headers: [['Referer', 'https://' + host + '/']],
          streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
        }];
      }
    }
  }
  throw new Error('Lampac: no playable source found');
}
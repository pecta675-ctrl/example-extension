import { http, log } from 'anilili:provider/host@1.0.0';

const base = 'https://juro.tv';

export function info() {
  return { name: 'Juro', hosts: ['juro.tv'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function isMedia(value) {
  return typeof value === 'string' && /^https?:\/\/[^\s"']+\.(m3u8|mp4)(\?|$)/.test(value);
}

function collect(value, out) {
  if (isMedia(value)) out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collect(item, out));
  return out;
}

function search(title) {
  const url = base + '/api/adult/search?q=' + encodeURIComponent(title);
  const res = http({ method: 'GET', url, headers: [['Accept', 'application/json'], ['Referer', base + '/']], body: undefined });
  if (!res || res.status !== 200) return [];
  try {
    return Array.from(new Set(collect(JSON.parse(bytesToString(res.body)), [])));
  } catch (e) {
    return [];
  }
}

export function servers(query) {
  log('Juro lookup: ' + JSON.stringify(query.titles) + ' ep=' + query.episode);
  for (const title of query.titles) {
    const urls = search(title);
    if (urls.length > 0) {
      return [{
        name: 'Juro',
        dub: query.dub,
        headers: [['Referer', base + '/']],
        streams: urls.map((url) => ({ url, quality: null, format: url.includes('.m3u8') ? 'hls' : 'mp4' })),
      }];
    }
  }
  throw new Error('Juro: no playable source found');
}
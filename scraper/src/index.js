import { http, log } from 'anilili:provider/host@1.0.0';

const base = 'https://animeidhentai.com';
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function info() {
  return { name: 'AnimeIDHentai', hosts: ['animeidhentai.com', 'r2.1hanime.com', 'nhplayer.com'] };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function decodeBase64(value) {
  const clean = String(value).replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
  let bits = 0;
  let acc = 0;
  let out = '';
  for (const char of clean) {
    acc = (acc << 6) | alphabet.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((acc >> bits) & 0xff);
    }
  }
  return out;
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function get(url, accept) {
  const res = http({ method: 'GET', url, headers: [['Accept', accept], ['Referer', base + '/']], body: undefined });
  return res && res.status === 200 ? bytesToString(res.body) : '';
}

function search(title) {
  const raw = get(base + '/api/search?q=' + encodeURIComponent(title), 'application/json');
  try {
    const videos = JSON.parse(raw).videos;
    return Array.isArray(videos) ? videos : [];
  } catch (e) {
    return [];
  }
}

function pick(videos, titles, episode) {
  const named = videos.filter((video) => titles.some((title) => normalize(video.title).includes(normalize(title))));
  const pool = named.length > 0 ? named : videos;
  return pool.find((video) => Number(video.ep) === Math.trunc(episode)) || pool[0] || null;
}

function directMedia(value) {
  return /^https?:\/\/[^\s"']+\.(m3u8|mp4)(\?|$)/.test(value || '') ? value : null;
}

function fromEmbed(embedUrl) {
  const page = get(embedUrl, 'text/html');
  const inline = page.match(/https?:\/\/[^\s"'<>\\]+?\.(?:m3u8|mp4)(?:\?[^\s"'<>\\]*)?/);
  if (inline) return inline[0];
  const packed = page.match(/data-id="[^"]*?vid=([A-Za-z0-9+/=]+)/);
  if (!packed) return null;
  const decoded = decodeBase64(packed[1]);
  const media = decoded.match(/https?:\/\/[^|"'<>\\]+?\.(?:m3u8|mp4)/);
  return media ? media[0] : null;
}

export function servers(query) {
  log('AnimeIDHentai lookup: ' + JSON.stringify(query.titles) + ' ep=' + query.episode);
  for (const title of query.titles) {
    const video = pick(search(title), query.titles, query.episode);
    if (!video) continue;
    const url = directMedia(video.embedUrl) || fromEmbed(video.embedUrl);
    if (!url) continue;
    return [{
      name: 'AnimeIDHentai',
      dub: false,
      headers: [['Referer', base + '/']],
      streams: [{ url, quality: video.quality || null, format: url.includes('.m3u8') ? 'hls' : 'mp4' }],
    }];
  }
  throw new Error('AnimeIDHentai: no playable source found');
}
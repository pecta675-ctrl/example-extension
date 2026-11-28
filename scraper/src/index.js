import { http, log } from 'anilili:provider/host@1.0.0';

export function info() {
  return {
    name: 'Hanime',
    hosts: ['hanime.tv', 'guest.freeanimehentai.net', 'hanime-cdn.com'],
  };
}

function bytesToString(bytes) {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function normalize(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
}

function search(title) {
  const url = 'https://guest.freeanimehentai.net/api/v11/search_hvs?search=' + encodeURIComponent(title);
  const res = http({ method: 'GET', url, headers: [['Accept', 'application/json']], body: undefined });
  if (!res || res.status !== 200) return [];
  try {
    const parsed = JSON.parse(bytesToString(res.body));
    return Array.isArray(parsed.data) ? parsed.data : [];
  } catch (e) {
    return [];
  }
}

function matches(entry, titles) {
  const haystack = normalize(entry.name) + ' ' + normalize(entry.search_titles);
  return titles.some((title) => {
    const needle = normalize(title);
    return needle.length > 0 && haystack.includes(needle);
  });
}

function pick(results, titles) {
  return results.find((entry) => matches(entry, titles)) || results[0] || null;
}

function playableUrl(slug) {
  const res = http({
    method: 'GET',
    url: 'https://hanime.tv/videos/hentai/' + slug,
    headers: [['Accept', 'text/html'], ['Referer', 'https://hanime.tv/']],
    body: undefined,
  });
  if (!res || res.status !== 200) return null;
  const match = bytesToString(res.body).match(/\/hls\/\d+\/[A-Za-z0-9]+/);
  return match ? 'https://hanime.tv' + match[0] : null;
}

export function servers(query) {
  log('Hanime lookup: ' + JSON.stringify(query.titles) + ' ep=' + query.episode);
  let results = [];
  for (const title of query.titles) {
    results = search(title);
    if (results.length > 0) break;
  }
  const entry = pick(results, query.titles);
  if (!entry) throw new Error('Hanime: no matching title');

  const url = playableUrl(entry.slug);
  if (!url) throw new Error('Hanime: stream needs the signed player handshake');
  return [{
    name: 'Hanime',
    dub: false,
    headers: [['Referer', 'https://hanime.tv/'], ['Origin', 'https://hanime.tv']],
    streams: [{ url, quality: '720p', format: 'hls' }],
  }];
}
// Second sweep: titles from hymns2.json. Plain search page 1 always; style-hinted
// searches only when the plain search is saturated (20 rows). Every title-matching
// candidate is then enriched with its track page's full tag list before styling.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFile } from 'node:child_process';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const LIVE = new Set(
  JSON.parse(readFileSync(new URL('./live-hymns.json', import.meta.url), 'utf8'))
);
const RAW = JSON.parse(readFileSync(new URL('./hymns2.json', import.meta.url), 'utf8'));
const seenNames = new Set();
const HYMNS = RAW.filter(([n]) => !seenNames.has(n) && seenNames.add(n) && !LIVE.has(n)).map(([n, re]) => [n, new RegExp(re, 'i')]);

const STYLE_QUERIES = ['violin', 'strings', 'cello', 'orchestra', 'bluegrass', 'banjo', 'guitar', 'piano'];
const STYLE_RULES = [
  ['Bluegrass', /bluegrass|banjo|mandolin|dobro/i],
  ['Country', /\bcountry\b|western|americana/i],
  ['Strings', /violin|cello|viola|\bstrings?\b|orchestra|orchestral|symphon|quartet|fiddle|string ensemble/i],
  ['Guitar', /guitar|acoustic|ukulele/i],
  ['Piano', /piano|keys\b|keyboard|pianist/i],
  ['Organ', /\borgan\b/i],
  ['Vocal', /choir|choral|vocal|voice|singing|singer|lyrics|acapella|a cappella|\bsung\b/i],
  ['Harp', /\bharp\b|lyre/i],
  ['Flute', /flute|woodwind|recorder\b/i],
  ['Saxophone', /\bsax/i],
  ['Bagpipes', /bagpipe/i],
  ['Brass', /trumpet|brass|horn\b/i],
  ['Beat', /lo-?fi|\bbeat|hip hop|trap\b|edm|electronic|synth|techno|remix/i],
  ['Bells', /\bbells?\b|music box|chimes/i],
];
const classify = (text) => STYLE_RULES.filter(([, re]) => re.test(text)).map(([n]) => n);
const decode = (s) =>
  s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/<[^>]+>/g, '').trim();

function curl(url) {
  return new Promise((resolve) => {
    execFile('curl', ['-s', '-L', '--max-time', '40', '-H', `User-Agent: ${UA}`, '-H', 'Accept: text/html,*/*', '-H', 'Accept-Language: en-US,en;q=0.9', url],
      { maxBuffer: 20 * 1024 * 1024 }, (err, out) => resolve(err ? '' : out));
  });
}
async function fetchHtml(url, marker) {
  for (let i = 0; i < 3; i++) {
    const html = await curl(url);
    if (html.includes(marker)) return html;
    await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
  }
  return '';
}
function parseRows(html) {
  const rows = [];
  for (const p of html.split('class="audioRow--').slice(1)) {
    const t = p.match(/<a href="(\/music\/[^"]+)" class="title--[^"]+">([^<]*)</);
    if (!t) continue;
    const u = p.match(/<a href="\/users\/([^"]+)" class="name--[^"]+">([^<]*)</);
    const d = p.match(/class="duration--[^"]+">([^<]*)</);
    const g = p.match(/class="theme--[^"]+">([^<]*)</);
    const tags = [...p.matchAll(/<a href=\/music\/search\/[^>]*>([^<]*)<\/a>/g)].map((m) => decode(m[1]));
    rows.push({ url: 'https://pixabay.com' + t[1], title: decode(t[2]), author: u ? decode(u[2]) : '', duration: d ? d[1] : '', genre: g ? decode(g[1]) : '', tags });
  }
  return rows;
}
const secs = (d) => { const [m, s] = d.split(':').map(Number); return (m || 0) * 60 + (s || 0); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- phase 1: search ------------------------------------------------------
const cands = new Map(); // url -> cand
let fetched = 0;
for (const [name, re] of HYMNS) {
  const base = name.replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
  const queries = [base];
  const first = await fetchHtml(`https://pixabay.com/music/search/${encodeURIComponent(base)}/`, 'royaltyFree--');
  fetched++;
  let rows = parseRows(first);
  const saturated = rows.length >= 20;
  if (saturated) {
    const extra = [`${base}/?pagi=2`, ...STYLE_QUERIES.map((s) => `${base} ${s}`)];
    for (const q of extra) {
      await sleep(200);
      const url = q.includes('?pagi=') ? `https://pixabay.com/music/search/${encodeURIComponent(q.split('/?')[0])}/?pagi=2` : `https://pixabay.com/music/search/${encodeURIComponent(q)}/`;
      const html = await fetchHtml(url, 'royaltyFree--');
      fetched++;
      rows = rows.concat(parseRows(html));
    }
  }
  let n = 0;
  for (const r of rows) {
    if (!re.test(r.title)) continue;
    if (!cands.has(r.url)) { cands.set(r.url, { hymn: name, ...r, secs: secs(r.duration) }); n++; }
  }
  console.log(`${name.padEnd(52)} ${saturated ? 'SAT' : '   '} cands=${n}`);
  await sleep(200);
}
console.log(`\nsearch phase: ${fetched} pages, ${cands.size} candidates`);

// --- phase 2: enrich with track-page tags ---------------------------------
const list = [...cands.values()];
let i = 0;
async function worker() {
  while (i < list.length) {
    const c = list[i++];
    const html = await fetchHtml(c.url, 'musicTagsSection--');
    if (!html) { c.fullTags = []; continue; }
    const own = html.split('class="audioRow--')[0]; // everything before related-track rows
    c.fullTags = [...new Set([...own.matchAll(/\/music\/search\/([^\/"?&]+)\/"/g)].map((m) => decodeURIComponent(m[1]).toLowerCase()).filter((t) => !/^(genre|mood|movement|theme)$/.test(t)))];
    c.genres = [...new Set([...own.matchAll(/\/music\/search\/genre\/([^\/"]+)\//g)].map((m) => decodeURIComponent(m[1])))];
    c.contentId = /Content ID Registered/i.test(own);
    const dl = own.match(/cdn\.pixabay\.com\/download\/audio\/([^"'?\\ ]+\.mp3)/);
    c.stream = dl ? `https://cdn.pixabay.com/audio/${dl[1]}` : null;
    const text = `${c.title} ${c.genre} ${c.tags.join(' ')} ${c.fullTags.join(' ')} ${(c.genres || []).join(' ')}`;
    c.styles = classify(text);
    await sleep(150);
  }
}
await Promise.all([worker(), worker(), worker(), worker()]);
writeFileSync(new URL('./candidates2.json', import.meta.url), JSON.stringify(list, null, 1));
console.log(`enriched ${list.length} tracks`);

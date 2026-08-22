// Fetch chosen Pixabay tracks, normalize loudness, encode, and emit a manifest
// for scripts/bulk-upload.mjs.
//
// Usage: node process.mjs picks.json
// picks.json: [{ hymn, style, url, author }]  (url = pixabay track page)
// Output: out/<slug>.mp3 + manifest.json
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs';
import { execFile, execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';
const here = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const outDir = join(here, 'out');
mkdirSync(outDir, { recursive: true });

const picks = JSON.parse(readFileSync(process.argv[2], 'utf8'));

function curlText(url) {
  return new Promise((resolve) => {
    execFile(
      'curl',
      ['-s', '-L', '--max-time', '40', '-H', `User-Agent: ${UA}`, '-H', 'Accept: text/html,*/*', url],
      { maxBuffer: 20 * 1024 * 1024 },
      (err, stdout) => resolve(err ? '' : stdout)
    );
  });
}
function curlFile(url, dest) {
  return new Promise((resolve, reject) => {
    execFile(
      'curl',
      ['-s', '-L', '--max-time', '120', '-H', `User-Agent: ${UA}`, '-H', 'Referer: https://pixabay.com/', '-o', dest, url],
      (err) => (err ? reject(err) : resolve())
    );
  });
}
const slug = (s) =>
  s
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const probe = (f) =>
  JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,bit_rate', '-of', 'json', f]).toString()).format;
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"');

// ffmpeg prints loudnorm's measurement JSON on stderr.
function measureLoudness(file) {
  const r = spawnSync(
    'ffmpeg',
    ['-hide_banner', '-nostats', '-i', file, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'],
    { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  const m = (r.stderr || '').match(/\{[^{}]*"input_i"[^{}]*\}/);
  if (!m) throw new Error('loudnorm measurement failed: ' + (r.stderr || '').slice(-300));
  const j = JSON.parse(m[0]);
  return { input_i: Number(j.input_i), input_tp: Number(j.input_tp) };
}

const manifest = [];
for (const p of picks) {
  const title = `${p.hymn} (${p.style})`;
  const base = slug(`${p.hymn}-${p.style}-${p.author}`);
  const raw = join(outDir, `${base}.raw.mp3`);
  const final = join(outDir, `${base}.mp3`);
  console.log(`\n${title}  ← ${p.url}`);

  if (!existsSync(raw) || statSync(raw).size < 10000) {
    const html = await curlText(p.url);
    const m = html.match(/cdn\.pixabay\.com\/download\/audio\/([^"'?\\ ]+\.mp3)/);
    if (!m) {
      console.log('  !! no download URL found on track page');
      continue;
    }
    const stream = `https://cdn.pixabay.com/audio/${m[1]}`;
    const pageTitle = (html.match(/<title>([^<|]*)/) || [])[1]?.trim();
    const tagList = [...html.matchAll(/\/music\/search\/([^\/"?]+)\/"[^>]*>/g)].map((x) => decodeURIComponent(x[1])).slice(0, 14);
    console.log(`  page: "${decode(pageTitle ?? '')}"  tags: ${[...new Set(tagList)].join(', ')}`);
    console.log(`  fetching ${stream}`);
    await curlFile(stream, raw);
  }
  const rawInfo = probe(raw);
  console.log(`  raw: ${Number(rawInfo.duration).toFixed(1)}s @ ${Math.round(rawInfo.bit_rate / 1000)}kbps`);

  // Measure integrated loudness + true peak, then apply a *static* gain toward
  // -16 LUFS (capped so true peak stays ≤ -1 dBTP). Gain-only keeps piano/string
  // dynamics intact — no dynamic loudnorm pumping on quiet passages.
  const { input_i, input_tp } = measureLoudness(raw);
  let gain = Math.min(-16 - input_i, -1.0 - input_tp);
  gain = Math.max(-12, Math.min(12, gain));
  console.log(`  loudness: ${input_i.toFixed(1)} LUFS, peak ${input_tp.toFixed(1)} dBTP → gain ${gain >= 0 ? '+' : ''}${gain.toFixed(1)} dB`);
  execFileSync('ffmpeg', [
    '-y', '-v', 'error', '-i', raw,
    '-af', `volume=${gain.toFixed(2)}dB`,
    '-ar', '44100', '-c:a', 'libmp3lame', '-q:a', '5',
    '-id3v2_version', '3', '-metadata', `title=${title}`, '-metadata', `artist=${p.author}`, '-metadata', 'album=Grace Sermons — Instrumental Hymns',
    final,
  ]);
  const info = probe(final);
  const duration = Math.round(Number(info.duration));
  console.log(`  out: ${duration}s  ${(statSync(final).size / 1024 / 1024).toFixed(2)} MB`);

  manifest.push({
    file: final,
    title,
    pastorName: p.author,
    newPastor: { church: 'Royalty-free · Pixabay License', location: '', bio: `Instrumental arrangements shared under the Pixabay Content License.`, color: '#C08A3E' },
    date: new Date().toISOString().slice(0, 10),
    duration,
    topic: 'Instrumental Hymn',
    description: `${p.hymn} — ${p.style} instrumental by ${p.author}. Source: ${p.url} (Pixabay Content License, free for commercial use).`,
    contentType: 'audio/mpeg',
    folder: 'audio/hymns',
  });
}
writeFileSync(join(here, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nmanifest.json: ${manifest.length} tracks`);

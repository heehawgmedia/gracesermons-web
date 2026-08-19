// Baptist Archive importer — walks a folder tree of preacher-named folders,
// verifies each MP3 decodes cleanly and isn't silent, compresses only files
// whose bitrate is above target (re-encoding 32k tape rips would degrade
// them), dedupes against sermons already on the site, uploads, and creates
// pastor/sermon rows.
//
// Usage:
//   node scripts/archive-import.mjs <archiveRoot> --dry-run   (plan only)
//   node scripts/archive-import.mjs <archiveRoot>             (full import)

import { createClient } from '@supabase/supabase-js';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const execFileP = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const ARCHIVE = process.argv[2];
const DRY = process.argv.includes('--dry-run');
const LOG = join(tmpdir(), 'archive-import-log.jsonl');
const BITRATE_KEEP_MAX = 72000; // upload as-is at or below this
const TARGET = ['-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k'];

const log = (obj) => {
  const line = JSON.stringify({ t: new Date().toISOString(), ...obj });
  console.log(line);
  if (!DRY) appendFileSync(LOG, line + '\n');
};

const norm = (s) =>
  s.toLowerCase().replace(/\(1\)|\(2\)/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

// --- Filename parsing -------------------------------------------------------

function parseFile(folder, file) {
  const stem = file.replace(/\.mp3$/i, '');
  let title = stem;
  let date = null;

  // "2009.03.13.X The Pursuit of Profit - Ron Crisp - 123.mp3"
  let m = stem.match(/^(\d{4})\.(\d{2})\.(\d{2})\.?[A-Z]?\s+(.+?)\s+-\s+.+$/);
  if (m) {
    date = `${m[1]}-${m[2]}-${m[3]}`;
    title = m[4];
  } else if ((m = stem.match(/_(\d{1,2})\.(\d{1,2})\.(\d{2})_(.+)$/))) {
    // "Bro. CC Jack Dobbins_10.6.68_God of Jacob.1"
    const yy = Number(m[3]);
    date = `${yy > 30 ? 1900 + yy : 2000 + yy}-${String(m[1]).padStart(2, '0')}-${String(m[2]).padStart(2, '0')}`;
    title = m[4].replace(/\.\d+$/, '');
  } else if ((m = stem.match(/^(.+?)\s*-\s*(.+)$/)) && norm(m[1]).includes(norm(folder))) {
    // "Clyde Hancock -Have you Considered" — strip only preacher-name prefixes,
    // never dashes that belong to the title ("The Lost Son - Part 1").
    title = m[2];
  } else if ((m = stem.match(/_(\d{4})$/))) {
    date = `${m[1]}-01-01`;
    title = stem.replace(/_(\d{4})$/, '');
  }

  title = title
    .replace(/^(Bro\.?|Elder)\s+/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\(\d\)$/, '')
    .replace(/\.\d+$/, '')
    .replace(/\b(\w+) s\b/g, "$1's")
    .trim();
  // Drop a leading folder-name prefix baked into the filename
  // ("Garner Smith 2 Kings Chp5" -> "2 Kings Chp5").
  const nf = norm(folder);
  if (norm(title).startsWith(nf) && norm(title) !== nf) {
    title = title.slice(title.toLowerCase().indexOf(folder.toLowerCase()) + folder.length).trim();
  }
  // A file named only after the preacher is an untitled recording.
  if (norm(title) === nf || norm(title) === norm(`Bro ${folder}`)) title = 'Untitled Message';
  // "(1)"-style names are duplicate copies; ".1"-style are distinct recordings.
  const isCopy = /\(\d+\)\.mp3$/i.test(file);
  return { title, date, isCopy };
}

// --- Audio checks ------------------------------------------------------------

function probe(file) {
  try {
    const out = execFileSync('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration,bit_rate',
      '-of', 'json', file,
    ]).toString();
    const f = JSON.parse(out).format ?? {};
    return { duration: Number(f.duration) || 0, bitrate: Number(f.bit_rate) || 0 };
  } catch {
    return { duration: 0, bitrate: 0 };
  }
}

async function verifyDecodes(file) {
  try {
    const { stderr } = await execFileP('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], {
      maxBuffer: 10 * 1024 * 1024,
    });
    return { ok: stderr.trim().length === 0, detail: stderr.trim().slice(0, 200) };
  } catch (e) {
    return { ok: false, detail: String(e).slice(0, 200) };
  }
}

async function verifyNotSilent(file, duration) {
  const start = Math.max(0, Math.floor(duration / 2) - 30);
  try {
    const { stderr } = await execFileP('ffmpeg', [
      '-ss', String(start), '-t', '60', '-i', file, '-af', 'volumedetect', '-f', 'null', '-',
    ], { maxBuffer: 10 * 1024 * 1024 });
    const m = stderr.match(/mean_volume:\s*(-?[\d.]+)/);
    const mean = m ? Number(m[1]) : -99;
    return { ok: mean > -55, mean };
  } catch {
    return { ok: false, mean: -99 };
  }
}

// --- Main --------------------------------------------------------------------

const { data: pastors } = await supabase.from('pastors').select('id, name');
const pastorByNorm = new Map(pastors.map((p) => [norm(p.name), p.id]));
const { data: sermons } = await supabase.from('sermons').select('title, pastor_id');
const pastorNameById = new Map(pastors.map((p) => [p.id, norm(p.name)]));
const existingKeys = new Set(
  sermons.map((s) => `${pastorNameById.get(s.pastor_id) ?? ''}::${norm(s.title)}`)
);
const { data: bucketFiles } = await supabase.storage.from('sermon-files').list('audio/archive', { limit: 1000 });
const alreadyUploaded = new Set((bucketFiles ?? []).map((f) => f.name));

const folders = readdirSync(ARCHIVE).filter((d) => statSync(join(ARCHIVE, d)).isDirectory());
const plan = [];
const skipped = [];

for (const folder of folders) {
  const pastorName = folder === 'Unknown_' ? 'Unknown Preacher' : `Bro. ${folder}`;
  const files = readdirSync(join(ARCHIVE, folder)).filter((f) => /\.mp3$/i.test(f));
  const seen = new Set();
  for (const file of files) {
    const full = join(ARCHIVE, folder, file);
    let { title, date, isCopy } = parseFile(folder, file);
    let key = `${norm(pastorName)}::${norm(title)}`;
    if (seen.has(key) && isCopy) { skipped.push({ file, reason: 'duplicate-in-archive' }); continue; }
    // Same-named but distinct recordings get numbered instead of dropped.
    for (let n = 2; seen.has(key); n++) {
      title = `${title.replace(/ \(\d+\)$/, '')} (${n})`;
      key = `${norm(pastorName)}::${norm(title)}`;
    }
    seen.add(key);
    if (existingKeys.has(key)) { skipped.push({ file, reason: 'already-on-site' }); continue; }
    const safeName = `${pastorName} - ${title}`.replace(/[^a-zA-Z0-9._ -]/g, '').replace(/\s+/g, '_') + '.mp3';
    if (alreadyUploaded.has(safeName)) { skipped.push({ file, reason: 'already-in-bucket' }); continue; }
    plan.push({ full, folder, pastorName, title, date, safeName });
  }
}

log({ phase: 'plan', toImport: plan.length, skipped: skipped.length });
for (const s of skipped) log({ phase: 'skip', ...s });

if (DRY) {
  for (const p of plan.slice(0, 30)) log({ phase: 'would-import', pastor: p.pastorName, title: p.title, date: p.date });
  console.log(`DRY RUN: ${plan.length} to import, ${skipped.length} skipped`);
  process.exit(0);
}

const pastorCache = new Map();
async function ensurePastor(name) {
  const n = norm(name);
  if (pastorByNorm.has(n)) return pastorByNorm.get(n);
  if (pastorCache.has(n)) return pastorCache.get(n);
  const initials = name.replace(/^Bro\.\s*/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const { data, error } = await supabase.from('pastors').insert({
    name, church: '', location: '', bio: '',
    avatar_initials: initials, avatar_color: '#2D5A3D', avatar_url: null,
  }).select('id').single();
  if (error) throw new Error(`pastor ${name}: ${error.message}`);
  pastorCache.set(n, data.id);
  log({ phase: 'pastor-created', name });
  return data.id;
}

let done = 0, failed = 0, uploadedBytes = 0;
for (const item of plan) {
  try {
    const { duration, bitrate } = probe(item.full);
    if (duration < 60) { failed++; log({ phase: 'reject', file: item.safeName, reason: `too short (${duration.toFixed(0)}s)` }); continue; }
    const REPAIR = process.env.REPAIR === '1';
    const dec = await verifyDecodes(item.full);
    if (!dec.ok && !REPAIR) { failed++; log({ phase: 'reject', file: item.safeName, reason: 'decode errors', detail: dec.detail }); continue; }
    const sil = await verifyNotSilent(item.full, duration);
    if (!sil.ok) { failed++; log({ phase: 'reject', file: item.safeName, reason: `near-silent (mean ${sil.mean}dB)` }); continue; }

    let uploadPath = item.full;
    let recompressed = false;
    // Repair mode: a fresh decode+encode drops the damaged frames.
    if (bitrate > BITRATE_KEEP_MAX || (REPAIR && !dec.ok)) {
      const tmp = join(tmpdir(), 'archive-recode.mp3');
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', item.full, ...TARGET, tmp]);
      uploadPath = tmp;
      recompressed = true;
    }

    const buf = readFileSync(uploadPath);
    if (buf.length > 50 * 1024 * 1024) { failed++; log({ phase: 'reject', file: item.safeName, reason: 'over 50MB' }); continue; }
    const storagePath = `audio/archive/${item.safeName}`;
    const up = await supabase.storage.from('sermon-files').upload(storagePath, buf, { contentType: 'audio/mpeg', upsert: true });
    if (up.error) throw new Error(up.error.message);
    const { data: urlData } = supabase.storage.from('sermon-files').getPublicUrl(storagePath);

    const pastorId = await ensurePastor(item.pastorName);
    const { error: sErr } = await supabase.from('sermons').insert({
      title: item.title, pastor_id: pastorId, series_id: null,
      date: item.date ?? '1970-01-01', duration: Math.round(duration),
      scripture: '', topic: 'Archive', description: 'Baptist Archive',
      audio_url: urlData.publicUrl, cover_image: null,
    });
    if (sErr) throw new Error(sErr.message);
    done++;
    uploadedBytes += buf.length;
    log({ phase: 'imported', n: `${done}/${plan.length}`, pastor: item.pastorName, title: item.title, mb: +(buf.length / 1e6).toFixed(1), recompressed });
  } catch (e) {
    failed++;
    log({ phase: 'error', file: item.safeName, error: String(e).slice(0, 300) });
  }
}

log({ phase: 'done', imported: done, failed, skippedExisting: skipped.length, totalMB: +(uploadedBytes / 1e6).toFixed(0) });

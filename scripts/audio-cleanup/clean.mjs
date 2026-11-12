// Cleans up sermon audio across the library: levels the volume, evens out
// loud/soft swings, removes rumble and light hiss, and lifts muffled voices.
//
// For each sermon: download the original -> <backup>/Originals, render the
// cleaned MP3 -> <backup>/Cleaned, upload it to audio/cleaned/<id>.mp3 and
// point the sermon row at it. The original storage object is left in place.
//
// Usage: node scripts/audio-cleanup/clean.mjs <workdir> <backupdir> [--limit N] [--only id8,id8] [--dry]
// Resumable (state in <backupdir>/cleanup-log.jsonl). To pause, create a file
// named STOP in <backupdir>; the run ends after the sermon in progress.

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'node:child_process';
import {
  appendFileSync, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'sermon-files';
const MUSIC = new Set(['Instrumental Hymn', 'Special Music']);
const MAX_BYTES = 48 * 1024 * 1024; // bucket cap is 50 MB
const WORKERS = 2;

const [workdir, backupDir, ...flags] = process.argv.slice(2);
const flag = (name) => {
  const i = flags.indexOf(name);
  return i === -1 ? null : flags[i + 1] ?? true;
};
const limit = Number(flag('--limit')) || Infinity;
const only = typeof flag('--only') === 'string' ? flag('--only').split(',') : null;
const dry = flags.includes('--dry');

const logPath = join(backupDir, 'cleanup-log.jsonl');
const stopPath = join(backupDir, 'STOP');
mkdirSync(backupDir, { recursive: true });

const readLines = (p) =>
  existsSync(p) ? readFileSync(p, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const finished = new Set(readLines(logPath).filter((r) => r.status !== 'error').map((r) => r.id));
const survey = new Map(readLines(join(workdir, 'survey.jsonl')).map((r) => [r.id, r]));

const catalog = JSON.parse(readFileSync(join(workdir, 'catalog.json'), 'utf8'));
// Hardest to hear first, so the worst messages are fixed earliest.
const todo = catalog
  .filter((s) => s.audio_url && !MUSIC.has(s.topic) && !finished.has(s.id))
  .filter((s) => !only || only.some((p) => s.id.startsWith(p)))
  .filter((s) => !s.audio_url.includes('/audio/cleaned/'))
  .sort((a, b) => (survey.get(a.id)?.lufs ?? 0) - (survey.get(b.id)?.lufs ?? 0))
  .slice(0, limit);

const safe = (s) => s.replace(/[<>:"/\\|?*\x00-\x1f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 110) || 'Untitled';

function run(cmd, args) {
  return new Promise((resolve) => {
    const p = spawn(cmd, args);
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, out, err }));
  });
}

async function probe(file) {
  const r = await run('ffprobe', [
    '-v', 'error', '-select_streams', 'a:0',
    '-show_entries', 'stream=sample_rate,bit_rate,channels:format=duration,bit_rate',
    '-of', 'json', file,
  ]);
  const j = JSON.parse(r.out || '{}');
  return {
    duration: Number(j.format?.duration) || 0,
    sampleRate: Number(j.streams?.[0]?.sample_rate) || 0,
    bitrate: Number(j.streams?.[0]?.bit_rate || j.format?.bit_rate) || 0,
  };
}

async function loudness(file) {
  const r = await run('ffmpeg', ['-hide_banner', '-nostdin', '-i', file, '-af', 'ebur128=framelog=quiet', '-f', 'null', '-']);
  const tail = r.err.slice(r.err.lastIndexOf('Integrated loudness'));
  const num = (re) => Number(tail.match(re)?.[1] ?? NaN);
  return { lufs: num(/I:\s+(-?[\d.]+) LUFS/), lra: num(/LRA:\s+(-?[\d.]+) LU/) };
}

async function download(url, dest) {
  const tmp = dest + '.part';
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
      const expected = Number(res.headers.get('content-length'));
      if (expected && statSync(tmp).size !== expected) throw new Error('short download');
      renameSync(tmp, dest);
      return;
    } catch (e) {
      rmSync(tmp, { force: true });
      if (attempt >= 4) throw e;
      await new Promise((r) => setTimeout(r, 15000 * attempt));
    }
  }
}

async function uploadFile(path, buffer) {
  const direct = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType: 'audio/mpeg', upsert: true });
  if (!direct.error) return;
  const msg = direct.error.message ?? '';
  if (!/too large|payload|413|exceeds|body|entity/i.test(msg)) throw new Error(msg);
  const { data: signed, error: signedError } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
  if (signedError) throw new Error(signedError.message);
  const { error: putError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, buffer, { contentType: 'audio/mpeg', upsert: true });
  if (putError) throw new Error(putError.message);
}

function chain(s, before) {
  const sv = survey.get(s.id);
  const filters = [];
  // Heavier rumble/hum gets a higher cut.
  filters.push(`highpass=f=${sv && sv.low - sv.body > -10 ? 110 : 80}`);
  filters.push('afftdn=nr=8:nf=-45:tn=1');
  // Muffled voices: lift the consonant range, more the duller it is.
  const tilt = sv ? sv.presence - sv.body : -12;
  const lift = Math.max(0, Math.min(5, (-14 - tilt) * 0.6));
  if (lift >= 1) filters.push(`equalizer=f=3200:t=q:w=0.9:g=${lift.toFixed(1)}`);
  filters.push('dynaudnorm=f=500:g=31:p=0.5:m=8:r=0.0');
  filters.push('acompressor=threshold=0.1:ratio=3:attack=8:release=200:makeup=2');
  filters.push('loudnorm=I=-16:TP=-1.5:LRA=7');
  return { filters: filters.join(','), lift: Number(lift.toFixed(1)), before };
}

async function clean(s) {
  const pastor = safe(s.pastor_name || 'Unknown');
  const base = `${safe(s.title)} [${s.id.slice(0, 8)}]`;
  const srcPath = decodeURIComponent(new URL(s.audio_url).pathname);
  const ext = /\.(mp3|m4a|wav|aac|ogg)$/i.exec(srcPath)?.[0].toLowerCase() ?? '.mp3';
  const origFile = join(backupDir, 'Originals', pastor, base + ext);
  const cleanFile = join(backupDir, 'Cleaned', pastor, base + '.mp3');
  mkdirSync(dirname(origFile), { recursive: true });
  mkdirSync(dirname(cleanFile), { recursive: true });

  if (!existsSync(origFile)) await download(s.audio_url, origFile);
  const src = await probe(origFile);
  if (src.duration < 30) throw new Error(`original looks broken (duration ${src.duration}s)`);
  const before = await loudness(origFile);

  // Keep low-rate archive files from growing more than they need to, and
  // long messages under the bucket's size cap.
  const lowRate = src.sampleRate <= 22050;
  const fit = Math.floor((MAX_BYTES * 8) / src.duration / 1000);
  const kbps = Math.max(24, Math.min(lowRate ? 48 : 64, fit));
  const c = chain(s, before);

  const tmp = cleanFile + '.part.mp3';
  const r = await run('ffmpeg', [
    '-hide_banner', '-nostdin', '-y', '-i', origFile, '-vn', '-af', c.filters,
    '-ar', lowRate ? '22050' : '44100', '-ac', '1', '-c:a', 'libmp3lame', '-b:a', `${kbps}k`, tmp,
  ]);
  if (r.code !== 0) throw new Error('ffmpeg: ' + r.err.split('\n').slice(-3).join(' | '));
  const out = await probe(tmp);
  if (Math.abs(out.duration - src.duration) > 2) {
    rmSync(tmp, { force: true });
    throw new Error(`duration mismatch ${src.duration} -> ${out.duration}`);
  }
  const after = await loudness(tmp);
  if (!(after.lufs > -19 && after.lufs < -13)) {
    rmSync(tmp, { force: true });
    throw new Error(`cleaned loudness off target: ${after.lufs}`);
  }
  renameSync(tmp, cleanFile);

  const row = {
    id: s.id, title: s.title, pastor: s.pastor_name, status: 'rendered',
    before, after, lift: c.lift, kbps,
    origBytes: statSync(origFile).size, cleanBytes: statSync(cleanFile).size,
    oldUrl: s.audio_url, origFile, cleanFile,
  };
  if (dry) return row;

  const storagePath = `audio/cleaned/${s.id}.mp3`;
  await uploadFile(storagePath, readFileSync(cleanFile));
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  // The storage gateway rejects HEAD, so ask for one byte and read the total.
  const check = await fetch(urlData.publicUrl, { headers: { Range: 'bytes=0-0' } });
  const total = Number((check.headers.get('content-range') ?? '').split('/')[1]);
  await check.arrayBuffer();
  if (!check.ok || total !== row.cleanBytes)
    throw new Error(`upload check failed (HTTP ${check.status}, ${total} of ${row.cleanBytes} bytes)`);

  const { data: updated, error } = await supabase
    .from('sermons').update({ audio_url: urlData.publicUrl }).eq('id', s.id).select('id,audio_url');
  if (error) throw new Error(error.message);
  if (!updated?.length || updated[0].audio_url !== urlData.publicUrl) throw new Error('sermon row did not update');
  return { ...row, status: 'live', newUrl: urlData.publicUrl };
}

let i = 0;
let okCount = 0;
let errCount = 0;
async function worker() {
  while (i < todo.length && !existsSync(stopPath)) {
    const s = todo[i++];
    const n = i;
    let row;
    try {
      row = await clean(s);
      okCount++;
    } catch (e) {
      row = { id: s.id, title: s.title, pastor: s.pastor_name, status: 'error', error: String(e.message ?? e) };
      errCount++;
    }
    appendFileSync(logPath, JSON.stringify({ ...row, at: new Date().toISOString() }) + '\n');
    console.log(
      `${n}/${todo.length} ${row.status} ${row.error ?? `${row.before.lufs} -> ${row.after.lufs} LUFS, LRA ${row.before.lra} -> ${row.after.lra}`}  ${s.pastor_name} — ${s.title}`
    );
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
console.log(`finished: ${okCount} ok, ${errCount} errors${existsSync(stopPath) ? ' (stopped by STOP file)' : ''}`);

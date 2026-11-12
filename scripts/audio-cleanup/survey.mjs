// Measures how hard each sermon is to hear, from three short clips per file
// (fetched with HTTP range seeks, so only ~1-2 MB per sermon is downloaded).
// Usage: node scripts/audio-cleanup/survey.mjs <catalog.json> <workdir>
// Resumable: results are appended to <workdir>/survey.jsonl.

import { spawn } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const [catalogPath, workdir] = process.argv.slice(2);
const MUSIC = new Set(['Instrumental Hymn', 'Special Music']);
const CLIP = 45;
const WORKERS = 3;

const outPath = join(workdir, 'survey.jsonl');
const clipDir = join(workdir, 'clips');
mkdirSync(clipDir, { recursive: true });

const done = new Set(
  existsSync(outPath)
    ? readFileSync(outPath, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l).id)
    : []
);
const todo = JSON.parse(readFileSync(catalogPath, 'utf8')).filter(
  (s) => s.audio_url && !MUSIC.has(s.topic) && !done.has(s.id)
);

function run(args) {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', ['-hide_banner', '-nostdin', ...args]);
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (code) => resolve({ code, err }));
  });
}

const num = (re, s) => {
  const m = s.match(re);
  return m ? Number(m[1]) : null;
};

async function survey(s) {
  const dur = s.duration || 1800;
  const wav = join(clipDir, `${s.id}.wav`);
  const inputs = [0.2, 0.5, 0.8].flatMap((f) => [
    '-ss', String(Math.max(0, Math.floor(dur * f))), '-t', String(CLIP), '-i', s.audio_url,
  ]);
  const grab = await run([
    ...inputs,
    '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1,aresample=32000,pan=mono|c0=0.5*c0+0.5*c1[a]',
    '-map', '[a]', '-y', wav,
  ]);
  if (grab.code !== 0) {
    // Mono sources reject the stereo pan; retry with a plain downmix.
    const retry = await run([
      ...inputs,
      '-filter_complex', '[0:a][1:a][2:a]concat=n=3:v=0:a=1[a]',
      '-map', '[a]', '-ac', '1', '-ar', '32000', '-y', wav,
    ]);
    if (retry.code !== 0) return { id: s.id, error: retry.err.split('\n').slice(-4).join(' | ') };
  }

  const loud = await run(['-i', wav, '-af', 'loudnorm=print_format=json', '-f', 'null', '-']);
  const stats = await run(['-i', wav, '-af', 'astats=metadata=0', '-f', 'null', '-']);
  const band = async (f) =>
    num(/mean_volume: (-?[\d.]+) dB/, (await run(['-i', wav, '-af', `${f},volumedetect`, '-f', 'null', '-'])).err);

  const row = {
    id: s.id,
    title: s.title,
    pastor: s.pastor_name,
    topic: s.topic,
    duration: s.duration,
    lufs: num(/"input_i"\s*:\s*"(-?[\d.]+)"/, loud.err),
    lra: num(/"input_lra"\s*:\s*"(-?[\d.]+)"/, loud.err),
    truePeak: num(/"input_tp"\s*:\s*"(-?[\d.]+)"/, loud.err),
    noiseFloor: num(/Noise floor dB: (-?[\d.]+)/, stats.err),
    rms: num(/RMS level dB: (-?[\d.]+)/, stats.err),
    rmsTrough: num(/RMS trough dB: (-?[\d.]+)/, stats.err),
    // Where the energy sits: rumble/hum, speech body, and the consonants that
    // make words intelligible.
    low: await band('lowpass=f=120'),
    body: await band('highpass=f=200,lowpass=f=2000'),
    presence: await band('highpass=f=2000,lowpass=f=6000'),
    air: await band('highpass=f=6000'),
  };
  rmSync(wav, { force: true });
  return row;
}

let i = 0;
async function worker() {
  while (i < todo.length) {
    const s = todo[i++];
    const row = await survey(s);
    appendFileSync(outPath, JSON.stringify(row) + '\n');
    console.log(`${done.size + i}/${done.size + todo.length} ${row.error ? 'ERR ' + row.error : row.lufs} ${s.title}`);
  }
}
await Promise.all(Array.from({ length: WORKERS }, worker));
console.log('done');

// BaptistMessages import — two teaching series (created as proper site series)
// plus four individual messages. Same verify/compress pipeline as the archive
// importer: decode + silence checks, sources >72kbps recompressed to 48k mono.

import { createClient } from '@supabase/supabase-js';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const execFileP = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const BASE = 'D:/BaptistMessages';

const REV = `${BASE}/Br. Cockrell-Study of Revelation`;
const COMP = `${BASE}/Compressed`;
const UPL = `${BASE}/Compressed and uploaded`;

const SERIES = [
  {
    title: 'Study of Revelation',
    description: 'A verse-by-verse Bible study through the book of Revelation, taught by Bro. Milburn Cockrell.',
    pastorName: 'Bro. Milburn Cockrell',
    topic: 'Bible Study',
    baseDate: '1970-01-', // +index keeps chapter order under the Archive sentinel
    episodes: [
      ['Revelation 1:1-8', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 1_ 1-8 (Bible Study).mp3`],
      ['Revelation 1:9-20', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 1 _ 9-20 (Bible Study) _Audio Only_.mp3`],
      ['Revelation 2:18-29', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 2_18 - 29 Bible Study.mp3`],
      ['Revelation 3:1-6', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 3_1-6 (Bible Study).mp3`],
      ['Revelation 3:7-13', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 3_7-13 (Bible Study).mp3`],
      ['Revelation 4:1-11', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 4_1-11 (Bible Study).mp3`],
      ['Revelation 5:1-14', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 5_1-14 (Bible Study).mp3`],
      ['Revelation 6:1-11', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 6_1-11 (Bible Study) _Audio Only_.mp3`],
      ['Revelation 7', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 7 _ 9 8 2 Bible Study (Audio Only).mp3`],
      ['Revelation 9:1-12', `${REV}/Bro. Milburn Cockrell - Revelation Chp. 9 _ 1 - 12 Bible Study (Audio Only).mp3`],
    ],
  },
  {
    title: 'Trail of Blood',
    description: 'A study through Baptist church history, taught by Bro. Jerry Gumm.',
    pastorName: 'Bro. Jerry Gumm',
    newPastor: { initials: 'BJ', color: '#7C2D12' },
    topic: 'Church History',
    baseDate: '1970-02-',
    episodes: [
      ['Trail of Blood - Part 1A', `${COMP}/TrailofBlood-Bro. Jerry Gumm Part 1A.MP3`],
      ['Trail of Blood - Part 1B', `${COMP}/TrailofBlood-Bro.Jerry Gumm Part 1B.MP3`],
      ['Trail of Blood - Part 3A', `${COMP}/Trail of Blood-Bro. Jerry Gumm Part 3A.MP3`],
      ['Trail of Blood - Part 3B', `${COMP}/Trail of Blood- Bro. Jerry Gumm Part 3B.MP3`],
      ['Trail of Blood - Part 5B', `${COMP}/Trail of Blood - Bro. Jerry Gumm Part 5B.MP3`],
    ],
  },
];

const SINGLES = [
  { title: 'Bro. Kenneth Long — March 1, 2026', pastorName: 'Bro. Kenneth Long', date: '2026-03-01', file: `${UPL}/Bro. Kenneth Long March 1 2026.mp3` },
  { title: 'Bro. Kenneth Long — March 15, 2026', pastorName: 'Bro. Kenneth Long', date: '2026-03-15', file: `${UPL}/Bro. Kenneth Long 3_15_26.mp3` },
  { title: 'Acts 8', pastorName: 'Bro. Mark Minney', newPastor: { initials: 'BM', color: '#0E7490' }, date: null, file: `${UPL}/Bro. Mark Minney Acts 8.MP3` },
  { title: 'II Corinthians 5', pastorName: 'Bro. Mark Minney', newPastor: { initials: 'BM', color: '#0E7490' }, date: null, file: `${UPL}/Bro. Mark Minney II Corinthians 5.MP3` },
];

// --- helpers (same pipeline as archive-import) -------------------------------

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration,bit_rate', '-of', 'json', file]).toString();
  const f = JSON.parse(out).format ?? {};
  return { duration: Number(f.duration) || 0, bitrate: Number(f.bit_rate) || 0 };
}
async function decodeOk(file) {
  try {
    const { stderr } = await execFileP('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { maxBuffer: 10e6 });
    return stderr.trim().length === 0;
  } catch { return false; }
}
async function notSilent(file, duration) {
  const start = Math.max(0, Math.floor(duration / 2) - 30);
  const { stderr } = await execFileP('ffmpeg', ['-ss', String(start), '-t', '60', '-i', file, '-af', 'volumedetect', '-f', 'null', '-'], { maxBuffer: 10e6 });
  const m = stderr.match(/mean_volume:\s*(-?[\d.]+)/);
  return (m ? Number(m[1]) : -99) > -55;
}

const { data: pastors } = await supabase.from('pastors').select('id, name');
const pastorIds = new Map(pastors.map((p) => [p.name, p.id]));
async function ensurePastor(name, np = {}) {
  if (pastorIds.has(name)) return pastorIds.get(name);
  const { data, error } = await supabase.from('pastors').insert({
    name, church: '', location: '', bio: '',
    avatar_initials: np.initials ?? name.replace(/^Bro\.\s*/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
    avatar_color: np.color ?? '#2D5A3D', avatar_url: null,
  }).select('id').single();
  if (error) throw new Error(error.message);
  console.log('pastor created:', name);
  pastorIds.set(name, data.id);
  return data.id;
}

async function importOne({ title, file, pastorId, seriesId = null, date, topic = '', description = '' }) {
  const { duration, bitrate } = probe(file);
  if (duration < 60) throw new Error(`too short: ${duration}s`);
  const dec = await decodeOk(file);
  const sil = await notSilent(file, duration);
  if (!sil) throw new Error('near-silent');
  let uploadPath = file;
  let recompressed = false;
  if (bitrate > 72000 || !dec) {
    const tmp = join(tmpdir(), 'msg-recode.mp3');
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', file, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', tmp]);
    uploadPath = tmp;
    recompressed = true;
  }
  const buf = readFileSync(uploadPath);
  const safeName = title.replace(/[^a-zA-Z0-9._ -]/g, '').replace(/\s+/g, '_') + '.mp3';
  const storagePath = `audio/archive/${safeName}`;
  const up = await supabase.storage.from('sermon-files').upload(storagePath, buf, { contentType: 'audio/mpeg', upsert: true });
  if (up.error) throw new Error(up.error.message);
  const { data: urlData } = supabase.storage.from('sermon-files').getPublicUrl(storagePath);
  const { error } = await supabase.from('sermons').insert({
    title, pastor_id: pastorId, series_id: seriesId, date: date ?? '1970-01-01',
    duration: Math.round(duration), scripture: '', topic, description,
    audio_url: urlData.publicUrl, cover_image: null,
  });
  if (error) throw new Error(error.message);
  console.log(`imported: ${title} (${(buf.length / 1e6).toFixed(1)}MB${recompressed ? ', recompressed' : ''})`);
}

const { data: existing } = await supabase.from('sermons').select('title');
const have = new Set(existing.map((s) => s.title));

for (const s of SERIES) {
  const pastorId = await ensurePastor(s.pastorName, s.newPastor);
  let { data: ser } = await supabase.from('sermon_series').select('id').eq('title', s.title).maybeSingle();
  if (!ser) {
    const { data, error } = await supabase.from('sermon_series').insert({
      title: s.title, description: s.description, pastor_id: pastorId, cover_image: null,
    }).select('id').single();
    if (error) throw new Error(error.message);
    ser = data;
    console.log('series created:', s.title);
  }
  for (let i = 0; i < s.episodes.length; i++) {
    const [title, file] = s.episodes[i];
    if (have.has(title)) { console.log('skip existing:', title); continue; }
    const date = `${s.baseDate}${String(i + 2).padStart(2, '0')}`;
    try {
      await importOne({ title, file, pastorId, seriesId: ser.id, date, topic: s.topic, description: `${s.title} — ${s.pastorName}` });
    } catch (e) { console.log(`FAILED ${title}: ${e.message ?? e}`); }
  }
}

for (const item of SINGLES) {
  if (have.has(item.title)) { console.log('skip existing:', item.title); continue; }
  const pastorId = await ensurePastor(item.pastorName, item.newPastor);
  try {
    await importOne({ ...item, pastorId });
  } catch (e) { console.log(`FAILED ${item.title}: ${e.message ?? e}`); }
}
console.log('ALL DONE');

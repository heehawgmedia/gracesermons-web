// Providence Baptist Church Annual Bible Conference archives import.
// Files downloaded from providencebaptistchurchky.org; same pipeline as the
// other importers: decode + silence verification, >72kbps recompressed to
// 48k mono, dedupe by title, pastors created as needed.

import { createClient } from '@supabase/supabase-js';
import { execFileSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
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
const DL = join(process.env.LOCALAPPDATA, 'Temp', 'claude', 'C--Users-garet--claude',
  'f6a8a36b-2152-4563-87a6-a943cd19eafd', 'scratchpad', 'pbc-dl');

// [file, pastor, title(null = "Bro. X — Annual Bible Conference YYYY"), date, year]
const ITEMS = [
  // 2015 conference
  ['Bro.-Clarence-Grigsby_SEP_2015.mp3', 'Bro. Clarence Grigsby', null, '2015-09-01', 2015],
  ['Bro.-Isaac-Heil_SEP_2015.mp3', 'Bro. Isaac Heil', null, '2015-09-01', 2015],
  ['Bro.-Scott-Cornett_SEP_2015.mp3', 'Bro. Scott Cornett', null, '2015-09-01', 2015],
  ['Bro.-Mark-Minney_SEP_2015.mp3', 'Bro. Mark Minney', null, '2015-09-01', 2015],
  ['Bro.-Scott-Guiley_SEP_2015.mp3', 'Bro. Scott Guiley', null, '2015-09-01', 2015],
  ['Bro.-Nathan-Long_SEP_2015.mp3', 'Bro. Nathan Long', null, '2015-09-01', 2015],
  ['Bro.-Ron-Crisp_SEP_2015.mp3', 'Bro. Ron Crisp', null, '2015-09-01', 2015],
  ['Bro.-Dan-Gordon_SEP_2015.mp3', 'Bro. Dan Gordon', null, '2015-09-01', 2015],
  // 2014 conference
  ['Irvin-Cummins2014.MP3', 'Bro. Irvin Cummings', null, '2014-01-01', 2014],
  ['Lonnie-Bennet-2014.MP3', 'Bro. Lonnie Bennet', null, '2014-01-01', 2014],
  ['Gordon-Downs-2014.MP3', 'Bro. Gordon Downs', null, '2014-01-01', 2014],
  ['Mark-Minney-2014.MP3', 'Bro. Mark Minney', null, '2014-01-01', 2014],
  ['Chris-Page--2014.MP3', 'Bro. Christopher Page', null, '2014-01-01', 2014],
  ['Troy-McGahan-2014.MP3', 'Bro. Troy McGahan', null, '2014-01-01', 2014],
  ['Nathan-Long-2014.MP3', 'Bro. Nathan Long', null, '2014-01-01', 2014],
  ['Ron-Crisp--2014.MP3', 'Bro. Ron Crisp', null, '2014-01-01', 2014],
  // titled messages (year not stated on the page)
  ['Trescott-Living-Victoriously-1.MP3', 'Bro. Shaun Trescott', 'Living Victoriously', null, null],
  ['Jim-Duvall-Truth.MP3', 'Bro. Jim Duvall', 'Truth', null, null],
  ['Hille-The-Mercies-of-God.MP3', 'Bro. Nathaniel Hille', 'The Mercies of God', null, null],
  ['Works-Strangers-in-Lords-House.MP3', 'Bro. Timothy Works', "Strangers in the Lord's House", null, null],
  ['Dan-Gordan-Walk-wwith-God-2.MP3', 'Bro. Dan Gordon', 'Walk with God', null, null],
  // 2012 conference (dated)
  ['Bro.-Jerry-Asberry-9-29-12.MP3', 'Bro. Jerry Asberry', null, '2012-09-29', 2012],
  ['Bro.-Scott-Guiley-9-29-12.MP3', 'Bro. Scott Guiley', null, '2012-09-29', 2012],
  ['Bro.-Nathan-Long-9-29-12.MP3', 'Bro. Nathan Long', null, '2012-09-29', 2012],
  ['Bro.-Mark-Minney-9-29-12.MP3', 'Bro. Mark Minney', null, '2012-09-29', 2012],
  ['Bro.-Jason-Shultz-9-30-12.MP3', 'Bro. Jason Shults', null, '2012-09-30', 2012],
  ['Bro.-Ron-Crisp-9-30-12.MP3', 'Bro. Ron Crisp', null, '2012-09-30', 2012],
  // undated name-only batch
  ['Bro.-Hank-Bailess.mp3', 'Bro. Hank Bailess', null, null, null],
  ['Bro.-Paul-Stepp.mp3', 'Bro. Paul Stepp', null, null, null],
  ['Bro.-Jeff-Short.mp3', 'Bro. Jeff Short', null, null, null],
  ['Bro.-Clarence-Grigsby.mp3', 'Bro. Clarence Grigsby', null, null, null],
  ['Bro.-Jeff-Lawrence.mp3', 'Bro. Jeff Lawrence', null, null, null],
  ['Bro.-Pete-Horn.mp3', 'Bro. Pete Horn', null, null, null],
  ['Bro.-Bill-James.mp3', 'Bro. Bill James', null, null, null],
  ['Bro.-Chuck-West.mp3', 'Bro. Chuck West', null, null, null],
  ['Bro.-Tom-Hysell.mp3', 'Bro. Tom Hysell', null, null, null],
  // 2011 conference (dated)
  ['Bro.-Christoper-Page-2011-Bible-Conference.MP3', 'Bro. Christopher Page', null, '2011-09-24', 2011],
  ['Bro.-Raul-Enyid-2011-Annual-Bible-Conference.MP3', 'Bro. Raul Enyid', null, '2011-09-24', 2011],
  ['Bro.-Brent-Spears-9-24-2011-Annual-Bible-Conference.MP3', 'Bro. Brent Spears', null, '2011-09-24', 2011],
  ['Bro.-Mark-Minney-2011-Annual-Bible-C.mp3', 'Bro. Mark Minney', null, '2011-09-24', 2011],
  ['Bro.-Nathan-Long-2011-Bible-Conference.mp3', 'Bro. Nathan Long', null, '2011-09-25', 2011],
  ['Bro.-Raul-Enyid-9-25-2011-Annual-Bible-Conference.MP3', 'Bro. Raul Enyid', null, '2011-09-25', 2011],
];

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
async function ensurePastor(name) {
  if (pastorIds.has(name)) return pastorIds.get(name);
  const initials = name.replace(/^Bro\.\s*/, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const { data, error } = await supabase.from('pastors').insert({
    name, church: '', location: '', bio: '',
    avatar_initials: initials, avatar_color: '#2D5A3D', avatar_url: null,
  }).select('id').single();
  if (error) throw new Error(error.message);
  console.log('pastor created:', name);
  pastorIds.set(name, data.id);
  return data.id;
}

const { data: existing } = await supabase.from('sermons').select('title');
const have = new Set(existing.map((s) => s.title));

let done = 0, failed = 0;
for (const [file, pastorName, rawTitle, date, year] of ITEMS) {
  const full = join(DL, file);
  const title = rawTitle ?? `${pastorName} — Annual Bible Conference${year ? ` ${year}` : ''}`;
  try {
    if (!existsSync(full)) throw new Error('file not downloaded');
    if (have.has(title)) { console.log('skip existing:', title); continue; }
    const { duration, bitrate } = probe(full);
    if (duration < 60) throw new Error(`too short (${duration.toFixed(0)}s)`);
    const dec = await decodeOk(full);
    if (!(await notSilent(full, duration))) throw new Error('near-silent');
    let uploadPath = full;
    let recompressed = false;
    if (bitrate > 72000 || !dec) {
      const tmp = join(tmpdir(), 'pbc-recode.mp3');
      execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', full, '-ac', '1', '-c:a', 'libmp3lame', '-b:a', '48k', tmp]);
      uploadPath = tmp;
      recompressed = true;
    }
    const buf = readFileSync(uploadPath);
    if (buf.length > 50 * 1024 * 1024) throw new Error('over 50MB');
    const safeName = title.replace(/[^a-zA-Z0-9._ -]/g, '').replace(/\s+/g, '_') + '.mp3';
    const storagePath = `audio/archive/${safeName}`;
    const up = await supabase.storage.from('sermon-files').upload(storagePath, buf, { contentType: 'audio/mpeg', upsert: true });
    if (up.error) throw new Error(up.error.message);
    const { data: urlData } = supabase.storage.from('sermon-files').getPublicUrl(storagePath);
    const pastorId = await ensurePastor(pastorName);
    const { error } = await supabase.from('sermons').insert({
      title, pastor_id: pastorId, series_id: null,
      date: date ?? '1970-01-01', duration: Math.round(duration),
      scripture: '', topic: 'Bible Conference',
      description: `Annual Bible Conference — Providence Baptist Church${year ? ` (${year})` : ''}`,
      audio_url: urlData.publicUrl, cover_image: null,
    });
    if (error) throw new Error(error.message);
    have.add(title);
    done++;
    console.log(`imported ${done}: ${title} (${(buf.length / 1e6).toFixed(1)}MB${recompressed ? ', recompressed' : ''})`);
  } catch (e) {
    failed++;
    console.log(`FAILED ${title}: ${e.message ?? e}`);
  }
}
console.log(`DONE imported=${done} failed=${failed}`);

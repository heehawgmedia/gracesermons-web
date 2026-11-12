// Summarises survey.jsonl: loudness spread and the hardest-to-hear sermons.
// Usage: node scripts/audio-cleanup/report.mjs <workdir>

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const rows = readFileSync(join(process.argv[2], 'survey.jsonl'), 'utf8')
  .split('\n').filter(Boolean).map((l) => JSON.parse(l));
const ok = rows.filter((r) => !r.error && r.lufs !== null);
console.log(rows.length, 'surveyed,', rows.length - ok.length, 'errors');

const bucket = (v, edges) => edges.findIndex((e) => v < e);
const hist = (label, get, edges) => {
  const counts = Array(edges.length + 1).fill(0);
  for (const r of ok) { const b = bucket(get(r), edges); counts[b === -1 ? edges.length : b]++; }
  console.log(label, edges.map((e, i) => `<${e}: ${counts[i]}`).join('  '), ` >=${edges.at(-1)}: ${counts.at(-1)}`);
};
hist('LUFS    ', (r) => r.lufs, [-35, -30, -26, -22, -19, -16, -13]);
hist('LRA     ', (r) => r.lra, [4, 6, 8, 10, 13, 16]);
// Presence relative to body: very negative = muffled, consonants buried.
hist('presence', (r) => r.presence - r.body, [-24, -20, -16, -12, -8]);
hist('rumble  ', (r) => r.low - r.body, [-30, -20, -12, -6, 0]);

const show = (title, list) => {
  console.log('\n' + title);
  for (const r of list)
    console.log(
      `${String(r.lufs).padStart(6)} LUFS  LRA ${String(r.lra).padStart(4)}  pres ${(r.presence - r.body).toFixed(0).padStart(4)}  low ${(r.low - r.body).toFixed(0).padStart(4)}  ${Math.round(r.duration / 60)}m  ${r.pastor} — ${r.title}  [${r.id.slice(0, 8)}]`
    );
};
show('QUIETEST', [...ok].sort((a, b) => a.lufs - b.lufs).slice(0, 15));
show('WIDEST SWINGS (loud/soft)', [...ok].sort((a, b) => b.lra - a.lra).slice(0, 15));
show('MOST MUFFLED', [...ok].sort((a, b) => (a.presence - a.body) - (b.presence - b.body)).slice(0, 15));
show('MOST RUMBLE/HUM', [...ok].sort((a, b) => (b.low - b.body) - (a.low - a.body)).slice(0, 10));
if (rows.length !== ok.length) console.log('\nERRORS', rows.filter((r) => r.error).map((r) => r.id + ' ' + r.error));

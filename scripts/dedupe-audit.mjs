// Duplicate audit for the live sermon catalog.
//
// Groups same-preacher sermons whose normalized titles fuzzy-match
// (edit distance <= 2 after dropping articles/"part" noise) AND whose
// durations agree within 10%. Confident pairs: the archive copy (or the
// newer row) is deleted, keeping the row with a real date/cover/plays.
// Uncertain pairs are reported only.
//
// Usage: node scripts/dedupe-audit.mjs [--apply]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8').split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const APPLY = process.argv.includes('--apply');

const norm = (s) =>
  s.toLowerCase()
    .replace(/\(\d+\)/g, '')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\b(a|an|the|part|pt)\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function editDistance(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

const { data: sermons, error } = await supabase
  .from('sermons')
  .select('id, title, pastor_id, date, duration, topic, cover_image, play_count, audio_url')
  .neq('topic', '__meta__');
if (error) throw new Error(error.message);

const byPastor = new Map();
for (const s of sermons) {
  if (!byPastor.has(s.pastor_id)) byPastor.set(s.pastor_id, []);
  byPastor.get(s.pastor_id).push(s);
}

// Prefer keeping: real date > cover image > plays > older row position.
function keeper(a, b) {
  const score = (s) =>
    (s.date && !s.date.startsWith('1970-') ? 4 : 0) +
    (s.cover_image ? 2 : 0) +
    (s.topic !== 'Archive' ? 1 : 0) +
    Math.min(s.play_count ?? 0, 1);
  return score(a) >= score(b) ? [a, b] : [b, a];
}

const confident = [];
const uncertain = [];
for (const list of byPastor.values()) {
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i], b = list[j];
      const na = norm(a.title), nb = norm(b.title);
      if (!na || !nb) continue;
      const d = editDistance(na, nb);
      if (d > 2) continue;
      const da = a.duration || 0, db = b.duration || 0;
      const durAgree = da > 0 && db > 0 ? Math.abs(da - db) / Math.max(da, db) <= 0.1 : null;
      const [keep, drop] = keeper(a, b);
      const pair = { keep: keep.title, drop: drop.title, dropId: drop.id, editDist: d, durA: da, durB: db };
      if (d === 0 || durAgree === true) confident.push(pair);
      else uncertain.push(pair);
    }
  }
}

console.log(`catalog: ${sermons.length} rows`);
console.log(`\nCONFIDENT duplicates (${confident.length}):`);
for (const p of confident) console.log(`  DROP "${p.drop}"  (keep "${p.keep}")  dur ${p.durA}s/${p.durB}s ed=${p.editDist}`);
console.log(`\nUNCERTAIN (${uncertain.length}) — not touched:`);
for (const p of uncertain) console.log(`  ? "${p.drop}" vs "${p.keep}"  dur ${p.durA}s/${p.durB}s ed=${p.editDist}`);

if (APPLY) {
  for (const p of confident) {
    const { error: dErr } = await supabase.from('sermons').delete().eq('id', p.dropId);
    console.log(dErr ? `FAILED delete ${p.drop}: ${dErr.message}` : `deleted: ${p.drop}`);
  }
}

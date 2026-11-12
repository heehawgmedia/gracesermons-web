// Dumps every sermon row that has audio to a JSON file, for the audio survey.
// Usage: node scripts/audio-cleanup/catalog.mjs <out.json>

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('created_at', { ascending: true })
    .range(from, from + 999);
  if (error) throw new Error(error.message);
  rows.push(...data);
  if (data.length < 1000) break;
}

const { data: pastors, error: pErr } = await supabase.from('pastors').select('id,name');
if (pErr) throw new Error(pErr.message);
const pastorName = Object.fromEntries(pastors.map((p) => [p.id, p.name]));

const out = rows
  .filter((r) => r.topic !== '__meta__')
  .map((r) => ({ ...r, pastor_name: pastorName[r.pastor_id] ?? '' }));

writeFileSync(process.argv[2], JSON.stringify(out, null, 1));
const topics = {};
for (const r of out) topics[r.topic ?? '(none)'] = (topics[r.topic ?? '(none)'] ?? 0) + 1;
console.log(out.length, 'rows');
console.log(topics);
console.log(Object.keys(out[0] ?? {}).join(', '));

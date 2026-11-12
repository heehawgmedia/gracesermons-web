// Diagnostic: compares live play counts with an earlier catalog snapshot and
// tests whether the play-count RPC and the fallback update actually persist.
// Usage: node scripts/audio-cleanup/playcheck.mjs <catalog.json> [--test]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
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

const old = new Map(JSON.parse(readFileSync(process.argv[2], 'utf8')).map((r) => [r.id, r]));
const { data, error } = await supabase.from('sermons').select('id,title,topic,play_count,created_at').limit(2000);
if (error) throw new Error(error.message);

const changed = data.filter((r) => old.has(r.id) && old.get(r.id).play_count !== r.play_count);
console.log('rows', data.length, '| changed since snapshot:', changed.length);
for (const r of changed.slice(0, 15)) console.log(' ', old.get(r.id).play_count, '->', r.play_count, r.title);
console.log('total plays', data.reduce((s, r) => s + (r.play_count || 0), 0));
console.log('\nTOP 15');
for (const r of [...data].sort((a, b) => (b.play_count || 0) - (a.play_count || 0)).slice(0, 15))
  console.log(' ', r.play_count, '|', r.topic, '|', r.title);
console.log('zero plays:', data.filter((r) => !r.play_count).length);

if (process.argv.includes('--test')) {
  const t = data.find((r) => r.topic === '__meta__') ?? data[0];
  const read = async () => (await supabase.from('sermons').select('play_count').eq('id', t.id).single()).data.play_count;
  const before = await read();
  const rpc = await supabase.rpc('increment_sermon_play_count', { sermon_uuid: t.id });
  const afterRpc = await read();
  console.log('\nRPC test on', t.title, '| error:', rpc.error?.message ?? 'none', '|', before, '->', afterRpc);
  // Put it back.
  if (afterRpc !== before) await supabase.from('sermons').update({ play_count: before }).eq('id', t.id);
  console.log('restored to', await read());
}

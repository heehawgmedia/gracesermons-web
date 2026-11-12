// Removes the effect of one test play made while verifying the Top 10:
// zeroes the given month's counter for a sermon and takes one play back off.
// Usage: node scripts/audio-cleanup/undo-test-play.mjs <sermon title fragment>

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

const { data: metas } = await supabase.from('sermons').select('id,title,play_count').like('title', '__pm__%');
console.log('monthly rows:', metas.map((m) => `${m.title}=${m.play_count}`));
for (const m of metas) {
  if (m.play_count !== 1) continue;
  const sermonId = m.title.split('__').pop();
  const { data: s } = await supabase.from('sermons').select('title,play_count').eq('id', sermonId).single();
  if (!s.title.includes(process.argv[2])) continue;
  await supabase.from('sermons').update({ play_count: 0 }).eq('id', m.id);
  await supabase.from('sermons').update({ play_count: s.play_count - 1 }).eq('id', sermonId);
  console.log('undone:', s.title, s.play_count, '->', s.play_count - 1);
}

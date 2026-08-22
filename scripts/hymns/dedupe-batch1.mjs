import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
const env = Object.fromEntries(readFileSync('.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>[l.slice(0,l.indexOf('=')).trim(), l.slice(l.indexOf('=')+1).trim()]));
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const REMOVE = ['Amazing Grace (Piano)', 'Amazing Grace (Lyre Harp)', 'The Old Rugged Cross (Piano)', 'Jesus Paid It All (Piano)'];
const { data: rows, error } = await sb.from('sermons').select('id,title,pastor_id,audio_url').eq('topic','Instrumental Hymn').in('title', REMOVE);
if (error) throw error;
console.log('matched', rows.length, 'rows');
for (const r of rows) {
  const path = decodeURIComponent(r.audio_url.split('/sermon-files/')[1]);
  const { error: se } = await sb.storage.from('sermon-files').remove([path]);
  console.log(`  storage rm ${path}: ${se ? 'ERR '+se.message : 'ok'}`);
  const { error: de } = await sb.from('sermons').delete().eq('id', r.id);
  console.log(`  row rm "${r.title}": ${de ? 'ERR '+de.message : 'ok'}`);
}
// orphan pastors (no sermons left)
for (const name of ['Gregor Quendel','PJArtist']) {
  const { data: p } = await sb.from('pastors').select('id').eq('name', name).maybeSingle();
  if (!p) continue;
  const { count } = await sb.from('sermons').select('id', { count: 'exact', head: true }).eq('pastor_id', p.id);
  if (count === 0) { const { error: pe } = await sb.from('pastors').delete().eq('id', p.id); console.log(`  pastor rm ${name}: ${pe ? 'ERR '+pe.message : 'ok'}`); }
  else console.log(`  pastor ${name} kept (${count} tracks)`);
}
const { data: left } = await sb.from('sermons').select('title').eq('topic','Instrumental Hymn').order('title');
console.log('\nremaining hymns:', left.length); console.log(left.map(x=>x.title).join('\n'));

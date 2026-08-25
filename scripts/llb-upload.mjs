// Stage B: upload done45.jsonl items — ensures pastor rows, skips (pastor,title,date) already on site.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, statSync } from 'node:fs';
const ROOT = 'C:/Users/garet/Projects/gracesermons-web/';
const HERE = 'C:/Users/garet/AppData/Local/Temp/claude/C--Users-garet--claude/f6a8a36b-2152-4563-87a6-a943cd19eafd/scratchpad/llb/';
const env = Object.fromEntries(readFileSync(ROOT + '.env', 'utf8').split('\n').filter((l) => l.includes('=') && !l.trim().startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'sermon-files';
const items = readFileSync(HERE + 'done45.jsonl', 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
console.log('items to upload:', items.length);
const pastorCache = new Map();
async function ensurePastor(name) {
  if (pastorCache.has(name)) return pastorCache.get(name);
  const { data: ex } = await sb.from('pastors').select('id').eq('name', name).maybeSingle();
  if (ex) { pastorCache.set(name, ex.id); return ex.id; }
  const initials = name.replace(/^(Bro\.?|Elder|Sis\.?)\s+/i, '').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
  const { data: c, error } = await sb.from('pastors').insert({ name, church: 'Lyons Landmark Baptist Church', location: '', bio: '', avatar_initials: initials, avatar_color: '#2D5A3D', avatar_url: null }).select('id').single();
  if (error) throw new Error(error.message);
  console.log('  created pastor:', name);
  pastorCache.set(name, c.id); return c.id;
}
const existing = new Set();
{ // preload existing (pastorName|title|date) for all sermons to make reruns cheap
  const { data: ps } = await sb.from('pastors').select('id,name');
  const byId = Object.fromEntries(ps.map((p) => [p.id, p.name]));
  const { data: ss } = await sb.from('sermons').select('title,pastor_id,date');
  for (const s of ss ?? []) existing.add(`${byId[s.pastor_id] ?? ''}|${s.title}|${s.date}`);
}
let up = 0, skip = 0, fail = 0;
for (const it of items) {
  const key = `${it.author}|${it.title}|${it.date}`;
  if (existing.has(key)) { skip++; continue; }
  try {
    const fileName = it.out.split('/').pop();
    const path = 'audio/llb/' + fileName;
    const buf = readFileSync(it.out);
    let r = await sb.storage.from(BUCKET).upload(path, buf, { contentType: 'audio/mpeg', upsert: true });
    if (r.error && /too large|payload|413|exceeds|body|entity/i.test(r.error.message ?? '')) {
      const { data: signed, error: se } = await sb.storage.from(BUCKET).createSignedUploadUrl(path, { upsert: true });
      if (se) throw new Error(se.message);
      const { error: pe } = await sb.storage.from(BUCKET).uploadToSignedUrl(signed.path, signed.token, buf, { contentType: 'audio/mpeg', upsert: true });
      if (pe) throw new Error(pe.message);
    } else if (r.error) throw new Error(r.error.message);
    const { data: urlData } = sb.storage.from(BUCKET).getPublicUrl(path);
    const pastorId = await ensurePastor(it.author);
    const { error: ie } = await sb.from('sermons').insert({ title: it.title, pastor_id: pastorId, series_id: null, date: it.date, duration: it.dur, scripture: '', topic: 'Church', description: 'From Lyons Landmark Baptist Church.', audio_url: urlData.publicUrl, cover_image: null });
    if (ie) throw new Error(ie.message);
    existing.add(key); up++;
    if (up % 20 === 0) console.log(`[up=${up} skip=${skip} fail=${fail}] ${(statSync(it.out).size / 1048576).toFixed(1)}MB ${it.title}`);
  } catch (e) { fail++; console.log('FAIL', it.title, '::', e.message); }
}
console.log(`stage B complete: uploaded=${up} skipped=${skip} failed=${fail}`);

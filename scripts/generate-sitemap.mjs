// Writes dist/sitemap.xml after `vite build` — static routes plus every
// sermon, series, and preacher page — so Google can find the SPA's content.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);
const sb = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const SITE = 'https://gracesermons.org';
const HIDDEN_TOPICS = new Set(['__meta__', 'Special Music', 'Instrumental Hymn']);

const [{ data: sermons, error: e1 }, { data: series, error: e2 }, { data: pastors, error: e3 }] =
  await Promise.all([
    sb.from('sermons').select('id,topic,date,created_at').order('date', { ascending: false }),
    sb.from('sermon_series').select('id'),
    sb.from('pastors').select('id'),
  ]);
if (e1 || e2 || e3) throw new Error((e1 ?? e2 ?? e3).message);

const today = new Date().toISOString().slice(0, 10);
const url = (path, lastmod, priority, changefreq) =>
  `  <url><loc>${SITE}${path}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;

const lines = [
  url('/', today, '1.0', 'daily'),
  url('/sermons', today, '0.9', 'daily'),
  url('/music', today, '0.7', 'weekly'),
  url('/devotional', today, '0.6', 'daily'),
  url('/bible', null, '0.5', 'monthly'),
  url('/reach', null, '0.4', 'weekly'),
  url('/support', null, '0.5', 'monthly'),
];
const sermonIds = new Set();
for (const s of sermons) {
  if (HIDDEN_TOPICS.has(s.topic)) continue;
  sermonIds.add(s.id);
  // lastmod = when the page was published (upload time), not the sermon's
  // recording date — Google rejects pre-1970 recording dates as "invalid".
  const d = (s.created_at ?? '').slice(0, 10) || today;
  lines.push(url(`/sermon/${s.id}`, d, '0.8', 'monthly'));
}
for (const s of series) lines.push(url(`/series/${s.id}`, null, '0.6', 'weekly'));
// Only preachers who actually have library sermons.
const { data: withSermons } = await sb.from('sermons').select('pastor_id,topic');
const active = new Set((withSermons ?? []).filter((r) => !HIDDEN_TOPICS.has(r.topic)).map((r) => r.pastor_id));
for (const p of pastors) if (active.has(p.id)) lines.push(url(`/pastor/${p.id}`, null, '0.5', 'monthly'));

const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines.join('\n')}\n</urlset>\n`;
const out = join(root, 'dist');
if (!existsSync(out)) mkdirSync(out, { recursive: true });
writeFileSync(join(out, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${lines.length} URLs (${sermonIds.size} sermons, ${series.length} series, ${active.size} preachers)`);

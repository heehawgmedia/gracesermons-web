// Pre-renders one small HTML file per sermon so link previews work.
//
// Facebook, X, WhatsApp and iMessage crawlers do NOT run JavaScript — they read
// the HTML they are served. A single-page app returns the same index.html for
// every route, so a shared sermon link shows nothing but the bare URL. This
// writes dist/sermon/<id>.html: the identical app bundle, with real Open Graph
// tags in the head. Crawlers read the tags; humans get the SPA as before.
//
// Runs after `vite build` (needs dist/index.html), so these files are created
// after the service-worker precache manifest is written and never bloat it.

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
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
const HIDDEN = new Set(['__meta__']);

// --- share image ------------------------------------------------------------
// Mirrors fallbackCover() in src/lib/images.ts so a sermon's preview picture
// matches the artwork already shown on its card. Ids are read from that file so
// the two cannot drift apart.
const imagesSrc = readFileSync(join(root, 'src/lib/images.ts'), 'utf8');
const poolBlock = imagesSrc.slice(
  imagesSrc.indexOf('const CARD_FALLBACKS'),
  imagesSrc.indexOf('].map((id)')
);
const POOL = [...poolBlock.matchAll(/'([0-9]+-[0-9a-f]+)'/g)].map((m) => m[1]);
if (POOL.length === 0) throw new Error('could not read CARD_FALLBACKS from images.ts');

function shareImage(sermon) {
  if (sermon.cover_image) return sermon.cover_image;
  let hash = 0;
  for (let i = 0; i < sermon.id.length; i++) hash = (hash * 31 + sermon.id.charCodeAt(i)) | 0;
  const id = POOL[Math.abs(hash) % POOL.length];
  // 1200x630 is the size Facebook and X render at full width.
  return `https://images.unsplash.com/photo-${id}?w=1200&h=630&q=80&auto=format&fit=crop`;
}

// --- formatting -------------------------------------------------------------
const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

function formatDate(date) {
  if (!date || date.startsWith('1970-')) return 'Archive';
  const iso = date.slice(0, 10);
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatDuration(sec) {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.round(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}

// --- head injection ---------------------------------------------------------
function buildHead({ title, description, url, image, audio, duration }) {
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="Grace Sermons" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:image" content="${esc(image)}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${esc(image)}" />`,
  ];
  if (audio) {
    tags.push(`<meta property="og:audio" content="${esc(audio)}" />`);
    tags.push(`<meta property="og:audio:type" content="audio/mpeg" />`);
  }
  if (duration) tags.push(`<meta property="music:duration" content="${duration}" />`);
  return tags.map((t) => '    ' + t).join('\n');
}

const template = readFileSync(join(root, 'dist/index.html'), 'utf8');

function render(meta) {
  // Strip the generic title/description so crawlers see exactly one of each.
  let html = template
    .replace(/\s*<title>[\s\S]*?<\/title>/, '')
    .replace(/\s*<meta\s+name="description"[\s\S]*?\/>/, '');
  return html.replace('</head>', `${buildHead(meta)}\n  </head>`);
}

// --- fetch ------------------------------------------------------------------
const [{ data: sermons, error: se }, { data: pastors, error: pe }] = await Promise.all([
  sb.from('sermons').select('id,title,topic,date,duration,description,audio_url,cover_image,pastor_id'),
  sb.from('pastors').select('id,name'),
]);
if (se || pe) throw new Error((se ?? pe).message);
const pastorName = Object.fromEntries(pastors.map((p) => [p.id, p.name]));

let written = 0;
mkdirSync(join(root, 'dist/sermon'), { recursive: true });

for (const s of sermons) {
  if (HIDDEN.has(s.topic)) continue;
  const preacher = pastorName[s.pastor_id] ?? 'Grace Sermons';
  const bits = [preacher, formatDate(s.date), formatDuration(s.duration)].filter(Boolean);
  const description = [bits.join(' · '), (s.description ?? '').trim()]
    .filter(Boolean)
    .join(' — ')
    .slice(0, 300);

  const html = render({
    title: s.title,
    description,
    url: `${SITE}/sermon/${s.id}`,
    image: shareImage(s),
    audio: s.audio_url,
    duration: s.duration || null,
  });
  writeFileSync(join(root, `dist/sermon/${s.id}.html`), html);
  written++;
}

// Site-level preview for the homepage itself.
writeFileSync(
  join(root, 'dist/index.html'),
  render({
    title: 'Grace Sermons — He Must Increase',
    description:
      'Christ-exalting Baptist sermons, devotionals, and worship — free to listen, anytime.',
    url: `${SITE}/`,
    image: `https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&q=80&auto=format&fit=crop`,
  })
);

console.log(`share pages: ${written} sermon previews + homepage`);

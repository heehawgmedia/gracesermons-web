// Bulk sermon uploader — uploads audio files to the sermon-files bucket and
// creates pastor/sermon rows, mirroring the admin UI's upload strategy
// (direct upload, signed-URL fallback for the gateway's payload cap).
//
// Usage: node scripts/bulk-upload.mjs <manifest.json>
// Manifest shape: [{ file, title, pastorName, newPastor?, date, duration }]

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  readFileSync(join(root, '.env'), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()])
);

const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
const BUCKET = 'sermon-files';

const manifest = JSON.parse(readFileSync(process.argv[2], 'utf8'));

function sanitize(name) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

async function uploadFile(path, buffer, contentType) {
  const direct = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (!direct.error) return;

  const msg = direct.error.message ?? '';
  if (!/too large|payload|413|exceeds|body|entity/i.test(msg)) throw new Error(msg);

  const { data: signed, error: signedError } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });
  if (signedError) throw new Error(signedError.message);
  const { error: putError } = await supabase.storage
    .from(BUCKET)
    .uploadToSignedUrl(signed.path, signed.token, buffer, { contentType, upsert: true });
  if (putError) throw new Error(putError.message);
}

async function ensurePastor(entry, cache) {
  const name = entry.pastorName;
  if (cache.has(name)) return cache.get(name);

  const { data: existing, error: qErr } = await supabase
    .from('pastors')
    .select('id')
    .eq('name', name)
    .maybeSingle();
  if (qErr) throw new Error(qErr.message);
  if (existing) {
    cache.set(name, existing.id);
    return existing.id;
  }

  const p = entry.newPastor ?? {};
  const { data: created, error: cErr } = await supabase
    .from('pastors')
    .insert({
      name,
      church: p.church ?? '',
      location: p.location ?? '',
      bio: p.bio ?? '',
      avatar_initials:
        p.initials ??
        name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
      avatar_color: p.color ?? '#2D5A3D',
      avatar_url: null,
    })
    .select('id')
    .single();
  if (cErr) throw new Error(cErr.message);
  console.log(`  created pastor: ${name}`);
  cache.set(name, created.id);
  return created.id;
}

const pastorCache = new Map();

for (const entry of manifest) {
  const fileName = sanitize(basename(entry.file));
  const storagePath = `${entry.folder ?? 'audio'}/${fileName}`;
  console.log(`\n${basename(entry.file)}`);

  const buffer = readFileSync(entry.file);
  console.log(`  uploading ${(buffer.length / 1024 / 1024).toFixed(1)} MB -> ${storagePath}`);
  await uploadFile(storagePath, buffer, entry.contentType ?? 'audio/mp4');

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const pastorId = await ensurePastor(entry, pastorCache);

  const { error: sErr } = await supabase.from('sermons').insert({
    title: entry.title,
    pastor_id: pastorId,
    series_id: null,
    date: entry.date,
    duration: entry.duration,
    scripture: entry.scripture ?? '',
    topic: entry.topic ?? '',
    description: entry.description ?? '',
    audio_url: urlData.publicUrl,
    cover_image: null,
  });
  if (sErr) throw new Error(sErr.message);
  console.log(`  sermon created: "${entry.title}"`);
}

console.log('\nAll done.');

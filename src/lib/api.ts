import { supabase, SERMON_FILES_BUCKET, UPLOAD_LIMIT_BYTES } from './supabase';
import type { Devotional, Pastor, Sermon, SermonSeries, StorageFileEntry } from './types';

// --- Formatting helpers -----------------------------------------------------

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '—';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// --- Row mappers ------------------------------------------------------------

function mapPastor(p: any): Pastor {
  return {
    id: p.id,
    name: p.name,
    church: p.church ?? '',
    location: p.location ?? '',
    bio: p.bio ?? '',
    avatarInitials: p.avatar_initials ?? '',
    avatarColor: p.avatar_color ?? '#1B4332',
    avatarUrl: p.avatar_url || null,
  };
}

function mapSermon(s: any): Sermon {
  return {
    id: s.id,
    title: s.title,
    pastorId: s.pastor_id,
    seriesId: s.series_id,
    date: s.date,
    duration: s.duration ?? 0,
    scripture: s.scripture ?? '',
    topic: s.topic ?? '',
    description: s.description ?? '',
    audioUrl: s.audio_url,
    coverImage: s.cover_image,
    playCount: s.play_count ?? 0,
  };
}

// --- Public fetchers --------------------------------------------------------

export async function fetchPastors(): Promise<Pastor[]> {
  const { data, error } = await supabase.from('pastors').select('*').order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapPastor);
}

export async function fetchSeries(): Promise<SermonSeries[]> {
  const { data, error } = await supabase
    .from('sermon_series')
    .select('*, sermons(count)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((s: any) => ({
    id: s.id,
    title: s.title,
    description: s.description ?? '',
    pastorId: s.pastor_id,
    sermonCount: s.sermons?.[0]?.count ?? 0,
    coverImage: s.cover_image || null,
  }));
}

export async function fetchSermons(): Promise<Sermon[]> {
  const { data, error } = await supabase
    .from('sermons')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSermon);
}

export async function fetchTodaysDevotionals(): Promise<Devotional[]> {
  const now = new Date();
  const { data, error } = await supabase
    .from('devotionals')
    .select('*')
    .eq('month', now.getMonth() + 1)
    .eq('day', now.getDate())
    .order('period');
  if (error) throw new Error(error.message);
  return (data ?? []).map((d: any) => ({
    id: d.id,
    month: d.month,
    day: d.day,
    period: d.period,
    verse: d.verse,
    scriptureText: d.scripture_text ?? '',
    body: d.body ?? '',
  }));
}

/** Best-effort play-count bump; must never disrupt playback. */
export async function incrementPlayCount(sermonId: string): Promise<void> {
  try {
    const { error } = await supabase.rpc('increment_sermon_play_count', {
      sermon_uuid: sermonId,
    });
    if (!error) return;
    const { data } = await supabase
      .from('sermons')
      .select('play_count')
      .eq('id', sermonId)
      .single();
    if (!data) return;
    await supabase
      .from('sermons')
      .update({ play_count: (data.play_count || 0) + 1 })
      .eq('id', sermonId);
  } catch {
    /* best effort */
  }
}

// --- Admin: sermons ---------------------------------------------------------

export interface SermonInput {
  title: string;
  pastor_id: string;
  series_id: string | null;
  date: string;
  duration: number;
  scripture: string;
  topic: string;
  description: string;
  audio_url: string | null;
  cover_image: string | null;
}

export async function createSermon(input: SermonInput): Promise<void> {
  const { error } = await supabase.from('sermons').insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSermon(id: string, input: Partial<SermonInput>): Promise<void> {
  const { error } = await supabase.from('sermons').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSermon(id: string): Promise<void> {
  const { error } = await supabase.from('sermons').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- Admin: pastors ---------------------------------------------------------

export interface PastorInput {
  name: string;
  church: string;
  location: string;
  bio: string;
  avatar_initials: string;
  avatar_color: string;
  avatar_url: string | null;
}

export async function createPastor(input: PastorInput): Promise<void> {
  const { error } = await supabase.from('pastors').insert(input);
  if (error) throw new Error(error.message);
}

export async function updatePastor(id: string, input: Partial<PastorInput>): Promise<void> {
  const { error } = await supabase.from('pastors').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deletePastor(id: string): Promise<void> {
  const { error } = await supabase.from('pastors').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- Admin: series ----------------------------------------------------------

export interface SeriesInput {
  title: string;
  description: string;
  pastor_id: string;
  cover_image: string | null;
}

export async function createSeries(input: SeriesInput): Promise<void> {
  const { error } = await supabase.from('sermon_series').insert(input);
  if (error) throw new Error(error.message);
}

export async function updateSeries(id: string, input: Partial<SeriesInput>): Promise<void> {
  const { error } = await supabase.from('sermon_series').update(input).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSeries(id: string): Promise<void> {
  const { error } = await supabase.from('sermon_series').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// --- Admin: storage ---------------------------------------------------------

export async function listStorageFiles(folder = ''): Promise<StorageFileEntry[]> {
  const { data, error } = await supabase.storage.from(SERMON_FILES_BUCKET).list(folder, {
    limit: 200,
    sortBy: { column: 'created_at', order: 'desc' },
  });
  if (error) throw new Error(error.message);
  return (data ?? [])
    .filter((f) => f.name && (f as any).id)
    .map((f) => {
      const path = folder ? `${folder}/${f.name}` : f.name;
      const { data: urlData } = supabase.storage.from(SERMON_FILES_BUCKET).getPublicUrl(path);
      return {
        name: f.name,
        path,
        size: (f.metadata as any)?.size ?? 0,
        mimeType: (f.metadata as any)?.mimetype ?? 'unknown',
        createdAt: f.created_at ?? '',
        publicUrl: urlData.publicUrl,
      };
    });
}

/**
 * Upload a file to the sermon-files bucket. Tries the direct SDK path first
 * and falls back to a signed upload URL when the gateway rejects the payload
 * size — same strategy the mobile app uses.
 */
export async function uploadStorageFile(
  file: File,
  folder = '',
  onProgress?: (pct: number) => void
): Promise<StorageFileEntry> {
  if (file.size > UPLOAD_LIMIT_BYTES) {
    throw new Error(`File too large. Maximum size is ${UPLOAD_LIMIT_BYTES / 1024 / 1024}MB.`);
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = folder ? `${folder}/${safeName}` : safeName;
  const contentType = file.type || 'application/octet-stream';

  onProgress?.(10);
  const direct = await supabase.storage
    .from(SERMON_FILES_BUCKET)
    .upload(path, file, { contentType, upsert: true });

  if (direct.error) {
    const msg = direct.error.message ?? '';
    const sizeIssue = /too large|payload|413|exceeds|body/i.test(msg);
    if (!sizeIssue) throw new Error(msg || 'Upload failed');

    onProgress?.(30);
    const { data: signed, error: signedError } = await supabase.storage
      .from(SERMON_FILES_BUCKET)
      .createSignedUploadUrl(path);
    if (signedError || !signed) {
      throw new Error(signedError?.message || 'Failed to create upload URL');
    }
    const { error: putError } = await supabase.storage
      .from(SERMON_FILES_BUCKET)
      .uploadToSignedUrl(signed.path, signed.token, file, { contentType, upsert: false });
    if (putError) throw new Error(putError.message);
  }

  onProgress?.(95);
  const { data: urlData } = supabase.storage.from(SERMON_FILES_BUCKET).getPublicUrl(path);
  onProgress?.(100);
  return {
    name: safeName,
    path,
    size: file.size,
    mimeType: contentType,
    createdAt: new Date().toISOString(),
    publicUrl: urlData.publicUrl,
  };
}

export async function deleteStorageFile(path: string): Promise<void> {
  const { error } = await supabase.storage.from(SERMON_FILES_BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export function formatFileSize(bytes: number): string {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

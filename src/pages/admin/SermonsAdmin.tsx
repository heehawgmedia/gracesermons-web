import { useState } from 'react';
import { createSermon, deleteSermon, formatDate, updateSermon, type SermonInput } from '../../lib/api';
import { useCatalog } from '../../lib/useCatalog';
import type { Sermon } from '../../lib/types';
import { FileUploader } from './FileUploader';
import { DangerButton, Field, inputClass, PrimaryButton } from './forms';

const EMPTY: SermonInput = {
  title: '',
  pastor_id: '',
  series_id: null,
  date: new Date().toISOString().slice(0, 10),
  duration: 0,
  scripture: '',
  topic: '',
  description: '',
  audio_url: null,
  cover_image: null,
};

export function SermonsAdmin() {
  const { sermons, pastors, series, pastorById, refresh } = useCatalog();
  const [editing, setEditing] = useState<Sermon | null>(null);
  const [form, setForm] = useState<SermonInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const open = (sermon?: Sermon) => {
    setStatus('');
    if (sermon) {
      setEditing(sermon);
      setForm({
        title: sermon.title,
        pastor_id: sermon.pastorId,
        series_id: sermon.seriesId,
        date: sermon.date?.slice(0, 10) ?? '',
        duration: sermon.duration,
        scripture: sermon.scripture,
        topic: sermon.topic,
        description: sermon.description,
        audio_url: sermon.audioUrl,
        cover_image: sermon.coverImage,
      });
    } else {
      setEditing(null);
      setForm({ ...EMPTY, pastor_id: pastors[0]?.id ?? '' });
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.title.trim() || !form.pastor_id) {
      setStatus('Title and preacher are required.');
      return;
    }
    setBusy(true);
    setStatus('');
    try {
      if (editing) {
        await updateSermon(editing.id, form);
      } else {
        await createSermon(form);
      }
      setForm(null);
      setEditing(null);
      refresh();
    } catch (err) {
      setStatus((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (sermon: Sermon) => {
    if (!window.confirm(`Delete “${sermon.title}”? This cannot be undone.`)) return;
    try {
      await deleteSermon(sermon.id);
      refresh();
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  if (form) {
    return (
      <form onSubmit={save} className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-forest-800">
            {editing ? 'Edit Sermon' : 'New Sermon'}
          </h2>
          <button type="button" onClick={() => setForm(null)} className="text-sm text-stone-500 hover:underline">
            ← Back to list
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Title">
            <input className={inputClass} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Preacher">
            <select className={inputClass} value={form.pastor_id} onChange={(e) => setForm({ ...form, pastor_id: e.target.value })}>
              <option value="">Select…</option>
              {pastors.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Series (optional)">
            <select
              className={inputClass}
              value={form.series_id ?? ''}
              onChange={(e) => setForm({ ...form, series_id: e.target.value || null })}
            >
              <option value="">None</option>
              {series.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </Field>
          <Field label="Date">
            <input type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          </Field>
          <Field label="Scripture (e.g. John 3:16-21)">
            <input className={inputClass} value={form.scripture} onChange={(e) => setForm({ ...form, scripture: e.target.value })} />
          </Field>
          <Field label="Topic">
            <input className={inputClass} value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
          </Field>
        </div>

        <Field label="Description">
          <textarea
            rows={3}
            className={inputClass}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">Sermon audio</p>
            {form.audio_url ? (
              <div className="rounded-xl border border-forest-100 bg-forest-50 p-3">
                <audio controls src={form.audio_url} className="w-full" preload="none" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, audio_url: null })}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Remove audio
                </button>
              </div>
            ) : (
              <FileUploader
                folder="audio"
                accept="audio/*"
                label="Upload sermon audio"
                onUploaded={(f) => {
                  setForm((prev) => prev && { ...prev, audio_url: f.publicUrl });
                  // Read the duration off the uploaded file automatically.
                  const probe = new Audio(f.publicUrl);
                  probe.addEventListener('loadedmetadata', () => {
                    if (Number.isFinite(probe.duration)) {
                      setForm((prev) => prev && { ...prev, duration: Math.round(probe.duration) });
                    }
                  });
                }}
              />
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold tracking-wide text-stone-500 uppercase">Cover image (optional)</p>
            {form.cover_image ? (
              <div className="rounded-xl border border-forest-100 bg-forest-50 p-3">
                <img src={form.cover_image} alt="" className="h-28 w-full rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cover_image: null })}
                  className="mt-2 text-xs text-red-600 hover:underline"
                >
                  Remove image
                </button>
              </div>
            ) : (
              <FileUploader
                folder="covers"
                accept="image/*"
                label="Upload cover image"
                onUploaded={(f) => setForm((prev) => prev && { ...prev, cover_image: f.publicUrl })}
              />
            )}
          </div>
        </div>

        {status && <p className="text-sm text-red-600">{status}</p>}
        <div className="flex gap-3">
          <PrimaryButton type="submit" disabled={busy}>
            {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Sermon'}
          </PrimaryButton>
        </div>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-forest-800">
          Sermons ({sermons.length})
        </h2>
        <PrimaryButton onClick={() => open()}>+ New Sermon</PrimaryButton>
      </div>
      <ul className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {sermons.map((sermon) => (
          <li key={sermon.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{sermon.title}</span>
              <span className="block truncate text-xs text-stone-500">
                {pastorById(sermon.pastorId)?.name} · {formatDate(sermon.date)}
                {!sermon.audioUrl && ' · ⚠ no audio'}
              </span>
            </span>
            <button onClick={() => open(sermon)} className="text-sm font-medium text-forest-600 hover:underline">
              Edit
            </button>
            <DangerButton onClick={() => void remove(sermon)}>Delete</DangerButton>
          </li>
        ))}
        {sermons.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-stone-400">No sermons yet.</li>
        )}
      </ul>
    </div>
  );
}

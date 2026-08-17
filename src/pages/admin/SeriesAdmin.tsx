import { useState } from 'react';
import { createSeries, deleteSeries, updateSeries, type SeriesInput } from '../../lib/api';
import { useCatalog } from '../../lib/useCatalog';
import type { SermonSeries } from '../../lib/types';
import { FileUploader } from './FileUploader';
import { DangerButton, Field, inputClass, PrimaryButton } from './forms';

export function SeriesAdmin() {
  const { series, pastors, pastorById, refresh } = useCatalog();
  const [editing, setEditing] = useState<SermonSeries | null>(null);
  const [form, setForm] = useState<SeriesInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const open = (s?: SermonSeries) => {
    setStatus('');
    if (s) {
      setEditing(s);
      setForm({
        title: s.title,
        description: s.description,
        pastor_id: s.pastorId,
        cover_image: s.coverImage,
      });
    } else {
      setEditing(null);
      setForm({ title: '', description: '', pastor_id: pastors[0]?.id ?? '', cover_image: null });
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
    try {
      if (editing) {
        await updateSeries(editing.id, form);
      } else {
        await createSeries(form);
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

  const remove = async (s: SermonSeries) => {
    if (!window.confirm(`Delete series “${s.title}”? Sermons in it are kept.`)) return;
    try {
      await deleteSeries(s.id);
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
            {editing ? 'Edit Series' : 'New Series'}
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
        </div>
        <Field label="Description">
          <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <div className="sm:w-1/2">
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
        {status && <p className="text-sm text-red-600">{status}</p>}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Series'}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-forest-800">
          Series ({series.length})
        </h2>
        <PrimaryButton onClick={() => open()}>+ New Series</PrimaryButton>
      </div>
      <ul className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {series.map((s) => (
          <li key={s.id} className="flex items-center gap-3 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{s.title}</span>
              <span className="block truncate text-xs text-stone-500">
                {pastorById(s.pastorId)?.name} · {s.sermonCount} sermon{s.sermonCount === 1 ? '' : 's'}
              </span>
            </span>
            <button onClick={() => open(s)} className="text-sm font-medium text-forest-600 hover:underline">
              Edit
            </button>
            <DangerButton onClick={() => void remove(s)}>Delete</DangerButton>
          </li>
        ))}
        {series.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-stone-400">No series yet.</li>
        )}
      </ul>
    </div>
  );
}

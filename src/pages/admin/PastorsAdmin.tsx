import { useState } from 'react';
import { createPastor, deletePastor, updatePastor, type PastorInput } from '../../lib/api';
import { useCatalog } from '../../lib/useCatalog';
import type { Pastor } from '../../lib/types';
import { DangerButton, Field, inputClass, PrimaryButton } from './forms';

const EMPTY: PastorInput = {
  name: '',
  church: '',
  location: '',
  bio: '',
  avatar_initials: '',
  avatar_color: '#1B4332',
  avatar_url: null,
};

export function PastorsAdmin() {
  const { pastors, refresh } = useCatalog();
  const [editing, setEditing] = useState<Pastor | null>(null);
  const [form, setForm] = useState<PastorInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const open = (p?: Pastor) => {
    setStatus('');
    if (p) {
      setEditing(p);
      setForm({
        name: p.name,
        church: p.church,
        location: p.location,
        bio: p.bio,
        avatar_initials: p.avatarInitials,
        avatar_color: p.avatarColor,
        avatar_url: p.avatarUrl,
      });
    } else {
      setEditing(null);
      setForm(EMPTY);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    if (!form.name.trim()) {
      setStatus('Name is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...form,
        avatar_initials:
          form.avatar_initials ||
          form.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
      };
      if (editing) {
        await updatePastor(editing.id, payload);
      } else {
        await createPastor(payload);
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

  const remove = async (p: Pastor) => {
    if (!window.confirm(`Delete ${p.name}? Their sermons will lose their preacher link.`)) return;
    try {
      await deletePastor(p.id);
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
            {editing ? 'Edit Preacher' : 'New Preacher'}
          </h2>
          <button type="button" onClick={() => setForm(null)} className="text-sm text-stone-500 hover:underline">
            ← Back to list
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name">
            <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Church">
            <input className={inputClass} value={form.church} onChange={(e) => setForm({ ...form, church: e.target.value })} />
          </Field>
          <Field label="Location">
            <input className={inputClass} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </Field>
          <Field label="Avatar color">
            <input
              type="color"
              className="h-11 w-full cursor-pointer rounded-xl border border-stone-300 bg-white px-2"
              value={form.avatar_color}
              onChange={(e) => setForm({ ...form, avatar_color: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Bio">
          <textarea rows={3} className={inputClass} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        {status && <p className="text-sm text-red-600">{status}</p>}
        <PrimaryButton type="submit" disabled={busy}>
          {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Preacher'}
        </PrimaryButton>
      </form>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-forest-800">
          Preachers ({pastors.length})
        </h2>
        <PrimaryButton onClick={() => open()}>+ New Preacher</PrimaryButton>
      </div>
      <ul className="mt-5 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {pastors.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-4 py-3">
            <span
              className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold text-white"
              style={{ backgroundColor: p.avatarColor }}
            >
              {p.avatarInitials}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{p.name}</span>
              <span className="block truncate text-xs text-stone-500">{p.church}</span>
            </span>
            <button onClick={() => open(p)} className="text-sm font-medium text-forest-600 hover:underline">
              Edit
            </button>
            <DangerButton onClick={() => void remove(p)}>Delete</DangerButton>
          </li>
        ))}
      </ul>
    </div>
  );
}

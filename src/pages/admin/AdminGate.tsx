import { useEffect, useState, type ReactNode } from 'react';

// PIN gate matching the mobile app's admin model (client-side only).
// NOTE: this protects the UI, not the data — real protection comes from
// database RLS policies. Flagged for a future upgrade to Supabase Auth.
const PIN_HASH_KEY = 'gs_admin_pin_hash';
const SESSION_KEY = 'gs_admin_session';
const SESSION_MS = 30 * 60 * 1000;

async function sha256(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function useAdminSession() {
  const [authed, setAuthed] = useState(() => {
    const t = Number(localStorage.getItem(SESSION_KEY) || 0);
    return Date.now() - t < SESSION_MS;
  });
  const touch = () => {
    localStorage.setItem(SESSION_KEY, String(Date.now()));
    setAuthed(true);
  };
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthed(false);
  };
  return { authed, touch, logout };
}

export function AdminGate({ children }: { children: ReactNode }) {
  const { authed, touch, logout } = useAdminSession();
  const [hasPin, setHasPin] = useState<boolean | null>(null);
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setHasPin(Boolean(localStorage.getItem(PIN_HASH_KEY)));
  }, []);

  if (hasPin === null) return null;

  if (authed) {
    return (
      <>
        <div className="mx-auto flex max-w-6xl justify-end px-4 pt-4 sm:px-6">
          <button onClick={logout} className="text-xs text-stone-400 hover:text-stone-600">
            Lock admin
          </button>
        </div>
        {children}
      </>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (pin.length < 4) {
      setError('PIN must be at least 4 digits.');
      return;
    }
    const hash = await sha256(pin);
    if (!hasPin) {
      if (pin !== confirm) {
        setError('PINs do not match.');
        return;
      }
      localStorage.setItem(PIN_HASH_KEY, hash);
      touch();
    } else if (hash === localStorage.getItem(PIN_HASH_KEY)) {
      touch();
    } else {
      setError('Incorrect PIN.');
    }
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-24">
      <h1 className="font-display text-center text-2xl font-semibold text-forest-800">
        {hasPin ? 'Admin Access' : 'Set Admin PIN'}
      </h1>
      <p className="mt-2 text-center text-sm text-stone-500">
        {hasPin
          ? 'Enter your PIN to manage sermons and files.'
          : 'First visit on this device — choose a PIN (4+ digits).'}
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          placeholder="PIN"
          autoFocus
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-forest-600"
        />
        {!hasPin && (
          <input
            type="password"
            inputMode="numeric"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm PIN"
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-forest-600"
          />
        )}
        {error && <p className="text-center text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full rounded-xl bg-forest-700 py-3 font-semibold text-white transition hover:bg-forest-600"
        >
          {hasPin ? 'Unlock' : 'Set PIN & Enter'}
        </button>
      </form>
    </div>
  );
}

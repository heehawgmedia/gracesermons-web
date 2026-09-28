import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { recentlyAdded } from '../lib/recent';

// Remembers the newest upload the visitor has already dismissed, so the banner
// stays gone until something newer than that is posted.
const KEY = 'gs_new_dismissed';

function readDismissed(): string {
  try {
    return localStorage.getItem(KEY) ?? '';
  } catch {
    return '';
  }
}

export function NewUploadsBanner() {
  const { sermons } = useCatalog();
  const [dismissed, setDismissed] = useState<string>('');

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const fresh = recentlyAdded(sermons);
  if (fresh.length === 0) return null;

  const newest = fresh[0].createdAt;
  if (dismissed && dismissed >= newest) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, newest);
    } catch {
      /* dismissal is best-effort */
    }
    setDismissed(newest);
  };

  const n = fresh.length;

  return (
    <div className="border-b border-gold-300/60 bg-gold-300/25">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:px-6">
        <span className="rounded-full bg-gold-400 px-2 py-0.5 text-[11px] font-bold tracking-wide text-forest-900 uppercase">
          New
        </span>
        <p className="min-w-0 flex-1 truncate text-sm text-forest-800">
          <span className="font-semibold">
            {n} new {n === 1 ? 'message' : 'messages'}
          </span>
          <span className="hidden sm:inline">
            {' '}
            — {n === 1 ? fresh[0].title : 'added this week'}
          </span>
        </p>
        <Link
          to="/sermons"
          className="shrink-0 rounded-full bg-forest-700 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-forest-600"
        >
          Listen
        </Link>
        <button
          onClick={dismiss}
          aria-label="Dismiss new message notice"
          className="grid size-7 shrink-0 place-items-center rounded-full text-forest-800/60 transition hover:bg-gold-300/60 hover:text-forest-800"
        >
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
            <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

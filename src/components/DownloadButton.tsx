import { useState } from 'react';
import type { Sermon } from '../lib/types';

interface Props {
  sermon: Sermon;
  pastorName: string;
  /** 'icon' = small round overlay button; 'labeled' = pill with text. */
  variant?: 'icon' | 'labeled';
}

type Phase = 'idle' | 'busy' | 'done' | 'error';

function fileNameFor(sermon: Sermon, pastorName: string): string {
  const ext = /\.(m4a|wav)(\?|$)/i.exec(sermon.audioUrl ?? '')?.[1]?.toLowerCase() ?? 'mp3';
  const raw = sermon.title.includes(pastorName) ? sermon.title : `${sermon.title} - ${pastorName}`;
  return `${raw.replace(/[\\/:*?"<>|]/g, '').trim()}.${ext}`;
}

export function DownloadButton({ sermon, pastorName, variant = 'icon' }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');

  const download = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!sermon.audioUrl || phase === 'busy') return;
    setPhase('busy');
    try {
      // The storage backend has no attachment endpoint, so fetch and save as
      // a blob — CORS on the bucket allows this origin.
      const res = await fetch(sermon.audioUrl);
      if (!res.ok) throw new Error(String(res.status));
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileNameFor(sermon, pastorName);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setPhase('done');
      setTimeout(() => setPhase('idle'), 2500);
    } catch {
      setPhase('error');
      setTimeout(() => setPhase('idle'), 2500);
    }
  };

  const title =
    phase === 'busy' ? 'Downloading…' : phase === 'done' ? 'Saved!' : phase === 'error' ? 'Download failed' : 'Download MP3';

  if (variant === 'labeled') {
    return (
      <button
        onClick={download}
        disabled={!sermon.audioUrl || phase === 'busy'}
        className="flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-forest-700 transition hover:border-forest-600 hover:bg-forest-50 disabled:opacity-60"
      >
        {phase === 'busy' ? <Spinner /> : <DownloadIcon className="size-4" />}
        {phase === 'busy' ? 'Downloading…' : phase === 'done' ? 'Saved!' : 'Download'}
      </button>
    );
  }

  return (
    <button
      onClick={download}
      aria-label={`Download ${sermon.title}`}
      title={title}
      disabled={!sermon.audioUrl}
      className="grid size-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55 disabled:opacity-40"
    >
      {phase === 'busy' ? (
        <Spinner />
      ) : phase === 'done' ? (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <DownloadIcon className="size-4" />
      )}
    </button>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
      <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  );
}

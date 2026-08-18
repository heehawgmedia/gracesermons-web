import { useState } from 'react';
import type { Sermon } from '../lib/types';

interface Props {
  sermon: Sermon;
  pastorName: string;
  /** 'icon' = small round overlay button; 'labeled' = pill with text. */
  variant?: 'icon' | 'labeled';
}

export function shareUrlFor(sermon: Sermon): string {
  return `${window.location.origin}/sermon/${sermon.id}`;
}

export function ShareButton({ sermon, pastorName, variant = 'icon' }: Props) {
  const [copied, setCopied] = useState(false);

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrlFor(sermon);
    const payload = {
      title: sermon.title,
      text: `${sermon.title} — ${pastorName} · Grace Sermons`,
      url,
    };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        // User dismissed the sheet, or share failed — fall through to copy.
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt('Copy link:', url);
    }
  };

  if (variant === 'labeled') {
    return (
      <button
        onClick={share}
        className="flex items-center gap-2 rounded-full border border-stone-300 px-5 py-2.5 text-sm font-semibold text-forest-700 transition hover:border-forest-600 hover:bg-forest-50"
      >
        <ShareIcon className="size-4" />
        {copied ? 'Link copied!' : 'Share'}
      </button>
    );
  }

  return (
    <button
      onClick={share}
      aria-label={`Share ${sermon.title}`}
      title={copied ? 'Link copied!' : 'Share'}
      className="grid size-9 place-items-center rounded-full bg-black/35 text-white backdrop-blur-sm transition hover:bg-black/55"
    >
      {copied ? (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <ShareIcon className="size-4" />
      )}
    </button>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="17.5" cy="5.5" r="2.6" />
      <circle cx="17.5" cy="18.5" r="2.6" />
      <path d="M8.4 10.8l6.8-4M8.4 13.2l6.8 4" strokeLinecap="round" />
    </svg>
  );
}

import { Link } from 'react-router-dom';
import { formatDate, formatDuration } from '../lib/api';
import { fallbackCover } from '../lib/images';
import type { Sermon } from '../lib/types';
import { usePlayer } from '../player/PlayerContext';
import { useCatalog } from '../lib/useCatalog';
import { ShareButton } from './ShareButton';
import { DownloadButton } from './DownloadButton';

interface Props {
  sermon: Sermon;
  pastorName: string;
  /** Queue the card belongs to (for continuous playback). */
  queue?: Sermon[];
  queueLabel?: string;
}

export function SermonCard({ sermon, pastorName, queue, queueLabel }: Props) {
  const player = usePlayer();
  const { downloadsFor, sharesFor } = useCatalog();
  const downloads = downloadsFor(sermon.id);
  const shares = sharesFor(sermon.id);
  const isCurrent = player.current?.id === sermon.id;
  const playable = Boolean(sermon.audioUrl);

  return (
    <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="relative aspect-[16/9] overflow-hidden">
        <img
          src={sermon.coverImage || fallbackCover(sermon.id)}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent" />
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <ShareButton sermon={sermon} pastorName={pastorName} />
          {playable && <DownloadButton sermon={sermon} pastorName={pastorName} />}
        </div>
        {playable && (
          <button
            onClick={() =>
              isCurrent ? player.toggle() : player.play(sermon, queue, queueLabel)
            }
            aria-label={`Play ${sermon.title}`}
            className="absolute right-3 bottom-3 grid size-11 place-items-center rounded-full bg-gold-400 text-forest-900 opacity-95 shadow-lg transition-transform hover:scale-105"
          >
            {isCurrent && player.isPlaying ? (
              <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
              </svg>
            ) : (
              <svg className="size-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
        <span className="absolute bottom-3 left-3 text-xs font-medium text-white/90">
          {formatDuration(sermon.duration)}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-display line-clamp-2 leading-snug font-semibold text-forest-800">
          <Link to={`/sermon/${sermon.id}`} className="hover:underline">
            {sermon.title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-stone-500">
          {pastorName} · {formatDate(sermon.date)}
          {(downloads > 0 || shares > 0) && (
            <span className="block text-xs text-stone-400">
              {downloads > 0 && `${downloads.toLocaleString()} download${downloads === 1 ? '' : 's'}`}
              {downloads > 0 && shares > 0 && ' · '}
              {shares > 0 && `${shares.toLocaleString()} share${shares === 1 ? '' : 's'}`}
            </span>
          )}
        </p>
        {sermon.scripture && (
          <p className="mt-1.5 text-xs font-medium text-gold-500">{sermon.scripture}</p>
        )}
      </div>
    </article>
  );
}

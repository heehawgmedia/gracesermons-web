import { Link } from 'react-router-dom';
import { PLAYBACK_RATES, usePlayer } from '../player/PlayerContext';
import { formatDuration } from '../lib/api';
import { fallbackCover } from '../lib/images';
import { ShareButton } from './ShareButton';

/** Persistent bottom playback bar, shown whenever a sermon is loaded. */
export function PlayerBar() {
  const player = usePlayer();
  const { current, isPlaying, position, duration, rate, queue, queueLabel } = player;

  if (!current) return null;

  const idx = queue.findIndex((s) => s.id === current.id);
  const pct = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;

  const cycleRate = () => {
    const next = PLAYBACK_RATES[(PLAYBACK_RATES.indexOf(rate) + 1) % PLAYBACK_RATES.length];
    player.setRate(next);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-stone-200 bg-white/95 shadow-[0_-4px_20px_rgb(0_0_0/0.08)] backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2 sm:px-6 sm:py-2.5">
        <div className="flex items-center gap-2.5 sm:gap-4">
          <img
            src={current.coverImage || fallbackCover(current.id)}
            alt=""
            className="size-10 shrink-0 rounded-lg object-cover sm:size-11"
          />

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              <Link to={`/sermon/${current.id}`} className="hover:underline">
                {current.title}
              </Link>
            </p>
            <p className="truncate text-[11px] text-stone-400">
              {player.pastorName(current)}
              {queueLabel && (
                <span className="hidden sm:inline">
                  {' '}
                  · {queueLabel} ({idx + 1}/{queue.length})
                </span>
              )}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-0.5 sm:gap-1.5">
            <div className="hidden sm:block [&>button]:bg-transparent [&>button]:text-stone-600 [&>button:hover]:bg-stone-100">
              <ShareButton sermon={current} pastorName={player.pastorName(current)} />
            </div>
            <button
              onClick={cycleRate}
              className="w-10 rounded-full border border-stone-300 px-1.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-100 sm:w-11 sm:px-2"
              aria-label="Playback speed"
            >
              {rate}x
            </button>
            <IconButton label="Back 15 seconds" onClick={() => player.seekBy(-15)}>
              <path d="M11 18V6l-8.5 6L11 18zm.5-6 8.5 6V6l-8.5 6z" />
            </IconButton>
            <button
              onClick={player.toggle}
              className="grid size-11 place-items-center rounded-full bg-forest-700 text-white shadow hover:bg-forest-600"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                </svg>
              ) : (
                <svg className="size-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <IconButton label="Forward 15 seconds" onClick={() => player.seekBy(15)}>
              <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" />
            </IconButton>
            <IconButton
              label="Next sermon"
              onClick={player.next}
              disabled={idx < 0 || idx >= queue.length - 1}
              className="hidden sm:grid"
            >
              <path d="M6 6l8 6-8 6V6zm10 0h2v12h-2z" />
            </IconButton>
            <IconButton label="Stop playback" onClick={player.stop}>
              <path d="M7 7h10v10H7z" />
            </IconButton>
          </div>
        </div>

        {/* Full-width seek row — easy to grab on a phone. */}
        <div className="mt-1.5 flex items-center gap-2 sm:mt-1">
          <span className="w-10 shrink-0 text-right text-[11px] tabular-nums text-stone-500">
            {formatDuration(position)}
          </span>
          <input
            type="range"
            className="player-seek"
            style={{ ['--seek-fill' as string]: `${pct}%` }}
            min={0}
            max={Math.max(duration, 1)}
            step={1}
            value={position}
            onChange={(e) => player.seekTo(Number(e.target.value))}
            aria-label="Seek"
          />
          <span className="w-10 shrink-0 text-[11px] tabular-nums text-stone-500">
            {formatDuration(duration)}
          </span>
        </div>
      </div>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  className,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${className ?? 'grid'} size-10 place-items-center rounded-full text-stone-600 hover:bg-stone-100 disabled:opacity-30 sm:size-9`}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
        {children}
      </svg>
    </button>
  );
}

import { useMemo, useState } from 'react';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';
import { useCatalog } from '../lib/useCatalog';
import { usePlayer } from '../player/PlayerContext';
import { formatDuration } from '../lib/api';
import type { Sermon } from '../lib/types';

// Hymn titles carry their arrangement style in a trailing parenthetical,
// e.g. "Amazing Grace (Strings)" → name "Amazing Grace", style "Strings".
function splitStyle(title: string): { name: string; style: string | null } {
  const m = title.match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  return m ? { name: m[1], style: m[2] } : { name: title, style: null };
}

function PlayGlyph({ playing }: { playing: boolean }) {
  return playing ? (
    <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
    </svg>
  ) : (
    <svg className="size-5 translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function Music() {
  const { music, hymns, pastorById, loading } = useCatalog();
  const player = usePlayer();
  const [styleFilter, setStyleFilter] = useState<string>('All');

  const styles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const h of hymns) {
      const { style } = splitStyle(h.title);
      if (style) counts.set(style, (counts.get(style) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([s]) => s);
  }, [hymns]);

  const shownHymns = useMemo(
    () =>
      styleFilter === 'All'
        ? hymns
        : hymns.filter((h) => splitStyle(h.title).style === styleFilter),
    [hymns, styleFilter]
  );

  const renderRow = (track: Sermon, queue: Sermon[], label: string, subtitle: string) => {
    const isCurrent = player.current?.id === track.id;
    const { name, style } = label === 'Instrumental Hymns' ? splitStyle(track.title) : { name: track.title, style: null };
    return (
      <li key={track.id}>
        <button
          onClick={() =>
            isCurrent ? player.toggle() : track.audioUrl && player.play(track, queue, label)
          }
          className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-forest-50"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold-400 text-forest-900">
            <PlayGlyph playing={isCurrent && player.isPlaying} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold">{name}</span>
              {style && (
                <span className="shrink-0 rounded-full bg-forest-50 px-2 py-0.5 text-[11px] font-medium text-forest-700">
                  {style}
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-stone-500">{subtitle}</span>
          </span>
          <span className="text-xs tabular-nums text-stone-400">{formatDuration(track.duration)}</span>
        </button>
      </li>
    );
  };

  return (
    <>
      <PageHero
        image={IMAGES.lake}
        title="Worship Music"
        subtitle="Special music from our services, and instrumental hymns of the faith."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        {music.length > 0 && (
          <>
            <h2 className="font-display mt-10 text-xl font-semibold text-forest-800">
              Special Music
            </h2>
            <ol className="mt-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              {music.map((track) =>
                renderRow(track, music, 'Special Music', pastorById(track.pastorId)?.name ?? '')
              )}
            </ol>
          </>
        )}

        <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-forest-800">Instrumental Hymns</h2>
            <p className="mt-1 text-xs text-stone-500">
              Royalty-free arrangements — the style of each is shown beside the title.
            </p>
          </div>
          {styles.length > 1 && (
            <div className="flex flex-wrap gap-1.5">
              {['All', ...styles].map((s) => (
                <button
                  key={s}
                  onClick={() => setStyleFilter(s)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    styleFilter === s
                      ? 'bg-forest-700 text-white'
                      : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-forest-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <ol className="mt-4 mb-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {shownHymns.map((track) =>
            renderRow(
              track,
              shownHymns,
              'Instrumental Hymns',
              pastorById(track.pastorId)?.name ?? ''
            )
          )}
          {!loading && shownHymns.length === 0 && (
            <li className="px-5 py-6 text-center text-sm text-stone-400">
              Hymns are being added — check back soon.
            </li>
          )}
        </ol>
      </div>
    </>
  );
}

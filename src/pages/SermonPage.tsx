import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { usePlayer } from '../player/PlayerContext';
import { formatDate, formatDuration } from '../lib/api';
import { fallbackCover } from '../lib/images';
import { SermonCard } from '../components/SermonCard';
import { ShareButton } from '../components/ShareButton';
import { DownloadButton } from '../components/DownloadButton';

/** Shareable landing page for a single message. */
export function SermonPage() {
  const { id = '' } = useParams();
  const { sermons, music, pastorById, seriesById, loading } = useCatalog();
  const player = usePlayer();

  const sermon = sermons.find((s) => s.id === id) ?? music.find((s) => s.id === id);
  const pastor = sermon ? pastorById(sermon.pastorId) : undefined;
  const series = sermon?.seriesId ? seriesById(sermon.seriesId) : undefined;
  const isCurrent = player.current?.id === sermon?.id;

  useEffect(() => {
    if (sermon) document.title = `${sermon.title} — Grace Sermons`;
    return () => {
      document.title = 'Grace Sermons — Christ Focused Sermons. Anytime.';
    };
  }, [sermon]);

  if (loading) return <p className="py-24 text-center text-stone-400">Loading…</p>;

  if (!sermon) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500">This message wasn&rsquo;t found.</p>
        <Link to="/sermons" className="mt-2 inline-block text-forest-600 hover:underline">
          ← Browse the library
        </Link>
      </div>
    );
  }

  const playable = sermons.filter((s) => s.audioUrl);
  const morePastorSermons = sermons
    .filter((s) => s.pastorId === sermon.pastorId && s.id !== sermon.id)
    .slice(0, 3);

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <img
          src={sermon.coverImage || fallbackCover(sermon.id)}
          alt=""
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-900/95 via-forest-900/60 to-forest-900/30" />
        <div className="mx-auto max-w-4xl px-4 pt-24 pb-12 sm:px-6 sm:pt-32">
          <p className="text-xs font-semibold tracking-widest text-gold-300 uppercase">
            {sermon.topic || 'Sermon'}
            {series ? ` · ${series.title}` : ''}
          </p>
          <h1 className="font-display mt-2 text-3xl leading-tight font-semibold text-white sm:text-4xl">
            {sermon.title}
          </h1>
          <p className="mt-3 text-sm text-stone-200">
            {pastor ? (
              <Link to={`/pastor/${pastor.id}`} className="font-medium text-gold-300 hover:underline">
                {pastor.name}
              </Link>
            ) : (
              'Grace Sermons'
            )}
            {' · '}
            {formatDate(sermon.date)}
            {' · '}
            {formatDuration(sermon.duration)}
          </p>
          {sermon.scripture && (
            <p className="mt-2 text-sm font-medium text-gold-300">{sermon.scripture}</p>
          )}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {sermon.audioUrl && (
              <button
                onClick={() =>
                  isCurrent ? player.toggle() : player.play(sermon, playable, 'All Sermons')
                }
                className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-forest-900 shadow-lg transition hover:bg-gold-300"
              >
                {isCurrent && player.isPlaying ? (
                  <>
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 5h4v14H7zM13 5h4v14h-4z" />
                    </svg>
                    Pause
                  </>
                ) : (
                  <>
                    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    {isCurrent ? 'Resume' : 'Listen Now'}
                  </>
                )}
              </button>
            )}
            <div className="[&>button]:border-white/40 [&>button]:text-white [&>button:hover]:bg-white/10 [&>button:hover]:border-white/60">
              <ShareButton sermon={sermon} pastorName={pastor?.name ?? 'Grace Sermons'} variant="labeled" />
            </div>
            <div className="[&>button]:border-white/40 [&>button]:text-white [&>button:hover]:bg-white/10 [&>button:hover]:border-white/60">
              <DownloadButton sermon={sermon} pastorName={pastor?.name ?? 'Grace Sermons'} variant="labeled" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        {sermon.description && (
          <p className="mt-8 max-w-2xl leading-relaxed text-stone-600">{sermon.description}</p>
        )}

        {morePastorSermons.length > 0 && (
          <>
            <h2 className="font-display mt-12 text-xl font-semibold text-forest-800">
              More from {pastor?.name}
            </h2>
            <div className="mt-5 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
              {morePastorSermons.map((s) => (
                <SermonCard
                  key={s.id}
                  sermon={s}
                  pastorName={pastor?.name ?? ''}
                  queue={playable}
                  queueLabel={pastor?.name ?? 'All Sermons'}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}

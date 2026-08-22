import { Link } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { usePlayer } from '../player/PlayerContext';
import { verseOfTheDay } from '../lib/verses';
import { IMAGES, fallbackCover } from '../lib/images';
import { SermonCard } from '../components/SermonCard';
import { formatDuration } from '../lib/api';

export function Home() {
  const { sermons, pastorById, loading, error } = useCatalog();
  const player = usePlayer();
  const verse = verseOfTheDay();

  const recent = sermons.slice(0, 8);
  // Top 10 by play count, ranked.
  const popular = [...sermons].sort((a, b) => b.playCount - a.playCount).slice(0, 10);
  const playable = sermons.filter((s) => s.audioUrl);

  return (
    <>
      {/* Hero */}
      <section className="relative isolate min-h-[420px] overflow-hidden sm:min-h-[520px]">
        <img
          src={IMAGES.hero}
          alt="Misty mountains at sunrise"
          className="absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-900/90 via-forest-900/40 to-black/20" />
        <div className="mx-auto flex max-w-6xl flex-col justify-end px-4 pt-32 pb-14 sm:px-6 sm:pt-44">
          <p className="text-xs font-semibold tracking-[0.25em] text-gold-300 uppercase">
            Christ Focused Sermons. Anytime.
          </p>
          <h1 className="font-display mt-3 max-w-2xl text-4xl leading-tight font-semibold text-white sm:text-5xl">
            Hear the Word. <span className="text-gold-300">Grow in Grace.</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-stone-200 sm:text-base">
            Baptist preaching, daily devotionals, and worship — gathered in one place and free
            to listen, anywhere you are.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {playable.length > 0 && (
              <button
                onClick={() =>
                  player.current?.id === playable[0].id
                    ? player.toggle()
                    : player.play(playable[0], playable, 'All Sermons')
                }
                className="flex items-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-semibold text-forest-900 shadow-lg transition hover:bg-gold-300"
              >
                <svg className="size-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Play Latest Sermon
              </button>
            )}
            <Link
              to="/sermons"
              className="rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Browse Library
            </Link>
          </div>
        </div>
      </section>

      {/* Verse of the day */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="-mt-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-lg sm:p-8">
          <p className="text-xs font-semibold tracking-widest text-gold-500 uppercase">
            Verse of the Day
          </p>
          <blockquote className="font-display mt-2 text-lg leading-relaxed text-forest-800 sm:text-xl">
            “{verse.text}”
          </blockquote>
          <p className="mt-2 text-sm font-medium text-stone-500">— {verse.ref} (KJV)</p>
        </div>
      </section>

      {loading && (
        <div className="py-24 text-center text-stone-400">Loading sermons…</div>
      )}
      {error && (
        <div className="mx-auto max-w-2xl py-24 text-center text-sm text-red-600">
          Couldn&rsquo;t reach the sermon library: {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Recently added */}
          <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-semibold text-forest-800">
                Recently Added
              </h2>
              <Link to="/sermons" className="text-sm font-medium text-forest-600 hover:underline">
                View all →
              </Link>
            </div>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {recent.map((sermon) => (
                <SermonCard
                  key={sermon.id}
                  sermon={sermon}
                  pastorName={pastorById(sermon.pastorId)?.name ?? ''}
                  queue={playable}
                  queueLabel="All Sermons"
                />
              ))}
            </div>
          </section>

          {/* Popular */}
          <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
            <h2 className="font-display text-2xl font-semibold text-forest-800">Top 10 Most Played</h2>
            <ol className="mt-6 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
              {popular.map((sermon, i) => (
                <li key={sermon.id}>
                  <button
                    onClick={() =>
                      player.current?.id === sermon.id
                        ? player.toggle()
                        : sermon.audioUrl && player.play(sermon, playable, 'Most Played')
                    }
                    className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-forest-50 sm:px-6"
                  >
                    <span className="font-display w-6 shrink-0 text-lg font-semibold text-gold-500">
                      {i + 1}
                    </span>
                    <img
                      src={sermon.coverImage || fallbackCover(sermon.id)}
                      alt=""
                      loading="lazy"
                      className="size-10 shrink-0 rounded-lg object-cover"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{sermon.title}</span>
                      <span className="block truncate text-xs text-stone-500">
                        {pastorById(sermon.pastorId)?.name} · {formatDuration(sermon.duration)}
                      </span>
                    </span>
                    <span className="hidden text-xs text-stone-400 sm:block">
                      {sermon.playCount.toLocaleString()} plays
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </section>

          {/* Devotional banner */}
          <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
            <Link
              to="/devotional"
              className="group relative block overflow-hidden rounded-2xl shadow-md"
            >
              <img
                src={IMAGES.forest}
                alt=""
                loading="lazy"
                className="h-56 w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-forest-900/85 to-forest-900/20" />
              <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10">
                <p className="text-xs font-semibold tracking-widest text-gold-300 uppercase">
                  Morning &amp; Evening
                </p>
                <h3 className="font-display mt-1 text-2xl font-semibold text-white">
                  Today&rsquo;s Devotional
                </h3>
                <p className="mt-1 max-w-md text-sm text-stone-200">
                  A daily reading from C.H. Spurgeon to anchor your walk — morning and evening.
                </p>
              </div>
            </Link>
          </section>
        </>
      )}
    </>
  );
}

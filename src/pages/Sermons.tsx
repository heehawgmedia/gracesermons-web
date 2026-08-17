import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { SermonCard } from '../components/SermonCard';
import { IMAGES, fallbackCover } from '../lib/images';

type Tab = 'sermons' | 'series' | 'pastors';

export function Sermons() {
  const { sermons, series, pastors, pastorById, loading, error } = useCatalog();
  const [tab, setTab] = useState<Tab>('sermons');
  const [query, setQuery] = useState('');
  const [pastorFilter, setPastorFilter] = useState('');

  const playable = useMemo(() => sermons.filter((s) => s.audioUrl), [sermons]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sermons.filter((s) => {
      if (pastorFilter && s.pastorId !== pastorFilter) return false;
      if (!q) return true;
      const pastor = pastorById(s.pastorId)?.name ?? '';
      return [s.title, s.scripture, s.topic, s.description, pastor]
        .join(' ')
        .toLowerCase()
        .includes(q);
    });
  }, [sermons, query, pastorFilter, pastorById]);

  return (
    <>
      <PageHero image={IMAGES.hills} title="Sermon Library" subtitle="Preaching that exalts Christ — searchable, streamable, free." />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Tabs */}
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {(
            [
              ['sermons', `Sermons (${sermons.length})`],
              ['series', `Series (${series.length})`],
              ['pastors', `Preachers (${pastors.length})`],
            ] as [Tab, string][]
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === key
                  ? 'bg-forest-700 text-white'
                  : 'border border-stone-300 text-stone-600 hover:bg-forest-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'sermons' && (
          <>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, scripture, topic, or preacher…"
                className="w-full rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100"
              />
              <select
                value={pastorFilter}
                onChange={(e) => setPastorFilter(e.target.value)}
                className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600"
              >
                <option value="">All preachers</option>
                {pastors.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {loading && <p className="py-20 text-center text-stone-400">Loading sermons…</p>}
            {error && <p className="py-20 text-center text-sm text-red-600">{error}</p>}
            {!loading && !error && (
              <div className="mt-8 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    pastorName={pastorById(sermon.pastorId)?.name ?? ''}
                    queue={playable}
                    queueLabel="All Sermons"
                  />
                ))}
                {filtered.length === 0 && (
                  <p className="col-span-full py-16 text-center text-stone-400">
                    No sermons match that search.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        {tab === 'series' && (
          <div className="mt-8 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {series.map((s) => (
              <Link
                key={s.id}
                to={`/series/${s.id}`}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative aspect-[16/8] overflow-hidden">
                  <img
                    src={s.coverImage || fallbackCover(s.id)}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent" />
                </div>
                <div className="p-4">
                  <h3 className="font-display font-semibold text-forest-800">{s.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">{s.description}</p>
                  <p className="mt-2 text-xs font-medium text-gold-500">
                    {s.sermonCount} sermon{s.sermonCount === 1 ? '' : 's'}
                  </p>
                </div>
              </Link>
            ))}
            {series.length === 0 && !loading && (
              <p className="col-span-full py-16 text-center text-stone-400">No series yet.</p>
            )}
          </div>
        )}

        {tab === 'pastors' && (
          <div className="mt-8 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastors.map((p) => (
              <Link
                key={p.id}
                to={`/pastor/${p.id}`}
                className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                {p.avatarUrl ? (
                  <img src={p.avatarUrl} alt="" className="size-14 rounded-full object-cover" />
                ) : (
                  <span
                    className="grid size-14 shrink-0 place-items-center rounded-full text-lg font-semibold text-white"
                    style={{ backgroundColor: p.avatarColor }}
                  >
                    {p.avatarInitials}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-forest-800">{p.name}</span>
                  <span className="block truncate text-sm text-stone-500">
                    {p.church}
                    {p.location ? ` · ${p.location}` : ''}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function PageHero({
  image,
  title,
  subtitle,
}: {
  image: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <img src={image} alt="" className="absolute inset-0 -z-10 size-full object-cover" />
      <div className="absolute inset-0 -z-10 bg-forest-900/70" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-sm text-stone-200 sm:text-base">{subtitle}</p>}
      </div>
    </section>
  );
}

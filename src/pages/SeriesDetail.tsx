import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { SermonCard } from '../components/SermonCard';
import { fallbackCover } from '../lib/images';
import { PageHero } from './Sermons';

export function SeriesDetail() {
  const { id = '' } = useParams();
  const { series, sermons, pastorById, loading } = useCatalog();
  const s = series.find((x) => x.id === id);
  const inSeries = sermons.filter((x) => x.seriesId === id);
  const playable = inSeries.filter((x) => x.audioUrl);

  if (loading) return <p className="py-24 text-center text-stone-400">Loading…</p>;
  if (!s) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500">Series not found.</p>
        <Link to="/sermons" className="mt-2 inline-block text-forest-600 hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHero
        image={s.coverImage || fallbackCover(s.id)}
        title={s.title}
        subtitle={`${pastorById(s.pastorId)?.name ?? ''} · ${inSeries.length} sermon${inSeries.length === 1 ? '' : 's'}`}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {s.description && <p className="mt-8 max-w-3xl text-stone-600">{s.description}</p>}
        <div className="mt-8 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {inSeries.map((sermon) => (
            <SermonCard
              key={sermon.id}
              sermon={sermon}
              pastorName={pastorById(sermon.pastorId)?.name ?? ''}
              queue={playable}
              queueLabel={s.title}
            />
          ))}
          {inSeries.length === 0 && (
            <p className="col-span-full py-16 text-center text-stone-400">
              No sermons in this series yet.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

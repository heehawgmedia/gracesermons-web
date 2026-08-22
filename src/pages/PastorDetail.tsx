import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/useCatalog';
import { SermonCard } from '../components/SermonCard';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

export function PastorDetail() {
  const { id = '' } = useParams();
  const { pastors, sermons, loading } = useCatalog();
  const pastor = pastors.find((p) => p.id === id);
  const preached = sermons.filter((s) => s.pastorId === id);
  const playable = preached.filter((s) => s.audioUrl);

  if (loading) return <p className="py-24 text-center text-stone-400">Loading…</p>;
  if (!pastor) {
    return (
      <div className="py-24 text-center">
        <p className="text-stone-500">Preacher not found.</p>
        <Link to="/sermons" className="mt-2 inline-block text-forest-600 hover:underline">
          ← Back to library
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHero
        image={IMAGES.valley}
        title={pastor.name}
        subtitle={[pastor.church, pastor.location].filter(Boolean).join(' · ')}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {pastor.bio && <p className="mt-8 max-w-3xl leading-relaxed text-stone-600">{pastor.bio}</p>}
        <h2 className="font-display mt-10 text-xl font-semibold text-forest-800">
          Sermons ({preached.length})
        </h2>
        <div className="mt-6 grid gap-6 pb-4 sm:grid-cols-2 lg:grid-cols-3">
          {preached.map((sermon) => (
            <SermonCard
              key={sermon.id}
              sermon={sermon}
              pastorName={pastor.name}
              queue={playable}
              queueLabel={pastor.name}
            />
          ))}
        </div>
      </div>
    </>
  );
}

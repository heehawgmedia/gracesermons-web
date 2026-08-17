import { useEffect, useState } from 'react';
import { fetchTodaysDevotionals } from '../lib/api';
import type { Devotional as Devo } from '../lib/types';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

export function Devotional() {
  const [devotionals, setDevotionals] = useState<Devo[]>([]);
  const [period, setPeriod] = useState<'morning' | 'evening'>(
    new Date().getHours() < 17 ? 'morning' : 'evening'
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodaysDevotionals()
      .then(setDevotionals)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const current = devotionals.find((d) => d.period === period) ?? devotionals[0];
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <>
      <PageHero
        image={IMAGES.forest}
        title="Morning & Evening"
        subtitle={`Daily devotionals by C.H. Spurgeon · ${today}`}
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mt-8 flex justify-center gap-2">
          {(['morning', 'evening'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-5 py-2 text-sm font-medium capitalize transition ${
                period === p
                  ? 'bg-forest-700 text-white'
                  : 'border border-stone-300 text-stone-600 hover:bg-forest-50'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {loading && <p className="py-20 text-center text-stone-400">Loading devotional…</p>}
        {error && <p className="py-20 text-center text-sm text-red-600">{error}</p>}

        {!loading && !error && current && (
          <article className="mt-8 mb-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
            <p className="text-xs font-semibold tracking-widest text-gold-500 uppercase">
              {current.period} · C.H. Spurgeon
            </p>
            <h2 className="font-display mt-2 text-2xl font-semibold text-forest-800">
              {current.verse}
            </h2>
            {current.scriptureText && (
              <blockquote className="mt-4 border-l-4 border-gold-400 pl-4 text-stone-600 italic">
                “{current.scriptureText}”
              </blockquote>
            )}
            <div className="mt-6 space-y-4 leading-relaxed whitespace-pre-line text-stone-700">
              {current.body}
            </div>
          </article>
        )}

        {!loading && !error && !current && (
          <p className="py-20 text-center text-stone-400">
            No devotional found for today — check back soon.
          </p>
        )}
      </div>
    </>
  );
}

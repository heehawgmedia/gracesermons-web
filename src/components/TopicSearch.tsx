import { useMemo, useState } from 'react';
import { useCatalog } from '../lib/useCatalog';
import { SUBJECTS, searchSermons, sermonsOnSubject } from '../lib/topics';
import { SermonCard } from './SermonCard';

const PAGE = 4;

/** Home page search: type a keyword or tap a subject to get suggested messages. */
export function TopicSearch() {
  const { sermons, pastorById, seriesById } = useCatalog();
  const [query, setQuery] = useState('');
  const [subject, setSubject] = useState<string | null>(null);
  const [shown, setShown] = useState(PAGE);

  const playable = useMemo(() => sermons.filter((s) => s.audioUrl), [sermons]);

  // Only offer subjects the library can actually answer.
  const subjects = useMemo(
    () =>
      SUBJECTS.map((s) => ({ ...s, matches: sermonsOnSubject(playable, s) })).filter(
        (s) => s.matches.length >= 3
      ),
    [playable]
  );

  const results = useMemo(() => {
    if (subject) return subjects.find((s) => s.label === subject)?.matches ?? [];
    return searchSermons(
      playable,
      query,
      (s) => pastorById(s.pastorId)?.name ?? '',
      (s) => (s.seriesId ? seriesById(s.seriesId)?.title ?? '' : '')
    ).map((h) => h.sermon);
  }, [subject, subjects, playable, query, pastorById, seriesById]);

  const active = subject !== null || query.trim().length > 1;
  const label = subject ?? query.trim();

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
      <h2 className="font-display text-2xl font-semibold text-forest-800">Find a Message</h2>
      <p className="mt-1 text-sm text-stone-500">
        Search for a subject, a preacher or a passage — or tap one below.
      </p>

      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSubject(null);
          setShown(PAGE);
        }}
        placeholder="Try “grace”, “prayer”, “Romans”…"
        aria-label="Search messages"
        className="mt-5 w-full rounded-full border border-stone-300 bg-white px-5 py-3 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-100"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {subjects.map((s) => {
          const on = subject === s.label;
          return (
            <button
              key={s.label}
              onClick={() => {
                setSubject(on ? null : s.label);
                setQuery('');
                setShown(PAGE);
              }}
              aria-pressed={on}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-colors ${
                on
                  ? 'bg-forest-700 text-white'
                  : 'bg-forest-50 text-forest-700 hover:bg-forest-100'
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {active && (
        <div className="mt-6">
          {results.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 bg-white p-6 text-sm text-stone-500">
              No messages found for “{label}”. Try a different word, or a preacher&rsquo;s name.
            </p>
          ) : (
            <>
              <p className="text-sm text-stone-500">
                {results.length} {results.length === 1 ? 'message' : 'messages'} for “{label}”
              </p>
              <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {results.slice(0, shown).map((sermon) => (
                  <SermonCard
                    key={sermon.id}
                    sermon={sermon}
                    pastorName={pastorById(sermon.pastorId)?.name ?? ''}
                    queue={results}
                    queueLabel={label}
                  />
                ))}
              </div>
              {results.length > shown && (
                <button
                  onClick={() => setShown(shown + PAGE * 2)}
                  className="mt-6 rounded-full border border-forest-700 px-5 py-2.5 text-sm font-semibold text-forest-700 transition hover:bg-forest-50"
                >
                  Show more
                </button>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

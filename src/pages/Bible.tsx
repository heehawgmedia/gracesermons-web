import { useEffect, useState } from 'react';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

// KJV book list with chapter counts (66 books).
const BOOKS: [string, number][] = [
  ['Genesis', 50], ['Exodus', 40], ['Leviticus', 27], ['Numbers', 36], ['Deuteronomy', 34],
  ['Joshua', 24], ['Judges', 21], ['Ruth', 4], ['1 Samuel', 31], ['2 Samuel', 24],
  ['1 Kings', 22], ['2 Kings', 25], ['1 Chronicles', 29], ['2 Chronicles', 36],
  ['Ezra', 10], ['Nehemiah', 13], ['Esther', 10], ['Job', 42], ['Psalms', 150],
  ['Proverbs', 31], ['Ecclesiastes', 12], ['Song of Solomon', 8], ['Isaiah', 66],
  ['Jeremiah', 52], ['Lamentations', 5], ['Ezekiel', 48], ['Daniel', 12], ['Hosea', 14],
  ['Joel', 3], ['Amos', 9], ['Obadiah', 1], ['Jonah', 4], ['Micah', 7], ['Nahum', 3],
  ['Habakkuk', 3], ['Zephaniah', 3], ['Haggai', 2], ['Zechariah', 14], ['Malachi', 4],
  ['Matthew', 28], ['Mark', 16], ['Luke', 24], ['John', 21], ['Acts', 28], ['Romans', 16],
  ['1 Corinthians', 16], ['2 Corinthians', 13], ['Galatians', 6], ['Ephesians', 6],
  ['Philippians', 4], ['Colossians', 4], ['1 Thessalonians', 5], ['2 Thessalonians', 3],
  ['1 Timothy', 6], ['2 Timothy', 4], ['Titus', 3], ['Philemon', 1], ['Hebrews', 13],
  ['James', 5], ['1 Peter', 5], ['2 Peter', 3], ['1 John', 5], ['2 John', 1], ['3 John', 1],
  ['Jude', 1], ['Revelation', 22],
];

interface VerseLine {
  verse: number;
  text: string;
}

export function Bible() {
  const [bookIdx, setBookIdx] = useState(18); // Psalms
  const [chapter, setChapter] = useState(23);
  const [verses, setVerses] = useState<VerseLine[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [bookName, chapterCount] = BOOKS[bookIdx];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    // bible-api.com serves KJV with CORS enabled.
    fetch(`https://bible-api.com/${encodeURIComponent(`${bookName} ${chapter}`)}?translation=kjv`)
      .then((r) => {
        if (!r.ok) throw new Error(`Could not load ${bookName} ${chapter}`);
        return r.json();
      })
      .then((data) => {
        if (cancelled) return;
        setVerses(
          (data.verses ?? []).map((v: any) => ({ verse: v.verse, text: String(v.text).trim() }))
        );
      })
      .catch((e: Error) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [bookName, chapter]);

  return (
    <>
      <PageHero image={IMAGES.wheat} title="Read the Bible" subtitle="King James Version" />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <select
            value={bookIdx}
            onChange={(e) => {
              setBookIdx(Number(e.target.value));
              setChapter(1);
            }}
            className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600"
          >
            {BOOKS.map(([name], i) => (
              <option key={name} value={i}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={chapter}
            onChange={(e) => setChapter(Number(e.target.value))}
            className="rounded-full border border-stone-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-forest-600"
          >
            {Array.from({ length: chapterCount }, (_, i) => i + 1).map((c) => (
              <option key={c} value={c}>
                Chapter {c}
              </option>
            ))}
          </select>
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => chapter > 1 && setChapter(chapter - 1)}
              disabled={chapter <= 1}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-forest-50 disabled:opacity-30"
            >
              ← Prev
            </button>
            <button
              onClick={() => chapter < chapterCount && setChapter(chapter + 1)}
              disabled={chapter >= chapterCount}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-600 hover:bg-forest-50 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </div>

        <article className="mt-8 mb-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-10">
          <h2 className="font-display text-2xl font-semibold text-forest-800">
            {bookName} {chapter}
          </h2>
          {loading && <p className="py-12 text-center text-stone-400">Loading chapter…</p>}
          {error && <p className="py-12 text-center text-sm text-red-600">{error}</p>}
          {!loading && !error && (
            <div className="mt-5 space-y-2.5 leading-relaxed text-stone-700">
              {verses.map((v) => (
                <p key={v.verse}>
                  <sup className="mr-1.5 text-[11px] font-semibold text-gold-500">{v.verse}</sup>
                  {v.text}
                </p>
              ))}
            </div>
          )}
        </article>
      </div>
    </>
  );
}

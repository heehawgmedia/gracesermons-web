import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  category: 'hymns' | 'praise';
}

// Worship catalog carried over from the app. Tracks play once audio files are
// added to the library — titles alone are listed until then.
const TRACKS: MusicTrack[] = [
  { id: 'amazing-grace', title: 'Amazing Grace', artist: 'John Newton', category: 'hymns' },
  { id: 'how-great-thou-art', title: 'How Great Thou Art', artist: 'Carl Boberg', category: 'hymns' },
  { id: 'blessed-assurance', title: 'Blessed Assurance', artist: 'Fanny Crosby', category: 'hymns' },
  { id: 'it-is-well', title: 'It Is Well With My Soul', artist: 'Horatio Spafford', category: 'hymns' },
  { id: 'great-is-thy-faithfulness', title: 'Great Is Thy Faithfulness', artist: 'Thomas Chisholm', category: 'hymns' },
  { id: 'old-rugged-cross', title: 'The Old Rugged Cross', artist: 'George Bennard', category: 'hymns' },
  { id: 'rock-of-ages', title: 'Rock of Ages', artist: 'Augustus Toplady', category: 'hymns' },
  { id: 'be-thou-my-vision', title: 'Be Thou My Vision', artist: 'Irish Hymn', category: 'hymns' },
  { id: 'holy-holy-holy', title: 'Holy, Holy, Holy', artist: 'Reginald Heber', category: 'hymns' },
  { id: 'a-mighty-fortress', title: 'A Mighty Fortress Is Our God', artist: 'Martin Luther', category: 'hymns' },
  { id: 'what-a-friend', title: 'What a Friend We Have in Jesus', artist: 'Joseph Scriven', category: 'hymns' },
  { id: 'come-thou-fount', title: 'Come, Thou Fount of Every Blessing', artist: 'Robert Robinson', category: 'hymns' },
];

export function Music() {
  return (
    <>
      <PageHero
        image={IMAGES.lake}
        title="Worship Music"
        subtitle="Hymns of the faith — audio coming soon."
      />
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <ol className="mt-10 mb-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {TRACKS.map((t) => (
            <li key={t.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-forest-50 text-forest-700">
                <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
                </svg>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{t.title}</span>
                <span className="block truncate text-xs text-stone-500">{t.artist}</span>
              </span>
              <span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] font-medium text-stone-500">
                Coming soon
              </span>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}

import type { Sermon } from './types';

// Subjects offered as one-tap suggestions on the home page search. Each lists
// word beginnings looked for in a message's title and scripture reference
// ("justif" finds Justified and Justification).
export interface Subject {
  label: string;
  stems: string[];
}

export const SUBJECTS: Subject[] = [
  { label: 'Salvation', stems: ['salvation', 'saved', 'save', 'gospel', 'redemption', 'redeem', 'justif', 'born again', 'repent', 'conversion', 'sinner', 'lost', 'atone'] },
  { label: 'Grace', stems: ['grace', 'mercy', 'election', 'elect', 'sovereign', 'predestin', 'chosen', 'providence of'] },
  { label: 'Jesus Christ', stems: ['christ', 'jesus', 'saviour', 'savior', 'lamb', 'cross', 'calvary', 'messiah', 'redeemer', 'surety', 'intercession'] },
  { label: 'Faith', stems: ['faith', 'believ', 'trust', 'assurance', 'confidence'] },
  { label: 'Prayer', stems: ['pray', 'intercess', 'supplication'] },
  { label: 'The Church', stems: ['the church', 'church member', 'church discipline', 'baptism', 'baptists', 'baptist adjectives', 'supper', 'pastor', 'member', 'missions', 'great commission', 'bride'] },
  { label: 'Christian Living', stems: ['living', 'walk', 'holiness', 'holy', 'sanctif', 'discipl', 'obedien', 'honest', 'witness', 'serv', 'steward', 'growing', 'growth'] },
  { label: 'Family', stems: ['marriage', 'husband', 'wife', 'wives', 'home', 'family', 'children', 'father', 'mother', 'parent'] },
  { label: 'Comfort in Trials', stems: ['suffer', 'comfort', 'trial', 'afflict', 'discourage', 'storm', 'sorrow', 'trouble', 'burden', 'peace', 'rest', 'hope'] },
  { label: 'Prophecy', stems: ['revelation', 'coming', 'judgment', 'prophec', 'millenni', 'antichrist', 'tribulation', 'signs', 'throne', 'last days', 'dying age'] },
  { label: 'Heaven & Hell', stems: ['heaven', 'hell', 'eternal', 'eternity', 'resurrection', 'death', 'dying', 'glory', 'lazarus'] },
  { label: 'Sin & Repentance', stems: ['sin', 'sins', 'repent', 'pride', 'backslid', 'tempt', 'wrath', 'fool', 'false'] },
  { label: 'The Bible', stems: ['bible', 'scripture', 'word of god', 'the word', 'doctrine', 'inspiration'] },
  { label: 'Church History', stems: ['history', 'trail of blood', 'baptists', 'martyr', 'reformation'] },
];

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const startsWord = (stem: string) => new RegExp(`\\b${escape(stem)}`, 'i');

export interface SearchHit {
  sermon: Sermon;
  score: number;
}

/**
 * Messages matching every word typed, best first. A word may match the title,
 * preacher, scripture, series or description; title matches count most.
 */
export function searchSermons(
  sermons: Sermon[],
  query: string,
  pastorName: (s: Sermon) => string,
  seriesTitle: (s: Sermon) => string
): SearchHit[] {
  const words = query.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return [];
  const tests = words.map(startsWord);
  const hits: SearchHit[] = [];
  for (const sermon of sermons) {
    const fields: [string, number][] = [
      [sermon.title, 10],
      [sermon.scripture ?? '', 6],
      [pastorName(sermon), 5],
      [seriesTitle(sermon), 4],
      [sermon.topic ?? '', 3],
      [sermon.description ?? '', 1],
    ];
    let score = 0;
    let all = true;
    for (const t of tests) {
      const best = Math.max(0, ...fields.map(([text, weight]) => (t.test(text) ? weight : 0)));
      if (best === 0) {
        all = false;
        break;
      }
      score += best;
    }
    if (all) hits.push({ sermon, score });
  }
  return hits.sort((a, b) => b.score - a.score || b.sermon.playCount - a.sermon.playCount);
}

/** Messages on a subject: any of its word beginnings in the title or scripture. */
export function sermonsOnSubject(sermons: Sermon[], subject: Subject): Sermon[] {
  const tests = subject.stems.map(startsWord);
  return sermons
    .map((sermon) => {
      const text = `${sermon.title} ${sermon.scripture ?? ''}`;
      return { sermon, score: tests.filter((t) => t.test(text)).length };
    })
    .filter((h) => h.score > 0)
    .sort((a, b) => b.score - a.score || b.sermon.playCount - a.sermon.playCount)
    .map((h) => h.sermon);
}

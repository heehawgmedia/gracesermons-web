// YouTube hymn videos shown on the Hymns page, newest first.
// To add one: paste its id (the part after watch?v= in the link) and a title.

export interface HymnVideo {
  id: string;
  title: string;
  /** Arrangement style, shown as a badge. */
  style?: string;
}

export const HYMN_VIDEOS: HymnVideo[] = [
  { id: '2mSkoTjLCLQ', title: 'It Is Well with My Soul', style: 'Bluegrass' },
];

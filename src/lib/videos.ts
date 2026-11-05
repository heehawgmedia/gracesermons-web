// YouTube hymn videos shown on the Hymns page, newest first.
// To add one: paste its id (the part after watch?v= in the link) and a title.

export interface HymnVideo {
  id: string;
  title: string;
  /** Arrangement style, shown as a badge. */
  style?: string;
}

export const HYMN_VIDEOS: HymnVideo[] = [
  { id: 'rJBbl3OAc2A', title: 'I Need Thee Every Hour', style: 'Country Gospel' },
  { id: 'HeJQM8a6ItE', title: 'Be Still, My Soul', style: 'Country Gospel' },
  { id: 'PhkjuRJbQZo', title: 'What a Friend We Have in Jesus', style: 'Country Gospel' },
  { id: 'HJKlnmYfOoI', title: 'He Leadeth Me', style: 'Country Gospel' },
  { id: 'l73OL-3X6j0', title: 'Leaning on the Everlasting Arms', style: 'Country Gospel' },
  { id: 'iIM5pm7W4oY', title: 'Come, Thou Fount of Every Blessing', style: 'Classic' },
  { id: 'adkshxQ76Lo', title: 'O Worship the King', style: 'Country Gospel' },
  { id: 'LrgPN6y3g5U', title: 'Man of Sorrows! What a Name', style: 'Country Gospel' },
  { id: 'SXsC1JuM_Xw', title: 'Be Thou My Vision', style: 'Acoustic' },
  { id: '2mSkoTjLCLQ', title: 'It Is Well with My Soul', style: 'Bluegrass' },
];

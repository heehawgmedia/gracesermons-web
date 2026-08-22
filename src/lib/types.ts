// Domain types mirroring the Supabase schema shared with the mobile app.

export interface Pastor {
  id: string;
  name: string;
  church: string;
  location: string;
  bio: string;
  avatarInitials: string;
  avatarColor: string;
  avatarUrl: string | null;
}

export interface SermonSeries {
  id: string;
  title: string;
  description: string;
  pastorId: string;
  sermonCount: number;
  coverImage: string | null;
}

export interface Sermon {
  id: string;
  title: string;
  pastorId: string;
  seriesId: string | null;
  date: string;
  duration: number;
  scripture: string;
  topic: string;
  description: string;
  audioUrl: string | null;
  coverImage: string | null;
  playCount: number;
  /** Row creation time (upload) — drives "Recently Added". */
  createdAt: string;
}

// Spurgeon's Morning & Evening — keyed by month/day + period.
export interface Devotional {
  id: string;
  month: number;
  day: number;
  period: 'morning' | 'evening';
  verse: string;
  scriptureText: string;
  body: string;
}

export interface StorageFileEntry {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt: string;
  publicUrl: string;
}

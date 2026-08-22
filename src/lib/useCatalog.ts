import { createContext, useContext } from 'react';
import type { Pastor, Sermon, SermonSeries } from './types';

/** Sermon catalog (sermons + pastors + series) fetched once and shared. */
export interface Catalog {
  sermons: Sermon[];
  /** Rows tagged topic "Special Music" — shown on the Music page, not the library. */
  music: Sermon[];
  /** Rows tagged topic "Instrumental Hymn" — royalty-free hymn instrumentals on the Music page. */
  hymns: Sermon[];
  pastors: Pastor[];
  series: SermonSeries[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  pastorById: (id: string) => Pastor | undefined;
  seriesById: (id: string) => SermonSeries | undefined;
  /** Times a message was downloaded (from hidden metric rows). */
  downloadsFor: (sermonId: string) => number;
  /** Times a message was shared. */
  sharesFor: (sermonId: string) => number;
  /** Visits per ISO-3166 alpha-2 country code, for the reach map. */
  countries: Record<string, number>;
}

export const CatalogContext = createContext<Catalog | null>(null);

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

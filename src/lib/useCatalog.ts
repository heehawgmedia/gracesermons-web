import { createContext, useContext } from 'react';
import type { Pastor, Sermon, SermonSeries } from './types';

/** Sermon catalog (sermons + pastors + series) fetched once and shared. */
export interface Catalog {
  sermons: Sermon[];
  pastors: Pastor[];
  series: SermonSeries[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
  pastorById: (id: string) => Pastor | undefined;
  seriesById: (id: string) => SermonSeries | undefined;
}

export const CatalogContext = createContext<Catalog | null>(null);

export function useCatalog(): Catalog {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}

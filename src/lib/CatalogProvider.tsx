import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { fetchPastors, fetchSeries, fetchSermons } from './api';
import { CatalogContext, type Catalog } from './useCatalog';
import type { Pastor, Sermon, SermonSeries } from './types';
import { usePlayer } from '../player/PlayerContext';

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [pastors, setPastors] = useState<Pastor[]>([]);
  const [series, setSeries] = useState<SermonSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { registerPastorNames } = usePlayer();

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchSermons(), fetchPastors(), fetchSeries()])
      .then(([s, p, ss]) => {
        setSermons(s);
        setPastors(p);
        setSeries(ss);
        registerPastorNames(Object.fromEntries(p.map((x) => [x.id, x.name])));
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [registerPastorNames]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<Catalog>(
    () => ({
      sermons: sermons.filter((s) => s.topic !== 'Special Music' && s.topic !== '__meta__'),
      music: sermons.filter((s) => s.topic === 'Special Music'),
      pastors,
      series,
      loading,
      error,
      refresh,
      pastorById: (id) => pastors.find((p) => p.id === id),
      seriesById: (id) => series.find((s) => s.id === id),
    }),
    [sermons, pastors, series, loading, error, refresh]
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

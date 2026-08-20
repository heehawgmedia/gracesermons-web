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

  const value = useMemo<Catalog>(() => {
    // Hidden metric rows ride along in the same fetch: __dl__<id>, __sh__<id>,
    // __country_XX__ — their play_count is the metric value.
    const downloads = new Map<string, number>();
    const shares = new Map<string, number>();
    const countries: Record<string, number> = {};
    for (const s of sermons) {
      if (s.topic !== '__meta__') continue;
      let m = s.title.match(/^__dl__(.+)$/);
      if (m) downloads.set(m[1], (downloads.get(m[1]) ?? 0) + s.playCount);
      else if ((m = s.title.match(/^__sh__(.+)$/)))
        shares.set(m[1], (shares.get(m[1]) ?? 0) + s.playCount);
      else if ((m = s.title.match(/^__country_([A-Z]{2})__$/)))
        countries[m[1]] = (countries[m[1]] ?? 0) + s.playCount;
    }
    return {
      sermons: sermons.filter((s) => s.topic !== 'Special Music' && s.topic !== '__meta__'),
      music: sermons.filter((s) => s.topic === 'Special Music'),
      pastors,
      series,
      loading,
      error,
      refresh,
      pastorById: (id) => pastors.find((p) => p.id === id),
      seriesById: (id) => series.find((s) => s.id === id),
      downloadsFor: (id) => downloads.get(id) ?? 0,
      sharesFor: (id) => shares.get(id) ?? 0,
      countries,
    };
  }, [sermons, pastors, series, loading, error, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

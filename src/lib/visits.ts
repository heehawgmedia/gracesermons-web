import { useEffect, useState } from 'react';
import { supabase } from './supabase';
import { detectCountry, recordCountry } from './metrics';

// The visit counter lives in a hidden sermons row (topic "__meta__") so it can
// use the backend's atomic increment_sermon_play_count RPC — no new tables,
// no lost updates. Counted once per browser session, along with a
// country-level (never personal) mark for the Global Reach map.

const SESSION_KEY = 'gs_visit_recorded';

export function useVisitCount(): number | null {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from('sermons')
          .select('id, play_count')
          .eq('topic', '__meta__')
          .eq('title', '__site_visits__')
          .limit(1);
        const row = data?.[0];
        if (!row) return;
        let current = row.play_count ?? 0;
        if (!sessionStorage.getItem(SESSION_KEY)) {
          sessionStorage.setItem(SESSION_KEY, '1');
          const { error } = await supabase.rpc('increment_sermon_play_count', {
            sermon_uuid: row.id,
          });
          if (!error) current += 1;
          // Fire-and-forget country mark for the reach map.
          void detectCountry().then((iso2) => {
            if (iso2) void recordCountry(iso2);
          });
        }
        if (!cancelled) setCount(current);
      } catch {
        // The counter is decorative — never let it break the page.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return count;
}

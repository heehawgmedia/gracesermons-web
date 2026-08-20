import { supabase } from './supabase';

// Site metrics live as shadow rows in `sermons` (topic '__meta__', hidden from
// the catalog) and count via the atomic play-count RPC:
//   '__site_visits__'      — total visits (see visits.ts)
//   '__country_XX__'       — visits from ISO country XX
//   '__dl__<sermonId>'     — downloads of one message
//   '__sh__<sermonId>'     — shares of one message
// Rows are created lazily on first use; a creation race just means the loser
// re-reads the winner's row.

async function bumpMeta(title: string): Promise<void> {
  try {
    const find = () =>
      supabase.from('sermons').select('id').eq('title', title).eq('topic', '__meta__').limit(1);
    let { data } = await find();
    let id = data?.[0]?.id;
    if (!id) {
      const { data: pastors } = await supabase.from('pastors').select('id').limit(1);
      const { data: created, error } = await supabase
        .from('sermons')
        .insert({
          title,
          pastor_id: pastors![0].id,
          series_id: null,
          date: '1970-01-01',
          duration: 0,
          scripture: '',
          topic: '__meta__',
          description: 'Internal metric counter. Do not delete.',
          audio_url: null,
          cover_image: null,
        })
        .select('id')
        .single();
      if (error) {
        ({ data } = await find());
        id = data?.[0]?.id;
      } else {
        id = created.id;
      }
    }
    if (id) await supabase.rpc('increment_sermon_play_count', { sermon_uuid: id });
  } catch {
    /* metrics are best-effort, never user-visible failures */
  }
}

export const recordDownload = (sermonId: string) => bumpMeta(`__dl__${sermonId}`);
export const recordShare = (sermonId: string) => bumpMeta(`__sh__${sermonId}`);
export const recordCountry = (iso2: string) => bumpMeta(`__country_${iso2}__`);

/** Country of the current visitor via free geo APIs (country-level only). */
export async function detectCountry(): Promise<string | null> {
  try {
    const r = await fetch('https://api.country.is', { signal: AbortSignal.timeout(4000) });
    if (r.ok) {
      const { country } = await r.json();
      if (/^[A-Z]{2}$/.test(country)) return country;
    }
  } catch {
    /* try fallback */
  }
  try {
    const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
    if (r.ok) {
      const j = await r.json();
      if (/^[A-Z]{2}$/.test(j.country_code)) return j.country_code;
    }
  } catch {
    /* give up quietly */
  }
  return null;
}

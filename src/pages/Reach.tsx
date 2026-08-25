import { useMemo } from 'react';
import { geoNaturalEarth1, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';
import worldData from 'world-atlas/countries-110m.json';
import { useCatalog } from '../lib/useCatalog';
import { useVisitCount } from '../lib/visits';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

// world-atlas names that differ from Intl.DisplayNames output.
const NAME_ALIASES: Record<string, string> = {
  'United States': 'United States of America',
  'Dominican Republic': 'Dominican Rep.',
  'Democratic Republic of the Congo': 'Dem. Rep. Congo',
  'Congo - Kinshasa': 'Dem. Rep. Congo',
  'Congo - Brazzaville': 'Congo',
  'Central African Republic': 'Central African Rep.',
  'South Sudan': 'S. Sudan',
  'Bosnia & Herzegovina': 'Bosnia and Herz.',
  'Myanmar (Burma)': 'Myanmar',
  'Côte d’Ivoire': "Côte d'Ivoire",
  'Equatorial Guinea': 'Eq. Guinea',
  'Solomon Islands': 'Solomon Is.',
  'Falkland Islands': 'Falkland Is.',
  'Timor-Leste': 'Timor-Leste',
  Czechia: 'Czechia',
};

function mapNameFor(iso2: string): string {
  const display = regionNames.of(iso2) ?? iso2;
  return NAME_ALIASES[display] ?? display;
}

const FLAG_OFFSET = 0x1f1e6 - 65;
const flagFor = (iso2: string) =>
  String.fromCodePoint(...[...iso2].map((c) => c.charCodeAt(0) + FLAG_OFFSET));

export default function Reach() {
  const { countries, sermons, downloadsFor, sharesFor, loading } = useCatalog();
  const visits = useVisitCount();

  const { paths, width, height } = useMemo(() => {
    const world = worldData as unknown as Topology<{ countries: GeometryCollection }>;
    const fc = feature(world, world.objects.countries) as unknown as FeatureCollection<Geometry, { name: string }>;
    // Natural Earth merges French Guiana (South America) into the France shape;
    // keep only France's European rings so a visit from France doesn't light up
    // a patch of South America.
    for (const f of fc.features) {
      if (f.properties.name === 'France' && f.geometry.type === 'MultiPolygon') {
        f.geometry.coordinates = f.geometry.coordinates.filter((poly) => poly[0][0][0] > -30);
      }
    }
    const w = 960;
    const h = 500;
    const projection = geoNaturalEarth1().fitSize([w, h], { type: 'Sphere' } as never);
    const path = geoPath(projection);
    return {
      width: w,
      height: h,
      paths: fc.features.map((f) => ({ name: f.properties.name, d: path(f) ?? '' })),
    };
  }, []);

  const reached = useMemo(() => {
    const highlighted = new Map<string, number>();
    for (const [iso2, count] of Object.entries(countries)) {
      highlighted.set(mapNameFor(iso2), count);
    }
    return highlighted;
  }, [countries]);

  const maxCount = Math.max(1, ...reached.values());
  const rows = Object.entries(countries).sort((a, b) => b[1] - a[1]);
  const totals = useMemo(
    () => ({
      downloads: sermons.reduce((n, s) => n + downloadsFor(s.id), 0),
      shares: sermons.reduce((n, s) => n + sharesFor(s.id), 0),
    }),
    [sermons, downloadsFor, sharesFor]
  );

  return (
    <>
      <PageHero
        image={IMAGES.aurora}
        title="Gospel Reach Map"
        subtitle="Where these messages are being heard around the world."
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <blockquote className="mt-8 text-center text-sm text-stone-500 italic">
          “Go ye into all the world, and preach the gospel to every creature.” — Mark 16:15
        </blockquote>

        {/* Stat tiles */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(
            [
              ['Countries reached', rows.length],
              ['Total visits', visits ?? '—'],
              ['Messages downloaded', totals.downloads],
              ['Messages shared', totals.shares],
            ] as [string, number | string][]
          ).map(([label, val]) => (
            <div key={label} className="rounded-2xl border border-stone-200 bg-white p-4 text-center shadow-sm">
              <div className="font-display text-2xl font-semibold text-forest-800">
                {typeof val === 'number' ? val.toLocaleString() : val}
              </div>
              <div className="mt-1 text-xs tracking-wide text-stone-500 uppercase">{label}</div>
            </div>
          ))}
        </div>

        {/* World map */}
        <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-5">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="World map of visitor countries">
            {paths.map((p) => {
              const count = reached.get(p.name) ?? 0;
              const intensity = count > 0 ? 0.35 + 0.65 * (count / maxCount) : 0;
              return (
                <path
                  key={p.name}
                  d={p.d}
                  fill={count > 0 ? `rgba(212, 160, 82, ${intensity.toFixed(2)})` : '#EDF2EE'}
                  stroke="#CBD8CF"
                  strokeWidth={0.5}
                >
                  <title>{count > 0 ? `${p.name}: ${count.toLocaleString()} visits` : p.name}</title>
                </path>
              );
            })}
          </svg>
          <p className="mt-2 text-center text-xs text-stone-400">
            Gold countries have visited Grace Sermons · darker gold means more visits · country-level only, nothing personal is stored
          </p>
        </div>

        {/* Country table */}
        {loading && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-stone-400">Loading…</p>
        )}
        {rows.length > 0 && (
          <ol className="mt-8 mb-4 divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {rows.map(([iso2, count]) => (
              <li key={iso2} className="flex items-center gap-4 px-5 py-3">
                <span className="text-xl leading-none">{flagFor(iso2)}</span>
                <span className="flex-1 text-sm font-medium">{regionNames.of(iso2) ?? iso2}</span>
                <span className="text-sm tabular-nums text-stone-500">
                  {count.toLocaleString()} visit{count === 1 ? '' : 's'}
                </span>
              </li>
            ))}
          </ol>
        )}
        {!loading && rows.length === 0 && (
          <p className="py-10 text-center text-sm text-stone-400">
            The map begins filling in as visitors arrive.
          </p>
        )}
      </div>
    </>
  );
}

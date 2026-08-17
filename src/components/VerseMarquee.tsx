import { VERSES } from '../lib/verses';

/**
 * Slim scrolling banner of KJV verses across the very top of the page.
 * The verse list is rendered twice so the -50% translation loops seamlessly.
 */
export function VerseMarquee() {
  const items = VERSES.map((v) => `“${v.text}” — ${v.ref}`);
  return (
    <div className="overflow-hidden bg-forest-900 text-gold-300" aria-hidden="true">
      <div className="marquee-track flex w-max items-center gap-12 py-1.5 pr-12">
        {[...items, ...items].map((text, i) => (
          <span key={i} className="text-xs whitespace-nowrap tracking-wide">
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

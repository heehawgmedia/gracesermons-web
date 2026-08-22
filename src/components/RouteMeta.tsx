import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE = 'https://gracesermons.org';
const DEFAULT_TITLE = 'Grace Sermons — Christ Focused Sermons. Anytime.';
const DEFAULT_DESC =
  'Grace Sermons — Christ-focused Baptist sermons, devotionals, and worship. Listen anytime.';

// Per-route <title> / description for search engines and browser tabs.
// Sermon pages set their own title once the sermon loads (SermonPage.tsx).
const META: Record<string, { title: string; desc: string }> = {
  '/': { title: DEFAULT_TITLE, desc: DEFAULT_DESC },
  '/sermons': {
    title: 'Sermon Library — Grace Sermons',
    desc: 'Browse hundreds of Baptist sermons by preacher, series, and topic. Free to stream and download.',
  },
  '/music': {
    title: 'Worship Music & Instrumental Hymns — Grace Sermons',
    desc: 'Special music from our services and royalty-free instrumental hymns — piano, strings, and guitar arrangements.',
  },
  '/devotional': {
    title: 'Daily Devotional — Grace Sermons',
    desc: "Morning and evening devotional readings from C.H. Spurgeon to anchor your walk each day.",
  },
  '/bible': {
    title: 'Read the Bible (KJV) — Grace Sermons',
    desc: 'Read the King James Bible online, book by book and chapter by chapter.',
  },
  '/reach': {
    title: 'Gospel Reach Map — Grace Sermons',
    desc: 'See the countries where Grace Sermons messages are being heard around the world.',
  },
  '/support': {
    title: 'Support Grace Sermons',
    desc: 'Give a one-time or monthly gift to help keep Christ-focused preaching free for everyone.',
  },
};

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

export function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    const path = pathname.replace(/\/+$/, '') || '/';
    const m = META[path];
    // Detail pages (sermon/series/pastor) manage their own titles; leave them be.
    if (m) {
      document.title = m.title;
      setMeta('description', m.desc);
    } else if (!/^\/(sermon|series|pastor)\//.test(path)) {
      document.title = DEFAULT_TITLE;
      setMeta('description', DEFAULT_DESC);
    }
    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = SITE + (path === '/' ? '/' : path);
  }, [pathname]);
  return null;
}

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayer } from '../player/PlayerContext';

/** Floating button that appears after scrolling down; sits above the player bar. */
export function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { current } = usePlayer();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // New page, fresh start — don't inherit the previous page's scroll position.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Back to top"
      className={`fixed right-5 z-40 grid size-12 place-items-center rounded-full bg-forest-700 text-white shadow-lg transition hover:bg-forest-600 ${
        current ? 'bottom-24' : 'bottom-6'
      }`}
    >
      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-6 6m6-6l6 6" />
      </svg>
    </button>
  );
}

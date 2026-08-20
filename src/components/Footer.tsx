import { Link } from 'react-router-dom';
import { useVisitCount } from '../lib/visits';

export function Footer() {
  const visits = useVisitCount();
  return (
    <footer className="mt-20 border-t border-stone-200 bg-forest-900 text-stone-300">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <img src="/cross.svg" alt="" className="size-8 rounded-lg" />
            <span className="font-display text-lg font-semibold text-white">Grace Sermons</span>
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-stone-400">
            Christ-focused Baptist sermons, devotionals, and worship — free to listen, anytime.
          </p>
          <p className="mt-4 text-sm">
            <a href="mailto:contact@gracesermons.org" className="text-gold-300 hover:text-gold-400">
              contact@gracesermons.org
            </a>
          </p>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-gold-400 uppercase">Listen</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link to="/sermons" className="hover:text-white">All Sermons</Link></li>
            <li><Link to="/devotional" className="hover:text-white">Daily Devotional</Link></li>
            <li><Link to="/bible" className="hover:text-white">Read the Bible</Link></li>
            <li><Link to="/music" className="hover:text-white">Worship Music</Link></li>
            <li><Link to="/reach" className="hover:text-white">Global Reach</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-semibold tracking-widest text-gold-400 uppercase">Support</h3>
          <p className="mt-3 text-sm text-stone-400">
            Your giving keeps these sermons free for everyone.
          </p>
          <Link
            to="/support"
            className="mt-3 inline-block rounded-full bg-gold-400 px-5 py-2 text-sm font-semibold text-forest-900 transition hover:bg-gold-300"
          >
            Support Online
          </Link>
          <p className="mt-6 text-xs text-stone-500">
            &ldquo;Faith cometh by hearing, and hearing by the word of God.&rdquo; — Romans 10:17
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-stone-500">
        {/* The copyright itself is the (unadvertised) door to the admin area. */}
        <Link to="/admin" className="cursor-default">
          © {new Date().getFullYear()} Grace Sermons
        </Link>
        {visits !== null && <> · {visits.toLocaleString()} visits</>}
      </div>
    </footer>
  );
}

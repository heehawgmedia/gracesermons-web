import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/sermons', label: 'Sermons' },
  { to: '/devotional', label: 'Devotional' },
  { to: '/bible', label: 'Bible' },
  { to: '/music', label: 'Music' },
  { to: '/reach', label: 'Reach Map' },
  { to: '/support', label: 'Support' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition-colors ${
      isActive ? 'bg-forest-700 text-white' : 'text-stone-600 hover:bg-forest-50 hover:text-forest-700'
    }`;

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/cross.svg" alt="" className="size-8 rounded-lg" />
          <div className="leading-tight">
            <span className="font-display text-lg font-semibold text-forest-800">
              Grace Sermons
            </span>
            <span className="hidden text-[11px] tracking-widest text-gold-500 uppercase sm:block">
              Christ Focused. Anytime.
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <button
          className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
          aria-expanded={open}
        >
          <svg className="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            {open ? (
              <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <nav className="flex flex-col gap-1 border-t border-stone-200 px-4 py-3 md:hidden">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={linkClass}
              end={item.to === '/'}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

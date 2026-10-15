import { useState } from 'react';
import { createPortal } from 'react-dom';
import { promptInstall, useCanPrompt } from '../lib/installPrompt';

const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
// iPadOS reports itself as a Mac; touch support gives it away.
const isIOS =
  /iPhone|iPad|iPod/.test(ua) ||
  (/Macintosh/.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1);
const isAndroid = /Android/.test(ua);
// Links opened from Facebook/Instagram land in their built-in browser, which
// cannot install apps — the visitor has to open the page in Safari or Chrome.
const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram/.test(ua);

function runningAsApp(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** "Get App" button for phones — native one-tap install on Android, Share-sheet pointer on iPhone. */
export function InstallButton() {
  const canPrompt = useCanPrompt();
  const [open, setOpen] = useState(false);

  if ((!isIOS && !isAndroid) || runningAsApp()) return null;

  const onClick = async () => {
    if (isAndroid && canPrompt) {
      await promptInstall();
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <button
        onClick={() => void onClick()}
        className="flex items-center gap-1.5 rounded-full bg-gold-400 px-3 py-1.5 text-xs font-semibold text-forest-900 shadow-sm transition hover:bg-gold-300"
      >
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14" />
        </svg>
        Get App
      </button>

      {/* Portal to <body>: the header's backdrop-blur makes it the containing
          block for `fixed` children, which would trap the sheet inside it. */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-3 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <img src="/apple-touch-icon.png" alt="" className="size-11 rounded-xl" />
              <div>
                <p className="font-display text-lg font-semibold text-forest-800">Get the App</p>
                <p className="text-xs text-stone-500">Free · no app store needed</p>
              </div>
            </div>

            {inAppBrowser ? (
              <p className="mt-4 text-sm leading-relaxed text-stone-700">
                First open this page in {isIOS ? 'Safari' : 'Chrome'}: tap the{' '}
                <strong>⋯</strong> menu and choose <strong>Open in browser</strong>. Then tap{' '}
                <strong>Get App</strong> again.
              </p>
            ) : isIOS ? (
              <ol className="mt-4 space-y-3 text-sm text-stone-700">
                <li className="flex items-start gap-3">
                  <Step n={1} />
                  <span>
                    Tap the <strong>Share</strong> button{' '}
                    <svg className="inline size-4 -translate-y-0.5 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12M8 7l4-4 4 4M7 11H6a1 1 0 00-1 1v8a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 00-1-1h-1" />
                    </svg>{' '}
                    — on newer iPhones it&rsquo;s inside the <strong>⋯</strong> menu.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={2} />
                  <span>
                    Tap <strong>Add to Home Screen</strong>, then <strong>Add</strong>.
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="mt-4 space-y-3 text-sm text-stone-700">
                <li className="flex items-start gap-3">
                  <Step n={1} />
                  <span>
                    Tap the menu <strong>⋮</strong> at the top right.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <Step n={2} />
                  <span>
                    Tap <strong>Install app</strong> (or <strong>Add to Home screen</strong>).
                  </span>
                </li>
              </ol>
            )}

            <button
              onClick={() => setOpen(false)}
              className="mt-5 w-full rounded-full bg-forest-700 py-2.5 text-sm font-semibold text-white transition hover:bg-forest-600"
            >
              Got it
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function Step({ n }: { n: number }) {
  return (
    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-forest-50 text-xs font-bold text-forest-700">
      {n}
    </span>
  );
}

import { useState } from 'react';
import { DONATIONS, donationsConfigured, ONE_TIME_PRESETS } from '../lib/donations';
import { IMAGES } from '../lib/images';
import { PageHero } from './Sermons';

type Mode = 'once' | 'monthly';

export function Give() {
  const [mode, setMode] = useState<Mode>('once');
  const configured = donationsConfigured();

  return (
    <>
      <PageHero
        image={IMAGES.wheat}
        title="Give"
        subtitle="Support the ministry — every gift helps keep these sermons free for everyone."
      />
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <blockquote className="mt-8 text-center text-sm text-stone-500 italic">
          “Every man according as he purposeth in his heart, so let him give; not grudgingly, or of
          necessity: for God loveth a cheerful giver.” — 2 Corinthians 9:7
        </blockquote>

        {!configured && (
          <div className="mt-8 mb-4 rounded-2xl border border-gold-300 bg-gold-300/10 p-6 text-center">
            <p className="font-display text-lg font-semibold text-forest-800">
              Online giving is being set up
            </p>
            <p className="mt-2 text-sm text-stone-600">
              Secure card giving through Stripe is almost ready. Please check back soon.
            </p>
          </div>
        )}

        {configured && (
          <div className="mt-8 mb-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
            {/* Frequency toggle */}
            <div className="grid grid-cols-2 gap-2 rounded-full bg-stone-100 p-1">
              {(
                [
                  ['once', 'One-time gift'],
                  ['monthly', 'Monthly giving'],
                ] as [Mode, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`rounded-full py-2.5 text-sm font-semibold transition ${
                    mode === key ? 'bg-forest-700 text-white shadow' : 'text-stone-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {mode === 'once' && (
              <div className="mt-6">
                <p className="text-sm text-stone-600">
                  Choose any amount on the secure Stripe page — the buttons below are common gifts.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ONE_TIME_PRESETS.map((amt) => (
                    <a
                      key={amt}
                      href={DONATIONS.oneTime}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-stone-300 py-3 text-center font-semibold text-forest-700 transition hover:border-forest-600 hover:bg-forest-50"
                    >
                      ${amt}
                    </a>
                  ))}
                </div>
                <a
                  href={DONATIONS.oneTime}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 block rounded-xl bg-gold-400 py-3.5 text-center font-semibold text-forest-900 transition hover:bg-gold-300"
                >
                  Give any amount →
                </a>
              </div>
            )}

            {mode === 'monthly' && (
              <div className="mt-6">
                <p className="text-sm text-stone-600">
                  Become a monthly supporter — cancel anytime from your Stripe receipt email.
                </p>
                <div className="mt-4 space-y-3">
                  {DONATIONS.monthly.map((tier) => (
                    <a
                      key={tier.amount}
                      href={tier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-stone-300 px-5 py-3.5 transition hover:border-forest-600 hover:bg-forest-50"
                    >
                      <span className="font-semibold text-forest-700">${tier.amount} / month</span>
                      <span className="text-sm text-stone-400">Give monthly →</span>
                    </a>
                  ))}
                  {DONATIONS.monthly.length === 0 && (
                    <p className="rounded-xl bg-stone-50 py-6 text-center text-sm text-stone-400">
                      Monthly giving is being set up — check back soon.
                    </p>
                  )}
                </div>
              </div>
            )}

            <p className="mt-6 text-center text-xs text-stone-400">
              A payment to Grace Sermons will appear on your statement.
            </p>
            <p className="mt-1 text-center text-xs text-stone-400">
              Questions about giving?{' '}
              <a href="mailto:contact@gracesermons.org" className="text-forest-600 hover:underline">
                contact@gracesermons.org
              </a>
            </p>
          </div>
        )}
      </div>
    </>
  );
}

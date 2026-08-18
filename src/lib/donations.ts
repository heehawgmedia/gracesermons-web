// Stripe Payment Links for the Give page.
//
// These are created once in the Stripe Dashboard (Products → Payment links)
// and pasted here — no server needed:
//   - oneTime: a link with "Customers choose what to pay" enabled, so any
//     amount works and the preset buttons simply prefill the page.
//   - monthly: one link per recurring tier (recurring links need a fixed price).
//
// Until the links are pasted in, the page shows a "being set up" notice.

export interface MonthlyTier {
  amount: number;
  url: string;
}

export const DONATIONS = {
  /** Payment link with customer-chosen amount (one-time). */
  oneTime: 'https://buy.stripe.com/fZu9AM2Vq0ci60Xaib48007',
  /** Fixed-amount monthly links, lowest to highest. */
  monthly: [
    { amount: 10, url: 'https://buy.stripe.com/bJe3co1RmbV0cpl61V48008' },
    { amount: 25, url: 'https://buy.stripe.com/28E6oA1Rm5wC4WT8a348009' },
    { amount: 50, url: 'https://buy.stripe.com/4gM7sE1RmcZ43SP2PJ4800a' },
  ] as MonthlyTier[],
};

export const ONE_TIME_PRESETS = [10, 25, 50, 100];

export function donationsConfigured(): boolean {
  return Boolean(DONATIONS.oneTime) || DONATIONS.monthly.length > 0;
}

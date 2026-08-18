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
  oneTime: '',
  /** Fixed-amount monthly links, lowest to highest. */
  monthly: [] as MonthlyTier[],
};

export const ONE_TIME_PRESETS = [10, 25, 50, 100];

export function donationsConfigured(): boolean {
  return Boolean(DONATIONS.oneTime) || DONATIONS.monthly.length > 0;
}

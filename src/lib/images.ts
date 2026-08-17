// Scenic placeholder imagery (free Unsplash photos, hotlinked).
// PLACEHOLDERS: swap these URLs for owned/generated photography before launch —
// this manifest is the only file that needs to change.

export const IMAGES = {
  hero: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=2000&q=80&auto=format&fit=crop',
  hills: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&q=80&auto=format&fit=crop',
  lake: 'https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1200&q=80&auto=format&fit=crop',
  forest: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1200&q=80&auto=format&fit=crop',
  wheat: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80&auto=format&fit=crop',
} as const;

/** Rotating fallback art for sermon/series cards without a cover image. */
const CARD_FALLBACKS = [IMAGES.hills, IMAGES.lake, IMAGES.forest, IMAGES.wheat];

export function fallbackCover(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return CARD_FALLBACKS[Math.abs(hash) % CARD_FALLBACKS.length];
}

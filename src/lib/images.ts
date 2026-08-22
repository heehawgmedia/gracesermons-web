// Scenic placeholder imagery (free Unsplash photos, hotlinked).
// Every photo here was reviewed by eye: grand scenes of creation — mountains,
// skies, seas, forests, canyons — no people, buildings, or objects.
// PLACEHOLDERS: swap these URLs for owned photography at any time — this
// manifest is the only file that needs to change.

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

/** Page heroes — each page gets its own scene. */
export const IMAGES = {
  hero: U('1506905925346-21bda4d32df4', 2000), // misty mountains at sunrise (Home)
  hills: U('1470071459604-3b5ec3a7fe05', 1600), // green valley (Sermon Library)
  lake: U('1445262102387-5fbb30a5e59d', 1600), // Emerald Bay at sunset (Music)
  forest: U('1441974231531-c6227db76b6e', 1600), // sunlit forest (Devotional)
  wheat: U('1500382017468-9049fed747ef', 1600), // wheat field (Bible)
  sunrise: U('1470252649378-9c29740c9fa8', 1600), // sunrise over the hills (Support)
  valley: U('1511884642898-4c92249e20b6', 1600), // mountain valley (Preacher pages)
  aurora: U('1531366936337-7c912a4589a7', 1600), // northern lights (Reach map)
  coast: U('1559827260-dc66d52bef19', 1600), // ocean wave at sunset (spare)
} as const;

/**
 * Rotating fallback art for sermon/series cards without a cover image.
 * A wide pool keeps neighbouring cards from repeating the same scene.
 */
const CARD_FALLBACKS = [
  '1419242902214-272b3f66ee7a', // milky way at dusk
  '1432405972618-c60b0225b8f9', // waterfall
  '1435224668334-0f82ec57b605', // starry sky
  '1437482078695-73f5ca6c96e2', // mountain stream
  '1439853949127-fa647821eba0', // Lake Louise valley
  '1441974231531-c6227db76b6e', // forest path
  '1444080748397-f442aa95c3e5', // milky way over pines
  '1445262102387-5fbb30a5e59d', // Emerald Bay sunset
  '1458668383970-8ddd3927deed', // peaks above the clouds
  '1462331940025-496dfbfc7564', // nebula
  '1464278533981-50106e6176b1', // desert mountains reflected
  '1469521669194-babb45599def', // fjord and peaks
  '1470071459604-3b5ec3a7fe05', // misty highland valley
  '1470252649378-9c29740c9fa8', // sunrise over meadow
  '1470813740244-df37b8c1edcb', // slot canyon
  '1474044159687-1ee9f3a51722', // Horseshoe Bend
  '1477346611705-65d1883cee1e', // alpenglow ridge
  '1483728642387-6c3bdd6c93e5', // twin peaks
  '1490682143684-14369e18dce8', // sunrise over forested hills
  '1494500764479-0c8f2919a3d8', // lone tree, lake at dusk
  '1498429089284-41f8cf3ffd39', // Yosemite valley
  '1500382017468-9049fed747ef', // wheat at sunrise
  '1502134249126-9f3755a50d78', // galaxy
  '1505144808419-1957a94ca61e', // ocean surf from above
  '1505228395891-9a51e7e86bf6', // tropical shore from above
  '1506905925346-21bda4d32df4', // Matterhorn above clouds
  '1510797215324-95aa89f43c33', // green ridge trail
  '1511497584788-876760111969', // pines and peaks at sunset
  '1511884642898-4c92249e20b6', // misty mountain river
  '1513002749550-c59d786b8e6c', // above the clouds
  '1517685352821-92cf88aee5a5', // cumulus clouds
  '1528183429752-a97d0bf99b5a', // oak at sunrise
  '1528184039930-bd03972bd974', // willow river at dawn
  '1529963183134-61a90db47eaf', // aurora over ice
  '1531366936337-7c912a4589a7', // northern lights
  '1533240332313-0db49b459ad6', // hazy ranges
  '1534067783941-51c9c23ecefd', // mountain ridges at sunrise
  '1535224206242-487f7090b5bb', // Matterhorn at sunset
  '1536431311719-398b6704d4cc', // peaks under stars
  '1542202229-7d93c33f5d07', // pine forest path
  '1542224566-6e85f2e6772f', // wildflower mountainside
  '1542273917363-3b1817f69a2d', // fog over the forest
  '1547036967-23d11aacaee0', // coastline from above
  '1549880181-56a44cf4a9a5', // alpenglow summit
  '1549880338-65ddcdfd017b', // pink-lit range
  '1552083375-1447ce886485', // Emerald Bay
  '1554629947-334ff61d85dc', // snow peak at dusk
  '1559494007-9f5847c49d94', // beach sunset
  '1559827260-dc66d52bef19', // ocean wave at sunset
].map((id) => U(id, 800));

export function fallbackCover(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return CARD_FALLBACKS[Math.abs(hash) % CARD_FALLBACKS.length];
}

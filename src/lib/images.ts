// Scenic placeholder imagery (free Unsplash photos, hotlinked).
// PLACEHOLDERS: swap these URLs for owned/generated photography before launch —
// this manifest is the only file that needs to change.

const U = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

/** Page heroes — each page gets its own scene. */
export const IMAGES = {
  hero: U('1506905925346-21bda4d32df4', 2000), // misty mountains at sunrise (Home)
  hills: U('1470071459604-3b5ec3a7fe05', 1600), // Sermon Library
  lake: U('1439066615861-d1af74d74000', 1600), // Music
  forest: U('1441974231531-c6227db76b6e', 1600), // Devotional
  wheat: U('1500382017468-9049fed747ef', 1600), // Bible
  sunrise: U('1470252649378-9c29740c9fa8', 1600), // Support
  valley: U('1511884642898-4c92249e20b6', 1600), // Preacher pages
  aurora: U('1476514525535-07fb3b4ae5f1', 1600), // Reach map
  coast: U('1496307653780-42ee777d4833', 1600), // spare
} as const;

/**
 * Rotating fallback art for sermon/series cards without a cover image.
 * A wide pool keeps neighbouring cards from repeating the same scene.
 */
const CARD_FALLBACKS = [
  '1501785888041-af3ef285b470', // mountain lake
  '1472214103451-9374bd1c798e', // rolling green hills
  '1447752875215-b2761acb3c5d', // forest path
  '1426604966848-d7adac402bff', // mountain range
  '1433086966358-54859d0ed716', // waterfall
  '1475924156734-496f6cac6ec1', // sunset over the sea
  '1469474968028-56623f02e42e', // mountain sunrise
  '1518173946687-a4c8892bbd9f', // fog in the mountains
  '1470770841072-f978cf4d019e', // alpine lake
  '1502082553048-f009c37129b9', // misty forest
  '1500530855697-b586d89ba3ee', // snowy peaks
  '1454496522488-7a8e488e8606', // mountain ridge
  '1464822759023-fed622ff2c3b', // mountains at dusk
  '1501594907352-04cda38ebc29', // ocean
  '1455218873509-8097305ee378', // still lake
  '1448375240586-882707db888b', // tall pines
  '1473448912268-2022ce9509d8', // forest road
  '1513836279014-a89f7a76ae86', // redwoods
  '1519681393784-d120267933ba', // mountains under stars
  '1504700610630-ac6aba3536d3', // valley light
  '1486870591958-9b9d0d1dda99', // green hills
  '1492571350019-22de08371fd3', // sunset sky
  '1452421822248-d4c2b47f0c81', // sunlit forest
  '1418065460487-3e41a6c84dc5', // woodland
  '1431794062232-2a99a5431c6c', // mountain vista
  '1516214104703-d870798883c5', // lakeshore
  '1506744038136-46273834b3fb', // mountain lake, morning
  '1469854523086-cc02fe5d8800', // open road
  '1472396961693-142e6e269027', // deer in the forest
  '1482938289607-e9573fc25ebb', // lake and peaks
  '1497436072909-60f360e1d4b1', // golden field
  '1532274402911-5a369e4c4bb5', // mountain lake, evening
  '1542224566-6e85f2e6772f', // rolling farmland
  '1509316975850-ff9c5deb0cd9', // trees in light
  '1540390769625-2fc3f8b1d50c', // calm lake
  '1444927714506-8492d94b4e3d', // wheat field
  '1447069387593-a5de0862481e', // forest light
  '1505765050516-f72dcac9c60e', // mountain meadow
  '1473773508845-188df298d2d1', // lake at dawn
  '1471922694854-ff1b63b20054', // hills at sunset
  '1523712999610-f77fbcfc3843', // sunbeams in the forest
  '1508193638397-1c4234db14d8', // mountain lake reflection
  '1434725039720-aaad6dd32dfe', // meadow and mountains
  '1441716844725-09cedc13a4e7', // forest at dusk
  '1500534314209-a25ddb2bd429', // desert mountain
  '1501854140801-50d01698950b', // hills
  '1505118380757-91f5f5632de0', // sunrise over the sea
  '1499002238440-d264edd596ec', // sunset field
  '1475113548554-5a36f1f523d6', // lavender field
  '1503803548695-c2a7b4a5b875', // sunset lake
  '1507400492013-162706c8c05e', // forest creek
  '1508739773434-c26b3d09e071', // sunflowers
].map((id) => U(id, 800));

export function fallbackCover(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return CARD_FALLBACKS[Math.abs(hash) % CARD_FALLBACKS.length];
}

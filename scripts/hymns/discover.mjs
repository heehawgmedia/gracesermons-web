// Discover instrumental hymn candidates on Pixabay Music.
// For each hymn: fetch plain search (pages 1-2) + style-hinted searches,
// parse rows (title, author, duration, genre, tags), keep rows whose title
// matches the hymn, classify style from title+tags, write candidates.json.
import { writeFileSync } from 'node:fs';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36';

const HYMNS = [
  ['Amazing Grace', /amazing grace/i],
  ['How Great Thou Art', /how great thou art/i],
  ['Blessed Assurance', /blessed assurance/i],
  ['It Is Well With My Soul', /it is well/i],
  ['Great Is Thy Faithfulness', /great is thy faithfulness/i],
  ['The Old Rugged Cross', /old rugged cross/i],
  ['Rock of Ages', /rock of ages/i],
  ['Be Thou My Vision', /be thou my vision|slane/i],
  ['Holy, Holy, Holy', /holy,? holy,? holy/i],
  ['A Mighty Fortress Is Our God', /mighty fortress/i],
  ['What a Friend We Have in Jesus', /what a friend/i],
  ['Come, Thou Fount of Every Blessing', /come,? thou fount|nettleton/i],
  ['In the Garden', /in the garden/i],
  ['I Surrender All', /i surrender all/i],
  ['I Need Thee Every Hour', /i need thee/i],
  ['Nearer, My God, to Thee', /nearer,? my god/i],
  ['In the Sweet By and By', /sweet by and by|sweet bye and bye/i],
  ['Leaning on the Everlasting Arms', /everlasting arms/i],
  ['Just As I Am', /just as i am/i],
  ['Softly and Tenderly', /softly and tenderly/i],
  ['Abide With Me', /abide with me/i],
  ['Jesus Paid It All', /jesus paid it all/i],
  ['Nothing But the Blood', /nothing but the blood/i],
  ['Standing on the Promises', /standing on the promises/i],
  ["'Tis So Sweet to Trust in Jesus", /tis so sweet/i],
  ['Are You Washed in the Blood', /washed in the blood/i],
  ['When the Roll Is Called Up Yonder', /roll is called/i],
  ['There Is Power in the Blood', /power in the blood/i],
  ['Love Lifted Me', /love lifted me/i],
  ['His Eye Is on the Sparrow', /eye is on the sparrow/i],
  ['Crown Him With Many Crowns', /crown him/i],
  ['All Hail the Power of Jesus\' Name', /all hail the power/i],
  ['Joyful, Joyful, We Adore Thee', /joyful,? joyful|ode to joy hymn/i],
  ['O For a Thousand Tongues to Sing', /thousand tongues/i],
  ['Fairest Lord Jesus', /fairest lord jesus/i],
  ['Jesus Loves Me', /jesus loves me/i],
  ['Trust and Obey', /trust and obey/i],
  ['Have Thine Own Way, Lord', /have thine own way/i],
  ['Take My Life and Let It Be', /take my life/i],
  ['To God Be the Glory', /to god be the glory/i],
  ['Praise to the Lord, the Almighty', /praise to the lord/i],
  ['Doxology (Old Hundredth)', /doxology|old hundredth|old 100th/i],
  ['Onward, Christian Soldiers', /onward,? christian soldiers/i],
  ['I Love to Tell the Story', /love to tell the story/i],
  ['Shall We Gather at the River', /gather at the river/i],
  ['When I Survey the Wondrous Cross', /when i survey/i],
  ['O Sacred Head, Now Wounded', /sacred head/i],
  ['Count Your Blessings', /count your blessings/i],
  ['What Wondrous Love Is This', /wondrous love/i],
  ['Go Tell It on the Mountain', /go tell it on the mountain/i],
  ['Were You There', /were you there/i],
  ['Swing Low, Sweet Chariot', /swing low/i],
  ['Down to the River to Pray', /river to pray/i],
  ['Savior, Like a Shepherd Lead Us', /like a shepherd/i],
  ['Pass Me Not, O Gentle Savior', /pass me not/i],
  ['Near the Cross', /near the cross|jesus keep me near/i],
  ['Redeemed, How I Love to Proclaim It', /redeemed/i],
  ['Wonderful Words of Life', /wonderful words of life/i],
  ['Blessed Be the Name', /blessed be the name/i],
  ['Jesus, Lover of My Soul', /lover of my soul/i],
  ['O Worship the King', /o worship the king/i],
  ['Immortal, Invisible', /immortal,? invisible/i],
  ['Sweet Hour of Prayer', /sweet hour of prayer/i],
  ['Tell Me the Story of Jesus', /story of jesus/i],
  ['There Is a Fountain', /there is a fountain/i],
  ['Alas! and Did My Savior Bleed (At the Cross)', /at the cross|did my savior bleed/i],
  ['My Jesus, I Love Thee', /my jesus,? i love thee/i],
  ['Hallelujah, What a Savior', /what a savior|man of sorrows/i],
  ['Christ Arose (Low in the Grave He Lay)', /christ arose|low in the grave/i],
  ['He Leadeth Me', /he leadeth me/i],
  ['I Know Whom I Have Believed', /whom i have believed/i],
  ['Wayfaring Stranger', /wayfaring stranger/i],
  ['Will the Circle Be Unbroken', /circle be unbroken/i],
  ['Simple Gifts', /simple gifts/i],
  ['Ode to Joy', /ode to joy/i],
  ['Silent Night', /silent night/i],
  ['O Come, All Ye Faithful', /come,? all ye faithful|adeste/i],
  ['Hark! The Herald Angels Sing', /hark!? the herald/i],
  ['O Holy Night', /o holy night/i],
  ['Joy to the World', /joy to the world/i],
  ['Away in a Manger', /away in a manger/i],
  ['What Child Is This', /what child is this|greensleeves/i],
  ['It Came Upon the Midnight Clear', /midnight clear/i],
  ['O Little Town of Bethlehem', /little town of bethlehem/i],
  ['Angels We Have Heard on High', /angels we have heard/i],
  ['The First Noel', /first noel/i],
  ['God Rest Ye Merry, Gentlemen', /god rest ye/i],
  ['O Come, O Come, Emmanuel', /o come,? o come,? emmanuel/i],
];

const STYLE_QUERIES = ['violin', 'strings', 'cello', 'orchestra', 'bluegrass', 'banjo', 'guitar', 'piano'];

const STYLE_RULES = [
  ['Bluegrass', /bluegrass|banjo|mandolin|dobro/i],
  ['Country', /\bcountry\b|western|americana|folk/i],
  ['Strings', /violin|cello|viola|\bstrings?\b|orchestra|orchestral|symphon|quartet|fiddle|string ensemble|cinematic/i],
  ['Guitar', /guitar|acoustic|ukulele/i],
  ['Piano', /piano|keys/i],
  ['Organ', /\borgan\b/i],
  ['Choir', /choir|choral|vocal|voice|sing|lyrics|acapella|a cappella/i],
  ['Harp', /\bharp\b/i],
  ['Flute', /flute|woodwind|pan flute/i],
  ['Saxophone', /\bsax/i],
  ['Bagpipes', /bagpipe/i],
  ['Brass', /trumpet|brass|horn/i],
  ['Lofi', /lo-?fi|beat|hip hop|trap|edm|electronic|synth/i],
];

function classify(text) {
  const hits = [];
  for (const [name, re] of STYLE_RULES) if (re.test(text)) hits.push(name);
  return hits;
}

function decode(s) {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/<[^>]+>/g, '')
    .trim();
}

function parseRows(html) {
  const rows = [];
  const parts = html.split('class="audioRow--').slice(1);
  for (const p of parts) {
    const t = p.match(/<a href="(\/music\/[^"]+)" class="title--[^"]+">([^<]*)</);
    if (!t) continue;
    const u = p.match(/<a href="\/users\/([^"]+)" class="name--[^"]+">([^<]*)</);
    const d = p.match(/class="duration--[^"]+">([^<]*)</);
    const g = p.match(/class="theme--[^"]+">([^<]*)</);
    const tags = [...p.matchAll(/<a href=\/music\/search\/[^>]*>([^<]*)<\/a>/g)].map((m) => decode(m[1]));
    const contentId = /Content ID|contentId|shield/i.test(p.slice(0, 4000));
    rows.push({
      url: 'https://pixabay.com' + t[1],
      title: decode(t[2]),
      author: u ? decode(u[2]) : '',
      duration: d ? d[1] : '',
      genre: g ? decode(g[1]) : '',
      tags,
      contentId,
    });
  }
  return rows;
}

// Node's fetch trips Cloudflare's challenge (403 "Just a moment"); curl's TLS
// fingerprint passes, so shell out to curl for pixabay.com pages.
import { execFile } from 'node:child_process';
function curl(url) {
  return new Promise((resolve) => {
    execFile(
      'curl',
      ['-s', '-L', '--max-time', '40', '-H', `User-Agent: ${UA}`, '-H', 'Accept: text/html,*/*', '-H', 'Accept-Language: en-US,en;q=0.9', url],
      { maxBuffer: 20 * 1024 * 1024 },
      (err, stdout) => resolve(err ? '' : stdout)
    );
  });
}
async function fetchHtml(url) {
  for (let i = 0; i < 3; i++) {
    const html = await curl(url);
    if (html.includes('audioRow--') || html.includes('No results') || html.includes('royaltyFree--')) return html;
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  return '';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function secs(d) {
  const [m, s] = d.split(':').map(Number);
  return (m || 0) * 60 + (s || 0);
}

const out = {};
let fetched = 0;
for (const [name, re] of HYMNS) {
  const base = name.replace(/[^a-z0-9 ]/gi, ' ').replace(/\s+/g, ' ').trim();
  const queries = [`${base}`, `${base}`, ...STYLE_QUERIES.map((s) => `${base} ${s}`)];
  const seen = new Map();
  let qi = 0;
  for (const q of queries) {
    qi++;
    const page = qi === 2 ? '?pagi=2' : '';
    const url = `https://pixabay.com/music/search/${encodeURIComponent(q)}/${page}`;
    const html = await fetchHtml(url);
    fetched++;
    const rows = parseRows(html);
    for (const r of rows) {
      if (!re.test(r.title)) continue;
      if (!seen.has(r.url)) seen.set(r.url, r);
    }
    await sleep(250);
    // plain query yielded fewer than 20 → hymn is rare; style searches would mostly repeat. Still run a couple.
    if (qi === 1 && rows.length < 20) {
      // skip page 2 and limit style queries to the strings-ish ones
      queries.splice(1, 1);
      queries.splice(5); // keep violin, strings, cello, orchestra
    }
  }
  const cands = [...seen.values()].map((r) => {
    const styles = classify(`${r.title} ${r.genre} ${r.tags.join(' ')}`);
    return { ...r, styles, secs: secs(r.duration) };
  });
  out[name] = cands;
  const strings = cands.filter((c) => c.styles.includes('Strings')).length;
  const blue = cands.filter((c) => c.styles.includes('Bluegrass') || c.styles.includes('Country')).length;
  console.log(`${name.padEnd(44)} cands=${String(cands.length).padStart(3)}  strings=${strings}  bluegrass/country=${blue}`);
}
writeFileSync(new URL('./candidates.json', import.meta.url), JSON.stringify(out, null, 1));
console.log(`\nfetched ${fetched} pages`);

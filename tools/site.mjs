// Builds the GitHub Pages site into build/site/.
// The latest release is looked up in the browser (GitHub API), with the version
// from package.json as the fallback, so the page stays current between deploys.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import { build } from './build.mjs';
import { render } from './render.mjs';
import { guide } from '../src/guide.mjs';
import { BIOME_NAMES, habitats as habitatsOf, tags } from '../src/lib/info.mjs';
import { CATCHES } from '../src/fishing.mjs';
import { LANGUAGES, STRINGS } from '../src/i18n.mjs';

const OUT = 'build/site';
const RP = 'build/resource_pack';
const repo = process.env.GITHUB_REPOSITORY ?? process.env.SITE_REPO ?? 'ulfendk/minecraft-aquatic';
const [owner, name] = repo.split('/');

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function upscale(buf, k) {
  const src = PNG.sync.read(buf);
  const out = new PNG({ width: src.width * k, height: src.height * k });
  for (let y = 0; y < out.height; y++)
    for (let x = 0; x < out.width; x++) {
      const s = ((Math.floor(y / k) * src.width) + Math.floor(x / k)) * 4;
      out.data.set(src.data.subarray(s, s + 4), (y * out.width + x) * 4);
    }
  return PNG.sync.write(out);
}

const { animals, items, version } = await build({ quiet: true });
await mkdir(join(OUT, 'img', 'animals'), { recursive: true });
await mkdir(join(OUT, 'img', 'items'), { recursive: true });

const GROUP_ORDER = ['freshwater', 'sea', 'tropical', 'shark', 'seal', 'whale', 'penguin'];
const cards = [];
for (const a of animals) {
  const geo = JSON.parse(await readFile(join(RP, 'models/entity', `${a.id}.geo.json`), 'utf8'));
  const tex = await readFile(join(RP, 'textures/entity/aquatic', `${a.id}.png`));
  await writeFile(join(OUT, 'img', 'animals', `${a.id}.png`), render(geo, tex, { yaw: 35, size: 320 }));
  cards.push({ a, habitats: habitatsOf(a), group: a.group });
}
cards.sort((x, y) => GROUP_ORDER.indexOf(x.group) - GROUP_ORDER.indexOf(y.group));

// Food and gear (not the fish themselves, which have their own table, nor the buckets).
const shownItems = items.filter((i) => !i.fish && !i.bucketOf);
for (const item of items) {
  await writeFile(join(OUT, 'img', 'items', `${item.id}.png`), upscale(item.icon, 4));
}
await copyFile(join(RP, 'pack_icon.png'), join(OUT, 'img', 'icon.png'));
await writeFile(join(OUT, 'favicon.png'), upscale(PNG.sync.write(PNG.sync.read(await readFile(join(RP, 'pack_icon.png')))), 1));

const releases = `https://github.com/${repo}/releases`;
const dl = (file) => `${releases}/latest/download/${file}`;

const ROOT_URL = `https://${owner}.github.io/${name}/`;
// The index of all our mods, which every mod's site links back to.
const INDEX_URL = `https://${owner}.github.io/minecraft-index/`;

/** Builds the page for one language. Pages for other languages live in a subfolder. */
function page(lang) {
  const L = LANGUAGES[lang];
  const t = STRINGS[lang];
  const up = L.dir ? '../' : '';
  const link = (href) => (text) => `<a href="${href}">${esc(text)}</a>`;
  const home = `${INDEX_URL}${L.dir ? L.dir + '/' : ''}`;
  const animalName = (a) => t.names?.[a.id] ?? a.name;
  const tr = (map, s) => map?.[s] ?? s;

  const animalHtml = cards.map(({ a, habitats, group }) => `
      <article class="card" data-group="${group}">
        <div class="portrait"><img src="${up}img/animals/${a.id}.png" alt="${esc(animalName(a))}" loading="lazy" width="320" height="320"></div>
        <div class="card-body">
          <h3>${esc(animalName(a))}</h3>
          <p class="where">${habitats.map((h) => esc(tr(t.habitats, h))).join(' · ')}</p>
          <p>${esc(t.guide?.[a.id] ?? guide[a.id] ?? '')}</p>
          <ul class="tags">${tags(a).map((x) => `<li>${esc(tr(t.tags, x))}</li>`).join('')}</ul>
        </div>
      </article>`).join('');

  const itemHtml = shownItems.map((i) => `
        <li><img src="${up}img/items/${i.id}.png" alt="" width="48" height="48"><span>${esc(t.items?.[i.id] ?? i.name)}</span></li>`).join('');

  const fishName = (id) => (id.includes(':') ? null : animalName({ id, name: animals.find((x) => x.id === id)?.name ?? id }));
  const fishRows = CATCHES.filter((c) => !c.id.includes(':')).map((c) => `
        <tr><td><img src="${up}img/items/${c.id}.png" alt="" width="32" height="32"> ${esc(fishName(c.id))}</td>
          <td>${c.biomes.map((b) => esc(tr(t.habitats, BIOME_NAMES[b] ?? b))).join(', ')}</td>
          <td>${esc(t.times[c.time])}</td>
          <td>${c.weight[0]}–${c.weight[1]} kg</td>
          <td>${esc(t.rods[c.fight >= 4 ? 'sea_rod' : 'anglers_rod'])}</td></tr>`).join('');

  const switcher = Object.entries(LANGUAGES)
    .filter(([code]) => code !== lang)
    .map(([code, other]) => `<a class="lang" href="${up}${other.dir ? other.dir + '/' : ''}" hreflang="${other.htmlLang}" lang="${other.htmlLang}">${esc(other.label)}</a>`)
    .join('');
  const alternates = Object.values(LANGUAGES)
    .map((other) => `<link rel="alternate" hreflang="${other.htmlLang}" href="${ROOT_URL}${other.dir ? other.dir + '/' : ''}">`)
    .join('\n');

const html = `<!doctype html>
<html lang="${L.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(t.title)}</title>
<meta name="description" content="${esc(t.description(animals.length))}">
${alternates}
<link rel="icon" href="${up}favicon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Pixelify+Sans:wght@500&display=swap" rel="stylesheet">
<style>
:root {
  --bg: #eaf4f7; --surface: #ffffff; --ink: #10262f; --muted: #4d6670; --line: #c9dfe6;
  --accent: #0b6e94; --accent-ink: #fff; --accent-2: #1d7f6e; --chip: #dcecf1; --hero-from: #0a3d62; --hero-to: #3dc1d3;
  --portrait-in: #bfe6f0; --portrait-mid: #7ccbe0; --portrait-out: #2a8fb8;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --bg: #07161c; --surface: #0e242d; --ink: #e2f1f5; --muted: #93b2bc; --line: #1e3c47;
    --accent: #5cc8e6; --accent-ink: #062029; --accent-2: #7fd6c2; --chip: #16323c; --hero-from: #041c2e; --hero-to: #0f6c84;
    --portrait-in: #1e5a70; --portrait-mid: #134356; --portrait-out: #0a2733;
  }
}
:root[data-theme="dark"] {
  --bg: #07161c; --surface: #0e242d; --ink: #e2f1f5; --muted: #93b2bc; --line: #1e3c47;
  --accent: #5cc8e6; --accent-ink: #062029; --accent-2: #7fd6c2; --chip: #16323c; --hero-from: #041c2e; --hero-to: #0f6c84;
  --portrait-in: #1e5a70; --portrait-mid: #134356; --portrait-out: #0a2733;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); font: 16px/1.55 system-ui, -apple-system, "Segoe UI", sans-serif; }
img { image-rendering: pixelated; max-width: 100%; }
a { color: var(--accent); }
h1, h2, h3 { font-family: "Pixelify Sans", system-ui, sans-serif; font-weight: 500; line-height: 1.15; letter-spacing: .01em; }
.wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
header.hero { color: #f2fbfd; background: linear-gradient(180deg, var(--hero-from), var(--hero-to)); padding: 48px 0 56px; }
.hero .wrap { display: grid; grid-template-columns: auto 1fr; gap: 32px; align-items: center; }
.hero img.icon { width: 160px; height: 160px; border-radius: 12px; box-shadow: 0 8px 30px rgb(0 0 0 / .35); }
.hero h1 { font-size: clamp(2.2rem, 6vw, 3.6rem); margin: 0 0 8px; }
.hero p { margin: 0 0 20px; font-size: 1.15rem; max-width: 46ch; color: #e6f7fb; }
.actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; font-weight: 700; text-decoration: none; background: #ffd36b; color: #2b1d0e; box-shadow: 0 3px 0 #b8862c; }
.btn:hover { transform: translateY(-1px); }
.btn.ghost { background: transparent; color: #fff3df; box-shadow: inset 0 0 0 2px rgb(255 243 223 / .6); }
.version { font-size: .95rem; color: #e6f7fb; }
.which { margin: 16px 0 6px; background: rgb(0 0 0 / .22); border: 1px solid rgb(255 243 223 / .35); border-radius: 10px; padding: 10px 14px; max-width: 62ch; font-size: .95rem; color: #fff3df; }
.which b { color: #fff; }
.hero .langs { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; margin-top: -28px; margin-bottom: 8px; }
.hero .langs a { color: #fff3df; font-weight: 600; text-decoration: none; padding: 4px 12px; border-radius: 999px; box-shadow: inset 0 0 0 1.5px rgb(255 243 223 / .55); font-size: .9rem; }
.hero .langs a:hover { background: rgb(255 255 255 / .12); }
.version strong { color: #fff; }
main section { padding: 48px 0 8px; }
h2 { font-size: 2rem; margin: 0 0 8px; }
.lede { color: var(--muted); margin: 0 0 24px; max-width: 70ch; }
.steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; padding: 0; list-style: none; counter-reset: s; }
.steps li { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 16px 16px 16px 56px; position: relative; }
.steps li::before { counter-increment: s; content: counter(s); position: absolute; left: 16px; top: 14px; width: 28px; height: 28px; border-radius: 50%; background: var(--accent); color: var(--accent-ink); display: grid; place-items: center; font-weight: 700; }
.note { color: var(--muted); font-size: .92rem; }
h3.edition { margin: 18px 0 10px; font: 700 1.15rem/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin: 0 0 20px; }
.filters button { font: inherit; border: 1px solid var(--line); background: var(--surface); color: var(--ink); padding: 6px 14px; border-radius: 999px; cursor: pointer; }
.filters button[aria-pressed="true"] { background: var(--accent); color: var(--accent-ink); border-color: var(--accent); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 18px; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
.card[hidden] { display: none; }
.portrait { background: radial-gradient(circle at 50% 35%, var(--portrait-in) 0, var(--portrait-mid) 55%, var(--portrait-out) 100%); aspect-ratio: 1; display: grid; place-items: center; }
.portrait img { width: 88%; height: auto; }
.card-body { padding: 14px 16px 16px; }
.card h3 { margin: 0; font: 700 1.3rem/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; }
.where { margin: 2px 0 8px; color: var(--accent-2); font-weight: 600; font-size: .9rem; }
.card p { margin: 0 0 10px; }
.tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0; margin: 0; list-style: none; }
.tags li { background: var(--chip); border-radius: 6px; padding: 2px 8px; font-size: .82rem; }
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.feature { background: var(--surface); border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.feature h3 { margin: 0 0 6px; font: 700 1.1rem/1.2 system-ui, -apple-system, "Segoe UI", sans-serif; }
.feature p { margin: 0; color: var(--muted); }
.items { display: flex; flex-wrap: wrap; gap: 12px; list-style: none; padding: 0; }
.items li { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--line); border-radius: 10px; padding: 8px 14px 8px 8px; }
.table-wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 12px; background: var(--surface); }
table.fish { width: 100%; border-collapse: collapse; font-size: .95rem; }
table.fish th, table.fish td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--line); vertical-align: middle; }
table.fish th { font-weight: 700; color: var(--muted); background: var(--chip); }
table.fish tr:last-child td { border-bottom: 0; }
table.fish td:first-child { white-space: nowrap; font-weight: 600; }
table.fish img { vertical-align: middle; margin-right: 6px; }
footer { margin-top: 56px; padding: 28px 0 40px; border-top: 1px solid var(--line); color: var(--muted); font-size: .9rem; }
@media (max-width: 640px) {
  .hero .wrap { grid-template-columns: 1fr; text-align: center; justify-items: center; }
  .hero img.icon { width: 112px; height: 112px; }
  .actions { justify-content: center; }
}
</style>
</head>
<body>
<header class="hero">
  <nav class="langs wrap"><a class="home" href="${home}">← ${esc(t.allMods)}</a><span>${switcher}</span></nav>
  <div class="wrap">
    <img class="icon" src="${up}img/icon.png" alt="" width="160" height="160">
    <div>
      <h1>${esc(t.name)}</h1>
      <p>${esc(t.tagline(animals.length))}</p>
      <div class="actions">
        <a class="btn" id="download" href="${dl(`SeaLife.mcaddon`)}">⬇ ${esc(t.download)}</a>
        <a class="btn" href="${dl('SeaLife-fabric.jar')}">⬇ ${esc(t.downloadJava)}</a>
        <a class="btn ghost" href="${releases}">${esc(t.allVersions)}</a>
      </div>
      <p class="which">${t.which}</p>
      <p class="version" id="version">${esc(t.latestVersion)}: <strong>${esc(version)}</strong></p>
    </div>
  </div>
</header>
<main class="wrap">
  <section id="install">
    <h2>${esc(t.install)}</h2>
    <h3 class="edition">${esc(t.bedrockTitle)}</h3>
    <ol class="steps">
${t.steps(`<a href="${dl('SeaLife.mcaddon')}">SeaLife.mcaddon</a>`).map((step) => `      <li>${step}</li>`).join('\n')}
    </ol>
    <p class="note">${t.serverNote(link(dl('SeaLife_BP.mcpack')), link(dl('SeaLife_RP.mcpack')))}</p>
    <h3 class="edition">${esc(t.javaTitle)}</h3>
    <ol class="steps">
${t.javaSteps(
    `<a href="${dl('SeaLife-fabric.jar')}">SeaLife-fabric.jar</a>`,
    '<a href="https://fabricmc.net/use/installer/">Fabric Loader</a>',
    '<a href="https://modrinth.com/mod/fabric-api">Fabric API</a>',
    '<a href="https://modrinth.com/mod/geckolib">GeckoLib</a>',
  ).map((step) => `      <li>${step}</li>`).join('\n')}
    </ol>
    <h3 class="edition">${esc(t.upgradeTitle)}</h3>
    <ol class="steps">
${t.upgradeSteps.map((step) => `      <li>${step}</li>`).join('\n')}
    </ol>
    <p class="note">${t.upgradeServerNote}</p>
    <p class="note">${t.upgradeJava}</p>
  </section>

  <section id="animals">
    <h2>${esc(t.animals)}</h2>
    <p class="lede">${esc(t.animalsLede)}</p>
    <div class="filters" role="group" aria-label="${esc(t.filterLabel)}">
${Object.entries(t.filters).map(([key, label], i) => `      <button aria-pressed="${i === 0}" data-filter="${key}">${esc(label)}</button>`).join('\n')}
    </div>
    <div class="grid" id="grid">${animalHtml}
    </div>
  </section>

  <section id="fishing">
    <h2>${esc(t.fishingTitle)}</h2>
    <p class="lede">${esc(t.fishingLede)}</p>
    <p class="lede">${esc(t.fishingSea)}</p>
    <div class="table-wrap"><table class="fish">
      <thead><tr><th>${esc(t.fishingTable.fish)}</th><th>${esc(t.fishingTable.where)}</th><th>${esc(t.fishingTable.when)}</th><th>${esc(t.fishingTable.weight)}</th><th>${esc(t.fishingTable.rod)}</th></tr></thead>
      <tbody>${fishRows}
      </tbody>
    </table></div>
  </section>

  <section id="features">
    <h2>${esc(t.featuresTitle)}</h2>
    <div class="features">
${t.features.map(([title, text]) => `      <div class="feature"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('\n')}
    </div>
  </section>

  <section id="items">
    <h2>${esc(t.itemsTitle)}</h2>
    <p class="lede">${esc(t.itemsLede)}</p>
    <ul class="items">${itemHtml}
    </ul>
  </section>
</main>
<footer>
  <div class="wrap">
    <p>${t.footerSource(link(`https://github.com/${repo}`), link(`https://github.com/${repo}/issues`))}</p>
    <p>${esc(t.footerLegal)}</p>
    <p>${link(home)(`← ${t.allMods}`)}</p>
  </div>
</footer>
<script>
// Animal filters
const buttons = document.querySelectorAll('.filters button');
buttons.forEach((b) => b.addEventListener('click', () => {
  buttons.forEach((o) => o.setAttribute('aria-pressed', String(o === b)));
  const f = b.dataset.filter;
  document.querySelectorAll('.card').forEach((c) => {
    c.hidden = !(f === 'all' || c.dataset.group === f);
  });
}));
// Latest release from GitHub
fetch('https://api.github.com/repos/${owner}/${name}/releases/latest')
  .then((r) => (r.ok ? r.json() : null))
  .then((rel) => {
    if (!rel || !rel.tag_name) return;
    const date = new Date(rel.published_at).toLocaleDateString('${L.dateLocale}', { year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('version').innerHTML = '${t.latestVersion}: <strong>' + rel.tag_name.replace(/^v/, '') + '</strong> · ${t.released} ' + date;
  })
  .catch(() => {});

// Reload when a new release has been published. The site is redeployed with every release
// and writes version.json; compare it with the version this page was built with.
const PAGE_VERSION = '${version}';
let reloading = false;
function checkForUpdate() {
  if (reloading || document.hidden) return;
  fetch('${up}version.json?t=' + Date.now(), { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : null))
    .then((v) => {
      if (!v || !v.version || v.version === PAGE_VERSION) return;
      // Reload once per new version: if the cached page is still the old one, don't loop.
      let tried = null;
      try { tried = sessionStorage.getItem('aquatic-reloaded-for'); } catch {}
      if (tried === v.version) return;
      try { sessionStorage.setItem('aquatic-reloaded-for', v.version); } catch {}
      reloading = true;
      location.reload();
    })
    .catch(() => {});
}
setInterval(checkForUpdate, 10 * 60 * 1000);
checkForUpdate();
document.addEventListener('visibilitychange', checkForUpdate);
</script>
</body>
</html>
`;
  return html;
}

for (const [lang, L] of Object.entries(LANGUAGES)) {
  const dir = join(OUT, L.dir);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, 'index.html'), page(lang));
}
await writeFile(join(OUT, '.nojekyll'), '');
await writeFile(join(OUT, 'version.json'), JSON.stringify({ version }) + '\n');
console.log(`Site written to ${OUT}/ (${animals.length} animals, ${Object.keys(LANGUAGES).join(' + ')}, repo ${repo})`);

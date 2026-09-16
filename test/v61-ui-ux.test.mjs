import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFile(path.join(ROOT, relative), 'utf8');
const [home, components, encyclopedia, styles, preferences, relay, build, template] = await Promise.all([
  read('src/js/ui/screens/home.js'),
  read('src/js/ui/components.js'),
  read('src/js/ui/screens/encyclopedia.js'),
  read('src/styles.css'),
  read('src/js/preferences.js'),
  read('src/js/flowerRelay.js'),
  read('build.mjs'),
  read('src/index.template.html')
]);

test('home keeps the V61 feature and requested information order while reusing relay actions', () => {
  assert.match(home, /main\.append\(homeFeature[\s\S]*main\.append\(renderFlowerRelay\(state\)\)[\s\S]*sectionHeader\('이번 주 볼 꽃'[\s\S]*sectionHeader\('꽃 보러 가기'/);
  assert.match(home, /className: 'weather-note'/);
  assert.match(home, /button\('릴레이 보기 ›',relayViewAction/);
  assert.match(home, /relay\.status==='before'[\s\S]*'relay-start'[\s\S]*relay\.status==='active'[\s\S]*'relay-continue'/);
  assert.match(home, /오늘 주변에서 만날 수 있는 꽃 \$\{relay\.total\}종을 이어서 만나보세요\./);
});

test('main feature redistributes existing spacing without changing its image geometry', () => {
  assert.match(styles, /\.editorial-feature-image\{[^}]*aspect-ratio:16\/8[^}]*max-height:240px[^}]*object-fit:cover/);
  assert.match(styles, /\.editorial-feature-copy h1\s*\{[^}]*margin:\s*0 0 6px[^}]*font-size:\s*calc\(1\.65rem \* var\(--body-text-scale\)\)/s);
  assert.match(styles, /\.feature-context \{ margin: 5px 0 10px; \}/);
  assert.match(styles, /\.feature-identification \{ margin: 7px 0 5px; \}/);
  assert.match(styles, /\.feature-actions \{ margin-top: 11px; \}/);
});

test('large text uses the existing settings key and one central 14 percent scale', () => {
  assert.match(preferences, /const KEY='flower-info\.settings\.v1'/);
  assert.match(preferences, /bodyTextSize:'medium'/);
  assert.match(styles, /:root\[data-text-size="large"\] \{ --body-text-scale: 1\.14; \}/);
  for (const selector of [
    '.editorial-feature-copy h1', '.section-head h2', '.flower-relay-description',
    '.flower-relay-target strong', '.flower-poster-title strong', '.flower-poster-scientific',
    '.event-title', '.filter-panel > summary', '.setting-row', '.observation-field',
    '.detail-disclosure summary', '.bloom-calendar-day'
  ]) {
    assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\]/g, '\$&') + '[^{]*\{[^}]*var\(--body-text-scale\)', 's'));
  }
  assert.doesNotMatch(styles, /\.bottom-nav[^}]*var\(--body-text-scale\)/s);
  assert.doesNotMatch(styles, /\.settings-slider-icon[^}]*var\(--body-text-scale\)/s);
});

test('encyclopedia removes only compact bloom decoration and protects real content', () => {
  assert.match(components, /function flowerPoster\(flower, state, \{ rail = false, showBloomFlow = true \} = \{\}\)/);
  assert.match(components, /image\(flower\.image,[\s\S]*'flower-poster-image',\s*flower\.localImage\)/);
  assert.match(components, /statusBadge\(bloom\)/);
  assert.match(components, /showBloomFlow \? bloomFlow\(bloom, true\) : null/);
  assert.match(encyclopedia, /flowerPoster\(flower, state, \{ showBloomFlow: false \}\)/);
  assert.match(encyclopedia, /toggle-favorite-filter/);
});

test('encyclopedia status grows once from 0.58rem to 0.67rem and cannot wrap or shrink', () => {
  const baseIncrease = .67 / .58;
  assert.ok(baseIncrease >= 1.1 && baseIncrease <= 1.2);
  assert.match(styles, /\.encyclopedia-grid \.status\s*\{[^}]*flex:\s*0 0 auto[^}]*font-size:\s*calc\(\.67rem \* var\(--body-text-scale\)\)[^}]*white-space:\s*nowrap/s);
  assert.match(styles, /\.encyclopedia-grid \.flower-poster-title \{ flex-wrap: nowrap; \}/);
  assert.match(styles, /\.encyclopedia-grid \.flower-poster-title strong\s*\{[^}]*min-width:\s*0[^}]*text-overflow:\s*ellipsis/s);
});

test('relay storage and placeholders remain the existing V61 implementation', () => {
  assert.match(relay, /flower-info\.relay\.v1/);
  assert.match(home, /className:'flower-relay-placeholder','aria-hidden':'true'/);
  assert.match(styles, /\.flower-relay-placeholder\s*\{[^}]*aspect-ratio:\s*4 \/ 3[^}]*background:\s*var\(--surface-soft\)/s);
  assert.doesNotMatch(home, /flower-relay-placeholder[^\n]*(?:svg|img|icon|emoji)/i);
});

test('V61 produces only the DEV bundle and adds no image or SVG asset', async () => {
  assert.match(build, /꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build, /꽃을보다_V61\.html/);
  assert.match(template, /Botanical V61 DEV/);
  const assets = await readdir(path.join(ROOT, 'assets', 'flowers'));
  assert.equal(assets.length, 46);
  assert.equal(assets.every((name) => name.endsWith('.webp')), true);
});


test('light and dark palettes use the requested shared colors', () => {
  const light = styles.match(/^:root\s*\{([^}]*)\}/m)?.[1];
  const dark = styles.match(/:root\[data-theme=dark\]\{([^}]*)\}/)?.[1];
  assert.ok(light);
  assert.ok(dark);
  const tokens = (block) => Object.fromEntries(
    [...block.matchAll(/(--[\w-]+)\s*:\s*(#[\da-fA-F]{6})/g)].map(([, name, value]) => [name, value.toUpperCase()])
  );
  const lightColors = tokens(light);
  const darkColors = tokens(dark);
  assert.deepEqual(
    Object.fromEntries(['--bg', '--surface', '--surface-soft', '--accent', '--accent-strong', '--accent-soft', '--lime-point', '--ink', '--muted', '--line'].map((name) => [name, lightColors[name]])),
    {'--bg': '#FFFDF6', '--surface': '#FFFFFF', '--surface-soft': '#F7FAEE', '--accent': '#93AA72', '--accent-strong': '#6F8657', '--accent-soft': '#F1F6DC', '--lime-point': '#EAF3C8', '--ink': '#30342A', '--muted': '#74796D', '--line': '#E7EBDD'}
  );
  assert.deepEqual(
    Object.fromEntries(['--bg', '--surface', '--surface-soft', '--accent', '--accent-strong', '--accent-soft', '--lime-point', '--ink', '--muted', '--line'].map((name) => [name, darkColors[name]])),
    {'--bg': '#171C16', '--surface': '#20271E', '--surface-soft': '#263024', '--accent': '#A6BE80', '--accent-strong': '#89A56A', '--accent-soft': '#33412D', '--lime-point': '#C5DA8A', '--ink': '#F1F3E9', '--muted': '#B4BEAC', '--line': '#3A4636'}
  );
  assert.match(styles, /\.flower-relay-target\.is-complete \.flower-relay-placeholder \{[^}]*background: var\(--lime-point\)/);
  assert.match(styles, /\[data-theme=dark\] \.event-tab\[aria-pressed=true\][^\n]*background:var\(--accent-strong\)/);
  assert.doesNotMatch(styles, /#713e50|#5e3242|#4f2938|rgba\(113,\s*62,\s*80|#9fc98d|#b0d89e/i);
});

test('warning and error colors retain their original meaning', () => {
  const light = styles.match(/^:root\s*\{([^}]*)\}/m)?.[1];
  const dark = styles.match(/:root\[data-theme=dark\]\{([^}]*)\}/)?.[1];
  for (const [block, colors] of [
    [light, ['#fbf4df', '#7a5c18', '#faece8', '#8b4940']],
    [dark, ['#393321', '#f1d389', '#3f2c29', '#f2b5a5']]
  ]) {
    for (const color of colors) assert.ok(block.includes(color));
  }
});

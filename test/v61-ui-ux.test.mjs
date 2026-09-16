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
    assert.match(styles, new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[^{]*\\{[^}]*var\\(--body-text-scale\\)', 's'));
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


test('fresh botanical palette keeps shared UI colors centralized', () => {
  assert.match(styles, /--bg:\s*#fafbf7;/);
  assert.match(styles, /--surface-soft:\s*#f1f6ed;/);
  assert.match(styles, /--surface-tint:\s*#eef5ea;/);
  assert.match(styles, /--ink:\s*#263025;/);
  assert.match(styles, /--text:\s*#2f392d;/);
  assert.match(styles, /--muted:\s*#687562;/);
  assert.match(styles, /--line:\s*#e1e9dd;/);
  assert.match(styles, /--accent:\s*#6f8f62;/);
  assert.match(styles, /--accent-strong:\s*#4f6f48;/);
  assert.match(styles, /--accent-soft:\s*#e8f2e2;/);
  assert.doesNotMatch(styles, /#713e50|#5e3242|#4f2938|rgba\(113,62,80/);
});


test('bright botanical palette also aligns dark mode accents', () => {
  assert.match(styles, /:root\[data-theme=dark\][^{]*\{[^}]*--accent:#9fc98d;[^}]*--accent-strong:#b0d89e;[^}]*--accent-soft:#31402f;/s);
  assert.match(styles, /event-tab\[aria-pressed=true\][^\n]*background:var\(--accent-strong\)/);
  assert.doesNotMatch(styles, /#dfaabc|#40323a|#352c31/);
});

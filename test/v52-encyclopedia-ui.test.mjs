import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relative => readFile(new URL(relative, import.meta.url), 'utf8');
const [encyclopedia, details, main, styles, home, build, devHtml] = await Promise.all([
  read('../src/js/ui/screens/encyclopedia.js'),
  read('../src/js/ui/screens/details.js'),
  read('../src/js/main.js'),
  read('../src/styles.css'),
  read('../src/js/ui/screens/home.js'),
  read('../build.mjs'),
  read('../index.html')
]);

test('encyclopedia search placeholder matches home exactly without changing search matcher', () => {
  assert.match(home, /placeholder:'꽃 이름·초성·학명 검색'/);
  assert.match(encyclopedia, /placeholder: '꽃 이름·초성·학명 검색'/);
  assert.match(encyclopedia, /matchesFlowerSearch\(flower, state\.searchQuery\)/);
});

test('zero-result encyclopedia state is iconless and uses the requested two lines', () => {
  assert.match(encyclopedia, /className: 'empty-state encyclopedia-empty-state'/);
  assert.match(encyclopedia, /text: '검색 결과가 없어요'/);
  assert.match(encyclopedia, /text: '다른 이름이나 조건으로 검색해보세요\.'/);
  const zeroBlock = encyclopedia.slice(encyclopedia.indexOf("if (!flowers.length)"), encyclopedia.indexOf('const grid ='));
  assert.doesNotMatch(zeroBlock, /emptyState\(/);
  assert.doesNotMatch(zeroBlock, /empty-icon/);
});

test('favorite filter keeps favoritesOnly action/state but renders bookmark SVG instead of stars', () => {
  assert.match(encyclopedia, /dataset: \{ action: 'toggle-favorite-filter' \}/);
  assert.match(encyclopedia, /aria-pressed': state\.encyclopediaFilters\.favoritesOnly/);
  assert.match(encyclopedia, /className: 'bookmark-icon'/);
  assert.match(encyclopedia, /text: '저장한 꽃'/);
  assert.doesNotMatch(encyclopedia, /[☆★]/);
  assert.match(main, /favoritesOnly: !state\.encyclopediaFilters\.favoritesOnly/);
});

test('detail favorite keeps toggle-favorite and aria-pressed while using shared bookmark icon', () => {
  assert.match(details, /dataset: \{ action: 'toggle-favorite', flowerId: flower\.id \}/);
  assert.match(details, /'aria-pressed': state\.favoriteFlowerIds\.includes\(flower\.id\)/);
  assert.match(details, /className: 'bookmark-icon'/);
  assert.match(details, /\? '저장됨' : '저장'/);
  assert.doesNotMatch(details, /[☆★]/);
});

test('filter CSS scopes panel summaries and protects narrow select text without global font shrinking', () => {
  assert.match(styles, /\.filter-panel > summary \{/);
  assert.doesNotMatch(styles, /\.filter-panel summary \{/);
  assert.match(styles, /\.filter-summary-hint \{[\s\S]*?min-width: 0;[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(styles, /\.inline-select-trigger \{[\s\S]*?overflow: hidden;/);
  assert.match(styles, /\.inline-select-value \{[\s\S]*?text-overflow: ellipsis;[\s\S]*?white-space: nowrap;/);
  assert.match(styles, /\.filter-field > span \{[\s\S]*?overflow-wrap: anywhere;/);
});

test('bookmark controls meet requested touch/text styling and have light/dark active states', () => {
  assert.match(styles, /\.bookmark-icon \{[\s\S]*?data:image\/svg\+xml/);
  assert.match(styles, /\.detail-favorite-button \{[\s\S]*?min-height: 44px;[\s\S]*?padding: 8px 12px;[\s\S]*?font-size: \.88rem;/);
  assert.match(styles, /\.detail-title-row h2 \{[\s\S]*?flex: 1 1 180px;[\s\S]*?overflow-wrap: anywhere;/);
  assert.match(styles, /\[data-theme=dark\] \.favorite-filter-toggle\.is-active,[\s\S]*?\[data-theme=dark\] \.detail-favorite-button\.is-active/);
});

test('V61 build emits only the requested DEV file', () => {
  assert.match(build, /꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build, /꽃을보다_V61\.html/);
  assert.match(devHtml, /globalThis\.__FLOWER_APP_DEV__=true/);
  assert.match(devHtml, /꽃 이름·초성·학명 검색/);
});

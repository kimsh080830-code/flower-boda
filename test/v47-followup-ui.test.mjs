import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8');
const [shared, home, events, details, settings, observations, components, main, styles] = await Promise.all([
  read('../src/js/ui/screens/shared.js'),
  read('../src/js/ui/screens/home.js'),
  read('../src/js/ui/screens/events.js'),
  read('../src/js/ui/screens/details.js'),
  read('../src/js/ui/screens/settings.js'),
  read('../src/js/ui/observations.js'),
  read('../src/js/ui/components.js'),
  read('../src/js/main.js'),
  read('../src/styles.css')
]);

test('home search suppresses the input-only focus box and keeps container focus-within', () => {
  assert.match(styles, /\.home-find-search:focus-within\s*\{[^}]*border-color:\s*var\(--accent\)[^}]*box-shadow:/s);
  assert.match(styles, /\.home-find-search input:focus,[\s\S]*?\.home-find-search input:focus-visible\s*\{[^}]*border:\s*0;[^}]*outline:\s*0;[^}]*box-shadow:\s*none;/s);
});

test('event-only empty result keeps only its message while the top reset remains', () => {
  const emptyBranch = events.slice(events.indexOf("const message = state.events.length"), events.indexOf("if (state.eventsError) results.append"));
  assert.match(emptyBranch, /'조건에 맞는 행사가 없어요\.'/);
  assert.match(emptyBranch, /emptyState\(message\)/);
  assert.doesNotMatch(emptyBranch, /필터 초기화|reset-events/);
  assert.match(events, /button\('필터 초기화', 'reset-events', \{ kind: 'tertiary', extraClass: 'btn-small filter-reset' \}\)/);
  assert.doesNotMatch(components, /function emptyState[\s\S]*?className: 'empty-icon'/);
  assert.match(components, /function emptyState[\s\S]*?state-panel empty-state/);
});

test('settings removes only the observation panel connection while observation storage UI code remains', () => {
  assert.doesNotMatch(settings, /renderObservationPanel/);
  assert.doesNotMatch(settings, /observation-panel|나의 관찰 기록/);
  assert.match(observations, /function renderObservationPanel\(state\)/);
  assert.match(observations, /id:'observation-panel'/);
  assert.match(main, /case 'observation-save'/);
});

test('flower detail uses the requested all-events label and preserves its action', () => {
  assert.match(details, /sectionHeader\('이 꽃 보러 가기', '행사 전체보기', 'flower-events-all'\)/);
  assert.match(main, /case 'flower-events-all'/);
});

test('compact cards hide verification while event details keep verification disclosure', () => {
  assert.match(components, /showVerification = !compact/);
  for (const source of [home, details, observations]) assert.match(source, /compact:\s*true[\s\S]{0,35}showVerification:\s*false/);
  assert.match(details, /detailLine\('확인 수준',eventVerificationText\(event\)\)/);
  assert.match(details, /infoDisclosure\('정보 확인'/);
});

test('simple option controls are anchored, single-open, and leave the observation editor select untouched', () => {
  assert.doesNotMatch(shared, /el\('select'/);
  assert.doesNotMatch(home, /el\('select'/);
  assert.doesNotMatch(settings, /el\('select'/);
  assert.match(shared, /el\('details', \{ className: 'inline-select'/);
  assert.match(shared, /className: 'inline-select-options'/);
  assert.match(styles, /\.inline-select\s*\{[^}]*position:\s*relative;/s);
  assert.match(styles, /\.inline-select-options\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(100% - 1px\);/s);
  assert.match(styles, /\.inline-select-options\s*\{[^}]*max-height:\s*220px;[^}]*overflow-y:\s*auto;/s);
  assert.match(styles, /\.event-flower-panel\s*\{[^}]*position:\s*absolute;[^}]*top:\s*calc\(100% - 1px\);/s);
  assert.match(styles, /\.event-filters \.inline-select-trigger \{ padding-left: 12px; \}/);
  assert.match(styles, /\.event-flower-search input \{[^}]*padding:\s*8px 9px 8px 12px;/s);
  assert.match(main, /document\.querySelectorAll\('details\.inline-select\[open\]'\)/);
  assert.match(observations, /el\('select',\{id:'observation-flower'/);
});

test('event flower selection applies direct matching immediately without clearing other filters', () => {
  assert.match(events, /className: 'inline-select event-flower-select'/);
  assert.match(events, /id: 'event-flower-search-filter'/);
  assert.match(main, /case 'set-event-flower':[\s\S]*?state\.eventFilter = \{ \.\.\.state\.eventFilter, flower: target\.dataset\.flowerId, directFlowerOnly: true \}/);
  assert.match(main, /case 'clear-event-flower':[\s\S]*?state\.eventFilter = \{ \.\.\.state\.eventFilter, flower: '', directFlowerOnly: false \}/);
  assert.match(main, /state\.eventFlowerSearchQuery = event\.target\.value;[\s\S]*?updateEventFlowerChoices\(state\)/);
});

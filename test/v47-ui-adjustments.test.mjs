import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8');
const [details, events, settings, components, main, styles, template, v47Data, v47Snapshot] = await Promise.all([
  read('../src/js/ui/screens/details.js'),
  read('../src/js/ui/screens/events.js'),
  read('../src/js/ui/screens/settings.js'),
  read('../src/js/ui/components.js'),
  read('../src/js/main.js'),
  read('../src/styles.css'),
  read('../src/index.template.html'),
  read('../src/js/data.js'),
  read('../src/js/eventSnapshot.js')
]);
const hash = (value) => createHash('sha256').update(value).digest('hex');
const approvedFlowerHash = (source) => {
  const sandbox={__mods:Object.create(null)};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'src/js/data.js'});
  const flowers=sandbox.__mods['js/data.js'].FLOWERS.map((flower)=>{
    const { image, localImage, imageCredit, ...approved }=flower;
    return approved;
  });
  return hash(JSON.stringify(flowers));
};

test('approved non-image flower data and event source remain unchanged', () => {
  assert.equal(approvedFlowerHash(v47Data), '4c264420a06c5055bbf6befea06ddee767e70448197ffe80bb7eb15ea1dccc74');
  assert.equal(hash(v47Snapshot), '32fc3db0a24dc5d46de8cd981f4e837d976909c2dadc7676cd1c65fb45ea61b1');
});

test('flower detail restores one labeled bloom period, scientific name, and habitat without the detail observation button', () => {
  assert.match(details, /detailLine\('개화 기간', formatBloomPeriod\(flower\.bloom\)\)/);
  assert.match(details, /className: 'detail-scientific'/);
  assert.match(details, /infoDisclosure\('서식 환경', environment, true\)/);
  assert.doesNotMatch(details, /button\('이 꽃 관찰 기록 남기기'/);
  assert.doesNotMatch(details, /검증 수준/);
  assert.match(details, /language\.note \? el\('p'/);
});

test('small flower posters render only a real scientific-name slot', () => {
  assert.match(components, /className: 'flower-poster-scientific'/);
  assert.match(components, /flower\.scientificName \|\| flower\.taxonomy\?\.acceptedName/);
  const poster = components.slice(components.indexOf('function flowerPoster'), components.indexOf('function eventVerificationText'));
  assert.doesNotMatch(poster, /otherNameLine\(/);
  assert.match(styles, /\.flower-poster-scientific\s*\{[^}]*min-height:\s*16\.2px/s);
});

test('event detail removes only the no-result minus icon and aligns top-level notes and coordinates', () => {
  assert.match(details, /noRelatedEvents\.querySelector\('\.empty-icon'\)\?\.remove\(\)/);
  assert.match(styles, /\.detail-layer > \.event-detail-note/);
  assert.match(styles, /@media \(max-width: 400px\)[\s\S]*?\.detail-location-meta \{ margin-inline: 14px; \}/);
});

test('event flower query and single selection have separate state while the date filter remains unchanged', () => {
  assert.match(main, /eventFlowerSearchQuery: ''/);
  assert.match(main, /state\.eventFilter = \{ \.\.\.state\.eventFilter, flower: target\.dataset\.flowerId, directFlowerOnly: true \}/);
  assert.match(events, /matchesFlowerSearch\(flower, query\)/);
  assert.match(events, /className: 'event-selected-flower'/);
  assert.match(events, /className: 'inline-select event-flower-select'/);
  assert.doesNotMatch(events, /\(출처 표기\)/);
  assert.match(main, /if \(input\.dataset\.action === 'filter-events-date'\)[\s\S]*?date: input\.value \|\| ''/);
});

test('settings hide only the visible region row and keep recent clearing inside its disclosure with confirmation', () => {
  assert.doesNotMatch(settings, /selectRow\('지역'/);
  assert.match(settings, /id:'recent-flower-panel'/);
  assert.ok(settings.indexOf("button('최근 기록 지우기'") < settings.indexOf('main.append(recent)'));
  assert.match(settings, /cancel-clear-recent/);
  assert.match(settings, /confirm-clear-recent/);
  assert.match(main, /recentDetailsOpen: false/);
  assert.match(main, /recentClearPending: false/);
  assert.match(main, /case 'confirm-clear-recent'/);
  assert.doesNotMatch(settings, /renderObservationPanel/);
  assert.doesNotMatch(settings, /나의 관찰 기록/);
});

test('classification and event all-view styling use existing palette without box or shadow', () => {
  assert.match(styles, /\.taxonomy-step\.is-current\s*\{[^}]*border:\s*1px solid var\(--accent\)[^}]*background:\s*var\(--accent-soft\)/s);
  assert.match(styles, /\.event-view-all-link[\s\S]*?border:\s*0;[\s\S]*?background:\s*transparent;[\s\S]*?color:\s*var\(--accent-strong\);[\s\S]*?box-shadow:\s*none;/);
});

test('V61 DEV title changes while preserved in-app about text remains unchanged', () => {
  assert.match(template, /Botanical V61 DEV/);
  assert.match(settings, /꽃을 보다 · V47/);
  for (const source of [details, events, settings, components, main, styles, template]) assert.doesNotMatch(source, /Botanical V4[0-4]|꽃을 보다 · V4[0-4]/);
});

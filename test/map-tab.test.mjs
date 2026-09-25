import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
const [mainSource, shellSource, mapSource, uiSource, screensSource, modulesSource, styles] = await Promise.all([
  read('src/js/main.js'),
  read('src/js/ui/screens/shell.js'),
  read('src/js/ui/screens/map.js'),
  read('src/js/ui.js'),
  read('src/js/ui/screens.js'),
  read('src/modules.json'),
  read('src/styles.css')
]);

function makeElement(tag, props = {}, children = []) {
  return { tag, props, children: children.filter(Boolean), append(...items) { this.children.push(...items.filter(Boolean)); } };
}

function renderMap(mapViewMode) {
  const context = vm.createContext({});
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/ui/dom.js']={el:${makeElement.toString()}};\n__mods['js/data.js']={getFlowerById:()=>({nameKo:'수국'})};\n__mods['js/mapCourses.js']={FLOWER_COURSES:[{id:'course-one',name:'꽃 코스',region:'서울',placeIds:['place-one'],estimatedDuration:'약 1시간',recommendedMonths:[6],relatedFlowerIds:['hydrangea'],description:'설명'}],getFlowerCourseById:()=>null};\n__mods['js/mapService.js']={getFlowerPlaceItems:()=>[{id:'place-one',name:'꽃 장소',address:'주소',relatedFlowerNames:['수국'],bloomLabel:'6~7월',distanceLabel:''}],formatBloomMonths:()=> '6월'};\n${mapSource}`, context);
  return vm.runInContext('__mods["js/ui/screens/map.js"].renderMap', context)({ mapViewMode, mapLocationStatus:'idle', mapSelectedPlaceId:'', mapSelectedCourseId:'', mapFlowerFilterId:'', mapUserLocation:null });
}

function findAll(node, predicate, rows = []) {
  if (!node) return rows;
  if (predicate(node)) rows.push(node);
  for (const child of node.children || []) findAll(child, predicate, rows);
  return rows;
}

test('bottom navigation uses the requested home, events, map, encyclopedia, my order', () => {
  const order = [...shellSource.matchAll(/\['(home|events|map|encyclopedia|my)',\s*'[^']+',\s*'([^']+)'\]/g)]
    .map(([, tab, label]) => [tab, label]);
  assert.deepEqual(order, [['home','홈'],['events','행사'],['map','지도'],['encyclopedia','도감'],['my','MY']]);
  assert.match(styles, /\.bottom-nav\s*\{[^}]*grid-template-columns:\s*repeat\(5,1fr\)/s);
  assert.match(styles, /\.nav-map\s*\{\s*--icon:\s*url\("data:image\/svg\+xml/);
});

test('map is registered as a valid main swipe tab in the requested order', () => {
  assert.match(mainSource, /const VALID_TABS = \[[^\]]*'map'/);
  assert.match(mainSource, /const MAIN_NAV_TABS = \['home', 'events', 'map', 'encyclopedia', 'my'\]/);
  assert.match(uiSource, /\['home','events','map','encyclopedia','my'\]\.includes\(state\.currentTab\)/);
});

test('map screen is registered and rendered without changing header actions', () => {
  assert.ok(JSON.parse(modulesSource).common.includes('js/ui/screens/map.js'));
  assert.match(screensSource, /const \{ renderMap \} = __mods\["js\/ui\/screens\/map\.js"\]/);
  assert.match(uiSource, /case 'map': screen = renderMap\(state\); break;/);
  assert.match(shellSource, /action:'open-bloom-calendar'/);
  assert.match(shellSource, /action:'go-settings'/);
  assert.equal((shellSource.match(/action:'open-bloom-calendar'/g) || []).length, 1);
  assert.equal((shellSource.match(/action:'go-settings'/g) || []).length, 1);
});

test('map starts in nearby mode and exposes only the two view actions', () => {
  assert.match(mainSource, /mapViewMode:\s*'nearby'/);
  const screen = renderMap(undefined);
  const tabs = findAll(screen, (node) => node.props?.role === 'tab');
  assert.deepEqual(tabs.map((node) => node.props.dataset.mode), ['nearby','course']);
  assert.equal(tabs[0].props['aria-selected'], 'true');
  assert.equal(tabs[1].props['aria-selected'], 'false');
  assert.equal(findAll(screen, (node) => node.props?.id === 'flower-map').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.dataset?.action === 'request-map-location').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.dataset?.action === 'select-map-place').length, 1);
});

test('nearby and course modes render their matching content', () => {
  const nearby = renderMap('nearby');
  const course = renderMap('course');
  assert.equal(findAll(nearby, (node) => node.props?.id === 'flower-map').length, 1);
  assert.equal(findAll(nearby, (node) => node.props?.text === '꽃 장소').length, 1);
  assert.equal(findAll(course, (node) => node.props?.dataset?.action === 'select-map-course').length, 1);
  const courseTabs = findAll(course, (node) => node.props?.role === 'tab');
  assert.equal(courseTabs[0].props['aria-selected'], 'false');
  assert.equal(courseTabs[1].props['aria-selected'], 'true');
  assert.match(mainSource, /case 'select-map-view':[\s\S]*target\.dataset\.mode === 'course' \? 'course' : 'nearby'[\s\S]*render\(\)/);
});

test('existing events, home, and encyclopedia render branches remain present', () => {
  for (const [tab, renderName] of [['events','renderEvents'],['encyclopedia','renderEncyclopedia']]) {
    assert.match(uiSource, new RegExp(`case '${tab}': screen = ${renderName}\\(state\\); break;`));
  }
  assert.match(uiSource, /default: screen = renderHome\(state\)/);
});

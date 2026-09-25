import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [mySource, settingsSource, preferencesSource, notificationsSource, shellSource, mainSource, uiSource, homeSource, captureSource, detailsSource, modulesText] = await Promise.all([
  read('src/js/ui/screens/my.js'), read('src/js/ui/screens/settings.js'), read('src/js/preferences.js'),
  read('src/js/ui/notifications.js'), read('src/js/ui/screens/shell.js'), read('src/js/main.js'), read('src/js/ui.js'),
  read('src/js/ui/screens/home.js'), read('src/js/ui/screens/capture.js'), read('src/js/ui/screens/details.js'), read('src/modules.json')
]);

function element(tag, props = {}, children = []) {
  return { tag, props, children: children.flat().filter(Boolean), append(...items) { this.children.push(...items.flat().filter(Boolean)); } };
}
function findAll(node, predicate, rows = []) {
  if (!node) return rows;
  if (predicate(node)) rows.push(node);
  for (const child of node.children || []) findAll(child, predicate, rows);
  return rows;
}

function renderMy(state = {}) {
  const flowers = { rose:{ id:'rose', nameKo:'장미' }, cosmos:{ id:'cosmos', nameKo:'코스모스' } };
  const context = vm.createContext({});
  vm.runInContext(`const __mods=Object.create(null);
__mods['js/data.js']={getFlowerById:(id)=>(${JSON.stringify(flowers)})[id]||null};
__mods['js/ui/dom.js']={el:${element.toString()},button:(text,action,options={})=>${element.toString()}('button',{text,dataset:{action,...(options.data||{})}},[])};
__mods['js/ui/components.js']={flowerListRow:(flower)=>${element.toString()}('flower',{text:flower.nameKo}),sectionHeader:(title)=>${element.toString()}('header',{text:title})};
__mods['js/ui/observations.js']={renderFavoriteGarden:(_state,options)=>${element.toString()}('favorite',{text:options.title})};
${mySource}`, context);
  return vm.runInContext('__mods["js/ui/screens/my.js"].renderMy', context)({ recentFlowerIds:['rose','cosmos'], recentClearPending:false, settings:{recentEnabled:true}, ...state });
}

test('five main tabs and swipe order are home, events, map, encyclopedia, my', () => {
  assert.match(shellSource, /\['home', 'nav-home', '홈'\][\s\S]*\['events', 'nav-calendar', '행사'\][\s\S]*\['map', 'nav-map', '지도'\][\s\S]*\['encyclopedia', 'nav-book', '도감'\][\s\S]*\['my', 'nav-my', 'MY'\]/);
  assert.match(mainSource, /const MAIN_NAV_TABS = \['home', 'events', 'map', 'encyclopedia', 'my'\]/);
  assert.match(mainSource, /const VALID_TABS = \[[^\]]*'my'/);
  assert.match(uiSource, /case 'my': screen = renderMy\(state\); break;/);
});

test('MY contains favorites and recent flowers without inventing saved courses', () => {
  const screen = renderMy();
  assert.equal(findAll(screen, (node) => node.props?.text === 'MY').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.text === '즐겨찾기한 꽃').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.text === '최근 본 꽃').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.dataset?.key === 'recentEnabled').length, 1);
  assert.equal(findAll(screen, (node) => node.tag === 'flower').length, 2);
  assert.doesNotMatch(mySource, /저장한 코스|savedCourse/);
  assert.ok(JSON.parse(modulesText).common.includes('js/ui/screens/my.js'));
});

test('settings keeps app behavior controls and removes personal flower records', () => {
  for (const label of ['화면 모드','본문 글자 크기','행사 알림','위치 사용','데이터 출처','서비스 정보','고급 설정']) assert.match(settingsSource, new RegExp(label));
  for (const removed of ['최근 본 꽃 보기','저장한 꽃','renderFavoriteGarden','flowerListRow']) assert.doesNotMatch(settingsSource, new RegExp(removed));
  assert.match(preferencesSource, /eventNotificationsEnabled:true/);
  assert.match(preferencesSource, /locationEnabled:true/);
  assert.match(preferencesSource, /flower-info\.settings\.v1/);
});

test('notification UI explicitly identifies event notifications', () => {
  assert.match(shellSource, /ariaLabel:'행사 알림'/);
  assert.match(notificationsSource, /text: '행사 알림'/);
  assert.match(notificationsSource, /시작 예정인 꽃 행사 소식이에요/);
  assert.match(notificationsSource, /설정에서 행사 알림이 꺼져 있어요/);
});

test('flower, photo result, and home reuse the map place flow', () => {
  assert.match(detailsSource, /장소 \$\{places\.length\}곳/);
  assert.match(detailsSource, /가까운 곳 \$\{nearestDistance\}/);
  assert.match(detailsSource, /관련 행사 \$\{related\.length\}개/);
  assert.match(captureSource, /꽃 상세 · 볼 수 있는 곳 \$\{placeCount\}곳/);
  assert.match(captureSource, /꽃 상세에서 실제 볼 수 있는 장소로 이어갈 수 있어요/);
  assert.match(homeSource, /text:'개화 정보'/);
  assert.match(homeSource, /button\(`볼 수 있는 곳 \$\{places\.length\}곳`,'show-flower-on-map'/);
  assert.match(mainSource, /case 'show-flower-on-map': showFlowerOnMap\(target\.dataset\.flowerId\)/);
});

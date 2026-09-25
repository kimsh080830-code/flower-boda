import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
const [placesSource, coursesSource, serviceSource, mapSource, detailsSource, mainSource, uiSource, eventsText, modulesText] = await Promise.all([
  read('src/js/mapPlaces.js'),
  read('src/js/mapCourses.js'),
  read('src/js/mapService.js'),
  read('src/js/ui/screens/map.js'),
  read('src/js/ui/screens/details.js'),
  read('src/js/main.js'),
  read('src/js/ui.js'),
  read('data/verified-events.json'),
  read('src/modules.json')
]);

const flowerNames = { hydrangea:'수국', lotus:'연꽃', poppy:'개양귀비', lavender:'라벤더', sunflower:'해바라기', 'red-spider-lily':'꽃무릇', 'cherry-blossom':'벚꽃' };

function loadMapModules() {
  const context = vm.createContext({ Math, Number, Set, Promise });
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/data.js']={getFlowerById:(id)=>(${JSON.stringify(flowerNames)})[id]?{id,nameKo:(${JSON.stringify(flowerNames)})[id]}:null};\n${placesSource}\n${coursesSource}\n${serviceSource}`, context);
  return {
    places: vm.runInContext('__mods["js/mapPlaces.js"]', context),
    courses: vm.runInContext('__mods["js/mapCourses.js"]', context),
    service: vm.runInContext('__mods["js/mapService.js"]', context)
  };
}

function makeElement(tag, props = {}, children = []) {
  return { tag, props, children: children.filter(Boolean), append(...items) { this.children.push(...items.filter(Boolean)); } };
}

function renderMap(state = {}) {
  const { courses, service } = loadMapModules();
  const context = vm.createContext({ courses, service });
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/ui/dom.js']={el:${makeElement.toString()}};\n__mods['js/data.js']={getFlowerById:(id)=>(${JSON.stringify(flowerNames)})[id]?{id,nameKo:(${JSON.stringify(flowerNames)})[id]}:null};\n__mods['js/mapCourses.js']=courses;\n__mods['js/mapService.js']=service;\n${mapSource}`, context);
  return vm.runInContext('__mods["js/ui/screens/map.js"].renderMap', context)({
    mapViewMode:'nearby', mapLocationStatus:'idle', mapSelectedPlaceId:'', mapSelectedCourseId:'', mapFlowerFilterId:'', mapUserLocation:null, ...state
  });
}

function findAll(node, predicate, rows = []) {
  if (!node) return rows;
  if (predicate(node)) rows.push(node);
  for (const child of node.children || []) findAll(child, predicate, rows);
  return rows;
}

test('flower courses load with valid two-to-four place references and stable order', () => {
  const { places, courses, service } = loadMapModules();
  const placeIds = new Set(places.FLOWER_PLACES.map((place) => place.id));
  assert.equal(courses.FLOWER_COURSES.length, 2);
  for (const course of courses.FLOWER_COURSES) {
    for (const key of ['id','name','placeIds','estimatedDuration','description','recommendedMonths','region','relatedFlowerIds']) assert.ok(course[key] !== undefined, `${course.id}:${key}`);
    assert.ok(course.placeIds.length >= 2 && course.placeIds.length <= 4);
    assert.ok(course.placeIds.every((id) => placeIds.has(id)));
    assert.equal(service.getFlowerPlaceItems(null, { placeIds: course.placeIds }).map((place) => place.id).join(','), [...course.placeIds].join(','));
  }
});

test('five added course places keep exact coordinates from verified flower events', () => {
  const { places } = loadMapModules();
  const events = JSON.parse(eventsText).events;
  const addedIds = ['2540520','1592898','1592837','3484079','695592'];
  for (const sourceEventId of addedIds) {
    const place = places.FLOWER_PLACES.find((item) => item.sourceEventId === sourceEventId);
    const event = events.find((item) => item.contentid === sourceEventId);
    assert.ok(place && event);
    assert.equal(place.latitude, Number(event.mapy));
    assert.equal(place.longitude, Number(event.mapx));
    assert.equal(place.sourceEventUuid, event.id);
    assert.equal(event.category, 'flower');
  }
});

test('selected course renders ordered place actions and retains course selection state', () => {
  const screen = renderMap({ mapViewMode:'course', mapSelectedCourseId:'seoul-southeast-cherry-course' });
  const courseCards = findAll(screen, (node) => node.props?.dataset?.action === 'select-map-course');
  assert.equal(courseCards.length, 2);
  assert.equal(courseCards[0].props['aria-pressed'], 'true');
  const placeCards = findAll(screen, (node) => node.props?.dataset?.action === 'select-map-place');
  assert.deepEqual(placeCards.map((node) => node.props.dataset.placeId), [
    'yangjaecheon-cherry-road', 'seokchon-lake-cherry-road', 'jangan-cherry-road'
  ]);
  assert.deepEqual(placeCards.map((node) => node.children[0].props.text.slice(0, 2)), ['1.','2.','3.']);
});

test('course map uses numbered div icons, course-only places, and a dashed guide polyline', () => {
  assert.match(serviceSource, /viewMode === 'course' \? getFlowerCourseById\(selectedCourseId\) : null/);
  assert.match(serviceSource, /placeIds: course\?\.placeIds \|\| null/);
  assert.match(serviceSource, /L\.divIcon\(/);
  assert.match(serviceSource, /html: `<span>\$\{index \+ 1\}<\/span>`/);
  assert.match(serviceSource, /L\.polyline\(bounds/);
  assert.match(serviceSource, /dashArray: '6 7'/);
});

test('event matching is exact and only linked events expose the internal map action', () => {
  const { places } = loadMapModules();
  const linked = places.getFlowerPlaceForEvent({ id:'e50b142c-6ec2-4374-a7ca-a10ece200d48', latitude:37.511898414927, longitude:127.10424458301475 });
  assert.equal(linked.id, 'seokchon-lake-cherry-road');
  assert.equal(places.getFlowerPlaceForEvent({ id:'unlinked', latitude:35, longitude:129 }), null);
  assert.match(detailsSource, /if \(linkedMapPlace\)[\s\S]*button\('지도에서 보기', 'show-event-on-map'/);
  assert.match(mainSource, /case 'show-event-on-map': showEventOnMap\(target\.dataset\.placeId\)/);
  assert.match(mainSource, /state\.mapSelectedPlaceId=placeId;[\s\S]*switchTab\('map'\)/);
});

test('flower detail linking filters related places and can return to all places', () => {
  const { places, service } = loadMapModules();
  assert.equal(places.getFlowerPlacesByFlowerId('cherry-blossom').length, 5);
  assert.equal(places.getFlowerPlacesByFlowerId('snowdrop').length, 0);
  assert.equal(service.getFlowerPlaceItems(null, { flowerId:'hydrangea' }).length, 1);
  const screen = renderMap({ mapFlowerFilterId:'cherry-blossom' });
  assert.equal(findAll(screen, (node) => node.props?.dataset?.action === 'select-map-place').length, 5);
  assert.equal(findAll(screen, (node) => node.props?.dataset?.action === 'clear-map-flower-filter').length, 1);
  assert.match(detailsSource, /if \(getFlowerPlacesByFlowerId\(flower\.id\)\.length\)[\s\S]*button\('볼 수 있는 곳', 'show-flower-on-map'/);
  assert.match(mainSource, /case 'clear-map-flower-filter':[\s\S]*state\.mapFlowerFilterId=''[\s\S]*render\(\)/);
});

test('stage-three state remains in memory and is passed to the map renderer', () => {
  for (const pattern of [/mapSelectedCourseId: ''/, /mapFlowerFilterId: ''/, /case 'select-map-course'/, /case 'show-flower-on-map'/]) assert.match(mainSource, pattern);
  assert.doesNotMatch(mainSource, /localStorage[^\n]*(mapSelectedCourseId|mapFlowerFilterId)/);
  assert.match(uiSource, /selectedCourseId: state\.mapSelectedCourseId/);
  assert.match(uiSource, /flowerFilterId: state\.mapFlowerFilterId/);
  const common = JSON.parse(modulesText).common;
  assert.ok(common.indexOf('js/mapPlaces.js') < common.indexOf('js/mapCourses.js'));
  assert.ok(common.indexOf('js/mapCourses.js') < common.indexOf('js/mapService.js'));
});

test('nearby location behavior remains wired after course support', () => {
  assert.match(mainSource, /resolveMapLocation\(\{geolocation,requestPosition:requestCurrentPosition\}\)/);
  const { service } = loadMapModules();
  const sorted = service.getFlowerPlaceItems({ latitude:37.5, longitude:127.05 });
  assert.ok(sorted[0].distanceMeters <= sorted[1].distanceMeters);
});

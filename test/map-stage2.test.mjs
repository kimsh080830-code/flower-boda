import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(`../${relative}`, import.meta.url), 'utf8');
const [placesSource, serviceSource, mapSource, mainSource, uiSource, weatherSource, modulesText, eventsText] = await Promise.all([
  read('src/js/mapPlaces.js'),
  read('src/js/mapService.js'),
  read('src/js/ui/screens/map.js'),
  read('src/js/main.js'),
  read('src/js/ui.js'),
  read('src/js/weatherService.js'),
  read('src/modules.json'),
  read('data/verified-events.json')
]);

const flowerNames = {
  hydrangea: '수국', lotus: '연꽃', poppy: '개양귀비', lavender: '라벤더',
  sunflower: '해바라기', 'red-spider-lily': '꽃무릇'
};

function mapModules() {
  const context = vm.createContext({ Math, Number, Set, Promise });
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/data.js']={getFlowerById:(id)=>(${JSON.stringify(flowerNames)})[id]?{nameKo:(${JSON.stringify(flowerNames)})[id]}:null};\n${placesSource}\n${serviceSource}`, context);
  return {
    places: vm.runInContext('__mods["js/mapPlaces.js"]', context),
    service: vm.runInContext('__mods["js/mapService.js"]', context)
  };
}

function makeElement(tag, props = {}, children = []) {
  return { tag, props, children: children.filter(Boolean), append(...items) { this.children.push(...items.filter(Boolean)); } };
}

function renderMap(state = {}) {
  const { service } = mapModules();
  const context = vm.createContext({ service });
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/ui/dom.js']={el:${makeElement.toString()}};\n__mods['js/mapService.js']=service;\n${mapSource}`, context);
  return vm.runInContext('__mods["js/ui/screens/map.js"].renderMap', context)({
    mapViewMode: 'nearby', mapLocationStatus: 'idle', mapSelectedPlaceId: '', mapUserLocation: null, ...state
  });
}

function findAll(node, predicate, rows = []) {
  if (!node) return rows;
  if (predicate(node)) rows.push(node);
  for (const child of node.children || []) findAll(child, predicate, rows);
  return rows;
}

test('static flower places reuse exact verified flower-event coordinates and required fields', () => {
  const { places } = mapModules();
  const events = JSON.parse(eventsText).events;
  assert.equal(places.FLOWER_PLACES.length, 6);
  for (const place of places.FLOWER_PLACES) {
    for (const key of ['id','name','latitude','longitude','address','region','relatedFlowerIds','bloomMonths','description']) assert.ok(place[key] !== undefined, `${place.id}:${key}`);
    const source = events.find((event) => event.contentid === place.sourceEventId);
    assert.ok(source, place.sourceEventId);
    assert.equal(place.latitude, Number(source.mapy));
    assert.equal(place.longitude, Number(source.mapx));
    assert.equal(source.category, 'flower');
  }
});

test('haversine distance, near-first sorting, and m/km labels are stable', () => {
  const { service } = mapModules();
  const distance = service.haversineDistanceMeters({latitude:37,longitude:127},{latitude:38,longitude:127});
  assert.ok(distance > 111000 && distance < 112000);
  assert.equal(service.formatDistance(349), '350m');
  assert.equal(service.formatDistance(999), '990m');
  assert.equal(service.formatDistance(1234), '1.2km');
  const sorted = service.sortPlacesByDistance([
    {id:'far',latitude:38,longitude:127},
    {id:'near',latitude:37.01,longitude:127}
  ], {latitude:37,longitude:127});
  assert.deepEqual(sorted.map((place) => place.id), ['near','far']);
  assert.deepEqual(service.sortPlacesByDistance([{id:'first'},{id:'second'}], null).map((place) => place.id), ['first','second']);
});

test('mocked geolocation returns ready, denied, and retryable error results', async () => {
  const { service } = mapModules();
  const success = await service.resolveMapLocation({
    geolocation:{}, requestPosition:async()=>({latitude:37.5,longitude:127})
  });
  assert.deepEqual({...success.location},{latitude:37.5,longitude:127});
  assert.equal(success.status, 'ready');
  const denied = await service.resolveMapLocation({requestPosition:async()=>{throw {code:1};}});
  assert.equal(denied.status, 'denied');
  assert.equal(denied.error, 'permission-denied');
  const failed = await service.resolveMapLocation({requestPosition:async()=>{throw new Error('unavailable');}});
  assert.equal(failed.status, 'error');
  assert.equal(failed.error, 'position-unavailable');
});

test('map renders without location, keeps all places, and shows explicit location states', () => {
  const screen = renderMap();
  assert.equal(findAll(screen, (node) => node.props?.id === 'flower-map').length, 1);
  assert.equal(findAll(screen, (node) => node.props?.dataset?.action === 'select-map-place').length, 6);
  assert.equal(findAll(screen, (node) => node.props?.text === '내 위치').length, 1);
  for (const [status, message] of [
    ['checking','현재 위치를 확인하고 있어요.'],
    ['denied','위치 권한이 필요해요.'],
    ['error','현재 위치를 확인하지 못했어요.']
  ]) assert.equal(findAll(renderMap({mapLocationStatus:status}), (node) => node.props?.text === message).length, 1);
});

test('distance appears only with location, place selection is reflected, and course stays pending', () => {
  const nearby = renderMap({mapUserLocation:{latitude:37.63,longitude:127.05},mapSelectedPlaceId:'choansan-hydrangea-garden'});
  const cards = findAll(nearby, (node) => node.props?.dataset?.action === 'select-map-place');
  assert.equal(cards[0].props.dataset.placeId, 'choansan-hydrangea-garden');
  assert.equal(cards[0].props['aria-pressed'], 'true');
  assert.match(cards[0].children[1].props.text, /m|km/);
  const course = renderMap({mapViewMode:'course'});
  assert.equal(findAll(course, (node) => node.props?.text === '꽃 코스를 준비하고 있어요.').length, 1);
  assert.equal(findAll(course, (node) => node.props?.dataset?.action === 'select-map-place').length, 0);
});

test('Leaflet is lazy-loaded with SRI, OSM attribution, and a contained retry fallback', () => {
  assert.match(serviceSource, /leaflet@1\.9\.4\/dist\/leaflet\.js/);
  assert.match(serviceSource, /sha256-20nQCchB9co0qIjJZRGuk2\/Z9VM\+kNiyxNV1lvTlZBo=/);
  assert.match(serviceSource, /tile\.openstreetmap\.org/);
  assert.match(serviceSource, /OpenStreetMap<\/a> contributors/);
  assert.match(serviceSource, /지도를 불러오지 못했어요\./);
  assert.match(serviceSource, /dataset\.action = 'retry-map'/);
  assert.match(serviceSource, /script\[src=[^\n]+\]\`\)\?\.remove\(\)/);
  assert.match(uiSource, /state\.currentTab === 'map'[\s\S]*mountFlowerMap/);
});

test('map state and actions stay in memory and never add storage keys', () => {
  for (const entry of [
    /mapUserLocation: null/,
    /mapLocationStatus: 'idle'/,
    /mapLocationError: ''/,
    /mapSelectedPlaceId: ''/,
    /case 'request-map-location'/,
    /case 'select-map-place'/
  ]) assert.match(mainSource, entry);
  assert.doesNotMatch(mainSource, /localStorage[^\n]*map|map[^\n]*localStorage/i);
  const common = JSON.parse(modulesText).common;
  assert.ok(common.indexOf('js/mapPlaces.js') < common.indexOf('js/mapService.js'));
  assert.ok(common.indexOf('js/mapService.js') < common.indexOf('js/ui/screens/map.js'));
});

test('automatic weather startup does not prompt for location permission', async () => {
  const context = vm.createContext({URLSearchParams,AbortController,setTimeout,clearTimeout});
  vm.runInContext(`const __mods=Object.create(null);\n${weatherSource}`,context);
  const weather = vm.runInContext('__mods["js/weatherService.js"]',context);
  let requested = 0;
  const geolocation = {getCurrentPosition(){requested += 1;}};
  const promptResult = await weather.loadCurrentWeatherWithoutPrompt({permissions:{query:async()=>({state:'prompt'})},geolocation});
  assert.equal(promptResult,null);
  assert.equal(requested,0);
  assert.match(mainSource, /loadCurrentWeatherWithoutPrompt\(\)/);
});

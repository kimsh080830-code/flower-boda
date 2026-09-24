import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [dateSource, eventSource, searchSource, homeSource, mainSource] = await Promise.all([
  readFile(new URL('../src/js/dateUtils.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/eventService.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/searchUtils.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/ui/screens/home.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/main.js', import.meta.url), 'utf8')
]);

function element(tag, props = {}, children = []) {
  return { tag, props, children: children.flat().filter(Boolean), append(...items) { this.children.push(...items.flat().filter(Boolean)); } };
}

function homeModule() {
  const context = vm.createContext({ Date, Intl, URL, Number });
  vm.runInContext(`const __mods=Object.create(null);
${dateSource}
${searchSource}
__mods['js/config.js']={APP_CONFIG:{STANDALONE:true,API:{events:'/api/events',eventDetail:'/api/event-detail'},EVENT_CACHE_TTL_MS:1000}};
__mods['js/runtimeHooks.js']={hooks:{shouldForceNetworkFailure:()=>false}};
__mods['js/data.js']={FLOWERS:[]};
__mods['js/storage.js']={getCache:()=>null,setCache:()=>false};
${eventSource}
__mods['js/todayFlower.js']={selectTodayFlower:()=>({flower:null})};
__mods['js/flowerRelay.js']={getFlowerRelaySnapshot:()=>({})};
__mods['js/ui/dom.js']={el:${element.toString()},button:(text,action,options={})=>${element.toString()}('button',{text,dataset:{action,...(options.data||{})}},[]),image:()=>null,imageCreditBadge:()=>null};
__mods['js/ui/components.js']={bloomFlow:()=>null,sectionHeader:()=>${element.toString()}('header'),emptyState:()=>null,eventErrorState:()=>null,formatEventRange:event=>event.startDate===event.endDate?event.startDate:event.startDate+' ~ '+event.endDate,primaryFlowerName:flower=>flower?.nameKo||'',flowerPoster:()=>null,renderSkeletonRows:()=>null,statusBadge:status=>${element.toString()}('status',{text:status?.label||''})};
__mods['js/ui/screens/shared.js']={topSeasonFlowers:()=>[]};
__mods['js/flowerViewData.js']={shortSentence:value=>value||'',habitatSummary:()=>'',identificationSummary:()=>''};
${homeSource}`, context);
  return vm.runInContext('__mods["js/ui/screens/home.js"]', context);
}

function event(id, startDate, status = { code:'upcoming', label:'곧 시작', rank:1 }, overrides = {}) {
  return {
    id,
    title:`${id} 행사`,
    startDate,
    endDate:startDate,
    place:`${id} 장소`,
    category:'flower',
    status,
    verification:{status:'detail-checked'},
    ...overrides
  };
}

for (const count of [0, 1, 2, 3, 4]) {
  test(`home shows ${Math.min(count, 3)} event rows from ${count} available events`, () => {
    const rows = Array.from({ length:count }, (_, index) => event(`event-${index + 1}`, `202610${String(index + 1).padStart(2, '0')}`));
    assert.equal(homeModule().selectHomeEvents(rows).length, Math.min(count, 3));
  });
}

test('ongoing, soon, and later events follow existing status priority and start-date order', () => {
  const ongoing = { code:'ongoing', label:'진행 중', rank:0 };
  const soon = { code:'upcoming', label:'곧 시작', rank:1 };
  const later = { code:'upcoming', label:'예정', rank:2 };
  const selected = homeModule().selectHomeEvents([
    event('later', '20261101', later),
    event('soon-late', '20261005', soon),
    event('ongoing', '20260901', ongoing, { endDate:'20261010' }),
    event('soon-early', '20261002', soon)
  ]);
  assert.deepEqual(Array.from(selected, (item) => item.id), ['ongoing', 'soon-early', 'soon-late']);
});

test('ended, invalid-date, reversed-date, and non-exposed events are excluded', () => {
  const selected = homeModule().selectHomeEvents([
    event('valid', '20261002'),
    event('ended', '20260901', { code:'ended', label:'종료', rank:9 }),
    event('invalid', 'not-a-date'),
    event('reversed', '20261004', undefined, { endDate:'20261003' }),
    event('unrelated', '20261003', undefined, { category:'other' })
  ]);
  assert.deepEqual(Array.from(selected, (item) => item.id), ['valid']);
});

test('home event row shows only title, period, place, and status and opens by event id', () => {
  const item = event('one', '20261002', { code:'upcoming', label:'곧 시작', rank:1 }, { endDate:'20261005' });
  const row = homeModule().homeEventListRow(item);
  const texts = [];
  const visit = (node) => {
    if (node?.props?.text) texts.push(node.props.text);
    for (const child of node?.children || []) visit(child);
  };
  visit(row);
  assert.equal(row.props.dataset.action, 'open-event');
  assert.equal(row.props.dataset.eventId, 'one');
  assert.deepEqual(texts, ['one 행사', '곧 시작', '20261002 ~ 20261005', 'one 장소', '›']);
  assert.doesNotMatch(homeSource.slice(homeSource.indexOf('function homeEventListRow'), homeSource.indexOf('function renderFlowerWalk')), /image\(|event\.title.*includes|normalizeSearch/);
});

test('home full view and item actions reuse the existing events tab and event detail handlers', () => {
  assert.match(homeSource, /sectionHeader\('꽃 행사', '전체보기 ›', 'go-all-events'\)/);
  assert.match(mainSource, /case 'go-all-events':[\s\S]*?switchTab\('events'\)/);
  assert.match(mainSource, /case 'open-event': openEventDetail\(target\.dataset\.eventId\)/);
});

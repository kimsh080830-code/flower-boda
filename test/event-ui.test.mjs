import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const html = await readFile(new URL('../index.html',import.meta.url),'utf8');
function frontend(fetch = async () => { throw new Error('offline'); }) {
  const context = vm.createContext({ URL,URLSearchParams,Date,Intl,setTimeout,clearTimeout,DOMException,fetch,__mods:{
    'js/config.js':{ APP_CONFIG:{ DEMO_MODE:false,API:{ events:'/api/events',eventDetail:'/api/event-detail' },EVENT_CACHE_TTL_MS:1000 } },
    'js/data.js':{ DEMO_EVENTS:[],FLOWERS:[{ id:'rose',nameKo:'장미',eventKeywords:[] }],getFlowerById:(id)=>id==='rose'?{ id:'rose',nameKo:'장미',eventKeywords:[] }:null },
    'js/storage.js':{ getCache:()=>null,setCache:()=>true },
    'js/eventSnapshot.js':{VERIFIED_EVENT_SNAPSHOT:{events:[]}}, 'js/flowerViewData.js':{}, 'js/ui/dom.js':{}, 'js/ui/components.js':{}, 'js/ui/screens/shared.js':{}
  } });
  for (const name of ['dateUtils','searchUtils','eventService']) {
    const start = html.indexOf(`__mods["js/${name}.js"] = (() => {`);
    assert.ok(start>=0);
    const end = html.indexOf('\n})();',start) + '\n})();'.length;
    vm.runInContext(html.slice(start,end),context);
  }
  const uiStart = html.indexOf('__mods["js/ui/screens/events.js"] = (() => {');
  const uiEnd = html.indexOf('\n})();',uiStart) + '\n})();'.length;
  vm.runInContext(html.slice(uiStart,uiEnd),context);
  return { events:context.__mods['js/eventService.js'],dates:context.__mods['js/dateUtils.js'],ui:context.__mods['js/ui/screens/events.js'] };
}

test('Seoul midnight, missing/reversed dates and cancellation produce correct status', () => {
  const { dates,events } = frontend();
  assert.equal(dates.getEventStatus('20260904','20260904',new Date('2026-09-03T15:01:00Z')).code,'ongoing');
  assert.equal(dates.getEventStatus('20260904','').code,'unknown');
  assert.equal(dates.getEventStatus('20260904','20260903').code,'unknown');
  const cancelled=events.normalizeEvent({ title:'장미축제',startDate:'20260901',endDate:'20260930',publicationStatus:'Cancel' });
  assert.equal(cancelled.status.code,'cancelled');
  assert.equal(events.canUseEventSchedule(cancelled),false);
});

test('detail fields replace obsolete normalized list dates, addresses and URLs', async () => {
  const { events } = frontend(async () => ({ ok:true,json:async()=>({ contentid:'1',title:'장미축제',eventstartdate:'20261001',eventenddate:'20261003',addr1:'새 행사장',homepage:'https://new.example/',verification:{ status:'detail-checked',checkedAt:new Date().toISOString() } }) }));
  const old = events.normalizeEvent({ contentid:'1',title:'장미축제',eventstartdate:'20260901',eventenddate:'20260903',addr1:'옛 행사장',homepage:'https://old.example/' });
  const detail = await events.getEventDetail(old);
  assert.equal(detail.startDate,'20261001');
  assert.equal(detail.endDate,'20261003');
  assert.equal(detail.address,'새 행사장');
  assert.equal(detail.url,'https://new.example/');
});

test('detail failure is visible and cannot enable calendar export', async () => {
  const { events } = frontend();
  const old=events.normalizeEvent({ contentid:'1',title:'장미축제',startDate:'20260901',endDate:'20261001',verification:{ status:'detail-checked' } });
  const detail=await events.getEventDetail(old);
  assert.match(detail.detailError,/확인하지 못/);
  assert.equal(events.canUseEventSchedule(detail),false);
});

test('stale snapshots and incidental flower street names are excluded from recommendations', () => {
  const { events } = frontend();
  const old = events.normalizeEvent({ title:'장미축제',startDate:'20260901',endDate:'20991001',category:'flower',verification:{ status:'source-checked',checkedAt:'2020-01-01' } },'verified-snapshot');
  assert.equal(events.getRecommendedEvents([old]).length,0);
  assert.equal(events.getRecommendedEvents([old],{includeEnded:true}).length,1);
  const unrelated = events.normalizeEvent({ title:'맥주축제',address:'서울 장미로',description:'꽃 정원에서 먹거리 판매',startDate:'20260901',endDate:'20991001',category:'other' });
  assert.equal(events.getRecommendedEvents([unrelated]).length,0);
});

test('a missing events array does not become an empty successful feed', async () => {
  const { events } = frontend(async () => ({ ok:true,json:async()=>({ message:'broken' }) }));
  await assert.rejects(events.getEvents(),/INVALID_RESPONSE/);
});

test('weekend boundaries use Seoul time, include the current Sunday and cross year boundaries', () => {
  const { events } = frontend();
  const cases = [
    ['2026-09-04T14:59:59Z','20260905','20260906'],
    ['2026-09-05T15:00:00Z','20260905','20260906'],
    ['2026-09-06T15:00:00Z','20260912','20260913'],
    ['2027-01-01T03:00:00Z','20270102','20270103']
  ];
  for (const [now,start,end] of cases) {
    const actual = events.getSeoulWeekend(new Date(now));
    assert.equal(actual.start,start);
    assert.equal(actual.end,end);
  }
});

test('weekend and selected-date overlap checks include both endpoints and reject malformed dates', () => {
  const { events } = frontend();
  const now = new Date('2026-09-04T00:00:00Z');
  for (const [startDate,endDate,expected] of [
    ['20260901','20260930',true], ['20260905','20260905',true], ['20260906','20260908',true],
    ['20260901','20260904',false], ['20260907','20260930',false], ['', '20260906',false],
    ['20260907','20260905',false]
  ]) assert.equal(events.matchesEventDateFilter({startDate,endDate},{status:'weekend'},now),expected);
  const event = {startDate:'2026-09-05',endDate:'2026-09-06'};
  assert.equal(events.matchesEventDateFilter(event,{status:'weekend',date:'2026-09-06'},now),true);
  assert.equal(events.matchesEventDateFilter(event,{status:'weekend',date:'2026-09-07'},now),false);
  assert.equal(events.matchesEventDateFilter(event,{date:'2026-02-30'},now),false);
});

test('flower, region, subregion, search and date filters combine without dropping weekend Saturday on Sunday', () => {
  const { events,ui } = frontend();
  const base = { title:'장미 정원축제',startDate:'20260905',endDate:'20260906',region:'서울',subRegion:'중구',category:'flower' };
  const rows = [
    { ...base,id:'match',endDate:'20260905' }, { ...base,id:'different-region',region:'경기' },
    { ...base,id:'different-subregion',subRegion:'종로구' }, { ...base,id:'later',startDate:'20260907',endDate:'20260910' }
  ].map(row=>events.normalizeEvent(row));
  rows[0].status = { code:'ended',rank:9 };
  const state = {events:rows,currentDate:new Date('2026-09-06T00:00:00Z'),eventSearchQuery:'정원',
    eventFilter:{status:'weekend',flower:'rose',region:'서울',subRegion:'중구',date:'2026-09-05'}};
  assert.deepEqual(Array.from(ui.filterEvents(state),row=>row.id),['match']);
  state.eventFilter.date = '2026-09-06';
  assert.equal(ui.filterEvents(state).length,0);
  state.eventFilter = {...state.eventFilter,status:'all',date:'2026-09-05'};
  assert.equal(ui.filterEvents(state).length,1);
});

test('a detail error preserves the list row and a later retry clears the error without losing omitted list facts', async () => {
  let fail = true;
  const { events,ui } = frontend(async () => fail ? {ok:false} : {ok:true,json:async()=>({
    title:'장미축제',contentid:'1',verification:{status:'detail-checked',checkedAt:new Date().toISOString()}
  })});
  const original = events.normalizeEvent({contentid:'1',title:'장미축제',startDate:'20260101',endDate:'20991231',
    address:'서울특별시 중구',place:'장미 정원',category:'flower',verification:{status:'detail-checked'}});
  const failed = await events.getEventDetail(original);
  assert.equal(failed.address,original.address);
  assert.equal(failed.startDate,original.startDate);
  assert.ok(failed.detailError);
  assert.equal(ui.filterEvents({events:[failed],eventSearchQuery:'',eventFilter:{status:'ongoing'}}).length,1);
  assert.equal(events.canUseEventSchedule(failed),false);
  fail = false;
  const recovered = await events.getEventDetail(failed);
  assert.equal(recovered.detailError,'');
  assert.equal(recovered.address,original.address);
  assert.equal(recovered.place,original.place);
  assert.equal(recovered.startDate,original.startDate);
  assert.equal(events.canUseEventSchedule(recovered),true);
});

test('malformed or mismatched detail replies cannot replace the selected event', async () => {
  for (const payload of [
    {title:'장미축제',verification:{}},
    {title:'다른 축제',contentid:'other',verification:{status:'detail-checked'}},
    {verification:{status:'detail-checked'}}
  ]) {
    const { events } = frontend(async()=>({ok:true,json:async()=>payload}));
    const original = events.normalizeEvent({contentid:'1',title:'장미축제',startDate:'20260101',endDate:'20991231',address:'서울'});
    const result = await events.getEventDetail(original);
    assert.equal(result.id,original.id);
    assert.equal(result.title,original.title);
    assert.ok(result.detailError);
  }
});

test('full province names with counties normalize to the existing region filters', () => {
  const { events,ui } = frontend();
  for (const [areaName,region,subRegion] of [
    ['경상남도 거창군','경남','거창군'], ['경상북도 영주시','경북','영주시'],
    ['충청남도 부여군','충남','부여군'], ['충청북도 단양군','충북','단양군'],
    ['전라남도 곡성군','전남','곡성군'], ['전북특별자치도 익산시','전북','익산시'],
    ['강원특별자치도 평창군','강원','평창군'], ['서울특별시 종로구','서울','종로구'],
    ['광주광역시 북구','광주','북구'], ['경기 고양시','경기','고양시']
  ]) {
    for (const addr1 of [`${areaName} 정원로 10`, '']) {
      const event = events.normalizeEvent({title:'장미축제',areaName,addr1,startDate:'20260101',endDate:'20991231'});
      assert.equal(event.region,region,areaName);
      assert.equal(event.subRegion,subRegion,areaName);
      assert.equal(ui.filterEvents({events:[event],eventSearchQuery:'',eventFilter:{status:'all',region,subRegion}}).length,1);
    }
  }
});

test('unfamiliar source provinces retain their own token without prefix-based remapping', () => {
  const { events } = frontend();
  const event = events.normalizeEvent({title:'장미축제',areaName:'전남광주통합특별시 영광군',addr1:'전남광주통합특별시 영광군 불갑면'});
  assert.equal(event.region,'전남광주통합특별시');
  assert.equal(event.subRegion,'영광군');
  assert.equal(events.normalizeRegionName('  경상남도   거창군  '),'경남');
  assert.equal(events.normalizeRegionName('서울미정지역 중구'),'서울미정지역');
});

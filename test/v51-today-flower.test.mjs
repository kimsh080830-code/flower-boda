import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../꽃을보다_V61_dev.html',import.meta.url),'utf8');
const devHtml=html;
const source=await readFile(new URL('../src/js/todayFlower.js',import.meta.url),'utf8');
const homeSource=await readFile(new URL('../src/js/ui/screens/home.js',import.meta.url),'utf8');
const settingsSource=await readFile(new URL('../src/js/ui/screens/settings.js',import.meta.url),'utf8');
const devToolsSource=await readFile(new URL('../src/js/ui/screens/devTools.js',import.meta.url),'utf8');
const mainSource=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');

function modules(page=html) {
  const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
  const script=page.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
  vm.runInContext(script,context);
  return vm.runInContext('__mods',context);
}

function flower(id,start='01-01',end='12-31') { return {id,bloom:{start,end}}; }
function date(value) { return new Date(`${value}T12:00:00+09:00`); }

test('today flower shuffle is deterministic and does not use Math.random',()=>{
  const today=modules()['js/todayFlower.js'];
  const ids=['a','b','c','d','e'];
  assert.deepEqual(today.deterministicShuffle(ids,'same-seed'),today.deterministicShuffle(ids,'same-seed'));
  assert.deepEqual([...today.deterministicShuffle(ids,'same-seed')].sort(),ids);
  assert.doesNotMatch(source,/Math\.random/);
});

test('same Seoul date always returns the same flower across repeated calls and legacy daily cache migration',()=>{
  const today=modules()['js/todayFlower.js'];
  const rows=[flower('a'),flower('b'),flower('c')];
  const storage=today.createMemoryStorage();
  const first=today.selectTodayFlower({flowers:rows,date:date('2026-04-07'),storage});
  const repeats=Array.from({length:8},()=>today.selectTodayFlower({flowers:rows,date:date('2026-04-07'),storage}).flowerId);
  assert.ok(first.flowerId);
  assert.ok(repeats.every(id=>id===first.flowerId));

  const legacy=today.createMemoryStorage({'flower-info.today.v1':JSON.stringify({day:'2026-04-07',id:'b'})});
  assert.equal(today.selectTodayFlower({flowers:rows,date:date('2026-04-07'),storage:legacy}).flowerId,'b');
});

test('reload-style module recreation and unrelated settings changes keep the same day result',()=>{
  const rows=[flower('a'),flower('b'),flower('c')];
  const values=new Map();
  const storage={getItem:key=>values.has(key)?values.get(key):null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  const first=modules()['js/todayFlower.js'].selectTodayFlower({flowers:rows,date:date('2026-04-07'),storage});
  values.set('flower-info.settings.v1',JSON.stringify({theme:'dark',region:'',recentEnabled:true}));
  const afterReload=modules()['js/todayFlower.js'].selectTodayFlower({flowers:rows,date:date('2026-04-07'),storage});
  assert.equal(afterReload.flowerId,first.flowerId);
  assert.equal(JSON.parse(values.get('flower-info.today.v1')).id,first.flowerId);
});

test('a cycle uses each active candidate once before starting a new cycle',()=>{
  const today=modules()['js/todayFlower.js'];
  const rows=[flower('a'),flower('b'),flower('c'),flower('d')];
  const storage=today.createMemoryStorage();
  const results=[];
  for(let day=1;day<=8;day++) results.push(today.selectTodayFlower({flowers:rows,date:date(`2026-04-${String(day).padStart(2,'0')}`),storage}));
  assert.equal(new Set(results.slice(0,4).map(row=>row.flowerId)).size,4);
  assert.equal(new Set(results.slice(4,8).map(row=>row.flowerId)).size,4);
  assert.deepEqual(results.slice(0,4).map(row=>row.cycle),[1,1,1,1]);
  assert.deepEqual(results.slice(4,8).map(row=>row.cycle),[2,2,2,2]);
});

test('a zero-candidate day stays empty for that same date even if data is added later',()=>{
  const today=modules()['js/todayFlower.js'];
  const storage=today.createMemoryStorage();
  const first=today.selectTodayFlower({flowers:[],date:date('2026-04-01'),storage});
  const added=today.selectTodayFlower({flowers:[flower('new')],date:date('2026-04-01'),storage});
  assert.equal(first.flowerId,'');
  assert.equal(added.flowerId,'');
  const next=today.selectTodayFlower({flowers:[flower('new')],date:date('2026-04-02'),storage});
  assert.equal(next.flowerId,'new');
});

test('newly blooming candidates join later in the current cycle and removed candidates disappear',()=>{
  const today=modules()['js/todayFlower.js'];
  const storage=today.createMemoryStorage();
  const base=[flower('a'),flower('b'),flower('c')];
  const first=today.selectTodayFlower({flowers:base,date:date('2026-04-01'),storage});
  const added=flower('new');
  const sameDay=today.selectTodayFlower({flowers:[...base,added],date:date('2026-04-01'),storage});
  assert.equal(sameDay.flowerId,first.flowerId,'data additions must not change the already chosen same-day flower');
  const second=today.selectTodayFlower({flowers:[...base,added],date:date('2026-04-02'),storage});
  assert.ok(second.candidateIds.includes('new'));
  assert.ok(second.cycleOrder.includes('new'));

  const removeId=second.candidateIds.find(id=>id!==second.flowerId);
  const reduced=[...base,added].filter(item=>item.id!==removeId);
  const third=today.selectTodayFlower({flowers:reduced,date:date('2026-04-03'),storage});
  assert.ok(!third.candidateIds.includes(removeId));
  assert.ok(!third.cycleOrder.includes(removeId));
});

test('real bloom windows are the only candidates, including 0, 1, season boundaries and year-wrapping periods',()=>{
  const today=modules()['js/todayFlower.js'];
  assert.equal(today.selectTodayFlower({flowers:[],date:date('2026-04-01'),storage:today.createMemoryStorage()}).flowerId,'');
  const one=today.simulateTodayFlowers({flowers:[flower('only')],startDate:date('2026-04-01'),days:3,storage:today.createMemoryStorage()});
  assert.ok(one.every(row=>row.flowerId==='only'));
  assert.deepEqual(Array.from(one,row=>row.cycle),[1,2,3]);

  const seasonal=[flower('spring','03-01','05-31'),flower('summer','06-01','08-31'),flower('winter','12-01','02-28')];
  assert.deepEqual(Array.from(today.getTodayFlowerCandidates(seasonal,date('2026-05-31')),x=>x.id),['spring']);
  assert.deepEqual(Array.from(today.getTodayFlowerCandidates(seasonal,date('2026-06-01')),x=>x.id),['summer']);
  assert.deepEqual(Array.from(today.getTodayFlowerCandidates(seasonal,date('2027-01-15')),x=>x.id),['winter']);
});

test('30-day simulation has no duplicate within a cycle unless a one-candidate cycle restarts',()=>{
  const today=modules()['js/todayFlower.js'];
  const data=modules()['js/data.js'].FLOWERS;
  const rows=today.simulateTodayFlowers({flowers:data,startDate:date('2026-09-01'),days:30,storage:today.createMemoryStorage()});
  const seen=new Map();
  for(const row of rows) {
    if(!row.flowerId) continue;
    if(!seen.has(row.cycle)) seen.set(row.cycle,new Set());
    assert.ok(!seen.get(row.cycle).has(row.flowerId),`${row.day} repeated ${row.flowerId} in cycle ${row.cycle}`);
    seen.get(row.cycle).add(row.flowerId);
  }
});

test('V61 DEV build enables isolated test controls',()=>{
  assert.match(devHtml,/globalThis\.__FLOWER_APP_DEV__=true/);
  assert.doesNotMatch(homeSource,/renderTodayFlowerDevPanel/);
  assert.match(homeSource,/storage: APP_CONFIG\.DEV_MODE \? getDevTodayFlowerStorage\(\) : localStorage/);
  assert.match(settingsSource,/if\(APP_CONFIG\.DEV_MODE\) main\.append\(renderDevTools\(state\)\)/);
  assert.match(devToolsSource,/DEV · 통합 테스트 도구/);
  assert.match(devToolsSource,/가상 날짜/);
  assert.match(devToolsSource,/30일 시뮬레이션/);
  assert.match(devToolsSource,/현재 개화 후보/);
  assert.match(devToolsSource,/선택 꽃 ID/);
  assert.match(devToolsSource,/셔플 순서/);
  assert.match(mainSource,/dev-today-prev/);
  assert.match(mainSource,/dev-today-next/);
  assert.match(mainSource,/dev-today-simulate/);
  assert.match(mainSource,/dev-today-zero/);
  assert.match(mainSource,/dev-today-one/);
  assert.match(mainSource,/dev-today-boundary/);
  assert.match(mainSource,/dev-today-data-change/);
});

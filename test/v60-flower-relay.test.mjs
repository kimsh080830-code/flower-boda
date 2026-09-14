import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(`../${relative}`,import.meta.url),'utf8');
const [html,relaySource,homeSource,mainSource,styles,build,modulesText,devToolsSource] = await Promise.all([
  read('꽃을보다_V61_dev.html'),read('src/js/flowerRelay.js'),read('src/js/ui/screens/home.js'),read('src/js/main.js'),
  read('src/styles.css'),read('build.mjs'),read('src/modules.json'),read('src/js/ui/screens/devTools.js')
]);

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key),
    snapshot:()=>Object.fromEntries(values)
  };
}

function modules(storage = memoryStorage()) {
  const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:storage});
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
  vm.runInContext(script,context);
  return vm.runInContext('__mods',context);
}

function flower(id,start='01-01',end='12-31') { return {id,nameKo:id,bloom:{start,end}}; }
function date(value) { return new Date(`${value}T12:00:00+09:00`); }
function record({id='record-1',flowerId,identifiedAt='2026-09-14T04:00:00.000Z',selectedCandidate='Species name'}={}) {
  return {id,flowerId,identifiedAt,selectedCandidate};
}

test('relay candidates reuse current bloom windows, are deterministic, and cap at three',()=>{
  const relay=modules()['js/flowerRelay.js'];
  const rows=[flower('a'),flower('b'),flower('c'),flower('d'),flower('winter','12-01','02-28')];
  const first=relay.selectRelayTargets(rows,date('2026-09-14'));
  const again=relay.selectRelayTargets(rows,date('2026-09-14'));
  assert.deepEqual(first.map(item=>item.id),again.map(item=>item.id));
  assert.equal(first.length,3);
  assert.ok(first.every(item=>item.id!=='winter'));
});

test('start stores only relay identity while preserving every existing key',()=>{
  const storage=memoryStorage({'flower-info.collection.v1':'keep','flower-info.settings.v1':'also-keep'});
  const relay=modules(storage)['js/flowerRelay.js'];
  const result=relay.startFlowerRelay({flowers:[flower('a'),flower('b'),flower('c')],date:date('2026-09-14'),storage,now:new Date('2026-09-14T03:00:00.000Z')});
  assert.equal(result.ok,true);
  assert.equal(storage.snapshot()['flower-info.collection.v1'],'keep');
  assert.equal(storage.snapshot()['flower-info.settings.v1'],'also-keep');
  assert.deepEqual(Object.keys(storage.snapshot()).sort(),['flower-info.collection.v1','flower-info.relay.v1','flower-info.settings.v1']);
});

test('only a stored user-confirmed observation created after relay start completes a target',()=>{
  const storage=memoryStorage();
  const relay=modules(storage)['js/flowerRelay.js'];
  const flowers=[flower('a'),flower('b'),flower('c')];
  const started=relay.startFlowerRelay({flowers,date:date('2026-09-14'),storage,now:new Date('2026-09-14T03:00:00.000Z')});
  const target=started.state.targetFlowerIds[0];
  const before=record({id:'before',flowerId:target,identifiedAt:'2026-09-14T02:59:59.000Z'});
  const manual=record({id:'manual',flowerId:target,identifiedAt:'2026-09-14T04:00:00.000Z',selectedCandidate:''});
  assert.equal(relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records:[before,manual],storage}).completedCount,0);
  const confirmed=record({flowerId:target});
  assert.equal(relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records:[before,manual,confirmed],storage}).completedCount,1);
});

test('an unrelated confirmed flower never advances relay progress',()=>{
  const storage=memoryStorage();
  const relay=modules(storage)['js/flowerRelay.js'];
  const flowers=[flower('a'),flower('b'),flower('c'),flower('outside')];
  const started=relay.startFlowerRelay({flowers,date:date('2026-09-14'),storage,now:new Date('2026-09-14T03:00:00.000Z')});
  const outside=flowers.find(item=>!started.state.targetFlowerIds.includes(item.id));
  const snapshot=relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records:[record({flowerId:outside.id})],storage});
  assert.equal(snapshot.completedCount,0);
});

test('all target observations produce complete state and the next target follows target order',()=>{
  const storage=memoryStorage();
  const relay=modules(storage)['js/flowerRelay.js'];
  const flowers=[flower('a'),flower('b'),flower('c')];
  const started=relay.startFlowerRelay({flowers,date:date('2026-09-14'),storage,now:new Date('2026-09-14T03:00:00.000Z')});
  const first=relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records:[],storage});
  assert.equal(first.nextFlowerId,started.state.targetFlowerIds[0]);
  const records=started.state.targetFlowerIds.map((flowerId,index)=>record({id:`record-${index}`,flowerId}));
  const complete=relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records,storage});
  assert.equal(complete.status,'complete');
  assert.equal(complete.completedCount,complete.total);
  assert.equal(complete.nextFlowerId,'');
});

test('storage failure cannot start or falsely complete the relay',()=>{
  const storage={getItem(){return null},setItem(){throw new Error('quota')}};
  const relay=modules(storage)['js/flowerRelay.js'];
  const flowers=[flower('a')];
  const result=relay.startFlowerRelay({flowers,date:date('2026-09-14'),storage});
  assert.equal(result.ok,false);
  assert.match(result.error,/시작하지 못했어요/);
  assert.equal(relay.getFlowerRelaySnapshot({flowers,date:date('2026-09-14'),records:[record({flowerId:'a'})],storage}).completedCount,0);
});

test('new day and malformed saved state safely return to start state without deleting data',()=>{
  const storage=memoryStorage({'flower-info.relay.v1':'{"broken":true}','other':'keep'});
  const relay=modules(storage)['js/flowerRelay.js'];
  assert.equal(relay.getFlowerRelaySnapshot({flowers:[flower('a')],date:date('2026-09-14'),storage}).status,'before');
  assert.equal(storage.snapshot().other,'keep');
  const valid=memoryStorage({'flower-info.relay.v1':JSON.stringify({version:1,day:'2026-09-13',targetFlowerIds:['a'],startedAt:'2026-09-13T03:00:00.000Z'})});
  assert.equal(relay.getFlowerRelaySnapshot({flowers:[flower('a')],date:date('2026-09-14'),storage:valid}).status,'before');
});

test('empty and shortage DEV fixtures are memory-only representations',()=>{
  let writes=0;
  const storage={getItem(){return null},setItem(){writes+=1}};
  const relay=modules(storage)['js/flowerRelay.js'];
  const empty=relay.getFlowerRelaySnapshot({flowers:[flower('a')],date:date('2026-09-14'),storage,devScenario:'empty'});
  const shortage=relay.getFlowerRelaySnapshot({flowers:[flower('a'),flower('b'),flower('c')],date:date('2026-09-14'),storage,devScenario:'shortage'});
  assert.equal(empty.status,'empty');
  assert.equal(shortage.total,2);
  assert.equal(shortage.status,'before');
  assert.equal(writes,0);
});

test('home inserts relay between the protected feature and weekly flowers',()=>{
  const feature=homeSource.indexOf("if (representative) main.append(homeFeature");
  const relay=homeSource.indexOf('main.append(renderFlowerRelay(state))');
  const weekly=homeSource.indexOf("sectionHeader('이번 주 볼 꽃'");
  const places=homeSource.indexOf("sectionHeader('꽃 보러 가기'");
  assert.ok(feature>=0 && feature<relay && relay<weekly && weekly<places);
  assert.match(homeSource,/className:'flower-relay-placeholder','aria-hidden':'true'/);
  assert.doesNotMatch(relaySource,/image\(|<svg|\.webp|emoji/i);
});

test('relay styling uses existing palette variables and keeps placeholders empty',()=>{
  const relayCss=styles.slice(styles.indexOf('.flower-relay {'),styles.indexOf('\n.section-head {',styles.indexOf('.flower-relay {')));
  assert.match(relayCss,/aspect-ratio:\s*4 \/ 3/);
  assert.match(relayCss,/background:\s*var\(--surface-soft\)/);
  assert.match(relayCss,/border-radius:\s*var\(--radius-image\)/);
  assert.doesNotMatch(relayCss,/url\(|data:image|#[0-9a-f]{3,8}/i);
});

test('main reuses candidate confirmation and observation save before deriving relay completion',()=>{
  const confirm=mainSource.slice(mainSource.indexOf('async function confirmCandidate'),mainSource.indexOf('function syncCollection'));
  assert.ok(confirm.indexOf('addObservation(draft)')<confirm.indexOf('syncCollection()'));
  assert.ok(confirm.indexOf('syncCollection()')<confirm.indexOf('getFlowerRelaySnapshot'));
  assert.match(confirm,/devObservationSaveFailure/);
  assert.match(mainSource,/case 'relay-start'/);
  assert.match(mainSource,/case 'relay-continue'/);
  assert.doesNotMatch(`${relaySource}\n${homeSource}`,/geolocation|GPS/i);
});

test('DEV controls cover every requested relay state without direct collection writes',()=>{
  for(const label of ['시작 전','1개 완료','일부 진행','전체 완료','후보 없음','후보 부족','관찰 저장 실패']) assert.match(devToolsSource,new RegExp(label));
  assert.doesNotMatch(devToolsSource,/localStorage\.setItem|addObservation\(|saveSettings\(/);
});

test('build policy emits V61 DEV only and includes the relay module',()=>{
  assert.match(build,/꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build,/꽃을보다_V61\.html/);
  assert.match(html,/globalThis\.__FLOWER_APP_DEV__=true/);
  assert.ok(JSON.parse(modulesText).includes('js/flowerRelay.js'));
});

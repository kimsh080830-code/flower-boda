import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'https:',search:''},localStorage:{getItem:()=>null,setItem:()=>{},removeItem:()=>{}}});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0],context);
const mods=vm.runInContext('__mods',context);
const flowers=mods['js/data.js'].FLOWERS;
const search=mods['js/searchUtils.js'];
const view=mods['js/flowerViewData.js'];
const byId=id=>flowers.find(flower=>flower.id===id);

test('one-character, partial, alternate Korean, whitespace and case-insensitive searches work',()=>{
  assert.equal(search.matchesFlowerSearch(byId('mugunghwa'),'화'),true);
  assert.equal(search.matchesFlowerSearch(byId('cherry-blossom'),'꽃'),true);
  assert.equal(search.matchesFlowerSearch(byId('sunflower'),'바라'),true);
  assert.equal(search.matchesFlowerSearch(byId('camellia'),'동백꽃'),true);
  assert.equal(search.matchesFlowerSearch(byId('camellia'),'  동백나무  '),true);
  assert.equal(search.matchesFlowerSearch(byId('sunflower'),'hELiAnThUs'),true);
  assert.equal(search.matchesFlowerSearch(byId('sunflower'),'   '),true);
});

test('single and partial multi-letter Korean initial-consonant searches use confirmed names',()=>{
  assert.equal(search.getKoreanInitials('벚꽃'),'ㅂㄲ');
  assert.equal(search.getKoreanInitials('무궁화'),'ㅁㄱㅎ');
  assert.equal(search.matchesFlowerSearch(byId('cherry-blossom'),'ㅂ'),true);
  assert.equal(search.matchesFlowerSearch(byId('cherry-blossom'),'ㅂㄲ'),true);
  assert.equal(search.matchesFlowerSearch(byId('mugunghwa'),'ㄱㅎ'),true);
  assert.equal(search.matchesFlowerSearch(byId('camellia'),'ㄷㅂㄲ'),true);
  assert.equal(search.matchesFlowerSearch(byId('rose'),'ㅂㄲ'),false);
});

test('petal-shape filtering stays unavailable when the V43 data has no explicit values',()=>{
  assert.equal(flowers.some(flower=>view.petalShapeValues(flower).length),false);
  assert.equal(mods['js/ui/screens/encyclopedia.js'].PETAL_SHAPE_OPTIONS.length,0);
});

test('event detail normalization preserves actual operating hours and admission fees when supplied',()=>{
  const event=mods['js/eventService.js'].normalizeEvent({title:'검증 행사',eventstartdate:'20260904',eventenddate:'20260905',playtime:'10:00~18:00',usetimefestival:'무료'});
  assert.equal(event.operatingHours,'10:00~18:00');
  assert.equal(event.admissionFee,'무료');
});

test('encyclopedia sorting is stable and keeps invalid bloom starts behind valid data',()=>{
  assert.deepEqual(view.sortFlowers(flowers,'default').map(f=>f.id),flowers.map(f=>f.id));
  const names=view.sortFlowers(flowers,'name').map(view.primaryFlowerName);
  assert.equal(JSON.stringify(names),JSON.stringify([...names].sort(new Intl.Collator('ko-KR').compare)));
  const early=view.sortFlowers(flowers,'bloom-early');
  const late=view.sortFlowers(flowers,'bloom-late');
  assert.equal(early[0].bloom.start,'01-15');
  assert.equal(late[0].bloom.start,'11-20');
  const valid={id:'valid',nameKo:'가',bloom:{start:'04-01'}},invalidA={id:'invalid-a',nameKo:'나',bloom:{}},invalidB={id:'invalid-b',nameKo:'다',bloom:{start:'13-01'}};
  assert.equal(JSON.stringify(view.sortFlowers([invalidA,valid,invalidB],'bloom-early').map(f=>f.id)),JSON.stringify(['valid','invalid-a','invalid-b']));
  const sameA={id:'same-a',nameKo:'라',bloom:{start:'05-01'}},sameB={id:'same-b',nameKo:'마',bloom:{start:'05-01'}};
  assert.equal(JSON.stringify(view.sortFlowers([sameA,sameB],'bloom-late').map(f=>f.id)),JSON.stringify(['same-a','same-b']));
});

test('removed pollen and app-launch notification controls are absent from production source',async()=>{
  const sourceFiles=['../src/js/preferences.js','../src/js/main.js','../src/js/ui/screens/settings.js','../src/js/ui/screens/details.js'];
  const source=(await Promise.all(sourceFiles.map(file=>readFile(new URL(file,import.meta.url),'utf8')))).join('\n');
  assert.doesNotMatch(source,/꽃가루|pollen|bloomAlerts|savedAlerts|앱을 열 때|앱을 켤 때/i);
});

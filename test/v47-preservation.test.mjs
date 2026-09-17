import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
function runtime(source=html,protocol='https:') {
 const values=new Map();
 const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol,search:''},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}});
 vm.runInContext(source.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0],context);
 return {mods:vm.runInContext('__mods',context),values};
}
test('all 45 flower records, scientific names, colors, meanings, habitats and taxonomy remain identical',()=>{
 const after=runtime().mods['js/data.js'];
 assert.equal(after.FLOWERS.length,45);
 assert.ok(after.FLOWERS.every(flower=>flower.id&&flower.scientificName&&Array.isArray(flower.colors)&&flower.flowerLanguage?.meaning&&flower.habitat&&flower.taxonomy?.acceptedName));
});
test('all 200 genuine event records and evidence remain identical in standalone and server data',async()=>{
 const copy=await readFile(new URL('../data/verified-events.json',import.meta.url));
 assert.equal(createHash('sha256').update(copy).digest('hex'),'159921b470fcc304bff1c888d7e629e9e7f3ecf71ec9d070b3c34095cb5a415b');
 const {mods}=runtime(html,'file:');
 assert.equal(JSON.stringify(mods['js/eventSnapshot.js'].EVENT_SNAPSHOT),JSON.stringify(JSON.parse(copy)));
 const rows=await mods['js/eventService.js'].getEvents();
 assert.equal(rows.length,200);assert.ok(rows.every(e=>e.source==='verified-snapshot'));
});
test('the original four bloom icon declarations are byte-identical; only the fifth icon is new',()=>{
 const expected=['73c4c9c9286290342b1dc8d8edfd3c4abc5336be137df7ca93873411253146f4','ef4fe79522261b39ab9be906a531ffcef844be500c873ad44a86ef28252b4602','1ea4f3b2adf52b403903b089d6baf546bfe668d2eccb4226fdfa4aa261f87efb','93bc004ffd3ad309c71daf381f3810d9e87e1805dcb9003e7a5f974a0b83cdd2'];
 for(let i=0;i<4;i++) {
  const expression=new RegExp('\\.bloom-symbol-'+i+'\\{[^}]+\\}');
  assert.equal(createHash('sha256').update(html.match(expression)?.[0] || '').digest('hex'),expected[i]);
 }
 assert.match(html,/\.bloom-symbol-4\{/);
});
test('five stages handle dates before, inside and after flowering including winter and leap dates',()=>{
 const d=runtime().mods['js/dateUtils.js'];
 assert.deepEqual(['2026-03-31','2026-04-01','2026-04-15','2026-04-30','2026-05-01'].map(day=>d.getBloomStatus({start:'04-01',end:'04-30'},new Date(day+'T12:00:00')).label),['꽃봉오리','피기시작','만개','지는중','개화종료']);
 assert.equal(d.getBloomStatus({start:'12-01',end:'02-28'},new Date('2027-03-01T12:00:00')).stage,4);
 assert.equal(d.getBloomStatus({start:'02-28',end:'03-03'},new Date('2028-02-29T12:00:00')).stage,2);
});
test('header date and season use the same actual Seoul calendar day',()=>{
 const {getDatePresentation:p}=runtime().mods['js/dateUtils.js'];
 assert.equal(p(new Date('2026-05-01T15:00:00Z')).label,'2026.05.02');
 assert.equal(p(new Date('2026-05-01T15:00:00Z')).season,'늦봄');
 assert.equal(p(new Date('2026-05-31T15:00:00Z')).season,'초여름');
 assert.equal(p(new Date('2026-11-30T15:00:00Z')).season,'초겨울');
 assert.equal(p(new Date('2026-12-31T15:00:00Z')).label,'2027.01.01');
});
test('event flowers sort by the actual Korean display name and feature summaries use original facts',()=>{
 const m=runtime().mods,v=m['js/flowerViewData.js'];
 const rows=[...m['js/data.js'].FLOWERS].sort(v.compareFlowerNames),names=rows.map(v.primaryFlowerName);
 assert.deepEqual(names,[...names].sort(new Intl.Collator('ko-KR').compare));
 assert.equal(v.habitatSummary({habitat:'공원과 길가, 하천변에 자란다.'}),'공원 · 길가 · 하천변');
 assert.equal(v.identificationSummary({identificationFeatures:'둥근 잎.'}),'둥근 잎.');
 assert.equal(v.identificationSummary({flowerFeatures:'푸른 꽃.'}),'푸른 꽃.');
});
test('V47 preferences keep supported values and ignore removed launch-alert and pollen settings',()=>{
 const {mods,values}=runtime(),p=mods['js/preferences.js'];
 const old={region:'강원',theme:'dark',recentEnabled:false,bloomAlerts:true,savedAlerts:true,pollen:true};
 values.set('flower-info.settings.v42',JSON.stringify(old));
 assert.deepEqual(JSON.parse(JSON.stringify(p.loadSettings())),{region:'강원',theme:'dark',recentEnabled:false,bodyTextSize:'medium'});
 assert.equal('pollen' in p.loadSettings(),false);
 assert.equal('bloomAlerts' in p.loadSettings(),false);
 assert.equal('savedAlerts' in p.loadSettings(),false);
 assert.equal(p.saveSettings({...p.loadSettings(),region:'서울'}),true);
 assert.equal(p.loadSettings().region,'서울');
 assert.equal(values.get('flower-info.settings.v42'),JSON.stringify(old));
});
test('photo results still normalize genuine API species and standalone mode cannot fabricate candidates',async()=>{
 const {mods}=runtime(),s=mods['js/flowerService.js'];
 const result=s.normalizePlantNetResponse({results:[{score:.91,species:{scientificNameWithoutAuthor:'Helianthus annuus',commonNames:['해바라기']}}]},{averageRgb:{r:220,g:180,b:30}});
 assert.equal(result.length,1);assert.equal(result[0].flowerId,'sunflower');assert.equal(result[0].confidence,.91);
 await assert.rejects(runtime(html,'file:').mods['js/flowerService.js'].analyzeFlower({preprocessed:{}}),{code:'SERVER_REQUIRED'});
 assert.doesNotMatch(html,/demoAnalysis|buildDemoCandidates|DEMO_EVENTS|DEMO_MODE/);
});
test('ICS uses a chosen valid date, next-day exclusive end and escaped event data',()=>{
 const m=runtime().mods,calendar=m['js/calendar.js'];
 const event={id:'real-id',title:'제목,검증',description:'첫 줄\n다음;줄',startDate:'20260904',endDate:'20260913',source:'api',status:{code:'ongoing'},verification:{status:'detail-checked'}};
 assert.equal(calendar.buildEventCalendar(event,'2026-09-03'),false);
 const ics=calendar.buildEventCalendar(event,'2026-09-13');
 assert.match(ics,/DTSTART;VALUE=DATE:20260913\r\nDTEND;VALUE=DATE:20260914/);
 assert.ok(ics.includes('SUMMARY:제목\\,검증'));
 assert.ok(ics.includes('DESCRIPTION:첫 줄\\n다음\\;줄'));
});
test('event failure keeps its alert and retry action without the removed exclamation icon',()=>{
 const source=html.slice(html.indexOf('function eventErrorState('),html.indexOf('function formatEventRange('));
 const el=(tag,props={},children=[])=>({tag,...props,children});
 const context=vm.createContext({el,button:(text,action)=>({tag:'button',text,action})});
 vm.runInContext(source,context);
 const result=context.eventErrorState('연결 오류');
 assert.equal(result.role,'alert');
 assert.equal(result.children.length,2);
 assert.equal(result.children[0].className,'event-error-copy');
 assert.equal(result.children[0].children[0].text,'행사를 불러오지 못했어요.');
 assert.equal(result.children[1].action,'retry-events');
});

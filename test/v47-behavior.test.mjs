import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../꽃을보다_V61_dev.html',import.meta.url),'utf8');
function runtime(){
 const storage=new Map();
 const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'https:',search:''},localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)}});
 vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0],context);
 return {mods:vm.runInContext('__mods',context),storage};
}
const event=(start='20260904',end='20260913')=>({id:'test',startDate:start,endDate:end,status:{code:'ongoing'},source:'api',verification:{status:'detail-checked',checkedAt:new Date().toISOString()}});
test('V47 bloom states share five stages and handle a winter season',()=>{
 const d=runtime().mods['js/dateUtils.js'];
 assert.deepEqual(['2026-03-31','2026-04-01','2026-04-15','2026-04-30'].map(day=>d.getBloomStatus({start:'04-01',end:'04-30'},new Date(day+'T12:00:00')).label),['꽃봉오리','피기시작','만개','지는중']);
 assert.equal(d.getBloomStatus({start:'12-01',end:'02-28'},new Date('2027-01-15T12:00:00')).label,'만개');
 assert.equal(d.getBloomStatus(null).code,'unknown');
});
test('V47 calendar validates endpoints and rejects malformed or unavailable dates',()=>{
 const {isVisitDate}=runtime().mods['js/calendar.js'];
 for(const day of ['2026-09-04','2026-09-13'])assert.equal(isVisitDate(event(),day),true);
 for(const day of ['2026-09-03','2026-09-14','2026-02-30',''])assert.equal(isVisitDate(event(),day),false);
 assert.equal(isVisitDate({...event(),status:{code:'cancelled'}},'2026-09-05'),false);
 assert.equal(isVisitDate(event('20260913','20260904'),'2026-09-05'),false);
 assert.equal(isVisitDate(event('20261230','20270103'),'2027-01-01'),true);
 assert.equal(isVisitDate(event('20280228','20280301'),'2028-02-29'),true);
});
test('V47 recent history supports recency, cap, opt-out and clearing',()=>{
 const {mods}=runtime(),p=mods['js/preferences.js'],flowers=mods['js/data.js'].FLOWERS;
 for(const f of flowers.slice(0,7))p.rememberFlower(f.id);
 assert.equal(p.loadRecent().length,6);assert.ok(!p.loadRecent().includes(flowers[0].id));
 p.rememberFlower(flowers[2].id);assert.equal(p.loadRecent()[0],flowers[2].id);
 const before=JSON.stringify(p.loadRecent());p.rememberFlower(flowers[0].id,false);assert.equal(JSON.stringify(p.loadRecent()),before);
 assert.equal(p.clearRecent(),true);assert.equal(p.loadRecent().length,0);
});
test('V47 settings migrate legacy region and ignore invalid stored types',()=>{
 const {mods,storage}=runtime(),p=mods['js/preferences.js'];
 storage.set('flower-info.preferences.v1',JSON.stringify({region:'서울'}));assert.equal(p.loadSettings().region,'서울');
 storage.set('flower-info.settings.v1','null');storage.set('flower-info.recent.v1','{}');
 assert.equal(p.loadSettings().theme,'system');assert.equal(p.loadRecent().length,0);
 const next={...p.loadSettings(),region:'강원',theme:'dark',recentEnabled:false};assert.equal(p.saveSettings(next),true);assert.equal(p.loadSettings().region,'강원');assert.equal(p.loadSettings().recentEnabled,false);
});
test('V47 state writes handle unavailable storage without changing existing values',()=>{
 const {mods,storage}=runtime(),p=mods['js/preferences.js'];
 const prior={...p.loadSettings(),theme:'dark'};p.saveSettings(prior);
 const saved=storage.get('flower-info.settings.v1');storage.set=()=>{throw new Error('quota')};
 assert.equal(p.saveSettings({...prior,theme:'light'}),false);assert.equal(storage.get('flower-info.settings.v1'),saved);
});

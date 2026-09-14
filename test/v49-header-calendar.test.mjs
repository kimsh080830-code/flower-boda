import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../꽃을보다_V61_dev.html',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const shell=await readFile(new URL('../src/js/ui/screens/shell.js',import.meta.url),'utf8');
const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
function modules() {
 const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
 vm.runInContext(script,context);
 return vm.runInContext('__mods',context);
}
test('global header contains only app name, date/solar-term control, and settings control',()=>{
 assert.match(shell,/className: 'app-brand', text: '꽃을 보다'/);
 assert.match(shell,/className:'app-date-context'.*action:'open-bloom-calendar'/s);
 assert.match(shell,/text:date\.solarTerm/);
 assert.match(shell,/action:'go-settings'/);
 assert.doesNotMatch(shell,/app-subtitle|BOTANICAL GUIDE|nav-camera|검색|날씨|지역|필터/);
});
test('date presentation keeps legacy season compatibility while exposing official 2026 solar terms',()=>{
 const d=modules()['js/dateUtils.js'];
 const sept7=d.getDatePresentation(new Date('2026-09-07T03:00:00+09:00'));
 assert.equal(sept7.solarTerm,'백로');
 assert.equal(sept7.season,'초가을');
 assert.equal(d.getSolarTerm(new Date('2026-09-06T12:00:00+09:00')),'처서');
 assert.equal(d.getSolarTerm(new Date('2026-09-23T12:00:00+09:00')),'추분');
});
test('all tabs share the single shell header and the date action opens one common bloom calendar',()=>{
 assert.equal((html.match(/function renderAppHeader\(/g)||[]).length,1);
 assert.match(main,/case 'open-bloom-calendar'/);
 assert.match(main,/case 'bloom-calendar-month'/);
 assert.match(main,/case 'close-bloom-calendar'/);
 assert.match(html,/className:'bloom-calendar-layer'/);
 assert.doesNotMatch(html,/data-action=["']open-bloom-calendar["']/); // source uses dataset, not duplicate static controls
});
test('header/date and calendar CSS remain unboxed and have narrow-screen coverage',()=>{
 assert.match(styles,/\.app-date-context\{[^}]*border:\s*0[^}]*background:\s*transparent/s);
 assert.match(styles,/\.app-header-inner\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) auto 44px/s);
 assert.match(styles,/@media\(max-width:359px\)/);
 assert.match(styles,/\.bloom-calendar-grid\{[^}]*repeat\(7,minmax\(0,1fr\)\)/s);
 assert.doesNotMatch(styles,/\.app-date-context\{[^}]*box-shadow/s);
});
test('V61 DEV build is the only declared V61 output',async()=>{
 const build=await readFile(new URL('../build.mjs',import.meta.url),'utf8');
 assert.match(html,/Botanical V61 DEV/);
 assert.doesNotMatch(html,/Botanical V47/);
 assert.match(build,/꽃을보다_V61_dev\.html/);
 assert.doesNotMatch(build,/꽃을보다_V61\.html/);
});

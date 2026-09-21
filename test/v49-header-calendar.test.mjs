import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const shell=await readFile(new URL('../src/js/ui/screens/shell.js',import.meta.url),'utf8');
const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
function modules() {
 const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
 vm.runInContext(script,context);
 return vm.runInContext('__mods',context);
}
test('global header keeps date informational and provides separate bloom calendar and settings buttons',()=>{
 assert.doesNotMatch(shell,/className: 'app-brand'|className: 'brand-block'|text: '꽃을 보다'/);
 const dateLine=shell.split('\n').find(line=>line.includes("className:'app-date-context'")) || '';
 assert.match(dateLine,/el\('div'/);
 assert.doesNotMatch(dateLine,/button|open-bloom-calendar/);
 assert.match(shell,/dateTime:date\.day,text:date\.label/);
 assert.match(shell,/weather\?\.condition && Number\.isFinite\(weather\.temperature\)/);
 assert.match(shell,/\`\$\{weather\.condition\} · \$\{weather\.temperature\}°\`/);
 assert.match(shell,/className:'app-season-context',text:contextText/);
 assert.match(shell,/날씨 불러오는 중…/);
 assert.match(shell,/날씨 정보 없음/);
 assert.match(shell,/getSeason\(state\.currentDate\)/);
 assert.doesNotMatch(shell,/date\.solarTerm/);
 assert.match(shell,/className:'bloom-calendar-button'.*action:'open-bloom-calendar'.*ariaLabel:'만개달력'/);
 assert.equal((shell.match(/action:'open-bloom-calendar'/g)||[]).length,1);
 assert.match(shell,/action:'go-settings'/);
 assert.doesNotMatch(shell,/app-subtitle|BOTANICAL GUIDE|nav-camera|검색|지역|필터/);
});
test('date presentation keeps legacy season compatibility while exposing official 2026 solar terms',()=>{
 const d=modules()['js/dateUtils.js'];
 const sept7=d.getDatePresentation(new Date('2026-09-07T03:00:00+09:00'));
 assert.equal(sept7.solarTerm,'백로');
 assert.equal(sept7.season,'초가을');
 assert.equal(d.getSeason(new Date('2026-09-21T12:00:00+09:00')),'가을');
 assert.equal(d.getSolarTerm(new Date('2026-09-06T12:00:00+09:00')),'처서');
 assert.equal(d.getSolarTerm(new Date('2026-09-23T12:00:00+09:00')),'추분');
});
test('weather lifecycle keeps an explicit loading, ready or error state',()=>{
 assert.match(main,/currentWeatherStatus:\s*'loading'/);
 assert.match(main,/state\.currentWeatherStatus=weather\?'ready':'error'/);
 assert.match(main,/state\.currentWeather=weather/);
});

test('all tabs share the single shell header and the dedicated action opens one common bloom calendar',()=>{
 assert.equal((html.match(/function renderAppHeader\(/g)||[]).length,1);
 assert.match(main,/case 'open-bloom-calendar'/);
 assert.match(main,/case 'bloom-calendar-month'/);
 assert.match(main,/case 'close-bloom-calendar'/);
 assert.match(html,/className:'bloom-calendar-layer'/);
 assert.doesNotMatch(html,/data-action=["']open-bloom-calendar["']/); // source uses dataset, not duplicate static controls
});
test('header/date and calendar CSS remain unboxed and have narrow-screen coverage',()=>{
 assert.match(styles,/\.app-date-context\{[^}]*border:\s*0[^}]*background:\s*transparent/s);
 assert.match(styles,/\.app-header-inner\s*\{[^}]*grid-template-columns:\s*minmax\(0,1fr\) auto/s);
 assert.match(styles,/\.app-header-inner\s*\{[^}]*min-height:\s*58px/s);
 assert.match(styles,/\.app-date-context\s*\{[^}]*grid-column:\s*1[^}]*min-width:\s*0[^}]*width:\s*fit-content[^}]*max-width:\s*100%[^}]*justify-items:\s*center[^}]*justify-self:\s*start[^}]*overflow:\s*hidden[^}]*text-align:\s*center/s);
 assert.match(styles,/\.header-actions\s*\{[^}]*grid-column:\s*2[^}]*gap:\s*0/s);
 assert.match(styles,/\.bloom-calendar-button,\.settings-button\{[^}]*width:44px[^}]*height:44px/s);
 assert.match(styles,/\.bloom-calendar-icon\{--bloom-calendar-icon:url\("data:image\/svg\+xml/);
 assert.match(styles,/\.app-date-context time\{[^}]*max-width:100%[^}]*text-overflow:ellipsis[^}]*color:var\(--ink\)/s);
 assert.match(styles,/\.app-season-context\{[^}]*color:var\(--muted\)/s);
 assert.match(styles,/\.app-date-context time\{[^}]*font-size:\.9rem/s);
 assert.match(styles,/@media\(max-width:359px\)\{[^}]*\.app-date-context time\{font-size:\.82rem\}/s);
 assert.match(styles,/\.bloom-calendar-icon,\.settings-slider-icon\{[^}]*width:22px[^}]*height:22px[^}]*background:currentColor/s);
 assert.doesNotMatch(styles,/\.app-date-context\s*\{[^}]*width:\s*\d+px/s);
 assert.match(styles,/\.bloom-calendar-grid\{[^}]*repeat\(7,minmax\(0,1fr\)\)/s);
 assert.doesNotMatch(styles,/\.app-date-context\{[^}]*box-shadow/s);
});
test('V61 build declares the current DEV and PROD outputs',async()=>{
 const build=await readFile(new URL('../build.mjs',import.meta.url),'utf8');
 assert.match(html,/Botanical V61 DEV/);
 assert.doesNotMatch(html,/Botanical V47/);
 assert.match(build,/const output=dev\?'index\.html':'index\.prod\.html'/);
});

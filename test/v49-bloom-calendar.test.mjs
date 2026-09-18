import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
const calendarSource=await readFile(new URL('../src/js/calendar.js',import.meta.url),'utf8');
const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

function modules() {
  const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
  vm.runInContext(script,context);
  return vm.runInContext('__mods',context);
}

test('month overlap includes both months of a spanning bloom and supports year-wrapping bloom periods',()=>{
  const calendar=modules()['js/calendar.js'];
  assert.equal(calendar.bloomOverlapsMonth({start:'03-25',end:'04-15'},2026,3),true);
  assert.equal(calendar.bloomOverlapsMonth({start:'03-25',end:'04-15'},2026,4),true);
  assert.equal(calendar.bloomOverlapsMonth({start:'03-25',end:'04-15'},2026,5),false);
  assert.equal(calendar.bloomOverlapsMonth({start:'10-15',end:'05-15'},2026,1),true);
  assert.equal(calendar.bloomOverlapsMonth({start:'10-15',end:'05-15'},2026,12),true);
  assert.equal(calendar.bloomOverlapsMonth({start:'10-15',end:'05-15'},2026,6),false);
});

test('real April candidates include flowers whose bloom overlaps April and exclude summer-only flowers',()=>{
  const calendar=modules()['js/calendar.js'];
  const ids=calendar.getBloomFlowersForMonth(2026,4).map(flower=>flower.id);
  for(const id of ['cherry-blossom','tulip','forsythia','adonis','hellebore']) assert.ok(ids.includes(id),`${id} should be in April`);
  assert.equal(ids.includes('sunflower'),false);
});

test('month shifting crosses year boundaries in both directions',()=>{
  const calendar=modules()['js/calendar.js'];
  assert.equal(calendar.shiftMonthKey('2026-12',1),'2027-01');
  assert.equal(calendar.shiftMonthKey('2026-01',-1),'2025-12');
  assert.equal(calendar.shiftMonthKey('2026-04',-1),'2026-03');
});

test('month changes share one setter and clear date selections that belong to another month',()=>{
  assert.match(main,/function setBloomCalendarMonth\(value\)[\s\S]*bloomCalendarSelectedDate[\s\S]*startsWith\(`\$\{normalized\}-`\)[\s\S]*=''[\s\S]*}/);
  assert.match(main,/case 'bloom-calendar-month': setBloomCalendarMonth/);
  assert.match(main,/moveBloomCalendarMonth\(dx<0\?1:-1\)/);
  assert.match(main,/Math\.abs\(dx\)<48/);
});

test('flower rail is single-line scrollable, finite, wheel-aware, and has explicit active/disabled arrows',()=>{
  assert.match(calendarSource,/className:'bloom-flower-rail'/);
  assert.match(calendarSource,/direction:'left'[^\n]*disabled:true/);
  assert.match(calendarSource,/direction:'right'/);
  assert.match(styles,/\.bloom-flower-rail\{[^}]*display:flex[^}]*overflow-x:auto[^}]*overflow-y:hidden/s);
  assert.match(styles,/\.bloom-flower-chip\{[^}]*flex:0 0 auto[^}]*white-space:nowrap/s);
  assert.match(styles,/\.bloom-flower-rail-arrow\{[^}]*color:var\(--text\)[^}]*opacity:1/s);
  assert.match(styles,/\.bloom-flower-rail-arrow:disabled[^}]*color:var\(--muted-2\)[^}]*pointer-events:none/s);
  assert.match(main,/function handleBloomRailWheel/);
  assert.doesNotMatch(calendarSource,/infinite|loop|cloneNode/);
});

test('flower selection updates only selection state and button semantics without rerendering or auto-scrolling the rail',()=>{
  const match=/function selectBloomRailFlower\(target\) \{([\s\S]*?)\n\}/.exec(main);
  assert.ok(match);
  const body=match[1];
  assert.match(body,/state\.selectedBloomFlowerId=flowerId/);
  assert.match(body,/classList\.toggle\('is-selected'/);
  assert.match(body,/setAttribute\('aria-pressed'/);
  assert.doesNotMatch(body,/render\(|scrollIntoView|scrollLeft\s*=|scrollTo\(|scrollBy\(/);
});

test('month flower chips keep the V49 small representative-color point and single-line chip styling',()=>{
  assert.match(calendarSource,/const color=flower\.colors\?\.\[0\] \|\| ''/);
  assert.match(calendarSource,/className:'bloom-flower-color-dot'/);
  assert.match(calendarSource,/className:`bloom-calendar-all-button/);
  assert.match(styles,/\.bloom-flower-color-dot\{[^}]*width:7px[^}]*height:7px/s);
  assert.doesNotMatch(styles,/\.bloom-flower-chip\{[^}]*background:\s*#[0-9a-f]{3,8}/is);
});

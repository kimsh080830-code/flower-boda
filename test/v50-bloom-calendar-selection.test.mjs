import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const html=await readFile(new URL('../꽃을보다_V61_dev.html',import.meta.url),'utf8');
const calendarSource=await readFile(new URL('../src/js/calendar.js',import.meta.url),'utf8');
const main=await readFile(new URL('../src/js/main.js',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

function modules() {
  const context=vm.createContext({Date,Intl,URL,URLSearchParams,DOMException,setTimeout,clearTimeout,location:{protocol:'file:',search:''},localStorage:{getItem(){return null},setItem(){},removeItem(){}}});
  const script=html.match(/<script>([\s\S]*?)<\/script>/)[1].split('__mods["js/main.js"]')[0];
  vm.runInContext(script,context);
  return vm.runInContext('__mods',context);
}

test('calendar status helper reuses the shared getBloomStatus result for every existing stage',()=>{
  const mods=modules();
  const calendar=mods['js/calendar.js'];
  const dateUtils=mods['js/dateUtils.js'];
  const flower={bloom:{start:'04-01',end:'04-30'}};
  const dates=['2026-03-31','2026-04-01','2026-04-15','2026-04-30','2026-05-01'];
  const expected=['꽃봉오리','피기시작','만개','지는중','개화종료'];
  assert.deepEqual(dates.map(value=>calendar.getBloomStatusForDate(flower,value).label),expected);
  for(const value of dates) {
    const date=dateUtils.parseApiDate(value);
    assert.equal(calendar.getBloomStatusForDate(flower,value).label,dateUtils.getBloomStatus(flower.bloom,date).label);
  }
});

test('all-flower day markers cap visible markers and expose a compact overflow count',()=>{
  const calendar=modules()['js/calendar.js'];
  const april=calendar.getBloomFlowersForMonth(2026,4);
  const markers=calendar.getBloomMarkersForDate(april,'2026-04-01');
  assert.ok(markers.total>3,'April 1 should exercise overlapping flowers');
  assert.equal(markers.visible.length,3);
  assert.equal(markers.overflow,markers.total-3);
});

test('all-view and single-flower selection are mutually exclusive and the exact all-view label is used outside the rail',()=>{
  assert.match(calendarSource,/text:'이달 꽃 전체 표시'/);
  assert.match(calendarSource,/dataset:\{action:'show-all-bloom-flowers'\}/);
  assert.match(calendarSource,/'aria-pressed':String\(allSelected\)/);
  assert.match(calendarSource,/bloom-calendar-flower-heading[\s\S]*이달 꽃 전체 표시[\s\S]*const rail=el\('div',\{className:'bloom-flower-rail'/);
  assert.match(main,/function selectBloomRailFlower[\s\S]*state\.selectedBloomFlowerId=flowerId;[\s\S]*state\.bloomCalendarShowAll=false;/);
  assert.match(main,/case 'show-all-bloom-flowers':[\s\S]*state\.bloomCalendarShowAll=true;[\s\S]*state\.selectedBloomFlowerId='';/);
});

test('calendar renders selected or all candidate bloom periods with existing representative color labels',()=>{
  assert.match(calendarSource,/const markerFlowers=state\.bloomCalendarShowAll \? candidates : \(selectedFlower \? \[selectedFlower\] : \[\]\)/);
  assert.match(calendarSource,/getBloomMarkersForDate\(markerFlowers,key\)/);
  assert.match(calendarSource,/dataset:\{flowerColor:flower\.colors\?\.\[0\] \|\| ''\}/);
  assert.match(styles,/\.bloom-calendar-marker\{[^}]*width:7px[^}]*height:3px[^}]*background:var\(--bloom-marker/s);
  for(const color of ['흰색','노랑','분홍','빨강','보라','파랑','주황']) assert.match(styles,new RegExp(`bloom-calendar-marker\\[data-flower-color="${color}"\\]`));
});

test('date selection is explicit, separate from today, and status text lives below the grid',()=>{
  assert.match(calendarSource,/dataset:\{action:'bloom-calendar-date',date:key\}/);
  assert.match(calendarSource,/'aria-current':key===today\?'date':null/);
  assert.match(calendarSource,/'aria-selected':String\(selected\)/);
  assert.match(calendarSource,/renderBloomSelectionInfo\(state,year,month,today,selectedFlower\)/);
  assert.match(calendarSource,/state\.bloomCalendarSelectedDate\?\.startsWith\(prefix\)[\s\S]*return state\.bloomCalendarSelectedDate;[\s\S]*today\.startsWith\(prefix\)/);
  assert.match(calendarSource,/`\$\{selectedFlower\.nameKo\} · \$\{Number\(dateKey\.slice\(5,7\)\)\}월 \$\{Number\(dateKey\.slice\(8,10\)\)\}일 · \$\{status\?\.label \|\| '정보 없음'\}`/);
  assert.match(styles,/\.bloom-calendar-day\.is-selected\{[^}]*background:var\(--surface-soft\)[^}]*box-shadow:/s);
  assert.match(styles,/\.bloom-calendar-day\.is-today\{[^}]*outline:/s);
  assert.match(styles,/\.bloom-calendar-day\.is-today\.is-selected\{/);
});

test('flower selection rerender preserves rail scrollLeft and does not auto-center or scrollIntoView',()=>{
  const preserve=/function renderBloomCalendarPreservingRail\(\) \{([\s\S]*?)\n\}/.exec(main);
  assert.ok(preserve);
  assert.match(preserve[1],/const scrollLeft=previousRail\?\.scrollLeft \|\| 0/);
  assert.match(preserve[1],/rail\.scrollLeft=Math\.min\(scrollLeft/);
  assert.doesNotMatch(preserve[1],/scrollIntoView|scrollTo\(|scrollBy\(/);
  assert.match(main,/case 'select-bloom-flower': selectBloomRailFlower\(target\); renderBloomCalendarPreservingRail\(\); break;/);
});

test('month changes continue clearing a selected date that belongs to the previous month',()=>{
  assert.match(main,/state\.bloomCalendarSelectedDate && !state\.bloomCalendarSelectedDate\.startsWith\(`\$\{normalized\}-`\)\) state\.bloomCalendarSelectedDate=''/);
  assert.match(main,/case 'bloom-calendar-date':[\s\S]*parseApiDate\(value\)[\s\S]*state\.bloomCalendarSelectedDate=value/);
});

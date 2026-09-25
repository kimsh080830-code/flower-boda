import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const paths=[
  'js/config.js',
  'js/data.js',
  'js/flowerDataPolicy.js',
  'js/runtimeHooks.js',
  'js/dateUtils.js',
  'js/todayFlower.js',
  'js/devTools.js'
];
const sources=await Promise.all(paths.map(path=>readFile(new URL(`../src/${path}`,import.meta.url),'utf8')));

function modules() {
  const context=vm.createContext({
    __FLOWER_APP_DEV__:true,
    __FLOWER_APP_DEV_PAYLOAD__:null,
    location:{protocol:'file:'},
    Date,Intl,setTimeout,clearTimeout
  });
  vm.runInContext(`const __mods=Object.create(null);\n${sources.join('\n')}`,context);
  return vm.runInContext('__mods',context);
}

function seoulDate(day,time='12:00:00') {return new Date(`${day}T${time}+09:00`);}

test('DEV starts in automatic mode with the current Seoul date',()=>{
  const loaded=modules();
  const dev=loaded['js/devTools.js'];
  const state=dev.createState(new Date('2026-09-20T15:30:00Z'));
  assert.equal(state.devTodayFlowerDate,'2026-09-21');
  assert.equal(state.devTodayFlowerDateMode,'auto');
});

test('automatic tracking keeps the same-day flower and advances from September 15 to 21',()=>{
  const loaded=modules();
  const dev=loaded['js/devTools.js'];
  const today=loaded['js/todayFlower.js'];
  const hooks=loaded['js/runtimeHooks.js'].hooks;
  const flowers=loaded['js/data.js'].FLOWERS;
  const state=dev.createState(seoulDate('2026-09-15'));
  const storage=dev.getDevTodayFlowerStorage();
  const firstContext=hooks.todayFlowerContext({state,date:seoulDate('2026-09-15'),storage});
  const first=today.selectTodayFlower({flowers,date:firstContext.date,storage:firstContext.storage});
  const repeat=today.selectTodayFlower({flowers,date:firstContext.date,storage:firstContext.storage});
  assert.equal(first.day,'2026-09-15');
  assert.equal(repeat.flowerId,first.flowerId);
  assert.equal(dev.syncDevTodayFlowerDate(state,seoulDate('2026-09-15','23:59:59')),false);
  assert.equal(dev.syncDevTodayFlowerDate(state,seoulDate('2026-09-21')),true);
  const nextContext=hooks.todayFlowerContext({state,date:seoulDate('2026-09-15'),storage});
  const next=today.selectTodayFlower({flowers,date:nextContext.date,storage:nextContext.storage});
  assert.equal(state.devTodayFlowerDate,'2026-09-21');
  assert.equal(next.day,'2026-09-21');
});

test('manual prev, next and date input resist automatic tracking until reset',()=>{
  const dev=modules()['js/devTools.js'];
  const state=dev.createState(seoulDate('2026-09-15'));
  let renders=0;
  const render=()=>{renders+=1;};
  dev.handleAction({action:'dev-today-prev',target:{dataset:{}},state,render});
  assert.equal(state.devTodayFlowerDate,'2026-09-14');
  assert.equal(state.devTodayFlowerDateMode,'manual');
  assert.equal(dev.syncDevTodayFlowerDate(state,seoulDate('2026-09-21')),false);
  assert.equal(state.devTodayFlowerDate,'2026-09-14');
  dev.handleAction({action:'dev-today-next',target:{dataset:{}},state,render});
  assert.equal(state.devTodayFlowerDate,'2026-09-15');
  dev.handleChange({input:{dataset:{action:'dev-today-date'},value:'2026-09-10'},state,render});
  assert.equal(state.devTodayFlowerDate,'2026-09-10');
  assert.equal(state.devTodayFlowerDateMode,'manual');
  assert.equal(dev.syncDevTodayFlowerDate(state,seoulDate('2026-09-21')),false);
  dev.handleAction({action:'dev-today-reset',target:{dataset:{}},state,render,now:seoulDate('2026-09-21')});
  assert.equal(state.devTodayFlowerDate,'2026-09-21');
  assert.equal(state.devTodayFlowerDateMode,'auto');
  assert.equal(dev.syncDevTodayFlowerDate(state,seoulDate('2026-09-22')),true);
  assert.equal(state.devTodayFlowerDate,'2026-09-22');
  assert.ok(renders>=4);
});

test('DEV schedules one check for the next Seoul midnight instead of polling',()=>{
  const dev=modules()['js/devTools.js'];
  let current=seoulDate('2026-09-15','23:59:50');
  let scheduled=null;
  let cleared=0;
  let nextId=0;
  let refreshes=0;
  const stop=dev.startDevTodayFlowerDateTracking({
    refreshCurrentDate:()=>{refreshes+=1;},
    now:()=>current,
    setTimer:(callback,delay)=>{scheduled={callback,delay,id:++nextId};return nextId;},
    clearTimer:()=>{cleared+=1;}
  });
  assert.equal(scheduled.delay,11000);
  const firstCallback=scheduled.callback;
  current=seoulDate('2026-09-16','00:00:01');
  firstCallback();
  assert.equal(refreshes,1);
  assert.ok(scheduled.delay>23*60*60*1000);
  stop();
  assert.equal(cleared,1);
});

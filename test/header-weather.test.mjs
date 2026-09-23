import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const [dateSource,weatherSource,shellSource]=await Promise.all([
  readFile(new URL('../src/js/dateUtils.js',import.meta.url),'utf8'),
  readFile(new URL('../src/js/weatherService.js',import.meta.url),'utf8'),
  readFile(new URL('../src/js/ui/screens/shell.js',import.meta.url),'utf8')
]);

function weatherModule() {
  const context=vm.createContext({URLSearchParams,AbortController,setTimeout,clearTimeout});
  vm.runInContext(`const __mods=Object.create(null);\n${weatherSource}`,context);
  return vm.runInContext('__mods["js/weatherService.js"]',context);
}

function renderHeader(currentWeather,currentWeatherStatus=currentWeather?'ready':'loading') {
  const context=vm.createContext({Date,Intl,Number});
  vm.runInContext(`const __mods=Object.create(null);\n${dateSource}\n__mods["js/ui/dom.js"]={el:(tag,props={},children=[])=>({tag,props,children})};\n${shellSource}`,context);
  const shell=vm.runInContext('__mods["js/ui/screens/shell.js"]',context);
  return shell.renderAppHeader({currentDate:new Date('2026-09-21T12:00:00+09:00'),currentWeather,currentWeatherStatus});
}

function dateContext(header) {return header.children[0].children[0];}

test('allowed location loads current Open-Meteo weather once',async()=>{
  const weather=weatherModule();
  let locationRequests=0,weatherRequests=0,requestedUrl='';
  const geolocation={getCurrentPosition(success){locationRequests+=1;success({coords:{latitude:37.5,longitude:127}});}};
  const fetchImpl=async url=>{weatherRequests+=1;requestedUrl=String(url);return {ok:true,json:async()=>({current:{temperature_2m:23.6,weather_code:0}})};};
  const [first,second]=await Promise.all([weather.loadCurrentWeather({geolocation,fetchImpl}),weather.loadCurrentWeather({geolocation,fetchImpl})]);
  assert.deepEqual({...first},{condition:'맑음',temperature:24});
  assert.deepEqual({...second},{condition:'맑음',temperature:24});
  assert.equal(locationRequests,1);
  assert.equal(weatherRequests,1);
  assert.match(requestedUrl,/api\.open-meteo\.com\/v1\/forecast/);
  assert.match(requestedUrl,/current=temperature_2m%2Cweather_code/);
});

test('denied location permission omits weather without throwing',async()=>{
  const weather=weatherModule();
  const geolocation={getCurrentPosition(_success,failure){failure({code:1});}};
  assert.equal(await weather.loadCurrentWeather({geolocation,fetchImpl:async()=>{throw new Error('must not fetch');}}),null);
});

test('failed location lookup omits weather without calling the API',async()=>{
  const weather=weatherModule();
  let weatherRequests=0;
  const geolocation={getCurrentPosition(_success,failure){failure(new Error('position unavailable'));}};
  const result=await weather.loadCurrentWeather({geolocation,fetchImpl:async()=>{weatherRequests+=1;}});
  assert.equal(result,null);
  assert.equal(weatherRequests,0);
});

test('weather API failure is contained',async()=>{
  const weather=weatherModule();
  const geolocation={getCurrentPosition(success){success({coords:{latitude:37.5,longitude:127}});}};
  const result=await weather.loadCurrentWeather({geolocation,fetchImpl:async()=>({ok:false,json:async()=>({})})});
  assert.equal(result,null);
});

test('header keeps the weather line visible while current weather is loading',()=>{
  const date=dateContext(renderHeader(null,'loading'));
  assert.equal(date.tag,'div');
  assert.equal(date.props.dataset,undefined);
  assert.equal(date.children[0].props.text,'2026.09.21');
  assert.equal(date.children[1].props.text,'가을 · 날씨 불러오는 중…');
});

test('header keeps the weather line visible when current weather fails',()=>{
  const date=dateContext(renderHeader(null,'error'));
  assert.equal(date.children[0].props.text,'2026.09.21');
  assert.equal(date.children[1].props.text,'가을 · 날씨 정보 없음');
});

test('header shows date first and compact weather on the second line',()=>{
  const header=renderHeader({condition:'맑음',temperature:24});
  const date=dateContext(header);
  assert.equal(date.children[0].props.text,'2026.09.21');
  assert.equal(date.children[1].props.text,'가을 · 맑음 · 24°');
  const [calendarButton,notificationButton,settingsButton]=header.children[0].children[1].children;
  assert.equal(calendarButton.props.ariaLabel,'만개달력');
  assert.equal(calendarButton.props.dataset.action,'open-bloom-calendar');
  assert.equal(notificationButton.props.ariaLabel,'알림');
  assert.equal(notificationButton.props.dataset.action,'open-notifications');
  assert.equal(settingsButton.props.ariaLabel,'설정');
  assert.equal(settingsButton.props.dataset.action,'go-settings');
});

test('header keeps the full year and moves the longest supported weather label to line two',()=>{
  const date=dateContext(renderHeader({condition:'구름 조금',temperature:24}));
  assert.equal(date.children[0].props.text,'2026.09.21');
  assert.equal(date.children[1].props.text,'가을 · 구름 조금 · 24°');
});

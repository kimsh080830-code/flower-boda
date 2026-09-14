import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read=relative=>readFile(new URL(`../${relative}`,import.meta.url),'utf8');
const [build,packageText,modulesText,dev,settings,devTools,main,eventService,imageService,flowerService]=await Promise.all([
  read('build.mjs'),read('package.json'),read('src/modules.json'),read('꽃을보다_V61_dev.html'),
  read('src/js/ui/screens/settings.js'),read('src/js/ui/screens/devTools.js'),read('src/js/main.js'),read('src/js/eventService.js'),read('src/js/imageService.js'),read('src/js/flowerService.js')
]);
const pkg=JSON.parse(packageText);
const modules=JSON.parse(modulesText);

function configFrom(page){
  const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
  const beforeDate=script.split('__mods["js/dateUtils.js"]')[0];
  const context=vm.createContext({location:{protocol:'file:'},globalThis:{}});
  // The generated script writes to the actual context global, not the nested globalThis stub.
  delete context.globalThis;
  vm.runInContext(beforeDate,context);
  return vm.runInContext('__mods["js/config.js"].APP_CONFIG',context);
}

test('V61 keeps one source tree and builds only the requested DEV bundle',()=>{
  assert.deepEqual(pkg.scripts,{build:'node audit-data.mjs && node build.mjs',start:'node server.mjs',check:'node --check server.mjs',test:'node --test test/*.test.mjs','data:audit':'node audit-data.mjs'});
  assert.match(build,/const order=JSON\.parse\(await read\('src\/modules\.json'\)\)/);
  assert.match(build,/const sourceModuleScripts=/);
  assert.match(build,/buildHtml=\(dev\)=>/);
  assert.match(build,/꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build,/꽃을보다_V61\.html/);
  assert.ok(modules.includes('js/devTools.js'));
  assert.ok(modules.includes('js/ui/screens/devTools.js'));
  assert.doesNotMatch(build,/src-dev|src-prod|dev\/src|prod\/src/i);
});

test('DEV flag and payload are enabled in the V61 DEV bundle',()=>{
  assert.match(dev,/globalThis\.__FLOWER_APP_DEV__=true/);
  assert.match(dev,/globalThis\.__FLOWER_APP_DEV_PAYLOAD__=\{"audit":/);
  assert.equal(configFrom(dev).DEV_MODE,true);
});

test('integrated DEV panel is guarded and contains every requested tool',()=>{
  assert.match(settings,/if\(APP_CONFIG\.DEV_MODE\) main\.append\(renderDevTools\(state\)\)/);
  for(const label of ['가상 날짜','30일 시뮬레이션','현재 개화 후보','선택 꽃 ID','셔플 순서','데이터 중복 검사','이미지 누락 검사','라이선스 누락 검사','강제 네트워크 실패','긴 텍스트 테스트','최소 폰트 테스트','최대 폰트 테스트']) assert.match(devTools,new RegExp(label));
});

test('DEV runtime tests stay memory-only instead of writing user settings/localStorage',()=>{
  assert.match(main,/devNetworkFailure: false/);
  assert.match(main,/devLongTextTest: false/);
  assert.match(main,/devTextSizeOverride: ''/);
  assert.match(main,/applyTextSize\(APP_CONFIG\.DEV_MODE && state\.devTextSizeOverride/);
  for(const action of ['dev-network-failure','dev-long-text','dev-font-min','dev-font-max','dev-font-reset']) assert.match(main,new RegExp(action));
  assert.doesNotMatch(devTools,/localStorage\.setItem|saveSettings\(|saveFavorites\(|addObservation\(/);
});

test('forced network failure is consulted only by network-capable services',()=>{
  assert.match(eventService,/shouldForceNetworkFailure\(\)/);
  assert.match(imageService,/shouldForceNetworkFailure\(\)/);
  assert.match(flowerService,/shouldForceNetworkFailure\(\)/);
  assert.match(eventService,/DEV_NETWORK_FAILURE/);
  assert.match(imageService,/DEV_NETWORK_FAILURE/);
  assert.match(flowerService,/DEV에서 네트워크 실패/);
});

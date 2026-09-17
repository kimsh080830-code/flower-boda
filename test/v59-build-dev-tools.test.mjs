import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read=relative=>readFile(new URL(`../${relative}`,import.meta.url),'utf8');
const [build,packageText,modulesText,dev,prod,settings,devPanel,devRuntime,main,eventService,imageService,flowerService,commonStyles,devStyles]=await Promise.all([
  read('build.mjs'),read('package.json'),read('src/modules.json'),read('index.html'),read('index.prod.html'),
  read('src/js/ui/screens/settings.js'),read('src/js/ui/screens/devTools.js'),read('src/js/devTools.js'),read('src/js/main.js'),
  read('src/js/eventService.js'),read('src/js/imageService.js'),read('src/js/flowerService.js'),read('src/styles.css'),read('src/dev-styles.css')
]);
const pkg=JSON.parse(packageText);
const manifest=JSON.parse(modulesText);

function configFrom(page){
  const script=page.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
  const beforeDate=script.split('__mods["js/dateUtils.js"]')[0];
  const context=vm.createContext({location:{protocol:'file:'}});
  vm.runInContext(beforeDate,context);
  return vm.runInContext('__mods["js/config.js"].APP_CONFIG',context);
}

test('one source tree has explicit common and DEV-only module groups',()=>{
  assert.equal(pkg.scripts.build,'node audit-data.mjs && node build.mjs --mode=dev');
  assert.equal(pkg.scripts['build:dev'],'node audit-data.mjs && node build.mjs --mode=dev');
  assert.equal(pkg.scripts['build:prod'],'node audit-data.mjs && node build.mjs --mode=prod');
  assert.ok(manifest.common.includes('js/runtimeHooks.js'));
  assert.ok(manifest.common.includes('js/main.js'));
  assert.deepEqual(manifest.dev.map(entry=>entry.path),['js/devTools.js','js/ui/screens/devTools.js']);
  assert.ok(manifest.dev.every(entry=>entry.before==='js/ui/screens/settings.js'));
  assert.match(build,/manifest\.common/);
  assert.match(build,/if\(dev\)/);
  assert.doesNotMatch(build,/src-dev|src-prod|dev\/src|prod\/src/i);
});

test('DEV includes tools and PROD physically excludes their modules, UI text, payload and styles',()=>{
  assert.match(dev,/globalThis\.__FLOWER_APP_DEV__=true/);
  assert.match(dev,/globalThis\.__FLOWER_APP_DEV_PAYLOAD__=\{"audit":/);
  assert.match(dev,/__mods\["js\/devTools\.js"\]/);
  assert.match(dev,/__mods\["js\/ui\/screens\/devTools\.js"\]/);
  assert.match(dev,/DEV · 통합 테스트 도구/);
  assert.match(dev,/\.dev-tools-panel/);
  assert.equal(configFrom(dev).DEV_MODE,true);

  assert.match(prod,/globalThis\.__FLOWER_APP_DEV__=false/);
  assert.doesNotMatch(prod,/globalThis\.__FLOWER_APP_DEV_PAYLOAD__=/);
  assert.doesNotMatch(prod,/__mods\["js\/devTools\.js"\]/);
  assert.doesNotMatch(prod,/__mods\["js\/ui\/screens\/devTools\.js"\]/);
  assert.doesNotMatch(prod,/DEV · 통합 테스트 도구|가상 날짜|30일 시뮬레이션|\.dev-tools-panel/);
  assert.equal(configFrom(prod).DEV_MODE,false);
});

test('common runtime uses inert hooks while DEV installs all test behavior',()=>{
  assert.match(settings,/runtimeHooks\.renderSettingsExtra/);
  assert.match(main,/runtimeHooks\.createState/);
  assert.match(main,/runtimeHooks\.handleAction/);
  assert.match(main,/runtimeHooks\.handleChange/);
  assert.doesNotMatch(main,/dev-today-|dev-audit-|dev-network-|dev-font-|dev-relay-/);
  for(const action of ['dev-network-failure','dev-long-text','dev-font-min','dev-font-max','dev-font-reset']) assert.match(devRuntime,new RegExp(action));
  for(const label of ['가상 날짜','30일 시뮬레이션','데이터 중복 검사','이미지 누락 검사','라이선스 누락 검사','강제 네트워크 실패']) assert.match(devPanel,new RegExp(label));
  assert.doesNotMatch(devPanel,/localStorage\.setItem|saveSettings\(|saveFavorites\(|addObservation\(/);
});

test('network-capable services consult the common runtime hook without DEV-only strings',()=>{
  for(const source of [eventService,imageService,flowerService]) assert.match(source,/runtimeHooks\.shouldForceNetworkFailure\(\)/);
  for(const source of [eventService,imageService,flowerService]) assert.doesNotMatch(source,/DEV_NETWORK_FAILURE|DEV에서 네트워크 실패/);
});

test('DEV-only presentation styles are removed from the common stylesheet',()=>{
  assert.doesNotMatch(commonStyles,/\.dev-tools-panel|\.dev-long-text-fixture/);
  assert.match(devStyles,/\.dev-tools-panel/);
  assert.match(devStyles,/\.dev-long-text-fixture/);
});

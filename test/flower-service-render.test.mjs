import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');

function loadService(response) {
  const context = vm.createContext({
    AbortController,
    Blob,
    FormData,
    fetch: async () => response,
    __mods: {
      'js/config.js': { APP_CONFIG: {
        API: { identify:'https://flower-boda-api-dev.onrender.com/api/identify-flower' },
        IS_RENDER_API:true, STANDALONE:false, MAX_CANDIDATES:3, PHOTO_API_RESULT_POOL:20,
        LOW_CONFIDENCE_THRESHOLD:0.6
      } },
      'js/data.js': { FLOWERS:[] },
      'js/dateUtils.js': { getBloomStatus:()=>({ code:'off-season' }) },
      'js/runtimeHooks.js': { hooks:{ shouldForceNetworkFailure:()=>false } }
    }
  });
  const start = html.indexOf('__mods["js/flowerService.js"] = (() => {');
  assert.ok(start >= 0);
  const end = html.indexOf('\n})();', start) + '\n})();'.length;
  vm.runInContext(html.slice(start, end), context);
  return context.__mods['js/flowerService.js'];
}

test('Render HTML wake-up errors are distinct from JSON PlantNet failures', async () => {
  const waking = loadService({ ok:false, status:503, headers:{ get:()=> 'text/html' } });
  await assert.rejects(waking.analyzeFlower({ preprocessed:{ blob:new Blob(['flower']) }, signal:new AbortController().signal }),
    (error) => error.code === 'API_WAKING' && /Render 사진 분석 서버가 준비 중/.test(error.message));

  const serverError = loadService({ ok:false, status:502, headers:{ get:()=> 'application/json' } });
  await assert.rejects(serverError.analyzeFlower({ preprocessed:{ blob:new Blob(['flower']) }, signal:new AbortController().signal }),
    (error) => error.code === 'API_UNAVAILABLE' && /사진 분석 서버를 사용할 수 없어요/.test(error.message));
});

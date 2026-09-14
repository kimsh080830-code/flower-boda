import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');
const [main, shell, prefs, settings, components, dom, events, styles, build, devHtml] = await Promise.all([
  read('../src/js/main.js'),
  read('../src/js/ui/screens/shell.js'),
  read('../src/js/preferences.js'),
  read('../src/js/ui/screens/settings.js'),
  read('../src/js/ui/components.js'),
  read('../src/js/ui/dom.js'),
  read('../src/js/eventService.js'),
  read('../src/styles.css'),
  read('../build.mjs'),
  read('../꽃을보다_V61_dev.html')
]);

test('main tab swipe follows bottom-nav order, is finite, and excludes horizontal gesture zones and Android edges', () => {
  assert.match(main, /const MAIN_NAV_TABS = \['events', 'home', 'encyclopedia'\]/);
  assert.match(shell, /\['events', 'nav-calendar', '행사'\][\s\S]*\['home', 'nav-home', '홈'\][\s\S]*\['encyclopedia', 'nav-book', '도감'\]/);
  assert.match(main, /nextIndex < 0 \|\| nextIndex >= MAIN_NAV_TABS\.length/);
  assert.match(main, /MAIN_TAB_SWIPE_EXCLUDE/);
  assert.match(main, /data-bloom-calendar-swipe/);
  assert.match(main, /data-event-calendar-swipe/);
  assert.match(main, /\.bloom-flower-rail/);
  assert.match(main, /\.flower-rail/);
  assert.match(main, /\.image-gallery/);
  assert.match(main, /\.slider/);
  assert.match(main, /hasHorizontalGestureOwner/);
  assert.match(main, /style\.overflowX/);
  assert.match(main, /scrollWidth > node\.clientWidth \+ 1/);
  assert.match(main, /edgeGuard = 28/);
  assert.match(main, /Math\.abs\(dx\) < 64/);
  assert.match(main, /handleMainTabTouchStart/);
  assert.match(main, /touchstart/);
  assert.match(main, /touchend/);
  assert.match(main, /event\.preventDefault\(\)/);
  assert.match(main, /touchend', finishMainTabTouch, \{ passive: false \}/);
});

test('body text size is backward-compatible in the existing settings object and only uses a bounded enum', () => {
  assert.match(prefs, /bodyTextSize:'medium'/);
  assert.match(prefs, /\['small','medium','large'\]\.includes\(raw\.bodyTextSize\)/);
  assert.match(prefs, /dataset\.textSize=\['small','medium','large'\]\.includes\(size\)/);
  assert.match(settings, /본문 글자 크기/);
  assert.match(settings, /\['small','작게'\]/);
  assert.match(settings, /\['large','크게'\]/);
  assert.match(main, /applyTextSize\(APP_CONFIG\.DEV_MODE && state\.devTextSizeOverride \? state\.devTextSizeOverride : state\.settings\.bodyTextSize\)/);
});

test('text scaling reaches key reading text without scaling fixed navigation or header icons', () => {
  assert.match(styles, /--body-text-scale: 1/);
  assert.match(styles, /data-text-size="small"[^}]*\.92/s);
  assert.match(styles, /data-text-size="large"[^}]*1\.14/s);
  for (const selector of ['.feature-description', '.detail-summary', '.detail-disclosure-body', '.event-date-filter-note', '.weather-note']) {
    assert.match(styles, new RegExp(selector.replace('.', '\\.') + '[^{]*\\{[^}]*var\\(--body-text-scale\\)', 's'));
  }
  assert.doesNotMatch(styles, /\.bottom-nav[^}]*var\(--body-text-scale\)/s);
  assert.doesNotMatch(styles, /\.app-header[^}]*var\(--body-text-scale\)/s);
  assert.match(styles, /\.status[^}]*var\(--body-text-scale\)/s);
});

test('common empty/error states are iconless and failed/missing images use text state instead of decorative fallback art', () => {
  assert.doesNotMatch(components, /className: 'empty-icon'/);
  assert.match(components, /state-panel empty-state/);
  assert.match(components, /state-panel state-error event-error-state/);
  assert.doesNotMatch(dom, /FALLBACK_IMAGE/);
  assert.match(dom, /이미지가 없어요\./);
  assert.match(dom, /이미지를 불러오지 못했어요\./);
  assert.match(styles, /\.media-image-state/);
});

test('offline-first uses local flower images and embedded/cached event data, with online warnings only for online actions', () => {
  assert.match(dom, /navigator\.onLine === false/);
  assert.match(main, /loadReferenceImages\(\)[\s\S]*navigator\.onLine === false/);
  assert.match(main, /사진 판별은 인터넷 연결이 필요해요/);
  assert.match(events, /navigator\.onLine === false/);
  assert.match(events, /return snapshot\(\)/);
  assert.match(events, /최신 행사 업데이트는 인터넷 연결이 필요해요/);
});

test('long text and page overflow protections are structural rather than a global font shrink', () => {
  assert.match(styles, /body \{ overflow-x: clip; \}/);
  assert.match(styles, /overflow-wrap: anywhere/);
  assert.match(styles, /\.setting-row \{ flex-wrap: wrap; \}/);
  assert.match(styles, /\.event-location, \.event-meta \{ white-space: normal; \}/);
  const bodyRules = [...styles.matchAll(/(?:^|\n)body\s*\{([^}]*)\}/g)].map((match) => match[1]);
  assert.ok(bodyRules.length >= 1);
  bodyRules.forEach((rule) => assert.doesNotMatch(rule, /font-size\s*:/));
});

test('V61 build emits only the requested DEV file with V61 title', () => {
  assert.match(build, /꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build, /꽃을보다_V61\.html/);
  assert.match(devHtml, /globalThis\.__FLOWER_APP_DEV__=true/);
  assert.match(devHtml, /Botanical V61 DEV/);
});

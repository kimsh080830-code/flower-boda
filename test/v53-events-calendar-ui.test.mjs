import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = relative => readFile(new URL(relative, import.meta.url), 'utf8');
const [events, calendar, main, components, styles, build, devHtml] = await Promise.all([
  read('../src/js/ui/screens/events.js'),
  read('../src/js/calendar.js'),
  read('../src/js/main.js'),
  read('../src/js/ui/components.js'),
  read('../src/styles.css'),
  read('../build.mjs'),
  read('../index.html')
]);

test('event list heading is rendered before loading/error branches and has no immediate top divider', () => {
  const fn = events.slice(events.indexOf('function updateEventResults'), events.indexOf('return { "renderEvents"'));
  const heading = fn.indexOf("sectionHeader('행사 목록'");
  const loading = fn.indexOf('if (state.eventsLoading)');
  const error = fn.indexOf('if (state.eventsError)');
  assert.ok(heading >= 0 && heading < loading && heading < error);
  assert.match(styles, /\.event-results > \.event-list,[\s\S]*?border-top:0;/);
  assert.match(styles, /\.event-results > \.event-error-state[\s\S]*?border-top:0;/);
  assert.match(styles, /\.event-results > \.section-head\{[\s\S]*?visibility:visible;[\s\S]*?opacity:1;/);
});

test('event date note is exact and described-by is connected to the monthly calendar group', () => {
  assert.match(events, /text: '찾아볼 날짜 \(선택 사항\)'/);
  assert.match(events, /text: '선택한 상태·지역·날짜 조건을 함께 적용해요\. 날짜를 비우면 기간 제한을 해제해요\.'/);
  assert.match(calendar, /'aria-describedby':'event-date-filter-note'/);
  assert.match(calendar, /'aria-labelledby':'event-date-filter-label'/);
});

test('event filter calendar supports month buttons, swipe, today and selected states without disabled dates', () => {
  const fn = calendar.slice(calendar.indexOf('function renderEventFilterCalendar'), calendar.indexOf('function escapeIcs'));
  assert.match(fn, /dataset:\{action:'event-filter-month',month:previous\}/);
  assert.match(fn, /dataset:\{action:'event-filter-month',month:next\}/);
  assert.match(fn, /dataset:\{eventCalendarSwipe:'true'\}/);
  assert.match(fn, /isToday\?'is-today'/);
  assert.match(fn, /isSelected\?'is-selected'/);
  assert.match(fn, /dataset:\{action:'event-filter-date',date:key\}/);
  assert.doesNotMatch(fn, /disabled|aria-disabled|is-disabled/);
  assert.match(main, /handleEventCalendarPointerDown/);
  assert.match(main, /finishEventCalendarSwipe/);
  assert.match(main, /moveEventCalendarMonth\(dx<0\?1:-1\)/);
});

test('date selection and clearing keep the existing eventFilter.date contract', () => {
  assert.match(main, /case 'event-filter-date':[\s\S]*?state\.eventFilter = \{ \.\.\.state\.eventFilter, date: target\.dataset\.date \}/);
  assert.match(main, /case 'clear-event-date':[\s\S]*?state\.eventFilter = \{ \.\.\.state\.eventFilter, date: '' \}/);
  assert.match(events, /button\('날짜 비우기', 'clear-event-date'/);
  assert.match(events, /matchesEventDateFilter\(event, state\.eventFilter/);
});

test('event calendar excludes bloom-calendar flower features', () => {
  const fn = calendar.slice(calendar.indexOf('function renderEventFilterCalendar'), calendar.indexOf('function escapeIcs'));
  for (const forbidden of ['이달에 피는 꽃','이달 꽃 전체 표시','bloom-flower-rail','bloom-calendar-marker','개화 상태']) {
    assert.doesNotMatch(fn, new RegExp(forbidden));
  }
});

test('event error state uses exact copy and retry action while normal filtered empty copy is exact', () => {
  assert.match(components, /text: '행사를 불러오지 못했어요\.'/);
  assert.match(components, /text: '네트워크 상태를 확인한 뒤 다시 시도해주세요\.'/);
  assert.match(components, /button\('다시 불러오기', 'retry-events'/);
  assert.match(events, /'조건에 맞는 행사가 없어요\.'/);
  assert.match(main, /case 'retry-events':[\s\S]*?loadEventData\(\{ force: true \}\)/);
});

test('existing filtered cards render before an error so failure is appended at the list end', () => {
  const fn = events.slice(events.indexOf('function updateEventResults'), events.indexOf('return { "renderEvents"'));
  const listAppend = fn.indexOf('results.append(list)');
  const errorAppend = fn.indexOf('if (state.eventsError) results.append(eventErrorState');
  assert.ok(listAppend >= 0 && errorAppend > listAppend);
});

test('V61 build emits only the requested DEV file', () => {
  assert.match(build, /꽃을보다_V61_dev\.html/);
  assert.doesNotMatch(build, /꽃을보다_V61\.html/);
  assert.match(devHtml, /globalThis\.__FLOWER_APP_DEV__=true/);
  assert.match(devHtml, /Botanical V61 DEV/);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [dateSource, notificationSource, modulesSource] = await Promise.all([
  readFile(new URL('../src/js/dateUtils.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/eventNotificationService.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/modules.json', import.meta.url), 'utf8')
]);

function service() {
  const context = vm.createContext({ Date, Intl, Set, Number });
  vm.runInContext(`const __mods=Object.create(null);\n${dateSource}\n__mods['js/eventService.js']={getRecommendedEvents:(events)=>events};\n${notificationSource}`, context);
  return vm.runInContext('__mods["js/eventNotificationService.js"]', context);
}

function event(id, startDate, endDate = startDate, overrides = {}) {
  return { id, title: `${id} 꽃 행사`, startDate, endDate, place: '꽃마을', ...overrides };
}

test('today-starting event uses Seoul date and contains the event notification fields', () => {
  const notifications = service().getEventNotifications({
    events: [event('today', '20260921', '20260925')],
    now: new Date('2026-09-20T15:00:00.000Z')
  });
  assert.equal(notifications.length, 1);
  assert.deepEqual({ ...notifications[0] }, {
    id: 'event:today:event-starts-today:20260921',
    eventId: 'today',
    type: 'event-starts-today',
    title: 'today 꽃 행사',
    description: '오늘 시작하는 행사예요.',
    startDate: '20260921',
    endDate: '20260925',
    place: '꽃마을',
    createdForDate: '2026-09-21',
    readKey: 'event:today:event-starts-today:20260921',
    isRead: false
  });
});

test('existing 30-day upcoming status creates a soon notification', () => {
  const notifications = service().getEventNotifications({
    events: [event('soon', '20261020', '20261022')],
    now: new Date('2026-09-21T12:00:00+09:00')
  });
  assert.equal(notifications[0].type, 'event-starting-soon');
  assert.equal(notifications[0].description, '10월 20일 시작');
});

test('a saved event uses its id and replaces the general soon notification', () => {
  const notifications = service().getEventNotifications({
    events: [event('saved', '20260924', '20260925')],
    savedEventIds: { saved: '2026-09-24', missing: '2026-09-24' },
    now: new Date('2026-09-21T12:00:00+09:00')
  });
  assert.equal(notifications.length, 1);
  assert.equal(notifications[0].eventId, 'saved');
  assert.equal(notifications[0].type, 'saved-event-starting-soon');
  assert.equal(notifications[0].description, '저장한 행사 · 9월 24일 시작');
});

test('a single event never produces duplicate notifications and higher priority comes first', () => {
  const notifications = service().getEventNotifications({
    events: [
      event('saved-today', '20260921', '20260923'),
      event('saved-today', '20260921', '20260923'),
      event('later', '20260923', '20260924')
    ],
    savedEventIds: ['saved-today', 'later'],
    now: new Date('2026-09-21T12:00:00+09:00')
  });
  assert.deepEqual(Array.from(notifications, (item) => item.type), ['event-starts-today', 'saved-event-starting-soon']);
  assert.equal(new Set(notifications.map((item) => item.eventId)).size, notifications.length);
});

test('empty data and invalid event ids safely return no notification', () => {
  const notifications = service().getEventNotifications({
    events: [event('', '20260924'), event('invalid-date', 'bad-date')],
    savedEventIds: ['missing'],
    now: new Date('2026-09-21T12:00:00+09:00')
  });
  assert.deepEqual(Array.from(notifications), []);
  assert.deepEqual(Array.from(service().getEventNotifications({ events: null })), []);
});

test('Seoul midnight boundary changes tomorrow to today-starting without DEV data', () => {
  const api = service();
  const before = api.getEventNotifications({ events: [event('boundary', '20260921')], now: new Date('2026-09-20T14:59:59.000Z') });
  const after = api.getEventNotifications({ events: [event('boundary', '20260921')], now: new Date('2026-09-20T15:00:00.000Z') });
  assert.equal(before[0].type, 'event-starting-soon');
  assert.equal(after[0].type, 'event-starts-today');
  assert.doesNotMatch(notificationSource, /devTodayFlowerDate|__FLOWER_APP_DEV__|runtimeHooks/);
});

test('notification service is a common module for DEV and PROD builds', () => {
  const modules = JSON.parse(modulesSource);
  assert.ok(modules.common.includes('js/eventNotificationService.js'));
  assert.ok(!modules.dev.some((entry) => (typeof entry === 'string' ? entry : entry.path) === 'js/eventNotificationService.js'));
});

test('read state persists only true read keys under the dedicated new storage key', () => {
  const api = service();
  const values = new Map();
  const storage = { getItem: (key) => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  assert.equal(api.saveEventNotificationReads({ one: true, two: false, long: 'true' }, storage), true);
  assert.equal(values.get(api.EVENT_NOTIFICATION_READ_STORAGE_KEY), '{"one":true}');
  assert.deepEqual({ ...api.loadEventNotificationReads(storage) }, { one: true });
  assert.equal(api.saveEventNotificationReads({ one: true }, null), false);
});

test('unread counts and visual badge text cover zero, single digits, and 9+', () => {
  const api = service();
  assert.equal(api.getUnreadNotificationCount([{ isRead: true }, { isRead: false }]), 1);
  assert.equal(api.formatNotificationBadgeCount(0), '0');
  assert.equal(api.formatNotificationBadgeCount(9), '9');
  assert.equal(api.formatNotificationBadgeCount(10), '9+');
});

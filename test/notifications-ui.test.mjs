import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const [source, mainSource, shellSource] = await Promise.all([
  readFile(new URL('../src/js/ui/notifications.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/ui/screens/shell.js', import.meta.url), 'utf8')
]);

function makeElement(tag, props = {}, children = []) {
  return { tag, props, children: children.filter(Boolean), append(...items) { this.children.push(...items.filter(Boolean)); } };
}
function findAll(node, predicate, rows = []) {
  if (!node) return rows;
  if (predicate(node)) rows.push(node);
  for (const child of node.children || []) findAll(child, predicate, rows);
  return rows;
}
function renderNotifications(state) {
  const context = vm.createContext({});
  vm.runInContext(`const __mods=Object.create(null);\n__mods['js/ui/dom.js']={el:${makeElement.toString()},button:(text,action,options={})=>({tag:'button',props:{text,dataset:{action,...(options.data||{})},className:options.extraClass||''},children:[]})};\n__mods['js/ui/components.js']={formatEventRange:function(item){return item.startDate===item.endDate?item.startDate:item.startDate+' ~ '+item.endDate;},emptyState:message=>({tag:'empty',props:{message},children:[]}),eventErrorState:()=>({tag:'error',props:{},children:[{tag:'button',props:{dataset:{action:'retry-events'}},children:[]}]})};\n${source}`, context);
  return vm.runInContext('__mods["js/ui/notifications.js"].renderNotifications', context)(state);
}

const notification = { id:'event:one:event-starting-soon:20260924', eventId:'one', type:'event-starting-soon', title:'가을 꽃 축제', description:'9월 24일 시작', startDate:'20260924', endDate:'20260926', place:'꽃마을', readKey:'event:one:event-starting-soon:20260924', isRead:false };

test('notification sheet lists the service result with an event-id action and unread text cue', () => {
  const layer = renderNotifications({ eventsLoading:false, eventNotificationsError:'', eventNotifications:[notification] });
  const item = findAll(layer, (node) => node.props?.dataset?.action === 'open-notification-event')[0];
  assert.equal(layer.props.className, 'notification-layer');
  assert.equal(item.props.dataset.eventId, 'one');
  assert.equal(item.props.dataset.notificationId, notification.id);
  assert.match(item.props.ariaLabel, /읽지 않은.*가을 꽃 축제/);
  assert.equal(findAll(item, (node) => node.props?.className === 'notification-unread-dot').length, 1);
});

test('notification sheet has the required empty and event-error retry states', () => {
  const empty = renderNotifications({ eventsLoading:false, eventNotificationsError:'', eventNotifications:[] });
  assert.equal(findAll(empty, (node) => node.tag === 'empty')[0].props.message, '새로운 행사 알림이 없어요.');
  const error = renderNotifications({ eventsLoading:false, eventNotificationsError:'실패', eventNotifications:[] });
  assert.equal(findAll(error, (node) => node.props?.dataset?.action === 'retry-events').length, 1);
});

test('main opens the notification panel, persists only the clicked read key, and reuses event detail by id', () => {
  assert.match(mainSource, /case 'open-notifications':[\s\S]*?state\.notificationOpen = true/);
  assert.match(mainSource, /case 'open-notification-event':[\s\S]*?\[notification\.readKey\]: true[\s\S]*?saveEventNotificationReads\(next\)[\s\S]*?openEventDetail\(notification\.eventId\)/);
  assert.doesNotMatch(mainSource, /find\([^)]*title|includes\(notification\.title\)/);
  assert.match(shellSource, /dataset:\{action:'open-notifications'\}/);
});

test('notification modal keeps existing calendar and settings actions separate', () => {
  assert.match(shellSource, /action:'open-bloom-calendar'/);
  assert.match(shellSource, /action:'go-settings'/);
  assert.match(mainSource, /case 'close-notifications'/);
  assert.match(mainSource, /case 'retry-events':[\s\S]*?loadEventData\(\{ force: true \}\)/);
});

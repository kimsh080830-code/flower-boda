__mods["js/eventNotificationService.js"] = (() => {
const { getSeoulDay, getEventStatus, parseApiDate, formatApiDate } = __mods['js/dateUtils.js'];
const { getRecommendedEvents } = __mods['js/eventService.js'];

const EVENT_NOTIFICATION_READ_STORAGE_KEY = 'flower-info.event-notification-reads.v1';
const NOTIFICATION_PRIORITY = Object.freeze({
  'event-starts-today': 0,
  'saved-event-starting-soon': 1,
  'event-starting-soon': 2
});

function eventDateKey(value) {
  const date = parseApiDate(value);
  return date ? getSeoulDay(date).replaceAll('-', '') : '';
}

function toIdSet(value) {
  if (value instanceof Set) return new Set([...value].filter((id) => typeof id === 'string' && id));
  if (Array.isArray(value)) return new Set(value.filter((id) => typeof id === 'string' && id));
  if (value && typeof value === 'object') return new Set(Object.keys(value).filter((id) => typeof id === 'string' && id));
  return new Set();
}

function toReadIdSet(value) {
  if (value instanceof Set) return new Set([...value].filter((id) => typeof id === 'string' && id));
  if (Array.isArray(value)) return new Set(value.filter((id) => typeof id === 'string' && id));
  if (value && typeof value === 'object') return new Set(Object.entries(value)
    .filter(([id, read]) => typeof id === 'string' && id && read === true)
    .map(([id]) => id));
  return new Set();
}

function normalizeReadState(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value)
    .filter(([id, read]) => typeof id === 'string' && id.length <= 260 && read === true));
}

function loadEventNotificationReads(storage = globalThis.localStorage) {
  try { return normalizeReadState(JSON.parse(storage?.getItem?.(EVENT_NOTIFICATION_READ_STORAGE_KEY) || '{}')); }
  catch { return {}; }
}

function saveEventNotificationReads(value, storage = globalThis.localStorage) {
  if (!storage?.setItem) return false;
  try {
    storage.setItem(EVENT_NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(normalizeReadState(value)));
    return true;
  } catch { return false; }
}

function getUnreadNotificationCount(notifications) {
  return Array.isArray(notifications) ? notifications.filter((item) => item && !item.isRead).length : 0;
}

function formatNotificationBadgeCount(count) {
  const normalized = Math.max(0, Math.floor(Number(count) || 0));
  return normalized > 9 ? '9+' : String(normalized);
}

function notificationId(eventId, type, startDate) {
  return `event:${eventId}:${type}:${startDate}`;
}

function notificationCopy(type, event) {
  if (type === 'event-starts-today') return '오늘 시작하는 행사예요.';
  if (type === 'saved-event-starting-soon') return `저장한 행사 · ${formatApiDate(event.startDate)} 시작`;
  return `${formatApiDate(event.startDate)} 시작`;
}

function createNotification(event, type, createdForDate, readIds) {
  const startDate = eventDateKey(event.startDate);
  const endDate = eventDateKey(event.endDate);
  if (!event?.id || !event.title || !startDate || !endDate) return null;
  const id = notificationId(event.id, type, startDate);
  return {
    id,
    eventId: event.id,
    type,
    title: event.title,
    description: notificationCopy(type, event),
    startDate,
    endDate,
    place: event.place || event.address || event.region || '',
    createdForDate,
    readKey: id,
    isRead: readIds.has(id)
  };
}

function getEventNotifications({ events = [], savedEventIds = [], readNotificationIds = [], now = new Date() } = {}) {
  if (!Array.isArray(events) || !events.length) return [];
  const createdForDate = getSeoulDay(now);
  const savedIds = toIdSet(savedEventIds);
  const readIds = toReadIdSet(readNotificationIds);
  const byEventId = new Map();
  const candidates = getRecommendedEvents(events, { includeEnded: true, includeUnverified: false });

  for (const event of candidates) {
    if (!event?.id) continue;
    const status = getEventStatus(event.startDate, event.endDate, now);
    const startDate = eventDateKey(event.startDate);
    let type = '';
    if (status.code === 'ongoing' && startDate === createdForDate.replaceAll('-', '')) {
      type = 'event-starts-today';
    } else if (status.code === 'upcoming' && Number.isFinite(status.daysUntil) && status.daysUntil <= 30) {
      type = savedIds.has(event.id) ? 'saved-event-starting-soon' : 'event-starting-soon';
    }
    if (!type) continue;
    const notification = createNotification(event, type, createdForDate, readIds);
    if (!notification) continue;
    const previous = byEventId.get(event.id);
    if (!previous || NOTIFICATION_PRIORITY[notification.type] < NOTIFICATION_PRIORITY[previous.type]) {
      byEventId.set(event.id, notification);
    }
  }

  return [...byEventId.values()].sort((a, b) =>
    NOTIFICATION_PRIORITY[a.type] - NOTIFICATION_PRIORITY[b.type] ||
    a.startDate.localeCompare(b.startDate) ||
    a.eventId.localeCompare(b.eventId)
  );
}

return {
  "EVENT_NOTIFICATION_READ_STORAGE_KEY": EVENT_NOTIFICATION_READ_STORAGE_KEY,
  "loadEventNotificationReads": loadEventNotificationReads,
  "saveEventNotificationReads": saveEventNotificationReads,
  "getUnreadNotificationCount": getUnreadNotificationCount,
  "formatNotificationBadgeCount": formatNotificationBadgeCount,
  "getEventNotifications": getEventNotifications
};
})();

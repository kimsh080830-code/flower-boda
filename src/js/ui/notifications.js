__mods["js/ui/notifications.js"] = (() => {
const { el, button } = __mods['js/ui/dom.js'];
const { emptyState, eventErrorState, formatEventRange } = __mods['js/ui/components.js'];

function notificationLabel(type) {
  return ({
    'event-starts-today': '오늘 시작',
    'saved-event-starting-soon': '저장한 행사',
    'event-starting-soon': '곧 시작'
  })[type] || '행사 알림';
}

function notificationItem(notification) {
  const unread = !notification.isRead;
  const details = [formatEventRange(notification), notification.place].filter(Boolean).join(' · ');
  return el('button', {
    type: 'button',
    className: `notification-item ${unread ? 'is-unread' : ''}`.trim(),
    dataset: { action: 'open-notification-event', notificationId: notification.id, eventId: notification.eventId },
    ariaLabel: `${unread ? '읽지 않은 ' : ''}${notificationLabel(notification.type)} 알림, ${notification.title} 행사 상세 보기`
  }, [
    el('span', { className: 'notification-unread-dot', 'aria-hidden': 'true', hidden: !unread }),
    el('span', { className: 'notification-item-copy' }, [
      el('span', { className: 'notification-item-kind', text: notificationLabel(notification.type) }),
      el('strong', { className: 'notification-item-title', text: notification.title }),
      el('span', { className: 'notification-item-description', text: notification.description }),
      details ? el('span', { className: 'notification-item-meta', text: details }) : null,
      unread ? el('span', { className: 'visually-hidden', text: '읽지 않은 알림' }) : null
    ]),
    el('span', { className: 'row-chevron', text: '›', 'aria-hidden': 'true' })
  ]);
}

function renderNotifications(state) {
  const panel = el('section', { className: 'notification-panel', dataset: { action: 'notification-panel' } }, [
    el('div', { className: 'notification-handle', 'aria-hidden': 'true' }),
    el('div', { className: 'notification-heading' }, [
      el('div', {}, [
        el('h2', { id: 'notification-title', text: '행사 알림' }),
        el('p', { className: 'notification-subtitle', text: '시작 예정인 꽃 행사 소식이에요.' })
      ]),
      button('닫기', 'close-notifications', { kind: 'tertiary', extraClass: 'notification-close' })
    ])
  ]);
  if (state.settings?.eventNotificationsEnabled === false) {
    panel.append(emptyState('설정에서 행사 알림이 꺼져 있어요.'));
  } else if (state.eventsLoading) {
    panel.append(el('p', { className: 'weather-note notification-loading', role: 'status', text: '행사 알림을 불러오는 중이에요.' }));
  } else if (state.eventNotificationsError) {
    panel.append(eventErrorState(state.eventNotificationsError));
  } else if (!state.eventNotifications?.length) {
    panel.append(emptyState('새로운 행사 알림이 없어요.'));
  } else {
    panel.append(el('div', { className: 'notification-list', 'aria-label': '행사 알림 목록' }, state.eventNotifications.map(notificationItem)));
  }
  return el('div', {
    className: 'notification-layer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'notification-title',
    dataset: { action: 'close-notifications' }
  }, [panel]);
}

return { "renderNotifications": renderNotifications };
})();

__mods["js/ui.js"] = (() => {
const { getFlowerById } = __mods["js/data.js"];
const { el } = __mods["js/ui/dom.js"];
const { renderHome, renderCapture, renderEvents, renderEncyclopedia, updateEncyclopediaResults, updateEventResults, updateEventFlowerChoices, renderFlowerDetail, renderEventDetail, renderAppHeader, renderBottomNav } = __mods["js/ui/screens.js"];



function renderPhotoPicker() {
  return el('div', {
    className: 'photo-picker-layer',
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': 'photo-picker-title',
    dataset: { action: 'close-photo-picker' }
  }, [
    el('div', { className: 'photo-picker-sheet', dataset: { action: 'photo-picker-panel' } }, [
      el('div', { className: 'photo-picker-handle', 'aria-hidden': 'true' }),
      el('h2', { className: 'photo-picker-title', id: 'photo-picker-title', text: '사진으로 꽃 찾기' }),
      el('div', { className: 'photo-picker-actions' }, [
        el('button', { type: 'button', className: 'photo-picker-action', dataset: { action: 'trigger-camera' }, ariaLabel: '사진 촬영' }, [
          el('span', { className: 'photo-picker-action-copy' }, [
            el('span', { className: 'photo-picker-action-title', text: '사진 촬영' }),
            el('span', { className: 'photo-picker-action-note', text: '카메라로 바로 촬영' })
          ]),
          el('span', { className: 'nav-icon nav-camera', 'aria-hidden': 'true' })
        ]),
        el('button', { type: 'button', className: 'photo-picker-action', dataset: { action: 'trigger-gallery' }, ariaLabel: '앨범에서 선택' }, [
          el('span', { className: 'photo-picker-action-copy' }, [
            el('span', { className: 'photo-picker-action-title', text: '앨범에서 선택' }),
            el('span', { className: 'photo-picker-action-note', text: '저장된 사진 사용' })
          ]),
          el('span', { className: 'nav-icon nav-gallery', 'aria-hidden': 'true' })
        ])
      ]),
      el('button', { type: 'button', className: 'photo-picker-cancel', dataset: { action: 'close-photo-picker' }, text: '취소' })
    ])
  ]);
}


let renderedTab = null;
let renderedModalKey = '';
let modalTrail = [];

function controlIdentity(node) {
  if (!node || node.nodeType !== 1) return null;
  return {
    id: node.id, tag: node.tagName,
    data: JSON.stringify(Object.entries(node.dataset || {}).sort(([a], [b]) => a.localeCompare(b))),
    record: node.closest('[data-record-id]')?.dataset.recordId || '',
    href: node.getAttribute('href') || '',
    label: node.tagName === 'SUMMARY' ? (node.parentElement?.id || node.textContent.trim()) : ''
  };
}
function matchingControls(root, identity) {
  if (!identity) return [];
  if (identity.id) {
    const node = document.getElementById(identity.id);
    return node && root.contains(node) ? [node] : [];
  }
  return [...root.querySelectorAll(identity.tag)].filter(node => {
    const next = controlIdentity(node);
    return next.data === identity.data && next.record === identity.record && next.href === identity.href && next.label === identity.label;
  });
}
function captureControl(root) {
  const node = document.activeElement;
  if (!node || !root.contains(node)) return null;
  const identity = controlIdentity(node);
  const snapshot = { identity, index: matchingControls(root, identity).indexOf(node), scrollTop: node.scrollTop, scrollLeft: node.scrollLeft };
  if (node.matches('textarea, input[type="text"], input[type="search"], input:not([type])')) {
    snapshot.value = node.value;
    snapshot.selection = [node.selectionStart, node.selectionEnd, node.selectionDirection];
  }
  return snapshot;
}
function focusControl(root, snapshot) {
  const matches = matchingControls(root, snapshot?.identity);
  const node = matches[snapshot?.index] || matches[0];
  if (!node || node.disabled || node.closest('[inert]') || !node.getClientRects().length) return false;
  // A pending debounced search must not discard text typed just before an API or image refresh.
  if (snapshot.value !== undefined) node.value = snapshot.value;
  node.focus({ preventScroll: true });
  if (snapshot.selection && typeof node.setSelectionRange === 'function') {
    try { node.setSelectionRange(...snapshot.selection); } catch {}
  }
  node.scrollTop = snapshot.scrollTop;
  node.scrollLeft = snapshot.scrollLeft;
  return document.activeElement === node;
}
function focusDialog(modal) {
  if (!modal) return;
  const heading = modal.querySelector('h2, h3');
  const target = heading || modal.querySelector('button:not(:disabled), a[href], input:not(:disabled), summary') || modal;
  if (target === heading || target === modal) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
}
function syncModalState(modal) {
  const modalOpen = Boolean(modal);
  document.body.classList.toggle('is-modal-open', modalOpen);
  document.querySelectorAll('.skip-link, .app-header, #main-content, .bottom-nav').forEach((node) => {
    node.inert = modalOpen;
  });
  document.querySelectorAll('.detail-layer, .photo-picker-layer, .bloom-calendar-layer').forEach(node => { node.inert = node !== modal; });
}

function renderApp(state) {
  const root = document.getElementById('app');
  if (!root) return;
  const previousControl = captureControl(root);
  const previousModal = root.querySelector('.bloom-calendar-layer') || root.querySelector('.photo-picker-layer') || root.querySelector('.detail-layer');
  const previousScroll = { left: window.scrollX, top: window.scrollY, modalLeft: previousModal?.scrollLeft || 0, modalTop: previousModal?.scrollTop || 0 };
  const disclosures = [...(previousModal?.querySelectorAll('details') || [])].map(node => node.open);
  const sameTab = renderedTab === state.currentTab;
  let screen;
  switch (state.currentTab) {
    case 'settings': screen = __mods['js/ui/screens/settings.js'].renderSettings(state); break;
    case 'capture': screen = renderCapture(state); break;
    case 'events': screen = renderEvents(state); break;
    case 'encyclopedia': screen = renderEncyclopedia(state); break;
    default: screen = renderHome(state);
  }
  screen.setAttribute('tabindex', '-1');
  if (['events','home','encyclopedia'].includes(state.currentTab)) screen.dataset.mainTabSwipe = 'true';
  const fragment = document.createDocumentFragment();
  fragment.append(
    el('a', { className: 'skip-link', href: '#main-content', text: '본문으로 건너뛰기' }),
    renderAppHeader(state),
    screen,
    renderBottomNav(state)
  );
  if (state.detail?.type === 'flower') {
    const flower = getFlowerById(state.detail.id);
    if (flower) fragment.append(renderFlowerDetail(state, flower));
  }
  if (state.detail?.type === 'event') {
    const event = state.events.find((item) => item.id === state.detail.id);
    if (event) fragment.append(renderEventDetail(state, event));
  }
  if (state.photoPickerOpen) fragment.append(renderPhotoPicker());
  if (state.bloomCalendarOpen) fragment.append(__mods['js/calendar.js'].renderBloomCalendar(state));
  root.replaceChildren(fragment);
  const modal = root.querySelector('.bloom-calendar-layer') || root.querySelector('.photo-picker-layer') || root.querySelector('.detail-layer');
  const modalKey = modal ? (modal.classList.contains('bloom-calendar-layer') ? 'bloom-calendar' : modal.classList.contains('photo-picker-layer') ? 'photo-picker' : `${state.detail.type}/${state.detail.id}`) : '';
  // Missing or still-loading event IDs must never make the page inert without a dialog.
  syncModalState(modal);
  if (modalKey === renderedModalKey && sameTab) {
    if (modal) {
      [...modal.querySelectorAll('details')].forEach((node, index) => { if (index < disclosures.length) node.open = disclosures[index]; });
      modal.scrollTop = previousScroll.modalTop;
      modal.scrollLeft = previousScroll.modalLeft;
    }
    if (previousControl && !focusControl(root, previousControl)) {
      if (modal) focusDialog(modal); else focusMain();
    }
  } else if (modal) {
    const returnIndex = sameTab ? modalTrail.findIndex(entry => entry.key === modalKey) : -1;
    const returnEntry = returnIndex >= 0 ? modalTrail[returnIndex + 1] : null;
    const returningControl = returnEntry?.opener;
    if (returnEntry?.openerScroll) {
      [...modal.querySelectorAll('details')].forEach((node, index) => {
        if (index < returnEntry.openerDisclosures.length) node.open = returnEntry.openerDisclosures[index];
      });
      modal.scrollTop = returnEntry.openerScroll.modalTop;
      modal.scrollLeft = returnEntry.openerScroll.modalLeft;
    }
    if (returnIndex >= 0) modalTrail = modalTrail.slice(0, returnIndex + 1);
    else {
      if (!sameTab) modalTrail = [];
      modalTrail.push({ key: modalKey, opener: previousControl, openerScroll: previousScroll, openerDisclosures: disclosures });
    }
    if (!returningControl || !focusControl(root, returningControl)) focusDialog(modal);
  } else {
    const opener = sameTab && renderedModalKey ? modalTrail[0]?.opener : null;
    modalTrail = [];
    if (opener && focusControl(root, opener)) {
      // Focus returns to the same opener after close, Escape, or browser Back.
    } else if (renderedTab !== null || previousControl) focusMain();
  }
  if (sameTab) window.scrollTo({ left: previousScroll.left, top: previousScroll.top, behavior: 'instant' });
  renderedTab = state.currentTab;
  renderedModalKey = modalKey;
}

function focusMain() {
  const main = document.getElementById('main-content');
  if (!main || main.inert) return;
  main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: true });
}
return { "renderApp": renderApp, "focusMain": focusMain, "updateEncyclopediaResults": updateEncyclopediaResults, "updateEventResults": updateEventResults, "updateEventFlowerChoices": updateEventFlowerChoices };
})();

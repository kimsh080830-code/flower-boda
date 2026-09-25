__mods["js/ui/components.js"] = (() => {
const { formatApiDate, getBloomStatus, parseApiDate } = __mods["js/dateUtils.js"];
const { el, button, image, imageCreditBadge } = __mods["js/ui/dom.js"];

function statusBadge(status) {
  return el('span', {
    className: `status status-${status?.code || 'unknown'}`,
    text: status?.label || '상태 확인'
  });
}

function bloomFlow(status, compact=false) {
 const labels=__mods['js/dateUtils.js'].BLOOM_STAGES;
 return el('span',{className:`bloom-flow ${compact?'is-compact':''}`,'aria-label':`예상 개화 흐름 · ${status.label}`},labels.map((label,index)=>
  el('span',{className:`bloom-step ${index===status.stage?'is-current':''}`,'aria-current':index===status.stage?'step':null},[
   el('span',{className:`bloom-symbol bloom-symbol-${index}`,'aria-hidden':'true'}),
   compact ? null : el('span',{text:label})
  ])));
}
function sectionHeader(title, actionText, action, meta = '') {
  return el('div', { className: 'section-head' }, [
    el('div', { className: 'section-title-group' }, [
      el('h2', { text: title }),
      meta ? el('span', { className: 'section-meta', text: meta }) : null
    ]),
    actionText && action
      ? button(actionText, action, { kind: 'tertiary', extraClass: 'btn-small section-action' })
      : null
  ]);
}

function emptyState(message, actionText, action) {
  return el('div', { className: 'state-panel empty-state' }, [
    el('p', { text: message }),
    actionText && action
      ? button(actionText, action, { kind: 'secondary', extraClass: 'btn-small' })
      : null
  ]);
}

function eventErrorState(message) {
  return el('div', { className: 'state-panel state-error event-error-state', role: 'alert' }, [
    el('div', { className: 'event-error-copy' }, [
      el('strong', { text: '행사를 불러오지 못했어요.' }),
      el('p', { text: typeof message === 'string' && message.trim() ? message.trim() : '네트워크 상태를 확인한 뒤 다시 시도해주세요.' })
    ]),
    button('다시 불러오기', 'retry-events', { kind: 'secondary' })
  ]);
}

function formatEventRange(event) {
  const start = formatApiDate(event.startDate);
  const end = formatApiDate(event.endDate);
  if (start && end && start !== end) return `${start} ~ ${end}`;
  return start || end || '';
}

const {primaryFlowerName,otherFlowerNames}=__mods['js/flowerViewData.js'];

function otherNameLine(flower, extraClass = '') {
  const names=otherFlowerNames(flower);
  if (!names.length) return null;
  return el('span', { className: `species-standard ${extraClass}`.trim(), text: `다른 이름 · ${names.join(' · ')}` });
}

function flowerListRow(flower, state, { compact = false, trailing = '' } = {}) {
  const bloom = getBloomStatus(flower.bloom, state.currentDate);
  return el('button', {
    type: 'button',
    className: `species-row ${compact ? 'species-row-compact' : ''}`,
    dataset: { action: 'open-flower', flowerId: flower.id },
    ariaLabel: `${primaryFlowerName(flower)} 상세 정보 보기`
  }, [
    image(flower.image, `${primaryFlowerName(flower)} 참고 이미지`, 'species-thumb', flower.localImage),
    el('span', { className: 'species-main' }, [
      el('span', { className: 'species-title-line' }, [
        el('strong', { text: primaryFlowerName(flower) })
      ]),
      otherNameLine(flower),
      bloomFlow(bloom, true)
    ]),
    trailing ? el('span', { className: 'species-trailing', text: trailing }) : statusBadge(bloom),
    el('span', { className: 'row-chevron', text: '›', 'aria-hidden': 'true' })
  ]);
}

function flowerPoster(flower, state, { rail = false, showBloomFlow = true } = {}) {
  const bloom = getBloomStatus(flower.bloom, state.currentDate);
  const scientificName = flower.scientificName || flower.taxonomy?.acceptedName || '';
  const posterImage = image(flower.image, `${primaryFlowerName(flower)} 참고 이미지`, 'flower-poster-image', flower.localImage);
  return el('button', {
    type: 'button',
    className: `flower-poster ${rail ? 'flower-poster-rail' : ''}`,
    dataset: { action: 'open-flower', flowerId: flower.id },
    ariaLabel: `${primaryFlowerName(flower)} 상세 정보 보기`
  }, [
    el('span', { className: 'flower-poster-media' }, [
      posterImage,
      imageCreditBadge(flower.imageCredit, posterImage, flower.localImage)
    ]),
    el('span', { className: 'flower-poster-copy' }, [
      el('span', { className: 'flower-poster-title' }, [
        el('strong', { text: primaryFlowerName(flower) }),
        statusBadge(bloom)
      ]),
      el('span', {
        className: 'flower-poster-scientific',
        'aria-hidden': scientificName ? null : 'true'
      }, scientificName ? [el('span', { text: scientificName })] : []),
      showBloomFlow ? bloomFlow(bloom, true) : null
    ])
  ]);
}

function eventVerificationText(event) {
  if (event.detailError) return '상세 확인 실패';
  return ({ 'source-checked':'공식 출처 대조', 'detail-checked':'상세 정보 확인', 'list-only':'상세 확인 전', 'stale':'재확인 필요', 'needs-review':'정보 확인 필요' })[event.verification?.status] || '정보 확인 필요';
}

function eventListRow(event, { compact = false, showVerification = !compact } = {}) {
  const startDate = parseApiDate(event.startDate);
  const month = startDate ? `${startDate.getMonth() + 1}월` : '일정';
  const day = startDate ? String(startDate.getDate()).padStart(2, '0') : '—';
  return el('button', {
    type: 'button',
    className: `event-row ${compact ? 'event-row-compact' : ''}`,
    dataset: { action: 'open-event', eventId: event.id },
    ariaLabel: `${event.title} 행사 상세 보기`
  }, [
    el('span', { className: 'event-date-block' }, [
      el('span', { className: 'event-month', text: month }),
      el('strong', { className: 'event-day', text: day }),
      statusBadge(event.status)
    ]),
    el('span', { className: 'event-main' }, [
      el('strong', { className: 'event-title', text: event.title }),
      el('span', { className: 'event-location', text: event.region || '지역 확인' }),
      el('span', { className: 'event-meta', text: formatEventRange(event) || '일정 확인' }),
      showVerification ? el('span', { className: 'event-meta', text: eventVerificationText(event) }) : null
    ]),
    el('span', { className: 'row-chevron', text: '›', 'aria-hidden': 'true' })
  ]);
}

function renderSkeletonRows(count) {
  const wrap = el('div', { className: 'skeleton-list', 'aria-label': '불러오는 중' });
  for (let i = 0; i < count; i += 1) {
    wrap.append(el('div', { className: 'skeleton-row' }, [
      el('span', { className: 'skeleton-image' }),
      el('span', { className: 'skeleton-lines' }, [el('i'), el('i'), el('i')])
    ]));
  }
  return wrap;
}

function detailLine(label, value) {
  if (!value && value !== 0) return null;
  return el('div', { className: 'detail-line' }, [
    el('dt', { text: label }),
    el('dd', { text: value })
  ]);
}

function infoDisclosure(title, children, open = false) {
  const details = el('details', { className: 'detail-disclosure', open: open ? '' : null });
  details.append(el('summary', { text: title }));
  details.append(el('div', { className: 'detail-disclosure-body' }, children));
  return details;
}
return { "eventVerificationText": eventVerificationText, "bloomFlow": bloomFlow, "statusBadge": statusBadge, "sectionHeader": sectionHeader, "emptyState": emptyState, "eventErrorState": eventErrorState, "formatEventRange": formatEventRange, "primaryFlowerName": primaryFlowerName, "otherNameLine": otherNameLine, "flowerListRow": flowerListRow, "flowerPoster": flowerPoster, "eventListRow": eventListRow, "renderSkeletonRows": renderSkeletonRows, "detailLine": detailLine, "infoDisclosure": infoDisclosure };
})();

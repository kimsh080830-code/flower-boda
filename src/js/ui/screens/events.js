__mods["js/ui/screens/events.js"] = (() => {
const { FLOWERS, getFlowerById } = __mods["js/data.js"];
const { getRecommendedEvents, getRelatedEvents, getDirectFlowerEvents, KOREA_REGIONS, matchesEventDateFilter, getSeoulWeekend } = __mods["js/eventService.js"];
const { normalizeSearch, matchesFlowerSearch } = __mods["js/searchUtils.js"];
const { $, el, button } = __mods["js/ui/dom.js"];
const { sectionHeader, emptyState, eventErrorState, eventListRow, renderSkeletonRows } = __mods["js/ui/components.js"];
const { pageHeader, selectControl } = __mods["js/ui/screens/shared.js"];

function eventFlowerLabel(flower) {
  return flower.standardNameKo && flower.standardNameKo !== flower.nameKo
    ? `${flower.standardNameKo} (${flower.nameKo})`
    : flower.standardNameKo || flower.nameKo;
}

function renderEventFlowerChoices(state) {
  const selected = getFlowerById(state.eventFilter.flower);
  const query = state.eventFlowerSearchQuery || '';
  const matches = [...FLOWERS]
    .filter((flower) => flower.id !== selected?.id && matchesFlowerSearch(flower, query))
    .sort(__mods['js/flowerViewData.js'].compareFlowerNames);
  const wrap = el('div', { id: 'event-flower-options', className: 'event-flower-options' });
  if (selected) {
    wrap.append(el('div', { className: 'event-selected-flower' }, [
      el('span', { text: `선택됨 · ${eventFlowerLabel(selected)}` }),
      button('선택 해제', 'clear-event-flower', { kind: 'tertiary', extraClass: 'event-flower-clear' })
    ]));
  }
  const list = el('div', { className: 'event-flower-choice-list', role: 'listbox', ariaLabel: '행사 꽃 선택 결과' });
  if (matches.length) {
    matches.forEach((flower) => list.append(el('button', {
      type: 'button',
      className: 'event-flower-option',
      role: 'option',
      'aria-selected': 'false',
      dataset: { action: 'set-event-flower', flowerId: flower.id },
      text: eventFlowerLabel(flower)
    })));
  } else if (!selected || query) {
    list.append(el('p', { className: 'event-flower-empty', text: '검색한 꽃이 없어요.' }));
  }
  wrap.append(list);
  return wrap;
}

function updateEventFlowerChoices(state, root = document) {
  const current = $('#event-flower-options', root);
  if (current) current.replaceWith(renderEventFlowerChoices(state));
}

function renderEventFlowerPicker(state) {
  const selected = getFlowerById(state.eventFilter.flower);
  return el('div', { className: 'event-flower-picker filter-field' }, [
    el('span', { text: '꽃 검색·선택' }),
    el('input', { id: 'event-flower-filter', type: 'hidden', value: selected?.id || '' }),
    el('details', { className: 'inline-select event-flower-select' }, [
      el('summary', {
        className: 'inline-select-trigger',
        dataset: { action: 'toggle-inline-select' },
        ariaLabel: `꽃 검색·선택: ${selected ? eventFlowerLabel(selected) : '꽃 선택'}`,
        'aria-controls': 'event-flower-panel'
      }, [el('span', { className: 'inline-select-value', text: selected ? eventFlowerLabel(selected) : '꽃 선택' })]),
      el('div', { id: 'event-flower-panel', className: 'event-flower-panel' }, [
        el('label', { className: 'event-flower-search' }, [
          el('span', { className: 'visually-hidden', text: '행사 꽃 검색' }),
          el('input', { id: 'event-flower-search-filter', type: 'search', value: state.eventFlowerSearchQuery || '', placeholder: '꽃 이름 검색', autocomplete: 'off' })
        ]),
        renderEventFlowerChoices(state)
      ])
    ])
  ]);
}
function filterEvents(state) {
  const query = normalizeSearch(state.eventSearchQuery);
  const baseEvents = getRecommendedEvents(state.events, {
    includeEnded: ['all', 'weekend'].includes(state.eventFilter.status),
    includeUnverified: state.eventFilter.status === 'all'
  });
  return baseEvents.filter((event) => {
    if (!matchesEventDateFilter(event, state.eventFilter, state.currentDate || new Date())) return false;
    if (state.eventFilter.flower) {
      const flower = getFlowerById(state.eventFilter.flower);
      const relatedEvents = state.eventFilter.directFlowerOnly
        ? getDirectFlowerEvents([event], flower, { includeEnded: true })
        : getRelatedEvents([event], flower, { includeEnded: true });
      if (!flower || !relatedEvents.length) return false;
    }
    if (state.eventFilter.region && event.region !== state.eventFilter.region) return false;
    if (state.eventFilter.subRegion && event.subRegion !== state.eventFilter.subRegion) return false;
    if (query) {
      const haystack = normalizeSearch([event.title, event.description, event.region, event.subRegion, event.place, event.address, ...(event.keywords || [])].join(' '));
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderEvents(state) {
  const main = el('main', { className: 'screen', id: 'main-content' }, [
    pageHeader('Event guide', '꽃 보러 가기', '지금 갈 수 있는 꽃 행사와 정원을 찾아봐요.')
  ]);
  const snapshot = state.events.find(event => event.source === 'verified-snapshot');
  const quality = state.events[0]?.collectionQuality;
  if (snapshot) {
    const checked = new Date(snapshot.verification.checkedAt);
    const dateLabel = Number.isNaN(checked.getTime()) ? '확인일 없음' : new Intl.DateTimeFormat('ko-KR',{ timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric' }).format(checked);
    main.append(el('p', { className:'weather-note', text:`한국관광공사 자료 ${state.events.length}건 중 꽃·정원 행사를 보여드려요. ${dateLabel} 출처 대조 자료이며, 방문 전 최신 공지를 확인해 주세요.` }));
    if (quality?.stale || state.events.some(event => event.verification?.status === 'stale')) main.append(el('p', { className:'weather-note',text:'확인 후 7일이 지나 다시 확인이 필요해요. 전체 탭에서 이전 자료를 볼 수 있어요.' }));
  }
  if (quality?.truncated) main.append(el('p', { className:'weather-note',text:`전체 ${quality.total}건 중 ${quality.received}건을 조회했어요. 일부 행사가 누락될 수 있어요.` }));
  if (quality?.rejected) main.append(el('p', { className:'weather-note',text:`일정·장소를 확인할 수 없는 ${quality.rejected}건은 제외했어요.` }));
  main.append(el('label', { className: 'search-field search-prominent' }, [
    el('span', { className: 'search-glyph', 'aria-hidden': 'true' }),
    el('span', { className: 'visually-hidden', text: '행사 검색' }),
    el('input', { id: 'event-search', type: 'search', value: state.eventSearchQuery, placeholder: '행사명, 지역 또는 주소 검색', autocomplete: 'off' })
  ]));

  const tabs = el('div', { className: 'event-tabs', role: 'group', 'aria-label': '행사 상태 필터' });
  [['weekend','이번 주말'], ['ongoing','진행 중'], ['upcoming','예정'], ['all','전체']].forEach(([value, label]) => {
    const tab = button(label, 'set-event-status', {
      kind: state.eventFilter.status === value ? 'primary' : 'tertiary',
      extraClass: 'event-tab',
      data: { status: value }
    });
    tab.setAttribute('aria-pressed', String(state.eventFilter.status === value));
    tabs.append(tab);
  });
  main.append(tabs);
  if (state.eventFilter.status === 'weekend') {
    const weekend = getSeoulWeekend(state.currentDate || new Date());
    const label = (value) => `${Number(value.slice(4, 6))}월 ${Number(value.slice(6, 8))}일`;
    main.append(el('p', { className:'weather-note', text:`한국 시간 ${label(weekend.start)}(토)~${label(weekend.end)}(일)에 기간이 겹치는 행사예요.` }));
  }
  const eventDateSection = el('section', { className: 'event-date-field', 'aria-labelledby': 'event-date-filter-label' }, [
    el('div', { className: 'event-date-field-heading' }, [
      el('span', { id: 'event-date-filter-label', text: '찾아볼 날짜 (선택 사항)' }),
      button('날짜 비우기', 'clear-event-date', { kind: 'tertiary', disabled: !state.eventFilter.date, extraClass: 'event-date-clear' })
    ]),
    el('p', { id: 'event-date-filter-note', className: 'event-date-filter-note', text: '선택한 상태·지역·날짜 조건을 함께 적용해요. 날짜를 비우면 기간 제한을 해제해요.' }),
    __mods['js/calendar.js'].renderEventFilterCalendar(state)
  ]);
  main.append(eventDateSection);

  const subRegions = [...new Set(state.events
    .filter((event) => !state.eventFilter.region || event.region === state.eventFilter.region)
    .map((event) => event.subRegion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko'));
  const sourceRegions = [...new Set(state.events.map((event) => event.region)
    .filter((region) => region && !KOREA_REGIONS.includes(region)))].sort((a, b) => a.localeCompare(b, 'ko'));
  const filters = el('details', { id:'event-filter-panel',className:'filter-panel',open:state.eventFiltersOpen?'':null }, [
    el('summary', {}, [el('span', { text: '세부 필터' }), el('span', { className: 'filter-summary-hint', text: '꽃 · 시·도 · 시·군·구' })]),
    el('div', { className: 'event-filters' }, [
      renderEventFlowerPicker(state),
      selectControl('시·도', 'event-region-filter', [['','전국'], ...KOREA_REGIONS.map((region) => [region, region]), ...sourceRegions.map((region) => [region, region])], state.eventFilter.region, 'filter-events'),
      selectControl('시·군·구', 'event-subregion-filter', [['','전체'], ...subRegions.map((region) => [region, region])], state.eventFilter.subRegion, 'filter-events')
    ]),
    button('필터 초기화', 'reset-events', { kind: 'tertiary', extraClass: 'btn-small filter-reset' })
  ]);
  main.append(filters);
  main.append(el('section', { id: 'event-results', className: 'content-section event-results', 'aria-label': '행사 검색 결과', 'aria-live': 'polite', 'aria-atomic': 'false' }));
  updateEventResults(state, main);
  return main;
}

function updateEventResults(state, root = document) {
  const results = $('#event-results', root);
  if (!results) return;
  results.replaceChildren();
  results.setAttribute('aria-busy', String(Boolean(state.eventsLoading)));
  const events = filterEvents(state);
  results.append(sectionHeader('행사 목록', '', '', `${events.length}개`));
  if (state.eventsLoading) {
    results.append(el('p', { className:'weather-note event-results-loading', role:'status', text:'행사 목록을 불러오고 있어요.' }));
    if (state.eventsLoadingVisible) results.append(renderSkeletonRows(3));
    return;
  }
  if (events.length) {
    const list = el('div', { className: 'event-list' });
    events.forEach((event) => list.append(eventListRow(event, { showVerification: false })));
    results.append(list);
  } else if (!state.eventsError) {
    const message = state.events.length ? '조건에 맞는 행사가 없어요.' : '현재 표시할 행사가 없어요.';
    const noEvents = emptyState(message);
    noEvents.querySelector('.empty-icon')?.remove();
    noEvents.classList.add('event-empty-state');
    results.append(noEvents);
  }
  if (state.eventsError) results.append(eventErrorState(state.eventsError));
}
return { "renderEvents": renderEvents, "updateEventResults": updateEventResults, "updateEventFlowerChoices": updateEventFlowerChoices, "filterEvents": filterEvents };
})();

__mods["js/ui/screens/events.js"] = (() => {
const { getRecommendedEvents, matchesEventDateFilter } = __mods["js/eventService.js"];
const { normalizeSearch } = __mods["js/searchUtils.js"];
const { $, el, button } = __mods["js/ui/dom.js"];
const { sectionHeader, emptyState, eventErrorState, eventListRow, renderSkeletonRows } = __mods["js/ui/components.js"];
const { pageHeader } = __mods["js/ui/screens/shared.js"];

function filterEvents(state) {
  const query = normalizeSearch(state.eventSearchQuery);
  const baseEvents = getRecommendedEvents(state.events);
  return baseEvents.filter((event) => {
    if (!matchesEventDateFilter(event, state.eventFilter)) return false;
    if (query) {
      const haystack = normalizeSearch([event.title, event.description, event.region, event.subRegion, event.place, event.address, ...(event.keywords || [])].join(' '));
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

function renderEvents(state) {
  const main = el('main', { className: 'screen', id: 'main-content' }, [
    pageHeader('', '꽃 행사', '지금 갈 수 있는 꽃 행사와 정원을 찾아봐요.')
  ]);
  const snapshot = state.events.find(event => event.source === 'verified-snapshot');
  const quality = state.events[0]?.collectionQuality;
  if (snapshot) {
    const checked = new Date(snapshot.verification.checkedAt);
    const dateLabel = Number.isNaN(checked.getTime()) ? '확인일 없음' : new Intl.DateTimeFormat('ko-KR',{ timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric' }).format(checked);
    main.append(el('p', { className:'weather-note', text:`한국관광공사 자료 ${state.events.length}건 중 꽃·정원 행사를 보여드려요. ${dateLabel} 출처 대조 자료이며, 방문 전 최신 공지를 확인해 주세요.` }));
  }
  if (quality?.truncated) main.append(el('p', { className:'weather-note',text:`전체 ${quality.total}건 중 ${quality.received}건을 조회했어요. 일부 행사가 누락될 수 있어요.` }));
  if (quality?.rejected) main.append(el('p', { className:'weather-note',text:`일정·장소를 확인할 수 없는 ${quality.rejected}건은 제외했어요.` }));

  main.append(el('label', { className: 'search-field search-prominent' }, [
    el('span', { className: 'search-glyph', 'aria-hidden': 'true' }),
    el('span', { className: 'visually-hidden', text: '행사 검색' }),
    el('input', { id: 'event-search', type: 'search', value: state.eventSearchQuery, placeholder: '행사명, 지역 또는 주소 검색', autocomplete: 'off' })
  ]));

  const eventDateSection = el('section', { className: 'event-date-field', 'aria-labelledby': 'event-date-filter-label' }, [
    el('div', { className: 'event-date-field-heading' }, [
      el('span', { id: 'event-date-filter-label', text: '날짜 선택' }),
      button('선택 해제', 'clear-event-date', { kind: 'tertiary', disabled: !state.eventFilter.date, extraClass: 'event-date-clear' })
    ]),
    el('p', { id: 'event-date-filter-note', className: 'event-date-filter-note', text: '날짜를 선택하면 해당 날짜에 열리는 행사만 보여줘요. 선택을 해제하면 모든 날짜의 행사를 볼 수 있어요.' }),
    __mods['js/calendar.js'].renderEventFilterCalendar(state)
  ]);
  main.append(eventDateSection);

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
return { "renderEvents": renderEvents, "updateEventResults": updateEventResults, "filterEvents": filterEvents };
})();

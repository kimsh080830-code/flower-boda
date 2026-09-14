__mods["js/ui/screens/home.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { FLOWERS } = __mods["js/data.js"];
const { getBloomStatus, parseApiDate } = __mods["js/dateUtils.js"];
const { selectTodayFlower, getDevTodayFlowerStorage } = __mods["js/todayFlower.js"];
const { getFlowerRelaySnapshot } = __mods["js/flowerRelay.js"];
const { getOngoingEvents } = __mods["js/eventService.js"];
const { el, button, image } = __mods["js/ui/dom.js"];
const { bloomFlow, sectionHeader, emptyState, eventErrorState, primaryFlowerName, flowerPoster, eventListRow, renderSkeletonRows } = __mods["js/ui/components.js"];
const { topSeasonFlowers, selectControl } = __mods["js/ui/screens/shared.js"];
const { matchesFlowerSearch, normalizeSearch } = __mods["js/searchUtils.js"];

const {shortSentence,habitatSummary,identificationSummary}=__mods['js/flowerViewData.js'];

function getHomeRegions(events) {
  return [...new Set(events.map((event) => event.region).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b, 'ko'));
}

function homeFeature(flower, state, featureDate=state.currentDate) {
 const bloom=getBloomStatus(flower.bloom,featureDate), saved=state.favoriteFlowerIds.includes(flower.id);
 const save=button(saved?'저장됨':'저장','toggle-favorite',{kind:'tertiary',data:{flowerId:flower.id},extraClass:'save-button'});
 save.setAttribute('aria-pressed',String(saved)); save.setAttribute('aria-label',`${primaryFlowerName(flower)} ${saved?'저장 해제':'저장'}`);
 return el('section',{className:'editorial-feature','aria-labelledby':'home-feature-title'},[
  el('button',{type:'button',className:'editorial-feature-media',dataset:{action:'open-flower',flowerId:flower.id},ariaLabel:`${primaryFlowerName(flower)} 꽃 정보 보기`},[image(flower.image,`${primaryFlowerName(flower)} 참고 이미지`,'editorial-feature-image',flower.localImage)]),
  el('div',{className:'editorial-feature-copy'},[
   el('div',{className:'editorial-feature-meta'},[el('span',{className:'section-label',text:'오늘 눈여겨볼 꽃'}),save]),
   el('h1',{id:'home-feature-title',text:primaryFlowerName(flower)}),
   el('p',{className:'feature-description',text:shortSentence(flower.description,52)}),
   el('dl',{className:'feature-context'},[
    el('div',{},[el('dt',{text:'꽃말'}),el('dd',{text:flower.flowerLanguage?.meaning || '정보 없음'})]),
    el('div',{},[el('dt',{text:'볼 수 있는 곳'}),el('dd',{text:habitatSummary(flower)})])
   ]),
   el('div',{className:'feature-actions'},[button('꽃 정보 보기','open-flower',{kind:'primary',data:{flowerId:flower.id}}),button('보러 갈 곳','candidate-events',{data:{flowerId:flower.id}})])
  ])
 ]);
}

function renderRegionPicker(state, regions) {
  const options = [['', '전체']];
  if (state.userRegion && !regions.includes(state.userRegion)) {
    options.push([state.userRegion, state.userRegion]);
  }
  regions.forEach((region) => options.push([region, region]));
  const control = selectControl('탐색 지역', 'home-region-select', options, state.userRegion, 'set-home-region');
  control.classList.add('home-region-picker');
  return control;
}

function renderFlowerRelay(state) {
  const relay = getFlowerRelaySnapshot({
    flowers:FLOWERS,date:state.currentDate,records:state.discoveredFlowers,storage:localStorage,
    devScenario:APP_CONFIG.DEV_MODE ? state.devRelayScenario : ''
  });
  const relayViewAction = relay.status==='before'
    ? (relay.synthetic?'dev-noop':'relay-start')
    : relay.status==='active'
      ? (relay.synthetic?'dev-noop':'relay-continue')
      : '';
  const section = el('section',{className:'content-section flower-relay','aria-labelledby':'flower-relay-title'},[
    el('div',{className:'section-head'},[
      el('div',{className:'section-title-group'},[
        el('h2',{id:'flower-relay-title',text:'오늘의 꽃 릴레이'}),
        relay.total ? el('span',{className:'section-meta',text:`${relay.completedCount} / ${relay.total}`}) : null
      ]),
      relayViewAction ? button('릴레이 보기 ›',relayViewAction,{kind:'tertiary',extraClass:'btn-small section-action flower-relay-view'}) : null
    ]),
    el('p',{className:'flower-relay-description',text:relay.total
      ? `오늘 주변에서 만날 수 있는 꽃 ${relay.total}종을 이어서 만나보세요.`
      : '지금 볼 수 있는 꽃을 이어서 만나보세요.'})
  ]);
  if (!relay.total) {
    section.append(emptyState('지금 개화 중인 릴레이 후보가 없어요.','도감에서 보기','go-current-season'));
    if(state.relayError) section.append(el('p',{className:'form-error',role:'alert',text:state.relayError}));
    return section;
  }
  const completed = new Set(relay.completedFlowerIds);
  section.append(el('div',{className:'flower-relay-targets','aria-label':'릴레이 대상 꽃'},relay.targets.map((flower) => {
    const isComplete=completed.has(flower.id), isNext=relay.started && flower.id===relay.nextFlowerId;
    return el('article',{className:`flower-relay-target ${isComplete?'is-complete':''} ${isNext?'is-next':''}`.trim()},[
      el('span',{className:'flower-relay-placeholder','aria-hidden':'true'}),
      el('strong',{text:primaryFlowerName(flower)}),
      el('small',{text:isComplete?'완료':isNext?'다음 꽃':'대기'})
    ]);
  })));
  const statusText = relay.status==='complete'
    ? '오늘의 꽃 릴레이 완료'
    : relay.status==='active'
      ? `${relay.completedCount} / ${relay.total} 완료`
      : `0 / ${relay.total}`;
  const nextFlower = relay.nextFlowerId ? FLOWERS.find((flower)=>flower.id===relay.nextFlowerId) : null;
  section.append(el('div',{className:'flower-relay-progress-row'},[
    el('div',{className:'flower-relay-progress-copy'},[
      el('strong',{text:statusText}),
      relay.status==='active' && nextFlower ? el('span',{text:`다음 꽃 · ${primaryFlowerName(nextFlower)}`}) : null
    ]),
    relay.status==='before' ? button('릴레이 시작',relay.synthetic?'dev-noop':'relay-start',{kind:'primary'}) : null,
    relay.status==='active' ? button('이어보기',relay.synthetic?'dev-noop':'relay-continue',{kind:'primary'}) : null
  ]));
  section.append(el('div',{className:'flower-relay-progress','aria-hidden':'true'},[
    el('span',{style:`width:${relay.total ? Math.round(relay.completedCount/relay.total*100) : 0}%`})
  ]));
  if(relay.total<3) section.append(el('p',{className:'weather-note',text:`지금 개화 후보가 ${relay.total}종이라 가능한 꽃만 이어요.`}));
  if(state.relayError) section.append(el('p',{className:'form-error',role:'alert',text:state.relayError}));
  return section;
}


function renderHome(state) {
  const main = el('main', { className: 'screen home-screen', id: 'main-content' });
  const seasonFlowers = topSeasonFlowers(state);
  const blooming = seasonFlowers.filter((flower) => ['in-season', 'ending'].includes(getBloomStatus(flower.bloom, state.currentDate).code));
  const devDate = APP_CONFIG.DEV_MODE && state.devTodayFlowerDate ? parseApiDate(state.devTodayFlowerDate) : null;
  const featureDate = devDate || state.currentDate;
  const todaySelection = selectTodayFlower({
    flowers: FLOWERS,
    date: featureDate,
    storage: APP_CONFIG.DEV_MODE ? getDevTodayFlowerStorage() : localStorage
  });
  const representative = todaySelection.flower;
  const regions = getHomeRegions(state.events);
  const recommendedEvents = getOngoingEvents(state.events, { region: state.userRegion || '' });

  main.append(el('section', { className: 'home-find-panel', 'aria-label': '꽃 찾기' }, [
    el('div', {
      className: `home-find-search ${state.searchQuery ? 'has-clear' : ''}`
    }, [
      el('span', { className: 'search-glyph', 'aria-hidden': 'true' }),
      el('label', { className: 'visually-hidden', for: 'home-flower-search', text: '꽃 빠른 검색' }),
      el('input', { id:'home-flower-search',type:'search',value:state.searchQuery,placeholder:'꽃 이름·초성·학명 검색',autocomplete:'off' }),
      state.searchQuery ? el('button',{type:'button',className:'search-clear',text:'×',dataset:{action:'clear-flower-search'},ariaLabel:'검색어 지우기'}) : null
    ]),
    el('button', {
      type: 'button',
      className: 'home-photo-button',
      dataset: { action: 'open-photo-picker' },
      ariaLabel: '사진으로 꽃 찾기'
    }, [
      el('span', { className: 'nav-icon nav-camera photo-search-icon', 'aria-hidden': 'true' })
    ])
  ]));

  if(normalizeSearch(state.searchQuery)) {
    const matches=FLOWERS.filter(flower=>matchesFlowerSearch(flower,state.searchQuery));
    const searchSection=el('section',{id:'home-search-results',className:'content-section home-search-results'},[
      sectionHeader('빠른 검색 결과','도감에서 보기','go-encyclopedia',`${matches.length}종`)
    ]);
    if(matches.length) {
      const grid=el('div',{className:'flower-grid'});
      matches.forEach(flower=>grid.append(flowerPoster(flower,state)));
      searchSection.append(grid);
    } else searchSection.append(emptyState('검색 결과가 없어요.','검색어 지우기','clear-flower-search'));
    main.append(searchSection);
  }

  if (representative) main.append(homeFeature(representative, state, featureDate));
  else main.append(el('section',{className:'content-section today-flower-empty'},[
    el('div',{className:'section-label',text:'오늘 눈여겨볼 꽃'}),
    emptyState('오늘 개화 중인 꽃 후보가 없어요.','도감에서 보기','go-current-season')
  ]));

  main.append(renderFlowerRelay(state));

  const bloomSection = el('section', { className: 'content-section' }, [
    sectionHeader('이번 주 볼 꽃', '전체 보기', 'go-current-season', blooming.length ? `${blooming.length}종` : '')
  ]);
  if (blooming.length) {
    const rail = el('div', { className: 'flower-rail' });
    blooming.slice(0, 6).forEach((flower) => rail.append(flowerPoster(flower, state, { rail: true, showImage: false })));
    bloomSection.append(rail);
  } else {
    bloomSection.append(emptyState('지금 시기에 맞는 꽃이 아직 없어요.', '도감에서 보기', 'go-current-season'));
  }
  main.append(bloomSection);

  const eventSection = el('section', { className: 'content-section' }, [
    el('div', { className: 'home-place-heading' }, [
      (() => {
        const heading = sectionHeader('꽃 보러 가기', '전체보기', 'go-all-events');
        heading.querySelector('[data-action="go-all-events"]')?.classList.add('event-view-all-link');
        return heading;
      })(),
      regions.length ? renderRegionPicker(state, regions) : null
    ])
  ]);
  if (state.eventsLoading && state.eventsLoadingVisible) eventSection.append(renderSkeletonRows(2));
  else if (state.eventsError) {
    eventSection.append(eventErrorState(state.eventsError));
  } else if (recommendedEvents.length) {
    const eventList = el('div', { className: 'event-list' });
    recommendedEvents.slice(0, 3).forEach((event) => eventList.append(eventListRow(event, { compact: true, showVerification: false })));
    eventSection.append(eventList);
  } else {
    eventSection.append(emptyState(
      state.userRegion ? `${state.userRegion}에서 확인된 행사가 아직 없어요.` : '지금 확인된 꽃 행사가 아직 없어요.',
      '행사 전체 보기',
      'go-events'
    ));
  }
  main.append(eventSection);

  main.append(el('p', { className: 'weather-note', text: '개화 상태는 도감 시기 기준 예상이에요. 지역과 날씨에 따라 달라져요.' }));
  return main;
}
return { "renderHome": renderHome };
})();

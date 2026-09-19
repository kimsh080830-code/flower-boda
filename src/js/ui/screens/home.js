__mods["js/ui/screens/home.js"] = (() => {
const { FLOWERS } = __mods["js/data.js"];
const { getBloomStatus } = __mods["js/dateUtils.js"];
const { selectTodayFlower } = __mods["js/todayFlower.js"];
const { hooks:runtimeHooks } = __mods["js/runtimeHooks.js"];
const { getFlowerRelaySnapshot } = __mods["js/flowerRelay.js"];
const { getOngoingEvents } = __mods["js/eventService.js"];
const { el, button, image, imageCreditBadge } = __mods["js/ui/dom.js"];
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
 const heroImage=image(flower.image,`${primaryFlowerName(flower)} 참고 이미지`,'editorial-feature-image',flower.localImage);
 save.setAttribute('aria-pressed',String(saved)); save.setAttribute('aria-label',`${primaryFlowerName(flower)} ${saved?'저장 해제':'저장'}`);
 return el('section',{className:'editorial-feature','aria-labelledby':'home-feature-title'},[
  el('button',{type:'button',className:'editorial-feature-media',dataset:{action:'open-flower',flowerId:flower.id},ariaLabel:`${primaryFlowerName(flower)} 꽃 정보 보기`},[heroImage,imageCreditBadge(flower.imageCredit,heroImage,flower.localImage)]),
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

function renderFlowerWalk(state) {
  const walk = runtimeHooks.relaySnapshot(getFlowerRelaySnapshot({
    flowers:FLOWERS,date:state.currentDate,records:state.discoveredFlowers,storage:localStorage
  }),state);
  const action = walk.status==='before'
    ? runtimeHooks.resolveSyntheticAction(walk,'relay-start')
    : walk.status==='active'
      ? runtimeHooks.resolveSyntheticAction(walk,'relay-continue')
      : '';
  const actionText = walk.status==='active' ? '이어 걷기' : '꽃길 시작';
  const section = el('section',{className:'content-section flower-walk','aria-labelledby':'flower-walk-title'},[
    el('div',{className:'flower-walk-heading'},[
      el('div',{className:'flower-walk-heading-copy'},[
        el('span',{className:'section-label',text:'꽃 산책'}),
        el('h2',{id:'flower-walk-title',text:'오늘의 꽃길'})
      ]),
      walk.total ? el('span',{className:'flower-walk-count',text:`꽃 ${walk.total}종`}) : null
    ]),
    el('p',{className:'flower-walk-description',text:walk.total
      ? `오늘 피는 꽃 ${walk.total}종을 이어서 찾아보는 산책이에요.`
      : '오늘 피는 꽃을 따라 가볍게 걸어보세요.'})
  ]);
  if (!walk.total) {
    section.append(emptyState('오늘은 추천할 꽃길 후보가 없어요.','도감에서 보기','go-current-season'));
    return section;
  }
  section.append(el('div',{className:'flower-walk-targets','aria-label':'오늘의 꽃길 목표'},walk.targets.map((flower,index)=>[
    el('article',{className:`flower-walk-target ${walk.completedFlowerIds.includes(flower.id)?'is-complete':''}`.trim()},[
      el('span',{className:'flower-walk-thumb'},[
        image(flower.image,`${primaryFlowerName(flower)} 참고 이미지`,'flower-walk-image',flower.localImage)
      ]),
      el('span',{className:'flower-walk-step',text:`${index+1}`,'aria-hidden':'true'}),
      el('strong',{text:primaryFlowerName(flower)})
    ])
  ]).flat()));
  section.append(el('div',{className:'flower-walk-footer'},[
    el('p',{text:walk.status==='complete'
      ? '오늘의 꽃길을 모두 걸었어요.'
      : '사진으로 꽃을 확인하면 꽃 릴레이 진행도에도 함께 반영돼요.'}),
    action ? button(actionText,action,{kind:'primary',extraClass:'flower-walk-start'}) : null
  ]));
  return section;
}

function renderFlowerRelay(state) {
  const relay = runtimeHooks.relaySnapshot(getFlowerRelaySnapshot({
    flowers:FLOWERS,date:state.currentDate,records:state.discoveredFlowers,storage:localStorage
  }),state);
  const relayViewAction = relay.status==='before'
    ? runtimeHooks.resolveSyntheticAction(relay,'relay-start')
    : relay.status==='active'
      ? runtimeHooks.resolveSyntheticAction(relay,'relay-continue')
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
    relay.status==='before' ? button('릴레이 시작',runtimeHooks.resolveSyntheticAction(relay,'relay-start'),{kind:'primary'}) : null,
    relay.status==='active' ? button('이어보기',runtimeHooks.resolveSyntheticAction(relay,'relay-continue'),{kind:'primary'}) : null
  ]));
  section.append(el('div',{className:'flower-relay-progress','aria-hidden':'true'},[
    el('span',{style:`width:${relay.total ? Math.round(relay.completedCount/relay.total*100) : 0}%`})
  ]));
  if(relay.total<3) section.append(el('p',{className:'weather-note',text:`지금 개화 후보가 ${relay.total}종이라 가능한 꽃만 이어요.`}));
  if(state.relayError) section.append(el('p',{className:'form-error',role:'alert',text:state.relayError}));
  return section;
}

function updateHomeSearchResults(state, root = document) {
  const results = root.querySelector('#home-search-results');
  if (!results) return;
  const query = normalizeSearch(state.searchQuery);
  const searchBox = root.querySelector('.home-find-search');
  const clearButton = searchBox?.querySelector('.search-clear');
  searchBox?.classList.toggle('has-clear', Boolean(query));
  if (query && !clearButton) {
    searchBox.append(el('button', {
      type: 'button', className: 'search-clear', text: '×',
      dataset: { action: 'clear-flower-search' }, ariaLabel: '검색어 지우기'
    }));
  } else if (!query) {
    clearButton?.remove();
  }
  results.replaceChildren();
  results.hidden = !query;
  if (!query) return;

  const matches = FLOWERS.filter(flower => matchesFlowerSearch(flower, state.searchQuery));
  results.append(sectionHeader('빠른 검색 결과', '도감에서 보기', 'go-encyclopedia', `${matches.length}종`));
  if (matches.length) {
    const grid = el('div', { className: 'flower-grid' });
    matches.forEach(flower => grid.append(flowerPoster(flower, state, { showBloomFlow: false })));
    results.append(grid);
  } else {
    results.append(emptyState('검색 결과가 없어요.', '검색어 지우기', 'clear-flower-search'));
  }
}


function renderHome(state) {
  const main = el('main', { className: 'screen home-screen', id: 'main-content' });
  const seasonFlowers = topSeasonFlowers(state);
  const blooming = seasonFlowers.filter((flower) => ['in-season', 'ending'].includes(getBloomStatus(flower.bloom, state.currentDate).code));
  const todayContext=runtimeHooks.todayFlowerContext({state,date:state.currentDate,storage:localStorage});
  const featureDate = todayContext.date;
  const todaySelection = selectTodayFlower({
    flowers: FLOWERS,
    date: featureDate,
    storage: todayContext.storage
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
  main.append(el('section', { id: 'home-search-results', className: 'content-section home-search-results', hidden: true }));
  updateHomeSearchResults(state, main);

  if (representative) main.append(homeFeature(representative, state, featureDate));
  else main.append(el('section',{className:'content-section today-flower-empty'},[
    el('div',{className:'section-label',text:'오늘 눈여겨볼 꽃'}),
    emptyState('오늘 개화 중인 꽃 후보가 없어요.','도감에서 보기','go-current-season')
  ]));

  main.append(renderFlowerWalk(state));
  main.append(renderFlowerRelay(state));

  const bloomSection = el('section', { className: 'content-section' }, [
    sectionHeader('이번 주 볼 꽃', '전체 보기', 'go-current-season', blooming.length ? `${blooming.length}종` : '')
  ]);
  if (blooming.length) {
    const rail = el('div', { className: 'flower-rail' });
    blooming.slice(0, 6).forEach((flower) => rail.append(flowerPoster(flower, state, { rail: true, showBloomFlow: false })));
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
return { "renderHome": renderHome, "updateHomeSearchResults": updateHomeSearchResults };
})();

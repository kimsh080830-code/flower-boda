__mods["js/ui/screens/details.js"] = (() => {
const { formatBloomPeriod, getBloomStatus, parseApiDate } = __mods["js/dateUtils.js"];
const { getRelatedEvents, canUseEventSchedule } = __mods["js/eventService.js"];
const { getFlowerPlacesByFlowerId, getFlowerPlaceForEvent } = __mods["js/mapPlaces.js"];
const { getFlowerPlaceItems } = __mods["js/mapService.js"];
const { el, button, image, imageCreditBadge } = __mods["js/ui/dom.js"];
const { statusBadge, sectionHeader, emptyState, primaryFlowerName, otherNameLine, eventListRow, renderSkeletonRows, detailLine, infoDisclosure, formatEventRange, eventVerificationText } = __mods["js/ui/components.js"];
const { petalShapeValues } = __mods["js/flowerViewData.js"];
function renderLookalikeCard(item) {
  const children = [
    el('div', { className: 'lookalike-heading' }, [
      el('strong', { text: item.nameKo || '비슷한 식물' }),
      item.scientificName ? el('span', { className: 'lookalike-scientific', text: item.scientificName }) : null
    ].filter(Boolean)),
    item.reason ? el('p', { className: 'lookalike-reason', text: `왜 비슷해요? ${item.reason}` }) : null
  ].filter(Boolean);
  if (Array.isArray(item.differences) && item.differences.length) {
    children.push(el('ul', { className: 'lookalike-differences' }, item.differences.map((text) => el('li', { text }))));
  }
  if (item.tip) children.push(el('p', { className: 'lookalike-tip', text: `관찰 포인트 · ${item.tip}` }));
  if (item.note) children.push(el('p', { className: 'lookalike-note', text: item.note }));
  if (item.targetId) {
    children.push(button(`${item.nameKo} 자세히 보기`, 'open-flower', {
      kind: 'tertiary',
      extraClass: 'lookalike-link',
      data: { flowerId: item.targetId }
    }));
  }
  return el('article', { className: 'lookalike-card' }, children);
}
function renderFlowerDetail(state, flower) {
  const bloom = getBloomStatus(flower.bloom, state.currentDate);
  const heroImage = image(flower.image, `${primaryFlowerName(flower)} 참고 이미지`, 'detail-hero', flower.localImage);
  const layer = el('section', {
    className: 'detail-layer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'flower-detail-title'
  }, [
    el('div', { className: 'detail-topbar' }, [
      button('뒤로', 'close-detail', { kind: 'tertiary', extraClass: 'detail-back' }),
      el('span', { className: 'detail-top-title', text: '꽃 정보' }),
      el('span', { className: 'detail-top-spacer' })
    ]),
    el('div', { className: 'detail-hero-wrap' }, [
      el('span', { className: 'detail-hero-media' }, [
        heroImage,
        imageCreditBadge(flower.imageCredit, heroImage, flower.localImage)
      ])
    ]),
    el('header', { className: 'detail-intro' }, [
      el('div', { className: 'detail-status-row' }, [
        statusBadge(bloom)
      ]),
      el('div', { className: 'detail-title-row' }, [
        el('h2', { id: 'flower-detail-title', text: primaryFlowerName(flower) }),
        el('button', {
          type: 'button',
          className: `detail-favorite-button ${state.favoriteFlowerIds.includes(flower.id) ? 'is-active' : ''}`,
          dataset: { action: 'toggle-favorite', flowerId: flower.id },
          'aria-pressed': state.favoriteFlowerIds.includes(flower.id) ? 'true' : 'false',
          ariaLabel: state.favoriteFlowerIds.includes(flower.id) ? `${primaryFlowerName(flower)} 저장 해제` : `${primaryFlowerName(flower)} 저장`
        }, [
          el('span', { className: 'bookmark-icon', 'aria-hidden': 'true' }),
          el('span', { text: state.favoriteFlowerIds.includes(flower.id) ? '저장됨' : '저장' })
        ])
      ]),
      otherNameLine(flower, 'detail-standard-name'),
      flower.scientificName ? el('p', { className: 'detail-scientific', text: flower.scientificName }) : null,
      flower.description ? el('p', { className: 'detail-summary', text: flower.description }) : null,
    ])
  ]);

  const facts = el('dl', { className: 'detail-facts' });
  [
    detailLine('개화 기간', formatBloomPeriod(flower.bloom)),
    detailLine('꽃말', flower.flowerLanguage?.meaning || flower.flowerLanguage),
    detailLine('꽃색', flower.colors?.join(' · ')),
    detailLine('꽃잎 모양', petalShapeValues(flower).join(' · ')),
    detailLine('계절', flower.seasons?.join(' · '))
  ].filter(Boolean).forEach((line) => facts.append(line));
  if (facts.childElementCount) layer.append(facts);

  const identification = [
    flower.identificationFeatures ? el('p', { text: flower.identificationFeatures }) : null,
    flower.flowerFeatures ? el('p', { className: 'detail-subcopy', text: `꽃: ${flower.flowerFeatures}` }) : null,
    flower.leafFeatures ? el('p', { className: 'detail-subcopy', text: `잎: ${flower.leafFeatures}` }) : null
  ].filter(Boolean);
  const environment = [flower.habitat ? el('p', { text: flower.habitat }) : null].filter(Boolean);

  if (identification.length) { const section=infoDisclosure('구별 특징',identification,true);section.classList.add('detail-identification');layer.append(section); }
  const lookalikes = Array.isArray(flower.lookalikes) ? flower.lookalikes.filter((item) => item?.nameKo) : [];
  if (lookalikes.length) {
    layer.append(infoDisclosure('비슷한 식물과 구별법', [
      el('div', { className: 'lookalike-list' }, lookalikes.map(renderLookalikeCard))
    ], true));
  }
  if (environment.length) layer.append(infoDisclosure('서식 환경', environment, true));
  if (flower.flowerLanguage?.meaning) {
    const language = flower.flowerLanguage;
    const languageChildren = [
      el('p', { className: 'flower-language-meaning', text: language.meaning }),
      language.note ? el('p', { className: 'detail-subcopy', text: language.note }) : null,
      el('p', { className: 'flower-language-caution', text: '꽃말은 과학적 사실이 아니며 시대·문화·꽃색·자료에 따라 달라질 수 있어요.' })
    ].filter(Boolean);
    (language.sources || []).forEach((source) => {
      if (source?.url) languageChildren.push(el('a', { className: 'detail-source-link', href: source.url, target: '_blank', rel: 'noopener noreferrer', text: source.label }));
    });
    layer.append(infoDisclosure('꽃말 자세히', languageChildren));
  }
  if (flower.precautions) layer.append(infoDisclosure('주의사항', [el('p', { text: flower.precautions })]));
  if (flower.imageCredit?.selfShot === true || flower.imageCredit?.license) {
    const selfShot = flower.imageCredit?.selfShot === true;
    const creditParts = selfShot
      ? ['촬영', flower.imageCredit.creator || '승현']
      : [flower.imageCredit.creator, flower.imageCredit.license, 'Wikimedia Commons'].filter(Boolean);
    const creditChildren = [el('p', { text: creditParts.join(' · ') })];
    if (!selfShot && /^https:\/\//i.test(flower.imageCredit.sourceUrl || '')) {
      creditChildren.push(el('a', {
        href: flower.imageCredit.sourceUrl, target: '_blank', rel: 'noopener noreferrer',
        className: 'detail-source-link', text: '원본과 라이선스 확인'
      }));
    }
    layer.append(infoDisclosure('사진 출처', creditChildren));
  }

  const related = getRelatedEvents(state.events, flower).slice(0, 3);
  const places = getFlowerPlaceItems(state.mapUserLocation, { flowerId: flower.id });
  layer.append(el('p', { className: 'weather-note detail-weather-note', text: '개화 상태는 도감 시기 기준 예상이에요. 지역과 날씨에 따라 달라져요.' }));
  if (places.length) {
    const nearestDistance = places.find((place) => place.distanceLabel)?.distanceLabel || '';
    const placeMeta = [`장소 ${places.length}곳`, nearestDistance ? `가까운 곳 ${nearestDistance}` : '', related.length ? `관련 행사 ${related.length}개` : ''].filter(Boolean).join(' · ');
    layer.append(el('section', { className: 'detail-place-link', ariaLabel: '이 꽃을 볼 수 있는 곳' }, [
      el('p', { text: placeMeta }),
      button(`볼 수 있는 곳 ${places.length}곳`, 'show-flower-on-map', {
        kind: 'secondary', extraClass: 'detail-map-link', data: { flowerId: flower.id }
      })
    ]));
  }

  const relatedHeader = sectionHeader('이 꽃 보러 가기', '행사 전체보기', 'flower-events-all');
  const relatedAction = relatedHeader.querySelector('[data-action="flower-events-all"]');
  if (relatedAction) relatedAction.dataset.flowerId = flower.id;
  const relatedSection = el('section', { className: 'detail-related' }, [relatedHeader]);
  if (state.eventsLoading && state.eventsLoadingVisible) relatedSection.append(renderSkeletonRows(2));
  else if (related.length) {
    const list = el('div', { className: 'event-list' });
    related.forEach((event) => list.append(eventListRow(event, { compact: true, showVerification: false })));
    relatedSection.append(list);
  } else {
    const noRelatedEvents = emptyState('아직 연결된 행사가 없어요.', '다른 행사 보기', 'go-events');
    noRelatedEvents.querySelector('.empty-icon')?.remove();
    noRelatedEvents.classList.add('empty-state-iconless');
    relatedSection.append(noRelatedEvents);
  }
  layer.append(relatedSection);
  return layer;
}

function renderEventDetail(state, event) {
  const layer = el('section', {
    className: 'detail-layer', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'event-detail-title', 'aria-busy': String(Boolean(state.eventDetailLoading))
  }, [
    el('div', { className: 'detail-topbar' }, [
      button('뒤로', 'close-detail', { kind: 'tertiary', extraClass: 'detail-back' }),
      el('span', { className: 'detail-top-title', text: '행사 정보' }),
      el('span', { className: 'detail-top-spacer' })
    ]),
    image(event.image, `${event.title} 대표 이미지`, 'detail-hero event-detail-hero', event.localImage),
    el('header', { className: 'detail-intro event-detail-intro' }, [
      el('div', { className: 'detail-status-row' }, [statusBadge(event.status)]),
      el('h2', { id: 'event-detail-title', text: event.title }),
      el('div', { className: 'event-detail-meta' }, [
        formatEventRange(event) ? el('span', { className: 'event-detail-period', text: formatEventRange(event) }) : null,
        event.region ? el('span', { className: 'event-detail-region', text: event.region }) : null
      ])
    ])
  ]);
  const facts = el('dl', { className: 'detail-facts' });
  [
    detailLine('장소명', event.place),
    detailLine('주소', event.address),
    detailLine('운영시간', event.operatingHours),
    detailLine('입장료', event.admissionFee),
    detailLine('지역', [event.region, event.subRegion].filter(Boolean).join(' ')),
    detailLine('주최/주관', event.organizer),
    detailLine('문의', event.phone)
  ].filter(Boolean).forEach((line) => facts.append(line));
  if (facts.childElementCount) layer.append(facts);
  if(event.latitude != null && event.longitude != null) layer.append(el('p',{
    className:'detail-location-meta',
    text:`위도 ${event.latitude.toFixed(6)} · 경도 ${event.longitude.toFixed(6)}`
  }));
  if (state.eventDetailLoading) layer.append(el('p', { className:'weather-note event-detail-note', role:'status', text:'목록 정보를 먼저 보여드리고 있어요. 최신 상세 정보를 확인 중이에요.' }));
  if (event.detailError) layer.append(el('section', { className:'event-detail-error', 'aria-label':'상세 정보 오류' }, [
    el('p', { className:'weather-note event-detail-note',role:'status',text:event.detailError }),
    button(state.eventDetailLoading ? '다시 확인 중…' : '상세 정보 다시 시도', 'retry-event-detail', { kind:'secondary', disabled:Boolean(state.eventDetailLoading), data:{ eventId:event.id } })
  ]));
  layer.append(el('p', { className:'weather-note event-detail-note',text: event.verification?.status === 'stale'
    ? '이 자료는 확인 후 7일이 지났어요. 최신 일정과 장소를 출처에서 다시 확인해 주세요.'
    : event.verification?.status === 'list-only' ? '행사 목록에서 받은 정보예요. 상세 정보와 주최 측 공지를 확인해 주세요.'
    : '게시된 행사 정보를 확인한 자료예요. 일정 변경·취소 가능성이 있으니 방문 전 주최 측 공지를 확인해 주세요.' }));
  const checkedAt=Number.isFinite(Date.parse(event.verification?.checkedAt)) ? new Intl.DateTimeFormat('ko-KR',{ timeZone:'Asia/Seoul',year:'numeric',month:'long',day:'numeric' }).format(new Date(event.verification.checkedAt)) : '';
  const verificationFacts=[detailLine('확인 수준',eventVerificationText(event)),detailLine('확인일',checkedAt)].filter(Boolean);
  if(verificationFacts.length) layer.append(infoDisclosure('정보 확인',[el('dl',{className:'detail-mini-facts'},verificationFacts)]));
  if (event.sourceUrl) layer.append(el('a', { className:'btn btn-secondary external-link',href:event.sourceUrl,target:'_blank',rel:'noopener noreferrer',text:'한국관광공사 행사 정보 보기' }));
  if (event.description) layer.append(infoDisclosure('행사 소개', [el('p', { text: event.description })], true));
  if (event.url && /^https?:\/\//i.test(event.url)) {
    layer.append(el('a', {
      className: 'btn btn-primary external-link', href: event.url,
      target: '_blank', rel: 'noopener noreferrer', text: '등록된 주최 홈페이지 보기'
    }));
  }
  const linkedMapPlace = getFlowerPlaceForEvent(event);
  if (linkedMapPlace) {
    layer.append(button('지도에서 보기', 'show-event-on-map', {
      kind: 'secondary', extraClass: 'detail-map-link', data: { placeId: linkedMapPlace.id }
    }));
  }
  const mapQuery = event.latitude != null && event.longitude != null
    ? `${event.latitude},${event.longitude}`
    : [event.address, event.place, event.region, event.title].filter(Boolean).join(' ');
  if (mapQuery) {
    layer.append(el('a', {
      className: 'btn btn-secondary external-link',
      href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`,
      target: '_blank', rel: 'noopener noreferrer', text: event.latitude != null && event.longitude != null ? '행사 위치 지도에서 보기' : '주소·장소로 지도 검색'
    }));
  }
  const start = parseApiDate(event.startDate);
  const end = parseApiDate(event.endDate);
  if (canUseEventSchedule(event) && start && end && start <= end) {
    layer.append(__mods['js/calendar.js'].renderCalendar(state,event));
  } else if (event.status?.code === 'ended') {
    layer.append(el('p', { className: 'weather-note detail-weather-note', text: '종료된 행사예요.' }));
  } else {
    layer.append(el('p', { className:'weather-note event-detail-note',text:'일정과 최신 정보를 확인한 뒤 캘린더에 추가할 수 있어요.' }));
  }
  return layer;
}
return { "renderFlowerDetail": renderFlowerDetail, "renderEventDetail": renderEventDetail };
})();

__mods["js/ui/screens/map.js"] = (() => {
const { el } = __mods["js/ui/dom.js"];
const { getFlowerById } = __mods["js/data.js"];
const { FLOWER_COURSES, getFlowerCourseById } = __mods["js/mapCourses.js"];
const { getFlowerPlaceItems, formatBloomMonths } = __mods["js/mapService.js"];

function renderMapViewTabs(mode) {
  const menu = el('div', { className: 'map-view-tabs', role: 'tablist', ariaLabel: '지도 메뉴' });
  for (const [value, label] of [['nearby', '주변 꽃'], ['course', '꽃 코스']]) {
    const selected = mode === value;
    menu.append(el('button', {
      type: 'button',
      className: `map-view-tab ${selected ? 'is-active' : ''}`,
      role: 'tab',
      'aria-selected': selected ? 'true' : 'false',
      'aria-controls': 'map-view-panel',
      dataset: { action: 'select-map-view', mode: value },
      text: label
    }));
  }
  return menu;
}

function renderLocationStatus(state) {
  const messages = {
    checking: '현재 위치를 확인하고 있어요.',
    denied: '위치 권한이 필요해요.',
    error: '현재 위치를 확인하지 못했어요.'
  };
  const message = messages[state.mapLocationStatus];
  return message ? el('p', { className: `map-location-status is-${state.mapLocationStatus}`, role: 'status', text: message }) : null;
}

function renderPlaceCard(place, state, order = 0) {
  const selected = state.mapSelectedPlaceId === place.id;
  const details = [place.distanceLabel, place.relatedFlowerNames.join(' · '), place.bloomLabel].filter(Boolean).join(' · ');
  return el('button', {
    type: 'button',
    className: `map-place-card ${selected ? 'is-selected' : ''}`,
    dataset: { action: 'select-map-place', placeId: place.id },
    'aria-pressed': selected ? 'true' : 'false'
  }, [
    el('strong', { text: order ? `${order}. ${place.name}` : place.name }),
    el('span', { text: details }),
    el('small', { text: place.address })
  ]);
}

function renderNearbyPlaces(state) {
  const places = getFlowerPlaceItems(state.mapUserLocation, { flowerId: state.mapFlowerFilterId });
  if (!places.length) return el('p', { className: 'map-empty-state', text: '등록된 꽃 장소가 없어요.' });
  const flower = state.mapFlowerFilterId ? getFlowerById(state.mapFlowerFilterId) : null;
  return el('div', {}, [
    flower ? el('div', { className: 'map-filter-context' }, [
      el('span', { text: `${flower.nameKo} 관련 장소` }),
      el('button', { type: 'button', dataset: { action: 'clear-map-flower-filter' }, text: '전체 장소 보기' })
    ]) : null,
    el('div', { className: 'map-place-list', ariaLabel: '꽃 장소 목록' }, places.map((place) => renderPlaceCard(place, state)))
  ]);
}

function courseFlowerNames(course) {
  return course.relatedFlowerIds.map((id) => getFlowerById(id)?.nameKo).filter(Boolean);
}

function renderCourseCard(course, state) {
  const selected = state.mapSelectedCourseId === course.id;
  return el('button', {
    type: 'button',
    className: `map-course-card ${selected ? 'is-selected' : ''}`,
    dataset: { action: 'select-map-course', courseId: course.id },
    'aria-pressed': selected ? 'true' : 'false'
  }, [
    el('strong', { text: course.name }),
    el('span', { text: `${course.region} · 장소 ${course.placeIds.length}곳 · ${course.estimatedDuration}` }),
    el('span', { text: courseFlowerNames(course).join(' · ') || '관련 꽃 정보 없음' }),
    el('small', { text: formatBloomMonths(course.recommendedMonths) })
  ]);
}

function renderCoursePlaces(course, state) {
  const places = getFlowerPlaceItems(null, { placeIds: course.placeIds });
  return el('section', { className: 'map-course-detail', ariaLabel: '선택한 꽃 코스' }, [
    el('h2', { text: course.name }),
    el('p', { className: 'map-course-summary', text: `${course.estimatedDuration} · ${formatBloomMonths(course.recommendedMonths)}` }),
    el('p', { className: 'map-course-description', text: course.description }),
    el('p', { className: 'map-course-guide-note', text: '지도 선은 장소 순서를 보여주는 안내선이에요.' }),
    el('div', { className: 'map-course-place-list' }, places.map((place, index) => renderPlaceCard(place, state, index + 1)))
  ]);
}

function renderCourses(state) {
  const selected = getFlowerCourseById(state.mapSelectedCourseId);
  return el('div', { className: 'map-course-content' }, [
    el('div', { className: 'map-course-list', ariaLabel: '꽃 코스 목록' }, FLOWER_COURSES.map((course) => renderCourseCard(course, state))),
    selected ? renderCoursePlaces(selected, state) : null
  ]);
}

function renderMap(state) {
  const mode = state.mapViewMode === 'course' ? 'course' : 'nearby';
  const locationBusy = state.mapLocationStatus === 'checking';
  return el('main', { className: 'screen map-screen', id: 'main-content' }, [
    el('div', { className: 'map-heading' }, [
      el('h1', { className: 'map-title', text: '지도' }),
      el('button', {
        type: 'button',
        className: 'btn btn-secondary map-location-button',
        dataset: { action: 'request-map-location' },
        disabled: locationBusy,
        text: '내 위치'
      })
    ]),
    el('section', { className: 'map-region', ariaLabel: '꽃 장소 지도' }, [
      el('div', { className: 'map-canvas', id: 'flower-map', dataset: { horizontalScroll: 'true' } }, [
        el('p', { className: 'map-loading-message', text: '지도를 불러오고 있어요.' })
      ])
    ]),
    renderLocationStatus(state),
    el('section', { className: 'map-panel', ariaLabel: '지도 기능' }, [
      renderMapViewTabs(mode),
      el('div', { className: 'map-view-content', id: 'map-view-panel', role: 'tabpanel' }, [
        mode === 'course'
          ? renderCourses(state)
          : renderNearbyPlaces(state)
      ])
    ])
  ]);
}

return { "renderMap": renderMap };
})();

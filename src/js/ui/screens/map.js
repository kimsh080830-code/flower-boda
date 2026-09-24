__mods["js/ui/screens/map.js"] = (() => {
const { el } = __mods["js/ui/dom.js"];
const { getFlowerPlaceItems } = __mods["js/mapService.js"];

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

function renderPlaceCard(place, state) {
  const selected = state.mapSelectedPlaceId === place.id;
  const details = [place.distanceLabel, place.relatedFlowerNames.join(' · '), place.bloomLabel].filter(Boolean).join(' · ');
  return el('button', {
    type: 'button',
    className: `map-place-card ${selected ? 'is-selected' : ''}`,
    dataset: { action: 'select-map-place', placeId: place.id },
    'aria-pressed': selected ? 'true' : 'false'
  }, [
    el('strong', { text: place.name }),
    el('span', { text: details }),
    el('small', { text: place.address })
  ]);
}

function renderNearbyPlaces(state) {
  const places = getFlowerPlaceItems(state.mapUserLocation);
  if (!places.length) return el('p', { className: 'map-empty-state', text: '등록된 꽃 장소가 없어요.' });
  return el('div', { className: 'map-place-list', ariaLabel: '꽃 장소 목록' }, places.map((place) => renderPlaceCard(place, state)));
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
          ? el('p', { className: 'map-course-message', text: '꽃 코스를 준비하고 있어요.' })
          : renderNearbyPlaces(state)
      ])
    ])
  ]);
}

return { "renderMap": renderMap };
})();

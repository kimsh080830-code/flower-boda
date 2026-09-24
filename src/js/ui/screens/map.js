__mods["js/ui/screens/map.js"] = (() => {
const { el } = __mods["js/ui/dom.js"];

function renderMap(state) {
  const mode = state.mapViewMode === 'course' ? 'course' : 'nearby';
  const tabs = [
    ['nearby', '주변 꽃'],
    ['course', '꽃 코스']
  ];
  const menu = el('div', { className: 'map-view-tabs', role: 'tablist', ariaLabel: '지도 메뉴' });
  tabs.forEach(([value, label]) => {
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
  });
  const message = mode === 'course'
    ? '꽃 코스를 준비하고 있어요.'
    : '주변 꽃 장소를 준비하고 있어요.';
  return el('main', { className: 'screen map-screen', id: 'main-content' }, [
    el('h1', { className: 'map-title', text: '지도' }),
    el('section', { className: 'map-placeholder', ariaLabel: '지도 준비 중' }, [
      el('p', { text: '지도 준비 중' })
    ]),
    el('section', { className: 'map-panel', ariaLabel: '지도 기능' }, [
      menu,
      el('div', {
        className: 'map-view-content',
        id: 'map-view-panel',
        role: 'tabpanel',
        text: message
      })
    ])
  ]);
}

return { "renderMap": renderMap };
})();

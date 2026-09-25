__mods["js/ui/screens/my.js"] = (() => {
const { getFlowerById } = __mods['js/data.js'];
const { el, button } = __mods['js/ui/dom.js'];
const { flowerListRow, sectionHeader } = __mods['js/ui/components.js'];
const { renderFavoriteGarden } = __mods['js/ui/observations.js'];

function renderRecentFlowers(state) {
  const flowers = state.recentFlowerIds.map(getFlowerById).filter(Boolean);
  const section = el('section', { className: 'content-section my-recent-flowers' }, [
    sectionHeader('최근 본 꽃', '', '', `${flowers.length}종`),
    el('label', { className: 'my-recent-toggle' }, [
      el('span', { text: '최근 본 꽃 기록' }),
      el('input', { type: 'checkbox', role: 'switch', className: 'setting-toggle', checked: state.settings.recentEnabled, ariaLabel: '최근 본 꽃 기록 사용', dataset: { action: 'setting-toggle', key: 'recentEnabled' } })
    ])
  ]);
  if (!flowers.length) {
    section.append(el('p', { className: 'weather-note', text: '최근 본 꽃이 없어요.' }));
    return section;
  }
  section.append(el('div', { className: 'my-flower-list' }, flowers.map((flower) => flowerListRow(flower, state, { compact: true }))));
  if (state.recentClearPending) {
    section.append(el('div', { className: 'recent-clear-confirm', role: 'group', ariaLabel: '최근 본 꽃 삭제 확인' }, [
      el('p', { text: '최근 본 꽃을 모두 지울까요?' }),
      el('div', { className: 'recent-clear-confirm-actions' }, [
        button('취소', 'cancel-clear-recent', { kind: 'tertiary', extraClass: 'recent-clear-button' }),
        button('모두 지우기', 'confirm-clear-recent', { kind: 'tertiary', extraClass: 'recent-clear-button recent-clear-danger' })
      ])
    ]));
  } else {
    section.append(button('최근 기록 지우기', 'clear-recent', { kind: 'tertiary', extraClass: 'recent-clear-button' }));
  }
  return section;
}

function renderMy(state) {
  return el('main', { className: 'screen my-screen', id: 'main-content' }, [
    el('div', { className: 'my-heading' }, [
      el('h1', { text: 'MY' }),
      el('p', { text: '저장하고 살펴본 꽃을 모아봐요.' })
    ]),
    renderFavoriteGarden(state, { title: '즐겨찾기한 꽃' }),
    renderRecentFlowers(state)
  ]);
}

return { renderMy };
})();

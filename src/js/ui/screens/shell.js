__mods["js/ui/screens/shell.js"] = (() => {
const { el } = __mods["js/ui/dom.js"];
function renderAppHeader(state) {
  const date=__mods['js/dateUtils.js'].getDatePresentation(state.currentDate);
  return el('header', { className: 'app-header' }, [
    el('div', { className: 'app-header-inner' }, [
      el('button', {
        type: 'button',
        className: 'brand-block',
        dataset: { action: 'go-home' },
        ariaLabel: '홈으로 이동'
      }, [
        el('strong', { className: 'app-brand', text: '꽃을 보다' })
      ]),
      el('button',{type:'button',className:'app-date-context',dataset:{action:'open-bloom-calendar'},ariaLabel:`개화 달력 열기, ${date.label}, ${date.solarTerm}`},[
        el('time',{dateTime:date.day,text:date.label}),
        el('small',{className:'app-season-context',text:date.solarTerm})
      ]),
      el('button',{type:'button',className:'settings-button',dataset:{action:'go-settings'},ariaLabel:'설정'},[el('span',{className:'settings-slider-icon','aria-hidden':'true'})])
    ])
  ]);
}

function renderBottomNav(state) {
  const navItems = [
    ['events', 'nav-calendar', '행사'],
    ['home', 'nav-home', '홈'],
    ['encyclopedia', 'nav-book', '도감']
  ];
  const nav = el('nav', { className: 'bottom-nav', 'aria-label': '주요 메뉴' });
  navItems.forEach(([tab, iconClass, label]) => {
    const active = state.currentTab === tab;
    nav.append(el('button', {
      type: 'button',
      className: `nav-item ${active ? 'is-active' : ''}`,
      dataset: { action: 'switch-tab', tab },
      'aria-current': active ? 'page' : null,
      ariaLabel: label
    }, [
      el('span', { className: `nav-icon ${iconClass}`, 'aria-hidden': 'true' }),
      el('span', { className: 'nav-label', text: label })
    ]));
  });
  return nav;
}
return { "renderAppHeader": renderAppHeader, "renderBottomNav": renderBottomNav };
})();

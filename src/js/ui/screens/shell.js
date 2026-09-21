__mods["js/ui/screens/shell.js"] = (() => {
const { el } = __mods["js/ui/dom.js"];
function renderAppHeader(state) {
  const {getDatePresentation,getSeason}=__mods['js/dateUtils.js'];
  const date=getDatePresentation(state.currentDate);
  const season=getSeason(state.currentDate);
  const weather=state.currentWeather;
  const weatherStatus=state.currentWeatherStatus || (weather ? 'ready' : 'loading');
  const weatherText=weather?.condition && Number.isFinite(weather.temperature) ? `${weather.condition} · ${weather.temperature}°` : '';
  const contextText=weatherStatus==='ready' && weatherText
    ? `${season} · ${weatherText}`
    : weatherStatus==='error'
      ? `${season} · 날씨 정보 없음`
      : `${season} · 날씨 불러오는 중…`;
  return el('header', { className: 'app-header' }, [
    el('div', { className: 'app-header-inner' }, [
      el('div',{className:'app-date-context'},[
        el('time',{dateTime:date.day,text:date.label}),
        el('small',{className:'app-season-context',text:contextText})
      ]),
      el('div',{className:'header-actions'},[
        el('button',{type:'button',className:'bloom-calendar-button',dataset:{action:'open-bloom-calendar'},ariaLabel:'만개달력'},[el('span',{className:'bloom-calendar-icon','aria-hidden':'true'})]),
        el('button',{type:'button',className:'settings-button',dataset:{action:'go-settings'},ariaLabel:'설정'},[el('span',{className:'settings-slider-icon','aria-hidden':'true'})])
      ])
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

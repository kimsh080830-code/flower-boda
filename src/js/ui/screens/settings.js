__mods["js/ui/screens/settings.js"] = (() => {
const {el}=__mods['js/ui/dom.js'];
const {selectControl}=__mods['js/ui/screens/shared.js'];
const {hooks:runtimeHooks}=__mods['js/runtimeHooks.js'];
function renderSettings(state) {
 const p=state.settings, main=el('main',{className:'screen settings-screen',id:'main-content'},[
  el('div',{className:'settings-heading'},[el('h1',{text:'설정'})])
 ]);
 const selectRow=(label,key,options)=>{const row=selectControl(label,`setting-${key}`,options,p[key],'setting-select',{key});row.classList.add('setting-row');return row;};
 main.append(selectRow('화면 모드','theme',[['system','기기 설정'],['light','밝게'],['dark','어둡게']]));
 main.append(selectRow('본문 글자 크기','bodyTextSize',[['small','작게'],['medium','기본'],['large','크게']]));
 main.append(el('label',{className:'setting-row'},[
  el('span',{},[el('strong',{text:'행사 알림'}),el('small',{className:'setting-description',text:'시작 예정인 꽃 행사를 앱 안에서 알려줘요.'})]),
  el('input',{type:'checkbox',role:'switch',className:'setting-toggle',checked:p.eventNotificationsEnabled,ariaLabel:'행사 알림 사용',dataset:{action:'setting-toggle',key:'eventNotificationsEnabled'}})
 ]));
 main.append(el('label',{className:'setting-row'},[
  el('span',{},[el('strong',{text:'위치 사용'}),el('small',{className:'setting-description',text:'내 위치를 누를 때만 주변 꽃 장소 거리를 확인해요.'})]),
  el('input',{type:'checkbox',role:'switch',className:'setting-toggle',checked:p.locationEnabled,ariaLabel:'지도 위치 사용',dataset:{action:'setting-toggle',key:'locationEnabled'}})
 ]));
 const sources=el('details',{className:'settings-disclosure'},[el('summary',{text:'데이터 출처'}),el('p',{text:'식물 · 국가표준식물목록, Kew POWO/WCVP, World Flora Online'}),el('p',{text:'행사 · 한국관광공사 TourAPI'}),el('p',{text:'사진 · Wikimedia Commons (꽃 상세에 개별 출처 표시)'}),el('p',{text:'개화 상태 · 도감 개화 기간을 바탕으로 한 예상'})]);
 main.append(sources,el('details',{className:'settings-disclosure'},[el('summary',{text:'서비스 정보'}),el('p',{text:'꽃을 보다 · V47'}),el('p',{text:'캘린더 추가는 ICS 파일을 내려받아요.'}),state.standalone?el('p',{text:'파일에서는 확인된 행사 자료를 보여줘요. 사진 검색은 서버에서 사용할 수 있어요.'}):null]));
 main.append(el('details',{className:'settings-disclosure'},[
  el('summary',{text:'고급 설정'}),
  el('p',{text:'개인 꽃 기록은 MY에서 관리해요. 앱 데이터 초기화 기능은 현재 제공하지 않아요.'})
 ]));
 const extra=runtimeHooks.renderSettingsExtra(state);
 if(extra) main.append(extra);
 return main;
}
return {renderSettings};
})();

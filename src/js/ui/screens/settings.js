__mods["js/ui/screens/settings.js"] = (() => {
const {el,button}=__mods['js/ui/dom.js'];
const {getFlowerById}=__mods['js/data.js'];
const {flowerListRow}=__mods['js/ui/components.js'];
const {renderFavoriteGarden}=__mods['js/ui/observations.js'];
const {selectControl}=__mods['js/ui/screens/shared.js'];
const {APP_CONFIG}=__mods['js/config.js'];
const {renderDevTools}=__mods['js/ui/screens/devTools.js'];
function renderSettings(state) {
 const p=state.settings, main=el('main',{className:'screen settings-screen',id:'main-content'},[
  el('div',{className:'settings-heading'},[el('h1',{text:'설정'})])
 ]);
 const selectRow=(label,key,options)=>{const row=selectControl(label,`setting-${key}`,options,p[key],'setting-select',{key});row.classList.add('setting-row');return row;};
 main.append(selectRow('화면 모드','theme',[['system','기기 설정'],['light','밝게'],['dark','어둡게']]));
 main.append(selectRow('본문 글자 크기','bodyTextSize',[['small','작게'],['medium','기본'],['large','크게']]));
 main.append(el('label',{className:'setting-row'},[el('span',{text:'최근 본 꽃'}),el('span',{className:'setting-value',text:`${state.recentFlowerIds.length} / 6`}),el('input',{type:'checkbox',role:'switch',className:'setting-toggle',checked:p.recentEnabled,ariaLabel:'최근 본 꽃 기록 사용',dataset:{action:'setting-toggle',key:'recentEnabled'}})]));
 const recent=el('details',{id:'recent-flower-panel',className:'settings-disclosure recent-flower-panel',open:state.recentDetailsOpen?'':null},[el('summary',{text:'최근 본 꽃 보기'})]);
 const rows=state.recentFlowerIds.map(getFlowerById).filter(Boolean);
 recent.append(...(rows.length?rows.map(f=>flowerListRow(f,state,{compact:true})):[el('p',{className:'weather-note',text:'최근 본 꽃이 없어요.'})]));
 if(state.recentClearPending) recent.append(el('div',{className:'recent-clear-confirm',role:'group',ariaLabel:'최근 기록 삭제 확인'},[
  el('p',{text:'최근 본 꽃 기록만 지울까요?'}),
  el('div',{className:'recent-clear-confirm-actions'},[
   button('취소','cancel-clear-recent',{kind:'tertiary',extraClass:'recent-clear-button'}),
   button('기록 지우기','confirm-clear-recent',{kind:'tertiary',extraClass:'recent-clear-button recent-clear-danger'})
  ])
 ]));
 else recent.append(button('최근 기록 지우기','clear-recent',{kind:'tertiary',extraClass:'recent-clear-button',disabled:!rows.length}));
 main.append(recent);
 const sources=el('details',{className:'settings-disclosure'},[el('summary',{text:'데이터 출처'}),el('p',{text:'식물 · 국가표준식물목록, Kew POWO/WCVP, World Flora Online'}),el('p',{text:'행사 · 한국관광공사 TourAPI'}),el('p',{text:'사진 · Wikimedia Commons (꽃 상세에 개별 출처 표시)'}),el('p',{text:'개화 상태 · 도감 개화 기간을 바탕으로 한 예상'})]);
 main.append(sources,el('details',{className:'settings-disclosure'},[el('summary',{text:'서비스 정보'}),el('p',{text:'꽃을 보다 · V47'}),el('p',{text:'캘린더 추가는 ICS 파일을 내려받아요.'}),state.standalone?el('p',{text:'파일에서는 확인된 행사 자료를 보여줘요. 사진 검색은 서버에서 사용할 수 있어요.'}):null]));
 const saved=el('details',{className:'settings-disclosure'},[el('summary',{text:'저장한 꽃 소식'}),renderFavoriteGarden(state)]);
 main.append(saved);
 if(APP_CONFIG.DEV_MODE) main.append(renderDevTools(state));
 return main;
}
return {renderSettings};
})();

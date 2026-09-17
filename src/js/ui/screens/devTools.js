__mods["js/ui/screens/devTools.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { FLOWERS } = __mods["js/data.js"];
const { parseApiDate } = __mods["js/dateUtils.js"];
const { selectTodayFlower } = __mods["js/todayFlower.js"];
const { getDevTodayFlowerStorage } = __mods["js/devTools.js"];
const { el, button } = __mods["js/ui/dom.js"];

function renderLongTextFixture() {
  return el('section',{className:'dev-long-text-fixture','aria-label':'긴 텍스트 레이아웃 테스트'},[
    el('h3',{text:'긴 꽃 이름과 행사명·장소·버튼이 좁은 화면에서도 겹치지 않는지 확인하는 테스트 영역'}),
    el('p',{text:'이 문장은 꽃 설명과 상세 본문처럼 길게 이어지는 안내 문구를 가정한 DEV 전용 샘플이에요. 줄바꿈과 컨테이너 폭, overflow 처리만 확인하며 실제 꽃 데이터나 사용자 저장값은 변경하지 않아요.'}),
    el('p',{className:'dev-long-scientific',text:'Verylongus scientificus subsp. extraordinarily-long-cultivar-name × hybridissima'}),
    el('p',{text:'행사 장소 테스트 · 대한민국 아주긴광역자치단체 아주긴시군구 아주긴도로명 123-456 복합문화생태식물관 야외정원 특별전시장'}),
    button('아주 긴 버튼 문구가 있어도 레이아웃이 밀리지 않는지 확인','dev-noop',{kind:'tertiary'})
  ]);
}

function renderDevTools(state) {
  if(!APP_CONFIG.DEV_MODE) return null;
  const featureDate=parseApiDate(state.devTodayFlowerDate) || state.currentDate;
  const selection=selectTodayFlower({flowers:FLOWERS,date:featureDate,storage:getDevTodayFlowerStorage()});
  const repeats=Array.from({length:5},()=>selectTodayFlower({flowers:FLOWERS,date:featureDate,storage:getDevTodayFlowerStorage()}).flowerId || '(없음)');
  const candidateText=selection.candidateIds.length ? selection.candidateIds.join(', ') : '(없음)';
  const orderText=selection.cycleOrder.length ? selection.cycleOrder.join(' → ') : '(없음)';
  const fontStatus=state.devTextSizeOverride ? `${state.devTextSizeOverride} (DEV 임시값)` : `${state.settings.bodyTextSize} (실제 설정값)`;

  return el('details',{className:'dev-tools-panel',open:'',dataset:{devOnly:'integrated-tools'}},[
    el('summary',{text:'DEV · 통합 테스트 도구'}),
    el('div',{className:'dev-tools-body'},[
      el('section',{className:'dev-tools-section'},[
        el('h2',{text:'오늘 눈여겨볼 꽃'}),
        el('label',{className:'dev-tools-date'},[
          el('span',{text:'가상 날짜'}),
          el('input',{type:'date',value:state.devTodayFlowerDate || selection.day,dataset:{action:'dev-today-date'},ariaLabel:'DEV 가상 날짜'})
        ]),
        el('div',{className:'dev-tools-actions'},[
          button('이전 날짜','dev-today-prev',{kind:'tertiary'}),
          button('다음 날짜','dev-today-next',{kind:'tertiary'}),
          button('실제 오늘','dev-today-reset',{kind:'tertiary'}),
          button('30일 시뮬레이션','dev-today-simulate',{kind:'tertiary'})
        ]),
        el('dl',{className:'dev-tools-state'},[
          el('div',{},[el('dt',{text:'현재 개화 후보'}),el('dd',{text:`${selection.candidateIds.length}종 · ${candidateText}`})]),
          el('div',{},[el('dt',{text:'선택 꽃 ID'}),el('dd',{text:selection.flowerId || '(없음)'})]),
          el('div',{},[el('dt',{text:'셔플 순서'}),el('dd',{text:orderText})]),
          el('div',{},[el('dt',{text:'같은 날짜 5회'}),el('dd',{text:repeats.join(' · ')})])
        ]),
        el('div',{className:'dev-tools-actions'},[
          button('후보 0개','dev-today-zero',{kind:'tertiary'}),
          button('후보 1개','dev-today-one',{kind:'tertiary'}),
          button('계절 경계','dev-today-boundary',{kind:'tertiary'}),
          button('데이터 추가/제거','dev-today-data-change',{kind:'tertiary'})
        ]),
        el('pre',{className:'dev-tools-report',text:state.devTodayFlowerReport || '오늘 꽃 테스트 결과가 여기에 표시돼요.'})
      ]),
      el('section',{className:'dev-tools-section'},[
        el('h2',{text:'오늘의 꽃 릴레이'}),
        el('dl',{className:'dev-tools-state'},[
          el('div',{},[el('dt',{text:'홈 표시 상태'}),el('dd',{text:state.devRelayScenario || '실제 저장 상태'})]),
          el('div',{},[el('dt',{text:'관찰 저장'}),el('dd',{text:state.devObservationSaveFailure ? '강제 실패 켜짐' : '정상'})])
        ]),
        el('div',{className:'dev-tools-actions'},[
          button('실제 상태','dev-relay-live',{kind:'tertiary'}),
          button('시작 전','dev-relay-scenario',{kind:'tertiary',data:{scenario:'before'}}),
          button('1개 완료','dev-relay-scenario',{kind:'tertiary',data:{scenario:'one'}}),
          button('일부 진행','dev-relay-scenario',{kind:'tertiary',data:{scenario:'partial'}}),
          button('전체 완료','dev-relay-scenario',{kind:'tertiary',data:{scenario:'complete'}}),
          button('후보 없음','dev-relay-scenario',{kind:'tertiary',data:{scenario:'empty'}}),
          button('후보 부족','dev-relay-scenario',{kind:'tertiary',data:{scenario:'shortage'}}),
          (()=>{const control=button(state.devObservationSaveFailure?'관찰 저장 실패 끄기':'관찰 저장 실패','dev-observation-save-failure',{kind:'tertiary'});control.setAttribute('aria-pressed',String(Boolean(state.devObservationSaveFailure)));return control;})()
        ]),
        el('p',{className:'dev-tools-note',text:'릴레이 표시 상태는 DEV 메모리에서만 바뀌며 실제 관찰 기록과 릴레이 localStorage를 수정하지 않아요. 실제 흐름은 “실제 상태”에서 확인하세요.'})
      ]),
      el('section',{className:'dev-tools-section'},[
        el('h2',{text:'데이터·이미지 검사'}),
        el('div',{className:'dev-tools-actions'},[
          button('데이터 중복 검사','dev-audit-duplicates',{kind:'tertiary'}),
          button('이미지 누락 검사','dev-audit-images',{kind:'tertiary'}),
          button('라이선스 누락 검사','dev-audit-licenses',{kind:'tertiary'})
        ]),
        el('pre',{className:'dev-tools-report',text:state.devAuditReport || '검사 버튼을 누르면 V61 빌드 검사 결과가 표시돼요.'})
      ]),
      el('section',{className:'dev-tools-section'},[
        el('h2',{text:'런타임 UX 테스트'}),
        el('dl',{className:'dev-tools-state'},[
          el('div',{},[el('dt',{text:'네트워크'}),el('dd',{text:state.devNetworkFailure ? '강제 실패 켜짐' : '정상'})]),
          el('div',{},[el('dt',{text:'본문 글자'}),el('dd',{text:fontStatus})])
        ]),
        el('div',{className:'dev-tools-actions'},[
          (()=>{const control=button(state.devNetworkFailure?'강제 네트워크 실패 끄기':'강제 네트워크 실패','dev-network-failure',{kind:'tertiary'});control.setAttribute('aria-pressed',String(Boolean(state.devNetworkFailure)));return control;})(),
          button(state.devLongTextTest?'긴 텍스트 테스트 닫기':'긴 텍스트 테스트','dev-long-text',{kind:'tertiary'}),
          button('최소 폰트 테스트','dev-font-min',{kind:'tertiary'}),
          button('최대 폰트 테스트','dev-font-max',{kind:'tertiary'}),
          button('폰트 설정값 복귀','dev-font-reset',{kind:'tertiary'})
        ]),
        state.devLongTextTest ? renderLongTextFixture() : null,
        el('p',{className:'dev-tools-note',text:'이 영역의 네트워크·긴 텍스트·폰트 상태는 DEV 메모리에만 있으며 PROD localStorage와 실제 사용자 설정을 변경하지 않아요.'})
      ])
    ])
  ]);
}
return { renderDevTools };
})();

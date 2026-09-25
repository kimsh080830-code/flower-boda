__mods["js/ui/observations.js"] = (() => {
const { FLOWERS,getFlowerById } = __mods["js/data.js"];
const { getBloomStatus,formatBloomPeriod } = __mods["js/dateUtils.js"];
const { getDirectFlowerEvents } = __mods["js/eventService.js"];
const { el,button } = __mods["js/ui/dom.js"];
const { sectionHeader,statusBadge,eventListRow } = __mods["js/ui/components.js"];
function renderFavoriteGarden(state, { title = '즐겨찾기한 꽃' } = {}) {
  const flowers=state.favoriteFlowerIds.map(getFlowerById).filter(Boolean);
  const section=el('section',{className:'content-section favorite-garden'},[sectionHeader(title, '', '', `${flowers.length}종`)]);
  if (!flowers.length) {
    section.append(el('p',{className:'weather-note',text:'도감에서 꽃을 저장하면 개화 시기와 관련 행사를 여기서 볼 수 있어요.'}),button('도감에서 꽃 찾기','go-encyclopedia',{kind:'tertiary'}));
    return section;
  }
  flowers.forEach(flower=> {
    const related=getDirectFlowerEvents(state.events,flower).filter(event=>!state.userRegion || event.region===state.userRegion);
    section.append(el('article',{className:'personal-card'},[
      el('div',{className:'personal-heading'},[button(flower.nameKo,'open-flower',{kind:'tertiary',data:{flowerId:flower.id}}),statusBadge(getBloomStatus(flower.bloom,state.currentDate))]),
      el('p',{text:`도감의 개화 시기: ${formatBloomPeriod(flower.bloom)}`}),
      state.eventsLoading ? el('p',{role:'status',text:'관련 행사를 확인하고 있어요.'}) : state.eventsError
        ? el('div',{},[el('p',{text:'관련 행사를 불러오지 못했어요.'}),button('행사 다시 확인','retry-events',{kind:'tertiary'})])
        : related.length ? el('div',{className:'event-list'},related.slice(0,2).map(event=>eventListRow(event,{compact:true,showVerification:false})))
        : el('p',{className:'weather-note',text:state.userRegion ? `${state.userRegion}에 연결된 진행 중·예정 행사가 없어요.` : '연결된 진행 중·예정 행사가 없어요.'})
    ]));
  });
  section.append(el('p',{className:'weather-note',text:'개화 시기는 지역과 날씨에 따라 달라질 수 있어요. 방문 전 실제 개화 상황을 확인해 주세요.'}));
  return section;
}
function renderEditor(state) {
  const draft=state.observationDraft;
  if(!draft) return null;
  const flowers=el('select',{id:'observation-flower',required:true,dataset:{observationField:'flowerId'}});
  flowers.append(el('option',{value:'',text:'꽃을 선택해 주세요',selected:!draft.flowerId}));
  FLOWERS.forEach(flower=>flowers.append(el('option',{value:flower.id,text:flower.nameKo,selected:flower.id===draft.flowerId})));
  return el('section',{className:'personal-card observation-editor','aria-labelledby':'observation-editor-title'},[
    el('h3',{id:'observation-editor-title',text:state.editingObservationId ? '관찰 기록 수정' : '새 관찰 기록'}),
    el('label',{className:'observation-field'},[el('span',{text:'관찰한 꽃'}),flowers]),
    el('label',{className:'observation-field'},[el('span',{text:'관찰 날짜'}),el('input',{id:'observation-date',type:'date',value:draft.observedOn,required:true,dataset:{observationField:'observedOn'}})]),
    el('label',{className:'observation-field'},[el('span',{text:'메모 (최대 1,000자)'}),el('textarea',{id:'observation-note',rows:3,maxlength:1000,dataset:{observationField:'note'},text:draft.note})]),
    draft.photo ? el('img',{className:'observation-photo',src:draft.photo,alt:'저장할 관찰 사진'}) : el('p',{className:'weather-note',text:'사진 없이도 날짜와 메모를 저장할 수 있어요.'}),
    el('div',{className:'personal-actions'},[button(draft.photo ? '사진 바꾸기' : '촬영 사진 추가','observation-photo',{kind:'secondary',disabled:state.observationPhotoBusy}),draft.photo ? button('사진 빼기','observation-remove-photo',{kind:'tertiary',disabled:state.observationPhotoBusy}) : null]),
    state.observationPhotoBusy ? el('p',{role:'status',text:'사진을 저장용 크기로 줄이고 있어요.'}) : null,
    state.observationError ? el('p',{role:'alert',className:'form-error',text:state.observationError}) : null,
    el('div',{className:'personal-actions'},[button('기록 저장','observation-save',{disabled:state.observationPhotoBusy}),button('취소','observation-cancel',{kind:'tertiary'})])
  ]);
}
function renderObservationPanel(state) {
  const panel=el('details',{id:'observation-panel',className:'content-section personal-panel',...(state.observationsOpen ? {open:true} : {})},[
    el('summary',{},[el('strong',{text:'나의 관찰 기록'}),el('span',{text:` ${state.discoveredFlowers.length}개`})]),
    el('p',{className:'weather-note',text:'사진은 최대 480px JPEG로 줄여 이 브라우저에 저장해요. 최대 120개·약 3MB이며, 중요한 기록은 파일로 백업해 주세요.'}),
    el('div',{className:'personal-actions'},[button('관찰 기록 추가','observation-new'),button('백업 내보내기','backup-export',{kind:'secondary'}),button('백업 가져오기','backup-choose',{kind:'secondary',disabled:state.backupBusy})]),
    state.collectionError ? el('p',{role:'alert',className:'form-error',text:state.collectionError}) : null,
    state.backupBusy ? el('p',{role:'status',text:'백업 파일을 확인하고 있어요.'}) : null,
    state.backupError ? el('p',{role:'alert',className:'form-error',text:state.backupError}) : null
  ]);
  if(state.pendingImport) {
    const { preview,incoming }=state.pendingImport;
    panel.append(el('section',{className:'personal-card','aria-label':'가져오기 내용 확인'},[
      el('h3',{text:'가져올 내용 확인'}),
      el('p',{text:`관찰 기록 ${preview.addedRecords}개·저장 ${preview.addedFavorites}개 추가, 중복 기록 ${preview.skippedRecords}개 건너뛰기`}),
      el('ul',{},incoming.records.slice(0,3).map(record=>el('li',{text:`${getFlowerById(record.flowerId)?.nameKo || record.flowerId} · ${record.observedOn}`}))),
      el('p',{text:'기존 기록은 유지합니다. ID나 생성 시각이 같은 기록은 현재 내용을 우선하고 추가하지 않아요.'}),
      el('div',{className:'personal-actions'},[button('기존 기록 유지하고 추가','backup-confirm'),button('가져오기 취소','backup-cancel',{kind:'tertiary'})])
    ]));
  }
  panel.append(renderEditor(state) || el('span',{}));
  if(!state.discoveredFlowers.length) panel.append(el('p',{className:'weather-note',text:'아직 관찰 기록이 없어요. 꽃을 확인하거나 직접 기록을 추가해 보세요.'}));
  state.discoveredFlowers.forEach(record=> {
    const flower=getFlowerById(record.flowerId);
    panel.append(el('article',{className:'personal-card observation-record','data-record-id':record.id},[
      el('div',{className:'observation-record-heading'},[
        record.photo ? el('img',{src:record.photo,alt:`${flower?.nameKo || '꽃'} 관찰 사진`,className:'observation-thumb',loading:'lazy'}) : null,
        el('div',{},[button(flower?.nameKo || record.flowerId,'open-flower',{kind:'tertiary',data:{flowerId:record.flowerId}}),el('p',{text:record.observedOn}),record.note ? el('p',{className:'observation-memo',text:record.note}) : null])
      ]),
      el('div',{className:'personal-actions'},[button('수정','observation-edit',{kind:'secondary',data:{recordId:record.id}}),button('삭제','observation-delete-request',{kind:'tertiary',data:{recordId:record.id}})]),
      state.pendingDeleteId===record.id ? el('div',{className:'delete-confirm',role:'group','aria-label':'기록 삭제 확인'},[
        el('p',{text:'이 기록과 저장한 사진을 삭제할까요? 필요한 기록은 먼저 백업해 주세요.'}),
        el('div',{className:'personal-actions'},[button('이 기록 삭제','observation-delete-confirm',{data:{recordId:record.id}}),button('삭제 취소','observation-delete-cancel',{kind:'tertiary'})])
      ]) : null
    ]));
  });
  return panel;
}
return {renderFavoriteGarden,renderObservationPanel};
})();

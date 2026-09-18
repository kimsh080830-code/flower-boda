__mods["js/calendarPatch.js"] = (() => {
const calendar=__mods['js/calendar.js'];
const {FLOWERS}=__mods['js/data.js'];
const {getDirectFlowerEvents}=__mods['js/eventService.js'];
const {el}=__mods['js/ui/dom.js'];

function installStyles(){
 if(typeof document==='undefined' || document.getElementById('full-bloom-calendar-patch')) return;
 const style=document.createElement('style');
 style.id='full-bloom-calendar-patch';
 style.textContent=`
.bloom-calendar-flower-heading{justify-content:flex-start!important}
.bloom-calendar-day,.event-filter-calendar-day{border-radius:var(--radius-small)!important}
.bloom-calendar-day{padding:0!important;grid-template-rows:1fr!important}
.bloom-calendar-markers{display:none!important}
.bloom-calendar-day.is-full-bloom{background:var(--accent-soft)!important;color:var(--ink)!important}
.bloom-calendar-day.is-full-bloom.has-flower-event{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--accent-strong) 18%,transparent) 0,color-mix(in srgb,var(--accent-strong) 18%,transparent) 2px,transparent 2px,transparent 6px),var(--accent-soft)!important}
.bloom-calendar-day.is-selected,.bloom-calendar-day.is-today.is-selected,.event-filter-calendar-day.is-selected{border-radius:var(--radius-small)!important;box-shadow:inset 0 0 0 2px var(--ink)!important}
.bloom-calendar-day.is-selected{background:var(--surface-soft)!important}
.bloom-calendar-day.is-full-bloom.is-selected{background:var(--accent-soft)!important}
.bloom-calendar-day.is-full-bloom.has-flower-event.is-selected{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--accent-strong) 18%,transparent) 0,color-mix(in srgb,var(--accent-strong) 18%,transparent) 2px,transparent 2px,transparent 6px),var(--accent-soft)!important}
.calendar-day{border-radius:var(--radius-small)!important}
[data-theme=dark] .bloom-calendar-day.is-full-bloom{background:var(--surface-tint)!important}
[data-theme=dark] .bloom-calendar-day.is-full-bloom.has-flower-event,[data-theme=dark] .bloom-calendar-day.is-full-bloom.has-flower-event.is-selected{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--accent) 20%,transparent) 0,color-mix(in srgb,var(--accent) 20%,transparent) 2px,transparent 2px,transparent 6px),var(--surface-tint)!important}
`;
 document.head.append(style);
}
installStyles();

function flowerColorDot(flower){
 const color=flower.colors?.[0] || '';
 return el('span',{className:'bloom-flower-color-dot',dataset:{flowerColor:color},'aria-hidden':'true'});
}

function renderBloomFlowerRail(state,year,month){
 const flowers=calendar.getBloomFlowersForMonth(year,month,FLOWERS);
 const section=el('section',{className:'bloom-calendar-flower-section','aria-labelledby':'bloom-month-flowers-title'},[
  el('div',{className:'bloom-calendar-flower-heading'},[
   el('h3',{id:'bloom-month-flowers-title',text:'이달에 피는 꽃'})
  ])
 ]);
 const rail=el('div',{className:'bloom-flower-rail',tabindex:'0',role:'group','aria-label':`${year}년 ${month}월에 피는 꽃`});
 flowers.forEach(flower=>{
  const selected=state.selectedBloomFlowerId===flower.id;
  const chip=el('button',{
   type:'button',
   className:`bloom-flower-chip ${selected?'is-selected':''}`.trim(),
   dataset:{action:'select-bloom-flower',flowerId:flower.id},
   'aria-pressed':String(selected),
   ariaLabel:selected?`${flower.nameKo} 선택 해제`:`${flower.nameKo} 선택`
  },[flowerColorDot(flower),el('span',{text:flower.nameKo})]);
  chip.addEventListener('click',()=>{
   if(state.selectedBloomFlowerId===flower.id){
    state.selectedBloomFlowerId='';
    chip.dataset.flowerId='';
   }
  });
  rail.append(chip);
 });
 if(!flowers.length) rail.append(el('span',{className:'bloom-flower-empty',text:'이달에 표시할 꽃이 없어요.'}));
 const controls=el('div',{className:'bloom-flower-rail-shell'},[
  el('button',{type:'button',className:'bloom-flower-rail-arrow',dataset:{action:'bloom-flower-rail-scroll',direction:'left'},disabled:true,'aria-disabled':'true',ariaLabel:'꽃 목록 왼쪽으로 이동',text:'‹'}),
  rail,
  el('button',{type:'button',className:'bloom-flower-rail-arrow',dataset:{action:'bloom-flower-rail-scroll',direction:'right'},disabled:flowers.length<=1,'aria-disabled':String(flowers.length<=1),ariaLabel:'꽃 목록 오른쪽으로 이동',text:'›'})
 ]);
 section.append(controls);
 rail.addEventListener('scroll',()=>calendar.syncBloomRailControls(section),{passive:true});
 requestAnimationFrame(()=>calendar.syncBloomRailControls(section));
 return section;
}

function getStatusDateKey(state,year,month,today){
 const prefix=`${year}-${String(month).padStart(2,'0')}-`;
 if(state.bloomCalendarSelectedDate?.startsWith(prefix)) return state.bloomCalendarSelectedDate;
 return today.startsWith(prefix)?today:'';
}

function isFullBloomDate(flower,value){
 return Boolean(flower && calendar.getBloomStatusForDate(flower,value)?.stage===2);
}

function directEventsForFlower(state,flower){
 return flower ? getDirectFlowerEvents(state.events || [],flower,{includeEnded:true}) : [];
}

function hasDirectFlowerEventOnDate(events,value){
 return events.some(event=>calendar.isVisitDate(event,value));
}

function renderBloomSelectionInfo(state,year,month,today,selectedFlower,directEvents){
 if(!selectedFlower){
  const selectedDate=state.bloomCalendarSelectedDate;
  return el('div',{className:'bloom-calendar-selection-info is-empty',role:'status',text:selectedDate?`${month}월 ${Number(selectedDate.slice(-2))}일 선택됨 · 꽃을 선택하면 만개 날짜를 확인할 수 있어요.`:'꽃을 선택하면 만개 날짜를 확인할 수 있어요.'});
 }
 const dateKey=getStatusDateKey(state,year,month,today);
 if(!dateKey) return el('div',{className:'bloom-calendar-selection-info is-empty',role:'status',text:`${selectedFlower.nameKo} · 날짜를 선택해 주세요.`});
 const fullBloom=isFullBloomDate(selectedFlower,dateKey);
 const hasEvent=fullBloom && hasDirectFlowerEventOnDate(directEvents,dateKey);
 const suffix=fullBloom ? ` · 만개${hasEvent?' · 관련 행사 있음':''}` : '';
 return el('div',{className:'bloom-calendar-selection-info',role:'status',text:`${selectedFlower.nameKo} · ${Number(dateKey.slice(5,7))}월 ${Number(dateKey.slice(8,10))}일${suffix}`});
}

function renderBloomCalendar(state){
 installStyles();
 const current=state.currentDate instanceof Date ? state.currentDate : new Date();
 const shown=calendar.parseMonthKey(state.bloomCalendarMonth,current);
 const year=shown.getFullYear(),month=shown.getMonth()+1;
 const previous=calendar.shiftMonthKey(calendar.monthKey(shown),-1,current),next=calendar.shiftMonthKey(calendar.monthKey(shown),1,current);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(current);
 const candidates=calendar.getBloomFlowersForMonth(year,month,FLOWERS);
 const selectedFlower=candidates.find(flower=>flower.id===state.selectedBloomFlowerId) || null;
 const directEvents=directEventsForFlower(state,selectedFlower);
 const layer=el('div',{className:'bloom-calendar-layer',role:'dialog','aria-modal':'true','aria-labelledby':'bloom-calendar-title',dataset:{action:'close-bloom-calendar'}},[
  el('section',{className:'bloom-calendar-panel',dataset:{action:'bloom-calendar-panel'}},[
   el('div',{className:'bloom-calendar-topbar'},[
    el('h2',{id:'bloom-calendar-title',text:'만개 달력'}),
    el('button',{type:'button',className:'bloom-calendar-close',dataset:{action:'close-bloom-calendar'},ariaLabel:'만개 달력 닫기',text:'닫기'})
   ]),
   el('div',{className:'bloom-calendar-heading'},[
    el('button',{type:'button',className:'bloom-calendar-month-button',dataset:{action:'bloom-calendar-month',month:previous},ariaLabel:'이전 달',text:'‹'}),
    el('strong',{text:`${year}년 ${month}월`,'aria-live':'polite'}),
    el('button',{type:'button',className:'bloom-calendar-month-button',dataset:{action:'bloom-calendar-month',month:next},ariaLabel:'다음 달',text:'›'})
   ])
  ])
 ]);
 const grid=el('div',{className:'bloom-calendar-grid',role:'grid','aria-label':`${year}년 ${month}월 만개 달력`,dataset:{bloomCalendarSwipe:'true'}});
 for(const label of ['일','월','화','수','목','금','토']) grid.append(el('span',{className:'bloom-calendar-weekday',role:'columnheader',text:label}));
 for(let i=0;i<shown.getDay();i++) grid.append(el('span',{className:'bloom-calendar-empty','aria-hidden':'true'}));
 const days=new Date(year,month,0).getDate();
 for(let day=1;day<=days;day++){
  const key=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const selected=state.bloomCalendarSelectedDate===key;
  const fullBloom=isFullBloomDate(selectedFlower,key);
  const hasEvent=fullBloom && hasDirectFlowerEventOnDate(directEvents,key);
  const bloomText=fullBloom?`, ${selectedFlower?.nameKo || ''} 만개`:'';
  const eventText=hasEvent?', 관련 행사 있음':'';
  grid.append(el('button',{
   type:'button',
   className:`bloom-calendar-day ${key===today?'is-today':''} ${selected?'is-selected':''} ${fullBloom?'is-full-bloom':''} ${hasEvent?'has-flower-event':''}`.trim(),
   role:'gridcell',dataset:{action:'bloom-calendar-date',date:key},'aria-current':key===today?'date':null,'aria-selected':String(selected),
   ariaLabel:`${month}월 ${day}일${key===today?', 오늘':''}${selected?', 선택됨':''}${bloomText}${eventText}`
  },[el('span',{className:'bloom-calendar-day-number',text:String(day)})]));
 }
 layer.querySelector('.bloom-calendar-panel').append(grid,renderBloomSelectionInfo(state,year,month,today,selectedFlower,directEvents),renderBloomFlowerRail(state,year,month));
 return layer;
}

calendar.renderBloomCalendar=renderBloomCalendar;
return {renderBloomCalendar,isFullBloomDate};
})();

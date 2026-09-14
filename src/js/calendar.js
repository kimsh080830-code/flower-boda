__mods["js/calendar.js"] = (() => {
const {parseApiDate,getBloomStatus}=__mods['js/dateUtils.js'];
const {canUseEventSchedule}=__mods['js/eventService.js'];
const {FLOWERS}=__mods['js/data.js'];
const {el,button}=__mods['js/ui/dom.js'];
const MAX_BLOOM_DAY_MARKERS=3;
function inputDay(date) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;}
function isVisitDate(event,value) {
 const date=parseApiDate(value),start=parseApiDate(event?.startDate),end=parseApiDate(event?.endDate);
 return Boolean(event && canUseEventSchedule(event) && date && start && end && start<=end && date>=start && date<=end);
}
function renderCalendar(state,event) {
 const start=parseApiDate(event.startDate),end=parseApiDate(event.endDate);
 const value=isVisitDate(event,state.eventVisitDates?.[event.id])?state.eventVisitDates[event.id]:'';
 const first=inputDay(start).slice(0,7),last=inputDay(end).slice(0,7);
 let month=state.calendarMonths?.[event.id] || value.slice(0,7) || first;
 if(month<first || month>last) month=first;
 const [y,m]=month.split('-').map(Number),date=new Date(y,m-1,1);
 const previous=inputDay(new Date(y,m-2,1)).slice(0,7),next=inputDay(new Date(y,m,1)).slice(0,7);
 const section=el('section',{className:'event-calendar-section','aria-label':'행사 방문 날짜'},[
  el('h3',{text:'방문 날짜'}),el('div',{className:'calendar-heading'},[
   button('‹','calendar-month',{kind:'tertiary',disabled:month<=first,data:{eventId:event.id,month:previous}}),
   el('strong',{text:`${y}년 ${m}월`,'aria-live':'polite'}),
   button('›','calendar-month',{kind:'tertiary',disabled:month>=last,data:{eventId:event.id,month:next}})
  ])
 ]);
 section.querySelector('[data-month="'+previous+'"]').setAttribute('aria-label','이전 달');
 section.querySelector('[data-month="'+next+'"]').setAttribute('aria-label','다음 달');
 const grid=el('div',{className:'calendar-grid',role:'group','aria-label':`${y}년 ${m}월 날짜 선택`});
 for(const day of ['일','월','화','수','목','금','토']) grid.append(el('span',{className:'calendar-weekday',text:day,'aria-hidden':'true'}));
 for(let i=0;i<date.getDay();i++) grid.append(el('span',{'aria-hidden':'true'}));
 for(let day=1;day<=new Date(y,m,0).getDate();day++) {
  const key=inputDay(new Date(y,m-1,day)),valid=isVisitDate(event,key);
  grid.append(valid ? el('button',{type:'button',className:'calendar-day',text:String(day),dataset:{action:'calendar-day',eventId:event.id,date:key},'aria-pressed':String(value===key),ariaLabel:`${m}월 ${day}일`}) : el('span',{className:'calendar-day is-disabled',text:String(day),'aria-disabled':'true',ariaLabel:`${m}월 ${day}일, 행사 기간 밖`}));
 }
 section.append(grid,el('p',{className:'visit-selection',role:'status',text:value?`${value} ${state.savedVisitDates?.[event.id]===value?'저장됨':'선택'}`:'날짜를 선택해 주세요.'}),
  button('방문 날짜 저장','save-event-visit',{disabled:!value,data:{eventId:event.id}}),
  button('캘린더 추가 · ICS 다운로드','add-event-calendar',{disabled:!value,data:{eventId:event.id}}));
 return section;
}
function monthKey(date) {return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;}
function parseMonthKey(value,fallback=new Date()) {
 const match=/^(\d{4})-(\d{2})$/.exec(value||'');
 if(!match) return new Date(fallback.getFullYear(),fallback.getMonth(),1,12);
 const year=Number(match[1]),month=Number(match[2]);
 if(month<1||month>12) return new Date(fallback.getFullYear(),fallback.getMonth(),1,12);
 return new Date(year,month-1,1,12);
}
function shiftMonthKey(value,offset,fallback=new Date()) {
 const date=parseMonthKey(value,fallback);
 return monthKey(new Date(date.getFullYear(),date.getMonth()+offset,1,12));
}
function parseBloomDay(value) {
 const match=/^(\d{2})-(\d{2})$/.exec(String(value||''));
 if(!match) return null;
 const month=Number(match[1]),day=Number(match[2]);
 if(month<1||month>12||day<1||day>31) return null;
 return {month,day,code:month*100+day};
}
function bloomOverlapsMonth(bloom,year,month) {
 const start=parseBloomDay(bloom?.start),end=parseBloomDay(bloom?.end);
 if(!start||!end||month<1||month>12) return false;
 const monthStart=new Date(year,month-1,1,12),monthEnd=new Date(year,month,0,12);
 for(const baseYear of [year-1,year,year+1]) {
  const bloomStart=new Date(baseYear,start.month-1,start.day,12);
  const endYear=end.code<start.code ? baseYear+1 : baseYear;
  const bloomEnd=new Date(endYear,end.month-1,end.day,12);
  if(bloomStart<=monthEnd && bloomEnd>=monthStart) return true;
 }
 return false;
}
function getBloomFlowersForMonth(year,month,flowers=FLOWERS) {
 return flowers.filter(flower=>bloomOverlapsMonth(flower?.bloom,year,month));
}
function getBloomStatusForDate(flower,value) {
 const date=parseApiDate(value);
 return flower && date ? getBloomStatus(flower.bloom,date) : null;
}
function getBloomingFlowersForDate(flowers,value) {
 return flowers.filter(flower=>{
  const status=getBloomStatusForDate(flower,value);
  return status && status.stage>=1 && status.stage<=3;
 });
}
function getBloomMarkersForDate(flowers,value,max=MAX_BLOOM_DAY_MARKERS) {
 const blooming=getBloomingFlowersForDate(flowers,value);
 const limit=Math.max(0,Number.isFinite(max)?Math.floor(max):MAX_BLOOM_DAY_MARKERS);
 return {visible:blooming.slice(0,limit),overflow:Math.max(0,blooming.length-limit),total:blooming.length};
}
function syncBloomRailControls(root=document) {
 const rail=root.querySelector?.('.bloom-flower-rail');
 if(!rail) return;
 const controls=root.querySelectorAll?.('[data-action="bloom-flower-rail-scroll"]') || [];
 const max=Math.max(0,rail.scrollWidth-rail.clientWidth);
 const atStart=rail.scrollLeft<=1;
 const atEnd=max<=1 || rail.scrollLeft>=max-1;
 controls.forEach(control=>{
  const disabled=control.dataset.direction==='left' ? atStart : atEnd;
  control.disabled=disabled;
  control.setAttribute('aria-disabled',String(disabled));
 });
}
function flowerColorDot(flower) {
 const color=flower.colors?.[0] || '';
 return el('span',{className:'bloom-flower-color-dot',dataset:{flowerColor:color},'aria-hidden':'true'});
}
function renderBloomFlowerRail(state,year,month) {
 const flowers=getBloomFlowersForMonth(year,month);
 const allSelected=Boolean(state.bloomCalendarShowAll);
 const section=el('section',{className:'bloom-calendar-flower-section','aria-labelledby':'bloom-month-flowers-title'},[
  el('div',{className:'bloom-calendar-flower-heading'},[
   el('h3',{id:'bloom-month-flowers-title',text:'이달에 피는 꽃'}),
   el('button',{type:'button',className:`bloom-calendar-all-button ${allSelected?'is-selected':''}`.trim(),dataset:{action:'show-all-bloom-flowers'},'aria-pressed':String(allSelected),text:'이달 꽃 전체 표시'})
  ])
 ]);
 const rail=el('div',{className:'bloom-flower-rail',tabindex:'0',role:'group','aria-label':`${year}년 ${month}월에 피는 꽃`});
 flowers.forEach(flower=>rail.append(el('button',{
  type:'button',
  className:`bloom-flower-chip ${!allSelected && state.selectedBloomFlowerId===flower.id?'is-selected':''}`.trim(),
  dataset:{action:'select-bloom-flower',flowerId:flower.id},
  'aria-pressed':String(!allSelected && state.selectedBloomFlowerId===flower.id),
  ariaLabel:`${flower.nameKo} 선택`
 },[flowerColorDot(flower),el('span',{text:flower.nameKo})])));
 if(!flowers.length) rail.append(el('span',{className:'bloom-flower-empty',text:'이달에 표시할 꽃이 없어요.'}));
 const controls=el('div',{className:'bloom-flower-rail-shell'},[
  el('button',{type:'button',className:'bloom-flower-rail-arrow',dataset:{action:'bloom-flower-rail-scroll',direction:'left'},disabled:true,'aria-disabled':'true',ariaLabel:'꽃 목록 왼쪽으로 이동',text:'‹'}),
  rail,
  el('button',{type:'button',className:'bloom-flower-rail-arrow',dataset:{action:'bloom-flower-rail-scroll',direction:'right'},disabled:flowers.length<=1,'aria-disabled':String(flowers.length<=1),ariaLabel:'꽃 목록 오른쪽으로 이동',text:'›'})
 ]);
 section.append(controls);
 rail.addEventListener('scroll',()=>syncBloomRailControls(section),{passive:true});
 requestAnimationFrame(()=>syncBloomRailControls(section));
 return section;
}
function renderBloomMarkers(markers) {
 if(!markers.total) return null;
 return el('span',{className:'bloom-calendar-markers','aria-hidden':'true'},[
  ...markers.visible.map(flower=>el('span',{className:'bloom-calendar-marker',dataset:{flowerColor:flower.colors?.[0] || ''},title:flower.nameKo})),
  markers.overflow ? el('span',{className:'bloom-calendar-marker-more',text:`+${markers.overflow}`}) : null
 ]);
}
function getBloomStatusDateKey(state,year,month,today) {
 const prefix=`${year}-${String(month).padStart(2,'0')}-`;
 if(state.bloomCalendarSelectedDate?.startsWith(prefix)) return state.bloomCalendarSelectedDate;
 return today.startsWith(prefix) ? today : '';
}
function renderBloomSelectionInfo(state,year,month,today,selectedFlower) {
 if(state.bloomCalendarShowAll) return el('div',{className:'bloom-calendar-selection-info is-all',role:'status',text:'현재 월 후보 꽃의 개화 기간을 함께 표시하고 있어요.'});
 if(!selectedFlower) {
  const selectedDate=state.bloomCalendarSelectedDate;
  return el('div',{className:'bloom-calendar-selection-info is-empty',role:'status',text:selectedDate?`${month}월 ${Number(selectedDate.slice(-2))}일 선택됨 · 꽃을 선택하면 개화 상태를 확인할 수 있어요.`:'꽃을 선택하면 날짜별 개화 상태를 확인할 수 있어요.'});
 }
 const dateKey=getBloomStatusDateKey(state,year,month,today);
 if(!dateKey) return el('div',{className:'bloom-calendar-selection-info is-empty',role:'status',text:`${selectedFlower.nameKo} · 날짜를 선택하면 개화 상태를 확인할 수 있어요.`});
 const status=getBloomStatusForDate(selectedFlower,dateKey);
 return el('div',{className:'bloom-calendar-selection-info',role:'status',text:`${selectedFlower.nameKo} · ${Number(dateKey.slice(5,7))}월 ${Number(dateKey.slice(8,10))}일 · ${status?.label || '정보 없음'}`});
}
function renderBloomCalendar(state) {
 const current=state.currentDate instanceof Date ? state.currentDate : new Date();
 const shown=parseMonthKey(state.bloomCalendarMonth,current);
 const year=shown.getFullYear(),month=shown.getMonth()+1;
 const previous=shiftMonthKey(monthKey(shown),-1,current),next=shiftMonthKey(monthKey(shown),1,current);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(current);
 const candidates=getBloomFlowersForMonth(year,month);
 const selectedFlower=!state.bloomCalendarShowAll ? candidates.find(flower=>flower.id===state.selectedBloomFlowerId) || null : null;
 const markerFlowers=state.bloomCalendarShowAll ? candidates : (selectedFlower ? [selectedFlower] : []);
 const layer=el('div',{className:'bloom-calendar-layer',role:'dialog','aria-modal':'true','aria-labelledby':'bloom-calendar-title',dataset:{action:'close-bloom-calendar'}},[
  el('section',{className:'bloom-calendar-panel',dataset:{action:'bloom-calendar-panel'}},[
   el('div',{className:'bloom-calendar-topbar'},[
    el('h2',{id:'bloom-calendar-title',text:'개화 달력'}),
    el('button',{type:'button',className:'bloom-calendar-close',dataset:{action:'close-bloom-calendar'},ariaLabel:'개화 달력 닫기',text:'닫기'})
   ]),
   el('div',{className:'bloom-calendar-heading'},[
    el('button',{type:'button',className:'bloom-calendar-month-button',dataset:{action:'bloom-calendar-month',month:previous},ariaLabel:'이전 달',text:'‹'}),
    el('strong',{text:`${year}년 ${month}월`,'aria-live':'polite'}),
    el('button',{type:'button',className:'bloom-calendar-month-button',dataset:{action:'bloom-calendar-month',month:next},ariaLabel:'다음 달',text:'›'})
   ])
  ])
 ]);
 const grid=el('div',{className:'bloom-calendar-grid',role:'grid','aria-label':`${year}년 ${month}월 개화 달력`,dataset:{bloomCalendarSwipe:'true'}});
 for(const label of ['일','월','화','수','목','금','토']) grid.append(el('span',{className:'bloom-calendar-weekday',role:'columnheader',text:label}));
 for(let i=0;i<shown.getDay();i++) grid.append(el('span',{className:'bloom-calendar-empty','aria-hidden':'true'}));
 const days=new Date(year,month,0).getDate();
 for(let day=1;day<=days;day++) {
  const key=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const selected=state.bloomCalendarSelectedDate===key;
  const markers=getBloomMarkersForDate(markerFlowers,key);
  const markerText=markers.total ? (state.bloomCalendarShowAll ? `, ${markers.total}개 꽃 개화 기간` : `, ${selectedFlower?.nameKo || ''} 개화 기간`) : '';
  grid.append(el('button',{
   type:'button',className:`bloom-calendar-day ${key===today?'is-today':''} ${selected?'is-selected':''} ${markers.total?'has-bloom':''}`.trim(),
   role:'gridcell',dataset:{action:'bloom-calendar-date',date:key},'aria-current':key===today?'date':null,'aria-selected':String(selected),
   ariaLabel:`${month}월 ${day}일${key===today?', 오늘':''}${selected?', 선택됨':''}${markerText}`
  },[el('span',{className:'bloom-calendar-day-number',text:String(day)}),renderBloomMarkers(markers)]));
 }
 layer.querySelector('.bloom-calendar-panel').append(grid,renderBloomSelectionInfo(state,year,month,today,selectedFlower),renderBloomFlowerRail(state,year,month));
 return layer;
}

function renderEventFilterCalendar(state) {
 const current=state.currentDate instanceof Date ? state.currentDate : new Date();
 const selected=String(state.eventFilter?.date || '');
 const fallbackMonth=selected.slice(0,7) || monthKey(current);
 const shown=parseMonthKey(state.eventCalendarMonth || fallbackMonth,current);
 const year=shown.getFullYear(),month=shown.getMonth()+1;
 const previous=shiftMonthKey(monthKey(shown),-1,current),next=shiftMonthKey(monthKey(shown),1,current);
 const today=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(current);
 const wrap=el('div',{
  className:'event-filter-calendar',role:'group','aria-labelledby':'event-date-filter-label','aria-describedby':'event-date-filter-note'
 });
 wrap.append(el('div',{className:'event-filter-calendar-heading'},[
  el('button',{type:'button',className:'event-filter-calendar-month-button',dataset:{action:'event-filter-month',month:previous},ariaLabel:'이전 달',text:'‹'}),
  el('strong',{text:`${year}년 ${month}월`,'aria-live':'polite'}),
  el('button',{type:'button',className:'event-filter-calendar-month-button',dataset:{action:'event-filter-month',month:next},ariaLabel:'다음 달',text:'›'})
 ]));
 const grid=el('div',{className:'event-filter-calendar-grid',role:'grid','aria-label':`${year}년 ${month}월 행사 날짜 선택`,dataset:{eventCalendarSwipe:'true'}});
 for(const label of ['일','월','화','수','목','금','토']) grid.append(el('span',{className:'event-filter-calendar-weekday',role:'columnheader',text:label}));
 for(let i=0;i<shown.getDay();i++) grid.append(el('span',{className:'event-filter-calendar-empty','aria-hidden':'true'}));
 const days=new Date(year,month,0).getDate();
 for(let day=1;day<=days;day++) {
  const key=`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  const isSelected=selected===key;
  const isToday=today===key;
  grid.append(el('button',{
   type:'button',
   className:`event-filter-calendar-day ${isToday?'is-today':''} ${isSelected?'is-selected':''}`.trim(),
   role:'gridcell',dataset:{action:'event-filter-date',date:key},
   'aria-current':isToday?'date':null,'aria-selected':String(isSelected),
   ariaLabel:`${month}월 ${day}일${isToday?', 오늘':''}${isSelected?', 선택됨':''}`,
   text:String(day)
  }));
 }
 wrap.append(grid);
 return wrap;
}

function escapeIcs(value='') {
  return String(value).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}
function buildEventCalendar(eventItem, visitDate) {
  const chosen = parseApiDate(visitDate);
  if (!chosen || !isVisitDate(eventItem,visitDate)) return false;
  const next = new Date(chosen); next.setDate(next.getDate() + 1);
  const ymd = (date) => `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${String(now.getUTCMonth()+1).padStart(2,'0')}${String(now.getUTCDate()).padStart(2,'0')}T${String(now.getUTCHours()).padStart(2,'0')}${String(now.getUTCMinutes()).padStart(2,'0')}${String(now.getUTCSeconds()).padStart(2,'0')}Z`;
  const description = [eventItem.description, eventItem.sourceUrl ? `정보 출처: ${eventItem.sourceUrl}` : '', eventItem.url ? `등록된 주최 홈페이지: ${eventItem.url}` : ''].filter(Boolean).join('\n');
  const location = [eventItem.place, eventItem.address].filter(Boolean).join(' · ');
  const lines = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Flower Guide//KO','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    `UID:${escapeIcs(eventItem.id)}-${ymd(chosen)}@flower-guide.local`, `DTSTAMP:${stamp}`, `DTSTART;VALUE=DATE:${ymd(chosen)}`, `DTEND;VALUE=DATE:${ymd(next)}`,
    `SUMMARY:${escapeIcs(eventItem.title)}`, `LOCATION:${escapeIcs(location)}`, `DESCRIPTION:${escapeIcs(description)}`,
    ...(eventItem.url && /^https?:\/\//i.test(eventItem.url) ? [`URL:${escapeIcs(eventItem.url)}`] : []), 'END:VEVENT','END:VCALENDAR'
  ];
  return lines.join('\r\n');
}
return {isVisitDate,renderCalendar,renderBloomCalendar,renderEventFilterCalendar,buildEventCalendar,monthKey,parseMonthKey,shiftMonthKey,bloomOverlapsMonth,getBloomFlowersForMonth,getBloomStatusForDate,getBloomingFlowersForDate,getBloomMarkersForDate,syncBloomRailControls};
})();

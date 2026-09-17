__mods["js/calendarWeekendPatch.js"] = (() => {
const calendar=__mods['js/calendar.js'];

function installStyles(){
 if(typeof document==='undefined' || document.getElementById('calendar-weekend-patch')) return;
 const style=document.createElement('style');
 style.id='calendar-weekend-patch';
 style.textContent=`
.bloom-calendar-weekday:nth-child(1),
.event-filter-calendar-weekday:nth-child(1),
.calendar-weekday:nth-child(1),
.bloom-calendar-day.is-sunday .bloom-calendar-day-number,
.event-filter-calendar-day.is-sunday,
.calendar-day.is-sunday{color:#E04444!important;font-weight:800}
.bloom-calendar-weekday:nth-child(7),
.event-filter-calendar-weekday:nth-child(7),
.calendar-weekday:nth-child(7),
.bloom-calendar-day.is-saturday .bloom-calendar-day-number,
.event-filter-calendar-day.is-saturday,
.calendar-day.is-saturday{color:#3973E6!important;font-weight:800}
[data-theme=dark] .bloom-calendar-weekday:nth-child(1),
[data-theme=dark] .event-filter-calendar-weekday:nth-child(1),
[data-theme=dark] .calendar-weekday:nth-child(1),
[data-theme=dark] .bloom-calendar-day.is-sunday .bloom-calendar-day-number,
[data-theme=dark] .event-filter-calendar-day.is-sunday,
[data-theme=dark] .calendar-day.is-sunday{color:#FF6B6B!important}
[data-theme=dark] .bloom-calendar-weekday:nth-child(7),
[data-theme=dark] .event-filter-calendar-weekday:nth-child(7),
[data-theme=dark] .calendar-weekday:nth-child(7),
[data-theme=dark] .bloom-calendar-day.is-saturday .bloom-calendar-day-number,
[data-theme=dark] .event-filter-calendar-day.is-saturday,
[data-theme=dark] .calendar-day.is-saturday{color:#6EA8FF!important}
`;
 document.head.append(style);
}
installStyles();

function markWeekendDays(root,gridSelector,daySelector){
 root?.querySelectorAll?.(gridSelector).forEach(grid=>{
  [...grid.children].forEach((node,index)=>{
   if(index<7 || !node.matches?.(daySelector)) return;
   const column=(index-7)%7;
   node.classList.toggle('is-sunday',column===0);
   node.classList.toggle('is-saturday',column===6);
  });
 });
 return root;
}

function wrapRender(name,gridSelector,daySelector){
 const base=calendar[name];
 if(typeof base!=='function') return;
 calendar[name]=(...args)=>markWeekendDays(base(...args),gridSelector,daySelector);
}

wrapRender('renderBloomCalendar','.bloom-calendar-grid','.bloom-calendar-day');
wrapRender('renderEventFilterCalendar','.event-filter-calendar-grid','.event-filter-calendar-day');
wrapRender('renderCalendar','.calendar-grid','.calendar-day');

return {markWeekendDays};
})();

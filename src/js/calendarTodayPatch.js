__mods["js/calendarTodayPatch.js"] = (() => {
const calendar=__mods['js/calendar.js'];

function installTodayStyles(){
 if(typeof document==='undefined' || document.getElementById('calendar-today-emphasis')) return;
 const style=document.createElement('style');
 style.id='calendar-today-emphasis';
 style.textContent=`
.bloom-calendar-day.is-today,
.event-filter-calendar-day.is-today{
 position:relative!important;
 color:var(--text)!important;
 outline:2px solid #A8B8A0!important;
 outline-offset:-3px!important;
}
.bloom-calendar-day.is-today::after,
.event-filter-calendar-day.is-today::after{
 content:'오늘';
 position:absolute;
 top:2px;
 right:3px;
 z-index:3;
 padding:1px 3px;
 border-radius:4px;
 background:#71816A;
 color:var(--bg);
 font-size:.42rem;
 line-height:1.15;
 font-weight:850;
 letter-spacing:-.02em;
 pointer-events:none;
}
.bloom-calendar-day.is-today.is-selected,
.event-filter-calendar-day.is-today.is-selected{
 outline:2px solid #A8B8A0!important;
 outline-offset:-3px!important;
 box-shadow:inset 0 0 0 1px var(--bg),inset 0 0 0 3px #71816A!important;
}
@media(max-width:359px){
 .bloom-calendar-day.is-today::after,
 .event-filter-calendar-day.is-today::after{font-size:.39rem;top:2px;right:2px;padding:1px 2px}
}
`;
 document.head.append(style);
}
installTodayStyles();

const baseBloom=calendar.renderBloomCalendar;
calendar.renderBloomCalendar=(state)=>{
 installTodayStyles();
 return baseBloom(state);
};

const baseEventFilter=calendar.renderEventFilterCalendar;
calendar.renderEventFilterCalendar=(state)=>{
 installTodayStyles();
 return baseEventFilter(state);
};

return {installTodayStyles};
})();

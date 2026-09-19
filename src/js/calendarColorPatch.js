__mods["js/calendarColorPatch.js"] = (() => {
const calendar=__mods['js/calendar.js'];
const SAGE=Object.freeze({fill:'#DDE6D8',stripe:'#71816A'});
function getFlowerColors(){ return SAGE; }
const baseRender=calendar.renderBloomCalendar;
calendar.renderBloomCalendar=(state)=>baseRender(state);
return {getFlowerColors};
})();

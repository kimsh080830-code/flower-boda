__mods["js/calendarColorPatch.js"] = (() => {
const calendar=__mods['js/calendar.js'];
const {FLOWERS}=__mods['js/data.js'];

const COLOR_MAP=Object.freeze({
 '흰색':{fill:'#F1EFE6',stripe:'#A9A396'},
 '노랑':{fill:'#F2D867',stripe:'#B88900'},
 '분홍':{fill:'#EAAFC3',stripe:'#B65E7D'},
 '빨강':{fill:'#DC8B91',stripe:'#A3414A'},
 '보라':{fill:'#B6A0D4',stripe:'#76569A'},
 '파랑':{fill:'#9DBDE1',stripe:'#557EAD'},
 '주황':{fill:'#EAB16F',stripe:'#B66D29'},
 '초록':{fill:'#A9C68D',stripe:'#648247'},
 '연두':{fill:'#C7D98C',stripe:'#7B9448'},
 '갈색':{fill:'#BEA083',stripe:'#7D5E40'},
 '검정':{fill:'#A2A29D',stripe:'#555550'}
});

function getFlowerColors(flower){
 const primary=flower?.colors?.[0] || '';
 return COLOR_MAP[primary] || {fill:'#B8C9A7',stripe:'#6E845C'};
}

const baseRender=calendar.renderBloomCalendar;
calendar.renderBloomCalendar=(state)=>{
 const layer=baseRender(state);
 const flower=FLOWERS.find(item=>item.id===state.selectedBloomFlowerId) || null;
 if(!flower) return layer;
 const {fill,stripe}=getFlowerColors(flower);
 layer.querySelectorAll('.bloom-calendar-day.is-full-bloom').forEach(day=>{
  const background=day.classList.contains('has-flower-event')
   ? `repeating-linear-gradient(135deg,${stripe}55 0,${stripe}55 2px,transparent 2px,transparent 6px),${fill}`
   : fill;
  day.style.setProperty('--bloom-fill',fill);
  day.style.setProperty('--bloom-stripe',stripe);
  day.style.setProperty('background',background,'important');
 });
 return layer;
};

return {getFlowerColors};
})();

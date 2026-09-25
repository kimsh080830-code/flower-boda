__mods["js/dateUtils.js"] = (() => {
const DAY_MS = 86400000;
function getSeoulDateParts(date = new Date()) {
  const day = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const [year,month,dayOfMonth]=day.split('-').map(Number);
  return {year,month,day:dayOfMonth,key:day};
}
function getSeoulDay(date = new Date()) {
  return getSeoulDateParts(date).key;
}

function parseMonthDay(value, year) {
  if (!/^\d{2}-\d{2}$/.test(value || '')) return null;
  const [month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0));
  if (parsed.getUTCMonth() !== month - 1 || parsed.getUTCDate() !== day) return null;
  return parsed;
}

function getSeason(date = new Date()) {
  const {month} = getSeoulDateParts(date);
  if ([3, 4, 5].includes(month)) return '봄';
  if ([6, 7, 8].includes(month)) return '여름';
  if ([9, 10, 11].includes(month)) return '가을';
  return '겨울';
}

const SEASON_EXPRESSIONS=['한겨울','늦겨울','초봄','봄','늦봄','초여름','한여름','늦여름','초가을','가을','늦가을','초겨울'];
const SOLAR_TERM_NAMES=['소한','대한','입춘','우수','경칩','춘분','청명','곡우','입하','소만','망종','하지','소서','대서','입추','처서','백로','추분','한로','상강','입동','소설','대설','동지'];
const SOLAR_TERM_MINUTES=[0,21208,42467,63836,85337,107014,128867,150921,173149,195551,218072,240693,263343,285989,308563,331033,353350,375494,397447,419210,440795,462224,483532,504758];
// 2026 dates follow the Korea Astronomy and Space Science Institute calendar data.
const OFFICIAL_SOLAR_TERMS_2026=['01-05','01-20','02-04','02-19','03-05','03-20','04-05','04-20','05-05','05-21','06-06','06-21','07-07','07-23','08-07','08-23','09-07','09-23','10-08','10-23','11-07','11-22','12-07','12-22'];
function solarTermDate(year,index) {
  const exact=year===2026 ? OFFICIAL_SOLAR_TERMS_2026[index] : '';
  if(exact) {
    const [month,day]=exact.split('-').map(Number);
    return new Date(year,month-1,day,12);
  }
  const instant=new Date(Date.UTC(1900,0,6,2,5)+31556925974.7*(year-1900)+SOLAR_TERM_MINUTES[index]*60000);
  return new Date(year,instant.getUTCMonth(),instant.getUTCDate(),12);
}
function getSolarTerm(date=new Date()) {
  const dayText=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  const [year,month,day]=dayText.split('-').map(Number);
  const current=new Date(year,month-1,day,12);
  let result={name:'동지',date:solarTermDate(year-1,23)};
  for(const termYear of [year-1,year]) {
    SOLAR_TERM_NAMES.forEach((name,index)=>{
      const termDate=solarTermDate(termYear,index);
      if(termDate<=current && termDate>=result.date) result={name,date:termDate};
    });
  }
  return result.name;
}
function getDatePresentation(date=new Date()) {
  const day=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
  return {day,label:day.replaceAll('-','.'),season:SEASON_EXPRESSIONS[Number(day.slice(5,7))-1],solarTerm:getSolarTerm(date)};
}

function formatBloomPoint(value) {
  if (!/^\d{2}-\d{2}$/.test(value || '')) return '';
  const [month, day] = value.split('-').map(Number);
  if (!Number.isInteger(month) || !Number.isInteger(day) || month < 1 || month > 12 || day < 1 || day > 31) return '';
  const part = day <= 10 ? '초' : day <= 20 ? '중순' : '말';
  return `${month}월 ${part}`;
}

function formatBloomPeriod(bloom) {
  const start = formatBloomPoint(bloom?.start);
  const end = formatBloomPoint(bloom?.end);
  if (start && end) return start === end ? start : `${start} ~ ${end}`;
  return start || end || '';
}

function getBloomWindow(bloom, now = new Date()) {
  if (!bloom?.start || !bloom?.end) return null;
  const parts = getSeoulDateParts(now);
  const year = parts.year;
  let start = parseMonthDay(bloom.start, year);
  let end = parseMonthDay(bloom.end, year);
  if (!start || !end) return null;

  const crossesYear = bloom.start > bloom.end;
  if (crossesYear) {
    const nowMd = `${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`;
    if (nowMd >= bloom.start) end = parseMonthDay(bloom.end, year + 1);
    else start = parseMonthDay(bloom.start, year - 1);
  }
  return { start, end, crossesYear };
}

const BLOOM_STAGES=Object.freeze(['꽃봉오리','피기시작','만개','지는중','개화종료']);
function bloomState(stage,code,priority,days) {return {stage,code,priority,days,label:BLOOM_STAGES[stage]};}
function getBloomStatus(bloom, now = new Date()) {
  const window=getBloomWindow(bloom,now);
  if(!window) return {code:'unknown',label:'정보 없음',priority:9,days:null,stage:-1};
  const parts=getSeoulDateParts(now);
  const today=new Date(Date.UTC(parts.year,parts.month-1,parts.day,12));
  const elapsed=Math.floor((today-window.start)/DAY_MS);
  const duration=Math.max(1,Math.round((window.end-window.start)/DAY_MS)+1);
  const remaining=Math.floor((window.end-today)/DAY_MS),edge=Math.min(14,Math.max(1,Math.floor(duration*.2)));
  if(today<window.start) return bloomState(0,elapsed>=-30?'soon':'off-season',elapsed>=-30?2:5,-elapsed);
  if(today>window.end) return bloomState(4,'off-season',5,-remaining);
  if(elapsed<edge) return bloomState(1,'in-season',0,remaining);
  if(remaining<edge) return bloomState(3,'ending',1,remaining);
  return bloomState(2,'in-season',0,remaining);
}

function parseApiDate(value) {
  if (!value) return null;
  if (!/^(?:\d{8}|\d{4}([.\/-])\d{2}\1\d{2})$/.test(String(value))) return null;
  const digits = String(value).replace(/[^0-9]/g, '');
  if (digits.length !== 8) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const date = new Date(year, month - 1, day, 12);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
}

function getEventStatus(startValue, endValue, now = new Date()) {
  const start = parseApiDate(startValue);
  const end = parseApiDate(endValue);
  if (!start || !end || end < start) return { code: 'unknown', label: '일정 확인 필요', rank: 8 };
  const today = parseApiDate(new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(now));
  if (today >= start && today <= end) return { code: 'ongoing', label: '진행 중', rank: 0 };
  if (today < start) {
    const daysUntil = Math.ceil((start - today) / DAY_MS);
    return { code: 'upcoming', label: daysUntil <= 30 ? '곧 시작' : '예정', rank: daysUntil <= 30 ? 1 : 2, daysUntil };
  }
  return { code: 'ended', label: '종료', rank: 9 };
}

function formatApiDate(value) {
  const date = parseApiDate(value);
  if (!date) return '';
  return new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(date);
}
return { "parseMonthDay": parseMonthDay, "getSeoulDay": getSeoulDay, "getSeason": getSeason, "getDatePresentation": getDatePresentation, "getSolarTerm": getSolarTerm, "BLOOM_STAGES": BLOOM_STAGES, "formatBloomPeriod": formatBloomPeriod, "getBloomWindow": getBloomWindow, "getBloomStatus": getBloomStatus, "parseApiDate": parseApiDate, "getEventStatus": getEventStatus, "formatApiDate": formatApiDate };
})();

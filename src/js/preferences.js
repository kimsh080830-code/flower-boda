__mods["js/preferences.js"] = (() => {
const { getFlowerById } = __mods["js/data.js"];
const KEY='flower-info.settings.v1', RECENT='flower-info.recent.v1', VISITS='flower-info.visits.v1';
const defaults={region:'',theme:'system',recentEnabled:true,bodyTextSize:'medium'};
function read(key,fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } }
function write(key,value) { try { localStorage.setItem(key,JSON.stringify(value)); return true; } catch { return false; } }
function loadSettings() {
 const raw=read(KEY,read('flower-info.settings.v42',{})), legacy=read('flower-info.preferences.v1',{});
 const value={...defaults,region:typeof legacy?.region==='string' ? legacy.region.slice(0,60) : ''};
 if(raw && typeof raw==='object') {
  if(typeof raw.region==='string') value.region=raw.region.slice(0,60);
  if(typeof raw.recentEnabled==='boolean') value.recentEnabled=raw.recentEnabled;
  if(['system','light','dark'].includes(raw.theme)) value.theme=raw.theme;
  if(['small','medium','large'].includes(raw.bodyTextSize)) value.bodyTextSize=raw.bodyTextSize;
 }
 return value;
}
function loadRecent() { const rows=read(RECENT,[]); return Array.isArray(rows) ? [...new Set(rows)].filter(id=>typeof id==='string' && getFlowerById(id)).slice(0,6) : []; }
function rememberFlower(id,enabled=true) { const previous=loadRecent(); if(!enabled || !getFlowerById(id)) return previous; const next=[id,...previous.filter(value=>value!==id)].slice(0,6); return write(RECENT,next) ? next : previous; }
function clearRecent() { return write(RECENT,[]); }
function loadVisits() { const raw=read(VISITS,{}); return raw && !Array.isArray(raw) && typeof raw==='object' ? Object.fromEntries(Object.entries(raw).filter(([key,value])=>key.length<=160 && /^\d{4}-\d{2}-\d{2}$/.test(value))) : {}; }
function applyTheme(theme) { document.documentElement.dataset.theme=theme==='system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme; }
function applyTextSize(size) { document.documentElement.dataset.textSize=['small','medium','large'].includes(size) ? size : 'medium'; }
return {loadSettings,saveSettings:value=>write(KEY,value),loadRecent,rememberFlower,clearRecent,loadVisits,saveVisits:value=>write(VISITS,value),applyTheme,applyTextSize};
})();

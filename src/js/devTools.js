__mods["js/devTools.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { FLOWERS } = __mods["js/data.js"];
const { getFlowerTaxonIdentity } = __mods["js/flowerDataPolicy.js"];
const { getSeason, getDatePresentation, parseApiDate } = __mods["js/dateUtils.js"];
const { selectTodayFlower, simulateTodayFlowers, createMemoryStorage } = __mods["js/todayFlower.js"];
const { installRuntimeHooks } = __mods["js/runtimeHooks.js"];

const runtime = { forceNetworkFailure:false };
const devStorage = createMemoryStorage();
const SEOUL_OFFSET_MS=9*60*60*1000;
const DUPLICATE_CODES = new Set(['DUPLICATE_ID','DUPLICATE_SCIENTIFIC_NAME','ACCEPTED_NAME_CONFLICT','SYNONYM_CONFLICT','DATA_LINK_DUPLICATE']);
const IMAGE_CODES = new Set(['IMAGE_MISSING','IMAGE_PATH_INVALID','IMAGE_PATH_NOT_FOUND','IMAGE_MANIFEST_MISSING','IMAGE_FILENAME_INVALID','ORPHAN_IMAGE_FILE','STALE_IMAGE_PATH_REFERENCE','DATA_LINK_MISMATCH']);
const LICENSE_CODES = new Set(['LICENSE_MISSING']);

function setForceNetworkFailure(value) {
  if (!APP_CONFIG.DEV_MODE) return false;
  runtime.forceNetworkFailure = Boolean(value);
  return runtime.forceNetworkFailure;
}
function shouldForceNetworkFailure() { return APP_CONFIG.DEV_MODE && runtime.forceNetworkFailure; }
function getDevPayload() { return APP_CONFIG.DEV_MODE && globalThis.__FLOWER_APP_DEV_PAYLOAD__ ? globalThis.__FLOWER_APP_DEV_PAYLOAD__ : null; }
function getDevTodayFlowerStorage() { return devStorage; }
function resetDevTodayFlowerStorage() {
  for (const key of Object.keys(devStorage.snapshot())) devStorage.removeItem(key);
  return devStorage;
}

const clean=value=>String(value??'').trim();
const norm=value=>clean(value).replace(/\s+/g,' ').toLocaleLowerCase('en-US');
function duplicateGroups(rows,keyFn) {
  const map=new Map();
  for(const row of rows){const key=keyFn(row);if(!key)continue;if(!map.has(key))map.set(key,[]);map.get(key).push(row);}
  return [...map.entries()].filter(([,items])=>items.length>1);
}
function runDuplicateCheck(flowers=[]) {
  const issues=[];
  for(const [value,rows] of duplicateGroups(flowers,row=>clean(row.id))) issues.push(`ID 중복: ${value} (${rows.length}건)`);
  for(const [value,rows] of duplicateGroups(flowers,row=>norm(row.scientificName))) issues.push(`학명 중복: ${value} · ${rows.map(row=>row.id).join(', ')}`);
  const identities=flowers.map(getFlowerTaxonIdentity).filter(Boolean);
  for(const [value,rows] of duplicateGroups(identities,row=>norm(row.acceptedScientificName))) {
    const ids=[...new Set(rows.map(row=>row.id).filter(Boolean))];
    if(ids.length>1) issues.push(`accepted name 충돌: ${value} · ${ids.join(', ')}`);
  }
  const synonyms=new Map();
  for(const identity of identities){
    const accepted=norm(identity.acceptedScientificName);
    for(const synonym of identity.synonyms||[]){const key=norm(synonym);if(!key)continue;if(!synonyms.has(key))synonyms.set(key,[]);synonyms.get(key).push({id:identity.id,accepted});}
  }
  for(const [value,owners] of synonyms){
    const accepted=[...new Set(owners.map(row=>row.accepted).filter(Boolean))];
    if(accepted.length>1) issues.push(`synonym 충돌: ${value} · ${owners.map(row=>row.id).join(', ')}`);
  }
  return { ok:issues.length===0, issues };
}
function payloadIssues(codes) {
  const issues=getDevPayload()?.audit?.issues;
  return Array.isArray(issues) ? issues.filter(item=>codes.has(item.code)) : [];
}
function formatBuildCheck(title,codes,extra='') {
  const payload=getDevPayload();
  if(!payload) return `${title}\nDEV 빌드 검사 정보를 찾지 못했어요.`;
  const issues=payloadIssues(codes);
  const lines=[title,`검출: ${issues.length}건`];
  if(extra) lines.push(extra);
  if(!issues.length) lines.push('현재 빌드 기준 문제 없음');
  else issues.forEach(item=>lines.push(`${item.code} · ${item.flowerId||item.path||item.value||item.message}`));
  return lines.join('\n');
}
function runDevAudit(kind,flowers=[]) {
  if(!APP_CONFIG.DEV_MODE) return '';
  const payload=getDevPayload();
  if(kind==='duplicates') {
    const live=runDuplicateCheck(flowers);
    const build=payloadIssues(DUPLICATE_CODES);
    return ['데이터 중복 검사',`실시간 꽃 데이터: ${live.issues.length}건`,`빌드 연결 검사: ${build.length}건`,...(live.issues.length?live.issues:['현재 중복/충돌 문제 없음']),...build.map(item=>`${item.code} · ${item.flowerId||item.value||item.message}`)].join('\n');
  }
  if(kind==='images') {
    const count=Array.isArray(payload?.imageAssets?.assets)?payload.imageAssets.assets.length:0;
    return formatBuildCheck('이미지 누락 검사',IMAGE_CODES,`이미지 manifest: ${count}개`);
  }
  if(kind==='licenses') {
    const count=Array.isArray(payload?.externalImages?.images)?payload.externalImages.images.length:0;
    return formatBuildCheck('라이선스 누락 검사',LICENSE_CODES,`외부 이미지 메타데이터: ${count}개`);
  }
  return '';
}

function createState(now=new Date()) {
  return {
    devTodayFlowerDate: getDatePresentation(now).day,
    devTodayFlowerDateMode: 'auto',
    devTodayFlowerReport: '',
    devAuditReport: '',
    devNetworkFailure: false,
    devLongTextTest: false,
    devTextSizeOverride: '',
    devRelayScenario: '',
    devObservationSaveFailure: false
  };
}

function devTodayDate(state) {
  return parseApiDate(state.devTodayFlowerDate) || state.currentDate;
}

function shiftDevTodayDate(state, offset, render) {
  const base=devTodayDate(state);
  const next=new Date(base.getFullYear(),base.getMonth(),base.getDate()+offset,12);
  state.devTodayFlowerDate=getDatePresentation(next).day;
  state.devTodayFlowerDateMode='manual';
  state.devTodayFlowerReport='';
  render();
}

function syncDevTodayFlowerDate(state,now=new Date()) {
  if(state.devTodayFlowerDateMode==='manual') return false;
  const today=getDatePresentation(now).day;
  if(state.devTodayFlowerDate===today) return false;
  state.devTodayFlowerDate=today;
  state.devTodayFlowerReport='';
  return true;
}

function millisecondsUntilNextSeoulDay(now=new Date()) {
  const current=now instanceof Date ? now : new Date(now);
  const [year,month,day]=getDatePresentation(current).day.split('-').map(Number);
  const nextMidnight=Date.UTC(year,month-1,day+1)-SEOUL_OFFSET_MS;
  return Math.max(1000,nextMidnight-current.getTime()+1000);
}

function startDevTodayFlowerDateTracking({refreshCurrentDate,now=()=>new Date(),setTimer=setTimeout,clearTimer=clearTimeout}={}) {
  if(!APP_CONFIG.DEV_MODE || typeof refreshCurrentDate!=='function') return ()=>{};
  let timer=null;
  const schedule=()=>{
    if(timer!==null) clearTimer(timer);
    timer=setTimer(()=>{timer=null;refreshCurrentDate();schedule();},millisecondsUntilNextSeoulDay(now()));
  };
  schedule();
  return ()=>{if(timer!==null){clearTimer(timer);timer=null;}};
}

function formatTodaySimulation(rows) {
  const seen=new Map();
  const duplicateRows=[];
  rows.forEach((row)=>{
    if(!row.flowerId) return;
    if(!seen.has(row.cycle)) seen.set(row.cycle,new Set());
    const cycleSeen=seen.get(row.cycle);
    if(cycleSeen.has(row.flowerId)) duplicateRows.push(`${row.day}:${row.flowerId}`);
    cycleSeen.add(row.flowerId);
  });
  const lines=rows.map(row=>`${row.day} | cycle ${row.cycle} | ${row.flowerId || '(없음)'} | 후보 ${row.candidateCount}`);
  return ['30일 시뮬레이션',...lines,`같은 사이클 중복: ${duplicateRows.length ? duplicateRows.join(', ') : '없음'}`].join('\n');
}

function runTodayTest(state, kind, render) {
  const date=devTodayDate(state);
  if(kind==='simulate') {
    state.devTodayFlowerReport=formatTodaySimulation(simulateTodayFlowers({flowers:FLOWERS,startDate:date,days:30,storage:createMemoryStorage()}));
  } else if(kind==='zero') {
    const result=selectTodayFlower({flowers:[],date,storage:createMemoryStorage()});
    state.devTodayFlowerReport=`후보 0개 테스트\n선택 ID: ${result.flowerId || '(없음)'}\n후보 수: ${result.candidateIds.length}\n통과: ${!result.flowerId && result.candidateIds.length===0 ? '예' : '아니오'}`;
  } else if(kind==='one') {
    const only={id:'__dev-only-flower__',bloom:{start:'01-01',end:'12-31'}};
    const rows=simulateTodayFlowers({flowers:[only],startDate:date,days:4,storage:createMemoryStorage()});
    state.devTodayFlowerReport=['후보 1개 테스트',...rows.map(row=>`${row.day} | cycle ${row.cycle} | ${row.flowerId}`),`통과: ${rows.every(row=>row.flowerId===only.id) ? '예' : '아니오'}`].join('\n');
  } else if(kind==='boundary') {
    const year=date.getFullYear();
    const pairs=[[2,28,3,1],[5,31,6,1],[8,31,9,1],[11,30,12,1]];
    const lines=['계절 경계 테스트'];
    pairs.forEach(([m1,d1,m2,d2])=>{
      const storage=createMemoryStorage();
      const a=new Date(year,m1-1,d1,12),b=new Date(year,m2-1,d2,12);
      const first=selectTodayFlower({flowers:FLOWERS,date:a,storage});
      const second=selectTodayFlower({flowers:FLOWERS,date:b,storage});
      lines.push(`${getDatePresentation(a).day} ${getSeason(a)} | ${first.flowerId || '(없음)'} | 후보 ${first.candidateIds.length}`);
      lines.push(`${getDatePresentation(b).day} ${getSeason(b)} | ${second.flowerId || '(없음)'} | 후보 ${second.candidateIds.length}`);
    });
    state.devTodayFlowerReport=lines.join('\n');
  } else if(kind==='data-change') {
    const storage=createMemoryStorage();
    const first=selectTodayFlower({flowers:FLOWERS,date,storage});
    const added={id:'__dev-added-flower__',bloom:{start:'01-01',end:'12-31'}};
    const withAdded=selectTodayFlower({flowers:[...FLOWERS,added],date,storage});
    const nextDate=new Date(date.getFullYear(),date.getMonth(),date.getDate()+1,12);
    const nextWithAdded=selectTodayFlower({flowers:[...FLOWERS,added],date:nextDate,storage});
    const removable=nextWithAdded.candidateIds.find(id=>id!==nextWithAdded.flowerId) || nextWithAdded.flowerId;
    const withoutOne=selectTodayFlower({flowers:[...FLOWERS,added].filter(flower=>flower.id!==removable),date:new Date(date.getFullYear(),date.getMonth(),date.getDate()+2,12),storage});
    state.devTodayFlowerReport=[
      '데이터 추가/제거 테스트',
      `기준 선택: ${first.flowerId || '(없음)'}`,
      `같은 날 데이터 추가 후 선택 유지: ${withAdded.flowerId || '(없음)'} (${withAdded.flowerId===first.flowerId ? '통과' : '실패'})`,
      `추가 ID가 이후 후보에 포함: ${nextWithAdded.candidateIds.includes(added.id) ? '예' : '아니오'}`,
      `추가 ID가 현재 사이클 순서에 포함: ${nextWithAdded.cycleOrder.includes(added.id) ? '예' : '아니오'}`,
      `제거 ID: ${removable || '(없음)'}`,
      `제거 후 후보/순서에서 제외: ${removable && !withoutOne.candidateIds.includes(removable) && !withoutOne.cycleOrder.includes(removable) ? '예' : '아니오'}`
    ].join('\n');
  }
  render();
}

function handleAction({action,target,state,render,now=new Date()}) {
  switch(action) {
    case 'dev-today-prev': shiftDevTodayDate(state,-1,render); return true;
    case 'dev-today-next': shiftDevTodayDate(state,1,render); return true;
    case 'dev-today-reset': resetDevTodayFlowerStorage();state.devTodayFlowerDateMode='auto';state.devTodayFlowerDate=getDatePresentation(now).day;state.devTodayFlowerReport='';render();return true;
    case 'dev-today-simulate': runTodayTest(state,'simulate',render); return true;
    case 'dev-today-zero': runTodayTest(state,'zero',render); return true;
    case 'dev-today-one': runTodayTest(state,'one',render); return true;
    case 'dev-today-boundary': runTodayTest(state,'boundary',render); return true;
    case 'dev-today-data-change': runTodayTest(state,'data-change',render); return true;
    case 'dev-audit-duplicates': state.devAuditReport=runDevAudit('duplicates',FLOWERS);render();return true;
    case 'dev-audit-images': state.devAuditReport=runDevAudit('images',FLOWERS);render();return true;
    case 'dev-audit-licenses': state.devAuditReport=runDevAudit('licenses',FLOWERS);render();return true;
    case 'dev-network-failure': state.devNetworkFailure=!state.devNetworkFailure;setForceNetworkFailure(state.devNetworkFailure);state.devAuditReport=`강제 네트워크 실패: ${state.devNetworkFailure?'켜짐':'꺼짐'}\nDEV 메모리 상태만 변경했어요.`;render();return true;
    case 'dev-long-text': state.devLongTextTest=!state.devLongTextTest;render();return true;
    case 'dev-font-min': state.devTextSizeOverride='small';render();return true;
    case 'dev-font-max': state.devTextSizeOverride='large';render();return true;
    case 'dev-font-reset': state.devTextSizeOverride='';render();return true;
    case 'dev-relay-live': state.devRelayScenario='';render();return true;
    case 'dev-relay-scenario': state.devRelayScenario=target.dataset.scenario || '';render();return true;
    case 'dev-observation-save-failure': state.devObservationSaveFailure=!state.devObservationSaveFailure;render();return true;
    case 'dev-noop': return true;
    default: return false;
  }
}

function handleChange({input,state,render}) {
  if(input.dataset.action!=='dev-today-date') return false;
  const parsed=parseApiDate(input.value);
  if(parsed) {state.devTodayFlowerDate=getDatePresentation(parsed).day;state.devTodayFlowerDateMode='manual';state.devTodayFlowerReport='';render();}
  return true;
}

function createRelaySnapshot(base,targets,started,completedFlowerIds=[]) {
  const targetFlowerIds=targets.map(flower=>flower.id);
  const completedSet=new Set(completedFlowerIds);
  const nextFlowerId=targetFlowerIds.find(id=>!completedSet.has(id)) || '';
  const status=!targetFlowerIds.length?'empty':!started?'before':nextFlowerId?'active':'complete';
  return {...base,targets,targetFlowerIds,completedFlowerIds,nextFlowerId,total:targetFlowerIds.length,completedCount:completedFlowerIds.length,started,status,synthetic:true};
}

function relaySnapshot(base,state) {
  const scenario=state.devRelayScenario || '';
  if(!scenario) return base;
  if(scenario==='empty') return createRelaySnapshot(base,[],false);
  const targets=scenario==='shortage' ? base.targets.slice(0,Math.min(2,base.targets.length)) : base.targets;
  if(scenario==='before' || scenario==='shortage') return createRelaySnapshot(base,targets,false);
  const completedCount=scenario==='complete' ? targets.length : scenario==='partial' ? Math.max(0,targets.length-1) : Math.min(1,targets.length);
  return createRelaySnapshot(base,targets,true,targets.slice(0,completedCount).map(flower=>flower.id));
}

installRuntimeHooks({
  createState,
  resolveTextSize: (state,fallback) => state.devTextSizeOverride || fallback,
  beforeObservationSave: state => { if(state.devObservationSaveFailure) throw new Error('DEV 테스트: 관찰 기록 저장 실패'); },
  handleAction,
  handleChange,
  syncDateState: ({state,now}) => syncDevTodayFlowerDate(state,now),
  startDateTracking: startDevTodayFlowerDateTracking,
  todayFlowerContext: ({state,date,storage}) => ({date:parseApiDate(state.devTodayFlowerDate) || date,storage:getDevTodayFlowerStorage() || storage}),
  relaySnapshot,
  resolveSyntheticAction: (snapshot,action) => snapshot.synthetic ? 'dev-noop' : action,
  shouldForceNetworkFailure,
  renderSettingsExtra: state => __mods['js/ui/screens/devTools.js']?.renderDevTools?.(state) || null
});

return { setForceNetworkFailure, shouldForceNetworkFailure, getDevPayload, getDevTodayFlowerStorage, runDuplicateCheck, runDevAudit, createState, syncDevTodayFlowerDate, millisecondsUntilNextSeoulDay, startDevTodayFlowerDateTracking, handleAction, handleChange };
})();

__mods["js/devTools.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { getFlowerTaxonIdentity } = __mods["js/flowerDataPolicy.js"];

const runtime = { forceNetworkFailure:false };
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

return { setForceNetworkFailure, shouldForceNetworkFailure, getDevPayload, runDuplicateCheck, runDevAudit };
})();

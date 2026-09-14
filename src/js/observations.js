__mods["js/observations.js"] = (() => {
const { FLOWERS } = __mods["js/data.js"];
const { APP_CONFIG } = __mods["js/config.js"];
const KEY = 'flower-info.collection.v1';
const MAX_RECORDS = 120, MAX_PHOTO_CHARS = 90000, MAX_BYTES = 3 * 1024 * 1024;
const flowerIds = new Set(FLOWERS.map(flower => flower.id));
const fail = message => { throw new Error(message); };
function validDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
}
function normalizeObservation(raw, { legacy = false } = {}) {
  if (!raw || typeof raw !== 'object' || !flowerIds.has(raw.flowerId)) fail('도감에 없는 꽃 기록이 있어요.');
  if (typeof raw.identifiedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(raw.identifiedAt) || !Number.isFinite(Date.parse(raw.identifiedAt)) || new Date(raw.identifiedAt).toISOString() !== raw.identifiedAt) fail('기록 생성 날짜를 확인해 주세요.');
  const identifiedAt = new Date(raw.identifiedAt).toISOString();
  const observedOn = raw.observedOn || (legacy ? new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date(identifiedAt)) : '');
  if (!validDay(observedOn)) fail('관찰 날짜가 올바르지 않아요.');
  const id = raw.id || (legacy ? `legacy-${raw.flowerId}-${Date.parse(identifiedAt)}` : '');
  if (typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id)) fail('기록 ID를 확인해 주세요.');
  const note = raw.note ?? '';
  if (typeof note !== 'string' || note.length > 1000) fail('메모는 1,000자 이내로 입력해 주세요.');
  const photo = raw.photo ?? null;
  if (photo !== null && (typeof photo !== 'string' || photo.length > MAX_PHOTO_CHARS || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(photo))) fail('기록 사진 형식이나 크기를 확인해 주세요.');
  if (photo !== null) {
    const encoded=photo.split(',')[1];
    let binary;
    try { binary=atob(encoded); } catch { fail('사진 데이터가 손상되었어요.'); }
    if (encoded.length%4 || btoa(binary)!==encoded || !binary.startsWith('\xff\xd8\xff') || !binary.endsWith('\xff\xd9')) fail('사진 데이터가 손상되었어요.');
  }
  const confidence = raw.confidence ?? null;
  if (confidence !== null && (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1)) fail('식별 점수를 확인해 주세요.');
  return { id,flowerId:raw.flowerId,identifiedAt,observedOn,note,photo,confidence,
    selectedCandidate:typeof raw.selectedCandidate === 'string' ? raw.selectedCandidate.slice(0,160) : '' };
}
function normalizeCollection(raw, { legacy = false } = {}) {
  if (!raw || !Array.isArray(raw.records) || !Array.isArray(raw.favorites)) fail('기록 파일의 목록 형식이 올바르지 않아요.');
  if (raw.records.length > MAX_RECORDS || raw.favorites.length > FLOWERS.length) fail('가져올 기록 수가 너무 많아요.');
  if (raw.favorites.some(id => typeof id !== 'string' || !flowerIds.has(id))) fail('저장 목록에 도감에 없는 꽃이 있어요.');
  const records = raw.records.map(record => normalizeObservation(record,{legacy}));
  const ids = new Set(), identities = new Set();
  for (const record of records) {
    const identity = `${record.flowerId}|${record.identifiedAt}`;
    if (ids.has(record.id) || identities.has(identity)) fail('파일 안에 중복된 관찰 기록이 있어요.');
    ids.add(record.id); identities.add(identity);
  }
  return { schemaVersion:1, favorites:[...new Set(raw.favorites)],records };
}
function readCollection() {
  const saved = localStorage.getItem(KEY);
  if (saved !== null) {
    const parsed = JSON.parse(saved);
    if (parsed.schemaVersion !== 1) fail('저장된 기록 형식을 확인할 수 없어요. 기존 자료는 유지됩니다.');
    return normalizeCollection(parsed);
  }
  return normalizeCollection({ favorites:JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.favorites) || '[]'),
    records:JSON.parse(localStorage.getItem(APP_CONFIG.STORAGE_KEYS.discoveries) || '[]') },{legacy:true});
}
function loadCollection() {
  try { return { ...readCollection(),error:'' }; }
  catch { return { records:[],favorites:[],error:'저장된 기록을 읽지 못했어요. 브라우저 저장 권한과 기존 자료를 확인해 주세요.' }; }
}
function commit(collection) {
  const value = normalizeCollection(collection);
  const text = JSON.stringify(value);
  if (text.length * 2 > MAX_BYTES) fail('사진을 포함한 기록 저장 공간이 부족해요. 백업 후 불필요한 사진이나 기록을 정리해 주세요.');
  try { localStorage.setItem(KEY,text); }
  catch { fail('브라우저 저장 공간이나 권한 때문에 저장하지 못했어요. 기존 기록은 유지됩니다.'); }
  return { ok:true,collection:value };
}
function mutate(update) {
  try { return commit(update(readCollection())); }
  catch (error) { return {ok:false,error:error.message || '기록을 저장하지 못했어요.'}; }
}
function addObservation(raw) {
  return mutate(current => {
    const record = normalizeObservation(raw);
    if (current.records.some(item => item.id === record.id || (item.flowerId === record.flowerId && item.identifiedAt === record.identifiedAt))) fail('이미 저장된 기록이에요.');
    if (current.records.length >= MAX_RECORDS) fail('관찰 기록은 120개까지 저장할 수 있어요. 먼저 백업 후 정리해 주세요.');
    return { ...current,records:[record,...current.records] };
  });
}
function updateObservation(id, changes) {
  return mutate(current => {
    if (!current.records.some(item => item.id === id)) fail('수정할 기록을 찾지 못했어요.');
    return { ...current,records:current.records.map(item => item.id === id ? normalizeObservation({ ...item,...changes,id:item.id,identifiedAt:item.identifiedAt }) : item) };
  });
}
function deleteObservation(id) { return mutate(current => ({ ...current,records:current.records.filter(item => item.id !== id) })); }
function persistFavorites(favorites) { return mutate(current => ({ ...current,favorites })); }
function exportBackup() { return JSON.stringify({ format:'flower-guide-backup',version:1,exportedAt:new Date().toISOString(),...readCollection() },null,2); }
function parseBackup(text) {
  if (typeof text !== 'string' || text.length * 2 > MAX_BYTES + 200000) fail('백업 파일이 너무 커요.');
  let raw;
  try { raw=JSON.parse(text); } catch { fail('올바른 JSON 백업 파일을 선택해 주세요.'); }
  if (raw?.format !== 'flower-guide-backup' || raw.version !== 1 || raw.schemaVersion !== 1) fail('꽃을 보다 백업 버전 1 파일만 가져올 수 있어요.');
  return normalizeCollection(raw);
}
function mergeCollections(current, incoming) {
  const ids=new Set(current.records.map(record=>record.id));
  const identities=new Set(current.records.map(record=>`${record.flowerId}|${record.identifiedAt}`));
  const additions=incoming.records.filter(record=>!ids.has(record.id) && !identities.has(`${record.flowerId}|${record.identifiedAt}`));
  return { collection:{ schemaVersion:1,favorites:[...new Set([...current.favorites,...incoming.favorites])],records:[...additions,...current.records] },
    addedRecords:additions.length,skippedRecords:incoming.records.length-additions.length,
    addedFavorites:incoming.favorites.filter(id=>!current.favorites.includes(id)).length };
}
function previewImport(incoming) { return mergeCollections(readCollection(),normalizeCollection(incoming)); }
function importBackup(incoming) {
  try {
    const merged=previewImport(incoming), result=commit(merged.collection);
    return { ...result,addedRecords:merged.addedRecords,skippedRecords:merged.skippedRecords,addedFavorites:merged.addedFavorites };
  } catch(error) { return {ok:false,error:error.message}; }
}
async function createThumbnail(file) {
  if (!file || !['image/jpeg','image/png','image/webp'].includes(file.type) || file.size > 12*1024*1024) fail('12MB 이하의 JPEG·PNG·WebP 사진을 선택해 주세요.');
  const url=URL.createObjectURL(file);
  try {
    const img=new Image(); img.src=url; await img.decode();
    if (!img.naturalWidth || !img.naturalHeight) fail('사진을 읽을 수 없어요.');
    const canvas=document.createElement('canvas');
    for(const edge of [480,320]) {
      const scale=Math.min(1,edge/Math.max(img.naturalWidth,img.naturalHeight));
      canvas.width=Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
      const context=canvas.getContext('2d');
      if(!context) fail('사진을 저장용으로 변환하지 못했어요.');
      context.fillStyle='#ffffff'; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(img,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL('image/jpeg',0.68);
      if(data.length<=MAX_PHOTO_CHARS) return data;
    }
    fail('사진이 저장하기에 너무 커요. 다른 사진을 선택해 주세요.');
  } finally { URL.revokeObjectURL(url); }
}
return { loadCollection,addObservation,updateObservation,deleteObservation,persistFavorites,exportBackup,parseBackup,previewImport,importBackup,createThumbnail,normalizeObservation,MAX_RECORDS,MAX_BYTES };
})();

__mods["js/flowerRelay.js"] = (() => {
const { getDatePresentation } = __mods["js/dateUtils.js"];
const { getTodayFlowerCandidates, deterministicShuffle } = __mods["js/todayFlower.js"];

const RELAY_KEY = 'flower-info.relay.v1';
const MAX_TARGETS = 3;

function relayDay(date = new Date()) {
  return getDatePresentation(date).day;
}

function selectRelayTargets(flowers, date = new Date(), limit = MAX_TARGETS) {
  const candidates = getTodayFlowerCandidates(flowers, date);
  const ids = candidates.map((flower) => flower.id).filter(Boolean).sort();
  const ordered = deterministicShuffle(ids, `flower-relay|${relayDay(date)}|${ids.join('|')}`);
  const selected = new Set(ordered.slice(0, Math.max(0, Math.min(MAX_TARGETS, limit))));
  return ordered.filter((id) => selected.has(id)).map((id) => candidates.find((flower) => flower.id === id)).filter(Boolean);
}

function parseRelayState(storage) {
  try {
    const raw = JSON.parse(storage?.getItem?.(RELAY_KEY) || 'null');
    if (!raw || raw.version !== 1 || !/^\d{4}-\d{2}-\d{2}$/.test(raw.day || '')) return null;
    if (!Array.isArray(raw.targetFlowerIds) || !raw.targetFlowerIds.length || raw.targetFlowerIds.length > MAX_TARGETS) return null;
    const targetFlowerIds = [...new Set(raw.targetFlowerIds.filter((id) => typeof id === 'string' && id))];
    if (targetFlowerIds.length !== raw.targetFlowerIds.length) return null;
    if (typeof raw.startedAt !== 'string' || !Number.isFinite(Date.parse(raw.startedAt))) return null;
    return { version:1,day:raw.day,targetFlowerIds,startedAt:new Date(raw.startedAt).toISOString() };
  } catch {
    return null;
  }
}

function saveRelayState(storage, value) {
  try {
    if (typeof storage?.setItem !== 'function') return false;
    storage.setItem(RELAY_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function confirmedFlowerIds(records, relay) {
  if (!relay) return [];
  const started = Date.parse(relay.startedAt);
  const targets = new Set(relay.targetFlowerIds);
  const completed = new Set();
  for (const record of Array.isArray(records) ? records : []) {
    if (!targets.has(record?.flowerId) || Date.parse(record?.identifiedAt) < started) continue;
    if (typeof record?.selectedCandidate !== 'string' || !record.selectedCandidate.trim()) continue;
    completed.add(record.flowerId);
  }
  return relay.targetFlowerIds.filter((id) => completed.has(id));
}

function snapshotFrom({ targets, relay, records, synthetic = false, completedOverride = null }) {
  const targetFlowerIds = targets.map((flower) => flower.id);
  const completedFlowerIds = completedOverride || confirmedFlowerIds(records, relay);
  const completedSet = new Set(completedFlowerIds);
  const nextFlowerId = targetFlowerIds.find((id) => !completedSet.has(id)) || '';
  const started = Boolean(relay);
  const status = !targetFlowerIds.length ? 'empty' : !started ? 'before' : nextFlowerId ? 'active' : 'complete';
  return {
    day: relay?.day || '',targets,targetFlowerIds,completedFlowerIds,nextFlowerId,
    total:targetFlowerIds.length,completedCount:completedFlowerIds.length,started,status,synthetic
  };
}

function devSnapshot(base, scenario) {
  if (!scenario) return base;
  if (scenario === 'empty') return snapshotFrom({targets:[],relay:null,records:[],synthetic:true});
  const targets = scenario === 'shortage' ? base.targets.slice(0, Math.min(2, base.targets.length)) : base.targets;
  if (scenario === 'before' || scenario === 'shortage') return snapshotFrom({targets,relay:null,records:[],synthetic:true});
  const relay = {day:base.day,targetFlowerIds:targets.map((flower) => flower.id),startedAt:new Date(0).toISOString()};
  const completedCount = scenario === 'complete' ? targets.length : scenario === 'partial' ? Math.max(0, targets.length - 1) : Math.min(1, targets.length);
  return snapshotFrom({targets,relay,records:[],synthetic:true,completedOverride:targets.slice(0,completedCount).map((flower) => flower.id)});
}

function getFlowerRelaySnapshot({ flowers = [], date = new Date(), records = [], storage = globalThis.localStorage, devScenario = '' } = {}) {
  const day = relayDay(date);
  const previewTargets = selectRelayTargets(flowers, date);
  const stored = parseRelayState(storage);
  const relay = stored?.day === day && stored.targetFlowerIds.every((id) => flowers.some((flower) => flower.id === id)) ? stored : null;
  const targetIds = relay?.targetFlowerIds || previewTargets.map((flower) => flower.id);
  const targets = targetIds.map((id) => flowers.find((flower) => flower.id === id)).filter(Boolean);
  return devSnapshot(snapshotFrom({targets,relay,records}),devScenario);
}

function startFlowerRelay({ flowers = [], date = new Date(), storage = globalThis.localStorage, now = new Date() } = {}) {
  const day = relayDay(date);
  const existing = parseRelayState(storage);
  if (existing?.day === day && existing.targetFlowerIds.every((id) => flowers.some((flower) => flower.id === id))) return {ok:true,state:existing,created:false};
  const targetFlowerIds = selectRelayTargets(flowers,date).map((flower) => flower.id);
  if (!targetFlowerIds.length) return {ok:false,error:'지금 개화 중인 릴레이 후보가 없어요.'};
  const state = {version:1,day,targetFlowerIds,startedAt:new Date(now).toISOString()};
  return saveRelayState(storage,state)
    ? {ok:true,state,created:true}
    : {ok:false,error:'브라우저 저장 공간이나 권한 때문에 릴레이를 시작하지 못했어요.'};
}

return { RELAY_KEY,MAX_TARGETS,selectRelayTargets,parseRelayState,confirmedFlowerIds,getFlowerRelaySnapshot,startFlowerRelay };
})();

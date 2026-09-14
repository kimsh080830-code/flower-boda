__mods["js/todayFlower.js"] = (() => {
const { getBloomStatus, getDatePresentation, getSeason } = __mods["js/dateUtils.js"];

const DAILY_KEY = 'flower-info.today.v1';
const SEQUENCE_KEY = 'flower-info.today.sequence.v1';

function dayKey(date = new Date()) {
  return getDatePresentation(date).day;
}

function getTodayFlowerCandidates(flowers, date = new Date()) {
  return (Array.isArray(flowers) ? flowers : []).filter((flower) => {
    const code = getBloomStatus(flower?.bloom, date).code;
    return code === 'in-season' || code === 'ending';
  });
}

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextUint32(value) {
  let x = value >>> 0 || 0x9e3779b9;
  x ^= x << 13;
  x ^= x >>> 17;
  x ^= x << 5;
  return x >>> 0;
}

function deterministicShuffle(values, seedText) {
  const result = [...values];
  let seed = hashString(seedText) || 0x9e3779b9;
  for (let index = result.length - 1; index > 0; index -= 1) {
    seed = nextUint32(seed);
    const swapIndex = seed % (index + 1);
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function createMemoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial).map(([key, value]) => [key, String(value)]));
  return {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
    snapshot() { return Object.fromEntries(values); }
  };
}

const devStorage = createMemoryStorage();
function getDevTodayFlowerStorage() { return devStorage; }
function resetDevTodayFlowerStorage() {
  for (const key of Object.keys(devStorage.snapshot())) devStorage.removeItem(key);
  return devStorage;
}

function safeRead(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function uniqueCurrentIds(values, currentIds) {
  const allowed = new Set(currentIds);
  const seen = new Set();
  return (Array.isArray(values) ? values : []).filter((id) => {
    if (typeof id !== 'string' || !allowed.has(id) || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function normalizeHistory(history) {
  if (!history || Array.isArray(history) || typeof history !== 'object') return {};
  return Object.fromEntries(Object.entries(history).filter(([day, id]) => /^\d{4}-\d{2}-\d{2}$/.test(day) && typeof id === 'string'));
}

function normalizeState(raw, currentIds) {
  const value = raw && !Array.isArray(raw) && typeof raw === 'object' ? raw : {};
  return {
    version: 1,
    cycle: Number.isInteger(value.cycle) && value.cycle > 0 ? value.cycle : 0,
    used: uniqueCurrentIds(value.used, currentIds),
    remaining: uniqueCurrentIds(value.remaining, currentIds),
    history: normalizeHistory(value.history)
  };
}

function candidateSignature(ids) {
  return [...ids].sort().join('|');
}

function cycleSeed(cycle, date, ids) {
  return `today-flower|cycle:${cycle}|season:${getSeason(date)}|candidates:${candidateSignature(ids)}`;
}

function entrantSeed(cycle, date, ids) {
  return `today-flower|entrants:${cycle}|day:${dayKey(date)}|candidates:${candidateSignature(ids)}`;
}

function resultFor({ flowers, candidates, date, id, state, source }) {
  const flower = id ? flowers.find((item) => item.id === id) || null : null;
  return {
    day: dayKey(date),
    flower,
    flowerId: flower?.id || '',
    candidates,
    candidateIds: candidates.map((item) => item.id),
    cycle: state.cycle,
    cycleOrder: [...state.used, ...state.remaining],
    usedIds: [...state.used],
    remainingIds: [...state.remaining],
    source
  };
}

function selectTodayFlower({ flowers, date = new Date(), storage = globalThis.localStorage } = {}) {
  const rows = Array.isArray(flowers) ? flowers : [];
  const candidates = getTodayFlowerCandidates(rows, date);
  const ids = candidates.map((flower) => flower.id).filter((id) => typeof id === 'string' && id).sort();
  const today = dayKey(date);
  let state = normalizeState(safeRead(storage, SEQUENCE_KEY, null), ids);

  const legacyDaily = safeRead(storage, DAILY_KEY, null);
  const hasHistory = Object.prototype.hasOwnProperty.call(state.history, today);
  const legacyMatchesDay = legacyDaily?.day === today && typeof legacyDaily.id === 'string';
  const rememberedId = hasHistory ? state.history[today] : (legacyMatchesDay ? legacyDaily.id : null);
  if (rememberedId === '') {
    safeWrite(storage, SEQUENCE_KEY, state);
    safeWrite(storage, DAILY_KEY, { day: today, id: '' });
    return resultFor({ flowers: rows, candidates, date, id: '', state, source: 'cached-empty' });
  }
  if (rememberedId && ids.includes(rememberedId)) {
    if (!state.cycle) {
      state.cycle = 1;
      state.used = [rememberedId];
      state.remaining = deterministicShuffle(ids.filter((id) => id !== rememberedId), cycleSeed(state.cycle, date, ids));
    } else if (!state.used.includes(rememberedId) && !state.remaining.includes(rememberedId)) {
      state.used.push(rememberedId);
    }
    state.history[today] = rememberedId;
    safeWrite(storage, SEQUENCE_KEY, state);
    safeWrite(storage, DAILY_KEY, { day: today, id: rememberedId });
    return resultFor({ flowers: rows, candidates, date, id: rememberedId, state, source: 'cached' });
  }

  if (!ids.length) {
    state.used = [];
    state.remaining = [];
    state.history[today] = '';
    safeWrite(storage, SEQUENCE_KEY, state);
    safeWrite(storage, DAILY_KEY, { day: today, id: '' });
    return resultFor({ flowers: rows, candidates, date, id: '', state, source: 'empty' });
  }

  state.used = uniqueCurrentIds(state.used, ids);
  state.remaining = uniqueCurrentIds(state.remaining, ids).filter((id) => !state.used.includes(id));

  if (!state.cycle) {
    state.cycle = 1;
    state.used = [];
    state.remaining = deterministicShuffle(ids, cycleSeed(state.cycle, date, ids));
  } else {
    const known = new Set([...state.used, ...state.remaining]);
    const entrants = ids.filter((id) => !known.has(id));
    if (entrants.length) state.remaining.push(...deterministicShuffle(entrants, entrantSeed(state.cycle, date, ids)));
    if (!state.remaining.length) {
      state.cycle += 1;
      state.used = [];
      state.remaining = deterministicShuffle(ids, cycleSeed(state.cycle, date, ids));
    }
  }

  const selectedId = state.remaining.shift() || '';
  if (selectedId) state.used.push(selectedId);
  state.history[today] = selectedId;
  safeWrite(storage, SEQUENCE_KEY, state);
  safeWrite(storage, DAILY_KEY, { day: today, id: selectedId });
  return resultFor({ flowers: rows, candidates, date, id: selectedId, state, source: 'new-day' });
}

function simulateTodayFlowers({ flowers, startDate = new Date(), days = 30, storage = createMemoryStorage() } = {}) {
  const count = Math.max(0, Math.min(366, Number(days) || 0));
  const start = new Date(startDate);
  const rows = [];
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + offset, 12);
    const selection = selectTodayFlower({ flowers, date, storage });
    rows.push({
      day: selection.day,
      flowerId: selection.flowerId,
      candidateCount: selection.candidateIds.length,
      cycle: selection.cycle,
      cycleOrder: selection.cycleOrder
    });
  }
  return rows;
}

return {
  DAILY_KEY,
  SEQUENCE_KEY,
  dayKey,
  getTodayFlowerCandidates,
  deterministicShuffle,
  createMemoryStorage,
  getDevTodayFlowerStorage,
  resetDevTodayFlowerStorage,
  selectTodayFlower,
  simulateTodayFlowers
};
})();

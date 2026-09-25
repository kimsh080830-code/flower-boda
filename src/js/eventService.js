__mods["js/eventService.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { hooks:runtimeHooks } = __mods["js/runtimeHooks.js"];
const { FLOWERS } = __mods["js/data.js"];
const { getCache, setCache } = __mods["js/storage.js"];
const { getEventStatus, parseApiDate } = __mods["js/dateUtils.js"];
const { normalizeSearch } = __mods["js/searchUtils.js"];

const RELEVANCE = Object.freeze({
  exactFlower: 8,
  directKeyword: 4,
  genericFlowerKeyword: 1,
  threshold: 3
});

const KOREA_REGIONS = Object.freeze(['서울','부산','대구','인천','광주','대전','울산','세종','경기','강원','충북','충남','전북','전남','경북','경남','제주']);
const REGION_ALIASES = Object.freeze({
  '서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종',
  '경기도':'경기','강원도':'강원','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전라북도':'전북','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주도':'제주','제주특별자치도':'제주'
});
function normalizeRegionName(value='') {
  const text = safeString(value);
  if (!text) return '';
  const province = text.split(/\s+/)[0];
  // Match an administrative token, not a prefix of an unfamiliar source name.
  return Object.hasOwn(REGION_ALIASES, province) ? REGION_ALIASES[province] : province;
}
function inferSubRegion(address='', region='') {
  const parts = safeString(address).split(/\s+/).filter(Boolean);
  if (parts.length < 2) return '';
  const first = normalizeRegionName(parts[0]);
  const index = first === region || REGION_ALIASES[parts[0]] === region ? 1 : 0;
  const candidate = parts[index] || '';
  return /(?:시|군|구)$/.test(candidate) ? candidate : '';
}

function safeString(value) {
  return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
}

function safeCoordinate(value, min, max) {
  const text = safeString(value);
  if (!text) return null;
  const number = Number(text);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}

function safeEventUrl(value) {
  try {
    const url = new URL(safeString(value));
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

function normalizeEvent(raw, source = 'api') {
  if (!raw || typeof raw !== 'object') return null;
  const title = safeString(raw.title || raw.eventName);
  if (!title) return null;
  const address1 = safeString(raw.addr1 || raw.address1);
  const address2 = safeString(raw.addr2 || raw.address2);
  const address = safeString(raw.address || [address1, address2].filter(Boolean).join(' '));
  const regionFromAddress = address ? address.split(/\s+/)[0] : '';
  const region = normalizeRegionName(raw.region || raw.areaName || regionFromAddress);
  const latitude = safeCoordinate(raw.latitude ?? raw.mapy, -90, 90);
  const longitude = safeCoordinate(raw.longitude ?? raw.mapx, -180, 180);
  const normalized = {
    id: safeString(raw.id || raw.contentid || `${source}-${title}-${raw.startDate || raw.eventstartdate || ''}`),
    title,
    startDate: safeString(raw.startDate || raw.eventstartdate),
    endDate: safeString(raw.endDate || raw.eventenddate),
    region,
    subRegion: safeString(raw.subRegion || raw.sigunguName) || inferSubRegion(address, region) || inferSubRegion(raw.areaName, region),
    place: safeString(raw.place || raw.eventplace || raw.facilityName),
    address,
    latitude,
    longitude,
    description: safeString(raw.description || raw.overview),
    keywords: Array.isArray(raw.keywords) ? raw.keywords.map(safeString).filter(Boolean) : [],
    relatedFlowerIds: Array.isArray(raw.relatedFlowerIds) ? raw.relatedFlowerIds.map(safeString).filter(Boolean) : [],
    image: safeString(raw.image || raw.firstimage || raw.firstimage2),
    url: safeEventUrl(raw.url || raw.homepage || raw.eventhomepage),
    phone: safeString(raw.phone || raw.tel || raw.sponsor1tel),
    organizer: safeString(raw.organizer || raw.sponsor1 || raw.sponsor2),
    operatingHours: safeString(raw.operatingHours || raw.playtime),
    admissionFee: safeString(raw.admissionFee || raw.usetimefestival),
    sourceUrl: safeEventUrl(raw.sourceUrl),
    sourceModifiedAt: safeString(raw.sourceModifiedAt),
    category: safeString(raw.category),
    publicationStatus: safeString(raw.publicationStatus),
    verification: raw.verification && typeof raw.verification === 'object' ? { ...raw.verification } : { status:'list-only' },
    collectionQuality: raw.collectionQuality || null,
    detailError: safeString(raw.detailError),
    source
  };
  if (source === 'verified-snapshot') {
    const checked = Date.parse(normalized.verification.checkedAt);
    if (!Number.isFinite(checked) || checked > Date.now() + 60000 || Date.now() - checked > 7 * 86400000) normalized.verification.status = 'stale';
  }
  normalized.status = getEventStatus(normalized.startDate, normalized.endDate);
  if (/Cancel|취소/i.test(normalized.publicationStatus)) normalized.status = { code:'cancelled',label:'취소',rank:10 };
  else if (/Undetermined|미정|연기/i.test(normalized.publicationStatus)) normalized.status = { code:'unknown',label:'일정 확인 필요',rank:8 };
  return normalized;
}

function textForEvent(event) {
  return normalizeSearch([event.title, ...(event.keywords || [])].join(' '));
}

function calculateEventRelevance(event, flower) {
  if (!event || !flower || event.category === 'other') return 0;
  let score = 0;
  const text = textForEvent(event);
  if (event.relatedFlowerIds?.includes(flower.id)) score += RELEVANCE.exactFlower;
  const specificKeywords = [flower.nameKo, flower.standardNameKo, flower.nameEn, ...(flower.alternateNames || []), ...(flower.eventKeywords || [])]
    .map(normalizeSearch).filter(Boolean);
  for (const keyword of new Set(specificKeywords)) {
    if (!text.includes(keyword)) continue;
    score += keyword === normalizeSearch(flower.nameKo) ? RELEVANCE.exactFlower : RELEVANCE.directKeyword;
  }
  if (/꽃|정원|식물원|수목원|화훼/.test(text)) score += RELEVANCE.genericFlowerKeyword;
  return score;
}

function calculateGeneralFlowerRelevance(event) {
  if (event.category === 'other') return 0;
  if (['flower', 'garden'].includes(event.category)) return RELEVANCE.threshold;
  return FLOWERS.reduce((max, flower) => Math.max(max, calculateEventRelevance(event, flower)), 0);
}

function eventCanBeRecommended(event) {
  return !['unknown', 'cancelled'].includes(event.status?.code) &&
    !['stale', 'needs-review'].includes(event.verification?.status);
}

function canUseEventSchedule(event) {
  return eventCanBeRecommended(event) && !event.detailError && ['ongoing','upcoming'].includes(event.status?.code) &&
    ['source-checked','detail-checked'].includes(event.verification?.status);
}

function eventDateKey(value) {
  return parseApiDate(value) ? String(value).replace(/[^0-9]/g, '') : '';
}

function matchesEventDateFilter(event, filter = {}) {
  const start = eventDateKey(event.startDate);
  const end = eventDateKey(event.endDate);
  if (filter.date) {
    const selected = eventDateKey(filter.date);
    if (!selected || !start || !end || selected < start || selected > end) return false;
  }
  return true;
}

function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.status.rank !== b.status.rank) return a.status.rank - b.status.rank;
    return (a.startDate || '99999999').localeCompare(b.startDate || '99999999');
  });
}

async function fetchEventsFromBackend({ signal } = {}) {
  let response;
  try {
    response = await fetch(APP_CONFIG.API.events, { signal, headers: { 'Accept': 'application/json' } });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    const networkError = new Error('NETWORK');
    networkError.userMessage = APP_CONFIG.IS_RENDER_API
      ? 'Render 행사 서버가 준비 중이거나 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.'
      : '행사 서버에 연결하지 못했어요. 네트워크 상태를 확인한 뒤 다시 시도해 주세요.';
    throw networkError;
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const apiError = new Error(payload?.error || 'API_ERROR');
    apiError.userMessage = typeof payload?.message === 'string' && payload.message.trim()
      ? payload.message.trim().slice(0, 160)
      : APP_CONFIG.IS_RENDER_API && !payload && [502, 503, 504].includes(response.status)
        ? 'Render 행사 서버가 준비 중이에요. 잠시 기다린 뒤 다시 시도해 주세요.'
        : '행사 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    throw apiError;
  }
  if (!payload || !Array.isArray(payload.events)) {
    const invalidError = new Error('INVALID_RESPONSE');
    invalidError.userMessage = '행사 서버의 응답 형식을 확인하지 못했어요. 다시 시도해 주세요.';
    throw invalidError;
  }
  return payload.events.map((item) => normalizeEvent({ ...item, collectionQuality: payload.quality },
    payload.source === 'verified-snapshot' ? 'verified-snapshot' : 'api')).filter(Boolean);
}

async function getEventDetail(event, { signal } = {}) {
  if (!event?.id || APP_CONFIG.STANDALONE || (typeof navigator !== 'undefined' && navigator.onLine === false)) return event;
  const failedDetail = (message='최신 상세 정보를 확인하지 못했어요. 목록에서 받은 정보는 유지했어요. 다시 시도하거나 출처의 안내를 확인해 주세요.') => ({ ...event, detailError:message });
  const params = new URLSearchParams({ contentId: event.id, contentTypeId: '15' });
  let response;
  try {
    response = await fetch(`${APP_CONFIG.API.eventDetail}?${params}`, { signal, headers: { 'Accept': 'application/json' } });
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return failedDetail(APP_CONFIG.IS_RENDER_API
      ? 'Render 행사 서버가 준비 중이거나 연결이 지연되고 있어요. 잠시 후 다시 상세를 확인해 주세요.'
      : undefined);
  }
  if (!response.ok) {
    const errorPayload = typeof response.json === 'function' ? await response.json().catch(() => null) : null;
    if (APP_CONFIG.IS_RENDER_API && !errorPayload && [502, 503, 504].includes(response.status)) {
      return failedDetail('Render 행사 서버가 준비 중이에요. 잠시 후 다시 상세를 확인해 주세요.');
    }
    return failedDetail(typeof errorPayload?.message === 'string' && errorPayload.message.trim()
      ? errorPayload.message.trim().slice(0, 160)
      : undefined);
  }
  const payload = await response.json().catch(() => null);
  if (!payload || typeof payload !== 'object' ||
    !['source-checked', 'detail-checked', 'stale'].includes(payload.verification?.status) ||
    (safeString(payload.id || payload.contentid) && safeString(payload.id || payload.contentid) !== event.id)) return failedDetail();
  // Normalize API aliases first so fresh detail values override normalized list fields.
  const detail = normalizeEvent({ ...payload, id:event.id, collectionQuality:event.collectionQuality,
    sourceUrl:payload.sourceUrl || event.sourceUrl, category:payload.category || event.category }, event.source || 'api');
  if (!detail) return failedDetail();
  const merged = { ...event, ...Object.fromEntries(Object.entries(detail).filter(([key, value]) =>
    !['status', 'detailError'].includes(key) && value != null && value !== '' && (!Array.isArray(value) || value.length))) };
  return normalizeEvent({ ...merged, detailError:'' }, event.source || 'api') || failedDetail();
}

async function getEvents({ force = false, signal } = {}) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (runtimeHooks.shouldForceNetworkFailure()) { const error=new Error('NETWORK_UNAVAILABLE'); error.userMessage='네트워크 연결을 확인해 주세요.'; throw error; }
  const snapshot = () => sortEvents(__mods['js/eventSnapshot.js'].EVENT_SNAPSHOT.events.map(item=>normalizeEvent(item,'verified-snapshot')).filter(Boolean));
  if (APP_CONFIG.STANDALONE) return snapshot();
  const cacheKey='events.v3.api';
  const cached=getCache(cacheKey);
  if (!force && Array.isArray(cached) && cached.every(item=>['api','verified-snapshot'].includes(item?.source) && item.verification))
    return sortEvents(cached.map(item=>normalizeEvent(item,item.source)).filter(Boolean));
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (force) {
      const offlineError = new Error('OFFLINE');
      offlineError.userMessage = '최신 행사 업데이트는 인터넷 연결이 필요해요. 연결한 뒤 다시 시도해주세요.';
      throw offlineError;
    }
    return snapshot();
  }
  const events=await fetchEventsFromBackend({signal});
  setCache(cacheKey,events,APP_CONFIG.EVENT_CACHE_TTL_MS);
  return sortEvents(events);
}

function getRecommendedEvents(events, { includeEnded = false, includeUnverified = includeEnded } = {}) {
  return sortEvents(events.filter((event) => {
    if (!includeUnverified && !eventCanBeRecommended(event)) return false;
    if (!includeEnded && event.status.code === 'ended') return false;
    return calculateGeneralFlowerRelevance(event) >= RELEVANCE.threshold;
  }));
}

function getOngoingEvents(events, { region = '' } = {}) {
  return getRecommendedEvents(events).filter((event) => {
    if (event.status.code !== 'ongoing') return false;
    return !region || event.region === region;
  });
}

function getRelatedEvents(events, flower, { includeEnded = false } = {}) {
  if (!flower) return [];
  return events
    .map((event) => ({ event, relevance: calculateEventRelevance(event, flower) }))
    .filter(({ event, relevance }) => relevance >= RELEVANCE.threshold && (includeEnded || (eventCanBeRecommended(event) && event.status.code !== 'ended')))
    .sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      if (a.event.status.rank !== b.event.status.rank) return a.event.status.rank - b.event.status.rank;
      return (a.event.startDate || '99999999').localeCompare(b.event.startDate || '99999999');
    })
    .map(({ event }) => event);
}

function getDirectFlowerEvents(events, flower, { includeEnded = false } = {}) {
  if (!flower) return [];
  const names = [flower.nameKo, flower.standardNameKo, flower.nameEn, ...(flower.alternateNames || [])]
    .map(normalizeSearch)
    .filter((name) => name.length >= 2);
  return sortEvents(events.filter((event) => {
    if (!includeEnded && !eventCanBeRecommended(event)) return false;
    if (event.category === 'other') return false;
    if (!includeEnded && event.status.code === 'ended') return false;
    if (event.relatedFlowerIds?.includes(flower.id)) return true;
    const text = textForEvent(event);
    return names.some((name) => text.includes(name));
  }));
}

const EVENT_RELEVANCE_CONFIG = RELEVANCE;
return { "canUseEventSchedule": canUseEventSchedule, "normalizeEvent": normalizeEvent, "calculateEventRelevance": calculateEventRelevance, "getEvents": getEvents, "getEventDetail": getEventDetail, "getRecommendedEvents": getRecommendedEvents, "getOngoingEvents": getOngoingEvents, "getRelatedEvents": getRelatedEvents, "getDirectFlowerEvents": getDirectFlowerEvents, "KOREA_REGIONS": KOREA_REGIONS, "normalizeRegionName": normalizeRegionName, "matchesEventDateFilter": matchesEventDateFilter, "EVENT_RELEVANCE_CONFIG": EVENT_RELEVANCE_CONFIG };
})();

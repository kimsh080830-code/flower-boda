__mods["js/main.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { hooks:runtimeHooks } = __mods["js/runtimeHooks.js"];
const { FLOWERS, getFlowerById } = __mods["js/data.js"];
const { getSeason, getDatePresentation, parseApiDate } = __mods["js/dateUtils.js"];
const { requestCurrentPosition, fetchCurrentWeather, loadCurrentWeatherWithoutPrompt } = __mods["js/weatherService.js"];
const { resolveMapLocation } = __mods["js/mapService.js"];
const { getFlowerPlaceById, getFlowerPlacesByFlowerId } = __mods["js/mapPlaces.js"];
const { getFlowerCourseById } = __mods["js/mapCourses.js"];
const { getFlowerRelaySnapshot, startFlowerRelay } = __mods["js/flowerRelay.js"];
const { analyzeFlower, preprocessImage, validateImageFile, FlowerServiceError } = __mods["js/flowerService.js"];
const { getEvents, getEventDetail } = __mods["js/eventService.js"];
const { getEventNotifications, loadEventNotificationReads, saveEventNotificationReads } = __mods['js/eventNotificationService.js'];
const { hydrateReferenceImages } = __mods["js/imageService.js"];
const { loadDiscoveries, loadFavorites, saveFavorites } = __mods["js/storage.js"];
const { loadCollection,addObservation,updateObservation,deleteObservation,exportBackup,parseBackup,previewImport,importBackup,createThumbnail } = __mods["js/observations.js"];
const { debounce } = __mods["js/searchUtils.js"];
const { renderApp, updateHomeSearchResults, updateEncyclopediaResults, updateEventResults } = __mods["js/ui.js"];

const {loadSettings,saveSettings,loadRecent,rememberFlower,clearRecent,loadVisits,saveVisits,applyTheme,applyTextSize}=__mods['js/preferences.js'];
const preferences = loadSettings();
function emptyFlowerFilters(overrides={}) {return {season:'',favoritesOnly:false,...overrides};}

const state = {
  settings: preferences,
  recentFlowerIds: loadRecent(),
  calendarMonths: {},
  savedVisitDates: loadVisits(),
  eventNotificationReads: loadEventNotificationReads(),
  eventNotifications: [],
  eventNotificationsError: '',
  notificationOpen: false,
  currentTab: 'home',
  mapViewMode: 'nearby',
  mapUserLocation: null,
  mapLocationStatus: 'idle',
  mapLocationError: '',
  mapSelectedPlaceId: '',
  mapSelectedCourseId: '',
  mapFlowerFilterId: '',
  currentDate: new Date(),
  currentSeason: getSeason(new Date()),
  currentWeather: null,
  currentWeatherStatus: 'loading',
  selectedFlower: null,
  selectedCandidateId: null,
  analysisResult: null,
  events: [],
  eventFilter: { date: '' },
  eventCalendarMonth: '',
  searchQuery: '',
  eventSearchQuery: '',
  encyclopediaFilters: emptyFlowerFilters(),
  encyclopediaSort: 'default',
  discoveredFlowers: loadDiscoveries(),
  favoriteFlowerIds: loadFavorites(),
  collectionError: loadCollection().error,
  observationsOpen: false,
  observationDraft: null,
  editingObservationId: '',
  pendingDeleteId: '',
  observationError: '',
  observationPhotoBusy: false,
  pendingImport: null,
  backupError: '',
  backupBusy: false,
  userRegion: preferences.region,
  loading: false,
  analysisLoadingVisible: false,
  analysisLoadingMessage: '',
  error: '',
  standalone: APP_CONFIG.STANDALONE,
  eventsLoading: true,
  eventsLoadingVisible: false,
  eventsError: '',
  eventVisitDates: loadVisits(),
  eventDetailLoading: false,
  photo: null,
  photoPrepareVisible: false,
  detail: null,
  filtersOpen: false,
  recentDetailsOpen: false,
  recentClearPending: false,
  photoPickerOpen: false,
  bloomCalendarOpen: false,
  bloomCalendarMonth: '',
  bloomCalendarSelectedDate: '',
  selectedBloomFlowerId: '',
  bloomCalendarShowAll: false,
  relayError: '',
  ...runtimeHooks.createState()
};

let analysisController = null;
let eventController = null;
let eventDetailController = null;
let photoPrepareToken = 0;
let referenceImageController = null;
let toastTimer = null;
let stopDateTracking = null;

function render() {
  const panels={'encyclopedia-filter-panel':'filtersOpen','recent-flower-panel':'recentDetailsOpen'};
  for(const [id,key] of Object.entries(panels)) {const node=document.getElementById(id);if(node)state[key]=node.open;}
  applyTheme(state.settings.theme);
  applyTextSize(runtimeHooks.resolveTextSize(state,state.settings.bodyTextSize));
  try {
    state.eventNotificationsError = state.eventsError || '';
    state.eventNotifications = state.eventNotificationsError || !state.settings.eventNotificationsEnabled ? [] : getEventNotifications({
      events: state.events,
      savedEventIds: state.savedVisitDates,
      readNotificationIds: state.eventNotificationReads,
      now: state.currentDate
    });
  } catch {
    state.eventNotifications = [];
    state.eventNotificationsError = '행사 알림을 만들지 못했어요. 다시 시도해 주세요.';
  }
  renderApp(state);
}

function setBloomCalendarMonth(value) {
  const calendar=__mods['js/calendar.js'];
  const fallback=state.currentDate instanceof Date ? state.currentDate : new Date();
  const normalized=calendar.monthKey(calendar.parseMonthKey(value,fallback));
  state.bloomCalendarMonth=normalized;
  if(state.bloomCalendarSelectedDate && !state.bloomCalendarSelectedDate.startsWith(`${normalized}-`)) state.bloomCalendarSelectedDate='';
  if(state.selectedBloomFlowerId) {
    const shown=calendar.parseMonthKey(normalized,fallback);
    const remainsCandidate=calendar.getBloomFlowersForMonth(shown.getFullYear(),shown.getMonth()+1).some(flower=>flower.id===state.selectedBloomFlowerId);
    if(!remainsCandidate) state.selectedBloomFlowerId='';
  }
}

function moveBloomCalendarMonth(offset) {
  const calendar=__mods['js/calendar.js'];
  const base=state.bloomCalendarMonth || __mods['js/dateUtils.js'].getDatePresentation(state.currentDate).day.slice(0,7);
  setBloomCalendarMonth(calendar.shiftMonthKey(base,offset,state.currentDate));
  render();
}

function setEventCalendarMonth(value) {
  const calendar=__mods['js/calendar.js'];
  const fallback=state.currentDate instanceof Date ? state.currentDate : new Date();
  state.eventCalendarMonth=calendar.monthKey(calendar.parseMonthKey(value,fallback));
}

function moveEventCalendarMonth(offset) {
  const calendar=__mods['js/calendar.js'];
  const base=state.eventCalendarMonth || state.eventFilter.date?.slice(0,7) || getDatePresentation(state.currentDate).day.slice(0,7);
  setEventCalendarMonth(calendar.shiftMonthKey(base,offset,state.currentDate));
  render();
}

function selectBloomRailFlower(target) {
  const flowerId=target.dataset.flowerId || '';
  if(!getFlowerById(flowerId)) return;
  state.selectedBloomFlowerId=flowerId;
  state.bloomCalendarShowAll=false;
  const rail=target.closest('.bloom-flower-rail');
  rail?.querySelectorAll('[data-action="select-bloom-flower"]').forEach(button=>{
    const selected=button.dataset.flowerId===flowerId;
    button.classList.toggle('is-selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
}

function renderBloomCalendarPreservingRail() {
  const previousRail=document.querySelector('.bloom-flower-rail');
  const scrollLeft=previousRail?.scrollLeft || 0;
  render();
  requestAnimationFrame(()=>{
    const rail=document.querySelector('.bloom-flower-rail');
    if(!rail) return;
    rail.scrollLeft=Math.min(scrollLeft,Math.max(0,rail.scrollWidth-rail.clientWidth));
    __mods['js/calendar.js'].syncBloomRailControls(rail.closest('.bloom-calendar-flower-section'));
  });
}

function scrollBloomFlowerRail(target) {
  const shell=target.closest('.bloom-flower-rail-shell');
  const rail=shell?.querySelector('.bloom-flower-rail');
  if(!rail) return;
  const direction=target.dataset.direction==='left' ? -1 : 1;
  const amount=Math.max(140,Math.floor(rail.clientWidth*.78));
  const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  rail.scrollBy({left:direction*amount,behavior:reduceMotion?'auto':'smooth'});
  requestAnimationFrame(()=>__mods['js/calendar.js'].syncBloomRailControls(shell));
}

function showToast(message) {
  document.querySelector('.app-toast')?.remove();
  clearTimeout(toastTimer);
  const toast = document.createElement('div');
  toast.className = 'app-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;
  document.body.append(toast);
  toastTimer = setTimeout(() => toast.remove(), 2600);
}

function setHistory({ replace = false } = {}) {
  const payload = { tab: state.currentTab, detail: state.detail };
  const hash = state.detail ? `#${state.detail.type}/${encodeURIComponent(state.detail.id)}` : `#${state.currentTab}`;
  history[replace ? 'replaceState' : 'pushState'](payload, '', hash);
}

const VALID_TABS = ['home', 'capture', 'events', 'map', 'encyclopedia', 'my', 'settings'];
const MAIN_NAV_TABS = ['home', 'events', 'map', 'encyclopedia', 'my'];
const MAIN_TAB_SWIPE_EXCLUDE = '[data-bloom-calendar-swipe="true"], [data-event-calendar-swipe="true"], .map-canvas, .bloom-flower-rail, .flower-rail, .image-gallery, .image-gallery-track, .slider, [role="slider"], [data-horizontal-scroll], input[type="range"], input, textarea, select';

function hasHorizontalGestureOwner(target) {
  if (target.closest?.(MAIN_TAB_SWIPE_EXCLUDE)) return true;
  for (let node = target instanceof Element ? target : null; node && node !== document.body; node = node.parentElement) {
    const style = getComputedStyle(node);
    if (/^(auto|scroll)$/.test(style.overflowX) && node.scrollWidth > node.clientWidth + 1) return true;
  }
  return false;
}

function normalizeTab(tab) {
  if (tab === 'seasonal') return 'encyclopedia';
  return VALID_TABS.includes(tab) ? tab : 'home';
}

function switchTab(tab, { fromHistory = false } = {}) {
  tab = normalizeTab(tab);
  const shouldPushHistory = state.currentTab !== tab || Boolean(state.detail);
  if (state.detail) state.detail = null;
  state.photoPickerOpen = false;
  state.currentTab = tab;
  state.error = '';
  if (!fromHistory && shouldPushHistory) setHistory();
  render();
  window.scrollTo({ top: 0, behavior: 'auto' });
}

async function requestMapUserLocation({geolocation=globalThis.navigator?.geolocation}={}) {
  if(!state.settings.locationEnabled) {
    state.mapUserLocation=null;
    state.mapLocationStatus='disabled';
    state.mapLocationError='';
    render();
    return;
  }
  if(state.mapLocationStatus==='checking') return;
  state.mapLocationStatus='checking';
  state.mapLocationError='';
  render();
  const result=await resolveMapLocation({geolocation,requestPosition:requestCurrentPosition});
  state.mapUserLocation=result.location;
  state.mapLocationStatus=result.status;
  state.mapLocationError=result.error;
  if(result.location) {
    render();
    void fetchCurrentWeather(result.location).then(weather=>{
      state.currentWeather=weather;
      state.currentWeatherStatus='ready';
      render();
    }).catch(()=>{});
  }
  else render();
}

function selectMapPlace(placeId) {
  if(!getFlowerPlaceById(placeId)) return false;
  state.mapSelectedPlaceId=placeId;
  render();
  return true;
}

function selectMapCourse(courseId) {
  const course=getFlowerCourseById(courseId);
  if(!course) return false;
  state.mapSelectedCourseId=course.id;
  state.mapSelectedPlaceId='';
  render();
  return true;
}

function showEventOnMap(placeId) {
  if(!getFlowerPlaceById(placeId)) return false;
  state.mapViewMode='nearby';
  state.mapFlowerFilterId='';
  state.mapSelectedPlaceId=placeId;
  switchTab('map');
  return true;
}

function showFlowerOnMap(flowerId) {
  const places=getFlowerPlacesByFlowerId(flowerId);
  if(!places.length) return false;
  state.mapViewMode='nearby';
  state.mapFlowerFilterId=flowerId;
  state.mapSelectedPlaceId=places[0].id;
  switchTab('map');
  return true;
}

function openFlowerDetail(flowerId, { fromHistory = false } = {}) {
  const flower = getFlowerById(flowerId);
  if (!flower) return;
  state.photoPickerOpen = false;
  state.recentFlowerIds = rememberFlower(flower.id,state.settings.recentEnabled);
  state.selectedFlower = flower;
  state.detail = { type: 'flower', id: flower.id };
  if (!fromHistory) setHistory();
  render();
  document.querySelector('.detail-layer')?.scrollTo(0, 0);
}

async function openEventDetail(eventId, { fromHistory = false } = {}) {
  const currentEvent = state.events.find((item) => item.id === eventId);
  if (!currentEvent) return;
  state.photoPickerOpen = false;
  state.detail = { type: 'event', id: eventId };
  if (!fromHistory) setHistory();
  eventDetailController?.abort();
  if (APP_CONFIG.STANDALONE) {
    eventDetailController = null;
    state.eventDetailLoading = false;
    render();
    return;
  }
  const controller = new AbortController();
  eventDetailController = controller;
  state.eventDetailLoading = true;
  render();
  const timeout = setTimeout(() => controller.abort(), APP_CONFIG.EVENT_TIMEOUT_MS);
  try {
    const enriched = await getEventDetail(currentEvent, { signal: controller.signal });
    if (eventDetailController !== controller || controller.signal.aborted) return;
    state.events = state.events.map((item) => item.id === eventId ? enriched : item);
  } catch (error) {
    if (eventDetailController === controller) {
      state.events = state.events.map((item) => item.id === eventId ? { ...item, detailError: error?.name === 'AbortError'
        ? '상세 정보를 불러오는 시간이 초과됐어요. 목록 정보를 유지했으니 다시 시도해 주세요.'
        : '상세 정보를 불러오지 못했어요. 목록 정보를 유지했으니 다시 시도해 주세요.' } : item);
    }
  } finally {
    clearTimeout(timeout);
    if (eventDetailController === controller) {
      eventDetailController = null;
      state.eventDetailLoading = false;
      if (state.detail?.type === 'event' && state.detail.id === eventId) render();
    }
  }
}

function closeDetail() {
  if (history.state?.detail) history.back();
  else {
    state.detail = null;
    render();
  }
}

function cleanupPhoto() {
  analysisController?.abort();
  analysisController = null;
  photoPrepareToken += 1;
  if (state.photo?.objectUrl) URL.revokeObjectURL(state.photo.objectUrl);
  state.photo = null;
  state.analysisResult = null;
  state.selectedCandidateId = null;
  state.loading = false;
  state.analysisLoadingVisible = false;
  state.analysisLoadingMessage = '';
  state.photoPrepareVisible = false;
  state.error = '';
}

async function setPhoto(file) {
  state.photoPickerOpen = false;
  if (!file) return;
  const validation = validateImageFile(file);
  if (!validation.ok) {
    state.error = validation.message;
    if (state.currentTab !== 'capture') {
      state.currentTab = 'capture';
      setHistory();
    }
    render();
    return;
  }
  if (state.photo?.objectUrl) URL.revokeObjectURL(state.photo.objectUrl);
  const token = ++photoPrepareToken;
  state.photo = { file, objectUrl: URL.createObjectURL(file), preprocessed: null, preparing: true };
  state.photoPrepareVisible = false;
  state.analysisResult = null;
  state.selectedCandidateId = null;
  state.error = '';
  state.loading = false;
  if (state.currentTab !== 'capture') {
    state.currentTab = 'capture';
    setHistory();
  }
  render();

  let visibleAt = 0;
  const revealTimer = setTimeout(() => {
    if (token !== photoPrepareToken || !state.photo?.preparing) return;
    state.photoPrepareVisible = true;
    visibleAt = performance.now();
    render();
  }, APP_CONFIG.LOADING_REVEAL_MS);

  try {
    const preprocessed = await preprocessImage(file);
    if (token !== photoPrepareToken || state.photo?.file !== file) return;
    if (state.photoPrepareVisible && visibleAt) {
      const remaining = APP_CONFIG.LOADING_MIN_VISIBLE_MS - (performance.now() - visibleAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    if (token !== photoPrepareToken || state.photo?.file !== file) return;
    state.photo.preprocessed = preprocessed;
    state.photo.preparing = false;
    state.photoPrepareVisible = false;
  } catch (error) {
    if (token !== photoPrepareToken) return;
    state.photo.preparing = false;
    state.photoPrepareVisible = false;
    state.error = error instanceof FlowerServiceError
      ? error.message
      : '사진을 준비하지 못했어요. 다른 사진을 골라주세요.';
  } finally {
    clearTimeout(revealTimer);
    if (token === photoPrepareToken) render();
  }
}

async function runAnalysis() {
  if (!state.photo?.file || state.photo.preparing || state.loading) return;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    state.error = '사진 판별은 인터넷 연결이 필요해요. 연결한 뒤 다시 시도해주세요.';
    render();
    return;
  }
  state.loading = true;
  state.analysisLoadingVisible = false;
  state.analysisLoadingMessage = '꽃을 확인하고 있어요';
  state.error = '';
  state.analysisResult = null;
  state.selectedCandidateId = null;
  render();

  analysisController?.abort();
  const controller = new AbortController();
  analysisController = controller;
  let timedOut = false;
  let visibleAt = 0;
  const timers = [];
  const schedule = (delay, fn) => {
    const id = setTimeout(fn, delay);
    timers.push(id);
    return id;
  };
  schedule(APP_CONFIG.LOADING_REVEAL_MS, () => {
    if (analysisController !== controller || controller.signal.aborted || !state.loading) return;
    state.analysisLoadingVisible = true;
    visibleAt = performance.now();
    render();
  });
  schedule(3000, () => {
    if (analysisController !== controller || !state.loading) return;
    state.analysisLoadingMessage = '조금 더 살펴보고 있어요';
    if (state.analysisLoadingVisible) render();
  });
  schedule(7000, () => {
    if (analysisController !== controller || !state.loading) return;
    state.analysisLoadingMessage = '확인하는 데 조금 걸리고 있어요';
    if (state.analysisLoadingVisible) render();
  });
  schedule(APP_CONFIG.ANALYSIS_TIMEOUT_MS, () => {
    if (analysisController !== controller || controller.signal.aborted) return;
    timedOut = true;
    controller.abort();
  });

  try {
    const preprocessed = state.photo.preprocessed || await preprocessImage(state.photo.file);
    if (state.photo) state.photo.preprocessed = preprocessed;
    const result = await analyzeFlower({
      file: state.photo.file,
      preprocessed,
      signal: controller.signal
    });
    state.analysisResult = result;
    state.selectedCandidateId = result.candidates?.[0]?.candidateId || null;
  } catch (error) {
    if (error?.name === 'AbortError' && !timedOut) return;
    state.error = timedOut
      ? '꽃 확인이 오래 걸리고 있어요. 다시 한번 해볼까요?'
      : error instanceof FlowerServiceError
        ? error.message
        : '꽃을 찾는 중 문제가 생겼어요. 다시 한번 해볼까요?';
  } finally {
    timers.forEach(clearTimeout);
    if (analysisController === controller) {
      if (state.analysisLoadingVisible && visibleAt) {
        const remaining = APP_CONFIG.LOADING_MIN_VISIBLE_MS - (performance.now() - visibleAt);
        if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      }
      state.loading = false;
      state.analysisLoadingVisible = false;
      state.analysisLoadingMessage = '';
      analysisController = null;
      render();
    }
  }
}

async function confirmCandidate(flowerId) {
  const flower = getFlowerById(flowerId);
  if (!flower || !state.analysisResult) return;
  const candidate = state.analysisResult.candidates.find((item) => item.flowerId === flowerId);
  if (!candidate) return;
  if (state.observationPhotoBusy) return;
  const file=state.photo?.file;
  const draft=newObservationDraft(flowerId);
  draft.confidence=candidate.confidence;
  draft.selectedCandidate=candidate.scientificName || candidate.nameKo;
  state.observationPhotoBusy=true;
  try {
    if(file) draft.photo=await createThumbnail(file);
    runtimeHooks.beforeObservationSave(state);
    const result=addObservation(draft);
    if(!result.ok) throw new Error(result.error);
    syncCollection();
    const relay=getFlowerRelaySnapshot({flowers:FLOWERS,date:state.currentDate,records:state.discoveredFlowers,storage:localStorage});
    const relayCompleted=relay.started && relay.completedFlowerIds.includes(flowerId);
    showToast(relayCompleted
      ? relay.status==='complete' ? '오늘의 꽃 릴레이를 완료했어요.' : `${flower.nameKo} 완료 · ${relay.completedCount} / ${relay.total}`
      : `${flower.nameKo} 관찰 사진과 날짜를 저장했어요. 홈에서 메모를 추가할 수 있어요.`);
    openFlowerDetail(flowerId);
  } catch(error) {
    openObservationEditor('',flowerId,draft);
    state.observationError=error.message || '사진과 기록을 저장하지 못했어요.';
  } finally { state.observationPhotoBusy=false; render(); }
}

function syncCollection() {
  const collection=loadCollection();
  state.discoveredFlowers=collection.records; state.favoriteFlowerIds=collection.favorites; state.collectionError=collection.error;
}
function newObservationDraft(flowerId='') {
  return { id:crypto.randomUUID(),flowerId,identifiedAt:new Date().toISOString(),
    observedOn:new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul'}).format(new Date()),note:'',photo:null,confidence:null,selectedCandidate:'' };
}
function openObservationEditor(recordId='',flowerId='',draft=null) {
  const existing=state.discoveredFlowers.find(item=>item.id===recordId);
  state.observationDraft=draft || (existing ? {...existing} : newObservationDraft(flowerId));
  state.editingObservationId=existing?.id || '';
  state.observationError=''; state.pendingDeleteId=''; state.observationsOpen=true;
  const changePage=state.currentTab!=='settings' || Boolean(state.detail);
  state.currentTab='settings'; state.detail=null; state.photoPickerOpen=false;
  if(changePage) setHistory();
  render();
  document.getElementById('observation-editor-title')?.scrollIntoView({block:'center'});
  document.getElementById('observation-flower')?.focus({preventScroll:true});
}
function saveObservationEditor() {
  if(!state.observationDraft || state.observationPhotoBusy) return;
  const result=state.editingObservationId ? updateObservation(state.editingObservationId,state.observationDraft) : addObservation(state.observationDraft);
  if(!result.ok) { state.observationError=result.error; render(); return; }
  state.observationDraft=null; state.editingObservationId=''; state.observationError='';
  syncCollection(); render(); showToast('관찰 기록을 저장했어요.');
}
async function chooseObservationPhoto(file) {
  const draft=state.observationDraft;
  if(!draft || !file) return;
  state.observationPhotoBusy=true; state.observationError=''; render();
  try { const photo=await createThumbnail(file); if(state.observationDraft===draft) draft.photo=photo; }
  catch(error) { if(state.observationDraft===draft) state.observationError=error.message || '사진을 읽지 못했어요. 다른 사진을 선택해 주세요.'; }
  finally { state.observationPhotoBusy=false; render(); }
}
function downloadBackup() {
  try {
    const contents=exportBackup();
    downloadText(contents,`꽃을보다-기록-${new Date().toISOString().slice(0,10)}.json`,'application/json;charset=utf-8');
    showToast('저장한 꽃과 관찰 기록을 백업 파일로 만들었어요.');
  } catch(error) { state.backupError=error.message || '백업 파일을 만들지 못했어요.'; render(); }
}
async function prepareBackupImport(file) {
  if(!file || state.backupBusy) return;
  state.backupBusy=true; state.backupError=''; state.pendingImport=null; state.observationsOpen=true; render();
  try {
    if(file.size>3*1024*1024) throw new Error('백업 파일이 너무 커요. 3MB 이하의 꽃을 보다 JSON 백업을 선택해 주세요.');
    const incoming=parseBackup(await file.text());
    for(const record of incoming.records) if(record.photo) {
      const image=new Image(); image.src=record.photo;
      try { await image.decode(); } catch { throw new Error('백업에 읽을 수 없는 사진이 있어요. 기존 자료는 유지됩니다.'); }
      if(image.naturalWidth>480 || image.naturalHeight>480) throw new Error('백업 사진의 크기가 저장 규격을 초과해요.');
    }
    state.pendingImport={incoming,preview:previewImport(incoming)};
  } catch(error) { state.backupError=error.message || '백업을 읽지 못했어요. 기존 기록은 유지됩니다.'; }
  finally { state.backupBusy=false; render(); }
}
function confirmBackupImport() {
  if(!state.pendingImport) return;
  const result=importBackup(state.pendingImport.incoming);
  if(!result.ok) { state.backupError=result.error; render(); return; }
  state.pendingImport=null; state.backupError=''; syncCollection(); render();
  showToast(`기록 ${result.addedRecords}개·저장 ${result.addedFavorites}개 추가, 중복 ${result.skippedRecords}개 제외했어요.`);
}


async function loadReferenceImages() {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return { applied: 0, source: 'offline-local' };
  referenceImageController?.abort();
  referenceImageController = new AbortController();
  const controller = referenceImageController;
  const result = await hydrateReferenceImages(FLOWERS, {
    signal: controller.signal,
    onUpdate: () => {
      if (!controller.signal.aborted) render();
    }
  });
  if (referenceImageController === controller) referenceImageController = null;
  return result;
}

async function loadEventData({ force = false } = {}) {
  eventController?.abort();
  const controller = new AbortController();
  eventController = controller;
  state.eventsLoading = true;
  state.eventsLoadingVisible = false;
  state.eventsError = '';
  render();
  const revealTimer = setTimeout(() => {
    if (eventController !== controller || controller.signal.aborted || !state.eventsLoading) return;
    state.eventsLoadingVisible = true;
    render();
  }, APP_CONFIG.LOADING_REVEAL_MS);
  const timeoutTimer = setTimeout(() => controller.abort(), APP_CONFIG.EVENT_TIMEOUT_MS);
  try {
    state.events = await getEvents({ force, signal: controller.signal });
  } catch (error) {
    if (error?.name === 'AbortError' && eventController !== controller) return;
    state.eventsError = error?.name === 'AbortError'
      ? '행사 정보를 불러오는 데 시간이 걸리고 있어요. 다시 시도해보세요.'
      : (typeof error?.userMessage === 'string' && error.userMessage.trim()
        ? error.userMessage.trim().slice(0, 160)
        : '행사 정보를 불러오지 못했어요. 다시 시도해 주세요.');
  } finally {
    clearTimeout(revealTimer);
    clearTimeout(timeoutTimer);
    if (eventController === controller) {
      state.eventsLoading = false;
      state.eventsLoadingVisible = false;
      eventController = null;
      render();
      const openEventId = state.detail?.type === 'event' ? state.detail.id : '';
      if (!state.eventsError && openEventId && state.events.some((item) => item.id === openEventId)) {
        void openEventDetail(openEventId, { fromHistory: true });
      }
    }
  }
}

const updateFlowerSearchResults = debounce(() => {
  if(state.currentTab==='home') updateHomeSearchResults(state);
  else updateEncyclopediaResults(state);
}, 120);
function handleFlowerSearch(value) {
  state.searchQuery = value;
  updateFlowerSearchResults();
}

const handleEventSearch = debounce((value) => {
  state.eventSearchQuery = value;
  updateEventResults(state);
}, 180);

let photoPickerDrag = null;
let bloomCalendarSwipe = null;
let eventCalendarSwipe = null;
let mainTabSwipe = null;
let suppressMainTabClickUntil = 0;

function canStartMainTabSwipe(target, clientX) {
  if (!MAIN_NAV_TABS.includes(state.currentTab) || state.detail || state.photoPickerOpen || state.bloomCalendarOpen || state.notificationOpen) return false;
  const screen = target.closest?.('#main-content');
  if (!screen || hasHorizontalGestureOwner(target)) return false;
  const edgeGuard = 28;
  return clientX > edgeGuard && clientX < window.innerWidth - edgeGuard;
}

function finishMainTabGesture(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  if (Math.abs(dx) < 64 || Math.abs(dx) <= Math.abs(dy) * 1.25) return false;
  suppressMainTabClickUntil = performance.now() + 450;
  const index = MAIN_NAV_TABS.indexOf(state.currentTab);
  const nextIndex = index + (dx < 0 ? 1 : -1);
  if (nextIndex < 0 || nextIndex >= MAIN_NAV_TABS.length) return true;
  switchTab(MAIN_NAV_TABS[nextIndex]);
  return true;
}

function handleMainTabPointerDown(event) {
  if (event.pointerType !== 'pen' || event.button > 0) return;
  if (!canStartMainTabSwipe(event.target, event.clientX)) return;
  mainTabSwipe = { source:'pointer', pointerId:event.pointerId, startX:event.clientX, startY:event.clientY };
}

function finishMainTabSwipe(event) {
  if (!mainTabSwipe || mainTabSwipe.source !== 'pointer' || event.pointerId !== mainTabSwipe.pointerId) return;
  const { startX, startY } = mainTabSwipe;
  mainTabSwipe = null;
  finishMainTabGesture(startX, startY, event.clientX, event.clientY);
}

function cancelMainTabSwipe(event) {
  if (mainTabSwipe?.source === 'pointer' && event.pointerId === mainTabSwipe.pointerId) mainTabSwipe = null;
}

function handleMainTabTouchStart(event) {
  if (event.touches.length !== 1) return;
  const touch = event.touches[0];
  if (!canStartMainTabSwipe(event.target, touch.clientX)) return;
  mainTabSwipe = { source:'touch', touchId:touch.identifier, startX:touch.clientX, startY:touch.clientY };
}

function handleMainTabTouchMove(event) {
  if (!mainTabSwipe || mainTabSwipe.source !== 'touch') return;
  const touch = [...event.touches].find(item => item.identifier === mainTabSwipe.touchId);
  if (!touch) return;
  const dx = touch.clientX - mainTabSwipe.startX;
  const dy = touch.clientY - mainTabSwipe.startY;
  if (Math.abs(dx) >= 12 && Math.abs(dx) > Math.abs(dy) * 1.15) event.preventDefault();
}

function finishMainTabTouch(event) {
  if (!mainTabSwipe || mainTabSwipe.source !== 'touch') return;
  const touch = [...event.changedTouches].find(item => item.identifier === mainTabSwipe.touchId);
  if (!touch) return;
  const { startX, startY } = mainTabSwipe;
  mainTabSwipe = null;
  if (finishMainTabGesture(startX, startY, touch.clientX, touch.clientY)) event.preventDefault();
}

function cancelMainTabTouch() {
  if (mainTabSwipe?.source === 'touch') mainTabSwipe = null;
}

function suppressClickAfterMainSwipe(event) {
  if (performance.now() > suppressMainTabClickUntil) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}


function handleBloomCalendarPointerDown(event) {
  if(!state.bloomCalendarOpen || event.button>0) return;
  const grid=event.target.closest?.('[data-bloom-calendar-swipe="true"]');
  if(!grid) return;
  bloomCalendarSwipe={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY};
}

function finishBloomCalendarSwipe(event) {
  if(!bloomCalendarSwipe || event.pointerId!==bloomCalendarSwipe.pointerId) return;
  const {startX,startY}=bloomCalendarSwipe;
  bloomCalendarSwipe=null;
  const dx=event.clientX-startX,dy=event.clientY-startY;
  if(Math.abs(dx)<48 || Math.abs(dx)<=Math.abs(dy)*1.15) return;
  moveBloomCalendarMonth(dx<0?1:-1);
}

function cancelBloomCalendarSwipe(event) {
  if(bloomCalendarSwipe && event.pointerId===bloomCalendarSwipe.pointerId) bloomCalendarSwipe=null;
}

function handleEventCalendarPointerDown(event) {
  if(state.currentTab!=='events' || event.button>0) return;
  const grid=event.target.closest?.('[data-event-calendar-swipe="true"]');
  if(!grid) return;
  eventCalendarSwipe={pointerId:event.pointerId,startX:event.clientX,startY:event.clientY};
}

function finishEventCalendarSwipe(event) {
  if(!eventCalendarSwipe || event.pointerId!==eventCalendarSwipe.pointerId) return;
  const {startX,startY}=eventCalendarSwipe;
  eventCalendarSwipe=null;
  const dx=event.clientX-startX,dy=event.clientY-startY;
  if(Math.abs(dx)<48 || Math.abs(dx)<=Math.abs(dy)*1.15) return;
  moveEventCalendarMonth(dx<0?1:-1);
}

function cancelEventCalendarSwipe(event) {
  if(eventCalendarSwipe && event.pointerId===eventCalendarSwipe.pointerId) eventCalendarSwipe=null;
}

function handleBloomRailWheel(event) {
  if(!state.bloomCalendarOpen) return;
  const rail=event.target.closest?.('.bloom-flower-rail');
  if(!rail || rail.scrollWidth<=rail.clientWidth+1 || Math.abs(event.deltaX)>=Math.abs(event.deltaY)) return;
  const max=rail.scrollWidth-rail.clientWidth;
  const canMove=event.deltaY<0 ? rail.scrollLeft>1 : rail.scrollLeft<max-1;
  if(!canMove) return;
  event.preventDefault();
  rail.scrollLeft+=event.deltaY;
  __mods['js/calendar.js'].syncBloomRailControls(rail.closest('.bloom-calendar-flower-section'));
}

function handlePhotoPickerPointerDown(event) {
  if (!state.photoPickerOpen) return;
  const sheet = event.target.closest('.photo-picker-sheet');
  if (!sheet || event.target.closest('button')) return;
  photoPickerDrag = {
    pointerId: event.pointerId,
    startY: event.clientY,
    sheet,
    height: sheet.getBoundingClientRect().height
  };
  sheet.style.animation = 'none';
  sheet.setPointerCapture?.(event.pointerId);
}

function handlePhotoPickerPointerMove(event) {
  if (!photoPickerDrag || event.pointerId !== photoPickerDrag.pointerId) return;
  const distance = Math.max(0, event.clientY - photoPickerDrag.startY);
  photoPickerDrag.sheet.style.transform = `translateY(${distance}px)`;
}

function finishPhotoPickerDrag(event) {
  if (!photoPickerDrag || event.pointerId !== photoPickerDrag.pointerId) return;
  const { sheet, startY, height } = photoPickerDrag;
  const distance = Math.max(0, event.clientY - startY);
  photoPickerDrag = null;
  if (distance >= height) {
    state.photoPickerOpen = false;
    render();
    return;
  }
  sheet.style.transform = '';
  sheet.style.animation = '';
}

const {buildEventCalendar}=__mods['js/calendar.js'];
const {downloadText}=__mods['js/download.js'];

function addEventToCalendar(eventItem, visitDate) {
  const content=buildEventCalendar(eventItem,visitDate);
  if(!content) return false;
  const fileBase = `${eventItem.title || 'flower-event'}-${visitDate}`
    .replace(/[\\/:*?"<>|]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120) || 'flower-event';
  downloadText(content,`${fileBase}.ics`,'text/calendar;charset=utf-8');
  return true;
}

function handleClick(event) {
  const target = event.target.closest('[data-action]');
  if (!target || target.disabled) return;
  const { action } = target.dataset;
  if(runtimeHooks.handleAction({action,target,state,render})) return;
  switch (action) {
    case 'toggle-inline-select': {
      event.preventDefault();
      const control = target.closest('details.inline-select');
      if (!control) break;
      const shouldOpen = !control.open;
      document.querySelectorAll('details.inline-select[open]').forEach(node=>{if(node!==control)node.open=false;});
      control.open = shouldOpen;
      break;
    }
    case 'select-option': {
      const value = target.dataset.value || '';
      const controlId = target.dataset.controlId || '';
      const selectAction = target.dataset.selectAction || '';
      target.closest('details.inline-select')?.removeAttribute('open');
      if (selectAction === 'filter-encyclopedia') {
        if (controlId === 'flower-season-filter') state.encyclopediaFilters = { ...state.encyclopediaFilters, season: value };
        render();
      } else if (selectAction === 'sort-encyclopedia') {
        state.encyclopediaSort = ['default','name','bloom-early','bloom-late'].includes(value) ? value : 'default';
        render();
      } else if (selectAction === 'set-home-region') {
        state.userRegion = value.slice(0, 60);
        render();
      } else if (selectAction === 'setting-select') {
        const key = target.dataset.key;
        if (!['region','theme','bodyTextSize'].includes(key)) break;
        const next = { ...state.settings, [key]: value };
        if (saveSettings(next)) {
          state.settings = next;
          if (key === 'region') {
            state.userRegion = value;
          }
          render();
        } else {
          render();
          showToast('설정을 저장하지 못했어요.');
        }
      }
      break;
    }
    case 'go-settings': switchTab('settings'); break;
    case 'select-map-view':
      state.mapViewMode = target.dataset.mode === 'course' ? 'course' : 'nearby';
      state.mapSelectedPlaceId = '';
      render();
      break;
    case 'request-map-location': void requestMapUserLocation(); break;
    case 'select-map-place': selectMapPlace(target.dataset.placeId); break;
    case 'select-map-course': selectMapCourse(target.dataset.courseId); break;
    case 'show-event-on-map': showEventOnMap(target.dataset.placeId); break;
    case 'show-flower-on-map': showFlowerOnMap(target.dataset.flowerId); break;
    case 'clear-map-flower-filter':
      state.mapFlowerFilterId='';
      state.mapSelectedPlaceId='';
      render();
      break;
    case 'retry-map': render(); break;
    case 'open-bloom-calendar':
      state.bloomCalendarOpen=true;
      setBloomCalendarMonth(__mods['js/dateUtils.js'].getDatePresentation(state.currentDate).day.slice(0,7));
      render();
      break;
    case 'bloom-calendar-panel': break;
    case 'close-bloom-calendar': state.bloomCalendarOpen=false; render(); break;
    case 'bloom-calendar-month': setBloomCalendarMonth(target.dataset.month || state.bloomCalendarMonth); render(); break;
    case 'bloom-flower-rail-scroll': scrollBloomFlowerRail(target); break;
    case 'select-bloom-flower': selectBloomRailFlower(target); renderBloomCalendarPreservingRail(); break;
    case 'show-all-bloom-flowers':
      state.bloomCalendarShowAll=true;
      state.selectedBloomFlowerId='';
      renderBloomCalendarPreservingRail();
      break;
    case 'bloom-calendar-date': {
      const value=target.dataset.date || '';
      const shownMonth=state.bloomCalendarMonth || __mods['js/dateUtils.js'].getDatePresentation(state.currentDate).day.slice(0,7);
      if(!value.startsWith(`${shownMonth}-`) || !__mods['js/dateUtils.js'].parseApiDate(value)) break;
      state.bloomCalendarSelectedDate=value;
      renderBloomCalendarPreservingRail();
      break;
    }
    case 'clear-recent': state.recentClearPending=true; render(); break;
    case 'cancel-clear-recent': state.recentClearPending=false; render(); break;
    case 'confirm-clear-recent':
      if(clearRecent()) {state.recentFlowerIds=[];state.recentClearPending=false;render();showToast('최근 기록을 지웠어요.');}
      else showToast('최근 기록을 지우지 못했어요.');
      break;
    case 'calendar-month': state.calendarMonths[target.dataset.eventId]=target.dataset.month; render(); break;
    case 'calendar-day': {
      const item=state.events.find(x=>x.id===target.dataset.eventId),value=target.dataset.date;
      if(!__mods['js/calendar.js'].isVisitDate(item,value)) break;
      state.eventVisitDates[item.id]=value; render(); break;
    }
    case 'save-event-visit': {
      const item=state.events.find(x=>x.id===target.dataset.eventId),value=state.eventVisitDates[item?.id];
      if(!__mods['js/calendar.js'].isVisitDate(item,value)) break;
      const next={...state.savedVisitDates,[item.id]:value};
      if(saveVisits(next)){state.savedVisitDates=next;render();showToast('방문 날짜를 저장했어요.');} else showToast('방문 날짜를 저장하지 못했어요.');
      break;
    }
    case 'observation-new': openObservationEditor('',target.dataset.flowerId || ''); break;
    case 'observation-edit': openObservationEditor(target.dataset.recordId); break;
    case 'observation-save': saveObservationEditor(); break;
    case 'observation-cancel': state.observationDraft=null; state.observationError=''; render(); break;
    case 'observation-photo': document.getElementById('observation-photo-input')?.click(); break;
    case 'observation-remove-photo': if(state.observationDraft) state.observationDraft.photo=null; render(); break;
    case 'observation-delete-request': state.pendingDeleteId=target.dataset.recordId; render(); break;
    case 'observation-delete-cancel': state.pendingDeleteId=''; render(); break;
    case 'observation-delete-confirm': {
      if(state.pendingDeleteId!==target.dataset.recordId) break;
      const result=deleteObservation(target.dataset.recordId);
      if(result.ok) { state.pendingDeleteId=''; if(state.editingObservationId===target.dataset.recordId) state.observationDraft=null; syncCollection(); }
      else state.collectionError=result.error;
      render(); showToast(result.ok ? '관찰 기록을 삭제했어요.' : '기록을 삭제하지 못했어요.'); break;
    }
    case 'backup-export': downloadBackup(); break;
    case 'backup-choose': document.getElementById('backup-input')?.click(); break;
    case 'backup-confirm': confirmBackupImport(); break;
    case 'backup-cancel': state.pendingImport=null; state.backupError=''; render(); break;
    case 'switch-tab': switchTab(target.dataset.tab); break;
    case 'go-home': switchTab('home'); break;
    case 'go-current-season':
      state.searchQuery = '';
      state.encyclopediaFilters = emptyFlowerFilters({season:state.currentSeason});
      switchTab('encyclopedia');
      break;
    case 'open-photo-picker':
      state.photoPickerOpen = true;
      render();
      break;
    case 'relay-start': {
      const result=startFlowerRelay({flowers:FLOWERS,date:state.currentDate,storage:localStorage});
      if(!result.ok){state.relayError=result.error;render();break;}
      state.relayError=''; state.photoPickerOpen=true; render();
      break;
    }
    case 'relay-continue':
      state.relayError=''; state.photoPickerOpen=true; render();
      break;
    case 'photo-picker-panel':
      break;
    case 'close-photo-picker':
      state.photoPickerOpen = false;
      render();
      break;
    case 'open-notifications':
      state.notificationOpen = true;
      render();
      break;
    case 'notification-panel':
      break;
    case 'close-notifications':
      state.notificationOpen = false;
      render();
      break;
    case 'open-notification-event': {
      const notification = state.eventNotifications.find((item) => item.id === target.dataset.notificationId && item.eventId === target.dataset.eventId);
      if (!notification || !state.events.some((item) => item.id === notification.eventId)) break;
      if (!notification.isRead) {
        const next = { ...state.eventNotificationReads, [notification.readKey]: true };
        if (!saveEventNotificationReads(next)) {
          showToast('읽음 상태를 저장하지 못했어요. 다시 시도해 주세요.');
          break;
        }
        state.eventNotificationReads = next;
      }
      state.notificationOpen = false;
      openEventDetail(notification.eventId);
      break;
    }
    case 'go-events': switchTab('events'); break;
    case 'go-all-events':
      state.eventFilter = { date: '' };
      state.eventSearchQuery = '';
      switchTab('events');
      break;
    case 'go-encyclopedia': switchTab('encyclopedia'); break;
    case 'open-flower': openFlowerDetail(target.dataset.flowerId); break;
    case 'open-event': openEventDetail(target.dataset.eventId); break;
    case 'retry-event-detail':
      if (!state.eventDetailLoading) openEventDetail(target.dataset.eventId, { fromHistory: true });
      break;
    case 'close-detail': closeDetail(); break;

    case 'event-filter-month':
      setEventCalendarMonth(target.dataset.month || '');
      render();
      break;
    case 'event-filter-date':
      if (!parseApiDate(target.dataset.date || '')) break;
      state.eventFilter = { ...state.eventFilter, date: target.dataset.date };
      state.eventCalendarMonth = target.dataset.date.slice(0, 7);
      render();
      break;
    case 'clear-event-date':
      state.eventFilter = { ...state.eventFilter, date: '' };
      render();
      break;

    case 'trigger-camera': {
      state.photoPickerOpen = false;
      render();
      const input = document.getElementById('camera-input');
      if (!input) {
        state.error = '카메라를 바로 열 수 없어요. 앨범에서 사진을 골라주세요.';
        render();
      } else input.click();
      break;
    }
    case 'trigger-gallery':
      state.photoPickerOpen = false;
      render();
      document.getElementById('gallery-input')?.click();
      break;
    case 'restart-photo':
      cleanupPhoto();
      state.currentTab = 'home';
      state.photoPickerOpen = true;
      setHistory();
      render();
      break;
    case 'clear-photo':
      cleanupPhoto();
      switchTab('home');
      break;
    case 'analyze-photo': runAnalysis(); break;
    case 'select-candidate':
      if (target.dataset.candidateId) state.selectedCandidateId = target.dataset.candidateId;
      render();
      break;
    case 'confirm-candidate': confirmCandidate(target.dataset.flowerId); break;
    case 'candidate-events':
      state.eventFilter = { date: '' };
      state.eventSearchQuery = '';
      switchTab('events');
      break;
    case 'flower-events-all':
      state.eventFilter = { date: '' };
      state.eventSearchQuery = '';
      switchTab('events');
      break;
    case 'add-event-calendar': {
      const eventItem = state.events.find((item) => item.id === target.dataset.eventId);
      const visitDate = state.eventVisitDates[target.dataset.eventId] || '';
      showToast(addEventToCalendar(eventItem, visitDate) ? '캘린더 일정 파일을 만들었어요.' : '행사 기간 안에서 갈 날짜를 먼저 골라주세요.');
      break;
    }
    case 'toggle-favorite': {
      const flowerId = target.dataset.flowerId;
      if (!getFlowerById(flowerId)) break;
      const next = new Set(state.favoriteFlowerIds);
      const removing = next.has(flowerId);
      if (removing) next.delete(flowerId);
      else next.add(flowerId);
      const persisted = saveFavorites([...next]);
      if(persisted) syncCollection();
      render();
      showToast(persisted
        ? (removing ? '저장에서 제거했어요.' : '저장했어요.')
        : '저장 상태를 바꾸지 못했어요. 다시 시도해 주세요.');
      break;
    }
    case 'toggle-favorite-filter':
      state.encyclopediaFilters = {
        ...state.encyclopediaFilters,
        favoritesOnly: !state.encyclopediaFilters.favoritesOnly
      };
      render();
      break;
    case 'clear-flower-search':
      state.searchQuery = '';
      render();
      requestAnimationFrame(() => document.getElementById(state.currentTab==='home'?'home-flower-search':'flower-search')?.focus());
      break;
    case 'reset-encyclopedia':
      state.searchQuery = '';
      state.encyclopediaFilters = emptyFlowerFilters();
      state.encyclopediaSort = 'default';
      render();
      break;
    case 'retry-events':
      loadEventData({ force: true });
      break;
  }
}

function handleChange(event) {
  const input = event.target;
  if(runtimeHooks.handleChange({input,state,render})) return;
  if(['setting-select','setting-toggle'].includes(input.dataset.action)) {
    const key=input.dataset.key;
    if(!['region','theme','recentEnabled','bodyTextSize','eventNotificationsEnabled','locationEnabled'].includes(key)) return;
    const value=input.dataset.action==='setting-toggle'?input.checked:input.value;
    const next={...state.settings,[key]:value};
    if(saveSettings(next)) {
      state.settings=next;
      if(key==='region') state.userRegion=value;
      if(key==='locationEnabled' && !value) {
        state.mapUserLocation=null;
        state.mapLocationStatus='disabled';
        state.mapLocationError='';
      }
      render();
    }
    else {render();showToast('설정을 저장하지 못했어요.');}
    return;
  }
  if(input.id==='observation-photo-input') { const file=input.files?.[0]; input.value=''; void chooseObservationPhoto(file); return; }
  if(input.id==='backup-input') { const file=input.files?.[0]; input.value=''; void prepareBackupImport(file); return; }
  if(input.dataset.observationField && state.observationDraft) { state.observationDraft[input.dataset.observationField]=input.value; return; }
  if (input.matches('#camera-input, #gallery-input')) {
    const file = input.files?.[0];
    if (file) setPhoto(file);
    input.value = '';
    return;
  }
  if (input.dataset.action === 'filter-encyclopedia') {
    state.encyclopediaFilters = {
      season: document.getElementById('flower-season-filter')?.value || '',
      favoritesOnly: Boolean(state.encyclopediaFilters.favoritesOnly)
    };
    updateEncyclopediaResults(state);
    return;
  }
  if (input.dataset.action === 'sort-encyclopedia') {
    state.encyclopediaSort = ['default','name','bloom-early','bloom-late'].includes(input.value) ? input.value : 'default';
    updateEncyclopediaResults(state);
    return;
  }
  if (input.dataset.action === 'set-home-region') {
    state.userRegion = typeof input.value === 'string' ? input.value.slice(0, 60) : '';
    render();
    return;
  }
  if (input.dataset.action === 'filter-events-date') {
    state.eventFilter = { ...state.eventFilter, date: input.value || '' };
    updateEventResults(state);
    return;
  }

}

function handleInput(event) {
  if(event.target.dataset.observationField && state.observationDraft) state.observationDraft[event.target.dataset.observationField]=event.target.value;
  if (event.target.id === 'flower-search' || event.target.id === 'home-flower-search') handleFlowerSearch(event.target.value);
  if (event.target.id === 'event-search') handleEventSearch(event.target.value);
}

function trapModalFocus(event) {
  if (event.key !== 'Tab') return false;
  const modal = document.querySelector('.notification-layer') || document.querySelector('.bloom-calendar-layer') || document.querySelector('.photo-picker-layer') || document.querySelector('.detail-layer');
  if (!modal) return false;
  const focusable = [...modal.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex]')]
    .filter((node) => node.tabIndex >= 0 && !node.hidden && !node.closest('[inert]') && node.getClientRects().length > 0);
  if (!focusable.length) {
    event.preventDefault();
    modal.setAttribute('tabindex', '-1');
    modal.focus();
    return true;
  }
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!modal.contains(document.activeElement) || !focusable.includes(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
    return true;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
    return true;
  }
  return false;
}

function handleKeydown(event) {
  if (trapModalFocus(event)) return;
  if (event.key === 'Escape') {
    const openSelect = document.querySelector('details.inline-select[open]');
    if (openSelect) {
      openSelect.removeAttribute('open');
      openSelect.querySelector('summary')?.focus();
      return;
    }
  }
  if (event.key === 'Escape' && state.notificationOpen) {
    state.notificationOpen = false;
    render();
    return;
  }
  if (event.key === 'Escape' && state.bloomCalendarOpen) {
    state.bloomCalendarOpen = false;
    render();
    return;
  }
  if (event.key === 'Escape' && state.photoPickerOpen) {
    state.photoPickerOpen = false;
    render();
    return;
  }
  if (event.key === 'Escape' && state.detail) closeDetail();
}

function normalizeHistoryDetail(detail) {
  if (!detail || typeof detail !== 'object') return null;
  const id = typeof detail.id === 'string' ? detail.id.slice(0, 160) : '';
  if (detail.type === 'flower' && id && getFlowerById(id)) return { type: 'flower', id };
  if (detail.type === 'event' && id) return { type: 'event', id };
  return null;
}

function readLocationState() {
  let hash = String(location.hash || '').replace(/^#/, '');
  try { hash = decodeURIComponent(hash); } catch { hash = ''; }
  if (!hash) return { tab: 'home', detail: null };
  const slashIndex = hash.indexOf('/');
  const key = slashIndex >= 0 ? hash.slice(0, slashIndex) : hash;
  const id = slashIndex >= 0 ? hash.slice(slashIndex + 1).slice(0, 160) : '';
  if (key === 'flower' && id && getFlowerById(id)) return { tab: 'encyclopedia', detail: { type: 'flower', id } };
  if (key === 'event' && id) return { tab: 'events', detail: { type: 'event', id } };
  if (key === 'seasonal') return { tab: 'encyclopedia', detail: null };
  if (VALID_TABS.includes(key)) return { tab: key, detail: null };
  return { tab: 'home', detail: null };
}

function initHistory() {
  const initial = readLocationState();
  state.currentTab = initial.tab;
  state.detail = initial.detail;
  state.photoPickerOpen = false;
  state.bloomCalendarOpen = false;
  state.notificationOpen = false;
  if (state.detail?.type === 'flower') state.selectedFlower = getFlowerById(state.detail.id);
  const canonicalHash = state.detail
    ? `#${state.detail.type}/${encodeURIComponent(state.detail.id)}`
    : `#${state.currentTab}`;
  history.replaceState({ tab: state.currentTab, detail: state.detail }, '', canonicalHash);
}

function refreshCurrentDate() {
  const now=new Date(),getDate=__mods['js/dateUtils.js'].getDatePresentation;
  const currentDateChanged=getDate(now).day!==getDate(state.currentDate).day;
  if(currentDateChanged) {state.currentDate=now;state.currentSeason=getSeason(now);}
  const runtimeDateChanged=runtimeHooks.syncDateState({state,now});
  if(currentDateChanged || runtimeDateChanged) render();
}
function init() {
  initHistory();
  const app = document.getElementById('app');
  app.addEventListener('click', suppressClickAfterMainSwipe, true);
  app.addEventListener('click', handleClick);
  app.addEventListener('input', handleInput);
  app.addEventListener('toggle',event=> {
    if(!event.target.isConnected) return;
    if(event.target.matches('details.inline-select') && event.target.open) {
      document.querySelectorAll('details.inline-select[open]').forEach(node=>{if(node!==event.target)node.open=false;});
    }
    if(event.target.id==='observation-panel') state.observationsOpen=event.target.open;
    if(event.target.id==='recent-flower-panel') state.recentDetailsOpen=event.target.open;
  },true);
  window.addEventListener('storage',event=> {
    if(event.key==='flower-info.collection.v1') { syncCollection(); render(); }
    if(event.key==='flower-info.event-notification-reads.v1') { state.eventNotificationReads=loadEventNotificationReads(); render(); }
  });
  document.addEventListener('change', handleChange);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshCurrentDate();});
  window.addEventListener('focus',refreshCurrentDate);
  document.addEventListener('keydown', handleKeydown);
  document.addEventListener('flower-map-select',event=>selectMapPlace(event.detail?.placeId));
  document.addEventListener('pointerdown', handlePhotoPickerPointerDown);
  document.addEventListener('pointerdown', handleMainTabPointerDown);
  document.addEventListener('touchstart', handleMainTabTouchStart, { passive: true });
  document.addEventListener('touchmove', handleMainTabTouchMove, { passive: false });
  document.addEventListener('pointerdown', handleBloomCalendarPointerDown);
  document.addEventListener('pointerdown', handleEventCalendarPointerDown);
  document.addEventListener('pointermove', handlePhotoPickerPointerMove);
  document.addEventListener('pointerup', finishPhotoPickerDrag);
  document.addEventListener('pointerup', finishMainTabSwipe);
  document.addEventListener('touchend', finishMainTabTouch, { passive: false });
  document.addEventListener('pointerup', finishBloomCalendarSwipe);
  document.addEventListener('pointerup', finishEventCalendarSwipe);
  document.addEventListener('pointercancel', finishPhotoPickerDrag);
  document.addEventListener('pointercancel', cancelMainTabSwipe);
  document.addEventListener('touchcancel', cancelMainTabTouch, { passive: true });
  document.addEventListener('pointercancel', cancelBloomCalendarSwipe);
  document.addEventListener('pointercancel', cancelEventCalendarSwipe);
  app.addEventListener('wheel',handleBloomRailWheel,{passive:false});
  window.addEventListener('popstate', (event) => {
    const locationState = readLocationState();
    const detail = normalizeHistoryDetail(event.state?.detail) || locationState.detail;
    state.currentTab = event.state?.tab ? normalizeTab(event.state.tab) : locationState.tab;
    state.detail = detail;
    state.photoPickerOpen = false;
    state.bloomCalendarOpen = false;
    state.notificationOpen = false;
    if (state.detail?.type === 'flower') state.selectedFlower = getFlowerById(state.detail.id);
    render();
    if (state.detail?.type === 'event' && state.events.some((item) => item.id === state.detail.id)) {
      void openEventDetail(state.detail.id, { fromHistory: true });
    }
  });
  window.addEventListener('beforeunload', () => {
    stopDateTracking?.();
    if (state.photo?.objectUrl) URL.revokeObjectURL(state.photo.objectUrl);
    analysisController?.abort();
    eventController?.abort();
    eventDetailController?.abort();
    referenceImageController?.abort();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>applyTheme(state.settings.theme));
  stopDateTracking=runtimeHooks.startDateTracking({state,refreshCurrentDate});
  render();
  void loadCurrentWeatherWithoutPrompt().then(weather=>{
    state.currentWeather=weather;
    state.currentWeatherStatus=weather?'ready':'error';
    render();
  });
  if(state.detail?.type==='flower') state.recentFlowerIds=rememberFlower(state.detail.id,state.settings.recentEnabled);
  loadEventData();
  if (!new URLSearchParams(location.search).has('noRemoteImages')) loadReferenceImages();

  if (!FLOWERS.length) console.error('[main] Flower database is empty.');
}

init();
return {};
})();

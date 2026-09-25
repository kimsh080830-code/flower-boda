__mods["js/mapService.js"] = (() => {
const { FLOWER_PLACES, getFlowerPlaceById } = __mods["js/mapPlaces.js"];
const { getFlowerCourseById } = __mods["js/mapCourses.js"];
const { getFlowerById } = __mods["js/data.js"];

const EARTH_RADIUS_METERS = 6371000;
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_SCRIPT_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
const LEAFLET_CSS_INTEGRITY = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
const LEAFLET_SCRIPT_INTEGRITY = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
let leafletPromise = null;
let mountedMap = null;

function normalizeLocation(location) {
  const latitude = Number(location?.latitude);
  const longitude = Number(location?.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude, longitude };
}

async function resolveMapLocation({geolocation=globalThis.navigator?.geolocation,requestPosition}={}) {
  try {
    if(typeof requestPosition!=='function') throw new Error('Location requester unavailable');
    const location=normalizeLocation(await requestPosition(geolocation));
    if(!location) throw new Error('Invalid location');
    return {location,status:'ready',error:''};
  } catch(error) {
    const denied=error?.code===1 || error?.name==='NotAllowedError';
    return {location:null,status:denied?'denied':'error',error:denied?'permission-denied':'position-unavailable'};
  }
}

function haversineDistanceMeters(from, to) {
  const start = normalizeLocation(from);
  const end = normalizeLocation(to);
  if (!start || !end) return null;
  const radians = (degrees) => degrees * Math.PI / 180;
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(start.latitude)) * Math.cos(radians(end.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return EARTH_RADIUS_METERS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(distanceMeters) {
  if (!Number.isFinite(distanceMeters) || distanceMeters < 0) return '';
  if (distanceMeters < 1000) return `${Math.min(990, Math.round(distanceMeters / 10) * 10)}m`;
  return `${(distanceMeters / 1000).toFixed(1)}km`;
}

function sortPlacesByDistance(places, userLocation) {
  const location = normalizeLocation(userLocation);
  return (Array.isArray(places) ? places : []).map((place, index) => ({
    ...place,
    distanceMeters: location ? haversineDistanceMeters(location, place) : null,
    originalIndex: index
  })).sort((a, b) => location
    ? a.distanceMeters - b.distanceMeters || a.originalIndex - b.originalIndex
    : a.originalIndex - b.originalIndex
  ).map(({ originalIndex, ...place }) => place);
}

function formatBloomMonths(months) {
  const values = [...new Set((Array.isArray(months) ? months : []).map(Number).filter((month) => month >= 1 && month <= 12))].sort((a, b) => a - b);
  if (!values.length) return '추천 시기 정보 없음';
  const continuous = values.every((month, index) => index === 0 || month === values[index - 1] + 1);
  return continuous && values.length > 1 ? `${values[0]}~${values.at(-1)}월` : `${values.join('·')}월`;
}

function flowerNames(place) {
  const names = (place.relatedFlowerIds || []).map((id) => getFlowerById(id)?.nameKo).filter(Boolean);
  return names.length ? names : ['관련 꽃 정보 없음'];
}

function getFlowerPlaceItems(userLocation, { flowerId = '', placeIds = null } = {}) {
  const orderedIds = Array.isArray(placeIds) ? placeIds : null;
  const source = orderedIds ? orderedIds.map(getFlowerPlaceById).filter(Boolean) : FLOWER_PLACES;
  const filtered = source.filter((place) => !flowerId || place.relatedFlowerIds.includes(flowerId));
  const prepared = orderedIds
    ? filtered.map((place) => ({ ...place, distanceMeters: userLocation ? haversineDistanceMeters(userLocation, place) : null }))
    : sortPlacesByDistance(filtered, userLocation);
  return prepared.map((place) => ({
    ...place,
    relatedFlowerNames: flowerNames(place),
    bloomLabel: formatBloomMonths(place.bloomMonths),
    distanceLabel: formatDistance(place.distanceMeters)
  }));
}

function loadLeaflet({ documentRef = globalThis.document, globalRef = globalThis } = {}) {
  if (globalRef.L?.map) return Promise.resolve(globalRef.L);
  if (!documentRef?.head) return Promise.reject(new Error('Leaflet document unavailable'));
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise((resolve, reject) => {
    if (!documentRef.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const link = documentRef.createElement('link');
      link.rel = 'stylesheet';
      link.href = LEAFLET_CSS_URL;
      link.integrity = LEAFLET_CSS_INTEGRITY;
      link.crossOrigin = '';
      documentRef.head.append(link);
    }
    const existing = documentRef.querySelector(`script[src="${LEAFLET_SCRIPT_URL}"]`);
    const script = existing || documentRef.createElement('script');
    const complete = () => globalRef.L?.map ? resolve(globalRef.L) : reject(new Error('Leaflet unavailable'));
    script.addEventListener('load', complete, { once: true });
    script.addEventListener('error', () => reject(new Error('Leaflet failed to load')), { once: true });
    if (!existing) {
      script.src = LEAFLET_SCRIPT_URL;
      script.integrity = LEAFLET_SCRIPT_INTEGRITY;
      script.crossOrigin = '';
      documentRef.head.append(script);
    } else if (globalRef.L?.map) complete();
  }).catch((error) => {
    leafletPromise = null;
    documentRef.querySelector(`script[src="${LEAFLET_SCRIPT_URL}"]`)?.remove();
    documentRef.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)?.remove();
    throw error;
  });
  return leafletPromise;
}

function cssColor(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function popupContent(place) {
  const node = document.createElement('div');
  node.className = 'map-popup';
  const title = document.createElement('strong');
  title.textContent = place.name;
  const flowers = document.createElement('span');
  flowers.textContent = place.relatedFlowerNames.join(' · ');
  const season = document.createElement('span');
  season.textContent = place.bloomLabel;
  node.append(title, flowers, season);
  return node;
}

function disposeFlowerMap() {
  if (mountedMap) {
    mountedMap.remove();
    mountedMap = null;
  }
}

async function mountFlowerMap({
  userLocation = null,
  selectedPlaceId = '',
  viewMode = 'nearby',
  selectedCourseId = '',
  flowerFilterId = '',
  onSelectPlace = () => {}
} = {}) {
  const container = document.getElementById('flower-map');
  if (!container) return null;
  disposeFlowerMap();
  const course = viewMode === 'course' ? getFlowerCourseById(selectedCourseId) : null;
  const places = getFlowerPlaceItems(userLocation, {
    flowerId: viewMode === 'nearby' ? flowerFilterId : '',
    placeIds: course?.placeIds || null
  });
  if (!places.length) {
    container.replaceChildren(Object.assign(document.createElement('p'), { textContent: '등록된 꽃 장소가 없어요.' }));
    return null;
  }
  try {
    const L = await loadLeaflet();
    if (!document.contains(container)) return null;
    container.replaceChildren();
    const map = L.map(container, { scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    mountedMap = map;
    L.tileLayer(OSM_TILE_URL, {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    const accent = cssColor('--accent-strong', '#6f8657');
    const surface = cssColor('--surface', '#ffffff');
    const ink = cssColor('--ink', '#30342a');
    const bounds = [];
    let selectedMarker = null;
    for (const [index, place] of places.entries()) {
      const selected = place.id === selectedPlaceId;
      const marker = course
        ? L.marker([place.latitude, place.longitude], {
            icon: L.divIcon({
              className: `map-course-number-marker ${selected ? 'is-selected' : ''}`,
              html: `<span>${index + 1}</span>`,
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            })
          }).addTo(map).bindPopup(popupContent(place))
        : L.circleMarker([place.latitude, place.longitude], {
            radius: selected ? 9 : 7,
            color: surface,
            weight: 2,
            fillColor: accent,
            fillOpacity: selected ? 1 : .82
          }).addTo(map).bindPopup(popupContent(place));
      marker.on('click', () => onSelectPlace(place.id));
      if (selected) selectedMarker = marker;
      bounds.push([place.latitude, place.longitude]);
    }
    if (course && bounds.length > 1) {
      L.polyline(bounds, {
        color: accent,
        weight: 3,
        opacity: .72,
        dashArray: '6 7'
      }).addTo(map);
    }
    const location = normalizeLocation(userLocation);
    if (location) {
      L.circleMarker([location.latitude, location.longitude], {
        radius: 8,
        color: surface,
        weight: 3,
        fillColor: ink,
        fillOpacity: .92
      }).addTo(map).bindPopup('현재 위치');
    }
    const selectedPlace = getFlowerPlaceById(selectedPlaceId);
    if (selectedPlace && places.some((place) => place.id === selectedPlace.id)) {
      map.setView([selectedPlace.latitude, selectedPlace.longitude], course ? 12 : 11);
    } else if (course) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 12 });
    } else if (location) {
      map.setView([location.latitude, location.longitude], 11);
    } else {
      map.fitBounds(bounds, { padding: [22, 22], maxZoom: 8 });
    }
    if (selectedMarker) selectedMarker.openPopup();
    requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    return map;
  } catch {
    if (!document.contains(container)) return null;
    const status = document.createElement('div');
    status.className = 'map-load-error';
    status.setAttribute('role', 'status');
    const message = document.createElement('p');
    message.textContent = '지도를 불러오지 못했어요.';
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'map-retry-button';
    retry.dataset.action = 'retry-map';
    retry.textContent = '다시 시도';
    status.append(message, retry);
    container.replaceChildren(status);
    return null;
  }
}

return {
  "normalizeLocation": normalizeLocation,
  "resolveMapLocation": resolveMapLocation,
  "haversineDistanceMeters": haversineDistanceMeters,
  "formatDistance": formatDistance,
  "sortPlacesByDistance": sortPlacesByDistance,
  "formatBloomMonths": formatBloomMonths,
  "getFlowerPlaceItems": getFlowerPlaceItems,
  "loadLeaflet": loadLeaflet,
  "mountFlowerMap": mountFlowerMap,
  "disposeFlowerMap": disposeFlowerMap
};
})();

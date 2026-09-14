__mods["js/config.js"] = (() => {
const APP_CONFIG = Object.freeze({
  DEV_MODE: Boolean(globalThis.__FLOWER_APP_DEV__),
  STANDALONE: location.protocol === 'file:',
  MAX_IMAGE_BYTES: 12 * 1024 * 1024,
  MAX_IMAGE_EDGE: 1280,
  IMAGE_QUALITY: 0.90,
  LOW_CONFIDENCE_THRESHOLD: 0.6,
  MAX_CANDIDATES: 3,
  PHOTO_API_RESULT_POOL: 20,
  LOADING_REVEAL_MS: 200,
  LOADING_MIN_VISIBLE_MS: 300,
  ANALYSIS_TIMEOUT_MS: 12000,
  EVENT_TIMEOUT_MS: 32000,
  EVENT_CACHE_TTL_MS: 30 * 60 * 1000,
  STORAGE_KEYS: Object.freeze({
    discoveries: 'flower-info.discoveries.v1',
    favorites: 'flower-info.favorites.v1',
    preferences: 'flower-info.preferences.v1',
    cachePrefix: 'flower-info.cache.v1.'
  }),
  API: Object.freeze({
    identify: '/api/identify-flower',
    events: '/api/events',
    eventDetail: '/api/event-detail'
  })
});

const SUPPORTED_IMAGE_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp'
]);

const SUPPORTED_IMAGE_EXTENSIONS = Object.freeze(['jpg', 'jpeg', 'png', 'webp']);
return { "APP_CONFIG": APP_CONFIG, "SUPPORTED_IMAGE_TYPES": SUPPORTED_IMAGE_TYPES, "SUPPORTED_IMAGE_EXTENSIONS": SUPPORTED_IMAGE_EXTENSIONS };
})();

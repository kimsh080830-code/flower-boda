__mods["js/storage.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { loadCollection, persistFavorites } = __mods["js/observations.js"];

let storageChecked = false;
let storageRef = null;

function safeStorage() {
  if (storageChecked) return storageRef;
  storageChecked = true;
  try {
    const testKey = '__flower_storage_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    storageRef = localStorage;
  } catch (error) {
    storageRef = null;
  }
  return storageRef;
}

function safeJsonParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function loadDiscoveries() {
  return loadCollection().records;
}

function loadFavorites() {
  return loadCollection().favorites;
}

function saveFavorites(flowerIds) {
  return persistFavorites(flowerIds).ok;
}

function getCache(key) {
  const storage = safeStorage();
  if (!storage) return null;
  const storageKey = APP_CONFIG.STORAGE_KEYS.cachePrefix + key;
  const parsed = safeJsonParse(storage.getItem(storageKey), null);
  if (!parsed || !Number.isFinite(parsed.expiresAt) || Date.now() > parsed.expiresAt) {
    if (parsed) storage.removeItem(storageKey);
    return null;
  }
  return parsed.value;
}

function setCache(key, value, ttlMs) {
  const storage = safeStorage();
  if (!storage || !Number.isFinite(ttlMs) || ttlMs <= 0) return false;
  try {
    storage.setItem(APP_CONFIG.STORAGE_KEYS.cachePrefix + key, JSON.stringify({
      expiresAt: Date.now() + ttlMs,
      value
    }));
    return true;
  } catch (error) {
    return false;
  }
}
return { "safeJsonParse": safeJsonParse, "loadDiscoveries": loadDiscoveries, "loadFavorites": loadFavorites, "saveFavorites": saveFavorites, "getCache": getCache, "setCache": setCache };
})();

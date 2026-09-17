__mods["js/imageService.js"] = (() => {
const { getCache, setCache } = __mods["js/storage.js"];
const { hooks:runtimeHooks } = __mods["js/runtimeHooks.js"];

const WIKIPEDIA_API = 'https://en.wikipedia.org/w/api.php';
const CACHE_KEY = 'reference-images.wikipedia.v1';
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 7000;
const BATCH_SIZE = 20;

const ACCEPTED_LICENSE = /^(?:CC0|Public domain|CC BY(?:-SA)?(?: 2\.0| 2\.5| 3\.0| 4\.0))$/i;

function stripHtml(value = '') {
  const text = String(value);
  if (typeof DOMParser === 'undefined') return text.replace(/<[^>]*>/g, '').trim();
  const doc = new DOMParser().parseFromString(text, 'text/html');
  return (doc.body.textContent || '').trim();
}

function cleanScientificName(value = '') {
  return String(value)
    .replace(/\s+(?:spp\.|cultivars?|hybrids?|group)$/i, '')
    .replace(/\s+×\s+.*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function chunk(items, size = BATCH_SIZE) {
  const output = [];
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size));
  return output;
}

async function fetchJson(params, { signal } = {}) {
  if (runtimeHooks.shouldForceNetworkFailure()) throw new Error('NETWORK_UNAVAILABLE');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  const url = `${WIKIPEDIA_API}?${new URLSearchParams({ ...params, format: 'json', origin: '*' })}`;
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const payload = await response.json();
    if (!payload || typeof payload !== 'object' || payload.error) throw new Error('INVALID_RESPONSE');
    return payload;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}

function applyCachedImages(flowers, cache) {
  if (!cache || typeof cache !== 'object') return 0;
  let applied = 0;
  flowers.forEach((flower) => {
    if (flower.id === 'pansy') return;
    if (flower.imageCredit?.curated) return;
    const item = cache[flower.id];
    if (!item?.url || !/^https:\/\//i.test(item.url)) return;
    flower.localImage ||= flower.image;
    flower.image = item.url;
    flower.imageCredit = {
      creator: item.creator || '',
      license: item.license || '',
      sourceUrl: /^https:\/\//i.test(item.sourceUrl || '') ? item.sourceUrl : ''
    };
    applied += 1;
  });
  return applied;
}

function buildTitleMap(payload, requestedTitles) {
  const alias = new Map(requestedTitles.map((title) => [title, title]));
  for (const item of payload?.query?.normalized || []) alias.set(item.to, alias.get(item.from) || item.from);
  for (const item of payload?.query?.redirects || []) alias.set(item.to, alias.get(item.from) || item.from);
  return alias;
}

async function fetchPageImages(flowers, { signal } = {}) {
  const result = new Map();
  const candidates = flowers.filter((flower) => flower.id !== 'pansy' && !flower.imageCredit?.curated);
  for (const group of chunk(candidates)) {
    const titles = group.map((flower) => cleanScientificName(flower.scientificName || flower.nameEn)).filter(Boolean);
    if (!titles.length) continue;
    const payload = await fetchJson({
      action: 'query',
      prop: 'pageimages',
      piprop: 'thumbnail|name',
      pithumbsize: '1200',
      redirects: '1',
      titles: titles.join('|')
    }, { signal });
    const titleMap = buildTitleMap(payload, titles);
    const byQuery = new Map(group.map((flower) => [cleanScientificName(flower.scientificName || flower.nameEn), flower]));
    for (const page of Object.values(payload?.query?.pages || {})) {
      if (!page?.pageimage || !page?.thumbnail?.source) continue;
      const originalTitle = titleMap.get(page.title) || page.title;
      let flower = byQuery.get(originalTitle);
      if (!flower) {
        const normalizedPage = cleanScientificName(page.title).toLowerCase();
        flower = group.find((candidate) => {
          const name = cleanScientificName(candidate.scientificName || candidate.nameEn).toLowerCase();
          return name === normalizedPage || name.startsWith(`${normalizedPage} `) || normalizedPage.startsWith(`${name} `);
        });
      }
      if (flower) result.set(flower.id, { fileTitle: `File:${page.pageimage}`, previewUrl: page.thumbnail.source });
    }
  }
  return result;
}

async function fetchImageMetadata(pageImages, { signal } = {}) {
  const entries = [...pageImages.entries()];
  const metadata = new Map();
  for (const group of chunk(entries)) {
    const payload = await fetchJson({
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata',
      iiurlwidth: '1200',
      iiextmetadatafilter: 'LicenseShortName|Artist|Credit',
      titles: group.map(([, item]) => item.fileTitle).join('|')
    }, { signal });
    const pageByTitle = new Map(Object.values(payload?.query?.pages || {}).map((page) => [page.title, page]));
    for (const [flowerId, pageImage] of group) {
      const page = pageByTitle.get(pageImage.fileTitle);
      const info = page?.imageinfo?.[0];
      const ext = info?.extmetadata || {};
      const license = stripHtml(ext.LicenseShortName?.value || '');
      if (!ACCEPTED_LICENSE.test(license)) continue;
      const url = info?.thumburl || pageImage.previewUrl;
      if (!/^https:\/\//i.test(url || '')) continue;
      metadata.set(flowerId, {
        url,
        creator: stripHtml(ext.Artist?.value || ext.Credit?.value || ''),
        license,
        sourceUrl: /^https:\/\//i.test(info?.descriptionurl || '') ? info.descriptionurl : ''
      });
    }
  }
  return metadata;
}

async function hydrateReferenceImages(flowers, { signal, onUpdate } = {}) {
  if (!Array.isArray(flowers) || !flowers.length || typeof fetch !== 'function') return { applied: 0, source: 'none' };
  const cached = getCache(CACHE_KEY);
  const cachedCount = applyCachedImages(flowers, cached);
  if (cachedCount) onUpdate?.();

  try {
    const pageImages = await fetchPageImages(flowers, { signal });
    if (!pageImages.size) return { applied: cachedCount, source: cachedCount ? 'cache' : 'none' };
    const metadata = await fetchImageMetadata(pageImages, { signal });
    if (!metadata.size) return { applied: cachedCount, source: cachedCount ? 'cache' : 'none' };
    const nextCache = { ...(cached && typeof cached === 'object' ? cached : {}) };
    for (const [flowerId, item] of metadata) nextCache[flowerId] = item;
    setCache(CACHE_KEY, nextCache, CACHE_TTL_MS);
    const applied = applyCachedImages(flowers, nextCache);
    onUpdate?.();
    return { applied, source: 'network' };
  } catch (error) {
    return { applied: cachedCount, source: cachedCount ? 'cache' : 'fallback' };
  }
}
return { "cleanScientificName": cleanScientificName, "hydrateReferenceImages": hydrateReferenceImages };
})();

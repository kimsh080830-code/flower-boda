__mods["js/flowerService.js"] = (() => {
const { APP_CONFIG, SUPPORTED_IMAGE_EXTENSIONS, SUPPORTED_IMAGE_TYPES } = __mods["js/config.js"];
const { FLOWERS } = __mods["js/data.js"];
const { getBloomStatus } = __mods["js/dateUtils.js"];
const { hooks:runtimeHooks } = __mods["js/runtimeHooks.js"];

class FlowerServiceError extends Error {
  constructor(code, message, cause) {
    super(message);
    this.name = 'FlowerServiceError';
    this.code = code;
    this.cause = cause;
  }
}

function extensionOf(name = '') {
  const match = name.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] || '';
}

function validateImageFile(file) {
  if (!file) return { ok: false, code: 'NO_FILE', message: '사진이 선택되지 않았어요.' };
  const ext = extensionOf(file.name);
  const hasMime = Boolean(file.type);
  const hasExt = Boolean(ext);
  const mimeOk = hasMime && SUPPORTED_IMAGE_TYPES.includes(file.type);
  const extOk = hasExt && SUPPORTED_IMAGE_EXTENSIONS.includes(ext);
  if ((hasMime && !mimeOk) || (hasExt && !extOk) || (!hasMime && !hasExt)) {
    return { ok: false, code: 'UNSUPPORTED_TYPE', message: 'JPG, JPEG, PNG, WEBP 사진만 사용할 수 있어요.' };
  }
  if (file.size <= 0) return { ok: false, code: 'EMPTY_FILE', message: '비어 있는 파일은 사용할 수 없어요.' };
  if (file.size > APP_CONFIG.MAX_IMAGE_BYTES) {
    return { ok: false, code: 'FILE_TOO_LARGE', message: '사진이 조금 커요. 12MB 이하 사진을 골라주세요.' };
  }
  return { ok: true };
}

async function decodeImage(file) {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      // Some browsers require decoding through an image element.
    }
  }
  return await new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new FlowerServiceError('DECODE_FAILED', '사진을 읽기 어려워요. 다른 사진을 골라주세요.'));
    };
    image.src = objectUrl;
  });
}

function calculateAverageRgb(context, width, height) {
  const sampleSize = 32;
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleSize;
  sampleCanvas.height = sampleSize;
  const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
  sampleCtx.drawImage(context.canvas, 0, 0, width, height, 0, 0, sampleSize, sampleSize);
  const { data } = sampleCtx.getImageData(0, 0, sampleSize, sampleSize);
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 16) {
    const alpha = data[i + 3] / 255;
    if (alpha < 0.25) continue;
    r += data[i]; g += data[i + 1]; b += data[i + 2]; count += 1;
  }
  return count ? { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) } : { r: 128, g: 128, b: 128 };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new FlowerServiceError('ENCODE_FAILED', '사진을 처리하지 못했어요.')), type, quality);
  });
}

async function preprocessImage(file) {
  const validation = validateImageFile(file);
  if (!validation.ok) throw new FlowerServiceError(validation.code, validation.message);
  let decoded;
  try {
    decoded = await decodeImage(file);
    const sourceWidth = decoded.width;
    const sourceHeight = decoded.height;
    if (!sourceWidth || !sourceHeight) throw new Error('Invalid image dimensions');
    const scale = Math.min(1, APP_CONFIG.MAX_IMAGE_EDGE / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(decoded, 0, 0, width, height);
    const averageRgb = calculateAverageRgb(ctx, width, height);
    const blob = await canvasToBlob(canvas, 'image/jpeg', APP_CONFIG.IMAGE_QUALITY);
    const thumbScale = Math.min(1, 360 / Math.max(width, height));
    const thumb = document.createElement('canvas');
    thumb.width = Math.max(1, Math.round(width * thumbScale));
    thumb.height = Math.max(1, Math.round(height * thumbScale));
    thumb.getContext('2d').drawImage(canvas, 0, 0, thumb.width, thumb.height);
    const thumbnailDataUrl = thumb.toDataURL('image/jpeg', 0.72);
    return { blob, width, height, sourceWidth, sourceHeight, lowResolution: Math.min(sourceWidth, sourceHeight) < 800, averageRgb, thumbnailDataUrl };
  } catch (error) {
    if (error instanceof FlowerServiceError) throw error;
    throw new FlowerServiceError('DECODE_FAILED', '사진을 처리하기 어려워요. 다른 사진을 골라주세요.', error);
  } finally {
    if (decoded?.close) decoded.close();
  }
}

function colorHint({ r, g, b } = {}) {
  if ([r, g, b].some((v) => typeof v !== 'number')) return null;
  const max = Math.max(r, g, b); const min = Math.min(r, g, b);
  if (max - min < 28 && max > 180) return '흰색';
  if (r > g * 1.25 && r > b * 1.25) return r > 210 && g > 90 ? '주황' : '빨강';
  if (b > r * 1.12 && b > g * 1.05) return r > 120 ? '보라' : '파랑';
  if (r > 185 && g > 150 && b < 120) return '노랑';
  if (r > 170 && b > 130 && g < r * 0.9) return '분홍';
  return null;
}

function normalizeScientificName(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[×]/g, ' ')
    .replace(/[^a-z0-9.\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeMatchName(value = '') {
  return String(value)
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[()\[\]{},._/\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scientificTokens(value = '') {
  return normalizeScientificName(value)
    .split(' ')
    .filter((token) => token && !['group', 'hybrids', 'hybrid', 'cultivars', 'cultivar'].includes(token));
}

function flowerMatchNames(flower) {
  return [
    flower.nameKo,
    flower.standardNameKo,
    flower.nameEn,
    ...(flower.alternateNames || []),
    ...(flower.searchKeywords || [])
  ].filter(Boolean).map(normalizeMatchName).filter(Boolean);
}

function scoreInternalFlowerMatch(species = {}, flower) {
  const apiScientific = scientificTokens(species.scientificNameWithoutAuthor || species.scientificName || '');
  const internalScientific = scientificTokens(flower.scientificName || '');
  let score = 0;

  if (apiScientific.length && internalScientific.length) {
    const apiJoined = apiScientific.join(' ');
    const internalJoined = internalScientific.join(' ');
    if (apiJoined === internalJoined) score = 1;
    else if (apiScientific[0] === internalScientific[0] && apiScientific[1] && internalScientific[1] && apiScientific[1] === internalScientific[1]) score = Math.max(score, 0.98);
    else if (apiScientific[0] === internalScientific[0] && ['spp.', 'spp'].includes(internalScientific[1])) score = Math.max(score, 0.78);
  }

  const apiNames = Array.isArray(species.commonNames)
    ? species.commonNames.map(normalizeMatchName).filter(Boolean)
    : [];
  const internalNames = flowerMatchNames(flower);
  for (const apiName of apiNames) {
    for (const internalName of internalNames) {
      if (apiName === internalName) score = Math.max(score, 0.96);
      else if (apiName.length >= 3 && internalName.length >= 3 && (apiName.includes(internalName) || internalName.includes(apiName))) {
        score = Math.max(score, 0.86);
      }
    }
  }
  return score;
}

function findBestInternalFlower(species = {}) {
  let best = null;
  for (const flower of FLOWERS) {
    const quality = scoreInternalFlowerMatch(species, flower);
    if (!best || quality > best.quality) best = { flower, quality };
  }
  return best && best.quality >= 0.76 ? best : { flower: null, quality: 0 };
}

function normalizePlantNetResponse(payload, context = {}) {
  const rawResults = Array.isArray(payload?.results) ? payload.results : [];
  const hint = colorHint(context.averageRgb);
  const now = context.currentDate instanceof Date ? context.currentDate : new Date();
  const deduped = new Map();

  rawResults.slice(0, APP_CONFIG.PHOTO_API_RESULT_POOL || 20).forEach((item, index) => {
    const species = item?.species || {};
    const { flower: match, quality: matchQuality } = findBestInternalFlower(species);
    const scientificName = species.scientificNameWithoutAuthor || species.scientificName || '';
    const confidence = Number.isFinite(Number(item?.score)) ? Math.max(0, Math.min(1, Number(item.score))) : 0;
    const colorBoost = match && hint && match.colors.includes(hint) ? 0.002 : 0;
    const bloomCode = match ? getBloomStatus(match.bloom, now).code : '';
    const seasonBoost = match && ['in-season', 'ending', 'soon'].includes(bloomCode) ? 0.001 : 0;
    const exactMatchBoost = matchQuality >= 0.95 ? 0.010 : matchQuality >= 0.85 ? 0.004 : 0;
    const rankingScore = confidence + exactMatchBoost + colorBoost + seasonBoost;
    const candidate = {
      candidateId: match?.id || `api:${scientificName || index}`,
      flowerId: match?.id || null,
      nameKo: match?.nameKo || species.commonNames?.[0] || '이름 확인 필요',
      nameEn: match?.nameEn || species.commonNames?.[0] || '',
      scientificName,
      confidence,
      rankingScore,
      matchQuality,
      apiRank: index + 1,
      image: match?.image || 'assets/flowers/flower-fallback-01.webp',
      fallbackImage: match?.localImage || match?.image || '',
      matched: Boolean(match)
    };
    const key = match?.id || normalizeScientificName(scientificName) || candidate.candidateId;
    const previous = deduped.get(key);
    if (!previous || candidate.rankingScore > previous.rankingScore) deduped.set(key, candidate);
  });

  return [...deduped.values()]
    .sort((a, b) => b.rankingScore - a.rankingScore || a.apiRank - b.apiRank)
    .slice(0, APP_CONFIG.MAX_CANDIDATES)
    .map(({ rankingScore, matchQuality, apiRank, ...candidate }) => candidate)
    .filter((candidate) => candidate.scientificName || candidate.flowerId);
}

async function analyzeViaBackend(preprocessed, signal) {
  if (runtimeHooks.shouldForceNetworkFailure()) throw new FlowerServiceError('NETWORK','네트워크 연결을 확인해 주세요.');
  const formData = new FormData();
  formData.append('images', preprocessed.blob, 'flower.jpg');
  formData.append('organs', 'flower');
  let response;
  try {
    response = await fetch(APP_CONFIG.API.identify, { method: 'POST', body: formData, headers: { 'Accept': 'application/json' }, signal });
  } catch (error) {
    throw new FlowerServiceError('NETWORK', APP_CONFIG.IS_RENDER_API
      ? 'Render 사진 분석 서버가 준비 중이거나 연결이 지연되고 있어요. 잠시 후 다시 시도해 주세요.'
      : '인터넷 연결을 확인하고 다시 시도해보세요.', error);
  }
  if (!response.ok) {
    const contentType = response.headers?.get?.('content-type') || '';
    if (APP_CONFIG.IS_RENDER_API && [502, 503, 504].includes(response.status) && !/application\/json/i.test(contentType)) {
      throw new FlowerServiceError('API_WAKING', 'Render 사진 분석 서버가 준비 중이에요. 잠시 기다린 뒤 다시 시도해 주세요.');
    }
    const unavailable = [404, 501, 502, 503, 504].includes(response.status);
    throw new FlowerServiceError(unavailable ? 'API_UNAVAILABLE' : 'API_ERROR', unavailable ? '사진 분석 서버를 사용할 수 없어요. 연결과 API 설정을 확인해 주세요.' : '꽃 찾기에 잠시 문제가 있어요. 다시 시도해보세요.');
  }
  let payload;
  try { payload = await response.json(); } catch (error) {
    throw new FlowerServiceError('INVALID_RESPONSE', '꽃 분석 응답을 확인하지 못했어요.', error);
  }
  const candidates = normalizePlantNetResponse(payload, { averageRgb: preprocessed.averageRgb, currentDate: new Date() });
  if (!candidates.length) throw new FlowerServiceError('NO_RESULT', '꽃을 잘 찾지 못했어요. 꽃이 크게 보이도록 다시 찍어보세요.');
  return candidates;
}

async function analyzeFlower({ preprocessed, signal }) {
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
  if (APP_CONFIG.STANDALONE) throw new FlowerServiceError('SERVER_REQUIRED','사진 검색은 서버에서 사용할 수 있어요.');
  return {source:'api',candidates:await analyzeViaBackend(preprocessed,signal)};
}
return { "FlowerServiceError": FlowerServiceError, "validateImageFile": validateImageFile, "preprocessImage": preprocessImage, "normalizePlantNetResponse": normalizePlantNetResponse, "analyzeFlower": analyzeFlower };
})();

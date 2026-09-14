__mods["js/searchUtils.js"] = (() => {
const GENERIC_TOKENS = new Set(['식물', 'flower', 'flowers']);
const PERIOD_ONLY_TOKENS = new Set(['초', '초순', '중', '중순', '말', '말순', '말일', '월초', '월중', '월말']);
const TOKEN_ALIASES = new Map([
  ['하얀', '흰색'], ['하양', '흰색'], ['흰', '흰색'], ['흰색', '흰색'],
  ['노란', '노랑'], ['노랑색', '노랑'], ['노란색', '노랑'],
  ['빨간', '빨강'], ['빨강색', '빨강'], ['빨간색', '빨강'],
  ['분홍색', '분홍'], ['핑크', '분홍'],
  ['보라색', '보라'], ['자주색', '보라'],
  ['파란', '파랑'], ['파란색', '파랑'], ['푸른', '파랑'], ['블루', '파랑'],
  ['주황색', '주황'], ['오렌지색', '주황']
]);
const INITIAL_CONSONANTS = Object.freeze([...'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ']);

function normalizeSearch(value = '') {
  return String(value)
    .trim()
    .replace(/[,_/·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('ko-KR');
}

function normalizeToken(token = '') {
  let value = normalizeSearch(token).replace(/[()\[\]{}.!?]+/g, '');
  if (!value) return '';
  if (/^(봄|여름|가을|겨울)꽃$/.test(value)) value = value.slice(0, -1);
  if (value.endsWith('꽃') && value.length > 1) {
    const stem = value.slice(0, -1);
    value = TOKEN_ALIASES.get(stem) || stem;
  }
  return TOKEN_ALIASES.get(value) || value;
}

function tokenizeSearch(query = '') {
  return normalizeSearch(query)
    .split(' ')
    .map(normalizeToken)
    .filter((token) => token && !GENERIC_TOKENS.has(token) && !PERIOD_ONLY_TOKENS.has(token));
}

function flowerSearchTerms(flower) {
  return [
    flower.nameKo,
    flower.nameEn,
    flower.scientificName,
    flower.standardNameKo,
    ...(flower.alternateNames || []),
    ...(flower.colors || []),
    ...(flower.seasons || []),
    ...(flower.searchKeywords || []),
    flower.family,
    flower.genus,
    flower.taxonomy?.majorGroupKo,
    flower.taxonomy?.majorGroup,
    flower.taxonomy?.orderKo,
    flower.taxonomy?.order,
    flower.taxonomy?.familyKo,
    flower.taxonomy?.familyLatin,
    flower.taxonomy?.genusKo,
    flower.taxonomy?.genusLatin,
    flower.taxonomy?.acceptedName,
    flower.taxonomy?.taxonType
  ].filter(Boolean).map(normalizeSearch);
}

function flowerNameTerms(flower) {
  return [
    flower.standardNameKo,
    flower.nameKo,
    ...(flower.alternateNames || [])
  ].filter(Boolean).map(normalizeSearch);
}

function getKoreanInitials(value = '') {
  return normalizeSearch(value).split('').map((character) => {
    const code = character.charCodeAt(0);
    if (code < 0xac00 || code > 0xd7a3) return character;
    return INITIAL_CONSONANTS[Math.floor((code - 0xac00) / 588)];
  }).join('');
}

function isInitialConsonantToken(value = '') {
  return /^[ㄱ-ㅎ]+$/.test(value);
}

function matchesFlowerSearch(flower, query) {
  const normalizedQuery = normalizeSearch(query);
  if (!normalizedQuery) return true;
  const tokens = tokenizeSearch(query);
  if (!tokens.length) return false;
  const terms = flowerSearchTerms(flower);
  const initialTerms = flowerNameTerms(flower).map(getKoreanInitials);
  return tokens.every((token) => isInitialConsonantToken(token)
    ? initialTerms.some((term) => term.includes(token))
    : terms.some((term) => term.includes(token)));
}

function debounce(fn, wait = 180) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
return { "normalizeSearch": normalizeSearch, "tokenizeSearch": tokenizeSearch, "getKoreanInitials": getKoreanInitials, "matchesFlowerSearch": matchesFlowerSearch, "debounce": debounce };
})();

__mods["js/flowerDataPolicy.js"] = (() => {
const { FLOWERS } = __mods["js/data.js"];

const FLOWER_DATA_POLICY = Object.freeze({
  version: 'V55',
  scope: Object.freeze({
    include: Object.freeze(['angiosperm-herb', 'angiosperm-shrub', 'angiosperm-tree', 'angiosperm-vine']),
    exclude: Object.freeze(['gymnosperm', 'fern', 'moss', 'non-flowering-plant']),
    note: '나무꽃을 포함한 속씨식물의 실제 꽃을 도감 대상으로 취급한다.'
  }),
  validationFields: Object.freeze([
    'nameKo', 'nameEn', 'scientificName', 'acceptedScientificName', 'family', 'genus', 'taxonRank',
    'bloom.start', 'bloom.end', 'koreaViewingPeriod', 'flowerFeatures', 'leafFeatures',
    'identificationFeatures', 'habitat'
  ]),
  bloom: Object.freeze({
    meaning: 'operational-estimate',
    absoluteObservationDate: false,
    variability: Object.freeze(['region', 'temperature', 'cultivar', 'elevation', 'year']),
    note: 'bloom.start/end는 앱 운영용 예상 범위이며 실제 개화일을 단정하지 않는다.'
  }),
  duplicateStatuses: Object.freeze(['NEW', 'DUPLICATE', 'OVERLAP', 'REVIEW_REQUIRED'])
});

const REVIEW_REQUIRED_BY_ID = Object.freeze({
  rose: Object.freeze({ reason: 'Rosa 속 여러 종·원예품종을 묶는 통칭이라 단일 accepted taxon으로 고정할 수 없음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  'cherry-blossom': Object.freeze({ reason: '벚꽃은 여러 Prunus 계통의 꽃을 묶는 공통명 그룹이라 단일 species로 자동 병합하면 안 됨.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  dandelion: Object.freeze({ reason: 'Taraxacum spp. 다종 통칭으로 현재 레코드만으로 단일 accepted taxon을 결정할 수 없음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  aster: Object.freeze({ reason: '원예명 아스타가 여러 유사 분류군에 쓰이며 현재 Symphyotrichum spp. 범위도 다종 통칭임.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  daffodil: Object.freeze({ reason: 'Narcissus spp. 여러 종·원예품종 통칭으로 단일 accepted taxon을 지정하지 않음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  lily: Object.freeze({ reason: 'Lilium spp. 여러 종·원예품종 통칭으로 단일 accepted taxon을 지정하지 않음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  'plum-blossom-red': Object.freeze({ reason: '홍매화는 Prunus mume의 붉은 꽃 재배품종군을 가리키므로 species 레코드와 자동 병합하지 않음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  gerbera: Object.freeze({ reason: '현재 레코드는 Gerbera jamesonii 계통의 원예 교잡군을 의미해 G. jamesonii 한 종과 동일 taxon으로 단정하지 않음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) }),
  marigold: Object.freeze({ reason: 'Tagetes spp. 여러 종·원예품종 통칭으로 단일 accepted taxon을 지정하지 않음.', fields: Object.freeze(['acceptedScientificName', 'taxonRank', 'taxonId']) })
});

const TAXON_IDENTITY_OVERRIDES = Object.freeze({
  gaura: Object.freeze({
    acceptedScientificName: 'Oenothera lindheimeri',
    synonyms: Object.freeze(['Gaura lindheimeri']),
    taxonRank: 'species',
    source: 'Kew POWO'
  }),
  verbena: Object.freeze({
    acceptedScientificName: 'Glandularia × hybrida',
    synonyms: Object.freeze(['Verbena × hybrida', 'Verbena × hortensis']),
    taxonRank: 'hybrid',
    source: 'Kew POWO'
  })
});

function clean(value) {
  return String(value || '').trim();
}

function normalizeTaxonText(value) {
  return clean(value).replace(/\s+/g, ' ').toLocaleLowerCase('en-US');
}

function inferExactTaxonRank(flower) {
  const type = clean(flower?.taxonomy?.taxonType);
  if (type === '종' || type === '종(재배기원)') return 'species';
  if (['교잡종', '인공교잡종', '원예교잡종'].includes(type)) return 'hybrid';
  return null;
}

function isBroadRecord(flower) {
  const value = clean(flower?.scientificName);
  const type = clean(flower?.taxonomy?.taxonType);
  return /\bspp\.?\b/i.test(value)
    || /\bgroup\b/i.test(value)
    || /\bcultivars?\b/i.test(value)
    || /\bhybrids?\b/i.test(value)
    || /통칭|품종군|교잡계통/.test(type);
}

function getFlowerTaxonIdentity(flower) {
  if (!flower) return null;
  const override = TAXON_IDENTITY_OVERRIDES[flower.id] || null;
  const review = REVIEW_REQUIRED_BY_ID[flower.id] || null;
  const rank = override?.taxonRank || inferExactTaxonRank(flower);
  const acceptedFromTaxonomy = clean(flower.taxonomy?.acceptedName);
  const canUseAcceptedDirectly = !review && Boolean(rank) && acceptedFromTaxonomy;
  return Object.freeze({
    id: clean(flower.id),
    scientificName: clean(flower.scientificName),
    acceptedScientificName: override?.acceptedScientificName || (canUseAcceptedDirectly ? acceptedFromTaxonomy : null),
    synonyms: Object.freeze([...(override?.synonyms || [])]),
    taxonRank: rank,
    taxonId: null,
    genus: clean(flower.taxonomy?.genusLatin || flower.genus),
    recordScope: review ? 'multi-or-cultivated-group' : 'taxon',
    reviewRequired: Boolean(review),
    reviewReason: review?.reason || '',
    source: override?.source || 'existing-curated-taxonomy'
  });
}

function isFloweringPlantRecord(flower) {
  const group = clean(flower?.taxonomy?.majorGroup);
  return ['eudicots', 'monocots', 'magnoliids'].includes(group);
}

function toNameSet(identity) {
  return new Set([
    identity?.scientificName,
    identity?.acceptedScientificName,
    ...(identity?.synonyms || [])
  ].map(normalizeTaxonText).filter(Boolean));
}

function identityFromCandidate(candidate) {
  if (!candidate) return null;
  if (candidate.taxonomy || candidate.nameKo) return getFlowerTaxonIdentity(candidate);
  const synonyms = Array.isArray(candidate.synonyms)
    ? candidate.synonyms
    : candidate.synonym ? [candidate.synonym] : [];
  return {
    id: clean(candidate.id),
    scientificName: clean(candidate.scientificName),
    acceptedScientificName: clean(candidate.acceptedScientificName) || null,
    synonyms: synonyms.map(clean).filter(Boolean),
    taxonRank: clean(candidate.taxonRank) || null,
    taxonId: clean(candidate.taxonId) || null,
    genus: clean(candidate.genus || candidate.genusLatin),
    recordScope: clean(candidate.recordScope) || 'taxon',
    reviewRequired: Boolean(candidate.reviewRequired)
  };
}

function isGroupScope(identity) {
  if (!identity) return false;
  return identity.recordScope !== 'taxon'
    || /\bspp\.?\b/i.test(identity.scientificName || '')
    || /\bgroup\b|\bcultivars?\b|\bhybrids?\b/i.test(identity.scientificName || '');
}

function classifyFlowerCandidate(candidate, existingFlowers = FLOWERS) {
  const incoming = identityFromCandidate(candidate);
  if (!incoming) return Object.freeze({ status: 'REVIEW_REQUIRED', matches: Object.freeze([]), reasons: Object.freeze(['candidate-missing']) });

  const hasIdentity = Boolean(incoming.id || incoming.scientificName || incoming.acceptedScientificName || incoming.taxonId);
  if (!hasIdentity) return Object.freeze({ status: 'REVIEW_REQUIRED', matches: Object.freeze([]), reasons: Object.freeze(['identity-insufficient']) });

  const matches = [];
  const reasons = [];
  let overlap = false;

  for (const flower of existingFlowers || []) {
    const existing = identityFromCandidate(flower);
    if (!existing) continue;

    if (incoming.id && existing.id && incoming.id === existing.id) {
      matches.push(existing.id); reasons.push('same-id');
      continue;
    }
    if (incoming.taxonId && existing.taxonId && incoming.taxonId === existing.taxonId) {
      matches.push(existing.id); reasons.push('same-taxon-id');
      continue;
    }

    const incomingAccepted = normalizeTaxonText(incoming.acceptedScientificName);
    const existingAccepted = normalizeTaxonText(existing.acceptedScientificName);
    if (incomingAccepted && existingAccepted && incomingAccepted === existingAccepted) {
      matches.push(existing.id); reasons.push('same-accepted-taxon');
      continue;
    }

    const incomingNames = toNameSet(incoming);
    const existingNames = toNameSet(existing);
    if ([...incomingNames].some((name) => existingNames.has(name))) {
      matches.push(existing.id); reasons.push('scientific-name-or-synonym-match');
      continue;
    }

    const sameGenus = incoming.genus && existing.genus
      && normalizeTaxonText(incoming.genus) === normalizeTaxonText(existing.genus);
    if (sameGenus && (isGroupScope(incoming) || isGroupScope(existing))) {
      overlap = true;
      matches.push(existing.id);
      reasons.push('group-species-overlap');
    }
  }

  if (reasons.some((reason) => ['same-id', 'same-taxon-id', 'same-accepted-taxon', 'scientific-name-or-synonym-match'].includes(reason))) {
    return Object.freeze({ status: 'DUPLICATE', matches: Object.freeze([...new Set(matches)]), reasons: Object.freeze([...new Set(reasons)]) });
  }
  if (overlap) {
    return Object.freeze({ status: 'OVERLAP', matches: Object.freeze([...new Set(matches)]), reasons: Object.freeze([...new Set(reasons)]) });
  }
  if (incoming.reviewRequired || (!incoming.scientificName && !incoming.acceptedScientificName && !incoming.taxonId)) {
    return Object.freeze({ status: 'REVIEW_REQUIRED', matches: Object.freeze([]), reasons: Object.freeze(['identity-ambiguous']) });
  }
  return Object.freeze({ status: 'NEW', matches: Object.freeze([]), reasons: Object.freeze(['no-identity-match']) });
}

function normalizeReproductiveInfo(info) {
  if (!info || typeof info !== 'object') return null;
  const flowerSex = clean(info.flowerSex);
  const sexualSystem = clean(info.sexualSystem);
  const normalized = {};
  if (flowerSex) normalized.flowerSex = flowerSex;
  if (sexualSystem) normalized.sexualSystem = sexualSystem;
  if (clean(info.femaleFlowerFeatures)) normalized.femaleFlowerFeatures = clean(info.femaleFlowerFeatures);
  if (clean(info.maleFlowerFeatures)) normalized.maleFlowerFeatures = clean(info.maleFlowerFeatures);
  if (clean(info.femaleFlowerImage)) normalized.femaleFlowerImage = clean(info.femaleFlowerImage);
  if (clean(info.maleFlowerImage)) normalized.maleFlowerImage = clean(info.maleFlowerImage);
  return Object.keys(normalized).length ? Object.freeze(normalized) : null;
}

function getFlowerDataReview() {
  const eligible = FLOWERS.filter(isFloweringPlantRecord);
  const excluded = FLOWERS.filter((flower) => !isFloweringPlantRecord(flower));
  const reviewRequired = FLOWERS
    .filter((flower) => REVIEW_REQUIRED_BY_ID[flower.id])
    .map((flower) => Object.freeze({ id: flower.id, nameKo: flower.nameKo, ...REVIEW_REQUIRED_BY_ID[flower.id] }));
  return Object.freeze({
    total: FLOWERS.length,
    floweringPlantEligible: eligible.length,
    excluded: Object.freeze(excluded.map((flower) => flower.id)),
    reviewRequired: Object.freeze(reviewRequired)
  });
}

return {
  FLOWER_DATA_POLICY,
  REVIEW_REQUIRED_BY_ID,
  TAXON_IDENTITY_OVERRIDES,
  getFlowerTaxonIdentity,
  isFloweringPlantRecord,
  classifyFlowerCandidate,
  normalizeReproductiveInfo,
  getFlowerDataReview,
  isBroadRecord
};
})();

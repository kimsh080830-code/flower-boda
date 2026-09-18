import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const dataSource = await readFile(new URL('../src/js/data.js', import.meta.url), 'utf8');
const policySource = await readFile(new URL('../src/js/flowerDataPolicy.js', import.meta.url), 'utf8');
const review = JSON.parse(await readFile(new URL('../data/flower-data-review.json', import.meta.url), 'utf8'));

function loadModules() {
  const context = vm.createContext({ console });
  new vm.Script(`const __mods=Object.create(null);\n${dataSource}\n${policySource}\nglobalThis.__result={data:__mods["js/data.js"],policy:__mods["js/flowerDataPolicy.js"]};`).runInContext(context);
  return context.__result;
}

const { data, policy } = loadModules();
const { FLOWERS } = data;

test('V55 flower scope contains only supported flowering-plant records', () => {
  const report = policy.getFlowerDataReview();
  assert.equal(FLOWERS.length, 51);
  assert.equal(report.floweringPlantEligible, 51);
  assert.deepEqual([...report.excluded], []);
  assert.ok(FLOWERS.every(policy.isFloweringPlantRecord));
});

test('V55 bloom policy keeps start/end as operational estimates, not absolute observation dates', () => {
  assert.equal(policy.FLOWER_DATA_POLICY.bloom.meaning, 'operational-estimate');
  assert.equal(policy.FLOWER_DATA_POLICY.bloom.absoluteObservationDate, false);
  assert.deepEqual([...policy.FLOWER_DATA_POLICY.bloom.variability], ['region', 'temperature', 'cultivar', 'elevation', 'year']);
  assert.ok(FLOWERS.every((flower) => /^\d{2}-\d{2}$/.test(flower.bloom.start) && /^\d{2}-\d{2}$/.test(flower.bloom.end)));
});

test('V55 taxon identity preserves broad common-name groups as review-required instead of inventing accepted taxa', () => {
  const expected = ['rose','cherry-blossom','dandelion','aster','daffodil','lily','plum-blossom-red','gerbera','marigold'];
  assert.deepEqual(Object.keys(policy.REVIEW_REQUIRED_BY_ID), expected);
  for (const id of expected) {
    const flower = FLOWERS.find((item) => item.id === id);
    const identity = policy.getFlowerTaxonIdentity(flower);
    assert.equal(identity.reviewRequired, true, id);
    assert.equal(identity.acceptedScientificName, null, id);
    assert.equal(identity.recordScope, 'multi-or-cultivated-group', id);
  }
});

test('V55 targeted accepted-name/synonym metadata does not replace stable flower IDs or display scientificName', () => {
  const gaura = FLOWERS.find((flower) => flower.id === 'gaura');
  const gauraIdentity = policy.getFlowerTaxonIdentity(gaura);
  assert.equal(gaura.id, 'gaura');
  assert.equal(gaura.scientificName, 'Oenothera lindheimeri');
  assert.equal(gauraIdentity.acceptedScientificName, 'Oenothera lindheimeri');
  assert.ok(gauraIdentity.synonyms.includes('Gaura lindheimeri'));

  const verbena = FLOWERS.find((flower) => flower.id === 'verbena');
  const verbenaIdentity = policy.getFlowerTaxonIdentity(verbena);
  assert.equal(verbena.id, 'verbena');
  assert.equal(verbena.scientificName, 'Verbena × hybrida');
  assert.equal(verbenaIdentity.acceptedScientificName, 'Glandularia × hybrida');
  assert.ok(verbenaIdentity.synonyms.includes('Verbena × hybrida'));
});

test('V55 duplicate classifier returns DUPLICATE for stable id, accepted taxon, scientific name, or synonym matches', () => {
  assert.equal(policy.classifyFlowerCandidate({ id: 'sunflower', scientificName: 'Other plant' }).status, 'DUPLICATE');
  assert.equal(policy.classifyFlowerCandidate({ scientificName: 'Helianthus annuus', taxonRank: 'species', genus: 'Helianthus' }).status, 'DUPLICATE');
  assert.equal(policy.classifyFlowerCandidate({ scientificName: 'Gaura lindheimeri', acceptedScientificName: 'Oenothera lindheimeri', taxonRank: 'species', genus: 'Oenothera' }).status, 'DUPLICATE');
  assert.equal(policy.classifyFlowerCandidate({ scientificName: 'Verbena × hybrida', acceptedScientificName: 'Glandularia × hybrida', taxonRank: 'hybrid', genus: 'Glandularia' }).status, 'DUPLICATE');
});

test('V55 duplicate classifier uses OVERLAP for broad group vs individual species and does not duplicate by genus alone', () => {
  const overlap = policy.classifyFlowerCandidate({
    id: 'rosa-canina-new', scientificName: 'Rosa canina', acceptedScientificName: 'Rosa canina', taxonRank: 'species', genus: 'Rosa'
  });
  assert.equal(overlap.status, 'OVERLAP');
  assert.ok(overlap.matches.includes('rose'));

  const sameGenusOnly = policy.classifyFlowerCandidate({
    id: 'forsythia-other', scientificName: 'Forsythia suspensa', acceptedScientificName: 'Forsythia suspensa', taxonRank: 'species', genus: 'Forsythia'
  });
  assert.equal(sameGenusOnly.status, 'NEW');
});

test('V55 duplicate classifier leaves insufficient ambiguous records as REVIEW_REQUIRED', () => {
  const result = policy.classifyFlowerCandidate({ nameKo: '새 꽃 후보' });
  assert.equal(result.status, 'REVIEW_REQUIRED');
});

test('V55 reproductive schema is optional and does not fabricate male/female fields', () => {
  assert.equal(policy.normalizeReproductiveInfo(null), null);
  assert.equal(policy.normalizeReproductiveInfo({}), null);
  assert.deepEqual(
    { ...policy.normalizeReproductiveInfo({ flowerSex: '단성화', sexualSystem: '암수한그루', femaleFlowerFeatures: '암꽃 특징' }) },
    { flowerSex: '단성화', sexualSystem: '암수한그루', femaleFlowerFeatures: '암꽃 특징' }
  );
  assert.ok(FLOWERS.every((flower) => !Object.hasOwn(flower, 'femaleFlowerFeatures') && !Object.hasOwn(flower, 'maleFlowerFeatures')));
});

test('V55 review report stays aligned with runtime policy and contains no automatic data removals', () => {
  assert.equal(review.version, 'V55');
  assert.equal(review.currentDataset.total, 45);
  assert.equal(review.currentDataset.floweringPlantEligible, 45);
  assert.deepEqual(review.currentDataset.excluded, []);
  assert.deepEqual(review.reviewRequired.map((item) => item.id), Object.keys(policy.REVIEW_REQUIRED_BY_ID));
  assert.equal(review.principles.autoMerge, false);
});

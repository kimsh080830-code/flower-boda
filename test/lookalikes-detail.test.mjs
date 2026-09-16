import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile } from 'node:fs/promises';

const dataSource = await readFile(new URL('../src/js/data.js', import.meta.url), 'utf8');
const detailsSource = await readFile(new URL('../src/js/ui/screens/details.js', import.meta.url), 'utf8');

function loadFlowers() {
  const __mods = Object.create(null);
  vm.runInNewContext(dataSource, { __mods });
  return __mods['js/data.js'].FLOWERS;
}

test('pilot flowers include structured lookalike data', () => {
  const flowers = loadFlowers();
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));
  for (const id of ['dandelion', 'morning-glory', 'azalea-korean', 'camellia', 'red-clover']) {
    const flower = byId.get(id);
    assert.ok(flower, `missing flower: ${id}`);
    assert.ok(Array.isArray(flower.lookalikes) && flower.lookalikes.length > 0, `missing lookalikes: ${id}`);
    for (const item of flower.lookalikes) {
      assert.equal(typeof item.nameKo, 'string');
      assert.equal(typeof item.reason, 'string');
      assert.ok(Array.isArray(item.differences) && item.differences.length >= 2);
      assert.equal(typeof item.tip, 'string');
    }
  }
});

test('internal lookalike targets point to existing flowers', () => {
  const flowers = loadFlowers();
  const ids = new Set(flowers.map((flower) => flower.id));
  for (const flower of flowers) {
    for (const item of flower.lookalikes || []) {
      if (item.targetId) assert.ok(ids.has(item.targetId), `invalid lookalike target: ${item.targetId}`);
    }
  }
});

test('flower detail renders lookalike comparison section and internal navigation', () => {
  assert.match(detailsSource, /비슷한 식물과 구별법/);
  assert.match(detailsSource, /lookalike-differences/);
  assert.match(detailsSource, /'open-flower'/);
  assert.match(detailsSource, /flowerId: item\.targetId/);
});


test('second lookalike batch covers five more registered flowers', () => {
  const flowers = loadFlowers();
  const byId = new Map(flowers.map((flower) => [flower.id, flower]));
  for (const id of ['royal-azalea', 'sasanqua', 'globe-amaranth', 'cherry-blossom', 'lavender']) {
    const flower = byId.get(id);
    assert.ok(flower, `missing flower: ${id}`);
    assert.ok(Array.isArray(flower.lookalikes) && flower.lookalikes.length > 0, `missing lookalikes: ${id}`);
    assert.ok(flower.lookalikes.some((item) => item.targetId), `missing internal target: ${id}`);
  }
});

test('red clover also links to globe amaranth', () => {
  const flowers = loadFlowers();
  const redClover = flowers.find((flower) => flower.id === 'red-clover');
  assert.ok(redClover?.lookalikes?.some((item) => item.targetId === 'globe-amaranth'));
});

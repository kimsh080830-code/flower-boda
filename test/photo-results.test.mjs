import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
function ui() {
  const el = (tag, props = {}, children = []) => ({ tag, props, children: children.filter(Boolean), append(...items) { this.children.push(...items.filter(Boolean)); } });
  const button = (text, action, options = {}) => el('button', { text, disabled: options.disabled, dataset: { action, ...options.data } });
  const context = vm.createContext({ __mods: {
    'js/config.js': { APP_CONFIG: { LOW_CONFIDENCE_THRESHOLD: 0.6 } },
    'js/mapPlaces.js': { getFlowerPlacesByFlowerId: () => [] },
    'js/ui/dom.js': { el, button, image: (src, alt) => el('img', { src, alt }) },
    'js/ui/components.js': { emptyState: (text, label, action) => el('div', { text }, [button(label, action)]), primaryFlowerName: (flower) => flower.nameKo, otherNameLine: () => null },
    'js/ui/screens/shared.js': { pageHeader: () => el('header') }
  } });
  for (const path of ['js/data.js', 'js/ui/screens/capture.js']) {
    const start = html.indexOf(`__mods["${path}"] = (() => {`);
    assert.ok(start >= 0, `${path} must exist`);
    const end = html.indexOf('\n})();', start) + '\n})();'.length;
    vm.runInContext(html.slice(start, end), context);
  }
  return { ...context.__mods['js/ui/screens/capture.js'], ...context.__mods['js/data.js'] };
}
const textOf = (node) => [node.props?.text || '', ...node.children.map(textOf)].join(' ');
const nodesOf = (node) => [node, ...node.children.flatMap(nodesOf)];
const candidate = (flowerId, confidence = 0.8) => ({ candidateId: flowerId || 'api:unknown', flowerId, nameKo: flowerId || '도감 밖 후보', scientificName: 'Api candidate', confidence });

test('comparison reuses only atlas facts for every flower; API-supplied traits cannot replace the atlas', () => {
  const { FLOWERS, comparisonFacts } = ui();
  for (const flower of FLOWERS) {
    const facts = comparisonFacts({ ...candidate(flower.id), flowerFeatures: 'untrusted petals', leafFeatures: 'untrusted leaves' });
    assert.equal(facts.facts[0][1], flower.flowerFeatures);
    assert.equal(facts.facts[1][1], flower.leafFeatures);
    assert.equal(facts.facts[2][1], flower.identificationFeatures);
  }
});

test('unknown and incomplete atlas data explicitly remain unknown', () => {
  const { comparisonFacts, FLOWERS } = ui();
  for (const value of [null, candidate('missing'), { flowerId: 'missing', flowerFeatures: 'invented petals' }]) {
    assert.ok(comparisonFacts(value).facts.every(([, fact]) => fact === '확인 가능한 도감 정보가 없어요.'));
  }
  const flower = FLOWERS[0];
  flower.leafFeatures = ' ';
  assert.equal(comparisonFacts(candidate(flower.id)).facts[1][1], '확인 가능한 도감 정보가 없어요.');
});

test('low confidence, close candidates, and unknown candidates trigger extra-photo guidance', () => {
  const { uncertainIdentification } = ui();
  const low = candidate('rose', 0.3);
  const high = candidate('rose', 0.9);
  assert.match(uncertainIdentification([low], low), /점수가 낮아/);
  assert.match(uncertainIdentification([high, candidate('cosmos', 0.85)], high), /비슷해요/);
  assert.match(uncertainIdentification([candidate(null, 0.9)], candidate(null, 0.9)), /도감 정보가 없어/);
  assert.equal(uncertainIdentification([high, low], high), '');
  assert.match(uncertainIdentification([high, low], low), /점수가 낮아/);
  assert.match(uncertainIdentification([candidate('rose', NaN)], candidate('rose', NaN)), /점수가 낮아/);
});

test('rendered results include equal comparison fields, atlas evidence actions and accessible selection', () => {
  const { renderCapture } = ui();
  const result = renderCapture({ selectedCandidateId: 'rose', analysisResult: { source: 'api', candidates: [candidate('rose'), candidate('cosmos', 0.4)] } });
  const text = textOf(result);
  assert.match(text, /꽃잎·꽃 모양/);
  assert.match(text, /잎 모양/);
  assert.match(text, /여러 장의 소엽으로 이루어진 겹잎/);
  assert.match(text, /실처럼 잘게 갈라진 잎/);
  assert.match(text, /외부 출처 링크가 없어 추가 확인/);
  assert.equal(nodesOf(result).filter((node) => node.props.text === '도감 보기').length, 2);
  const selection = nodesOf(result).filter((node) => node.props.dataset?.action === 'select-candidate');
  assert.equal(selection[0].props['aria-pressed'], 'true');
  assert.equal(selection[1].props['aria-pressed'], 'false');
});

test('empty/malformed results and API errors preserve recovery and do not fabricate candidates', () => {
  const { renderCapture } = ui();
  for (const candidates of [[], null, {}, [null]]) {
    const result = renderCapture({ analysisResult: { source: 'api', candidates } });
    const text = textOf(result);
    assert.match(text, /비슷한 꽃을 찾지 못했어요/);
    for (const phrase of ['꽃 정면:', '잎:', '줄기·전체 모습:']) assert.ok(text.includes(phrase));
    assert.ok(nodesOf(result).some((node) => node.props.dataset?.action === 'restart-photo'));
    assert.ok(!nodesOf(result).some((node) => node.props.dataset?.action === 'confirm-candidate'));
  }
  const failed = renderCapture({ photo: { file: { name: 'flower.jpg', size: 1000 }, objectUrl: 'blob:preview' }, error: 'API 연결 실패' });
  assert.ok(nodesOf(failed).some((node) => node.props.role === 'alert' && node.props.text === 'API 연결 실패'));
  assert.ok(nodesOf(failed).some((node) => node.props.dataset?.action === 'analyze-photo' && !node.props.disabled));
  assert.ok(!nodesOf(failed).some((node) => node.props.dataset?.action === 'select-candidate'));
});

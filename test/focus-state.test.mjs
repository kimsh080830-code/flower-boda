import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const html = await readFile(new URL('../꽃을보다_V61_dev.html', import.meta.url), 'utf8');
const helpers = html.slice(html.indexOf('let renderedTab = null;'), html.indexOf('function renderApp(state)'));
const trap = html.slice(html.indexOf('function trapModalFocus(event)'), html.indexOf('function handleKeydown(event)'));

// These focused DOM doubles verify focus state decisions. Real browser layout,
// keyboard traversal, and scrolling still need the separate UI verification.
function setup() {
  const root = { nodes: [], contains: node => root.nodes.includes(node), querySelectorAll: tag => root.nodes.filter(node => node.tagName === tag) };
  const backgrounds = [];
  const document = {
    activeElement: null, modal: null, body: { classList: { toggle: (_name, value) => { document.modalClass = value; } } },
    getElementById: id => root.nodes.find(node => node.id === id),
    querySelector: selector => selector === '.detail-layer' ? document.modal : null,
    querySelectorAll: selector => selector.startsWith('.skip-link') ? backgrounds : document.modal ? [document.modal] : []
  };
  const element = (tag, options = {}) => {
    const node = { nodeType: 1, tagName: tag.toUpperCase(), id: '', dataset: {}, tabIndex: 0, hidden: false, disabled: false, scrollTop: 0, scrollLeft: 0, textContent: '',
      getAttribute: name => node[name] || '',
      setAttribute: (name, value) => { node[name] = value; },
      closest: selector => selector === '[inert]' ? (node.inert ? node : null) : node.record ? { dataset: { recordId: node.record } } : null,
      getClientRects: () => node.hidden ? [] : [{}],
      matches: () => node.tagName === 'TEXTAREA' || node.type === 'search',
      setSelectionRange: (start, end, direction) => { node.selectionStart = start; node.selectionEnd = end; node.selectionDirection = direction; },
      focus: () => { document.activeElement = node; }, ...options };
    return node;
  };
  const context = vm.createContext({ document, state: { detail: { type: 'event', id: 'missing' } } });
  vm.runInContext(`${helpers}\n${trap}`, context);
  return { context, document, root, backgrounds, element };
}

test('an unresolved detail route cannot leave the background inert without a rendered dialog', () => {
  const { context, backgrounds, document, element } = setup();
  backgrounds.push(element('main', { inert: true }), element('nav', { inert: true }));
  context.syncModalState(null);
  assert.ok(backgrounds.every(node => node.inert === false));
  assert.equal(document.modalClass, false);
  assert.equal(context.trapModalFocus({ key: 'Tab' }), false);
});

test('refresh restores an unfinished note, caret and internal scroll on the replacement input', () => {
  const { context, document, root, element } = setup();
  const old = element('textarea', { id: 'observation-note', value: '입력 중인 메모', selectionStart: 3, selectionEnd: 6, selectionDirection: 'backward', scrollTop: 42 });
  root.nodes = [old]; document.activeElement = old;
  const snapshot = context.captureControl(root);
  const replacement = element('textarea', { id: 'observation-note', value: '이전 메모' });
  root.nodes = [replacement]; document.activeElement = null;
  assert.equal(context.focusControl(root, snapshot), true);
  assert.equal(document.activeElement, replacement);
  assert.equal(replacement.value, '입력 중인 메모');
  assert.deepEqual([replacement.selectionStart, replacement.selectionEnd, replacement.selectionDirection, replacement.scrollTop], [3, 6, 'backward', 42]);
});

test('record identity keeps focus on the correct record after neighboring rows change', () => {
  const { context, document, root, element } = setup();
  const old = element('button', { dataset: { action: 'observation-edit', recordId: 'record-2' }, record: 'record-2' });
  root.nodes = [old]; document.activeElement = old;
  const snapshot = context.captureControl(root);
  const other = element('button', { dataset: { action: 'observation-edit', recordId: 'record-3' }, record: 'record-3' });
  const replacement = element('button', { dataset: { action: 'observation-edit', recordId: 'record-2' }, record: 'record-2' });
  root.nodes = [other, replacement];
  assert.equal(context.focusControl(root, snapshot), true);
  assert.equal(document.activeElement, replacement);
  replacement.inert = true;
  assert.equal(context.focusControl(root, snapshot), false);
});

test('modal keyboard trap includes disclosures and wraps from a heading or the last control', () => {
  const { context, document, element } = setup();
  const first = element('button'), summary = element('summary'), heading = element('h2', { tabIndex: -1 });
  const modal = element('section');
  modal.querySelectorAll = selector => [first, ...(selector.includes('summary') ? [summary] : []), heading];
  modal.contains = node => [first, summary, heading, modal].includes(node);
  document.modal = modal;
  let prevented = 0;
  const press = (shiftKey = false) => context.trapModalFocus({ key: 'Tab', shiftKey, preventDefault: () => { prevented++; } });
  document.activeElement = heading;
  assert.equal(press(true), true);
  assert.equal(document.activeElement, summary);
  assert.equal(press(), true);
  assert.equal(document.activeElement, first);
  assert.equal(press(true), true);
  assert.equal(document.activeElement, summary);
  assert.equal(prevented, 3);
});

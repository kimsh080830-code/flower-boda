import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [data, imageService, dom, styles] = await Promise.all([
  readFile(new URL('../src/js/data.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/imageService.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/js/ui/dom.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles.css', import.meta.url), 'utf8')
]);

test('pansy has no image URL or inline SVG and renders as a blue color block', () => {
  const record = data.match(/flower\(\{id:'pansy'[^\n]+/u)?.[0] || '';
  assert.ok(record);
  assert.doesNotMatch(record, /localImage|image:|https?:|data:image|svg/i);
  assert.match(data, /const imageDisabled = data\.id === 'pansy'/);
  assert.match(imageService, /flower\.id === 'pansy'/);
  assert.match(imageService, /flower\.id !== 'pansy'/);
  assert.match(dom, /pansy-color-placeholder/);
  assert.match(styles, /\.pansy-color-placeholder\s*\{[^}]*background:\s*#2563eb/s);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const main = await readFile(new URL('../src/js/main.js', import.meta.url), 'utf8');
const home = await readFile(new URL('../src/js/ui/screens/home.js', import.meta.url), 'utf8');

test('home search updates results without replacing the composing input', () => {
  assert.match(main, /const updateFlowerSearchResults = debounce\(\(\) => \{/);
  assert.match(main, /function handleFlowerSearch\(value\) \{\s*state\.searchQuery = value;\s*updateFlowerSearchResults\(\);/);
  assert.match(main, /if\(state\.currentTab==='home'\) updateHomeSearchResults\(state\)/);
  assert.doesNotMatch(main, /if\(state\.currentTab==='home'\) render\(\)/);
  assert.match(home, /function updateHomeSearchResults\(state, root = document\)/);
  assert.match(home, /root\.querySelector\('#home-search-results'\)/);
  assert.match(home, /updateHomeSearchResults\(state, main\)/);
});

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../src/js/config.js', import.meta.url), 'utf8');

function loadConfig(hostname, pathname, override = '') {
  const context = { __mods: {}, URL, location: { hostname, pathname } };
  if (override) context.__FLOWER_API_BASE_URL__ = override;
  vm.runInNewContext(source, context);
  return context.__mods['js/config.js'].APP_CONFIG;
}

test('local and non-DEV pages keep same-origin API paths', () => {
  assert.deepEqual({ ...loadConfig('localhost', '/').API }, {
    identify: '/api/identify-flower', events: '/api/events', eventDetail: '/api/event-detail'
  });
  assert.deepEqual({ ...loadConfig('kimsh080830-code.github.io', '/flower-boda/').API }, {
    identify: '/api/identify-flower', events: '/api/events', eventDetail: '/api/event-detail'
  });
});

test('GitHub Pages DEV uses the Render API base in one shared configuration', () => {
  const config = loadConfig('kimsh080830-code.github.io', '/flower-boda/dev/');
  assert.equal(config.API_BASE_URL, 'https://flower-boda-api-dev.onrender.com');
  assert.equal(config.IS_RENDER_API, true);
  assert.deepEqual({ ...config.API }, {
    identify: 'https://flower-boda-api-dev.onrender.com/api/identify-flower',
    events: 'https://flower-boda-api-dev.onrender.com/api/events',
    eventDetail: 'https://flower-boda-api-dev.onrender.com/api/event-detail'
  });
});

test('an explicit API base override is normalized without duplicate slashes', () => {
  assert.equal(loadConfig('localhost', '/', 'https://api.example.test///').API.events,
    'https://api.example.test/api/events');
});

test('Render cold-start wait is long enough for a sleeping free service', () => {
  const config = loadConfig('kimsh080830-code.github.io', '/flower-boda/dev/');
  assert.ok(config.EVENT_TIMEOUT_MS >= 120000);
  assert.ok(config.ANALYSIS_TIMEOUT_MS >= 90000);
});

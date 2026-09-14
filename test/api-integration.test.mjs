import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import http from 'node:http';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const fixtureKey = 'TEST_ONLY_PRIVATE_API_CREDENTIAL';
const event = (id) => ({ contentid: String(id), title: `장미축제 ${id}`, eventstartdate: '20260901', eventenddate: '20260930', addr1: '서울특별시 중구', mapx: '126.978', mapy: '37.566' });
const envelope = (items, total = items.length) => ({ response: { header: { resultCode: '0000' }, body: { totalCount: total, items: { item: items } } } });
const identified = { results: [{ score: 0.83, species: { scientificNameWithoutAuthor: 'Rosa rugosa', commonNames: ['해당화'] } }] };

// Real HTTP requests exercise the application and a local mock upstream. This is
// deliberately separate from live credential/API verification, which needs keys.
test('API HTTP integration with a local mock upstream (not live API verification)', { timeout: 70000 }, async (t) => {
  const mode = { identify: 'success', events: 'success', detail: 'success' };
  const seen = [];
  const upstream = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const url = new URL(req.url, 'http://localhost');
    const operation = url.pathname.includes('/identify/') ? 'identify' : url.pathname.endsWith('searchFestival2') ? 'events' : 'detail';
    seen.push({ operation, url, body: Buffer.concat(chunks).toString() });
    const current = mode[operation];
    const send = (payload, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(payload)); };
    if (current === 'timeout') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.flushHeaders(); return; }
    if (current === 'http-error') return send({ error: fixtureKey }, 429);
    if (current === 'network-error') { res.setHeader('x-test-throw', 'yes'); return send({}); }
    if (current === 'malformed') { res.end('not json'); return; }
    if (current === 'invalid') return send({ response: { header: { resultCode: '30', resultMsg: fixtureKey } } });
    if (operation === 'identify') return send(current === 'empty' ? { results: [] } : identified);
    if (operation === 'events') {
      if (current === 'empty') return send(envelope([], 0));
      const number = Number(url.searchParams.get('pageNo')), size = Number(url.searchParams.get('numOfRows'));
      assert.equal(size, 200);
      const start = current === 'repeated-page' ? 0 : (number - 1) * size;
      const items = Array.from({ length: Math.min(size, 2201 - start) }, (_, offset) => event(start + offset + 1));
      if (current === 'missing-page' && number === 2) return send(envelope([], 2201));
      return send(envelope(items, current === 'changed-total' && number > 1 ? 2202 : 2201));
    }
    if (current === 'empty') return send(envelope([], 0));
    const id = current === 'wrong-id' ? '999' : url.searchParams.get('contentId');
    const item = event(id);
    if (current === 'invalid-dates') item.eventenddate = '20260230';
    if (url.pathname.endsWith('detailCommon2')) Object.assign(item, { overview: '<p>장미를 관찰해요.</p>', homepage: '<a href="https://example.org/event">행사 안내</a>' });
    else Object.assign(item, { eventplace: '서울 행사장', sponsor1: '행사 주최' });
    return send(envelope([item]));
  });
  upstream.listen(0, '127.0.0.1');
  await once(upstream, 'listening');
  t.after(() => { upstream.closeAllConnections(); upstream.close(); });
  const upstreamPort = upstream.address().port;
  // Test-only fetch redirection keeps the production server hardcoded to official
  // API hosts and tests failure redaction using an error containing a full key URL.
  const preload = `const originalFetch = globalThis.fetch; globalThis.fetch = async (input, options) => {
    const url = new URL(input); const original = url.href;
    if (!['my-api.plantnet.org','apis.data.go.kr'].includes(url.hostname)) throw new Error('Unexpected test host');
    url.protocol = 'http:'; url.hostname = '127.0.0.1'; url.port = '${upstreamPort}';
    const response = await originalFetch(url, options);
    if (response.headers.get('x-test-throw')) throw new Error(original);
    return response;
  };`;
  const child = spawn(process.execPath, [`--import=data:text/javascript;base64,${Buffer.from(preload).toString('base64')}`, fileURLToPath(new URL('../server.mjs', import.meta.url))], {
    cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '0', EVENTS_SOURCE: 'tour-api', PLANTNET_API_KEY: fixtureKey, TOUR_API_KEY: fixtureKey },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  });
  let logs = '';
  child.stderr.on('data', chunk => { logs += chunk; });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) { const exited = once(child, 'exit'); child.kill(); await exited; }
    assert.ok(!logs.includes(fixtureKey), 'server logs must never include credentials');
    assert.ok(!logs.includes('api-key=') && !logs.includes('serviceKey='), 'server logs must not contain upstream URLs');
  });
  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Application startup timed out')), 5000);
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', () => { clearTimeout(timer); reject(new Error('Application exited before listening')); });
    child.stdout.on('data', chunk => { output += chunk; const match = output.match(/localhost:(\d+)/); if (match) { clearTimeout(timer); resolve(Number(match[1])); } });
  });
  const request = async (pathname, options) => {
    const response = await fetch(`http://127.0.0.1:${port}${pathname}`, options);
    const text = await response.text();
    assert.ok(!text.includes(fixtureKey), 'API response must never contain a credential');
    return { status: response.status, body: JSON.parse(text) };
  };
  const upload = (mime = 'image/png') => {
    const form = new FormData();
    form.append('images', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6mAAAAABJRU5ErkJggg==', 'base64')], { type: mime }), 'test.png');
    return { method: 'POST', body: form };
  };

  await t.test('all 2,201 rows across 12 pages are returned without a 200 or 2,000 row cutoff', async () => {
    const result = await request('/api/events');
    assert.equal(result.status, 200);
    assert.equal(result.body.events.length, 2201);
    assert.equal(result.body.events.at(-1).contentid, '2201');
    assert.equal(new Set(result.body.events.map(item => item.contentid)).size, 2201);
    assert.equal(result.body.quality.pages, 12);
    assert.equal(result.body.quality.truncated, false);
    const calls = seen.filter(item => item.operation === 'events');
    assert.deepEqual(calls.map(item => Number(item.url.searchParams.get('pageNo'))), Array.from({ length: 12 }, (_, i) => i + 1));
    assert.ok(calls.every(item => item.url.searchParams.get('serviceKey') === fixtureKey));
  });
  await t.test('empty events are valid, upstream failures and incomplete pages never become demo or partial success', async () => {
    mode.events = 'empty';
    assert.deepEqual((await request('/api/events')).body.events, []);
    for (const value of ['http-error', 'invalid', 'malformed', 'network-error', 'missing-page', 'changed-total', 'repeated-page']) {
      mode.events = value;
      const result = await request('/api/events');
      assert.equal(result.status, 502, value);
      assert.equal(result.body.error, 'TOUR_EVENTS_ERROR');
      assert.equal(result.body.events, undefined);
    }
    mode.events = 'success';
  });
  await t.test('detail merges real upstream fields and rejects invalid, mismatched, empty and failed detail responses', async () => {
    const result = await request('/api/event-detail?contentId=201');
    assert.equal(result.status, 200);
    assert.equal(result.body.contentid, '201');
    assert.equal(result.body.eventenddate, '20260930');
    assert.equal(result.body.overview, '장미를 관찰해요.');
    assert.equal(result.body.homepage, 'https://example.org/event');
    assert.equal(result.body.verification.status, 'detail-checked');
    assert.equal((await request('/api/event-detail?contentId=invalid')).status, 400);
    for (const value of ['http-error', 'invalid', 'malformed', 'network-error', 'empty', 'wrong-id', 'invalid-dates']) {
      mode.detail = value;
      assert.equal((await request('/api/event-detail?contentId=201')).status, 502, value);
    }
    mode.detail = 'success';
  });
  await t.test('multipart upload returns scored species, forwards the photo and auto organ, and handles no candidates', async () => {
    assert.deepEqual((await request('/api/identify-flower', upload())).body, identified);
    const call = seen.find(item => item.operation === 'identify');
    assert.equal(call.url.searchParams.get('api-key'), fixtureKey);
    assert.match(call.body, /name="images"; filename="test.png"/);
    assert.match(call.body, /name="organs"\r\n\r\nauto/);
    mode.identify = 'empty';
    const empty = await request('/api/identify-flower', upload());
    assert.equal(empty.status, 200);
    assert.deepEqual(empty.body.results, []);
    mode.identify = 'success';
  });
  await t.test('invalid upload, failed provider and invalid success payload produce explicit errors', async () => {
    assert.equal((await request('/api/identify-flower', { method: 'POST', body: '{}' })).status, 415);
    assert.equal((await request('/api/identify-flower', upload('image/gif'))).status, 400);
    assert.equal((await request('/api/identify-flower', { method: 'POST', body: new FormData() })).status, 400);
    for (const value of ['http-error', 'invalid', 'malformed', 'network-error']) {
      mode.identify = value;
      const result = await request('/api/identify-flower', upload());
      assert.equal(result.status, value === 'http-error' ? 429 : 502, value);
      assert.equal(result.body.results, undefined);
    }
    mode.identify = 'success';
  });
  await t.test('timeouts include stalled response bodies for all three APIs', { timeout: 40000 }, async () => {
    mode.identify = mode.events = mode.detail = 'timeout';
    const results = await Promise.all([
      request('/api/identify-flower', upload()), request('/api/events'), request('/api/event-detail?contentId=201')
    ]);
    assert.deepEqual(results.map(result => result.status), [504, 504, 504]);
    assert.equal(results[0].body.error, 'PLANTNET_TIMEOUT');
  });
});

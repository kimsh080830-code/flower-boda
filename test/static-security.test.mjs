import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { copyFile, mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('HTTP public file boundary', { timeout: 20000 }, async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'flower-static-test-'));
  t.after(async () => {
    assert.equal(path.dirname(path.resolve(root)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(root).startsWith('flower-static-test-'));
    await rm(root, { recursive: true, force: true });
  });
  await copyFile(new URL('../server.mjs', import.meta.url), path.join(root, 'server.mjs'));
  await mkdir(path.join(root,'lib'));
  await copyFile(new URL('../lib/event-quality.mjs', import.meta.url), path.join(root, 'lib/event-quality.mjs'));
  const pages = ['꽃을보다_V61_dev.html'];
  for (const name of pages) await writeFile(path.join(root, name), `<h1>${name}</h1>`);
  const privateFiles = [
    '.env', '.env.example', 'package.json', 'package-lock.json', 'README.md',
    'TEST_REPORT.md', 'server.mjs.bak', 'config.json', 'database.sqlite',
    'index.html.bak', 'debug.log', 'preview-v47-320.png', '.git/config', 'nested/secret.json',
    'data/verified-events.json', 'research/events-200.csv', 'scripts/verify-events.mjs'
  ];
  for (const name of privateFiles) {
    await mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await writeFile(path.join(root, name), 'PRIVATE_FILE_SENTINEL');
  }
  const child = spawn(process.execPath, [path.join(root, 'server.mjs')], {
    env: { ...process.env, PORT: '0', PLANTNET_API_KEY: '', TOUR_API_KEY: '', EVENTS_SOURCE: 'tour-api' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true
  });
  t.after(async () => {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited;
    }
  });
  const port = await new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 5000);
    child.once('error', (error) => { clearTimeout(timer); reject(error); });
    child.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Server exited: ${code}`)); });
    child.stdout.on('data', (chunk) => {
      output += chunk;
      const match = output.match(/localhost:(\d+)/);
      if (match) { clearTimeout(timer); resolve(Number(match[1])); }
    });
  });
  function request(target, method = 'GET', headers = {}) {
    return new Promise((resolve, reject) => {
      // Raw request paths preserve traversal encodings for server-side validation.
      const req = http.request({ hostname: '127.0.0.1', port, path: target, method, headers }, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
        res.on('error', reject);
      });
      req.on('error', reject);
      req.setTimeout(3000, () => req.destroy(new Error('Request timed out')));
      req.end();
    });
  }
  await t.test('published pages support GET, HEAD, query strings and URL encoding', async () => {
    for (const target of ['/', ...pages.map((name) => `/${encodeURIComponent(name)}`), '/index.html?v=43', '/%69ndex.html']) {
      const result = await request(target);
      assert.equal(result.status, 200, target);
      assert.match(result.body, /^<h1>/);
      assert.equal(result.headers['x-content-type-options'], 'nosniff');
      const head = await request(target, 'HEAD');
      assert.equal(head.status, 200, target);
      assert.equal(head.body, '');
      assert.equal(head.headers['content-length'], result.headers['content-length']);
    }
  });
  await t.test('private files and alternate path spellings are denied for GET and HEAD', async () => {
    const targets = [
      '/server.mjs', '/lib/event-quality.mjs', ...privateFiles.map((name) => `/${encodeURIComponent(name)}`),
      '/SERVER.MJS', '/Server.mjs', '/PACKAGE.JSON', '/readme.md', '/%73erver.mjs',
      '/%2eenv', '/%2e%67it/config', '/nested/../server.mjs', '/%2e%2e/server.mjs',
      '/nested%2f..%2fserver.mjs', '/nested%5c..%5cserver.mjs', '/%5cserver.mjs',
      '/%252eenv', '/server.mjs.', '/server.mjs%20', '/server.mjs::$DATA',
      '/server.mjs?download=1', '/index.html/../server.mjs', '/index.html%00', '/missing.html'
    ];
    for (const target of targets) {
      for (const method of ['GET', 'HEAD']) {
        const result = await request(target, method);
        assert.equal(result.status, 404, `${method} ${target}`);
        if (method === 'GET') assert.equal(JSON.parse(result.body).error, 'NOT_FOUND');
        else assert.equal(result.body, '');
        assert.equal(result.headers['cache-control'], 'no-store');
      }
    }
  });
  await t.test('malformed URL encoding fails safely', async () => {
    for (const target of ['/%', '/%ZZ', '/%C0%AF']) {
      const result = await request(target);
      assert.equal(result.status, 400);
      assert.equal(JSON.parse(result.body).error, 'BAD_PATH');
    }
    assert.equal((await request('/')).status, 200);
  });
  await t.test('API routing and method/origin checks remain active', async () => {
    for (const [target, method, error] of [
      ['/api/events', 'GET', 'TOUR_NOT_CONFIGURED'],
      ['/api/event-detail?contentId=123', 'GET', 'TOUR_NOT_CONFIGURED'],
      ['/api/identify-flower', 'POST', 'PLANTNET_NOT_CONFIGURED']
    ]) {
      const result = await request(target, method);
      assert.equal(result.status, 503);
      assert.equal(JSON.parse(result.body).error, error);
    }
    assert.equal((await request('/', 'POST')).status, 405);
    assert.equal((await request('/api/events', 'POST')).status, 405);
    assert.equal((await request('/api/events', 'GET', { Origin: 'https://other.example' })).status, 403);
  });
});

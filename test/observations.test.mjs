import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';

const source = await readFile(new URL('../src/js/observations.js', import.meta.url), 'utf8');
const KEY = 'flower-info.collection.v1';
const LEGACY_RECORDS = 'flower-info.discoveries.v1';
const LEGACY_FAVORITES = 'flower-info.favorites.v1';
const jpeg = (size = 12) => `data:image/jpeg;base64,${Buffer.from([255, 216, 255, ...Array(size).fill(0), 255, 217]).toString('base64')}`;
const plain = (value) => JSON.parse(JSON.stringify(value));
const record = (index = 0, changes = {}) => ({
  id: `record-${index}`, flowerId: 'rose', identifiedAt: new Date(Date.UTC(2026, 8, 4, 0, index)).toISOString(),
  observedOn: '2026-09-04', note: '공원에서 관찰', photo: null, confidence: 0.8, selectedCandidate: 'Rosa spp.', ...changes
});
const collection = (records = [], favorites = []) => ({ schemaVersion: 1, records, favorites });
const backup = (records = [], favorites = []) => JSON.stringify({ format: 'flower-guide-backup', version: 1, exportedAt: '2026-09-04T12:00:00.000Z', ...collection(records, favorites) });

function runtime(initial = {}) {
  const values = new Map(Object.entries(initial));
  const flags = { failRead: false, failWrite: false, imageDecodeFails: false, widths: [], revoked: [], writes: 0, outputPhoto: jpeg() };
  const localStorage = {
    getItem(key) { if (flags.failRead) throw new Error('storage unavailable'); return values.get(key) ?? null; },
    setItem(key, value) { flags.writes++; if (flags.failWrite) throw new Error('quota exceeded'); values.set(key, value); }
  };
  const context = vm.createContext({ Date, Intl, localStorage,
    atob: (text) => Buffer.from(text, 'base64').toString('binary'),
    btoa: (text) => Buffer.from(text, 'binary').toString('base64'),
    URL: { createObjectURL: () => 'blob:test-photo', revokeObjectURL: (url) => flags.revoked.push(url) },
    Image: class { naturalWidth = 2000; naturalHeight = 1000; async decode() { if (flags.imageDecodeFails) throw new Error('decode failed'); } },
    document: { createElement: (tag) => {
      assert.equal(tag, 'canvas');
      return { width: 0, height: 0, getContext: () => ({ fillRect() {}, drawImage() {} }),
        toDataURL(type, quality) { assert.equal(type, 'image/jpeg'); assert.ok(quality <= 0.75); flags.widths.push([this.width, this.height]); return flags.outputPhoto; }
      };
    } },
    __mods: {
      'js/data.js': { FLOWERS: [{ id: 'rose' }, { id: 'cosmos' }, { id: 'tulip' }] },
      'js/config.js': { APP_CONFIG: { STORAGE_KEYS: { discoveries: LEGACY_RECORDS, favorites: LEGACY_FAVORITES } } }
    }
  });
  vm.runInContext(source, context);
  return { api: context.__mods['js/observations.js'], flags, values };
}

test('legacy discoveries migrate without deletion, keep their facts and derive Seoul observation date', () => {
  const legacy = [{ flowerId: 'rose', identifiedAt: '2026-09-03T16:30:00.000Z', confidence: 0.72, selectedCandidate: 'Rosa', imageReference: null }];
  const savedLegacy = JSON.stringify(legacy);
  const { api, values, flags } = runtime({ [LEGACY_RECORDS]: savedLegacy, [LEGACY_FAVORITES]: JSON.stringify(['rose']) });
  const before = api.loadCollection();
  assert.equal(before.error, '');
  assert.equal(before.records[0].observedOn, '2026-09-04');
  assert.equal(before.records[0].confidence, 0.72);
  assert.equal(before.records[0].selectedCandidate, 'Rosa');
  assert.equal(before.records[0].photo, null);
  assert.equal(flags.writes, 0);
  const exported = api.parseBackup(api.exportBackup());
  assert.equal(exported.records[0].id, before.records[0].id);
  assert.equal(api.persistFavorites(['rose', 'cosmos']).ok, true);
  assert.equal(values.get(LEGACY_RECORDS), savedLegacy);
  assert.deepEqual(plain(api.loadCollection().records), plain(before.records));
});

test('add, edit, remove photo, delete and favorite changes preserve unrelated records', () => {
  const { api } = runtime();
  assert.equal(api.addObservation(record()).ok, true);
  assert.equal(api.addObservation(record(1, { flowerId: 'cosmos', photo: jpeg() })).ok, true);
  assert.equal(api.persistFavorites(['rose', 'cosmos']).ok, true);
  assert.equal(api.updateObservation('record-0', { note: '잎을 다시 확인', observedOn: '2026-09-05', photo: jpeg(), id: 'changed-id', identifiedAt: '2025-01-01T00:00:00.000Z' }).ok, true);
  let saved = api.loadCollection();
  const updated = saved.records.find((item) => item.id === 'record-0');
  assert.equal(updated.identifiedAt, record().identifiedAt);
  assert.equal(updated.note, '잎을 다시 확인');
  assert.equal(updated.observedOn, '2026-09-05');
  assert.equal(updated.photo, jpeg());
  assert.equal(api.updateObservation('record-0', { photo: null }).ok, true);
  assert.equal(api.deleteObservation('record-1').ok, true);
  saved = api.loadCollection();
  assert.equal(saved.records.length, 1);
  assert.equal(saved.records[0].photo, null);
  assert.deepEqual(plain(saved.favorites), ['rose', 'cosmos']);
  assert.equal(api.updateObservation('does-not-exist', { note: 'missing' }).ok, false);
});

test('observation day, note, identity, flower and score validation refuse invalid edits atomically', () => {
  const { api, values } = runtime();
  assert.equal(api.addObservation(record()).ok, true);
  const original = values.get(KEY);
  for (const changes of [
    { observedOn: '2026-02-29' }, { observedOn: '2026-13-01' }, { observedOn: '2026-09-04T00:00:00Z' }, { observedOn: '' },
    { note: '가'.repeat(1001) }, { note: {} }, { flowerId: 'unlisted' }, { confidence: -0.1 }, { confidence: 1.1 }, { confidence: '0.5' }, { confidence: NaN }
  ]) {
    assert.equal(api.updateObservation('record-0', changes).ok, false, JSON.stringify(changes));
    assert.equal(values.get(KEY), original);
  }
  for (const changes of [{ id: '../bad-id' }, { identifiedAt: 'not-a-date' }, { identifiedAt: '2026-09-04' }]) {
    assert.equal(api.addObservation(record(1, changes)).ok, false);
    assert.equal(values.get(KEY), original);
  }
  assert.equal(api.updateObservation('record-0', { observedOn: '2024-02-29', note: '가'.repeat(1000) }).ok, true);
});

test('malformed calendar creation dates are rejected rather than silently normalized', () => {
  const { api } = runtime();
  for (const identifiedAt of ['2026-02-31T12:00:00Z', '2026-02-29T12:00:00.000Z', '2026-04-31T12:00:00+09:00']) {
    assert.equal(api.addObservation(record(0, { identifiedAt })).ok, false, identifiedAt);
    assert.throws(() => api.parseBackup(backup([record(0, { identifiedAt })])));
  }
});

test('stored photos reject external URLs, active content, wrong types, invalid base64 and excessive size', () => {
  const { api, values } = runtime();
  assert.equal(api.addObservation(record()).ok, true);
  const original = values.get(KEY);
  for (const photo of [
    'https://example.com/photo.jpg', 'blob:unavailable', 'javascript:alert(1)', 'data:image/svg+xml,<svg/>', 'data:image/png;base64,iVBORw0KGgo=',
    'data:image/jpeg;base64,not-jpeg', 'data:image/jpeg;base64,/9j/AAAA', 'data:image/jpeg;base64,/9j/A', jpeg(70000), {}, 42
  ]) {
    assert.equal(api.updateObservation('record-0', { photo }).ok, false, String(photo).slice(0, 65));
    assert.equal(values.get(KEY), original);
  }
  assert.equal(api.updateObservation('record-0', { photo: jpeg() }).ok, true);
});

test('backups reject wrong versions, damaged JSON, unknown flowers and duplicate records', () => {
  const { api } = runtime();
  for (const text of [
    '{', 'null', '[]', JSON.stringify({ version: 1 }), backup().replace('flower-guide-backup', 'other-app'),
    backup().replace('"version":1', '"version":2'), backup().replace('"schemaVersion":1', '"schemaVersion":2'),
    backup([{ ...record(), flowerId: 'unknown' }]), backup([], ['unknown']), backup([record(), record()]),
    backup([record(), record(0, { id: 'different-id' })]),
    JSON.stringify({ format: 'flower-guide-backup', version: 1, schemaVersion: 1, records: {}, favorites: [] }), ' '.repeat(1700000)
  ]) assert.throws(() => api.parseBackup(text));
  assert.deepEqual(plain(api.parseBackup(backup([record()], ['rose']))), collection([record()], ['rose']));
});

test('import previews are read-only; merge retains existing conflicts and repeated imports add nothing', () => {
  const { api, values, flags } = runtime();
  assert.equal(api.addObservation(record(0, { note: 'keep original' })).ok, true);
  assert.equal(api.persistFavorites(['rose']).ok, true);
  const current = values.get(KEY);
  const writeCount = flags.writes;
  const incoming = api.parseBackup(backup([
    record(2, { id: 'record-0', flowerId: 'tulip', note: 'same ID conflict' }),
    record(0, { id: 'other-id', note: 'same identity conflict' }),
    record(3, { flowerId: 'cosmos', photo: jpeg() })
  ], ['rose', 'cosmos']));
  const preview = api.previewImport(incoming);
  assert.equal(preview.addedRecords, 1);
  assert.equal(preview.skippedRecords, 2);
  assert.equal(preview.addedFavorites, 1);
  assert.equal(values.get(KEY), current);
  assert.equal(flags.writes, writeCount);
  const result = api.importBackup(incoming);
  assert.equal(result.ok, true);
  assert.equal(result.addedRecords, 1);
  assert.equal(api.loadCollection().records.find((item) => item.id === 'record-0').note, 'keep original');
  const again = api.importBackup(incoming);
  assert.equal(again.ok, true);
  assert.equal(again.addedRecords, 0);
  assert.equal(again.skippedRecords, 3);
  assert.equal(again.addedFavorites, 0);
  const roundtrip = api.parseBackup(api.exportBackup());
  assert.equal(roundtrip.records.length, 2);
  assert.deepEqual(plain(roundtrip.favorites), ['rose', 'cosmos']);
});

test('quota failure leaves both records and favorites unchanged during restore and ordinary writes', () => {
  const { api, values, flags } = runtime();
  assert.equal(api.addObservation(record()).ok, true);
  assert.equal(api.persistFavorites(['rose']).ok, true);
  const saved = values.get(KEY);
  flags.failWrite = true;
  for (const operation of [
    () => api.importBackup(api.parseBackup(backup([record(1)], ['cosmos']))),
    () => api.addObservation(record(2)), () => api.updateObservation('record-0', { note: 'not saved' }),
    () => api.deleteObservation('record-0'), () => api.persistFavorites(['cosmos'])
  ]) {
    const result = operation();
    assert.equal(result.ok, false);
    assert.match(result.error, /저장/);
    assert.equal(values.get(KEY), saved);
  }
});

test('record and total storage caps fail without discarding older observations', () => {
  const { api, values } = runtime();
  assert.equal(api.addObservation(record()).ok, true);
  const saved = values.get(KEY);
  const tooMany = Array.from({ length: 121 }, (_, index) => record(index));
  assert.throws(() => api.parseBackup(backup(tooMany)));
  const atLimit = collection(Array.from({ length: 120 }, (_, index) => record(index + 1)));
  assert.equal(api.importBackup(atLimit).ok, false);
  assert.equal(values.get(KEY), saved);
  const bulky = collection(Array.from({ length: 20 }, (_, index) => record(index + 1, { photo: jpeg(60000) })));
  assert.equal(api.importBackup(bulky).ok, false);
  assert.equal(values.get(KEY), saved);
});

test('corrupt or inaccessible browser data reports an error and is never replaced with an empty collection', () => {
  for (const stored of ['{', JSON.stringify({ schemaVersion: 9 }), JSON.stringify(collection([record(0, { observedOn: '2026-02-31' })]))]) {
    const { api, values } = runtime({ [KEY]: stored });
    assert.match(api.loadCollection().error, /읽지 못/);
    assert.equal(api.persistFavorites(['rose']).ok, false);
    assert.equal(api.importBackup(collection([record(1)])).ok, false);
    assert.equal(values.get(KEY), stored);
  }
  const { api, flags } = runtime();
  flags.failRead = true;
  assert.match(api.loadCollection().error, /읽지 못/);
  assert.equal(api.addObservation(record()).ok, false);
  assert.equal(flags.writes, 0);
});

test('thumbnail creation scales photos, rejects unsupported or unreadable images and releases object URLs', async () => {
  const { api, flags } = runtime();
  const file = { type: 'image/png', size: 1000 };
  assert.equal(await api.createThumbnail(file), jpeg());
  assert.deepEqual(flags.widths, [[480, 240]]);
  assert.deepEqual(flags.revoked, ['blob:test-photo']);
  await assert.rejects(api.createThumbnail({ type: 'image/svg+xml', size: 20 }));
  await assert.rejects(api.createThumbnail({ type: 'image/jpeg', size: 13 * 1024 * 1024 }));
  flags.imageDecodeFails = true;
  await assert.rejects(api.createThumbnail(file));
  assert.equal(flags.revoked.length, 2);
  flags.imageDecodeFails = false;
  flags.outputPhoto = jpeg(70000);
  await assert.rejects(api.createThumbnail(file), /너무 커/);
  assert.deepEqual(flags.widths.slice(-2), [[480, 240], [320, 160]]);
  assert.equal(flags.revoked.length, 3);
});

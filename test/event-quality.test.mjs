import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dateKey, safeUrl, flowerCategory, validateEvent, inspectTourPage, collectTourEvents, prepareSnapshot } from '../lib/event-quality.mjs';

const valid = { contentid:'1',title:'장미축제',eventstartdate:'20260904',eventenddate:'20260906',addr1:'서울특별시 중구' };
const page = (items, total = items.length) => ({ response:{ header:{ resultCode:'0000' },body:{ totalCount:total,items:{ item:items } } } });

test('invalid calendar dates, missing ends, reversed schedules and cancellation are rejected', () => {
  assert.equal(dateKey('2024.02.29'),'20240229');
  for (const value of ['2026.02.29','20261301','2026-09.01','2026x09x01']) assert.equal(dateKey(value),'');
  assert.ok(validateEvent({ ...valid,eventenddate:'' }).includes('INVALID_DATES'));
  assert.ok(validateEvent({ ...valid,eventenddate:'20260903' }).includes('REVERSED_DATES'));
  assert.ok(validateEvent({ ...valid,publicationStatus:'Cancel' }).includes('CANCELLED'));
  assert.ok(validateEvent({ ...valid,publicationStatus:'Undetermined' }).includes('UNCONFIRMED_SCHEDULE'));
});

test('malformed or failed TourAPI envelopes cannot be reported as empty successful lists', () => {
  for (const payload of [{}, { response:{ header:{ resultCode:'30' },body:{} } },
    { response:{ header:{ resultCode:'0000' },body:{ totalCount:2,items:'' } } }, page('broken',0)]) {
    assert.throws(() => inspectTourPage(payload));
  }
  assert.deepEqual(inspectTourPage(page([],0)),{ items:[],total:0 });
});

test('later pages are collected, duplicates and invalid rows counted, truncation explicit', async () => {
  const seen = [];
  const result = await collectTourEvents(async (number) => {
    seen.push(number);
    return number === 1 ? page([valid,{ ...valid,contentid:'2',eventenddate:'' }],4)
      : page([valid,{ ...valid,contentid:'3' }],4);
  },{ pageSize:2 });
  assert.deepEqual(seen,[1,2]);
  assert.deepEqual(result.events.map(e=>e.contentid),['1','3']);
  assert.equal(result.quality.rejected,1);
  assert.equal(result.quality.duplicates,1);
  assert.equal(result.quality.truncated,false);
  const limited = await collectTourEvents(async () => page([valid],50), { maxPages:1 });
  assert.equal(limited.quality.truncated,true);
  await assert.rejects(collectTourEvents(async () => page([],3)),/INCOMPLETE_PAGE/);
});

test('fireworks, snow festivals and unrelated titles are not flower events', () => {
  for (const title of ['서울세계불꽃축제','대관령눈꽃축제','강북 백맥축제']) assert.equal(flowerCategory(title),'other');
  assert.equal(flowerCategory('포천 한탄강 가든페스타'),'garden');
  assert.equal(flowerCategory('곡성세계장미축제'),'flower');
  assert.equal(safeUrl('javascript:alert(1)'),'');
  assert.equal(safeUrl('https://user:password@example.com/'),'');
});

test('the 200 collected events retain matching source evidence and expire after seven days', async () => {
  const snapshot = JSON.parse(await readFile(new URL('../data/verified-events.json',import.meta.url),'utf8'));
  assert.equal(snapshot.events.length,200);
  assert.equal(new Set(snapshot.events.map(e=>e.id)).size,200);
  for (const event of snapshot.events) {
    assert.deepEqual(validateEvent(event),[],event.title);
    assert.equal(event.verification.status,'source-checked',event.title);
    assert.equal(event.verification.evidence.httpStatus,200);
    assert.equal(event.verification.evidence.startDate,event.eventstartdate);
    assert.equal(event.verification.evidence.endDate,event.eventenddate);
    assert.match(event.verification.evidence.sha256,/^[a-f\d]{64}$/);
    assert.equal(new URL(event.sourceUrl).hostname,'korean.visitkorea.or.kr');
  }
  const checked = Date.parse(snapshot.checkedAt);
  assert.equal(prepareSnapshot(snapshot,checked).quality.stale,false);
  const old = prepareSnapshot(snapshot,checked + 8*86400000);
  assert.ok(old.events.every(e=>e.verification.status==='stale'));
  assert.equal(old.quality.stale,true);
  assert.throws(() => prepareSnapshot({ ...snapshot,events:[snapshot.events[0],snapshot.events[0]] }),/INVALID_EVENT/);
});

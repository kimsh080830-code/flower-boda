import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const read = (relative) => readFile(new URL(relative, import.meta.url), 'utf8');
const digest = (value) => createHash('sha256').update(value).digest('hex');
const approvedFlowerDigest = (source) => {
  const sandbox={__mods:Object.create(null)};
  vm.createContext(sandbox);
  vm.runInContext(source,sandbox,{filename:'src/js/data.js'});
  const flowers=sandbox.__mods['js/data.js'].FLOWERS.map((flower)=>{
    const { image, localImage, imageCredit, ...approved }=flower;
    return approved;
  });
  return digest(JSON.stringify(flowers));
};
const [components, events, details, home, observations, styles, data, snapshot] = await Promise.all([
  read('../src/js/ui/components.js'),
  read('../src/js/ui/screens/events.js'),
  read('../src/js/ui/screens/details.js'),
  read('../src/js/ui/screens/home.js'),
  read('../src/js/ui/observations.js'),
  read('../src/styles.css'),
  read('../src/js/data.js'),
  read('../src/js/eventSnapshot.js')
]);

test('event-list cards opt out of verification metadata while home uses its compact four-field row', () => {
  assert.match(components, /function eventListRow\(event, \{ compact = false, showVerification = !compact \} = \{\}\)/);
  assert.match(components, /showVerification \? el\('span', \{ className: 'event-meta', text: eventVerificationText\(event\) \}\) : null/);
  assert.match(events, /eventListRow\(event, \{ showVerification: false \}\)/);
  assert.match(home, /recommendedEvents\.forEach\(\(event\) => eventList\.append\(homeEventListRow\(event\)\)\)/);
  assert.match(home, /className: 'home-event-title'.*text: event\.title/s);
  assert.match(home, /formatEventRange\(event\)/);
  assert.match(home, /statusBadge\(event\.status\)/);
  assert.match(observations, /eventListRow\(event,\{compact:true,showVerification:false\}\)/);
  assert.match(details, /eventListRow\(event, \{ compact: true, showVerification: false \}\)/);
  assert.match(components, /function eventVerificationText\(event\)/);
});

test('event details still render verification level and date', () => {
  assert.match(details, /detailLine\('확인 수준',eventVerificationText\(event\)\)/);
  assert.match(details, /detailLine\('확인일',checkedAt\)/);
  assert.match(details, /infoDisclosure\('정보 확인'/);
});

test('approved non-image flower data and event verification data remain unchanged', () => {
  assert.equal(approvedFlowerDigest(data), '714081d5711ea09bafd2fac2d9791710fe0e9b53399d1c966f75a8871bd36efd');
  assert.equal(digest(snapshot), '32fc3db0a24dc5d46de8cd981f4e837d976909c2dadc7676cd1c65fb45ea61b1');
});

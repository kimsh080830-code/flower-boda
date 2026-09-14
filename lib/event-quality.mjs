export function plainText(value = '') {
  return String(value ?? '').replace(/<[^>]*>/g, ' ')
    .replace(/&#(x[\da-f]+|\d+);/gi, (_, code) => {
      const n = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
    })
    .replace(/&nbsp;/gi, ' ').replace(/&quot;/gi, '"').replace(/&apos;/gi, "'")
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ').trim();
}

export function dateKey(value) {
  const match = String(value ?? '').trim().match(/^(\d{4})(?:([.\/-])(\d{2})\2(\d{2})|(\d{2})(\d{2}))$/);
  if (!match) return '';
  const year = Number(match[1]), month = Number(match[3] || match[5]), day = Number(match[4] || match[6]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    ? `${match[1]}${String(month).padStart(2,'0')}${String(day).padStart(2,'0')}` : '';
}

export function safeUrl(value = '') {
  const raw = String(value).match(/href\s*=\s*["']([^"']+)["']/i)?.[1] || value;
  try {
    const url = new URL(plainText(raw));
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : '';
  } catch { return ''; }
}

// Title-only classification avoids matches from street names, food booths or incidental prose.
export function flowerCategory(title = '') {
  const text = plainText(title).replace(/불꽃|눈꽃/g, '');
  if (/벚꽃|장미|튤립|수국|연꽃|연화|국화|코스모스|해바라기|라벤더|유채|매화|매실꽃|산수유|진달래|철쭉|수선화|동백|꽃무릇|상사화|백일홍|천일홍|메밀꽃|홍매화|능소화|작약|모란|루피너스|꽃양귀비|양귀비|봄꽃|가을꽃|꽃축제|꽃 축제|꽃박람회|화훼|꽃 페스타|꽃별/.test(text)) return 'flower';
  if (/정원|가든|식물원|수목원|억새|핑크뮬리|팜파스|청보리|평창효석문화제/.test(text)) return 'garden';
  return 'other';
}

export function validateEvent(event) {
  const issues = [];
  if (!plainText(event.title)) issues.push('MISSING_TITLE');
  const start = dateKey(event.eventstartdate || event.startDate);
  const end = dateKey(event.eventenddate || event.endDate);
  if (!start || !end) issues.push('INVALID_DATES');
  else if (end < start) issues.push('REVERSED_DATES');
  if (!plainText(event.addr1 || event.address || event.eventplace || event.place)) issues.push('MISSING_LOCATION');
  if (/Cancel|취소/i.test(event.publicationStatus || '')) issues.push('CANCELLED');
  if (/Undetermined|미정|연기/i.test(event.publicationStatus || '')) issues.push('UNCONFIRMED_SCHEDULE');
  return issues;
}

export function inspectTourPage(payload) {
  const header = payload?.response?.header, body = payload?.response?.body;
  if (!header || String(header.resultCode) !== '0000') throw new Error('TOUR_INVALID_STATUS');
  if (!body || !/^\d+$/.test(String(body.totalCount))) throw new Error('TOUR_INVALID_BODY');
  const total = Number(body.totalCount);
  if (!Number.isSafeInteger(total)) throw new Error('TOUR_INVALID_BODY');
  const raw = body.items?.item;
  if (!raw && total !== 0) throw new Error('TOUR_MISSING_ITEMS');
  if (raw && typeof raw !== 'object') throw new Error('TOUR_INVALID_ITEMS');
  const items = Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : [];
  if (items.some(item => !item || typeof item !== 'object')) throw new Error('TOUR_INVALID_ITEMS');
  return { items, total };
}

export async function collectTourEvents(fetchPage, { pageSize = 200, maxPages = 1000 } = {}) {
  const events = new Map();
  let total = 0, received = 0, rejected = 0, duplicates = 0, pages = 0;
  for (let page = 1; page <= maxPages; page++) {
    const parsed = inspectTourPage(await fetchPage(page, pageSize));
    if (page > 1 && total !== parsed.total) throw new Error('TOUR_COLLECTION_CHANGED');
    total = parsed.total;
    pages = page;
    if (!parsed.items.length && received < total) throw new Error('TOUR_INCOMPLETE_PAGE');
    if (parsed.items.length > pageSize || received + parsed.items.length > total) throw new Error('TOUR_INVALID_PAGE_SIZE');
    received += parsed.items.length;
    for (const item of parsed.items) {
      const id = String(item.contentid || '');
      if (!/^\d+$/.test(id) || validateEvent(item).length) { rejected++; continue; }
      if (events.has(id)) { duplicates++; continue; }
      events.set(id, { ...item, eventstartdate: dateKey(item.eventstartdate), eventenddate: dateKey(item.eventenddate),
        category: flowerCategory(item.title), source: 'api', verification: { status: 'list-only', checkedAt: new Date().toISOString(), issues: [] } });
    }
    if (received >= total) break;
  }
  return { events: [...events.values()], source: 'api', quality: { total, received, rejected, duplicates, pages, truncated: received < total } };
}

export function prepareSnapshot(snapshot, now = Date.now()) {
  if (snapshot?.schemaVersion !== 1 || !Array.isArray(snapshot.events) || !snapshot.events.length) throw new Error('SNAPSHOT_INVALID');
  const ids = new Set();
  const events = snapshot.events.map(event => {
    if (!event.id || ids.has(event.id) || !Array.isArray(event.verification?.issues) || !safeUrl(event.sourceUrl)) throw new Error('SNAPSHOT_INVALID_EVENT');
    ids.add(event.id);
    const checked = Date.parse(event.verification.checkedAt);
    const stale = !Number.isFinite(checked) || checked > now + 60000 || now - checked > 7 * 86400000;
    const issues = [...new Set([...event.verification.issues, ...validateEvent(event), ...(stale ? ['STALE_VERIFICATION'] : [])])];
    return { ...event, source: 'verified-snapshot', verification: { ...event.verification,
      status: stale ? 'stale' : issues.length ? 'needs-review' : event.verification.status, issues } };
  });
  return { events, source: 'verified-snapshot', checkedAt: snapshot.checkedAt, sourceName: snapshot.sourceName,
    quality: { total: events.length, received: events.length, rejected: 0, duplicates: 0, truncated: false,
      stale: events.some(event => event.verification.status === 'stale') } };
}

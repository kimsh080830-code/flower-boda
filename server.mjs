import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { collectTourEvents, inspectTourPage, prepareSnapshot, validateEvent } from './lib/event-quality.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
try {
  const envText = readFileSync(path.join(ROOT, '.env'), 'utf8');
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const index = line.indexOf('=');
    const key = line.slice(0, index).trim();
    let value = line.slice(index + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (key && process.env[key] == null) process.env[key] = value;
  }
} catch {}

function decodeConfiguredKey(value = '') {
  const trimmed = String(value || '').trim();
  if (!trimmed || !trimmed.includes('%')) return trimmed;
  try { return decodeURIComponent(trimmed); } catch { return trimmed; }
}

const PORT = Number(process.env.PORT || 4173);
const PLANTNET_API_KEY = String(process.env.PLANTNET_API_KEY || '').trim();
const PLANTNET_PROJECT = String(process.env.PLANTNET_PROJECT || 'all').trim() || 'all';
const TOUR_API_KEY = decodeConfiguredKey(process.env.TOUR_API_KEY || '');
const EVENTS_SOURCE = process.env.EVENTS_SOURCE || (TOUR_API_KEY ? 'tour-api' : 'verified-snapshot');
const MAX_BODY = 13 * 1024 * 1024;

// Only explicitly published files may be served; new files stay private by default.
// Resolve filenames from this map, never directly from a request path.
const PUBLIC_FILES = new Map([
  ['/', 'index.html'],
  ['/index.html', 'index.html'],
  ['/꽃을보다_V61_dev.html', 'index.html'],

]);

function sendJson(res, status, body) {
  const data = Buffer.from(JSON.stringify(body));
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Content-Length':data.length, 'Cache-Control':'no-store' });
  res.end(data);
}
function jsonError(res, status, code, message) { sendJson(res, status, { error:code, message }); }
// Upstream errors may contain full request URLs, including API credentials.
// Log only a fixed operation label and status; never log the error or response body.
function logApiFailure(operation, status) { console.error(`[server] ${operation} failed (${status})`); }
function markTourError(error, stage, code) {
  if (error && typeof error === 'object') {
    error.tourDiagnosticStage = stage;
    error.tourDiagnosticCode = code;
  }
  return error;
}
function safeTourDiagnosticText(value, maxLength = 160) {
  let text = String(value ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  const credentials = [TOUR_API_KEY];
  if (TOUR_API_KEY) {
    credentials.push(encodeURIComponent(TOUR_API_KEY));
    credentials.push(new URLSearchParams({ serviceKey:TOUR_API_KEY }).toString().slice('serviceKey='.length));
  }
  for (const credential of new Set(credentials.filter(Boolean))) text = text.split(credential).join('[redacted]');
  return text
    .replace(/https?:\/\/[^\s<>"']+/gi, '[redacted-url]')
    .replace(/\b(servicekey|api[-_]?key|authorization)\s*[:=]\s*[^\s,&]+/gi, '$1=[redacted]')
    .slice(0, maxLength);
}
function safeTourContentType(value) {
  const mediaType = String(value || '').split(';', 1)[0].trim().toLowerCase();
  return /^[a-z0-9!#$&^_.+-]+\/[a-z0-9!#$&^_.+-]+$/.test(mediaType) ? mediaType : 'unknown';
}
function tourResponseFormat(contentType, body) {
  if (/\bjson\b/i.test(contentType)) return 'json';
  if (/\bxml\b/i.test(contentType)) return 'xml';
  const trimmed = String(body).trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<')) return 'xml';
  return 'unknown';
}
function extractTourXmlValue(body, tag) {
  const match = String(body).match(new RegExp(`<(?:(?:[\\w.-]+):)?${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:(?:[\\w.-]+):)?${tag}\\s*>`, 'i'));
  if (!match) return '';
  const value = match[1].replace(/<[^>]*>/g, '').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'")
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
  return safeTourDiagnosticText(value);
}
function tourResponseDiagnostic(endpoint, stage, response, contentType, format, details = {}) {
  const header = details.payload?.response?.header;
  const resultCode = header?.resultCode == null ? '' : safeTourDiagnosticText(header.resultCode, 40);
  const resultMsg = header?.resultMsg == null ? '' : safeTourDiagnosticText(header.resultMsg);
  const diagnostic = {
    stage,
    httpStatus:response.status,
    contentType:safeTourContentType(contentType),
    format,
    ...(resultCode ? { resultCode } : {}),
    ...(resultMsg ? { resultMsg } : {}),
    ...(format === 'xml' ? {
      returnAuthMsg:extractTourXmlValue(details.body, 'returnAuthMsg'),
      returnReasonCode:extractTourXmlValue(details.body, 'returnReasonCode')
    } : {}),
    jsonParseFailed:Boolean(details.jsonParseFailed)
  };
  console.error(`[server] TourAPI ${safeTourDiagnosticText(endpoint, 40)} ${JSON.stringify(diagnostic)}`);
}
const TOUR_PAGINATION_ERRORS = new Set([
  'TOUR_COLLECTION_CHANGED', 'TOUR_INCOMPLETE_PAGE', 'TOUR_INVALID_PAGE_SIZE', 'TOUR_INCOMPLETE_COLLECTION'
]);
function logTourFailure(operation, error) {
  const message = String(error?.message || '');
  const stage = error?.tourDiagnosticStage || (TOUR_PAGINATION_ERRORS.has(message) ? 'pagination-quality' : 'response-validation');
  const knownCodes = new Set([...TOUR_PAGINATION_ERRORS, 'TOUR_HTTP_FAILED', 'TOUR_FETCH_FAILED', 'TOUR_BODY_READ_FAILED',
    'TOUR_JSON_PARSE_FAILED', 'TOUR_XML_RESPONSE', 'TOUR_INVALID_STATUS', 'TOUR_INVALID_BODY', 'TOUR_MISSING_ITEMS',
    'TOUR_INVALID_ITEMS', 'TOUR_COLLECTION_FAILED']);
  const code = knownCodes.has(error?.tourDiagnosticCode) ? error.tourDiagnosticCode
    : knownCodes.has(message) ? message : 'TOUR_COLLECTION_FAILED';
  console.error(`[server] TourAPI ${operation} ${JSON.stringify({ stage, code })}`);
}

async function readRequestBody(req, maxBytes = MAX_BODY) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) throw Object.assign(new Error('BODY_TOO_LARGE'), { code:'BODY_TOO_LARGE' });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function splitBuffer(buffer, separator) {
  const parts = []; let offset = 0; let index;
  while ((index = buffer.indexOf(separator, offset)) !== -1) {
    parts.push(buffer.subarray(offset, index)); offset = index + separator.length;
  }
  parts.push(buffer.subarray(offset));
  return parts;
}

function parseMultipart(buffer, contentType='') {
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i)?.slice(1).find(Boolean)?.trim();
  if (!boundary || boundary.length > 200) throw new Error('MULTIPART_BOUNDARY');
  const separator = Buffer.from(`--${boundary}`);
  const result = { fields:{}, files:[] };
  for (let part of splitBuffer(buffer, separator)) {
    if (!part.length) continue;
    if (part.subarray(0,2).equals(Buffer.from('\r\n'))) part = part.subarray(2);
    if (part.subarray(0,2).equals(Buffer.from('--'))) continue;
    if (part.length >= 2 && part.subarray(-2).equals(Buffer.from('\r\n'))) part = part.subarray(0,-2);
    const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
    if (headerEnd < 0) continue;
    const headers = part.subarray(0, headerEnd).toString('utf8');
    const body = part.subarray(headerEnd + 4);
    const disposition = headers.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || '';
    const name = disposition.match(/name="([^"]+)"/i)?.[1] || '';
    const filename = disposition.match(/filename="([^"]*)"/i)?.[1];
    const mime = headers.match(/content-type:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase() || '';
    if (!name) continue;
    if (filename !== undefined) result.files.push({ name, filename, mime, buffer:body });
    else result.fields[name] = body.toString('utf8');
  }
  return result;
}

function tourParams(extra={}) {
  return new URLSearchParams({ serviceKey:TOUR_API_KEY, MobileOS:'ETC', MobileApp:'FlowerGuide', _type:'json', ...extra });
}
function tourItems(payload) {
  const item = payload?.response?.body?.items?.item;
  return Array.isArray(item) ? item : item && typeof item === 'object' ? [item] : [];
}
async function fetchTour(endpoint, params, signal) {
  let response;
  try {
    response = await fetch(`https://apis.data.go.kr/B551011/KorService2/${endpoint}?${params}`, { signal, headers:{ Accept:'application/json' } });
  } catch (error) {
    throw markTourError(error, 'upstream-http', 'TOUR_FETCH_FAILED');
  }
  const contentType = response.headers.get('content-type') || '';
  let body;
  try { body = await response.text(); }
  catch (error) {
    tourResponseDiagnostic(endpoint, 'upstream-format', response, contentType, 'unknown', { body:'', jsonParseFailed:true });
    throw markTourError(error, 'upstream-format', 'TOUR_BODY_READ_FAILED');
  }
  const format = tourResponseFormat(contentType, body);
  if (!response.ok) {
    let payload, jsonParseFailed = false;
    if (format === 'json') {
      try { payload = JSON.parse(body); }
      catch { jsonParseFailed = true; }
    }
    tourResponseDiagnostic(endpoint, 'upstream-http', response, contentType, format, { payload, body, jsonParseFailed });
    throw markTourError(new Error('TOUR_HTTP_FAILED'), 'upstream-http', 'TOUR_HTTP_FAILED');
  }
  let payload;
  try { payload = JSON.parse(body); }
  catch (error) {
    tourResponseDiagnostic(endpoint, 'upstream-format', response, contentType, format, { body, jsonParseFailed:true });
    throw markTourError(error, 'upstream-format', format === 'xml' ? 'TOUR_XML_RESPONSE' : 'TOUR_JSON_PARSE_FAILED');
  }
  if (String(payload?.response?.header?.resultCode ?? '') !== '0000') {
    tourResponseDiagnostic(endpoint, 'tour-result-code', response, contentType, format, { payload, body });
    throw markTourError(new Error('TOUR_INVALID_STATUS'), 'tour-result-code', 'TOUR_INVALID_STATUS');
  }
  try { inspectTourPage(payload); }
  catch (error) {
    tourResponseDiagnostic(endpoint, 'response-validation', response, contentType, format, { payload, body });
    throw markTourError(error, 'response-validation', error?.message);
  }
  tourResponseDiagnostic(endpoint, 'upstream-response', response, contentType, format, { payload, body });
  return payload;
}
function decodeHtml(text='') {
  return String(text).replace(/&quot;/gi,'"').replace(/&#39;/g,"'").replace(/&amp;/gi,'&').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>');
}
function firstHttpUrl(value='') {
  const text = decodeHtml(value);
  const raw = text.match(/href\s*=\s*["'](https?:\/\/[^"']+)["']/i)?.[1] || text.match(/https?:\/\/[^\s<"']+/i)?.[0] || '';
  try { const url = new URL(raw); return ['http:','https:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
function stripHtml(value='') { return decodeHtml(value).replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim(); }

function sameOriginRequest(req) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (!origin) return true;
  const host = typeof req.headers.host === 'string' ? req.headers.host : '';
  if (!host) return false;
  try {
    const parsedOrigin = new URL(origin);
    const forwardedProtocol = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim();
    const requestOrigin = `${forwardedProtocol}://${host}`;
    return parsedOrigin.origin === requestOrigin || parsedOrigin.origin === 'https://kimsh080830-code.github.io';
  } catch { return false; }
}

function setApiCors(req, res) {
  const origin = typeof req.headers.origin === 'string' ? req.headers.origin : '';
  if (!origin) return;
  res.setHeader('Vary', 'Origin');
  try {
    const parsedOrigin = new URL(origin);
    const host = String(req.headers.host || '');
    const forwardedProtocol = String(req.headers['x-forwarded-proto'] || (req.socket.encrypted ? 'https' : 'http')).split(',')[0].trim();
    if (parsedOrigin.origin === `${forwardedProtocol}://${host}`) return;
    if (parsedOrigin.origin === 'https://kimsh080830-code.github.io') {
      res.setHeader('Access-Control-Allow-Origin', parsedOrigin.origin);
    }
  } catch {}
}

async function handleIdentify(req, res) {
  if (!PLANTNET_API_KEY) return jsonError(res,503,'PLANTNET_NOT_CONFIGURED','사진 분석 API가 설정되지 않았어요.');
  const contentType = String(req.headers['content-type'] || '');
  if (!/^multipart\/form-data\b/i.test(contentType)) return jsonError(res,415,'CONTENT_TYPE','사진 업로드 형식을 확인해 주세요.');
  let timeout;
  try {
    const body = await readRequestBody(req);
    const form = parseMultipart(body, contentType);
    const file = form.files.find((item) => item.name === 'images');
    if (!file) return jsonError(res,400,'IMAGE_REQUIRED','분석할 사진이 필요해요.');
    if (!['image/jpeg','image/png'].includes(file.mime)) return jsonError(res,400,'IMAGE_TYPE','지원하지 않는 사진 형식이에요.');
    if (!file.buffer.length || file.buffer.length > 12*1024*1024) return jsonError(res,400,'IMAGE_SIZE','사진 크기를 확인해 주세요.');
    const params = new URLSearchParams({ 'api-key':PLANTNET_API_KEY, lang:'ko', 'nb-results':'20', 'include-related-images':'true', detailed:'true' });
    const outgoing = new FormData();
    outgoing.append('images', new Blob([file.buffer], { type:file.mime }), file.filename || 'flower.jpg');
    outgoing.append('organs','auto');
    const controller = new AbortController(); timeout = setTimeout(() => controller.abort(),11000);
    const response = await fetch(`https://my-api.plantnet.org/v2/identify/${encodeURIComponent(PLANTNET_PROJECT)}?${params}`, { method:'POST', body:outgoing, signal:controller.signal, headers:{ Accept:'application/json' } });
    const text = await response.text();
    if (!response.ok) return jsonError(res,response.status>=500?502:response.status,'PLANTNET_ERROR','꽃 분석 서비스 응답을 확인하지 못했어요.');
    let payload;
    try { payload = JSON.parse(text); } catch { return jsonError(res,502,'PLANTNET_INVALID_RESPONSE','꽃 분석 서비스 응답 형식을 확인하지 못했어요.'); }
    if (!payload || !Array.isArray(payload.results) || payload.results.some(result =>
      !result || !Number.isFinite(result.score) || result.score < 0 || result.score > 1 ||
      !String(result.species?.scientificNameWithoutAuthor || result.species?.scientificName || '').trim()))
      return jsonError(res,502,'PLANTNET_INVALID_RESPONSE','꽃 분석 서비스 응답 형식을 확인하지 못했어요.');
    sendJson(res,200,payload);
  } catch (error) {
    if (error?.code === 'BODY_TOO_LARGE') return jsonError(res,413,'UPLOAD_TOO_LARGE','사진이 너무 커요.');
    if (error?.name === 'AbortError') return jsonError(res,504,'PLANTNET_TIMEOUT','꽃 분석 시간이 너무 오래 걸렸어요.');
    if (error?.message === 'MULTIPART_BOUNDARY') return jsonError(res,400,'MULTIPART_INVALID','사진 업로드 형식을 확인해 주세요.');
    logApiFailure('identify',502); return jsonError(res,502,'PLANTNET_NETWORK','꽃 분석 서비스에 연결하지 못했어요.');
  } finally { clearTimeout(timeout); }
}

async function handleEvents(_req,res) {
  if (EVENTS_SOURCE === 'verified-snapshot') {
    try { return sendJson(res,200,await readVerifiedEvents()); }
    catch { return jsonError(res,503,'EVENT_SNAPSHOT_INVALID','확인한 행사 자료를 불러오지 못했어요.'); }
  }
  if (EVENTS_SOURCE !== 'tour-api') return jsonError(res,503,'EVENT_SOURCE_INVALID','행사 정보 출처 설정을 확인해 주세요.');
  if (!TOUR_API_KEY) return jsonError(res,503,'TOUR_NOT_CONFIGURED','행사 API가 설정되지 않았어요.');
  const year = new Intl.DateTimeFormat('en', { timeZone:'Asia/Seoul',year:'numeric' }).format(new Date());
  const eventStartDate = `${year}0101`;
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(),30000);
  try {
    const payload = await collectTourEvents((page, size) => fetchTour('searchFestival2',
      tourParams({ eventStartDate, arrange:'A', listYN:'Y', numOfRows:String(size), pageNo:String(page) }), controller.signal));
    if (payload.quality.truncated || payload.quality.duplicates) throw new Error('TOUR_INCOMPLETE_COLLECTION');
    sendJson(res,200,payload);
  } catch (error) {
    const status = error?.name==='AbortError'?504:502;
    logApiFailure('events',status); logTourFailure('events',error); jsonError(res,status,'TOUR_EVENTS_ERROR','행사 전체 목록을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');
  } finally { clearTimeout(timeout); }
}

async function readVerifiedEvents() {
  return prepareSnapshot(JSON.parse(await readFile(path.join(ROOT,'data','verified-events.json'),'utf8')));
}

async function handleEventDetail(url,res) {
  if (EVENTS_SOURCE === 'verified-snapshot') {
    try {
      const snapshot = await readVerifiedEvents();
      const id = url.searchParams.get('contentId');
      const event = snapshot.events.find(item => item.id === id || item.contentid === id);
      return event ? sendJson(res,200,event) : jsonError(res,404,'EVENT_NOT_FOUND','행사 정보를 찾지 못했어요.');
    } catch { return jsonError(res,503,'EVENT_SNAPSHOT_INVALID','확인한 행사 자료를 불러오지 못했어요.'); }
  }
  if (EVENTS_SOURCE !== 'tour-api') return jsonError(res,503,'EVENT_SOURCE_INVALID','행사 정보 출처 설정을 확인해 주세요.');
  if (!TOUR_API_KEY) return jsonError(res,503,'TOUR_NOT_CONFIGURED','행사 API가 설정되지 않았어요.');
  const contentId = String(url.searchParams.get('contentId')||'');
  const contentTypeId = '15';
  if (!/^\d{1,32}$/.test(contentId)) return jsonError(res,400,'CONTENT_ID_REQUIRED','올바른 행사 ID가 필요해요.');
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(),7000);
  try {
    const [commonPayload,introPayload] = await Promise.all([
      fetchTour('detailCommon2',tourParams({ contentId,contentTypeId,defaultYN:'Y',firstImageYN:'Y',areacodeYN:'Y',catcodeYN:'N',addrinfoYN:'Y',mapinfoYN:'Y',overviewYN:'Y' }),controller.signal),
      fetchTour('detailIntro2',tourParams({ contentId,contentTypeId }),controller.signal)
    ]);
    const common=tourItems(commonPayload)[0]||{}, intro=tourItems(introPayload)[0]||{};
    if (String(common.contentid) !== contentId || String(intro.contentid) !== contentId) throw new Error('TOUR_DETAIL_ID_MISMATCH');
    const issues = validateEvent({ ...common,...intro });
    if (issues.length) return jsonError(res,502,'TOUR_DETAIL_UNVERIFIED','행사 일정과 장소를 확인하지 못했어요. 공식 안내를 확인해 주세요.');
    const link=firstHttpUrl(intro.eventhomepage||common.homepage||'');
    sendJson(res,200,{ contentid:contentId,title:common.title,addr1:common.addr1,addr2:common.addr2,mapx:common.mapx,mapy:common.mapy,firstimage:common.firstimage,overview:stripHtml(common.overview),eventplace:intro.eventplace,eventstartdate:intro.eventstartdate,eventenddate:intro.eventenddate,sponsor1:intro.sponsor1,sponsor2:intro.sponsor2,sponsor1tel:intro.sponsor1tel,playtime:intro.playtime,usetimefestival:intro.usetimefestival,eventhomepage:link,homepage:link,
      verification:{ status:'detail-checked',checkedAt:new Date().toISOString(),issues:[],method:'TourAPI 상세 응답의 행사 ID·기간·장소 확인' } });
  } catch (error) {
    const status = error?.name==='AbortError'?504:502;
    logApiFailure('event detail',status); logTourFailure('event-detail',error); jsonError(res,status,'TOUR_DETAIL_ERROR','행사 상세 정보를 불러오지 못했어요.');
  } finally { clearTimeout(timeout); }
}

async function serveStatic(url,res,{ head = false } = {}) {
  let pathname;
  try { pathname = decodeURIComponent(url.pathname); } catch { return jsonError(res,400,'BAD_PATH','잘못된 경로예요.'); }
  const filename = PUBLIC_FILES.get(pathname);
  if (!filename) return jsonError(res,404,'NOT_FOUND','파일을 찾지 못했어요.');
  try {
    const data=await readFile(path.join(ROOT,filename));
    res.writeHead(200,{ 'Content-Type':'text/html; charset=utf-8','Content-Length':data.length,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache' });
    res.end(head ? undefined : data);
  } catch { jsonError(res,404,'NOT_FOUND','파일을 찾지 못했어요.'); }
}

const server=http.createServer(async (req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options','SAMEORIGIN');
  res.setHeader('Permissions-Policy','geolocation=(self), microphone=()');

  let url;
  try { url=new URL(req.url||'/','http://localhost'); }
  catch { return jsonError(res,400,'BAD_REQUEST','잘못된 요청이에요.'); }

  const isApi = url.pathname.startsWith('/api/');
  if (isApi && !sameOriginRequest(req)) return jsonError(res,403,'ORIGIN_FORBIDDEN','허용되지 않은 요청이에요.');
  if (isApi) setApiCors(req,res);
  if (isApi && req.method==='OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers','Accept, Content-Type');
    res.setHeader('Access-Control-Max-Age','600');
    res.writeHead(204);
    return res.end();
  }

  if (req.method==='POST' && url.pathname==='/api/identify-flower') return handleIdentify(req,res);
  if (req.method==='GET' && url.pathname==='/api/events') return handleEvents(req,res);
  if (req.method==='GET' && url.pathname==='/api/event-detail') return handleEventDetail(url,res);
  if (isApi) return jsonError(res,405,'METHOD_NOT_ALLOWED','지원하지 않는 요청이에요.');
  if (req.method==='GET' || req.method==='HEAD') return serveStatic(url,res,{ head:req.method==='HEAD' });
  jsonError(res,405,'METHOD_NOT_ALLOWED','지원하지 않는 요청이에요.');
});

server.requestTimeout = 60000;
server.headersTimeout = 10000;
server.keepAliveTimeout = 5000;
server.listen(PORT,'0.0.0.0',()=>console.log(`Flower Guide server: http://localhost:${server.address().port}`));


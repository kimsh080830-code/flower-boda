import path from 'node:path';

const REQUIRED_FLOWER_FIELDS = Object.freeze([
  'id','nameKo','nameEn','scientificName','family','genus','description',
  'identificationFeatures','leafFeatures','flowerFeatures','habitat','koreaViewingPeriod',
  'bloom.start','bloom.end','taxonomy.acceptedName','taxonomy.taxonType'
]);

const LOCAL_IMAGE_PATTERN = /^assets\/flowers\/[a-z0-9]+(?:-[a-z0-9]+)*-\d{2}\.webp$/;
const EXTERNAL_FILENAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*-reference-\d{2}\.webp$/;

const clean = (value) => String(value ?? '').trim();
const norm = (value) => clean(value).replace(/\s+/g,' ').toLocaleLowerCase('en-US');
const get = (object, dotted) => dotted.split('.').reduce((value,key)=>value?.[key],object);

function validMonthDay(value) {
  const match = /^(\d{2})-(\d{2})$/.exec(clean(value));
  if (!match) return false;
  const month = Number(match[1]), day = Number(match[2]);
  const date = new Date(Date.UTC(2000,month-1,day));
  return date.getUTCMonth() === month-1 && date.getUTCDate() === day;
}

function issue(code, message, extra={}) {
  return Object.freeze({ code, severity: extra.severity || 'error', message, ...extra });
}

function duplicateGroups(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    if (!key) continue;
    if (!map.has(key)) map.set(key,[]);
    map.get(key).push(item);
  }
  return [...map.entries()].filter(([,rows])=>rows.length>1);
}

function identityNames(identity) {
  return [identity?.scientificName, identity?.acceptedScientificName, ...(identity?.synonyms || [])]
    .map(norm).filter(Boolean);
}

function auditData({
  flowers=[], identities=[], imageAssets=[], externalImages=[], references=[],
  existingPaths=[], sourceAssetReferences=[]
}={}) {
  const issues=[];
  const flowerIds=new Set(flowers.map(f=>clean(f.id)).filter(Boolean));
  const existing=new Set(existingPaths.map(value=>String(value).replaceAll('\\','/')));

  for (const [,rows] of duplicateGroups(flowers,f=>clean(f.id))) {
    issues.push(issue('DUPLICATE_ID','꽃 ID가 중복돼요.',{ flowerId:clean(rows[0].id), count:rows.length }));
  }
  for (const [name,rows] of duplicateGroups(flowers,f=>norm(f.scientificName))) {
    issues.push(issue('DUPLICATE_SCIENTIFIC_NAME','학명이 중복돼요.',{ value:name, flowerIds:rows.map(f=>f.id) }));
  }

  const exactIdentities=identities.filter(Boolean);
  for (const [accepted,rows] of duplicateGroups(exactIdentities,i=>norm(i.acceptedScientificName))) {
    const ids=[...new Set(rows.map(i=>i.id).filter(Boolean))];
    if (ids.length>1) issues.push(issue('ACCEPTED_NAME_CONFLICT','서로 다른 꽃 ID가 같은 accepted name을 사용해요.',{ value:accepted, flowerIds:ids }));
  }

  const synonymOwners=new Map();
  for (const identity of exactIdentities) {
    const accepted=norm(identity.acceptedScientificName);
    for (const synonym of identity.synonyms || []) {
      const key=norm(synonym); if(!key) continue;
      if(!synonymOwners.has(key)) synonymOwners.set(key,[]);
      synonymOwners.get(key).push({id:identity.id,accepted});
    }
  }
  for (const [synonym,owners] of synonymOwners) {
    const accepted=[...new Set(owners.map(row=>row.accepted).filter(Boolean))];
    if (accepted.length>1) issues.push(issue('SYNONYM_CONFLICT','같은 synonym이 서로 다른 accepted name에 연결돼요.',{ value:synonym, flowerIds:[...new Set(owners.map(row=>row.id))], acceptedNames:accepted }));
  }

  for (const flower of flowers) {
    for (const field of REQUIRED_FLOWER_FIELDS) {
      const value=get(flower,field);
      if (value == null || clean(value)==='') issues.push(issue('REQUIRED_FIELD_MISSING','필수 꽃 데이터가 비어 있어요.',{ flowerId:flower.id, field }));
    }
    for (const field of ['bloom.start','bloom.end']) {
      if (!validMonthDay(get(flower,field))) issues.push(issue('BLOOM_DATE_INVALID','개화 날짜 형식 또는 실제 달력 날짜가 올바르지 않아요.',{ flowerId:flower.id, field, value:get(flower,field) }));
    }
    const localImage=clean(flower.localImage);
    if (!localImage) {
      if (flower.id!=='pansy') issues.push(issue('IMAGE_MISSING','로컬 fallback 이미지가 없어요.',{ flowerId:flower.id, field:'localImage' }));
    } else if (localImage.startsWith('assets/')) {
      if (!LOCAL_IMAGE_PATTERN.test(localImage)) issues.push(issue('IMAGE_PATH_INVALID','꽃 이미지 경로 또는 파일명 규칙이 올바르지 않아요.',{ flowerId:flower.id, path:localImage }));
      if (!existing.has(localImage)) issues.push(issue('IMAGE_PATH_NOT_FOUND','꽃 데이터가 존재하지 않는 이미지 파일을 가리켜요.',{ flowerId:flower.id, path:localImage }));
    } else if (!localImage.startsWith('data:image/')) {
      issues.push(issue('IMAGE_PATH_INVALID','로컬 fallback은 assets/flowers 경로 또는 data 이미지여야 해요.',{ flowerId:flower.id, path:localImage }));
    }
  }

  const assetByFlower=new Map();
  const manifestPaths=new Set();
  for (const asset of imageAssets) {
    const flowerId=clean(asset.flowerId);
    const assetPath=clean(asset.path).replaceAll('\\','/');
    if (flowerId && !flowerIds.has(flowerId)) issues.push(issue('UNKNOWN_FLOWER_ID_REFERENCE','이미지 자산이 존재하지 않는 꽃 ID를 참조해요.',{ source:'image-assets', flowerId, path:asset.path }));
    if (flowerId) {
      if (assetByFlower.has(flowerId)) issues.push(issue('DATA_LINK_DUPLICATE','한 꽃에 로컬 fallback 이미지 자산이 중복 등록돼요.',{ source:'image-assets', flowerId }));
      assetByFlower.set(flowerId,asset);
    }
    if (!assetPath) continue;
    if (manifestPaths.has(assetPath)) issues.push(issue('DATA_LINK_DUPLICATE','같은 로컬 이미지 경로가 manifest에 중복 등록돼요.',{ source:'image-assets', flowerId, path:assetPath }));
    manifestPaths.add(assetPath);
    if (clean(asset.filename) !== path.posix.basename(assetPath)) issues.push(issue('DATA_LINK_MISMATCH','이미지 자산 filename과 path의 파일명이 달라요.',{ source:'image-assets', flowerId, filename:asset.filename, path:assetPath }));
    if (!LOCAL_IMAGE_PATTERN.test(assetPath) && asset.role!=='generic-fallback') issues.push(issue('IMAGE_PATH_INVALID','이미지 자산 파일명 규칙이 올바르지 않아요.',{ source:'image-assets', flowerId, path:assetPath }));
    if (!existing.has(assetPath)) issues.push(issue('IMAGE_PATH_NOT_FOUND','이미지 자산 목록에 실제 파일이 없어요.',{ source:'image-assets', flowerId, path:assetPath }));
  }

  for (const flower of flowers) {
    const localImage=clean(flower.localImage).replaceAll('\\','/');
    if (!localImage.startsWith('assets/flowers/')) continue;
    const asset=assetByFlower.get(clean(flower.id));
    if (!asset) issues.push(issue('IMAGE_MANIFEST_MISSING','꽃 데이터의 로컬 이미지에 대응하는 manifest 항목이 없어요.',{ flowerId:flower.id, path:localImage }));
    else if (clean(asset.path).replaceAll('\\','/') !== localImage) issues.push(issue('DATA_LINK_MISMATCH','꽃 데이터 localImage와 이미지 manifest 경로가 달라요.',{ flowerId:flower.id, path:localImage, manifestPath:asset.path }));
  }

  for (const existingPath of existing) {
    if (!manifestPaths.has(existingPath)) issues.push(issue('ORPHAN_IMAGE_FILE','실제 이미지 파일이 manifest에 등록되지 않았어요.',{ path:existingPath }));
  }

  const externalByFlower=new Map();
  for (const meta of externalImages) {
    const flowerId=clean(meta.flowerId);
    if (!flowerIds.has(flowerId)) issues.push(issue('UNKNOWN_FLOWER_ID_REFERENCE','외부 이미지 메타데이터가 존재하지 않는 꽃 ID를 참조해요.',{ source:'external-image-metadata', flowerId }));
    if (externalByFlower.has(flowerId)) issues.push(issue('DATA_LINK_DUPLICATE','한 꽃에 같은 역할의 외부 이미지 메타데이터가 중복돼요.',{ source:'external-image-metadata', flowerId }));
    externalByFlower.set(flowerId,meta);
    if (!EXTERNAL_FILENAME_PATTERN.test(clean(meta.filename))) issues.push(issue('IMAGE_FILENAME_INVALID','외부 이미지 관리 파일명이 규칙에 맞지 않아요.',{ flowerId, filename:meta.filename }));
    for (const field of ['source','author','sourceUrl','license','licenseUrl']) {
      if (!clean(meta[field])) issues.push(issue(field.startsWith('license')?'LICENSE_MISSING':'IMAGE_METADATA_MISSING','외부 이미지 메타데이터 필드가 비어 있어요.',{ flowerId, field }));
    }
    if (typeof meta.attributionRequired !== 'boolean') issues.push(issue('LICENSE_MISSING','attributionRequired는 boolean이어야 해요.',{ flowerId, field:'attributionRequired' }));
    if (!/^https:\/\//i.test(clean(meta.sourceUrl)) || !/^https:\/\//i.test(clean(meta.url))) issues.push(issue('IMAGE_METADATA_URL_INVALID','외부 이미지 URL은 https여야 해요.',{ flowerId }));
    if (meta.attributionRequired && !clean(meta.author)) issues.push(issue('LICENSE_MISSING','저작자 표시가 필요한 이미지에 author가 없어요.',{ flowerId, field:'author' }));
    const flower=flowers.find(f=>f.id===flowerId);
    if (flower && clean(flower.image)!==clean(meta.url)) issues.push(issue('DATA_LINK_MISMATCH','외부 이미지 메타데이터 URL과 꽃 데이터 image가 달라요.',{ flowerId, field:'image' }));
    if (flower?.imageCredit?.license && clean(flower.imageCredit.license)!==clean(meta.license)) issues.push(issue('DATA_LINK_MISMATCH','꽃 데이터와 외부 이미지 메타데이터의 라이선스가 달라요.',{ flowerId, field:'license' }));
  }

  for (const flower of flowers) {
    if (/^https:\/\//i.test(clean(flower.image)) && flower.imageCredit?.curated && !externalByFlower.has(flower.id)) {
      issues.push(issue('IMAGE_METADATA_MISSING','외부 대표 이미지에 관리 메타데이터가 없어요.',{ flowerId:flower.id }));
    }
  }

  for (const ref of references) {
    const id=clean(ref.flowerId || ref.id);
    if (id && !flowerIds.has(id)) issues.push(issue('UNKNOWN_FLOWER_ID_REFERENCE','데이터가 존재하지 않는 꽃 ID를 참조해요.',{ source:ref.source || 'reference', flowerId:id }));
  }

  for (const ref of sourceAssetReferences) {
    const normalized=String(ref.path||ref).replaceAll('\\','/');
    if (!existing.has(normalized)) issues.push(issue('STALE_IMAGE_PATH_REFERENCE','소스에 삭제되었거나 존재하지 않는 이미지 경로가 남아 있어요.',{ source:ref.source || 'source-scan', path:normalized }));
  }

  return Object.freeze({
    ok: issues.every(item=>item.severity!=='error'),
    issues:Object.freeze(issues),
    summary:Object.freeze({ total:issues.length, errors:issues.filter(i=>i.severity==='error').length, reviews:issues.filter(i=>i.severity==='review').length })
  });
}

function normalizeAssetPath(root,file) {
  return path.relative(root,file).replaceAll(path.sep,'/');
}

export { REQUIRED_FLOWER_FIELDS, LOCAL_IMAGE_PATTERN, EXTERNAL_FILENAME_PATTERN, validMonthDay, auditData, normalizeAssetPath, identityNames };

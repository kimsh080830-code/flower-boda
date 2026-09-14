import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { auditData, LOCAL_IMAGE_PATTERN, EXTERNAL_FILENAME_PATTERN } from '../lib/data-audit.mjs';

const ROOT=path.dirname(fileURLToPath(new URL('../package.json',import.meta.url)));
const readJson=async(relative)=>JSON.parse(await readFile(path.join(ROOT,relative),'utf8'));

async function loadRuntime(){
  const sandbox={__mods:Object.create(null)};
  vm.createContext(sandbox);
  for(const file of ['src/js/data.js','src/js/flowerDataPolicy.js']){
    vm.runInContext(await readFile(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
  }
  return sandbox.__mods;
}

const modules=await loadRuntime();
const flowers=modules['js/data.js'].FLOWERS;
const policy=modules['js/flowerDataPolicy.js'];
const identities=flowers.map(f=>policy.getFlowerTaxonIdentity(f));
const imageAssets=(await readJson('data/image-assets.json')).assets;
const externalImages=(await readJson('data/external-image-metadata.json')).images;
const assetNames=(await readdir(path.join(ROOT,'assets','flowers'))).filter(name=>name.endsWith('.webp')).sort();
const existingPaths=assetNames.map(name=>`assets/flowers/${name}`);
const baseInput={ flowers, identities, imageAssets, externalImages, existingPaths, references:[], sourceAssetReferences:[] };

function codes(result){ return new Set(result.issues.map(issue=>issue.code)); }

function clone(value){ return JSON.parse(JSON.stringify(value)); }

test('V56 source image manifest matches all flower fallback files without audit errors', async()=>{
  const result=auditData(baseInput);
  assert.equal(result.ok,true,JSON.stringify(result.issues,null,2));
  assert.equal(flowers.length,45);
  assert.equal(imageAssets.filter(a=>a.flowerId).length,flowers.length);
  assert.equal(assetNames.length,46); // 45 flower fallbacks + one generic fallback
  for(const flower of flowers){
    assert.match(flower.localImage,LOCAL_IMAGE_PATTERN);
    assert.ok(existingPaths.includes(flower.localImage),flower.localImage);
    const manifest=imageAssets.find(a=>a.flowerId===flower.id);
    assert.ok(manifest,flower.id);
    assert.equal(manifest.path,flower.localImage);
    assert.equal(manifest.filename,path.posix.basename(flower.localImage));
  }
  assert.ok(existingPaths.includes('assets/flowers/flower-fallback-01.webp'));
});

test('V56 external image metadata uses the required management fields',()=>{
  const required=['flowerId','filename','source','author','sourceUrl','license','licenseUrl','attributionRequired'];
  assert.equal(externalImages.length,8);
  for(const meta of externalImages){
    for(const field of required) assert.ok(Object.hasOwn(meta,field),`${meta.flowerId}:${field}`);
    assert.match(meta.filename,EXTERNAL_FILENAME_PATTERN);
    assert.equal(typeof meta.attributionRequired,'boolean');
    assert.match(meta.sourceUrl,/^https:\/\//);
    assert.match(meta.licenseUrl,/^https:\/\//);
  }
});

test('V56 built HTML inlines local WebP fallbacks for standalone offline use',async()=>{
  const dev=await readFile(path.join(ROOT,'꽃을보다_V61_dev.html'),'utf8');
  assert.match(dev,/data:image\/webp;base64,/);
  assert.doesNotMatch(dev,/const __flowerAssets = \{[^;]*assets\/flowers\//);
  assert.doesNotMatch(dev,/const img = \(id\) => [^;]*assets\/flowers\//);
});

test('audit detects a nonexistent flower ID reference sample',()=>{
  const bad=clone(baseInput);
  bad.imageAssets.push({flowerId:'ghost-flower',filename:'ghost-flower-01.webp',path:'assets/flowers/ghost-flower-01.webp',role:'local-fallback'});
  const result=auditData(bad);
  assert.ok(codes(result).has('UNKNOWN_FLOWER_ID_REFERENCE'));
});

test('audit detects a broken image path sample',()=>{
  const badFlowers=clone(flowers);
  badFlowers[0].localImage='assets/flowers/not-real-01.webp';
  const result=auditData({...baseInput,flowers:badFlowers});
  const found=result.issues.find(issue=>issue.code==='IMAGE_PATH_NOT_FOUND' && issue.path==='assets/flowers/not-real-01.webp');
  assert.ok(found);
});

test('audit detects missing external image license metadata sample',()=>{
  const badExternal=clone(externalImages);
  badExternal[0].license='';
  const result=auditData({...baseInput,externalImages:badExternal});
  assert.ok(codes(result).has('LICENSE_MISSING'));
});

test('audit detects stale deleted image references and orphan files',()=>{
  const stale=auditData({...baseInput,sourceAssetReferences:[{source:'sample.js',path:'assets/flowers/deleted-01.webp'}]});
  assert.ok(codes(stale).has('STALE_IMAGE_PATH_REFERENCE'));
  const orphan=auditData({...baseInput,existingPaths:[...existingPaths,'assets/flowers/orphan-01.webp']});
  assert.ok(codes(orphan).has('ORPHAN_IMAGE_FILE'));
});

test('audit detects duplicate ID, scientific name, accepted name and synonym conflicts',()=>{
  const duplicateFlowers=clone(flowers);
  duplicateFlowers.push({...clone(flowers[0]),id:flowers[0].id});
  let result=auditData({...baseInput,flowers:duplicateFlowers});
  assert.ok(codes(result).has('DUPLICATE_ID'));
  assert.ok(codes(result).has('DUPLICATE_SCIENTIFIC_NAME'));

  const conflictIdentities=[
    {id:'a',scientificName:'A alpha',acceptedScientificName:'Accepted same',synonyms:['Shared synonym']},
    {id:'b',scientificName:'B beta',acceptedScientificName:'Accepted same',synonyms:['Shared synonym']}
  ];
  result=auditData({...baseInput,identities:conflictIdentities});
  assert.ok(codes(result).has('ACCEPTED_NAME_CONFLICT'));

  const synonymConflict=[
    {id:'a',scientificName:'A alpha',acceptedScientificName:'Accepted A',synonyms:['Shared synonym']},
    {id:'b',scientificName:'B beta',acceptedScientificName:'Accepted B',synonyms:['Shared synonym']}
  ];
  result=auditData({...baseInput,identities:synonymConflict});
  assert.ok(codes(result).has('SYNONYM_CONFLICT'));
});

test('audit detects required-field and bloom-date samples while valid data stays clean',()=>{
  const badFlowers=clone(flowers);
  badFlowers[0].habitat='';
  badFlowers[1].bloom.start='02-31';
  const result=auditData({...baseInput,flowers:badFlowers});
  assert.ok(codes(result).has('REQUIRED_FIELD_MISSING'));
  assert.ok(codes(result).has('BLOOM_DATE_INVALID'));
  assert.equal(auditData(baseInput).summary.total,0);
});

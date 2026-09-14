import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { auditData, normalizeAssetPath } from './lib/data-audit.mjs';

const ROOT=path.dirname(fileURLToPath(import.meta.url));
const readJson=async(relative)=>JSON.parse(await readFile(path.join(ROOT,relative),'utf8'));

async function loadRuntimeModules() {
  const sandbox={ __mods:Object.create(null) };
  vm.createContext(sandbox);
  for (const file of ['src/js/data.js','src/js/flowerDataPolicy.js']) {
    vm.runInContext(await readFile(path.join(ROOT,file),'utf8'),sandbox,{filename:file});
  }
  return sandbox.__mods;
}

async function walk(dir) {
  const result=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const full=path.join(dir,entry.name);
    if(entry.isDirectory()) result.push(...await walk(full)); else result.push(full);
  }
  return result;
}

const modules=await loadRuntimeModules();
const flowers=modules['js/data.js'].FLOWERS;
const policy=modules['js/flowerDataPolicy.js'];
const imageAssets=(await readJson('data/image-assets.json')).assets;
const externalImages=(await readJson('data/external-image-metadata.json')).images;
const review=await readJson('data/flower-data-review.json');
const assetFiles=(await walk(path.join(ROOT,'assets','flowers'))).filter(file=>file.endsWith('.webp'));
const existingPaths=assetFiles.map(file=>normalizeAssetPath(ROOT,file));
const textFiles=(await Promise.all(['src','data','lib'].map(async dir=>(await walk(path.join(ROOT,dir))).filter(file=>/\.(?:js|mjs|json|css|html)$/.test(file))))).flat();
const sourceAssetReferences=[];
for(const file of textFiles){
  const text=await readFile(file,'utf8');
  const matches=text.match(/assets\/flowers\/[a-z0-9][a-z0-9-]*\.webp/g)||[];
  for(const imagePath of matches) sourceAssetReferences.push({ source:normalizeAssetPath(ROOT,file), path:imagePath });
}
const references=[
  ...(review.reviewRequired||[]).map(row=>({source:'flower-data-review.reviewRequired',flowerId:row.id})),
  ...(review.targetedTaxonomyChecks||[]).map(row=>({source:'flower-data-review.targetedTaxonomyChecks',flowerId:row.id}))
];
const identities=flowers.map(flower=>policy.getFlowerTaxonIdentity(flower));
const result=auditData({flowers,identities,imageAssets,externalImages,references,existingPaths,sourceAssetReferences});
const report={version:'V61',generatedAt:new Date().toISOString(),...result};
await writeFile(path.join(ROOT,'data','data-audit-v61.json'),JSON.stringify(report,null,2)+'\n');
console.log(`V61 data audit: ${result.summary.errors} errors / ${result.summary.total} issues`);
if(result.issues.length) for(const item of result.issues) console.log(`${item.code}: ${item.flowerId||item.path||item.value||item.message}`);
if(!result.ok) process.exitCode=1;

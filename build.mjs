import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>readFile(path.join(root,relative),'utf8');
const args=process.argv.slice(2);
const mode=args.length===0 ? 'dev' : args.length===1 ? args[0].replace(/^--mode=/,'') : '';
if(!['dev','prod'].includes(mode)) throw new Error('Usage: node build.mjs [--mode=dev|--mode=prod]');
const dev=mode==='dev';
const manifest=JSON.parse(await read('src/modules.json'));
if(!Array.isArray(manifest.common) || !Array.isArray(manifest.dev)) throw new Error('src/modules.json must define common and dev arrays');
const order=[...manifest.common];
if(dev){
  for(const entry of manifest.dev){
    if(!entry?.path || !entry?.before) throw new Error('Each DEV module must define path and before');
    const index=order.indexOf(entry.before);
    if(index<0) throw new Error(`DEV module anchor not found: ${entry.before}`);
    order.splice(index,0,entry.path);
  }
}
const sourceModuleScripts='const __mods=Object.create(null);\n'+(await Promise.all(order.map(name=>read('src/'+name)))).join('\n');
new vm.Script('"use strict";\n'+sourceModuleScripts);
const imageManifest=JSON.parse(await read('data/image-assets.json'));
const externalImageMetadata=JSON.parse(await read('data/external-image-metadata.json'));
const auditReport=JSON.parse(await read('data/data-audit-v61.json'));
const devPayload=JSON.stringify({audit:auditReport,imageAssets:imageManifest,externalImages:externalImageMetadata});
async function inlineLocalImages(source){
  let output=source;
  const uniquePaths=[...new Set((imageManifest.assets||[]).map(item=>item.path).filter(Boolean))];
  for(const assetPath of uniquePaths){
    const bytes=await readFile(path.join(root,assetPath));
    const dataUrl=`data:image/webp;base64,${bytes.toString('base64')}`;
    output=output.split(assetPath).join(dataUrl);
  }
  return output;
}
const moduleScripts=await inlineLocalImages(sourceModuleScripts);
new vm.Script('"use strict";\n'+moduleScripts);
const styles=(await read('src/styles.css'))+(dev?'\n'+await read('src/dev-styles.css'):'');
const template=await read('src/index.template.html');
const buildHtml=()=>{
  const bootstrap='"use strict";\nglobalThis.__FLOWER_APP_DEV__='+String(dev)+';\n'+(dev?'globalThis.__FLOWER_APP_DEV_PAYLOAD__='+devPayload+';\n':'');
  const scripts=bootstrap+moduleScripts;
  const pageTemplate=dev?template:template.replace('Botanical V61 DEV</title>','Botanical V61</title>');
  return pageTemplate.replace('/* APP_STYLES */',()=>styles).replace('/* APP_SCRIPTS */',()=>scripts.replace(/<\/script/gi,'<\\/script'));
};
const output=dev?'index.html':'index.prod.html';
await writeFile(path.join(root,output),buildHtml());
console.log(`V61 ${mode} build complete: ${output}`);

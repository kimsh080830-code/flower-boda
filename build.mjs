import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import vm from 'node:vm';
const root=path.dirname(fileURLToPath(import.meta.url));
const read=relative=>readFile(path.join(root,relative),'utf8');
const order=JSON.parse(await read('src/modules.json'));
const sourceModuleScripts='const __mods=Object.create(null);\n'+(await Promise.all(order.map(name=>read('src/'+name)))).join('\n');
new vm.Script('\"use strict\";\n'+sourceModuleScripts);
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
new vm.Script('\"use strict\";\n'+moduleScripts);
const styles=await read('src/styles.css');
const template=await read('src/index.template.html');
const buildHtml=(dev)=>{
  const scripts='\"use strict\";\nglobalThis.__FLOWER_APP_DEV__='+String(dev)+';\nglobalThis.__FLOWER_APP_DEV_PAYLOAD__='+(dev?devPayload:'null')+';\n'+moduleScripts;
  return template.replace('/* APP_STYLES */',()=>styles).replace('/* APP_SCRIPTS */',()=>scripts.replace(/<\/script/gi,'<\\/script'));
};
await writeFile(path.join(root,'꽃을보다_V61_dev.html'),buildHtml(true));
console.log('V61 dev build complete');

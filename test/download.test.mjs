import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../src/js/download.js',import.meta.url),'utf8');
test('calendar and backup downloads share an attached anchor and release the resource after dispatch',async()=>{
 let blob,clicked=0,attached=false,removed=false,released=false,release;
 const link={click(){assert.equal(attached,true);clicked++;},remove(){removed=true;}};
 const context=vm.createContext({__mods:{},Blob,URL:{createObjectURL(value){blob=value;return 'blob:test';},revokeObjectURL(value){assert.equal(value,'blob:test');released=true;}},document:{createElement(tag){assert.equal(tag,'a');return link;},body:{append(node){assert.equal(node,link);attached=true;}}},setTimeout(fn,ms){assert.ok(ms>=1000);release=fn;}});
 vm.runInContext(source,context);
 context.__mods['js/download.js'].downloadText('BEGIN:VCALENDAR','일정.ics','text/calendar;charset=utf-8');
 assert.equal(clicked,1);assert.equal(link.download,'일정.ics');assert.equal(link.href,'blob:test');assert.equal(removed,true);assert.equal(released,false);
 assert.equal(await blob.text(),'BEGIN:VCALENDAR');assert.equal(blob.type,'text/calendar;charset=utf-8');
 release();assert.equal(released,true);
});

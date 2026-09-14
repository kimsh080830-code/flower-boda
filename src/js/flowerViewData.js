__mods["js/flowerViewData.js"] = (() => {
const collator=new Intl.Collator('ko-KR');
function primaryFlowerName(flower) {return flower.standardNameKo || flower.nameKo;}
function compareFlowerNames(a,b) {return collator.compare(primaryFlowerName(a),primaryFlowerName(b)) || collator.compare(a.nameKo,b.nameKo);}
function otherFlowerNames(flower) {
  const primary=primaryFlowerName(flower);
  return [...new Set([
    flower.nameKo,
    ...(Array.isArray(flower.alternateNames) ? flower.alternateNames : [])
  ].map(value=>String(value || '').trim()).filter(value=>value && value!==primary))];
}
function petalShapeValues(flower) {
  const source=flower?.petalShape;
  const values=Array.isArray(source) ? source : typeof source==='string' ? [source] : [];
  return [...new Set(values.map(value=>String(value || '').trim()).filter(Boolean))];
}
function bloomStartSortValue(flower) {
  const match=/^(\d{2})-(\d{2})$/.exec(String(flower?.bloom?.start || ''));
  if(!match) return null;
  const month=Number(match[1]),day=Number(match[2]);
  const date=new Date(Date.UTC(2000,month-1,day));
  if(date.getUTCMonth()!==month-1 || date.getUTCDate()!==day) return null;
  return month*32+day;
}
function sortFlowers(flowers,mode='default') {
  const rows=flowers.map((flower,index)=>({flower,index,value:bloomStartSortValue(flower)}));
  if(mode==='name') rows.sort((a,b)=>compareFlowerNames(a.flower,b.flower) || a.index-b.index);
  if(mode==='bloom-early' || mode==='bloom-late') rows.sort((a,b)=>{
    const aValid=Number.isFinite(a.value),bValid=Number.isFinite(b.value);
    if(aValid!==bValid) return aValid ? -1 : 1;
    if(!aValid) return a.index-b.index;
    const difference=mode==='bloom-early' ? a.value-b.value : b.value-a.value;
    return difference || a.index-b.index;
  });
  return rows.map(row=>row.flower);
}
function shortSentence(text,max=74) {
  const value=String(text || '').trim(),first=value.split(/(?<=[.!?。])\s+/)[0] || value;
  return first.length>max ? `${first.slice(0,max-1).trim()}…` : first;
}
function habitatSummary(flower) {
  const text=String(flower.habitat || '');
  const places=[['공원',/공원/],['정원',/정원|화단|관상/],['산지',/산지|산림|고산|산기슭/],['숲',/숲/],['길가',/길가|도로|길옆/],['하천변',/하천|강변|냇가/],['연못',/연못/],['습지',/습지|습한/],['초지',/초지|들판|풀밭/],['해안',/해안|바닷가/]];
  return places.filter(([,pattern])=>pattern.test(text)).slice(0,3).map(([name])=>name).join(' · ') || shortSentence(text,28) || '서식 환경 확인 중';
}
function identificationSummary(flower) {return shortSentence(flower.identificationFeatures || flower.flowerFeatures,95) || '구별 특징 정보가 아직 없어요.';}
return {primaryFlowerName,otherFlowerNames,compareFlowerNames,petalShapeValues,bloomStartSortValue,sortFlowers,shortSentence,habitatSummary,identificationSummary};
})();

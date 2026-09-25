__mods["js/mapPlaces.js"] = (() => {
const FLOWER_PLACES = Object.freeze([
  Object.freeze({
    id: 'choansan-hydrangea-garden',
    name: '초안산 수국동산',
    latitude: 37.6294432,
    longitude: 127.047566,
    address: '서울특별시 노원구 월계동 산46-3',
    region: '서울',
    relatedFlowerIds: Object.freeze(['hydrangea']),
    bloomMonths: Object.freeze([6, 7]),
    description: '수국 행사 좌표로 확인된 수국 관람 장소예요.',
    sourceEventId: '4074598',
    sourceEventUuid: '745f4f13-d045-4bf4-8be4-fe91146575b9'
  }),
  Object.freeze({
    id: 'semiwon-lotus-garden',
    name: '세미원',
    latitude: 37.5408730097512,
    longitude: 127.323921861143,
    address: '경기도 양평군 양서면 양수로 93',
    region: '경기',
    relatedFlowerIds: Object.freeze(['lotus']),
    bloomMonths: Object.freeze([7, 8]),
    description: '연꽃 행사 좌표로 확인된 연꽃 관람 장소예요.',
    sourceEventId: '2550263',
    sourceEventUuid: '9aef769f-4f22-4a7f-981a-aacac41fd0d6'
  }),
  Object.freeze({
    id: 'yongsugol-poppy-field',
    name: '원주 용수골 꽃양귀비축제장',
    latitude: 37.28514670295481,
    longitude: 127.94063027241052,
    address: '강원특별자치도 원주시 용수골길 311',
    region: '강원',
    relatedFlowerIds: Object.freeze(['poppy']),
    bloomMonths: Object.freeze([5, 6]),
    description: '꽃양귀비 행사 좌표로 확인된 꽃 관람 장소예요.',
    sourceEventId: '2602974',
    sourceEventUuid: 'aa361709-4651-40f8-903d-9cf355c86454'
  }),
  Object.freeze({
    id: 'mureung-lavender-garden',
    name: '무릉별유천지',
    latitude: 37.47595553449147,
    longitude: 129.0330428105135,
    address: '강원특별자치도 동해시 이기로 97',
    region: '강원',
    relatedFlowerIds: Object.freeze(['lavender']),
    bloomMonths: Object.freeze([5, 6, 7]),
    description: '라벤더 행사 좌표로 확인된 꽃 관람 장소예요.',
    sourceEventId: '3304231',
    sourceEventUuid: '848e50c9-b824-4683-a028-2809a5ec23bb'
  }),
  Object.freeze({
    id: 'taebaek-sunflower-field',
    name: '태백 해바라기축제장',
    latitude: 37.206897847829,
    longitude: 128.989571026919,
    address: '강원특별자치도 태백시 구와우길 38-20',
    region: '강원',
    relatedFlowerIds: Object.freeze(['sunflower']),
    bloomMonths: Object.freeze([7, 8, 9]),
    description: '해바라기 행사 좌표로 확인된 꽃 관람 장소예요.',
    sourceEventId: '142228',
    sourceEventUuid: 'defc9c88-a69e-4fd5-8d79-e04c4bfdb9ab'
  }),
  Object.freeze({
    id: 'bulgapsa-red-spider-lily',
    name: '불갑사관광지',
    latitude: 35.2001494518252,
    longitude: 126.550628486334,
    address: '전남광주통합특별시 영광군 불갑면 불갑사로 450',
    region: '전남광주통합특별시',
    relatedFlowerIds: Object.freeze(['red-spider-lily']),
    bloomMonths: Object.freeze([9, 10]),
    description: '상사화 행사 좌표로 확인된 꽃 관람 장소예요.',
    sourceEventId: '1078905',
    sourceEventUuid: '50f59373-bf29-455b-8c92-50c4e76f58f5'
  }),
  Object.freeze({
    id: 'yangjaecheon-cherry-road',
    name: '양재천 벚꽃길',
    latitude: 37.476614,
    longitude: 127.041515,
    address: '서울특별시 서초구 양재동 261-23',
    region: '서울',
    relatedFlowerIds: Object.freeze(['cherry-blossom']),
    bloomMonths: Object.freeze([3, 4]),
    description: '양재천 벚꽃 행사 좌표로 확인된 봄꽃 관람 장소예요.',
    sourceEventId: '2540520',
    sourceEventUuid: '412a5d7d-4e58-47ee-85e3-7bf121e7aa93'
  }),
  Object.freeze({
    id: 'seokchon-lake-cherry-road',
    name: '석촌호수',
    latitude: 37.511898414927,
    longitude: 127.10424458301475,
    address: '서울특별시 송파구 송파나루길 206',
    region: '서울',
    relatedFlowerIds: Object.freeze(['cherry-blossom']),
    bloomMonths: Object.freeze([4]),
    description: '송파구 호수벚꽃축제 좌표로 확인된 벚꽃 관람 장소예요.',
    sourceEventId: '1592898',
    sourceEventUuid: 'e50b142c-6ec2-4374-a7ca-a10ece200d48'
  }),
  Object.freeze({
    id: 'jangan-cherry-road',
    name: '장안벚꽃길',
    latitude: 37.5668102,
    longitude: 127.0753419,
    address: '서울특별시 동대문구 장안동 24-1',
    region: '서울',
    relatedFlowerIds: Object.freeze(['cherry-blossom']),
    bloomMonths: Object.freeze([4]),
    description: '장안동 봄꽃 행사 좌표로 확인된 벚꽃 관람 장소예요.',
    sourceEventId: '1592837',
    sourceEventUuid: '644ad559-82bd-465c-8b67-d475658343c5'
  }),
  Object.freeze({
    id: 'gangneung-gyeongpo-cherry-road',
    name: '강릉 경포 벚꽃길',
    latitude: 37.7942610311229,
    longitude: 128.895500767487,
    address: '강원특별자치도 강릉시 경포로 365',
    region: '강원',
    relatedFlowerIds: Object.freeze(['cherry-blossom']),
    bloomMonths: Object.freeze([4]),
    description: '강릉 경포벚꽃축제 좌표로 확인된 벚꽃 관람 장소예요.',
    sourceEventId: '695592',
    sourceEventUuid: '279a5347-0c1a-4061-adca-94d915897ee2'
  }),
  Object.freeze({
    id: 'yangyang-namdaecheon-cherry-road',
    name: '양양 남대천 벚꽃길',
    latitude: 38.086697,
    longitude: 128.634986,
    address: '강원특별자치도 양양군 양양읍 송암리 505-3',
    region: '강원',
    relatedFlowerIds: Object.freeze(['cherry-blossom']),
    bloomMonths: Object.freeze([4]),
    description: '양양 남대천 벚꽃축제 좌표로 확인된 벚꽃 관람 장소예요.',
    sourceEventId: '3484079',
    sourceEventUuid: 'ab4e0b82-4048-46d9-877b-92e56ac9951a'
  })
]);

function getFlowerPlaceById(id) {
  return FLOWER_PLACES.find((place) => place.id === id) || null;
}

function getFlowerPlacesByFlowerId(flowerId) {
  return FLOWER_PLACES.filter((place) => place.relatedFlowerIds.includes(flowerId));
}

function getFlowerPlaceForEvent(event) {
  if (!event) return null;
  const latitude = Number(event.latitude);
  const longitude = Number(event.longitude);
  return FLOWER_PLACES.find((place) =>
    place.sourceEventId === event.id || place.sourceEventUuid === event.id
    || (Number.isFinite(latitude) && Number.isFinite(longitude)
      && Math.abs(place.latitude - latitude) < .000001
      && Math.abs(place.longitude - longitude) < .000001)
  ) || null;
}

return {
  "FLOWER_PLACES": FLOWER_PLACES,
  "getFlowerPlaceById": getFlowerPlaceById,
  "getFlowerPlacesByFlowerId": getFlowerPlacesByFlowerId,
  "getFlowerPlaceForEvent": getFlowerPlaceForEvent
};
})();

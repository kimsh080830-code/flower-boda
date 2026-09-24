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
    sourceEventId: '4074598'
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
    sourceEventId: '2550263'
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
    sourceEventId: '2602974'
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
    sourceEventId: '3304231'
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
    sourceEventId: '142228'
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
    sourceEventId: '1078905'
  })
]);

function getFlowerPlaceById(id) {
  return FLOWER_PLACES.find((place) => place.id === id) || null;
}

return { "FLOWER_PLACES": FLOWER_PLACES, "getFlowerPlaceById": getFlowerPlaceById };
})();

__mods["js/mapCourses.js"] = (() => {
const FLOWER_COURSES = Object.freeze([
  Object.freeze({
    id: 'seoul-southeast-cherry-course',
    name: '서울 동남권 벚꽃 코스',
    placeIds: Object.freeze([
      'yangjaecheon-cherry-road',
      'seokchon-lake-cherry-road',
      'jangan-cherry-road'
    ]),
    estimatedDuration: '약 4시간',
    description: '양재천에서 석촌호수와 장안벚꽃길로 이어지는 대중교통 이동형 봄 코스예요.',
    recommendedMonths: Object.freeze([4]),
    region: '서울',
    relatedFlowerIds: Object.freeze(['cherry-blossom'])
  }),
  Object.freeze({
    id: 'gangwon-east-coast-cherry-course',
    name: '동해안 벚꽃 드라이브 코스',
    placeIds: Object.freeze([
      'gangneung-gyeongpo-cherry-road',
      'yangyang-namdaecheon-cherry-road'
    ]),
    estimatedDuration: '약 4시간',
    description: '강릉 경포와 양양 남대천을 잇는 지역 이동형 벚꽃 코스예요.',
    recommendedMonths: Object.freeze([4]),
    region: '강원',
    relatedFlowerIds: Object.freeze(['cherry-blossom'])
  })
]);

function getFlowerCourseById(id) {
  return FLOWER_COURSES.find((course) => course.id === id) || null;
}

return { "FLOWER_COURSES": FLOWER_COURSES, "getFlowerCourseById": getFlowerCourseById };
})();

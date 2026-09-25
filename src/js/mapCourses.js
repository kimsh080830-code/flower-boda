__mods["js/mapCourses.js"] = (() => {
const FLOWER_COURSES = Object.freeze([
  Object.freeze({
    id: 'seoul-east-cherry-course',
    name: '서울 동부 벚꽃 반나절 코스',
    placeIds: Object.freeze([
      'yangjaecheon-cherry-road',
      'seokchon-lake-cherry-road',
      'jangan-cherry-road'
    ]),
    estimatedDuration: '약 4시간',
    description: '서로 6~7km 떨어진 양재천, 석촌호수, 장안벚꽃길을 대중교통으로 잇는 반나절 코스예요.',
    recommendedMonths: Object.freeze([4]),
    region: '서울',
    relatedFlowerIds: Object.freeze(['cherry-blossom'])
  })
]);

function getFlowerCourseById(id) {
  return FLOWER_COURSES.find((course) => course.id === id) || null;
}

return { "FLOWER_COURSES": FLOWER_COURSES, "getFlowerCourseById": getFlowerCourseById };
})();

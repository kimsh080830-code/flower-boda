__mods["js/ui/screens/encyclopedia.js"] = (() => {
const { FLOWERS, SEASONS, COLORS, MAJOR_GROUP_OPTIONS, ORDER_OPTIONS, FAMILY_OPTIONS, GENUS_OPTIONS } = __mods["js/data.js"];
const { getBloomStatus } = __mods["js/dateUtils.js"];
const { matchesFlowerSearch } = __mods["js/searchUtils.js"];
const { $, el, button } = __mods["js/ui/dom.js"];
const { sectionHeader, emptyState, flowerPoster } = __mods["js/ui/components.js"];
const { pageHeader, selectControl } = __mods["js/ui/screens/shared.js"];
const { petalShapeValues, sortFlowers } = __mods["js/flowerViewData.js"];
const PETAL_SHAPE_OPTIONS = [...new Set(FLOWERS.flatMap(petalShapeValues))]
  .sort((a,b)=>a.localeCompare(b,'ko-KR'));
function filterEncyclopedia(state) {
  const filtered=FLOWERS.filter((flower) => {
    if (!matchesFlowerSearch(flower, state.searchQuery)) return false;
    if (state.encyclopediaFilters.season && !flower.seasons.includes(state.encyclopediaFilters.season)) return false;
    if (state.encyclopediaFilters.color && !flower.colors.includes(state.encyclopediaFilters.color)) return false;
    if (state.encyclopediaFilters.bloom === 'now' && !['in-season', 'ending'].includes(getBloomStatus(flower.bloom, state.currentDate).code)) return false;
    if (state.encyclopediaFilters.majorGroup && flower.taxonomy?.majorGroup !== state.encyclopediaFilters.majorGroup) return false;
    if (state.encyclopediaFilters.order && flower.taxonomy?.order !== state.encyclopediaFilters.order) return false;
    if (state.encyclopediaFilters.family && flower.taxonomy?.familyLatin !== state.encyclopediaFilters.family) return false;
    if (state.encyclopediaFilters.genus && flower.taxonomy?.genusLatin !== state.encyclopediaFilters.genus) return false;
    if (state.encyclopediaFilters.petalShape && !petalShapeValues(flower).includes(state.encyclopediaFilters.petalShape)) return false;
    if (state.encyclopediaFilters.favoritesOnly && !state.favoriteFlowerIds.includes(flower.id)) return false;
    return true;
  });
  return sortFlowers(filtered,state.encyclopediaSort);
}

function renderEncyclopedia(state) {
  const main = el('main', { className: 'screen', id: 'main-content' }, [
    pageHeader('Botanical index', '꽃 도감', '이름이나 특징으로 가볍게 찾아봐요.', `${FLOWERS.length}종`)
  ]);
  main.append(el('div', { className: `search-field search-prominent ${state.searchQuery ? 'has-clear' : ''}` }, [
    el('span', { className: 'search-glyph', 'aria-hidden': 'true' }),
    el('label', { className: 'visually-hidden', for: 'flower-search', text: '꽃 검색' }),
    el('input', {
      id: 'flower-search', type: 'search', value: state.searchQuery,
      placeholder: '꽃 이름·초성·학명 검색', autocomplete: 'off'
    }),
    state.searchQuery ? el('button', {
      type: 'button', className: 'search-clear', text: '×',
      dataset: { action: 'clear-flower-search' }, ariaLabel: '검색어 지우기'
    }) : null
  ]));

  const details = el('details', { id:'encyclopedia-filter-panel',className: 'filter-panel', open: state.filtersOpen ? '' : null });
  details.append(el('summary', {}, [
    el('span', { text: '필터' }),
    el('span', { className: 'filter-summary-hint', text: '계절 · 색상 · 개화 · 저장' })
  ]));
  details.append(el('div', { className: 'filter-grid' }, [
    selectControl('계절', 'flower-season-filter', [['','전체'], ...SEASONS.map((season) => [season, season])], state.encyclopediaFilters.season, 'filter-encyclopedia'),
    selectControl('색상', 'flower-color-filter', [['','전체'], ...COLORS.map((color) => [color, color])], state.encyclopediaFilters.color, 'filter-encyclopedia'),
    selectControl('개화', 'flower-bloom-filter', [['','전체'], ['now','지금 볼 시기']], state.encyclopediaFilters.bloom, 'filter-encyclopedia')
  ]));
  details.append(el('button', {
    type: 'button',
    className: `favorite-filter-toggle ${state.encyclopediaFilters.favoritesOnly ? 'is-active' : ''}`,
    dataset: { action: 'toggle-favorite-filter' },
    'aria-pressed': state.encyclopediaFilters.favoritesOnly ? 'true' : 'false'
  }, [
    el('span', { className: 'bookmark-icon', 'aria-hidden': 'true' }),
    el('span', { text: '저장한 꽃' })
  ]));

  const advanced = el('details', { id:'encyclopedia-advanced-filter-panel',className:'advanced-filter-panel',open:state.advancedFiltersOpen?'':null });
  advanced.append(el('summary', {}, [
    el('span', { text: '고급 필터' }),
    el('span', { className: 'filter-summary-hint', text: `큰 분류 · 목 · 과 · 속${PETAL_SHAPE_OPTIONS.length ? ' · 꽃잎 모양' : ''}` })
  ]));
  const advancedFields=[
    selectControl('큰 분류', 'flower-major-group-filter', [['','전체'], ...MAJOR_GROUP_OPTIONS], state.encyclopediaFilters.majorGroup, 'filter-encyclopedia'),
    selectControl('목', 'flower-order-filter', [['','전체'], ...ORDER_OPTIONS], state.encyclopediaFilters.order, 'filter-encyclopedia'),
    selectControl('과', 'flower-family-filter', [['','전체'], ...FAMILY_OPTIONS], state.encyclopediaFilters.family, 'filter-encyclopedia'),
    selectControl('속', 'flower-genus-filter', [['','전체'], ...GENUS_OPTIONS], state.encyclopediaFilters.genus, 'filter-encyclopedia')
  ];
  if(PETAL_SHAPE_OPTIONS.length) advancedFields.push(selectControl('꽃잎 모양','flower-petal-shape-filter',[['','전체'],...PETAL_SHAPE_OPTIONS.map(value=>[value,value])],state.encyclopediaFilters.petalShape,'filter-encyclopedia'));
  advanced.append(el('div', { className: 'advanced-filter-grid' }, advancedFields));
  details.append(advanced);
  details.append(button('검색·필터·정렬 초기화', 'reset-encyclopedia', { kind: 'tertiary', extraClass: 'btn-small filter-reset' }));
  main.append(details);
  main.append(el('section',{className:'sort-panel','aria-label':'도감 정렬'},[
    selectControl('정렬','flower-sort',[['default','기본순'],['name','가나다순'],['bloom-early','개화 빠른순'],['bloom-late','개화 늦은순']],state.encyclopediaSort,'sort-encyclopedia')
  ]));
  main.append(el('section', { id: 'encyclopedia-results', className: 'content-section encyclopedia-results' }));
  updateEncyclopediaResults(state, main);
  return main;
}

function updateEncyclopediaResults(state, root = document) {
  const results = $('#encyclopedia-results', root);
  if (!results) return;
  const flowers = filterEncyclopedia(state);
  results.replaceChildren(sectionHeader('검색 결과', '', '', `${flowers.length}종`));
  if (!flowers.length) {
    results.append(el('div', { className: 'empty-state encyclopedia-empty-state' }, [
      el('p', { className: 'encyclopedia-empty-title', text: '검색 결과가 없어요' }),
      el('p', { className: 'encyclopedia-empty-description', text: '다른 이름이나 조건으로 검색해보세요.' })
    ]));
    return;
  }
  const grid = el('div', { className: 'flower-grid encyclopedia-grid' });
  flowers.forEach((flower) => grid.append(flowerPoster(flower, state, { showBloomFlow: false })));
  results.append(grid);
}
return { "renderEncyclopedia": renderEncyclopedia, "updateEncyclopediaResults": updateEncyclopediaResults, "filterEncyclopedia": filterEncyclopedia, "PETAL_SHAPE_OPTIONS": PETAL_SHAPE_OPTIONS };
})();

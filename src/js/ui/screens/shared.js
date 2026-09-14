__mods["js/ui/screens/shared.js"] = (() => {
const { FLOWERS } = __mods["js/data.js"];
const { getBloomStatus } = __mods["js/dateUtils.js"];
const { el } = __mods["js/ui/dom.js"];

function topSeasonFlowers(state, season = state.currentSeason) {
  return FLOWERS.filter((flower) => flower.seasons.includes(season))
    .map((flower) => ({ flower, status: getBloomStatus(flower.bloom, state.currentDate) }))
    .sort((a, b) => a.status.priority - b.status.priority || a.flower.nameKo.localeCompare(b.flower.nameKo, 'ko'))
    .map(({ flower }) => flower);
}

function pageHeader(kicker, title, description = '', count = '') {
  return el('header', { className: 'page-header' }, [
    el('span', { className: 'page-kicker', text: kicker }),
    el('div', { className: 'page-title-line' }, [
      el('h1', { text: title }),
      count ? el('span', { className: 'page-count', text: count }) : null
    ]),
    description ? el('p', { text: description }) : null
  ]);
}

function selectControl(label, id, options, value, dataAction, data = {}) {
  const selected = options.find(([optionValue]) => optionValue === value) || options[0] || ['', '선택'];
  const listId = `${id}-options`;
  const wrapper = el('div', { className: 'filter-field' }, [
    el('span', { text: label }),
    el('input', { id, type: 'hidden', value, dataset: { action: dataAction, ...data } }),
    el('details', { className: 'inline-select', dataset: { controlId: id } }, [
      el('summary', {
        className: 'inline-select-trigger',
        dataset: { action: 'toggle-inline-select' },
        ariaLabel: `${label}: ${selected[1]}`,
        'aria-controls': listId
      }, [el('span', { className: 'inline-select-value', text: selected[1] })]),
      el('div', { id: listId, className: 'inline-select-options', role: 'listbox', ariaLabel: `${label} 선택` },
        options.map(([optionValue, optionLabel]) => el('button', {
          type: 'button',
          className: `inline-select-option ${optionValue === value ? 'is-selected' : ''}`.trim(),
          role: 'option',
          'aria-selected': String(optionValue === value),
          dataset: { action: 'select-option', selectAction: dataAction, controlId: id, value: optionValue, ...data },
          text: optionLabel
        })))
    ])
  ]);
  return wrapper;
}
return { "topSeasonFlowers": topSeasonFlowers, "pageHeader": pageHeader, "selectControl": selectControl };
})();

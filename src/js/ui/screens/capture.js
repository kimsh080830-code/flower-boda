__mods["js/ui/screens/capture.js"] = (() => {
const { APP_CONFIG } = __mods["js/config.js"];
const { getFlowerById } = __mods["js/data.js"];
const { el, button, image } = __mods["js/ui/dom.js"];
const { emptyState, primaryFlowerName, otherNameLine } = __mods["js/ui/components.js"];
const { pageHeader } = __mods["js/ui/screens/shared.js"];
function candidateScore(candidate) {
  const score = Number(candidate?.confidence);
  return Number.isFinite(score) ? Math.max(0, Math.min(1, score)) : 0;
}

function comparisonFacts(candidate) {
  const flower = candidate?.flowerId ? getFlowerById(candidate.flowerId) : null;
  const fact = (value) => typeof value === 'string' && value.trim() ? value.trim() : '확인 가능한 도감 정보가 없어요.';
  return { flower, facts: [
    ['꽃잎·꽃 모양', fact(flower?.flowerFeatures)],
    ['잎 모양', fact(flower?.leafFeatures)],
    ['함께 볼 특징', fact(flower?.identificationFeatures)]
  ] };
}

function uncertainIdentification(candidates, selected) {
  if (!candidates.length) return '사진만으로 비슷한 꽃을 찾지 못했어요.';
  if (candidateScore(candidates[0]) < APP_CONFIG.LOW_CONFIDENCE_THRESHOLD || candidateScore(selected) < APP_CONFIG.LOW_CONFIDENCE_THRESHOLD) {
    return '식별 점수가 낮아 이 사진만으로 꽃을 확정하기 어려워요.';
  }
  if (candidates.length > 1 && Math.abs(candidateScore(candidates[0]) - candidateScore(candidates[1])) < 0.15) {
    return '앞선 두 후보의 점수가 비슷해요. 꽃과 잎을 함께 확인해 주세요.';
  }
  if (!selected?.flowerId || !getFlowerById(selected.flowerId)) return '선택한 후보의 도감 정보가 없어 특징을 대조할 수 없어요.';
  return '';
}

function renderCaptureFollowup(reason) {
  return el('section', { className: 'capture-followup', 'aria-label': '추가 촬영 안내' }, [
    el('h3', { text: '이 부분을 더 찍어보세요' }),
    el('p', { text: reason }),
    el('ul', {}, [
      el('li', { text: '꽃 정면: 꽃잎의 수·끝 모양과 꽃 중심이 선명하게 보이도록 찍어요.' }),
      el('li', { text: '잎: 잎 전체와 가장자리, 줄기에 붙은 모습이 함께 보이도록 찍어요.' }),
      el('li', { text: '줄기·전체 모습: 가지가 갈라지는 모습과 꽃이 달린 위치를 담아요.' })
    ]),
    el('p', { text: '같은 식물의 사진을 한 장씩 다시 선택해 확인하고, 아래 도감 특징과 대조해 주세요.' })
  ]);
}

function renderCandidateComparison(candidates) {
  return el('section', { className: 'candidate-comparison', 'aria-labelledby': 'candidate-comparison-title' }, [
    el('h3', { id: 'candidate-comparison-title', text: '꽃잎·잎 비교' }),
    el('p', { className: 'candidate-comparison-note', text: '후보에 연결된 앱 도감의 특징을 같은 항목으로 비교해 보세요. 사진에서 실제로 관찰한 특징은 아니며, 품종에 따라 다를 수 있어요.' }),
    el('div', { className: 'candidate-comparison-grid' }, candidates.map((candidate) => {
      const { flower, facts } = comparisonFacts(candidate);
      const name = flower ? primaryFlowerName(flower) : candidate.nameKo || candidate.scientificName || '이름 확인 필요';
      return el('article', { className: 'candidate-comparison-card', ariaLabel: `${name} 도감 비교` }, [
        el('h4', { text: name }),
        flower?.scientificName ? el('p', { className: 'candidate-scientific', text: `도감 학명: ${flower.scientificName}` }) : null,
        el('dl', { className: 'candidate-comparison-facts' }, facts.flatMap(([label, value]) => [
          el('dt', { text: label }), el('dd', { text: value })
        ])),
        flower ? button('도감 보기', 'open-flower', { kind: 'secondary', data: { flowerId: flower.id } }) : null
      ]);
    })),
    el('p', { className: 'candidate-comparison-note', text: '근거: 앱 도감의 꽃·잎·구별 특징. 현재 형태 설명에는 종별 외부 출처 링크가 없어 추가 확인이 필요해요. 도감 학명과 식별 학명이 다르면 같은 종으로 확정하지 마세요.' })
  ]);
}

function renderCandidateCard(candidate, state, { primary = false, rankLabel = '' } = {}) {
  const selected = candidate.candidateId === state.selectedCandidateId;
  const matchedFlower = candidate.flowerId ? getFlowerById(candidate.flowerId) : null;
  return el('button', {
    type: 'button',
    className: `candidate-card ${primary ? 'candidate-card-primary' : 'candidate-card-secondary'} ${selected ? 'is-selected' : ''}`,
    dataset: { action: 'select-candidate', candidateId: candidate.candidateId || '' },
    ariaLabel: `${matchedFlower ? primaryFlowerName(matchedFlower) : candidate.nameKo} 후보 선택`,
    'aria-pressed': selected ? 'true' : 'false'
  }, [
    image(candidate.image, `${matchedFlower ? primaryFlowerName(matchedFlower) : candidate.nameKo} 후보 이미지`, primary ? 'candidate-image-primary' : 'candidate-thumb', candidate.fallbackImage || matchedFlower?.localImage),
    el('span', { className: 'candidate-copy' }, [
      el('span', { className: 'candidate-kicker', text: rankLabel }),
      el('strong', { className: 'candidate-name', text: matchedFlower ? primaryFlowerName(matchedFlower) : candidate.nameKo }),
      matchedFlower ? otherNameLine(matchedFlower, 'candidate-standard') : null,
      candidate.scientificName ? el('span', { className: 'candidate-scientific', text: candidate.scientificName }) : null,
      el('span', { className: 'candidate-confidence-line' }, [
        el('span', { text: '식별 점수' }),
        el('strong', { text: `${Math.round(candidateScore(candidate) * 100)}%` })
      ]),
      selected ? el('span', { className: 'candidate-selected-label', text: '선택됨' }) : null
    ])
  ]);
}

function renderAnalysisResult(state) {
  const result = state.analysisResult;
  if (!result) return null;
  const candidates = Array.isArray(result.candidates) ? result.candidates.filter((candidate) => candidate && typeof candidate === 'object') : [];
  const selected = candidates.find((candidate) => candidate.candidateId === state.selectedCandidateId) || candidates[0];
  const uncertainty = uncertainIdentification(candidates, selected);
  const section = el('section', { className: 'analysis-result', 'aria-labelledby': 'analysis-title' }, [
    el('div', { className: 'analysis-heading' }, [
      el('span', { className: 'section-label', text: '사진 검색 결과' }),
      el('h2', { id: 'analysis-title', className: 'analysis-title', text: '이 꽃들과 닮았어요' })
    ])
  ]);

  if (uncertainty) section.append(renderCaptureFollowup(uncertainty));
  if (!candidates.length) {
    section.append(emptyState('비슷한 꽃을 찾지 못했어요.', '다시 촬영', 'restart-photo'));
    return section;
  }

  section.append(el('p', { className: 'candidate-comparison-note', text: '식별 점수는 정답률을 보장하지 않아요. 도감과 실제 식물의 특징을 함께 확인해 주세요.' }));
  section.append(renderCandidateCard(candidates[0], state, { primary: true, rankLabel: '가장 비슷한 꽃' }));

  if (candidates.length > 1) {
    const alternatives = el('div', { className: 'candidate-alternatives' }, [
      el('h3', { text: '다른 후보' })
    ]);
    const list = el('div', { className: 'candidate-list' });
    candidates.slice(1).forEach((candidate, index) => {
      list.append(renderCandidateCard(candidate, state, { rankLabel: `${index + 2}순위` }));
    });
    alternatives.append(list);
    section.append(alternatives);
  }

  section.append(renderCandidateComparison(candidates));

  const matched = Boolean(selected?.flowerId && getFlowerById(selected.flowerId));
  section.append(el('div', { className: 'result-selection-summary' }, [
    el('span', { text: '선택한 꽃' }),
    el('strong', { text: selected?.nameKo || '꽃 하나를 골라주세요' })
  ]));
  section.append(el('div', { className: 'result-actions' }, [
    button('이 꽃 선택하기', 'confirm-candidate', {
      kind: 'primary', disabled: !matched, data: { flowerId: selected?.flowerId || '' }
    }),
    button('상세정보 보기', 'open-flower', {
      kind: 'secondary', disabled: !matched, data: { flowerId: selected?.flowerId || '' }
    }),
    button('다른 사진으로 다시 찾기', 'restart-photo', { kind: 'tertiary' })
  ]));
  if (!matched) {
    section.append(el('p', {
      className: 'weather-note',
      text: '이 후보는 아직 도감 정보와 연결되지 않았어요.'
    }));
  }
  return section;
}

function renderCapture(state) {
  const main = el('main', { className: 'screen capture-screen', id: 'main-content' }, [
    pageHeader('', '사진 찾기')
  ]);

  if (!state.photo?.file) {
    main.append(el('section', { className: 'capture-start' }, [
      el('p', { className: 'capture-quick-note', text: '꽃이 화면 가운데 크게 보이면 더 잘 찾을 수 있어요.' }),
      el('div', { className: 'capture-actions' }, [
        button('사진 촬영', 'trigger-camera', { kind: 'primary' }),
        button('앨범 선택', 'trigger-gallery', { kind: 'secondary' })
      ])
    ]));
  } else {
    const previewChildren = [
      image(state.photo.objectUrl, '분석할 꽃 사진 미리보기', 'capture-preview'),
      el('div', { className: 'capture-file-meta' }, [
        el('strong', { text: state.photo.file.name || '선택한 사진' }),
        el('span', { text: `${Math.max(1, Math.round(state.photo.file.size / 1024))}KB` })
      ])
    ];
    if (state.photo.preparing && state.photoPrepareVisible) {
      previewChildren.push(el('div', { className: 'capture-loading-overlay', role: 'status', 'aria-live': 'polite' }, [
        el('span', { className: 'spinner', 'aria-hidden': 'true' }),
        el('p', { text: '사진을 준비하고 있어요' })
      ]));
    } else if (state.loading && state.analysisLoadingVisible) {
      previewChildren.push(el('div', { className: 'capture-loading-overlay', role: 'status', 'aria-live': 'polite' }, [
        el('span', { className: 'spinner', 'aria-hidden': 'true' }),
        el('p', { text: state.analysisLoadingMessage || '꽃을 확인하고 있어요' })
      ]));
    }
    main.append(el('section', { className: 'capture-preview-section' }, previewChildren));
    if (state.photo.preprocessed?.lowResolution && !state.loading) {
      main.append(el('p', { className: 'capture-quality-note', text: '사진이 작으면 정확도가 떨어질 수 있어요. 가능하면 꽃이 크게 보이는 원본 사진을 사용해 주세요.' }));
    }
    const photoBusy = Boolean(state.photo.preparing || state.loading);
    main.append(el('div', { className: 'capture-actions capture-actions-after' }, [
      button(state.photo.preparing ? '사진 준비 중…' : state.loading ? '확인 중…' : '꽃 확인하기', 'analyze-photo', { kind: 'primary', disabled: photoBusy }),
      button('다시 선택', 'open-photo-picker', { kind: 'secondary', disabled: photoBusy }),
      button('취소', 'clear-photo', { kind: 'tertiary', disabled: photoBusy })
    ]));
  }

  if (state.error) main.append(el('div', { className: 'notice notice-error', role: 'alert', text: state.error }));
  if (state.analysisResult) main.append(renderAnalysisResult(state));
  return main;
}
return { "renderCapture": renderCapture, "comparisonFacts": comparisonFacts, "uncertainIdentification": uncertainIdentification };
})();

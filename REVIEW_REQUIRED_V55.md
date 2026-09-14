# 꽃을 보다 V55 · REVIEW_REQUIRED

이번 단계에서는 애매한 분류값을 추측해 자동 수정하지 않았습니다. 아래 9개 레코드는 현재 앱의 도감 항목 자체를 삭제하거나 합치지 않고, 단일 accepted taxon / taxon rank / taxon ID를 확정하기 전에 추가 검토가 필요한 항목입니다.

1. `rose` · 장미 — `Rosa spp.` 여러 종·원예품종 통칭
2. `cherry-blossom` · 벚꽃 — 여러 `Prunus` 계통의 꽃을 묶는 공통명 그룹
3. `dandelion` · 민들레 — `Taraxacum spp.` 다종 통칭
4. `aster` · 아스타 — 원예 공통명 + `Symphyotrichum spp.` 다종 범위
5. `daffodil` · 수선화 — `Narcissus spp.` 여러 종·원예품종 통칭
6. `lily` · 백합 — `Lilium spp.` 여러 종·원예품종 통칭
7. `plum-blossom-red` · 홍매화 — `Prunus mume`의 붉은 꽃 재배품종군
8. `gerbera` · 거베라 — `Gerbera jamesonii` 계통의 원예 교잡군으로 단일 species와 동일시하지 않음
9. `marigold` · 메리골드 — `Tagetes spp.` 여러 종·원예품종 통칭

## 이번 단계에서 확인한 분류 메모

- `Forsythia koreana`: accepted species 확인, 기존 값 유지.
- `Oenothera lindheimeri`: accepted species 확인. `Gaura lindheimeri`는 synonym으로 검증 메타데이터에 반영.
- `Glandularia × hybrida`: artificial hybrid 확인. `Verbena × hybrida`는 synonym으로 검증 메타데이터에 반영.
- `Chrysanthemum × morifolium`, `Leucanthemum × superbum`, `Helleborus × hybridus`, `Viola × wittrockiana`: hybrid 분류 확인, 기존 표시값 유지.
- `Tulipa gesneriana`: accepted species 확인, 기존 값 유지.

## 데이터 보존

- 기존 꽃 ID 변경 없음.
- 기존 45개 `bloom.start/end` 변경 없음.
- 기존 꽃 설명/잎 특징/꽃 특징/식별 특징/서식 환경 값 자동 수정 없음.
- localStorage 키 및 관찰/즐겨찾기 ID 참조 구조 변경 없음.
- 자동 병합 없음.

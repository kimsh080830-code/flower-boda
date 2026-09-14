# 꽃을 보다 V56 이미지·데이터 검사 결과

## 결과 요약

- 자동 데이터 검사: **0 errors / 0 issues**
- 전체 자동 테스트: **157 / 157 통과**
- 꽃 레코드: **45개**
- 꽃별 로컬 fallback WebP: **45개**
- 공통 fallback WebP: **1개**
- 관리 중인 외부 대표 이미지 메타데이터: **8개**
- V55 대비 꽃 ID 변경: **0개**
- V55 대비 이미지 외 꽃 데이터 변경: **0개**
- V55 대비 행사 데이터 변경: **0개**

## V56 이미지 구조

- 꽃별 fallback: `assets/flowers/<flower-id>-01.webp`
- 공통 fallback: `assets/flowers/flower-fallback-01.webp`
- 로컬 이미지 manifest: `data/image-assets.json`
- 외부 이미지 메타데이터: `data/external-image-metadata.json`
- 최종 단일 HTML 빌드에서는 로컬 WebP를 `data:image/webp;base64,...`로 자동 인라인해 오프라인 fallback을 유지합니다.

외부 이미지 메타데이터 필드:

- `flowerId`
- `filename`
- `source`
- `author`
- `sourceUrl`
- `license`
- `licenseUrl`
- `attributionRequired`

## 자동 검사 항목

`audit-data.mjs` / `lib/data-audit.mjs`에서 다음을 검사합니다.

- ID 중복
- 학명 중복
- accepted name 충돌
- synonym 충돌
- 필수 필드 누락
- 개화 날짜 형식 및 달력 날짜 오류
- 꽃별 fallback 이미지 누락
- 이미지 경로/파일명 규칙 오류
- manifest ↔ 꽃 데이터 ↔ 실제 파일 불일치
- 실제 폴더에만 존재하는 미등록 이미지 파일
- 소스에 남은 삭제된 이미지 경로
- 외부 이미지 라이선스/출처 메타데이터 누락
- 존재하지 않는 꽃 ID 참조
- 기타 중복·연결 불일치

검사기는 값을 자동 수정하거나 병합하지 않고 문제를 보고합니다.

## 오검출·오류 샘플 검수

테스트에서 의도적으로 다음 잘못된 샘플을 만들어 모두 감지되는지 확인했습니다.

- 존재하지 않는 `ghost-flower` ID 참조
- 실제로 없는 `assets/flowers/not-real-01.webp`
- 외부 이미지 `license` 누락
- 삭제된 이미지 경로 잔재
- manifest에 없는 고아 이미지 파일
- 중복 ID
- 중복 학명
- accepted name 충돌
- synonym 충돌
- 필수 필드 누락
- 존재하지 않는 날짜 `02-31`

정상 V56 데이터에서는 위 검사 결과가 **0건**입니다.

## V55 데이터 보존 확인

V55 원본과 V56의 `FLOWERS`를 비교할 때 `image`, `localImage`, `imageCredit`만 제외한 나머지 모든 꽃 필드는 동일합니다. 기존 45개 ID도 그대로 유지됩니다. `src/js/eventSnapshot.js` 행사 데이터도 V55와 동일합니다.

이번 버전에서 실제 꽃 데이터 교정이나 REVIEW_REQUIRED 판정 변경은 하지 않았습니다. V55의 데이터 검증 정책과 `REVIEW_REQUIRED_V55.md`는 그대로 유지됩니다.

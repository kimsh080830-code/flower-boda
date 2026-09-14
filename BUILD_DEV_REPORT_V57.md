# 꽃을 보다 V57 · 빌드/DEV 검수 보고서

## 빌드 체계

- 실제 원본: `src/`, `data/`, `assets/`, `test/`
- DEV/일반 별도 원본 복제 없음
- 동일 `src/modules.json`과 `src/index.template.html`에서 두 빌드 생성
- 일반: `꽃을보다_V57.html`
- DEV: `꽃을보다_V57_dev.html`

## 실제 사용 명령

- `npm run build`
- `npm test`

`npm run build` 내부 기존 흐름은 `node audit-data.mjs && node build.mjs`입니다.

## DEV 분리

- 일반 빌드: `__FLOWER_APP_DEV__ = false`, DEV payload 없음
- DEV 빌드: `__FLOWER_APP_DEV__ = true`, 빌드 데이터 검사 결과/이미지 메타데이터를 DEV 검사 도구에만 제공
- 통합 DEV UI는 설정 화면에서 DEV 모드일 때만 렌더링
- DEV 날짜/네트워크/긴 텍스트/폰트 상태는 메모리 전용

## 데이터 보존

V56 대비 아래 기존 데이터 파일은 동일합니다.

- `src/js/data.js`
- `data/image-assets.json`
- `data/external-image-metadata.json`
- `data/flower-data-review.json`

기존 localStorage 키/저장 형식은 변경하지 않았습니다.

## 검사 결과

- V57 데이터 검사: 0 errors / 0 issues
- 전체 자동 테스트: 162 / 162 통과
- 실제 Chromium 렌더: 일반/DEV 모두 오류 0
- 일반 설정 화면 DEV 패널: 0개
- DEV 설정 화면 DEV 패널: 1개
- 요청된 DEV 도구 누락: 0개
- DEV 최대 폰트/네트워크 실패 토글 후 `flower-info.settings.v1` 변경: 없음
- 실제 홈 비교: 일반/DEV 오늘 꽃 및 하단 내비 결과 동일

## 확인된 오류

최종 검수 기준 남은 오류 없음.

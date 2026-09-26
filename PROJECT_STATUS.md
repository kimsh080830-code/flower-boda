# 프로젝트 상태

## 2026-09-26 · Render 루트 PROD 서빙

- 작업 브랜치: `dev` (`main` 미수정). Render build에서 PROD 산출물을 만들고 서버 `/`, `/index.html`만 해당 산출물로 서빙하도록 조정.
- 사전 체크포인트: `checkpoints/flower-boda-render/20260926-before-render-root-prod-8093ccc.zip` (clean `dev` 기준, SHA-256 `09fcc56cbb28ee34eae7e52c7c7b568accc3b0a3191e2eecfc4c0e2122c8737f`). 표준 백업 스크립트는 기존 `dev-worktree/index.html`의 자격정보 휴리스틱으로 중단되어 Git archive 체크포인트로 대체.
- 수정 파일: `render.yaml`, `server.mjs`, `test/static-security.test.mjs`, `test/v59-build-dev-tools.test.mjs`, `PROJECT_STATUS.md`.
- 검증: `node --test test/*.test.mjs` 274/274 통과, `node audit-data.mjs` 0 errors / 0 issues, `node build.mjs --mode=prod` 성공. npm CLI가 없어 동일 Node 스크립트로 확인.
- PROD 아티팩트에서 DEV 플래그 true, payload, DEV 모듈/UI 문구/스타일 부재를 확인하고, 정적 서빙 통합 테스트와 기존 API 라우팅 테스트 통과.
- 변경 범위: `render.yaml`, `server.mjs`, 관련 정적 서빙/PROD 분리 테스트, 이 상태 기록. main은 수정하지 않음. 단일 dev 전용 커밋 후 `origin/dev`에만 push.
- 남은 작업: 없음.

## 2026-09-25 · 베타 blocker 검수

- 작업 브랜치: `dev` (`main` 미수정, 원격 push 없음)
- 수정한 blocker: 로컬 서버 루트와 이전 DEV 파일 별칭이 존재하지 않는 파일로 매핑되어 404 발생. 두 경로를 `index.html`에 연결하고, 이 브랜치 소스로 빌드한 번들을 함께 갱신함.
- 수정한 blocker: 응답의 `Permissions-Policy`가 geolocation을 차단해 로컬 지도에서 위치 권한을 쓸 수 없었음. 같은 출처만 허용하도록 수정함.
- 수정 파일: `server.mjs`, `test/static-security.test.mjs`, 빌드 산출물 `index.html`, 데이터 감사 기록 `data/data-audit-v61.json`.
- 회귀 테스트: 기본 문서/별칭과 위치 정책 확인을 `test/static-security.test.mjs`에 추가.
- 검증: 전체 테스트 265개 통과, DEV 빌드 성공, 데이터 감사 0 오류·0 이슈. 390px 핵심 흐름·위치 성공/거부/오류·Leaflet 코스·탭 스와이프·사진 분석 결과/실패 확인, JS page error 0건.
- 남은 베타 확인: 로컬 `TOUR_API_KEY`와 `.env`가 없어 API는 9월 3일 확인한 200개 스냅샷(만료)을 반환하며 행사 목록은 빈 상태. `PLANTNET_API_KEY`도 설정되지 않아 실제 사진 분석은 503 상태. 빈 데이터/오류 UI는 동작하지만 배포 환경 API 자격 증명과 최신 행사 공급을 확인해야 함.
- 다음 작업: 베타 실행 환경에서 행사 API와 PlantNet API 설정 및 실제 행사 상세 → 지도 흐름을 확인.

## 2026-09-25 · 하단 탭 순서 조정

- 작업 브랜치: `dev` (`main` 미수정, 원격 push 없음)
- 완료: 하단 탭과 스와이프 순서를 `행사 → 지도 → 홈 → 도감 → MY`로 변경. 기본 진입 화면은 홈 유지.
- 수정 파일: `src/js/main.js`, `src/js/ui.js`, `src/js/ui/screens/shell.js`, 관련 테스트
- 복구 체크포인트: `checkpoints/꽃을보다_backup/checkpoints/20260925-203355-519/dev-before-tab-order-20260925-203355-519.bundle`
- 검증: `npm test` 265개 통과, `npm run build` 성공. 390px에서 홈이 정확히 중앙에 배치되고 다섯 탭 이동·가로 넘침·페이지 오류 확인 완료.
- 남은 작업: 없음.

## 2026-09-25 · 베타 정보 구조 정리

- 작업 브랜치: `dev` (`main` 미수정, 원격 push 없음)
- 완료: 하단 5탭, MY 화면, 설정/행사 알림 정리, 단거리 꽃 코스 정비, 꽃 상세·사진 찾기·홈의 장소 연결 강화
- 수정 범위: `src/js`, `src/styles.css`, `src/modules.json`, 관련 테스트
- 복구 체크포인트: `checkpoints/꽃을보다_backup/checkpoints/20260925-195043-495/dev-before-beta-ia-20260925-195043-495.bundle`
- 검증: 테스트 265개 통과, DEV 빌드 통과, 390px 화면에서 주요 흐름·가로 오버플로·콘솔 오류 확인
- 남은 문제: `server.mjs`가 현재 저장소에 없는 `꽃을보다_V61_dev.html`을 기본 문서로 가리켜 로컬 서버 루트가 404를 반환함
- 다음 작업: 서버 기본 문서 경로 정리, 실제 배포 환경에서 사진 분석 API와 배포 데이터 API 재검수

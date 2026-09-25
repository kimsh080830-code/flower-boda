# 프로젝트 상태

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

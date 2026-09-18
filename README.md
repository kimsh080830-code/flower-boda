# flower-boda

> 서비스 표시명: **꽃을 보다** · 현재 기준본: **V61 DEV**

## 프로젝트 구조

- `src/` — 실제 원본 코드
- `data/` — 데이터와 데이터 감사 결과
- `assets/` — 정적 리소스
- `test/` — 자동 테스트
- `index.html` — DEV 빌드 결과물
- `index.prod.html` — PROD 빌드 결과물 (Git 추적 제외)

단일 HTML 파일은 원본이 아니라 `src/`, `data/`, `assets/`를 묶어 생성한 빌드 결과입니다. 직접 수정하지 않습니다.

## 빌드 및 테스트

아래 명령은 `package.json`의 `scripts`에 실제로 존재합니다.

```bash
npm run build
npm run build:dev
npm run build:prod
npm test
npm run data:audit
npm run check
npm start
```

두 빌드 모두 데이터 감사를 먼저 실행하고 같은 `src/modules.json`, `src/index.template.html`, `src/`, `data/`, `assets/` 원본을 사용합니다. 기존 `npm run build`도 `npm run build:dev`와 동일한 DEV 빌드를 실행합니다. DEV는 `index.html`에 DEV 플래그와 감사 payload를 포함합니다. PROD는 별도 `index.prod.html`에 DEV 플래그를 끄고 감사 payload를 포함하지 않습니다. DEV 전용 JS 모듈 자체를 PROD 결과물에서 제거하는 작업은 다음 단계입니다.

## DEV 통합 도구

설정 화면의 `DEV · 통합 테스트 도구`는 DEV 빌드에서만 렌더링됩니다. 가상 날짜, 네트워크 실패, 긴 텍스트, 글자 크기, 데이터·이미지·라이선스 검사를 위한 상태는 DEV 메모리에만 존재하며 기존 localStorage 저장 데이터와 설정을 변경하지 않습니다.


## GitHub 저장소 기준

- 저장소/패키지 이름은 `flower-boda`를 사용합니다.
- 사용자에게 보이는 서비스명 `꽃을 보다`는 변경하지 않습니다.
- `src/`, `data/`, `assets/`, `test/`가 원본이며 단일 HTML은 빌드 결과물입니다.
- 기존 localStorage 키와 백업 포맷은 사용자 데이터 호환성을 위해 유지합니다.
- V61은 GitHub 이관 시작점이며 이후 버전은 Git 커밋/태그로 관리하는 것을 권장합니다.

# flower-boda

> 서비스 표시명: **꽃을 보다** · 현재 기준본: **V61 DEV**

## 프로젝트 구조

- `src/` — 실제 원본 코드
- `data/` — 데이터와 데이터 감사 결과
- `assets/` — 정적 리소스
- `test/` — 자동 테스트
- `꽃을보다_V61_dev.html` — 이번 단계의 유일한 개발 테스트 빌드
- 일반/PROD HTML은 휴대폰 확인 및 승인 후 별도 단계에서 생성

단일 HTML 파일은 원본이 아니라 `src/`, `data/`, `assets/`를 묶어 생성한 빌드 결과입니다. 직접 수정하지 않습니다.

## 빌드 및 테스트

아래 명령은 `package.json`의 `scripts`에 실제로 존재합니다.

```bash
npm run build
npm test
npm run data:audit
npm run check
npm start
```

`npm run build`는 데이터 감사를 먼저 실행한 뒤 `src/modules.json`의 순서와 `src/index.template.html`을 사용하여 DEV 빌드만 생성합니다.

## DEV 통합 도구

설정 화면의 `DEV · 통합 테스트 도구`는 DEV 빌드에서만 렌더링됩니다. 가상 날짜, 네트워크 실패, 긴 텍스트, 글자 크기, 데이터·이미지·라이선스 검사를 위한 상태는 DEV 메모리에만 존재하며 기존 localStorage 저장 데이터와 설정을 변경하지 않습니다.


## GitHub 저장소 기준

- 저장소/패키지 이름은 `flower-boda`를 사용합니다.
- 사용자에게 보이는 서비스명 `꽃을 보다`는 변경하지 않습니다.
- `src/`, `data/`, `assets/`, `test/`가 원본이며 단일 HTML은 빌드 결과물입니다.
- 기존 localStorage 키와 백업 포맷은 사용자 데이터 호환성을 위해 유지합니다.
- V61은 GitHub 이관 시작점이며 이후 버전은 Git 커밋/태그로 관리하는 것을 권장합니다.

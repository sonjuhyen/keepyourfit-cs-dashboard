# 킵유어핏 CS 대시보드 🦦

킵유어핏 CS 운영 데이터를 로컬 JSON API로 읽고 수정하는 내부 대시보드입니다.
기존 localStorage 목업을 벗어나, Mac mini에서 바로 띄워서 운영용 데이터 상태를 확인할 수 있는 1차 버전입니다.

## 현재 상태

### 실제 연결된 것
- `Node.js` 로컬 서버 (`server.js`)
- JSON 파일 기반 REST API (`/api/answers`, `/api/logs`, `/api/rules`)
- 프론트엔드 `fetch` 기반 데이터 로드/수정
- `data/*.json` 초기 운영 데이터

### 아직 안 붙은 것
- 채널톡 실시간 문의 수집
- `/tmp/dobi-approvals` 직접 반영
- `LEARNINGS.md` 자동 파싱 반영
- Cafe24 주문 조회 연동
- 인증/권한 관리

즉, 이번 버전은 **localStorage 목업 탈피 + 로컬 운영 콘솔 기반 마련**까지 완료된 상태입니다.

## 파일 구조

```text
keepyourfit-cs-dashboard/
├── index.html
├── server.js            # 정적 파일 + JSON API 서버
├── package.json         # npm start
├── data/
│   ├── answers.json     # 승인 답변 데이터
│   ├── logs.json        # 승인 로그 데이터
│   └── rules.json       # 자동처리 규칙 데이터
├── css/
│   └── style.css
└── js/
    ├── app.js           # Alpine.js 앱 로직
    ├── data.js          # fetch 기반 API 데이터 매니저
    └── charts.js
```

## 실행 방법

```bash
cd /Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard
npm start
```

브라우저에서 아래 주소로 접속합니다.

```text
http://localhost:3000
```

## 기술 스택

- HTML5
- Tailwind CSS (CDN)
- Alpine.js (CDN)
- Chart.js (CDN)
- Node.js 기본 `http` 서버
- JSON 파일 저장소

## 동작 방식

1. `server.js`가 정적 파일과 `/api/*` 요청을 함께 처리합니다.
2. `js/data.js`가 localStorage 대신 API를 호출합니다.
3. `js/app.js`는 async/await 기반으로 데이터를 불러오고 저장합니다.
4. 데이터는 `data/*.json`에 저장됩니다.

## 주의사항

- 현재는 인증 없는 로컬 내부 도구입니다.
- 다중 사용자 동시 편집 충돌 방지는 아직 없습니다.
- 운영 실데이터와 자동 동기화되지는 않습니다.
- 외부 공개 배포용이 아니라 내부 운영 보조용입니다.

## 다음 단계 제안

1. `/tmp/dobi-approvals` 읽기 전용 API 추가
2. `LEARNINGS.md` 파싱 API 추가
3. 채널톡/승인 상태 진단 카드 추가
4. Cafe24 조회 결과 패널 추가
5. 읽기 전용 운영 진단판과 편집 기능 분리

## 변경 요약

- `js/data.js`: localStorage → fetch/API 구조 전환
- `js/app.js`: async/await 기반 로딩 및 저장 흐름 보완
- `server.js`: 신규 추가
- `package.json`: 신규 추가
- `data/*.json`: 신규 추가

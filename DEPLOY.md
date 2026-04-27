# 배포 가이드 — CS 대시보드 v2

> 데이터 흐름: 채널톡 → Worker → KV → cs-dashboard (vercel)
>            슬랙봇이 도비 승인 큐를 60초마다 KV로 push → vercel에서도 도비 큐 보임

대표님이 직접 해야 할 일 4가지. 순서대로 진행.

---

## 1. Cloudflare Worker 재배포

새 admin endpoints (`/api/answers`, `/api/auto-replies`, `/api/queue`, `/api/status`) 추가됨.

```bash
cd /Users/son/.openclaw/workspace/services/channeltalk-webhook

# (a) 관리자 토큰 발급해서 Worker secret으로 등록
openssl rand -hex 32
# → 출력값을 복사해두기 (이 토큰을 ADMIN_TOKEN, WORKER_TOKEN, WORKER_PUSH_TOKEN 모두에 같은 값으로 사용)

npx wrangler secret put ADMIN_TOKEN --env production
# → 위 토큰 붙여넣기

# (b) 배포
npx wrangler deploy --env production

# (c) 동작 확인 (출력에 적힌 Worker URL 사용)
WORKER_URL="https://channeltalk-cs-automation.<your>.workers.dev"
TOKEN="<위에서_생성한_토큰>"
curl -H "Authorization: Bearer $TOKEN" "$WORKER_URL/api/status"
# 기대: {"service":"channeltalk-cs-automation","kv":{"approvedAnswers":...}}
```

---

## 2. 슬랙봇 재시작 (Worker push 활성화)

```bash
cd /Users/son/.openclaw/workspace/services/slack-approval-bot

# .env에 다음 3줄 추가
echo "WORKER_PUSH_URL=$WORKER_URL/api/queue" >> .env
echo "WORKER_PUSH_TOKEN=$TOKEN" >> .env
echo "WORKER_PUSH_INTERVAL_SEC=60" >> .env

# 기존 프로세스 kill 후 재시작
pkill -f "slack-approval-bot/server.cjs" 2>/dev/null
nohup node server.cjs > logs/bot.log 2>&1 &

# 30초쯤 기다린 뒤 KV에 push 됐는지 확인
sleep 30
curl -H "Authorization: Bearer $TOKEN" "$WORKER_URL/api/queue" | jq .pushedAt
# 기대: 방금 시각의 ISO 문자열
```

---

## 3. Vercel 환경변수 + 재배포

```bash
cd /Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard

# (a) 환경변수 등록 (production)
vercel env add WORKER_URL production
# → 위 WORKER_URL 붙여넣기
vercel env add WORKER_TOKEN production
# → 위 TOKEN 붙여넣기

# preview·development에도 같은 값 등록 (선택)
vercel env add WORKER_URL preview
vercel env add WORKER_TOKEN preview

# (b) git 커밋 후 배포 (또는 vercel --prod 직접 트리거)
git add -A && git commit -m "v2: Worker 프록시 기반 + 헬스 LED + 답변 DB 편집 + 승인 큐 탭"
git push  # vercel 자동 배포

# (c) 확인
open https://keepyourfit-cs-dashboard.vercel.app
```

---

## 4. 첫 답변 KV 시드 (선택 — UI에서 추가해도 됨)

대시보드 → "💬 답변 DB" 탭 → "+ 새 답변" 으로 직접 추가해도 됨.
또는 다음 curl 한 줄로 첫 답변 시드:

```bash
curl -X POST "$WORKER_URL/api/answers" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "복용법",
    "keywords": ["복용", "먹는법", "섭취법"],
    "auto_reply": "하루 2회, 아침과 저녁 식후에 물과 함께 드세요.",
    "confidence_threshold": 0.5
  }'
```

---

## 로컬에서 돌려보고 싶을 때

```bash
cd /Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard
cp .env.example .env
# .env에 WORKER_URL, WORKER_TOKEN 채우기

npm install
npm start
# → http://localhost:3000
```

---

## 변경된 파일 요약

- `services/channeltalk-webhook/worker-v4-ai.js` — admin API 엔드포인트 추가
- `services/slack-approval-bot/server.cjs` — KV push 루프 + 로컬 status HTTP 추가
- `projects/keepyourfit-cs-dashboard/` — 전면 재작성 (서버·API·UI)
- `projects/kyf-hub/index.html` — CS 카테고리 단순화, 카톡봇 → AI팀 이동

## 롤백 방법

```bash
cd /Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard
git log --oneline -5
git revert HEAD  # 또는 특정 커밋
```

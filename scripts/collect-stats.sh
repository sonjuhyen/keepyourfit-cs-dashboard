#!/bin/bash
# CS 대시보드용 통계 수집 스크립트
# 사용법: bash collect-stats.sh
# 결과: data/stats.json 생성 → git push

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="${REPO_DIR}/data"
mkdir -p "$DATA_DIR"

ACCESS_KEY="69d75ed1af072024a344"
ACCESS_SECRET="c0fd43566fa15c00f1a34475259150e5"
BASE_URL="https://api.channel.io/open/v5"

APPROVAL_DIR="/tmp/dobi-approvals"
LEARNINGS_FILE="/Users/son/.openclaw/workspace/agents-dobi/LEARNINGS.md"

TODAY=$(date +%Y-%m-%d)
NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "=== CS 통계 수집 시작: ${NOW} ==="

# 1. 채널톡 최근 상담 목록 조회
echo "[1/4] 채널톡 상담 목록 조회..."
CHATS_RAW=$(curl -s "${BASE_URL}/user-chats?state=opened&sortOrder=desc&limit=100" \
  -H "x-access-key: ${ACCESS_KEY}" \
  -H "x-access-secret: ${ACCESS_SECRET}")

CLOSED_RAW=$(curl -s "${BASE_URL}/user-chats?state=closed&sortOrder=desc&limit=100" \
  -H "x-access-key: ${ACCESS_KEY}" \
  -H "x-access-secret: ${ACCESS_SECRET}")

# 2. 승인 로그 수집
echo "[2/4] 승인 로그 수집..."
APPROVAL_LOG="[]"
if [ -d "$APPROVAL_DIR" ]; then
  APPROVAL_LOG=$(python3 - <<'PY' "$APPROVAL_DIR" "$TODAY"
import os, sys, json, time, glob
approval_dir = sys.argv[1]
today = sys.argv[2]

seen = {}

for f in sorted(os.listdir(approval_dir)):
    filepath = os.path.join(approval_dir, f)
    mtime = os.path.getmtime(filepath)
    mtime_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(mtime))

    if '.sent-meta.' in f:
        draft_key = f.split('.sent-meta.')[0]
        try:
            with open(filepath) as mf:
                meta = json.load(mf)
            msg_pattern = os.path.join(approval_dir, draft_key + '.sent-message.*')
            msg_files = glob.glob(msg_pattern)
            message = ""
            if msg_files:
                with open(msg_files[0], 'r', encoding='utf-8') as mf:
                    message = mf.read().strip()
            preview = message[:60] + ('...' if len(message) > 60 else '') if message else ''
            seen[draft_key] = {
                "draftKey": draft_key,
                "chatId": meta.get("chatId", draft_key.split("__")[0]),
                "approver": meta.get("approver", ""),
                "isModified": meta.get("isModified", False),
                "status": "sent",
                "timestamp": meta.get("approvedAt", mtime_str),
                "messagePreview": preview
            }
        except: pass

    elif f.endswith('.approved'):
        draft_key = f.replace('.approved', '')
        if draft_key not in seen:
            seen[draft_key] = {
                "draftKey": draft_key,
                "chatId": draft_key.split("__")[0],
                "status": "approved",
                "timestamp": mtime_str,
                "messagePreview": ""
            }

    elif f.endswith('.meta.json'):
        draft_key = f.replace('.meta.json', '')
        if draft_key not in seen:
            try:
                with open(filepath) as mf:
                    meta = json.load(mf)
                seen[draft_key] = {
                    "draftKey": draft_key,
                    "chatId": meta.get("chatId", ""),
                    "status": "pending",
                    "timestamp": mtime_str,
                    "messagePreview": ""
                }
            except: pass

logs = sorted(seen.values(), key=lambda x: x.get("timestamp",""), reverse=True)
print(json.dumps(logs[:50], ensure_ascii=False))
PY
)
fi

# 3. LEARNINGS.md 파싱
echo "[3/4] LEARNINGS.md 파싱..."
LEARNINGS_DATA="[]"
SPAM_KEYWORDS="[]"
if [ -f "$LEARNINGS_FILE" ]; then
  LEARNINGS_DATA=$(python3 - <<'PY' "$LEARNINGS_FILE"
import sys, json, re

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

registered = content.split('## 📋 등록된 패턴')
if len(registered) < 2:
    print('[]')
    sys.exit(0)

registered_section = registered[1].split('## 📝')[0].split('## 🚫')[0]

patterns = []
sections = re.split(r'### 패턴:', registered_section)
for s in sections[1:]:
    lines = s.strip().split('\n')
    title = lines[0].strip()

    if '<' in title and '>' in title:
        continue

    trigger = ""
    approval_date = ""
    approver = ""
    hit_count = 0
    answer_lines = []
    in_answer = False

    for line in lines[1:]:
        line_s = line.strip()
        if line_s.startswith('- 트리거:'):
            trigger = line_s.replace('- 트리거:', '').strip()
        elif line_s.startswith('- 최초 승인일:'):
            approval_date = line_s.replace('- 최초 승인일:', '').strip()
        elif line_s.startswith('- 승인자:'):
            approver = line_s.replace('- 승인자:', '').strip()
        elif line_s.startswith('- 히트 카운트:'):
            try: hit_count = int(line_s.replace('- 히트 카운트:', '').strip())
            except: pass
        elif line_s.startswith('- 답변:'):
            in_answer = True
            continue
        elif in_answer:
            if line_s.startswith('---') or line_s.startswith('###') or line_s.startswith('_(') or line_s.startswith('## '):
                break
            answer_lines.append(line.rstrip())

    answer = '\n'.join(answer_lines).strip()
    if title and answer:
        patterns.append({
            "title": title,
            "trigger": trigger,
            "approvalDate": approval_date,
            "approver": approver,
            "hitCount": hit_count,
            "answer": answer
        })

print(json.dumps(patterns, ensure_ascii=False))
PY
)

  SPAM_KEYWORDS=$(python3 - <<'PY' "$LEARNINGS_FILE"
import sys, json, re

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    content = f.read()

spam_section = content.split('### 공통 키워드')
keywords = []
if len(spam_section) > 1:
    lines = spam_section[1].split('### 운영 규칙')[0].strip().split('\n')
    for line in lines:
        line = line.strip()
        if line.startswith('- ') and line[2:].strip():
            kw = line[2:].strip()
            parts = [k.strip() for k in kw.split('/') if k.strip()]
            keywords.extend(parts)

print(json.dumps(keywords, ensure_ascii=False))
PY
)
fi

# 4. 통계 JSON 생성
echo "[4/4] stats.json 생성..."
python3 - <<PY "$DATA_DIR/stats.json" "$TODAY" "$NOW" "$APPROVAL_LOG" "$LEARNINGS_DATA" "$SPAM_KEYWORDS"
import sys, json

output_file = sys.argv[1]
today = sys.argv[2]
now = sys.argv[3]
approval_log = json.loads(sys.argv[4])
learnings = json.loads(sys.argv[5])
spam_keywords = json.loads(sys.argv[6])

# 승인 통계
total_approvals = len([l for l in approval_log if l["status"] in ("approved", "sent")])
total_pending = len([l for l in approval_log if l["status"] == "pending"])
total_sent = len([l for l in approval_log if l["status"] == "sent"])

stats = {
    "meta": {
        "generatedAt": now,
        "date": today,
        "source": "collect-stats.sh"
    },
    "approvals": {
        "total": len(approval_log),
        "approved": total_approvals,
        "pending": total_pending,
        "sent": total_sent,
        "logs": approval_log
    },
    "learnings": {
        "patterns": learnings,
        "patternCount": len(learnings),
        "totalHits": sum(p.get("hitCount", 0) for p in learnings)
    },
    "spam": {
        "keywords": spam_keywords,
        "keywordCount": len(spam_keywords)
    }
}

with open(output_file, 'w', encoding='utf-8') as f:
    json.dump(stats, f, ensure_ascii=False, indent=2)

print(f"stats.json 생성 완료: {len(approval_log)} approvals, {len(learnings)} patterns, {len(spam_keywords)} spam keywords")
PY

echo "=== 수집 완료 ==="

# Git push (옵션)
if [ "${1:-}" = "--push" ]; then
  cd "$REPO_DIR"
  git add data/stats.json
  git commit -m "chore: update CS stats $(date +%Y-%m-%d_%H:%M)" 2>/dev/null || echo "변경사항 없음"
  git push origin main 2>/dev/null && echo "✅ push 완료" || echo "❌ push 실패"
fi

#!/bin/bash
set -euo pipefail
pkill -f "/Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard/server.js" || true
sleep 1
cd /Users/son/.openclaw/workspace/projects/keepyourfit-cs-dashboard
node server.js >/tmp/kyf-cs-dashboard.log 2>&1 &
sleep 1
curl -i http://localhost:3000/api/status | sed -n '1,80p'

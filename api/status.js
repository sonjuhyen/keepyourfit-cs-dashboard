const { json, workerFetch, WORKER_URL } = require('./_lib');

module.exports = async (req, res) => {
  const checks = {
    worker: { name: 'Cloudflare Worker', state: 'unknown', detail: null },
    kv: { name: 'KV (APPROVED_ANSWERS)', state: 'unknown', detail: null },
    dobiQueue: { name: '도비 승인 큐', state: 'unknown', detail: null },
    autoReplies: { name: '자동응답 로그', state: 'unknown', detail: null }
  };

  if (!WORKER_URL) {
    checks.worker.state = 'down';
    checks.worker.detail = 'WORKER_URL 환경변수 없음';
    return json(res, { ok: false, checks, timestamp: new Date().toISOString() });
  }

  const workerStatus = await workerFetch('/api/status');
  if (workerStatus.ok) {
    checks.worker.state = 'up';
    checks.worker.detail = workerStatus.data.version || 'ok';
    checks.kv.state = workerStatus.data.kv?.approvedAnswers ? 'up' : 'down';
    checks.kv.detail = workerStatus.data.kv?.approvedAnswers ? '읽기 OK' : 'KV 응답 없음';
  } else {
    checks.worker.state = 'down';
    checks.worker.detail = workerStatus.data.error || `HTTP ${workerStatus.status}`;
    checks.kv.state = 'down';
    checks.kv.detail = 'Worker 미응답';
  }

  const queue = await workerFetch('/api/queue');
  if (queue.ok) {
    const pushedAt = queue.data.pushedAt;
    if (!pushedAt) {
      checks.dobiQueue.state = 'down';
      checks.dobiQueue.detail = '슬랙봇 push 기록 없음';
    } else {
      const ageMin = (Date.now() - new Date(pushedAt).getTime()) / 60000;
      checks.dobiQueue.state = ageMin < 5 ? 'up' : ageMin < 30 ? 'warn' : 'down';
      checks.dobiQueue.detail = `${Math.round(ageMin)}분 전 동기화 (대기 ${queue.data.summary?.pending || 0})`;
    }
  } else {
    checks.dobiQueue.state = 'down';
    checks.dobiQueue.detail = queue.data.error || `HTTP ${queue.status}`;
  }

  const autoReplies = await workerFetch('/api/auto-replies?days=1');
  if (autoReplies.ok) {
    checks.autoReplies.state = 'up';
    checks.autoReplies.detail = `최근 24시간 ${autoReplies.data.logs?.length || 0}건`;
  } else {
    checks.autoReplies.state = 'down';
    checks.autoReplies.detail = `HTTP ${autoReplies.status}`;
  }

  const allUp = Object.values(checks).every(c => c.state === 'up');
  return json(res, { ok: allUp, checks, timestamp: new Date().toISOString() });
};

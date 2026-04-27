// 통합 로그: 자동응답 + 도비 승인 큐를 시간순으로 합쳐 반환
const { json, workerFetch, todayKst, isoToKstDate } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { error: 'method not allowed' }, 405);
  const url = new URL(req.url, 'https://dummy.local');
  const range = url.searchParams.get('range') || '7';
  const days = range === 'today' ? 1 : Math.min(parseInt(range, 10) || 7, 30);

  const [autoRes, queueRes] = await Promise.all([
    workerFetch(`/api/auto-replies?days=${days}`),
    workerFetch('/api/queue')
  ]);

  const entries = [];

  if (autoRes.ok && Array.isArray(autoRes.data.logs)) {
    for (const log of autoRes.data.logs) {
      entries.push({
        id: `auto:${log.timestamp}:${log.chatId}`,
        timestamp: log.timestamp,
        kstDate: isoToKstDate(log.timestamp),
        kind: 'auto',
        chatId: log.chatId,
        customerName: log.customerName,
        question: log.question,
        category: log.category,
        status: 'auto-sent',
        approver: null,
        message: null
      });
    }
  }

  if (queueRes.ok && Array.isArray(queueRes.data.drafts)) {
    for (const draft of queueRes.data.drafts) {
      const ts = draft.sentAt || draft.approvedAt;
      if (!ts) continue;
      entries.push({
        id: `manual:${draft.key}`,
        timestamp: ts,
        kstDate: isoToKstDate(ts),
        kind: 'manual',
        chatId: draft.chatId,
        customerName: null,
        question: null,
        category: null,
        status: draft.status,
        approver: draft.approver,
        approvedAt: draft.approvedAt,
        sentAt: draft.sentAt,
        message: draft.messagePreview
      });
    }
  }

  entries.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)));

  if (range === 'today') {
    const today = todayKst();
    const filtered = entries.filter(e => e.kstDate === today);
    return json(res, { entries: filtered, totals: autoRes.ok ? autoRes.data.totals : {}, range });
  }

  return json(res, { entries, totals: autoRes.ok ? autoRes.data.totals : {}, range, days });
};

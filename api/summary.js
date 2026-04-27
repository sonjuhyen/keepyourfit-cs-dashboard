// KPI 요약 — 오늘 자동/수동 처리 건수, 자동화율, SLA
const { json, workerFetch, todayKst, isoToKstDate } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { error: 'method not allowed' }, 405);
  const today = todayKst();

  const [autoRes, queueRes] = await Promise.all([
    workerFetch('/api/auto-replies?days=7'),
    workerFetch('/api/queue')
  ]);

  const autoLogs = (autoRes.ok && Array.isArray(autoRes.data.logs)) ? autoRes.data.logs : [];
  const drafts = (queueRes.ok && Array.isArray(queueRes.data.drafts)) ? queueRes.data.drafts : [];

  const autoToday = autoLogs.filter(l => isoToKstDate(l.timestamp) === today);
  const manualSentToday = drafts.filter(d => d.status === 'sent' && isoToKstDate(d.sentAt) === today);
  const manualPending = drafts.filter(d => d.status === 'pending');

  const totalToday = autoToday.length + manualSentToday.length;
  const automationRate = totalToday > 0 ? Math.round((autoToday.length / totalToday) * 100) : 0;

  const week = {};
  const totals = autoRes.ok ? (autoRes.data.totals || {}) : {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const kst = new Date(d.getTime() + (9 * 60 + d.getTimezoneOffset()) * 60000);
    const key = kst.toISOString().split('T')[0];
    const auto = totals[key] || 0;
    const manualSent = drafts.filter(x => x.status === 'sent' && isoToKstDate(x.sentAt) === key).length;
    week[key] = { auto, manualSent, total: auto + manualSent };
  }

  return json(res, {
    today: {
      date: today,
      total: totalToday,
      auto: autoToday.length,
      manualSent: manualSentToday.length,
      pending: manualPending.length,
      automationRate
    },
    week,
    sla: queueRes.ok ? (queueRes.data.sla || { sampleCount: 0, avgSeconds: null }) : { sampleCount: 0, avgSeconds: null },
    pushedAt: queueRes.ok ? queueRes.data.pushedAt : null
  });
};

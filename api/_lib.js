// Worker 프록시 + KST 헬퍼 + 응답 포맷
const WORKER_URL = process.env.WORKER_URL || '';
const WORKER_TOKEN = process.env.WORKER_TOKEN || '';

function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  return await new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { resolve({}); }
    });
    req.on('error', () => resolve({}));
  });
}

async function workerFetch(pathAndQuery, init = {}) {
  if (!WORKER_URL) {
    return { ok: false, status: 0, data: { error: 'WORKER_URL not configured' } };
  }
  const url = WORKER_URL.replace(/\/$/, '') + pathAndQuery;
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(WORKER_TOKEN ? { 'Authorization': `Bearer ${WORKER_TOKEN}` } : {}),
        ...(init.headers || {})
      }
    });
    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; }
    catch { data = { raw: text }; }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { error: err.message } };
  }
}

function todayKst() {
  const now = new Date();
  const kst = new Date(now.getTime() + (9 * 60 + now.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
}

function isoToKstDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const kst = new Date(d.getTime() + (9 * 60 + d.getTimezoneOffset()) * 60000);
  return kst.toISOString().split('T')[0];
}

module.exports = { json, readBody, workerFetch, todayKst, isoToKstDate, WORKER_URL };

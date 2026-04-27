const { json, workerFetch } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { error: 'method not allowed' }, 405);
  const url = new URL(req.url, 'https://dummy.local');
  const days = url.searchParams.get('days') || '7';
  const result = await workerFetch(`/api/auto-replies?days=${encodeURIComponent(days)}`);
  if (!result.ok) return json(res, { error: 'worker fetch failed', detail: result.data }, result.status || 502);
  return json(res, result.data);
};

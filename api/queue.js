const { json, workerFetch } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method !== 'GET') return json(res, { error: 'method not allowed' }, 405);
  const result = await workerFetch('/api/queue');
  if (!result.ok) return json(res, { error: 'worker fetch failed', detail: result.data }, result.status || 502);
  return json(res, result.data);
};

const { json, readBody, workerFetch } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const result = await workerFetch('/api/answers');
    if (!result.ok) return json(res, { error: 'worker fetch failed', detail: result.data }, result.status || 502);
    return json(res, result.data.answers || {});
  }

  if (req.method === 'POST') {
    const body = await readBody(req);
    const result = await workerFetch('/api/answers', {
      method: 'POST',
      body: JSON.stringify(body)
    });
    return json(res, result.data, result.status || 502);
  }

  return json(res, { error: 'method not allowed' }, 405);
};

const { json, readBody, workerFetch } = require('../_lib');

module.exports = async (req, res) => {
  const url = new URL(req.url, 'https://dummy.local');
  const parts = url.pathname.split('/').filter(Boolean);
  const category = parts[parts.length - 1];
  if (!category) return json(res, { error: 'category required' }, 400);
  const encoded = encodeURIComponent(category);

  if (req.method === 'PUT') {
    const body = await readBody(req);
    const result = await workerFetch(`/api/answers/${encoded}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
    return json(res, result.data, result.status || 502);
  }

  if (req.method === 'DELETE') {
    const result = await workerFetch(`/api/answers/${encoded}`, { method: 'DELETE' });
    return json(res, result.data, result.status || 502);
  }

  return json(res, { error: 'method not allowed' }, 405);
};

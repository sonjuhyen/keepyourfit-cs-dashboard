const { readJSON, writeJSON, json, parseId, readBody } = require('../_lib');

module.exports = async (req, res) => {
  const id = parseId(req);
  if (!id) return json(res, { error: 'not found' }, 404);

  let items = readJSON('logs');
  if (req.method === 'PUT') {
    const body = await readBody(req);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return json(res, { error: 'not found' }, 404);
    items[idx] = { ...items[idx], ...body, id };
    writeJSON('logs', items);
    return json(res, items[idx]);
  }
  if (req.method === 'DELETE') {
    const before = items.length;
    items = items.filter(i => i.id !== id);
    if (items.length === before) return json(res, { error: 'not found' }, 404);
    writeJSON('logs', items);
    return json(res, { ok: true });
  }
  return json(res, { error: 'method not allowed' }, 405);
};

const { readJSON, writeJSON, json, readBody } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'GET') return json(res, readJSON('rules'));
  if (req.method === 'POST') {
    const items = readJSON('rules');
    const body = await readBody(req);
    body.id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push(body);
    writeJSON('rules', items);
    return json(res, body, 201);
  }
  return json(res, { error: 'method not allowed' }, 405);
};

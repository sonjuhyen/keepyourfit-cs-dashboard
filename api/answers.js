const { readJSON, writeJSON, json, readBody } = require('./_lib');

module.exports = async (req, res) => {
  if (req.method === 'GET') return json(res, readJSON('answers'));
  if (req.method === 'POST') {
    const items = readJSON('answers');
    const body = await readBody(req);
    body.id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push(body);
    writeJSON('answers', items);
    return json(res, body, 201);
  }
  return json(res, { error: 'method not allowed' }, 405);
};

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// JSON 파일 읽기/쓰기
function readJSON(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(name, data) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data, null, 2), 'utf-8');
}

// 요청 body 파싱
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// 응답 헬퍼
function json(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// API 라우팅
async function handleAPI(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const parts = url.pathname.split('/').filter(Boolean); // ['api', 'answers', '3']
  const resource = parts[1]; // answers | logs | rules
  const id = parts[2] ? Number(parts[2]) : null;
  const method = req.method;

  if (!['answers', 'logs', 'rules'].includes(resource)) {
    return json(res, { error: 'not found' }, 404);
  }

  let items = readJSON(resource);

  // GET
  if (method === 'GET') {
    return json(res, id ? items.find(i => i.id === id) || null : items);
  }

  // POST — 새 항목 추가
  if (method === 'POST') {
    const body = await parseBody(req);
    body.id = items.length ? Math.max(...items.map(i => i.id)) + 1 : 1;
    items.push(body);
    writeJSON(resource, items);
    return json(res, body, 201);
  }

  // PUT — 수정
  if (method === 'PUT' && id) {
    const body = await parseBody(req);
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return json(res, { error: 'not found' }, 404);
    items[idx] = { ...items[idx], ...body, id };
    writeJSON(resource, items);
    return json(res, items[idx]);
  }

  // DELETE
  if (method === 'DELETE' && id) {
    const before = items.length;
    items = items.filter(i => i.id !== id);
    if (items.length === before) return json(res, { error: 'not found' }, 404);
    writeJSON(resource, items);
    return json(res, { ok: true });
  }

  json(res, { error: 'method not allowed' }, 405);
}

// 정적 파일 서빙
function serveStatic(req, res) {
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    return res.end('Not Found');
  }

  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

// 서버
const server = http.createServer(async (req, res) => {
  if (req.url.startsWith('/api/')) {
    return handleAPI(req, res);
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🦦 CS 대시보드 API → http://localhost:${PORT}`);
});

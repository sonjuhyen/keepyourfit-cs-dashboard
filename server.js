// 로컬 개발용 서버 — vercel 함수와 동일한 api 핸들러를 그대로 호출한다.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

require('dotenv').config({ path: path.join(__dirname, '.env') });

const PORT = parseInt(process.env.PORT || '3000', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
};

// vercel 함수 라우팅 매핑
const API_ROUTES = [
  { match: /^\/api\/status$/,                handler: require('./api/status') },
  { match: /^\/api\/summary$/,               handler: require('./api/summary') },
  { match: /^\/api\/answers$/,               handler: require('./api/answers') },
  { match: /^\/api\/answers\/[^/]+$/,        handler: require('./api/answers/[id]') },
  { match: /^\/api\/logs$/,                  handler: require('./api/logs') },
  { match: /^\/api\/auto-replies$/,          handler: require('./api/auto-replies') },
  { match: /^\/api\/queue$/,                 handler: require('./api/queue') },
];

function serveStatic(req, res) {
  const reqPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, reqPath === '/' ? 'index.html' : reqPath);
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    res.writeHead(404);
    return res.end('Not Found');
  }
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  const pathname = req.url.split('?')[0];
  if (pathname.startsWith('/api/')) {
    const route = API_ROUTES.find(r => r.match.test(pathname));
    if (!route) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'not found' }));
    }
    try {
      return await route.handler(req, res);
    } catch (err) {
      console.error('[api error]', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'internal', detail: err.message }));
    }
  }
  serveStatic(req, res);
});

server.listen(PORT, () => {
  console.log(`🦦 CS 대시보드 → http://localhost:${PORT}`);
  console.log(`   WORKER_URL=${process.env.WORKER_URL || '(미설정)'}`);
});

const fs = require('node:fs');
const path = require('node:path');

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, 'data');

function dataFile(name) {
  return path.join(DATA_DIR, `${name}.json`);
}

function readJSON(name) {
  const file = dataFile(name);
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(name, data) {
  fs.writeFileSync(dataFile(name), JSON.stringify(data, null, 2), 'utf-8');
}

function json(res, data, status = 200) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.end(JSON.stringify(data));
}

function parseId(req) {
  const url = new URL(req.url, 'https://dummy.local');
  const parts = url.pathname.split('/').filter(Boolean);
  const value = parts[parts.length - 1];
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
}

async function readBody(req) {
  return await new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

module.exports = { readJSON, writeJSON, json, parseId, readBody };

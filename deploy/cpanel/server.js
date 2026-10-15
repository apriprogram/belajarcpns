// Peluncur BELAJAR CPNS untuk cPanel "Setup Node.js App" (Phusion Passenger). docs/DEPLOY-CPANEL.md
// 1) Pastikan API Go (_app/bin/bisapns-api) hidup di 127.0.0.1:API_PORT — dijalankan sebagai proses latar.
// 2) Jalankan server Next.js standalone (_app/web/server.js); /api & /uploads diteruskan ke API (rewrites).
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

const ROOT = path.join(__dirname, '_app');
const LOGS = path.join(ROOT, 'logs');

/** Baca _app/.env (KEY=VALUE, nilai boleh diapit '...' atau "..."). */
function loadEnv(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
    out[m[1]] = v;
  }
  return out;
}

const env = loadEnv(path.join(ROOT, '.env'));
const API_PORT = env.API_PORT || '47391';
fs.mkdirSync(LOGS, { recursive: true });
fs.mkdirSync(path.join(ROOT, 'data', 'uploads'), { recursive: true });

function apiHealthy(cb) {
  const req = http.get({ host: '127.0.0.1', port: API_PORT, path: '/health', timeout: 2000 }, (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => cb(res.statusCode === 200 && body.includes('"ok"')));
  });
  req.on('error', () => cb(false));
  req.on('timeout', () => {
    req.destroy();
  });
}

let starting = false;
function ensureApi() {
  if (starting) return;
  apiHealthy((ok) => {
    if (ok || starting) return;
    starting = true;
    const log = fs.openSync(path.join(LOGS, 'api.log'), 'a');
    const child = spawn(path.join(ROOT, 'bin', 'bisapns-api'), [], {
      cwd: ROOT,
      env: { ...process.env, ...env, HOST: '127.0.0.1', PORT: API_PORT, TZ: 'Asia/Jakarta' },
      detached: true,
      stdio: ['ignore', log, log],
    });
    child.on('error', (e) => fs.appendFileSync(path.join(LOGS, 'api.log'), `[launcher] gagal start API: ${e.message}\n`));
    child.unref();
    setTimeout(() => (starting = false), 15000);
  });
}

ensureApi();
setInterval(ensureApi, 60 * 1000).unref();

// Variabel untuk Next.js (rewrites sudah dibaku saat build; ini untuk fetch sisi server).
process.env.API_URL = `http://127.0.0.1:${API_PORT}`;
process.env.SITE_URL = env.SITE_URL || process.env.SITE_URL || 'https://belajarcpns.web.id';
process.env.NODE_ENV = 'production';
process.env.TZ = 'Asia/Jakarta';
process.env.NEXT_TELEMETRY_DISABLED = '1';

process.chdir(path.join(ROOT, 'web'));
require(path.join(ROOT, 'web', 'server.js'));

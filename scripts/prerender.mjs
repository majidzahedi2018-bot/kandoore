import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { launch } from 'puppeteer-core';

const rootDir = path.resolve(import.meta.dirname, '..');
const distDir = path.join(rootDir, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  let filePath = path.join(distDir, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(distDir)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const executablePath = chromeCandidates.find((c) => c && fs.existsSync(c));

async function prerender() {
  if (!executablePath) {
    console.warn('[prerender] مرورگری برای پیش‌رندر پیدا نشد. رد شد.');
    return;
  }
  const port = await new Promise((resolve) => {
    const srv = server.listen(0, '127.0.0.1', () => resolve(srv.address().port));
  });
  const url = `http://127.0.0.1:${port}/`;

  const browser = await launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });

    let html = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForSelector('#root .min-h-screen', { timeout: 20000 });
        await new Promise((r) => setTimeout(r, 2500));
        html = await page.evaluate(() => '<!doctype html>\n' + document.documentElement.outerHTML);
        if (html.length > 4000 && html.includes('کندوره') && !html.includes('<div id="root"></div>')) break;
      } catch (e) {
        console.warn(`[prerender] تلاش ${attempt} ناموفق:`, e.message);
        if (attempt === 3) throw e;
      }
    }

    const outPath = path.join(distDir, 'index.html');
    fs.writeFileSync(outPath, html, 'utf8');
    console.log(`[prerender] پیش‌رندر شد: ${outPath} (${html.length.toLocaleString()} بایت)`);
  } finally {
    await browser.close();
    server.close();
  }
}

prerender().catch((e) => {
  console.error('[prerender] خطا:', e.message);
  process.exitCode = 1;
});
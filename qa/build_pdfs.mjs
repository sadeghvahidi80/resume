/**
 * Build the shipped PDFs from the hidden print blocks in the resume pages.
 *
 * The resume pages carry three print editions for each language:
 *   #print-resume     — 13-page illustrated resume
 *   #print-portfolio  — 8-page portfolio
 *   #print-cv         — 2-page recruiter CV
 *
 * Usage:
 *   node qa/build_pdfs.mjs            # rebuild the two CVs (default)
 *   node qa/build_pdfs.mjs --only=cv  # explicit
 *
 * Only the CVs are rebuilt by default. The 13-page resume and the 8-page
 * portfolio are shipped as they were verified: Chromium's page.pdf() embeds
 * full-resolution images, so re-rendering them here produces files roughly
 * twice the size (1.9 MB vs 978 KB for resume-fa). Those two editions were
 * compressed separately; rebuild them with --only=resume / --only=portfolio
 * only if you are prepared to re-check size and pagination by hand.
 *
 * Chromium comes from the local Playwright cache; override with CHROME_PATH.
 * A throwaway static server is used because file:// URLs drop the stylesheet
 * in headless Chromium (the print edition then renders as plain white pages).
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Users/pro/AppData/Local/ms-playwright/chromium-1255/chrome-win64/chrome.exe',
].filter(Boolean);
const executablePath = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!executablePath) {
  console.error('No Chromium found. Set CHROME_PATH to a chrome.exe.');
  process.exit(1);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }
  let file = path.join(root, rel);
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
      return;
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(buf);
  });
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

const args = process.argv.slice(2);
const onlyArg = args.find((a) => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1] : args.includes('--all') ? 'all' : 'cv';const JOBS = [
  { id: 'cv', locale: 'fa', mode: 'print-doc-cv', out: 'assets/pdf/cv-fa.pdf' },
  { id: 'cv', locale: 'en', mode: 'print-doc-cv', out: 'assets/pdf/cv-en.pdf' },
  { id: 'resume', locale: 'fa', mode: '', out: 'assets/pdf/resume-fa.pdf' },
  { id: 'resume', locale: 'en', mode: '', out: 'assets/pdf/resume-en.pdf' },
  { id: 'portfolio', locale: 'fa', mode: 'print-doc-portfolio', out: 'assets/pdf/portfolio-fa.pdf' },
  { id: 'portfolio', locale: 'en', mode: 'print-doc-portfolio', out: 'assets/pdf/portfolio-en.pdf' },
].filter((job) => only === 'all' || job.id === only);

if (!JOBS.length) {
  console.error(`Unknown --only=${only}. Use cv, resume, portfolio or all.`);
  process.exit(1);
}

if (JOBS.some((job) => job.id !== 'cv')) {
  console.warn(
    'WARNING: resume/portfolio come out ~2x larger than the shipped files ' +
      '(full-resolution images). Check size and pagination before committing.',
  );
}

const browser = await chromium.launch({ executablePath, args: ['--font-render-hinting=none'] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

try {
  for (const job of JOBS) {
    const page = await context.newPage();
    const url = `${origin}/resume/${job.locale}/index.html`;
    // Offline build: only the throwaway server may answer. The analytics beacon
    // and the e-namad seal are external and would otherwise stall `load`.
    await page.route('**/*', (route) => {
      const target = route.request().url();
      if (target.startsWith(origin) || target.startsWith('data:')) return route.continue();
      return route.abort();
    });
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    if (job.mode) await page.evaluate((mode) => document.body.classList.add(mode), job.mode);
    await page.emulateMedia({ media: 'print' });
    // Print-only @font-face rules are not active until the media switch, so the
    // static faces load now; without this wait Chromium snapshots the PDF with
    // the variable font and falls back to Type3 glyph procedures.
    await page.evaluate(() => document.fonts.ready.then(() => true));

    const pages = await page.evaluate(
      (mode) => {
        const block = document.getElementById(mode === 'print-doc-portfolio' ? 'print-portfolio' : mode === 'print-doc-cv' ? 'print-cv' : 'print-resume');
        return block ? block.querySelectorAll('.print-page.is-print-active').length : 0;
      },
      job.mode,
    );

    const out = path.join(root, job.out);
    await page.pdf({ path: out, printBackground: true, preferCSSPageSize: true });
    const kb = (fs.statSync(out).size / 1024).toFixed(0);
    console.log(`${job.out}  ${pages} active page(s)  ${kb} KB`);
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}

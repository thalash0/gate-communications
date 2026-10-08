// usage: node test.mjs [chapterId ...] [--mobile] [--shots]
import puppeteer from 'puppeteer-core'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const args = process.argv.slice(2); const mobile = args.includes('--mobile'); const shots = args.includes('--shots'); const ids = args.filter(a => !a.startsWith('--'));
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || (fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : '/snap/bin/chromium'), headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const page = await browser.newPage();
await page.setViewport(mobile ? { width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1200, height: 900 });
const errors = []; page.on('console', m => { if (['error', 'warning'].includes(m.type())) errors.push(m.type() + ': ' + m.text()); }); page.on('pageerror', e => errors.push('PAGEERR: ' + e.message));
const file = 'file://' + path.join(root, 'dist/gate-comm-book.html');
await page.goto(file); await new Promise(r => setTimeout(r, 400));
const list = await page.evaluate(() => GB_CHAPTERS.map(c => c.id));
const outdir = path.join(root, 'tools/shots'); fs.mkdirSync(outdir, { recursive: true });
for (const id of (ids.length ? ids : list)) {
  errors.length = 0;
  await page.evaluate(i => { location.hash = '#' + i; }, id); await new Promise(r => setTimeout(r, 600));
  const H = await page.evaluate(() => document.documentElement.scrollHeight); const vh = mobile ? 800 : 900;
  for (let y = 0; y < H; y += vh * 0.8) { await page.evaluate(yy => window.scrollTo(0, yy), y); await new Promise(r => setTimeout(r, 120)); }
  await new Promise(r => setTimeout(r, 500));
  const info = await page.evaluate(() => ({ widgets: document.querySelectorAll('.widget').length, errs: [...document.querySelectorAll('.w-err')].map(e => e.textContent), overflowX: document.documentElement.scrollWidth > window.innerWidth + 2, mathErr: document.body.innerText.includes('[math error]'), probs: document.querySelectorAll('.prob').length }));
  console.log(`${id}: height=${H} widgets=${info.widgets} probs=${info.probs} overflowX=${info.overflowX} mathErr=${info.mathErr} widgetErr=${JSON.stringify(info.errs)} consoleErrs=${errors.length}`);
  errors.slice(0, 8).forEach(e => console.log('   ', e.slice(0, 220)));
  if (shots) {
    await page.evaluate(() => window.scrollTo(0, 0)); const n = Math.ceil(H / vh);
    for (let k = 0; k < n; k++) { await page.evaluate(yy => window.scrollTo(0, yy), k * vh); await new Promise(r => setTimeout(r, 250)); await page.screenshot({ path: path.join(outdir, `${id}${mobile ? 'm' : ''}-${String(k).padStart(2, '0')}.png`) }); }
  }
}
await browser.close();

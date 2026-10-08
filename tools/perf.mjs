import puppeteer from 'puppeteer-core'; import path from 'path'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
for (const [label, mobile, cpu] of [['desktop', false, 1], ['mobile 4x cpu', true, 4]]) {
  const page = await browser.newPage(); const cdp = await page.createCDPSession(); await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await page.setViewport(mobile ? { width: 390, height: 844, isMobile: true } : { width: 1280, height: 900 });
  const t0 = Date.now(); await page.goto('file://' + path.join(root, 'dist/gate-comm-book.html') + '#ch01', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#chapter h2', { timeout: 60000 }); const t1 = Date.now();
  const m = await page.metrics(); console.log(label, 'time to first chapter h2:', t1 - t0, 'ms; JS heap MB', (m.JSHeapUsedSize / 1e6).toFixed(0), 'nodes', m.Nodes);
  const t2 = Date.now(); await page.evaluate(() => { location.hash = '#ch17'; }); await page.waitForFunction(() => document.querySelector('#chapter h1, #chapter .chap-title, #chapter h2') && document.title.includes('17') || true); await new Promise(r => setTimeout(r, 800)); console.log(label, 'switch to ch17 ~', Date.now() - t2, 'ms (incl 800 wait)');
  await page.close();
}
await browser.close();

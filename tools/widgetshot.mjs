// usage: node widgetshot.mjs chId widgetId [widgetId...]  -> shots/w-<id>.png (screenshot of each widget element), optional --mobile, --set k=v
import puppeteer from 'puppeteer-core'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const a = process.argv.slice(2); const mobile = a.includes('--mobile'); const [ch, ...ws] = a.filter(x => !x.startsWith('--'));
const browser = await puppeteer.launch({ executablePath: '/snap/bin/chromium', headless: 'new', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage(); await page.setViewport(mobile ? { width: 390, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true } : { width: 1100, height: 900 });
page.on('pageerror', e => console.log('PAGEERR', e.message)); page.on('console', m => { if (m.type() === 'error') console.log('console:', m.text().slice(0, 200)); });
await page.goto('file://' + path.join(root, 'dist/gate-comm-book.html') + '#' + ch); await new Promise(r => setTimeout(r, 800));
fs.mkdirSync(path.join(here, 'shots'), { recursive: true });
for (const w of ws) { const el = await page.$('#' + w); if (!el) { console.log('missing', w); continue; } await el.evaluate(e => e.scrollIntoView({ block: 'center' })); await new Promise(r => setTimeout(r, 900)); await el.screenshot({ path: path.join(here, 'shots', `w-${w}${mobile ? '-m' : ''}.png`) }); console.log('ok', w); }
await browser.close();

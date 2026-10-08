// usage: node shotpage.mjs chId [--mobile] -> shots/page-<ch>.png (first screens of a chapter)
import puppeteer from 'puppeteer-core'; import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const ch = process.argv[2] || 'ch00'; const mobile = process.argv.includes('--mobile');
const browser = await puppeteer.launch({ executablePath: process.env.CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
const page = await browser.newPage(); await page.setViewport(mobile ? { width: 390, height: 844, deviceScaleFactor: 1, isMobile: true } : { width: 1280, height: 900 });
await page.goto('file://' + path.join(root, 'dist/gate-comm-book.html') + '#' + ch); await new Promise(r => setTimeout(r, 1500));
fs.mkdirSync(path.join(here, 'shots'), { recursive: true });
await page.screenshot({ path: path.join(here, 'shots', `page-${ch}${mobile ? '-m' : ''}.png`), fullPage: false });
await browser.close(); console.log('ok');

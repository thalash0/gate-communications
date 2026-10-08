// Build: src/chapters/*.html  ->  dist/gate-comm-book.html (single self-contained file; works offline on desktop & Android)
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
import katex from 'katex'; import zlib from 'zlib';
const here = path.dirname(fileURLToPath(import.meta.url)); const root = path.resolve(here, '..');
const R = p => fs.readFileSync(path.join(root, p), 'utf8');

const macros = {
  '\\E': '\\mathbb{E}', '\\R': '\\mathbb{R}', '\\Pr': '\\operatorname{Pr}', '\\sinc': '\\operatorname{sinc}', '\\rect': '\\operatorname{rect}',
  '\\tri': '\\operatorname{tri}', '\\Var': '\\operatorname{Var}', '\\Cov': '\\operatorname{Cov}', '\\erfc': '\\operatorname{erfc}', '\\sgn': '\\operatorname{sgn}',
  '\\Eb': 'E_b', '\\Es': 'E_s', '\\No': 'N_0', '\\dB': '\\,\\mathrm{dB}', '\\Hz': '\\,\\mathrm{Hz}', '\\kHz': '\\,\\mathrm{kHz}', '\\MHz': '\\,\\mathrm{MHz}',
  '\\FT': '\\;\\overset{\\mathcal F}{\\longleftrightarrow}\\;', '\\bits': '\\,\\mathrm{bits}', '\\dmin': 'd_{\\min}', '\\fc': 'f_c', '\\wc': '\\omega_c',
  '\\blue': '\\htmlClass{c-blue}', '\\yel': '\\htmlClass{c-yellow}', '\\grn': '\\htmlClass{c-green}', '\\red': '\\htmlClass{c-red}', '\\pur': '\\htmlClass{c-purple}', '\\org': '\\htmlClass{c-orange}', '\\teal': '\\htmlClass{c-teal}',
};
let mathErrors = 0, curFile = '';
function tex(src, display) {
  try { return katex.renderToString(src.trim(), { displayMode: display, throwOnError: true, strict: 'ignore', output: 'html', macros: { ...macros }, trust: c => c.command === '\\htmlClass' }); }
  catch (e) { mathErrors++; console.error(`  [math error] ${curFile}: ${e.message.slice(0, 120)}  in: ${src.slice(0, 80)}`); return `<span style="color:#f55">[math error]</span>`; }
}
function renderMath(html) {
  const parts = html.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/);
  return parts.map((p, i) => {
    if (i % 2) return p;
    p = p.replace(/\\\$/g, '\u0001');
    p = p.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => tex(m, true));
    p = p.replace(/\$([^$\n][^$]*?)\$/g, (_, m) => tex(m, false));
    return p.replace(/\u0001/g, '$');
  }).join('');
}
const slug = s => s.toLowerCase().replace(/<[^>]+>/g, '').replace(/&[a-z]+;/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);

// ---- katex css with inlined woff2 (only the fonts we need) ----
function katexCss() {
  const dir = path.join(root, 'tools/node_modules/katex/dist'); let css = fs.readFileSync(path.join(dir, 'katex.min.css'), 'utf8');
  const keep = /KaTeX_(Main-Regular|Main-Bold|Main-Italic|Main-BoldItalic|Math-Italic|Math-BoldItalic|AMS-Regular|Size1-Regular|Size2-Regular|Size3-Regular|Size4-Regular|Caligraphic-Regular|Script-Regular|SansSerif-Regular|Typewriter-Regular|Fraktur-Regular)/;
  css = css.replace(/@font-face\{[^}]*?font-family:([^;]+);[^}]*?src:([^}]*?)\}/g, (m, fam, src) => {
    const f = /url\(fonts\/(KaTeX_[^)]+?)\.woff2\)/.exec(src); if (!f || !keep.test(f[1])) return '';
    const b64 = fs.readFileSync(path.join(dir, 'fonts', f[1] + '.woff2')).toString('base64');
    return m.replace(/src:[^}]*/, `src:url(data:font/woff2;base64,${b64}) format("woff2")`);
  });
  return css;
}

// ---- chapters ----
const dirc = path.join(root, 'src/chapters');
const files = fs.readdirSync(dirc).filter(f => f.endsWith('.html')).sort();
const chapters = [], templates = [], js = [];
for (const f of files) {
  curFile = f; let src = fs.readFileSync(path.join(dirc, f), 'utf8');
  const mm = /<!--meta\s*(\{[\s\S]*?\})\s*-->/.exec(src); if (!mm) { console.error('no meta in', f); process.exit(1); }
  const meta = JSON.parse(mm[1]); src = src.replace(mm[0], '');
  const id = meta.id || 'ch' + f.slice(0, 2);
  const scripts = []; src = src.replace(/<script>([\s\S]*?)<\/script>/g, (_, s) => { scripts.push(s); return ''; });
  let body = renderMath(src);
  const sections = []; body = body.replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/g, (m, attrs, t) => { const ex = /id="([^"]+)"/.exec(attrs || ''); const sid = ex ? ex[1] : slug(t); sections.push({ id: sid, title: t.replace(/<[^>]+>/g, '') }); return ex ? m : `<h2 id="${sid}">${t}</h2>`; });
  const probs = (body.match(/class="prob"/g) || []).length;
  const head = `<div class="kicker">${meta.kicker || (meta.part + (meta.num ? ' · Chapter ' + meta.num : ''))}</div><h1>${meta.title}</h1>${meta.lede ? `<p class="lede">${meta.lede}</p>` : ''}`;
  { const raw = Buffer.from((meta.cover ? '' : head) + body + (probs ? '<div class="score"></div>' : ''), 'utf8'); const comp = zlib.deflateRawSync(raw, { level: 9 }); templates.push(`<script type="text/x-chapter" id="t-${id}" data-n="${raw.length}">${comp.toString('base64')}</` + 'script>'); }
  js.push(`GB_INIT[${JSON.stringify(id)}]=function(){ ${scripts.map((s, i) => `try{\n${s}\n}catch(e){console.error(${JSON.stringify(id + ' script ' + i)},e);}`).join('\n')} };`);
  chapters.push({ id, num: meta.num || '', title: meta.title.replace(/<[^>]+>/g, ''), part: meta.part, lede: meta.lede || '', sections, probs });
  console.log(`${id.padEnd(8)} ${String(Math.round(body.length / 1024)).padStart(5)} KB  h2:${String(sections.length).padStart(2)}  problems:${String(probs).padStart(3)}  scripts:${scripts.length}  ${meta.title.slice(0, 50)}`);
}
let tpl = R('src/template.html');
const safe = s => s.replace(/<\/script/gi, '<\\/script');
const out = tpl
  .replace('/*KATEXCSS*/', () => katexCss()).replace('/*CSS*/', () => R('src/css/style.css'))
  .replace('<!--TEMPLATES-->', () => templates.join('\n'))
  .replace('/*THREE*/', () => safe(fs.readFileSync(path.join(root, 'vendor/three.min.js'), 'utf8')))
  .replace('/*INFLATE*/', () => safe(fs.readFileSync(path.join(root, 'vendor/tiny-inflate.js'), 'utf8')))
  .replace('/*LIB*/', () => safe(R('src/js/lib.js')))
  .replace('/*CHAPTERJS*/', () => 'window.GB_INIT={};\n' + safe(js.join('\n')))
  .replace('/*CHAPTERDATA*/', () => JSON.stringify(chapters))
  .replace('/*APP*/', () => safe(R('src/js/app.js')));
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist/gate-comm-book.html'), out);
console.log(`\nwrote dist/gate-comm-book.html  ${(out.length / 1048576).toFixed(2)} MB   math errors: ${mathErrors}`);
if (mathErrors) process.exitCode = 2;

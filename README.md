# Signals in the Wild — Communication Systems: a GATE guide and an engineering text

A single self-contained HTML book (about 2 MB, works offline): 23 chapters of theory with derivations,
engineering practice and worked systems, a physics interlude, an exam toolkit and an appendix.
100+ interactive figures and 3-D scenes, 500+ problems of which 95 are real GATE EC questions, formula
sheets, two mock tests.

| Part | Chapters |
|---|---|
| I · The mathematical toolkit | 1 Signals & systems · 2 Fourier · 3 Sampling, Hilbert, complex envelope · 4 Probability & the Gaussian · 5 Random processes & noise |
| II · Analog communication | 6 AM · 7 FM, PM, PLL · 8 Receivers & noise · 9 Multiplexing & pulse modulation |
| III · Information theory | 10 Entropy & source coding · 11 Channels & capacity |
| IV · Digital communication | 12 PCM · 13 Line codes, ISI, equalisation · 14 Detection & matched filter · 15 ASK/PSK/FSK/MSK/QAM · 16 Synchronisation · 17 Block, cyclic, BCH, RS, CRC, ARQ · 18 Convolutional, turbo, LDPC, polar, TCM |
| V · Systems | 19 Spread spectrum & CDMA · 20 OFDM · 21 Link budget, fading, diversity, MIMO · 22 Multiple access & cellular · 23 Six case studies |
| VI · Exam toolkit | 24 PYQ vault · 25 Cheat sheet, traps, mock tests |
| ★ A | 26 Physics & the rest of engineering · 27 Timeline, tables, glossary, reading |

## Open it
* **Desktop:** double-click `dist/gate-comm-book.html` (Chrome/Edge/Firefox).
* **Android phone / tablet:** copy `dist/android/Signals-in-the-Wild.html` to the device
  (USB cable, Google Drive, Telegram "Saved Messages", e-mail to yourself), then open it with **Chrome**
  (Files app → file → "Open with" → Chrome). No internet is needed afterwards.
  Tips: ☰ = contents, A− / A+ = text size, ☀/☾ = light/dark theme. Progress on the practice problems is
  saved in the browser. 3-D scenes: drag sideways to rotate (vertical drag scrolls the page).
* **Over Wi-Fi without copying:** in this folder run `python3 -m http.server 8000 --directory dist/android`
  and open `http://<your-PC-IP>:8000/Signals-in-the-Wild.html` on the phone (same network; under WSL you
  may need to forward the port).

## Rebuild
```
cd tools
npm install               # once: katex, jsdom, puppeteer-core
node build.mjs            # writes ../dist/gate-comm-book.html
node test.mjs [chNN ...] [--mobile]   # headless Chromium smoke test (console errors, overflow, math errors)
node widgetshot.mjs chNN widgetId ... # screenshot of individual widgets/diagrams into tools/shots/
```
Sources: `src/chapters/*.html` (text + KaTeX math + widget scripts), `src/js/lib.js` (widget library),
`src/js/app.js` (shell), `src/css/style.css`, `vendor/three.min.js` (three.js r149, MIT),
`vendor/tiny-inflate.js` (MIT, vendored). KaTeX is rendered at build time; each chapter is stored raw-deflate
compressed (base64) inside the single HTML file and inflated when it is opened, which keeps the file at
about 2 MB and the page light.

### Chapter file format
First line `<!--meta {"id":"chNN","num":"N","part":"…","title":"…","lede":"…"} -->`; then HTML with `$…$` /
`$$…$$` math; boxes `box obj | story | real | derive | eng | ex | key | trap | gate | pause`; problems
`<div class="prob" data-type="mcq|msq|nat" data-ans=… data-src=…>` with `<div class="sol">`; widgets are
declared as `<div class="widget" id="w-…">caption</div>` and implemented in the chapter's `<script>` with
`GB.widget`, `GB.three` or `GB.diagram`.

## Question sources
`pyq-src/raw`: official GATE EC papers 2014 and 2019–2026 downloaded from the organising institutes' sites
(keys for 2014, 2021–2026). 2015–2018 questions were studied from a chapter-wise solved-papers collection
(read only for question topics; the solutions in the book are original).
`pyq-src/DIGEST.md` summarises the findings.

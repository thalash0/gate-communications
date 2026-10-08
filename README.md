# Signals in the Wild — Communication Systems for GATE ECE

A single self-contained HTML book (17 chapters incl. a physics interlude, ~60 interactive figures,
3-D scenes, 96 real GATE questions solved, formula sheets and a mock test). Works offline.

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
node build.mjs            # writes ../dist/gate-comm-book.html  (needs `npm install` once: katex, jsdom, puppeteer-core)
node test.mjs [chNN ...] [--mobile]   # headless Chromium smoke test (console errors, overflow, math errors)
```
Sources: `src/chapters/*.html` (text + KaTeX math + widget scripts), `src/js/lib.js` (widget library),
`src/css/style.css`, `vendor/three.min.js` (three.js r149, MIT).

## Question sources
`pyq-src/raw`: official GATE EC papers 2014 and 2019–2026 downloaded from the organising institutes' sites
(keys for 2014, 2021–2026). 2015–2018 questions were studied from the solved-papers PDF placed in the
parent folder (read only for question topics; solutions in the book are my own).
`pyq-src/DIGEST.md` summarises the findings.
# gate-communications

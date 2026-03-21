# Vabila za rojstni dan

Spletna stran za vabila na rojstni dan — 16. maj 2026, Jezero Jasna, Kranjska Gora.

## Tech stack

- **Frontend:** Čisti HTML/CSS/JS (brez frameworkov)
- **Backend:** Google Apps Script → Google Sheets
- **Hosting:** GitHub Pages

## Struktura

- `index.html` — Enostranska aplikacija (SPA) s 5 sekcijami
- `css/style.css` — Vsi stili, animacije, responsive
- `js/app.js` — Navigacija, countdown, API helper, konstante
- `js/confetti.js` — Konfeti animacije (canvas-confetti CDN)
- `js/rsvp.js` — RSVP obrazec, validacija, oddaja
- `js/seating.js` — Interaktivni SVG sedežni red
- `js/music.js` — Izbira žanrov, pesmi, lastne želje
- `google-apps-script/Code.gs` — Backend koda (deploy ločeno v Google Apps Script)

## Konvencije

- Jezik vmesnika: **slovenščina**
- CSS: BEM-like imenovanje, CSS custom properties za barve
- JS: vanilla JS, brez modulov (skripta se nalagajo v index.html)
- Globalne funkcije: `apiPost()`, `apiGet()`, `showToast()`, `unlockSections()`, `celebrateConfetti()`
- Stanje gosta se hrani v `sessionStorage` (ključ: `guestName`)

## Zagon

1. Odpri `index.html` v brskalniku
2. Brez Apps Script URL-ja deluje v demo načinu (simulira odgovore)
3. Za pravi backend: nastavi `CONFIG.APPS_SCRIPT_URL` v `js/app.js`

## Google Sheets setup

1. Ustvari Google Sheet s 3 zavihki: `RSVP`, `Seating`, `Music`
2. Extensions > Apps Script > prilepi `Code.gs`
3. Zaženi funkcijo `addHeaders()` za dodajanje glav stolpcev
4. Deploy > New deployment > Web app (Execute as: Me, Access: Anyone)
5. Kopiraj URL v `js/app.js`

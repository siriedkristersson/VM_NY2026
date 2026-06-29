# VM-tipset 2026 – V5 read-only

Den här versionen utgår helt från Google Sheets.

## Filer på GitHub Pages
Ladda upp/ersätt:
- `index.html`
- `style.css`
- `app.js`

## Apps Script
1. Öppna Google Sheet.
2. Tillägg → Apps Script.
3. Klistra in `apps-script.gs`.
4. Kontrollera att raden nedan stämmer:
   `const SPREADSHEET_ID = '1q2TURZdn4NxhZWufIOq57MDaEBDULw6mAfa8ZMd4Pms';`
5. Implementera → Ny implementering → Webbapp.
6. Kör som: Jag.
7. Åtkomst: Alla.
8. Kopiera Web App URL.
9. Klistra in URL:en i `app.js` där det står:
   `const API_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';`

## Ark som används
- Players
- Predictions
- Bonus
- Results
- ActualBonus
- Scoreboard skapas automatiskt.

## Poäng
- 2p exakt resultat
- 1p rätt 1X2
- 2p per rätt semifinallag, ordning spelar ingen roll
- 3p brons
- 4p silver
- 5p guld

Hemsidan skriver inte tips. Den läser bara från kalkylbladet.


## Dark-only fix
Light mode är borttaget. Hemsidan använder alltid dark mode. Byt `index.html`, `style.css` och `app.js` på GitHub. Apps Script behöver inte ändras för denna fix.

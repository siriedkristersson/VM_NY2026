# VM-tipset 2026

Uppdaterad version med:

- 1X2 + exakt resultat på alla matcher.
- Poängräkning:
  - 2 poäng för exakt rätt resultat.
  - 1 poäng för rätt 1X2 om exakta resultatet inte är rätt.
  - 2 poäng per rätt lag som når semifinal.
  - 3 poäng för rätt bronslag.
  - 4 poäng för rätt silverlag.
  - 5 poäng för rätt guldlag.
- Bonusfrågor: 4 semifinallag, guld, silver, brons och minut för första gula kortet i finalen.
- Admin kan fylla i faktiska resultat och faktiska bonusutfall.
- Stöd för automatisk resultatuppdatering via Apps Script/resultat-API.

## Filer

- `index.html` – själva sidan
- `style.css` – utseende
- `app.js` – logik på hemsidan
- `apps-script.gs` – Google Apps Script-backend för Google Sheets och automatisk resultathämtning

## Viktigt om automatisk källa

Google-sökresultat är inte en stabil datakälla att skrapa direkt. Säkrare är att låta Google Apps Script hämta från en strukturerad resultatkälla/API och sedan spara data i Google Sheet.

I `apps-script.gs` kan du lägga en egen endpoint i Script Properties:

```text
RESULT_API_URL = https://din-endpoint.se/results
```

Den ska returnera data i formatet:

```json
[
  {
    "id": "53452545",
    "home": "South Africa",
    "away": "Canada",
    "home_score": 2,
    "away_score": 1,
    "status": "Complete",
    "winner": "South Africa"
  }
]
```

Om ingen egen endpoint anges försöker Apps Script använda ESPNs publika scoreboard-endpoint.


## Nytt i spelträds-versionen
- Ny flik: Spelträd.
- Spelträdet visar 16-delsfinal till final och fyller vidare lag automatiskt när resultat sparas eller hämtas.
- Spelare identifieras bara med namn på hemsidan, inget email/frivilligt ID-fält visas.

## Ny designversion
Denna version innehåller:
- Dashboard på startsidan med deltagare, spelade matcher, progress och topp 5.
- Snyggare och mer app-liknande spelträd med flaggor, vinnare och förlorare.
- Live-ställning/topplista med rörelser.
- Sida för att se allas tips.
- Förbättrad Mina tips-sida med personlig poängruta.
- Flaggor vid lagnamn.
- Mobilanpassad navigation och kortdesign.
- Ljust/mörkt läge.
- Modernare kort, färger, spacing och responsiv design.

## Senaste ändring

- Navigationen är städad och utan emojis.
- Matchraderna har fått bättre layout så 1X2, resultat och status inte ligger ovanpå varandra.
- Admin kan lägga in eller ändra deltagarnas tips även efter att matchen har börjat via adminpanelen.
- Spelträdet har fått renare kortdesign och tydligare vinnare/förlorare.

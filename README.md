# VM-tipset 2026 – Version 4

Den här versionen synkar datamodellen mellan hemsidan, `app.js`, `apps-script.gs` och Google Sheets.

## Viktiga ändringar

- En knapp: **Spara allt**.
- Matchtips och bonus sparas samtidigt till Google Sheets.
- Bonusfält töms/laddas om när man byter namn, så Siris tips ligger inte kvar när man skriver André.
- Bonusmodellen är nu:
  - `semi1`
  - `semi2`
  - `semi3`
  - `semi4`
  - `firstPlace`
  - `secondPlace`
  - `thirdPlace`
  - `firstYellowMinute`
- Apps Script skapar saknade kolumner automatiskt.

## Viktigt vid uppdatering

1. Ladda upp/ersätt dessa filer i GitHub:
   - `index.html`
   - `style.css`
   - `app.js`
   - `README.md`

2. Öppna Google Apps Script och ersätt hela koden med nya `apps-script.gs`.

3. Publicera om Apps Script:
   - Deploy
   - Manage deployments
   - Edit
   - New version
   - Deploy

4. Öppna Google Sheet. Arket **Bonus** ska ha dessa kolumner:

```text
player_id | semi1 | semi2 | semi3 | semi4 | firstPlace | secondPlace | thirdPlace | firstYellowMinute
```

Om gamla kolumner som `finalist1`, `finalist2`, `topScorer` finns kvar kan de ligga kvar, men de används inte längre. Efter nästa sparning skrivs Bonus om enligt nya strukturen.

## Poängregler

- 2p för exakt resultat i 16-delsfinal.
- 1p för rätt 1X2 i 16-delsfinal.
- 2p per rätt semifinallag, oavsett ordning.
- 3p rätt brons.
- 4p rätt silver.
- 5p rätt guld.

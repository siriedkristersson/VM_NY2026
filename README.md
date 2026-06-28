# VM-tipset 2026

En enkel webapp för internt VM-tips.

## Filer
- `index.html` – hemsidan
- `style.css` – design
- `app.js` – matcher, tips, poängräkning och API-koppling
- `apps-script.gs` – Google Sheets-backend

## Så öppnar du lokalt
Dubbelklicka på `index.html`.

Utan Google Sheets sparas data i webbläsarens `localStorage`. Du kan se den under fliken **Sparad data**.

## Så ser du sparad data
### Utan Google Sheets
Gå till fliken **Sparad data** och klicka **Exportera lokal data**.

### Med Google Sheets
1. Skapa ett Google Sheet.
2. Kopiera Sheet-ID från URL:en.
3. Öppna Extensions > Apps Script.
4. Klistra in `apps-script.gs`.
5. Byt `SPREADSHEET_ID` i koden.
6. Deploy > New deployment > Web app.
7. Välj:
   - Execute as: Me
   - Who has access: Anyone with the link
8. Kopiera Web App URL.
9. Klistra in den i `API_URL` högst upp i `app.js`.

Då skapas flikarna:
- Players
- Predictions
- Bonus
- Results
- ActualBonus
- Scoreboard

## Resultat och scoreboard
Det finns två sätt:

### 1. Manuell admin
Gå till **Admin/resultat**, fyll i resultat och välj **Spelad**. Klicka **Spara resultat**.

### 2. Automatisk API-hämtning
Antingen:
- lägg in en direkt endpoint i `RESULT_API_URL` i `app.js`, eller
- lägg in `RESULT_API_URL` som Script Property i Apps Script.

Förväntat JSON-format:
```json
[
  {"id":"66456904", "home_score":2, "away_score":0, "status":"Complete"}
]
```

`id` måste matcha match-ID i `MATCHES` i `app.js`.

## Poäng
- Rätt 1/X/2: 2 poäng
- Rätt exakt resultat: 5 poäng
- Rätt finallag: 7 poäng per lag
- Rätt skyttekung: 7 poäng


## Uppdatering 2026-06-28
- Matchlistan är uppdaterad med klara 16-delsfinaler och hela slutspelsträdet.
- Bonusfrågan "Flest mål i VM" är borttagen.
- Bonusfrågorna är nu: VM-finalist 1, VM-finalist 2 och första målminut i finalen.
- Scoreboard uppdateras automatiskt om Apps Script-filen också ersätts/deployas på nytt. Utan uppdaterad backend kan resultaten fortfarande fyllas i manuellt i Admin/resultat.


## Var sparas poängen?

Alla tips och resultat sparas i Google Sheet-filen som anges i `SPREADSHEET_ID` i `apps-script.gs`.

Flikarna är:
- `Players` – deltagare
- `Predictions` – alla matchtips
- `Bonus` – bonusfrågor
- `Results` – hämtade eller manuellt ifyllda resultat
- `ActualBonus` – facit för bonusfrågor
- `Scoreboard` – sammanräknad tabell med totalpoäng

Efter denna uppdatering skriver Apps Script även ut poängen i fliken `Scoreboard` varje gång data sparas eller resultat hämtas.

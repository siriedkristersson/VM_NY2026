# VM-tipset – Familjen Måsabacka

## Vad som är nytt i denna version

- Google Sheet-ID är redan inlagt i `apps-script.gs`.
- Resultat hämtas automatiskt från ESPN via Apps Script när hemsidan öppnas och därefter ungefär var 5:e minut.
- När en match är färdig uppdateras nästa runda automatiskt på hemsidan, t.ex. ändras `Vinnare: South Africa/Canada` till det lag som faktiskt gått vidare.
- Scoreboard räknas om automatiskt och skrivs även till fliken `Scoreboard` i Google Sheet.
- Bonusfrågor: VM-finalist 1, VM-finalist 2 och minuten för första målet i finalen.

## Viktigt vid uppladdning

1. Lägg `index.html`, `style.css` och `app.js` där hemsidan ligger.
2. Öppna Google Apps Script.
3. Ersätt hela koden med innehållet i `apps-script.gs`.
4. Klicka spara.
5. Gå till `Implementera` → `Hantera implementeringar` → pennan → välj `Ny version` → `Implementera`.

Du behöver inte ändra något manuellt i Google Sheet. Scriptet skapar/uppdaterar flikarna själv.

## Google Sheet

Filen använder detta Sheet-ID:

`1QowhUBvg0LvMw9Yvr9qqYgZrgDyZTLfTlH-VvIP1Yrk`

## Om lag inte syns direkt i nästa runda

Det krävs att matchen har status `Complete` och att resultatet är hämtat/sparat. När det finns ett färdigt resultat uppdateras lagnamnet automatiskt på sidan.

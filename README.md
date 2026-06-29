# VM-tipset – sista stabila versionen

Byt dessa filer på GitHub:
- index.html
- style.css
- app.js

Byt hela koden i Apps Script:
- apps-script.gs

Efter Apps Script är ersatt:
1. Spara.
2. Deploy -> Manage deployments -> Edit -> New version -> Deploy.
3. Kör funktionen installAutoRefreshTrigger en gång.
4. Kör testRefreshNow en gång och kontrollera flikarna Results, Scoreboard och RefreshLog.

Viktigt:
- Players, Predictions och Bonus skrivs aldrig över av scriptet.
- Results hålls till de 32 interna match-ID:n.
- Scoreboard räknas automatiskt.

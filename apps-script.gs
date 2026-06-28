/**
 * Google Apps Script backend för VM-tipset.
 *
 * Setup:
 * 1) Skapa ett Google Sheet.
 * 2) Extensions > Apps Script.
 * 3) Klistra in denna fil.
 * 4) Ändra SPREADSHEET_ID nedan.
 * 5) Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone with the link
 * 6) Klistra in Web App URL i API_URL i app.js.
 *
 * Resultat-API:
 * - Manuell resultatadmin fungerar direkt.
 * - För automatisk hämtning: lägg en endpoint i Script Properties:
 *   RESULT_API_URL = https://din-endpoint.se/results
 *   Den ska returnera JSON: [{id, home_score, away_score, status}]
 * - Om RESULT_API_URL lämnas tom hämtar scriptet själv från ESPNs publika scoreboard-API.
 */
const SPREADSHEET_ID = 'KListra_in_ditt_Google_Sheet_ID_här';

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (body.action === 'saveAll') return json(saveAll(body.payload || {}));
  if (body.action === 'getAll') return json(getAll());
  if (body.action === 'fetchResults') return json(fetchResultsFromProvider());
  return json({ ok:false, error:'Unknown action: ' + body.action });
}
function doGet() { return json(getAll()); }
function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function ss(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function sheet(name, headers){ const s=ss().getSheetByName(name) || ss().insertSheet(name); if(s.getLastRow()===0) s.appendRow(headers); return s; }
function write(name, headers, rows){ const s=sheet(name,headers); s.clear(); s.appendRow(headers); if(rows.length) s.getRange(2,1,rows.length,headers.length).setValues(rows); }
function read(name){ const s=ss().getSheetByName(name); if(!s || s.getLastRow()<2) return []; const values=s.getDataRange().getValues(); const headers=values.shift(); return values.map(row=>Object.fromEntries(headers.map((h,i)=>[h,row[i]]))); }

function saveAll(data){
  write('Players',['player_id','name','email','created_at'], (data.players||[]).map(p=>[p.id,p.name,p.email,p.created_at]));
  write('Predictions',['player_id','match_id','tip_1x2','pred_home','pred_away','submitted_at'], (data.predictions||[]).map(p=>[p.player_id,p.match_id,p.tip_1x2,p.pred_home,p.pred_away,p.submitted_at]));
  write('Bonus',['player_id','finalist1','finalist2','finalGoalMinute'], (data.bonus||[]).map(b=>[b.player_id,b.finalist1,b.finalist2,b.finalGoalMinute]));
  const results = data.results || {};
  write('Results',['match_id','home_score','away_score','status'], Object.keys(results).map(id=>[id,results[id].home_score,results[id].away_score,results[id].status]));
  const a=data.actualBonus||{};
  write('ActualBonus',['finalist1','finalist2','finalGoalMinute'], [[a.finalist1||'',a.finalist2||'',a.finalGoalMinute||'']]);
  writeScoreboard_(data);
  return {ok:true};
}

function getAll(){
  const players = read('Players').map(p=>({id:String(p.player_id), name:p.name, email:p.email, created_at:p.created_at}));
  const predictions = read('Predictions').map(p=>({player_id:String(p.player_id), match_id:String(p.match_id), tip_1x2:p.tip_1x2, pred_home:p.pred_home, pred_away:p.pred_away, submitted_at:p.submitted_at}));
  const bonus = read('Bonus').map(b=>({player_id:String(b.player_id), finalist1:b.finalist1, finalist2:b.finalist2, finalGoalMinute:b.finalGoalMinute}));
  const results = {};
  read('Results').forEach(r=>{ results[String(r.match_id)] = {home_score:r.home_score, away_score:r.away_score, status:r.status}; });
  const actual = read('ActualBonus')[0] || {};
  return {ok:true, players, predictions, bonus, results, actualBonus:{finalist1:actual.finalist1||'', finalist2:actual.finalist2||'', finalGoalMinute:actual.finalGoalMinute||''}};
}

function fetchResultsFromProvider(){
  const customUrl = PropertiesService.getScriptProperties().getProperty('RESULT_API_URL');
  let rows = [];
  if(customUrl){
    const res = UrlFetchApp.fetch(customUrl, {muteHttpExceptions:true});
    const data = JSON.parse(res.getContentText());
    rows = Array.isArray(data) ? data : (data.results || []);
  } else {
    rows = fetchEspnWorldCupResults_();
  }

  const current = getAll();
  rows.forEach(x=>{
    const id = String(x.id || x.match_id || x.game_id || '');
    if(!id) return;
    const hs = x.home_score ?? x.homeScore ?? x.score_home;
    const as = x.away_score ?? x.awayScore ?? x.score_away;
    const rawStatus = String(x.status || x.state || '').toLowerCase();
    const isComplete = rawStatus.includes('complete') || rawStatus.includes('final') || rawStatus.includes('finished') || x.completed === true;
    if(hs !== null && hs !== undefined && as !== null && as !== undefined){
      current.results[id] = {home_score:hs, away_score:as, status:isComplete ? 'Complete' : (x.status || 'Scheduled')};
    }
  });
  saveAll(current);
  return {ok:true, results: rows};
}

function fetchEspnWorldCupResults_(){
  const dates = ['20260628','20260629','20260630','20260701','20260702','20260703','20260704','20260705','20260706','20260707','20260709','20260710','20260711','20260712','20260714','20260715','20260718','20260719'];
  const out = [];
  dates.forEach(d=>{
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=' + d;
    try{
      const res = UrlFetchApp.fetch(url, {muteHttpExceptions:true});
      if(res.getResponseCode() >= 400) return;
      const data = JSON.parse(res.getContentText());
      (data.events || []).forEach(ev=>{
        const comp = (ev.competitions || [])[0];
        if(!comp) return;
        const competitors = comp.competitors || [];
        const home = competitors.find(c=>c.homeAway === 'home');
        const away = competitors.find(c=>c.homeAway === 'away');
        if(!home || !away) return;
        out.push({
          id: String(ev.id),
          home_score: home.score,
          away_score: away.score,
          status: ev.status && ev.status.type && ev.status.type.completed ? 'Complete' : (ev.status?.type?.name || 'Scheduled'),
          completed: ev.status && ev.status.type && ev.status.type.completed
        });
      });
    } catch(err) {}
  });
  return out;
}

function calcOutcome_(home, away){
  const h = Number(home);
  const a = Number(away);
  if (h > a) return '1';
  if (h < a) return '2';
  return 'X';
}

function norm_(value){
  return String(value || '').trim().toLowerCase();
}

function scorePlayer_(player, data){
  let matchPts = 0;
  let bonusPts = 0;
  let exact = 0;
  let correctOutcome = 0;

  const results = data.results || {};
  (data.predictions || [])
    .filter(p => String(p.player_id) === String(player.id))
    .forEach(p => {
      const r = results[String(p.match_id)];
      if (!r || r.status !== 'Complete') return;

      if (String(p.tip_1x2) === calcOutcome_(r.home_score, r.away_score)) {
        matchPts += 2;
        correctOutcome++;
      }

      if (Number(p.pred_home) === Number(r.home_score) && Number(p.pred_away) === Number(r.away_score)) {
        matchPts += 5;
        exact++;
      }
    });

  const b = (data.bonus || []).find(x => String(x.player_id) === String(player.id));
  const actualBonus = data.actualBonus || {};
  if (b) {
    const finalists = [norm_(actualBonus.finalist1), norm_(actualBonus.finalist2)].filter(Boolean);
    if (finalists.includes(norm_(b.finalist1))) bonusPts += 7;
    if (norm_(b.finalist2) !== norm_(b.finalist1) && finalists.includes(norm_(b.finalist2))) bonusPts += 7;
    if (b.finalGoalMinute !== '' && b.finalGoalMinute != null && actualBonus.finalGoalMinute !== '' && actualBonus.finalGoalMinute != null && Number(b.finalGoalMinute) === Number(actualBonus.finalGoalMinute)) bonusPts += 7;
  }

  return { matchPts, bonusPts, total: matchPts + bonusPts, exact, correctOutcome };
}

function writeScoreboard_(data){
  const players = data.players || [];
  const rows = players
    .map(player => {
      const score = scorePlayer_(player, data);
      return { player, score };
    })
    .sort((a,b) => b.score.total - a.score.total || b.score.exact - a.score.exact || b.score.matchPts - a.score.matchPts || String(a.player.name).localeCompare(String(b.player.name)))
    .map((row, index) => [
      index + 1,
      row.player.id,
      row.player.name,
      row.score.matchPts,
      row.score.bonusPts,
      row.score.exact,
      row.score.correctOutcome,
      row.score.total,
      new Date()
    ]);

  write('Scoreboard',['rank','player_id','name','match_points','bonus_points','exact_results','correct_1x2','total_points','updated_at'], rows);
}

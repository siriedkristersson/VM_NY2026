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
 *   Den ska returnera JSON: [{id, home, away, home_score, away_score, status, winner}]
 * - Google-sökresultat är inte en stabil källa att skrapa.
 * - Om RESULT_API_URL lämnas tom hämtar scriptet från ESPNs publika scoreboard-API.
 * - Vill ni använda FIFA som säker källa: lägg en egen FIFA/API-endpoint i RESULT_API_URL som returnerar formatet ovan.
 */
const SPREADSHEET_ID = '1QowhUBvg0LvMw9Yvr9qqYgZrgDyZTLfTlH-VvIP1Yrk';

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
  write('Predictions',['player_id','match_id','pred_outcome','pred_home','pred_away','submitted_at'], (data.predictions||[]).map(p=>[p.player_id,p.match_id,p.pred_outcome||'',p.pred_home,p.pred_away,p.submitted_at]));
  write('Bonus',['player_id','semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'], (data.bonus||[]).map(b=>[b.player_id,b.semi1||'',b.semi2||'',b.semi3||'',b.semi4||'',b.firstPlace||'',b.secondPlace||'',b.thirdPlace||'',b.firstYellowMinute||b.finalGoalMinute||'']));
  const results = data.results || {};
  write('Results',['match_id','home','away','home_score','away_score','status','winner'], Object.keys(results).map(id=>[id,results[id].home||'',results[id].away||'',results[id].home_score,results[id].away_score,results[id].status,results[id].winner||'']));
  const a=data.actualBonus||{};
  write('ActualBonus',['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'], [[a.semi1||'',a.semi2||'',a.semi3||'',a.semi4||'',a.firstPlace||'',a.secondPlace||'',a.thirdPlace||'',a.firstYellowMinute||a.finalGoalMinute||'']]);
  writeScoreboard_(data);
  return {ok:true};
}

function getAll(){
  const players = read('Players').map(p=>({id:String(p.player_id), name:p.name, email:p.email, created_at:p.created_at}));
  const predictions = read('Predictions').map(p=>({player_id:String(p.player_id), match_id:String(p.match_id), pred_outcome:p.pred_outcome||'', pred_home:p.pred_home, pred_away:p.pred_away, submitted_at:p.submitted_at}));
  const bonus = read('Bonus').map(b=>({player_id:String(b.player_id), semi1:b.semi1||'', semi2:b.semi2||'', semi3:b.semi3||'', semi4:b.semi4||'', firstPlace:b.firstPlace||'', secondPlace:b.secondPlace||'', thirdPlace:b.thirdPlace||'', firstYellowMinute:b.firstYellowMinute||b.finalGoalMinute||''}));
  const results = {};
  read('Results').forEach(r=>{ results[String(r.match_id)] = {home:r.home||'', away:r.away||'', home_score:r.home_score, away_score:r.away_score, status:r.status, winner:r.winner||''}; });
  const actual = read('ActualBonus')[0] || {};
  return {ok:true, players, predictions, bonus, results, actualBonus:{semi1:actual.semi1||'', semi2:actual.semi2||'', semi3:actual.semi3||'', semi4:actual.semi4||'', firstPlace:actual.firstPlace||'', secondPlace:actual.secondPlace||'', thirdPlace:actual.thirdPlace||'', firstYellowMinute:actual.firstYellowMinute||actual.finalGoalMinute||''}};
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
    const prev = current.results[id] || {};
    current.results[id] = {
      home: x.home || x.homeTeam || x.home_name || prev.home || '',
      away: x.away || x.awayTeam || x.away_name || prev.away || '',
      home_score: hs !== null && hs !== undefined ? hs : (prev.home_score || ''),
      away_score: as !== null && as !== undefined ? as : (prev.away_score || ''),
      status: isComplete ? 'Complete' : (x.status || prev.status || 'Scheduled'),
      winner: x.winner || x.winner_name || x.winnerName || prev.winner || ''
    };
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
        const winnerComp = competitors.find(c => c.winner === true);
        out.push({
          id: String(ev.id),
          home: home.team ? (home.team.displayName || home.team.shortDisplayName || '') : '',
          away: away.team ? (away.team.displayName || away.team.shortDisplayName || '') : '',
          home_score: home.score,
          away_score: away.score,
          status: ev.status && ev.status.type && ev.status.type.completed ? 'Complete' : (ev.status?.type?.name || 'Scheduled'),
          completed: ev.status && ev.status.type && ev.status.type.completed,
          winner: winnerComp && winnerComp.team ? (winnerComp.team.displayName || winnerComp.team.shortDisplayName || '') : ''
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

function pointsForPrediction_(p,r){
  if(!p || !r || r.status !== 'Complete') return 0;
  const exact = Number(p.pred_home) === Number(r.home_score) && Number(p.pred_away) === Number(r.away_score);
  if(exact) return 2;
  const predOutcome = p.pred_outcome || calcOutcome_(p.pred_home, p.pred_away);
  return predOutcome && predOutcome === calcOutcome_(r.home_score, r.away_score) ? 1 : 0;
}

function scorePlayer_(player, data){
  let matchPts = 0;
  let bonusPts = 0;
  let exact = 0;

  const results = data.results || {};
  (data.predictions || [])
    .filter(p => String(p.player_id) === String(player.id))
    .forEach(p => {
      const r = results[String(p.match_id)];
      if (!r || r.status !== 'Complete') return;
      const pts = pointsForPrediction_(p,r);
      matchPts += pts;
      if (pts === 2) exact++;
    });

  const b = (data.bonus || []).find(x => String(x.player_id) === String(player.id));
  const actualBonus = data.actualBonus || {};
  if (b) {
    const actualSemis = [actualBonus.semi1, actualBonus.semi2, actualBonus.semi3, actualBonus.semi4].map(norm_).filter(Boolean);
    const tipSemis = [...new Set([b.semi1, b.semi2, b.semi3, b.semi4].map(norm_).filter(Boolean))];
    bonusPts += tipSemis.filter(team => actualSemis.includes(team)).length * 2;
    if (norm_(b.thirdPlace) && norm_(b.thirdPlace) === norm_(actualBonus.thirdPlace)) bonusPts += 3;
    if (norm_(b.secondPlace) && norm_(b.secondPlace) === norm_(actualBonus.secondPlace)) bonusPts += 4;
    if (norm_(b.firstPlace) && norm_(b.firstPlace) === norm_(actualBonus.firstPlace)) bonusPts += 5;
  }

  return { matchPts, bonusPts, total: matchPts + bonusPts, exact };
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
      row.score.total,
      new Date()
    ]);

  write('Scoreboard',['rank','player_id','name','match_points','bonus_points','exact_results','total_points','updated_at'], rows);
}

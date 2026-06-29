/**
 * VM-tipset 2026 – V5 read-only backend.
 *
 * Google Sheet är källan för alla tips:
 * - Players
 * - Predictions
 * - Bonus
 * - Results
 * - ActualBonus
 *
 * Backend skriver ENDAST:
 * - Results när du/appen hämtar resultat automatiskt
 * - Scoreboard som beräknad sammanställning
 *
 * Backend skriver aldrig över Players, Predictions eller Bonus.
 */
const SPREADSHEET_ID = '1q2TURZdn4NxhZWufIOq57MDaEBDULw6mAfa8ZMd4Pms';

const SHEETS = {
  Players: ['player_id','name','email','created_at'],
  Predictions: ['player_id','match_id','pred_outcome','pred_home','pred_away','submitted_at'],
  Bonus: ['player_id','semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'],
  Results: ['match_id','home','away','home_score','away_score','status','winner'],
  ActualBonus: ['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'],
  Scoreboard: ['rank','player_id','name','match_points','bonus_points','exact_results','outcome_results','total_points','updated_at']
};

const MATCHES = [
  ['53452545','2026-06-28 21:00','16-delsfinal','South Africa','Canada'],
  ['53452557','2026-06-29 19:00','16-delsfinal','Brazil','Japan'],
  ['53452541','2026-06-29 22:30','16-delsfinal','Germany','Paraguay'],
  ['53452547','2026-06-30 03:00','16-delsfinal','Netherlands','Morocco'],
  ['53452561','2026-06-30 19:00','16-delsfinal','Ivory Coast','Norway'],
  ['53452543','2026-06-30 23:00','16-delsfinal','France','Sweden'],
  ['53452563','2026-07-01 03:00','16-delsfinal','Mexico','Ecuador'],
  ['53452565','2026-07-01 18:00','16-delsfinal','England','DR Congo'],
  ['53452555','2026-07-01 22:00','16-delsfinal','Belgium','Senegal'],
  ['53452553','2026-07-02 02:00','16-delsfinal','United States','Bosnia and Herzegovina'],
  ['53452551','2026-07-02 21:00','16-delsfinal','Spain','Austria'],
  ['53452549','2026-07-03 01:00','16-delsfinal','Portugal','Croatia'],
  ['53452505','2026-07-03 05:00','16-delsfinal','Switzerland','Algeria'],
  ['53452503','2026-07-03 20:00','16-delsfinal','Australia','Egypt'],
  ['53452569','2026-07-04 00:00','16-delsfinal','Argentina','Cape Verde'],
  ['53452507','2026-07-04 03:30','16-delsfinal','Colombia','Ghana'],
  ['53452511','2026-07-04 19:00','Åttondelsfinal','Vinnare: South Africa/Canada','Vinnare: Netherlands/Morocco'],
  ['53452509','2026-07-04 23:00','Åttondelsfinal','Vinnare: Germany/Paraguay','Vinnare: France/Sweden'],
  ['53452517','2026-07-05 22:00','Åttondelsfinal','Vinnare: Brazil/Japan','Vinnare: Ivory Coast/Norway'],
  ['53452519','2026-07-06 02:00','Åttondelsfinal','Vinnare: Mexico/Ecuador','Vinnare: England/DR Congo'],
  ['53452513','2026-07-06 21:00','Åttondelsfinal','Vinnare: Portugal/Croatia','Vinnare: Spain/Austria'],
  ['53452515','2026-07-07 02:00','Åttondelsfinal','Vinnare: United States/Bosnia and Herzegovina','Vinnare: Belgium/Senegal'],
  ['53452521','2026-07-07 18:00','Åttondelsfinal','Vinnare: Argentina/Cape Verde','Vinnare: Australia/Egypt'],
  ['53452523','2026-07-07 22:00','Åttondelsfinal','Vinnare: Switzerland/Algeria','Vinnare: Colombia/Ghana'],
  ['53452525','2026-07-09 22:00','Kvartsfinal','Vinnare match 53452509','Vinnare match 53452511'],
  ['53452527','2026-07-10 21:00','Kvartsfinal','Vinnare match 53452513','Vinnare match 53452515'],
  ['53452529','2026-07-11 23:00','Kvartsfinal','Vinnare match 53452517','Vinnare match 53452519'],
  ['53452531','2026-07-12 03:00','Kvartsfinal','Vinnare match 53452521','Vinnare match 53452523'],
  ['53452533','2026-07-14 21:00','Semifinal','Vinnare match 53452525','Vinnare match 53452527'],
  ['53452535','2026-07-15 21:00','Semifinal','Vinnare match 53452529','Vinnare match 53452531'],
  ['53452539','2026-07-18 23:00','Bronsmatch','Förlorare match 53452533','Förlorare match 53452535'],
  ['53452537','2026-07-19 21:00','Final','Vinnare match 53452533','Vinnare match 53452535']
].map(function(row){ return {id:String(row[0]), date:row[1], group:row[2], home:row[3], away:row[4]}; });

const TIP_MATCH_IDS = MATCHES.filter(function(m){ return m.group === '16-delsfinal'; }).map(function(m){ return m.id; });

const BRACKET_SLOTS = {
  '53452511': {home:{from:'53452545', type:'winner'}, away:{from:'53452547', type:'winner'}},
  '53452509': {home:{from:'53452541', type:'winner'}, away:{from:'53452543', type:'winner'}},
  '53452517': {home:{from:'53452557', type:'winner'}, away:{from:'53452561', type:'winner'}},
  '53452519': {home:{from:'53452563', type:'winner'}, away:{from:'53452565', type:'winner'}},
  '53452513': {home:{from:'53452549', type:'winner'}, away:{from:'53452551', type:'winner'}},
  '53452515': {home:{from:'53452553', type:'winner'}, away:{from:'53452555', type:'winner'}},
  '53452521': {home:{from:'53452569', type:'winner'}, away:{from:'53452503', type:'winner'}},
  '53452523': {home:{from:'53452505', type:'winner'}, away:{from:'53452507', type:'winner'}},
  '53452525': {home:{from:'53452509', type:'winner'}, away:{from:'53452511', type:'winner'}},
  '53452527': {home:{from:'53452513', type:'winner'}, away:{from:'53452515', type:'winner'}},
  '53452529': {home:{from:'53452517', type:'winner'}, away:{from:'53452519', type:'winner'}},
  '53452531': {home:{from:'53452521', type:'winner'}, away:{from:'53452523', type:'winner'}},
  '53452533': {home:{from:'53452525', type:'winner'}, away:{from:'53452527', type:'winner'}},
  '53452535': {home:{from:'53452529', type:'winner'}, away:{from:'53452531', type:'winner'}},
  '53452539': {home:{from:'53452533', type:'loser'}, away:{from:'53452535', type:'loser'}},
  '53452537': {home:{from:'53452533', type:'winner'}, away:{from:'53452535', type:'winner'}}
};

function doGet(){ return json_(getAll_()); }
function doPost(e){
  const body = e && e.postData ? JSON.parse(e.postData.contents || '{}') : {};
  if (body.action === 'getAll') return json_(getAll_());
  if (body.action === 'refreshResults') return json_(refreshResults_());
  if (body.action === 'rebuildScoreboard') return json_(rebuildScoreboard_());
  return json_({ok:false, error:'Unknown action: ' + body.action});
}

function json_(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function ss_(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }

function getSheet_(name, headers, create){
  const spreadsheet = ss_();
  let s = spreadsheet.getSheetByName(name);
  if (!s && create) s = spreadsheet.insertSheet(name);
  if (!s) return null;
  if (s.getLastRow() === 0 && headers && create) s.appendRow(headers);
  if (headers && create) {
    const current = s.getRange(1,1,1,Math.max(s.getLastColumn(),1)).getValues()[0].map(String);
    const missing = headers.filter(function(h){ return current.indexOf(h) === -1; });
    if (missing.length) s.getRange(1,current.length + 1,1,missing.length).setValues([missing]);
  }
  return s;
}

function readRows_(name, headers){
  const s = getSheet_(name, headers, false);
  if (!s || s.getLastRow() < 2) return [];
  const values = s.getDataRange().getValues();
  const header = values.shift().map(String);
  return values.filter(function(row){ return row.some(function(v){ return v !== ''; }); }).map(function(row){
    const obj = {};
    header.forEach(function(h, i){ obj[h] = row[i]; });
    return obj;
  });
}

function getAll_(){
  const data = readData_();
  const scoreboard = calculateScoreboard_(data);
  writeScoreboard_(scoreboard);
  return Object.assign({ok:true, matches:MATCHES, scoreboard:scoreboard, stats:buildStats_(data, scoreboard), comment:buildComment_(data, scoreboard)}, data);
}

function readData_(){
  const players = readRows_('Players', SHEETS.Players).map(function(p){ return {player_id:key_(p.player_id), id:key_(p.player_id), name:p.name || p.player_id || '', email:p.email || '', created_at:p.created_at || ''}; });
  const predictions = readRows_('Predictions', SHEETS.Predictions).map(function(p){ return {player_id:key_(p.player_id), match_id:internalMatchIdFromValue_(p.match_id), pred_outcome:String(p.pred_outcome || ''), pred_home:p.pred_home, pred_away:p.pred_away, submitted_at:p.submitted_at || ''}; });
  const bonus = readRows_('Bonus', SHEETS.Bonus).map(function(b){ return {player_id:key_(b.player_id), semi1:b.semi1 || '', semi2:b.semi2 || '', semi3:b.semi3 || '', semi4:b.semi4 || '', firstPlace:b.firstPlace || '', secondPlace:b.secondPlace || '', thirdPlace:b.thirdPlace || '', firstYellowMinute:b.firstYellowMinute || ''}; });
  const results = {};
  readRows_('Results', SHEETS.Results).forEach(function(r){
    const id = internalMatchIdFromResultRow_(r);
    if (!id) return;
    results[id] = {match_id:id, home:r.home || '', away:r.away || '', home_score:r.home_score, away_score:r.away_score, status:normalizeStatus_(r.status), winner:r.winner || ''};
  });
  const actual = readRows_('ActualBonus', SHEETS.ActualBonus)[0] || {};
  return {players:players, predictions:predictions, bonus:bonus, results:results, actualBonus:{semi1:actual.semi1 || '', semi2:actual.semi2 || '', semi3:actual.semi3 || '', semi4:actual.semi4 || '', firstPlace:actual.firstPlace || '', secondPlace:actual.secondPlace || '', thirdPlace:actual.thirdPlace || '', firstYellowMinute:actual.firstYellowMinute || ''}};
}

function rebuildScoreboard_(){
  const data = readData_();
  const scoreboard = calculateScoreboard_(data);
  writeScoreboard_(scoreboard);
  return {ok:true, scoreboard:scoreboard};
}

function refreshResults_(){
  const fetched = fetchEspnResults_();
  const sheet = getSheet_('Results', SHEETS.Results, true);
  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(String);
  const idCol = headers.indexOf('match_id');
  const rowById = {};
  for (let i=1; i<values.length; i++) {
    const rowObj = {};
    headers.forEach(function(h, idx){ rowObj[h] = values[i][idx]; });
    const internalId = internalMatchIdFromResultRow_(rowObj);
    if (internalId) rowById[internalId] = i + 1;
  }
  let updated = 0;
  fetched.forEach(function(x){
    const id = internalMatchIdFromExternal_(x);
    if (!id) return;
    const row = [id, x.home || '', x.away || '', x.home_score ?? '', x.away_score ?? '', normalizeStatus_(x.status), x.winner || ''];
    if (rowById[id]) sheet.getRange(rowById[id],1,1,SHEETS.Results.length).setValues([row]);
    else sheet.appendRow(row);
    updated++;
  });
  const data = readData_();
  const scoreboard = calculateScoreboard_(data);
  writeScoreboard_(scoreboard);
  return {ok:true, updated:updated, fetched:fetched.length, scoreboard:scoreboard};
}

function writeScoreboard_(scoreboard){
  const s = getSheet_('Scoreboard', SHEETS.Scoreboard, true);
  s.clearContents();
  s.appendRow(SHEETS.Scoreboard);
  if (!scoreboard.length) return;
  const now = new Date();
  const rows = scoreboard.map(function(r){ return [r.rank, r.player_id, r.name, r.match_points, r.bonus_points, r.exact_results, r.outcome_results, r.total_points, now]; });
  s.getRange(2,1,rows.length,SHEETS.Scoreboard.length).setValues(rows);
}

function calculateScoreboard_(data){
  const results = data.results || {};
  const actual = data.actualBonus || {};
  const rows = (data.players || []).map(function(player){
    const playerId = key_(player.player_id || player.id);
    let matchPts = 0, exact = 0, outcomeRight = 0;
    (data.predictions || []).filter(function(p){ return key_(p.player_id) === playerId && TIP_MATCH_IDS.indexOf(String(p.match_id)) !== -1; }).forEach(function(p){
      const r = results[String(p.match_id)];
      const pts = pointsForPrediction_(p, r);
      matchPts += pts;
      if (pts === 2) exact++;
      if (pts === 1) outcomeRight++;
    });
    let bonusPts = 0;
    const b = (data.bonus || []).find(function(x){ return key_(x.player_id) === playerId; });
    if (b) {
      const actualSemis = [actual.semi1, actual.semi2, actual.semi3, actual.semi4].map(norm_).filter(Boolean);
      const guessedSemis = unique_([b.semi1, b.semi2, b.semi3, b.semi4].map(norm_).filter(Boolean));
      bonusPts += guessedSemis.filter(function(team){ return actualSemis.indexOf(team) !== -1; }).length * 2;
      if (norm_(b.thirdPlace) && norm_(b.thirdPlace) === norm_(actual.thirdPlace)) bonusPts += 3;
      if (norm_(b.secondPlace) && norm_(b.secondPlace) === norm_(actual.secondPlace)) bonusPts += 4;
      if (norm_(b.firstPlace) && norm_(b.firstPlace) === norm_(actual.firstPlace)) bonusPts += 5;
    }
    return {player_id:playerId, name:player.name || player.player_id || playerId, match_points:matchPts, bonus_points:bonusPts, exact_results:exact, outcome_results:outcomeRight, total_points:matchPts + bonusPts};
  }).sort(function(a,b){ return b.total_points - a.total_points || b.exact_results - a.exact_results || b.outcome_results - a.outcome_results || String(a.name).localeCompare(String(b.name)); });
  rows.forEach(function(r,i){ r.rank = i + 1; });
  return rows;
}

function pointsForPrediction_(p, r){
  if (!p || !r || normalizeStatus_(r.status) !== 'Complete') return 0;
  if (p.pred_home === '' || p.pred_away === '' || p.pred_home == null || p.pred_away == null) return 0;
  const exact = Number(p.pred_home) === Number(r.home_score) && Number(p.pred_away) === Number(r.away_score);
  if (exact) return 2;
  const po = String(p.pred_outcome || calcOutcome_(p.pred_home, p.pred_away) || '').toUpperCase();
  return po && po === calcOutcome_(r.home_score, r.away_score) ? 1 : 0;
}
function calcOutcome_(home, away){ const h = Number(home), a = Number(away); if (h > a) return '1'; if (h < a) return '2'; if (h === a) return 'X'; return ''; }
function normalizeStatus_(s){ const v = String(s || '').toLowerCase(); return (v === 'complete' || v.indexOf('final') !== -1 || v.indexOf('finished') !== -1 || v.indexOf('spelad') !== -1 || v.indexOf('status_final') !== -1) ? 'Complete' : String(s || 'Scheduled'); }
function key_(v){ return String(v || '').trim().toLowerCase(); }
function norm_(v){ return String(v || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function alias_(v){ const n = norm_(v); const map = {'cote d ivoire':'ivory coast','ivory coast':'ivory coast','congo dr':'dr congo','dr congo':'dr congo','usa':'united states','u s':'united states','united states':'united states','cape verde islands':'cape verde','cabo verde':'cape verde','bosnia herzegovina':'bosnia and herzegovina'}; return map[n] || n; }
function unique_(arr){ return arr.filter(function(v,i,a){ return v && a.indexOf(v) === i; }); }

function svTeam_(v){
  const n = norm_(v);
  const map = {
    'south africa':'Sydafrika','canada':'Kanada','brazil':'Brasilien','japan':'Japan','germany':'Tyskland','paraguay':'Paraguay','netherlands':'Nederländerna','morocco':'Marocko','ivory coast':'Elfenbenskusten','norway':'Norge','france':'Frankrike','sweden':'Sverige','mexico':'Mexiko','ecuador':'Ecuador','england':'England','dr congo':'DR Kongo','congo dr':'DR Kongo','belgium':'Belgien','senegal':'Senegal','united states':'USA','usa':'USA','bosnia and herzegovina':'Bosnien och Hercegovina','spain':'Spanien','austria':'Österrike','portugal':'Portugal','croatia':'Kroatien','switzerland':'Schweiz','algeria':'Algeriet','australia':'Australien','egypt':'Egypten','argentina':'Argentina','cape verde':'Kap Verde','cabo verde':'Kap Verde','colombia':'Colombia','ghana':'Ghana'
  };
  return map[n] || String(v || '');
}

function internalMatchIdFromValue_(value){
  const id = String(value || '').trim();
  if (MATCHES.some(function(m){ return m.id === id; })) return id;
  return id;
}
function internalMatchIdFromResultRow_(r){
  const raw = String(r.match_id || '').trim();
  if (MATCHES.some(function(m){ return m.id === raw; })) return raw;
  return internalMatchIdFromExternal_({id:raw, home:r.home, away:r.away, date:r.date});
}
function internalMatchIdFromExternal_(x){
  const home = alias_(x.home || x.homeTeam || x.home_name || '');
  const away = alias_(x.away || x.awayTeam || x.away_name || '');
  const date = String(x.date || x.date_short || x.competition_date || '').slice(0,10);
  let candidates = MATCHES.filter(function(m){ return alias_(m.home) === home && alias_(m.away) === away; });
  if (!candidates.length) candidates = MATCHES.filter(function(m){ return alias_(m.home) === away && alias_(m.away) === home; });
  if (date && candidates.length > 1) candidates = candidates.filter(function(m){ return m.date.slice(0,10) === date; });
  return candidates[0] ? candidates[0].id : '';
}

function buildStats_(data, scoreboard){
  return {
    champion: countValues_((data.bonus || []).map(function(b){ return b.firstPlace; })),
    semifinalists: countValues_((data.bonus || []).flatMap(function(b){ return [b.semi1,b.semi2,b.semi3,b.semi4]; })),
    best1x2: scoreboard.map(function(r){ return {name:r.name, value:r.exact_results + r.outcome_results}; }).sort(function(a,b){ return b.value - a.value; }).slice(0,10),
    bestExact: scoreboard.map(function(r){ return {name:r.name, value:r.exact_results}; }).sort(function(a,b){ return b.value - a.value; }).slice(0,10)
  };
}
function countValues_(values){
  const counts = {};
  values.map(function(v){ return String(v || '').trim(); }).filter(Boolean).forEach(function(v){ counts[v] = (counts[v] || 0) + 1; });
  return Object.keys(counts).map(function(name){ return {name:name, value:counts[name]}; }).sort(function(a,b){ return b.value - a.value || a.name.localeCompare(b.name); });
}
function buildComment_(data, scoreboard){
  if (!scoreboard.length) return 'Inga deltagare är inlästa ännu.';
  const completeIds = Object.keys(data.results || {}).filter(function(id){ return normalizeStatus_(data.results[id].status) === 'Complete'; });
  if (!completeIds.length) return scoreboard[0].name + ' toppar inför slutspelet. ' + (data.players || []).length + ' deltagare är inlästa.';
  const last = MATCHES.filter(function(m){ return completeIds.indexOf(m.id) !== -1; }).sort(function(a,b){ return new Date(b.date.replace(' ','T')) - new Date(a.date.replace(' ','T')); })[0];
  const r = data.results[last.id];
  const correct = (data.players || []).filter(function(p){
    const pred = (data.predictions || []).find(function(x){ return key_(x.player_id) === key_(p.player_id || p.id) && String(x.match_id) === last.id; });
    return pointsForPrediction_(pred, r) > 0;
  }).length;
  return svTeam_(last.home) + ' – ' + svTeam_(last.away) + ' slutade ' + r.home_score + '–' + r.away_score + '. ' + correct + ' av ' + (data.players || []).length + ' fick poäng. ' + scoreboard[0].name + ' leder med ' + scoreboard[0].total_points + ' poäng.';
}

function fetchEspnResults_(){
  const dates = ['20260628','20260629','20260630','20260701','20260702','20260703','20260704','20260705','20260706','20260707','20260709','20260710','20260711','20260712','20260714','20260715','20260718','20260719'];
  const out = [];
  dates.forEach(function(d){
    const url = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=' + d;
    try {
      const res = UrlFetchApp.fetch(url, {muteHttpExceptions:true});
      if (res.getResponseCode() >= 400) return;
      const data = JSON.parse(res.getContentText());
      (data.events || []).forEach(function(ev){
        const comp = (ev.competitions || [])[0]; if (!comp) return;
        const competitors = comp.competitors || [];
        const home = competitors.find(function(c){ return c.homeAway === 'home'; });
        const away = competitors.find(function(c){ return c.homeAway === 'away'; });
        if (!home || !away) return;
        const winner = competitors.find(function(c){ return c.winner === true; });
        out.push({
          id:String(ev.id),
          date: ev.date ? ev.date.slice(0,10) : '',
          home: home.team ? (home.team.displayName || home.team.shortDisplayName || '') : '',
          away: away.team ? (away.team.displayName || away.team.shortDisplayName || '') : '',
          home_score: home.score,
          away_score: away.score,
          status: ev.status && ev.status.type && ev.status.type.completed ? 'Complete' : (ev.status && ev.status.type ? ev.status.type.name : 'Scheduled'),
          winner: winner && winner.team ? (winner.team.displayName || winner.team.shortDisplayName || '') : ''
        });
      });
    } catch(err) {}
  });
  return out;
}

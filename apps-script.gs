/**
 * VM-tipset 2026 – stabil read-only backend.
 *
 * Google Sheet är källan för tipsen:
 * - Players
 * - Predictions
 * - Bonus
 * - ActualBonus
 *
 * Scriptet skriver ENDAST:
 * - Results: uppdaterade matchresultat + lag som går vidare i spelträdet
 * - Scoreboard: beräknad ställning
 * - RefreshLog: logg för felsökning
 *
 * Det skriver aldrig över Players, Predictions eller Bonus.
 */
const SPREADSHEET_ID = '1q2TURZdn4NxhZWufIOq57MDaEBDULw6mAfa8ZMd4Pms';

const SHEETS = {
  Players: ['player_id','name','email','created_at'],
  Predictions: ['player_id','match_id','pred_outcome','pred_home','pred_away','submitted_at'],
  Bonus: ['player_id','semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'],
  Results: ['match_id','home','away','home_score','away_score','status','winner'],
  ActualBonus: ['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'],
  Scoreboard: ['rank','player_id','name','match_points','bonus_points','exact_results','outcome_results','total_points','updated_at'],
  RefreshLog: ['timestamp','message']
};

const MATCHES = [
  ['53452545','2026-06-28 21:00','16-delsfinal','South Africa','Canada'],
  ['53452557','2026-06-29 19:00','16-delsfinal','Brazil','Japan'],
  ['53452547','2026-06-29 22:30','16-delsfinal','Germany','Paraguay'],
  ['53452541','2026-06-30 03:00','16-delsfinal','Netherlands','Morocco'],
  ['53452561','2026-06-30 19:00','16-delsfinal','Ivory Coast','Norway'],
  ['53452563','2026-06-30 23:00','16-delsfinal','France','Sweden'],
  ['53452543','2026-07-01 03:00','16-delsfinal','Mexico','Ecuador'],
  ['53452553','2026-07-01 18:00','16-delsfinal','England','DR Congo'],
  ['53452565','2026-07-01 22:00','16-delsfinal','Belgium','Senegal'],
  ['53452555','2026-07-02 02:00','16-delsfinal','United States','Bosnia and Herzegovina'],
  ['53452549','2026-07-02 21:00','16-delsfinal','Spain','Austria'],
  ['53452551','2026-07-03 01:00','16-delsfinal','Portugal','Croatia'],
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
].map(function(r){ return {id:String(r[0]), date:r[1], group:r[2], home:r[3], away:r[4]}; });

const TIP_MATCH_IDS = MATCHES.filter(function(m){ return m.group === '16-delsfinal'; }).map(function(m){ return m.id; });

const BRACKET_SLOTS = {
  '53452511': {home:{from:'53452545', type:'winner'}, away:{from:'53452541', type:'winner'}},
  '53452509': {home:{from:'53452547', type:'winner'}, away:{from:'53452563', type:'winner'}},
  '53452517': {home:{from:'53452557', type:'winner'}, away:{from:'53452561', type:'winner'}},
  '53452519': {home:{from:'53452543', type:'winner'}, away:{from:'53452553', type:'winner'}},
  '53452513': {home:{from:'53452551', type:'winner'}, away:{from:'53452549', type:'winner'}},
  '53452515': {home:{from:'53452555', type:'winner'}, away:{from:'53452565', type:'winner'}},
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

const TEAM_SV = {
  'south africa':'Sydafrika','canada':'Kanada','brazil':'Brasilien','japan':'Japan','germany':'Tyskland','paraguay':'Paraguay','netherlands':'Nederländerna','morocco':'Marocko','ivory coast':'Elfenbenskusten','cote d ivoire':'Elfenbenskusten','norway':'Norge','france':'Frankrike','sweden':'Sverige','mexico':'Mexiko','ecuador':'Ecuador','england':'England','dr congo':'DR Kongo','congo dr':'DR Kongo','belgium':'Belgien','senegal':'Senegal','united states':'USA','usa':'USA','bosnia and herzegovina':'Bosnien och Hercegovina','bosnia-herzegovina':'Bosnien och Hercegovina','spain':'Spanien','austria':'Österrike','portugal':'Portugal','croatia':'Kroatien','switzerland':'Schweiz','algeria':'Algeriet','australia':'Australien','egypt':'Egypten','argentina':'Argentina','cape verde':'Kap Verde','cabo verde':'Kap Verde','colombia':'Colombia','ghana':'Ghana'
};

function doGet(){ return json(getAll()); }
function doPost(e){
  var body = e && e.postData ? JSON.parse(e.postData.contents || '{}') : {};
  if(body.action === 'getAll') return json(getAll());
  if(body.action === 'refreshResults') return json(refreshResults());
  if(body.action === 'installAutoRefreshTrigger') return json(installAutoRefreshTrigger());
  return json({ok:false,error:'Unknown action: ' + body.action});
}
function json(obj){ return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function ss(){ return SpreadsheetApp.openById(SPREADSHEET_ID); }
function getSheet(name, headers){
  var s = ss().getSheetByName(name) || ss().insertSheet(name);
  if(s.getLastRow() === 0) s.appendRow(headers);
  var current = s.getRange(1,1,1,Math.max(s.getLastColumn(),1)).getValues()[0].map(String);
  var missing = headers.filter(function(h){ return current.indexOf(h) === -1; });
  if(missing.length) s.getRange(1,current.length+1,1,missing.length).setValues([missing]);
  return s;
}
function readRows(name, headers){
  var s = getSheet(name, headers);
  if(s.getLastRow() < 2) return [];
  var values = s.getDataRange().getValues();
  var h = values.shift().map(String);
  return values.filter(function(r){ return r.some(function(v){ return v !== ''; }); }).map(function(r){
    var obj = {};
    h.forEach(function(key,i){ obj[key] = r[i]; });
    return obj;
  });
}
function writeRows(name, headers, rows){
  var s = getSheet(name, headers);
  s.clearContents();
  s.getRange(1,1,1,headers.length).setValues([headers]);
  if(rows.length) s.getRange(2,1,rows.length,headers.length).setValues(rows);
}
function appendLog(msg){
  try{
    var s=getSheet('RefreshLog', SHEETS.RefreshLog);
    s.appendRow([new Date(), msg]);
    var maxRows=200;
    if(s.getLastRow()>maxRows+1) s.deleteRows(2, s.getLastRow()-maxRows-1);
  }catch(e){}
}

function norm(v){ return String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function alias(v){
  var n=norm(v);
  var map={
    'cote d ivoire':'ivory coast','ivory coast':'ivory coast','dr congo':'dr congo','congo dr':'dr congo','d r congo':'dr congo','usa':'united states','us':'united states','u s a':'united states','bosnia herzegovina':'bosnia and herzegovina','bosnia and herzegovina':'bosnia and herzegovina','cape verde':'cape verde','cabo verde':'cape verde','south africa':'south africa'
  };
  return map[n] || n;
}
function svName(v){ return TEAM_SV[alias(v)] || TEAM_SV[norm(v)] || String(v||'').trim(); }
function calcOutcome(h,a){ h=Number(h); a=Number(a); if(h>a) return '1'; if(h<a) return '2'; if(h===a) return 'X'; return ''; }
function isCompleteStatus(status){ return String(status||'').toLowerCase() === 'complete' || String(status||'').toLowerCase().indexOf('final')>=0; }
function emptyResultForMatch(m){ return {match_id:m.id, home:m.home, away:m.away, home_score:0, away_score:0, status:'STATUS_SCHEDULED', winner:''}; }
function resultMapFromSheet(){
  var map={};
  readRows('Results', SHEETS.Results).forEach(function(r){ if(r.match_id !== '') map[String(r.match_id)] = r; });
  return map;
}
function getWinnerLoser(matchId, results){
  var r=results[String(matchId)];
  if(!r || !isCompleteStatus(r.status)) return null;
  var h=Number(r.home_score), a=Number(r.away_score);
  var home=String(r.home||'').trim(), away=String(r.away||'').trim();
  var winner=String(r.winner||'').trim();
  if(!winner && h!==a) winner = h>a ? home : away;
  var loser = '';
  if(winner){
    if(alias(winner)===alias(home)) loser=away;
    else if(alias(winner)===alias(away)) loser=home;
  }
  return {winner:winner, loser:loser};
}
function resolvePlaceholder(slot, results){
  if(!slot) return '';
  var wl=getWinnerLoser(slot.from, results);
  if(wl && wl[slot.type]) return wl[slot.type];
  var source=results[String(slot.from)] || emptyResultForMatch(MATCHES.filter(function(m){return m.id===String(slot.from);})[0]);
  if(!source) return slot.type==='loser' ? 'Förlorare match ' + slot.from : 'Vinnare match ' + slot.from;
  return (slot.type==='loser' ? 'Förlorare: ' : 'Vinnare: ') + source.home + '/' + source.away;
}
function normalizeResults(){
  var existing=resultMapFromSheet();
  var out={};
  MATCHES.forEach(function(m){
    var old=existing[m.id] || {};
    out[m.id] = {
      match_id:m.id,
      home: old.home || m.home,
      away: old.away || m.away,
      home_score: old.home_score !== '' && old.home_score !== undefined ? old.home_score : 0,
      away_score: old.away_score !== '' && old.away_score !== undefined ? old.away_score : 0,
      status: old.status || 'STATUS_SCHEDULED',
      winner: old.winner || ''
    };
  });
  Object.keys(BRACKET_SLOTS).forEach(function(id){
    var slots=BRACKET_SLOTS[id];
    out[id].home = isCompleteStatus(out[id].status) ? out[id].home : resolvePlaceholder(slots.home,out);
    out[id].away = isCompleteStatus(out[id].status) ? out[id].away : resolvePlaceholder(slots.away,out);
  });
  writeResultsMap(out);
  return out;
}
function writeResultsMap(map){
  var rows=MATCHES.map(function(m){
    var r=map[m.id] || emptyResultForMatch(m);
    return [m.id, r.home || '', r.away || '', r.home_score, r.away_score, r.status || 'STATUS_SCHEDULED', r.winner || ''];
  });
  writeRows('Results', SHEETS.Results, rows);
}

function matchInternalId(external){
  var rawId=String(external.id||external.match_id||external.game_id||'');
  if(MATCHES.some(function(m){return m.id===rawId;})) return rawId;
  var home=alias(external.home||''), away=alias(external.away||'');
  var date=String(external.date||'').slice(0,10);
  var candidates=MATCHES.filter(function(m){ return alias(m.home)===home && alias(m.away)===away; });
  if(!candidates.length) candidates=MATCHES.filter(function(m){ return alias(m.home)===away && alias(m.away)===home; });
  if(date && candidates.length>1) candidates=candidates.filter(function(m){ return String(m.date).slice(0,10)===date; });
  return candidates[0] ? candidates[0].id : '';
}
function refreshResults(){
  var results=normalizeResults();
  var fetched=fetchEspnResults_();
  var matched=0, unmatched=[];
  fetched.forEach(function(x){
    var id=matchInternalId(x);
    if(!id){ unmatched.push((x.home||'?')+' - '+(x.away||'?')+' '+(x.date||'')); return; }
    var status = isCompleteStatus(x.status) ? 'Complete' : (x.status || 'STATUS_SCHEDULED');
    var winner = x.winner || '';
    if(!winner && isCompleteStatus(status) && Number(x.home_score)!==Number(x.away_score)) winner = Number(x.home_score)>Number(x.away_score) ? x.home : x.away;
    results[id] = {
      match_id:id,
      home:x.home || results[id].home,
      away:x.away || results[id].away,
      home_score:x.home_score !== undefined && x.home_score !== null ? x.home_score : results[id].home_score,
      away_score:x.away_score !== undefined && x.away_score !== null ? x.away_score : results[id].away_score,
      status:status,
      winner:winner || results[id].winner || ''
    };
    matched++;
  });
  writeResultsMap(results);
  normalizeResults();
  var data=buildData();
  writeScoreboard(data);
  appendLog('ESPN fetched: '+fetched.length+'. Matched: '+matched+'. Unmatched: '+unmatched.length+(unmatched.length?'. '+unmatched.join(' | '):''));
  return {ok:true, fetched:fetched.length, matched:matched, unmatched:unmatched};
}
function scheduledRefresh(){ return refreshResults(); }
function testRefreshNow(){ return refreshResults(); }
function installAutoRefreshTrigger(){
  ScriptApp.getProjectTriggers().forEach(function(t){ if(t.getHandlerFunction()==='scheduledRefresh') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('scheduledRefresh').timeBased().everyMinutes(15).create();
  return {ok:true, message:'Automatisk uppdatering installerad var 15:e minut.'};
}

function fetchEspnResults_(){
  var dates=['20260628','20260629','20260630','20260701','20260702','20260703','20260704','20260705','20260706','20260707','20260709','20260710','20260711','20260712','20260714','20260715','20260718','20260719'];
  var out=[];
  dates.forEach(function(d){
    var url='https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates='+d;
    try{
      var res=UrlFetchApp.fetch(url,{muteHttpExceptions:true});
      if(res.getResponseCode()>=400) return;
      var data=JSON.parse(res.getContentText());
      (data.events||[]).forEach(function(ev){
        var comp=(ev.competitions||[])[0]; if(!comp) return;
        var home=(comp.competitors||[]).filter(function(c){return c.homeAway==='home';})[0];
        var away=(comp.competitors||[]).filter(function(c){return c.homeAway==='away';})[0];
        if(!home || !away) return;
        var winner=(comp.competitors||[]).filter(function(c){return c.winner===true;})[0];
        out.push({
          id:String(ev.id), date: ev.date ? ev.date.slice(0,10) : '',
          home: home.team ? (home.team.displayName || home.team.shortDisplayName || '') : '',
          away: away.team ? (away.team.displayName || away.team.shortDisplayName || '') : '',
          home_score: home.score !== undefined ? home.score : '',
          away_score: away.score !== undefined ? away.score : '',
          status: ev.status && ev.status.type && ev.status.type.completed ? 'Complete' : (ev.status && ev.status.type ? ev.status.type.name : 'STATUS_SCHEDULED'),
          winner: winner && winner.team ? (winner.team.displayName || winner.team.shortDisplayName || '') : ''
        });
      });
    } catch(err){ appendLog('ESPN error '+d+': '+err.message); }
  });
  return out;
}

function pointsForPrediction(p,r){
  if(!p || !r || !isCompleteStatus(r.status)) return 0;
  var exact = Number(p.pred_home)===Number(r.home_score) && Number(p.pred_away)===Number(r.away_score);
  if(exact) return 2;
  var po=String(p.pred_outcome || calcOutcome(p.pred_home,p.pred_away)).toUpperCase();
  return po && po===calcOutcome(r.home_score,r.away_score) ? 1 : 0;
}
function scorePlayer(player, data){
  var matchPts=0, bonusPts=0, exact=0, outcomeRight=0;
  data.predictions.filter(function(p){ return String(p.player_id)===String(player.player_id) && TIP_MATCH_IDS.indexOf(String(p.match_id))!==-1; }).forEach(function(p){
    var r=data.results[String(p.match_id)];
    var pts=pointsForPrediction(p,r);
    matchPts += pts;
    if(pts===2) exact++;
    if(pts===1) outcomeRight++;
  });
  var b=data.bonus.filter(function(x){ return String(x.player_id)===String(player.player_id); })[0];
  var a=data.actualBonus || {};
  if(b){
    var actualSemis=[a.semi1,a.semi2,a.semi3,a.semi4].map(alias).filter(Boolean);
    var tipSemis=[b.semi1,b.semi2,b.semi3,b.semi4].map(alias).filter(Boolean);
    tipSemis = tipSemis.filter(function(v,i,self){ return self.indexOf(v)===i; });
    bonusPts += tipSemis.filter(function(t){ return actualSemis.indexOf(t)!==-1; }).length * 2;
    if(alias(b.thirdPlace) && alias(b.thirdPlace)===alias(a.thirdPlace)) bonusPts += 3;
    if(alias(b.secondPlace) && alias(b.secondPlace)===alias(a.secondPlace)) bonusPts += 4;
    if(alias(b.firstPlace) && alias(b.firstPlace)===alias(a.firstPlace)) bonusPts += 5;
  }
  return {matchPts:matchPts, bonusPts:bonusPts, exact:exact, outcomeRight:outcomeRight, total:matchPts+bonusPts};
}
function writeScoreboard(data){
  var rows=data.players.map(function(p){ var s=scorePlayer(p,data); return {p:p,s:s}; })
    .sort(function(a,b){ return b.s.total-a.s.total || b.s.exact-a.s.exact || b.s.outcomeRight-a.s.outcomeRight || String(a.p.name).localeCompare(String(b.p.name)); })
    .map(function(x,i){ return [i+1,x.p.player_id,x.p.name,x.s.matchPts,x.s.bonusPts,x.s.exact,x.s.outcomeRight,x.s.total,new Date()]; });
  writeRows('Scoreboard', SHEETS.Scoreboard, rows);
  return rows;
}
function buildStats(data, scoreboard){
  function count(values){
    var m={}; values.filter(Boolean).forEach(function(v){ var key=svName(v); m[key]=(m[key]||0)+1; });
    return Object.keys(m).map(function(k){ return {name:k,value:m[k]}; }).sort(function(a,b){ return b.value-a.value || a.name.localeCompare(b.name); });
  }
  var champs=data.bonus.map(function(b){ return b.firstPlace; });
  var semis=[]; data.bonus.forEach(function(b){ semis.push(b.semi1,b.semi2,b.semi3,b.semi4); });
  return {
    champion: count(champs),
    semifinalists: count(semis),
    best1x2: scoreboard.map(function(r){ return {name:r.name,value:Number(r.outcome_results||0)+Number(r.exact_results||0)}; }).sort(function(a,b){return b.value-a.value;}),
    bestExact: scoreboard.map(function(r){ return {name:r.name,value:Number(r.exact_results||0)}; }).sort(function(a,b){return b.value-a.value;})
  };
}
function latestComment(data, scoreboard){
  var completed=MATCHES.map(function(m){ return data.results[m.id]; }).filter(function(r){ return r && isCompleteStatus(r.status); });
  var leader=scoreboard[0];
  if(!completed.length) return 'Inga matcher är färdigspelade ännu. Ställningen uppdateras automatiskt när resultaten kommer in.';
  var last=completed[completed.length-1];
  var ptsPlayers=data.players.filter(function(p){
    return data.predictions.some(function(pr){ return String(pr.player_id)===String(p.player_id) && String(pr.match_id)===String(last.match_id) && pointsForPrediction(pr,last)>0; });
  }).length;
  var text = svName(last.home) + ' – ' + svName(last.away) + ' slutade ' + last.home_score + '–' + last.away_score + '. ' + ptsPlayers + ' av ' + data.players.length + ' fick poäng.';
  if(leader) text += ' ' + leader.name + ' leder med ' + leader.total_points + ' poäng.';
  return text;
}
function buildData(){
  var results=normalizeResults();
  var players=readRows('Players', SHEETS.Players).map(function(p){ return {player_id:String(p.player_id||'').trim(), id:String(p.player_id||'').trim(), name:p.name||p.player_id||'', email:p.email||'', created_at:p.created_at||''}; }).filter(function(p){return p.player_id;});
  var predictions=readRows('Predictions', SHEETS.Predictions).map(function(p){ return {player_id:String(p.player_id||'').trim(), match_id:String(p.match_id||'').trim(), pred_outcome:String(p.pred_outcome||''), pred_home:p.pred_home, pred_away:p.pred_away, submitted_at:p.submitted_at||''}; });
  var bonus=readRows('Bonus', SHEETS.Bonus).map(function(b){ return {player_id:String(b.player_id||'').trim(), semi1:b.semi1||'', semi2:b.semi2||'', semi3:b.semi3||'', semi4:b.semi4||'', firstPlace:b.firstPlace||'', secondPlace:b.secondPlace||'', thirdPlace:b.thirdPlace||'', firstYellowMinute:b.firstYellowMinute||''}; });
  var a=readRows('ActualBonus', SHEETS.ActualBonus)[0] || {};
  var actualBonus={semi1:a.semi1||'', semi2:a.semi2||'', semi3:a.semi3||'', semi4:a.semi4||'', firstPlace:a.firstPlace||'', secondPlace:a.secondPlace||'', thirdPlace:a.thirdPlace||'', firstYellowMinute:a.firstYellowMinute||''};
  return {players:players,predictions:predictions,bonus:bonus,results:results,actualBonus:actualBonus};
}
function getAll(){
  var data=buildData();
  var sbRows=writeScoreboard(data);
  var scoreboard=readRows('Scoreboard', SHEETS.Scoreboard);
  return {ok:true, players:data.players, predictions:data.predictions, bonus:data.bonus, results:data.results, actualBonus:data.actualBonus, scoreboard:scoreboard, matches:MATCHES, stats:buildStats(data,scoreboard), comment:latestComment(data,scoreboard), refreshed_at:new Date()};
}

// VM-tipset 2026 - v2
// Hemsida: GitHub Pages. Data: Google Sheets via Apps Script.
const API_URL = "https://script.google.com/macros/s/AKfycbw8hIRx5YANF3QzZBmwXbcmX_KyGI22y3LGJtPJ7CLCsQDVjBUtdddSA1Bratl6cPOg/exec";

// Valfri extern resultat-endpoint. Format:
// [{id:"66456904", home_score:2, away_score:0, status:"Complete"}, ...]
// Lämna tom om du använder Apps Script/Manuell admin.
const RESULT_API_URL = ""; // tom = Apps Script hämtar automatiskt från ESPN om backend är uppdaterad

// Automatisk hämtning när sidan är öppen.
const AUTO_FETCH_RESULTS = true;
const AUTO_FETCH_INTERVAL_MS = 5 * 60 * 1000;
const LOCK_MINUTES_BEFORE_KICKOFF = 0;

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
  ['53452525','2026-07-09 22:00','Kvartsfinal','Vinnare match 89','Vinnare match 90'],
  ['53452527','2026-07-10 21:00','Kvartsfinal','Vinnare match 93','Vinnare match 94'],
  ['53452529','2026-07-11 23:00','Kvartsfinal','Vinnare match 91','Vinnare match 92'],
  ['53452531','2026-07-12 03:00','Kvartsfinal','Vinnare match 95','Vinnare match 96'],
  ['53452533','2026-07-14 21:00','Semifinal','Vinnare kvartsfinal 1','Vinnare kvartsfinal 2'],
  ['53452535','2026-07-15 21:00','Semifinal','Vinnare kvartsfinal 3','Vinnare kvartsfinal 4'],
  ['53452539','2026-07-18 23:00','Bronsmatch','Förlorare semifinal 1','Förlorare semifinal 2'],
  ['53452537','2026-07-19 21:00','Final','Vinnare semifinal 1','Vinnare semifinal 2']
].map(([id,date,group,home,away])=>({id,date,group,home,away}));

// Slutspelsträd: här kopplas vinnare/förlorare vidare till nästa runda.
// Hemsidan räknar ut lagnamnen dynamiskt från resultaten i state.results.
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

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const store = {
  get:k=>JSON.parse(localStorage.getItem(k)||'null'),
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};
let state = {
  players: store.get('players') || [],
  predictions: store.get('predictions') || [],
  bonus: store.get('bonus') || [],
  results: store.get('results') || {},
  actualBonus: store.get('actualBonus') || {}
};
let previousRanks = store.get('previousRanks') || {};

function saveLocal(){ Object.entries(state).forEach(([k,v])=>store.set(k,v)); }
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function playerKey(){ const email=$('#playerEmail')?.value.trim().toLowerCase() || ''; const name=$('#playerName')?.value.trim() || ''; return email || name.toLowerCase(); }
function ensurePlayer(){
  const name=$('#playerName').value.trim();
  if(!name) throw new Error('Skriv ditt namn först.');
  const id=playerKey();
  const existing=state.players.find(p=>p.id===id);
  if(existing){ existing.name=name; existing.email=$('#playerEmail').value.trim(); }
  else state.players.push({id,name,email:$('#playerEmail').value.trim(),created_at:new Date().toISOString()});
  return id;
}
function norm(s){ return (s||'').trim().toLowerCase(); }
function outcome(h,a){ if(h===''||a===''||h==null||a==null) return ''; h=Number(h); a=Number(a); return h>a?'1':h<a?'2':'X'; }
function kickoffDate(m){ return new Date(m.date.replace(' ', 'T') + ':00'); }
function lockDate(m){ return new Date(kickoffDate(m).getTime() - LOCK_MINUTES_BEFORE_KICKOFF*60000); }
function resultComplete(m){ const r=state.results[m.id]; return r && r.status==='Complete' && r.home_score!=='' && r.away_score!=='' && r.home_score!=null && r.away_score!=null; }
function matchById(id){ return MATCHES.find(m=>m.id===String(id)); }
function cleanWinnerName(value){ return (value || '').replace(/^Vinnare:\s*/i,'').replace(/^Förlorare:\s*/i,'').trim(); }
function winnerSide(matchId){
  const m=matchById(matchId), r=state.results[String(matchId)];
  if(!m || !r || r.status!=='Complete') return null;
  const visible = BRACKET_SLOTS[String(matchId)] ? resolvedMatch(m) : m;
  const winner = cleanWinnerName(r.winner || r.winner_name || r.winnerName || '');
  if(winner){
    if(norm(winner)===norm(visible.home) || norm(winner)===norm(m.home)) return 'home';
    if(norm(winner)===norm(visible.away) || norm(winner)===norm(m.away)) return 'away';
    return winner;
  }
  const h=Number(r.home_score), a=Number(r.away_score);
  if(Number.isFinite(h) && Number.isFinite(a) && h!==a) return h>a ? 'home' : 'away';
  return null;
}
function participantFromSlot(slot){
  if(!slot) return '';
  const source=matchById(slot.from);
  if(!source) return '';
  const side=winnerSide(slot.from);
  if(!side) return `${slot.type==='loser'?'Förlorare':'Vinnare'}: ${source.home}/${source.away}`;
  if(side==='home' || side==='away'){
    const winner = side==='home' ? source.home : source.away;
    const loser = side==='home' ? source.away : source.home;
    return slot.type==='loser' ? loser : winner;
  }
  // Om API:t skickar ett vinnarnamn direkt som inte matchar exakt mot hemma/borta.
  if(slot.type==='winner') return side;
  return `${slot.type==='loser'?'Förlorare':'Vinnare'}: ${source.home}/${source.away}`;
}
function resolvedMatch(m){
  const slots=BRACKET_SLOTS[m.id];
  if(!slots) return {...m};
  return {...m, home: participantFromSlot(slots.home) || m.home, away: participantFromSlot(slots.away) || m.away};
}
function isLocked(m){ return new Date() >= lockDate(m) || resultComplete(m); }
function countdownText(m){
  if(resultComplete(m)) return 'Spelad';
  const diff = lockDate(m).getTime() - Date.now();
  if(diff <= 0) return '🔒 Låst';
  const d=Math.floor(diff/86400000), h=Math.floor((diff%86400000)/3600000), min=Math.floor((diff%3600000)/60000);
  if(d>0) return `Låser om ${d}d ${h}h`;
  if(h>0) return `Låser om ${h}h ${min}m`;
  return `Låser om ${min}m`;
}
function apiEnabled(){ return API_URL && API_URL.startsWith('http'); }
async function api(action,payload={}){
  if(!apiEnabled()) return null;
  const res=await fetch(API_URL,{method:'POST',body:JSON.stringify({action,payload}),headers:{'Content-Type':'text/plain'}});
  const data=await res.json();
  if(data && data.ok===false) throw new Error(data.error || 'Fel från backend');
  return data;
}
function mergeCloud(data){
  if(!data) return;
  ['players','predictions','bonus','results','actualBonus'].forEach(k=>{ if(data[k] !== undefined) state[k]=data[k]; });
  saveLocal(); renderAll();
}
async function loadCloud(silent=false){
  if(!apiEnabled()){ if(!silent) toast('Ingen Google Sheets-URL är inlagd i app.js'); return; }
  const data=await api('getAll'); mergeCloud(data); if(!silent) toast('Hämtade sparad data');
}
async function saveCloud(){ if(apiEnabled()) await api('saveAll',state); }

function predictionInputs(prefix,m,vals={},locked=false){
  return `<div class="prediction-box">
    <label>Hemma<input data-${prefix}h="${m.id}" type="number" min="0" inputmode="numeric" placeholder="0" value="${vals.home ?? ''}" ${locked?'disabled':''}></label>
    <span class="dash">–</span>
    <label>Borta<input data-${prefix}a="${m.id}" type="number" min="0" inputmode="numeric" placeholder="0" value="${vals.away ?? ''}" ${locked?'disabled':''}></label>
  </div>`;
}
function getPrediction(playerId, matchId){ return state.predictions.find(p=>p.player_id===playerId && p.match_id===matchId); }
function pointsForPrediction(p,r){
  if(!p || !r || r.status!=='Complete') return 0;
  let pts=0;
  if(p.tip_1x2===outcome(r.home_score,r.away_score)) pts += 2;
  if(Number(p.pred_home)===Number(r.home_score) && Number(p.pred_away)===Number(r.away_score)) pts += 5;
  return pts;
}
function matchRow(m,admin){
  const rm=resolvedMatch(m);
  const r=state.results[m.id]||{};
  const locked=isLocked(m);
  const pid=playerKey();
  const p=pid ? getPrediction(pid,m.id) : null;
  const pts=pointsForPrediction(p,r);
  const div=document.createElement('div');
  div.className=admin?'match-row admin-row':'match-row';
  div.innerHTML=`<div>
    <div class="date">${m.date}</div>
    <div class="result-pill">${m.group}</div>
  </div>
  <div class="teams">${rm.home} – ${rm.away}</div>`;

  if(admin){
    div.innerHTML += `${predictionInputs('r',m,{home:r.home_score,away:r.away_score})}
    <select data-status="${m.id}">
      <option value="Scheduled" ${r.status!=='Complete'?'selected':''}>Ej spelad</option>
      <option value="Complete" ${r.status==='Complete'?'selected':''}>Spelad</option>
    </select>
    <span class="result-pill ${r.status==='Complete'?'played':''}">${r.status==='Complete'?'Poäng räknas':'Poäng räknas ej'}</span>`;
  } else {
    const tipValue=p?.tip_1x2||'';
    const ph=p?.pred_home??'';
    const pa=p?.pred_away??'';
    const resultText = resultComplete(m) ? `Resultat: ${r.home_score}–${r.away_score}` : countdownText(m);
    const tipText = p ? `<div class="my-tip">Ditt tips: <strong>${p.pred_home||'?'}–${p.pred_away||'?'}</strong> (${p.tip_1x2||'ingen 1/X/2'})</div>` : '<div class="my-tip muted">Inget tips sparat ännu</div>';
    const pointText = resultComplete(m) ? `<div class="point-badge ${pts>0?'plus':'zero'}">+${pts} poäng</div>` : '';
    div.innerHTML += `
    <label>1/X/2
      <select class="tip-select" data-tip="${m.id}" ${locked?'disabled':''}>
        <option value="" ${tipValue===''?'selected':''}>Välj</option>
        <option value="1" ${tipValue==='1'?'selected':''}>1 - ${rm.home}</option>
        <option value="X" ${tipValue==='X'?'selected':''}>X - oavgjort</option>
        <option value="2" ${tipValue==='2'?'selected':''}>2 - ${rm.away}</option>
      </select>
    </label>
    ${predictionInputs('p',m,{home:ph,away:pa},locked)}
    <div class="match-status">
      <span class="result-pill ${locked?'locked':''} ${resultComplete(m)?'played':''}">${resultText}</span>
      ${tipText}
      ${pointText}
    </div>`;
  }
  return div;
}

function renderMatches(){
  const wrap=$('#matches'); if(!wrap) return; wrap.innerHTML='';
  const byGroup = MATCHES.reduce((a,m)=>((a[m.group]??=[]).push(m),a),{});
  ['16-delsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Bronsmatch','Final'].filter(g=>byGroup[g]).forEach(g=>{
    const div=document.createElement('div'); div.className='match-group'; div.innerHTML=`<h3 class="group-heading">${g}</h3>`;
    byGroup[g].forEach(m=> div.appendChild(matchRow(m,false)) ); wrap.appendChild(div);
  });
}
function renderAdmin(){
  const wrap=$('#resultsAdmin'); if(!wrap) return; wrap.innerHTML='';
  MATCHES.forEach(m=>wrap.appendChild(matchRow(m,true)));
  $('#actualFinalist1').value=state.actualBonus.finalist1||'';
  $('#actualFinalist2').value=state.actualBonus.finalist2||'';
  $('#actualFinalGoalMinute').value=state.actualBonus.finalGoalMinute||'';
}
function fillPlayerData(){
  const id=playerKey();
  if(!id) return;
  const b=state.bonus.find(x=>x.player_id===id);
  if(b){ $('#finalist1').value=b.finalist1||''; $('#finalist2').value=b.finalist2||''; $('#finalGoalMinute').value=b.finalGoalMinute||''; }
  renderMatches(); renderMyTips();
}
function scorePlayer(player){
  let matchPts=0, exact=0, correctOutcome=0;
  state.predictions.filter(p=>p.player_id===player.id).forEach(p=>{
    const r=state.results[p.match_id];
    if(!r || r.status!=='Complete') return;
    if(p.tip_1x2===outcome(r.home_score,r.away_score)){ matchPts += 2; correctOutcome++; }
    if(Number(p.pred_home)===Number(r.home_score) && Number(p.pred_away)===Number(r.away_score)){ matchPts += 5; exact++; }
  });
  let bonusPts=0; const b=state.bonus.find(x=>x.player_id===player.id);
  if(b){
    const finals=[norm(state.actualBonus.finalist1),norm(state.actualBonus.finalist2)].filter(Boolean);
    if(finals.includes(norm(b.finalist1))) bonusPts += 7;
    if(norm(b.finalist2)!==norm(b.finalist1) && finals.includes(norm(b.finalist2))) bonusPts += 7;
    if(b.finalGoalMinute !== '' && b.finalGoalMinute != null && state.actualBonus.finalGoalMinute !== '' && state.actualBonus.finalGoalMinute != null && Number(b.finalGoalMinute)===Number(state.actualBonus.finalGoalMinute)) bonusPts += 7;
  }
  return {matchPts,bonusPts,total:matchPts+bonusPts,exact,correctOutcome};
}
function leaderboardRows(){
  return state.players.map(p=>({p,...scorePlayer(p)})).sort((a,b)=>b.total-a.total || b.exact-a.exact || b.matchPts-a.matchPts || a.p.name.localeCompare(b.p.name));
}
function renderScoreboard(){
  const body=$('#scoreboardBody'); if(!body) return; body.innerHTML='';
  const rows=leaderboardRows();
  const newRanks={};
  rows.forEach((r,i)=>{
    const rank=i+1; newRanks[r.p.id]=rank;
    const old=previousRanks[r.p.id];
    const movement = old ? (old>rank ? '<span class="up">↑</span>' : old<rank ? '<span class="down">↓</span>' : '<span class="same">–</span>') : '<span class="new">ny</span>';
    const medal = i===0?'🥇':i===1?'🥈':i===2?'🥉':rank;
    body.innerHTML += `<tr>
      <td>${medal}</td><td>${r.p.name} <span class="rank-move">${movement}</span></td>
      <td>${r.matchPts}</td><td>${r.bonusPts}</td><td>${r.exact}</td><td>${r.correctOutcome}</td><td><strong>${r.total}</strong></td>
    </tr>`;
  });
  if(!rows.length) body.innerHTML='<tr><td colspan="7">Inga spelare ännu.</td></tr>';
  previousRanks=newRanks; store.set('previousRanks', previousRanks);
}
function renderMyTips(){
  const wrap=$('#myTipsList'); if(!wrap) return; wrap.innerHTML='';
  const pid=playerKey();
  if(!pid){ wrap.innerHTML='<p class="muted">Skriv ditt namn för att se dina tips.</p>'; return; }
  const played=MATCHES.filter(m=>resultComplete(m));
  if(!played.length){ wrap.innerHTML='<p class="muted">Inga matcher har resultat ännu.</p>'; return; }
  played.forEach(m=>{
    const rm=resolvedMatch(m);
    const r=state.results[m.id]; const p=getPrediction(pid,m.id); const pts=pointsForPrediction(p,r);
    const row=document.createElement('div'); row.className='mini-result';
    row.innerHTML=`<div><strong>${rm.home} – ${rm.away}</strong><br><span class="muted">Resultat: ${r.home_score}–${r.away_score}</span></div>
      <div>${p?`Ditt tips: <strong>${p.pred_home}–${p.pred_away}</strong>`:'Inget tips'}</div>
      <div class="point-badge ${pts>0?'plus':'zero'}">+${pts}</div>`;
    wrap.appendChild(row);
  });
}
function countValues(values){
  const map={};
  values.map(v=>(v||'').trim()).filter(Boolean).forEach(v=>map[v]=(map[v]||0)+1);
  return Object.entries(map).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0]));
}
function statBars(entries,total){
  if(!entries.length) return '<p class="muted">Ingen data ännu.</p>';
  return entries.slice(0,12).map(([name,count])=>{
    const pct = total ? Math.round(count/total*100) : 0;
    return `<div class="statbar"><div class="statbar-top"><strong>${name}</strong><span>${count} tips · ${pct}%</span></div><div class="bar"><span style="width:${pct}%"></span></div></div>`;
  }).join('');
}
function renderStats(){
  const finalStats=$('#finalStats'), minuteStats=$('#minuteStats'), winnerStats=$('#winnerStats');
  if(!finalStats) return;
  const finalists=[]; state.bonus.forEach(b=>{ finalists.push(b.finalist1,b.finalist2); });
  finalStats.innerHTML=statBars(countValues(finalists), finalists.filter(x=>(x||'').trim()).length);
  const minutes=state.bonus.map(b=>b.finalGoalMinute ? String(b.finalGoalMinute) : '');
  minuteStats.innerHTML=statBars(countValues(minutes), minutes.filter(x=>(x||'').trim()).length);
  const finalist1Tips = state.bonus.map(b=>b.finalist1);
  winnerStats.innerHTML=statBars(countValues(finalist1Tips), finalist1Tips.filter(x=>(x||'').trim()).length);
}
function renderDataPreview(){ const el=$('#dataPreview'); if(el) el.textContent=JSON.stringify(state,null,2); }
function renderAll(){ renderMatches(); renderAdmin(); renderScoreboard(); renderMyTips(); renderStats(); renderDataPreview(); }

async function fetchResults(silent=false){
  try{
    let data=null;
    if(RESULT_API_URL){ const res=await fetch(RESULT_API_URL); data=await res.json(); }
    else if(apiEnabled()) data=await api('fetchResults');
    else { if(!silent) toast('Lägg in API_URL eller RESULT_API_URL först'); return; }
    const rows = Array.isArray(data) ? data : (data.results || []);
    let updated=0;
    rows.forEach(x=>{
      const id=String(x.id || x.match_id || x.game_id || ''); if(!id) return;
      const hs=x.home_score ?? x.homeScore ?? x.score_home;
      const as=x.away_score ?? x.awayScore ?? x.score_away;
      const status=x.status || x.state || (hs!=null && as!=null ? 'Complete':'Scheduled');
      if(hs!=null && as!=null){
        const s=String(status).toLowerCase();
        state.results[id]={home_score:Number(hs),away_score:Number(as),status:s.includes('complete')||s.includes('final')||s.includes('finished')||s.includes('spelad')?'Complete':status,winner:x.winner || x.winner_name || x.winnerName || ''};
        updated++;
      }
    });
    saveLocal(); await saveCloud(); renderAll(); if(!silent) toast(`Hämtade ${updated} resultat`);
  }catch(e){ if(!silent) toast('Kunde inte hämta resultat: '+e.message); }
}

function bindEvents(){
  $$('.tab').forEach(btn=>btn.onclick=()=>{ $$('.tab,.view').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $('#'+btn.dataset.view).classList.add('active'); renderAll(); });
  $('#savePredictions').onclick=async()=>{
    try{
      const pid=ensurePlayer();
      const lockedPredictions = state.predictions.filter(p=>{ const m=MATCHES.find(x=>x.id===p.match_id); return p.player_id===pid && m && isLocked(m); });
      state.predictions = state.predictions.filter(p=>p.player_id!==pid);
      state.predictions.push(...lockedPredictions);
      MATCHES.forEach(m=>{
        if(isLocked(m)) return;
        const tip=document.querySelector(`[data-tip="${m.id}"]`).value;
        const ph=document.querySelector(`[data-ph="${m.id}"]`).value;
        const pa=document.querySelector(`[data-pa="${m.id}"]`).value;
        if(tip || ph!=='' || pa!=='') state.predictions.push({player_id:pid,match_id:m.id,tip_1x2:tip,pred_home:ph,pred_away:pa,submitted_at:new Date().toISOString()});
      });
      saveLocal(); await saveCloud(); renderAll(); toast('Tips sparade! Låsta matcher ändrades inte.');
    }catch(e){ toast(e.message); }
  };
  $('#saveBonus').onclick=async()=>{
    try{
      const pid=ensurePlayer();
      state.bonus=state.bonus.filter(b=>b.player_id!==pid);
      state.bonus.push({player_id:pid,finalist1:$('#finalist1').value,finalist2:$('#finalist2').value,finalGoalMinute:$('#finalGoalMinute').value});
      saveLocal(); await saveCloud(); renderAll(); toast('Bonus sparad!');
    }catch(e){toast(e.message)}
  };
  $('#saveResults').onclick=async()=>{
    MATCHES.forEach(m=>{
      const hs=document.querySelector(`[data-rh="${m.id}"]`).value;
      const as=document.querySelector(`[data-ra="${m.id}"]`).value;
      const status=document.querySelector(`[data-status="${m.id}"]`).value;
      state.results[m.id]={home_score:hs,away_score:as,status};
    });
    saveLocal(); await saveCloud(); renderAll(); toast('Resultat sparade!');
  };
  $('#saveActualBonus').onclick=async()=>{ state.actualBonus={finalist1:$('#actualFinalist1').value,finalist2:$('#actualFinalist2').value,finalGoalMinute:$('#actualFinalGoalMinute').value}; saveLocal(); await saveCloud(); renderAll(); toast('Faktisk bonus sparad!'); };
  $('#refreshScoreboard').onclick=()=>renderAll();
  $('#fetchResults').onclick=()=>fetchResults(false); $('#fetchResultsAdmin').onclick=()=>fetchResults(false);
  $('#loadCloud').onclick=()=>loadCloud(false); $('#loadCloudData').onclick=()=>loadCloud(false);
  $('#exportJson').onclick=()=>{ renderDataPreview(); navigator.clipboard?.writeText(JSON.stringify(state,null,2)); toast('Data visas nedan och kopierades om möjligt'); };
  $('#clearLocal').onclick=()=>{ if(confirm('Rensa lokal data i denna webbläsare? Google Sheets påverkas inte.')){ localStorage.clear(); location.reload(); } };
  ['#playerName','#playerEmail'].forEach(s=>$(s)?.addEventListener('change',fillPlayerData));
}

bindEvents();
renderAll();
loadCloud(true).then(()=>fetchResults(true)).catch(()=>{});
setInterval(()=>renderAll(), 60000);
if(AUTO_FETCH_RESULTS) setInterval(()=>fetchResults(true), AUTO_FETCH_INTERVAL_MS);

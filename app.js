// VM-tipset 2026 - v2
// Hemsida: GitHub Pages. Data: Google Sheets via Apps Script.
const API_URL = "https://script.google.com/macros/s/AKfycbyG3FmNDSNo2osdEmmLgrcYR8rPqpd0xBi95x7HMCmpYkIbkG-Hl5RE1cN9maFzi1Ur/exec";

// Valfri extern resultat-endpoint. Format:
// [{id:"53452545", home:"South Africa", away:"Canada", home_score:2, away_score:0, status:"Complete"}, ...]
// Lämna tom om du använder Apps Script. Apps Script kan då hämta från den källa du valt i backend.
const RESULT_API_URL = "";

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

// Tippning på matchresultat gäller bara 16-delsfinalerna.
// Övriga rundor visas i spelträdet och används för bonus/placeringar.
const TIP_ROUND = '16-delsfinal';
const TIP_MATCHES = MATCHES.filter(m => m.group === TIP_ROUND);
const TIP_MATCH_IDS = new Set(TIP_MATCHES.map(m => String(m.id)));
function isTipMatchId(id){ return TIP_MATCH_IDS.has(String(id)); }

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
let isUserEditing = false;
let lastEditAt = 0;
let renderTimer = null;
const DRAFT_KEY_PREFIX = 'vmTipsetDraft:';
const EDIT_GRACE_MS = 30000;

function activeViewId(){ return document.querySelector('.view.active')?.id || ''; }
function draftKey(id=playerKey()){ return id ? DRAFT_KEY_PREFIX + id : null; }
function currentDraft(){ const k=draftKey(); return k ? (store.get(k) || null) : null; }
function markEditing(){ isUserEditing = true; lastEditAt = Date.now(); updateDraftStatus(); }
function canReplaceForms(){ return !isUserEditing || (Date.now() - lastEditAt > EDIT_GRACE_MS); }
function clearEditingSoon(){ setTimeout(()=>{ if(Date.now()-lastEditAt>=EDIT_GRACE_MS){ isUserEditing=false; updateDraftStatus(); } }, EDIT_GRACE_MS + 250); }
function updateDraftStatus(message){
  const el=$('#draftStatus'); if(!el) return;
  const d=currentDraft();
  if(message){ el.textContent=message; el.className='draft-status active'; return; }
  if(d?.dirty){ el.textContent='Osparade ändringar sparade lokalt'; el.className='draft-status warning'; }
  else { el.textContent=''; el.className='draft-status'; }
}
function scheduleRender(){ clearTimeout(renderTimer); renderTimer=setTimeout(()=>{ if(canReplaceForms()) renderAll(); }, 350); }


function saveLocal(){ Object.entries(state).forEach(([k,v])=>store.set(k,v)); }
function collectPredictionDraft(){
  const pid=playerKey(); if(!pid) return null;
  const predictions=[];
  TIP_MATCHES.forEach(m=>{
    const ph=document.querySelector(`[data-ph="${m.id}"]`)?.value ?? '';
    const pa=document.querySelector(`[data-pa="${m.id}"]`)?.value ?? '';
    const po=document.querySelector(`[data-po="${m.id}"]`)?.value || outcome(ph,pa) || '';
    if(ph!=='' || pa!=='' || po!=='') predictions.push({player_id:pid,match_id:m.id,pred_outcome:po,pred_home:ph,pred_away:pa});
  });
  return {
    player_id: pid,
    name: $('#playerName')?.value.trim() || '',
    predictions,
    bonus: {
      semi1:$('#semi1')?.value || '', semi2:$('#semi2')?.value || '', semi3:$('#semi3')?.value || '', semi4:$('#semi4')?.value || '',
      firstPlace:$('#firstPlace')?.value || '', secondPlace:$('#secondPlace')?.value || '', thirdPlace:$('#thirdPlace')?.value || '', firstYellowMinute:$('#firstYellowMinute')?.value || ''
    },
    dirty:true,
    updated_at:new Date().toISOString()
  };
}
function saveDraftFromDom(){ const d=collectPredictionDraft(); if(!d) return; store.set(DRAFT_KEY_PREFIX+d.player_id,d); updateDraftStatus(); }
function markDraftSaved(pid=playerKey(), message='Sparat till Google Sheets'){
  const k=draftKey(pid); if(k){ const d=store.get(k); if(d){ d.dirty=false; d.saved_at=new Date().toISOString(); store.set(k,d); } }
  isUserEditing=false; updateDraftStatus(message); setTimeout(()=>updateDraftStatus(),1600);
}
function clearDraft(pid=playerKey()){ const k=draftKey(pid); if(k) localStorage.removeItem(k); updateDraftStatus('Sparat'); setTimeout(()=>updateDraftStatus(),1600); }


function sortedSimplePreds(list){
  return (list||[]).map(p=>({match_id:String(p.match_id), pred_outcome:p.pred_outcome||'', pred_home:String(p.pred_home??''), pred_away:String(p.pred_away??'')})).sort((a,b)=>a.match_id.localeCompare(b.match_id));
}
function draftMatchesState(pid=playerKey()){
  const d=currentDraft(); if(!d) return true;
  const statePreds=sortedSimplePreds(state.predictions.filter(p=>p.player_id===pid && isTipMatchId(p.match_id)));
  const draftPreds=sortedSimplePreds((d.predictions||[]).filter(p=>isTipMatchId(p.match_id)));
  const b=state.bonus.find(x=>x.player_id===pid) || {};
  const db=d.bonus || {};
  const bonusKeys=['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'];
  return JSON.stringify(statePreds)===JSON.stringify(draftPreds) && bonusKeys.every(k=>(b[k]||'')===(db[k]||''));
}
function updateDraftAfterSave(pid=playerKey(), message='Sparat till Google Sheets'){
  const k=draftKey(pid); const d=k ? store.get(k) : null;
  if(d && draftMatchesState(pid)){ d.dirty=false; d.saved_at=new Date().toISOString(); store.set(k,d); isUserEditing=false; }
  updateDraftStatus(message); setTimeout(()=>updateDraftStatus(),1700);
}
function applyDraftToDom(){
  const d=currentDraft(); if(!d || !d.dirty) return;
  d.predictions?.forEach(p=>{
    const h=document.querySelector(`[data-ph="${p.match_id}"]`); if(h && !h.disabled) h.value=p.pred_home ?? '';
    const a=document.querySelector(`[data-pa="${p.match_id}"]`); if(a && !a.disabled) a.value=p.pred_away ?? '';
    const o=document.querySelector(`[data-po="${p.match_id}"]`); if(o && !o.disabled) o.value=p.pred_outcome || outcome(p.pred_home,p.pred_away) || '';
  });
  const b=d.bonus || {};
  ['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'].forEach(id=>{ const el=$('#'+id); if(el && b[id]!==undefined) el.value=b[id] || ''; });
  updateDraftStatus();
}

function toast(msg){ const t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2600); }
function playerKey(){ const name=$('#playerName')?.value.trim() || ''; return name.toLowerCase(); }
function ensurePlayer(){
  const name=$('#playerName').value.trim();
  if(!name) throw new Error('Skriv ditt namn först.');
  const id=playerKey();
  const existing=state.players.find(p=>p.id===id);
  if(existing){ existing.name=name; }
  else state.players.push({id,name,created_at:new Date().toISOString()});
  return id;
}
function norm(s){ return (s||'').trim().toLowerCase(); }

const FLAG_MAP = {
  'south africa':'🇿🇦','canada':'🇨🇦','brazil':'🇧🇷','japan':'🇯🇵','germany':'🇩🇪','paraguay':'🇵🇾',
  'netherlands':'🇳🇱','morocco':'🇲🇦','ivory coast':'🇨🇮','norway':'🇳🇴','france':'🇫🇷','sweden':'🇸🇪',
  'mexico':'🇲🇽','ecuador':'🇪🇨','england':'🏴','dr congo':'🇨🇩','belgium':'🇧🇪','senegal':'🇸🇳',
  'united states':'🇺🇸','bosnia and herzegovina':'🇧🇦','spain':'🇪🇸','austria':'🇦🇹','portugal':'🇵🇹','croatia':'🇭🇷',
  'switzerland':'🇨🇭','algeria':'🇩🇿','australia':'🇦🇺','egypt':'🇪🇬','argentina':'🇦🇷','cape verde':'🇨🇻',
  'colombia':'🇨🇴','ghana':'🇬🇭'
};
function flagFor(name){ return FLAG_MAP[norm(cleanWinnerName(name))] || '⚽'; }
function teamLabel(name){ const n=displayTeamName ? displayTeamName(name) : cleanWinnerName(name); return `<span class="flag">${flagFor(n)}</span><span>${n}</span>`; }
function formatDateShort(m){
  const d=kickoffDate(m);
  return d.toLocaleString('sv-SE',{weekday:'short', day:'numeric', month:'numeric', hour:'2-digit', minute:'2-digit'}).replace(',', '');
}
function nextMatch(){ return MATCHES.filter(m=>!resultComplete(m)).sort((a,b)=>kickoffDate(a)-kickoffDate(b))[0]; }
function playedCount(){ return MATCHES.filter(m=>resultComplete(m)).length; }

function outcome(h,a){ if(h===''||a===''||h==null||a==null) return ''; h=Number(h); a=Number(a); return h>a?'1':h<a?'2':'X'; }
function kickoffDate(m){ return new Date(m.date.replace(' ', 'T') + ':00'); }
function lockDate(m){ return new Date(kickoffDate(m).getTime() - LOCK_MINUTES_BEFORE_KICKOFF*60000); }
function resultComplete(m){ const r=state.results[m.id]; return r && r.status==='Complete' && r.home_score!=='' && r.away_score!=='' && r.home_score!=null && r.away_score!=null; }
function matchById(id){ return MATCHES.find(m=>m.id===String(id)); }
function cleanWinnerName(value){ return (value || '').replace(/^Vinnare:\s*/i,'').replace(/^Förlorare:\s*/i,'').trim(); }
function sourceMatch(m){
  const r = state.results[String(m.id)] || {};
  return {...m, home: r.home || r.homeTeam || r.home_name || m.home, away: r.away || r.awayTeam || r.away_name || m.away};
}
function winnerSide(matchId){
  const m=matchById(matchId), r=state.results[String(matchId)];
  if(!m || !r || r.status!=='Complete') return null;
  const visible = BRACKET_SLOTS[String(matchId)] ? resolvedMatch(m) : sourceMatch(m);
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
  const source=resolvedMatch(matchById(slot.from));
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
  if(!m) return null;
  const base = sourceMatch(m);
  const slots=BRACKET_SLOTS[m.id];
  if(!slots) return base;
  const r = state.results[String(m.id)] || {};
  return {...base, home: r.home || r.homeTeam || participantFromSlot(slots.home) || base.home, away: r.away || r.awayTeam || participantFromSlot(slots.away) || base.away};
}
function isLocked(m){ return new Date() >= lockDate(m) || resultComplete(m); }
function countdownText(m){
  if(resultComplete(m)) return 'Spelad';
  const diff = lockDate(m).getTime() - Date.now();
  if(diff <= 0) return 'Låst';
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
  saveLocal(); if(canReplaceForms()) renderAll(); else { renderDashboard(); renderScoreboard(); renderBracket(); renderAllTips(); renderStats(); renderDataPreview(); }
}
async function loadCloud(silent=false){
  if(!apiEnabled()){ if(!silent) toast('Ingen Google Sheets-URL är inlagd i app.js'); return; }
  const data=await api('getAll'); mergeCloud(data); if(!silent) toast('Hämtade sparad data');
}
async function saveCloud(){ if(apiEnabled()) await api('saveAll',state); }

function predictionInputs(prefix,m,vals={},locked=false){
  const resultInputs = `<div class="prediction-box">
    <label>Hemma<input data-${prefix}h="${m.id}" type="number" min="0" inputmode="numeric" placeholder="0" value="${vals.home ?? ''}" ${locked?'disabled':''}></label>
    <span class="dash">–</span>
    <label>Borta<input data-${prefix}a="${m.id}" type="number" min="0" inputmode="numeric" placeholder="0" value="${vals.away ?? ''}" ${locked?'disabled':''}></label>
  </div>`;
  if(prefix !== 'p' && prefix !== 'ap') return resultInputs;
  const selected = vals.outcome || '';
  return `<div class="tip-box">
    <label>1X2
      <select data-${prefix}o="${m.id}" class="tip-select" ${locked?'disabled':''}>
        <option value="" ${selected===''?'selected':''}>Välj</option>
        <option value="1" ${selected==='1'?'selected':''}>1</option>
        <option value="X" ${selected==='X'?'selected':''}>X</option>
        <option value="2" ${selected==='2'?'selected':''}>2</option>
      </select>
    </label>
    ${resultInputs}
  </div>`;
}
function getPrediction(playerId, matchId){ return state.predictions.find(p=>p.player_id===playerId && p.match_id===matchId); }
function pointsForPrediction(p,r){
  if(!p || !r || r.status!=='Complete') return 0;
  const exact = Number(p.pred_home)===Number(r.home_score) && Number(p.pred_away)===Number(r.away_score);
  if(exact) return 2;
  const predOutcome = p.pred_outcome || outcome(p.pred_home, p.pred_away);
  return predOutcome && predOutcome === outcome(r.home_score, r.away_score) ? 1 : 0;
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
  <div class="teams">${teamLabel(rm.home)} <span class="versus">–</span> ${teamLabel(rm.away)}</div>`;

  if(admin){
    div.innerHTML += `${predictionInputs('r',m,{home:r.home_score,away:r.away_score})}
    <select data-status="${m.id}">
      <option value="Scheduled" ${r.status!=='Complete'?'selected':''}>Ej spelad</option>
      <option value="Complete" ${r.status==='Complete'?'selected':''}>Spelad</option>
    </select>
    <span class="result-pill ${r.status==='Complete'?'played':''}">${r.status==='Complete'?'Poäng räknas':'Poäng räknas ej'}</span>`;
  } else {
    const ph=p?.pred_home??'';
    const pa=p?.pred_away??'';
    const po=p?.pred_outcome || outcome(ph,pa) || '';
    const resultText = resultComplete(m) ? `Resultat: ${r.home_score}–${r.away_score}` : countdownText(m);
    const tipText = p ? `<div class="my-tip">Ditt tips: <strong>${p.pred_outcome || outcome(p.pred_home,p.pred_away) || '?'} · ${p.pred_home||'?'}–${p.pred_away||'?'}</strong></div>` : '<div class="my-tip muted">Inget tips sparat ännu</div>';
    const pointText = resultComplete(m) ? `<div class="point-badge ${pts>0?'plus':'zero'}">+${pts} poäng</div>` : '';
    div.innerHTML += `
    ${predictionInputs('p',m,{home:ph,away:pa,outcome:po},locked)}
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
  const div=document.createElement('div');
  div.className='match-group';
  div.innerHTML=`<h3 class="group-heading">16-delsfinaler</h3><p class="muted">Här tippar ni 1X2 och exakt resultat. Efter 16-delsfinalen tippar ni inte fler matchresultat.</p>`;
  TIP_MATCHES.forEach(m=> div.appendChild(matchRow(m,false)) );
  wrap.appendChild(div);
}
function renderAdmin(){
  const wrap=$('#resultsAdmin'); if(!wrap) return; wrap.innerHTML='';
  MATCHES.forEach(m=>wrap.appendChild(matchRow(m,true)));
  $('#actualSemi1').value=state.actualBonus.semi1||'';
  $('#actualSemi2').value=state.actualBonus.semi2||'';
  $('#actualSemi3').value=state.actualBonus.semi3||'';
  $('#actualSemi4').value=state.actualBonus.semi4||'';
  $('#actualFirstPlace').value=state.actualBonus.firstPlace||'';
  $('#actualSecondPlace').value=state.actualBonus.secondPlace||'';
  $('#actualThirdPlace').value=state.actualBonus.thirdPlace||'';
  $('#actualFirstYellowMinute').value=state.actualBonus.firstYellowMinute||state.actualBonus.finalGoalMinute||'';
  renderAdminTips();
}
function adminPlayerKey(){ return ($('#adminPlayerName')?.value || '').trim().toLowerCase(); }
function getOrCreateNamedPlayer(rawName){
  const name=(rawName||'').trim();
  if(!name) throw new Error('Skriv deltagarens namn först.');
  const id=name.toLowerCase();
  const existing=state.players.find(p=>p.id===id);
  if(existing) existing.name=name;
  else state.players.push({id,name,created_at:new Date().toISOString(), added_by_admin:true});
  return id;
}
function adminTipRow(m, p){
  const rm=resolvedMatch(m);
  const ph=p?.pred_home??'';
  const pa=p?.pred_away??'';
  const po=p?.pred_outcome || outcome(ph,pa) || '';
  const div=document.createElement('div');
  div.className='match-row admin-tip-row';
  div.innerHTML=`<div>
    <div class="date">${m.date}</div>
    <div class="result-pill">${m.group}</div>
  </div>
  <div class="teams">${teamLabel(rm.home)} <span class="versus">–</span> ${teamLabel(rm.away)}</div>
  ${predictionInputs('ap',m,{home:ph,away:pa,outcome:po},false)}
  <div class="result-pill">Admin kan ändra även låst</div>`;
  return div;
}
function renderAdminTips(){
  const wrap=$('#adminTipsMatches'); if(!wrap) return;
  const pid=adminPlayerKey();
  wrap.innerHTML='';
  if(!pid){ wrap.innerHTML='<p class="muted">Skriv ett namn för att visa 16-delsfinalerna.</p>'; return; }
  const div=document.createElement('div');
  div.className='match-group admin-tip-group';
  div.innerHTML=`<h4 class="group-heading">16-delsfinaler</h4><p class="muted">Admin lägger bara in 1X2 och resultat för 16-delsfinalerna.</p>`;
  TIP_MATCHES.forEach(m=> div.appendChild(adminTipRow(m, getPrediction(pid,m.id))) );
  wrap.appendChild(div);
}

function setBonusForm(b={}){
  ['semi1','semi2','semi3','semi4','firstPlace','secondPlace','thirdPlace','firstYellowMinute'].forEach(id=>{
    const el=$('#'+id);
    if(!el) return;
    el.value = (id==='firstYellowMinute' ? (b.firstYellowMinute || b.finalGoalMinute || '') : (b[id] || ''));
  });
}
function fillPlayerData(){
  const id=playerKey();
  if(!id) return;
  const b=state.bonus.find(x=>x.player_id===id);
  setBonusForm(b || {});
  isUserEditing = false;
  renderMatches();
  applyDraftToDom();
  renderMyTips();
}
function collectAndStoreCurrentPlayerTips({includeLocked=false}={}){
  const pid=ensurePlayer();
  const lockedPredictions = state.predictions.filter(p=>{
    const m=TIP_MATCHES.find(x=>x.id===String(p.match_id));
    return p.player_id===pid && m && isLocked(m);
  });
  state.predictions = state.predictions.filter(p=>p.player_id!==pid);
  if(!includeLocked) state.predictions.push(...lockedPredictions);
  TIP_MATCHES.forEach(m=>{
    if(!includeLocked && isLocked(m)) return;
    const ph=document.querySelector(`[data-ph="${m.id}"]`)?.value ?? '';
    const pa=document.querySelector(`[data-pa="${m.id}"]`)?.value ?? '';
    const po=document.querySelector(`[data-po="${m.id}"]`)?.value || outcome(ph,pa);
    if(ph!=='' || pa!=='' || po!=='') state.predictions.push({player_id:pid,match_id:m.id,pred_outcome:po,pred_home:ph,pred_away:pa,submitted_at:new Date().toISOString()});
  });
  state.bonus=state.bonus.filter(b=>b.player_id!==pid);
  state.bonus.push({
    player_id:pid,
    semi1:$('#semi1')?.value || '', semi2:$('#semi2')?.value || '', semi3:$('#semi3')?.value || '', semi4:$('#semi4')?.value || '',
    firstPlace:$('#firstPlace')?.value || '', secondPlace:$('#secondPlace')?.value || '', thirdPlace:$('#thirdPlace')?.value || '', firstYellowMinute:$('#firstYellowMinute')?.value || ''
  });
  return pid;
}
async function saveCurrentPlayerAll(){
  const pid=collectAndStoreCurrentPlayerTips();
  saveLocal();
  await saveCloud();
  updateDraftAfterSave(pid, 'Allt sparat till Google Sheets');
  renderAll();
  toast('Allt sparat!');
}
function scorePlayer(player){
  let matchPts=0, exact=0, outcomeRight=0;
  state.predictions.filter(p=>p.player_id===player.id && isTipMatchId(p.match_id)).forEach(p=>{
    const r=state.results[p.match_id];
    if(!r || r.status!=='Complete') return;
    const pts = pointsForPrediction(p,r);
    matchPts += pts;
    if(pts===2) exact++;
    else if(pts===1) outcomeRight++;
  });
  let bonusPts=0; const b=state.bonus.find(x=>x.player_id===player.id);
  if(b){
    const actualSemis = [state.actualBonus.semi1,state.actualBonus.semi2,state.actualBonus.semi3,state.actualBonus.semi4].map(norm).filter(Boolean);
    const tipSemis = [b.semi1,b.semi2,b.semi3,b.semi4].map(norm).filter(Boolean);
    const uniqueTipSemis = [...new Set(tipSemis)];
    bonusPts += uniqueTipSemis.filter(team=>actualSemis.includes(team)).length * 2;
    if(norm(b.thirdPlace) && norm(b.thirdPlace)===norm(state.actualBonus.thirdPlace)) bonusPts += 3;
    if(norm(b.secondPlace) && norm(b.secondPlace)===norm(state.actualBonus.secondPlace)) bonusPts += 4;
    if(norm(b.firstPlace) && norm(b.firstPlace)===norm(state.actualBonus.firstPlace)) bonusPts += 5;
  }
  return {matchPts,bonusPts,total:matchPts+bonusPts,exact,outcomeRight};
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
      <td>${r.matchPts}</td><td>${r.bonusPts}</td><td>${r.exact}</td><td>${r.outcomeRight}</td><td><strong>${r.total}</strong></td>
    </tr>`;
  });
  if(!rows.length) body.innerHTML='<tr><td colspan="7">Inga spelare ännu.</td></tr>';
  previousRanks=newRanks; store.set('previousRanks', previousRanks);
}
function renderMyTips(){
  const profile=$('#myTipsProfile');
  const wrap=$('#myTipsList'); if(!wrap) return; wrap.innerHTML='';
  const pid=playerKey();
  if(!pid){ if(profile) profile.innerHTML=''; wrap.innerHTML='<p class="muted">Skriv ditt namn för att se dina tips.</p>'; return; }
  const player=state.players.find(p=>p.id===pid) || {id:pid,name:$('#playerName')?.value.trim()||'Du'};
  const score=scorePlayer(player);
  const rows=leaderboardRows();
  const rank=rows.findIndex(r=>r.p.id===pid)+1;
  if(profile){
    profile.innerHTML=`<div class="profile-card card">
      <div><p class="eyebrow-dark">Mina tips</p><h2>Hej ${player.name}!</h2><p class="muted">Din placering och dina poäng uppdateras när resultat sparas.</p></div>
      <div class="profile-stats">
        <div><strong>${score.total}</strong><span>poäng</span></div>
        <div><strong>${rank>0?rank:'–'}</strong><span>placering</span></div>
        <div><strong>${score.exact}</strong><span>exakta</span></div>
      </div>
    </div>`;
  }
  const played=TIP_MATCHES.filter(m=>resultComplete(m));
  if(!played.length){ wrap.innerHTML='<p class="muted">Inga matcher har resultat ännu.</p>'; return; }
  played.forEach(m=>{
    const rm=resolvedMatch(m);
    const r=state.results[m.id]; const p=getPrediction(pid,m.id); const pts=pointsForPrediction(p,r);
    const row=document.createElement('div'); row.className='mini-result';
    row.innerHTML=`<div><strong>${teamLabel(rm.home)} <span class="versus">–</span> ${teamLabel(rm.away)}</strong><br><span class="muted">Resultat: ${r.home_score}–${r.away_score}</span></div>
      <div>${p?`Ditt tips: <strong>${p.pred_outcome || outcome(p.pred_home,p.pred_away) || '?'} · ${p.pred_home}–${p.pred_away}</strong>`:'Inget tips'}</div>
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
  const podium=[]; state.bonus.forEach(b=>{ podium.push(b.semi1,b.semi2,b.semi3,b.semi4,b.firstPlace,b.secondPlace,b.thirdPlace); });
  finalStats.innerHTML=statBars(countValues(podium), podium.filter(x=>(x||'').trim()).length);
  const minutes=state.bonus.map(b=>b.firstYellowMinute || b.finalGoalMinute ? String(b.firstYellowMinute || b.finalGoalMinute) : '');
  minuteStats.innerHTML=statBars(countValues(minutes), minutes.filter(x=>(x||'').trim()).length);
  const winnerTips = state.bonus.map(b=>b.firstPlace);
  winnerStats.innerHTML=statBars(countValues(winnerTips), winnerTips.filter(x=>(x||'').trim()).length);
}
function displayTeamName(name){
  const cleaned = cleanWinnerName(name || '');
  if(!cleaned) return 'Ännu inte avgjort';
  if(/^vinnare match/i.test(cleaned) || /^vinnare kvartsfinal/i.test(cleaned) || /^vinnare semifinal/i.test(cleaned) || /^förlorare semifinal/i.test(cleaned)) return 'Ännu inte avgjort';
  return cleaned;
}
function teamLine(m, side){
  const r = state.results[m.id] || {};
  const rm = resolvedMatch(m);
  const name = displayTeamName(rm[side]);
  const winner = resultComplete(m) && winnerSide(m.id) === side;
  const loser = resultComplete(m) && !winner;
  const score = resultComplete(m) ? (side==='home' ? r.home_score : r.away_score) : '';
  return `<div class="bracket-team ${winner?'winner':''} ${loser?'loser':''}"><span class="team-name">${teamLabel(name)}</span><strong>${score}</strong></div>`;
}
function bracketCard(m){
  const status = resultComplete(m) ? 'Klar' : (new Date() > kickoffDate(m) ? 'Live' : 'Kommande');
  return `<div class="bracket-card ${resultComplete(m)?'complete':''}">
    <div class="bracket-meta"><span>${formatDateShort(m)}</span><em>${status}</em></div>
    ${teamLine(m,'home')}
    ${teamLine(m,'away')}
  </div>`;
}
function renderBracket(){
  const wrap = $('#bracketTree'); if(!wrap) return;
  const rounds = [
    ['16-delsfinal', MATCHES.filter(m=>m.group==='16-delsfinal')],
    ['Åttondelsfinal', MATCHES.filter(m=>m.group==='Åttondelsfinal')],
    ['Kvartsfinal', MATCHES.filter(m=>m.group==='Kvartsfinal')],
    ['Semifinal', MATCHES.filter(m=>m.group==='Semifinal')],
    ['Final/Brons', MATCHES.filter(m=>m.group==='Final' || m.group==='Bronsmatch')]
  ];
  wrap.innerHTML = rounds.map(([title,matches], idx)=>`<div class="bracket-round round-${idx}">
    <h3>${title}</h3>
    <div class="bracket-matches">${matches.map(bracketCard).join('')}</div>
  </div>`).join('');
}
function renderDashboard(){
  const el=$('#dashboard'); if(!el) return;
  const rows=leaderboardRows();
  const nm=nextMatch();
  const played=playedCount();
  const pct=Math.round((played/MATCHES.length)*100);
  const nextHtml=nm ? `<div class="next-match-card"><div class="muted">Nästa match</div><h3>${teamLabel(resolvedMatch(nm).home)} <span class="versus">–</span> ${teamLabel(resolvedMatch(nm).away)}</h3><p>${formatDateShort(nm)}</p><button class="primary" onclick="document.querySelector('[data-view=tips]').click()">Tippa nu</button></div>` : `<div class="next-match-card"><h3>Turneringen är färdig</h3></div>`;
  const top=rows.slice(0,5).map((r,i)=>`<div class="leader-row"><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><strong>${r.p.name}</strong><em>${r.total} p</em></div>`).join('') || '<p class="muted">Inga deltagare ännu.</p>';
  el.innerHTML=`<div class="dashboard-grid">
    <div class="card hero-card"><p class="eyebrow-dark">Översikt</p><h2>VM-tipset 2026</h2><div class="kpi-grid"><div><strong>${state.players.length}</strong><span>deltagare</span></div><div><strong>${played}</strong><span>matcher spelade</span></div><div><strong>${pct}%</strong><span>klart</span></div></div><div class="progress"><span style="width:${pct}%"></span></div></div>
    <div class="card">${nextHtml}</div>
    <div class="card"><div class="section-title compact"><h2>Topplista</h2><button onclick="document.querySelector('[data-view=scoreboard]').click()">Visa allt</button></div>${top}</div>
  </div>`;
}
function renderAllTips(){
  const wrap=$('#allTipsList'); if(!wrap) return; wrap.innerHTML='';
  if(!state.players.length){ wrap.innerHTML='<div class="card"><p class="muted">Inga spelare ännu.</p></div>'; return; }
  wrap.innerHTML=state.players.map(player=>{
    const score=scorePlayer(player);
    const bonus=state.bonus.find(b=>b.player_id===player.id) || {};
    const playedTips=TIP_MATCHES.map(m=>{
      const rm=resolvedMatch(m), p=getPrediction(player.id,m.id), r=state.results[m.id];
      const pts=pointsForPrediction(p,r);
      return `<div class="all-tip-row"><span>${teamLabel(rm.home)} – ${teamLabel(rm.away)}</span><strong>${p?`${p.pred_outcome || outcome(p.pred_home,p.pred_away) || '?'} · ${p.pred_home||'?'}–${p.pred_away||'?'}`:'–'}</strong>${r&&r.status==='Complete'?`<em>+${pts}</em>`:''}</div>`;
    }).join('');
    return `<details class="card all-tip-card"><summary><span><strong>${player.name}</strong><small>${score.total} poäng</small></span><span class="point-badge plus">Visa tips</span></summary>
      <div class="bonus-summary"><strong>Bonus:</strong> Semi: ${(bonus.semi1||'–')}, ${(bonus.semi2||'–')}, ${(bonus.semi3||'–')}, ${(bonus.semi4||'–')} · Guld: ${bonus.firstPlace||'–'} · Silver: ${bonus.secondPlace||'–'} · Brons: ${bonus.thirdPlace||'–'} · Gult kort: ${bonus.firstYellowMinute||'–'}</div>
      <div class="all-tip-list">${playedTips}</div>
    </details>`;
  }).join('');
}

function renderDataPreview(){ const el=$('#dataPreview'); if(el) el.textContent=JSON.stringify(state,null,2); }
function renderAll(){ renderMatches(); renderAdmin(); renderBracket(); renderDashboard(); renderScoreboard(); renderMyTips(); renderAllTips(); renderStats(); renderDataPreview(); applyDraftToDom(); }

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
      const s=String(status).toLowerCase();
      const next={...(state.results[id] || {})};
      if(x.home || x.homeTeam || x.home_name) next.home = x.home || x.homeTeam || x.home_name;
      if(x.away || x.awayTeam || x.away_name) next.away = x.away || x.awayTeam || x.away_name;
      if(hs!=null && as!=null){ next.home_score=Number(hs); next.away_score=Number(as); }
      next.status=s.includes('complete')||s.includes('final')||s.includes('finished')||s.includes('spelad')?'Complete':status;
      next.winner=x.winner || x.winner_name || x.winnerName || next.winner || '';
      state.results[id]=next;
      updated++;
    });
    saveLocal(); await saveCloud(); renderAll(); if(!silent) toast(`Hämtade ${updated} resultat`);
  }catch(e){ if(!silent) toast('Kunde inte hämta resultat: '+e.message); }
}

function bindEvents(){
  $$('.tab').forEach(btn=>btn.onclick=()=>{ $$('.tab,.view').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $('#'+btn.dataset.view).classList.add('active'); renderAll(); });
  $('#themeToggle') && ($('#themeToggle').onclick=()=>{ document.body.classList.toggle('dark'); localStorage.setItem('theme', document.body.classList.contains('dark')?'dark':'light'); $('#themeToggle').textContent=document.body.classList.contains('dark')?'Ljust läge':'Mörkt läge'; });
  $('#refreshAllTips') && ($('#refreshAllTips').onclick=()=>renderAllTips());
  $('#adminPlayerName') && ($('#adminPlayerName').oninput=()=>renderAdminTips());
  $('#saveAdminPredictions') && ($('#saveAdminPredictions').onclick=async()=>{
    try{
      const pid=getOrCreateNamedPlayer($('#adminPlayerName').value);
      state.predictions = state.predictions.filter(p=>p.player_id!==pid);
      TIP_MATCHES.forEach(m=>{
        const ph=document.querySelector(`[data-aph="${m.id}"]`)?.value ?? '';
        const pa=document.querySelector(`[data-apa="${m.id}"]`)?.value ?? '';
        const po=document.querySelector(`[data-apo="${m.id}"]`)?.value || outcome(ph,pa);
        if(ph!=='' || pa!=='' || po!=='') state.predictions.push({player_id:pid,match_id:m.id,pred_outcome:po,pred_home:ph,pred_away:pa,submitted_at:new Date().toISOString(), submitted_by_admin:true});
      });
      saveLocal(); await saveCloud(); renderAll(); toast('Tips sparade åt deltagaren.');
    }catch(e){ toast(e.message); }
  });

  document.addEventListener('input', e=>{
    const t=e.target;
    if(!t) return;
    const isTipInput = t.matches('[data-ph],[data-pa],[data-po],#semi1,#semi2,#semi3,#semi4,#firstPlace,#secondPlace,#thirdPlace,#firstYellowMinute');
    if(isTipInput){ markEditing(); saveDraftFromDom(); clearEditingSoon(); }
  });
  let nameTimer=null;
  $('#playerName')?.addEventListener('input', ()=>{
    updateDraftStatus();
    clearTimeout(nameTimer);
    nameTimer=setTimeout(()=>fillPlayerData(), 350);
  });
  $('#playerName')?.addEventListener('change', ()=>fillPlayerData());

  $('#savePredictions').onclick=async()=>{
    try{ await saveCurrentPlayerAll(); }catch(e){ toast(e.message); }
  };
  $('#saveBonus').onclick=async()=>{
    try{ await saveCurrentPlayerAll(); }catch(e){ toast(e.message); }
  };
  $('#saveResults').onclick=async()=>{
    MATCHES.forEach(m=>{
      const hs=document.querySelector(`[data-rh="${m.id}"]`).value;
      const as=document.querySelector(`[data-ra="${m.id}"]`).value;
      const status=document.querySelector(`[data-status="${m.id}"]`).value;
      const current=state.results[m.id] || {};
      state.results[m.id]={...current,home_score:hs,away_score:as,status};
    });
    saveLocal(); await saveCloud(); renderAll(); toast('Resultat sparade!');
  };
  $('#saveActualBonus').onclick=async()=>{ state.actualBonus={semi1:$('#actualSemi1').value,semi2:$('#actualSemi2').value,semi3:$('#actualSemi3').value,semi4:$('#actualSemi4').value,firstPlace:$('#actualFirstPlace').value,secondPlace:$('#actualSecondPlace').value,thirdPlace:$('#actualThirdPlace').value,firstYellowMinute:$('#actualFirstYellowMinute').value}; saveLocal(); await saveCloud(); renderAll(); toast('Faktisk bonus sparad!'); };
  $('#refreshScoreboard').onclick=()=>renderAll();
  $('#fetchResults').onclick=()=>fetchResults(false); $('#fetchResultsAdmin').onclick=()=>fetchResults(false); $('#fetchResultsBracket') && ($('#fetchResultsBracket').onclick=()=>fetchResults(false));
  $('#loadCloud').onclick=()=>loadCloud(false); $('#loadCloudData').onclick=()=>loadCloud(false);
  $('#exportJson').onclick=()=>{ renderDataPreview(); navigator.clipboard?.writeText(JSON.stringify(state,null,2)); toast('Data visas nedan och kopierades om möjligt'); };
  $('#clearLocal').onclick=()=>{ if(confirm('Rensa lokal data i denna webbläsare? Google Sheets påverkas inte.')){ localStorage.clear(); location.reload(); } };
}

if(localStorage.getItem('theme')==='dark'){ document.body.classList.add('dark'); }
if($('#themeToggle')) $('#themeToggle').textContent=document.body.classList.contains('dark')?'Ljust läge':'Mörkt läge';
bindEvents();
renderAll();
loadCloud(true).then(()=>fetchResults(true)).catch(()=>{});
setInterval(()=>{ if(canReplaceForms()) renderAll(); }, 60000);
if(AUTO_FETCH_RESULTS) setInterval(()=>{ if(canReplaceForms()) fetchResults(true); }, AUTO_FETCH_INTERVAL_MS);

// VM-tipset 2026 – V5 read-only frontend.
// Byt API_URL till din Apps Script Web App URL efter deploy.
const API_URL = 'https://script.google.com/macros/s/AKfycbwGuMmcrc4LKg7BJ1Vai4ePpW3kYkbq60ia73omdiDsnIfglab4gwJe32-MWz0RB4Me/exec';
const AUTO_REFRESH_MS = 60 * 1000;
const AUTO_RESULT_REFRESH_MS = 5 * 60 * 1000;

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

let state = {
  players: [],
  predictions: [],
  bonus: [],
  results: {},
  actualBonus: {},
  scoreboard: [],
  matches: [],
  stats: {},
  comment: '',
  lastUpdated: null
};

const FLAGS = {
  'south africa':'🇿🇦','canada':'🇨🇦','brazil':'🇧🇷','japan':'🇯🇵','germany':'🇩🇪','paraguay':'🇵🇾','netherlands':'🇳🇱','morocco':'🇲🇦','ivory coast':'🇨🇮','norway':'🇳🇴','france':'🇫🇷','sweden':'🇸🇪','mexico':'🇲🇽','ecuador':'🇪🇨','england':'🏴','dr congo':'🇨🇩','belgium':'🇧🇪','senegal':'🇸🇳','united states':'🇺🇸','bosnia and herzegovina':'🇧🇦','spain':'🇪🇸','austria':'🇦🇹','portugal':'🇵🇹','croatia':'🇭🇷','switzerland':'🇨🇭','algeria':'🇩🇿','australia':'🇦🇺','egypt':'🇪🇬','argentina':'🇦🇷','cape verde':'🇨🇻','colombia':'🇨🇴','ghana':'🇬🇭'
};

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

function apiEnabled(){ return API_URL && API_URL.startsWith('https://script.google.com/'); }
async function api(action){
  if(!apiEnabled()) throw new Error('Lägg in Apps Script Web App URL i app.js först.');
  const res = await fetch(API_URL, { method:'POST', headers:{'Content-Type':'text/plain'}, body:JSON.stringify({action}) });
  const data = await res.json();
  if(data.ok === false) throw new Error(data.error || 'Fel från Apps Script');
  return data;
}
function toast(msg){ const el=$('#toast'); el.textContent=msg; el.classList.add('show'); setTimeout(()=>el.classList.remove('show'),2600); }
function norm(v){
  return String(v||'')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9åäöéüñç]+/g,' ')
    .trim();
}
function clean(v){ return String(v||'').replace(/^Vinnare:\s*/i,'').replace(/^Förlorare:\s*/i,'').trim(); }

const TEAM_SV = {
  'south africa':'Sydafrika', 'canada':'Kanada', 'brazil':'Brasilien', 'japan':'Japan',
  'germany':'Tyskland', 'paraguay':'Paraguay', 'netherlands':'Nederländerna', 'morocco':'Marocko',
  'ivory coast':'Elfenbenskusten', 'cote d ivoire':'Elfenbenskusten', 'norway':'Norge',
  'france':'Frankrike', 'sweden':'Sverige', 'mexico':'Mexiko', 'ecuador':'Ecuador',
  'england':'England', 'dr congo':'Kongo DR', 'congo dr':'Kongo DR', 'belgium':'Belgien',
  'senegal':'Senegal', 'united states':'USA', 'usa':'USA',
  'bosnia and herzegovina':'Bosnien-Hercegovina', 'bosnia-herzegovina':'Bosnien-Hercegovina',
  'spain':'Spanien', 'austria':'Österrike', 'portugal':'Portugal', 'croatia':'Kroatien',
  'switzerland':'Schweiz', 'algeria':'Algeriet', 'australia':'Australien', 'egypt':'Egypten',
  'argentina':'Argentina', 'cape verde':'Kap Verde', 'colombia':'Colombia', 'ghana':'Ghana',
  'sydafrika':'Sydafrika', 'kanada':'Kanada', 'brasilien':'Brasilien', 'tyskland':'Tyskland',
  'nederlanderna':'Nederländerna', 'marocko':'Marocko', 'elfenbenskusten':'Elfenbenskusten',
  'norge':'Norge', 'frankrike':'Frankrike', 'sverige':'Sverige', 'mexiko':'Mexiko',
  'kongo dr':'Kongo DR', 'belgien':'Belgien', 'bosnien hercegovina':'Bosnien-Hercegovina',
  'spanien':'Spanien', 'osterrike':'Österrike', 'kroatien':'Kroatien', 'schweiz':'Schweiz',
  'algeriet':'Algeriet', 'australien':'Australien', 'egypten':'Egypten', 'kap verde':'Kap Verde'
};

const TEAM_FLAGS = {
  'south africa':'🇿🇦','sydafrika':'🇿🇦','canada':'🇨🇦','kanada':'🇨🇦','brazil':'🇧🇷','brasilien':'🇧🇷',
  'japan':'🇯🇵','germany':'🇩🇪','tyskland':'🇩🇪','paraguay':'🇵🇾','netherlands':'🇳🇱','nederlanderna':'🇳🇱',
  'morocco':'🇲🇦','marocko':'🇲🇦','ivory coast':'🇨🇮','cote d ivoire':'🇨🇮','elfenbenskusten':'🇨🇮',
  'norway':'🇳🇴','norge':'🇳🇴','france':'🇫🇷','frankrike':'🇫🇷','sweden':'🇸🇪','sverige':'🇸🇪',
  'mexico':'🇲🇽','mexiko':'🇲🇽','ecuador':'🇪🇨','england':'🏴','dr congo':'🇨🇩','congo dr':'🇨🇩','kongo dr':'🇨🇩',
  'belgium':'🇧🇪','belgien':'🇧🇪','senegal':'🇸🇳','united states':'🇺🇸','usa':'🇺🇸',
  'bosnia and herzegovina':'🇧🇦','bosnia-herzegovina':'🇧🇦','bosnien hercegovina':'🇧🇦',
  'spain':'🇪🇸','spanien':'🇪🇸','austria':'🇦🇹','osterrike':'🇦🇹','portugal':'🇵🇹',
  'croatia':'🇭🇷','kroatien':'🇭🇷','switzerland':'🇨🇭','schweiz':'🇨🇭','algeria':'🇩🇿','algeriet':'🇩🇿',
  'australia':'🇦🇺','australien':'🇦🇺','egypt':'🇪🇬','egypten':'🇪🇬','argentina':'🇦🇷',
  'cape verde':'🇨🇻','kap verde':'🇨🇻','colombia':'🇨🇴','ghana':'🇬🇭'
};

function translateTeam(name){
  const raw = clean(name);
  if(!raw) return '';
  const n = norm(raw);
  if(TEAM_SV[n]) return TEAM_SV[n];
  if(raw.includes('/')) return raw.split('/').map(x => translateTeam(x)).join('/');
  return raw;
}
function translatePlaceholder(text){
  return String(text||'').split('/').map(part => translateTeam(part.trim())).join(' / ');
}
function flag(name){
  const n = norm(clean(name));
  return TEAM_FLAGS[n] || '';
}
function teamHTML(name){
  const raw = String(name||'').trim();
  const display = displayName(raw);
  const isPending = /^Vinnare:|^Förlorare:|^Ännu/i.test(display);
  const icon = isPending ? '⏳' : (flag(display) || '⚽');
  return `<span class="team-label ${isPending?'pending-team':''}"><span class="team-flag">${icon}</span><span>${display}</span></span>`;
}
function displayName(name){
  const raw = String(name||'').trim();
  if(!raw) return 'Ännu inte avgjort';
  if(/^Vinnare:\s*/i.test(raw)) return 'Vinnare: ' + translatePlaceholder(raw.replace(/^Vinnare:\s*/i,''));
  if(/^Förlorare:\s*/i.test(raw)) return 'Förlorare: ' + translatePlaceholder(raw.replace(/^Förlorare:\s*/i,''));
  const roundWinner = raw.match(/^Round of (32|16)\s+(\d+)\s+Winner$/i);
  if(roundWinner) return `Vinnare match ${roundWinner[2]}`;
  const roundLoser = raw.match(/^Round of (32|16)\s+(\d+)\s+Loser$/i);
  if(roundLoser) return `Förlorare match ${roundLoser[2]}`;
  const qfWinner = raw.match(/^Quarterfinal\s+(\d+)\s+Winner$/i);
  if(qfWinner) return `Vinnare kvartsfinal ${qfWinner[1]}`;
  const sfWinner = raw.match(/^Semifinal\s+(\d+)\s+Winner$/i);
  if(sfWinner) return `Vinnare semifinal ${sfWinner[1]}`;
  const sfLoser = raw.match(/^Semifinal\s+(\d+)\s+Loser$/i);
  if(sfLoser) return `Förlorare semifinal ${sfLoser[1]}`;
  return translateTeam(raw);
}
function match(id){ return state.matches.find(m=>String(m.id)===String(id)); }
function result(id){ return state.results[String(id)] || {}; }
function isComplete(id){ const r=result(id); return r.status==='Complete' && r.home_score!=='' && r.away_score!=='' && r.home_score!=null && r.away_score!=null; }
function kickoff(m){ return new Date(String(m.date).replace(' ','T') + ':00'); }
function outcome(h,a){ h=Number(h); a=Number(a); if(h>a) return '1'; if(h<a) return '2'; if(h===a) return 'X'; return ''; }
function winnerSide(id){
  const m=resolvedMatch(match(id)); const r=result(id);
  if(!m || !isComplete(id)) return null;
  const w=clean(r.winner);
  if(w && (norm(w)===norm(m.home) || norm(translateTeam(w))===norm(translateTeam(m.home)))) return 'home';
  if(w && (norm(w)===norm(m.away) || norm(translateTeam(w))===norm(translateTeam(m.away)))) return 'away';
  const h=Number(r.home_score), a=Number(r.away_score);
  if(h>a) return 'home';
  if(a>h) return 'away';
  return null;
}
function participantFromSlot(slot){
  if(!slot) return '';
  const source=resolvedMatch(match(slot.from));
  if(!source) return '';
  const side=winnerSide(slot.from);
  if(!side){
    const sourceHome = displayName(source.home);
    const sourceAway = displayName(source.away);
    return `${slot.type==='loser'?'Förlorare':'Vinnare'}: ${sourceHome}/${sourceAway}`;
  }
  const winner = side==='home' ? source.home : source.away;
  const loser = side==='home' ? source.away : source.home;
  return slot.type==='loser' ? loser : winner;
}
function resolvedMatch(m){
  if(!m) return null;
  const r=result(m.id);
  const slots=BRACKET_SLOTS[String(m.id)];
  if(!slots) return {...m, home:r.home || m.home, away:r.away || m.away};
  return {...m, home:r.home || participantFromSlot(slots.home) || m.home, away:r.away || participantFromSlot(slots.away) || m.away};
}
function prediction(playerId, matchId){ return state.predictions.find(p=>String(p.player_id)===String(playerId) && String(p.match_id)===String(matchId)); }
function scoreForPoints(r){
  // Poäng räknas på 90 minuter. Slutresultatet home_score/away_score används fortfarande för trädet.
  return {
    home: r.home_score_90 !== '' && r.home_score_90 !== undefined ? r.home_score_90 : r.home_score,
    away: r.away_score_90 !== '' && r.away_score_90 !== undefined ? r.away_score_90 : r.away_score
  };
}
function pointsForPrediction(p,r){
  if(!p || !r || r.status!=='Complete') return 0;
  const s=scoreForPoints(r);
  const exact=Number(p.pred_home)===Number(s.home) && Number(p.pred_away)===Number(s.away);
  if(exact) return 2;
  const po=String(p.pred_outcome || outcome(p.pred_home,p.pred_away)).toUpperCase();
  return po && po===outcome(s.home,s.away) ? 1 : 0;
}
function statBars(items,total){
  if(!items || !items.length) return '<p class="muted">Ingen data ännu.</p>';
  const max=Math.max(...items.map(x=>Number(x.value||0)),1);
  return items.slice(0,8).map(x=>{
    const pct=Math.round(Number(x.value||0)/max*100);
    const share=total ? ` · ${Math.round(Number(x.value||0)/total*100)}%` : '';
    return `<div class="stat-row"><div><strong>${flag(x.name) || '⚽'} ${displayName(x.name)}</strong><div class="bar"><span style="width:${pct}%"></span></div></div><em>${x.value}${share}</em></div>`;
  }).join('');
}

function renderDashboard(){
  const el=$('#dashboard');
  const played=state.matches.filter(m=>isComplete(m.id)).length;
  const pct=state.matches.length ? Math.round(played/state.matches.length*100) : 0;
  const next=state.matches.filter(m=>!isComplete(m.id)).sort((a,b)=>kickoff(a)-kickoff(b))[0];
  const top=(state.scoreboard||[]).slice(0,5).map((r,i)=>`<div class="leader-row"><span>${i+1}</span><strong>${r.name}</strong><em>${r.total_points} p</em></div>`).join('') || '<p class="muted">Inga deltagare ännu.</p>';
  const nextHtml=next ? `<p class="muted">Nästa match</p><h3>${teamHTML(resolvedMatch(next).home)} <span class="versus">–</span> ${teamHTML(resolvedMatch(next).away)}</h3><p>${kickoff(next).toLocaleString('sv-SE',{weekday:'short',day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'})}</p>` : '<h3>Turneringen är färdig</h3>';
  el.innerHTML=`<div class="dashboard-grid">
    <div class="card hero-card"><p class="muted">Översikt</p><h2>VM-tipset 2026</h2><div class="kpi-grid"><div><strong>${state.players.length}</strong><span>deltagare</span></div><div><strong>${played}</strong><span>matcher spelade</span></div><div><strong>${pct}%</strong><span>klart</span></div></div><div class="progress"><span style="width:${pct}%"></span></div></div>
    <div class="card ai-card"><h3>Senaste läget</h3><p>${state.comment || 'Laddar kommentar...'}</p></div>
    <div class="card">${nextHtml}</div>
    <div class="card"><h3>Topp 5</h3>${top}</div>
    <div class="card"><h3>Mest tippad världsmästare</h3>${statBars(state.stats.champion, state.bonus.length)}</div>
    <div class="card"><h3>Mest tippade semifinalister</h3>${statBars(state.stats.semifinalists, state.bonus.length*4)}</div>
  </div>`;
}
function renderScoreboard(){
  const body=$('#scoreboardBody');
  body.innerHTML=(state.scoreboard||[]).map(r=>`<tr><td>${r.rank}</td><td><strong>${r.name}</strong></td><td>${r.match_points}</td><td>${r.bonus_points}</td><td>${r.exact_results}</td><td>${r.outcome_results}</td><td><strong>${r.total_points}</strong></td></tr>`).join('') || '<tr><td colspan="7">Inga deltagare.</td></tr>';
}
function teamStatusText(m, side, done, win){
  if(!done) return '';
  if(win === side){
    if(m.group === 'Final') return 'Världsmästare';
    if(m.group === 'Bronsmatch') return 'Brons';
    if(m.group === 'Semifinal') return 'Till final';
    return 'Går vidare';
  }
  if(m.group === 'Semifinal') return 'Till bronsmatch';
  if(m.group === 'Final') return 'Silver';
  if(m.group === 'Bronsmatch') return 'Fyra';
  return 'Utslagen';
}
function teamRow(m, side, name, score, done, win){
  const status = teamStatusText(m, side, done, win);
  const rowClass = win===side ? 'winner' : (done ? 'loser' : '');
  return `<div class="team ${rowClass}">
    <div class="team-main">
      ${teamHTML(name)}
      ${status ? `<small class="team-sub">${status}</small>` : ''}
    </div>
    <strong class="score">${done ? score : ''}</strong>
  </div>`;
}
function bracketCard(m){
  const rm=resolvedMatch(m), r=result(m.id), done=isComplete(m.id), win=winnerSide(m.id);
  const winnerName = done && win ? displayName(win==='home' ? rm.home : rm.away) : '';
  return `<div class="bracket-card ${done?'complete':''}">
    <div class="bracket-meta"><span>${m.group}</span><em>${done?'Klar':'Kommande'}</em></div>
    ${teamRow(m, 'home', rm.home, r.home_score, done, win)}
    ${teamRow(m, 'away', rm.away, r.away_score, done, win)}
    ${winnerName ? `<div class="advance-note">${m.group==='Final'?'Vinnare':'Vidare'}: <strong>${winnerName}</strong></div>` : ''}
  </div>`;
}
function renderBracket(){
  const groups=['16-delsfinal','Åttondelsfinal','Kvartsfinal','Semifinal','Bronsmatch','Final'];
  $('#bracketTree').innerHTML=groups.map(g=>`<div class="round"><h3>${g}</h3>${state.matches.filter(m=>m.group===g).map(bracketCard).join('')}</div>`).join('');
}
function renderAllTips(){
  const tipIds = new Set(state.matches.filter(m=>m.group==='16-delsfinal').map(m=>String(m.id)));
  $('#allTipsList').innerHTML=(state.players||[]).map(p=>{
    const sc=(state.scoreboard||[]).find(r=>String(r.player_id)===String(p.player_id||p.id)) || {total_points:0};
    const b=(state.bonus||[]).find(x=>String(x.player_id)===String(p.player_id||p.id)) || {};
    const tips=state.matches.filter(m=>tipIds.has(String(m.id))).map(m=>{
      const pr=prediction(p.player_id||p.id,m.id), r=result(m.id), pts=pointsForPrediction(pr,r), rm=resolvedMatch(m);
      return `<div class="all-tip-row"><span>${teamHTML(rm.home)} – ${teamHTML(rm.away)}</span><strong>${pr?`${pr.pred_outcome||outcome(pr.pred_home,pr.pred_away)||'?'} · ${pr.pred_home}–${pr.pred_away}`:'–'}</strong>${isComplete(m.id)?`<em>+${pts}</em>`:''}</div>`;
    }).join('');
    return `<details class="card all-tip-card"><summary><span><strong>${p.name||p.player_id}</strong><small>${sc.total_points} poäng</small></span><span class="badge">Visa tips</span></summary><div class="bonus-summary"><strong>Bonus:</strong> Semi: ${b.semi1||'–'}, ${b.semi2||'–'}, ${b.semi3||'–'}, ${b.semi4||'–'} · Guld: ${b.firstPlace||'–'} · Silver: ${b.secondPlace||'–'} · Brons: ${b.thirdPlace||'–'} · Gult kort: ${b.firstYellowMinute||'–'}</div><div class="all-tip-list">${tips}</div></details>`;
  }).join('') || '<div class="card"><p class="muted">Inga tips inlästa.</p></div>';
}
function renderStats(){
  $('#winnerStats').innerHTML=statBars(state.stats.champion, state.bonus.length);
  $('#semiStats').innerHTML=statBars(state.stats.semifinalists, state.bonus.length*4);
  $('#outcomeStats').innerHTML=statBars(state.stats.best1x2, null);
  $('#exactStats').innerHTML=statBars(state.stats.bestExact, null);
  $('#aiComment').innerHTML=`<p>${state.comment || 'Ingen kommentar ännu.'}</p>`;
}
function renderData(){ $('#dataPreview').textContent=JSON.stringify(state,null,2); }
function renderAll(){ renderDashboard(); renderScoreboard(); renderBracket(); renderAllTips(); renderStats(); renderData(); $('#updatedAt').textContent=state.lastUpdated ? `Senast uppdaterad: ${state.lastUpdated.toLocaleTimeString('sv-SE')}` : ''; }
async function loadData(silent=false){
  try{
    const data=await api('getAll');
    state={...state,...data,lastUpdated:new Date()};
    renderAll();
    if(!silent) toast('Uppdaterat från Google Sheets');
  }catch(e){ if(!silent) toast(e.message); }
}
async function refreshResults(){
  try{ await api('refreshResults'); await loadData(true); toast('Resultat och scoreboard uppdaterade'); }
  catch(e){ toast(e.message); }
}
function bind(){
  $$('.tab').forEach(btn=>btn.onclick=()=>{ $$('.tab,.view').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); $('#'+btn.dataset.view).classList.add('active'); renderAll(); });
  $('#refreshBtn').onclick=()=>loadData(false);
  $('#refreshResultsBtn').onclick=()=>refreshResults();
  $('#themeBtn').onclick=()=>{ document.body.classList.toggle('dark'); localStorage.setItem('theme',document.body.classList.contains('dark')?'dark':'light'); $('#themeBtn').textContent=document.body.classList.contains('dark')?'Ljust läge':'Mörkt läge'; };
}
if(localStorage.getItem('theme')==='dark') document.body.classList.add('dark');
bind(); renderAll(); loadData(true);
setInterval(()=>loadData(true), AUTO_REFRESH_MS);
setInterval(()=>refreshResults(), AUTO_RESULT_REFRESH_MS);

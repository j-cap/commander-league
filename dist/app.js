const $ = id => document.getElementById(id);
const live = location.pathname !== '/demo';
let state, pending, busy = false;
const number = x => Number(x).toLocaleString('de-AT',{maximumFractionDigits:2});
async function api(path,payload){const r=await fetch('/api/'+path,{method:payload===undefined?'GET':'POST',credentials:'same-origin',headers:payload===undefined?{}:{'Content-Type':'application/json'},body:payload===undefined?undefined:JSON.stringify(payload)});const v=await r.json();if(!r.ok)throw Error(v.error||'Verbindung fehlgeschlagen.');return v;}
async function rpc(name,payload){if(name==='saveGame'){const v=await api('results',payload);if(v.status!=='applied')throw Error('Speicherstatus: '+v.status);history.replaceState(null,'','/entry');}const s=await api('league');if(!['owner','manager'].includes(s.me.role))throw Error('Nur Manager dürfen Ergebnisse erfassen. Die Rangliste findest du unter „Zur Liga“.');const id=Number(new URLSearchParams(location.search).get('game'));s.game=id?s.games.find(g=>g.id===id):s.game;s.baseline=s.game?.baseline||s.totals;return s;}
function demo(){return {players:['Spieler A','Spieler B','Spieler C','Spieler D','Spieler E','Spieler F'],totals:[12,8,6,4,3,0],played:[5,5,4,3,2,0],game:{id:24,day:9,date:'26.09.2026',mode:'Pro Spiel'},rules:{start:7,low:3,high:6,normal:1,midFactor:1.5,highFactor:2,awards:[3,2,1]},baseline:[12,8,6,4,3,0],revision:'demo'};}
function make(tag,text,cls){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;return node;}
function render(){
  $('connection').textContent=live?'Mit Google Sheets verbunden':'DEMO · Fiktive Spieler und Punkte. Speichern gilt nur für diese Sitzung; die Google-Tabelle bleibt unverändert.';
  $('game').replaceChildren(make('option',state.game?`${state.game.date} · Spieltag ${state.game.day} · Spiel ${state.game.id}`:'Keine freien Spiele vorbereitet'));
  $('mode').textContent=state.game?`Handicap: ${state.game.mode.toLowerCase()}`:'';
  $('players').replaceChildren();
  state.players.forEach((name,i)=>{const row=make('div',undefined,'player');const label=make('label');const check=make('input');check.type='checkbox';check.dataset.index=i;label.append(check,make('span',name));const select=make('select');select.id=`rank-${i}`;select.setAttribute('aria-label',`Platz für ${name}`);select.disabled=true;select.append(new Option('—',''));for(let k=1;k<=state.players.length;k++)select.append(new Option(String(k),String(k)));check.addEventListener('change',()=>{select.disabled=!check.checked;invalidate();});select.addEventListener('change',invalidate);row.append(label,select);$('players').append(row);});
  $('standings').replaceChildren();
  state.players.map((name,i)=>({name,points:state.totals[i],played:state.played[i]})).sort((a,b)=>b.points-a.points||a.name.localeCompare(b.name)).forEach(p=>{const row=make('div',undefined,'standing');const rank=1+state.totals.filter(v=>v>p.points+1e-9).length;const name=make('div',p.name,'name');name.append(make('small',`${p.played} Spiele`));row.append(make('span',String(rank),'rank'),name,make('strong',number(p.points)));$('standings').append(row);});
  $('review').disabled=!state.game||state.writeBlocked; $('reason-label').hidden=!state.game?.complete;$('reason').required=!!state.game?.complete;if(state.writeBlocked)$('message').textContent='Ein Speichervorgang muss vom Ligabesitzer geprüft werden.';
}
function invalidate(){pending=null;$('preview').hidden=true;$('message').textContent='';}
$('game-form').addEventListener('submit',event=>{event.preventDefault();if(busy)return;invalidate();try{
  const entries=[...$('players').querySelectorAll('input:checked')].map(c=>({player:Number(c.dataset.index),rank:Number($(`rank-${c.dataset.index}`).value)}));
  const scored=League.score(entries,state.rules.awards);const lead=Math.max(...state.baseline);
  $('preview-rows').replaceChildren();scored.forEach(e=>{const factor=League.factor(lead-state.baseline[e.player],state.game.day,state.rules);const row=make('tr');[state.players[e.player],number(e.base),`×${number(factor)}`,number(e.base*factor)].forEach(v=>row.append(make('td',v)));$('preview-rows').append(row);});
  pending={gameId:state.game.id,revision:state.revision,entries,reason:$('reason').value,operationId:crypto.randomUUID()};$('save').textContent=live?'Ergebnis speichern':'Demo-Ergebnis speichern';$('preview').hidden=false;
}catch(error){$('message').textContent=error.message;}});
$('save').addEventListener('click',async()=>{if(!pending||busy)return;busy=true;$('save').disabled=true;$('review').disabled=true;const request=pending;
try{if(live){state=await rpc('saveGame',request);}else{League.score(request.entries,state.rules.awards).forEach(e=>{state.totals[e.player]+=e.base*League.factor(Math.max(...state.baseline)-state.baseline[e.player],state.game.day,state.rules);state.played[e.player]++;});state.game.id++;state.baseline=[...state.totals];}
invalidate();render();$('message').textContent=live?'Gespeichert. Die Rangliste ist aktualisiert.':'Demo gespeichert. Neuladen setzt die Beispieldaten zurück.';
}catch(error){$('message').textContent=error.message+' Lade die Seite neu, um den aktuellen Stand zu prüfen.';}finally{busy=false;$('save').disabled=false;$('review').disabled=!state.game||state.writeBlocked;}});
$('reason').addEventListener('input',invalidate);
(async()=>{try{state=live?await rpc('getLeague'):demo();render();}catch(error){$('connection').textContent='Verbindung fehlgeschlagen: '+error.message;}})();

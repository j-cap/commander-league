const $ = id => document.getElementById(id);
const live = typeof google !== 'undefined' && google.script && google.script.run;
let state, pending, busy = false;
const number = x => Number(x).toLocaleString('de-AT',{maximumFractionDigits:2});
const rpc = (name, payload) => new Promise((resolve,reject) => { const runner = google.script.run.withSuccessHandler(resolve).withFailureHandler(reject); if (payload === undefined) runner[name](); else runner[name](payload); });
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
  $('review').disabled=!state.game; if(state.sheetUrl){$('sheet-link').href=state.sheetUrl;$('sheet-link').hidden=false;}
}
function invalidate(){pending=null;$('preview').hidden=true;$('message').textContent='';}
$('game-form').addEventListener('submit',event=>{event.preventDefault();if(busy)return;invalidate();try{
  const entries=[...$('players').querySelectorAll('input:checked')].map(c=>({player:Number(c.dataset.index),rank:Number($(`rank-${c.dataset.index}`).value)}));
  const scored=League.score(entries,state.rules.awards);const lead=Math.max(...state.baseline);
  $('preview-rows').replaceChildren();scored.forEach(e=>{const factor=League.factor(lead-state.baseline[e.player],state.game.day,state.rules);const row=make('tr');[state.players[e.player],number(e.base),`×${number(factor)}`,number(e.base*factor)].forEach(v=>row.append(make('td',v)));$('preview-rows').append(row);});
  pending={gameId:state.game.id,revision:state.revision,entries};$('save').textContent=live?'In Google Sheets speichern':'Demo-Ergebnis speichern';$('preview').hidden=false;
}catch(error){$('message').textContent=error.message;}});
$('save').addEventListener('click',async()=>{if(!pending||busy)return;busy=true;$('save').disabled=true;$('review').disabled=true;const request=pending;
try{if(live){state=await rpc('saveGame',request);}else{League.score(request.entries,state.rules.awards).forEach(e=>{state.totals[e.player]+=e.base*League.factor(Math.max(...state.baseline)-state.baseline[e.player],state.game.day,state.rules);state.played[e.player]++;});state.game.id++;state.baseline=[...state.totals];}
invalidate();render();$('message').textContent=live?'Gespeichert. Die Rangliste ist aktualisiert.':'Demo gespeichert. Neuladen setzt die Beispieldaten zurück.';
}catch(error){$('message').textContent=error.message+' Lade die Seite neu, um den aktuellen Stand zu prüfen. Bereits gespeicherte Ergebnisse werden nicht überschrieben.';}finally{busy=false;$('save').disabled=false;$('review').disabled=!state.game;}});
(async()=>{try{state=live?await rpc('getLeague'):demo();render();}catch(error){$('connection').textContent='Verbindung fehlgeschlagen: '+error.message;}})();

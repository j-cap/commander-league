function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index').setTitle('Commander League').addMetaTag('viewport','width=device-width, initial-scale=1');
}
function workbook_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw Error('SPREADSHEET_ID in den Projekteinstellungen hinterlegen.');
  return SpreadsheetApp.openById(id);
}
function snapshot_(book) {
  const sheet = book.getSheetByName('Spiele');
  const rulesSheet = book.getSheetByName('Regeln');
  if (!sheet || !rulesSheet || !book.getSheetByName('Wertung')) throw Error('Spiele, Regeln oder Wertung fehlt.');
  const headers = sheet.getRange(1,1,1,14).getValues()[0];
  if(headers[0]!=='Spiel-ID'||headers[3]!=='Handicap-Modus'||headers[12]!=='Grundsumme'||headers[13]!=='Prüfung') throw Error('Die Tabellenstruktur stimmt nicht mit dieser App-Version überein.');
  const players = headers.slice(4,12);
  if(players.some(p=>typeof p!=='string'||!p)||new Set(players).size!==8) throw Error('Acht eindeutige Spielernamen werden benötigt.');
  const values = rulesSheet.getRange('B2:B12').getValues().flat();
  const rules={start:values[0],low:values[1],high:values[2],normal:values[3],midFactor:values[4],highFactor:values[5],awards:values.slice(8,11)};
  if([...Object.values(rules).filter(v=>!Array.isArray(v)),...rules.awards].some(v=>typeof v!=='number'||!Number.isFinite(v))||rules.low<0||rules.high<rules.low||rules.normal<=0||rules.midFactor<=0||rules.highFactor<=0) throw Error('Ungültige Regeln.');
  const rows=sheet.getRange(2,1,35,14).getValues();
  let totals=players.map(()=>0),played=players.map(()=>0),dayStart=totals.slice(),previousDay=null,next=null,seenBlank=false;
  const ids=new Set();
  rows.forEach((r,i)=>{
    if(!Number.isInteger(r[0])||ids.has(r[0])||!Number.isInteger(r[2])||r[2]<1||!(r[1] instanceof Date)||!['Pro Spiel','Pro Spieltag'].includes(r[3])) throw Error('Spiel-ID, Datum, Spieltag oder Modus prüfen.');
    ids.add(r[0]);
    if(previousDay!==null&&r[2]<previousDay)throw Error('Spiele müssen chronologisch geordnet sein.');
    if(r[2]!==previousDay){dayStart=totals.slice();previousDay=r[2];}
    const base=r.slice(4,12);const filled=base.some(v=>v!=='');
    if(!filled){seenBlank=true;if(!next)next={id:r[0],day:r[2],date:Utilities.formatDate(r[1],book.getSpreadsheetTimeZone(),'dd.MM.yyyy'),mode:r[3],row:i+2,baseline:(r[3]==='Pro Spieltag'?dayStart:totals).slice()};return;}
    if(seenBlank)throw Error('Eine leere Spielzeile liegt vor einem bereits gespielten Spiel. Bitte zuerst in Spiele klären.');
    if(r[13]!=='OK'||base.filter(v=>typeof v==='number').length<3||base.some(v=>v!==''&&(typeof v!=='number'||v<0||v>3))||Math.abs(base.reduce((s,v)=>s+(v===''?0:v),0)-rules.awards.reduce((a,b)=>a+b,0))>1e-8)throw Error('Unvollständiges oder ungültiges Ergebnis in Spiele, Zeile '+(i+2)+'.');
    const baseline=r[3]==='Pro Spieltag'?dayStart:totals.slice();const leader=Math.max(...baseline);
    base.forEach((v,j)=>{if(v!==''){totals[j]+=v*League.factor(leader-baseline[j],r[2],rules);played[j]++;}});
  });
  const trail=book.getSheetByName('Wertung').getRange('C2:K281').getValues();
  const sheetTotals=players.map(name=>trail.filter(r=>r[0]===name).reduce((s,r)=>s+(typeof r[7]==='number'?r[7]:0),0));
  if(totals.some((v,i)=>Math.abs(v-sheetTotals[i])>1e-7))throw Error('App und Wertung weichen voneinander ab. Bitte Formeln prüfen.');
  const revision=Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify([headers,rows,values])));
  return {players,totals,played,rules,game:next?{id:next.id,day:next.day,date:next.date,mode:next.mode}:null,baseline:next?next.baseline:totals,revision,sheetUrl:book.getUrl(),nextRow:next?next.row:null};
}
function getLeague(){const result=snapshot_(workbook_());delete result.nextRow;return result;}
function saveGame(payload){
  const lock=LockService.getScriptLock();lock.waitLock(15000);
  try{
    const book=workbook_();const state=snapshot_(book);
    if(!payload||!state.game||payload.gameId!==state.game.id||payload.revision!==state.revision)throw Error('Der Tabellenstand hat sich geändert. Neu laden und Punkte erneut prüfen.');
    if(!Array.isArray(payload.entries)||payload.entries.some(e=>!Number.isInteger(e.player)||e.player<0||e.player>=state.players.length))throw Error('Ungültige Teilnehmer.');
    const scores=League.score(payload.entries,state.rules.awards);const base=state.players.map(()=> '');scores.forEach(e=>base[e.player]=e.base);
    const sheet=book.getSheetByName('Spiele');const range=sheet.getRange(state.nextRow,5,1,8);
    if(range.getValues()[0].some(v=>v!==''))throw Error('Dieses Spiel ist bereits erfasst.');
    range.setValues([base]);SpreadsheetApp.flush();
    const result=snapshot_(book);delete result.nextRow;return result;
  }finally{lock.releaseLock();}
}

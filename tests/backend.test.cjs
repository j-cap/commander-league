const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');
function fixture(){
 const names=Array.from({length:8},(_,i)=>'P'+i);const header=['Spiel-ID','Datum','Spieltag','Handicap-Modus',...names,'Grundsumme','Prüfung'];
 const rows=Array.from({length:35},(_,i)=>[i+1,new Date('2026-09-26T12:00:00Z'),9,'Pro Spiel',...Array(8).fill(''),'','']);
 let writes=0,releases=0;const sheet={getRange(a,b,c,d){if(a===1)return{getValues:()=>[header]};if(b===1)return{getValues:()=>rows};return{getValues:()=>[rows[a-2].slice(4,12)],setValues(v){writes++;rows[a-2].splice(4,8,...v[0]);rows[a-2][13]='OK';}};}};
 const rules=[7,3,6,1,1.5,2,6,1e-9,3,2,1];
 const trail={getRange(){return{getValues:()=>rows.flatMap(r=>names.map((name,j)=>[name,0,0,0,0,0,0,typeof r[j+4]==='number'?r[j+4]:0,0]))};}};
 const book={getSheetByName:n=>n==='Spiele'?sheet:n==='Regeln'?{getRange:()=>({getValues:()=>rules.map(v=>[v])})}:trail,getSpreadsheetTimeZone:()=> 'Europe/Vienna',getUrl:()=> 'https://example.test/sheet'};
 const context=vm.createContext({Date,PropertiesService:{getScriptProperties:()=>({getProperty:()=> 'test'})},SpreadsheetApp:{openById:()=>book,flush(){}},LockService:{getScriptLock:()=>({waitLock(){},releaseLock(){releases++;}})},Utilities:{formatDate:()=> '26.09.2026',DigestAlgorithm:{SHA_256:1},computeDigest:(_,x)=>x,base64EncodeWebSafe:x=>x}});
 vm.runInContext(fs.readFileSync('dist/scoring.js','utf8')+'\n'+fs.readFileSync('apps-script/Code.gs','utf8'),context);
 return{context,rows,get writes(){return writes},get releases(){return releases}};
}
test('save writes only base points, preserves absences and rejects repeat',()=>{const f=fixture();const s=f.context.getLeague();const p={gameId:1,revision:s.revision,entries:[{player:0,rank:1},{player:1,rank:2},{player:2,rank:2},{player:3,rank:4}]};const result=f.context.saveGame(p);assert.deepEqual(Array.from(f.rows[0].slice(4,12)),[3,1.5,1.5,0,'','','','']);assert.equal(result.game.id,2);assert.throws(()=>f.context.saveGame(p),/geändert/);assert.equal(f.writes,1);assert.equal(f.releases,2);});
test('stale preview cannot write',()=>{const f=fixture();const s=f.context.getLeague();f.rows[0][3]='Pro Spieltag';assert.throws(()=>f.context.saveGame({gameId:1,revision:s.revision,entries:[]}),/geändert/);assert.equal(f.writes,0);});
test('invalid player IDs and rankings cannot write',()=>{const f=fixture();const s=f.context.getLeague();assert.throws(()=>f.context.saveGame({gameId:1,revision:s.revision,entries:[{player:99,rank:1}]}),/Teilnehmer/);assert.equal(f.writes,0);});

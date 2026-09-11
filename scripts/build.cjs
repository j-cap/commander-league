const fs = require('node:fs');
const assets = {};
for(const name of ['index.html','portal.html','app.js','portal.js','scoring.js','style.css','access.css','join.svg']){
 const type=name.endsWith('.html')?'text/html; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':name.endsWith('.svg')?'image/svg+xml':'text/css; charset=utf-8';
 assets['/'+name]={type,content:fs.readFileSync('dist/'+name,'utf8')};
}
fs.writeFileSync('server/scoring.mjs',fs.readFileSync('dist/scoring.js','utf8').replace("if (typeof module !== 'undefined') module.exports = League;","export { League };"));
fs.writeFileSync('server/assets.mjs','export const assets = '+JSON.stringify(assets)+';\n');
fs.mkdirSync('dist/server',{recursive:true});
for(const name of fs.readdirSync('server').filter(n=>n.endsWith('.mjs')))fs.copyFileSync('server/'+name,'dist/server/'+(name==='index.mjs'?'index.js':name));
fs.mkdirSync('dist/.openai',{recursive:true});
fs.copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
fs.cpSync('drizzle','dist/.openai/drizzle',{recursive:true});

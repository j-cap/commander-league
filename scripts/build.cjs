const fs = require('node:fs');
const html = fs.readFileSync('dist/index.html','utf8').replace('<link rel="stylesheet" href="style.css">',()=>'<style>'+fs.readFileSync('dist/style.css','utf8')+'</style>').replace('<script src="scoring.js"></script>',()=>'<script>'+fs.readFileSync('dist/scoring.js','utf8')+'</script>').replace('<script src="app.js"></script>',()=>'<script>'+fs.readFileSync('dist/app.js','utf8')+'</script>');
fs.writeFileSync('apps-script/Index.html',html);
fs.writeFileSync('apps-script/Scoring.gs',fs.readFileSync('dist/scoring.js'));

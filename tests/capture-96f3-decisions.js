'use strict';
// One short canonical replay obtains the original decisions which predate the
// existing 96F.2 snapshots. No policy or RNG is replaced.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const base=path.resolve(__dirname,'../..'),dir=path.join(base,'star96f1/tests'),out=path.join(__dirname,'fixtures/96f3');fs.mkdirSync(out,{recursive:true});
let src=fs.readFileSync(path.join(dir,'campaign-96f1.js'),'utf8');src=src.slice(0,src.indexOf("const old=mode==='candidate'?"));src=src.replace("path.join(__dirname,'audit96f1/campaigns')",JSON.stringify(path.join(__dirname,'audit96f3'))).replace('m<120','m<19');
src=src.replace("h.run(fs.readFileSync(path.join(__dirname,'diagnostics-96f1.js'),'utf8'));",`h.run(fs.readFileSync(path.join(__dirname,'diagnostics-96f1.js'),'utf8'));h.sb.captureF3=(day,raw)=>fs.writeFileSync(path.join(${JSON.stringify(out)},'96F1-11-turn-'+day+'-1.save'),raw);h.run('var originalTurnF3=aiTurn;aiTurn=function(e){if(e.id===1&&[330,450,570].includes(G.day))captureF3(G.day,serialize());return originalTurnF3(e)}');`);
src+=`\nconst r=run(${JSON.stringify(path.join(base,'star96f1'))},'canonical-early');const expected=JSON.parse(fs.readFileSync(path.join(__dirname,'audit96f1/campaigns/96F1-11.json')));assert.deepEqual(r.monthly,expected.monthly.slice(0,19));console.log('19-month canonical replay matches every original monthly state; 330/450/570 snapshots captured.');`;
process.argv[2]='11';new Function('require','__dirname',src)(require('module').createRequire(path.join(dir,'campaign-96f1.js')),dir);

'use strict';
// Isolated ABBA on copies of one Save8. No installed game source is modified.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {runtime}=require('../../tests/helpers/runtime');
const [file,count='10']=process.argv.slice(2),txt=fs.readFileSync(file,'utf8'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const d={file:path.basename(file),input:sha(txt),runs:[]};
for(const arm of ['base','pilot','pilot','base']){
 const h=runtime();h.sb.txt=txt;assert(h.run('deserialize(txt)'));h.run(`G.autoSave=false;var eligible=null;
 function advance(){const b=Math.floor(G.day/30);for(let i=0;i<61&&!G.over;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b){monthTick();return;}}}`);
 if(arm==='pilot'){const f=h.run('influenceAt.toString()'),v=f.replace('of G.sys','of (eligible||G.sys)');assert.notEqual(f,v);h.run(v+`;
 for(const k of ['explorationContext','reinforcementThreats']){const fn=globalThis[k];globalThis[k]=function(...a){if(eligible)return fn.apply(this,a);
 eligible=G.sys.filter(s=>s.owner>=0&&s._reach);try{return fn.apply(this,a);}finally{eligible=null;}};}`);}
 h.run('advance()');const rows=[];for(let i=0;i<+count;i++){const t=performance.now();h.run('advance()');const ms=performance.now()-t;
 rows.push({ms,sha:sha(h.run('serialize()')),rng:h.run('RND_STATE'),day:h.run('G.day')});}d.runs.push({arm,rows});}
for(const run of d.runs)for(const [i,x] of run.rows.entries()){const y=d.runs[0].rows[i];assert.deepEqual([x.sha,x.day,x.rng],[y.sha,y.day,y.rng]);}
fs.writeFileSync(path.join(__dirname,'raw','pilot-'+path.basename(file,'.save')+'.json'),JSON.stringify(d));

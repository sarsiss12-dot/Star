'use strict';
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {readFileSync}=require('node:fs');
const {runtime}=require('../../tests/helpers/runtime');
const {gunzipSync}=require('node:zlib');
const path=require('node:path');

const [control,candidate,...files]=process.argv.slice(2);
const sha=s=>createHash('sha256').update(s).digest('hex');
function replay(root,raw){
 const h=runtime({root:path.resolve(root)});
 h.sb.input=raw;
 assert(h.run('deserialize(input)'));
 const before=h.run('serialize()'),rngBefore=h.run('RND_STATE');
 h.run(`G.autoSave=false;G.speed=0;{
  const m=Math.floor(G.day/30);
  do{G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);}while(Math.floor(G.day/30)===m);
  monthTick();
 }`);
 const after=h.run('serialize()'),rngAfter=h.run('RND_STATE');
 return {before,after,rngBefore,rngAfter};
}
const result=files.map(file=>{
 const data=readFileSync(file),raw=(file.endsWith('.gz')?gunzipSync(data):data).toString('utf8');
 const a=replay(control,raw),b=replay(candidate,raw);
 assert.equal(sha(a.before),sha(b.before),file+' yükleme Save8');
 assert.equal(sha(a.after),sha(b.after),file+' bir ay Save8');
 assert.equal(a.rngBefore,b.rngBefore,file+' yükleme RNG');
 assert.equal(a.rngAfter,b.rngAfter,file+' bir ay RNG');
 return {file:path.basename(file),input:sha(raw),before:sha(a.before),after:sha(a.after),rngBefore:a.rngBefore,rngAfter:a.rngAfter};
});
console.log(JSON.stringify(result,null,2));

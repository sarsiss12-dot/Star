'use strict';
const {runtime}=require('../../tests/helpers/runtime');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const [save,tag,advance='0']=process.argv.slice(2);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const input=fs.readFileSync(save,'utf8'),data={sha256:hash(input),arms:[]};
for(const enabled of [false,true]){
 const h=runtime();h.sb.raw=input;h.run('if(!deserialize(raw))throw Error("Save8")');
 // Kişilikleri ve dünyayı yeniden üretmeden yalnız mevcut ayar kapısını aç.
 const personas=h.run('JSON.stringify(G.emps.map(e=>e.mizac))');
 if(enabled)h.run('G.cfg.aiRivals=rivalPreset("orta",aiCountFor(G.cfg))');
 const rows=JSON.parse(h.run(`JSON.stringify((()=>{const r=[];for(const f of G.feds)for(const id of f.members)for(const e of G.emps){
 if(!e.ai||e.dead||e.wild||e.crisisSide||findFed(e)||!e.contact[id])continue;const via=G.emps[id],vote=aiFedAdmissionScore(via,e,f.type,f),join=aiFedWilling(e,via,f.type,f);
 r.push({fid:f.id,id:e.id,via:id,legal:canRequestFederation(e,via).ok,join,vote:vote.score,penalty:aiFedConcentration(e,f,e.id),votePenalty:aiFedConcentration(via,f,e.id)});}return r;})())`));
 if(h.run('JSON.stringify(G.emps.map(e=>e.mizac))')!==personas)throw Error('persona');
 const summary=()=>JSON.parse(h.run('JSON.stringify({day:G.day,live:G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide).map(e=>e.id),feds:G.feds.map(f=>[f.id,f.type,f.members]),rng:RND_STATE})'));
 const before=summary();
 // Aynı kayıt puanı incelemesi ve ayrı, kısa süreli doğal devam.
 for(let m=0;m<+advance;m++)h.run('for(let j=0;j<60&&!G.over;j++){const m=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>m)monthTick();}');
 data.arms.push({enabled,rows,before,after:summary()});
}
fs.writeFileSync(path.join(__dirname,'raw',tag+'.json'),JSON.stringify(data,null,1));

'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness(),evidence=process.env.MP88_EVIDENCE;if(evidence)fs.mkdirSync(evidence,{recursive:true});
const sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const STEP=`const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();`;
const make=()=>{const r=runtime({native:true});r.loadSave(path.join(__dirname,'../reports/codex/evidence/mp86/capture-host-m120.save'));r.run("View.selSys=G.sys[G.p.home];UI.cur='sistem';UI.refresh();");return r;};
function diff(a,b,p=''){if(JSON.stringify(a)===JSON.stringify(b))return [];if(!a||!b||typeof a!=='object'||typeof b!=='object')return [{path:p,a,b}];return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>diff(a[k],b[k],p+'/'+k));}
test('UI refresh changes only eight derived power/pressure day stamps; original serializer and RNG preserved',()=>{
 const r=make();for(let i=0;i<4;i++)r.run('{'+STEP+'}');const before=r.run('serialize()'),rng=r.run('RND_STATE');r.run('UI.refresh()');const after=r.run('serialize()'),d=diff(JSON.parse(before),JSON.parse(after));
 assert.equal(d.length,8);for(const x of d){assert.match(x.path,/^\/emps\/(0|1|4|5)\/_(pow|press)At$/);assert.equal(x.b,r.run('G.day'));}assert.equal(r.run('RND_STATE'),rng);assert.notEqual(sha(before),sha(after));
 if(evidence){fs.writeFileSync(path.join(evidence,'ui-before.save'),before);fs.writeFileSync(path.join(evidence,'ui-after.save'),after);fs.writeFileSync(path.join(evidence,'ui-field-diff.json'),JSON.stringify(d,null,2));}
});
test('same full Save8 after explicit UI checkpoint on both sides, including every cache field',()=>{
 const a=make(),b=make();for(let i=0;i<8;i++){for(const r of [a,b])r.run('{'+STEP+'}');if(i%3===0)a.run('UI.refresh()');for(const r of [a,b])r.run('UI.refresh()');assert.equal(a.run('serialize()'),b.run('serialize()'),'full bytes step '+i);assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));}
});
test('different UI refresh schedules preserve next-month decisions, full settled Save8 and RNG',()=>{
 const a=make(),b=make(),rngs=[];for(let i=0;i<60;i++){for(const r of [a,b])r.run('{'+STEP+'}');if(i%4===0)a.run('UI.refresh()');if(i%9===0)b.run('UI.refresh()');assert.equal(a.run('RND_STATE'),b.run('RND_STATE'),'RNG step '+i);rngs.push(a.run('RND_STATE'));}
 for(const r of [a,b])r.run('UI.refresh()');assert.equal(a.run('serialize()'),b.run('serialize()'));if(evidence)fs.writeFileSync(path.join(evidence,'next-month-equality.json'),JSON.stringify({steps:60,day:a.run('G.day'),sha:sha(a.run('serialize()')),rngs,fullBytesEqual:true},null,2));
});
test('fresh MP session from fixed world: exact host Save8, RNG and real mirror stream at every checkpoint',()=>{
 const a=make(),b=make();const frames=r=>r.sb.__out.filter(m=>m.type==='mirror'||m.type==='mirrorDelta');
 for(const r of [a,b]){r.run(fs.readFileSync(path.join(__dirname,'../research/mp6/mirror.js'),'utf8'));r.run(fs.readFileSync(path.join(__dirname,'../research/mp0/mp-core.js'),'utf8'));r.sb.__out=[];
  r.run(`var MP=StarsMP.createHost({roomId:'hash88',random:n=>'ab'.repeat(n),now:()=>1000,send:(c,t)=>__out.push(JSON.parse(t)),mirrorMs:0});MP.installGuards();MP.onMessage('c',JSON.stringify({v:1,type:'hello',name:'Bora'}));var pid=[...MP.state.players.keys()].find(k=>k!=='host');if(!MP.assign(pid,1).ok)throw Error('assign');MP.publish();MP.onMessage('c',JSON.stringify({v:1,type:'ui',mode:'stars'}));`);
 }
 const rows=[];for(let i=0;i<8;i++){for(const r of [a,b])r.run('{'+STEP+'}');if(i%3===0)a.run('UI.refresh()');for(const r of [a,b])r.run('UI.refresh();MP.publish();');
  assert.equal(a.run('serialize()'),b.run('serialize()'),'full MP host bytes step '+i);assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));assert.equal(JSON.stringify(frames(a)),JSON.stringify(frames(b)),'exact mirror stream step '+i);rows.push({step:i+1,hostSha:sha(a.run('serialize()')),rng:a.run('RND_STATE'),mirrorStreamSha:sha(JSON.stringify(frames(a)))});
 }
 assert(frames(a).some(m=>m.type==='mirrorDelta'));if(evidence)fs.writeFileSync(path.join(evidence,'fresh-mp-equality.json'),JSON.stringify({rows,fullBytesEqual:true,mirrorFrames:frames(a).length},null,2));
});
test('Save8 load alone does not reset an existing MP personal-notice observer history',()=>{
 const a=make(),b=runtime({native:true});b.run("setupGame({...CFG,size:'orta',aiCount:5,seed:22});G.autoSave=false;View.init();View.selSys=G.sys[G.p.home];UI.refresh();");
 for(const r of [a,b]){r.run(fs.readFileSync(path.join(__dirname,'../research/mp6/mirror.js'),'utf8'));r.run(fs.readFileSync(path.join(__dirname,'../research/mp0/mp-core.js'),'utf8'));r.sb.__out=[];
  r.run(`var MP=StarsMP.createHost({roomId:'hash88',random:n=>'ab'.repeat(n),now:()=>1000,send:(c,t)=>__out.push(JSON.parse(t)),mirrorMs:0});MP.installGuards();MP.onMessage('c',JSON.stringify({v:1,type:'hello',name:'Bora'}));var pid=[...MP.state.players.keys()].find(k=>k!=='host');MP.assign(pid,1);MP.publish();`);
  r.sb.__fixed=fs.readFileSync(path.join(__dirname,'../reports/codex/evidence/mp86/capture-host-m120.save'),'utf8');r.run(`if(!deserialize(__fixed))throw Error('load');View.selSys=G.sys[G.p.home];UI.refresh();MP.publish();MP.onMessage('c',JSON.stringify({v:1,type:'ui',mode:'stars'}));`);
 }
 assert.equal(a.run('serialize()'),b.run('serialize()'));assert.equal(a.run('RND_STATE'),b.run('RND_STATE'));
 const m=r=>r.sb.__out.filter(m=>m.type==='mirror').at(-1).full,ds=diff(m(a),m(b));assert(ds.length);assert(ds.every(d=>d.path.startsWith('/log/')),'only MP personal notes differ');
 if(evidence)fs.writeFileSync(path.join(evidence,'observer-boundary.json'),JSON.stringify({oldWorldSeeds:[404,22],sameFinalSave8:true,sameRNG:true,mirrorDiff:ds},null,2));
});
end();

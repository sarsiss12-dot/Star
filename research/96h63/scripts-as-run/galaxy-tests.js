'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{performance}=require('perf_hooks'),{runtime}=require('../../Star/tests/helpers/runtime');
const P=path.resolve(__dirname,'..'),root=path.join(P,'galaxy'),old=path.join(P,'control'),hash=x=>crypto.createHash('sha256').update(x).digest('hex'),rows=[];
const cfg=(size,aiCount,shape,seed)=>({name:'Scale63',race:'insan',traits:[],size,aiCount,shape,diff:'normal',seed,ethics:{mil:0,aut:0,mat:0,ahl:0},civics:[],origin:'standart',ruins:'yok',crisis:'kapali',council:'kapali'});
function setup(root,c){const h=runtime({root});h.sb.c63=c;const t=performance.now();h.run('setupGame(c63);G.autoSave=false;economyTick(true)');return {h,ms:performance.now()-t};}
function validate(h,c,N){
 const d=JSON.parse(h.run(`JSON.stringify({sys:G.sys.map(s=>({id:s.id,x:s.x,y:s.y,name:s.name,lanes:s.lanes})),emps:G.emps.map(e=>({id:e.id,wild:e.wild,crisisSide:e.crisisSide,home:e.home,name:e.name,col:e.col,emblem:emblemKey(e.emblem),origin:e.origin,colonies:e.colonies,rel:Object.keys(e.rel)})),wild:G.wildId,W:G.W,H:G.H,layout:G.startLayout})`));
 assert.equal(d.sys.length,N);assert.equal(new Set(d.sys.map(s=>s.id)).size,N);assert.equal(new Set(d.sys.map(s=>s.x+':'+s.y)).size,N);assert.equal(new Set(d.sys.map(s=>s.name)).size,N);
 const visited=new Set([0]),todo=[0];while(todo.length){const i=todo.pop();for(const n of d.sys[i].lanes){assert(n!==i&&d.sys[n].lanes.includes(i));if(!visited.has(n)){visited.add(n);todo.push(n)}}}assert.equal(visited.size,N);
 const es=d.emps.filter(e=>!e.wild&&!e.crisisSide),count=c.aiCount??({kucuk:3,orta:5,buyuk:7,devasa:9,ulu:11,muazzam:13,kozmik:16,sinirsiz:20}[c.size]);assert.equal(es.length,count+1);assert.equal(new Set(es.map(e=>e.home)).size,es.length);assert.equal(new Set(es.map(e=>e.name)).size,es.length);assert.equal(new Set(es.map(e=>e.emblem)).size,es.length);if(count>11)assert.equal(new Set(es.map(e=>e.col)).size,es.length);
 assert(d.emps.every((e,i)=>e.id===i));assert.equal(d.wild,count+1);for(const e of es){assert.equal(e.colonies.length,1);assert.equal(e.rel.length,count+1);}
 h.run('var save63=serialize(),rng63=RND_STATE,world63=[G.W,G.H,G.sys.length,G.emps.length];if(!deserialize(save63))throw Error("load failed");');assert.equal(h.run('JSON.stringify(world63)'),h.run('JSON.stringify([G.W,G.H,G.sys.length,G.emps.length])'));assert.equal(h.run('RND_STATE'),h.run('rng63'));
 for(const s of d.sys){assert(Number.isFinite(s.x)&&s.x>=0&&s.x<=d.W&&s.y>=0&&s.y<=d.H)}
 return {systems:N,states:es.length,wild:d.wild,adjacentPairs:d.layout.adjacentPairs.length,W:d.W,saveBytes:Buffer.byteLength(h.run('serialize()'))};
}
for(const size of ['kucuk','orta','buyuk','devasa','ulu'])for(const seed of [11,23,404])for(const shape of ['sarmal','halka','kume']){
 const c=cfg(size,undefined,shape,seed),a=setup(old,c),b=setup(root,c);assert.equal(a.h.run('serialize()'),b.h.run('serialize()'),'legacy full Save '+JSON.stringify(c));assert.equal(a.h.run('RND_STATE'),b.h.run('RND_STATE'));rows.push({kind:'legacy-exact',size,shape,seed,...validate(b.h,c,{kucuk:30,orta:45,buyuk:60,devasa:80,ulu:100}[size]),ms:b.ms});
}
for(const [size,count,N]of [['ulu',15,100],['muazzam',13,120],['kozmik',10,160],['kozmik',16,160],['kozmik',20,160],['sinirsiz',8,200],['sinirsiz',20,200],['kucuk',20,30]])for(const seed of [11,23,404])for(const shape of ['sarmal','halka','kume']){
 const c=cfg(size,count,shape,seed),a=setup(root,c),b=setup(root,c);assert.equal(a.h.run('serialize()'),b.h.run('serialize()'));assert.equal(a.h.run('RND_STATE'),b.h.run('RND_STATE'));rows.push({kind:'extended',size,count,shape,seed,...validate(a.h,c,N),ms:a.ms});
}
const h=runtime({root});for(const count of [0,21,1.5,NaN]){h.sb.c63=cfg('orta',count,'sarmal',11);assert(h.run('!!setupConfigError(c63)'));assert.throws(()=>h.run('setupGame(c63)'));}for(const count of [1,20]){h.sb.c63=cfg('orta',count,'sarmal',11);assert.equal(h.run('setupConfigError(c63)'), '');}
fs.writeFileSync(path.join(P,'evidence/galaxy-setup.json'),JSON.stringify({status:'PASS',cases:rows.length,legacyExact:45,extended:72,invalid:4,rows},null,2));console.log('PASS',rows.length,'map/state/Save/RNG cases + invalid configurations');

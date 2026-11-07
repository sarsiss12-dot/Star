'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const control=process.env.STARS_CONTROL_ROOT,out=process.env.STARS_OUTPUT||'/tmp/stars-beta-ux0/audit';if(!control)throw Error('control root required');fs.mkdirSync(out,{recursive:true});const result={status:'RUNNING',galaxies:[],control:[]},sha=s=>crypto.createHash('sha256').update(s).digest('hex');
function world(root,seed){const h=runtime({root});h.run(`setupGame({...CFG,seed:${seed},size:'buyuk',aiCount:11,name:'Manuel Oyuncu Devleti'});G.autoSave=false;`);return h;}
const J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function diff(a,b,p='',r=[]){if(JSON.stringify(a)===JSON.stringify(b))return r;if(a&&b&&typeof a==='object'&&typeof b==='object'){for(const k of new Set([...Object.keys(a),...Object.keys(b)]))diff(a[k],b[k],p+'.'+k,r);}else r.push({path:p,before:a,after:b});return r;}
try{
 const priority=[11,23,42,99,404],seeds=[...Array.from({length:99},(_,i)=>i+1),404];
 for(const seed of seeds){const h=world(path.resolve(__dirname,'..'),seed),names=J(h,'G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide).map(e=>({id:e.id,name:e.name,doctrine:personaKey(e)}))');assert.equal(names.length,11);assert.equal(new Set(names.map(x=>x.name)).size,11);assert.equal(new Set(names.map(x=>x.name.split(' ')[0])).size,11);
  for(const x of names){assert.equal(x.name.split(' ').length,2);h.sb.__n=x;assert(h.run('NAME_TITLES[__n.doctrine].some(x=>x[0]===__n.name.split(" ")[1])'));}
  let near=0;for(let i=0;i<names.length;i++)for(let j=0;j<i;j++){h.sb.__roots=[names[i].name.split(' ')[0],names[j].name.split(' ')[0]];const d=h.run('nameRootDistance(...__roots)');if(d<=1)near++;}assert.equal(near,0);
  const row={seed,names,nearPairs:near,saveSha256:sha(h.run('serialize()')),rng:h.run('RND_STATE')};result.galaxies.push(row);
  if(priority.includes(seed)){
   const c=world(control,seed),again=world(path.resolve(__dirname,'..'),seed);assert.equal(h.run('serialize()'),again.run('serialize()'),'same-seed raw Save8');assert.equal(h.run('RND_STATE'),c.run('RND_STATE'));
   const fields=diff(J(c,'JSON.parse(serialize())'),J(h,'JSON.parse(serialize())'));assert(fields.every(x=>/^\.emps\.\d+\.name$/.test(x.path)),'non-cosmetic diff: '+JSON.stringify(fields.slice(0,15)));
   result.control.push({seed,status:'PASS',rngEqual:true,sameSeedSave8Equal:true,allowedDifferences:fields});console.log('PASS seed '+seed+' 11 AI, geography/identities/engine fields same except name, RNG same');
  }
 }
 const all=result.galaxies.flatMap(x=>x.names),roots=all.map(x=>x.name.split(' ')[0]),full=all.map(x=>x.name),distribution={},allTitles={};
 for(const x of all){const title=x.name.split(' ')[1];distribution[x.doctrine]??={count:0,titles:{},examples:[]};const d=distribution[x.doctrine];d.count++;d.titles[title]=(d.titles[title]||0)+1;if(d.examples.length<5)d.examples.push(x.name);allTitles[title]=(allTitles[title]||0)+1;}
 result.diversity={galaxies:100,aiNames:all.length,uniqueRoots:new Set(roots).size,repeatedRootOccurrences:roots.length-new Set(roots).size,uniqueNames:new Set(full).size,repeatedFullOccurrences:full.length-new Set(full).size,inGalaxyRootCollisions:0,inGalaxyNameCollisions:0,inGalaxyNearRatio:0,nearDefinition:'Levenshtein<=1; all 55 pairs per 11 AI galaxy',twoWordRate:1,doctrineMismatchRate:0,distribution,allTitles};
 const old=fs.readFileSync(path.join(__dirname,'fixtures/perf2/orta6-s404-m60.save'),'utf8'),a=runtime(),c=runtime({root:control});a.sb.__save=c.sb.__save=old;
 const step=`G.autoSave=false;function step(){for(var i=0;i<60;i++){var d=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>d)monthTick();}}`;
 for(const h of [a,c]){assert(h.run('deserialize(__save)'));h.run(step);}result.oldSave=[];
 for(let m=0;m<=6;m++){if(m){a.run('step()');c.run('step()');}assert.equal(a.run('serialize()'),c.run('serialize()'),'old save direct bytes month '+m);assert.equal(a.run('RND_STATE'),c.run('RND_STATE'));result.oldSave.push({month:m,sha256:sha(a.run('serialize()')),rng:a.run('RND_STATE')});}
 result.status='PASS';console.log(JSON.stringify(result.diversity));console.log('PASS old Save8 direct byte/RNG equivalence at load +6 months');
}catch(e){result.status='FAIL';result.error=e.stack;console.error(e.stack);process.exitCode=1;}finally{fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(result,null,2)+'\n');}

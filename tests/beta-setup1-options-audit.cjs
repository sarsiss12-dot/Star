'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{runtime}=require('./helpers/runtime');
const out=process.env.STARS_OUTPUT||'/tmp/stars-beta-setup1/options',control=process.env.STARS_CONTROL_ROOT;fs.mkdirSync(out,{recursive:true});const R={status:'RUNNING',cases:[],origins:{},special:{}};
const sha=s=>crypto.createHash('sha256').update(s).digest('hex'),J=(h,s)=>JSON.parse(h.run('JSON.stringify('+s+')'));
function world(cfg,root){const h=runtime({root});h.sb.__cfg=cfg;h.run('setupGame({...CFG,...__cfg});G.autoSave=false;');return h;}
function row(h){return J(h,`({cfg:G.cfg,systems:G.sys.length,normal:G.emps.filter(e=>!e.wild&&!e.crisisSide).length,origins:G.emps.filter(e=>e.ai&&!e.wild).map(e=>e.origin),homes:G.emps.map(e=>e.home),nests:G.nests.length,pirateFleets:G.fleets.filter(f=>f.e===G.wildId&&!f.monster).length,ruins:G.ruins.map(id=>({id,hp:G.sys[id].ruin.hp,reward:G.sys[id].ruin.rw,defense:ruinDefense(G.sys[id])})),crisis:G.crisis,resources:G.p.res,ai:G.emps[1].extra,income:G.emps[1].inc,aiAgr:G.emps[1].agr})`);}
try{
const variants={pirates:[false,true],gates:[false,true],randomEvents:[false,true],aiOrigins:[false,true],aiOriginChance:[20,35,60,100],crisisPower:['kapali','normal','acimasiz'],crisis:['kapali','erken','normal','gec','sonoyun'],council:['kapali','sik','normal','seyrek'],ruins:['yok','az','orta','cok'],size:['kucuk','orta','buyuk','devasa','ulu'],shape:['sarmal','halka','kume'],aiCount:[1,11],diff:['kolay','normal','zor','kabus']};
for(const seed of[11,23,42,99,404])for(const[key,values]of Object.entries(variants))for(const value of values){
 const cfg={seed,size:'orta',aiCount:5,[key]:value},h=world(cfg),state=row(h),save=h.run('serialize()');
 assert.equal(state.cfg[key],value);assert.equal(state.cfg.seed,seed);
 if(key==='pirates'&&!value)assert.equal(state.nests+state.pirateFleets,0);
 if(key==='aiOrigins'&&!value)assert(state.origins.every(x=>x==='standart'));
 if(key==='aiOriginChance'&&value===100)assert(state.origins.every(x=>x!=='standart'&&x!=='altin_cag'));
 if(key==='crisisPower'&&value==='kapali')assert.equal(state.crisis,null);
 if(key==='crisis'&&value==='kapali')assert.equal(state.crisis,null);
 if(key==='crisis'&&value!=='kapali'){h.sb.__key=value;assert(h.run('G.crisis.atMonth>=CRISIS_WINDOW[__key][0]&&G.crisis.atMonth<=CRISIS_WINDOW[__key][1]'));}
 if(key==='ruins')assert(state.ruins.length<=h.run('RUIN_LEVELS[G.cfg.ruins].say'));
 if(key==='size')assert.equal(state.systems,h.run('SIZES[G.cfg.size].sys'));
 if(key==='aiCount')assert.equal(state.normal,value+1);
 const nameBefore=h.run('JSON.stringify(G.emps.map(e=>e.name))'),rng=h.run('RND_STATE');assert(h.run('deserialize(serialize())'));assert.deepEqual(J(h,'G.cfg'),state.cfg);assert.equal(h.run('RND_STATE'),rng);assert.equal(h.run('JSON.stringify(G.emps.map(e=>e.name))'),nameBefore);
 let controlEqual=null;if(control&&!(key==='crisisPower'&&value==='kapali')){const c=world(cfg,control);assert.equal(save,c.run('serialize()'),'initial control bytes '+seed+' '+key+':'+value);controlEqual=true;}
 R.cases.push({seed,key,value,status:'PASS',state,geographySha256:sha(h.run('JSON.stringify(G.sys.map(s=>[s.x,s.y,s.lanes]))')),saveSha256:sha(save),initialControlEqual:controlEqual});
}console.log('PASS one-variable setup/save/control cases '+R.cases.length);
const seeds=[11,23,42,99,404,...Array.from({length:15},(_,i)=>i+1).filter(x=>x!==11)];
for(const chance of[20,35,60,100]){const names=[],rows=[];for(const seed of seeds){const h=world({seed,size:'buyuk',aiCount:11,aiOriginChance:chance,origin:'gocebe'});assert.equal(h.run('G.p.origin'),'gocebe');const origins=J(h,'G.emps.filter(e=>e.ai&&!e.wild).map(e=>e.origin)');assert(!origins.includes('altin_cag'));rows.push({seed,origins});names.push(...origins);}const count=names.filter(n=>n!=='standart').length,rate=count/names.length;assert(Math.abs(rate-chance/100)<.12);R.origins[chance]={samples:names.length,special:count,rate,rows};console.log('PASS origins '+chance+' '+count+'/'+names.length);}
for(const on of[false,true]){const h=world({seed:11,randomEvents:on});h.run('var rs=RND_STATE;for(var i=0;i<100;i++)maybeEvent();var chains=Object.keys(G.seenChains||{}).length;G.upAge=200;for(var i=0;i<200&&!G.upheaval;i++)upheavalTick();');const a=J(h,'({chains,upheaval:G.upheaval,rngChanged:RND_STATE!==rs})');if(on){assert(a.chains>0);assert(a.upheaval);}else{assert.equal(a.chains,0);assert.equal(a.upheaval,null);assert(!a.rngChanged);}R.special['events-'+on]=a;}
for(const pace of['kapali','sik','normal','seyrek']){const h=world({seed:11,council:pace});h.run(`G.council=null;G.memAge=100;for(const a of G.emps)for(const b of G.emps)if(a!==b)a.contact[b.id]=true;var founded=foundCouncilByConvention();var months=councilPaceMonths();`);assert.equal(h.run('founded'),pace!=='kapali');R.special['council-'+pace]=J(h,'({founded,months,members:G.council?.members??[]})');}
for(const power of['normal','acimasiz']){const h=world({seed:404,crisisPower:power});h.run('var scale=crisisScale();spawnCrisisWave(1)');R.special['crisis-'+power]=J(h,'({scale,need:G.crisis.need,fleets:G.fleets.filter(f=>f.crisis).length,ships:G.fleets.filter(f=>f.crisis).reduce((s,f)=>s+f.ships.length,0)})');}assert(Math.abs(R.special['crisis-acimasiz'].need/R.special['crisis-normal'].need-2)<.02);
for(const[size,aiCount]of[['kucuk',11],['ulu',1]]){const h=world({seed:404,size,aiCount});const homes=J(h,'G.emps.filter(e=>!e.wild).map(e=>e.home)');assert.equal(new Set(homes).size,aiCount+1);R.special[size+'-'+aiCount]={systems:h.run('G.sys.length'),normal:homes.length,homeIds:homes,minCapitalDistance:h.run('Math.min(...G.emps.filter(e=>!e.wild).flatMap((e,i,a)=>a.slice(i+1).map(o=>dist(G.sys[e.home],G.sys[o.home]))))')};}
const h=world({seed:11,ruins:'cok'});h.run(`var rewards=[];for(const r of RUIN_REWARDS){var s=G.sys[G.ruins[0]];s.ruin.rw=r.k;var before=JSON.stringify({res:G.p.res,techs:G.p.techs,extra:G.p.extra,fleets:G.fleets.length});ruinReward(G.p,s);rewards.push({reward:r.k,changed:before!==JSON.stringify({res:G.p.res,techs:G.p.techs,extra:G.p.extra,fleets:G.fleets.length})})}`);R.special.rewards=J(h,'rewards');assert(R.special.rewards.every(x=>x.changed));
for(const seed of[11,23,42,99,404]){const cfg={seed,aiCount:5,size:'orta'},a=world(cfg),b=world(cfg);assert.equal(a.run('serialize()'),b.run('serialize()'));}
R.status='PASS';console.log('PASS events/council/crisis-strength/independent counts/rewards/determinism');
}catch(e){R.status='FAIL';R.error=e.stack;process.exitCode=1;console.error(e.stack);}finally{fs.writeFileSync(path.join(out,'audit.json'),JSON.stringify(R,null,2)+'\n');}

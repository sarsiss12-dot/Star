'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const [input,out]=process.argv.slice(2),root=path.resolve(__dirname,'../..');
async function run(){
 const relay=require(path.join(root,'research/mp1/server/relay.js')).create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});
 const srv=await relay.start();let browser;
 try{
  browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
  const p=await browser.newPage({viewport:{width:844,height:390},serviceWorkers:'block'});
  await p.goto('http://127.0.0.1:'+srv.address().port);
  const result=await p.evaluate(async save=>{
   if(!deserialize(save))throw Error('Save8');G.speed=0;G.autoSave=false;
   const [a,b,d]=G.emps,normal=[a,b,d];for(const e of normal){e.dead=e.wild=e.crisisSide=false;e.civics=[];e.war={};e.pact={};e.embargo={};e.intel={};e.contact={};e.colonies=[];e.mizac=e._pers='yayilmaci';for(const o of normal){e.contact[o.id]=true;e.intel[o.id]=3;}}
   a.pact[b.id]=b.pact[a.id]=true;d.portTransit={0:G.day+360,1:G.day+360};G.feds=[];G.council=null;G.fleets=[];G.raids={};G.commerce=Commerce.empty();
   const end=G.sys.length-1,template=JSON.parse(JSON.stringify(G.sys.flatMap(s=>s.planets).find(p=>p.col).col));
   for(const s of G.sys){
    s.cr=0;s.owner=-1;s.lanes=[s.id-1,s.id+1].filter(n=>n>=0&&n<=end);s.x=s.id*25;s.y=10;
    s.seen=s.surv=[0,1,2];
    for(const p of s.planets){p.owner=-1;p.col=null;}
    if(s.id%3===0||s.id===end){
     const owner=s.id===0?a:s.id===end?b:d,p=s.planets[0];
     p.col=JSON.parse(JSON.stringify(template));p.col.b.liman=1;p.col.pop=100;p.owner=owner.id;owner.colonies.push({s:s.id,p:p.i});s.owner=owner.id;
    }
   }
   const sample=(n,fn)=>{const arr=[];for(let i=0;i<n;i++){const t=performance.now();fn();arr.push(performance.now()-t);}return arr;};
   const args=[a,b,0,end];let path;
   const cold=sample(30,()=>{path=Commerce.route(...args,{volume:5});if(path?.length!==end+1)throw Error('kırık zincir');});
   const memo={paths:new Map()};Commerce._aiRouteScope=memo;
   const cached=sample(30,()=>Commerce.aiQuoteRoute(...args,5));Commerce._aiRouteScope=null;
   const invalidation=sample(15,()=>{delete d.portTransit[0];const sig=Commerce.aiRouteSignature();
    if(Commerce.route(...args)!==null)throw Error('eski izin');d.portTransit[0]=G.day+360;if(Commerce.aiRouteSignature()===sig)throw Error('imza');});
   const n={from:0,to:1,give:[{t:'freight',r:'min',v:2,source:0,target:end,months:12,every:90}],want:[{t:'freight',r:'ene',v:2,source:end,target:0,months:12,every:90}]};
   a.res.min=b.res.ene=1000;if(!executeDeal(n))throw Error('imza');G.day+=2;Commerce.tick(2);Commerce.cancel(1,a);
   const convoy=JSON.parse(JSON.stringify(G.commerce.convoys[0]));
   const contract=JSON.parse(JSON.stringify(G.commerce.contracts[0]));
   if(!convoy||!contract)throw Error('Hareket fikstürü');
   const inputs=new Map();
   for(const scale of [0,1,8,32,64]){
    G.commerce.convoys=[];G.commerce.contracts=[];G.commerce.stats={};
    // Artificial load fixture: convoy IDs are unique, agreement and cargo counts vary together.
    for(let i=1;i<=scale;i++){
     const l=JSON.parse(JSON.stringify(convoy)),c=JSON.parse(JSON.stringify(contract));
     l.id=l.contract=c.id=i;G.commerce.convoys.push(l);G.commerce.contracts.push(c);
    }
    G.commerce.nextConvoy=G.commerce.nextContract=scale+1;inputs.set(scale,serialize());
   }
   const loads={};
   for(let rep=0;rep<16;rep++){
    for(const n of (rep%2?[64,32,8,1,0]:[0,1,8,32,64])){
     if(!deserialize(inputs.get(n)))throw Error('Yük fikstürü '+n);
     const t=performance.now();
     for(let i=0;i<60;i++){G.day+=.5;Commerce.tick(.5);}
     const ms=performance.now()-t,proof=serialize();
     const row=loads[n]||={ms:[],rng:RND_STATE,proof};
     if(row.proof!==proof||row.rng!==RND_STATE)throw Error('Yük tekrarında ayrışma');
     row.ms.push(ms);
    }
   }
   for(const row of Object.values(loads))delete row.proof;
   // Profile only after the timed comparisons so the probes cannot bias the runs.
   const profile={},methods=['remainingRoute','openEdge','relay','portRight','raidTick','dispatch','route'];
   const originals=Object.fromEntries(methods.map(key=>[key,Commerce[key]]));
   if(!deserialize(inputs.get(64)))throw Error('Profil fikstürü');
   for(const key of methods){
    const row=profile[key]={calls:0,ms:0},fn=originals[key];
    Commerce[key]=function(...args){
     const start=performance.now();
     try{return fn.apply(this,args);}finally{row.calls++;row.ms+=performance.now()-start;}
    };
   }
   try{for(let i=0;i<60;i++){G.day+=.5;Commerce.tick(.5);}}finally{Object.assign(Commerce,originals);}

   if(!deserialize(inputs.get(1)))throw Error('Harita fikstürü');
   $('title').classList.add('hidden');enterGame(true);G.speed=0;View.cam={x:150,y:10,z:.7};CommerceUI.selected=G.commerce.convoys[0].id;
   const map={};for(const on of [false,true]){G.commerce.visible=on;map[on?'acik':'kapali']=sample(45,()=>View.draw());}
   const frames={acik:[],kapali:[]};
   const frame=()=>new Promise(resolve=>requestAnimationFrame(resolve));
   for(const on of [false,true,true,false]){
    G.commerce.visible=on;
    for(let i=0;i<4;i++)await frame();
    let previous=await frame();
    for(let i=0;i<30;i++){
     const stamp=await frame(),start=performance.now();View.draw();
     frames[on?'acik':'kapali'].push({interval:stamp-previous,draw:performance.now()-start});previous=stamp;
    }
   }
   return {systems:G.sys.length,ports:G.emps[2].colonies.length+2,hops:path.length-1,cold,cached,invalidation,loads,profile,map,frames};
  },fs.readFileSync(input,'utf8'));
  result.chromium=browser.version();assert.equal(result.systems,500);fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 }finally{await browser?.close();relay.shutdown();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});

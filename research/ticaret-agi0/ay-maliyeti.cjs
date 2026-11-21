'use strict';
// Each sample restores the identical input. A policy change may legitimately diverge after the measured month.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const [base,inputs,out]=process.argv.slice(2);
async function main(){
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-gpu','--disable-dev-shm-usage']});
 const servers=[],pages=[],sources=[];
 try{
  for(const root of [base,path.join(__dirname,'../..')]){
   const relay=require(path.resolve(root,'research/mp1/server/relay.js')).create({MP1_BIND:'127.0.0.1',MP1_PORT:'0'});
   const srv=await relay.start();servers.push(relay);
   const p=await browser.newPage({serviceWorkers:'block'});pages.push(p);
   await p.goto('http://127.0.0.1:'+srv.address().port);await p.waitForFunction(()=>typeof Commerce!=='undefined');
   const script=fs.readFileSync(path.resolve(root,'commerce.js'),'utf8');
   const loaded=await p.evaluate(()=>Commerce.route.toString());
   assert(script.includes(loaded),'Chromium rota kodu çalışma ağacı ile eşleşmeli');
   sources.push(hash(script));
  }
  for(const key of ['100-9-11-m120','500-16-11-m120','500-16-11-m180']){
   const save=fs.readFileSync(path.join(inputs,key+'.save'),'utf8'),samples=[[],[]],expected=[];
   for(const p of pages)await p.evaluate(s=>{window.perfInput=s;},save);
   for(let block=0;block<7;block++)for(const arm of [0,1,1,0,1,0,0,1]){
    const data=await pages[arm].evaluate(()=>{
     if(!deserialize(window.perfInput))throw Error('Save8 açılamadı');
     G.autoSave=false;G.speed=0;const month=Math.floor(G.day/30),start=performance.now();
     for(let i=0;i<60&&!G.over;i++){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>month){monthTick();break;}}
     const ms=performance.now()-start;return {ms,rng:RND_STATE,day:G.day,save:serialize()};
    });
    const sha=hash(data.save);if(!expected[arm])expected[arm]=sha;
    assert.equal(sha,expected[arm],key+' aynı kolda Save8 tekrarı');
    if(block)samples[arm].push({ms:data.ms,rng:data.rng,day:data.day,sha});
   }
   const quant=(arr,q)=>arr.map(x=>x.ms).sort((a,b)=>a-b)[Math.ceil(q*arr.length)-1];
   const arms=samples.map(arr=>({p50:quant(arr,.5),p95:quant(arr,.95)})),delta=100*(arms[1].p95/arms[0].p95-1);
   const row={key,chromium:browser.version(),commerceSha256:sources,input:hash(save),arms,delta,equal:expected[0]===expected[1],samples};
   fs.writeFileSync(path.join(out,key+'.json'),JSON.stringify(row,null,2)+'\n');
   console.log(key,JSON.stringify(arms),delta.toFixed(2),row.equal);
  }
 }finally{await browser.close();for(const s of servers)s.shutdown();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});

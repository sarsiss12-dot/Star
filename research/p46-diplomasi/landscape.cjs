'use strict';
// Kurulum fikstüründen sonra yalnız görünür denetimlere dokunulur.
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const http=require('node:http');
const out=path.join(__dirname,'raw','landscape.json'), results=[];
(async()=>{
 const root=path.resolve(__dirname,'../..');
 const srv=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname.slice(1)||'index.html';
 if(!/^[a-z0-9.-]+$/.test(name)||!fs.existsSync(path.join(root,name))){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.html')?'text/html; charset=utf-8':'application/json');fs.createReadStream(path.join(root,name)).pipe(res);});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const name of ['offer','counter','vote','scheduledVote','peace','energy','colonies','fleet']){
  const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});
  const p=await ctx.newPage(),row={name,taps:[]};results.push(row);p.setDefaultTimeout(5000);
  try{
   await p.goto('http://127.0.0.1:'+srv.address().port+'/');
   await p.evaluate(name=>{
    setupGame({...CFG,size:setupSizeKey(100),aiCount:9,seed:22});$('title').classList.add('hidden');enterGame(true);
    G.autoSave=false;LOOP.on=false;UI.setSpeed(0);
    for(const e of G.emps){if(e.wild)continue;e.civics=[];e.res.etk=5000;e.res.min=5000;
     for(const o of G.emps)if(e!==o&&!o.wild){e.contact[o.id]=true;e.rel[o.id]=name==='offer'?-80:55;e.war[o.id]=false;}}
    window.fx=G.emps.find(e=>e.ai&&!e.wild&&!isPurifier(e));const o=fx;
    if(name==='counter')UI.aiOffer({from:o.id,to:0,give:[{t:'res',r:'min',v:60}],want:[{t:'res',r:'ene',v:25}],born:G.day,expires:G.day+540});
    if(name==='vote'||name==='scheduledVote'){const f={id:1,members:[0,o.id],type:'askeri',founder:o.id,leader:o.id,name:'Ortak savunma',fund:{ene:300,ala:100},charter:{...fedDefaultCharter('askeri'),ballot:'equal'},laws:{},founded:0,nextVote:500,politicsVersion:96,cohesion:70};G.feds=[f];G.fedUid=1;G.p.ally[o.id]=o.ally[0]=true;federationIdentity(f);if(name==='scheduledVote')startFedVote(f);else fedPresentVote(f,fedOpenVote(f,'savunma',o));DiplomaticInbox.sync();}
    if(name==='peace'){
     for(const s of G.sys)s.seen=G.emps.map(e=>e.id);
     const land=G.sys.filter(s=>s.owner<0).slice(0,6);for(const s of land)territoryOwnerSet(s,o.id);
     warAuthorize(G.p,o,{n:'test'});declareWar(G.p,o);warAuthClear();
     const goals=warFetihDefault(G.p,o);if(!setWarGoal(G.p,o,'fetih',{targets:goals}))throw Error('fetih');
     const other=land.find(s=>!goals.includes(s.id))||G.sys.find(s=>s.owner===o.id&&s.id!==o.home&&!goals.includes(s.id));
     if(!other)throw Error('yan hedef');captureSystem(G.sys[goals[0]],0,'conquest');captureSystem(other,0,'conquest');
    }
    if(name==='energy'){G.p.inc.ene=-12;G.p.res.ene=8;}
    UI.closeModal();UI.setSpeed(0);UI.refresh();closeAllGroups();
    // click → tarayıcının ikinci rAF'ı. Otomasyonun kaydırma ve bekleme süresi dışarıda.
    window.lat=[];document.addEventListener('click',ev=>{const a=ev.target.closest('[data-a]')?.dataset?.a,t=performance.now();requestAnimationFrame(()=>requestAnimationFrame(()=>lat.push({a,ms:performance.now()-t})));},true);
   },name);
   const hit=async(sel)=>{const loc=p.locator(sel).first();await loc.scrollIntoViewIfNeeded();const label=await loc.innerText();await loc.tap();row.taps.push([sel,label]);await p.waitForTimeout(90);};
   const emp=()=>hit('[data-a="grpTog"][data-x="emp"]');
   const id=await p.evaluate(()=>fx.id);
   if(['offer','peace'].includes(name)){
    await emp();await hit('#outEmp [data-a="diploPane"]');await hit('[data-a="diploPick"][data-x="'+id+'"]');await hit('[data-a="diploNav"][data-x="deal"]');
    if(name==='offer'){await hit('[data-a="dealAdd"][data-x="want:res"]');await hit('[data-a="pickOne"][data-x="0"]');await hit('[data-a="amountPreset"][data-x="5000"]');await hit('[data-a="amountApply"]');}
    else await hit('[data-a="dealPact"][data-x="peace"]');
    if(name==='offer'){await hit('[data-a="dealSend"]');row.feedback=await p.evaluate(()=>UI.dealMsg);}
   }else if(name==='scheduledVote'){
    row.pending=await p.evaluate(()=>({vote:G.feds[0].vote?.law,proposer:G.feds[0].vote?.proposer,waiting:fedVoteCounts(G.feds[0]).waiting,archived:DiplomaticInbox.state().records.filter(r=>r.kind==='fedvote').length}));
    await emp();await hit('#fedBtn');await hit('[data-a="fedVoteNow"]');
   }else if(name==='counter'||name==='vote'){
    await emp();await hit('#outEmp [data-a="diplomaticInbox"]');
    const rid=await p.evaluate(k=>DiplomaticInbox.state().records.find(r=>r.kind===k)?.id,name==='vote'?'fedvote':'aideal');
    await hit('[data-a="diplomaticRecord"][data-x="'+rid+'"]');
    row.card=await p.locator('#modal').innerText();
    if(name==='counter'){await hit('#inboxCounter');await hit('[data-a="dealAdd"][data-x="want:passage"]');await hit('[data-a="dealSend"]');row.feedback=await p.evaluate(()=>UI.dealMsg);}
   }else if(name==='energy'){await emp();await hit('#economyBtn');}
   else if(name==='colonies'){await emp();await hit('#coloniesBtn');await hit('[data-a="colonySort"][data-x="ene"]');}
   else {await hit('#tabs [data-a="tab"][data-x="filo"]');await hit('#panel [data-a="selfleet"]');}
   row.text=await p.evaluate(()=>[$('modal').classList.contains('hidden')?'':$('modal').innerText,$('diploPane').classList.contains('show')?$('diploPane').innerText:'',$('panel').innerText,$('seltag').innerText].join('\n').slice(0,16000));
   row.lat=await p.evaluate(()=>lat);
  }catch(e){row.error=e.message;row.screen=await p.locator('body').innerText().catch(()=>null);}
  await ctx.close();fs.writeFileSync(out,JSON.stringify(results,null,2));
 }
 await browser.close();srv.close();
})().catch(e=>{console.error(e);process.exitCode=1});

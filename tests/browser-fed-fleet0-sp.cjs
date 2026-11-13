'use strict';
/* BETA-FED-FLEET.0 — tek oyunculu gerçek Chromium: başkan (devlet 0) kendi tersane panelinde FEDERAL SİPARİŞ düğmesine gerçek dokunuş / tıklama.
   Görünümler 640×360, 800×360, 915×412 (dokunma) ve 1280×720 (fare). Her görünümde:
   - federal bölüm panel içinde yatay taşmadan görünür, düğmeler dokunulabilir boyutta;
   - dokunuş → tersane kuyruğunda TEK federal iş, bedel fondan bir kez, kişisel kasa değişmez, kuyruk satırında FEDERAL;
   - aynı ay düğme kapalı + ret nedeni görünür;
   - gerçek iptal düğmesi + onay penceresi "Federal fona iade" gösterir → fon geri, kişisel kasa aynı, kuyruk boş;
   - sonraki ay yeniden sipariş → gerçek dailyTick ile TEK federal gemi devlet 0'ın federal filosu olarak çıkar;
   - sayfa hatası yok.
   FİKSTÜR (açıkça): devlet 0 ile 1 arasında askerî federasyon, başkan 0, fon 3000 alaşım + 3000 enerji doğrudan atanır; ana sistemde tersane.
   Kullanım: STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium [STARS_OUTPUT=dizin] node tests/browser-fed-fleet0-sp.cjs */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-fed-fleet0-sp';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html'}[path.extname(file)]||'application/json');res.end(d);});});
function setup(){
  setupGame({...CFG,seed:22,size:'orta',aiCount:5});G.autoSave=false;$('title').classList.add('hidden');enterGame(true);LOOP.on=false;UI.setSpeed(0);UI.closeModal();
  G.feds=[];const ms=[0,1];for(const a of ms)for(const b of ms)if(a!==b){G.emps[a].ally[b]=true;G.emps[a].contact[b]=true;G.emps[a].war[b]=false;G.emps[a].rel[b]=60;}
  const f={id:(G.fedUid=(G.fedUid||0)+1),name:'Filo Testi',type:'askeri',charter:{...fedDefaultCharter('askeri'),ballot:'equal'},politicsVersion:96,leader:0,founder:0,members:ms.slice(),laws:{},treasury:0,fund:{ala:3000,ene:3000},
    nextVote:G.day+400,vote:null,founded:G.day,typeSince:G.day,dutySince:{defense:G.day,offense:G.day},defenseFrontCutoff:1,dutyConsent:{},invites:{},decisions:{},cohesion:80};
  G.feds.push(f);federationIdentity(f);for(const id of ms)f.dutyConsent[id]={offense:false,since:G.day};
  const s=G.sys[G.p.home];if(!hasYard(s)){const p=s.planets.find(p=>p.owner===0&&p.col);p.col.b.tersane=(p.col.b.tersane||0)+1;}
  for(const k in G.p.res)G.p.res[k]=Math.max(G.p.res[k],5000);G.day=Math.floor(G.day/30)*30+2;
  View.sel=null;View.selSys=s;UI.tab('sistem');UI.refresh();return s.id;}
const state=p=>p.evaluate(()=>{const f=G.feds[0],s=G.sys[G.p.home];return {fund:{...f.fund},ala:G.p.res.ala,ene:G.p.res.ene,q:s.queue.filter(q=>q.fed===f.id).map(q=>({cls:q.cls,left:q.left,paid:q.fedPaid})),
  fleets:G.fleets.filter(x=>x.federal&&x.fedId===f.id).map(x=>({e:x.e,c:x.ships.map(s=>s.c)}))};});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});let pass=0,fail=0;const rows=[];
  try{for(const [w,h,mobile] of [[640,360,true],[800,360,true],[915,412,true],[1280,720,false]]){
    const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:mobile,hasTouch:mobile});const tag=w+'×'+h,row={tag};
    try{const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);
      const home=await page.evaluate(setup),btn='#panel [data-a="fedShip"][data-x="'+home+':kor"]',hit=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();return mobile?l.tap():l.click();};
      /* 1. yerleşim */
      await page.locator(btn).scrollIntoViewIfNeeded();
      row.layout=await page.evaluate(sel=>{const panel=$('panel'),pr=panel.getBoundingClientRect(),b=[...document.querySelectorAll('#panel [data-a="fedShip"]')].map(x=>x.getBoundingClientRect()),info=document.getElementById('fedOrderInfo').getBoundingClientRect();
        return {buttons:b.length,inside:b.every(r=>r.left>=pr.left-1&&r.right<=pr.right+1)&&info.left>=pr.left-1&&info.right<=pr.right+1,noOverflow:panel.scrollWidth<=panel.clientWidth+2,minH:Math.min(...b.map(r=>r.height)),
          info:document.getElementById('fedOrderInfo').textContent};},btn);
      assert.equal(row.layout.buttons,4,'dört savaş sınıfı');assert.equal(row.layout.inside,true,'panel içinde');assert.equal(row.layout.noOverflow,true,'yatay taşma yok');assert.ok(row.layout.minH>=28,'dokunulabilir yükseklik '+row.layout.minH);
      assert.match(row.layout.info,/3000 alaşım/);
      /* 2. sipariş */
      const s0=await state(page),cost=await page.evaluate(()=>fedShipCost('kor').ala);await hit(btn);await page.waitForFunction(()=>G.sys[G.p.home].queue.some(q=>q.fed!==undefined),undefined,{timeout:8000});
      row.panelRefreshed=await page.waitForFunction(()=>!!document.querySelector('#panel .fedTag'),undefined,{timeout:5000}).then(()=>true,()=>false);
      const s1=await state(page);row.order={cost,s0:s0.fund,s1:s1.fund,q:s1.q};
      assert.equal(s1.q.length,1);assert.equal(s1.fund.ala,s0.fund.ala-cost,'bedel fondan bir kez');assert.equal(s1.ala,s0.ala,'kişisel alaşım aynı');assert.equal(s1.ene,s0.ene);
      const ui=await page.evaluate(()=>({row:[...document.querySelectorAll('#panel .fedTag')].some(t=>{const b=t.closest('.box');return !!b&&/ortak fondan/.test(b.textContent)&&/kalan \d+ gün/.test(b.textContent)&&!!b.querySelector('[data-a="shipCancel"]');}),dis:[...document.querySelectorAll('#panel [data-a="fedShip"]')].every(b=>b.disabled),why:(document.getElementById('fedOrderWhy')||{}).textContent||''}));
      row.ui=ui;assert.equal(ui.row,true,'kuyrukta FEDERAL satırı');assert.equal(ui.dis,true,'aynı ay düğmeler kapalı');assert.match(ui.why,/bu ay/i,'ret nedeni görünür');
      await page.screenshot({path:path.join(out,'sp-'+tag+'-siparis.png')});
      /* 3. gerçek iptal */
      await hit('#panel [data-a="shipCancel"]');await page.waitForSelector('#modal [data-a="shipCancelConfirm"]',{timeout:8000});
      row.cancelDialog=await page.evaluate(()=>(document.getElementById('fedCancelRefund')||{}).textContent||'');assert.match(row.cancelDialog,/Federal fona iade/);assert.match(row.cancelDialog,new RegExp(String(cost)));
      await page.screenshot({path:path.join(out,'sp-'+tag+'-iptal.png')});
      await hit('#modal [data-a="shipCancelConfirm"]');await page.waitForFunction(()=>!G.sys[G.p.home].queue.some(q=>q.fed!==undefined),undefined,{timeout:8000});
      const s2=await state(page);row.cancel=s2.fund;assert.deepEqual(s2.fund,s0.fund,'fon geri');assert.equal(s2.ala,s0.ala,'kişisel kasaya iade yok');
      /* 4. sonraki ay sipariş → gerçek üretim */
      await page.evaluate(()=>{G.day=(Math.floor(G.day/30)+1)*30+1;UI.refresh();});await page.locator(btn).scrollIntoViewIfNeeded();
      await hit(btn);await page.waitForFunction(()=>G.sys[G.p.home].queue.some(q=>q.fed!==undefined),undefined,{timeout:8000});
      const days=await page.evaluate(()=>{const q=G.sys[G.p.home].queue.find(q=>q.fed!==undefined),n=Math.ceil(q.left)+1;for(let i=0;i<n;i++){G.day+=1;dailyTick(1);}UI.refresh();return n;});
      const s3=await state(page);row.built={days,fleets:s3.fleets,q:s3.q.length};assert.equal(s3.q.length,0);assert.deepEqual(s3.fleets,[{e:0,c:['kor']}],'tek federal gemi, başkanın federal filosu');
      assert.deepEqual(errors,[],'sayfa hatası yok');row.status='PASS';rows.push(row);pass++;console.log('PASS '+tag+' federal sipariş / yerleşim / iptal (fona iade) / üretim');
    }catch(e){fail++;rows.push({...row,status:'FAIL',error:String(e&&e.stack||e)});console.log('FAIL '+tag+'\n'+(e&&e.stack||e));continue;}finally{await ctx.close();}}
  }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'fed-fleet0-sp.json'),JSON.stringify(rows,null,1));console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;}
}
run().catch(e=>{console.error(e);process.exitCode=1;});

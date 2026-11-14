'use strict';
/* BETA-RIVAL-BLOCS.0 — gerçek Chromium + gerçek dokunma.
   Kurulum (portre 390×844 ve dar yatay 800×360): Rakip Doktrinler hazır seçim → 5–6 → sabit sayı → AI sayısını düşür → Doğal; 0,05× çarpan.
   Oyun içi: Büyük bölge armaları kapalı/açık (aynı kamera), cihaz tercihi, bölge içi yerleşim, 500 sistem çizim maliyeti;
   gerçek düğmelerle ittifaksız kuruluş, ittifaksız üye daveti (oy kartı), koloni panelinden otomatik inşaat emri.
   FİKSTÜR (açıkça): ittifak/ilişki/keşif ve kaynaklar page.evaluate ile hazırlanır; kararlar gerçek düğmelerden verilir.
   Kullanım: STARS_CHROMIUM_PATH=/opt/pw-browsers/chromium STARS_OUTPUT=<dizin> [STARS_ROOT=<kök>] node tests/browser-rival-blocs0.cjs */
const assert=require('node:assert/strict'),{createServer}=require('node:http'),{readFile}=require('node:fs'),fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const root=path.resolve(process.env.STARS_ROOT||path.join(__dirname,'..')),out=process.env.STARS_OUTPUT||'/tmp/stars-rival-blocs0';fs.mkdirSync(out,{recursive:true});
const server=createServer((req,res)=>{const p=new URL(req.url,'http://localhost').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!file.startsWith(root+path.sep))return res.writeHead(403).end();
  readFile(file,(e,d)=>{if(e)return res.writeHead(404).end();res.setHeader('Content-Type',{'.js':'text/javascript','.html':'text/html'}[path.extname(file)]||'application/json');res.end(d);});});
let pass=0,fail=0;const rows=[];
async function test(name,fn){try{const r=await fn();rows.push({name,status:'PASS',...(r||{})});pass++;console.log('PASS '+name);}catch(e){rows.push({name,status:'FAIL',error:String(e&&e.stack||e)});fail++;console.log('FAIL '+name+'\n'+(e&&e.stack||e));}}
const startGame=async(page,cfg)=>{await page.evaluate(cfg=>{Object.assign(CFG,cfg);G.autoSave=false;startGame();},cfg);await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});await page.evaluate(()=>{UI.setSpeed(0);G.autoSave=false;});await clean(page);};
const clean=page=>page.evaluate(()=>{for(let i=0;i<6&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();if(document.getElementById('diploPane').classList.contains('show'))UI.act('closeDiplo');UI.setSpeed(0);});
async function run(){
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.STARS_CHROMIUM_PATH,args:['--no-sandbox','--disable-dev-shm-usage']});
  const url='http://127.0.0.1:'+server.address().port;
  try{
    for(const [w,h] of [[390,844],[800,360]]){
      const ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      const V=w+'x'+h,tap=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(120);};
      await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}});
      await page.evaluate(()=>{resetSetupNaming();SETUP_STEP='galaksi';leaveTitle('setup');CFG.aiCount=8;CFG.size='buyuk';safeRenderSetup();});await page.waitForSelector('#setup #rivalPresets');
      await test(V+' Rakip Doktrinler: Az → 5–6 → sabit sayı → AI sayısını düşür → Doğal; klavye yok, sınırlar her dokunuşta geçerli',async()=>{
        const st=()=>page.evaluate(()=>({r:CFG.aiRivals?{...CFG.aiRivals}:null,n:aiCountFor(CFG),sum:document.getElementById('rivalSum')?.innerText||'',on:[...document.querySelectorAll('#rivalPresets .opt.on')].map(b=>b.dataset.x),inputs:document.querySelectorAll('.rivalSect input').length,dis:[...document.querySelectorAll('.rivalSect [data-a="rivalStep"][disabled]')].map(b=>b.dataset.x)}));
        const steps=[];const ok=s=>{if(s.r)assert.ok(s.r.min>=0&&s.r.min<=s.r.max&&s.r.max<=s.n,JSON.stringify(s));assert.equal(s.inputs,0,'sayı kutusu yok');};
        await tap('#rivalPresets [data-x="az"]');let s=await st();ok(s);steps.push(s);assert.deepEqual(s.on,['az']);assert.match(s.sum,/Seçili: 0–2 AI/);
        await page.locator('#rivalPresets').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${V}-rakip-az.png`)});
        for(let i=0;i<4;i++)await tap('.rivalSect [data-x="max:1"]');for(let i=0;i<5;i++)await tap('.rivalSect [data-x="min:1"]');
        s=await st();ok(s);steps.push(s);assert.deepEqual(s.r,{min:5,max:6},JSON.stringify(s));assert.match(s.sum,/Seçili: 5–6 AI/);assert.deepEqual(s.on,[],'elle değişiklikte hazır seçim vurgusu kalkar');assert.match(s.sum,/özel aralık/);
        await page.locator('.rivalRange').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${V}-rakip-5-6.png`)});
        await tap('.rivalSect [data-x="max:-1"]');s=await st();ok(s);steps.push(s);assert.deepEqual(s.r,{min:5,max:5});assert.match(s.sum,/sabit sayı/);
        for(let i=0;i<5;i++)await tap('#setup [data-a="aiCount"][data-x="-1"]');s=await st();ok(s);steps.push(s);assert.equal(s.n,3);assert.deepEqual(s.r,{min:3,max:3},'AI sayısı düşünce aralık uyarlanır');assert.ok(s.dis.includes('max:1')&&s.dis.includes('min:1'),'sınırdaki düğmeler pasif');
        await page.locator('.rivalRange').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${V}-rakip-ai-dusuk.png`)});
        await tap('#rivalPresets [data-x="auto"]');s=await st();steps.push(s);assert.equal(s.r,null,'Doğal');assert.deepEqual(s.on,['auto']);
        const focus=await page.evaluate(()=>document.activeElement?.tagName);assert.notEqual(focus,'INPUT','klavye açılmadı');
        return {steps};});
      if(w===390)await test(V+' seçim kurulum sonucuna yansır: 8 AI, 5–6 → oyunda militarist+kriminal+arındırıcı toplamı 5–6; 0,05× çarpan dokunarak seçilir',async()=>{
        await page.evaluate(()=>{CFG.aiCount=8;safeRenderSetup();});await tap('#rivalPresets [data-x="orta"]');
        for(let i=0;i<8;i++){const r=await page.evaluate(()=>CFG.aiRivals);if(r.max<6)await tap('.rivalSect [data-x="max:1"]');else if(r.max>6)await tap('.rivalSect [data-x="max:-1"]');else if(r.min<5)await tap('.rivalSect [data-x="min:1"]');else break;}
        assert.deepEqual(await page.evaluate(()=>CFG.aiRivals),{min:5,max:6});
        await tap('#planetMulRow [data-x="0.05"]');assert.equal(await page.evaluate(()=>CFG.planetMul),.05);
        const txt=await page.evaluate(()=>document.getElementById('planetMulRow').parentElement.innerText);assert.match(txt,/%5'i kalır/);
        await page.locator('#planetMulRow').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,`${V}-carpan-005.png`)});
        await tap('#setup [data-a="start"]');await page.waitForFunction(()=>typeof G!=='undefined'&&G.p&&G.sys?.length&&!document.getElementById('game').classList.contains('hidden'),undefined,{timeout:60000});
        const r=await page.evaluate(()=>({n:G.emps.filter(e=>e.ai&&!e.wild&&!e.crisisSide&&RIVAL_PERSONAS.includes(personaKey(e))).length,mul:G.cfg.planetMul,lpm:LAST_PLANET_MUL&&{b:LAST_PLANET_MUL.before.normal,a:LAST_PLANET_MUL.after.normal}}));
        assert.ok(r.n>=5&&r.n<=6,JSON.stringify(r));assert.equal(r.mul,.05);assert.equal(r.lpm.a,Math.round(r.lpm.b*.05));return r;});
      assert.deepEqual(errors,[],errors.join('\n'));await ctx.close();
    }
    /* Oyun içi: büyük armalar, kuruluş, üye daveti, otomatik inşaat (yatay telefon 844×390 — oyun dikeyde "çevir" katmanı gösterir; gerçek dokunma) */
    {
      const ctx=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
      const modals=[];
      /* Kapanmamış bağımsız bildirim penceresi (#modal) panel düğmesinin üstünü örterse önce kapatılır ve günlüğe yazılır. */
      const tap=async sel=>{const m=await page.evaluate(()=>{const el=document.getElementById('modal');if(el.classList.contains('hidden'))return null;const t=el.innerText.slice(0,160);UI.closeModal();return t;});if(m)modals.push({before:sel,modal:m});
        const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();await l.tap();await page.waitForTimeout(150);};
      await page.goto(url);await page.evaluate(()=>{try{localStorage.clear();}catch{}});
      await page.evaluate(()=>{resetSetupNaming();leaveTitle('setup');});await startGame(page,{seed:11,size:'orta',aiCount:7,pirates:false});
      await test('Büyük bölge armaları: KATMANLAR anahtarı; aynı kamerada kapalı/açık görüntü; arma kendi bölgesinin içinde, ⅔ genişlik; tercih cihazda saklanır',async()=>{
        await page.evaluate(()=>{for(const s of G.sys){if(!s.seen.includes(0))s.seen.push(0);}View.invalidateRenderCaches?.('test');View.cam.z=Math.max(View.cam.z,.35);View.draw(performance.now());});
        await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'arma-kucuk-kapali.png')});
        const small=await page.evaluate(()=>(View._emblemPlaced||[]).map(x=>({...x})));
        await clean(page);await tap('#grpMap .grpHead');await tap('#bigEmblemsBtn');await page.evaluate(()=>{if(document.querySelector('#outMap'))UI.act('grpTog','map');});
        await page.evaluate(()=>View.draw(performance.now()));await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'arma-buyuk-acik.png')});
        const big=await page.evaluate(()=>{const L=View._bigEmblem.list,owned=G.sys.filter(s=>s.owner>=0&&s._reach>0&&pSeen(s));
          const ownerAt=(x,y)=>{let b=null,v=Infinity;for(const s of owned){const d=Math.hypot(x-s.x,y-s.y)/s._reach;if(d<v){v=d;b=s;}}return v<1?b.owner:-1;};
          return {on:BIG_EMBLEMS_ON,placed:(View._emblemPlaced||[]).filter(x=>x.big).length,ms:View._bigEmblem.ms,checks:L.map(b=>{const pts=[[0,0],...[...Array(8)].map((_,k)=>[Math.cos(k*Math.PI/4)*b.size/2,Math.sin(k*Math.PI/4)*b.size/2])];return {owner:b.owner,inside:pts.every(([dx,dy])=>ownerAt(b.x+dx,b.y+dy)===b.owner),ratio:b.size/(2*b.R)};})};});
        assert.equal(big.on,true);assert.ok(big.placed>=1,JSON.stringify(big));assert.ok(big.checks.every(c=>c.inside),'arma bölge dışına taşmaz '+JSON.stringify(big.checks));
        assert.ok(big.checks.every(c=>Math.abs(c.ratio-2/3)<1e-6),'iç genişliğin ⅔ü');
        const pref=await page.evaluate(()=>storeGet('stars:bigEmblems'));assert.equal(pref,'on');
        const tapHit=await page.evaluate(()=>{const b=View._emblemPlaced.find(x=>x.big);const s=G.sys.reduce((a,s)=>{const p=View.w2s(s.x,s.y);const d=Math.hypot(p.x-b.x,p.y-b.y);return !a||d<a.d?{s,d}:a;},null);return {near:s.s.id};});
        return {small:small.length,big,pref,tapHit};});
      await test('Büyük arma tercihi yeniden yüklemede geri gelir; %0 opaklık iki kipte de görünürlüğü kapatır',async()=>{
        await page.reload();await page.evaluate(()=>{resetSetupNaming();leaveTitle('setup');});await startGame(page,{seed:11,size:'orta',aiCount:7,pirates:false});
        await page.waitForFunction(()=>BIG_EMBLEMS_ON===true,undefined,{timeout:5000});
        const r=await page.evaluate(()=>{UI.territoryEmblemOpacity=0;View.draw(performance.now());const a=(View._emblemPlaced||[]).length;UI.territoryEmblemOpacity=18;return a;});
        assert.equal(r,0);return {afterReload:true};});
      await test('Gerçek düğmelerle ittifaksız kuruluş: iki AI kurucu seç → KURULUŞ DAVETLERİNİ GÖNDER → SON KURULUŞ ONAYI; ittifaklar federasyonla birlikte',async()=>{
        const pick=await page.evaluate(()=>{const p=G.p;for(const s of G.sys){if(!s.seen.includes(0))s.seen.push(0);for(const e of G.emps)if(!s.seen.includes(e.id))s.seen.push(e.id);}
          for(const e of G.emps){if(e.wild)continue;e.res.etk=5000;for(const o of G.emps)if(o!==e&&!o.wild){e.contact[o.id]=true;e.ally[o.id]=false;e.war[o.id]=false;e.rel[o.id]=80;}e.aiIntel={v:1,systems:Object.fromEntries(G.sys.map(s=>[s.id,{owner:s.owner,defense:sysDefense(s),day:G.day}]))};}
          G.feds=[];G.fedFounding=null;for(const e of G.emps){delete e._fedPoliticsAfter;e._fedLeaveUntil=0;}const ok=G.emps.filter(o=>o.ai&&!o.wild&&fedFoundCandidate(p,o).ok&&fedFoundAssessment(o,p,{type:'ticaret',ballot:'equal',members:[0,o.id]}).ok).map(o=>o.id).slice(0,2);UI.fedFoundType='ticaret';UI.fedBallotChoice='equal';UI.fedFoundSelected=[];return ok;});
        assert.equal(pick.length,2,JSON.stringify(pick));
        await clean(page);await page.evaluate(()=>UI.openFed());await tap('[data-a="fedFoundType"][data-x="ticaret"]');assert.equal(await page.evaluate(()=>UI.fedFoundType),'ticaret');for(const id of pick)await tap(`[data-a="fedFoundSelect"][data-x="${id}"]`);
        const txt=await page.evaluate(()=>document.body.innerText);assert.match(txt,/Kurulacak ittifaklar/);assert.match(txt,/ittifak kuruluşla birlikte kurulur/);
        await page.screenshot({path:path.join(out,'kurulus-ittifaksiz.png')});
        await tap('[data-a="fedFoundStart"]');
        const rep=await page.evaluate(()=>{const p=G.fedFounding?.proposals.find(p=>p.by===0);return p&&Object.fromEntries(Object.entries(p.replies).map(([k,r])=>[k,r.status+': '+r.why]));});
        assert.ok(rep&&Object.values(rep).every(v=>v.startsWith('accepted')),'AI yanıtları: '+JSON.stringify(rep));
        await tap('[data-a="fedFoundFinish"]');
        const r=await page.evaluate(ids=>({fed:findFed(G.p)?.members||null,allied:[0,...ids].every(a=>[0,...ids].every(b=>a===b||G.emps[a].ally[b]))}),pick);
        assert.ok(r.fed&&r.fed.length===3,JSON.stringify(r));assert.equal(r.allied,true);return {pick,...r};});
      await test('Gerçek düğmelerle ittifaksız üye daveti: Diplomasi → Federasyonuma Davet Et → oy kartında EVET → AI kabul → üyelik + ittifaklar',async()=>{
        const target=await page.evaluate(()=>{const f=findFed(G.p);f.nextVote=G.day+9999;return G.emps.find(o=>o.ai&&!o.wild&&!o.dead&&!findFed(o)&&!o.ally[0]&&aiFedWilling(o,G.p,f.type,f).ok)?.id;});
        assert.ok(Number.isInteger(target),'aday');
        await clean(page);await page.evaluate(id=>{UI._diploFocus=id;UI.openDiplo();},target);await page.waitForTimeout(300);
        const inviteSel='[data-a="fedDipInvite"]';await page.waitForSelector(inviteSel,{timeout:8000});const txt=await page.locator('.fedAllies').first().innerText();assert.match(txt,/Ön ittifak gerekmez/);
        await page.screenshot({path:path.join(out,'davet-ittifaksiz.png')});
        await tap(inviteSel);
        await page.evaluate(()=>{const f=findFed(G.p);if(f.vote){const tok=fedVoteToken(f.vote);for(const id of f.members)if(id!==0)castFedVote(G.emps[id],f.id,tok,true);}UI.openFed();});
        await page.evaluate(()=>UI.act('fedVoteNow',String(findFed(G.p).id)));const yesSel='#modal [data-a="inboxYes"], #modal [data-a="fedYes"]';await page.waitForSelector(yesSel,{timeout:8000});
        const card=await page.locator('#modal').innerText();await page.screenshot({path:path.join(out,'davet-oy-karti.png')});
        await page.locator(yesSel).first().tap();await page.waitForTimeout(250);
        await page.evaluate(()=>{const f=findFed(G.p);if(f.vote)fedResolveVote(f);});
        const r=await page.evaluate(id=>{const f=findFed(G.p);return {member:f.members.includes(id),allied:f.members.every(a=>f.members.every(b=>a===b||G.emps[a].ally[b])),vote:f.vote&&{motion:f.vote.motion,yes:f.vote.yes,no:f.vote.no},invite:f.invites?.[id]||null,adm:(f.admissions||f.history||[]).slice(-3),agenda:f.agenda?.history?.slice(-2)};},target);
        assert.equal(r.member,true,JSON.stringify(r));assert.equal(r.allied,true);return {target,...r};});
      await test('Koloni panelinden otomatik inşaat: gemi seçmeden yapı düğmesi → en erken varacak boş İNŞ atanır; panelde gemi / tahmini varış / maliyet',async()=>{
        await clean(page);const key=await page.evaluate(()=>{const e=G.p,T=G.sys[e.home];for(const k of Object.keys(e.res))e.res[k]=99999;e.insReady=true;G.fleets=G.fleets.filter(f=>!(f.e===0&&f.ships.some(s=>s.c==='ins')));
          const far=G.sys.filter(s=>s.owner===0||s.planets.some(p=>p.owner===0)).find(s=>s.id!==T.id)||G.sys[T.lanes[0]];newFleet(e,far.id,[{c:'ins'}],'İnş Uzak');
          UI.closeModal?.();View.sel=null;View.selSys=T;UI.tab('sistem');return Object.keys(STRUCTS).find(k=>structAllowed(e,T,k)&&k!=='kapi');});
        const sel=`[data-a="autoBuild"][data-x="${await page.evaluate(()=>G.p.home)}:${key}"]`;await page.waitForSelector(sel,{timeout:8000});
        await tap(sel);await page.waitForTimeout(200);const r=await page.evaluate(()=>{const t=Object.values(RemoteConstruction.state().queues).flat()[0];return t&&{fleet:G.fleets.find(f=>f.id===t.fleet)?.name,eta:t.eta,auto:t.auto,state:t.state};});
        assert.ok(r&&r.auto&&r.fleet==='İnş Uzak',JSON.stringify(r));const panel=await page.locator('.autoTask').first().innerText();assert.match(panel,/tahmini varış/);assert.match(panel,/Maliyet/);
        await page.locator('.autoTask').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(out,'otomatik-insaat.png')});return {key,...r};});
      await test('500 sistem / 16 AI: büyük arma yerleşimi bir kez hesaplanır, kare başına çizim maliyeti ölçülür (kapalı / açık)',async()=>{
        await page.evaluate(()=>{BIG_EMBLEMS_ON=false;View.sel=null;View.selSys=null;});await startGame(page,{seed:404,size:'s500',aiCount:16,pirates:false});
        const m=await page.evaluate(()=>{for(const s of G.sys)if(!s.seen.includes(0))s.seen.push(0);for(const o of G.emps)if(o!==G.p&&!o.wild)G.p.contact[o.id]=o.contact[0]=true;View.invalidateRenderCaches?.('test');View.cam.z=.12;
          const time=n=>{const t=[];for(let i=0;i<n;i++){const a=performance.now();View.draw(a);t.push(performance.now()-a);}t.sort((a,b)=>a-b);return {med:t[n>>1],p95:t[Math.floor(n*.95)]};};
          BIG_EMBLEMS_ON=false;View.draw(performance.now());const off=time(40);BIG_EMBLEMS_ON=true;View._bigEmblem=null;const a=performance.now();View.draw(a);const first=performance.now()-a;const layout=View._bigEmblem.ms;const on=time(40);
          return {off,on,first,layout,emblems:View._bigEmblem.list.length};});
        await page.screenshot({path:path.join(out,'arma-buyuk-500.png')});assert.ok(m.layout<400,'yerleşim '+m.layout+' ms');return m;});
      rows.push({name:'kapatılan bildirim pencereleri',status:'INFO',modals});
      assert.deepEqual(errors,[],errors.join('\n'));await ctx.close();
    }
  }finally{await browser.close();server.close();fs.writeFileSync(path.join(out,'browser-rival-blocs0.json'),JSON.stringify(rows,null,1));}
  console.log(`GEÇEN: ${pass} KALAN: ${fail}`);if(fail)process.exitCode=1;
}
run().catch(e=>{console.error(e);process.exitCode=1;});

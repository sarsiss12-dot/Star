'use strict';
/* MP-SYNC-FED.1 — I senaryosu: uzun oturum, host + İKİ misafir (ayrı Chromium profilleri), 500 sistem / 16 AI, gerçek oyun döngüsü (rAF + yayın + ayna kısması).
   Yerel Chromium + üretim relay süreci + TLS vekili; fiziksel cihaz / gerçek internet / Render DEĞİLDİR.
   I1 MP8_I_MIN dakika (vars. 15) boyunca saatli olaylar döner (her misafirde sırayla): hız değişimi (2× / 4× / en yüksek), açık pencere 20 sn → kapatma,
      arka plan (sayfa dondurulur 20 sn) → öne dönüş, kısa bağlantı kaybı (3 sn), emir (filo hareketi + tersane). Her 2 sn örnek: host günü, host'un o misafire
      son ayna revizyonu, misafirin ALDIĞI ve UYGULADIĞI revizyon, misafir günü, eşitleme notu, pencere açık mı, son başarılı emir.
      Donma iki sınıfa ayrılır: PENCERE AÇIK bekleme (tasarım; neden pencere üstü hapta görünmeli) ve PENCERE KAPALI donma (kusur). Kapalı donma > MP8_I_STALL_S (vars. 20)
      sn sürerse tanı kaydedilir. Planlı arka plan / kopma pencereleri donma sayılmaz; dönüşten sonra yetişme süresi ölçülür.
   I2 görsel tutarlılık (oyun duraklatılmış, ayna eşit): kendi filo rotası, keşfedilen sistemler, bilinen kolonileştirilebilir işaretleri (playerHabitatMark),
      görünür sistem sahipliği (sınırlar), yabancı filonun can oranı; çatışan filo (host'ta f.combat) misafir haritasında da çatışmada (halka + can çubuğu).
   I3 sensör paylaşımı: B → C tek yön; C'nin görüşü B'nin sensörünü alır, B C'ninkini almaz, host'un kendi görüşü değişmez. */
const fs=require('fs'),path=require('path');
const MIN=+(process.env.MP8_I_MIN||15),STALL=+(process.env.MP8_I_STALL_S||20)*1000,FF=+(process.env.MP8_I_FF||12);
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,settle}=X;
 const H=()=>pg.H,G2=['B','C'];const I=metrics.fed1soak={min:MIN,ff:FF,samples:[],stalls:[],holds:[],events:[],cmds:[],catchups:[]};
 const E={};for(const n of G2)E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 const hostRev=e=>H().evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return {day:G.day,spd:G.speed|0,mrev:p&&p.mirrorRev||0,wrev:MP1Host.host.state.worldRevision|0};},e);
 const gdiag=n=>pg[n].evaluate(()=>{const S=MP6Stars.S,m=document.getElementById('modal');const pill=document.getElementById('mp61Pill');
   return {day:G.day,rev:S.rev|0,applied:S.appliedRev|0,note:(S.sync&&S.sync.note)||'',modal:!!(m&&!m.classList.contains('hidden')),pill:pill&&pill.classList.contains('on')?pill.innerText.slice(0,160):'',ws:MP1Join.ws?MP1Join.ws.readyState:-1,resyncs:S.stats.resyncs|0,held:S.stats.held|0};}).catch(e=>({err:String(e&&e.message||e).slice(0,120)}));
 const maxSpd=()=>H().evaluate(()=>Math.max(...[...document.querySelectorAll('#timepod .sp')].map(b=>+b.dataset.x)));
 const setSpd=v=>H().evaluate(v=>{const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden'))try{UI.closeModal();}catch{}return MP1Host.host.local({kind:'speed',value:v}).ok;},v);
 const cmd1=async(n,c)=>{const r=await pg[n].evaluate(c=>MP1Join.cmd(c),c);if(!r.ok)return {status:'local',code:r.why};
   const got=await pg[n].waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,{timeout:15000,polling:100}).then(()=>true,()=>false);if(!got)return {status:'no-reply',cid:r.cid};
   return pg[n].evaluate(cid=>{const x=MP1Join.results.filter(y=>y.cid===cid).at(-1);return {status:x.status,code:x.code||null,rev:x.rev};},r.cid);};
 const order=async(n,label)=>{const o={who:n,label,at:Date.now()};try{await pg[n].evaluate(()=>{try{UI.closeModal();}catch{}});
     const f=await pg[n].evaluate(()=>{const f=G.fleets.find(f=>f.e===0&&f.ships.length&&f.sys>=0&&!f.mv);return f?{id:f.id,to:G.sys[f.sys].lanes[0]}:null;});
     if(f)o.move=await cmd1(n,{kind:'move',fleet:f.id,to:f.to});
     const y=await pg[n].evaluate(()=>{const s=G.sys.find(s=>s.owner===0&&typeof hasYard==='function'&&hasYard(s));return s?s.id:null;});
     if(y!==null){o.ship=await cmd1(n,{kind:'ship',sys:y,key:'kor'});if(o.ship.status==='ok'){const t1=Date.now();o.shipSeen=await pg[n].waitForFunction(rev=>MP6Stars.S.appliedWorldRev>=rev&&MP6Stars.S.appliedGeneration===MP6Stars.S.gen,o.ship.rev,{timeout:STALL,polling:200}).then(()=>true,()=>false);o.reflectMs=Date.now()-t1;}}
   }catch(e){o.err=String(e&&e.message||e).slice(0,160);}I.cmds.push(o);return o;};
 const catchUp=async(n,label,t0)=>{const h=await hostRev(E[n]);const ok=await pg[n].waitForFunction(d=>G.day>=d-1.5,h.day,{timeout:30000,polling:250}).then(()=>true,()=>false);const r={who:n,label,ok,ms:Date.now()-t0,hostDay:Math.round(h.day*10)/10};I.catchups.push(r);return r;};

 await test('I1 uzun oturum '+MIN+' dk (500 sistem / 16 AI / host + 2 misafir): hız değişimi, açık pencere → kapatma, arka plan → dönüş, kısa kopma, emirler; pencere KAPALIYKEN misafir dünyası '+(STALL/1000)+' sn\'den uzun durmaz; açık pencere bekletmesinin nedeni pencere üstünde görünür',async()=>{
   const t0=Date.now();for(let m=0;m<FF;m++)await H().evaluate(()=>MP1Host.advance(30));I.ffSeconds=Math.round((Date.now()-t0)/1000);await settle('i-ff');
   const MX=await maxSpd();const speeds=[2,4,MX];let si=0;await setSpd(speeds[0]);
   const start=Date.now(),end=start+MIN*60000;const last={};for(const n of G2)last[n]={day:-1,moveAt:Date.now(),hostDayAtMove:0,busyUntil:0};
   let nextEv=Date.now()+20000,evI=0,nextSample=0;
   const EVS=['speed','window','background','cut','order'];
   while(Date.now()<end){
     if(Date.now()>=nextEv){const kind=EVS[evI%EVS.length],n=G2[Math.floor(evI/EVS.length)%2];evI++;nextEv=Date.now()+30000;const ev={kind,who:n,t:Math.round((Date.now()-start)/1000)};
       try{
         if(kind==='speed'){si=(si+1)%speeds.length;ev.spd=speeds[si];ev.ok=await setSpd(speeds[si]);
           await sleep(1500);ev.note=await pg[n].evaluate(()=>MP6Stars.S.stats.speedMsgs|0);}
         else if(kind==='window'){await pg[n].evaluate(()=>UI.act('topStatus'));last[n].busyUntil=Date.now()+25000;await sleep(8000);
           const g=await gdiag(n);ev.modal=g.modal;ev.pill=g.pill;ev.note=g.note;I.holds.push({who:n,t:ev.t,pill:g.pill,note:g.note});
           await sleep(12000);const tc=Date.now();await pg[n].evaluate(()=>{try{UI.closeModal();}catch{}});ev.catch=await catchUp(n,'pencere',tc);}
         else if(kind==='background'){const s=await pg[n].context().newCDPSession(pg[n]);last[n].busyUntil=Date.now()+40000;await s.send('Page.setWebLifecycleState',{state:'frozen'});await sleep(20000);
           await s.send('Page.setWebLifecycleState',{state:'active'});await s.detach();const tc=Date.now();ev.catch=await catchUp(n,'arka plan',tc);}
         else if(kind==='cut'){last[n].busyUntil=Date.now()+40000;await lanes[n].down();await sleep(3000);await lanes[n].up();const tc=Date.now();
           await pg[n].waitForFunction(()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,{timeout:30000,polling:200}).catch(()=>{});ev.catch=await catchUp(n,'kopma',tc);}
         else if(kind==='order'){const o=await order(n,'t+'+ev.t);ev.move=o.move&&o.move.status;ev.ship=o.ship&&o.ship.status;ev.shipSeen=o.shipSeen;ev.reflectMs=o.reflectMs;}
       }catch(e){ev.err=String(e&&e.message||e).slice(0,160);}
       I.events.push(ev);console.log('  OLAY '+JSON.stringify(ev).slice(0,300));for(const k of G2){last[k].moveAt=Date.now();last[k].day=-1;}}
     await sleep(400);if(Date.now()<nextSample)continue;nextSample=Date.now()+2000;
     for(const n of G2){const h=await hostRev(E[n]),g=await gdiag(n);if(g.err)continue;const L=last[n];
       I.samples.push({t:Math.round((Date.now()-start)/1000),who:n,hd:Math.round(h.day*10)/10,gd:Math.round(g.day*10)/10,mrev:h.mrev,grev:g.rev,gapp:g.applied,mo:g.modal?1:0,note:g.note.slice(0,40)});
       if(g.day!==L.day){L.day=g.day;L.moveAt=Date.now();L.hostDayAtMove=h.day;continue;}
       if(Date.now()<L.busyUntil)continue;
       const still=Date.now()-L.moveAt;
       if(still>STALL&&h.day-L.hostDayAtMove>3){
         const lastOk=I.cmds.filter(c=>c.who===n&&c.ship&&c.ship.status==='ok').at(-1)||null;
         const s={who:n,t:Math.round((Date.now()-start)/1000),stillMs:still,window:g.modal,host:{day:h.day,mrev:h.mrev,wrev:h.wrev,spd:h.spd},guest:g,lastOk:lastOk&&{label:lastOk.label,rev:lastOk.ship.rev,seen:lastOk.shipSeen}};
         if(g.modal){I.holds.push({...s,kind:'açık pencere'});await pg[n].evaluate(()=>{try{UI.closeModal();}catch{}});}
         else{I.stalls.push(s);console.log('  DONMA '+JSON.stringify(s).slice(0,900));await shot(pg[n],'i1-donma-'+n);
           await sleep(15000);const g2=await gdiag(n);s.selfRecovered=g2.day!==g.day;s.later=g2;}
         L.moveAt=Date.now();L.day=-1;}}
   }
   await setSpd(0);fs.writeFileSync(path.join(out,'i1-soak.json'),JSON.stringify(I,null,1));
   const lag=Math.max(0,...I.samples.map(s=>s.hd-s.gd));I.maxLagDays=Math.round(lag*10)/10;
   console.log('  örnek '+I.samples.length+' · olay '+I.events.length+' · kapalı-pencere donma '+I.stalls.length+' · açık-pencere bekleme '+I.holds.length+' · en büyük gün farkı '+I.maxLagDays);
   assert.equal(I.stalls.filter(s=>!s.selfRecovered).length,0,'pencere kapalıyken kalıcı donma: '+JSON.stringify(I.stalls[0]||{}).slice(0,700));
   assert(I.catchups.every(c=>c.ok),'her pencere / arka plan / kopma dönüşünde misafir yetişti: '+JSON.stringify(I.catchups.filter(c=>!c.ok)).slice(0,500));
   const wins=I.events.filter(e=>e.kind==='window');assert(wins.length>0,'pencere olayı koştu');assert(wins.every(e=>e.modal&&/Pencere açık/.test(e.pill)),'açık pencere bekletmesinin nedeni hapta: '+JSON.stringify(wins).slice(0,500));
   const lost=I.cmds.filter(c=>c.ship&&c.ship.status==='ok'&&c.shipSeen===false);assert.equal(lost.length,0,'kabul edilen sipariş misafire yansımadı: '+JSON.stringify(lost[0]||{}).slice(0,300));});

 /* ---- I2: görsel tutarlılık (duraklatılmış oyun, ayna eşit) ---- */
 const viewOf=n=>pg[n].evaluate(()=>{const fl=G.fleets.filter(f=>f.ships.length).map(f=>({id:f.id,e:f.e,sys:f.sys,mv:f.mv?[f.mv.from,f.mv.to]:null,path:f.e===0?(f.path||[]).slice():null,hp:Math.round(fleetHealth(f)*1000),combat:f.combat?1:0}));
   return {fl,seen:G.sys.filter(s=>(s.seen||[]).includes(0)).map(s=>s.id),hab:G.sys.map(s=>playerHabitatMark(s)),own:[...G.vis].map(id=>[id,G.sys[id].owner===undefined||G.sys[id].owner===null?null:G.sys[id].owner]).sort((a,b)=>a[0]-b[0]),vis:[...G.vis].sort((a,b)=>a-b)};});
 const truthFor=(e,vis)=>H().evaluate(([e,vis])=>{const pi=x=>x===e?0:x===0?e:x,V=new Set(vis);
   const fl=G.fleets.filter(f=>f.ships.length).map(f=>({id:f.id,e:pi(f.e),sys:f.sys,mv:f.mv?[f.mv.from,f.mv.to]:null,path:f.e===e?(f.path||[]).slice():null,hp:Math.round(fleetHealth(f)*1000),combat:f.combat?1:0,at:f.sys>=0?f.sys:f.mv?f.mv.from:-1}));
   // Kalıcı bellek, son sensör hareketini henüz içermeyebilir. Host'un o anda aktöre yetkilendirdiği görünümü ölç.
   const E=G.emps[e],ctx=humanVisionContext(E),habitats=humanMapKnowledge(E,ctx).habitats;
   return {fl,seen:[...ctx.known],hab:G.sys.map(s=>ctx.known.has(s.id)&&s.surv.includes(e)?habitats[s.id]?.mask||0:0),
     own:vis.map(id=>[id,G.sys[id].owner===undefined||G.sys[id].owner===null?null:pi(G.sys[id].owner)]).sort((a,b)=>a[0]-b[0])};},[e,vis]);
 const mirrorEq=async n=>{await pg[n].evaluate(()=>{try{UI.closeModal();}catch{}});const all=await settle('i2-'+n);
   await wait(pg[n],r=>MP6Stars.S.appliedRev===r&&MP6Stars.S.appliedGeneration===MP6Stars.S.gen,all[n].rev);};

 await test('I2 görsel tutarlılık: rota, keşfedilen sistemler, bilinen kolonileştirilebilir işaretler, görünür sınırlar ve can oranı host ile aynı; çatışan yabancı filo misafir haritasında da çatışmada (halka + can çubuğu)',async()=>{
   await setSpd(0);
   /* çatışma fikstürü: B'nin görünür sistemine savaştaki bir AI filosu; host motorunun çatışma bayrağı (combat=2), tam can */
   I.fight=await H().evaluate(b=>{const e=G.emps[b],vis=humanVisionContext(e).visible;const s=G.sys[e.home];const foe=G.emps.find(o=>o.ai&&!o.dead&&!o.wild&&!e.ally[o.id]);
     const f=G.fleets.find(f=>f.e===foe.id&&f.ships.length&&isArmed(f));if(!f)return null;e.war[foe.id]=foe.war[e.id]=true;e.contact[foe.id]=foe.contact[e.id]=true;
     f.sys=s.id;f.mv=null;f.path=[];f.x=s.x;f.y=s.y;f.combat=2;for(const sh of f.ships)sh.h=1;const mine=G.fleets.find(x=>x.e===b&&x.ships.length&&x.sys===s.id);if(mine)mine.combat=2;
     MP1Host.host.publish();return {fleet:f.id,foe:foe.id,sys:s.id,visible:vis.has(s.id),mine:mine&&mine.id};},E.B);
   assert(I.fight&&I.fight.visible,'fikstür: B\'nin görünür sisteminde çatışma '+JSON.stringify(I.fight));
   const res={};
   for(const n of G2){await mirrorEq(n);const g=await viewOf(n),h=await truthFor(E[n],g.vis);
     const gf=new Map(g.fl.map(f=>[f.id,f]));const diff={route:[],hp:[],combat:[]};
     for(const f of h.fl){const x=gf.get(f.id);if(f.e===0){if(!x){diff.route.push(['yok',f.id]);continue;}if(JSON.stringify(x.mv)!==JSON.stringify(f.mv)||JSON.stringify(x.path)!==JSON.stringify(f.path))diff.route.push([f.id,x.mv,f.mv,x.path,f.path]);}
       if(x&&x.hp!==f.hp)diff.hp.push([f.id,x.hp,f.hp]);if(x&&f.combat&&!x.combat)diff.combat.push([f.id,f.e]);}
     const seenMiss=h.seen.filter(id=>!g.seen.includes(id)),seenExtra=g.seen.filter(id=>!h.seen.includes(id));
     const habDiff=h.hab.map((m,i)=>[i,g.hab[i],m]).filter(([,a,b])=>a!==b);
     res[n]={fleets:h.fl.length,seen:h.seen.length,seenMiss:seenMiss.length,seenExtra:seenExtra.length,hab:h.hab.filter(Boolean).length,habDiff:habDiff.slice(0,6),ownDiff:g.own.filter((x,i)=>JSON.stringify(x)!==JSON.stringify(h.own[i])).slice(0,6),diff};}
   I.visual=res;await shot(pg.B,'i2-b-harita');console.log('  I2 '+JSON.stringify(res).slice(0,900));
   for(const n of G2){const r=res[n];assert.equal(r.diff.route.length,0,n+' kendi filo rotası host ile aynı '+JSON.stringify(r.diff.route).slice(0,300));
     assert.equal(r.seenMiss+r.seenExtra,0,n+' keşfedilen sistemler aynı');assert.equal(r.habDiff.length,0,n+' kolonileştirilebilir işaretler aynı '+JSON.stringify(r.habDiff));
     assert.equal(r.ownDiff.length,0,n+' görünür sınırlar aynı');assert.equal(r.diff.hp.length,0,n+' can oranları aynı '+JSON.stringify(r.diff.hp).slice(0,300));}
   assert.equal(res.B.diff.combat.length,0,'B haritasında çatışan filolar çatışmada (host combat): '+JSON.stringify(res.B.diff.combat));});

 await test('I3 sensör paylaşımı tek yön: B → C; C, B\'nin sensör sistemlerini görür, B C\'ninkileri görmez, host\'un kendi görüşü değişmez',async()=>{
   const before=await H().evaluate(([b,c])=>({h:[...humanVisionContext(G.p).visible].length,b:[...humanVisionContext(G.emps[b]).visible],c:[...humanVisionContext(G.emps[c]).visible]}),[E.B,E.C]);
   const r=await H().evaluate(([b,c])=>{const B=G.emps[b],C=G.emps[c];B.contact[c]=C.contact[b]=true;G._dealAuth=true;const ok=executeDeal({from:b,to:c,give:[{t:'intel'}],want:[],born:G.day,expires:G.day+30});G._dealAuth=false;MP1Host.host.publish();
     return {ok,share:!!(C.visionFrom&&C.visionFrom[b])};},[E.B,E.C]);
   await settle('i3');
   const after=await H().evaluate(([b,c])=>({h:[...humanVisionContext(G.p).visible].length,b:[...humanVisionContext(G.emps[b]).visible],c:[...humanVisionContext(G.emps[c]).visible]}),[E.B,E.C]);
   const gC=await pg.C.evaluate(()=>[...G.vis]),gB=await pg.B.evaluate(()=>[...G.vis]);
   /* motor kuralı: alan, verenin SENSÖR kaynaklarını alır (filo görüşü / başkasından gelen paylaşım aktarılmaz); doğruluk host'un C için hesapladığı görüşle */
   const gained=after.c.filter(id=>!before.c.includes(id)),leakFrom3rd=gained.filter(id=>!before.b.includes(id));
   const sameC=JSON.stringify([...gC].sort((a,b)=>a-b))===JSON.stringify(after.c.slice().sort((a,b)=>a-b));
   I.sensor={deal:r,gained:gained.length,leakFrom3rd:leakFrom3rd.length,cMirrorEqHost:sameC,bChanged:JSON.stringify(after.b.slice().sort())!==JSON.stringify(before.b.slice().sort()),bGetsC:before.c.filter(id=>!before.b.includes(id)&&gB.includes(id)).length,hostBefore:before.h,hostAfter:after.h};
   console.log('  I3 '+JSON.stringify(I.sensor));
   assert.equal(r.ok,true,'sensör paylaşımı anlaşması uygulandı');assert(gained.length>0,'C yeni sistem gördü');assert.equal(leakFrom3rd.length,0,'C yalnız B\'nin gördüğü sistemleri kazanır');
   assert.equal(sameC,true,'C misafir görüşü host\'un C için hesapladığıyla aynı');assert.equal(I.sensor.bChanged,false,'B\'nin görüşü değişmez (tek yön)');assert.equal(I.sensor.bGetsC,0,'B, C\'ninkileri görmez');
   assert.equal(after.h,before.h,'host\'un görüşü değişmez');});
};

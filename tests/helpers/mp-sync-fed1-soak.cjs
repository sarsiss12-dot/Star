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
 // Keep the actual room's initial Save8. The soak can reveal the entire small galaxy.
 I.initial=await H().evaluate(async()=>{
   globalThis.__i3InitialSave=serialize();const data=new TextEncoder().encode(globalThis.__i3InitialSave);
   const digest=await crypto.subtle.digest('SHA-256',data);
   return {sha256:[...new Uint8Array(digest)].map(n=>n.toString(16).padStart(2,'0')).join(''),
     rng:RND_STATE,day:G.day,size:G.sys.length,build:BUILD_ID};
 });
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

 await test('I1 uzun oturum '+MIN+' dk ('+metrics.conf.size+' / '+metrics.conf.ai+' AI / host + 2 misafir): hız değişimi, açık pencere → kapatma, arka plan → dönüş, kısa kopma, emirler; pencere KAPALIYKEN misafir dünyası '+(STALL/1000)+' sn\'den uzun durmaz; açık pencere bekletmesinin nedeni pencere üstünde görünür',async()=>{
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
   I.fight=await H().evaluate(b=>{const e=G.emps[b],vis=humanVisionContext(e).visible;const s=G.sys[e.home];
     const opponents=G.emps.filter(o=>o.ai&&!o.dead&&!o.wild&&!o.crisisSide&&!e.ally[o.id]);
     let f=G.fleets.find(f=>opponents.some(o=>o.id===f.e)&&f.ships.length&&isArmed(f));
     const injected=!f;
     if(!f&&opponents.length)f=newFleet(opponents[0],s.id,[{c:'kor'}],'I2 çatışma');
     if(!f)return null;
     const foe=G.emps[f.e];e.war[foe.id]=foe.war[e.id]=true;e.contact[foe.id]=foe.contact[e.id]=true;
     f.sys=s.id;f.mv=null;f.path=[];f.x=s.x;f.y=s.y;f.combat=2;for(const sh of f.ships)sh.h=1;const mine=G.fleets.find(x=>x.e===b&&x.ships.length&&x.sys===s.id);if(mine)mine.combat=2;
     MP1Host.host.publish();return {fleet:f.id,foe:foe.id,sys:s.id,visible:vis.has(s.id),mine:mine&&mine.id,injected};},E.B);
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

 const visibility=()=>H().evaluate(([b,c])=>{
   const rows=[G.p,G.emps[b],G.emps[c]].map(e=>{const ctx=humanVisionContext(e);
     return {visible:[...ctx.visible].sort((x,y)=>x-y),known:[...ctx.known].sort((x,y)=>x-y)};});
   return {rows,native:[...nativeSensorVision(G.emps[b])].sort((x,y)=>x-y),
     grant:sensorShareActive(G.emps[c],G.emps[b]),reverse:sensorShareActive(G.emps[b],G.emps[c])};
 },[E.B,E.C]);
 const applyMirrors=async label=>{
   const revisions=await settle(label),view={};
   for(const n of G2){
     await wait(pg[n],r=>MP6Stars.S.appliedRev===r&&MP6Stars.S.gen===MP6Stars.S.appliedGeneration,revisions[n].rev);
     view[n]=await pg[n].evaluate(()=>({visible:[...G.vis].sort((x,y)=>x-y),
       known:G.sys.filter(s=>s.seen.includes(0)).map(s=>s.id),applied:MP6Stars.S.appliedRev}));
   }
   return view;
 };

 await test('I3 yalıtılmış sensör olayı: B → C; yeni görüş ve keşif, özel alan, host ve iki ayna, Save8 sonrası',async()=>{
   const soak=await visibility();
   const newAfterSoak=soak.native.filter(id=>!soak.rows[2].visible.includes(id));
   I.sensor={soak:{native:soak.native.length,new:newAfterSoak.length},stages:[]};
   const ids=[E.B,E.C];
   const probe=await H().evaluate(([b,c])=>{
     if(!deserialize(globalThis.__i3InitialSave))throw Error('I3 başlangıç kaydı açılamadı');
     G.speed=0;
     const [B,C]=[G.emps[b],G.emps[c]],ctx=e=>humanVisionContext(e);
     const cv=ctx(C),hv=ctx(G.p),bv=ctx(B);
     const remote=G.sys.filter(s=>s.owner<0&&!cv.known.has(s.id)&&!hv.visible.has(s.id)&&!bv.visible.has(s.id));
     if(remote.length<3)throw Error('I3: ayrı sensör kontrolleri için keşfedilmemiş hedef yok');
     const reach=(e,s)=>{
       const seen=new Set([s.id]),queue=[[s,0]];
       for(const [system,depth] of queue){
         if(depth>=1+(e.mods.sensor|0)||system.nebulaS)continue;
         for(const id of system.lanes)if(!seen.has(id)){seen.add(id);queue.push([G.sys[id],depth+1]);}
       }
       return seen;
     };
     const probes=remote.map(s=>({s,b:reach(B,s),c:reach(C,s)}));
     let pair;
     for(const first of probes){
       for(const second of probes){
         if(first.b.has(second.s.id)||second.c.has(first.s.id))continue;
         const hidden=remote.find(s=>!first.b.has(s.id)&&!second.c.has(s.id));
         if(hidden){pair={fresh:first.s,cOnly:second.s,hidden};break;}
       }
       if(pair)break;
     }
     if(!pair)throw Error('I3: üç ayrık kontrol için uygun sensör kapsaması yok');
     const {fresh,cOnly,hidden}=pair;
     const sent=newFleet(B,fresh.id,[{c:'kor'}],'I3 B');
     newFleet(C,cOnly.id,[{c:'kor'}],'I3 C');
     B.contact[c]=C.contact[b]=true;
     MP1Host.host.publish();
     return {fresh:fresh.id,hidden:hidden.id,cOnly:cOnly.id,ship:sent.id,day:G.day};
   },ids);
   I.sensor.probe=probe;
   const before=await visibility(),beforeMirrors=await applyMirrors('i3-once');
   const [host,donor,recipient]=before.rows;
   assert.equal(before.grant,false);assert.equal(before.reverse,false);
   assert(donor.visible.includes(probe.fresh)&&before.native.includes(probe.fresh));
   assert(!recipient.visible.includes(probe.fresh)&&!recipient.known.includes(probe.fresh));
   assert(!host.visible.includes(probe.fresh)&&!donor.visible.includes(probe.cOnly));
   assert(recipient.visible.includes(probe.cOnly)&&!recipient.known.includes(probe.hidden));
   assert(!beforeMirrors.C.known.includes(probe.fresh)&&!beforeMirrors.C.visible.includes(probe.fresh));
   assert(beforeMirrors.B.visible.includes(probe.fresh));
   I.sensor.before={host:before,mirrors:beforeMirrors};

   await H().evaluate(([b,noSensor])=>{
     // Negative control of the test. The pact persists, but the giver's sensor payload is absent.
     if(noSensor){
       const original=nativeSensorVision;
       nativeSensorVision=e=>e.id===b?new Set():original(e);
     }
   },[E.B,process.env.MP8_I_NO_SENSOR==='1']);
   const sent=await cmd1('B',{kind:'offer',to:E.C,give:[{t:'intel'}],want:[]});
   assert.equal(sent.status,'ok','B gerçek host teklif komutuyla izin sundu: '+JSON.stringify(sent));
   const offer=await H().evaluate(([b,c])=>MP1Host.host.dip.offers.findLast(o=>o.from===b&&o.to===c&&o.status==='pending')?.id,ids);
   assert(offer,'bekleyen sensör teklifi');
   const accepted=await cmd1('C',{kind:'respond',offer,action:'accept'});
   assert.equal(accepted.status,'ok','C gerçek host komutuyla sensör iznini kabul etti: '+JSON.stringify(accepted));

   const expected=[...new Set([...recipient.visible,...before.native])].sort((x,y)=>x-y);
   const verify=async label=>{
     const actual=await visibility(),mirrors=await applyMirrors(label);
     I.sensor.stages.push({label,actual,mirrors});
     assert.equal(actual.grant,true);assert.equal(actual.reverse,false);
     assert.deepEqual(actual.rows[2].visible,expected,"C yalnız B’nin gerçek sensör kümesini kazandı");
     assert.deepEqual(actual.rows[0],host,'host görünürlük ve keşif kümeleri aynı');
     assert.deepEqual(actual.rows[1].visible,donor.visible,'B görüşü aynı');
     assert(mirrors.C.visible.includes(probe.fresh)&&mirrors.C.known.includes(probe.fresh),'yeni sistem C aynasında');
     assert(!mirrors.C.visible.includes(probe.hidden)&&!mirrors.C.known.includes(probe.hidden),'ilgisiz sistem C aynasına sızmaz');
     assert(!mirrors.B.visible.includes(probe.cOnly),'C sensörü ters yönde aktarılmaz');
     assert.deepEqual(mirrors.C.visible,expected);
     assert.deepEqual(mirrors.B.visible,donor.visible);
   };
   await verify('i3-paylasim');
   const reloaded=await H().evaluate(()=>{
     const raw=serialize(),rng=RND_STATE,ok=deserialize(raw);
     G.speed=0;MP1Host.host.publish();return {ok,rngEqual:rng===RND_STATE};
   });
   assert.deepEqual(reloaded,{ok:true,rngEqual:true});
   await verify('i3-kayit-yukle');
 });
};

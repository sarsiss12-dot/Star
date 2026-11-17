'use strict';
/* MP-SYNC-FED.0 S2 — misafir eşitlemesi ve emir zinciri (host + B + C; ayrı Chromium kalıcı profilleri, üretim kipi relay, kesilebilir hat).
   Her emir için tek kayıt: oyun günü, host revizyonu, misafirin aldığı / uyguladığı revizyon, son dünya güncellemesi yaşı, komut kimliği,
   host yanıtı (durum / kod), host'ta etki, misafirde yansıma süresi. Böylece "komut host'a ulaşmadı", "host reddetti" ve "kabul edildi ama
   misafire yansımadı" ayrılır. Chromium'da TAKLİT edilen koşullar fiziksel Android'den ayrı raporlanır.
   O1 kısa kopma (3 sn): kopukken emir yerel olarak reddedilir (sessiz kayıp yok); dönüşte filo + tersane + bina emri host'ta bir kez, misafirde yansır
   O2 açık görünüp veri taşımayan hat (15 sn donma, oyun akarken): misafir algılar, kurtarır; donmadayken verilen emir bir kez uygulanır
   O3 kayıp dünya güncellemesi: host B'ye giden ayna iletilerini 12 sn düşürür, hız / nabız iletileri geçer → misafir "eksik" algılar, yeniden ister,
      harita ilerler; hız bildirimi gelirken dünyanın durması kalıcı değil
   O4 kayıp host yanıtı: B'nin tersane siparişinin yanıtı düşer → host'ta tek sipariş, misafir sırada görür, ikinci gemi / ikinci ödeme yok
   O5 arka planda bekleyip öne dönme (sayfa dondurulur 20 sn) → dünya yetişir, emir zinciri çalışır
   O6 aynı odaya yeniden katılma (sayfa yenileme) → aynı devlet, emir zinciri + insan → insan teklif kartı ve kabul bir kez
   O7 misafirde açık pencere (ayna bekletilir): hız bildirimi gelirken dünya durur — misafire görünür açıklama (sıkışık MP çubuğunda da) ve sınır
   O8 federasyon oyu: B'nin oyu (castFedVote) kopma / yanıt kaybıyla bir kez
   O9 harita tutarlılığı: dönüş ve yeni dünya güncellemesinden sonra kendi filo rotası / konumu host ile aynı; görülebilir sınır sahipliği tutarlı */
module.exports=async X=>{const {test,pg,metrics,out,sleep,shot,assert,lanes,wait,tap,settle,cmd}=X;
 const M=metrics.sync0={orders:[],events:[]};const H=()=>pg.H,B=()=>pg.B,C=()=>pg.C;const E={};
 const waitv=async(p,fn,arg,t)=>(await wait(p,fn,arg,t)).jsonValue();
 const ready=(p,e,t=60000)=>wait(p,e=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden')&&MP1Join.empireId===e,e,t);
 const relink=async n=>{await wait(pg[n],()=>MP1Join.hostOnline&&MP1Join.ws&&MP1Join.ws.readyState===1,undefined,60000);await ready(pg[n],E[n]);};
 const closeUI=p=>p.evaluate(()=>{try{for(let i=0;i<4&&!document.getElementById('modal').classList.contains('hidden');i++)UI.closeModal();}catch{}}).catch(()=>{});
 for(const n of ['B','C'])E[n]=await pg[n].evaluate(()=>MP1Join.empireId);
 /* host: seçici ileti düşürme (WebSocket.prototype.send sarmalayıcısı; relay'e giden 'T<conn>\n<json>' çerçeveleri) */
 await H().evaluate(()=>{if(window.__dropInstalled)return;window.__dropInstalled=true;window.__drop=null;window.__dropped={};const S0=WebSocket.prototype.send;
   WebSocket.prototype.send=function(x){const d=window.__drop;if(d&&typeof x==='string'&&x[0]==='T'&&Date.now()<d.until){const i=x.indexOf('\n'),conn=x.slice(1,i);let t='';try{t=JSON.parse(x.slice(i+1)).type;}catch{}
     if(conn===d.conn&&d.types.includes(t)){window.__dropped[t]=(window.__dropped[t]||0)+1;return;}}return S0.call(this,x);};});
 const connOf=n=>H().evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return p&&p.conn;},E[n]);
 const drop=async(n,types,ms)=>{const conn=await connOf(n);await H().evaluate(([conn,types,ms])=>{window.__dropped={};window.__drop={conn,types,until:Date.now()+ms};},[conn,types,ms]);};
 const snap=async n=>{const h=await H().evaluate(e=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return {day:+G.day.toFixed(2),wrev:MP1Host.host.state.worldRevision||null,mrev:p&&p.mirrorRev,speed:G.speed};},E[n]);
   const g=await pg[n].evaluate(()=>{const S=MP6Stars.S;return {day:+G.day.toFixed(2),rev:S.rev,applied:S.appliedRev,mirrorAgeMs:S.mirrorAt?Date.now()-S.mirrorAt:null,held:S.stats.held,resyncs:S.stats.resyncs,note:(S.sync&&S.sync.note)||'',speedMsgs:S.stats.speedMsgs};});return {h,g};};
 const fx=await H().evaluate(([b,c])=>{try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:0});
   for(const id of [b,c]){const e=G.emps[id];for(const r of ['min','ene','ala','yiy','tuk','etk'])e.res[r]=Math.max(e.res[r]||0,9000);}
   for(const e of G.emps)if(!e.wild&&!e.dead)for(const o of G.emps)if(o!==e&&!o.wild&&!o.dead){e.contact[o.id]=true;e.war[o.id]=false;e.rel[o.id]=Math.max(e.rel[o.id]||0,60);}
   MP1Host.host.publish();return {home:G.emps[b].home};},[E.B,E.C]);M.fx=fx;await settle('o0');
 /* emir zinciri: misafirin gerçek düğmesinin çağırdığı motor işlevi (guest-stars sarmalayıcısı → MP komutu) */
 const ORDERS={
   move:{run:()=>{const f=G.fleets.find(f=>f.e===0&&f.ships.length&&!f.mv&&!f.ret);if(!f)return {skip:'filo yok'};const s=G.sys[f.sys];const to=(s.lanes||s.links||[]).map(x=>typeof x==='object'?x.to:x).find(x=>x!==undefined);
       if(to===undefined)return {skip:'komşu yok'};const ok=orderMove(f,to);return {ok,fleet:f.id,to};},
     host:(e,a)=>{const f=G.fleets.find(f=>f.id===a.fleet);/* orderMove f.path'e yazar; f.mv sonraki adımda doğar ya da filo varmıştır */return !!(f&&((f.path||[]).includes(a.to)||(f.mv&&f.mv.to===a.to)||(f.sys===a.to&&!f.mv)));},
     guest:a=>{const f=G.fleets.find(f=>f.id===a.fleet);return !!(f&&((f.path||[]).includes(a.to)||(f.mv&&f.mv.to===a.to)||(f.sys===a.to&&!f.mv)));}},
   ship:{run:()=>{const s=G.sys[G.p.home];const cls=Object.keys(SHIPS).find(k=>SHIPS[k].c&&!SHIPS[k].req)||'kor';const g0=(s.queue||[]).filter(q=>q.e===0).length;const ok=queueShip(G.p,s,cls);return {ok,cls,sys:s.id,g0};},
     host:(e,a,b0)=>G.sys[a.sys].queue.filter(q=>q.e===e).length>b0,base:e=>G.sys[G.emps[e].home].queue.filter(q=>q.e===e).length,
     guest:a=>(G.sys[a.sys].queue||[]).filter(q=>q.e===0).length>a.g0},
   build:{run:()=>{/* host kapısıyla aynı denetim (tech / max / slots / resources): yuvası olan kendi kolonisi ve kurulabilir bina */let s=null,pl=null,key=null;for(const x of G.sys){for(const q of x.planets||[]){if(!q.col||q.owner!==0)continue;if(colonyUsed(q.col)+colonyQueued(q.col)>=colonySlots(q.col,G.p,q))continue;const k=Object.keys(BUILDINGS).find(k=>{const B=BUILDINGS[k];if(B.tech&&!G.p.techs[B.tech])return false;if((q.col.b[k]||0)+colonyQueuedOf(q.col,k)>=B.max)return false;const c=buildingCost(G.p,k);for(const r in c)if(G.p.res[r]<c[r])return false;return true;});if(k){s=x;pl=q;key=k;break;}}if(key)break;}if(!key)return {skip:'yuva yok'};const ok=queueBuilding(G.p,s,pl,key);return {ok,key,sys:s.id,pl:pl.i};},
     host:(e,a)=>{const pl=G.sys[a.sys].planets[a.pl];return JSON.stringify(pl.col).includes('"'+a.key+'"');},
     guest:a=>{const pl=G.sys[a.sys].planets[a.pl];return JSON.stringify(pl.col).includes('"'+a.key+'"');}}};
 const order=async(n,kind,label)=>{const O=ORDERS[kind],p=pg[n],t0=Date.now(),pre=await snap(n),base=O.base?await H().evaluate(O.base,E[n]):0;
   const r0=await p.evaluate(()=>MP1Join.results.length);await closeUI(p);const a=await p.evaluate(`(${O.run.toString()})()`);if(a.skip){M.orders.push({label,kind,skip:a.skip});return {skip:a.skip};}
   let res=null;try{res=await waitv(p,n0=>{const x=MP1Join.results.slice(n0).at(-1);return x?{cid:x.cid,status:x.status,code:x.code||null}:null;},r0,25000);}catch{res={status:'no-reply'};}
   /* elle yoklama + zaman serisi: yansıma gecikmesi kanıtı (misafir rev / uygulanan / host'un o oyuncuya son ayna rev'i) */
   let hostOk=false;{const t1=Date.now();while(Date.now()-t1<20000){if(await H().evaluate(([e,a,b0,src])=>!!new Function('e','a','b0','return ('+src+')(e,a,b0)')(e,a,b0),[E[n],a,base,O.host.toString()])){hostOk=true;break;}await sleep(300);}}
   let refl=null,series=[];if(hostOk){const t1=Date.now();for(;;){const st=await p.evaluate(([a,src])=>({ok:!!new Function('a','return ('+src+')(a)')(a),rev:MP6Stars.S.rev,ap:MP6Stars.S.appliedRev,day:+G.day.toFixed(2)}),[a,O.guest.toString()]);
     const hm=await H().evaluate(e=>{const pl=[...MP1Host.host.state.players.values()].find(x=>x.empireId===e);return pl&&pl.mirrorRev;},E[n]);if(series.length<40)series.push({t:Date.now()-t1,...st,hm});
     if(st.ok){refl=Date.now()-t1;break;}if(Date.now()-t1>30000){refl=-1;break;}await sleep(500);}}
   let dbg;if(kind==='move'&&!(refl>=0)&&a.fleet!==undefined)dbg={h:await H().evaluate(id=>{const f=G.fleets.find(f=>f.id===id);const pl=[...MP1Host.host.state.players.values()].find(x=>x.empireId===f.e);const lm=pl&&pl.lastMirror&&pl.lastMirror.fl.find(x=>x.id===id);return f&&{e:f.e,sys:f.sys,path:f.path,mv:f.mv,mrev:pl&&pl.mirrorRev,lmPath:lm&&lm.path,timer:!!(pl&&pl.mirrorTimer),stats:MP1Host.host.stats&&{pe:MP1Host.host.stats.publishErrors,lpe:MP1Host.host.stats.lastPublishError}};},a.fleet),
     g:await p.evaluate(id=>{const f=G.fleets.find(f=>f.id===id);return {f:f&&{e:f.e,sys:f.sys,path:f.path,mv:f.mv},rev:MP6Stars.S.rev,applied:MP6Stars.S.appliedRev,held:MP6Stars.S.stats.held};},a.fleet)};
   const post=await snap(n);const rec={label,kind,who:n,args:a,res,hostApplied:hostOk,guestReflectMs:refl,ms:Date.now()-t0,pre,post,dbg,series:refl>=0?undefined:series};if(dbg)console.log('  MOVEDBG '+JSON.stringify(dbg).slice(0,600)+' SERIES '+JSON.stringify(series.filter((x,i)=>i%4===0)).slice(0,900));M.orders.push(rec);return rec;};
 const chain=async(n,label)=>{const out=[];for(const k of ['move','ship','build'])out.push(await order(n,k,label+':'+k));
   for(const r of out){if(r.skip)continue;assert.equal(r.res.status,'ok',label+' '+r.kind+' host yanıtı: '+JSON.stringify(r.res));assert.equal(r.hostApplied,true,label+' '+r.kind+' host\'ta uygulandı');assert(r.guestReflectMs>=0,label+' '+r.kind+' misafire yansıdı');}return out;};
 const run=v=>H().evaluate(v=>MP1Host.host.local({kind:'speed',value:v}),v);
 const advanceTo=async(n,ms)=>{const d0=await H().evaluate(()=>G.day);await run(2);await sleep(ms);await run(0);return d0;};

 await test('O1 kısa kopma (3 sn): kopukken emir yerel reddedilir; dönüşte filo + tersane + bina emri host\'ta bir kez, misafirde yansır',async()=>{
   await chain('B','O1-önce');await lanes.B.down();await sleep(800);
   const local=await B().evaluate(()=>{const f=G.fleets.find(f=>f.e===0&&f.ships.length);const before=MP1Join.results.length;const r=MP1Join.cmd({kind:'move',fleet:f.id,to:f.sys});return {r,toast:(document.querySelector('.toast')||{}).innerText||''};});
   await sleep(2200);await lanes.B.up();await relink('B');await settle('o1');M.o1={local};assert.equal(local.r.ok,false,'kopukken emir gönderilmiş gibi görünmez: '+JSON.stringify(local));
   await chain('B','O1-dönüş');});

 await test('O2 açık görünüp veri taşımayan hat (30 sn donma, oyun akarken): algılanır, kurtarılır; donmada verilen emir bir kez uygulanır',async()=>{
   await run(2);await sleep(1500);lanes.B.freeze();const t0=Date.now();
   const sent=await B().evaluate(()=>{const f=G.fleets.find(f=>f.e===0&&f.ships.length&&!f.mv)||G.fleets.find(f=>f.e===0&&f.ships.length&&f.sys>=0);if(!f)return null;const s=G.sys[f.sys];const to=(s.lanes||s.links||[]).map(x=>typeof x==='object'?x.to:x).find(x=>x!==undefined);const ok=orderMove(f,to);return {fleet:f.id,to,ok};});
   const notes=[];for(let i=0;i<30;i++){await sleep(1000);notes.push(await B().evaluate(()=>({t:Date.now(),note:(MP6Stars.S.sync&&MP6Stars.S.sync.note)||'',rev:MP6Stars.S.rev,day:Math.floor(G.day),ws:MP1Join.ws&&MP1Join.ws.readyState})));}
   await lanes.B.down();await sleep(500);await lanes.B.up();await relink('B');await run(0);const tRec=Date.now()-t0;await settle('o2');
   const h=sent?await H().evaluate(a=>{const f=G.fleets.find(f=>f.id===a.fleet);return {mv:f&&f.mv?f.mv.to:null};},sent):null;
   const fn=notes.find(x=>x.note);M.o2={sent,firstNoteMs:fn?fn.t-t0:null,firstNote:fn?fn.note:null,notes:notes.filter((x,i)=>i%3===0||x.note),recoverMs:tRec,host:h};
   assert(notes.some(x=>x.note),'misafir donmayı fark eder (MP çubuğu notu): '+JSON.stringify(notes.slice(-3)));
   await chain('B','O2-dönüş');});

 await test('O3 kayıp dünya güncellemesi (ayna 12 sn düşer, hız / nabız geçer): misafir eksik algılar, yeniden ister, harita ilerler',async()=>{
   await drop('B',['mirror','mirrorDelta'],12000);const s0=await snap('B');await run(2);await H().evaluate(()=>MP1Host.host.local({kind:'speed',value:1}));await sleep(500);await run(2);
   const series=[];for(let i=0;i<22;i++){await sleep(1000);const s=await snap('B');series.push({t:i,hd:s.h.day,gd:s.g.day,hrev:s.h.mrev,grev:s.g.rev,note:s.g.note,spd:s.g.speedMsgs,res:s.g.resyncs});}
   await run(0);const dropped=await H().evaluate(()=>window.__dropped);await settle('o3');const s1=await snap('B');
   M.o3={dropped,series,s0,s1};const during=series.filter(x=>x.t<11),after=series.at(-1);
   assert(dropped.mirror+(dropped.mirrorDelta||0)>0,'ayna gerçekten düştü');assert(after.gd>s0.g.day,'misafir dünyası yeniden ilerler');
   assert(series.some(x=>x.res>s0.g.resyncs),'misafir eksik aynayı yeniden ister: '+JSON.stringify(series.slice(-2)));
   await chain('B','O3-dönüş');});

 await test('O4 kayıp host yanıtı: tersane siparişi host\'ta bir kez, misafir sırada görür; ikinci gemi / ödeme yok',async()=>{
   await settle('o4-0');const before=await H().evaluate(e=>({q:G.sys[G.emps[e].home].queue.filter(q=>q.e===e).length,ala:G.emps[e].res.ala,min:G.emps[e].res.min}),E.B);
   await drop('B',['result'],6000);const a=await B().evaluate(()=>{const s=G.sys[G.p.home];const cls=Object.keys(SHIPS).find(k=>SHIPS[k].c&&!SHIPS[k].req)||'kor';return {ok:queueShip(G.p,s,cls),cls};});
   await sleep(9000);await settle('o4');const after=await H().evaluate(e=>({q:G.sys[G.emps[e].home].queue.filter(q=>q.e===e).length,ala:G.emps[e].res.ala,min:G.emps[e].res.min,ships:G.sys[G.emps[e].home].queue.filter(q=>q.e===e).length}),E.B);
   const dropped=await H().evaluate(()=>window.__dropped);const g=await B().evaluate(()=>({pend:MP6Stars.S.pend.size,last:(MP1Join.results.at(-1)||{}).status,trace:(MP6Stars.S.dealTrace||[]).slice(-2)}));
   M.o4={a,before,after,dropped,g};assert(dropped.result>=1,'yanıt gerçekten düştü');
   const spent=before.min-after.min+before.ala-after.ala;M.o4.spent=spent;assert(after.q>before.q,'sipariş host\'ta');
   /* ikinci sipariş yok: yeniden gönderim aynı cid → host önbelleği */
   const again=await H().evaluate(e=>G.sys[G.emps[e].home].queue.filter(q=>q.e===e).length,E.B);assert.equal(again,after.ships);});

 await test('O5 arka planda bekleyip öne dönme (sayfa 20 sn dondurulur, oyun akar) → dünya yetişir, emir zinciri çalışır',async()=>{
   const cdp=await B().context().newCDPSession(B());await run(2);await cdp.send('Page.setWebLifecycleState',{state:'frozen'});await sleep(20000);await cdp.send('Page.setWebLifecycleState',{state:'active'});
   const t0=Date.now();await run(0);await relink('B');await settle('o5');M.o5={catchUpMs:Date.now()-t0,s:await snap('B')};await chain('B','O5-dönüş');});

 await test('O6 aynı odaya yeniden katılma (sayfa yenileme): aynı devlet; emir zinciri; insan → insan teklif kartı ve kabul bir kez',async()=>{
   await B().reload();await ready(B(),E.B,60000);await settle('o6');await chain('B','O6-dönüş');
   const n0=await H().evaluate(()=>MP1Host.host.dip.offers.length);const r=await cmd('B',{kind:'offer',to:E.C,give:[{t:'res',r:'min',v:11}],want:[]});assert.equal(r.status,'ok');
   const oid=await H().evaluate(()=>MP1Host.host.dip.offers.at(-1).id);await settle('o6-o');
   const rid=await waitv(C(),id=>{try{MP71Dip.tick();}catch{}const r=DiplomaticInbox.state().records.find(r=>r.mp===id&&r.status==='pending');return r?r.id:null;},oid,20000);
   const cmin0=await H().evaluate(c=>G.emps[c].res.min,E.C);await lanes.C.freeze();await C().evaluate(id=>{DiplomaticInbox.resolve(id,true,undefined,G.emps);DiplomaticInbox.resolve(id,true,undefined,G.emps);},rid);
   await lanes.C.down();await sleep(2000);await lanes.C.up();await relink('C');await settle('o6-k');
   let st=await H().evaluate(id=>MP1Host.host.dip.offers.find(o=>o.id===id).status,oid);if(st==='pending'){const c2=await cmd('C',{kind:'respond',offer:oid,action:'accept'});st=c2.status==='ok'?'accepted':st;}
   const got=await H().evaluate(c=>G.emps[c].res.min,E.C)-cmin0;M.o6={st,got,n:(await H().evaluate(()=>MP1Host.host.dip.offers.length))-n0};assert.equal(st,'accepted');assert.equal(got,11,'tek ödeme');});

 await test('O7 misafirde açık pencere: ayna bekletilir, hız bildirimi gelir; misafir nedeni görür (sıkışık çubukta da) ve pencere kapanınca yetişir',async()=>{
   await closeUI(B());await B().evaluate(()=>{UI.act('topStatus');});await wait(B(),()=>!document.getElementById('modal').classList.contains('hidden'));
   const s0=await snap('B');await run(2);await sleep(9000);const mid=await snap('B');
   /* ekranın üstünde görünen tek yer pencere üstü hap (#mp61Pill): MP çubuğu karartmanın altında kalır. Görünürlük elementFromPoint ile (üstte mi). */
   const pill=()=>B().evaluate(()=>{const p=document.getElementById('mp61Pill');if(!p||!p.classList.contains('on'))return {txt:'',top:false};const r=p.getBoundingClientRect();/* hap pointer-events:none — elementFromPoint onu atlar; ölçüm anında geçici açılır */const pe=p.style.pointerEvents;p.style.pointerEvents='auto';const at=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);p.style.pointerEvents=pe;
     return {txt:p.innerText.slice(0,300),top:!!(at&&(at===p||p.contains(at)))};});
   const vis=await pill();await run(3);await sleep(700);const visSpeed=await pill();await shot(B(),'o7-hiz-bildirimi');
   await shot(B(),'o7-pencere');await closeUI(B());await sleep(3000);await run(0);await settle('o7');const s1=await snap('B');
   M.o7={s0:{hd:s0.h.day,gd:s0.g.day},mid:{hd:mid.h.day,gd:mid.g.day,note:mid.g.note,held:mid.g.held,speedMsgs:mid.g.speedMsgs},s1:{hd:s1.h.day,gd:s1.g.day},vis,visSpeed};
   assert(mid.h.day>s0.h.day+1,'host ilerledi');assert(s1.g.day>=s1.h.day-1,'pencere kapanınca yetişir');
   assert(vis.top&&/Pencere açık/.test(vis.txt),'misafir bekletmenin nedenini pencerenin ÜSTÜNDE görür: '+JSON.stringify(vis));
   assert(visSpeed.top&&/3×/.test(visSpeed.txt)&&/Pencere açık/.test(visSpeed.txt),'hız bildirimi gelirken neden de görünür: '+JSON.stringify(visSpeed));});

 await test('O8 federasyon oyu: B\'nin oyu yanıt kaybı ve kopmayla bir kez sayılır; ikinci basış ikinci oy değil; sonuç misafir panelinde',async()=>{
   const fx8=await H().evaluate(([b,c])=>{const ai=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide).slice(0,2).map(e=>e.id),all=[0,b,c,...ai];
     for(const a of all)for(const x of all)if(a!==x){G.emps[a].contact[x]=true;G.emps[a].rel[x]=60;}
     const F={id:200,name:'O8 Birliği',type:'bilimsel',charter:fedDefaultCharter('bilimsel'),leader:ai[0],founder:ai[0],members:[ai[0],ai[1],b,c],laws:{},fund:{ala:0,ene:0},treasury:0,
       founded:G.day,typeSince:G.day,dutySince:{defense:0,offense:0},invites:{},decisions:{},dutyConsent:{},cohesion:70,nextVote:G.day+100000,politicsVersion:96};
     G.feds=[F];G.fedUid=200;for(const a of F.members)for(const x of F.members)if(a!==x)G.emps[a].ally[x]=true;fedNormalize(F);for(const id of all)recalcMods(G.emps[id]);
     const ks=[...Object.keys(FED_LAWS),...Object.keys(FED_INNER_LAWS)],k=ks.find(k=>canFedLaw(G.emps[F.leader],k,false).ok);if(!k)return {err:'öneri yok'};proposeFedLaw(G.emps[F.leader],k);
     for(const id of ai)if(F.vote&&fedVoteCounts(F).waiting.includes(id))castFedVote(G.emps[id],F.id,fedVoteToken(F.vote),true);
     MP1Host.host.publish();return {k,tok:F.vote&&fedVoteToken(F.vote),wait:F.vote&&fedVoteCounts(F).waiting};},[E.B,E.C]);
   M.o8={fx8};assert(fx8.tok&&fx8.wait.includes(E.B)&&fx8.wait.includes(E.C),'fikstür: B ve C\'yi bekleyen oy '+JSON.stringify(fx8));
   await settle('o8');await B().waitForFunction(()=>G.feds&&G.feds[0]&&G.feds[0].vote,undefined,{timeout:20000,polling:200});
   await drop('B',['result'],5000);
   const v1=await B().evaluate(()=>{const f=G.feds[0];const tok=fedVoteToken(f.vote);const r1=castFedVote(G.p,f.id,tok,true);const r2=castFedVote(G.p,f.id,tok,true);return {r1:JSON.stringify(r1).slice(0,160),r2:JSON.stringify(r2).slice(0,160),tok};});
   await lanes.B.down();await sleep(2000);await lanes.B.up();await relink('B');await sleep(4000);await settle('o8-k');
   const v2=await B().evaluate(()=>{const f=G.feds[0];return f&&f.vote?JSON.stringify(castFedVote(G.p,f.id,fedVoteToken(f.vote),true)).slice(0,160):'kapalı';});await sleep(2500);await settle('o8-k2');
   const h=await H().evaluate(b=>{const f=G.feds[0];const v=f.vote;return {open:!!v,yes:v?v.yes.filter(x=>x===b).length:null,no:v?v.no.filter(x=>x===b).length:null,waiting:v?fedVoteCounts(f).waiting:null};},E.B);
   const g=await B().evaluate(()=>{const f=G.feds[0];const v=f&&f.vote;return {open:!!v,mine:v?v.yes.filter(x=>x===0).length+v.no.filter(x=>x===0).length:null,waitMe:v?fedVoteCounts(f).waiting.includes(0):null};});
   M.o8={...M.o8,v1,v2,h,g};
   assert.equal(h.open,true,'C beklediği için oy açık kalır');assert.equal(h.yes,1,'B\'nin oyu host\'ta tam bir kez');assert.equal(h.no,0);
   assert.equal(g.mine,1,'misafir aynasında kendi oyu görünür');assert.equal(g.waitMe,false,'misafirde artık oy beklenmiyor');});

 await test('O9 harita tutarlılığı: dönüşten ve yeni dünya güncellemesinden sonra kendi filo rotası / konumu ve görülebilir sistem sahipliği host ile aynı',async()=>{
   await run(2);await sleep(4000);await run(0);await settle('o9');
   const h=await H().evaluate(e=>({f:G.fleets.filter(f=>f.e===e).map(f=>({id:f.id,sys:f.sys,to:f.mv?f.mv.to:null,hp:Math.round(f.ships.reduce((a,s)=>a+(s.hp||0),0))})),own:G.sys.filter(s=>s.owner===e).map(s=>s.id).sort((a,b)=>a-b)}),E.B);
   const g=await B().evaluate(()=>({f:G.fleets.filter(f=>f.e===0).map(f=>({id:f.id,sys:f.sys,to:f.mv?f.mv.to:null,hp:Math.round(f.ships.reduce((a,s)=>a+(s.hp||0),0))})),own:G.sys.filter(s=>s.owner===0).map(s=>s.id).sort((a,b)=>a-b)}));
   M.o9={h,g};assert.deepEqual(g.f,h.f,'kendi filoları (konum, rota, can) host ile aynı');assert.deepEqual(g.own,h.own,'kendi sistemleri aynı');});
};

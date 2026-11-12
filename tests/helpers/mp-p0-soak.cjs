'use strict';
/* MP-P0 — gerçek zamanlı dayanıklılık (browser-mp8 MP8_SCEN=P). Host'un GERÇEK oyun döngüsü (rAF + 250 ms yayın + 700 ms ayna
   kısması) en yüksek hızda çalışır; misafir gerçek STARS arayüzünde gerçek dokunma olaylarıyla rastgele ama tekrarlanabilir
   (tohumlu) işlem yapar. Bekçi: host günü ilerlerken misafirin KURDUĞU dünyanın günü ilerlemiyorsa "donma" kaydedilir; o anda
   misafirin bekletme nedenleri (pencere, işaretçi, kaydırma, kurulum hatası), ayna sayaçları ve host'un yayın durumu dökülür.
   Bu yerel Chromium'dur: fiziksel cihaz / gerçek internet / Render DEĞİLDİR.
   Ortam: MP8_P_FF (hızlı ilerletme ayı, vars. 30) · MP8_P_MIN (gerçek zaman dakikası, vars. 6) · MP8_P_SEED (maymun tohumu, vars. 1)
          MP8_P_STALL_S (donma eşiği sn, vars. 20) · MP8_P_SCRIPT (virgüllü hedefli adımlar; bkz. SCRIPTS) */
const fs=require('fs'),path=require('path');
const FF=+(process.env.MP8_P_FF||30),MIN=+(process.env.MP8_P_MIN||6),SEED=+(process.env.MP8_P_SEED||1),STALL=+(process.env.MP8_P_STALL_S||20)*1000;
const BAN=['restart','toTitle','save','sandbox','trigCrisis','full','spd','fedLeave','diagCopy','mute','shareOpen','mapFix','cncLeave','advNever'];

const GUEST=`window.__p0={
  diag(){const S=MP6Stars.S,m=document.getElementById('modal'),now=Date.now();return {day:G.day,rev:S.rev,applied:S.appliedRev,started:S.started,timer:!!S.timer,mirror:!!S.mirror,
    modalOpen:!!(m&&!m.classList.contains('hidden')),modalCls:m?m.className:null,modalHead:m?(m.textContent||'').trim().slice(0,90):null,
    pointers:UI._surfacePointers?[...UI._surfacePointers]:null,untilMs:(UI._surfaceUntil||0)-now,bootErr:S.boot.err,bootFails:S.boot.fails,
    stats:{mirrors:S.stats.mirrors,deltas:S.stats.deltas,builds:S.stats.builds,fail:S.stats.fail||0,held:S.stats.held,touchHeld:S.stats.touchHeld||0,resyncs:S.stats.resyncs,speedMsgs:S.stats.speedMsgs,lastBuildMs:S.stats.buildMs.slice(-1)[0]||0,minGap:S.minGap},
    syncNote:S.sync?S.sync.note:'',syncWhy:S.sync?S.sync.why:'',crash:S.stats.crash||0,touchForced:S.stats.touchForced||0,recon:S.sync?S.sync.reconnects:0,hostSpd:S.hostSpd,ws:MP1Join.ws?MP1Join.ws.readyState:-1,hostOnline:MP1Join.hostOnline,screen:MP1Join.screen,decWait:S.decWait.size,
    diagTail:(typeof DIAG!=='undefined'&&DIAG.slice?DIAG.slice(-3):[]),diplo:document.getElementById('diploPane').classList.contains('show'),mirrorAgeMs:S.mirrorAt?now-S.mirrorAt:null};},
  /* dokunulabilir adaylar: görünür, etkin, yasaklı olmayan gerçek düğmeler; en üstteki öğe kendisi olmalı (örtülü düğmeye dokunulmaz) */
  targets(sel,ban){const out=[];for(const el of document.querySelectorAll(sel)){if(el.disabled)continue;const a=el.dataset&&el.dataset.a;if(a&&ban.includes(a))continue;const r=el.getBoundingClientRect();if(r.width<8||r.height<8)continue;
      const x=r.left+r.width/2,y=r.top+r.height/2;if(x<2||y<2||x>innerWidth-2||y>innerHeight-2)continue;const top=document.elementFromPoint(x,y);if(!top||!(top===el||el.contains(top)))continue;out.push({x,y,a:a||el.id||el.className||el.tagName,x2:el.dataset?el.dataset.x:undefined});}return out;},
  own(){const e=G.p;return {fleets:G.fleets.filter(f=>f.e===0).map(f=>({id:f.id,sys:f.sys,mv:!!f.mv,path:(f.path||[]).length})),yards:G.sys.filter(s=>s.owner===0&&typeof hasYard==='function'&&hasYard(s)).map(s=>({id:s.id,q:(s.queue||[]).length})),ala:Math.floor(e.res.ala)};}
};`;

module.exports=async function({test,pg,metrics,out,sleep,shot,assert,origin,guestGo,wait,tap,errors,design}){
  const H=pg.H,B=pg.B;let rs=SEED>>>0||1;const rnd=()=>{rs^=rs<<13;rs>>>=0;rs^=rs>>>17;rs^=rs<<5;rs>>>=0;return rs/4294967296;},pick=a=>a[Math.floor(rnd()*a.length)];
  const P=metrics.p0={ff:FF,minutes:MIN,seed:SEED,samples:[],stalls:[],actions:{},cmds:[],maxLagDays:0};
  const hostState=()=>H.evaluate(()=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.playerId!=='host');return {day:G.day,speed:G.speed|0,publishes:MP1Host.publishes|0,rev:p&&p.mirrorRev||0,conn:!!(p&&p.conn),paused:!!MP1Host.host.state.paused,bg:!!MP1Host.bg,connected:!!MP1Host.connected,monthMs:MP1Host.lastMonthMs||0,fleets:G.fleets.length};});
  const HM=process.env.MP8_P_HOSTMONKEY==='1';
  const act=async(B,tag='')=>{const tapAt=async(t)=>{await B.touchscreen.tap(t.x,t.y);};
    const st=await B.evaluate(()=>({modal:!document.getElementById('modal').classList.contains('hidden'),diplo:document.getElementById('diploPane').classList.contains('show')}));
    const r=rnd();let kind,t=null;
    if(st.modal){kind=r<.45?'modalTap':'modalClose';if(kind==='modalTap'){const ts=await B.evaluate(b=>__p0.targets('#modal button,#modal [data-a]',b),BAN);if(ts.length)t=pick(ts);else kind='modalClose';}
      if(kind==='modalClose'){await B.evaluate(()=>{const s=G.speed;try{UI.closeModal();}catch{}});}}
    else if(st.diplo&&r<.75){kind=r<.6?'diploTap':'diploClose';if(kind==='diploTap'){const ts=await B.evaluate(b=>__p0.targets('#diploPane button,#diploPane [data-a]',b),BAN);if(ts.length)t=pick(ts);else kind='diploClose';}
      if(kind==='diploClose')await B.evaluate(()=>{try{UI.act('closeDiplo');}catch{}});}
    else if(r<.30){kind='panelTap';const ts=await B.evaluate(b=>__p0.targets('#panel button,#panel [data-a]',b),BAN);if(ts.length)t=pick(ts);}
    else if(r<.42){kind='tabTap';const ts=await B.evaluate(b=>__p0.targets('#tabs .tab',b),BAN);if(ts.length)t=pick(ts);}
    else if(r<.56){kind='topTap';const ts=await B.evaluate(b=>__p0.targets('#top [data-a],#tools [data-a],#seltag [data-a],#seltag button',b),BAN);if(ts.length)t=pick(ts);}
    else if(r<.70){kind='inboxTap';const ts=await B.evaluate(b=>__p0.targets('#inbox [data-a],#inbox button',b),BAN);if(ts.length)t=pick(ts);}
    else if(r<.88){kind='mapTap';const v=B.viewportSize();t={x:60+rnd()*(v.width-320),y:60+rnd()*(v.height-120),a:'map'};}
    else{kind='panelScroll';const box=await B.evaluate(()=>{const p=document.getElementById('panel'),r=p.getBoundingClientRect();return r.width>40?{x:r.left+r.width/2,y:r.top+r.height/2,h:r.height}:null;});
      if(box){const c=await B.context().newCDPSession(B);try{await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y+40}]});for(let i=1;i<=5;i++)await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x,y:box.y+40-i*18}]});await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}finally{await c.detach().catch(()=>{});}}}
    if(t)await tapAt(t).catch(()=>{});
    const key=tag+kind+(t&&t.a&&kind!=='mapTap'?':'+String(t.a).slice(0,24):'');P.actions[key]=(P.actions[key]||0)+1;return key;};
  /* doğrudan komut (misafirin gerçek MP yolu): kendi filosuna hareket + tersaneye korvet; host ACK'i ve aynadaki etkisi ölçülür */
  const send1=async(c)=>{const r=await B.evaluate(c=>MP1Join.cmd(c),c);if(!r.ok)return {status:'local',code:r.why};
    const got=await B.waitForFunction(cid=>MP1Join.results.some(x=>x.cid===cid),r.cid,{timeout:15000,polling:100}).then(()=>true,()=>false);if(!got)return {status:'no-reply',cid:r.cid};
    return B.evaluate(cid=>{const x=MP1Join.results.filter(y=>y.cid===cid).at(-1);return {status:x.status,code:x.code||null,ms:x.ms};},r.cid);};
  const command=async(label)=>{const out={label,at:Date.now()};try{
      await B.evaluate(()=>{try{UI.closeModal();}catch{}});   // açık pencere aynayı tasarım gereği bekletir; emir etkisi pencere kapalıyken ölçülür
      const own=await B.evaluate(()=>__p0.own());out.own={fleets:own.fleets.length,yards:own.yards.length,ala:own.ala};
      const f=own.fleets.find(x=>x.sys>=0&&!x.mv);if(f){const to=await B.evaluate(id=>G.sys[id].lanes[0],f.sys);out.fleet=f.id;out.moveTo=to;out.move=await send1({kind:'move',fleet:f.id,to});}
      const y=own.yards[0];if(y){out.yard=y.id;out.q0=y.q;out.ship=await send1({kind:'ship',sys:y.id,key:'kor'});}
    }catch(e){out.err=String(e&&e.message||e).slice(0,200);}
    P.cmds.push(out);return out;};

  await test('P1 gerçek zamanlı '+MIN+' dk: 500 sistem / 16 AI + 2 insan, host en yüksek hızda (ön ilerletme '+FF+' ay), misafir gerçek dokunmayla oynar; host günü ilerlerken misafir dünyası '+(STALL/1000)+' sn\'den uzun durmamalı; komutlar aynaya yansımalı',async()=>{
    await B.evaluate(GUEST);if(HM)await H.evaluate(GUEST.replace(/diag\(\)\{[\s\S]*?\},\n  \/\* dokunulabilir/,'diag(){return {};},\n  /* dokunulabilir'));
    /* ön ilerletme: deterministik (hız 0), ay ay — sayfa uzun süre kilitlenmesin */
    const t0=Date.now();for(let m=0;m<FF;m++){await H.evaluate(()=>MP1Host.advance(30));if(m%6===5)console.log('  ön ilerletme ay '+(m+1)+' '+Math.round((Date.now()-t0)/1000)+' sn');}
    P.ffSeconds=Math.round((Date.now()-t0)/1000);
    await B.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&MP6Stars.S.rev>0,undefined,{timeout:60000,polling:200}).catch(()=>{});
    const maxSpd=await H.evaluate(()=>Math.max(...[...document.querySelectorAll('#timepod .sp')].map(b=>+b.dataset.x)));
    const go=()=>H.evaluate(n=>{if((G.speed|0)!==n){const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden'))try{UI.closeModal();}catch{}MP1Host.host.local({kind:'speed',value:n});}return G.speed|0;},maxSpd);
    await go();const end=Date.now()+MIN*60000;let lastGuestDay=-1,lastGuestMove=Date.now(),lastHostDayAtMove=0,n=0,stalled=null,nextCmd=Date.now()+20000,nextSample=0;
    while(Date.now()<end){
      await act(B).catch(e=>{P.actions['err:'+String(e&&e.message||e).slice(0,40)]=1;});n++;
      if(HM&&n%2===0)await act(H,'H:').catch(e=>{P.actions['H:err:'+String(e&&e.message||e).slice(0,40)]=1;});
      await sleep(120+Math.floor(rnd()*380));
      if(Date.now()>=nextCmd){nextCmd=Date.now()+45000;const c=await command('t+'+Math.round((Date.now()-(end-MIN*60000))/1000));
        if(c&&c.ship&&c.ship.status==='ok'){const seen=await B.waitForFunction(a=>{const s=G.sys[a.yard];return s&&(s.queue||[]).length>a.q0;},{yard:c.yard,q0:c.q0},{timeout:STALL,polling:250}).then(()=>true,()=>false);P.cmds[P.cmds.length-1].shipSeen=seen;}}
      if(Date.now()<nextSample)continue;nextSample=Date.now()+2000;
      const h=await hostState(),g=await B.evaluate(()=>__p0.diag()).catch(e=>({err:String(e)}));if((h.speed|0)<maxSpd&&!h.paused)await go();
      const lag=h.day-(g.day||0);if(lag>P.maxLagDays)P.maxLagDays=Math.round(lag*10)/10;
      if(g.day!==lastGuestDay){lastGuestDay=g.day;lastGuestMove=Date.now();lastHostDayAtMove=h.day;}
      P.samples.push({t:Math.round((Date.now()-(end-MIN*60000))/1000),hd:Math.round(h.day*10)/10,gd:Math.round((g.day||0)*10)/10,hrev:h.rev,grev:g.rev,gapp:g.applied,held:g.stats&&g.stats.held,touch:g.stats&&g.stats.touchHeld,fail:g.stats&&g.stats.fail,builds:g.stats&&g.stats.builds,mo:g.modalOpen?1:0});
      /* açık pencere = tasarım gereği bekleme (artık MP çubuğunda yazılır): donma sayılmaz; oyuncu gibi pencere kapatılır */
      if(Date.now()-lastGuestMove>STALL&&g.modalOpen){P.windowHolds=(P.windowHolds||0)+1;P.windowNote=g.syncNote||P.windowNote||'';await B.evaluate(()=>{try{UI.closeModal();}catch{}});lastGuestMove=Date.now();continue;}
      if(Date.now()-lastGuestMove>STALL&&h.day-lastHostDayAtMove>3){stalled={afterS:Math.round((Date.now()-(end-MIN*60000))/1000),stuckMs:Date.now()-lastGuestMove,host:h,guest:g,hostDaysSince:Math.round((h.day-lastHostDayAtMove)*10)/10,lastActions:Object.keys(P.actions).slice(-12)};
        P.stalls.push(stalled);await shot(B,'p0-stall-guest');await shot(H,'p0-stall-host');console.log('  DONMA '+JSON.stringify(stalled).slice(0,1500));
        /* donma sırasında komut: host kabul ediyor mu, aynaya yansıyor mu? */
        stalled.cmd=await command('stalled');stalled.hostAfter=await hostState();stalled.guestAfter=await B.evaluate(()=>__p0.diag()).catch(()=>null);
        /* kendiliğinden toparlanıyor mu? (pencere kapatılmadan 15 sn) */
        await sleep(15000);const g2=await B.evaluate(()=>__p0.diag()).catch(()=>null);stalled.selfRecovered=!!(g2&&g2.day!==g.day);stalled.guestLater=g2;
        if(!stalled.selfRecovered)break;lastGuestMove=Date.now();}
    }
    P.actionCount=n;P.final={host:await hostState(),guest:await B.evaluate(()=>__p0.diag()).catch(()=>null)};
    fs.writeFileSync(path.join(out,'p0-soak.json'),JSON.stringify(P,null,1));
    console.log('  eylem '+n+' · en büyük gecikme '+P.maxLagDays+' gün · donma '+P.stalls.length+' · komut '+JSON.stringify(P.cmds.map(c=>[(c.move||{}).status,(c.ship||{}).status,c.shipSeen])));
    assert.equal(P.stalls.filter(s=>!s.selfRecovered).length,0,'misafir dünyası kalıcı olarak durdu: '+JSON.stringify(P.stalls[0]||{}).slice(0,900));
    const lost=P.cmds.filter(c=>c.ship&&c.ship.status==='ok'&&c.shipSeen===false);assert.equal(lost.length,0,'host\'un kabul ettiği gemi siparişi misafir aynasına yansımadı: '+JSON.stringify(lost[0]||{}).slice(0,400));
  });
  /* ---- hedefli vakalar: her biri düzeltmeden önce KALICI donma / sessiz kayıp üretir (FAIL), düzeltmeyle kendiliğinden toparlanır ---- */
  const T=metrics.p0.targeted={};
  const speed=n=>H.evaluate(n=>{const m=document.getElementById('modal');if(m&&!m.classList.contains('hidden'))try{UI.closeModal();}catch{}const r=MP1Host.host.local({kind:'speed',value:n});return {r:r.ok||r.code,spd:G.speed|0};},n);
  const settle=async()=>{await B.evaluate(()=>{try{UI.closeModal();}catch{}try{UI.act('closeDiplo');}catch{}});await B.waitForFunction(()=>MP6Stars.S.appliedRev===MP6Stars.S.rev&&!MP6Stars.S.building,undefined,{timeout:30000,polling:200});};
  const gday=()=>B.evaluate(()=>G.day),hday=()=>H.evaluate(()=>G.day);
  const running=async()=>{await speed(2);await H.waitForFunction(()=>(G.speed|0)>0,undefined,{timeout:15000,polling:200}).catch(()=>{});};
  const moved=async(ms,min)=>{const a=await gday();const t0=Date.now();while(Date.now()-t0<ms){await sleep(500);if((await gday())-a>=min)return {ok:true,ms:Date.now()-t0,days:(await gday())-a};}return {ok:false,ms,days:(await gday())-a,diag:await B.evaluate(()=>__p0.diag()).catch(()=>null),host:await hostState()};};

  await test('P2 misafirin yerel sunum durumunda bozuk kart (kurulum deserialize\'dan ÖNCE istisna atar): dünya kalıcı donmaz — neden kaydedilir, durum onarılır, ayna uygulanır',async()=>{
    await B.evaluate(GUEST);await running();await settle();
    await B.evaluate(()=>{G.inbox.push(undefined);});
    const r=await moved(20000,3);T.badCard={...r,crash:await B.evaluate(()=>MP6Stars.S.stats.crash||0),clean:await B.evaluate(()=>G.inbox.every(n=>n&&typeof n==='object'))};
    assert(r.ok,'misafir dünyası ilerlemedi (kalıcı donma): '+JSON.stringify(r).slice(0,700));assert(T.badCard.crash>=1,'istisna yakalanıp sayılmalı');assert(T.badCard.clean);});

  await test('P3 kapanışı gelmeyen dokunma (pointerdown var, pointerup/pointercancel yok): ayna süresiz bekletilmez — en çok ~3 sn sonra uygulanır',async()=>{
    await running();await settle();
    await B.evaluate(()=>{(document.querySelector('#panel')||document.getElementById('inbox')).dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,bubbles:true,pointerType:'touch'}));});
    assert.equal(await B.evaluate(()=>UI._surfacePointers.has(91)),true,'fikstür: işaretçi kayıtlı');
    const r=await moved(20000,3);T.stuckPointer={...r,forced:await B.evaluate(()=>MP6Stars.S.stats.touchForced||0)};
    assert(r.ok,'misafir dünyası ilerlemedi (kalıcı bekletme): '+JSON.stringify(r).slice(0,700));assert(T.stuckPointer.forced>=1);});

  await test('P4 host bu oyuncunun aynasını kuramıyor (host yayın arızası): host döngüsü çökmez, hata host tanısında; misafir açık ileti görür; arıza kalkınca kendiliğinden eşitlenir',async()=>{
    await running();await settle();const e0=errors.length;
    await H.evaluate(()=>{window.__mb=StarsMirror.build;StarsMirror.build=function(){throw Error('test ayna arızası');};});
    const seen=await B.waitForFunction(()=>MP6Stars.S.sync.why==='host-publish',undefined,{timeout:25000,polling:250}).then(()=>true,()=>false);
    const g=await B.evaluate(()=>({note:MP6Stars.S.sync.note,chip:document.getElementById('mp1Mini').textContent,pulse:MP6Stars.S.sync.pulse})),h=await H.evaluate(()=>({n:MP1Host.host.stats.publishErrors|0,e:MP1Host.host.stats.lastPublishError,loop:MP1Host.loopErrors|0,spd:G.speed|0}));
    await shot(B,'p0-host-publish-note');
    await H.evaluate(()=>{StarsMirror.build=window.__mb;});
    const back=await B.waitForFunction(()=>!MP6Stars.S.sync.note&&MP6Stars.S.appliedRev===MP6Stars.S.rev&&MP6Stars.S.sync.pulse&&!MP6Stars.S.sync.pulse.mfail,undefined,{timeout:40000,polling:250}).then(()=>true,()=>false);
    const lag=Math.abs((await hday())-(await gday()));T.hostPublish={seen,g,h,back,lag,pageErrors:errors.slice(e0)};
    assert(seen,'misafir host yayın hatasını görmedi: '+JSON.stringify({g,h}).slice(0,600));assert(/yayın hatası/.test(g.note)&&/yayın hatası/.test(g.chip),'görünür ileti');
    assert(h.n>=1&&h.e&&h.e.stage==='mirror','host tanısı: '+JSON.stringify(h));assert(h.spd>0,'host oyunu sürüyor');
    assert(back,'arıza kalkınca toparlanmadı');assert(lag<6,'eşitlendi (fark '+lag+' gün)');
    assert.equal(errors.slice(e0).filter(x=>/^H:/.test(x)).length,0,'host sayfasında yakalanmamış istisna yok');});

  await test('P5 DURAKLATILMIŞ oyunda kaybolan ayna iletisi ("host kabul etti ama tersane sırası değişmedi"): bildirim host ACK\'inden ÖNCE çıkmaz; nabız eksik aynayı gösterir, misafir TAM ayna ister ve sıra görünür',async()=>{
    const z=await speed(0);await H.waitForFunction(()=>(G.speed|0)===0,undefined,{timeout:10000,polling:200});await settle();
    const r=await B.evaluate(async()=>{
      const y=G.sys.find(s=>s.owner===0&&hasYard(s));if(!y)return {err:'tersane yok'};const q0=(y.queue||[]).length,n0=G.log.length,res0=MP1Join.results.length;
      const o=MP6Stars.onMessage;window.__drop=true;MP6Stars.onMessage=m=>(window.__drop&&m&&(m.type==='mirrorDelta'||m.type==='mirror'))?(window.__dropped=(window.__dropped|0)+1,true):o(m);
      const ret=queueShip(G.p,y,'kor');const early=G.log.slice(n0).some(l=>/tezgâha kondu/.test(l.m));
      const t0=Date.now();while(MP1Join.results.length===res0&&Date.now()-t0<8000)await new Promise(r=>setTimeout(r,50));
      const res=MP1Join.results[MP1Join.results.length-1];await new Promise(r=>setTimeout(r,1200));
      const late=G.log.slice(n0).some(l=>/tezgâha kondu/.test(l.m));window.__drop=false;
      return {yard:y.id,q0,ret,early,status:res&&res.status,late,dropped:window.__dropped|0,qNow:(G.sys[y.id].queue||[]).length};});
    assert(!r.err,r.err);const hostQ=await H.evaluate(([id])=>(G.sys[id].queue||[]).length,[await H.evaluate(()=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.playerId!=='host');const y=G.sys.find(s=>s.owner===p.empireId&&hasYard(s));return y.id;})]);
    const seen=await B.waitForFunction(a=>(G.sys[a.yard].queue||[]).length>a.q0,r,{timeout:20000,polling:250}).then(()=>true,()=>false);
    T.lostMirror={...r,hostQ,seen,sync:await B.evaluate(()=>({log:MP6Stars.S.sync.log.slice(-6).map(x=>x.what),resyncs:MP6Stars.S.stats.resyncs,pulse:MP6Stars.S.sync.pulse,rev:MP6Stars.S.rev}))};
    assert.equal(r.status,'ok','host emri kabul etti');assert.equal(r.early,false,'bildirim ACK\'ten önce çıkmamalı');assert.equal(r.late,true,'bildirim ACK\'le çıkmalı');
    assert(r.dropped>=1,'fikstür: ayna iletisi gerçekten düşürüldü');assert.equal(r.qNow,r.q0,'fikstür: o anda misafir sırası değişmedi (belirti)');assert(hostQ>r.q0,'host\'ta sıra değişti');
    assert(seen,'misafir kaybolan aynayı kendiliğinden geri almadı: '+JSON.stringify(T.lostMirror).slice(0,700));});

  await test('P6 takviye düğmesi (reinf) misafirde yakalanmamış istisna atmaz; ret gerçek nedeniyle bildirilir',async()=>{
    const e0=errors.length;const r=await B.evaluate(()=>{const f=G.fleets.find(x=>x.e===0);if(!f)return {err:'filo yok'};let threw=null;try{UI.act('reinf',String(f.id));}catch(e){threw=String(e&&e.message||e);}return {threw};});
    await sleep(1500);T.reinf={...r,pageErrors:errors.slice(e0)};assert(!r.err,r.err);assert.equal(r.threw,null);assert.equal(errors.slice(e0).filter(x=>/orders is not iterable/.test(x)).length,0);});

  await test('P7 kayıt → çıkış → devam (gerçek kullanıcı akışı): oyun içi "Dosyaya kaydet" MP\'de çok oyunculu paket indirir; misafirin .sav\'ı açık nedenle reddedilir; host\'un düz .sav\'ı devam lobisi açar, misafir yeni kodla katılır, host koltuğa atar, aynı gün ve devletten sürer',async()=>{
    await speed(0);await settle();
    const before=await H.evaluate(()=>{const p=[...MP1Host.host.state.players.values()].find(x=>x.playerId!=='host');return {day:G.day,r:String(RND_STATE),ge:p.empireId,gname:G.emps[p.empireId].name,hname:G.emps[0].name,sys:G.sys.length,emps:G.emps.length};});
    /* a) oyun içi ☰ → Dosyaya kaydet (motorun downloadSave'i): MP host oyununda .starsmp.json */
    const [dl]=await Promise.all([H.waitForEvent('download',{timeout:20000}),H.evaluate(()=>downloadSave())]);const dlPath=path.join(out,'p0-host-download.json');await dl.saveAs(dlPath);
    const dlName=dl.suggestedFilename(),dlText=fs.readFileSync(dlPath,'utf8');assert(/\.starsmp\.json$/.test(dlName),'indirilen dosya çok oyunculu paket olmalı: '+dlName);
    assert.equal(await H.evaluate(t=>StarsMP.validatePackage(t).ok,dlText),true);
    /* b) eski yol: host'un ve misafirin düz Save8 (.sav) dosyaları — gerçek kullanıcının elindeki dosya türü */
    const host8=await H.evaluate(()=>serialize()),guest8=await B.evaluate(()=>serialize());
    const hostSav=path.join(out,'stars-host-oyun-ici.sav'),guestSav=path.join(out,'stars-misafir-oyun-ici.sav');fs.writeFileSync(hostSav,host8);fs.writeFileSync(guestSav,guest8);
    const kinds=await H.evaluate(([h,g])=>[StarsMP.validatePackage(h).why,StarsMP.validatePackage(g).why],[host8,guest8]);assert.deepEqual(kinds,['save8-host','save8-guest']);
    /* misafirde cihaz kaydı tek oyunculu yuvaya ayna yazmaz */
    const slot=await B.evaluate(async()=>{const a=localStorage.getItem('yildiz:save');const ok=await saveGame();return {ok,same:localStorage.getItem('yildiz:save')===a};});assert.deepEqual(slot,{ok:false,same:true});
    /* c) çıkış: host sayfası yeniden yüklenir (oda biter); ÇOK OYUNCULU → KAYITLI OYUNA DEVAM ET → DOSYADAN AÇ */
    const code0=await H.evaluate(()=>MP1Host.code);await H.goto(origin.H+'/');await wait(H,()=>typeof setupGame==='function'&&document.getElementById('mp1Btn'));
    await tap(H,'#mp1Btn');await wait(H,()=>MP1Host.screen==='menu');await tap(H,'[data-m="saves"][data-mode="resume"]');await wait(H,()=>document.getElementById('mp4File')&&Array.isArray(MP1Host.saves));   // liste yüklendikten sonra (ekran yeniden çizilir)
    await H.setInputFiles('#mp4File',guestSav);await wait(H,()=>/MİSAFİR görünümü/.test(document.getElementById('mp4Status').textContent)).catch(async e=>{throw Error('misafir dosyası iletisi: '+JSON.stringify(await H.evaluate(()=>({status:document.getElementById('mp4Status')&&document.getElementById('mp4Status').textContent,err:MP1Host.saveErr,screen:MP1Host.screen,card:!!document.getElementById('mp4FileCard')})))+' '+e.message);});
    T.guestFileMsg=await H.evaluate(()=>document.getElementById('mp4Status').textContent);assert(!/bozuk/i.test(T.guestFileMsg),'"bozuk" denmemeli: '+T.guestFileMsg);assert.equal(await H.evaluate(()=>!!document.getElementById('mp4FileCard')),false,'misafir kaydı devam kartı açmaz');await shot(H,'p0-guest-file-rejected');
    await H.setInputFiles('#mp4File',hostSav);await wait(H,()=>document.getElementById('mp4FileCard')&&document.getElementById('mp4Imported'));await shot(H,'p0-host-sav-card');
    await tap(H,'[data-m="resumeFile"]');await wait(H,()=>document.getElementById('mp1Sheet'));await tap(H,'#mp1Sheet [data-m="sheetOk"]');
    await wait(H,()=>MP1Host.lobby&&MP1Host.lobby.phase==='resume'&&document.getElementById('mp4Seats'),undefined,60000);const code1=await H.evaluate(()=>MP1Host.code);assert.notEqual(code1,code0,'yeni oda kodu');
    assert.equal(await H.evaluate(()=>G.day),before.day,'host dünyası aynı gün');assert.equal(await H.evaluate(()=>String(RND_STATE)),before.r,'RNG aynı');
    /* d) misafir yeni kodla katılır: kimlik eşleşmez → ziyaretçi; host KİMLİĞİ KURTAR ile koltuğuna atar */
    await guestGo('B',code1,'Bora');await wait(B,()=>MP1Join.screen==='lobby'&&MP1Join.lobby&&MP1Join.lobby.phase==='resume',undefined,40000);
    assert.equal(await B.evaluate(()=>MP1Join.empireId),null,'ziyaretçi kendiliğinden devlet alamaz');
    await wait(H,()=>document.querySelector('#mp4Visitors [data-m="recover"]'),undefined,20000);await shot(H,'p0-resume-visitor');await tap(H,'#mp4Visitors [data-m="recover"]');
    {const sh=await H.$('#mp1Sheet [data-m="sheetOk"]');if(sh)await tap(H,'#mp1Sheet [data-m="sheetOk"]');}
    await wait(B,e=>MP1Join.empireId===e,before.ge,20000);
    /* e) DEVAM ET */
    await tap(H,'[data-m="resumeGo"]');{const sh=await H.$('#mp1Sheet [data-m="sheetOk"]');if(sh)await tap(H,'#mp1Sheet [data-m="sheetOk"]');}
    await wait(H,()=>MP1Host.started&&MP1Host.host.lobby.phase==='ingame');
    await wait(B,()=>window.MP6Stars&&MP6Stars.S.started&&!document.getElementById('game').classList.contains('hidden'),undefined,60000);
    const after={h:await H.evaluate(()=>({day:G.day,r:String(RND_STATE),sys:G.sys.length,emps:G.emps.length,hname:G.emps[0].name})),g:await B.evaluate(()=>({day:G.day,name:G.p.name,sys:G.sys.length}))};T.resume={before,after,code0,code1,dlName,pkgBytes:dlText.length,host8:host8.length,guest8:guest8.length};
    assert.equal(after.h.day,before.day);assert.equal(after.h.r,before.r);assert.equal(after.g.day,before.day,'misafir aynı günde');assert.equal(after.g.name,before.gname,'misafir kendi devletinde');assert.equal(after.h.hname,before.hname);
    /* f) oyun gerçekten sürer: misafir emri uygulanır, zaman ilerler */
    await B.evaluate(GUEST);const c=await command('resume');assert.equal(c.ship&&c.ship.status,'ok','devam sonrası emir: '+JSON.stringify(c).slice(0,300));
    await running();const m=await moved(30000,3);assert(m.ok,'devam sonrası dünya ilerlemedi: '+JSON.stringify(m).slice(0,500));await speed(0);await shot(B,'p0-resumed-guest');});
  fs.writeFileSync(path.join(out,'p0-soak.json'),JSON.stringify(metrics.p0,null,1));
};

'use strict';
/* STARS MP.6 — misafir telefonda GERÇEK STARS arayüzü.
   Bu sayfa tek oyunculu oyunla aynı index.html'dir (aynı 19 runtime dosyası, aynı harita/menü/panel kodu). Fark:
   - Dünya host'tan gelen "ayna dünya"dır (research/mp6/mirror.js): yetkiye göre süzülmüş, misafirin devleti 0 numaralı.
     Motorun kendi deserialize()'ı kurar. Misafir SİMÜLASYON YÜRÜTMEZ: hız hep 0, tik yok.
   - Eylemler host'a gider: UI.act kapısı (izinli görünüm eylemleri yerelde; desteklenmeyen eylemler açık uyarıyla engellenir)
     ve motorun eylem işlevleri (orderMove, queueBuilding, researchTarget, setResearchMode) MP komutuna çevrilir.
     Yerelde kalan herhangi bir değişiklik bir sonraki aynada host'un gerçeğiyle ezilir; host'a ancak MP komutu ulaşır.
   - Lobi ve bağlantı join.js'tedir (aynı modül); bu dosya oyun ekranını gerçek arayüzle değiştirir. */
(function(){
const doc=document;
/* join.js lobisi için katman (oyun başlayınca gizlenir) */
const ov=doc.createElement('div');ov.id='mp6App';ov.className='mp1-overlay mp6-join';ov.innerHTML='<div class="mp1-status">Yükleniyor…</div>';
(doc.body||doc.documentElement).appendChild(ov);

const S={J:null,mirror:null,rev:0,timer:null,building:false,started:false,on:false,lastBuild:0,minGap:600,uiSent:false,seenResults:0,
  stats:{mirrors:0,deltas:0,bytes:0,builds:0,buildMs:[],resyncs:0,blocked:{},sent:{}}};

/* ---- 1. eylem kapısı ---- */
/* Yalnız görünüm/gezinme (dünyayı değiştirmeyen) eylemler yerelde çalışır. */
const VIEW=new Set(['tab','full','cameraReset','cameraFocus','home','fit','topStatus','diploPane','globalPane','advClose','advShow','advNever','planetFold',
  'radarTog','fleetNamesToggle','grpTog','fedLinksToggle','allyLinksToggle','warLinksToggle','logiToggle','mapMode','bgTog','diploView','diploPick',
  'diploRelation','diploNav','diploFilter','bmPick','bmCancel','vsCurrent','vsInspect','vsType','vsEdit','vsBack','fleetFilter','fedTab','fedMember',
  'closeFed','closeDeal','closeMarket','closeDiplo','memTog','intelView','intelGroup','upInfo','crisInfo','selsys','selfleet','route','fedPane',
  'scienceTab','scienceNode','scienceFocus','scienceFilter','scienceMode','scienceQueue','scienceRoute','scienceMove','scienceRemove','scienceZoom',
  'tech','build','sInfo','bInfo','showEv','minModal','restoreModal','openNote','closem','marketPane','mktSel','mute','save','diagShow','opLogMenu']);
/* "build", "tech", "science*" ve harita rota dokunuşu motor işlevlerine iner; o işlevler aşağıda MP komutuna çevrilir. */
const WHY={spd:'Oyun hızını host yönetir.',toTitle:'Odadan ayrılmak için telefonun geri tuşunu kullan.'};
function blocked(a){S.stats.blocked[a]=(S.stats.blocked[a]||0)+1;toast(WHY[a]||'Bu işlem çok oyunculu misafirde henüz yok (MP.6). Host yetkili komut sistemi bu eylemi desteklemiyor.',true);}
function toast(m,bad){try{UI.alert(m,bad?'war':'');}catch{}}
function gate(){
  /* desteklenmeyen kontroller görsel olarak da devre dışı: gerçek UI.act'in eylem listesinden misafirde izinli olmayanlar soluk gösterilir
     (dokununca açık uyarı). Liste arayüz kodundan okunur; yeni eylem eklenirse kendiliğinden kapsanır. */
  try{const all=new Set([...String(UI.act).matchAll(/case '([A-Za-z0-9_]+)'/g)].map(m=>m[1]));S.unsupported=[...all].filter(a=>!VIEW.has(a)).sort();
    const st=doc.createElement('style');st.id='mp6Disabled';st.textContent=S.unsupported.map(a=>'[data-a="'+a+'"]').join(',')+'{opacity:.42!important;filter:grayscale(.7)}';doc.head.appendChild(st);}catch{}
  const act=UI.act.bind(UI);
  UI.act=function(a,x,el){if(!S.on)return act(a,x,el);if(VIEW.has(a))return act(a,x,el);return blocked(a);};
  const spd=UI.setSpeed.bind(UI);UI.setSpeed=function(){return spd(0);};               // misafirde zaman hep durur; tik yok
  /* motor eylemleri → MP komutu (yalnız misafirin kendi devleti: aynada 0) */
  const wrap=(name,fn)=>{const o=window[name];if(typeof o!=='function')return;window[name]=function(...a){if(!S.on||S.building)return o.apply(this,a);return fn(o,...a);};};
  wrap('orderMove',(o,f,target,append,automatic)=>{if(automatic||!f||f.e!==0)return false;return send({kind:'move',fleet:f.id,to:+target})!==null;});
  wrap('queueBuilding',(o,e,sys,pl,k)=>{if(!e||e.id!==0||!sys||!pl)return false;return send({kind:'build',sys:sys.id,planet:pl.i,key:String(k)})!==null;});
  wrap('researchTarget',(o,e,id,action,position)=>{if(!e||e.id!==0)return {ok:false,why:'—'};const c={kind:'research',tech:String(id)};
    if(action&&action!=='toggle'){c.action=action;c.position=position|0;}return send(c)?{ok:true}:{ok:false,why:'Host bağlı değil'};});
  wrap('setResearchMode',(o,e,mode)=>{if(!e||e.id!==0)return false;return !!send({kind:'researchMode',mode:String(mode)});});
}
function send(cmd){const J=S.J;if(!J)return null;const r=J.cmd(cmd);S.stats.sent[cmd.kind]=(S.stats.sent[cmd.kind]||0)+1;
  if(!r.ok){toast(r.why==='host-yok'?'Host bağlı değil; emir gönderilmedi.':'Emir gönderilemedi.',true);return null;}return r.cid;}

/* ---- 2. ayna dünya → motorun kendi deserialize'ı ---- */
function onMessage(m){
  if(m.type==='mirror'){S.mirror=m.full;S.rev=m.rev;S.stats.mirrors++;schedule();return true;}
  if(m.type==='mirrorDelta'){if(!S.mirror||m.base!==S.rev){S.stats.resyncs++;S.J&&S.J.sendRaw({v:1,type:'resync'});return true;}
    StarsMirror.apply(S.mirror,m.ops);S.rev=m.rev;S.stats.deltas++;schedule();return true;}
  return false;
}
function schedule(){if(S.timer)return;const wait=Math.max(0,S.minGap-(Date.now()-S.lastBuild));S.timer=setTimeout(rebuild,wait);}
function rebuild(){
  S.timer=null;if(!S.mirror)return;
  /* finishSaveLoad yüklemede rota kipini, dokunma hareketini ve açık bildirimi sıfırlar; canlı senkronda kullanıcının
     yarım hareketi bozulmasın diye korunur. Kamera View.cam'de; deserialize ona dokunmaz. */
  const keep={route:View.route,routed:View.routed,note:UI._openNote,offer:UI.pendingOffer},rg=View.resetGesture;
  const t0=performance.now();S.building=true;let ok=false;
  try{View.resetGesture=S.started?function(){}:rg;ok=deserialize(JSON.stringify(S.mirror));}catch{ok=false;}
  finally{View.resetGesture=rg;S.building=false;}
  S.lastBuild=Date.now();
  if(!ok){S.stats.fail=(S.stats.fail||0)+1;S.timer=setTimeout(rebuild,1000);return;}
  G.autoSave=false;G.speed=0;
  if(S.started){View.route=keep.route;View.routed=keep.routed;UI._openNote=keep.note;UI.pendingOffer=keep.offer;}
  const ms=performance.now()-t0;S.stats.builds++;S.stats.buildMs.push(Math.round(ms*10)/10);if(S.stats.buildMs.length>60)S.stats.buildMs.shift();
  if(!S.started)start();else{UI.keepScroll=true;try{UI.refresh();}catch{}}
}
function start(){
  S.started=true;S.on=true;gate();
  try{leaveTitle(null);}catch{}
  doc.getElementById('menu').classList.add('hidden');doc.getElementById('game').classList.remove('hidden');ov.style.display='none';
  enterGame(true);UI.setSpeed(0);
  View.selSys=G.sys[G.p.home]||null;try{View.center(View.selSys.x,View.selSys.y);}catch{}
  chip();
}

/* ---- 3. host'takiyle AYNI çok oyunculu çubuk ve AYNI MP diplomasi paneli (dip-ui.js / pol-ui.js) ---- */
const V=window.MP1View,esc=V.esc;let chipEl=null,dipEl=null,dipUI=null,polUI=null,dipSeg='trade';const waits={};
function chip(text,good){
  if(!chipEl){chipEl=doc.createElement('div');chipEl.id='mp1Mini';chipEl.className='mp1-mini mp6-mini';(doc.getElementById('app')||doc.body).appendChild(chipEl);   // oyunun kök kabında (STARS katman bağlamı)
    chipEl.addEventListener('click',e=>{if(e.target.closest('[data-g6="dip"]'))dipOpen(true);});}
  if(text!==undefined){const n=dipCount();const h='<div class="mp3-minirow"><span class="mp1-mini-h mp6-conn '+(good?'ok':'bad')+'" id="mp6Conn"><b>ÇOK OYUNCULU</b> · '+esc(text)+'</span>'+
      (window.MP3Dip?'<button class="mp1-btn mp3-hostbtn" data-g6="dip" id="mp6DipBtn">DİPLOMASİ'+(n?' <i class="mp3-badge">'+n+'</i>':'')+'</button>':'')+'</div>';if(chipEl.innerHTML!==h)chipEl.innerHTML=h;}
  chipEl.style.display=S.started?'':'none';
}
const view=()=>S.J&&S.J.game.view,day=()=>((S.J&&S.J.game.clock)||{}).day,online=()=>!!(S.J&&S.J.hostOnline);
const sendF=(cmd,done)=>{const r=S.J.cmd(cmd);if(r.ok)waits[r.cid]=done;return r;};
function dipCount(){const v=view();if(!v||!v.dip)return 0;return v.dip.offers.filter(o=>o.to===v.me.id&&o.status==='pending').length+(polUI?polUI.pending():0);}
function dipToast(t,bad){toast(t,bad);}
function dipOpen(on){
  if(!window.MP3Dip)return;
  if(!on){if(dipEl){if(dipUI)dipUI.close();if(polUI)polUI.close();dipEl.remove();dipEl=null;dipUI=null;polUI=null;}return;}
  if(dipEl)return;
  dipEl=doc.createElement('div');dipEl.className='mp3-host';dipEl.id='mp3Host';
  const seg=window.MP31Pol?'<div class="mp31-seg">'+[['trade','TİCARET'],['fed','FEDERASYON'],['vas','VASALLIK']].map(([k,n])=>'<button data-hs="'+k+'">'+n+'</button>').join('')+'</div>':'';
  dipEl.innerHTML='<div class="mp3-host-h"><span>ÇOK OYUNCULU DİPLOMASİ</span><button class="mp1-btn" data-h="close">KAPAT</button></div><div class="mp3-host-b" id="mp3HostBody">'+seg+'<div id="mp3HostT"></div><div id="mp3HostP" hidden></div></div>';
  doc.body.appendChild(dipEl);
  dipEl.querySelector('[data-h="close"]').addEventListener('click',()=>dipOpen(false));
  dipUI=MP3Dip.create({root:doc.getElementById('mp3HostT'),esc,color:V.color,data:()=>({dip:view().dip,me:view().me,day:day()}),online,toast:dipToast,send:sendF});
  if(window.MP31Pol){polUI=MP31Pol.create({root:doc.getElementById('mp3HostP'),esc,color:V.color,data:()=>({pol:view().pol,dip:view().dip,me:view().me,day:day()}),online,toast:dipToast,send:sendF});
    MP31Pol.addCloser(dipUI.close);dipEl.querySelector('.mp31-seg').addEventListener('click',e=>{const b=e.target.closest('[data-hs]');if(b)seg6(b.dataset.hs);});}
  seg6(dipSeg);
}
function seg6(s){dipSeg=s;const T=doc.getElementById('mp3HostT'),P=doc.getElementById('mp3HostP');if(!T)return;T.hidden=s!=='trade';if(P)P.hidden=s==='trade';
  if(dipUI)dipUI.close();if(polUI){polUI.close();if(s!=='trade')polUI.U.sec=s;}dipTick(true);}
function dipTick(force){
  if(dipUI&&dipSeg==='trade')dipUI.render(force);if(polUI&&dipSeg!=='trade')polUI.render(force);
  if(polUI&&dipEl){const c=polUI.counts(),t=dipUI?dipUI.incoming().length:0;for(const [k,n,x] of [['trade','TİCARET',t],['fed','FEDERASYON',c.fed],['vas','VASALLIK',c.vas]]){const b=dipEl.querySelector('[data-hs="'+k+'"]');
    if(!b)continue;const h=n+(x?' <i class="mp3-badge">'+x+'</i>':'');if(b.innerHTML!==h)b.innerHTML=h;b.classList.toggle('on',dipSeg===k);}}
}
function screen(name){
  /* oyun dışı ekranlar (giriş, lobi, oda kapandı) join.js katmanında */
  if(name!=='game'&&S.started){ov.style.display='';doc.getElementById('game').classList.add('hidden');S.on=false;S.started=false;S.mirror=null;chip();}
  else if(name!=='game')ov.style.display='';
}
function update(statusHtml){
  const J=S.J;if(!J)return;
  if(!S.uiSent&&J.empireId!==null&&J.ws&&J.ws.readyState===1){S.uiSent=true;J.sendRaw({v:1,type:'ui',mode:'stars'});}
  const tmp=doc.createElement('div');tmp.innerHTML=statusHtml;const s=tmp.firstChild;
  if(S.started&&s)chip(s.textContent,/\bok\b/.test(s.className));
  else if(!S.started){ov.style.display='';ov.innerHTML=statusHtml+'<div class="mp1-status">Galaksi verisi bekleniyor…</div>';}
  /* host'un reddettiği komutlar: gerçek arayüzün kendi uyarısıyla */
  for(;S.seenResults<J.results.length;S.seenResults++){const r=J.results[S.seenResults];
    if(waits[r.cid]){const w=waits[r.cid];delete waits[r.cid];try{w(r);}catch{}continue;}   // MP diplomasi paneli kendi sonucunu gösterir
    if(r.status!=='ok')toast('Host reddetti: '+(MP1View.ERR[r.code]||r.code),true);}
  if(dipEl)dipTick(false);
}
window.MP6Stars={S,onMessage,update,screen,attach(J){S.J=J;},onAssign(){S.uiSent=false;},VIEW,dip:{open:dipOpen,seg:seg6,get ui(){return dipUI;},get pol(){return polUI;}}};
/* telefon geri tuşu: önce açık MP diplomasi onayı/paneli kapanır (join.js popstate bunu sorar) */
const prevBack=window.__mpBack;window.__mpBack=()=>{if(prevBack&&prevBack())return true;if(dipEl){dipOpen(false);return true;}return false;};
})();

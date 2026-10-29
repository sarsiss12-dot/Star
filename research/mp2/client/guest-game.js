'use strict';
/* STARS MP.2 — misafir oyun ekranı: galaksi haritası, filolar, koloniler, bilim.
   Oyun motoru YOK: her şey host'un gönderdiği filtreli görünümden (MP1Join.game.view) çizilir,
   her eylem host'a komut olarak gider (move / research / researchMode / build) ve host'un gerçek
   kurallarından geçer. İstemci rota hesaplamaz, araştırma kuralı uygulamaz.
   Performans: harita yalnız gerektiğinde (veri/kamera değişince) tek kare çizer; sekmeler yalnız
   kendi verisi değişince yeniden kurulur. */
(function(){
const V=MP1View,esc=V.esc,doc=document;
const TABS=[['map','HARİTA'],['fleets','FİLOLAR'],['cols','KOLONİLER'],['sci','BİLİM']].concat(window.MP3Dip?[['dip','DİPLOMASİ']]:[]);   // MP.3: diplomasi sekmesi
const BR={fiz:['FİZİK','#8b7bff'],top:['TOPLUM','#6ff2c8'],muh:['MÜHENDİSLİK','#ff9b3d']};
const MODE={semi:'Yarı otomatik',manual:'Elle',auto:'Otomatik'};
const ST={d:'Tamamlandı',r:'Araştırılabilir',l:'Ön koşul gerekli',x:'Erişim yok'};
const RES={min:'Mineral',ene:'Enerji',yiy:'Yiyecek',ala:'Alaşım',ara:'Araştırma',tuk:'Tüketim',etk:'Etki'};
const CODE={'not-owner':'Bu filo senin değil ya da artık yok.','rules:passage':'Rota kapalı: yabancı bölgeden geçiş izni gerekli.','rules:no-route':'Bu sisteme ulaşan yol yok.',
  'rules:same':'Zaten bu durumda.','rules:no-position':'Filonun konumu belirsiz.','rules':'Oyun kuralı izin vermedi.','rules:access':'Erişim koşulu sağlanmıyor.',
  'rules:route':'Ön koşul rotası kapalı.','rules:done':'Bu teknoloji tamamlandı.','rules:bad-position':'Geçersiz sıra.','bad-params':'Geçersiz komut.',
  'forged-empire':'Başka devlet adına komut verilemez.','host-yok':'Host bağlı değil.'};
const G2={mounted:false,tab:'map',sel:null,aim:null,pending:null,cam:null,branch:'fiz',tech:null,dirty:true,lastRes:0,lastLog:null,waits:{},dip:null,dsub:null,stats:{draws:0,drawMs:[],renders:{}},J:null};
let el={},ctx=null,dpr=1,bounds=null,raf=0;
const key=()=>'mp2:'+(G2.J&&G2.J.code||'');
function persist(){try{sessionStorage.setItem(key(),JSON.stringify({tab:G2.tab,cam:G2.cam,sel:G2.sel,branch:G2.branch,dsub:G2.dip&&G2.dip.U.sub!=='draft'?G2.dip.U.sub:null}));}catch{}}
function restore(){try{const o=JSON.parse(sessionStorage.getItem(key()));if(o){G2.tab=TABS.some(t=>t[0]===o.tab)?o.tab:G2.tab;G2.cam=o.cam||null;G2.sel=o.sel||null;G2.branch=o.branch||G2.branch;G2.dsub=o.dsub||null;}}catch{}}
const view=()=>G2.J.game.view;
const sysName=id=>{const s=view().sys[id];return s&&s.k?s.n:(id>=0?'Bilinmeyen sistem':'—');};
const empCol=o=>{const v=view();return o===v.me.id?V.color(v.me.col):o>=0&&v.emps[o]?V.color(v.emps[o].col):o===-2?'#9aa3b2':null;};

/* ---------- iskelet (bir kez) ---------- */
function mount(app){
  restore();
  app.innerHTML='<div class="mp2" id="mp2"><div class="mp2-top"><div id="jConn" class="mp1-status"></div><div class="mp2-bar"><b id="mp2Emp"></b><span id="mp2Clock"></span></div><div class="mp2-res" id="mp2Res"></div></div>'+
    '<div class="mp2-body"><section class="mp2-pane" data-pane="map"><canvas id="mp2Map" aria-label="Galaksi haritası"></canvas>'+
      '<div class="mp2-mapbtn"><button data-g2="zin" aria-label="Yakınlaştır">+</button><button data-g2="zout" aria-label="Uzaklaştır">−</button><button data-g2="fit">SIĞDIR</button><button data-g2="home">BAŞKENT</button></div>'+
      '<div class="mp2-aim" id="mp2Aim" hidden></div><div class="mp2-sel" id="mp2Sel" hidden></div></section>'+
    '<section class="mp2-pane" data-pane="fleets" id="mp2Fleets"></section><section class="mp2-pane" data-pane="cols" id="mp2Cols"></section><section class="mp2-pane" data-pane="sci" id="mp2Sci"></section>'+(window.MP3Dip?'<section class="mp2-pane" data-pane="dip" id="mp2Dip"></section>':'')+'</div>'+
    '<div class="mp2-toast" id="mp2Toast" hidden></div><nav class="mp2-nav">'+TABS.map(([k,n])=>'<button data-g2="tab" data-tab="'+k+'">'+n+'</button>').join('')+'</nav></div>';
  el={root:doc.getElementById('mp2'),conn:doc.getElementById('jConn'),emp:doc.getElementById('mp2Emp'),clock:doc.getElementById('mp2Clock'),res:doc.getElementById('mp2Res'),
    map:doc.getElementById('mp2Map'),sel:doc.getElementById('mp2Sel'),aim:doc.getElementById('mp2Aim'),fleets:doc.getElementById('mp2Fleets'),cols:doc.getElementById('mp2Cols'),
    sci:doc.getElementById('mp2Sci'),dip:doc.getElementById('mp2Dip'),toast:doc.getElementById('mp2Toast')};
  /* MP.3: diplomasi ekranı yalnız host görünümünü okur; komutların sonucu cid ile kendi geri çağrısına döner */
  if(el.dip){G2.dip=MP3Dip.create({root:el.dip,esc,color:V.color,data:()=>({dip:view().dip,me:view().me,day:(G2.J.game.clock||{}).day}),online:()=>!!G2.J.hostOnline,toast,
    send(cmd,done){const r=G2.J.cmd(cmd);if(r.ok)G2.waits[r.cid]=done;return r;},onBadge:badge});if(G2.dsub)G2.dip.U.sub=G2.dsub;}
  {const lg=view().log||[];G2.lastLog=lg.length?JSON.stringify(lg[lg.length-1]):'';}
  ctx=el.map.getContext('2d');
  el.root.addEventListener('click',onClick);
  pointer(el.map);
  addEventListener('resize',()=>{sizeCanvas();G2.dirty=true;draw();});
  G2.mounted=true;G2.lastRes=G2.J.results.length;setTab(G2.tab,true);
}
function setTab(t,first){
  G2.tab=t;for(const s of el.root.querySelectorAll('.mp2-pane'))s.hidden=s.dataset.pane!==t;
  for(const b of el.root.querySelectorAll('.mp2-nav button'))b.classList.toggle('on',b.dataset.tab===t);
  if(t==='map'){sizeCanvas();if(!G2.cam)fit('home');G2.dirty=true;draw();}else renderPane(t);
  if(G2.dip&&t!=='dip')G2.dip.close();
  if(!first)persist();
}
/* ---------- her güncellemede: yalnız değişen parçalar ---------- */
function update(statusHtml){
  const J=G2.J,v=view();if(!v)return;
  if(!G2.mounted||!doc.getElementById('mp2')){G2.mounted=false;mount(doc.getElementById('app'));J.game.changed=new Set(Object.keys(v));}
  const tmp=doc.createElement('div');tmp.innerHTML=statusHtml;const s=tmp.firstChild;
  if(el.conn.textContent!==s.textContent)el.conn.textContent=s.textContent;el.conn.className=s.className;
  const c=J.game.clock||{};el.emp.textContent=v.me.n;el.emp.style.color=V.color(v.me.col);
  el.clock.textContent='Yıl '+(+c.y)+' · Ay '+(+c.m)+' · gün '+(+c.day);
  const ch=J.game.changed||new Set();J.game.changed=new Set();
  if(ch.has('me'))el.res.innerHTML=Object.entries(v.me.res).map(([k,x])=>'<span title="'+esc(RES[k]||k)+'">'+esc(RES[k]||k)+' <b>'+esc(Math.round(x))+'</b></span>').join('');
  if(G2.tab==='map'&&(ch.has('sys')||ch.has('fleets')||ch.has('emps')||ch.has('lanes')||ch.has('me'))){G2.dirty=true;draw();if(G2.sel)renderSel();}
  if(G2.tab==='fleets'&&(ch.has('fleets')||ch.has('sys')))renderPane('fleets');
  if(G2.tab==='cols'&&(ch.has('cols')||ch.has('catalog')||ch.has('me')))renderPane('cols');
  if(G2.tab==='sci'&&(ch.has('sci')||ch.has('tech')))renderPane('sci');
  const on=!!J.hostOnline,onCh=on!==G2.lastOnline;G2.lastOnline=on;   // host gidip gelince diplomasi düğmeleri hemen kapanır/açılır
  if(onCh&&!on)for(const [cid,w] of Object.entries(G2.waits)){delete G2.waits[cid];w({status:'rejected',code:'lost'});}   // yanıtı gelmeyen komut: taslak kilitli kalmasın
  if(G2.dip&&(onCh||ch.has('dip')||ch.has('me')||ch.has('emps'))){if(G2.tab==='dip')renderPane('dip');else badge(G2.dip.incoming().length);}
  /* MP.3: kişisel bildirim (yeni teklif, kabul, ret, karşı teklif, süre doldu) */
  if(ch.has('log')){const lg=v.log||[],k=lg.length?JSON.stringify(lg[lg.length-1]):'';if(k&&k!==G2.lastLog)toast(lg[lg.length-1].m,false);G2.lastLog=k;}
  while(J.results.length>G2.lastRes){const r=J.results[G2.lastRes++],w=G2.waits[r.cid];
    if(w){delete G2.waits[r.cid];w(r);continue;}
    if(G2.lastRes===J.results.length)toast(r.status==='ok'?'Emir uygulandı'+(r.ms!==undefined?' · '+(+r.ms)+' ms':''):(CODE[r.code]||V.ERR[r.code]||r.code),r.status!=='ok');}
}
function badge(n){const b=el.root&&el.root.querySelector('.mp2-nav [data-tab="dip"]');if(!b)return;const h='DİPLOMASİ'+(n?' <i class="mp3-badge" aria-label="'+(+n)+' yeni teklif">'+(+n)+'</i>':'');if(b.innerHTML!==h)b.innerHTML=h;}
function toast(t,bad){el.toast.hidden=false;el.toast.textContent=t;el.toast.className='mp2-toast'+(bad?' bad':'');clearTimeout(G2.tt);G2.tt=setTimeout(()=>{el.toast.hidden=true;},3500);}
function renderPane(t){const t0=performance.now();
  if(t==='fleets')el.fleets.innerHTML=fleetsHtml();else if(t==='cols')colsRender();else if(t==='sci')el.sci.innerHTML=sciHtml();else if(t==='dip'&&G2.dip)G2.dip.render();
  G2.stats.renders[t]=Math.round((performance.now()-t0)*10)/10;}

/* ---------- harita ---------- */
function sizeCanvas(){const r=el.map.getBoundingClientRect();dpr=Math.min(2,devicePixelRatio||1);const w=Math.max(1,Math.round(r.width*dpr)),h=Math.max(1,Math.round(r.height*dpr));
  if(el.map.width!==w||el.map.height!==h){el.map.width=w;el.map.height=h;}}
function galaxyBounds(){const v=view();let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const s of Object.values(v.sys)){a=Math.min(a,s.x);b=Math.min(b,s.y);c=Math.max(c,s.x);d=Math.max(d,s.y);}return {x0:a,y0:b,x1:c,y1:d};}
function fit(mode){const v=view();bounds=galaxyBounds();const r=el.map.getBoundingClientRect(),W=r.width||300,H=r.height||300;
  const z=Math.min(W/(bounds.x1-bounds.x0+400),H/(bounds.y1-bounds.y0+400));
  if(mode==='home'&&v.me.home>=0&&v.sys[v.me.home]){const h=v.sys[v.me.home];G2.cam={x:h.x,y:h.y,z:z*3};}
  else G2.cam={x:(bounds.x0+bounds.x1)/2,y:(bounds.y0+bounds.y1)/2,z};
  G2.cam.zMin=z*.6;G2.cam.zMax=z*14;G2.dirty=true;}
const toScreen=(x,y)=>{const r=el.map.getBoundingClientRect(),c=G2.cam;return {x:(x-c.x)*c.z+r.width/2,y:(y-c.y)*c.z+r.height/2};};
function fleetPos(f){const v=view();if(f.mv){const a=v.sys[f.mv[0]],b=v.sys[f.mv[1]];if(a&&b)return {x:a.x+(b.x-a.x)*f.mv[2],y:a.y+(b.y-a.y)*f.mv[2]};}
  const s=v.sys[f.s];return s?{x:s.x,y:s.y}:null;}
function draw(){
  if(G2.tab!=='map'||!G2.dirty||raf)return;
  raf=requestAnimationFrame(()=>{raf=0;if(!G2.dirty)return;G2.dirty=false;paint();});
}
function paint(){
  const t0=performance.now(),v=view(),c=G2.cam;if(!v||!c)return;
  const W=el.map.width/dpr,H=el.map.height/dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#05080f';ctx.fillRect(0,0,W,H);
  const P={};for(const s of Object.values(v.sys))P[s.i]=toScreen(s.x,s.y);
  const inView=p=>p.x>-40&&p.y>-40&&p.x<W+40&&p.y<H+40;
  ctx.lineWidth=1;ctx.strokeStyle='rgba(74,168,216,.28)';ctx.beginPath();
  for(const [a,b] of v.lanes){const p=P[a],q=P[b];if(!p||!q||(!inView(p)&&!inView(q)))continue;ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);}ctx.stroke();
  const names=c.z>(c.zMin/.6)*2.2;
  ctx.font='12px system-ui,sans-serif';ctx.textAlign='center';
  for(const s of Object.values(v.sys)){const p=P[s.i];if(!inView(p))continue;
    if(!s.k){ctx.fillStyle='rgba(125,144,173,.35)';ctx.fillRect(p.x-1.5,p.y-1.5,3,3);continue;}
    const col=s.o!==undefined?empCol(s.o):null;
    ctx.beginPath();ctx.arc(p.x,p.y,s.i===v.me.home?6:4.5,0,7);ctx.fillStyle=s.vis?'#d6e6f5':'#7d90ad';ctx.fill();
    if(col){ctx.lineWidth=2.5;ctx.strokeStyle=col;ctx.beginPath();ctx.arc(p.x,p.y,8,0,7);ctx.stroke();}
    if(names||s.o===v.me.id||(G2.sel&&G2.sel.t==='s'&&G2.sel.id===s.i)){ctx.fillStyle=s.vis?'#b8c7dc':'#7d90ad';ctx.fillText(s.n,p.x,p.y+20);}
  }
  const sel=G2.sel;
  if(sel&&sel.t==='f'&&v.fleets[sel.id]&&v.fleets[sel.id].own){const f=v.fleets[sel.id],p0=fleetPos(f);
    if(p0){ctx.setLineDash([6,5]);ctx.strokeStyle=V.color(v.me.col);ctx.lineWidth=2;ctx.beginPath();let a=toScreen(p0.x,p0.y);ctx.moveTo(a.x,a.y);
      for(const id of f.pa||[]){const q=P[id];if(q)ctx.lineTo(q.x,q.y);}ctx.stroke();ctx.setLineDash([]);}}
  if(G2.pending){const q=P[G2.pending.to];if(q){ctx.strokeStyle='#f2d452';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,14,0,7);ctx.stroke();}}
  G2.hits=[];
  for(const f of Object.values(v.fleets)){const pos=f.own?fleetPos(f):(f.s>=0?v.sys[f.s]:null);if(!pos)continue;const p=toScreen(pos.x,pos.y);if(!inView(p))continue;
    const x=p.x+(f.own?10:-10),y=p.y-10;G2.hits.push({t:'f',id:f.id,x,y});
    ctx.beginPath();if(f.own){ctx.moveTo(x,y-7);ctx.lineTo(x+6,y+5);ctx.lineTo(x-6,y+5);ctx.closePath();ctx.fillStyle=V.color(v.me.col);}
    else{ctx.moveTo(x,y-6);ctx.lineTo(x+6,y);ctx.lineTo(x,y+6);ctx.lineTo(x-6,y);ctx.closePath();ctx.fillStyle=f.e!==null&&empCol(f.e)||'#ff6b6b';}
    ctx.fill();if(sel&&sel.t==='f'&&sel.id===f.id){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke();}}
  if(sel&&sel.t==='s'&&P[sel.id]){const q=P[sel.id];ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(q.x,q.y,12,0,7);ctx.stroke();}
  G2.P=P;G2.stats.draws++;G2.stats.drawMs.push(performance.now()-t0);if(G2.stats.drawMs.length>200)G2.stats.drawMs.shift();
}
function pick(x,y){
  let best=null,bd=1e9;for(const h of G2.hits||[]){const d=Math.hypot(h.x-x,h.y-y);if(d<16&&d<bd){bd=d;best=h;}}
  if(best)return best;
  for(const [id,p] of Object.entries(G2.P||{})){const d=Math.hypot(p.x-x,p.y-y);if(d<24&&d<bd){bd=d;best={t:'s',id:+id};}}
  return best;
}
/* tek parmak kaydır, iki parmak yakınlaştır, kısa dokunuş seç; tekerlek de yakınlaştırır */
function pointer(cv){
  const pts=new Map();let start=null,pinch=null,moved=false;
  cv.addEventListener('pointerdown',e=>{cv.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size===1){start={x:e.clientX,y:e.clientY,t:performance.now(),cx:G2.cam.x,cy:G2.cam.y};moved=false;}
    if(pts.size===2){const [a,b]=[...pts.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),z:G2.cam.z};moved=true;}});
  cv.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size>=2&&pinch){const [a,b]=[...pts.values()];zoomTo(pinch.z*Math.hypot(a.x-b.x,a.y-b.y)/Math.max(1,pinch.d));}
    else if(start){const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.hypot(dx,dy)>8)moved=true;
      if(moved){G2.cam.x=start.cx-dx/G2.cam.z;G2.cam.y=start.cy-dy/G2.cam.z;G2.dirty=true;draw();}}});
  const end=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);
    if(pts.size===0){if(start&&!moved&&performance.now()-start.t<600){const r=cv.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top);}
      start=null;pinch=null;persist();}
    else if(pts.size===1){const [a]=[...pts.values()];start={x:a.x,y:a.y,t:0,cx:G2.cam.x,cy:G2.cam.y};pinch=null;}};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.addEventListener('wheel',e=>{e.preventDefault();zoomTo(G2.cam.z*(e.deltaY<0?1.2:1/1.2));persist();},{passive:false});
}
function zoomTo(z){G2.cam.z=Math.max(G2.cam.zMin||0,Math.min(G2.cam.zMax||1e9,z));G2.dirty=true;draw();}
function tap(x,y){
  const h=pick(x,y);
  if(G2.aim!==null){if(h&&h.t==='s'){G2.pending={fleet:G2.aim,to:h.id};renderAim();G2.dirty=true;draw();}return;}
  G2.sel=h?{t:h.t,id:h.id}:null;persist();renderSel();G2.dirty=true;draw();
}
/* ---------- seçim paneli ---------- */
function shipText(sh){return Object.entries(sh||{}).map(([k,n])=>esc(k)+'×'+(+n)).join(' ');}
function fleetCard(f,actions){const v=view();
  if(!f.own)return '<b>Yabancı filo</b><div class="mp1-sub">'+(f.e!==null&&v.emps[f.e]?esc(v.emps[f.e].n):'Bilinmeyen devlet')+' · '+(+f.n)+' gemi · '+esc(sysName(f.s))+'</div>';
  return '<b>'+esc(f.nm)+'</b> <span class="mp2-st">'+esc(f.st)+'</span><div class="mp1-sub">'+(f.mv?esc(sysName(f.mv[0]))+' → '+esc(sysName(f.mv[1])):esc(sysName(f.s)))+
    (f.to!==f.s&&f.to>=0?' · hedef '+esc(sysName(f.to)):'')+' · güç '+(+f.pw)+(f.au?' · otomatik keşif':'')+'</div><div class="mp1-sub">'+shipText(f.sh)+'</div>'+
    (actions?'<div class="mp1-row"><button class="mp1-btn pri" data-g2="aim" data-fleet="'+(+f.id)+'">HEDEF SEÇ</button>'+actions+'</div>':'');}
function renderSel(){const v=view(),s=G2.sel;
  if(!s){el.sel.hidden=true;return;}
  if(s.t==='f'){const f=v.fleets[s.id];if(!f){G2.sel=null;el.sel.hidden=true;return;}el.sel.innerHTML=fleetCard(f,'<button class="mp1-btn" data-g2="unsel">KAPAT</button>');}
  else{const y=v.sys[s.id];if(!y){el.sel.hidden=true;return;}
    const own=Object.values(v.fleets).filter(f=>f.own&&f.s===y.i&&!f.mv),foreign=Object.values(v.fleets).filter(f=>!f.own&&f.s===y.i);
    el.sel.innerHTML='<b>'+esc(y.k?y.n:'Bilinmeyen sistem')+'</b><div class="mp1-sub">'+(!y.k?'Keşfedilmedi':y.vis?'Görüş altında':'Son bilinen durum')+
      (y.o!==undefined&&y.o>=0?' · sahibi '+(y.o===v.me.id?'sen':v.emps[y.o]?esc(v.emps[y.o].n):'?'):y.o===-2?' · temas kurulmamış devlet':'')+
      (y.pl?' · '+y.pl.length+' gezegen':'')+'</div>'+
      (own.length?own.map(f=>'<div class="mp2-row"><span>'+esc(f.nm)+' · '+shipText(f.sh)+'</span><button class="mp1-btn" data-g2="pickf" data-fleet="'+(+f.id)+'">SEÇ</button></div>').join(''):'')+
      (foreign.length?'<div class="mp1-sub">Görünen yabancı filo: '+foreign.length+'</div>':'')+'<button class="mp1-btn" data-g2="unsel">KAPAT</button>';}
  el.sel.hidden=false;}
function renderAim(){
  if(G2.aim===null){el.aim.hidden=true;return;}const f=view().fleets[G2.aim];if(!f){G2.aim=null;G2.pending=null;el.aim.hidden=true;return;}
  el.aim.hidden=false;
  el.aim.innerHTML=G2.pending?'<div><b>'+esc(f.nm)+'</b> → <b>'+esc(sysName(G2.pending.to))+'</b> gönderilsin mi?</div><div class="mp1-row"><button class="mp1-btn pri" data-g2="send">GÖNDER</button><button class="mp1-btn" data-g2="cancel">İPTAL</button></div>':
    '<div>Hedef sistemi seç: <b>'+esc(f.nm)+'</b> için haritada bir sisteme dokun.</div><div class="mp1-row"><button class="mp1-btn" data-g2="cancel">İPTAL</button></div>';}
/* ---------- filolar / koloniler / bilim ---------- */
function fleetsHtml(){const fs=Object.values(view().fleets).filter(f=>f.own);
  return '<div class="mp1-h">FİLOLAR ('+fs.length+')</div>'+(fs.length?fs.map(f=>'<div class="mp1-card" data-fleetcard="'+(+f.id)+'">'+fleetCard(f,'<button class="mp1-btn" data-g2="fshow" data-fleet="'+(+f.id)+'">HARİTADA</button>')+'</div>').join(''):'<div class="mp1-sub">Filon yok.</div>');}
function colsRender(){const v=view();
  const keep={};for(const s of el.cols.querySelectorAll('select[data-col]'))keep[s.dataset.col]=s.value;
  const opts=Object.entries(v.catalog.b).filter(([,b])=>b.ok).map(([k,b])=>'<option value="'+esc(k)+'">'+esc(b.n)+' ('+Object.entries(b.c).map(([r,n])=>esc(r)+' '+(+n)).join(', ')+')</option>').join('');
  el.cols.innerHTML='<div class="mp1-h">KOLONİLER</div><table class="mp1-t">'+Object.values(v.cols).map(col=>'<tr><td>'+esc(col.n)+'<div class="mp1-sub">nüfus '+esc(col.pop)+' · yer '+(+col.us)+'/'+(+col.sl)+'</div>'+
      Object.entries(col.b).map(([k,n])=>esc(k)+'×'+(+n)).join(' ')+(col.q.length?'<div class="mp1-sub">Kuyruk: '+col.q.map(w=>esc(w.k)+' '+(+w.l)+'g').join(', ')+'</div>':'')+
      '<select class="mp1-sel" data-col="'+(+col.s)+':'+(+col.p)+'">'+opts+'</select><button class="mp1-btn pri" data-j="build" data-col="'+(+col.s)+':'+(+col.p)+'">İNŞA ET</button></td></tr>').join('')+'</table>'+
    '<div class="mp1-sub">Bilinen sistem '+Object.values(v.sys).filter(s=>s.k).length+' · görünen yabancı filo '+Object.values(v.fleets).filter(f=>!f.own).length+' · temas '+Object.keys(v.emps).length+'</div>';
  for(const [k,val] of Object.entries(keep)){const s=el.cols.querySelector('select[data-col="'+k+'"]');if(s)s.value=val;}}
function sciHtml(){const v=view(),S=v.sci,T=v.tech;if(!S||!T)return '<div class="mp1-sub">Bilim verisi bekleniyor…</div>';
  const branch=Object.entries(BR).map(([b,[n,c]])=>{const id=S.rq[b],pct=id&&S.rc[b]?Math.min(100,Math.round(S.rp[b]/S.rc[b]*100)):0;
    return '<div class="mp2-br"><div><b style="color:'+c+'">'+n+'</b> · '+(id?esc(T[id]?T[id].n:id):'boşta')+'</div><div class="mp2-prog"><i style="width:'+pct+'%;background:'+c+'"></i></div><div class="mp1-sub">'+(id?(+S.rp[b])+' / '+(+S.rc[b])+' · %'+pct:'Aktif araştırma yok')+'</div></div>';}).join('');
  const modes='<div class="mp2-seg">'+Object.entries(MODE).map(([k,n])=>'<button data-g2="rmode" data-mode="'+k+'" class="'+(S.mode===k?'on':'')+'">'+n+'</button>').join('')+'</div>';
  const targets=S.targets.length?S.targets.map((id,i)=>{const g=S.plan.find(x=>x.id===id)||{};return '<div class="mp2-row"><span>'+(i+1)+'. '+esc(T[id]?T[id].n:id)+(g.x?' <small class="mp1-sub">+'+(+g.x)+' ön koşul</small>':'')+(g.ok===0?' <small class="bad">'+esc(g.why)+'</small>':'')+'</span>'+
    (i?'<button class="mp1-btn" data-g2="rup" data-tech="'+esc(id)+'" aria-label="Yukarı">▲</button>':'')+'<button class="mp1-btn" data-g2="rtoggle" data-tech="'+esc(id)+'" aria-label="Hedeften çıkar">✕</button></div>';}).join(''):'<div class="mp1-sub">Hedef yok. Aşağıdan teknoloji seç.</div>';
  const chips='<div class="mp1-tabs">'+Object.entries(BR).map(([b,[n]])=>'<button data-g2="branch" data-b="'+b+'" class="'+(G2.branch===b?'on':'')+'">'+n+'</button>').join('')+'</div>';
  const list=Object.entries(T).filter(([,t])=>t.b===G2.branch).sort((a,b)=>a[1].t-b[1].t||a[1].c-b[1].c).map(([id,t])=>
    '<button class="mp2-tech s-'+t.s+(G2.tech===id?' on':'')+'" data-g2="tech" data-tech="'+esc(id)+'"><span>'+esc(t.n)+'<small> · K'+(+t.t)+' · '+(+t.c)+'</small></span><em>'+esc(ST[t.s]||t.s)+(S.targets.includes(id)?' · hedef':'')+'</em></button>'+
    (G2.tech===id?techDetail(id,t,S,T):'')).join('');
  return '<div class="mp1-h">BİLİM</div><div class="mp1-sub">Araştırma geliri '+esc(S.ara)+' / ay</div>'+branch+'<div class="mp1-l">Araştırma kipi</div>'+modes+'<div class="mp1-l">Hedefler</div>'+targets+chips+'<div class="mp2-techs">'+list+'</div>';}
function techDetail(id,t,S,T){const on=S.targets.includes(id);
  return '<div class="mp1-card mp2-tdet"><div>'+esc(t.d||'')+'</div>'+(t.r.length?'<div class="mp1-sub">Ön koşul: '+t.r.map(r=>esc(T[r]?T[r].n:r)+(T[r]&&T[r].s==='d'?' ✓':'')).join(', ')+'</div>':'')+
    (t.w?'<div class="mp1-sub bad">'+esc(t.w)+'</div>':'')+(t.s==='d'?'':'<button class="mp1-btn '+(on?'':'pri')+'" data-g2="rtoggle" data-tech="'+esc(id)+'"'+(t.s==='x'&&!on?' disabled':'')+'>'+(on?'HEDEFTEN ÇIKAR':'HEDEFE EKLE')+'</button>')+'</div>';}
/* ---------- dokunuşlar ---------- */
function onClick(e){
  const b=e.target.closest('[data-g2]');if(!b)return;const a=b.dataset.g2,J=G2.J;
  if(a==='tab')setTab(b.dataset.tab);
  else if(a==='zin'||a==='zout'){zoomTo(G2.cam.z*(a==='zin'?1.4:1/1.4));persist();}
  else if(a==='fit'||a==='home'){fit(a==='home'?'home':'all');draw();persist();}
  else if(a==='unsel'){G2.sel=null;renderSel();G2.dirty=true;draw();persist();}
  else if(a==='pickf'||a==='fshow'){const f=view().fleets[+b.dataset.fleet];G2.sel={t:'f',id:+b.dataset.fleet};
    if(a==='fshow'){const p=f&&fleetPos(f);setTab('map');if(p){G2.cam.x=p.x;G2.cam.y=p.y;}}renderSel();G2.dirty=true;draw();persist();}
  else if(a==='aim'){G2.aim=+b.dataset.fleet;G2.pending=null;if(G2.tab!=='map')setTab('map');renderAim();}
  else if(a==='cancel'){G2.aim=null;G2.pending=null;renderAim();G2.dirty=true;draw();}
  else if(a==='send'&&G2.pending){const r=J.cmd({kind:'move',fleet:G2.pending.fleet,to:G2.pending.to});if(!r.ok)toast(CODE[r.why]||r.why,true);
    G2.sel={t:'f',id:G2.pending.fleet};G2.aim=null;G2.pending=null;renderAim();renderSel();G2.dirty=true;draw();}
  else if(a==='branch'){G2.branch=b.dataset.b;G2.tech=null;renderPane('sci');persist();}
  else if(a==='tech'){G2.tech=G2.tech===b.dataset.tech?null:b.dataset.tech;renderPane('sci');}
  else if(a==='rtoggle'){const r=J.cmd({kind:'research',tech:b.dataset.tech});if(!r.ok)toast(CODE[r.why]||r.why,true);}
  else if(a==='rup'){const i=view().sci.targets.indexOf(b.dataset.tech);const r=J.cmd({kind:'research',tech:b.dataset.tech,action:'move',position:Math.max(0,i-1)});if(!r.ok)toast(CODE[r.why]||r.why,true);}
  else if(a==='rmode'){const r=J.cmd({kind:'researchMode',mode:b.dataset.mode});if(!r.ok)toast(CODE[r.why]||r.why,true);}
}
/* Test ve hata ayıklama: sistem/filo ekran konumu (dokunma testleri için), kamera, ölçümler. */
window.MP2Game={G:G2,attach(J){G2.J=J;},update,
  screenOf(kind,id){paint();if(kind==='s'){const p=G2.P&&G2.P[id];return p&&{x:p.x,y:p.y};}const h=(G2.hits||[]).find(x=>x.id===id);return h&&{x:h.x,y:h.y};},
  fit(mode){fit(mode||'all');},reset(){G2.mounted=false;}};
})();

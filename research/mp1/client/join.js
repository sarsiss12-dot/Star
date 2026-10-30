'use strict';
/* STARS MP.1 — katılım sayfası (misafir telefon). Oyun motorunu YÜKLEMEZ:
   G, monthTick, setupGame yoktur. Lobi ve oyun durumu host'tan gelir; bu sayfa
   yalnız kendi oyuncusunun isteklerini gönderir. */
(function(){
const V=MP1View,esc=V.esc,doc=document,$=id=>doc.getElementById(id);
const q=new URLSearchParams(location.search);
const J={ws:null,code:V.fmtCode((q.get('code')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8)),name:'',screen:'join',lobby:null,game:{view:null,rev:-1,clock:null},
  playerId:null,empireId:null,hostOnline:false,err:'',tab:'lobi',results:[],packets:[],lresults:[],errors:[],seq:0,retry:0,leaving:false,closed:false,
  stats:{msgs:0,bytes:0,rtt:[],connectMs:null}};
const keyOf=c=>'mp1:'+c.replace(/-/g,'');
function load(){try{return JSON.parse(localStorage.getItem(keyOf(J.code)))||{};}catch{return {};}}
function save(o){try{localStorage.setItem(keyOf(J.code),JSON.stringify({...load(),...o}));}catch{}}
try{J.name=localStorage.getItem('mp1:name')||'';}catch{}
function raw(obj){if(!J.ws||J.ws.readyState!==1)return false;J.ws.send(JSON.stringify(obj));return true;}
J.sendRaw=raw;
J.cmd=function(cmd){if(!J.hostOnline)return {ok:false,why:'host-yok'};J.seq++;save({seq:J.seq});const m={v:1,type:'cmd',seq:J.seq,cid:'j'+Date.now().toString(36)+Math.random().toString(36).slice(2,10),cmd};
  m.at=performance.now();J.pending=m;raw({v:1,type:'cmd',seq:m.seq,cid:m.cid,cmd});return {ok:true,cid:m.cid};};
J.ready=v=>raw({v:1,type:'ready',value:!!v});
J.claim=id=>raw({v:1,type:'claim',empire:id});
J.presence=t=>{J.tab=t;raw({v:1,type:'presence',tab:t});render();};
J.leave=()=>{J.leaving=true;raw({v:1,type:'leave'});setTimeout(()=>{try{J.ws&&J.ws.close();}catch{}J.ws=null;J.screen='join';J.lobby=null;render();},200);};

function connect(){
  J.err='';J.closed=false;const code=J.code.replace(/-/g,'');
  if(!/^[A-Z0-9]{8}$/.test(code)){J.err='Oda kodu 8 karakter olmalı (örn. ABCD-EFGH).';return render();}
  const name=($('jName')&&$('jName').value||J.name).replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,24);
  if(!name){J.err='Bir oyuncu adı yaz.';return render();}
  J.name=name;try{localStorage.setItem('mp1:name',name);}catch{}
  J.seq=load().seq||0;J.screen='connecting';render();const t0=performance.now();
  const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/mp1/ws?role=client&code='+code);J.ws=ws;
  ws.onmessage=ev=>receive(String(ev.data),t0);
  ws.onclose=ev=>{ev=ev||{};if(J.ws!==ws)return;J.ws=null;J.hostOnline=false;
    /* Kapanış kodu son sözdür: neden çerçevesi yolda kaybolsa bile oda kapandı/atıldın/dolu döngüye girmez. */
    if(!J.closed&&(ev.code===4003||FINAL[ev.code])){J.closed=true;J.screen='join';J.lobby=null;J.err=ev.code===4003?kickMsg(ev.reason):V.ERR[ev.reason]||V.ERR[FINAL[ev.code]];}
    else if(J.screen==='connecting'){J.screen='join';J.err='Bağlanılamadı. İnternet bağlantını ve davet adresini kontrol et.';}   // el sıkışma reddi / sunucu yok
    if(!J.leaving&&!J.closed&&['lobby','game'].includes(J.screen)){const d=Math.min(8000,400*2**J.retry++);J.reconnecting=true;setTimeout(()=>{if(!J.ws&&!J.closed)connect();},d);}
    render();};
}
const FINAL={4001:'room-closed',4004:'invalid-code',4005:'room-full',4008:'rate-limited',4029:'rate-limited'};
function kickMsg(r){return r==='left'?'Odadan ayrıldın.':r==='replaced'?'Bu oyuncu başka bir sekmede açıldı.':r&&r!=='kicked'&&V.ERR[r]||V.ERR.kicked;}
function hello(){const s=load();raw({v:1,type:'hello',name:J.name,...(s.token?{token:s.token}:{})});}
function receive(t,t0){
  J.stats.msgs++;J.stats.bytes+=t.length;J.packets.push(t);if(J.packets.length>3000)J.packets.shift();
  if(t[0]==='R'){let m;try{m=JSON.parse(t.slice(1));}catch{return;}
    if(m.t==='welcome'){J.hostOnline=!!m.host;J.retry=0;J.reconnecting=false;if(J.stats.connectMs===null&&t0)J.stats.connectMs=Math.round(performance.now()-t0);if(J.hostOnline)hello();else J.err=V.ERR['no-host'];}
    else if(m.t==='host-up'){J.hostOnline=true;J.err='';hello();}
    else if(m.t==='host-left'){J.hostOnline=false;}
    else if(m.t==='room-closed'){J.closed=true;J.screen='join';J.lobby=null;J.err=V.ERR[m.reason==='server-restart'?'server-restart':'room-closed'];}
    else if(m.t==='kicked'){J.closed=true;J.screen='join';J.lobby=null;J.err=kickMsg(m.reason);}   // relay K nedeni: host'un gerçek gerekçesi
    else if(m.t==='error'){J.errors.push(m.code);if(['invalid-code','room-full','room-closed','rate-limited','server-full'].includes(m.code)){J.closed=true;J.screen='join';J.err=V.ERR[m.code]||m.code;}}
    return render();}
  if(t[0]!=='H')return;let m;try{m=JSON.parse(t.slice(1));}catch{return;}if(m.v!==1)return;
  if(m.type==='assign'){J.playerId=m.playerId;J.empireId=m.empireId;save({token:m.token,seq:Math.max(J.seq,m.lastSeq||0)});J.seq=Math.max(J.seq,m.lastSeq||0);}
  else if(m.type==='lobby'){J.lobby=m;if(m.phase==='closed'){J.closed=true;J.screen='join';J.err=V.ERR['room-closed'];}
    else if(['ingame','paused'].includes(m.phase)&&J.empireId!==null){if(J.screen!=='game'){J.screen='game';J.tab='oyun';history.pushState({mp1:'game'},'');raw({v:1,type:'presence',tab:'oyun'});}}
    else if(J.screen!=='lobby'&&J.screen!=='game'){J.screen='lobby';history.pushState({mp1:'lobby'},'');}}
  else if(m.type==='snapshot'||m.type==='delta'){if(V.apply(J.game,m)==='resync'){J.resyncs=(J.resyncs||0)+1;raw({v:1,type:'resync'});}}
  else if(m.type==='result'){if(J.pending&&J.pending.cid===m.cid){m.ms=Math.round(performance.now()-J.pending.at);J.pending=null;}J.results.push(m);}
  else if(m.type==='lresult')J.lresults.push(m);
  else if(m.type==='pong'){J.stats.rtt.push(Math.round(performance.now()-m.t));if(J.stats.rtt.length>100)J.stats.rtt.shift();}
  else if(m.type==='error'){J.errors.push(m.code);if(['room-full','game-started','kicked','room-closed'].includes(m.code)){J.closed=true;J.screen='join';J.err=V.ERR[m.code]||m.code;}}
  render();
}
setInterval(()=>{if(J.hostOnline&&J.ws)raw({v:1,type:'ping',t:Math.round(performance.now())});},3000);
/* Telefon uykudan/arka plandan dönünce bekleme süresini beklemeden hemen yeniden bağlan. */
doc.addEventListener('visibilitychange',()=>{if(!doc.hidden&&!J.ws&&!J.closed&&!J.leaving&&['lobby','game'].includes(J.screen)){J.retry=0;connect();}});

/* ---------- geri tuşu: odadan habersiz çıkılmaz ---------- */
addEventListener('popstate',()=>{
  if(J.screen==='game'&&window.__mpBack&&window.__mpBack()){history.pushState({mp1:'game'},'');return;}   // MP.3.1: önce açık onay penceresi kapanır
  if(['lobby','game'].includes(J.screen)){history.pushState({mp1:J.screen},'');
    if(!$('jSheet')){const el=doc.createElement('div');el.className='mp1-sheet';el.id='jSheet';
      el.innerHTML='<div>'+(J.screen==='game'?'Oyundan çıkarsan koltuğun host tarafından bekletilir.':'Odadan ayrılmak istiyor musun?')+'</div><div class="mp1-row"><button class="mp1-btn warn" data-j="sheetLeave">Ayrıl</button><button class="mp1-btn" data-j="sheetStay">Kal</button></div>';
      doc.body.appendChild(el);}
  }
});
/* ---------- ekranlar ---------- */
function render(){
  const app=$('app');if(!app)return;
  if(J.screen==='join'||J.screen==='connecting'){
    const fresh=!$('jCode');
    if(fresh)app.innerHTML='<div class="mp1-h">ODAYA KATIL</div><p class="mp1-sub">Host oyuncunun telefonunda görünen oda kodunu gir. Simülasyon host telefonda çalışır; bu sayfa yalnız senin devletini gösterir.</p>'+
      '<label class="mp1-l" for="jCode">Oda kodu</label><input class="mp1-in" id="jCode" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="9" enterkeyhint="go" placeholder="ABCD-EFGH">'+
      '<label class="mp1-l" for="jName">Oyuncu adı</label><input class="mp1-in name" id="jName" autocomplete="nickname" maxlength="24" enterkeyhint="go" placeholder="Adın">'+
      '<button class="mp1-btn pri" data-j="go">KATIL</button><a class="mp1-btn" href="/" data-j="home">GERİ</a><div class="mp1-status" id="jStatus"></div>';
    if(fresh){$('jCode').value=J.code;$('jName').value=J.name;}
    const s=$('jStatus');s.className='mp1-status'+(J.err?' bad':'');s.textContent=J.screen==='connecting'?'Bağlanıyor…':(J.err||'Kodu girip KATIL\'a dokun.');
    $('jCode').disabled=$('jName').disabled=J.screen==='connecting';return;
  }
  if(J.screen==='lobby')return lobby(app);
  if(J.screen==='game')return game(app);
}
function statusBar(){const live=J.ws&&J.ws.readyState===1;
  const pz=J.lobby&&J.lobby.phase==='paused'?J.lobby.pause:null;
  const t=!live?(J.reconnecting?'Bağlantı koptu — yeniden bağlanılıyor…':'Bağlantı yok'):!J.hostOnline?'Host bağlı değil — oyun duraklatıldı':
    pz==='host-background'?'Oyun duraklatıldı — host uygulamayı arka plana aldı ya da ekranı kilitledi':pz?'Oyun duraklatıldı — host bağlantısı bekleniyor':'Bağlı · oda '+esc(J.code);
  return '<div class="mp1-status '+(live&&J.hostOnline&&!pz?'ok':'bad')+'" id="jConn">'+t+'</div>';}
function lobby(app){
  const L=J.lobby;if(!L){app.innerHTML=statusBar()+'<div class="mp1-status">Lobi bekleniyor…</div>';return;}
  const me=L.players.find(p=>L.you&&p.seat===L.you.seat)||{};
  const tabs=['lobi','doktrin','gorunus','fizyoloji','etik','civic','koken','galaksi'];
  let body='';
  if(J.tab==='lobi'){
    body=V.players(L)+'<div class="mp1-card"><b>Devlet seç</b><p class="mp1-sub">Galaksideki gerçek AI devletlerinden birini yönetirsin. Konum bilgisi oyun başlayınca kendi keşfinle gelir.</p>'+
      (L.empires.length?L.empires.map(e=>'<div class="mp1-emp"><span><span class="dot" style="display:inline-block;width:10px;height:10px;border-radius:50%;background:'+V.color(e.col)+'"></span> '+esc(e.n)+'<br><small class="mp1-sub">'+esc(e.race)+(e.doc?' · '+esc(e.doc):'')+'</small></span>'+
        (e.seat===me.seat?'<button class="mp1-btn" data-j="unclaim">BIRAK</button>':e.seat!==null?'<button class="mp1-btn" disabled>DOLU</button>':'<button class="mp1-btn pri" data-j="claim" data-e="'+(+e.id)+'">SEÇ</button>')+'</div>').join(''):'<div class="mp1-sub">Host galaksiyi hazırlıyor…</div>')+'</div>';
  }else if(J.tab==='galaksi'){
    const s=L.settings||{};body='<div class="mp1-card"><b>Galaksi ayarları</b> (yalnız host değiştirir)<div>Boyut: '+esc((SIZE_N[s.size])||s.size||'—')+'</div><div>AI devlet: '+esc(s.aiCount??'—')+'</div><div>Kapasite: '+esc(L.capacity)+' insan</div></div>';
  }else{
    const x=L.mine;body='<div class="mp1-card"><b>'+esc(V.TAB[J.tab])+'</b><div>'+(x?esc(J.tab==='etik'?Object.entries(x.etik||{}).map(([k,v])=>k+' '+v).join(' · '):J.tab==='civic'?(x.civic||[]).join(', '):x[J.tab]||'—'):'Önce bir devlet seç.')+'</div>'+
      '<p class="mp1-sub">MP.1: seçtiğin devletin gerçek özellikleri. Kurulum özelleştirmesi sonraki fazda.</p></div>';
  }
  app.innerHTML=statusBar()+'<div class="mp1-h">GALAKTİK LOBİ — '+L.players.length+'/'+L.capacity+' OYUNCU</div><div class="mp1-sub">'+esc(V.PHASE[L.phase]||L.phase)+' · oda '+esc(J.code)+'</div>'+
    '<div class="mp1-tabs">'+tabs.map(t=>'<button data-j="tab" data-tab="'+t+'" class="'+(t===J.tab?'on':'')+'">'+esc(V.TAB[t])+'</button>').join('')+'</div>'+body+
    '<button class="mp1-btn '+(me.ready?'':'pri')+'" data-j="ready" id="jReady"'+(me.claim===null||me.claim===undefined?' disabled':'')+'>'+(me.ready?'HAZIR DEĞİLİM':'HAZIRIM')+'</button>'+
    '<button class="mp1-btn warn" data-j="leave">ODADAN AYRIL</button>';
}
const SIZE_N={kucuk:'Küçük',orta:'Orta',buyuk:'Büyük',devasa:'Devasa',ulu:'Ulu'};
function game(app){
  const v=J.game.view,c=J.game.clock;
  if(!v){app.innerHTML=statusBar()+'<div class="mp1-status">Galaksi verisi bekleniyor…</div>';return;}
  if(window.MP2Game){MP2Game.attach(J);return MP2Game.update(statusBar());}   // MP.2: harita/filolar/koloniler/bilim
  const opts=Object.entries(v.catalog.b).filter(([,b])=>b.ok).map(([k,b])=>'<option value="'+esc(k)+'">'+esc(b.n)+' ('+Object.entries(b.c).map(([r,n])=>esc(r)+' '+(+n)).join(', ')+')</option>').join('');
  const keep={};for(const s of doc.querySelectorAll('select[data-col]'))keep[s.dataset.col]=s.value;
  app.innerHTML=statusBar()+'<div class="mp1-h" style="color:'+V.color(v.me.col)+'">'+esc(v.me.n)+'</div><div class="mp1-sub" id="jClock">Yıl '+(+c.y)+' · Ay '+(+c.m)+' · gün '+(+c.day)+'</div>'+
    '<div class="mp1-res">'+Object.entries(v.me.res).map(([k,x])=>'<span>'+esc(k)+' '+esc(x)+'</span>').join('')+'</div>'+
    '<table class="mp1-t">'+Object.values(v.cols).map(col=>'<tr><td>'+esc(col.n)+'<div class="mp1-sub">nüfus '+esc(col.pop)+' · yer '+(+col.us)+'/'+(+col.sl)+'</div>'+
      Object.entries(col.b).map(([k,n])=>esc(k)+'×'+(+n)).join(' ')+(col.q.length?'<div class="mp1-sub">Kuyruk: '+col.q.map(w=>esc(w.k)+' '+(+w.l)+'g').join(', ')+'</div>':'')+
      '<select class="mp1-sel" data-col="'+(+col.s)+':'+(+col.p)+'">'+opts+'</select><button class="mp1-btn pri" data-j="build" data-col="'+(+col.s)+':'+(+col.p)+'">İNŞA ET</button></td></tr>').join('')+'</table>'+
    '<div class="mp1-sub">Bilinen sistem '+Object.values(v.sys).filter(s=>s.k).length+' · görünen yabancı filo '+Object.values(v.fleets).filter(f=>!f.own).length+' · temas '+Object.keys(v.emps).length+'</div>'+
    (J.results.length?'<div class="mp1-card" id="jLog">':'<div id="jLog">')+J.results.slice(-5).reverse().map(r=>esc(r.status)+(r.code?' '+esc(V.ERR[r.code]||r.code):'')+(r.ms!==undefined?' · '+(+r.ms)+' ms':'')).join('<br>')+'</div>';
  for(const [k,val] of Object.entries(keep)){const s=doc.querySelector('select[data-col="'+k+'"]');if(s)s.value=val;}
}
doc.addEventListener('click',e=>{
  const el=e.target.closest('[data-j]');if(!el)return;const a=el.dataset.j;
  if(a==='go'){J.code=V.fmtCode(($('jCode').value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8));connect();}
  else if(a==='tab')J.presence(el.dataset.tab);
  else if(a==='claim')J.claim(+el.dataset.e);
  else if(a==='unclaim')J.claim(null);
  else if(a==='ready'){const L=J.lobby,me=L&&L.players.find(p=>p.seat===L.you.seat);J.ready(!(me&&me.ready));}
  else if(a==='leave'||a==='sheetLeave'){$('jSheet')&&$('jSheet').remove();J.leave();}
  else if(a==='sheetStay')$('jSheet')&&$('jSheet').remove();
  else if(a==='build'){const [s,p]=el.dataset.col.split(':').map(Number),sel=doc.querySelector('select[data-col="'+el.dataset.col+'"]');J.cmd({kind:'build',sys:s,planet:p,key:sel.value});}
});
doc.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.target.id==='jCode'||e.target.id==='jName')){e.preventDefault();doc.querySelector('[data-j="go"]').click();}});
doc.addEventListener('input',e=>{if(e.target.id==='jCode'){const v=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);e.target.value=V.fmtCode(v);}});
doc.addEventListener('focusin',e=>{if(e.target.matches&&e.target.matches('input'))setTimeout(()=>e.target.scrollIntoView({block:'center'}),250);});
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{const a=doc.activeElement;if(a&&a.matches&&a.matches('input'))a.scrollIntoView({block:'center'});});
window.MP1Join=J;render();
/* Android arka plandaki sekmeyi yeniden yükleyebilir: bu oda için koltuk jetonu varsa kendiliğinden geri bağlan. */
if(J.code.length===9&&J.name&&load().token){J.auto=true;connect();}
})();

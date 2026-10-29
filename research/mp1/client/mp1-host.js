'use strict';
/* ═══ STARS MP.1 — host katmanı (gerçek oyun sayfası) ═══
   Yalnız MP.1 relay'inin sunduğu sayfada yüklenir; 19 runtime dosyası değişmez.
   - Başlık menüsüne ÇOK OYUNCULU ekler (YENİ OYUN / OYUNA DEVAM ET / AYARLAR korunur).
   - ODA OLUŞTUR: relay'den güvenli oda kodu + host anahtarı alır, galaksiyi gerçek
     setupGame ile kurar, lobiyi yönetir, OYUNU BAŞLAT ile gerçek oyuna girer.
   - ODAYA KATIL: motor yüklemeyen /mp/join sayfasına gider (misafir simülasyon yürütmez).
   - Oyun içinde: ay sonu yayını, uzak insanların keşif belleği, küçük host paneli. */
(function(){
const V=MP1View,esc=V.esc,doc=document;
const hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');
const API={ws:null,code:null,key:null,host:null,connected:false,closed:false,screen:null,lobby:null,events:[],tab:'lobi',dirty:false,lastDay:-1,publishes:0,started:false,retry:0,urls:[]};
const log=(kind,data)=>{API.events.push({at:Date.now(),kind,...(data||{})});if(API.events.length>400)API.events.shift();};
let overlay=null;

/* ---------- 1. ana menü düğmesi ---------- */
function addMenu(){
  const box=doc.querySelector('#title .tBtns');if(!box||doc.getElementById('mp1Btn'))return;
  const b=doc.createElement('button');b.className='tBtn mp1-menu';b.id='mp1Btn';b.type='button';
  b.innerHTML='ÇOK OYUNCULU<small>Oda kur ya da arkadaşının odasına katıl</small>';
  box.insertBefore(b,box.querySelector('[data-a="tOpt"]'));
  b.addEventListener('click',()=>go('menu'));
}
/* ---------- 2. ekranlar + geri tuşu ---------- */
function go(screen,replace){API.screen=screen;const st={mp1:screen};if(replace)history.replaceState(st,'');else history.pushState(st,'');render();}
addEventListener('popstate',ev=>{
  const s=ev.state&&ev.state.mp1;
  if(API.screen==='lobby'&&!API.started){history.pushState({mp1:'lobby'},'');return sheet('Odayı kapatıp çıkmak istiyor musun?','Odayı kapat',closeRoom);}
  if(API.started){history.pushState({mp1:'game'},'');return;}
  if(s){API.screen=s;render();}else{API.screen=null;render();}
});
function sheet(text,ok,fn){
  const el=doc.createElement('div');el.className='mp1-sheet';el.id='mp1Sheet';
  el.innerHTML='<div>'+esc(text)+'</div><div class="mp1-row"><button class="mp1-btn warn" data-m="sheetOk">'+esc(ok)+'</button><button class="mp1-btn" data-m="sheetNo">Vazgeç</button></div>';
  doc.body.appendChild(el);
  el.addEventListener('click',e=>{const m=e.target.closest('[data-m]');if(!m)return;el.remove();if(m.dataset.m==='sheetOk')fn();});
}
function render(){
  if(!API.screen||API.screen==='game'){if(overlay){overlay.remove();overlay=null;}if(API.started)mini();return;}
  if(!overlay){overlay=doc.createElement('div');overlay.className='mp1-overlay';overlay.id='mp1';doc.body.appendChild(overlay);overlay.addEventListener('click',onClick);overlay.addEventListener('change',onChange);}
  if(API.screen==='menu'){
    overlay.innerHTML='<div class="mp1-wrap"><div class="mp1-h">ÇOK OYUNCULU</div><p class="mp1-sub">Telefonundan oda kur; arkadaşın oda koduyla katılsın. Simülasyon host telefonda çalışır.</p>'+
      '<button class="mp1-btn pri" data-m="create">ODA OLUŞTUR</button><button class="mp1-btn" data-m="join">ODAYA KATIL</button><button class="mp1-btn" data-m="back">GERİ</button>'+
      '<div class="mp1-status'+(API.err?' bad':'')+'" id="mp1Status">'+esc(API.err||'Bağlantı hizmeti: '+location.host)+'</div></div>';
    return;
  }
  if(API.screen==='connecting'){overlay.innerHTML='<div class="mp1-wrap"><div class="mp1-h">ODA OLUŞTURULUYOR</div><div class="mp1-status">Bağlantı kuruluyor…</div></div>';return;}
  if(API.screen==='lobby')lobbyScreen();
}
function lobbyScreen(){
  const L=API.lobby;if(!L){overlay.innerHTML='<div class="mp1-wrap"><div class="mp1-status">Lobi hazırlanıyor…</div></div>';return;}
  const link=location.origin+'/mp/join?code='+API.code,cs=API.host.canStart(),me=G.p;
  const tabs=['lobi','galaksi','doktrin','gorunus','fizyoloji','etik','civic','koken'];
  let body='';
  if(API.tab==='lobi'){
    body=V.players(L)+'<div class="mp1-card"><b>Misafirler</b>'+L.players.filter(p=>!p.host).map(p=>{
      const pid=pidOfSeat(p.seat);
      return '<div class="mp1-emp mp1-guest"><span class="gn">'+esc(p.name)+'</span><select class="mp1-sel" data-m="claimFor" data-pid="'+esc(pid)+'"><option value="">devlet ata…</option>'+
        L.empires.filter(e=>e.seat===null||e.seat===p.seat).map(e=>'<option value="'+e.id+'"'+(p.claim===e.id?' selected':'')+'>'+esc(e.n)+'</option>').join('')+'</select>'+
        '<button class="mp1-btn warn" data-m="kick" data-pid="'+esc(pid)+'">Çıkar</button></div>';}).join('')+(L.players.length<2?'<div class="mp1-sub">Henüz misafir yok. Oda kodunu paylaş.</div>':'')+'</div>';
  }else if(API.tab==='galaksi'){
    const s=L.settings||{size:'orta',aiCount:5,seed:0};
    body='<div class="mp1-card"><label class="mp1-l">Galaksi boyutu</label><select class="mp1-sel" id="mp1Size">'+Object.entries(SIZES).map(([k,x])=>'<option value="'+k+'"'+(k===s.size?' selected':'')+'>'+esc(x.n+' · '+x.d)+'</option>').join('')+'</select>'+
      '<label class="mp1-l">AI devlet sayısı</label><select class="mp1-sel" id="mp1Ai">'+Array.from({length:11},(_,i)=>i+1).map(n=>'<option'+(n===s.aiCount?' selected':'')+'>'+n+'</option>').join('')+'</select>'+
      '<label class="mp1-l">İnsan oyuncu kapasitesi (host dahil)</label><select class="mp1-sel" id="mp1Cap">'+[2,3,4].map(n=>'<option'+(n===L.capacity?' selected':'')+'>'+n+'</option>').join('')+'</select>'+
      '<label class="mp1-l">Galaksi tohumu</label><input class="mp1-in name" id="mp1Seed" inputmode="numeric" value="'+(+s.seed||'')+'">'+
      '<p class="mp1-sub">Uygulamak galaksiyi yeniden kurar; misafirlerin devlet seçimi ve hazır durumu sıfırlanır.</p>'+
      '<button class="mp1-btn pri" data-m="apply">GALAKSİYİ UYGULA</button></div>';
  }else{
    const x={doktrin:PERSONAS[me._pers||me.mizac]?.n,gorunus:LOOKS[me.look]?.n,fizyoloji:PHYSIO[me.physio]?.n,etik:Object.entries(me.ethics||{}).map(([k,v])=>k+' '+v).join(' · '),
      civic:(me.civics||[]).map(c=>CIVICS[c]?.n||c).join(', '),koken:ORIGINS[me.origin]?.n}[API.tab];
    body='<div class="mp1-card"><b>'+esc(me.name)+'</b><div>'+esc(V.TAB[API.tab])+': '+esc(x||'—')+'</div><p class="mp1-sub">Host devleti tek oyunculu kurulum tercihlerinden gelir (YENİ OYUN ekranı). Misafir devletleri galaksideki gerçek AI devletleridir.</p></div>';
  }
  overlay.innerHTML='<div class="mp1-wrap"><div class="mp1-h">GALAKTİK LOBİ — '+L.players.length+'/'+L.capacity+' OYUNCU</div>'+
    '<div class="mp1-sub">'+esc(V.PHASE[L.phase]||L.phase)+'</div><div class="mp1-code" id="mp1Code">'+esc(V.fmtCode(API.code))+'</div>'+
    '<div class="mp1-row"><button class="mp1-btn" data-m="copy">KODU KOPYALA</button><button class="mp1-btn" data-m="share">DAVET PAYLAŞ</button></div>'+
    '<div class="mp1-sub" id="mp1Link">'+esc(link)+'</div>'+
    '<div class="mp1-tabs">'+tabs.map(t=>'<button data-m="tab" data-tab="'+t+'" class="'+(t===API.tab?'on':'')+'">'+esc(V.TAB[t])+'</button>').join('')+'</div>'+body+
    '<div class="mp1-status'+(cs.ok?' ok':'')+'" id="mp1Start">'+(cs.ok?'Herkes hazır. Oyunu başlatabilirsin.':esc(START_WHY[cs.why]||cs.why))+'</div>'+
    '<button class="mp1-btn pri" data-m="start"'+(cs.ok?'':' disabled')+'>OYUNU BAŞLAT</button><button class="mp1-btn warn" data-m="close">ODAYI KAPAT</button>'+
    '<div class="mp1-status'+(API.connected?'':' bad')+'">'+(API.connected?'Bağlantı hizmetine bağlı':'Bağlantı hizmeti yok — yeniden deneniyor')+'</div></div>';
}
const START_WHY={'no-guests':'En az bir oyuncunun katılması gerekiyor.','guest-not-ready':'Bütün oyuncular hazır değil.','guest-no-empire':'Her oyuncu bir devlet seçmeli.',
  'guest-offline':'Bağlantısı kopan oyuncu var.','no-galaxy':'Önce galaksiyi uygula.','already-started':'Oyun zaten başladı.','not-claimable':'Seçilen devlet artık uygun değil.'};
function pidOfSeat(seat){for(const p of API.host.state.players.values())if(p.seat===seat)return p.playerId;return '';}
function onChange(e){const t=e.target;if(t.dataset.m==='claimFor'&&t.value!==''){const r=API.host.claimFor(t.dataset.pid,+t.value);if(!r.ok)toast(V.ERR[r.why]||r.why);}}
function onClick(e){
  const el=e.target.closest('[data-m]');if(!el)return;const m=el.dataset.m;
  if(m==='back'){history.back();return;}
  if(m==='join'){location.assign('/mp/join');return;}
  if(m==='create'){createRoom();return;}
  if(m==='tab'){API.tab=el.dataset.tab;API.host.setHostTab(API.tab);render();return;}
  if(m==='copy'){copy(V.fmtCode(API.code));return;}
  if(m==='share'){const url=location.origin+'/mp/join?code='+API.code;if(navigator.share)navigator.share({title:'STARS odası',text:'STARS oda kodu: '+V.fmtCode(API.code),url}).catch(()=>{});else copy(url);return;}
  if(m==='apply'){applySettings();return;}
  if(m==='kick'){sheet('Bu oyuncu odadan çıkarılsın mı? (bu odaya tekrar giremez)','Çıkar',()=>{API.host.kick(el.dataset.pid,false);});return;}
  if(m==='start'){startGame();return;}
  if(m==='close'){sheet('Oda kapatılsın mı? Bağlı oyuncular çıkarılır.','Odayı kapat',closeRoom);return;}
}
function toast(t){const s=doc.getElementById('mp1Start');if(s){s.textContent=t;s.className='mp1-status bad';}}
function copy(t){(navigator.clipboard&&navigator.clipboard.writeText?navigator.clipboard.writeText(t):Promise.reject()).then(()=>toast('Kopyalandı: '+t),()=>{
  const r=doc.createRange(),c=doc.getElementById('mp1Code');if(c){r.selectNodeContents(c);const s=getSelection();s.removeAllRanges();s.addRange(r);}toast('Kodu seçili; uzun basıp kopyala.');});}

/* ---------- 3. relay bağlantısı ---------- */
function wsUrl(q){return (location.protocol==='https:'?'wss://':'ws://')+location.host+'/mp1/ws?'+q;}
function createRoom(){if(API.ws)return;API.err='';go('connecting',true);open(wsUrl('role=host'));}
function open(url,auth){
  const ws=new WebSocket(url);API.ws=ws;API.urls.push(url);if(API.urls.length>20)API.urls.shift();
  if(auth)ws.onopen=()=>ws.send('A'+API.key);                  // anahtar URL'de değil, ilk çerçevede
  ws.onmessage=ev=>{
    const t=String(ev.data),k=t[0];
    if(k==='R'){const m=JSON.parse(t.slice(1));log('relay',{t:m.t,code:m.code&&'***'});
      if(m.t==='room'){API.connected=true;API.retry=0;if(m.key){API.code=m.code;API.key=m.key;}if(!API.host)makeHost();else syncPause();pushCap();if(API.screen==='connecting')go('lobby',true);else render();}
      else if(m.t==='error'){API.err=V.ERR[m.code]||m.code;if(!API.host){API.ws=null;go('menu',true);}}
      else if(m.t==='room-closed'){API.closed=true;API.err=V.ERR['room-closed'];}
      return;}
    if(!API.host)return;
    if(k==='J')log('join');
    else if(k==='L'){API.host.onLeave(t.slice(1));log('leave');}
    else if(k==='F'){const nl=t.indexOf('\n');API.host.onMessage(t.slice(1,nl),t.slice(nl+1));}
  };
  ws.onclose=ev=>{ev=ev||{};API.connected=false;API.ws=null;if(API.host)syncPause();
    if(ev.code===4001||ev.code===4004){API.closed=true;API.err=V.ERR[ev.reason]||V.ERR['room-closed'];}   // TTL/host süresi doldu: yeniden deneme yok
    render();
    if(API.host&&!API.closed&&API.code){const d=Math.min(10000,500*2**API.retry++);setTimeout(()=>{if(!API.ws&&!API.closed)open(wsUrl('role=host&code='+encodeURIComponent(API.code)),true);},d);}};
}
function send(conn,text){if(API.ws&&API.ws.readyState===1)API.ws.send('T'+conn+'\n'+text);}
function pushCap(){if(API.ws&&API.ws.readyState===1&&API.host&&API.host.lobby)API.ws.send('C'+JSON.stringify({cap:API.host.lobby.capacity-1}));}
function makeHost(){
  API.host=StarsMP.createHost({roomId:'r-'+API.code.toLowerCase(),random:hex,hostName:(typeof CFG!=='undefined'&&CFG.name)||'Host',send,
    kick:(conn,why)=>{if(API.ws&&API.ws.readyState===1)API.ws.send('K'+conn+'\n'+why);},
    onLobby:L=>{API.lobby=L;if(API.screen==='lobby')render();else if(API.started)mini();},
    lobby:{generate(set){setupGame({...CFG,...set});if(CFG.mizac)applyChosenPersona(G.p,CFG.mizac);G.autoSave=false;return {ok:true};}}});
  API.host.installGuards();
  const seed=1+(crypto.getRandomValues(new Uint32Array(1))[0]%2147483646);
  API.host.configure({size:'orta',aiCount:5,seed,...(CFG.shape?{shape:CFG.shape}:{})});
}
function applySettings(){
  const set={size:doc.getElementById('mp1Size').value,aiCount:+doc.getElementById('mp1Ai').value,seed:Math.trunc(+doc.getElementById('mp1Seed').value)||1,...(CFG.shape?{shape:CFG.shape}:{})};
  const cap=+doc.getElementById('mp1Cap').value;
  let r=API.host.setCapacity(cap);if(!r.ok&&r.why!=='ai-below-capacity'){toast(r.why==='too-many'?'Odada bu kapasiteden fazla oyuncu var.':r.why);return;}
  r=API.host.configure(set);if(!r.ok){toast(r.why==='ai-below-capacity'?'AI devlet sayısı, misafir sayısından az olamaz.':r.why);return;}
  if(API.host.lobby.capacity!==cap){r=API.host.setCapacity(cap);if(!r.ok){toast(r.why);return;}}
  pushCap();render();
}
function startGame(){
  const r=API.host.start();if(!r.ok){toast(START_WHY[r.why]||r.why);return;}
  API.started=true;API.tab='oyun';API.host.setHostTab('oyun');
  leaveTitle(null);doc.getElementById('menu').classList.add('hidden');doc.getElementById('game').classList.remove('hidden');
  enterGame();API.lastDay=Math.floor(G.day);
  go('game',true);
}
function closeRoom(){
  if(API.host)API.host.close();API.closed=true;
  if(API.ws&&API.ws.readyState===1){API.ws.send('X');API.ws.close();}
  API.ws=null;API.host=null;API.lobby=null;API.code=null;API.key=null;API.started=false;go(null,true);
}
/* ---------- 4. oyun içi: yayın, keşif belleği, host paneli ---------- */
const month=monthTick;
monthTick=function(){const r=month.apply(this,arguments);if(API.host&&API.started){API.host.observeHumans();API.dirty=true;}return r;};
setInterval(()=>{
  if(!API.host||!API.started||!API.connected)return;
  const day=Math.floor(G.day);if(API.dirty||day!==API.lastDay){API.dirty=false;API.lastDay=day;API.host.publish();API.publishes++;}
},250);
function mini(){
  let el=doc.getElementById('mp1Mini');
  if(!el){el=doc.createElement('div');el.id='mp1Mini';el.className='mp1-mini';doc.body.appendChild(el);el.addEventListener('click',e=>{const b=e.target.closest('[data-g]');if(!b)return;
    if(b.dataset.g==='toggle'){API.miniOpen=!API.miniOpen;mini();}
    else if(b.dataset.g==='kick')API.host.kick(b.dataset.pid,false);else if(b.dataset.g==='ai')API.host.kick(b.dataset.pid,true);});}
  const L=API.lobby;if(!L)return;
  /* Haritayı kapatmasın: tek satır; bağlantısı kopan misafir varsa (karar gerekir) kendiliğinden açılır. */
  const gs=L.players.filter(p=>!p.host),off=gs.filter(p=>!p.online).length,open=API.miniOpen||off>0;
  el.innerHTML='<button class="mp1-mini-h" data-g="toggle" aria-expanded="'+open+'"><b>ÇOK OYUNCULU</b> · '+esc(V.fmtCode(API.code))+' · '+
    (API.connected?'bağlı':API.closed?'oda kapandı — oyun yalnız bu telefonda sürüyor':'bağlantı yok')+' · '+(gs.length-off)+'/'+gs.length+' misafir</button>'+
    (open?gs.map(p=>{const pid=pidOfSeat(p.seat);return '<div>'+esc(p.name)+' · '+(p.online?'bağlı':'koptu — koltuk bekletiliyor')+(p.online?'':'<button class="mp1-btn" data-g="kick" data-pid="'+esc(pid)+'">Çıkar (devlet boşta)</button><button class="mp1-btn" data-g="ai" data-pid="'+esc(pid)+'">Devleti AI\'ya ver</button>')+'</div>';}).join(''):'');
}
/* ---------- Android arka plan / ekran kilidi ----------
   Arka planda rAF durur, zamanlayıcılar kısılır, sekme dondurulabilir. Yarım hızla
   sürüp misafirleri belirsiz bırakmak yerine: oyun güvenle duraklar, misafir nedeni
   görür; geri dönünce önceki hız geri gelir. Duraklatma iki kaynaklı: arka plan ve relay yok. */
function syncPause(){if(!API.host)return;const why=API.bg?'host-background':!API.connected?'host-offline':null;API.host.setPaused(!!why,why||undefined);}
function onHidden(){if(!API.host||!API.started||API.bg)return;API.bg=true;API.bgSpeed=G.speed;if(G.speed!==0&&typeof UI!=='undefined')UI.setSpeed(0);syncPause();log('background');}
function onVisible(){if(!API.bg)return;API.bg=false;syncPause();if(API.bgSpeed&&typeof UI!=='undefined')UI.setSpeed(API.bgSpeed);API.bgSpeed=0;log('foreground');
  if(!API.ws&&!API.closed&&API.code){API.retry=0;open(wsUrl('role=host&code='+encodeURIComponent(API.code)),true);}}
doc.addEventListener('visibilitychange',()=>{if(doc.hidden)onHidden();else onVisible();});
addEventListener('pagehide',onHidden);addEventListener('pageshow',()=>{if(!doc.hidden)onVisible();});
/* ---------- test ve geliştirme API'si (ağdan erişilemez) ---------- */
API.advance=function(days){
  if(G.speed!==0)throw Error('advance yalnız duraklatılmış oyunda');
  for(let i=0;i<Math.round(days*2);i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}
  API.dirty=false;API.lastDay=Math.floor(G.day);if(API.host&&API.connected)API.host.publish();return G.day;
};
API.go=go;
window.MP1Host=API;
/* yazılım klavyesi: odaktaki giriş görünür kalsın (Android'de görünür alan küçülür) */
doc.addEventListener('focusin',e=>{if(e.target.closest&&e.target.closest('#mp1')&&e.target.matches('input,select'))setTimeout(()=>e.target.scrollIntoView({block:'center'}),250);});
if(window.visualViewport)visualViewport.addEventListener('resize',()=>{const a=doc.activeElement;if(a&&a.closest&&a.closest('#mp1')&&a.matches('input'))a.scrollIntoView({block:'center'});});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',addMenu);else addMenu();
})();

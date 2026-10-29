'use strict';
/* STARS MP.1 — host katmanı ve katılım sayfası için ortak görünüm yardımcıları.
   Oyun motoru gerektirmez. Ağdan gelen her metin esc() ile basılır. */
(function(root){
const esc=s=>String(s==null?'':s).replace(/[&<>"'`=\/]/g,c=>'&#'+c.charCodeAt(0)+';');
const color=c=>/^#[0-9a-fA-F]{3,8}$/.test(String(c))?c:'#7d90ad';
const TAB={lobi:'Lobi',doktrin:'Doktrin',gorunus:'Görünüş',fizyoloji:'Fizyoloji',etik:'Etik',civic:'Civic',koken:'Köken',galaksi:'Galaksi ayarları',oyun:'Oyunda'};
const PHASE={created:'Oda açıldı — galaksi bekleniyor',waiting:'Oyuncular bekleniyor',ready:'Herkes hazır',starting:'Oyun hazırlanıyor',ingame:'Oyunda',paused:'Duraklatıldı (host yok)',closed:'Oda kapandı'};
const ERR={'invalid-code':'Oda kodu geçersiz ya da oda yok.','room-full':'Oda dolu.','room-closed':'Oda kapandı.','game-started':'Oyun başladı; yeni oyuncu alınmıyor.',
  kicked:'Host seni odadan çıkardı.','rate-limited':'Çok fazla deneme. Biraz bekle.','no-host':'Host şu an bağlı değil.','server-full':'Sunucu dolu.',
  'bad-host-key':'Host anahtarı geçersiz.','host-exists':'Bu odanın host bağlantısı zaten açık.',taken:'Bu devlet başka bir oyuncuda.','not-claimable':'Bu devlet seçilemez.',
  'host-empire':'Host\'un devleti seçilemez.','no-claim':'Önce bir devlet seç.',phase:'Bu aşamada yapılamaz.','not-started':'Oyun henüz başlamadı.',offline:'Bağlantı yok.',paused:'Oyun duraklatıldı; komut uygulanmadı.','server-restart':'Sunucu yeniden başlatıldı; oda kapandı.'};
const fmtCode=c=>String(c||'').replace(/^(.{4})(.+)$/,'$1-$2');
function players(L){
  return '<div class="mp1-plist">'+L.players.map(p=>{
    const e=L.empires.find(x=>x.id===p.claim);
    return '<div class="mp1-prow'+(L.you&&L.you.seat===p.seat?' me':'')+'" data-seat="'+(+p.seat)+'"><span class="dot" style="background:'+color(p.color)+'"></span>'+
      '<span class="nm">'+esc(p.name)+(p.host?' <b class="mp1-tag">HOST</b>':'')+'</span>'+
      '<span class="st '+(p.online?'on':'off')+'">'+(p.online?'bağlı':'bağlantı koptu')+'</span>'+
      '<span class="em">'+(p.host?'Kendi devleti':e?esc(e.n)+' · '+esc(e.race):'devlet seçilmedi')+'</span>'+
      '<span class="rd '+(p.ready?'ok':'')+'">'+(p.host?'—':p.ready?'Hazır':'Hazır değil')+'</span>'+
      '<span class="tb">'+esc(TAB[p.tab]||p.tab)+'</span></div>';}).join('')+
    Array.from({length:Math.max(0,L.capacity-L.players.length)},()=>'<div class="mp1-prow mp1-empty">Boş oyuncu yuvası</div>').join('')+'</div>';
}
/* Oyun içi görünüm deposu: MP.0 snapshot/delta kuralları */
function apply(st,m){
  if(m.type==='snapshot'){st.view=m.view;st.rev=m.rev;st.clock=m.t;st.snapshots=(st.snapshots||0)+1;return null;}
  if(m.type==='delta'){
    if(m.rev<=st.rev){st.stale=(st.stale||0)+1;return null;}
    if(!st.view||m.base!==st.rev)return 'resync';
    const o=m.ops||{};
    for(const [sec,up] of Object.entries(o.up||{}))Object.assign(st.view[sec],up);
    for(const [sec,rm] of Object.entries(o.rm||{}))for(const k of rm)delete st.view[sec][k];
    for(const [sec,val] of Object.entries(o.set||{}))st.view[sec]=val;
    st.rev=m.rev;st.clock=m.t;st.deltas=(st.deltas||0)+1;return null;
  }
  return null;
}
root.MP1View={esc,color,TAB,PHASE,ERR,fmtCode,players,apply};
})(typeof globalThis!=='undefined'?globalThis:this);

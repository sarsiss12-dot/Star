'use strict';
/* STARS MP.6.1 — ortak oyun hızı bildirimi ve pencere üstü durum hapı (host ve misafir sayfasında AYNI modül).
   - Hız bildirimi: hız çubuğunun (#timepod) hemen üstündeki şeritte (MP çubuğu bu şeridin üstünde durur); ~3 s sonra solarak kaybolur.
     Dokunmayı engellemez (pointer-events:none). Aynı hızın yeniden seçilmesi bildirim üretmez (host 'same' ile reddeder).
   - Durum hapı: bir STARS penceresi (#modal, diplomasi paneli) açıkken MP çubuğu pencerenin altında kalır; bağlantı durumu ve
     ortak hız ekranın üstünde küçük, dokunulamaz bir hapta görünür. Hız bildirimi de pencere açıkken bu hapta gösterilir.
   Metin her zaman oturumdan gelen adla kurulur (host 'speed' iletisi); istemci ad üretmez. */
(function(){
const doc=document,LABEL=['⏸','▸','▸▸','▸▸▸','▸▸▸▸'];
const S={status:'',good:true,spd:null,want:null,hold:null,n:0,note:null,noteUntil:0,timer:0,shown:0};
let noteEl=null,pillEl=null;
const $=id=>doc.getElementById(id);
function speedLabel(spd){return spd>0?LABEL[spd]+' '+spd+'×':'⏸ duraklatıldı';}
/* bildirim metni: kim değiştirdi (oturumdaki ad) + yeni hız; iç duraklatmalarda nedeni */
function text(m){
  const n=m.spd|0;
  const held=hold(m);
  if(m.self)return (n||held?'Hızı '+(held?m.want:n)+'× yaptın':'Oyunu duraklattın')+held;
  if(m.auto){
    /* MP.6.3: karar penceresi (host'ta; misafire ad gitmez), host ağı, oyun sonu */
    if(m.reason==='decision'){const w=m.host?'Karar penceresi açık':(m.who||'Host')+' bir karar penceresinde';return n?w+' — oyun '+n+'× yavaşladı':w+' — oyun duraklatıldı';}
    if(m.reason==='offline')return 'Host bağlı değil — oyun duraklatıldı';
    if(m.reason==='engine')return 'Oyun sona erdi — duraklatıldı';
    if(m.reason==='window')return n?'Oyun sürüyor — '+n+'×':(m.who||'Host')+' bir pencere açtı — oyun duraklatıldı';   // misafire ad gitmez: "Host"
    if(m.reason==='background')return n?'Oyun sürüyor — '+n+'×':(m.who||'Host')+' uygulamadan çıktı — oyun duraklatıldı';
    return n?'Oyun hızı '+n+'×':'Oyun duraklatıldı';}
  const who=m.who||'Bir oyuncu';
  return (n||held?who+' hızı '+(held?m.want:n)+'× yaptı':who+' oyunu duraklattı')+held;
}
/* MP.6.3: açık seçim geçici bir nedenle tutuluyorsa (ör. host karar penceresinde 1×) neden ve uygulanan hız eklenir */
function hold(m){if(!Number.isInteger(m.want)||m.want<=(m.spd|0)||!m.want)return '';
  const why=m.hold==='decision'?'karar penceresi kapanınca':m.hold==='background'||m.hold==='offline'?'host dönünce':'sonra';
  return ' — '+why+' uygulanacak (şimdi '+((m.spd|0)?(m.spd|0)+'×':'duraklatıldı')+')';}
function windowOpen(){const m=$('modal'),d=$('diploPane'),r=$('raceInfo');
  return !!(m&&!m.classList.contains('hidden'))||!!(d&&d.classList.contains('show'))||!!(r&&getComputedStyle(r).display!=='none');}
function rotated(){const r=$('rotate');return !!(r&&r.classList.contains('show'));}
function place(){
  if(!noteEl)return;
  const tp=$('timepod'),bar=$('mp1Mini'),sb=$('sidebar'),vw=innerWidth,vh=innerHeight;
  const t=tp&&tp.getBoundingClientRect(),br=bar&&bar.getBoundingClientRect(),b=br&&br.width&&br.height?br:null;   // sabit konumlu: offsetParent her zaman null
  const sbLeft=sb&&sb.offsetWidth&&!sb.classList.contains('off')?sb.getBoundingClientRect().left:vw;
  const base=t&&t.height?t.top:vh-52;                                  // hız çubuğunun üst kenarı
  let left=t&&t.width?t.left:6;
  if(b&&b.width&&b.bottom>base-30&&b.top<base)left=Math.max(left,b.right+6);   // şerit MP çubuğunca dolu (ör. açılmış host listesi) → sağına
  noteEl.style.left=Math.round(left)+'px';noteEl.style.bottom=Math.round(vh-base+4)+'px';
  noteEl.style.maxWidth=Math.max(140,Math.round(sbLeft-left-10))+'px';
}
function paint(){
  const now=Date.now(),open=windowOpen()&&!rotated(),noteOn=S.note&&now<S.noteUntil;
  if(!noteEl){noteEl=doc.createElement('div');noteEl.id='mp61Note';noteEl.className='mp61-note';noteEl.setAttribute('role','status');noteEl.setAttribute('aria-live','polite');(($('app'))||doc.body).appendChild(noteEl);}
  if(!pillEl){pillEl=doc.createElement('div');pillEl.id='mp61Pill';pillEl.className='mp61-pill';pillEl.setAttribute('aria-live','polite');doc.body.appendChild(pillEl);}
  /* bildirim şeridi (pencere kapalıyken) */
  const showNote=noteOn&&!open&&!rotated();
  if(showNote){if(noteEl.textContent!==S.note)noteEl.textContent=S.note;place();}
  noteEl.classList.toggle('on',!!showNote);noteEl.classList.toggle('fade',!!showNote&&S.noteUntil-now<450);
  /* durum hapı (pencere açıkken): bağlantı + ortak hız; bildirim varsa onun metni */
  if(open&&S.status){const h=(noteOn?'<b>'+esc(S.note)+'</b>':'<i class="'+(S.good?'ok':'bad')+'"></i>ÇOK OYUNCULU · '+esc(S.status)+(cur()!==null?' · '+esc(speedLabel(cur())):''));
    if(pillEl.innerHTML!==h)pillEl.innerHTML=h;pillEl.classList.add('on');}
  else pillEl.classList.remove('on');
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* host ya da misafir: 'speed' iletisi / onSpeed bilgisi geldi */
function speed(m){
  if(Number.isFinite(m.n)){if(m.n<=S.n)return;S.n=m.n;}   // MP.6.3: eski hız iletisi son komutu ezmesin
  const changed=S.spd!==null&&S.spd!==(m.spd|0);S.spd=m.spd|0;S.want=Number.isInteger(m.want)?m.want:null;S.hold=m.hold||null;
  if(!m.silent&&(changed||!m.auto)){S.note=text(m);S.noteUntil=Date.now()+3000;S.shown++;}
  paint();
}
/* gösterilen ortak hız: host'ta canlı G.speed (source), misafirde son 'speed' iletisi */
function cur(){return typeof API.source==='function'?API.source():S.spd;}
function status(t,good){S.status=String(t||'');S.good=!!good;paint();}
setInterval(paint,250);addEventListener('resize',()=>{place();paint();});
const API={speed,status,text,speedLabel,S,windowOpen,paint,source:null};window.MP61=API;
})();

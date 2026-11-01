'use strict';
/* STARS MP.6.3 — akıllı duraklatma: duraklatma NEDENLERİNİ ayrı tutan küçük politika (hız motoru değil).
   Tek yetkili hız kaynağı yine host'un G.speed'idir ve MP.6.1 'speed' komutu değişmez; bu modül yalnız
   "şu an hangi hız uygulanmalı" sorusunu yanıtlar:

     uygulanan = min(want, nedenlerin üst sınırları)

   - want     : son AÇIK hız seçimi (oyuncunun 'speed' komutu, host'un hız düğmesi). 0 = manuel duraklatma.
                Pencereler, arka plan, ağ want'a DOKUNMAZ; bu yüzden bir nedenin kalkması manuel duraklatmayı bozmaz
                ve yeniden bağlanınca eski bir modal kaydı (prePause/modalPrevSpeed) hiçbir zaman uygulanmaz.
   - nedenler : ad → üst sınır. 'background' / 'offline' / 'engine' → 0; karar penceresi 'dec:<uid>' → 0 (otomatik
                duraklatma açık) ya da 1 (kapalı: en düşük etkin hız). Aynı ad ikinci kez eklenince birikmez,
                bir nedenin kaldırılması başkasını silmez.
   - karar belirteçleri iki hâlde: 'pending' (bildirim kutuda bekliyor) ve 'open' (karar penceresi ekranda).
     Açık bir hız komutu bekleyen belirteçleri "görüldü" sayar (tek oyunculudaki oynat düğmesi gibi); ekrandaki
     karar penceresi ise kapanana dek sürer. Pencere kapanınca yalnız 'open' belirteçler düşer.
   DOM'a, G'ye, ağa dokunmaz: Node testinde doğrudan sınanır; host sayfasında mp1-host.js bağlar. */
(function(root){
const PRI=['offline','background','engine'];               // bildirimde gösterilecek neden önceliği (karar en son)
function create(o){
  o=o||{};
  const S={want:Number.isInteger(o.want)?o.want:0,caps:new Map(),dec:new Map(),acks:0,log:[]};
  const lg=(t,x)=>{S.log.push(Object.assign({t},x||{}));if(S.log.length>60)S.log.shift();};
  function set(name,cap){cap=Math.max(0,cap|0);if(S.caps.get(name)===cap)return false;S.caps.set(name,cap);lg('set',{name,cap});return true;}
  function clear(name){if(!S.caps.has(name))return false;S.caps.delete(name);lg('clear',{name});return true;}
  function toggle(name,on,cap){return on?set(name,cap):clear(name);}
  /* karar belirteçleri (uid → {cap,state}) */
  function decPending(uid,cap){const d=S.dec.get(uid);if(d){if(d.state==='open')return false;d.cap=Math.min(d.cap,cap|0);return false;}S.dec.set(uid,{cap:cap|0,state:'pending'});lg('dec',{uid,state:'pending',cap});return true;}
  function decOpen(uid,cap){const d=S.dec.get(uid);if(d&&d.state==='open'&&d.cap===(cap|0))return false;S.dec.set(uid,{cap:cap|0,state:'open'});lg('dec',{uid,state:'open',cap});return true;}
  /* pencere kapandı: ekrandaki belirteçler düşer; kutuya geri konan (küçültülen) not yeniden 'pending' olur */
  function decClose(inInbox){let ch=false;for(const [uid,d] of [...S.dec])if(d.state==='open'){ch=true;if(inInbox&&inInbox(uid))d.state='pending';else S.dec.delete(uid);}if(ch)lg('close');return ch;}
  /* kutudan çıkan (çözülen, süresi dolan, düşen) bekleyen notun belirteci düşer */
  function reconcile(inInbox,modalOpen){let ch=false;
    for(const [uid,d] of [...S.dec]){
      if(d.state==='open'&&!modalOpen){ch=true;if(inInbox(uid))d.state='pending';else S.dec.delete(uid);}
      else if(d.state==='pending'&&!inInbox(uid)){S.dec.delete(uid);ch=true;}}
    return ch;}
  function decCap(){let c=Infinity;for(const d of S.dec.values())c=Math.min(c,d.cap);return c;}
  function capOf(){let c=decCap();for(const v of S.caps.values())c=Math.min(c,v);return c;}
  function effective(){return Math.max(0,Math.min(S.want,capOf()));}
  /* uygulanan hızın nedeni (bildirim metni için): manuel duraklatma en üstte, sonra güvenlik nedenleri, sonra karar */
  function reason(){
    if(S.want===0)return null;                           // manuel duraklatma: iç neden değil, oyuncunun kararı
    const eff=effective();if(eff>=S.want)return null;
    for(const n of PRI)if(S.caps.has(n)&&S.caps.get(n)<=eff)return n;
    for(const [n,v] of S.caps)if(v<=eff)return n;
    return decCap()<=eff?'decision':null;}
  /* açık hız seçimi: want değişir; ekranda olmayan (bekleyen) karar belirteçleri görüldü sayılır */
  function command(v){v=Math.max(0,v|0);const prev=S.want;S.want=v;let acked=0;
    for(const [uid,d] of [...S.dec])if(d.state==='pending'){S.dec.delete(uid);acked++;}
    S.acks+=acked;lg('want',{v,prev,acked});return {want:v,effective:effective(),held:effective()<v?reason():null,acked};}
  function setWant(v){S.want=Math.max(0,v|0);lg('want',{v:S.want,raw:1});}
  function state(){return {want:S.want,effective:effective(),reason:reason(),caps:Object.fromEntries(S.caps),
    dec:[...S.dec].map(([uid,d])=>({uid,cap:d.cap,state:d.state})),acks:S.acks};}
  return {set,clear,toggle,decPending,decOpen,decClose,reconcile,effective,reason,command,setWant,state,get want(){return S.want;},S};
}
const API={create};
if(typeof module!=='undefined'&&module.exports)module.exports=API;
root.StarsPause=API;
})(globalThis);

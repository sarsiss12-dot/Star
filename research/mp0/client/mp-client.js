'use strict';
/* STARS MP.0 istemcisi. Oyun motorunu YÜKLEMEZ ve dünya simülasyonu
   çalıştırmaz: yalnız host'un gönderdiği filtreli görünümü tutar, gösterir ve
   komut iletir. Sonuç her zaman host onayından gelir. */
(function(){
const q=new URLSearchParams(location.search);
const ROOM=/^[a-z0-9-]{1,32}$/.test(q.get('room')||'')?q.get('room'):'mp0';
const NAME=(q.get('name')||'Oyuncu 2').slice(0,24);
const KEY='mp0:'+ROOM;
const store=(()=>{try{return JSON.parse(sessionStorage.getItem(KEY))||{};}catch{return {};}})();
function persist(){try{sessionStorage.setItem(KEY,JSON.stringify({token:store.token,seq:store.seq}));}catch{}}
const C={room:ROOM,ws:null,host:false,playerId:null,empireId:null,rev:-1,view:null,clock:null,packets:[],results:[],
  stats:{msgs:0,bytes:0,snapshots:0,deltas:0,resyncs:0,staleIgnored:0,rtt:[]},dropNext:0,pending:new Map(),errors:[]};
C.seq=store.seq||0;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
function rawSend(obj){if(!C.ws||C.ws.readyState!==1)return false;C.ws.send(JSON.stringify(obj));return true;}
function cid(){return 'c'+Date.now().toString(36)+Math.random().toString(36).slice(2,10);}
C.send=function(cmd){
  if(!C.host)return {ok:false,why:'host-yok'};
  const m={v:1,type:'cmd',seq:++C.seq,cid:cid(),cmd};persist();
  C.pending.set(m.cid,{at:performance.now(),m});rawSend(m);return {ok:true,cid:m.cid,seq:m.seq};
};
C.sendRaw=obj=>rawSend(obj);
C.resync=()=>{C.stats.resyncs++;rawSend({v:1,type:'resync'});};
C.hello=()=>rawSend({v:1,type:'hello',name:NAME,...(store.token?{token:store.token}:{})});

function apply(m){
  if(m.type==='assign'){C.playerId=m.playerId;C.empireId=m.empireId;store.token=m.token;if(m.lastSeq>C.seq)C.seq=m.lastSeq;persist();if(m.empireId===null){C.view=null;C.rev=-1;}return;}
  if(m.type==='snapshot'){C.view=m.view;C.rev=m.rev;C.clock=m.t;C.stats.snapshots++;return;}
  if(m.type==='delta'){
    if(m.rev<=C.rev){C.stats.staleIgnored++;return;}                 // eski paket yeniyi ezmez
    if(C.dropNext>0){C.dropNext--;return;}                             // test: kayıp paket benzetimi
    if(!C.view||m.base!==C.rev){C.resync();return;}                   // boşluk → güvenli yeniden eşitleme
    const o=m.ops||{};
    for(const [sec,up] of Object.entries(o.up||{}))Object.assign(C.view[sec],up);
    for(const [sec,rm] of Object.entries(o.rm||{}))for(const k of rm)delete C.view[sec][k];
    for(const [sec,val] of Object.entries(o.set||{}))C.view[sec]=val;
    C.rev=m.rev;C.clock=m.t;C.stats.deltas++;return;
  }
  if(m.type==='result'){const p=C.pending.get(m.cid);if(p){m.ms=Math.round(performance.now()-p.at);C.pending.delete(m.cid);}C.results.push(m);return;}
  if(m.type==='pong'){C.stats.rtt.push(Math.round(performance.now()-m.t));if(C.stats.rtt.length>200)C.stats.rtt.shift();return;}
  if(m.type==='error')C.errors.push(m.code);
}
function connect(){
  const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/mp?room='+ROOM+'&role=client');C.ws=ws;
  ws.onmessage=ev=>receive(String(ev.data));
  ws.onclose=()=>{C.host=false;render();};
}
function receive(t){
    C.stats.msgs++;C.stats.bytes+=t.length;C.packets.push(t);if(C.packets.length>4000)C.packets.shift();
    if(t[0]==='R'){const m=JSON.parse(t.slice(1));
      if(m.t==='welcome'){C.host=!!m.host;if(C.host)C.hello();}
      else if(m.t==='host-up'){C.host=true;C.hello();}
      else if(m.t==='host-left'){C.host=false;}
      else if(m.t==='error')C.errors.push(m.code);
      else if(m.t==='kicked'){C.host=false;C.errors.push('kicked');}
      render();return;}
    if(t[0]==='H'){let m;try{m=JSON.parse(t.slice(1));}catch{return;}if(m.v!==1)return;apply(m);render();}
}
C._inject=t=>receive(t);   // test: gecikmiş/eski paketi yerel olarak yeniden oynatma
setInterval(()=>{if(C.host)rawSend({v:1,type:'ping',t:Math.round(performance.now())});},2000);

function render(){
  const st=$('status');
  const live=C.ws&&C.ws.readyState===1;
  st.className=live&&C.host?'':'bad';
  st.textContent=!live?'Relay bağlantısı yok':!C.host?'Host bağlı değil — oyun duraklatıldı (komut gönderilemez)':
    C.empireId===null?'Bağlandı · host devlet ataması bekleniyor':'Bağlandı · oyuncu '+C.playerId+' · devlet '+C.empireId+' · rev '+C.rev+
    (C.clock?' · Yıl '+C.clock.y+' Ay '+C.clock.m+' · gün '+C.clock.day:'');
  const v=C.view;
  if(!v){$('me').innerHTML='';$('cols').innerHTML='';$('world').innerHTML='';return;}
  $('me').innerHTML='<h1 style="color:'+esc(v.me.col)+'">'+esc(v.me.n)+'</h1><div class="res">'+
    Object.entries(v.me.res).map(([k,x])=>'<span>'+esc(k)+' '+esc(x)+' <span class="dim">('+esc(v.me.inc[k]??0)+')</span></span>').join('')+'</div>';
  const opts=Object.entries(v.catalog.b).filter(([,b])=>b.ok).map(([k,b])=>'<option value="'+esc(k)+'">'+esc(b.n)+' ('+Object.entries(b.c).map(([r,n])=>r+' '+n).join(', ')+')</option>').join('');
  $('cols').innerHTML='<table><tr><th>Koloni</th><th>Yapılar</th><th>Kuyruk</th><th>Komut</th></tr>'+Object.values(v.cols).map(c=>
    '<tr><td>'+esc(c.n)+'<div class="dim">nüfus '+esc(c.pop)+' · yer '+esc(c.us)+'/'+esc(c.sl)+' · odak '+esc(c.f||'-')+'</div></td><td>'+
    Object.entries(c.b).map(([k,n])=>esc(k)+'×'+esc(n)).join(' ')+'</td><td>'+c.q.map(w=>esc(w.k)+(w.d?' (yıkım)':'')+' '+esc(w.l)+'g').join('<br>')+
    '</td><td class="row"><select data-col="'+c.s+':'+c.p+'">'+opts+'</select><button data-build="'+c.s+':'+c.p+'">İnşa et</button></td></tr>').join('')+'</table>';
  const sys=Object.values(v.sys),fl=Object.values(v.fleets);
  $('world').innerHTML='Bilinen sistem '+sys.filter(s=>s.k).length+'/'+sys.length+' · görünür '+sys.filter(s=>s.vis).length+
    ' · kendi filo '+fl.filter(f=>f.own).length+' · görünen yabancı filo '+fl.filter(f=>!f.own).length+' · temas '+Object.keys(v.emps).length;
  $('log').innerHTML=C.results.slice(-8).reverse().map(r=>'<div>#'+esc(r.seq)+' '+esc(r.status)+(r.code?' '+esc(r.code):'')+(r.dup?' (tekrar)':'')+(r.ms!==undefined?' · '+r.ms+' ms':'')+'</div>').join('');
}
document.addEventListener('click',ev=>{
  const b=ev.target.closest('[data-build]');if(!b)return;
  const [s,p]=b.dataset.build.split(':').map(Number),sel=document.querySelector('select[data-col="'+b.dataset.build+'"]');
  C.send({kind:'build',sys:s,planet:p,key:sel.value});
});
window.MPClient=C;connect();render();
})();

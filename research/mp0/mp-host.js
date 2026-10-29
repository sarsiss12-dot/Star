'use strict';
/* STARS MP.0 — tarayıcı host bağlayıcısı (izole prototip).
   Gerçek oyun sayfasında (dev-relay /mp/host) çalışır: oyun motoru, arayüz ve
   zaman döngüsü olduğu gibi kalır. Bu dosya yalnız
   - relay WebSocket bağlantısını,
   - StarsMP host çekirdeğini,
   - ay sonu / komut sonrası filtreli yayını,
   - küçük bir geliştirme panelini (oyuncu → devlet ataması) ekler. */
(function(){
const q=new URLSearchParams(location.search);
const ROOM=/^[a-z0-9-]{1,32}$/.test(q.get('room')||'')?q.get('room'):'mp0';
const hex=n=>Array.from(crypto.getRandomValues(new Uint8Array(n)),b=>b.toString(16).padStart(2,'0')).join('');
const API={room:ROOM,connected:false,conn:null,events:[],host:null,ws:null,dirty:false,lastDay:-1,publishes:0};
function log(kind,data){API.events.push({at:Date.now(),kind,...data});if(API.events.length>500)API.events.shift();panel();}

function connect(){
  const ws=new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/mp?room='+ROOM+'&role=host');
  API.ws=ws;
  ws.onopen=()=>log('ws-open',{});
  ws.onclose=()=>{API.connected=false;if(API.host)API.host.setPaused(true);log('ws-close',{});};
  ws.onmessage=ev=>{
    const t=String(ev.data),k=t[0];
    if(k==='R'){const m=JSON.parse(t.slice(1));if(m.t==='welcome'){API.connected=true;API.conn=m.conn;if(API.host)API.host.setPaused(false);}log('relay',m);return;}
    if(!API.host)return;
    if(k==='J'){API.host.onJoin(t.slice(1));log('join',{conn:t.slice(1)});}
    else if(k==='L'){API.host.onLeave(t.slice(1));log('leave',{conn:t.slice(1)});}
    else if(k==='F'){const nl=t.indexOf('\n');API.host.onMessage(t.slice(1,nl),t.slice(nl+1));}
  };
}
function makeHost(){
  API.host=StarsMP.createHost({roomId:ROOM,random:hex,hostName:(G.p&&G.p.name)||'Host',
    send:(conn,text)=>{if(API.ws&&API.ws.readyState===1)API.ws.send('T'+conn+'\n'+text);},
    kick:(conn,why)=>{if(API.ws&&API.ws.readyState===1)API.ws.send('K'+conn+'\n'+why);},
    onPlayer:(pid,what)=>log('player',{pid,what})});
  API.host.installGuards();
  if(!API.ws)connect();
}
/* Ay sonu yayını: monthTick'in kendisi değişmez; yalnız sonrası işaretlenir. */
const month=monthTick;
monthTick=function(){const r=month.apply(this,arguments);API.dirty=true;return r;};
setInterval(()=>{
  if(!API.host||!API.connected)return;
  const day=Math.floor(G.day);
  if(API.dirty||day!==API.lastDay){API.dirty=false;API.lastDay=day;API.host.publish();API.publishes++;}
},250);

/* Test ve geliştirme API'si (ağdan erişilemez; yalnız host sayfası) */
API.start=function(cfg){
  setupGame(cfg);if(cfg.mizac)applyChosenPersona(G.p,cfg.mizac);
  enterGame();UI.setSpeed(0);G.autoSave=false;
  makeHost();API.lastDay=Math.floor(G.day);return {seed:G.seed,systems:G.sys.length,emps:G.emps.length};
};
API.advance=function(days){
  if(G.speed!==0)throw Error('advance yalnız duraklatılmış oyunda');
  for(let i=0;i<Math.round(days*2);i++){const b=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);autoExploreTick();if(Math.floor(G.day/30)>b)monthTick();}
  API.dirty=false;API.lastDay=Math.floor(G.day);if(API.host&&API.connected)API.host.publish();return G.day;
};
API.players=()=>[...API.host.state.players.values()].map(p=>({playerId:p.playerId,name:p.name,empireId:p.empireId,online:!!p.conn||p.playerId==='host',lastSeq:p.lastSeq}));
API.assign=(pid,eid)=>{const r=API.host.assign(pid,eid);log('assign',{pid,eid,...r});return r;};
API.release=(eid,toAI)=>API.host.release(eid,toAI);
API.stats=()=>JSON.parse(JSON.stringify(API.host.stats));
API.bundle=()=>{const save=serialize();return {save,meta:API.host.meta(save)};};
API.resume=function(save,meta){
  if(!deserialize(save))return {ok:false,why:'save'};
  enterGame(true);UI.setSpeed(0);G.autoSave=false;
  makeHost();const r=API.host.restore(meta,save);log('resume',r);return r;
};

/* Geliştirme paneli: yalnız gerçek host durumunu gösterir ve gerçek API'yi çağırır. */
function panel(){
  let el=document.getElementById('mp0panel');
  if(!el){el=document.createElement('div');el.id='mp0panel';el.style.cssText='position:fixed;left:6px;bottom:6px;z-index:99999;background:#0b1424ee;color:#cfe;font:12px sans-serif;padding:6px 8px;border:1px solid #4aa8d8;border-radius:6px;max-width:300px';document.body.appendChild(el);
    el.addEventListener('change',ev=>{const s=ev.target;if(s.dataset.pid&&s.value!=='')API.assign(s.dataset.pid,+s.value);});}
  if(!API.host){el.textContent='MP.0 geliştirme · oda '+ROOM+' · host başlatılmadı';return;}
  const free=G.emps.filter(e=>!e.dead&&!e.wild&&!e.crisisSide&&e.id!==0&&!API.host.state.slots.has(e.id));
  el.innerHTML='<b>MP.0 geliştirme</b> · oda '+ROOM+' · relay '+(API.connected?'bağlı':'yok')+' · rev '+API.host.state.worldRevision+
    API.players().map(p=>'<div>'+p.name.replace(/[<>&]/g,'')+' · '+(p.online?'çevrimiçi':'çevrimdışı')+' · '+(p.empireId===null?
      '<select data-pid="'+p.playerId+'"><option value="">devlet ata…</option>'+free.map(e=>'<option value="'+e.id+'">'+e.id+' '+e.name.replace(/[<>&]/g,'').slice(0,22)+'</option>').join('')+'</select>':
      'devlet '+p.empireId)+'</div>').join('');
}
window.MPHostAPI=API;
})();

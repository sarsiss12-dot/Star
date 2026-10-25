'use strict';
/* 96A: physical freight. This is the sole recurring goods-transfer owner.
   Military fleets, tribute and one-off diplomatic gifts retain their owners. */
const Commerce={
 resources:['ene','min','yiy','ala','tuk'],maxContracts:128,maxPerEmpire:12,maxConvoys:256,historyLimit:256,speed:18,prepareDays:2,waitLimit:180,
 labels:{active:'Aktif',waiting:'Bekliyor',blocked:'Engellendi',expired:'Sona erdi',cancelled:'İptal edildi',preparing:'Hazırlanıyor',moving:'Seyahat ediyor',attacked:'Saldırı altında',delivered:'Teslim edildi',destroyed:'İmha edildi',raided:'Yağmalandı'},
 empty(){return {v:1,nextContract:1,nextConvoy:1,contracts:[],convoys:[],stats:{},aiAt:{},dispatchDay:-1,clock:null,visible:true};},
 state(){return G.commerce||(G.commerce=this.empty());},
 terminal(c){return ['delivered','destroyed','raided'].includes(c.status);},
 closed(c){return ['expired','cancelled'].includes(c.status);},
 stats(id){const s=this.state();return s.stats[id]||(s.stats[id]={loaded:{},sent:{},received:{},lost:{},destroyed:{},plundered:{},lootReceived:{},deliveries:0,lastDay:null});},
 add(id,key,r,n){const s=this.stats(id);s[key][r]=(s[key][r]||0)+n;},
 known(e,s){return !!s&&(e.id===0?pSeen(s):(s.seen||[]).includes(e.id));},
 port(e,id){return !!e&&!e.dead&&tradeHubs(e).includes(id);},
 pairGate(a,b){if(!a||!b||a===b||a.dead||b.dead||a.wild||b.wild||a.crisisSide||b.crisisSide)return 'Taraflardan biri geçerli değil';if(a.war[b.id]||b.war[a.id])return 'Savaş nedeniyle ticaret kapalı';if(tradeBlocked(a,b))return 'Ambargo / ticari yaptırım';if(!a.pact?.[b.id]||!b.pact?.[a.id])return 'Genel ticaret anlaşması yok';return null;},
 key(a,b){return a<b?a+'_'+b:b+'_'+a;},
 route(a,b,source,target,{inFlight=false}={}){
  if(!G.sys[source]||!G.sys[target]||source===target)return null;
  if(!inFlight&&G.raids?.[this.key(source,target)]>G.day)return null;
  const q=[[source]],seen=new Set([source]);let budget=512;
  for(let i=0;i<q.length&&budget-->0;i++){
   const path=q[i],s=G.sys[path.at(-1)];if(path.length>3)continue;
   for(const id of s.lanes){const n=G.sys[id];if(!n||seen.has(id)||!this.known(a,n)||!this.known(b,n))continue;
    const owner=G.emps[n.owner];if(owner&&(a.war[owner.id]||b.war[owner.id]))continue;
    const next=path.concat(id);if(id===target)return next;seen.add(id);q.push(next);
   }
  }return null;
 },
 legGate(a,b,it,{stock=false}={}){
  const why=this.pairGate(a,b);if(why)return why;
  if(!this.resources.includes(it.r)||!Number.isFinite(it.v)||it.v<=0||it.v>1000)return 'Geçersiz kargo kaynağı / miktarı (1–1000)';
  if(!Number.isInteger(it.source)||!Number.isInteger(it.target)||!this.port(a,it.source)||!this.port(b,it.target)||it.source===it.target)return 'Çıkış veya varış limanı geçerli değil';
  if(G.sys[it.source].cr>0||G.sys[it.target].cr>0)return 'Ticaret limanı aktif çatışma / abluka altında';
  if(!Number.isInteger(it.every)||it.every<30||it.every>180||!Number.isInteger(it.months)||it.months<3||it.months>120)return 'Sıklık 30–180 gün, süre 3–120 ay olmalı';
  if(it.v>routeVolume(a,it.source,it.target))return 'Sefer miktarı yol kapasitesini aşıyor';
  if(!this.route(a,b,it.source,it.target))return 'En çok 3 sıçramalık bilinen açık rota yok / rota yağmalandı';
  if(stock&&(!Number.isFinite(a.res[it.r])||a.res[it.r]<it.v))return 'İlk sefer için depoda yeterli '+RES[it.r].n+' yok';return null;
 },
 signature(n){return JSON.stringify([n.from,n.to,n.give,n.want]);},
 quote(n){
  const a=G.emps[n.from],b=G.emps[n.to],all=n.give.concat(n.want),st=this.state();
  if(all.some(x=>x.t!=='freight')||n.give.length!==1||n.want.length!==1)return 'Kargo sözleşmesi iki karşılıklı sevkiyat içerir; diğer teklifler ayrı imzalanır';
  const x=n.give[0],y=n.want[0];if(x.source!==y.target||x.target!==y.source||x.every!==y.every||x.months!==y.months||x.r===y.r)return 'Karşı sefer limanları/sıklığı/süresi eşleşmeli; iki farklı kaynak seç';
  for(const [from,to,it]of [[a,b,x],[b,a,y]]){const why=this.legGate(from,to,it,{stock:true});if(why)return why;}
  const active=st.contracts.filter(c=>!this.closed(c));
  for(const [from,it]of [[a,x],[b,y]]){const reserved=active.flatMap(c=>c.legs).filter(l=>l.e===from.id&&l.source===it.source&&l.target===it.target).reduce((n,l)=>n+l.v*30/l.every,0);if(reserved+it.v*30/it.every>routeVolume(from,it.source,it.target)+1e-7)return 'Aynı hattaki sözleşmeler aylık yol kapasitesini aşıyor';}
  if(active.some(c=>c.signature===this.signature(n)))return 'Aynı kaynak sözleşmesi zaten aktif';
  if(active.length>=this.maxContracts||[a,b].some(e=>active.filter(c=>c.a===e.id||c.b===e.id).length>=this.maxPerEmpire))return 'Sözleşme sınırı dolu; mevcut seferler korunur';
  return null;
 },
 sign(n){const why=this.quote(n);if(why)throw Error(why);const st=this.state(),c={id:st.nextContract++,a:n.from,b:n.to,signature:this.signature(n),legs:[{...n.give[0],e:n.from,to:n.to},{...n.want[0],e:n.to,to:n.from}],born:G.day,until:G.day+n.give[0].months*30,next:G.day+this.prepareDays,cycle:0,status:'active',reason:'İlk yükleme hazırlanıyor',delivered:{},lost:{},lastDelivery:null};st.contracts.push(c);return c;},
 cancel(id,actor){const c=this.state().contracts.find(c=>c.id===+id);if(!c||![c.a,c.b].includes(actor?.id)||this.closed(c))return {ok:false,why:'Sözleşme yok veya yetkin yok'};c.status='cancelled';c.reason='Yeni sefer yok; yoldaki yük geçerli limana teslim edilir. Anlaşma/liman kapalıysa en çok 180 gün bekler.';return {ok:true};},
 note(c,event){c.history=c.history||[];c.history.push({day:G.day,event});if(c.history.length>12)c.history.shift();},
 dispatch(c){
  const st=this.state();if(this.closed(c))return false;
  if(G.day>=c.until){c.status='expired';c.reason='Süre doldu; yeni sefer yok, yoldaki kargolar ayrı sonuçlanır';return false;}
  if(st.convoys.some(v=>v.contract===c.id&&!this.terminal(v))){c.status='waiting';c.reason='Önceki karşılıklı sefer tamamlanıyor';return false;}
  if(st.convoys.filter(v=>!this.terminal(v)).length+2>this.maxConvoys){c.status='waiting';c.reason='256 aktif konvoy sınırı; yük depoda, sevkiyat bekliyor';return false;}
  const legs=[];
  for(const l of c.legs){const a=G.emps[l.e],b=G.emps[l.to],why=this.legGate(a,b,l,{stock:true});if(why){c.status='blocked';c.reason=why;return false;}const used=st.convoys.filter(v=>v.e===l.e&&v.source===l.source&&v.target===l.target&&v.started>G.day-30).reduce((n,v)=>n+v.loaded,0);if(used+l.v>routeVolume(a,l.source,l.target)+1e-7){c.status='waiting';c.reason='Son 30 günlük rota kapasitesi dolu; yük depoda bekliyor';return false;}legs.push({...l,route:this.route(a,b,l.source,l.target)});}
  // Validate both outgoing loads before touching either stock. No partial cycle debt.
  for(const l of legs)G.emps[l.e].res[l.r]-=l.v;
  c.cycle++;c.next=G.day+c.legs[0].every;c.status='active';c.reason='İki yön ayrı teslim edilir; kayıp karşı seferi geri almaz';
  for(let i=0;i<legs.length;i++){
   const l=legs[i],sy=G.sys[l.source],v={id:st.nextConvoy++,contract:c.id,cycle:c.cycle,leg:i,e:l.e,to:l.to,source:l.source,target:l.target,r:l.r,loaded:l.v,amount:l.v,delivered:0,lost:0,plundered:0,route:l.route,step:0,t:0,at:l.source,x:sy.x,y:sy.y,status:'preparing',reason:'Yük ayrıldı; alıcıya henüz eklenmedi',depart:G.day+this.prepareDays,started:G.day,updated:G.day,blockedSince:null,retryAt:G.day,riskAt:-1,attackers:[],receipt:null,history:[]};
   st.convoys.push(v);this.add(v.e,'loaded',v.r,v.loaded);this.note(v,'loaded');
  }return true;
 },
 finish(v,status,reason){if(this.terminal(v))return false;const c=this.state().contracts.find(c=>c.id===v.contract),n=v.amount;
  if(status==='delivered'){
   if(v.at!==v.target||v.route[v.step]!==v.target||!this.port(G.emps[v.to],v.target)||this.pairGate(G.emps[v.e],G.emps[v.to]))return false;
   const to=G.emps[v.to];if(!to||to.dead)return this.finish(v,'destroyed','Alıcı devlet yok oldu; kargo kaybedildi');
   if(!Number.isFinite(to.res[v.r])||to.res[v.r]+n>Number.MAX_SAFE_INTEGER){v.status='blocked';v.reason='Alıcı depo sayı sınırı';return false;}
   to.res[v.r]+=n;v.delivered+=n;this.add(v.e,'sent',v.r,n);this.add(v.to,'received',v.r,n);const s=this.stats(v.e);s.deliveries++;s.lastDay=G.day;
   if(c){c.delivered[v.r]=(c.delivered[v.r]||0)+n;c.lastDelivery=G.day;}
   const e=G.emps[v.e];e.tradeFlow=e.tradeFlow||{};e.tradeFlow[v.to]=(e.tradeFlow[v.to]||0)+n;
  }else{v.lost+=n;this.add(v.e,'lost',v.r,n);this.add(v.e,'destroyed',v.r,n);if(c)c.lost[v.r]=(c.lost[v.r]||0)+n;}
  v.amount=0;v.status=status;v.reason=reason;v.finished=G.day;v.receipt=v.id;this.note(v,status);
  if(v.e===0||v.to===0)recordNews({category:'economy',empires:[v.e,v.to],scope:'player',system:status==='delivered'?v.target:v.at,key:'freight:'+v.id,title:status==='delivered'?'Kargo teslim edildi':'Ticaret kargosu kaybedildi',text:n.toFixed(1)+' '+RES[v.r].n+' · '+reason});return true;
 },
 attack(v,f){
  if(!v||this.terminal(v)||!f||!f.ships?.length||!isArmed(f)||f.combat||f.e===v.e||v.attackers.includes(f.id))return false;
  const e=G.emps[v.e],raider=G.emps[f.e];if(!raider||raider.dead||!(e.war[f.e]||raider.wild&&G.cfg.pirates!==false)||Math.hypot(f.x-v.x,f.y-v.y)>160)return false;
  v.attackers.push(f.id);const loot=v.amount*.4;v.amount-=loot;v.lost+=loot;v.plundered+=loot;
  raider.res[v.r]=(raider.res[v.r]||0)+loot;this.add(v.e,'lost',v.r,loot);this.add(v.e,'plundered',v.r,loot);this.add(raider.id,'lootReceived',v.r,loot);
  const c=this.state().contracts.find(c=>c.id===v.contract);if(c)c.lost[v.r]=(c.lost[v.r]||0)+loot;
  G.raids=G.raids||{};G.raids[this.key(v.source,v.target)]=G.day+90;this.note(v,'plundered:'+f.id);
  if(fleetPower(f)>=12)return this.finish(v,'raided','Gerçek kargonun %40’ı ele geçirildi; kalanı imha edildi');
  v.status='attacked';v.reason='Kargonun %40’ı yağmalandı; 10 gün kaçış/mola';v.depart=G.day+10;return true;
 },
 raidTick(){
  const st=this.state(),live=st.convoys.filter(v=>!this.terminal(v));if(!live.length)return;
  const armed=G.fleets.filter(f=>f.ships.length&&!f.combat&&isArmed(f));
  for(const v of live){const day=Math.floor(G.day/10);if(v.riskAt===day)continue;v.riskAt=day;for(const f of armed)if(this.attack(v,f))break;}
 },
 position(v){const a=G.sys[v.route[v.step]],b=G.sys[v.route[v.step+1]];if(!a)return;if(b&&v.status==='moving'){v.x=lerp(a.x,b.x,v.t);v.y=lerp(a.y,b.y,v.t);}else if(v.t===0){v.x=a.x;v.y=a.y;}},
 block(v,why){if(v.blockedSince===null)v.blockedSince=G.day;v.status='blocked';v.reason=why;if(G.day-v.blockedSince>=this.waitLimit)this.finish(v,'destroyed',why+' · 180 gün sonra kargo kaybedildi');},
 tick(dt){
  const st=this.state();if(!Number.isFinite(dt)||dt<0)return;
  dt=st.clock===null?dt:Math.max(0,Math.min(dt,G.day-st.clock));st.clock=G.day;
  // Dispatch and route retries run once per simulation day, not once per paint.
  if(Math.floor(G.day)!==st.dispatchDay){st.dispatchDay=Math.floor(G.day);for(const c of st.contracts){if(!this.closed(c)&&(G.emps[c.a]?.dead||G.emps[c.b]?.dead)){c.status='expired';c.reason='Taraf devlet yok oldu; yeni yükleme yok';}if(G.day>=c.until&&!this.closed(c)){c.status='expired';c.reason='Süre doldu; yeni yükleme yok';}if(!this.closed(c)&&G.day>=c.next){this.dispatch(c);if(c.status==='blocked')c.next=G.day+10;}}this.raidTick();}
  let armedAtArrival=null;
  for(const v of st.convoys){
   if(this.terminal(v))continue;const a=G.emps[v.e],b=G.emps[v.to];
   if(!a||a.dead||!b||b.dead){this.finish(v,'destroyed','Taraflardan biri yok oldu');continue;}
   const why=this.pairGate(a,b)||(!this.port(a,v.source)||!this.port(b,v.target)?'Liman kaybedildi veya yok oldu':null)||(G.sys[v.at]?.cr>0?'Konvoy sistemi muharebe ablukasında':null);
   if(why){this.block(v,why);continue;}
   if(v.status==='attacked'&&G.day<v.depart)continue;
   if(v.status==='preparing'&&G.day<v.depart)continue;
   if(v.status==='blocked'){
    if(v.at===v.target){this.finish(v,'delivered','Varış limanı yeniden teslim almaya hazır');continue;}
    if(G.day<v.retryAt)continue;v.retryAt=G.day+10;
    // An interrupted edge resumes only if that physical edge is still valid.
    const next=v.route[v.step+1],s=G.sys[v.at];
    if(v.t>0&&s?.lanes.includes(next)&&!(G.sys[next].owner>=0&&(a.war[G.sys[next].owner]||b.war[G.sys[next].owner]))){v.status='moving';}
    else{const path=this.route(a,b,v.at,v.target,{inFlight:true});if(!path){this.block(v,'Açık alternatif rota yok');continue;}v.route=path;v.step=0;v.t=0;}
   }
   const ready=Math.max(0,G.day-Math.max(G.day-dt,v.depart));
   v.status='moving';v.reason='Gerçek kargo yolda';v.blockedSince=null;let remaining=ready;
   // A route is at most three edges. A large simulation step still accounts for each arrival.
   for(let hops=0;hops<4&&!this.terminal(v);hops++){
    if(v.at===v.target){this.finish(v,'delivered','Varış limanına ulaştı');break;}
    const from=G.sys[v.route[v.step]],next=G.sys[v.route[v.step+1]];
    if(!from||!next||!from.lanes.includes(next.id)||next.owner>=0&&(a.war[next.owner]||b.war[next.owner])){this.block(v,'Hiper-yol kapalı / düşman denetiminde');break;}
    if(next.cr>0){this.block(v,'Sonraki sistem muharebe / abluka altında');break;}
    const days=Math.max(1,dist(from,next)/this.speed),need=(1-v.t)*days;
    if(remaining<need){v.t+=remaining/days;remaining=0;this.position(v);break;}
    remaining-=need;v.step++;v.at=next.id;v.t=0;v.x=next.x;v.y=next.y;this.note(v,'arrived:'+next.id);
    if(!armedAtArrival)armedAtArrival=G.fleets.filter(f=>f.ships.length&&isArmed(f)&&!f.combat);const threat=armedAtArrival.find(f=>(a.war[f.e]||G.emps[f.e]?.wild&&G.cfg.pirates!==false)&&Math.hypot(f.x-v.x,f.y-v.y)<=160&&!v.attackers.includes(f.id));if(threat)this.attack(v,threat);
    if(v.status==='attacked'||this.terminal(v))break;
    if(v.at===v.target){this.finish(v,'delivered','Varış limanına ulaştı');break;}if(remaining<=0)break;
   }v.updated=G.day;
  }
  const terminal=st.convoys.filter(v=>this.terminal(v));if(terminal.length>this.historyLimit){const remove=new Set(terminal.slice(0,terminal.length-this.historyLimit).map(v=>v.id));st.convoys=st.convoys.filter(v=>!remove.has(v.id));}
  const closed=st.contracts.filter(c=>this.closed(c)&&!st.convoys.some(v=>v.contract===c.id&&!this.terminal(v)));if(closed.length>128){const ids=new Set(closed.slice(0,closed.length-128).map(c=>c.id));st.contracts=st.contracts.filter(c=>!ids.has(c.id));st.convoys=st.convoys.filter(v=>!ids.has(v.contract));}
 },
 aiTick(){
  const st=this.state(),month=Math.floor(G.day/30);let created=0;
  for(const a of G.emps){if(a.dead||!a.ai||a.wild||a.crisisSide||st.aiAt[a.id]===month)continue;st.aiAt[a.id]=month;
   for(const c of st.contracts)if(c.a===a.id&&!this.closed(c)&&c.cycle>0&&Object.values(c.lost).reduce((x,y)=>x+y,0)>Object.values(c.delivered).reduce((x,y)=>x+y,0)+20)this.cancel(c.id,a);
   if(created>=4)break;
   for(const b of G.emps){if(b===a||!b.ai||a.id>b.id||this.pairGate(a,b)||!a.contact[b.id]||!b.contact[a.id]||st.contracts.some(c=>!this.closed(c)&&(c.a===a.id&&c.b===b.id||c.a===b.id&&c.b===a.id)))continue;
    const give=this.resources.filter(r=>(a.inc?.[r]||0)>5&&(b.inc?.[r]||0)<2&&a.res[r]>15).sort((x,y)=>(a.inc[y]||0)-(a.inc[x]||0));
    const want=this.resources.filter(r=>(b.inc?.[r]||0)>5&&(a.inc?.[r]||0)<2&&b.res[r]>15).sort((x,y)=>(b.inc[y]||0)-(b.inc[x]||0));
    if(!give.length||!want.length)continue;let ports=null;
    for(const source of tradeHubs(a))for(const target of tradeHubs(b))if(!ports&&this.route(a,b,source,target))ports={source,target};if(!ports)continue;
    const r=give[0],s=want.find(k=>k!==r);if(!s)continue;const cap=Math.max(1,routeVolume(a,ports.source,ports.target));
    const x={t:'freight',r,v:Math.max(1,Math.min(10,cap,Math.floor(a.res[r]*.1),(a.inc[r]||0)*.16)),...ports,every:30,months:12};
    const y={t:'freight',r:s,v:Math.max(1,Math.min(10,cap,Math.floor(b.res[s]*.1),(b.inc[s]||0)*.16)),source:ports.target,target:ports.source,every:30,months:12};
    // Existing canonical quote/negotiation owns agreement and atomic commit.
    const n={from:a.id,to:b.id,give:[x],want:[y]};if(dealQuote(n).ok&&aiNegotiate(a,b,n.give,n.want,true).uygulandi){created++;break;}
   }
  }
 },
 visible(v,viewer=G.p){if(!viewer||this.terminal(v))return false;if(v.e===viewer.id||v.to===viewer.id)return true;return false;},
 restore(raw){
  if(!raw){G.commerce=this.empty();return;}
  if(raw.v!==1||!raw.stats||typeof raw.stats!=='object'||Array.isArray(raw.stats)||!raw.aiAt||typeof raw.aiAt!=='object'||!Array.isArray(raw.contracts)||!Array.isArray(raw.convoys)||raw.contracts.length>256||raw.convoys.length>this.maxConvoys+this.historyLimit)throw Error('Geçersiz ticaret kaydı');
  const st=JSON.parse(JSON.stringify(raw)),ids=new Set(),cids=new Set(),num=n=>Number.isFinite(n)&&n>=0&&n<=Number.MAX_SAFE_INTEGER;
  for(const c of st.contracts){if(!Number.isSafeInteger(c.id)||cids.has(c.id)||!Array.isArray(c.legs)||c.legs.length!==2||!num(c.next)||!num(c.until)||!num(c.cycle)||!this.labels[c.status])throw Error('Bozuk sözleşme');cids.add(c.id);for(const l of c.legs)if(!this.resources.includes(l.r)||!num(l.v)||l.v<=0||!G.emps[l.e]||!G.emps[l.to]||!G.sys[l.source]||!G.sys[l.target])throw Error('Bozuk sözleşme yükü');}
  for(const v of st.convoys){if(!Number.isSafeInteger(v.id)||ids.has(v.id)||!cids.has(v.contract)||!G.emps[v.e]||!G.emps[v.to]||!this.resources.includes(v.r)||!Array.isArray(v.route)||v.route.length>4||!v.route.length||v.route.some(id=>!G.sys[id])||!Number.isInteger(v.step)||v.step<0||v.step>=v.route.length||!num(v.t)||v.t>1||!['loaded','amount','delivered','lost','plundered','x','y','started','depart','riskAt'].filter(k=>!['x','y','riskAt'].includes(k)).every(k=>num(v[k]))||!Number.isFinite(v.x)||!Number.isFinite(v.y)||!this.labels[v.status]||Math.abs(v.loaded-v.amount-v.delivered-v.lost)>1e-6||this.terminal(v)&&v.amount!==0)throw Error('Bozuk konvoy / kargo muhasebesi');ids.add(v.id);}
  for(const [id,stats] of Object.entries(st.stats||{})){if(!G.emps[id]||!stats||!Number.isSafeInteger(stats.deliveries)||stats.deliveries<0)throw Error('Bozuk ticaret sayacı');for(const key of ['loaded','sent','received','lost','destroyed','plundered','lootReceived']){if(!stats[key]||typeof stats[key]!=='object'||Array.isArray(stats[key])||Object.entries(stats[key]).some(([r,n])=>!this.resources.includes(r)||!num(n)))throw Error('Bozuk kargo toplamı');}}
  if(st.clock!==null&&!num(st.clock))throw Error('Bozuk ticaret saati');
  if(st.convoys.some(v=>v.at!==v.route[v.step]||!Array.isArray(v.attackers)||v.attackers.some(id=>!Number.isSafeInteger(id))||this.terminal(v)&&v.receipt!==v.id))throw Error('Bozuk konum / teslimat makbuzu');
  if(!Number.isSafeInteger(st.nextConvoy)||st.nextConvoy<=Math.max(0,...ids)||!Number.isSafeInteger(st.nextContract)||st.nextContract<=Math.max(0,...cids))throw Error('Ticaret kimliği tekrar edebilir');
  G.commerce=st; // No dispatch, payment, arrival, history synthesis or RNG during loading.
 },
};

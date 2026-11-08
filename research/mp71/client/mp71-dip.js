'use strict';
/* ═══ STARS MP.7.1 — TEK STARS ARAYÜZÜ, İKİ OYUN MODU: insanlar arası teklifler gerçek STARS ekranlarında ═══
   Ayrı "ÇOK OYUNCULU DİPLOMASİ" paneli yok. Host ve misafir aynı STARS ekranlarını kullanır:
   - teklif / karşı teklif: gerçek anlaşma penceresi (MÜZAKERE) → MP 'offer' / 'counter';
   - gelen teklif: gerçek gelen kutusu (bildirim kartı + Gelen kutusu kaydı) → KABUL ET / REDDET / Karşı teklif hazırla
     → MP 'respond' / 'counter';
   - gönderilen teklifler ve geçmişi: gerçek gelen kutusu penceresinde "Gönderilen" sekmesi (durum, şartlar, yanıt, GERİ ÇEK)
     ve anlaşma sayfasında o devlete bekleyen tekliflerin;
   - gelen tekliflerin geçmişi: Gelen kutusu listesi (durum süzgeci), durumu host belirler.
   Bu modül yeni diplomasi kuralı içermez: her karar host'ta MP.3 komutundan ve motorun dealQuote / executeDeal'inden geçer.
   Görünen durum host'un teklif deposundandır (iyimser yerel durum bir sonraki görünümde host'unkiyle değişir).
   Rol bağdaştırıcısı (host: mp1-host.js, misafir: guest-stars.js) kimlik eşlemesini, komut gönderimini ve görünümü verir. */
(function(){
const doc=document,$=id=>doc.getElementById(id);
const esc=s=>String(s===undefined||s===null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const CODE={'rules:no-target':'Bu devletle anlaşma yapılamaz (temas yok ya da anlaşma yapamıyor).','rules:too-many':'Bekleyen teklif sınırına ulaştın (8). Önce birini geri çek.',
  'rules:duplicate':'Aynı teklif zaten bekliyor.','rules:quote':'Teklif şu an uygulanamıyor.','rules:not-recipient':'Bu teklif için karar senin değil.',
  'rules:closed':'Bu teklif artık açık değil.','rules:expired':'Teklifin süresi doldu.','rules:round-limit':'Pazarlık tur sınırına ulaşıldı (6 tur).','rules:not-sender':'Yalnız gönderen geri çekebilir.',
  'no-offer':'Teklif bulunamadı.','rules:invalid':'Taraflardan biri artık anlaşma yapamaz.','bad-params':'Geçersiz teklif.',paused:'Oyun duraklatıldı; işlem yapılmadı.',
  'host-yok':'Host bağlı değil; işlem gönderilmedi.','not-started':'Oyun başlamadı.',error:'Host hata verdi; hiçbir şey değişmedi.','forged-empire':'Başka devlet adına işlem yapılamaz.'};
const STATE={pending:'Bekliyor',accepted:'Kabul edildi',rejected:'Reddedildi',countered:'Karşı teklif',expired:'Süresi doldu',invalid:'Geçersizleşti',withdrawn:'Geri çekildi'};
const FILTERS=[['','Tümü'],['pending','Bekliyor'],['done','Sonuçlanan'],['accepted','Kabul edildi'],['rejected','Reddedildi'],['countered','Karşı teklif'],['withdrawn','Geri çekildi'],['expired','Süresi doldu'],['invalid','Geçersizleşti']];
const AI_REPLY={kabul:'kabul etti — anlaşma uygulandı',red:'reddetti',karsi:'karşı teklif verdi (gelen kutuna düştü)'};
const TREATY=['peace','nap','pact','ally','intel','passage'];   // mp-core DIP_TREATY ile aynı (MP.6.2)
const M={ad:null,installed:false,mode:null,detail:null,confirm:null,confirmAt:0,busy:new Set(),dealAsk:null,dealAskAt:0,counter:null,sig:null,dealSig:null,
  filter:'',stats:{offers:0,counters:0,withdraws:0,responds:0,notified:0,synced:0,sentRenders:0,dealBoxes:0,blocked:0}};
const on=()=>!!(M.ad&&M.ad.on());
/* ---------- durum ---------- */
function stateOf(o){if(o.status==='invalid'&&/geri çekti/i.test(o.why||''))return 'withdrawn';return o.status;}
function stateText(o,all){const s=stateOf(o);
  if(s==='countered'){const c=all.find(x=>x.prev===o.id);if(c&&c.from!==o.from)return 'Karşı teklif geldi'+(c.status==='pending'?' · senin yanıtın bekleniyor':' · '+(STATE[stateOf(c)]||c.status).toLowerCase());}
  return STATE[s]||s;}
function why(res){const d=res&&res.detail&&res.detail.length?' — '+res.detail.slice(0,2).join(' · '):'';const c=res&&res.code;
  return (CODE[c]||(typeof MP1View!=='undefined'&&MP1View.ERR[c])||c||'işlem yapılmadı')+d;}
const terms=l=>(l||[]).map(i=>i.l||(typeof dealLabel==='function'?String(dealLabel(i)).replace(/<[^>]*>/g,''):i.t)).join(', ')||'—';
const all=()=>{try{return M.ad.offers()||[];}catch{return [];}};
const mine=()=>{const me=M.ad.me();return all().filter(o=>o.from===me).sort((a,b)=>b.id-a.id);};
const pendingSent=()=>mine().filter(o=>o.status==='pending').length;
const nameOf=(o,real)=>{const loc=M.ad.local(real);const e=typeof G!=='undefined'&&G&&G.emps[loc];return e&&(loc===G.p.id||(G.p.contact&&G.p.contact[loc]))?e.name:(real===o.from?o.fn:o.tn)||'Bilinmeyen devlet';};
function send(cmd,okText,after){
  const k=cmd.kind+':'+(cmd.offer||'');if(cmd.offer&&M.busy.has(k))return false;if(cmd.offer)M.busy.add(k);   // tek dokunuş = tek komut (sonuç gelene kadar)
  const cid=M.ad.send(cmd,res=>{M.busy.delete(k);if(res.status==='ok'){if(okText)M.ad.toast(okText,false);}else M.ad.toast('Host reddetti: '+why(res),true);if(after)after(res);refreshOpen(true);});
  if(!cid){M.busy.delete(k);M.ad.toast(CODE['host-yok'],true);return false;}return true;}
/* ---------- 1. gelen kutusu penceresi: "Gönderilen" sekmesi ---------- */
function tabHtml(){return '<button class="abtn '+(M.mode==='sent'?'pri':'')+'" data-mp71="sent" id="mp71SentTab" aria-pressed="'+(M.mode==='sent')+'">Gönderilen · '+pendingSent()+'</button>';}
function addTab(){if(!on())return;const nav=doc.querySelector('#modal .archiveTabs');if(!nav)return;const old=nav.querySelector('#mp71SentTab');if(old)old.remove();nav.insertAdjacentHTML('beforeend',tabHtml());}
function openSent(){
  ArchiveUI.ensureWorld();ArchiveUI.remember();if(ArchiveUI.mode!=='mpsent'){ArchiveUI.mode='mpsent';const v=ArchiveUI.views.mpsent||{};ArchiveUI.scroll=v.scroll||0;}
  M.mode='sent';M.detail=null;M.confirm=null;ArchiveUI.selected=null;
  ArchiveUI.shell('<div class="archiveControls"><div class="archiveTools"><select id="mp71Filter" aria-label="Durum">'+FILTERS.map(([k,v])=>'<option value="'+k+'"'+(M.filter===k?' selected':'')+'>'+esc(v)+'</option>').join('')+'</select></div>'+
    '<div class="mini" id="mp71SentNote">Çok oyunculu teklifler: kararı karşı tarafın gelen kutusunda verilir, host uygular. Durumu host belirler.</div>'+
    '<div class="archiveColumns" aria-hidden="true"><span>Tarih</span><span>Tür</span><span>Devlet</span><span>Şartlar · yanıt</span><span>Durum</span></div></div>'+
    '<div id="archiveRows" class="archiveRows archive95e" role="region" aria-label="Gönderilen teklifler" tabindex="0" data-mp71view="sent"></div>','',true);
  $('mp71Filter').addEventListener('change',()=>{M.filter=$('mp71Filter').value||'';ArchiveUI.scroll=0;rows();});rows();M.stats.sentRenders++;
}
function rows(){
  const box=$('archiveRows');if(!box||box.dataset.mp71view!=='sent')return;const keep=box.scrollTop,list0=all();
  const list=mine().filter(o=>{const s=stateOf(o);return !M.filter||(M.filter==='done'?s!=='pending':s===M.filter);});
  box.innerHTML=list.length?list.map(o=>'<article class="archiveRow mp71Row" data-offer="'+o.id+'"><span class="archiveDate">Gün '+(o.born|0)+'</span><span class="archiveType">'+(o.round>1?'Karşı teklif':'Teklif')+'</span>'+
    '<button class="archiveEmpire" data-mp71="empire" data-x="'+o.to+'" title="Devleti incele">'+esc(nameOf(o,o.to))+'</button>'+
    '<button class="archiveTitle" data-mp71="detail" data-x="'+o.id+'" aria-label="Ayrıntı"><strong>Veriyorsun: '+esc(terms(o.give))+'</strong><span>İstiyorsun: '+esc(terms(o.want))+' · <i class="mp71-st">'+esc(stateText(o,list0))+'</i>'+(o.why&&o.status!=='pending'&&o.status!=='countered'?' · '+esc(o.why):'')+'</span></button>'+
    '<span class="archiveState" data-mp71state="'+esc(stateOf(o))+'" title="'+esc(stateText(o,list0))+'">'+esc(STATE[stateOf(o)]||o.status)+'</span></article>').join(''):'<div class="mini archiveEmpty">Bu filtrede gönderilen teklif yok. Teklif: DİPLOMASİ → devlet → MÜZAKERE → TEKLİFİ SUN.</div>';
  box.scrollTop=keep||ArchiveUI.scroll||0;
}
function detail(id){
  const list0=all(),o=list0.find(x=>x.id===id&&x.from===M.ad.me());if(!o){openSent();return;}
  ArchiveUI.remember();M.mode='sent';M.detail=id;
  const ctr=list0.find(x=>x.prev===o.id&&x.from===o.to),day=M.ad.day(),left=Math.max(0,Math.ceil(o.expires-day)),ask=M.confirm===id,busy=M.busy.has('withdraw:'+id);
  const body='<div class="mbd archiveDetail archive95e" id="mp71SentDetail" data-offer="'+o.id+'"><h3>GÖNDERİLEN TEKLİF · '+esc(nameOf(o,o.to))+'</h3>'+
    '<div class="mini">Gün '+(o.born|0)+' · '+(o.round>1?'Karşı teklif · tur '+o.round:'Diplomatik teklif')+' · <b id="mp71State">'+esc(stateText(o,list0))+'</b></div>'+
    '<div class="ph">SEN VERİYORSUN</div>'+(o.give.length?o.give.map(i=>'<p>'+esc(i.l||i.t)+'</p>').join(''):'<p class="mini">— hiçbir şey —</p>')+
    '<div class="ph">KARŞI TARAFTAN İSTEDİĞİN</div>'+(o.want.length?o.want.map(i=>'<p>'+esc(i.l||i.t)+'</p>').join(''):'<p class="mini">— hiçbir şey —</p>')+
    '<div class="mini">İmza maliyeti: '+(o.cost|0)+' Etki · kabulde sen ödersin</div>'+
    (o.status==='pending'?'<div class="mini">'+left+' gün · son gün '+(o.expires|0)+'</div>':'<div class="box"><b>YANIT</b><p class="mini" id="mp71Why">'+esc(o.why||STATE[stateOf(o)]||'')+'</p></div>')+
    (ctr?'<div class="mini">Karşı teklif: '+esc(terms(ctr.give))+' → sana · sen → '+esc(terms(ctr.want))+' ('+esc(STATE[stateOf(ctr)]||ctr.status)+')</div>':'')+
    '<button class="abtn" data-mp71="empire" data-x="'+o.to+'">Devleti incele</button></div>';
  const foot=(o.status==='pending'?(ask?'<button class="ch" data-mp71="withdrawYes" id="mp71WithdrawYes"'+(busy?' disabled':'')+'>EVET, GERİ ÇEK</button><button class="ch" data-mp71="withdrawNo">VAZGEÇ</button>':
      '<button class="ch" data-mp71="withdrawAsk" data-x="'+o.id+'" id="mp71Withdraw"'+(busy?' disabled':'')+'>GERİ ÇEK</button>'):'')+
    (ctr&&ctr.status==='pending'?'<button class="ch" data-mp71="counterOpen" data-x="'+ctr.id+'" id="mp71CounterOpen">KARŞI TEKLİFİ İNCELE</button>':'')+
    '<button class="ch" data-mp71="sent">Listeye dön</button>';
  ArchiveUI.shell(body,foot);
}
/* açık görünüm host'un yeni durumuyla güncellenir; liste kaydırması ve yarım onay korunur */
function refreshOpen(force){
  if(!on())return;
  const pane=$('diploPane'),dealOpen=!!(pane&&pane.classList.contains('show')&&typeof UI!=='undefined'&&UI.diploPage==='deal');
  if(!dealOpen&&!$('mp71SentTab')&&!$('mp71DealBox'))return;   // görünür bir MP.7.1 öğesi yoksa görünüm hesaplanmaz
  const sig=JSON.stringify(mine().map(o=>[o.id,o.status,o.why]))+'|'+JSON.stringify(all().filter(o=>o.to===M.ad.me()).map(o=>[o.id,o.status]));
  const changed=force||sig!==M.sig;M.sig=sig;
  const tab=$('mp71SentTab');if(tab){const t='Gönderilen · '+pendingSent();if(tab.textContent!==t)tab.textContent=t;}
  if(changed){const box=$('archiveRows');if(box&&box.dataset.mp71view==='sent')rows();else if(M.detail!==null&&$('mp71SentDetail'))detail(M.detail);}
  dealBox();
}
/* ---------- 2. anlaşma sayfası: bu devlete bekleyen tekliflerin + insan oyuncu notu ---------- */
function dealBoxHtml(){
  if(typeof UI==='undefined'||!UI.deal||UI.diploPage!=='deal')return null;const t=UI.deal.to,real=M.ad.real(t),human=M.ad.human(t);
  const list=mine().filter(o=>o.to===real&&o.status==='pending');if(!human&&!list.length)return null;
  return '<b>ÇOK OYUNCULU</b>'+(human?'<div class="mini">Bu devleti bir insan oyuncu yönetiyor. TEKLİFİ SUN teklifini onun gelen kutusuna gönderir; kararı o verir, host uygular. Karşı tarafın stoğu sana gösterilmez; kabulde host denetler.</div>':'')+
    (list.length?'<div class="ph">BEKLEYEN TEKLİFLERİN ('+list.length+')</div>'+list.map(o=>'<div class="mini mp71-pend" data-offer="'+o.id+'">Veriyorsun: '+esc(terms(o.give))+' · İstiyorsun: '+esc(terms(o.want))+' · '+Math.max(0,Math.ceil(o.expires-M.ad.day()))+' gün</div>'+
      (M.dealAsk===o.id?'<div class="act2"><button class="abtn pri" data-mp71="dealWithdrawYes" data-x="'+o.id+'">EVET, GERİ ÇEK</button><button class="abtn" data-mp71="dealWithdrawNo">VAZGEÇ</button></div>':
        '<button class="abtn" data-mp71="dealWithdrawAsk" data-x="'+o.id+'"'+(M.busy.has('withdraw:'+o.id)?' disabled':'')+'>GERİ ÇEK</button>')).join(''):'')+
    '<button class="abtn" data-mp71="sentOpen">Gönderilen teklifler · durum ve geçmiş</button>';
}
function dealBox(){
  const pane=$('diploPane');const body=pane&&pane.classList.contains('show')?pane.querySelector('.dcBody'):null;let el=$('mp71DealBox');
  const h=on()&&body?dealBoxHtml():null;
  if(!h){if(el)el.remove();M.dealSig=null;return;}
  if(!el||el.parentNode!==body){if(el)el.remove();el=doc.createElement('div');el.id='mp71DealBox';el.className='box mp71-deal';const row=body.querySelector('.act2:last-of-type');body.insertBefore(el,row?row.nextSibling:null);}
  if(el.innerHTML!==h){el.innerHTML=h;M.stats.dealBoxes++;}
}
/* ---------- 3. olaylar (data-a değil: misafirdeki eylem kapısından bağımsız, yalnız bu modülün görünüm ve MP komutları) ---------- */
function onClick(ev){
  const b=ev.target.closest&&ev.target.closest('[data-mp71]');if(!b||!on())return;ev.preventDefault();ev.stopPropagation();if(b.disabled)return;
  const a=b.dataset.mp71,x=+b.dataset.x;
  if(a==='sent'||a==='sentOpen'){if(a==='sentOpen'){try{UI.stashDiploDraft();$('diploPane').classList.remove('show');}catch{}}openSent();}
  else if(a==='detail'){M.confirm=null;detail(x);}
  else if(a==='empire'){const id=M.ad.local(x);if(G.emps[id]&&!G.emps[id].dead&&UI.diploKnown(id)){UI.closeModal();UI.openDiplo();UI.selectDiploIdentity(id);}}
  else if(a==='withdrawAsk'){M.confirm=x;M.confirmAt=performance.now();detail(x);}
  else if(a==='withdrawNo'){M.confirm=null;detail(M.detail);}
  else if(a==='withdrawYes'){if(performance.now()-M.confirmAt<450)return;const id=M.confirm;M.confirm=null;M.stats.withdraws++;send({kind:'withdraw',offer:id},'Teklif geri çekildi.',()=>{if(M.detail===id&&$('mp71SentDetail'))detail(id);});detail(id);}
  else if(a==='dealWithdrawAsk'){M.dealAsk=x;M.dealAskAt=performance.now();dealBox();}
  else if(a==='dealWithdrawNo'){M.dealAsk=null;dealBox();}
  else if(a==='dealWithdrawYes'){if(performance.now()-M.dealAskAt<450)return;const id=M.dealAsk;M.dealAsk=null;M.stats.withdraws++;send({kind:'withdraw',offer:id},'Teklif geri çekildi.');dealBox();}
  else if(a==='counterOpen'){const r=M.ad.record(x);if(r)ArchiveUI.record(r.id);else M.ad.toast('Karşı teklif gelen kutuna ulaşıyor; birazdan Gelen kutusunda.',false);}
}
/* ---------- 4. host'a özgü: gerçek anlaşma penceresi ve gerçek gelen kutusu insan teklifleri için MP komutuna iner ----------
   Misafirde aynı yollar guest-stars.js'tedir (MP.6.1; misafir motoru yürütmez). Host motoru yürütür: yalnız karşı taraf UZAK
   İNSAN olduğunda tek oyunculu yol (aiRespond → 'bekle', executeDeal doğrudan) yerine MP.3 komutu çalışır. AI ile her şey aynen. */
function installHost(){
  const A=M.ad;
  /* anlaşma penceresi önizlemesi: insan karşı tarafın stoğu gösterilmez (MP.3 dipGate ile aynı kural; misafirdeki gibi).
     Yalnız pencere çizilirken: motorun kendi dealQuote çağrıları (AI kararları, executeDeal) aynen. */
  let quiet=0;const dq0=dealQuote;
  dealQuote=function(offer){const q=dq0.apply(this,arguments);if(!quiet||!q||!offer||offer.from!==G.p.id||!A.human(offer.to))return q;return hideOther(q,G.emps[offer.to]);};
  const dd0=UI.drawDeal;UI.drawDeal=function(){quiet++;try{return dd0.apply(this,arguments);}finally{quiet--;if(on())dealBox();}};
  /* TEKLİFİ SUN → 'offer' (karşı teklif bağlamında 'counter') */
  const ds0=UI.dealSend;
  UI.dealSend=function(){if(!on())return ds0.apply(this,arguments);this.ensureDiploWorld();const d=this.deal;if(!d||!A.human(d.to))return ds0.apply(this,arguments);
    const items=l=>(l||[]).map(i=>i&&i.t==='res'&&Number.isInteger(i.v)?{t:'res',r:i.r,v:i.v}:i&&TREATY.includes(i.t)?{t:i.t}:null),give=items(d.give),want=items(d.want);
    if(give.includes(null)||want.includes(null)){this.dealMsg='Çok oyunculuda kaynak, barış ve antlaşma maddeleri (saldırmazlık, ticaret, ittifak, sensör, geçiş) gönderilebilir; teknoloji, sistem, haraç, lüks, savaş sözü ve casusluk ağı henüz yok.';M.stats.blocked++;this.drawDeal();return;}
    if(!give.length&&!want.length){this.dealMsg='Teklif boş.';this.drawDeal();return;}
    const ctr=M.counter&&M.counter.to===d.to?M.counter:null,to=d.to,o=G.emps[to];
    const cmd=ctr?{kind:'counter',offer:ctr.offer,give,want}:{kind:'offer',to:A.real(to),give,want};
    const x=A.exec(cmd);
    if(x.ok){if(ctr){M.counter=null;M.stats.counters++;}else M.stats.offers++;this.forgetDeal(to);this.openDeal(to);
      this.dealMsg=(ctr?'Karşı teklif':'Teklif')+' gönderildi — '+(o?o.name:'')+'. Kararı onun gelen kutusunda; durumu Gelen kutusu → Gönderilen.';A.toast(this.dealMsg,false);}
    else this.dealMsg='Host reddetti: '+why(x);
    this.drawDeal();refreshOpen(true);};
  /* gelen kutusundaki insan teklifi için "Karşı teklif hazırla" → karşı teklif bağlamı (GÖNDER → 'counter') */
  const ao0=UI.aiDealOpen;UI.aiDealOpen=function(p){if(on()&&p){const o=offerOfData(p);M.counter=o?{offer:o.id,to:p.from}:null;}return ao0.apply(this,arguments);};
  /* karşı teklif kartı (orijinal insan teklifi saklı): kabul / ret = 'respond' (tek oyunculuda yerelde uygulanır) */
  const act0=UI.act;UI.act=function(a,x,el){
    if(on()&&(a==='ctrYes'||a==='ctrNo')&&M.counter&&this.dealCounter&&this.dealCounter.from===M.counter.to){const c=M.counter,yes=a==='ctrYes';M.counter=null;M.stats.responds++;
      const r=A.exec({kind:'respond',offer:c.offer,action:yes?'accept':'reject'});A.toast(r.ok?(yes?'Anlaşma imzalandı — host uyguladı.':'Teklif reddedildi.'):'Host reddetti: '+why(r),!r.ok);
      this.dealCounter=null;if(yes&&r.ok){this.forgetDeal(c.to);$('diploPane').classList.remove('show');this.refresh();}else this.drawDeal();sync();return;}
    return act0.apply(this,arguments);};
  /* gerçek gelen kutusu: insan teklifinin kaydı → 'respond'; kapı host'un MP kaydı + dealQuote'u (gönderenin stoğu gizli) */
  const DI=DiplomaticInbox,gate0=DI.gate.bind(DI),resolve0=DI.resolve.bind(DI);
  DI.gate=function(rec){const o=on()&&rec&&rec.kind==='aideal'?offerOfRec(rec):null;if(!o)return gate0(rec);
    if(rec.status!=='pending'||o.status!=='pending')return {ok:false,why:o.why||'Teklif sonuçlandı',terminal:true,status:o.status};
    if(G.day>o.expires)return {ok:false,why:'Teklifin süresi doldu',terminal:true,status:'expired'};
    const q=hideOther(dealQuote(this.deal(rec)),G.emps[o.from]);return {ok:q.ok,why:(q.reasons||[]).join(' · '),quote:q};};
  DI.resolve=function(id,yes,option,world){const rec=this.get(id);if(on()&&M.ad.role==='host'&&rec?.kind==='fedfound'){
    if(world!==G.emps)return {ok:false,why:'Oyun kaydı değişti; daveti yeniden aç'};const r=A.exec({kind:'fedFoundReply',id:rec.note.data,accept:!!yes});if(r.ok){rec.status=yes?'accepted':'rejected';rec.finished=G.day;UI.fedFoundCards();}return r.ok?{ok:true}:{ok:false,why:'Host reddetti: '+why(r)};
  }const o=on()&&rec&&rec.kind==='aideal'?offerOfRec(rec):null;if(!o)return resolve0(id,yes,option,world);
    if(world!==G.emps)return {ok:false,why:'Oyun kaydı değişti; teklifi yeniden aç'};
    M.stats.responds++;const r=A.exec({kind:'respond',offer:o.id,action:yes?'accept':'reject'});
    if(!r.ok)return {ok:false,why:'Host reddetti: '+why(r)};sync();return {ok:true};};
}
/* gerekçe süzgeci: karşı tarafın kendi satırları ("Ad → …") düşer, yerine tek genel satır (MP.3 dipReasons) */
function hideOther(q,other){if(!q||!other)return q;const pre=String(other.name)+' → ',rs=(q.reasons||[]).map(String),own=rs.filter(r=>!r.startsWith(pre));
  if(own.length===rs.length&&!(q.wantFail||[]).length)return q;const out=own.slice();if(own.length<rs.length)out.push('Karşı taraf bu şartları şu an karşılayamıyor');
  return {...q,wantFail:[],reasons:out,ok:!(q.giveFail||[]).length&&!out.length};}
/* host: canonical MP offer ID; old records migrate only through their exact encoded mp71 note ID. */
const keyOf=o=>'deal:mp71:'+o.id;
function offerOfRec(rec){const me=G.p.id;return M.ad.raw().find(o=>o.to===me&&(keyOf(o)===rec.key||rec.note?.key==='mp71:'+o.id))||null;}
function offerOfData(p){const me=G.p.id,sig=offerSignature({...p,to:0});return M.ad.raw().find(o=>o.to===me&&o.status==='pending'&&o.from===p.from&&o.born===p.born&&offerSignature({from:o.from,to:0,give:o.give,want:o.want})===sig)||null;}
/* host: insan → host teklifi gerçek bildirim kartı + Gelen kutusu kaydı olur; kayıtların durumu host deposundan */
function sync(){
  if(!on()||M.ad.role!=='host'||typeof DiplomaticInbox==='undefined')return;
  const me=G.p.id,DI=DiplomaticInbox,recs=new Map(DI.state().records.filter(r=>r.kind==='aideal').map(r=>[r.key,r]));
  for(const o of M.ad.raw()){if(o.to!==me||!G.emps[o.from])continue;const key=keyOf(o);let r=recs.get(key)||DI.state().records.find(r=>r.kind==='aideal'&&r.note?.key==='mp71:'+o.id);
    if(r&&r.key!==key){recs.delete(r.key);r.key=key;recs.set(key,r);} // exact old note ID, never signature/time guessing
    if(!r&&o.status==='pending'&&G.day<o.expires){const e=G.emps[o.from];
      UI.notify({kind:'aideal',data:{from:o.from,to:0,give:o.give.map(i=>({...i})),want:o.want.map(i=>({...i})),born:o.born,expires:o.expires},ico:'📜',pause:false,
        title:(o.round>1?'Karşı teklif':'Teklif')+' — '+e.name,sub:'Çok oyunculu teklif · '+(o.want.map(dealLabel).join(', ')||'anlaşma')+' istiyor',key:'mp71:'+o.id});
      r=DI.state().records.find(x=>x.key===key);if(r){M.stats.notified++;recs.set(key,r);}}
    if(o.status==='pending')continue;
    /* kabulde motorun executeDeal'i eşleşen kaydı (findDeal) kendisi "kabul edildi" yapar; kart yine de kaldırılmalı */
    let changed=false;
    if(r&&r.status==='pending'){r.status=Object.hasOwn(DI.states,o.status)?o.status:'invalid';r.finished=G.day;r.why=String(o.why||'').slice(0,600);
      if(stateOf(o)==='withdrawn')r.sub=String('Gönderen geri çekti · '+r.sub).slice(0,600);changed=true;M.stats.synced++;}
    const n0=(G.inbox||[]).length;G.inbox=(G.inbox||[]).filter(n=>n.key!=='mp71:'+o.id&&!(r&&r.note&&n.uid===r.note.uid));
    if(changed||G.inbox.length!==n0)try{UI.drawInbox();UI.topbar();}catch{}}
}
function tick(){if(!on())return;try{sync();}catch{}refreshOpen(false);}
/* gelen kutusu kaydı bir çok oyunculu teklif mi (host: depo eşleşmesi; misafir: rec.mp) */
const isMp=rec=>!!rec&&rec.kind==='aideal'&&(M.ad.role==='guest'?!!rec.mp:!!offerOfRec(rec));
/* ---------- kurulum ---------- */
function attach(ad){
  M.ad=ad;if(M.installed)return;M.installed=true;
  doc.addEventListener('click',onClick,true);
  const shell0=ArchiveUI.shell;ArchiveUI.shell=function(){const r=shell0.apply(this,arguments);if(this.mode!=='mpsent')M.mode=null;else M.mode='sent';if(this.mode!=='mpsent'){M.detail=null;M.confirm=null;}addTab();return r;};
  /* misafir: anlaşma sayfası çizilince kutu (host'ta drawDeal sarmalayıcısı aynı işi yapar) */
  /* KARARIN ETKİSİ: tek oyunculu AI teklifinin ret yaptırımları (27 ay bekleme, ilişki −5) MP.3 kararında uygulanmaz; doğru metin */
  const dc0=ArchiveUI.decisionContext;ArchiveUI.decisionContext=function(r,f){if(!on()||!isMp(r))return dc0.apply(this,arguments);
    return '<div class="box" id="mp71Context"><b>KARARIN ETKİSİ</b><p class="mini">Çok oyunculu teklif. Kabul: hükümler host\'ta mevcut işlem motoruyla (dealQuote / executeDeal) uygulanır; imza Etkisini gönderen öder, senden istenenler kabulde stokundan alınır. Ret: kaynak aktarımı veya anlaşma olmaz; gönderene "reddedildi" bildirimi gider. Karşı teklif: teklif "Karşı teklif gönderildi" olur, yeni şartlar gönderenin gelen kutusuna düşer (en çok 6 tur). Karşı tarafın stoğu sana gösterilmez; kabulde host denetler.</p></div>';};
  if(ad.role==='guest'){const dd0=UI.drawDeal;UI.drawDeal=function(){const r=dd0.apply(this,arguments);if(on())dealBox();return r;};}
  else installHost();
}
const API={attach,tick,sync,openSent,stateOf,stateText,why,CODE,STATE,AI_REPLY,get stats(){return M.stats;},get counter(){return M.counter;},_M:M};
globalThis.MP71Dip=API;if(typeof window!=='undefined')window.MP71Dip=API;
})();

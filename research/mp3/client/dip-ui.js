'use strict';
/* STARS MP.3 — diplomasi ekranı (misafir telefonu DİPLOMASİ sekmesi ve host'un küçük MP diplomasi paneli).
   Oyun motoru YOK ve kural kopyası YOK: veriler host'un oyuncuya özel `dip` görünümünden (dipView) gelir,
   maliyet/engel önizlemesi host'un dealQuote'undan (`quote` komutu), her karar host'ta executeDeal'dan geçer.
   Bu dosya yalnız arayüz durumu tutar: alt sekme, teklif taslağı, onay penceresi. */
(function(){
const RES=[['min','Mineral'],['ene','Enerji'],['yiy','Yiyecek'],['ala','Alaşım'],['tuk','Tüketim Malı'],['ara','Bilim'],['etk','Etki']];
const RN=Object.fromEntries(RES);
const PRESETS=[100,250,500,1000];
const ST={pending:'Bekliyor',accepted:'Kabul edildi',rejected:'Reddedildi',countered:'Karşı teklif verildi',expired:'Süresi doldu',invalid:'Geçersiz'};
const SUB=[['emp','DEVLETLER'],['in','GELEN'],['out','GÖNDERİLEN'],['hist','GEÇMİŞ']];
const CODE={'rules:no-target':'Bu devletle anlaşma yapılamaz (temas yok ya da anlaşma yapamıyor).','rules:too-many':'Bekleyen teklif sınırına ulaştın (8). Önce birini geri çek.',
  'rules:duplicate':'Aynı teklif zaten bekliyor.','rules:quote':'Teklif şu an uygulanamıyor.','rules:not-recipient':'Bu teklif için karar senin değil.',
  'rules:closed':'Bu teklif artık açık değil.','rules:expired':'Teklifin süresi doldu.','rules:round-limit':'Pazarlık tur sınırına ulaşıldı.','rules:not-sender':'Yalnız gönderen geri çekebilir.',
  'no-offer':'Teklif bulunamadı.','rules:invalid':'Taraflardan biri artık anlaşma yapamaz.','rules':'Anlaşma uygulanamadı; hiçbir şey değişmedi.','bad-params':'Geçersiz teklif.',
  paused:'Oyun duraklatıldı; işlem yapılmadı.','host-yok':'Host bağlı değil; işlem gönderilmedi.','not-started':'Oyun başlamadı.','error':'Host hata verdi; hiçbir şey değişmedi.',
  'stale-seq':'Eski komut yok sayıldı.',lost:'Bağlantı koptu; işlemin sonucu bilinmiyor. Listeyi kontrol et.','forged-empire':'Başka devlet adına işlem yapılamaz.'};
const AI={kabul:'kabul etti — anlaşma uygulandı',red:'reddetti',karsi:'karşı teklif verdi (GELEN)'};

function create(o){
  const doc=o.root.ownerDocument,esc=o.esc;
  const U={sub:'emp',draft:null,confirm:null,guard:0,dirty:true,last:'',stats:{renders:0,ms:[]},sent:0};
  const data=()=>o.data()||{};
  const dip=()=>data().dip||{offers:[],contacts:[],life:0,rounds:0};
  const me=()=>data().me||{id:-1,res:{}};
  const contact=id=>dip().contacts.find(c=>c.id===id);
  const name=(id,fallback)=>{const c=contact(id);return c?c.n:fallback||'?';};
  const incoming=()=>dip().offers.filter(x=>x.to===me().id&&x.status==='pending');
  const outgoing=()=>dip().offers.filter(x=>x.from===me().id&&x.status==='pending');
  const visibleContacts=()=>dip().contacts.filter(c=>!o.humansOnly||c.h);
  const itemText=it=>it.t==='res'?(+it.v)+' '+(RN[it.r]||it.r):it.l||(it.t==='peace'?'🕊 Barış':it.t);
  const items=(list,empty)=>list.length?'<ul class="mp3-items">'+list.map(it=>'<li>'+esc(it.l||itemText(it))+'</li>').join('')+'</ul>':'<div class="mp1-sub">'+esc(empty||'—')+'</div>';
  const days=x=>Math.max(0,Math.ceil(x.expires-(data().day||0)));
  const off=()=>!o.online();

  /* ---------- taslak ---------- */
  function newDraft(to,prev,give,want){U.draft={to,prev:prev||null,give:give||[],want:want||[],side:'give',res:'min',amt:'',preview:null,pkey:'',busy:false};U.sub='draft';}
  const dkey=d=>JSON.stringify([d.to,d.prev,d.give,d.want]);
  function addItem(d,side,it){const L=d[side];if(it.t==='res'){const x=L.find(y=>y.t==='res'&&y.r===it.r);if(x)x.v=Math.min(1e7,x.v+it.v);else L.push(it);}else if(!L.some(y=>y.t===it.t))L.push(it);d.preview=null;}
  function maxOf(r){return Math.max(0,Math.floor(me().res[r]||0));}

  function draftHtml(){
    const d=U.draft,c=contact(d.to),prev=d.prev&&dip().offers.find(x=>x.id===d.prev);
    const side=(k,title,hint)=>'<div class="mp3-side'+(d.side===k?' on':'')+'"><button class="mp3-sidebtn'+(d.side===k?' on':'')+'" data-d="side" data-side="'+k+'">'+title+'</button>'+
      '<div class="mp1-sub">'+esc(hint)+'</div>'+(d[k].length?'<ul class="mp3-items">'+d[k].map((it,i)=>'<li><span>'+esc(itemText(it))+'</span><button class="mp3-x" data-d="rm" data-side="'+k+'" data-i="'+i+'" aria-label="Çıkar">✕</button></li>').join('')+'</ul>':'<div class="mp1-sub">Henüz madde yok.</div>')+'</div>';
    const giveSide=d.side==='give',mx=giveSide?maxOf(d.res):0;
    const pv=d.preview,fresh=pv&&U.draft.pkey===dkey(d);
    return '<div class="mp1-card mp3-draft"><div class="mp1-h">'+(prev?'KARŞI TEKLİF — tur '+(prev.round+1)+'/'+dip().rounds:'TEKLİF HAZIRLA')+'</div>'+
      '<div class="mp3-to">Alıcı: <b>'+esc(c?c.n:name(d.to))+'</b>'+(c?(c.h?' <span class="mp1-tag">İNSAN</span>':' <span class="mp1-tag">AI</span>'):'')+'</div>'+
      side('give','BEN VERİYORUM','Kabul edilirse senden karşı tarafa geçer.')+side('want','BEN İSTİYORUM','Kabul edilirse karşı taraftan sana geçer.')+
      '<div class="mp3-add"><label class="mp1-l" for="mp3Res">'+(giveSide?'Vereceğin kaynak':'İstediğin kaynak')+'</label><select class="mp1-sel" id="mp3Res" data-d="res">'+
        RES.map(([k,n])=>'<option value="'+k+'"'+(k===d.res?' selected':'')+'>'+esc(n)+(giveSide?' (sende '+maxOf(k)+')':'')+'</option>').join('')+'</select>'+
      '<label class="mp1-l" for="mp3Amt">Miktar</label><input class="mp1-in mp3-amt" id="mp3Amt" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" maxlength="8" value="'+esc(d.amt)+'">'+
      '<div class="mp3-pre">'+PRESETS.map(v=>'<button data-d="pre" data-v="'+v+'"'+(giveSide&&v>mx?' disabled':'')+'>'+v+'</button>').join('')+
        '<button data-d="pre" data-v="max"'+(giveSide&&mx>0?'':' disabled')+' title="'+(giveSide?'Stoğun':'Karşı tarafın stoğu gizli')+'">MAKS</button></div>'+
      (giveSide?'':'<div class="mp1-sub">MAKS yalnız verirken: karşı tarafın stoğu sana gönderilmez.</div>')+
      '<button class="mp1-btn" data-d="add">EKLE</button>'+
      (c&&c.war&&c.peace&&!d.give.concat(d.want).some(x=>x.t==='peace')?'<button class="mp1-btn" data-d="addpeace">BARIŞ MADDESİ EKLE</button>':'')+'</div>'+
      '<div class="mp3-quote" id="mp3Quote">'+(fresh?quoteHtml(pv):'<div class="mp1-sub">Göndermeden önce ÖNİZLE: Etki maliyeti, süre ve engeller host\'un oyun motorundan gelir.</div>')+'</div>'+
      '<div class="mp1-row"><button class="mp1-btn" data-d="preview"'+(off()||!d.give.length&&!d.want.length||d.busy?' disabled':'')+'>ÖNİZLE</button>'+
      '<button class="mp1-btn pri" data-d="send"'+(off()||!fresh||!pv.ok||d.busy?' disabled':'')+'>GÖNDER</button></div>'+
      '<button class="mp1-btn" data-d="cancel">VAZGEÇ</button></div>';
  }
  function quoteHtml(q){
    return '<div class="mp1-card"><div>Etki maliyeti (gönderen öder): <b>'+(+q.cost)+'</b> · sende '+(+q.etk)+'</div><div>Geçerlilik: '+(+q.life)+' oyun günü</div>'+
      (q.ok?'<div class="mp3-ok">Engel yok. Kabul edilirse host motoru uygular.</div>':'<div class="bad">Engeller:</div><ul class="mp3-items bad">'+q.reasons.map(r=>'<li>'+esc(r)+'</li>').join('')+'</ul>')+'</div>';
  }

  /* ---------- listeler ---------- */
  function card(x,mode){
    const mine=x.from===me().id,other=mine?x.tn:x.fn;
    const head='<div class="mp3-oh"><b>'+esc(mine?'→ '+other:'← '+other)+'</b><span class="mp3-st s-'+esc(x.status)+'">'+esc(ST[x.status]||x.status)+'</span></div>'+
      '<div class="mp1-sub">#'+(+x.id)+' · tur '+(+x.round)+(x.prev?' · önceki #'+(+x.prev):'')+' · gün '+(+x.born)+(x.status==='pending'?' · '+days(x)+' gün kaldı':'')+(x.by==='ai'?' · AI teklifi':'')+'</div>';
    const terms=mine?'<div class="mp3-terms"><div><i>Sen veriyorsun</i>'+items(x.give)+'</div><div><i>Sen istiyorsun</i>'+items(x.want)+'</div></div>'
                    :'<div class="mp3-terms"><div><i>Sana verilecek</i>'+items(x.give)+'</div><div><i>Senden istenen</i>'+items(x.want)+'</div></div>';
    const cost='<div class="mp1-sub">Etki maliyeti: '+(+x.cost||0)+' (gönderen öder)'+(x.why?' · '+esc(x.why):'')+'</div>';
    let act='';
    if(mode==='in')act='<div class="mp1-row mp3-act"><button class="mp1-btn pri" data-d="ask" data-a="accept" data-id="'+(+x.id)+'"'+(off()?' disabled':'')+'>KABUL ET</button>'+
      '<button class="mp1-btn warn" data-d="ask" data-a="reject" data-id="'+(+x.id)+'"'+(off()?' disabled':'')+'>REDDET</button></div>'+
      (x.round<dip().rounds?'<button class="mp1-btn" data-d="counter" data-id="'+(+x.id)+'"'+(off()?' disabled':'')+'>KARŞI TEKLİF</button>':'<div class="mp1-sub">Tur sınırı: karşı teklif verilemez.</div>');
    if(mode==='out')act='<button class="mp1-btn" data-d="ask" data-a="withdraw" data-id="'+(+x.id)+'"'+(off()?' disabled':'')+'>GERİ ÇEK</button>';
    return '<div class="mp1-card mp3-offer" data-offer="'+(+x.id)+'">'+head+terms+cost+act+'</div>';
  }
  function empHtml(){
    const cs=visibleContacts();
    if(!cs.length)return '<div class="mp1-sub">'+(o.humansOnly?'Temas kurulan insan oyuncu yok. AI devletlerle diplomasi oyunun kendi DİPLOMASİ ekranında.':'Henüz temas kurulan devlet yok. Keşif sürdükçe komşularla temas kurulur.')+'</div>';
    return cs.map(c=>'<div class="mp1-card mp3-emp" data-emp="'+(+c.id)+'"><div class="mp3-oh"><b style="color:'+esc(o.color(c.col))+'">'+esc(c.n)+'</b><span class="mp1-tag">'+(c.h?'İNSAN':'AI')+'</span></div>'+
      '<div class="mp1-sub">'+(c.war?'<span class="bad">SAVAŞTA</span>':'Barış')+' · ilişki '+(+c.rel)+(c.bl?' · <span class="bad">doktrin anlaşmayı yasaklıyor</span>':'')+'</div>'+
      '<div class="mp1-row"><button class="mp1-btn pri" data-d="compose" data-to="'+(+c.id)+'"'+(off()||c.bl?' disabled':'')+'>TEKLİF HAZIRLA</button>'+
      (c.war?'<button class="mp1-btn" data-d="peace" data-to="'+(+c.id)+'"'+(off()||!c.peace?' disabled':'')+'>BARIŞ ÖNER</button>':'')+'</div>'+
      (c.war&&!c.peace?'<div class="mp1-sub">Barış şu an mümkün değil (doktrin ya da yasa).</div>':'')+'</div>').join('');
  }
  function listHtml(){
    const D=dip(),you=me().id,pend=incoming().length;
    const tabs='<div class="mp3-sub">'+SUB.map(([k,n])=>'<button data-d="sub" data-sub="'+k+'" class="'+(U.sub===k?'on':'')+'">'+n+(k==='in'&&pend?' <i class="mp3-badge">'+pend+'</i>':'')+'</button>').join('')+'</div>';
    let body='';
    if(U.sub==='emp')body=empHtml();
    else if(U.sub==='in')body=incoming().slice().reverse().map(x=>card(x,'in')).join('')||'<div class="mp1-sub">Bekleyen gelen teklif yok.</div>';
    else if(U.sub==='out')body=outgoing().slice().reverse().map(x=>card(x,'out')).join('')||'<div class="mp1-sub">Bekleyen gönderilmiş teklif yok.</div>';
    else body=D.offers.filter(x=>x.status!=='pending'&&(x.from===you||x.to===you)).slice().reverse().map(x=>card(x,'hist')).join('')||'<div class="mp1-sub">Henüz sonuçlanan teklif yok.</div>';
    return tabs+(off()?'<div class="mp1-status bad">Host bağlı değil: diplomasi işlemleri gönderilmez.</div>':'')+body+
      '<div class="mp1-sub mp3-foot">Teklifler oturumda tutulur (oyun kaydına girmez). Süre: '+(+D.life)+' oyun günü · en fazla '+(+D.rounds)+' tur.</div>';
  }

  /* ---------- çizim ---------- */
  function render(force){
    const t0=performance.now();
    const act=doc.activeElement;
    if(!force&&act&&o.root.contains(act)&&act.matches('input,select'))return void(U.dirty=true);   // yazarken/seçerken ekranı yeniden kurma
    if(U.draft&&U.sub==='draft'&&!contact(U.draft.to))U.draft=null,U.sub='emp';            // temas/devlet gitti
    if(U.sub==='draft'&&!U.draft)U.sub='emp';
    const html=U.sub==='draft'?draftHtml():listHtml();
    if(html!==U.last){o.root.innerHTML='<div class="mp3">'+html+'</div>';U.last=html;}
    U.dirty=false;U.stats.renders++;U.stats.ms.push(performance.now()-t0);if(U.stats.ms.length>200)U.stats.ms.shift();
    if(o.onBadge)o.onBadge(incoming().length);
  }

  /* ---------- onay penceresi (yanlış dokunmaya karşı) ---------- */
  function ask(kind,id){
    const x=dip().offers.find(y=>y.id===id);if(!x)return;
    const t={accept:'Teklif kabul edilsin mi? Host motoru maddeleri hemen uygular.',reject:'Teklif reddedilsin mi? Hiçbir kaynak taşınmaz.',withdraw:'Teklif geri çekilsin mi?'}[kind];
    const ok={accept:'EVET, KABUL ET',reject:'EVET, REDDET',withdraw:'GERİ ÇEK'}[kind];
    close();const el=doc.createElement('div');el.className='mp3-back';el.id='mp3Sheet';
    el.innerHTML='<div class="mp3-sheet" role="dialog" aria-modal="true"><div class="mp1-h">'+esc(kind==='withdraw'?'GERİ ÇEK':kind==='accept'?'KABUL':'RET')+'</div><div>'+esc(t)+'</div>'+
      '<div class="mp3-terms"><div><i>'+(x.from===me().id?'Sen veriyorsun':'Sana verilecek')+'</i>'+items(x.give)+'</div><div><i>'+(x.from===me().id?'Sen istiyorsun':'Senden istenen')+'</i>'+items(x.want)+'</div></div>'+
      '<div class="mp1-row"><button class="mp1-btn" data-s="no">VAZGEÇ</button><button class="mp1-btn '+(kind==='accept'?'pri':'warn')+'" data-s="ok" disabled>'+esc(ok)+'</button></div></div>';
    doc.body.appendChild(el);U.confirm={kind,id,el};
    setTimeout(()=>{const b=el.querySelector('[data-s="ok"]');if(b&&U.confirm&&U.confirm.el===el&&!off())b.disabled=false;},450);   // çift dokunuş onayı geçemez
    el.addEventListener('click',e=>{e.stopPropagation();e.preventDefault();const s=e.target.closest('[data-s]');
      if(s&&s.dataset.s==='ok'&&!s.disabled){const c=U.confirm;close();act(c.kind,c.id);}
      else if(!s||s.dataset.s==='no'){if(e.target===el||s)close();}});
  }
  function close(){if(U.confirm){U.confirm.el.remove();U.confirm=null;U.guard=performance.now()+400;return true;}return false;}   // kapanış dokunuşu alttaki düğmeye geçmez

  function act(kind,id){
    if(off())return o.toast(CODE['host-yok'],true);
    const cmd=kind==='withdraw'?{kind:'withdraw',offer:id}:{kind:'respond',offer:id,action:kind};
    send(cmd,r=>{if(r.status==='ok')o.toast(kind==='accept'?'Anlaşma uygulandı':kind==='reject'?'Teklif reddedildi':'Teklif geri çekildi');else fail(r);});
  }
  function fail(r){o.toast((CODE[r.code]||r.code)+(r.detail&&r.detail.length?' — '+r.detail.slice(0,2).join(' · '):''),true);}
  function send(cmd,done){U.sent++;const r=o.send(cmd,done);if(r&&r.ok===false){done({status:'rejected',code:r.why||r.code});}}

  function onClick(e){
    if(performance.now()<U.guard){e.preventDefault();e.stopPropagation();return;}
    const b=e.target.closest('[data-d]');if(!b||b.disabled)return;const a=b.dataset.d,d=U.draft;
    if(a==='sub'){U.sub=b.dataset.sub;render(true);}
    else if(a==='compose')newDraft(+b.dataset.to),render(true);
    else if(a==='peace'){newDraft(+b.dataset.to,null,[{t:'peace'}],[]);render(true);preview();}
    else if(a==='counter'){const x=dip().offers.find(y=>y.id===+b.dataset.id);if(x){const ok=it=>it.t==='res'||it.t==='peace',g=x.want.filter(ok).map(strip),w=x.give.filter(ok).map(strip);
      newDraft(x.from,x.id,g,w);render(true);if(g.length+w.length<x.give.length+x.want.length)o.toast('Kaynak ve barış dışındaki maddeler karşı teklife taşınmadı.',false);}}
    else if(a==='cancel'){U.draft=null;U.sub='emp';render(true);}
    else if(a==='side'&&d){d.side=b.dataset.side;render(true);}
    else if(a==='rm'&&d){d[b.dataset.side].splice(+b.dataset.i,1);d.preview=null;render(true);}
    else if(a==='pre'&&d){const v=b.dataset.v==='max'?maxOf(d.res):+b.dataset.v;d.amt=String(d.side==='give'?Math.min(v,maxOf(d.res)):v);render(true);}
    else if(a==='add'&&d){const v=Math.floor(+String(d.amt).replace(/[^0-9]/g,''));if(!(v>=1)){o.toast('Miktar 1 ya da daha büyük olmalı.',true);return;}
      addItem(d,d.side,{t:'res',r:d.res,v:Math.min(v,1e7)});d.amt='';render(true);}
    else if(a==='addpeace'&&d){addItem(d,'give',{t:'peace'});render(true);}
    else if(a==='preview'&&d)preview();
    else if(a==='send'&&d)submit();
    else if(a==='ask')ask(b.dataset.a,+b.dataset.id);
  }
  const strip=it=>it.t==='res'?{t:'res',r:it.r,v:+it.v}:{t:it.t};
  function preview(){const d=U.draft;if(!d||off())return;d.busy=true;const key=dkey(d);render(true);
    send({kind:'quote',to:d.to,give:d.give,want:d.want},r=>{if(U.draft!==d)return;d.busy=false;
      if(r.status==='ok'){d.preview=r.extra;d.pkey=key;}else{d.preview=null;fail(r);}render(true);});}
  function submit(){const d=U.draft;if(!d||off()||!d.preview||d.pkey!==dkey(d)||!d.preview.ok)return;d.busy=true;render(true);
    const cmd=d.prev?{kind:'counter',offer:d.prev,give:d.give,want:d.want}:{kind:'offer',to:d.to,give:d.give,want:d.want};
    send(cmd,r=>{d.busy=false;if(r.status!=='ok'){fail(r);render(true);return;}
      const c=contact(d.to);U.draft=null;
      if(r.extra&&r.extra.ai){o.toast((c?c.n:'AI')+' '+(AI[r.extra.ai]||r.extra.ai),r.extra.ai==='red');U.sub=r.extra.ai==='karsi'?'in':'hist';}
      else{o.toast(d.prev?'Karşı teklif gönderildi':'Teklif gönderildi');U.sub='out';}render(true);});}
  function onInput(e){const t=e.target,d=U.draft;if(!d)return;
    if(t.id==='mp3Amt'){const v=t.value.replace(/[^0-9]/g,'').slice(0,8);if(v!==t.value)t.value=v;d.amt=v;}
    else if(t.id==='mp3Res'){d.res=t.value;render(true);}}
  o.root.addEventListener('click',onClick,true);
  o.root.addEventListener('input',onInput);o.root.addEventListener('change',onInput);
  o.root.addEventListener('focusout',()=>setTimeout(()=>{if(U.dirty)render();},0));
  /* yazılım klavyesi: miktar alanı görünür kalsın */
  o.root.addEventListener('focusin',e=>{if(e.target.matches('input,select'))setTimeout(()=>e.target.scrollIntoView({block:'center'}),250);});
  if(window.visualViewport)visualViewport.addEventListener('resize',()=>{const a=doc.activeElement;if(a&&o.root.contains(a)&&a.matches('input'))a.scrollIntoView({block:'center'});});
  return {U,render,incoming,close,codes:CODE};
}
window.MP3Dip={create,CODE,RES};
})();

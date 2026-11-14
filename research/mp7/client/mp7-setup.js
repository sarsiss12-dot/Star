'use strict';
/* ═══ STARS MP.7 — tek oyunculu kurulum ekranıyla çok oyunculu devlet tasarımı ═══
   Kopya kurulum motoru YOK: aynı index.html #menu/#setup, aynı ui.js renderSetup + setupClickHandler, aynı CFG ve aynı
   kurallar (etik bütçesi, civic yuvası, özellik bütçesi, köken uyumu). Her telefon kendi sayfasında kendi CFG'sini düzenler;
   simülasyon başlamaz. Değişen yalnız son düğmenin anlamı: tek oyunculuda GALAKSİYİ YARAT → setupGame; burada
   DEVLETİ KAYDET (misafir: taslak host'a gider) / LOBİYE DÖN (host: taslak + galaksi ayarları lobide).
   - Misafir galaksi adımını görmez (galaksiyi host yönetir); host aynı GALAKSİ adımını kullanır.
   - Geri tuşu kurulumu kaydetmeden kapatır (lobi açık kalır). */
(function(){
const doc=document,$=id=>doc.getElementById(id);
const EMB=['shape','symbol','pattern','primary','secondary'];
const M={active:false,role:null,done:null,removed:null,hidden:[],obs:null,storeKey:null,swallow:0,ghostUntil:0};
const clean=s=>String(s||'').replace(/[\u0000-\u001f<>]/g,'').trim().slice(0,40);
/* CFG → taslak (host'un draftCheck'iyle aynı alanlar). Renk/amblem isteğe bağlı. */
function draft(){
  const d={name:clean(CFG.name)||'Yeni Hanedan',race:CFG.race,mizac:CFG.mizac,physio:CFG.physio||'humanoid',look:CFG.look||'humanoid',origin:CFG.origin||'standart',sigil:CFG.sigil||'simetrik',
    monoRes:CFG.monoRes||'min',portraitVariant:normalizePortraitVariant(CFG.portraitVariant),color:/^#[0-9a-f]{6}$/i.test(CFG.color||'')?CFG.color:null,
    ethics:Object.fromEntries(Object.keys(ETHICS).map(k=>[k,Math.round(+(CFG.ethics&&CFG.ethics[k])||0)])),civics:[...(CFG.civics||[])],traits:[...(CFG.traits||[])]};
  if(CFG.emblem&&typeof CFG.emblem==='object'){const e={};for(const k of EMB)if(typeof CFG.emblem[k]==='string')e[k]=CFG.emblem[k];if(Object.keys(e).length)d.emblem=e;}
  /* BETA-GALAXY.0: arma hiç düzenlenmediyse Görünüş önizlemesindeki varsayılan gönderilir (oyundaki arma önizlemeyle aynı) */
  else if(typeof normalizeEmblem==='function'){const n=normalizeEmblem(undefined,CFG.color||RACES[CFG.race].col,'setup');d.emblem={shape:n.shape,symbol:n.symbol,pattern:n.pattern,secondary:n.secondary};}
  return d;
}
/* kayıtlı taslağı (bu cihazda) kurulum durumuna geri yükle */
function apply(d){
  if(!d||typeof d!=='object')return;
  selectSetupDoctrine(Object.hasOwn(d,'mizac')?d.mizac:null);
  for(const k of ['name','race','mizac','physio','look','origin','sigil','monoRes','portraitVariant','color'])if(d[k]!==undefined&&d[k]!==null)CFG[k]=d[k];
  if(d.ethics)CFG.ethics={...CFG.ethics,...d.ethics};if(Array.isArray(d.civics))CFG.civics=[...d.civics];if(Array.isArray(d.traits))CFG.traits=[...d.traits];
  if(d.emblem)CFG.emblem={...d.emblem};CFG.ethLocked=true;
}
function load(key){try{return JSON.parse(localStorage.getItem(key))||null;}catch{return null;}}
function save(key,d){try{localStorage.setItem(key,JSON.stringify(d));}catch{}}
/* çizimden sonra: son düğmenin adı + MP başlığı; misafirde galaksi özet satırları ve SON KAYDI YÜKLE yok */
function adapt(){
  if(!M.active)return;const root=$('setup');if(!root)return;
  for(const b of root.querySelectorAll('[data-a="start"]'))b.textContent=M.role==='host'?'KAYDET VE LOBİYE DÖN':'DEVLETİ KAYDET';
  for(const b of root.querySelectorAll('[data-a="loadsave"]'))b.remove();
  if(M.role!=='host')for(const r of root.querySelectorAll('.summary .sumRow')){const t=(r.firstElementChild&&r.firstElementChild.textContent)||'';if(/Galaksi|Kriz|Konsey|AI /.test(t))r.remove();}
  /* üstte yalnız bilgi şeridi (düğme yok: sekme şeridinin yanında yanlış dokunmayla kurulum kapanmasın); VAZGEÇ son düğmelerin yanında */
  if(!root.querySelector('#mp7Head')){const h=doc.createElement('div');h.id='mp7Head';h.className='mp7-head';
    h.innerHTML='<b>ÇOK OYUNCULU — '+(M.role==='host'?'DEVLETİN VE GALAKSİ AYARLARI':'DEVLETİNİ TASARLA')+'</b><span>'+(M.role==='host'?'Galaksiyi sen yönetirsin; insan oyuncular AI sayısına eklenir.':'Seçimlerin yalnız senin devletin içindir; galaksiyi host ayarlar.')+'</span>';
    root.insertBefore(h,root.firstChild);}
  if(!root.querySelector('#mp7Cancel')){const row=[...root.querySelectorAll('.btnrow')].pop()||root;const b=doc.createElement('button');b.className='btn ghost';b.id='mp7Cancel';b.dataset.mp7='cancel';
    b.textContent='VAZGEÇ (KAYDETMEDEN LOBİYE DÖN)';row.appendChild(b);}
}
function open(opts){
  if(M.active)return;resetSetupNaming();M.active=true;M.role=opts.role;M.done=opts.done;M.storeKey=opts.storeKey||null;
  if(M.storeKey&&opts.restore)apply(load(M.storeKey));
  /* misafir: galaksi adımı yok (aynı STEPS dizisinden geçici çıkarılır, kapanınca geri konur) */
  if(M.role!=='host'){const i=STEPS.findIndex(s=>s.k==='galaksi');if(i>=0)M.removed=[i,STEPS.splice(i,1)[0]];}
  for(const id of ['mp1','mp6App','mp1Mini']){const el=$(id);if(el&&!el.classList.contains('mp7-hide')){el.classList.add('mp7-hide');M.hidden.push(el);}}
  SETUP_STEP=opts.step&&STEPS.some(s=>s.k===opts.step)?opts.step:STEPS[0].k;UI.setupError='';
  history.pushState({mp7:'setup'},'');
  if($('title')&&!$('title').classList.contains('hidden'))leaveTitle('setup');
  else{$('menu').classList.remove('hidden');$('game').classList.add('hidden');safeRenderSetup();}
  if(!M.obs){M.obs=new MutationObserver(()=>adapt());}M.obs.observe($('setup'),{childList:true});adapt();
}
function close(saved){
  if(!M.active)return;M.active=false;if(M.obs)M.obs.disconnect();
  if(M.removed){STEPS.splice(M.removed[0],0,M.removed[1]);M.removed=null;}
  $('menu').classList.add('hidden');
  for(const el of M.hidden)el.classList.remove('mp7-hide');M.hidden=[];
  const head=$('mp7Head');if(head)head.remove();
  const fn=M.done;M.done=null;if(saved&&fn)fn(draft());else if(fn&&fn.cancel)fn.cancel();
}
/* son düğme (GALAKSİYİ YARAT / VARSAYILANLARLA BAŞLA) MP kurulumundayken oyunu başlatmaz: taslağı kaydeder */
const sp=window.startGame;
window.startGame=function(){if(!M.active)return sp.apply(this,arguments);
  if(M.role==='host'){const why=setupSelectionError(CFG);if(why){UI.setupError=why;safeRenderSetup();return;}UI.setupError='';}
  const d=draft();if(M.storeKey)save(M.storeKey,d);M.swallow++;M.ghostUntil=Date.now()+700;history.back();close(true);};
/* MP.7.1: kurulum düğmeleri pointerup'ta çalışır (setupClickHandler); kurulum o anda kapanınca tarayıcının ardından ürettiği
   sentetik click AYNI noktadaki lobi düğmesine düşüyordu (yatay telefonda ODAYI KAPAT → "Oda kapatılsın mı?"). Kapanıştan sonraki
   700 ms içindeki tek sentetik tıklama yutulur (setupClickHandler'ın kendi 700 ms eşleşme penceresiyle aynı). */
doc.addEventListener('click',e=>{if(M.ghostUntil&&Date.now()<M.ghostUntil){M.ghostUntil=0;e.preventDefault();e.stopImmediatePropagation();}},true);
doc.addEventListener('click',e=>{if(e.target.closest('[data-mp7="cancel"]')){e.preventDefault();history.back();}},true);
/* geri tuşu: kurulum açıkken yalnız kurulumu kapatır; lobi/oda katmanlarının geri tuşu işleyicileri bu olayı görmez */
addEventListener('popstate',ev=>{if(M.swallow>0){M.swallow--;ev.stopImmediatePropagation();return;}if(M.active){ev.stopImmediatePropagation();close(false);}},true);
window.MP7Setup={open,close,draft,apply,get active(){return M.active;},get role(){return M.role;},
  /* lobi özeti: taslak kartı */
  card(c){if(!c)return '<span class="mp1-sub">devlet hazırlanıyor…</span>';const e=MP1View.esc;
    return '<b>'+e(c.n)+'</b><br><small class="mp1-sub">'+[c.doc,c.race,c.ph,c.org].filter(Boolean).map(e).join(' · ')+'</small>';}};
})();

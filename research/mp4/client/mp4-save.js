'use strict';
/* STARS MP.4 — çok oyunculu kayıtların telefonda saklanması (IndexedDB) ve dosya olarak dışa/içe aktarılması.
   Paketi üreten ve doğrulayan mp-core'dur (StarsMP.validatePackage); bu dosya yalnız depolar ve dosya işler.
   - Elle kayıt en çok 12; otomatik kayıt oyun başına son 3 (eskisi ancak yenisi yazıldıktan sonra silinir).
   - Yazma başarısızsa mevcut kayıtlar silinmez.
   - Dosya: tek JSON (.starsmp.json); Android Chrome'da indirme + dosya seçici ile çalışır, bilgisayar gerekmez. */
(function(){
const DB='stars-mp4',STORE='saves',MAX_MANUAL=12,MAX_AUTO=3;
let dbp=null;
function db(){
  if(dbp)return dbp;
  dbp=new Promise((res,rej)=>{let r;try{r=indexedDB.open(DB,1);}catch(e){return rej(e);}
    r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains(STORE)){const s=d.createObjectStore(STORE,{keyPath:'key'});s.createIndex('saveId','saveId');}};
    r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error||Error('idb'));r.onblocked=()=>rej(Error('idb-blocked'));});
  dbp.catch(()=>{dbp=null;});return dbp;
}
function tx(mode,fn){return db().then(d=>new Promise((res,rej)=>{const t=d.transaction(STORE,mode),s=t.objectStore(STORE);let out;
  Promise.resolve(fn(s,v=>{out=v;})).catch(rej);t.oncomplete=()=>res(out);t.onerror=()=>rej(t.error||Error('tx'));t.onabort=()=>rej(t.error||Error('abort'));}));}
const req=r=>new Promise((res,rej)=>{r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});
let chain=Promise.resolve();
async function putNow(pkgText,meta){
  const kind=meta.kind==='auto'?'auto':'manual',created=Date.now(),key=kind+':'+meta.saveId+':'+created;
  const all=await API.list();
  if(kind==='manual'&&all.filter(x=>x.kind==='manual').length>=MAX_MANUAL)return {ok:false,why:'full'};
  await tx('readwrite',async s=>{await req(s.put({key,saveId:meta.saveId,kind,created,display:meta.display,size:pkgText.length,text:pkgText}));});
  if(kind==='auto'){const old=(await API.list()).filter(x=>x.kind==='auto'&&x.saveId===meta.saveId).slice(MAX_AUTO);for(const x of old)await API.del(x.key);}   // yenisi yazıldıktan SONRA
  return {ok:true,key};
}
const API={
  async available(){try{await db();return true;}catch{return false;}},
  /* özet liste (metinsiz), yeni → eski */
  async list(){return tx('readonly',async(s,set)=>{const all=await req(s.getAll());set(all.map(({text,...x})=>x).sort((a,b)=>b.created-a.created));});},
  async get(key){return tx('readonly',async(s,set)=>{set(await req(s.get(key)));});},
  async del(key){return tx('readwrite',async s=>{await req(s.delete(key));});},
  /* pkgText: doğrulanmış paketin JSON metni; meta: {saveId, display, kind}. Yazmalar sıralı: otomatik kayıt sınırı yarışta aşılmaz. */
  put(pkgText,meta){const run=chain.then(()=>putNow(pkgText,meta));chain=run.catch(()=>{});return run;},
  idle(){return chain;},
  /* yalnız ASCII: Chromium ASCII dışı indirme adını "download" yapabiliyor (Türkçe harfler sadeleştirilir) */
  fileName(display){const TR={ğ:'g',ü:'u',ş:'s',ı:'i',ö:'o',ç:'c',Ğ:'g',Ü:'u',Ş:'s',İ:'i',Ö:'o',Ç:'c'};
    const n=String(display&&display.name||'galaksi').replace(/[ğüşıöçĞÜŞİÖÇ]/g,c=>TR[c]).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,32)||'galaksi';
    return 'stars-mp-'+n+'-y'+(+(display&&display.year)||0)+'-a'+(+(display&&display.month)||0)+'.starsmp.json';},
  /* dışa aktarma: Blob indirme (Android Chrome "İndirilenler"e yazar) */
  exportFile(pkgText,display){const blob=new Blob([pkgText],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=API.fileName(display);a.rel='noopener';document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove();},4000);return a.download;},
  readFile(file){return new Promise((res,rej)=>{if(!file)return rej(Error('no-file'));if(file.size>32e6)return rej(Error('too-big'));const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>rej(r.error||Error('read'));r.readAsText(file);});},
  limits:{MAX_MANUAL,MAX_AUTO}
};
window.MP4Save=API;
})();

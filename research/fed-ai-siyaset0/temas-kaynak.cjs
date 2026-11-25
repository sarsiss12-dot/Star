// node temas-kaynak.cjs <kök> <tohum> <ay> <çıkış.json>   [CAMP_SIZE · CAMP_AI]
// FED-AI-SİYASET.0 Faz D: yeni AI–AI temaslarını kuran varışın filo türü (bilim / silahlı / koloni / inşaat / ordu / diğer), hedef sistemin
// sahibi (kendi / karşı / sahipsiz) ve yıl; ayrıca mega yapı duyurusu (announceMega) ve ay başı yolları (ayrılıkçı doğuş, kriz, federasyon). Dünyaya yazmaz, RNG çekmez (arrive sarmalayıcısı yalnız sayar).
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,seed,months,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});
h.sb.SIZE=process.env.CAMP_SIZE||'ulu';h.sb.AIS=+(process.env.CAMP_AI||9);
h.run(`resetSetupNaming();Object.assign(CFG,{seed:${+seed},size:SIZE,aiCount:AIS});setupGame({...CFG});G.autoSave=false;
var K={byKind:{},byYear:{},byOwner:{}};const inc=(o,k,n=1)=>o[k]=(o[k]||0)+n;
const cnt=()=>{let n=0;for(const a of G.emps)if(a.ai&&!a.wild&&!a.dead)for(const b of G.emps)if(b!==a&&b.ai&&!b.wild&&!b.dead&&a.contact[b.id])n++;return n;};
{const f=arrive;arrive=function(fl,sys){const c0=cnt();const r=f.apply(this,arguments);const d=cnt()-c0;
 if(d>0){const kind=!fl||!fl.ships?'?':scienceExplorer(fl)?'bilim':fl.ord?'ordu':fl.ships.some(s=>s.c==='kol')?'koloni':fl.ships.some(s=>s.c==='ins')?'insaat':isArmed(fl)?'silahli':'diger';
  const s=typeof sys==='object'?sys:G.sys[sys];const own=!s||s.owner<0?'sahipsiz':s.owner===fl.e?'kendi':'karsi';
  inc(K.byKind,kind,d);inc(K.byOwner,own,d);inc(K.byYear,Math.floor(G.day/360),d);}return r;};}
{const f=announceMega;announceMega=function(b,s,k){const c0=cnt();const r=f.apply(this,arguments);const d=cnt()-c0;if(d>0){inc(K.byKind,'mega-duyuru',d);inc(K.byYear,Math.floor(G.day/360),d);(K.mega=K.mega||[]).push({d:Math.floor(G.day),by:b.id,key:k});}return r;};}
{const m0=monthTick;monthTick=function(){const c0=cnt();const r=m0.apply(this,arguments);const d=cnt()-c0;if(d>0)inc(K.byKind,'aybasi(ayrilik/kriz/fed)',d);return r;};}
var __m=()=>{const m=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<=m&&g++<200){G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>m)monthTick();}};`);
for(let m=1;m<=+months;m++)h.run('__m()');
const r=JSON.parse(h.run('(K.final=cnt(),JSON.stringify(K))'));fs.writeFileSync(out,JSON.stringify(r));console.log(path.basename(out),JSON.stringify(r));

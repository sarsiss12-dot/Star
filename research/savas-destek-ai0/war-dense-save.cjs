// node war-dense-save.cjs <kök> <giriş.save> <çıkış.save>  — SAVAŞ-DESTEK-AI.0 perf: savaş yoğun kayıt (kontrol kökü p54 ile üretilir).
// Doğal oyunda AI temasları seyrek (kampanyada ölçüldü): stres senaryosu için AI'lar arası temas açılır (yalnız perf kaydı). Sonra AI çiftleri arasında en çok 4 savaş açılır (motorun warAuthorize/declareWar yolu), savaşan her AI'ya
// temaslı bir müttefik bağlanır (yardım isteği / katılım yolları çalışsın); 2 ay ilerletilip kaydedilir. RNG motorun kendi akışı.
const fs=require('fs'),path=require('path');const {runtime}=require(path.resolve(__dirname,'../../tests/helpers/runtime'));
const [root,inp,out]=process.argv.slice(2);const h=runtime({root:path.resolve(root)});h.sb.S=fs.readFileSync(inp,'utf8');
const r=h.run(`(()=>{if(!deserialize(S))throw Error('load');G.autoSave=false;const ais=G.emps.filter(e=>e.ai&&!e.dead&&!e.wild&&!e.crisisSide&&!isPurifier(e));for(const a of ais)for(const b of ais)if(a!==b)a.contact[b.id]=true;let wars=0;const used=new Set();
 for(const a of ais)for(const b of ais){if(wars>=4||a===b||used.has(a.id)||!a.contact[b.id]||a.war[b.id]||a.ally[b.id]||!fedWarAllowed(a,b)||isVassal(a))continue;
  warAuthorize(a,b,{n:'perf'});declareWar(a,b);warAuthClear();if(a.war[b.id]){wars++;used.add(a.id);
   const fr=ais.find(o=>o!==a&&o!==b&&!used.has(o.id)&&b.contact[o.id]&&!o.war[a.id]&&!b.ally[o.id]);if(fr){b.ally[fr.id]=fr.ally[b.id]=true;b.rel[fr.id]=fr.rel[b.id]=Math.max(b.rel[fr.id]||0,70);}}}
 const m0=Math.floor(G.day/30);let g=0;while(Math.floor(G.day/30)<m0+2&&g++<400){const pm=Math.floor(G.day/30);G.day+=.5;dailyTick(.5);structTick(.5);colonyBuildTick(.5);if(Math.floor(G.day/30)>pm)monthTick();}
 return JSON.stringify({wars,open:(G.warLedger.fronts||[]).filter(f=>f.ended===null).length,day:Math.floor(G.day)});})()`);
fs.writeFileSync(out,h.run('serialize()'));console.log(r);

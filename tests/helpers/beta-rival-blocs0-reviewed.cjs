'use strict';
/* BETA-RIVAL-BLOCS.0 (p30 / MP.8.9b27) koruma adaptörü: ittifaksız kuruluş / üye kabulü metni, rakip blok AI'ı, dürüstlük ve söz
   bozma, savunma kaçışı, denge birliği bedeli, Rakip Doktrinler klavyesiz aralık, 0,05–0,15× çarpan, büyük bölge armaları ve koloni
   panelinden otomatik inşaat hunk'larını TAM METİNLE geri alır (p29 / MP.8.9b26 baytları, 03bdb9b). Zincirde en yeni adım;
   stripReviewedGalaxy önce bunu çağırır. Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./beta-rival-blocs0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedRival=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed RIVAL source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique RIVAL hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p29 restored');return source;};

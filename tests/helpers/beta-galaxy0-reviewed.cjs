'use strict';
/* BETA-GALAXY.0 (p29 / MP.8.9b26) koruma adaptörü: #41 (BETA-SP-MAP-WAR.0) birleşimi + galaksi şekilleri / rota denetimi / gezegen çarpanı /
   fizyoloji-arma / arka plan dönüşü / toprak paylaşımı erişimi / federal filo bölünme-birleşme hunk'larını TAM METİNLE geri alır
   (p28 / MP.8.9b25 baytları, 9d269ce). Zincirde en yeni adım; stripReviewedFedFleet önce bunu çağırır.
   Hash gevşetilmez: tanınmayan kaynak eski incelenmiş sürümlerden biri değilse durur. */
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),pins=require('./beta-galaxy0-reviewed.json'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
exports.stripReviewedGalaxy=(file,source)=>{const p=pins[file];if(!p)return source;const hash=sha(source);if(hash===p.beforeSha256)return source;
  if(hash!==p.afterSha256){const old=fs.readdirSync(__dirname).filter(f=>f.endsWith('-reviewed.json')).map(f=>JSON.parse(fs.readFileSync(path.join(__dirname,f),'utf8'))[file]).filter(Boolean);assert(old.some(p=>hash===p.beforeSha256||hash===p.afterSha256),file+' unreviewed GALAXY source');return source;}
  for(const h of p.hunks){assert.equal(source.split(h.after).length,2,file+' unique GALAXY hunk');source=source.replace(h.after,h.before);}
  assert.equal(sha(source),p.beforeSha256,file+' exact p28 restored');return source;};

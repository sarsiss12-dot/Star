'use strict';
// MP-EMIR-GUVENCE.0 değişikliklerini yalnızca sabitlenmiş aday baytlarından ayırır.
const assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const pins=require('./mp-emir-guvence0-reviewed.json');
const sha=source=>createHash('sha256').update(source).digest('hex');

exports.stripReviewedEmirGuvence0=(file,source)=>{
  source=require('./mp-pwa-surum0-reviewed.cjs').stripReviewedPwaSurum0(file,source);
  const pin=pins[file];
  if(!pin||sha(source)!==pin.afterSha256)return source;
  for(const {before,after} of pin.hunks){
    assert.equal(source.split(after).length,2,file+' unique MP-EMIR-GUVENCE.0 hunk');
    source=source.replace(after,before);
  }
  assert.equal(sha(source),pin.beforeSha256,file+' exact p40 restored');
  return source;
};

'use strict';
const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const pins=require('./beta-sp-map-war0-reviewed.json');

function stripReviewedSPMapWar(file,source){
  const pin=pins[file];
  if(!pin)return source;
  const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
  if(sha(source)!==pin.afterSha256)return source;
  for(const hunk of pin.hunks){
    assert.equal(source.split(hunk.after).length,2,file+' unique SP map/war hunk');
    source=source.replace(hunk.after,hunk.before);
  }
  assert.equal(sha(source),pin.beforeSha256,file+' exact P27 restored');
  return source;
}

module.exports={stripReviewedSPMapWar};

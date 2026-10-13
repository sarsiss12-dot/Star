'use strict';
const {createHash}=require('crypto');
// 91C sprite-prefix and fleet-drawing hashes remain frozen. The middle
// init/input segment now uses the reviewed 93A hash: only tap target intent
// changes. New behavior has dedicated tests; unrelated mutations still fail.
// Historical referans-sha.json is NOT rewritten to pretend map.js was unchanged.
function isMapInfrastructurePreserved(source){
  const helpers=source.indexOf('// 91D: Harita ve sistem paneli');
  const start=source.indexOf('  init(){');
  const regions=source.indexOf('  // Yalnız keşfedilmiş sistemlerin');
  const fleet=source.indexOf('  drawFleet(');
  const end=regions<0?source.indexOf('\n\n  draw(t){'):regions;
  const prefixEnd=helpers<0?source.indexOf('const View ='):helpers;
  if(prefixEnd<0||start<0||end<=start||fleet<=end)return false;
  const parts=[source.slice(0,prefixEnd),source.slice(start,end),source.slice(fleet)];
  const expected=['c5b7656a33fbdc1b23cc2177fcb50930db51c244ff3c9add34b375e709f37d7a',
    '9e915431e31e35e37501664c93a24fecd1f33f9c06273ccfb8380dc8c869d9f3',
    'e2c9620735812da81f74f3f9dbbd653d6afbfaf048c51a2cce468d09fe6fb6c6'];
  return parts.every((part,i)=>createHash('sha256').update(part.trimEnd()).digest('hex')===expected[i]);
}
module.exports={isMapInfrastructurePreserved};

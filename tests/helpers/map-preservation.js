'use strict';
const {createHash}=require('crypto');
// Frozen 91C source sections. 91D intentionally changes territory helpers and
// View.draw; the actual input/recovery/camera, sprite and fleet code stays locked.
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
    'cc1426a3972d1a9eb22022d6b96e2922df7a8c21eefb848affc4702235638a8c',
    'e2c9620735812da81f74f3f9dbbd653d6afbfaf048c51a2cce468d09fe6fb6c6'];
  return parts.every((part,i)=>createHash('sha256').update(part.trimEnd()).digest('hex')===expected[i]);
}
module.exports={isMapInfrastructurePreserved};

'use strict';
const {createHash}=require('crypto');
// 94C: sprite-prefix hash remains frozen. Authorized affine transform
// and screen-distance picking are covered by faz94c_camera_trade_test. Camera/input/frustum and fleet
// heading now use reviewed 94C hashes; dedicated gesture, inverse transform
// and native raster tests cover the authorized behavior changes.
// Historical referans-sha.json remains intact. Arbitrary changes still fail.
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
    'd9b200b1f3e6df1fb42e9ddb5c9d385928188781e71a86d8b1f9a9b87684f1f2',
    '3a9500d3af286a299bc8e783174af8d5a61e63c4bc607b44fd593e1ec64f6c65'];
  return parts.every((part,i)=>createHash('sha256').update(part.trimEnd()).digest('hex')===expected[i]);
}
module.exports={isMapInfrastructurePreserved};

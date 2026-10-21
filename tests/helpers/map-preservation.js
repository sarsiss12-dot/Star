'use strict';
const {createHash}=require('crypto');
// 96D: shared Canvas character portrait prefix is reviewed; camera/input/fleet pins unchanged.
// 95D: reviewed procedural emblem renderer and identity tap; dedicated identity,
// map, war-preview tests and existing negative guards cover the extensions.
// 94C: sprite-prefix hash remains frozen. Authorized affine transform
// and screen-distance picking are covered by faz94c_camera_trade_test. Camera/input/frustum and fleet
// heading now use reviewed 94D hashes; dedicated gesture, inverse transform
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
  const expected=['d828073fbddcaedcb411f1a853b20fcfe1e7b63fb9a4872daf8da02403c0ca06', '46c321133ccf37c51079522637bc8e839663ac09cfb3ae696ccc14000f03537b', '3a9500d3af286a299bc8e783174af8d5a61e63c4bc607b44fd593e1ec64f6c65'];
  return parts.every((part,i)=>createHash('sha256').update(part.trimEnd()).digest('hex')===expected[i]);
}
module.exports={isMapInfrastructurePreserved};

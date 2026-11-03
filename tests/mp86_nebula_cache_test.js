'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{runtime}=require('./helpers/runtime'),{harness}=require('./helpers/95e-fixture');
const {test,end}=harness();
const source=process.argv[2]?fs.readFileSync(process.argv[2],'utf8'):fs.readFileSync(path.join(__dirname,'../research/mp6/client/guest-stars.js'),'utf8').match(/\/\* MP\.8\.6 NEBULA PIXELS[\s\S]*?\/\* END MP\.8\.6 NEBULA PIXELS \*\//)[0];
const make=()=>{const h=runtime({native:true});h.run('var originalNebula=ART.nebula,calls=0;ART.nebula=function(){calls++;return originalNebula.apply(this,arguments)};');h.run(source);return h;};
const hash=b=>crypto.createHash('sha256').update(Buffer.from(b)).digest('hex');
test('native canvas pixels exactly match original across seed and dimensions; fresh canvas and RNG unchanged',()=>{
 const h=make();for(const [seed,w,hh] of [[1,128,128],[404,128,128],[-7,128,64],[22,32,32],[404,128,128]]){
  h.sb.args=[seed,w,hh];h.run('var rng0=RND_STATE,a=originalNebula(...args),b=ART.nebula(...args),c=ART.nebula(...args)');
  const bytes=x=>h.run(x+'.getContext("2d").getImageData(0,0,args[1],args[2]).data');assert.equal(hash(bytes('a')),hash(bytes('b')));assert.equal(hash(bytes('a')),hash(bytes('c')));assert(h.run('b!==c&&RND_STATE===rng0'));
 }
});
test('caller mutation/context clearing cannot poison cached pixels; cache keeps only last key',()=>{
 const h=make();h.run('var a=ART.nebula(1,32,32),n=calls;a.getContext("2d").clearRect(0,0,32,32);var b=ART.nebula(1,32,32),o=originalNebula(1,32,32)');
 assert.equal(hash(h.run('b.getContext("2d").getImageData(0,0,32,32).data')),hash(h.run('o.getContext("2d").getImageData(0,0,32,32).data')));assert(h.run('calls===n'));
 h.run('ART.nebula(2,32,32);ART.nebula(1,32,32)');assert(h.run('calls===n+2'));
});
test('canvas failure on cache hit falls back to original; oversized input is not retained',()=>{
 const h=make();h.run(`ART.nebula(1,32,32);var create=document.createElement.bind(document),fail=true;document.createElement=function(t){const c=create(t);if(t==='canvas'&&fail){fail=false;c.getContext=()=>null;}return c;};var a=ART.nebula(1,32,32);document.createElement=create;`);
 assert(h.run('a.width===32&&a.getContext("2d")!==null'));h.run('var n=calls;ART.nebula(3,257,257);ART.nebula(3,257,257)');assert(h.run('calls===n+2'));
});
end();

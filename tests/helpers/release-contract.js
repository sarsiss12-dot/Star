'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
// Version assertions follow the declared release, rather than pinning every
// historical regression to one obsolete cache name. The identifiers still
// have to agree with each other and with the actual executable sources.
const root=path.resolve(__dirname,'../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'RELEASE-MANIFEST.json'),'utf8'));
const build=manifest.build,cache=manifest.pwa_cache;
assert.equal(manifest.save_version,8);
assert.match(build,/^[0-9]+[a-z][0-9a-z]*$/);
assert.equal(cache,'stars-v'+build);
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const buildPattern=new RegExp("const BUILD_ID = '"+escape(build)+"';");
const cachePattern=new RegExp("const CACHE = '"+escape(cache)+"';");
assert.match(fs.readFileSync(path.join(root,'main.js'),'utf8'),buildPattern);
assert.match(fs.readFileSync(path.join(root,'sw.js'),'utf8'),cachePattern);
module.exports={build,cache,buildPattern,cachePattern,cacheNamePattern:new RegExp(escape(cache))};

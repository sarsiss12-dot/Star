'use strict';
// Reproducible read-only p21 control. Never checks out or edits the working tree.
const fs=require('fs'),path=require('path'),os=require('os'),cp=require('child_process'),assert=require('assert/strict');
const COMMIT='838f2c392b2cffa9198b88388d1f905e5c744604';let cached;
exports.commit=COMMIT;
exports.root=()=>{
 if(cached)return cached;
 if(process.env.STARS_CONTROL_ROOT){const p=path.resolve(process.env.STARS_CONTROL_ROOT);assert.equal(JSON.parse(fs.readFileSync(path.join(p,'RELEASE-MANIFEST.json'),'utf8')).build,'96h10p21');return cached=p;}
 const repo=path.resolve(__dirname,'../..'),read=f=>cp.execFileSync('git',['show',COMMIT+':'+f],{cwd:repo,maxBuffer:16*1024*1024}),manifest=JSON.parse(read('RELEASE-MANIFEST.json'));
 assert.equal(manifest.build,'96h10p21');const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-stability-p21-'));
 for(const f of[...Object.keys(manifest.files),'RELEASE-MANIFEST.json','research/mp0/mp-core.js']){const p=path.join(dir,f);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,read(f));}
 process.on('exit',()=>fs.rmSync(dir,{recursive:true,force:true}));return cached=dir;
};

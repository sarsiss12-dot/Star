'use strict';

const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const {createHash}=require('node:crypto');
const assert=require('node:assert/strict');

function withPinnedRuntime(commit,fn,extras=[]){
  const root=path.resolve(__dirname,'../..');
  const read=file=>execFileSync('git',['show',`${commit}:${file}`],{cwd:root,maxBuffer:4*1024*1024});
  const manifest=JSON.parse(read('RELEASE-MANIFEST.json'));
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'stars-pinned-'));
  try{
    for(const file of new Set([...Object.keys(manifest.files),...extras])){
      const bytes=read(file);
      if(Object.hasOwn(manifest.files,file))assert.equal(createHash('sha256').update(bytes).digest('hex'),manifest.files[file],`${commit}:${file}`);
      const target=path.join(dir,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    }
    return fn(dir);
  }finally{fs.rmSync(dir,{recursive:true,force:true});}
}

module.exports={withPinnedRuntime};

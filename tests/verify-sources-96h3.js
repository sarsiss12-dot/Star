'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'TEST-SOURCES-96H3.json'),'utf8'));
for(const [name,record] of Object.entries(manifest.files)){
 const file=path.join(root,name),bytes=fs.readFileSync(file);
 assert.equal(bytes.length,record.bytes,name+' size');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.sha256,name+' SHA-256');
}
const suites=fs.readdirSync(path.join(root,'tests')).filter(n=>n.endsWith('_test.js')).length;
assert.equal(suites,manifest.suiteCount,'complete suite inventory');
console.log(JSON.stringify({status:'PASS',suites,pinnedInputs:Object.keys(manifest.files).length,controlRuntimeCommit:manifest.canonicalRuntimeCommit}));

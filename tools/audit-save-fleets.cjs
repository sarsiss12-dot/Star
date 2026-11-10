#!/usr/bin/env node
'use strict';
// Read-only. Never writes/repairs the supplied file; never invents a past removal reason.
const fs=require('fs'),crypto=require('crypto');
const file=process.argv[2];if(!file){console.error('Usage: node tools/audit-save-fleets.cjs PRIVATE_SAVE [owner=0] [expected-sha256]');process.exit(2);}
const bytes=fs.readFileSync(file),sha256=crypto.createHash('sha256').update(bytes).digest('hex');
let crc=0xffffffff;for(const b of bytes){crc^=b;for(let k=0;k<8;k++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}const crc32=((crc^0xffffffff)>>>0).toString(16).padStart(8,'0').toUpperCase();
const d=JSON.parse(bytes),owner=Number(process.argv[3]||0);if(d.v!==8||!Array.isArray(d.fl)||!Array.isArray(d.sys))throw Error('Expected Save8 JSON');
const live=new Map(d.fl.filter(f=>f.ships?.length).map(f=>[f.id,f])),byOwner={};let missing=0;
for(const f of d.fl){const id=f.shipment?.fleet??f.joinFleet;if(id===undefined)continue;const target=live.get(id);if(!target||target.e!==f.e){missing++;byOwner[f.e]=(byOwner[f.e]||0)+1;}}
const jobs=[],groups={};for(const s of d.sys)for(const q of s.q||[]){if(q.e!==owner)continue;const delivery=Object.hasOwn(q,'delivery')?q.delivery:s.ry?.[owner];if(delivery?.fleet===undefined||live.get(delivery.fleet)?.e===owner)continue;jobs.push({system:s.i,cls:q.cls,left:q.left,paid:q.paid,target:delivery.fleet});groups[delivery.fleet]=(groups[delivery.fleet]||0)+1;}
const result={bytes:bytes.length,sha256,crc32,expectedSha256:process.argv[4]||null,shaMatches:process.argv[4]?sha256===process.argv[4]:null,version:d.v,day:d.day,year:d.year,month:d.month,seed:d.seed,systems:d.sys.length,empires:d.emps.length,fleets:d.fl.length,owner,ownerFleets:d.fl.filter(f=>f.e===owner).length,ownerShips:d.fl.filter(f=>f.e===owner).reduce((n,f)=>n+f.ships.length,0),missingTargets:{total:missing,byOwner},missingIds:{1:!live.has(1),1945:!live.has(1945)},orphanJobs:jobs.length,jobTargets:groups,recordedPaidAlloy:jobs.reduce((n,j)=>n+(Number.isFinite(j.paid?.ala)?j.paid.ala:0),0),historicalMainFleetCause:'BELIRLENEMEDI'};
console.log(JSON.stringify(result,null,2));if(result.shaMatches===false)process.exitCode=1;

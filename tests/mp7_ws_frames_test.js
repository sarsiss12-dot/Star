'use strict';
/* MP.7 — relay WebSocket çerçeve ayrıştırıcısı (research/mp0/server/dev-relay.js attach; relay.js aynı işlevi kullanır).
   Kök neden: aracı vekil (bulut platformu) büyük iletiyi parçalayınca (RFC 6455 5.4) eski ayrıştırıcı bağlantıyı 1003 ile
   kapatıyordu. Bu test sahte soketle gerçek çerçeve baytlarını besler: tek parça, parçalı + araya giren kontrol çerçevesi,
   bayt bayt bölünmüş akış, protokol hataları ve parçalar toplamı sınırı. */
const assert=require('assert/strict'),{EventEmitter}=require('events');
const {harness}=require('./helpers/95e-fixture'),{test,end}=harness();
const {attach}=require('../research/mp0/server/dev-relay.js');
function sock(){const s=new EventEmitter();s.out=[];s.ended=false;s.write=b=>{s.out.push(Buffer.from(b));return true;};s.end=()=>{s.ended=true;};s.destroy=()=>{};return s;}
function frame(fin,op,payload){const p=Buffer.from(payload),mask=Buffer.from([1,2,3,4]),len=p.length;let h;
  if(len<126)h=Buffer.from([(fin?0x80:0)|op,0x80|len]);else if(len<65536){h=Buffer.alloc(4);h[0]=(fin?0x80:0)|op;h[1]=0x80|126;h.writeUInt16BE(len,2);}
  else{h=Buffer.alloc(10);h[0]=(fin?0x80:0)|op;h[1]=0x80|127;h.writeBigUInt64BE(BigInt(len),2);}
  const b=Buffer.from(p);for(let i=0;i<b.length;i++)b[i]^=mask[i&3];return Buffer.concat([h,mask,b]);}
function wire(max){const s=sock(),got=[];let closed=0;const c=attach(s,t=>got.push(t),()=>closed++,max);c.id='t'+Math.random();return {s,got,c,closed:()=>closed,
  closeCode:()=>{const f=s.out.find(b=>(b[0]&0x0f)===8);return f?f.readUInt16BE(2):null;}};}
const big=n=>JSON.stringify({type:'mirror',full:'x'.repeat(n)});

test('tek parça metin çerçevesi aynen iletilir (eski davranış)',()=>{const w=wire();w.s.emit('data',frame(true,1,'{"a":1}'));assert.deepEqual(w.got,['{"a":1}']);assert.equal(w.closed(),0);});
test('parçalı mesaj (op=1 FIN=0, op=0 devam, son FIN=1) birleştirilir; araya giren ping yanıtlanır, pong yok sayılır; bağlantı açık kalır',()=>{
  const w=wire(),text=big(40000),parts=[text.slice(0,10000),text.slice(10000,25000),text.slice(25000)];
  w.s.emit('data',Buffer.concat([frame(false,1,parts[0]),frame(true,9,'p'),frame(false,0,parts[1]),frame(true,10,''),frame(true,0,parts[2])]));
  assert.deepEqual(w.got,[text]);assert.equal(w.closed(),0);assert(w.s.out.some(b=>(b[0]&0x0f)===10),'ping inside a fragmented message answered with pong');
  w.s.emit('data',frame(true,1,'sonraki'));assert.deepEqual(w.got,[text,'sonraki'],'next message after reassembly');});
test('akış TCP parçalarına bölünmüş gelse de (bayt bayt) parçalı mesaj doğru birleşir; UTF-8 çok baytlı karakter parça sınırında bölünür',()=>{
  const w=wire(),text='{"n":"Çağrı Şükrü İğdır '+'ğ'.repeat(300)+'"}',b=Buffer.from(text),cut=b.indexOf(Buffer.from('ğ'))+1;
  const all=Buffer.concat([frame(false,1,b.slice(0,cut)),frame(true,0,b.slice(cut))]);for(let i=0;i<all.length;i++)w.s.emit('data',all.slice(i,i+1));
  assert.deepEqual(w.got,[text]);});
test('protokol hataları: başlangıçsız devam, parçalı mesaj sürerken yeni metin, parçalı kontrol çerçevesi, 125 bayttan uzun ping → 1002; ikili → 1003',()=>{
  for(const [name,bytes,code] of [['cont',frame(true,0,'x'),1002],['interleave',Buffer.concat([frame(false,1,'a'),frame(true,1,'b')]),1002],
    ['ctlfrag',frame(false,9,'p'),1002],['bigping',frame(true,9,'x'.repeat(126)),1002],['binary',frame(true,2,'b'),1003]]){
    const w=wire();w.s.emit('data',bytes);assert.equal(w.closeCode(),code,name);assert.equal(w.got.length,0,name+' delivers nothing');}});
test('boyut sınırı parçaların TOPLAMINA uygulanır (küçük parçalarla sınır aşılamaz) → 1009; tek çerçeve sınırı da aynen',()=>{
  const w=wire(1000);w.s.emit('data',Buffer.concat([frame(false,1,'a'.repeat(600)),frame(false,0,'b'.repeat(300)),frame(true,0,'c'.repeat(300))]));
  assert.equal(w.closeCode(),1009);assert.equal(w.got.length,0);
  const v=wire(1000);v.s.emit('data',frame(true,1,'z'.repeat(1001)));assert.equal(v.closeCode(),1009);});
test('maskesiz istemci çerçevesi yine reddedilir (1002)',()=>{const w=wire();w.s.emit('data',Buffer.from([0x81,0x02,0x61,0x62]));assert.equal(w.closeCode(),1002);});
end();

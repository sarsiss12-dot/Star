'use strict';

const assert = require('node:assert/strict');

async function rivalLobby({pg, tap, wait, shot, lanes, code, mode}) {
  const H = pg.H;
  const result = [];
  const control = (action, value) => '#setup [data-a="'+action+'"][data-x="'+value+'"]';

  async function open() {
    await tap(H, '#mp7GalaxyBtn');
    await wait(H, () => document.querySelector('#rivalPresets'));
  }
  async function check(label, range, tension) {
    const room = await H.evaluate(() => MP1Host.lobby);
    const text = 'Rakip Doktrinler: '+label;
    for (const name of ['H', 'B', 'C']) {
      const p = pg[name];
      const packet = await wait(p, ({rev, text, name}) => {
        const lobby = name === 'H' ? MP1Host.lobby : MP1Join.lobby;
        return lobby?.rev === rev && document.querySelector('.mp1-rivals b')?.textContent === text ? lobby : false;
      }, {rev:room.rev, text, name});
      const view = await packet.jsonValue();
      await packet.dispose();
      assert.deepEqual(view.settings.aiRivals, range);
      assert.equal(view.settings.tension, tension);
      assert.equal(view.settings.aiCount, 9);
      if (name !== 'H') {
        assert.equal(Object.hasOwn(view.settings, 'seed'), false);
        assert.equal(view.empires.length, 0);
      }
    }
    result.push({label, range, tension, rev:room.rev});
  }
  async function save(label, range, tension) {
    await tap(H, '#setup [data-a="start"]');
    await wait(H, () => !MP7Setup.active);
    await check(label, range, tension);
  }

  await wait(H, () => MP1Host.host.canStart().ok);
  await check('Doğal');
  if (!mode) {
    await open();
    await tap(H, control('rivalPreset','custom'));
    await save('Özel · 0 AI', {min:0,max:0});
    for (const [preset, label, min, max] of [['az','Az',0,2],['orta','Orta',2,4],['cok','Çok',5,7]]) {
      await open();
      await tap(H, control('rivalPreset',preset));
      await save(label+' · '+min+'–'+max+' AI', {min,max});
    }
    await open();
    await tap(H, control('rivalPreset','auto'));
    await save('Doğal');
    await open();
    await tap(H, control('rivalPreset','orta'));
    await tap(H, control('rivalStep','min:1'));
    await tap(H, control('rivalStep','max:1'));
    await tap(H, control('tension','calkantili'));
    await save('Özel · 3–5 AI', {min:3,max:5}, 'calkantili');
    for (const name of ['H','B','C']) {
      await pg[name].locator('.mp1-rivals').scrollIntoViewIfNeeded();
      await shot(pg[name], name+'-3-5');
    }
    for (const name of ['B','C']) await tap(pg[name], '#jReady');
    await wait(H, () => MP1Host.host.canStart().ok);
    const before = await H.evaluate(() => MP1Host.lobby);
    const bad = [{min:-1,max:2},{min:4,max:2},{min:2,max:10},{min:1.5,max:3},
      {min:'1',max:3},null,{min:0,max:3,extra:true},[0,3],{min:0}];
    const replies = await H.evaluate(ranges => ranges.map(aiRivals =>
      MP1Host.host.configure({...MP1Host.lobby.settings,aiRivals})), bad);
    assert.deepEqual(replies, bad.map(() => ({ok:false,why:'bad-settings'})));
    assert.deepEqual(await H.evaluate(() => MP1Host.lobby), before);
    assert.equal(await H.evaluate(() => G.day || 0), 0);
    await pg.B.evaluate(() => MP1Join.sendRaw({v:1,type:'configure',settings:{aiRivals:{min:0,max:0}}}));
    await wait(pg.B, () => MP1Join.errors.includes('bad-message'));
    await open();
    for (let i=0;i<5;i++) await tap(H, control('aiCount','-1'));
    assert.equal(await H.locator('#rivalMaxVal').textContent(), '4');
    await tap(H, control('rivalPreset','auto'));
    await tap(H, control('tension','sakin'));
    await tap(H, '#mp7Cancel');
    await check('Özel · 3–5 AI', {min:3,max:5}, 'calkantili');
    assert.equal(await H.evaluate(() => MP1Host.host.canStart().ok), true);
    await lanes.B.down();
    await wait(H, () => MP1Host.lobby.players.some(p=>!p.host&&!p.online));
    await lanes.B.up();
    await wait(H, () => MP1Host.lobby.players.every(p=>p.online));
    assert.equal(await pg.B.evaluate(() => MP1Join.code), code);
    await check('Özel · 3–5 AI', {min:3,max:5}, 'calkantili');
    result.push({invalid:bad, reconnected:true, cancelPreserved:true});
  }

  if (mode !== 'natural') {
    await open();
    await tap(H, control('rivalPreset','orta'));
    if (mode !== 'medium') {
      await tap(H, control('rivalStep','min:1'));
      await tap(H, control('rivalStep','max:-1'));
    }
    if (!mode) await tap(H, control('tension','dengeli'));
    await save(mode==='medium'?'Orta · 2–4 AI':'Özel · 3 AI', mode==='medium'?{min:2,max:4}:{min:3,max:3});
  }
  for (const name of ['B','C']) {
    if (await pg[name].locator('#jReady').textContent() === 'HAZIRIM') await tap(pg[name], '#jReady');
  }
  return result;
}

module.exports = rivalLobby;

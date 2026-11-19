'use strict';

const fs = require('node:fs');
const path = require('node:path');

module.exports = async ({ test, pg, metrics, out, sleep, assert, lanes, wait, tap, settle, syncCheck }) => {
  const host = pg.H, b = pg.B, c = pg.C;
  const ids = await Promise.all([b, c].map(page => page.evaluate(() => MP1Join.empireId)));
  const proof = metrics.border = { states: [], ids };
  let fixture;
  async function compare(label) {
    await syncCheck(label);
    const states = [];
    for (const [page, id] of [[b, ids[0]], [c, ids[1]]]) {
      const expected = await host.evaluate(e => __mp8.mirrorOf(e), id);
      await wait(page, rev => MP6Stars.S.appliedRev === rev, expected.rev);
      const observed = await page.evaluate(async capture => {
        const json = __canon(MP6Stars.S.mirror);
        return { sha: await __sha(json), day: G.day, speed: G.speed, ...(capture ? { json } : {}) };
      }, process.env.STARS_H_RAW === '1');
      assert.equal(observed.sha, expected.sha, label + ' tam ayna');
      assert.equal(observed.speed, 0, label + ' misafir simülasyon yürütmüyor');
      if (observed.json) fs.writeFileSync(path.join(out, label + '-' + id + '.json'), observed.json);
      states.push({ id, sha: observed.sha, day: observed.day });
    }
    proof.states.push({ label, guests: states });
  }

  await test('H1 aynı gün: keşif, müttefik sensörü, rota ve takviye iki misafire yetkili aynadan yansır', async () => {
    fixture = await host.evaluate(([b, c]) => {
      if (G.day !== 0) throw Error('Host başlangıçta duraklatılmalı, gün ' + G.day);
      const e = G.emps[b], ally = G.emps[c], yard = G.sys[e.home];
      const hidden = humanVisionContext(e).visible;
      const remote = [...nativeSensorVision(ally)].find(id => !hidden.has(id));
      if (!Number.isInteger(remote)) throw Error('Paylaşım için ayrı sensör alanı yok');
      const enemy = G.emps.find(x => x.ai && !x.wild && !x.crisisSide && !x.dead);
      e.war[enemy.id] = enemy.war[b] = true;
      const threat = newFleet(enemy, remote, [{c:'kor'}], 'Uzak hedef');
      if (reinforcementThreats(e).armed.has(remote)) throw Error('Gizli filo tehdit sayıldı');
      e.ally[c] = ally.ally[b] = true;
      (e.shareVis ||= {})[c] = true;
      if (!reinforcementThreats(e).armed.has(remote)) throw Error('Paylaşılan filo tehdidi kayıp');
      for (const key of ['min','ala','ene']) e.res[key] = 20000;
      const scout = G.fleets.find(f => f.e === b && scienceExplorer(f));
      if (!scout) throw Error('Keşif filosu yok');
      scout.auto = true;
      scout.explore = null;
      scout.path = [];
      autoExploreTick(b);
      if (!scout.explore || !scout.path.length) throw Error('Otomatik keşif rotası kurulmadı');
      const fleet = newFleet(e, yard.id, [{c:'kor'},{c:'kor'}], 'Sınır filosu');
      if (!yard.lanes.some(target => orderMove(fleet, target))) throw Error('Sınır filosu rotası yok');
      if (!setFleetTemplate(e, fleet, {kor:3}, false).ok || !reinforceFleet(e, fleet).ok) throw Error('Takviye siparişi yok');
      const shipment = G.sys.flatMap(s => s.queue).find(q => q.delivery?.fleet === fleet.id);
      if (!shipment) throw Error('Host takviye kuyruğu boş');
      MP1Host.host.publish();
      return {b,c,yard:yard.id,remote,threat:threat.id,scout:scout.id,scoutRoute:[...scout.path],
        fleet:fleet.id,route:[...fleet.path],queueClass:shipment.cls};
    }, ids);
    await compare('paylaşım-ve-sipariş');
    const view = await b.evaluate(f => {
      const scout = G.fleets.find(x => x.id === f.scout), fleet = G.fleets.find(x => x.id === f.fleet);
      return {visible:G.vis.has(f.remote), threat:G.fleets.some(x => x.id === f.threat),
        scout:scout?.path, route:fleet?.path,
        queued:G.sys.some(s => s.queue.some(q => q.delivery?.fleet === f.fleet))};
    }, fixture);
    assert.deepEqual(view, {visible:true,threat:true,scout:fixture.scoutRoute,route:fixture.route,queued:true});
    proof.fixture = fixture;
    proof.visible = view;
    proof.secondGuestSeesNativeSystem = await c.evaluate(f => G.vis.has(f.remote), fixture);
    assert(proof.secondGuestSeesNativeSystem);
    await host.evaluate(f => {
      for (const s of G.sys) for (const q of s.queue) if (q.delivery?.fleet === f.fleet) q.left = 0;
      MP1Host.advance(.5);
    }, fixture);
    await compare('yarım-gün-takviye');
    proof.shipmentAfterStep = await host.evaluate(f => G.fleets
      .filter(x => x.shipment?.fleet === f.fleet).map(x => ({id:x.id, path:x.path, status:x.shipment.state})), fixture);
    assert.equal(proof.shipmentAfterStep.length, 1, 'takviye motor adımında üretildi');
    assert(await b.evaluate(f => G.fleets.some(x => x.shipment?.fleet === f.fleet), fixture), 'takviye B aynasında');
  });

  await test('H2 yeniden bağlanma ve tersane: bir satır ve bir kesinti', async () => {
    assert(fixture, 'H1 gerekli');
    await b.evaluate(() => { window.preBorderSocket = MP1Join.ws; });
    await lanes.B.down();
    try { await wait(b, () => MP1Join.ws !== preBorderSocket || preBorderSocket.readyState !== 1); }
    finally { await lanes.B.up(); }
    await wait(b, id => MP1Join.ws !== preBorderSocket && MP1Join.ws?.readyState === 1 &&
      MP1Join.hostOnline && MP1Join.assigned && MP1Join.empireId === id, ids[0]);
    await compare('yeniden-bağlandı');

    const yard = () => b.evaluate(sid => {
      UI.closeModal();
      View.sel = null;
      View.selSys = G.sys[sid];
      UI.tab('sistem');
      UI.refresh();
      return [...document.querySelectorAll('#panel .shipCancelBtn')]
        .filter(x => x.getAttribute('aria-label')?.startsWith(SHIPS.kor.n)).length;
    }, fixture.yard);
    const authoritative = () => host.evaluate(f => ({
      count:G.sys[f.yard].queue.filter(q => q.e === f.b && q.cls === 'kor').length,
      stock:{...G.emps[f.b].res}, price:shipCost(G.emps[f.b], 'kor')
    }), fixture);
    const before = await authoritative(), rows = await yard();
    const replies = await b.evaluate(() => MP1Join.results.length);
    await tap(b, `#panel [data-a="ship"][data-x="${fixture.yard}:kor"]`);
    await wait(b, n => MP1Join.results.slice(n).some(r => r.status === 'ok'), replies);
    await settle('tersane');
    await sleep(100);
    const after = await authoritative(), guestRows = await yard();
    assert.equal(after.count, before.count + 1);
    assert.equal(guestRows, rows + 1);
    const spent = Object.fromEntries(Object.keys(before.price).map(key => [key, before.stock[key] - after.stock[key]]));
    for (const [key, price] of Object.entries(before.price)) assert(Math.abs(spent[key] - price) < 1e-7);
    proof.order = { hostRows:[before.count, after.count], guestRows:[rows, guestRows], spent, price:before.price };
    await compare('tersane-sonrası');
  });
};

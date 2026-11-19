'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');

const arms = process.argv.slice(2).map(file => JSON.parse(fs.readFileSync(file, 'utf8')));
assert.equal(arms.length, 2, 'p43 ve aday H senaryosu gerekli');
for (const result of arms) {
  assert.equal(result.results.length, 3);
  assert(result.results.every(test => test.status === 'PASS'));
  assert.equal(result.metrics.actualWorld.systems, 500);
  assert.equal(result.metrics.conf.ai, 16);
  assert.equal(result.metrics.conf.guests, 2);
  assert.deepEqual(result.metrics.errors, []);
  assert(result.metrics.sync.every(row => row.mirrorEq && !row.diff.length && !row.leak.length));
  assert.equal(result.metrics.border.states.length, 4);
}
assert.deepEqual(arms[0].metrics.border, arms[1].metrics.border, 'Aynı dünya adımındaki iki misafir aynası');
console.log(JSON.stringify({equal:true, ...arms[1].metrics.border}, null, 2));

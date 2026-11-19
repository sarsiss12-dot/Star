'use strict';
// Tarihsel koruma testlerine onaylı p44 ve p43 farklarını tam baytlarıyla geri alır.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const steps = [require('./ai-ikame0-reviewed.json'), ...require('./perf-sinir0-reviewed.json')];
const sha = source => createHash('sha256').update(source).digest('hex');

exports.stripReviewedPerfSinir0 = (file, source) => {
  for (const pins of steps) {
    const pin = pins[file];
    if (!pin || sha(source) !== pin.afterSha256) continue;
    for (const { before, after } of pin.hunks) {
      assert.equal(source.split(after).length, 2, file + ' tek koruma bloğu');
      source = source.replace(after, () => before);
    }
    assert.equal(sha(source), pin.beforeSha256, file + ' önceki kaynak baytları');
  }
  return source;
};

'use strict';
// SAHA-GÜVENCE.1 (p49 / MP.8.9b48): onaylı p49 farklarını tam baytlarıyla p48 (347ef0d) kaynağına geri alır.
// Zincir: stripReviewedSahaEntegre0 önce bunu çağırır; ardından p48 ve daha eski adaptörler aynen sürer.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const pins = require('./saha-guvence1-reviewed.json');
const sha = source => createHash('sha256').update(source).digest('hex');
exports.stripReviewedSahaGuvence1 = (file, source) => {
  const pin = pins[file];
  if (!pin || sha(source) !== pin.afterSha256) return source;
  for (const { before, after } of pin.hunks) {
    assert.equal(source.split(after).length, 2, file + ' tek SAHA-GÜVENCE.1 bloğu');
    source = source.replace(after, () => before);
  }
  assert.equal(sha(source), pin.beforeSha256, file + ' p48 kaynak baytları');
  return source;
};

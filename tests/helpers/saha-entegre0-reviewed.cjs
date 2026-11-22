'use strict';
// SAHA-ENTEGRE.0 (p48 / MP.8.9b47): onaylı p48 farklarını tam baytlarıyla p47 (8984b51) kaynağına geri alır.
// Zincir: stripReviewedPerfSinir0 önce bunu çağırır; ardından p44/p43 ve daha eski adaptörler aynen sürer.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const pins = require('./saha-entegre0-reviewed.json');
const sha = source => createHash('sha256').update(source).digest('hex');
exports.stripReviewedSahaEntegre0 = (file, source) => {
  source = require('./saha-guvence1-reviewed.cjs').stripReviewedSahaGuvence1(file, source);   // SAHA-GÜVENCE.1 p49 önce
  const pin = pins[file];
  if (!pin || sha(source) !== pin.afterSha256) return source;
  for (const { before, after } of pin.hunks) {
    assert.equal(source.split(after).length, 2, file + ' tek SAHA-ENTEGRE.0 bloğu');
    source = source.replace(after, () => before);
  }
  assert.equal(sha(source), pin.beforeSha256, file + ' p47 kaynak baytları');
  return source;
};

'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const pins = require('./beta-mobile-hud0-reviewed.json');

const hash = source => createHash('sha256').update(source).digest('hex');

exports.stripReviewedMobileHud0 = (file, source) => {
  const pin = pins[file];
  if (!pin || hash(source) !== pin.afterSha256) return source;
  for (const { before, after } of pin.hunks) {
    assert.equal(source.split(after).length, 2, file + ' tekil MOBILE-HUD.0 yaması');
    source = source.replace(after, before);
  }
  assert.equal(hash(source), pin.beforeSha256, file + ' p25 kaynak eşitliği');
  return source;
};

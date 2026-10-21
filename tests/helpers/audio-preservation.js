'use strict';
// 96D explicitly authorizes the bounded tonal Web Audio revision. Historical hashes remain intact.
const {createHash}=require('crypto');
exports.isReviewedAudio=source=>createHash('sha256').update(source).digest('hex')==='6ddf6e388fa404394fee6220c2bfeeb3d1f9601c51a35ccdfe3181a8781942f7';

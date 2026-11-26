'use strict';

// Preload only for the negative control. Leave the real inbox.js and all
// other browser dependencies intact, removing only its HTML entry.
const fs = require('node:fs');
const path = require('node:path');
const index = path.resolve('index.html');
const read = fs.readFileSync;
fs.readFileSync = function (file, ...args) {
  const text = read.call(this, file, ...args);
  if (typeof file !== 'string' || path.resolve(file) !== index || typeof text !== 'string') return text;
  return text.replace(/<script src="inbox\.js"><\/script>/, '');
};

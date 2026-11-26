'use strict';

const fs = require('node:fs');
const path = require('node:path');

// The game uses ordered classic scripts sharing one global scope. Keep the
// legacy DOM fixtures, but give them the same files and order as index.html.
function loadBrowserScripts(root, run) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const tags = html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<script\b[^>]*\ssrc\s*=\s*(["'])([^"']+)\1[^>]*>/gi);
  const files = Array.from(tags, tag => tag[2]);
  if (!files.length) throw new Error('index.html içinde oyun betiği bulunamadı');
  for (const file of files) {
    if (!/^[\w-]+\.js$/.test(file)) throw new Error(`Desteklenmeyen oyun betiği: ${file}`);
    run(fs.readFileSync(path.join(root, file), 'utf8'), {filename: file});
  }
}

module.exports = {loadBrowserScripts};

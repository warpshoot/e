#!/usr/bin/env node
'use strict';

// Regenerates manifest.json from the image files (PNG/JPG/JPEG) in images/.
// Entries are sorted by filename in descending order so the newest
// (YYYYMMDD-HHMM named) image comes first.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');
const MANIFEST_PATH = path.join(ROOT, 'manifest.json');

const NAME_RE = /^(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(?:-\d+)?\.(?:png|jpe?g)$/i;

function timestampFromName(name) {
  const m = NAME_RE.exec(name);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return `${y}-${mo}-${d}T${h}:${mi}:00`;
}

function main() {
  let files = [];
  try {
    files = fs.readdirSync(IMAGES_DIR);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  const entries = files
    .filter((f) => { const e = f.toLowerCase(); return e.endsWith('.png') || e.endsWith('.jpg') || e.endsWith('.jpeg'); })
    .sort((a, b) => (a < b ? 1 : a > b ? -1 : 0))
    .map((filename) => ({ filename, timestamp: timestampFromName(filename) }));

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(entries, null, 2) + '\n');
  console.log(`manifest.json: ${entries.length} image(s)`);
}

main();

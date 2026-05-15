#!/usr/bin/env node
'use strict';

// Renames PNG files in images/ that do not yet follow the
// YYYYMMDD-HHMM(-N).png convention. The target timestamp is the time the
// file was first added to git (its "upload time"); if that cannot be
// determined, the file's mtime is used as a fallback. Renames are done
// with `git mv` so they are staged for the auto-commit step.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'images');

const NAME_RE = /^\d{8}-\d{4}(?:-\d+)?\.png$/i;

function pad(n) {
  return String(n).padStart(2, '0');
}

function baseName(date) {
  return (
    `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
    `-${pad(date.getHours())}${pad(date.getMinutes())}`
  );
}

function addedTime(relPath) {
  try {
    const out = execFileSync(
      'git',
      ['log', '--diff-filter=A', '--follow', '--format=%aI', '-1', '--', relPath],
      { cwd: ROOT, encoding: 'utf8' }
    ).trim();
    if (out) return new Date(out);
  } catch {
    /* fall through to mtime */
  }
  return fs.statSync(path.join(ROOT, relPath)).mtime;
}

function main() {
  let files;
  try {
    files = fs.readdirSync(IMAGES_DIR);
  } catch (err) {
    if (err.code === 'ENOENT') return;
    throw err;
  }

  const pngs = files.filter((f) => f.toLowerCase().endsWith('.png'));
  const taken = new Set(pngs.filter((f) => NAME_RE.test(f)));
  const renames = [];

  for (const file of pngs) {
    if (NAME_RE.test(file)) continue;

    const relPath = path.posix.join('images', file);
    const base = baseName(addedTime(relPath));

    let candidate = `${base}.png`;
    let n = 2;
    while (taken.has(candidate)) {
      candidate = `${base}-${n}.png`;
      n += 1;
    }
    taken.add(candidate);

    execFileSync('git', ['mv', relPath, path.posix.join('images', candidate)], {
      cwd: ROOT,
    });
    renames.push([file, candidate]);
  }

  if (renames.length === 0) {
    console.log('rename-images: nothing to rename');
  } else {
    for (const [from, to] of renames) console.log(`rename-images: ${from} -> ${to}`);
  }
}

main();

import { readFileSync, writeFileSync, renameSync, readdirSync } from 'fs';
import { join } from 'path';

const assetsDir = 'assets';
const htmlFile = 'index.html';

let html = readFileSync(htmlFile, 'utf8');

const files = readdirSync(assetsDir).filter(f => !f.includes('.'));

let renamed = 0;

for (const file of files) {
  const fullPath = join(assetsDir, file);
  const buf = readFileSync(fullPath);

  let ext = '';

  // Detect by magic bytes / content
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    ext = '.png';
  } else if (buf[0] === 0xff && buf[1] === 0xd8) {
    ext = '.jpg';
  } else if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46) {
    ext = '.gif';
  } else if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) {
    ext = '.webp';
  } else {
    // Try text-based formats
    const text = buf.slice(0, 512).toString('utf8');
    if (text.includes('<svg') || text.includes('<?xml')) {
      ext = '.svg';
    } else if (text.startsWith('{') || text.startsWith('[')) {
      ext = '.json';
    }
  }

  if (!ext) {
    console.log(`? could not detect type for ${file}`);
    continue;
  }

  const newName = file + ext;
  const newPath = join(assetsDir, newName);

  renameSync(fullPath, newPath);

  // Update all references in HTML
  const oldRef = `assets/${file}`;
  const newRef = `assets/${newName}`;
  if (html.includes(oldRef + '"') || html.includes(oldRef + "'")) {
    html = html.replaceAll(oldRef, newRef);
    console.log(`✓ ${file} → ${newName}`);
    renamed++;
  } else {
    console.log(`✓ renamed ${file} → ${newName} (no HTML ref found)`);
    renamed++;
  }
}

writeFileSync(htmlFile, html, 'utf8');
console.log(`\nDone: ${renamed} files renamed, index.html updated`);

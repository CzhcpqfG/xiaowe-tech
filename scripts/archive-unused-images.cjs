const fs = require('fs');
const path = require('path');

const publicImages = path.join(__dirname, '../public/images');
const srcDir = path.join(__dirname, '../src');
const indexHtml = path.join(__dirname, '../index.html');
const docsMetaImages = path.join(__dirname, '../docs/_metadata/images');

function collectFiles(dir) {
  const result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...collectFiles(full));
    } else {
      result.push(full);
    }
  }
  return result;
}

const imageFiles = collectFiles(publicImages).map((p) => ({
  full: p,
  rel: path.relative(publicImages, p).replace(/\\/g, '/'),
}));

const srcFiles = collectFiles(srcDir).filter((p) =>
  /\.(ts|tsx|js|jsx|json|md)$/.test(p)
);
srcFiles.push(indexHtml);

const refs = new Set();
const regex = /"(\/images\/[^"]+)"|'(\/images\/[^"']+)'/g;
for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let m;
  while ((m = regex.exec(content))) {
    refs.add((m[1] || m[2]).split('?')[0].split('#')[0]);
  }
}

const archiveRoot = path.join(publicImages, 'archive', 'unused');
const moved = [];

for (const { full, rel } of imageFiles) {
  if (rel.startsWith('archive/')) continue;
  if (rel === 'LOGOS_IDENTIFICATION.md') continue;
  const url = '/images/' + rel;
  const isUsed = Array.from(refs).some((r) => r === url);
  if (!isUsed) {
    const dest = path.join(archiveRoot, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.renameSync(full, dest);
    moved.push(rel);
  }
}

// 迁移图片识别文档到 docs/_metadata/images/
const logosDocSrc = path.join(publicImages, 'LOGOS_IDENTIFICATION.md');
if (fs.existsSync(logosDocSrc)) {
  fs.mkdirSync(docsMetaImages, { recursive: true });
  fs.renameSync(logosDocSrc, path.join(docsMetaImages, 'LOGOS_IDENTIFICATION.md'));
  moved.push('LOGOS_IDENTIFICATION.md -> docs/_metadata/images/');
}

console.log(`Archived ${moved.length} unused item(s):`);
moved.forEach((m) => console.log('  ' + m));

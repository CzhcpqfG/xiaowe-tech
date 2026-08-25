const fs = require('fs');
const path = require('path');

const publicImages = path.join(__dirname, '../public/images');
const srcDir = path.join(__dirname, '../src');
const indexHtml = path.join(__dirname, '../index.html');

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

const imageFiles = collectFiles(publicImages).map((p) =>
  path.relative(publicImages, p).replace(/\\/g, '/')
);
const imageSet = new Set(imageFiles);

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
    refs.add(m[1] || m[2]);
  }
}

const missing = [];
for (const ref of refs) {
  // strip query/hash
  const clean = ref.split('?')[0].split('#')[0];
  const rel = clean.replace(/^\/images\//, '');
  if (!imageSet.has(rel)) {
    missing.push(ref);
  }
}

// Optional: list unused (not archived) files
const unused = imageFiles.filter((f) => {
  if (f.startsWith('archive/')) return false;
  const url = '/images/' + f;
  return !Array.from(refs).some((r) => r === url || r.startsWith(url + '?'));
});

console.log(`Total image files: ${imageFiles.length}`);
console.log(`Total unique /images/ refs: ${refs.size}`);
console.log('Missing refs:');
missing.forEach((r) => console.log('  ' + r));
console.log(`\nUnused non-archive files (first 50):`);
unused.slice(0, 50).forEach((f) => console.log('  ' + f));

if (missing.length) {
  console.error(`\n❌ ${missing.length} missing reference(s)`);
  process.exit(1);
} else {
  console.log('\n✅ All /images/ references resolve to real files.');
}

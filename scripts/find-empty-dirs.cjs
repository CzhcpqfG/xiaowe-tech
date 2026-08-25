// 扫描指定目录下所有空文件夹 (递归)
// 用法: node scripts/find-empty-dirs.cjs [target-dir]

const fs = require("fs");
const path = require("path");

const target = process.argv[2] || path.join(__dirname, "..", "public");

function findEmptyDirs(dir, result = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  let hasFiles = false;
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      const subEmpty = findEmptyDirs(full, result);
      // 若子目录非空 (即有非空子孙), 标记 hasFiles
      if (!subEmpty.includes(full)) {
        // 子目录本身不是空, 但需要看它递归后是否还有内容
      }
      hasFiles = true; // 有子目录就算非空 (除非所有子目录都是空)
    } else {
      hasFiles = true;
    }
  }
  if (!hasFiles) {
    result.push(dir);
  }
  return result;
}

// 更严谨的实现: 真正的空 = 不含任何文件 (但可能含空子目录)
function findTrulyEmptyDirs(dir, result = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return result;
  }
  let fileCount = 0;
  const subdirs = [];
  for (const e of entries) {
    if (e.isDirectory()) {
      subdirs.push(path.join(dir, e.name));
    } else {
      fileCount++;
    }
  }
  // 递归子目录
  let subdirHasFile = false;
  for (const sub of subdirs) {
    const before = result.length;
    findTrulyEmptyDirs(sub, result);
    // 检查子目录是否含文件
    if (!containsFileRecursive(sub)) {
      // 子目录是空的 (递归后也无文件)
    } else {
      subdirHasFile = true;
    }
  }
  if (fileCount === 0 && !subdirHasFile) {
    result.push(dir);
  }
  return result;
}

function containsFileRecursive(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return false;
  }
  for (const e of entries) {
    if (e.isDirectory()) {
      if (containsFileRecursive(path.join(dir, e.name))) return true;
    } else {
      return true;
    }
  }
  return false;
}

const empty = findTrulyEmptyDirs(target);
empty.sort();
console.log(`Empty dirs under: ${target}`);
console.log(`Total: ${empty.length}\n`);
for (const d of empty) {
  console.log(d);
}

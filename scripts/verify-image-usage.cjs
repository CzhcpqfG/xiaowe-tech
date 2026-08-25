// 未消费图片 key 检测脚本
//
// 检测逻辑:
//   1. 从 src/data/images 下的 .ts 提取所有声明的 key 及其指向的文件路径
//   2. 扫描 src 下所有 .ts/.tsx 中的消费信号:
//      a) IMAGES.xxx / IMAGES["xxx"] / IMAGES['xxx']
//      b) xxxKey: "xxx" 字段赋值 (imageKey / logoKey / mainImageKey / floorplanKey / reportImageKey 等)
//      c) key: "xxx" 字段赋值 (配合 IMAGES[img.key] 使用)
//      d) 模板字符串 `prefix${...}` 展开匹配 declaredKeys 中以 prefix 开头的 key
//      e) 数组常量中的字符串字面量 (如 CATEGORY_IMAGE_KEYS = ["xxx", "yyy"])
//   3. 找出从未被消费的 key, 并对应到实际文件路径
//   4. 对每个未消费 key 对应的文件, 检查两个条件:
//      a) 是否被代码直接硬编码引用 (/images/xxx 字符串)
//      b) 是否被其他已消费的 key 也指向 (同一文件多 key 引用)
//      - 任一条件成立: 文件保留, 仅 key 是死代码 (输出 [KEEP-FILE])
//      - 都不成立: 文件可归档 + key 可删 (输出 [ARCHIVE])
//
// 用法: node scripts/verify-image-usage.cjs

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const imagesDir = path.join(srcDir, "data", "images");

/* ---------- 1. 收集所有声明的 key 及其指向的文件路径 ---------- */
const declaredKeys = new Map(); // key -> { filePath, module }

function collectDeclaredKeys() {
  const files = fs
    .readdirSync(imagesDir)
    .filter((f) => f.endsWith(".ts") && f !== "index.ts");

  for (const file of files) {
    const fullPath = path.join(imagesDir, file);
    const content = fs.readFileSync(fullPath, "utf8");
    const module = file.replace(/\.ts$/, "");

    const regex = /["']?(\w+)["']?\s*:\s*["'](\/images\/[^"']+)["']/g;
    let m;
    while ((m = regex.exec(content))) {
      const key = m[1];
      const filePath = m[2];
      declaredKeys.set(key, { filePath, module });
    }
  }
}

/* ---------- 2. 收集所有消费信号 ---------- */
const consumedKeys = new Set();
// 收集代码中所有直接硬编码的 /images/xxx 字符串
const directRefs = new Set();

function walkDir(dir, exts, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      walkDir(full, exts, cb);
    } else if (exts.some((ext) => e.name.endsWith(ext))) {
      cb(full);
    }
  }
}

function collectConsumedKeys() {
  walkDir(srcDir, [".ts", ".tsx"], (file) => {
    const content = fs.readFileSync(file, "utf8");

    // (a) IMAGES.xxx
    const dotRegex = /IMAGES\.(\w+)/g;
    let m;
    while ((m = dotRegex.exec(content))) {
      consumedKeys.add(m[1]);
    }

    // (b) IMAGES["xxx"] / IMAGES['xxx']
    const bracketRegex = /IMAGES\[\s*["']([^"']+)["']\s*\]/g;
    while ((m = bracketRegex.exec(content))) {
      consumedKeys.add(m[1]);
    }

    // (c) xxxKey: "xxx" 字段赋值
    const keyFieldRegex = /\w+Key\s*:\s*["']([^"']+)["']/g;
    while ((m = keyFieldRegex.exec(content))) {
      consumedKeys.add(m[1]);
    }

    // (d) key: "xxx" 字段赋值 (配合 IMAGES[img.key] 使用)
    const plainKeyRegex = /\bkey\s*:\s*["']([^"']+)["']/g;
    while ((m = plainKeyRegex.exec(content))) {
      consumedKeys.add(m[1]);
    }

    // (e) 模板字符串 `prefix${...}` 展开匹配 declaredKeys
    const templateRegex = /`(\w+)\$\{[^}]+\}`/g;
    while ((m = templateRegex.exec(content))) {
      const prefix = m[1];
      for (const declaredKey of declaredKeys.keys()) {
        if (declaredKey.startsWith(prefix)) {
          consumedKeys.add(declaredKey);
        }
      }
    }

    // (f) 数组常量中的字符串字面量
    const arrayRegex = /=\s*\[([^\]]*)\]/g;
    while ((m = arrayRegex.exec(content))) {
      const arrayContent = m[1];
      const strRegex = /["']([^"']+)["']/g;
      let am;
      while ((am = strRegex.exec(arrayContent))) {
        consumedKeys.add(am[1]);
      }
    }

    // (g) 收集代码中所有直接硬编码的 /images/xxx 字符串
    //     排除 src/data/images 下的声明文件 (那些是 key 声明, 不是消费)
    if (!file.includes(path.join("data", "images"))) {
      const directRegex = /["'](\/images\/[^"']+)["']/g;
      while ((m = directRegex.exec(content))) {
        directRefs.add(m[1]);
      }
    }
  });
}

/* ---------- 3. 找出未消费的 key ---------- */
function findUnusedKeys() {
  const unused = [];
  for (const [key, info] of declaredKeys) {
    if (!consumedKeys.has(key)) {
      unused.push({ key, ...info });
    }
  }
  return unused;
}

/* ---------- 4. 主流程 ---------- */
collectDeclaredKeys();
collectConsumedKeys();

console.log(`Declared keys: ${declaredKeys.size}`);
console.log(`Consumed keys: ${consumedKeys.size}`);
console.log(`Direct /images/ refs: ${directRefs.size}`);

const unused = findUnusedKeys();
console.log(`Unused keys: ${unused.length}\n`);

if (unused.length === 0) {
  console.log("✅ All declared image keys are consumed.");
  process.exit(0);
}

// 区分: 可归档文件 vs 需保留文件
// 条件 a: 文件被代码直接硬编码引用 (/images/xxx 字符串)
// 条件 b: 文件被其他已消费的 key 也指向 (同一文件多 key 引用)
// 任一条件成立 → 保留文件, 仅 key 是死代码
const archivable = []; // key + 文件可归档
const keepFiles = []; // key 是死代码但文件需保留

// 构建"文件路径 → 已消费 key 集合"的反向索引
const consumedKeyByFilePath = new Map(); // filePath -> [consumedKeyName, ...]
for (const [key, info] of declaredKeys) {
  if (consumedKeys.has(key)) {
    if (!consumedKeyByFilePath.has(info.filePath)) {
      consumedKeyByFilePath.set(info.filePath, []);
    }
    consumedKeyByFilePath.get(info.filePath).push(key);
  }
}

for (const u of unused) {
  const isDirectlyRefed = directRefs.has(u.filePath);
  const hasConsumedKeyRef = (consumedKeyByFilePath.get(u.filePath) || []).length > 0;
  if (isDirectlyRefed || hasConsumedKeyRef) {
    keepFiles.push(u);
  } else {
    archivable.push(u);
  }
}

// 按模块分组输出
const byModule = new Map();
for (const u of unused) {
  if (!byModule.has(u.module)) byModule.set(u.module, []);
  byModule.get(u.module).push(u);
}

for (const [module, items] of byModule) {
  console.log(`\n=== ${module}.ts (${items.length} unused) ===`);
  for (const it of items) {
    const isDirectlyRefed = directRefs.has(it.filePath);
    const hasConsumedKeyRef = (consumedKeyByFilePath.get(it.filePath) || []).length > 0;
    const status = (isDirectlyRefed || hasConsumedKeyRef) ? "[KEEP-FILE]" : "[ARCHIVE]";
    const reason = isDirectlyRefed
      ? "(directly referenced)"
      : hasConsumedKeyRef
        ? `(shared with consumed key: ${consumedKeyByFilePath.get(it.filePath).join(", ")})`
        : "";
    console.log(`  ${status}  ${it.key}  ->  ${it.filePath}  ${reason}`);
  }
}

// 输出可归档文件列表
console.log(`\n=== Files to archive (${archivable.length} keys, files may dedupe) ===`);
const filesToArchive = new Set();
for (const u of archivable) {
  filesToArchive.add(u.filePath);
}
for (const f of [...filesToArchive].sort()) {
  console.log(`  ${f}`);
}

if (keepFiles.length > 0) {
  console.log(`\n=== Files to KEEP (directly referenced, only key is dead) ===`);
  for (const u of keepFiles) {
    console.log(`  ${u.key}  ->  ${u.filePath}`);
  }
}

// i18n 死 key 检测脚本
//
// 检测逻辑:
//   1. 从 src/i18n/locales/zh-CN/*.json 提取所有 key 路径 (如 home.hero.title)
//      - 每个文件是一个 namespace, 文件名即 namespace 名 (如 home.json → namespace "home")
//      - 但 common.json 的 key 在代码中用 "common:xxx" 或直接 "xxx" (默认 namespace) 引用
//   2. 扫描 src 下所有 .ts/.tsx 中 t("xxx") / t('xxx') / t(`xxx`) 的使用
//      - 同时处理 namespace 前缀: "home:hero.title" → namespace=home, key=hero.title
//      - 模板字符串 `xxx.${var}` 视为前缀匹配
//   3. 找出从未被引用的 key
//
// 用法: node scripts/verify-i18n-usage.cjs

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const localesDir = path.join(srcDir, "i18n", "locales", "zh-CN");

/* ---------- 1. 收集所有 i18n key ---------- */
// 结构: Map<namespace, Set<keyPath>>
//   namespace = "home" 表示 home.json 文件
//   keyPath = "hero.title" 表示该文件内的 hero.title 键
const declaredKeys = new Map(); // ns -> Set<keyPath>

function flattenJson(obj, prefix = "") {
  // 只收集叶子节点 (字符串值), 跳过对象/数组容器
  // 因为 i18next 的 t() 通常只返回字符串, 容器节点不是真正的可消费 key
  const keys = new Set();
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object") {
      // 对象或数组 → 递归
      const nested = flattenJson(v, fullKey);
      for (const nk of nested) keys.add(nk);
    } else {
      // 叶子节点 (字符串/数字/布尔)
      keys.add(fullKey);
    }
  }
  return keys;
}

function collectDeclaredKeys() {
  const files = fs.readdirSync(localesDir).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const ns = file.replace(/\.json$/, "");
    const content = JSON.parse(fs.readFileSync(path.join(localesDir, file), "utf8"));
    const keys = flattenJson(content);
    declaredKeys.set(ns, keys);
  }
}

/* ---------- 2. 收集所有消费信号 ---------- */
// 结构: Map<namespace, Set<keyPath>>
const consumedKeys = new Map();

function addConsumed(ns, keyPath) {
  if (!consumedKeys.has(ns)) consumedKeys.set(ns, new Set());
  consumedKeys.get(ns).add(keyPath);
}

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

    // (a) t("ns:key.path") 或 t('ns:key.path') - 带命名空间前缀
    //     匹配 t( 后跟引号, 引号内含冒号
    const withNsRegex = /\bt\(\s*["']([a-zA-Z-]+):([^"']+)["']/g;
    let m;
    while ((m = withNsRegex.exec(content))) {
      const ns = m[1];
      const keyPath = m[2];
      addConsumed(ns, keyPath);
    }

    // (b) t("key.path") 不带冒号 - 默认 namespace (通常是 common 或当前组件 namespace)
    //     这类无法确定 ns, 把 keyPath 加入所有 ns 的消费集 (保守策略, 避免误判)
    //     但实际上 useTranslation("xxx") 会绑定默认 ns, 我们扫描 useTranslation 调用
    //     太复杂, 这里先用宽松策略: 不带 ns 前缀的 t("xxx") 视为消费所有 ns 中匹配的 key
    const withoutNsRegex = /\bt\(\s*["']([a-zA-Z][^"']*)["']/g;
    while ((m = withoutNsRegex.exec(content))) {
      const keyPath = m[1];
      // 跳过含冒号的 (已在 (a) 处理)
      if (keyPath.includes(":")) continue;
      // 加入所有 ns, 后续匹配时只要任一 ns 有该 key 就算消费
      for (const ns of declaredKeys.keys()) {
        addConsumed(ns, keyPath);
      }
    }

    // (c) 模板字符串 t(`ns:key.path.${var}`) 或 t(`ns:${var}.path`) - 带命名空间前缀
    //     注意 prefix 可能是空字符串 (如 `meta:${titleKey}`)
    //     策略: 提取 ${ 之前的静态前缀, 若前缀为空则标记整个 ns 为消费 (保守, 避免误判)
    const templateWithNsRegex = /\bt\(\s*`([a-zA-Z-]+):([^`]*)\$\{[^}]+\}/g;
    while ((m = templateWithNsRegex.exec(content))) {
      const ns = m[1];
      const prefix = m[2]; // ${ 之前的静态部分
      const nsKeys = declaredKeys.get(ns) || new Set();
      if (!prefix) {
        // 前缀为空 (如 `meta:${titleKey}`): 标记整个 ns 为消费
        for (const k of nsKeys) {
          addConsumed(ns, k);
        }
      } else {
        // 前缀非空: 标记以 prefix 开头的 key
        for (const k of nsKeys) {
          if (k.startsWith(prefix)) {
            addConsumed(ns, k);
          }
        }
      }
    }

    // (d) 模板字符串 t(`key.path.${var}`) 不带命名空间 - 宽松处理
    const templateRegex = /\bt\(\s*`([a-zA-Z][^`]*?)\$\{[^}]+\}`/g;
    while ((m = templateRegex.exec(content))) {
      const prefix = m[1];
      // 跳过含冒号的 (已在 (c) 处理)
      if (prefix.includes(":")) continue;
      for (const ns of declaredKeys.keys()) {
        const nsKeys = declaredKeys.get(ns) || new Set();
        for (const k of nsKeys) {
          if (k.startsWith(prefix)) {
            addConsumed(ns, k);
          }
        }
      }
    }

    // (e) xxxKey: "ns:key.path" 或 xxxKey: "key.path" 字段赋值
    //     这些字段值会被传给 t() 间接消费, 如 nameKey / titleKey / descKey / altKey 等
    const keyFieldWithNsRegex = /\w+Key\s*:\s*["']([a-zA-Z-]+):([^"']+)["']/g;
    while ((m = keyFieldWithNsRegex.exec(content))) {
      const ns = m[1];
      const keyPath = m[2];
      addConsumed(ns, keyPath);
    }

    const keyFieldRegex = /\w+Key\s*:\s*["']([a-zA-Z][^"']*)["']/g;
    while ((m = keyFieldRegex.exec(content))) {
      const keyPath = m[1];
      if (keyPath.includes(":")) continue;
      for (const ns of declaredKeys.keys()) {
        addConsumed(ns, keyPath);
      }
    }

    // (f) 模板字符串 xxxKey: `ns:key.path.${var}` 或 `key.path.${var}`
    const keyFieldTemplateWithNsRegex = /\w+Key\s*:\s*`([a-zA-Z-]+):([^`]+)\$\{[^}]+\}`/g;
    while ((m = keyFieldTemplateWithNsRegex.exec(content))) {
      const ns = m[1];
      const prefix = m[2];
      const nsKeys = declaredKeys.get(ns) || new Set();
      for (const k of nsKeys) {
        if (k.startsWith(prefix)) {
          addConsumed(ns, k);
        }
      }
    }

    const keyFieldTemplateRegex = /\w+Key\s*:\s*`([a-zA-Z][^`]*?)\$\{[^}]+\}`/g;
    while ((m = keyFieldTemplateRegex.exec(content))) {
      const prefix = m[1];
      if (prefix.includes(":")) continue;
      for (const ns of declaredKeys.keys()) {
        const nsKeys = declaredKeys.get(ns) || new Set();
        for (const k of nsKeys) {
          if (k.startsWith(prefix)) {
            addConsumed(ns, k);
          }
        }
      }
    }

    // (g) 数组常量中的字符串字面量 (如 paragraphKeys: ["ns:key.0", "ns:key.1"])
    //     配合 t([...keys], { returnObjects: true }) 使用
    const arrayRegex = /=\s*\[([^\]]*)\]/g;
    while ((m = arrayRegex.exec(content))) {
      const arrayContent = m[1];
      const strRegex = /["']([^"']+)["']/g;
      let am;
      while ((am = strRegex.exec(arrayContent))) {
        const val = am[1];
        if (val.includes(":")) {
          // 带 ns 前缀: "ns:key.path"
          const colonIdx = val.indexOf(":");
          const ns = val.slice(0, colonIdx);
          const keyPath = val.slice(colonIdx + 1);
          addConsumed(ns, keyPath);
        } else {
          // 不带 ns: 加入所有 ns
          for (const ns of declaredKeys.keys()) {
            addConsumed(ns, val);
          }
        }
      }
    }

    // (h) 任意字段值是 i18n key 字面量 (如 i18nPrefix: "ns:key.path")
    //     这些值会被变量拼接后传入 t(), 是间接消费信号
    //     视为前缀: 标记所有以该值开头的 key (含值本身) 为消费
    //     例: "product:products.0" → 消费 product:products.0.model, product:products.0.features.0.label, ...
    const anyFieldWithNsRegex = /["'`]([a-zA-Z-]+):([a-zA-Z][^"'`]*?)["'`]/g;
    while ((m = anyFieldWithNsRegex.exec(content))) {
      const ns = m[1];
      const prefix = m[2];
      if (!declaredKeys.has(ns)) continue;
      const nsKeys = declaredKeys.get(ns);
      for (const k of nsKeys) {
        // k 本身或 k 从 prefix 开始 (即 prefix 是 k 的前缀, 或 prefix === k)
        if (k === prefix || k.startsWith(prefix + ".")) {
          addConsumed(ns, k);
        }
      }
    }
  });
}

/* ---------- 3. 找出未消费的 key ---------- */
function findUnusedKeys() {
  const unused = []; // { ns, keyPath }
  for (const [ns, keys] of declaredKeys) {
    const consumed = consumedKeys.get(ns) || new Set();
    for (const k of keys) {
      if (!consumed.has(k)) {
        unused.push({ ns, keyPath: k });
      }
    }
  }
  return unused;
}

/* ---------- 4. 主流程 ---------- */
collectDeclaredKeys();
collectConsumedKeys();

let totalDeclared = 0;
let totalConsumed = 0;
for (const keys of declaredKeys.values()) totalDeclared += keys.size;
for (const keys of consumedKeys.values()) totalConsumed += keys.size;

console.log(`Declared keys: ${totalDeclared}`);
console.log(`Consumed keys (with dupes across ns): ${totalConsumed}`);

const unused = findUnusedKeys();
console.log(`Unused keys: ${unused.length}\n`);

if (unused.length === 0) {
  console.log("✅ All declared i18n keys are consumed.");
  process.exit(0);
}

// 按 namespace 分组输出
const byNs = new Map();
for (const u of unused) {
  if (!byNs.has(u.ns)) byNs.set(u.ns, []);
  byNs.get(u.ns).push(u);
}

for (const [ns, items] of byNs) {
  console.log(`\n=== ${ns}.json (${items.length} unused) ===`);
  for (const it of items) {
    console.log(`  ${ns}:${it.keyPath}`);
  }
}

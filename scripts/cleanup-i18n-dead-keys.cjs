// 批量删除 i18n JSON 文件中指定的死 key
// 用法: node scripts/cleanup-i18n-dead-keys.cjs
//
// 安全策略:
//   - 仅删除明确列出的 key
//   - 同步清理 3 个 locale (zh-CN / zh-TW / en)
//   - 删除空对象容器 (若删除后父对象为空)
//   - 保留 JSON 文件格式 (2 空格缩进)

const fs = require("fs");
const path = require("path");

const localesDir = path.join(__dirname, "..", "src", "i18n", "locales");
const locales = ["zh-CN", "zh-TW", "en"];

// 25 个确认的死 key (按 ns:keyPath 格式列出)
const deadKeys = [
  // about.json (7)
  "about:skyworthGroup.sectionEnTitle",
  "about:xiaoweiHealth.sectionEnTitle",
  "about:culture.sectionEnTitle",
  "about:honors.sectionEnTitle",
  "about:team.sectionEnTitle",
  "about:partners.sectionEnTitle",
  "about:timeline.sectionEnTitle",
  // auth.json (2)
  "auth:login.errors.generic",
  "auth:register.errors.generic",
  // invest.json (9)
  "invest:advantages.marketStatus.countryRates.0.rate",
  "invest:advantages.marketStatus.countryRates.1.rate",
  "invest:advantages.marketStatus.countryRates.2.rate",
  "invest:advantages.marketStatus.countryRates.3.rate",
  "invest:advantages.brand.rdFactory.stats.0.number",
  "invest:advantages.brand.rdFactory.stats.1.number",
  "invest:advantages.brand.rdFactory.stats.2.number",
  "invest:policy.storeOpen.storeTypes.0.area",
  "invest:policy.storeOpen.storeTypes.1.area",
  // product.json (4)
  "product:categories.behind-ear",
  "product:categories.in-ear",
  "product:categories.neck-hung",
  "product:categories.bone-conduction",
  // wearable.json (3)
  "wearable:categories.adult-watch",
  "wearable:categories.kids-watch",
  "wearable:categories.bluetooth-earphone",
];

// 按 ns 分组
const byNs = new Map();
for (const k of deadKeys) {
  const [ns, path] = k.split(":");
  if (!byNs.has(ns)) byNs.set(ns, []);
  byNs.get(ns).push(path);
}

function deleteKeyPath(obj, keyPath) {
  const parts = keyPath.split(".");
  let cur = obj;
  const ancestors = [];
  for (let i = 0; i < parts.length - 1; i++) {
    ancestors.push({ obj: cur, key: parts[i] });
    if (!cur[parts[i]] || typeof cur[parts[i]] !== "object") return false;
    cur = cur[parts[i]];
  }
  const lastKey = parts[parts.length - 1];
  if (!(lastKey in cur)) return false;
  delete cur[lastKey];
  // 清理空容器 (从最深的祖先开始向上)
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const { obj: parent, key } = ancestors[i];
    const child = parent[key];
    if (
      child &&
      typeof child === "object" &&
      !Array.isArray(child) &&
      Object.keys(child).length === 0
    ) {
      delete parent[key];
    } else {
      break;
    }
  }
  return true;
}

let totalDeleted = 0;
let totalMissing = 0;

for (const [ns, keyPaths] of byNs) {
  for (const locale of locales) {
    const filePath = path.join(localesDir, locale, `${ns}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`[skip] ${filePath} not found`);
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, "utf8"));
    let deleted = 0;
    let missing = 0;
    for (const kp of keyPaths) {
      if (deleteKeyPath(content, kp)) {
        deleted++;
      } else {
        missing++;
      }
    }
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2) + "\n", "utf8");
    console.log(`[${locale}/${ns}.json] deleted=${deleted} missing=${missing}`);
    totalDeleted += deleted;
    totalMissing += missing;
  }
}

console.log(`\nTotal: deleted=${totalDeleted}, missing=${totalMissing}`);

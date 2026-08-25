/**
 * 引用更新脚本
 *
 * 功能:
 *   扫描所有引用图片的代码文件,将 /images/...{.png|.jpg|.jpeg} 后缀改为 .webp
 *
 * 处理范围:
 *   - src/data/images/*.ts (7 个 IMAGES 模块)
 *   - src/data/product.ts, src/data/about.ts
 *   - src/components/invest/*.tsx
 *   - src/config/schema.ts
 *   - src/components/SEO.tsx
 *   - src/pages/NotFoundPage.tsx
 *   - index.html
 *   - public/site.webmanifest
 *   - public/.well-known/ai-plugin.json
 *
 * 安全策略:
 *   - 仅替换 /images/... 路径下的图片引用,不动其他 .png 字符串
 *   - 大小写不敏感(防止 .PNG/.JPG 漏网)
 *   - 替换前先 backup 原 .ts/.tsx 文件? 不需要,git 已跟踪
 *
 * 用法: node scripts/update-image-refs-to-webp.cjs
 */

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = "d:/VibeTest/bigsound";

const TARGET_FILES = [
  // IMAGES 模块
  "src/data/images/about.ts",
  "src/data/images/banner.ts",
  "src/data/images/careers.ts",
  "src/data/images/common.ts",
  "src/data/images/home.ts",
  "src/data/images/invest.ts",
  "src/data/images/news.ts",
  "src/data/images/product.ts",
  "src/data/images/service.ts",
  "src/data/images/wearable.ts",
  "src/data/images/index.ts",
  // 数据文件硬编码
  "src/data/product.ts",
  "src/data/about.ts",
  // 组件
  "src/components/invest/InvestmentPolicyTable.tsx",
  "src/components/invest/HearingLossGradeTable.tsx",
  "src/components/SEO.tsx",
  "src/config/schema.ts",
  "src/config/footer.ts",
  "src/components/layout/PageHero.tsx",
  "src/components/layout/ProductCarouselHero.tsx",
  "src/pages/NotFoundPage.tsx",
  // HTML / 配置
  "index.html",
  "public/site.webmanifest",
  "public/.well-known/ai-plugin.json",
];

// 仅替换 /images/... 路径下的图片引用,大小写不敏感
// 捕获组 1: 路径前缀(不含扩展名),如 /images/common/logo
// 捕获组 2: 原扩展名 png/jpg/jpeg
const IMG_REF_REGEX = /(\/images\/[^"'`)\s]+?)\.(png|jpe?g)/gi;

function replaceRefs(content) {
  return content.replace(IMG_REF_REGEX, "$1.webp");
}

function main() {
  let totalReplacements = 0;
  let modifiedCount = 0;
  let skippedCount = 0;
  let missingCount = 0;

  console.log("=".repeat(70));
  console.log("引用更新: .png/.jpg/.jpeg → .webp");
  console.log("=".repeat(70));

  for (const relPath of TARGET_FILES) {
    const absPath = path.join(PROJECT_ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      console.log(`[SKIP] 文件不存在: ${relPath}`);
      missingCount++;
      continue;
    }

    const content = fs.readFileSync(absPath, "utf8");
    const updated = replaceRefs(content);

    // 统计替换次数
    const matches = content.match(IMG_REF_REGEX) || [];
    if (matches.length === 0) {
      skippedCount++;
      continue;
    }

    if (updated !== content) {
      fs.writeFileSync(absPath, updated, "utf8");
      console.log(
        `[OK] ${relPath.padEnd(50).slice(0, 50)} 替换 ${matches.length} 处`
      );
      totalReplacements += matches.length;
      modifiedCount++;
    } else {
      console.log(
        `[NOOP] ${relPath.padEnd(48).slice(0, 48)} 匹配 ${matches.length} 处但无变化`
      );
    }
  }

  console.log("");
  console.log("=".repeat(70));
  console.log("更新完成报告");
  console.log("=".repeat(70));
  console.log(`修改文件数:   ${modifiedCount}`);
  console.log(`跳过(无引用): ${skippedCount}`);
  console.log(`缺失文件:     ${missingCount}`);
  console.log(`总替换次数:   ${totalReplacements}`);
}

main();

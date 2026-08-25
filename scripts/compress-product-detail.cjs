/**
 * 详情页图片批量转 WebP (2026-08-16)
 *
 * 目标: public/images/product-detail/** 下所有 .jpg/.jpeg/.png → .webp
 * 质量策略: 不缩放 (保持原分辨率), WebP quality 90 + effort 6
 *   - 用户要求"不要影响图片质量": 保持原尺寸 + 高编码质量
 *   - 同分辨率下 WebP q90 通常比原 JPG 小 30-50%, 视觉无损
 * 原文件备份到项目外目录 (保持目录结构), 转换成功后删除原文件
 *
 * 用法: node scripts/compress-product-detail.cjs
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = "d:/VibeTest/bigsound";
const TARGET_DIR = path.join(PROJECT_ROOT, "public/images/product-detail");
const BACKUP_DIR = "d:/VibeTest/bigsound_backup_product_detail_20260816";

const WEBP_QUALITY = 90;
const WEBP_EFFORT = 6;
const CONCURRENCY = 4;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walkDir(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walkDir(p, acc);
    else if (entry.isFile()) acc.push(p);
  }
  return acc;
}

async function convertOne(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return null;

  const absSrc = path.resolve(srcPath);
  const rel = path.relative(TARGET_DIR, absSrc);
  const backupPath = path.join(BACKUP_DIR, rel);
  const webpPath = absSrc.replace(/\.(png|jpg|jpeg)$/i, ".webp");

  // 已存在同名 webp 则跳过 (避免重复转换覆盖)
  if (fs.existsSync(webpPath)) return null;

  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(absSrc, backupPath);

  const before = fs.statSync(absSrc).size;
  const meta = await sharp(absSrc, { failOn: "none" }).metadata();

  // 不缩放: 保持原分辨率, 仅编码转 WebP
  await sharp(absSrc, { failOn: "none" })
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toFile(webpPath);

  fs.unlinkSync(absSrc);
  const after = fs.statSync(webpPath).size;

  return {
    file: rel.split(path.sep).join("/"),
    before,
    after,
    dims: `${meta.width}x${meta.height}`,
  };
}

async function runPool(tasks, n) {
  const results = [];
  let cursor = 0;
  async function worker() {
    while (cursor < tasks.length) {
      const idx = cursor++;
      try {
        const r = await tasks[idx]();
        if (r) results.push(r);
      } catch (e) {
        console.error(`[ERROR] ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

async function main() {
  console.log("=".repeat(70));
  console.log("详情页图片转 WebP (不缩放, q90)");
  console.log("=".repeat(70));
  console.log(`源目录:   ${TARGET_DIR}`);
  console.log(`备份目录: ${BACKUP_DIR}`);
  console.log(`WebP:     quality=${WEBP_QUALITY}, effort=${WEBP_EFFORT}, 不缩放`);
  console.log("");

  const allFiles = walkDir(TARGET_DIR, []);
  const targets = allFiles.filter((f) =>
    [".png", ".jpg", ".jpeg"].includes(path.extname(f).toLowerCase())
  );
  console.log(`扫描到 ${targets.length} 张待转换`);
  if (targets.length === 0) {
    console.log("无需处理, 退出");
    return;
  }
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const start = Date.now();
  const results = await runPool(
    targets.map((f) => () => convertOne(f)),
    CONCURRENCY
  );
  const sec = ((Date.now() - start) / 1000).toFixed(1);

  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.after, 0);
  const pct = ((1 - totalAfter / totalBefore) * 100).toFixed(1);

  console.log("=".repeat(70));
  console.log("转换完成报告");
  console.log("=".repeat(70));
  console.log(`成功转换: ${results.length} 张, 耗时 ${sec}s`);
  console.log(`总体积:   ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (节省 ${pct}%)`);
  console.log("");

  // 体积上升的图 (异常)
  const up = results.filter((r) => r.after >= r.before);
  if (up.length > 0) {
    console.log(`⚠️ ${up.length} 张转 WebP 后未变小 (原图已高度压缩):`);
    for (const r of up) console.log(`   ${r.file}: ${formatBytes(r.before)} → ${formatBytes(r.after)}`);
    console.log("");
  }
  console.log(`✅ 原文件已备份至: ${BACKUP_DIR}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
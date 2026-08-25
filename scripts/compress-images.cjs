/**
 * 图片压缩脚本
 *
 * 功能:
 *   1. 扫描 public/images 下所有 .png/.jpg/.jpeg 文件(递归)
 *   2. 备份原文件到项目外目录(保持目录结构)
 *   3. 用 sharp 转 WebP(quality 80, effort 4) + 智能缩放
 *   4. 输出 .webp 到原位置,删除原 .png/.jpg/.jpeg
 *   5. SVG/ICO/已存在的 WebP 不处理
 *   6. 输出压缩前后体积对比报告
 *
 * 用法: node scripts/compress-images.cjs
 */

const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = "d:/VibeTest/bigsound";
const PUBLIC_IMAGES = path.join(PROJECT_ROOT, "public/images");
const BACKUP_DIR = "d:/VibeTest/bigsound_original_backup_20260726";

// 智能缩放规则(顺序敏感,先匹配先用)
// relPath 使用 POSIX 风格斜杠(/)便于正则匹配
const SIZE_RULES = [
  { pattern: /^invest\/hero_invest.*\.png$/i, maxEdge: 1920 },
  { pattern: /^invest\/expert_team_wide\.png$/i, maxEdge: 1920 },
  { pattern: /^about\/hero_bg_skyworth_building\.png$/i, maxEdge: 1920 },
  { pattern: /^about\/research_.*\.png$/i, maxEdge: 1600 },
  { pattern: /^product\/family_portrait\.png$/i, maxEdge: 1600 },
  { pattern: /^home_products\/.*\.png$/i, maxEdge: 1200 },
  { pattern: /^invest\/.*\.png$/i, maxEdge: 1200 },
  { pattern: /^careers\/.*\.png$/i, maxEdge: 1200 },
  { pattern: /^product\/.*\.png$/i, maxEdge: 1200 },
  { pattern: /^about\/culture\/.*\.png$/i, maxEdge: 1200 },
  { pattern: /^products\/.*\.png$/i, maxEdge: 800 },
  { pattern: /^equipment\/.*\.png$/i, maxEdge: 800 },
  { pattern: /^wearable\/.*\.png$/i, maxEdge: 800 },
  { pattern: /^about\/team\/.*\.png$/i, maxEdge: 400 },
  { pattern: /^honors\/real\/.*\.png$/i, maxEdge: 600 },
  { pattern: /^common\/logo\.png$/i, maxEdge: 400 },
  { pattern: /^common\/not_found\.png$/i, maxEdge: 800 },
  { pattern: /^common\/.*\.png$/i, maxEdge: 800 },
  { pattern: /^logos\/.*\.png$/i, maxEdge: 400 },
  { pattern: /^about\/partners\/.*\.(png|jpg|jpeg)$/i, maxEdge: 300 },
  { pattern: /^service\/qr\/.*\.(png|jpg|jpeg)$/i, maxEdge: 400 },
];

const DEFAULT_MAX_EDGE = 1600;
const WEBP_QUALITY = 80;
const WEBP_EFFORT = 4;
const CONCURRENCY = 4; // 并行处理数

function getTargetMaxEdge(relPathPosix) {
  for (const rule of SIZE_RULES) {
    if (rule.pattern.test(relPathPosix)) return rule.maxEdge;
  }
  return DEFAULT_MAX_EDGE;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function walkDir(dir, accumulator) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, accumulator);
    } else if (entry.isFile()) {
      accumulator.push(fullPath);
    }
  }
  return accumulator;
}

async function compressOne(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return null;

  const absSrc = path.resolve(srcPath);
  const relPath = path.relative(PUBLIC_IMAGES, absSrc);
  const relPathPosix = relPath.split(path.sep).join("/");
  const backupPath = path.join(BACKUP_DIR, relPath);
  const webpPath = absSrc.replace(/\.(png|jpg|jpeg)$/i, ".webp");

  // 1. 备份原文件(保持原目录结构)
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(absSrc, backupPath);

  const beforeSize = fs.statSync(absSrc).size;

  // 2. 读取原图尺寸
  const metadata = await sharp(absSrc).metadata();
  const maxEdge = getTargetMaxEdge(relPathPosix);

  // 3. 转 WebP + 智能缩放(仅缩小,不放大)
  let pipeline = sharp(absSrc, { failOn: "none" });
  const needResize =
    metadata.width > maxEdge || metadata.height > maxEdge;
  if (needResize) {
    pipeline = pipeline.resize({
      width: metadata.width >= metadata.height ? maxEdge : null,
      height: metadata.height > metadata.width ? maxEdge : null,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  await pipeline
    .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
    .toFile(webpPath);

  // 4. 删除原文件
  fs.unlinkSync(absSrc);

  const afterSize = fs.statSync(webpPath).size;

  return {
    file: relPathPosix,
    before: beforeSize,
    after: afterSize,
    resized: needResize,
    originalDims: `${metadata.width}x${metadata.height}`,
  };
}

async function runPool(tasks, concurrency) {
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
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  console.log("=".repeat(70));
  console.log("图片压缩脚本 - PNG/JPG → WebP");
  console.log("=".repeat(70));
  console.log(`源目录:   ${PUBLIC_IMAGES}`);
  console.log(`备份目录: ${BACKUP_DIR}`);
  console.log(`质量:     ${WEBP_QUALITY} (WebP)`);
  console.log(`并发:     ${CONCURRENCY}`);
  console.log("");

  // 1. 扫描所有图片
  const allFiles = walkDir(PUBLIC_IMAGES, []);
  const targetFiles = allFiles.filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return [".png", ".jpg", ".jpeg"].includes(ext);
  });

  console.log(`扫描到 ${allFiles.length} 个文件,其中 ${targetFiles.length} 个 PNG/JPG/JPEG 待处理`);
  console.log("");

  // 2. 创建备份根目录
  fs.mkdirSync(BACKUP_DIR, { recursive: true });

  // 3. 并行压缩
  const startTime = Date.now();
  const tasks = targetFiles.map((f) => () => compressOne(f));
  const results = await runPool(tasks, CONCURRENCY);
  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

  // 4. 汇总报告
  const totalBefore = results.reduce((s, r) => s + r.before, 0);
  const totalAfter = results.reduce((s, r) => s + r.after, 0);
  const savedBytes = totalBefore - totalAfter;
  const savedPct =
    totalBefore > 0 ? ((savedBytes / totalBefore) * 100).toFixed(1) : "0";
  const resizedCount = results.filter((r) => r.resized).length;

  console.log("=".repeat(70));
  console.log("压缩完成报告");
  console.log("=".repeat(70));
  console.log(`处理图片数:     ${results.length}`);
  console.log(`其中智能缩放:   ${resizedCount} 张`);
  console.log(`耗时:           ${elapsedSec} 秒`);
  console.log(`压缩前总体积:   ${formatBytes(totalBefore)}`);
  console.log(`压缩后总体积:   ${formatBytes(totalAfter)}`);
  console.log(`节省:           ${formatBytes(savedBytes)} (${savedPct}%)`);
  console.log("");

  // 5. Top 10 收益最大的图
  const sorted = [...results].sort(
    (a, b) => b.before - b.after - (a.before - a.after)
  );
  console.log("Top 10 体积下降最多的图片:");
  console.log(
    `${"文件".padEnd(60)} ${"前".padStart(10)} ${"后".padStart(10)} ${"降幅".padStart(8)}`
  );
  for (const r of sorted.slice(0, 10)) {
    const pct = ((r.before - r.after) / r.before * 100).toFixed(1);
    console.log(
      `${r.file.padEnd(60).slice(0, 60)} ${formatBytes(r.before).padStart(10)} ${formatBytes(r.after).padStart(10)} ${(pct + "%").padStart(8)}`
    );
  }
  console.log("");

  // 6. 体积上升的图(异常情况)
  const increased = results.filter((r) => r.after >= r.before);
  if (increased.length > 0) {
    console.log(`⚠️  ${increased.length} 张图片压缩后体积未下降(可能是原图已极小或 PNG 已优化):`);
    for (const r of increased) {
      console.log(`   ${r.file}: ${formatBytes(r.before)} → ${formatBytes(r.after)}`);
    }
    console.log("");
  }

  console.log("✅ 备份目录:", BACKUP_DIR);
  console.log("   如需回滚,可从该目录恢复原文件");
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

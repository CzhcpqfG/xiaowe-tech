/**
 * 新闻封面缩略图生成 — news LCP 优化 (REVIEW_ACTIONS.md P2-5 后续)
 *
 * 问题: 新闻列表卡片显示 120×80 ~ 185×109, 却加载 1200px 原图 (~40-90KB/张,
 * 首页列表即 ~1.1MB), slow-4G 下排队挤占带宽 → LCP 5.5s。
 *
 * 方案: sharp 生成 480 宽 webp 缩略图 (~8-15KB), NewsListPage 卡片改用。
 *
 * 运行: npx tsx scripts/generate-news-thumbs.ts   (幂等, mtime 未变则跳过)
 */
import { readdirSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const SRC_DIR = "public/images/news";
const THUMB_DIR = join(SRC_DIR, "thumbs");
const WIDTH = 480;
const QUALITY = 72;

mkdirSync(THUMB_DIR, { recursive: true });

let made = 0, skipped = 0;

for (const entry of readdirSync(SRC_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory() || !/^\d+$/.test(entry.name)) continue; // 只处理数字 id 目录
  const id = entry.name;
  const dir = join(SRC_DIR, id);
  // 找该文章的封面 (cover.*)
  const cover = readdirSync(dir).find((f) => /^cover\.(jpe?g|png|webp)$/i.test(f));
  if (!cover) continue;
  const srcPath = join(dir, cover);
  const outPath = join(THUMB_DIR, `${id}.webp`);

  // 幂等: 缩略图存在且比源新 → 跳过
  if (existsSync(outPath) && statSync(outPath).mtimeMs >= statSync(srcPath).mtimeMs) {
    skipped++;
    continue;
  }

  await sharp(srcPath)
    .rotate() // 按 EXIF 自动转正
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(outPath);
  made++;
}

console.log(`generate-news-thumbs: ${made} generated, ${skipped} up-to-date -> ${THUMB_DIR}`);

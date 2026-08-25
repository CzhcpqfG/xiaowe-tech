// 死 key 清理 + 未引用文件归档脚本
//
// 操作:
//   1. 从 src/data/images/*.ts 删除 60 个未消费的 key 行
//   2. 把 53 个可归档文件从 public/images/ 移到 public/images/archive/unused_keys/
//   3. 保留 3 个被 footer.ts 直接引用的文件 (仅删 key)
//
// 用法: node scripts/cleanup-unused-images.cjs

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const imagesDir = path.join(root, "src", "data", "images");
const publicImagesDir = path.join(root, "public", "images");
const archiveDir = path.join(publicImagesDir, "archive", "unused_keys");

/* ---------- 待删除的 key 列表 (按模块分组) ---------- */
const keysToDelete = {
  "about.ts": ["aboutBrand", "missionVision1", "missionVision2"],
  "banner.ts": [
    "bannerBg1",
    "bannerBg2",
    "banner1",
    "banner2",
    "banner3",
    "pageHeroProduct",
    "pageHeroService",
    "pageHeroAbout",
    "pageHeroNews",
  ],
  "careers.ts": ["careersHeroBg"],
  "common.ts": ["brand", "heroBigsoundLogo", "heroDasoundLogo"],
  "home.ts": [
    "heroLogo",
    "heroBrand",
    "brandIntroBg",
    "tech1",
    "tech2",
    "tech3",
    "tech4",
    "flagshipLogo",
    "ctaLogoMain",
    "ctaLogoDasoundZtq",
    "ctaLogoDasoundTl",
    "ctaLogoXhs",
    "heroSkyworthLogo",
  ],
  "news.ts": [
    "news1",
    "news2",
    "news3",
    "news4",
    "news5",
    "news6",
    "news7",
    "news8",
    "news9",
    "news10",
  ],
  "product.ts": [
    "productBgRic",
    "productBgNeck",
    "productBgRicTencent",
    "productBannerTitle",
    "product5",
    "product6",
    "product7",
    "product8",
    "productSeries4Models",
    "productSkyworthB1",
    "productSkyworthP1",
    "productSkyworthQ2",
    "productSkyworthQ3",
    "certBadgesIsoCeFda",
    "certReal6",
    "clinicalReportPlaceholder",
    "patentedTechnologyCerts",
  ],
  "service.ts": ["serviceC2mBg", "serviceBannerTitle", "serviceC2mLogo"],
  "wearable.ts": ["pageHeroWearable"],
};

/* ---------- 待归档的文件列表 (相对 /images/ 路径) ---------- */
const filesToArchive = [
  "/images/about/about_brand.webp",
  "/images/about/mission_vision_1.jpg",
  "/images/about/mission_vision_2.jpg",
  "/images/careers/careers_hero_bg.png",
  "/images/common/brand.webp",
  "/images/common/hero_bigsound_logo.webp",
  "/images/common/hero_dasound_logo.webp",
  "/images/home/banner/banner_1.webp",
  "/images/home/banner/banner_2.webp",
  "/images/home/banner/banner_3.webp",
  "/images/home/banner/banner_bg_1.webp",
  "/images/home/banner/banner_bg_2.webp",
  "/images/home/brand_intro_bg.jpg",
  "/images/home/cta/logo_main.webp",
  "/images/home/hero/hero_brand.webp",
  "/images/home/hero/hero_logo.webp",
  "/images/home/products/flagship_logo.webp",
  "/images/home/tech/tech_1.webp",
  "/images/home/tech/tech_2.webp",
  "/images/home/tech/tech_3.webp",
  "/images/home/tech/tech_4.webp",
  "/images/honors/real/cert_real_6.png",
  "/images/invest/patented_technology_certs.png",
  "/images/logos/china_aging_lg.webp",
  "/images/logos/sysu_lg.webp",
  "/images/logos/tencent_tianlai_lg.webp",
  "/images/logos/yinfa_lg.webp",
  "/images/news/news_1.webp",
  "/images/news/news_2.webp",
  "/images/news/news_3.webp",
  "/images/news/news_4.webp",
  "/images/news/news_5.webp",
  "/images/news/news_6.webp",
  "/images/news/news_7.webp",
  "/images/news/news_8.webp",
  "/images/news/news_9.webp",
  "/images/news/news_10.webp",
  "/images/product/banner_title.webp",
  "/images/product/bg/neck_bg.webp",
  "/images/product/bg/ric_bg.webp",
  "/images/product/bg/ric_tencent_bg.webp",
  "/images/product/cert_badges_iso_ce_fda.png",
  "/images/product/clinical_report_placeholder.png",
  "/images/product/product_series_4models.png",
  "/images/products/product_skyworth_b1.png",
  "/images/products/product_skyworth_p1.png",
  "/images/products/product_skyworth_q2.png",
  "/images/products/product_skyworth_q3.png",
  "/images/service/banner_title.webp",
  "/images/service/c2m_bg.jpg",
  "/images/service/c2m_logo.webp",
  "/images/wearable/banner_wearable.png",
  "/images/wearable/skyworth_adult_smartwatch.png",
];

/* ---------- 1. 删除 key 行 ---------- */
function deleteKeyLines() {
  let totalDeleted = 0;
  for (const [file, keys] of Object.entries(keysToDelete)) {
    const fullPath = path.join(imagesDir, file);
    if (!fs.existsSync(fullPath)) {
      console.warn(`MISSING: ${file}`);
      continue;
    }
    let content = fs.readFileSync(fullPath, "utf8");
    let deletedInFile = 0;

    for (const key of keys) {
      // 匹配整行: 可选空格 + 可选引号 + key + 可选引号 + : + "/images/..." + 可选逗号 + 可选注释 + 换行
      // 注意要兼容 key 带引号和不带引号两种形式
      const patterns = [
        // 不带引号的 key: `  keyName: "/images/xxx",  // 注释\n`
        new RegExp(`^\\s*${key}\\s*:\\s*["']/images/[^"']+["']\\s*,?\\s*(//[^\n]*)?\\n`, "gm"),
        // 带引号的 key: `  "keyName": "/images/xxx",  // 注释\n`
        new RegExp(`^\\s*["']${key}["']\\s*:\\s*["']/images/[^"']+["']\\s*,?\\s*(//[^\n]*)?\\n`, "gm"),
      ];

      let matched = false;
      for (const pattern of patterns) {
        const before = content;
        content = content.replace(pattern, "");
        if (content !== before) {
          matched = true;
          deletedInFile++;
          break;
        }
      }
      if (!matched) {
        console.warn(`  KEY NOT FOUND in ${file}: ${key}`);
      }
    }

    fs.writeFileSync(fullPath, content, "utf8");
    console.log(`${file}: deleted ${deletedInFile} keys`);
    totalDeleted += deletedInFile;
  }
  console.log(`Total keys deleted: ${totalDeleted}\n`);
}

/* ---------- 2. 归档文件 ---------- */
function archiveFiles() {
  if (!fs.existsSync(archiveDir)) {
    fs.mkdirSync(archiveDir, { recursive: true });
  }

  let archived = 0;
  let missing = 0;
  for (const relPath of filesToArchive) {
    // relPath 形如 "/images/about/about_brand.webp"
    const srcPath = path.join(publicImagesDir, relPath.replace(/^\/images\//, ""));
    if (!fs.existsSync(srcPath)) {
      console.warn(`  MISSING FILE: ${relPath}`);
      missing++;
      continue;
    }
    // 保持相对目录结构归档
    const dstPath = path.join(archiveDir, relPath.replace(/^\/images\//, ""));
    const dstDir = path.dirname(dstPath);
    if (!fs.existsSync(dstDir)) {
      fs.mkdirSync(dstDir, { recursive: true });
    }
    fs.renameSync(srcPath, dstPath);
    console.log(`  ARCHIVED: ${relPath}`);
    archived++;
  }
  console.log(`\nTotal files archived: ${archived}, missing: ${missing}\n`);
}

/* ---------- 主流程 ---------- */
console.log("=== Step 1: Delete unused key lines ===\n");
deleteKeyLines();

console.log("=== Step 2: Archive unused files ===\n");
archiveFiles();

console.log("Done.");

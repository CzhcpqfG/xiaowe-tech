# 图片压缩优化计划

## 摘要

项目当前 `public/images/` 共 146 张图片、**84.75 MB**,其中 89 张 PNG 占 83.65 MB(98.7%),是首页/产品页/招商页加载慢的主因。`public/videos/` 仅 3.47 MB,非瓶颈。

本计划将 89 张 PNG + 4 张 JPG/JPEG 转为 WebP,并对超大图智能缩放,预期总图片体积从 **84.75 MB → 10-15 MB**(降幅 80-88%)。原 PNG 备份到项目外目录 `d:\VibeTest\bigsound_original_backup_20260726\`,可完整回滚。视频暂不处理。

## 当前状态分析

### 体积分布(已实测)

| 格式 | 数量 | 体积 | 占比 |
|------|------|------|------|
| PNG | 89 | 83.65 MB | 98.7% |
| WebP | 27 | 0.96 MB | 1.1% |
| JPG/JPEG | 4 | 0.12 MB | 0.1% |
| SVG | 25 | 0.01 MB | <0.1% |
| ICO | 1 | <0.01 MB | - |
| **合计** | **146** | **84.75 MB** | |

视频: `promo.mp4` 1.35 MB + `promo_v2.mp4` 2.12 MB = 3.47 MB(本次不处理)

### Top 10 最大图片(全部为 PNG,AI 生成)

| 路径 | 体积 |
|------|------|
| `careers/careers_company_intro.png` | 2.40 MB |
| `careers/careers_cat_production.png` | 2.18 MB |
| `careers/careers_cat_hr.png` | 2.09 MB |
| `about/team/team_member_2.png` | 2.05 MB |
| `about/culture/values.png` | 2.03 MB |
| `product/service_center_store_hd.png` | 2.01 MB |
| `invest/production_equipment.png` | 1.95 MB |
| `invest/hearing_prevalence.png` | 1.94 MB |
| `careers/careers_cat_marketing.png` | 1.92 MB |
| `invest/own_factory_overview.png` | 1.82 MB |

### 工具依赖现状

- `sharp` / `svgo` / `imagemin` / `tinypng` / `jimp` 均未安装
- `ffmpeg` 已可用(路径: `d:\TRAE SOLO CN\resources\app\bin\ffmpeg.exe`,本次不用)
- Node v22.16.0 / npm 10.9.4,原生支持 sharp 预编译二进制

### 图片引用位置(共 20 处需更新)

**src/ 下 14 个文件:**
- `src/data/images/{about,careers,common,home,invest,product,wearable}.ts`(7 个 IMAGES 模块)
- `src/data/product.ts`(数据文件硬编码)
- `src/data/about.ts`(数据文件硬编码)
- `src/components/invest/InvestmentPolicyTable.tsx`
- `src/components/invest/HearingLossGradeTable.tsx`
- `src/config/schema.ts`(JSON-LD 结构化数据)
- `src/components/SEO.tsx`(OG image)
- `src/pages/NotFoundPage.tsx`

**index.html 4 处:**
- L13: `<link rel="apple-touch-icon" href="/images/common/logo.png">`
- L28: JSON-LD `"logo": "https://www.bigsound.cc/images/common/logo.png"`
- L29: JSON-LD `"image": "https://www.bigsound.cc/images/common/logo.png"`
- L80: JSON-LD `"image": "https://www.bigsound.cc/images/product/service_center_store_hd.png"`

**public/ 下 2 个配置文件:**
- `public/site.webmanifest`
- `public/.well-known/ai-plugin.json`

## 提议变更

### 变更 1: 安装 sharp 依赖

**文件**: `d:\VibeTest\bigsound\package.json`

**操作**: 添加 `sharp` 到 `devDependencies`

**原因**: sharp 是 Node 生态最快的图片处理库,基于 libvips,支持 PNG/JPG → WebP 转换 + 智能缩放,无需 native build

**命令**: `npm install --save-dev sharp`

### 变更 2: 新建压缩脚本

**文件**: `d:\VibeTest\bigsound\scripts\compress-images.cjs`(新建)

**功能**:
1. 扫描 `public/images/**/*.{png,jpg,jpeg}`(共 93 张)
2. 备份原文件到 `d:\VibeTest\bigsound_original_backup_20260726\`,保持原目录结构
3. 用 sharp 转 WebP,参数:
   - `quality: 80`(视觉无损,体积最优)
   - `effort: 4`(压缩效率与速度平衡,0-6)
   - 智能缩放:超过目标最大边的图按比例缩小(只缩小,不放大)
4. 输出 `.webp` 到原位置,删除原 `.png`/`.jpg`/`.jpeg`
5. SVG/ICO/已存在的 WebP 不处理
6. 控制台输出每张图的压缩前后体积 + 总体积对比

**智能缩放尺寸规则**(基于代码注释中的设计尺寸):

| 目录/文件 | 目标最大边 | 用途 |
|----------|-----------|------|
| `invest/hero_invest*.png` | 1920 px | 招商页 Hero 大图 |
| `invest/expert_team_wide.png` | 1920 px | 宽幅长图 |
| `about/hero_bg_skyworth_building.png` | 1920 px | About Hero 背景 |
| `home_products/*.png` | 1200 px | 首页三大产品图 |
| `invest/*.png`(其余) | 1200 px | 招商页内容配图 |
| `careers/*.png` | 1200 px | 招聘页配图 |
| `product/family_portrait.png` | 1600 px | 12 款产品全家福 |
| `product/*.png`(其余) | 1200 px | 产品页配图 |
| `products/*.png` | 800 px | 1:1 产品主图(卡片用) |
| `equipment/*.png` | 800 px | 设备卡片图 |
| `wearable/*.png` | 800 px | 智能穿戴卡片图 |
| `about/team/*.png` | 400 px | 团队成员头像 |
| `about/culture/*.png` | 1200 px | 企业文化配图 |
| `about/research_*.png` | 1600 px | 研发背景图 |
| `honors/real/*.png` | 600 px | 证书图(2 列布局) |
| `common/logo.png` | 400 px | 网站 logo |
| `common/not_found.png` | 800 px | 404 图 |
| 默认 | 1600 px | 兜底 |

**脚本骨架**:

```javascript
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const PUBLIC_IMAGES = "d:/VibeTest/bigsound/public/images";
const BACKUP_DIR = "d:/VibeTest/bigsound_original_backup_20260726";

const SIZE_RULES = [
  { pattern: /invest[\\/]hero_invest.*\.png$/i, maxEdge: 1920 },
  { pattern: /invest[\\/]expert_team_wide\.png$/i, maxEdge: 1920 },
  // ... 完整规则
];

function getTargetSize(filePath) {
  for (const rule of SIZE_RULES) {
    if (rule.pattern.test(filePath)) return rule.maxEdge;
  }
  return 1600;
}

async function compressOne(srcPath) {
  const ext = path.extname(srcPath).toLowerCase();
  if (![".png", ".jpg", ".jpeg"].includes(ext)) return null;

  const relPath = path.relative(PUBLIC_IMAGES, srcPath);
  const backupPath = path.join(BACKUP_DIR, relPath);
  const webpPath = srcPath.replace(/\.(png|jpg|jpeg)$/i, ".webp");

  // 1. 备份原文件
  fs.mkdirSync(path.dirname(backupPath), { recursive: true });
  fs.copyFileSync(srcPath, backupPath);

  // 2. 读取原图尺寸
  const metadata = await sharp(srcPath).metadata();
  const maxEdge = getTargetSize(relPath);

  // 3. 转 WebP + 智能缩放
  let pipeline = sharp(srcPath);
  if (metadata.width > maxEdge || metadata.height > maxEdge) {
    pipeline = pipeline.resize({
      width: metadata.width >= metadata.height ? maxEdge : null,
      height: metadata.height > metadata.width ? maxEdge : null,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  await pipeline.webp({ quality: 80, effort: 4 }).toFile(webpPath);

  // 4. 删除原文件
  fs.unlinkSync(srcPath);

  return {
    file: relPath,
    before: fs.statSync(backupPath).size,
    after: fs.statSync(webpPath).size,
  };
}

async function main() {
  // 递归扫描所有图片
  const results = [];
  // ... 遍历 + 调用 compressOne
  // 输出汇总报告
}
```

### 变更 3: 新建引用更新脚本

**文件**: `d:\VibeTest\bigsound\scripts\update-image-refs-to-webp.cjs`(新建)

**功能**: 扫描所有引用图片的代码文件,将 `.png` / `.jpg` / `.jpeg` 后缀改为 `.webp`

**处理范围**:
- `src/data/images/*.ts`(7 个模块)
- `src/data/product.ts`、`src/data/about.ts`
- `src/components/invest/InvestmentPolicyTable.tsx`
- `src/components/invest/HearingLossGradeTable.tsx`
- `src/config/schema.ts`
- `src/components/SEO.tsx`
- `src/pages/NotFoundPage.tsx`
- `index.html`
- `public/site.webmanifest`
- `public/.well-known/ai-plugin.json`

**核心逻辑**:

```javascript
const fs = require("fs");
const path = require("path");

const TARGET_FILES = [
  "src/data/images/about.ts",
  "src/data/images/careers.ts",
  // ... 完整列表
];

function replaceRefs(content) {
  // 仅替换 /images/... 路径下的图片引用,不动其他 .png 字符串
  return content.replace(
    /(\/images\/[^"'`)]+?)\.(png|jpg|jpeg)/gi,
    "$1.webp"
  );
}

for (const file of TARGET_FILES) {
  const full = path.join("d:/VibeTest/bigsound", file);
  const content = fs.readFileSync(full, "utf8");
  const updated = replaceRefs(content);
  if (updated !== content) {
    fs.writeFileSync(full, updated, "utf8");
    console.log(`Updated: ${file}`);
  }
}
```

### 变更 4: 注册 npm script

**文件**: `d:\VibeTest\bigsound\package.json`

**变更**:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build && tsx scripts/fix-base-paths.ts",
  "postbuild": "tsx scripts/prerender.ts",
  "preview": "vite preview",
  "prerender": "tsx scripts/prerender.ts",
  "compress:images": "node scripts/compress-images.cjs",
  "update:image-refs": "node scripts/update-image-refs-to-webp.cjs"
}
```

### 变更 5: 更新 .gitignore(可选)

**文件**: `d:\VibeTest\bigsound\.gitignore`

**变更**: 添加备份目录排除(虽然备份在项目外,但为防止误操作):

```
# 图片压缩备份(项目外,但保险起见)
bigsound_original_backup_*/
```

### 变更 6: 更新开发日志

**文件**: `d:\VibeTest\bigsound\DEV_LOG.md`

**变更**: 顶部新增 2026-07-26 条目,记录:
- 图片压缩优化完整变更
- 体积前后对比
- 备份目录路径
- 回滚方式

## 假设与决策

### 假设
1. 部署环境支持 WebP(项目已有 27 张 WebP 在生产中使用,验证通过)
2. 所有现代浏览器(Chrome/Edge/Firefox/Safari 14+/移动端)支持 WebP
3. SVG/ICO 不需要处理(SVG 已是矢量,ICO 是 favicon)
4. 已存在的 WebP 不需要重新压缩(已优化,体积 0.96 MB)

### 决策
1. **格式**: PNG → WebP(用户确认),quality 80 + effort 4(视觉无损 + 速度平衡)
2. **原文件**: 备份到项目外 `d:\VibeTest\bigsound_original_backup_20260726\`(用户确认)
3. **视频**: 暂不处理(用户确认,3.47 MB 非瓶颈)
4. **智能缩放**: 仅缩小不放大,保留原图宽高比
5. **保留文件名**: 仅改后缀(`.png` → `.webp`),避免破坏 IMAGES key 映射
6. **Sharp 安装为 devDependency**: 仅构建时使用,不进入运行时 bundle

### 不做的事
- 不引入 `<picture>` 标签 + PNG fallback(项目对 WebP 兼容性已验证,增加复杂度无收益)
- 不改造为 ESM `import xxx from './xxx.webp'`(与现有 IMAGES 常量架构冲突)
- 不处理 `aigpic/` 目录(开发暂存,不进构建)
- 不处理 `dist/`(`vite build` 会重新生成)
- 不处理 SVG(SVG 已极小,0.01 MB)
- 不动 `public/videos/`(用户确认)

## 实施步骤(执行顺序)

1. **安装依赖**: `npm install --save-dev sharp`
2. **创建备份目录**: `d:\VibeTest\bigsound_original_backup_20260726\`
3. **编写压缩脚本**: `scripts/compress-images.cjs`
4. **执行压缩**: `npm run compress:images`
5. **验证压缩结果**: 检查 `public/images/` 下 PNG 已转为 WebP,备份目录完整
6. **编写引用更新脚本**: `scripts/update-image-refs-to-webp.cjs`
7. **执行引用更新**: `npm run update:image-refs`
8. **类型检查**: `npx tsc --noEmit`
9. **构建验证**: `npx vite build`
10. **预渲染验证**: `npm run prerender`(验证 24 个静态 HTML 页面正常生成)
11. **视觉验证**: 启动 `npm run dev`,浏览首页/产品页/招商页/关于页,确认视觉无损
12. **体积对比报告**: 用 PowerShell 统计压缩前后 `public/images/` 总体积
13. **更新 DEV_LOG.md**: 记录完整变更

## 验证步骤

### 1. 压缩前后体积对比

```powershell
# 压缩前(已实测): 84.75 MB
Get-ChildItem -Path "d:\VibeTest\bigsound\public\images" -Recurse -File |
  Measure-Object Length -Sum | Select-Object Count, @{N='TotalMB';E={[math]::Round($_.Sum/1MB,2)}}

# 压缩后预期: 10-15 MB
```

### 2. 备份完整性

```powershell
# 备份目录应有 93 个 PNG/JPG/JPEG 文件
Get-ChildItem -Path "d:\VibeTest\bigsound_original_backup_20260726" -Recurse -File |
  Measure-Object Length -Sum | Select-Object Count, @{N='TotalMB';E={[math]::Round($_.Sum/1MB,2)}}
```

### 3. 编译验证

```bash
npx tsc --noEmit
# 预期: 无错误
```

### 4. 构建验证

```bash
npx vite build
# 预期: 构建成功,dist/images/ 体积从 84.75 MB 降至 10-15 MB
```

### 5. 预渲染验证

```bash
npm run prerender
# 预期: 24 个静态 HTML(3 语种 × 8 路由)全部生成成功,无图片 404
```

### 6. 视觉验证(关键)

启动 `npm run dev`,逐一访问以下页面,确认图片正常显示、视觉无损:
- `http://localhost:5173/zh-CN/`(首页,验证三大产品图 + hero 视频)
- `http://localhost:5173/zh-CN/product`(产品页,验证 12 款产品主图 + 全家福)
- `http://localhost:5173/zh-CN/invest`(招商页,验证 hero_invest 三语版 + 25 张配图)
- `http://localhost:5173/zh-CN/about`(关于页,验证团队头像 + 文化图 + 证书图)
- `http://localhost:5173/zh-CN/careers`(招聘页,验证 5 张大图)
- `http://localhost:5173/zh-CN/equipment`(设备页,验证 6 张设备图)
- `http://localhost:5173/zh-CN/wearable`(智能穿戴页,验证 11 张产品图)
- 三语切换验证: zh-CN / zh-TW / en

### 7. 网络加载验证(用户核心诉求)

在浏览器 DevTools → Network → Slow 3G 节流模式下,刷新首页,观察:
- 图片加载总耗时显著下降
- 单张图片体积均 < 200 KB
- 无 404 错误

## 回滚方案

如压缩后出现视觉问题或兼容性问题:

```bash
# 1. 删除 WebP 版本
Remove-Item -Path "d:\VibeTest\bigsound\public\images" -Recurse -Include *.webp -Force

# 2. 从备份恢复原 PNG/JPG/JPEG
Copy-Item -Path "d:\VibeTest\bigsound_original_backup_20260726\*" `
          -Destination "d:\VibeTest\bigsound\public\images\" `
          -Recurse -Force

# 3. 反向更新引用(.webp → .png)
# 可手动 git checkout src/ index.html public/site.webmanifest public/.well-known/ai-plugin.json
```

## 影响范围

### 修改文件
- `package.json`(加 2 个 devDependencies: sharp;加 2 个 scripts)
- `scripts/compress-images.cjs`(新建)
- `scripts/update-image-refs-to-webp.cjs`(新建)
- `src/data/images/{about,careers,common,home,invest,product,wearable}.ts`(7 个)
- `src/data/product.ts`
- `src/data/about.ts`
- `src/components/invest/InvestmentPolicyTable.tsx`
- `src/components/invest/HearingLossGradeTable.tsx`
- `src/config/schema.ts`
- `src/components/SEO.tsx`
- `src/pages/NotFoundPage.tsx`
- `index.html`
- `public/site.webmanifest`
- `public/.well-known/ai-plugin.json`
- `DEV_LOG.md`
- `.gitignore`(可选)

### 修改资源(自动转换)
- `public/images/**/*.{png,jpg,jpeg}` 93 张 → 同名 `.webp`
- 备份到 `d:\VibeTest\bigsound_original_backup_20260726\`

### 不修改
- `public/videos/`(用户确认不处理)
- `public/images/**/*.svg`(25 张矢量图,已极小)
- `public/images/**/*.webp`(27 张已优化的 WebP)
- `public/images/common/favicon.ico`
- `aigpic/`(开发暂存目录)
- `dist/`(构建产物,vite build 会重新生成)

## 预期收益

| 指标 | 压缩前 | 压缩后(预期) | 降幅 |
|------|--------|-------------|------|
| 图片总体积 | 84.75 MB | 10-15 MB | 80-88% |
| 单张最大图 | 2.40 MB | < 400 KB | > 83% |
| 首页加载总资源 | ~88 MB | ~5-8 MB | > 90% |
| 3G 网络首屏时间 | 显著慢 | 显著改善 | - |

## 后续可选优化(本次不做)

1. **SVG 优化**: 用 `svgo` 压缩 25 张 SVG(当前仅 0.01 MB,收益微小)
2. **视频压缩**: 用 ffmpeg 重编码 `promo_v2.mp4`(当前 2.12 MB,可降至 1-1.5 MB)
3. **AVIF 升级**: 未来 Safari 16.4+ 普及后可考虑升级到 AVIF
4. **响应式图片**: 用 `<picture>` + `srcset` 提供 1x/2x 多分辨率
5. **CDN 加速**: 部署到 CDN,利用边缘缓存

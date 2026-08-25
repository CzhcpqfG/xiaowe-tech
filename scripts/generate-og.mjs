/**
 * 生成 OG 默认分享图 (1200×630)
 *
 * 设计: 高级白/浅灰底 + 品牌绿 #05a045 + 大字文案 (符合用户偏好: 医疗科技感)
 * 输出: public/images/common/og-default.png
 *
 * 用法: node scripts/generate-og.mjs
 */
import sharp from "sharp";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "../public/images/common/og-default.png");

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f2f6f3"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0bb254"/>
      <stop offset="100%" stop-color="#048b3c"/>
    </linearGradient>
  </defs>

  <!-- 背景 -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- 左侧品牌色竖条 (视觉锚点) -->
  <rect x="0" y="0" width="14" height="630" fill="url(#accent)"/>

  <!-- 左上品牌 logo 区: 绿色圆角方块 + 文字 -->
  <rect x="70" y="60" width="56" height="56" rx="12" fill="#05a045"/>
  <text x="98" y="98" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">大</text>
  <text x="70" y="138" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="20" font-weight="700" fill="#1a1a1a">大声 AI 中文助听器</text>
  <text x="212" y="138" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="15" fill="#8a8f8b" letter-spacing="1">BIGSOUND</text>

  <!-- 中央主标题 -->
  <text x="70" y="300" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="64" font-weight="700" fill="#1a1a1a">听见世界, 大声说出来</text>

  <!-- 副标题 -->
  <text x="70" y="372" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="28" fill="#555555">中文言语增强算法 2.0 · 腾讯天籁技术合作</text>

  <!-- 医疗资质 + 品牌信息 -->
  <text x="70" y="452" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="19" fill="#8a8f8b">医疗器械注册证号: 粤械注准20232192086</text>

  <!-- 底部信息条 -->
  <rect x="0" y="540" width="1200" height="90" fill="#0e2f1d"/>
  <text x="70" y="596" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="20" fill="#ffffff">小维健康科技 (深圳) 有限公司 · 创维生态旗下</text>
  <text x="930" y="596" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="20" fill="#ffffff" text-anchor="start">服务热线 400-116-9566</text>
</svg>
`;

try {
  await sharp(Buffer.from(svg))
    .resize(1200, 630)
    .png({ compressionLevel: 9 })
    .toFile(OUT);
  console.log(`✓ OG 默认图已生成: ${OUT}`);
} catch (err) {
  console.error("✗ OG 图生成失败:", err.message);
  console.error("  提示: 若字体渲染异常, 请确认系统装有 Microsoft YaHei / 中文字体");
  process.exit(1);
}
/**
 * 首页模块图片资源
 * 包含首页所有 section 使用的图片:
 *   - 关于我们 (heroLogo, heroBrand)
 *   - 三大核心技术 (tech1-3)
 *   - 旗舰产品 (product1, flagshipLogo)
 *   - 产品系列 (product2-4)
 *   - 听力健康研究 (hearingResearch)
 *   - 战略合作伙伴 (partner1-4)
 *   - 资质证书 (cert1-3)
 *   - 底部 CTA (ctaLogoMain, ctaLogoDasoundZtq, ctaLogoDasoundTl, ctaLogoXhs)
 */

export const HOME_IMAGES = {
  // 关于我们 section

  // 三大核心技术配图 - 原站真实尺寸 520×313

  // 产品图
  // 旗舰产品: 产品图 297×297, logo 196×37
  product1: "/images/home/products/flagship_product.webp", // 旗舰产品主图 800×800
  // 产品系列: 287×287
  product2: "/images/home/products/series_1.webp", // 耳背式 750×750
  product3: "/images/home/products/series_2.webp", // 颈挂式 750×750
  product4: "/images/home/products/series_3.webp", // 耳内式 750×750

  // 合作伙伴 - 战略投资 4 家 (2026-07-21 用户指示方案 B, 首页 Partners 与关于页 §3.10 战略投资组保持一致)
  // 详见 public/images/LOGOS_IDENTIFICATION.md
  partner1: "/images/logos/skyworth.webp", // 创维集团 (网上下载真实 logo, skyworth_v2.jpg)
  partner2: "/images/about/partners/partner_huapengfei.webp", // 华鹏飞股份 (用户提供真实 logo)
  partner3: "/images/about/partners/partner_haihe.webp", // 海和 (用户提供真实 logo)
  partner4: "/images/about/partners/partner_xinsheng.webp", // 新生 / 新声® (用户提供真实 logo)

  // 听力健康研究配图 (参考 xiaowe.cc row10, 原图 1098×560)
  hearingResearch: "/images/home/research/hearing_research.webp",

  // 资质证书 (参考 xiaowe.cc row18, 3 张证书图)
  cert1: "/images/honors/real/cert_1.webp", // 二类医疗器械注册证 242×183
  cert2: "/images/honors/real/cert_2.webp", // 生产许可证 257×182
  cert3: "/images/honors/real/cert_3.webp", // 经营许可证 258×182

  // 底部 CTA logo (原网站 idx=20, 4 张图片)

  /* ============================================================
     官网 3.0 首页新增资源 (基于 PROTOTYPE_PAGES.md §二)
     通过速创API (gpt-image-2) 生成, 保存于 /public/images/homepage_v3/
     生成时间: 2026-07-20
     ============================================================ */

  // Hero 区 Logo 区 (原型 §2.1.1): 创维中英文 logo + 大声中英文 logo
  // 大声 logo 复用现有 heroLogo / logo 资源
  // 创维 logo (TODO: 替换为独立创维 logo 文件)
  heroProductHearingAid: "/images/home_products/home_product_hearing_aid.webp", // AI 中文助听器产品图
  heroProductWatch: "/images/home_products/home_product_smartwatch.webp", // 健康智能手表产品图
  heroProductEarphone: "/images/home_products/home_product_earbuds.webp", // 智能蓝牙耳机产品图
} as const;

/**
 * 关于页图片资源
 * 来源:
 *   - 用户提供的真实 logo (public/images/about/partners/) - §3.10 合作伙伴 4 张真实 logo (华鹏飞/海和/新生/深圳大学, 用户 2026-07-21 提供)
 *   - 原网站 2.0 资源 (public/images/06_product_*.webp) - §3.10 合作伙伴 3 张真实 logo (腾讯天籁/银发听力健康/中山大学孙逸仙纪念医院)
 *   - 原网站 2.0 资源 (public/images/original/partner*.webp) - §3.10 合作伙伴 2 张真实 logo (创维/中国老龄事业发展基金会)
 *   - randomuser.me 在线头像 (public/images/about/team/) - §3.9 核心团队 4 名成员头像占位
 *   - AI 生图 (public/images/about/) - §3.1 Hero 背景 (速创API gpt-image-2)
 *   - 原网站 2.0 资源 (public/images/original/) - 旧版品牌图 / 创始人王海照片 / MISSION/VISION 配图
 *
 * 注意:
 *   - 新版 3.0 关于页 §3.1 使用 AI 生图占位
 *   - 新版 3.0 关于页 §3.8+§3.9 合并为核心团队 section (创始人真实照片 + 4 成员随机头像占位)
 *   - 新版 3.0 关于页 §3.10 拆为战略投资 + 战略合作两组, 共 9 个合作伙伴 logo, 全部为真实 logo
 *   - 保留 aboutBrand / aboutFounder / missionVision1-2 用于兼容旧版引用 (新版 AboutPage 已不再使用)
 */

export const ABOUT_IMAGES = {
  // 关于页 - 品牌介绍图 + 创始人王海照片 (旧版 2.0 资源, 保留兼容)
  aboutFounder: "/images/about/about_founder.webp", // 创始人王海 205×205 (旧版)

  // 关于页 VISION/MISSION 图文大模块配图 (旧版 2.0 资源, 保留兼容)

  // §3.1 Hero 背景 - AI 生图占位 (速创API gpt-image-2 16:9)
  aboutHeroBg: "/images/about/hero_bg_skyworth_building.webp", // 创维大楼/企业总部背景

  // §3.9 核心团队 4 名成员 - 从参考图 team_exec_card.png 脚本裁剪生成
  teamMemberCoo: "/images/about/team/team_member_1.webp", // 郑明春 联合创始人兼 COO
  teamMemberCmo: "/images/about/team/team_member_2.webp", // 温业锋 CMO
  teamMemberRdDirector: "/images/about/team/team_member_3.webp", // 龙浩军 研发总监
  teamMemberProductionDirector: "/images/about/team/team_member_4.webp", // 南鹏升 生产总监

  // §3.10 战略合作伙伴 - 战略投资 4 家 (全部真实 logo)
  partnerSkyworth: "/images/logos/skyworth.webp", // 创维集团 logo (真实, 网上下载, 2026-07-21)
  partnerHuapengfei: "/images/about/partners/partner_huapengfei.webp", // 华鹏飞股份 logo (真实, 用户 2026-07-21 提供)
  partnerHaihe: "/images/about/partners/partner_haihe.webp", // 海和 logo (真实, 用户 2026-07-21 提供)
  partnerXinsheng: "/images/about/partners/partner_xinsheng.webp", // 新生 logo (真实, 用户 2026-07-21 提供, 实为新声®品牌)

  // §3.10 战略合作伙伴 - 战略合作 5 家 (全部真实 logo)
  partnerTencent: "/images/logos/tencent_tianlai_lg.webp", // 腾讯天籁 logo (大尺寸, 2026-07-21 浏览器多模态识别确认)
  partnerYinfa: "/images/logos/yinfa_lg.webp", // 银发听力健康 logo (大尺寸, 2026-07-21 浏览器多模态识别确认)
  partnerSzu: "/images/about/partners/partner_szu.webp", // 深圳大学 logo (真实, 用户 2026-07-21 提供)
  partnerChinaAging: "/images/logos/china_aging_lg.webp", // 中国老龄事业发展基金会 logo (大尺寸, 2026-07-21 浏览器多模态识别确认)
  partnerSysu: "/images/logos/sysu_lg.webp", // 中山大学孙逸仙纪念医院 logo (大尺寸, 2026-07-21 浏览器多模态识别确认, 用户已确认 06_product_8 = 孙逸仙)

  // §3.6 企业文化 - 3 张 16:9 横版配图 (速创API gpt-image-2)
  cultureMission: "/images/about/culture/mission.webp", // 使命: 听力健康/老人佩戴助听器温馨场景
  cultureVision: "/images/about/culture/vision.webp", // 愿景: 中国服务网络/全球科技愿景
  cultureValues: "/images/about/culture/values.webp", // 价值观: 用户第一/真诚服务

  // §3.5 两大研究方向 - 2 张背景图 (速创API gpt-image-2, 3:2 横版, 卡片背景配白色蒙版使用)
  researchHearingBg: "/images/about/research_hearing_bg.webp", // 听力健康研究: 声波/助听器科技抽象图
  researchWearableBg: "/images/about/research_wearable_bg.webp", // 穿戴健康研究: 智能手表/健康监测抽象图

  // §3.7 荣誉资质 - 真实证书图片 (public/images/honors/real/, 用户 2026-07-25 提供)
  // 9 张真实证书图, 两行布局: 第一行 5 张 (cert_real_1-5.png) + 第二行 4 张 (cert_real_6.png + cert1-3.webp)
  honorReal1: "/images/honors/real/cert_real_1.webp",
  honorReal2: "/images/honors/real/cert_real_2.webp",
  honorReal3: "/images/honors/real/cert_real_3.webp",
  honorReal4: "/images/honors/real/cert_real_4.webp",
  honorReal5: "/images/honors/real/cert_real_5.webp",
  honorReal6: "/images/honors/real/cert_real_6.webp",
  honorReal7: "/images/honors/real/cert_1.webp",
  honorReal8: "/images/honors/real/cert_2.webp",
  honorReal9: "/images/honors/real/cert_3.webp",

  // §3.7 荣誉资质 - 10 张占位证书键已于 2026-07-25 清理 (对应图片归档到 docs/_archived/images/honors/)
} as const;

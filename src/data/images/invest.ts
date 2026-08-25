/**
 * 招商加盟页图片资源
 * 数据源: PROTOTYPE_PAGES.md §6 + §十一 图片清单
 * 所有图片已整理到 public/images/invest/ 与 public/images/honors/real/ 目录
 */

export const INVEST_IMAGES = {

  /* 招商页 Hero - 商务握手 + 艺术字 (AI 生成, 2:1, 三套 locale 版本) */
  heroInvest: "/images/invest/hero_invest.webp", // zh-CN: "声价千亿 聚势共赢"
  heroInvestZhTW: "/images/invest/hero_invest_zh-TW.webp", // zh-TW: "聲價千億 聚勢共贏"
  heroInvestEn: "/images/invest/hero_invest_en.webp", // en: "BILLIONS IN SOUND · SYNERGY FOR SUCCESS"

  /* §6.5 专家全程带教 - 专家团队横向长图 (AI 生成: 高端商务摄影风格, 16:9) */
  investExpertTeam: "/images/invest/expert_team_wide.webp",

  /* §6.4 医疗资质齐全 - 5 张真实证书图 (用户提供, 2 列布局) */
  certReal1: "/images/honors/real/cert_real_1.webp",
  certReal2: "/images/honors/real/cert_real_2.webp",
  certReal3: "/images/honors/real/cert_real_3.webp",
  certReal4: "/images/honors/real/cert_real_4.webp",
  certReal5: "/images/honors/real/cert_real_5.webp",

  /* §6.3 行业前景好 - 听力行业的"三高一低" */
  // 高流行 - 全球听力受损概念图 (AI 生成)
  investHearingPrevalence: "/images/invest/hearing_prevalence.webp",
  // 高危害 - 老年痴呆 / 更易摔倒 / 抑郁症 (AI 生成)
  investHarmDementia: "/images/invest/harm_dementia.webp",
  investHarmFalling: "/images/invest/harm_falling.webp",
  investHarmDepression: "/images/invest/harm_depression.webp",
  // 听力损失分级表
  investHearingLossGrade: "/images/invest/hearing_loss_grade_table.webp",
  // 中国听力健康市场现状 - 场景图 (AI 生成: 听力诊所场景, 4:3)
  investChinaHearingLoss: "/images/invest/china_hearing_scene.webp",
  // 助听器需求趋势
  investHearingAidDemand: "/images/invest/hearing_aid_demand_trend.webp",

  /* §6.4 项目优势强 */
  // 自有工厂概览
  investOwnFactory: "/images/invest/own_factory_overview.webp",
  // 医疗器械证书墙
  investCertWall: "/images/invest/certifications_registrations.webp",
  // 30+ 专利证书矩阵 (复用)
  investPatentCerts: "/images/invest/patented_technology_certs.webp",
  // 专业生产设备 (AI 生成)
  investProductionEquipment: "/images/invest/production_equipment.webp",

  /* §6.5 合作政策 - 兜底式全面扶持 */
  // 店铺形象设计
  investStoreDesign: "/images/invest/store_storefront_design.webp",
  // 联营店平面图 (AI 生成: 俯视图 20m² 联营店布局)
  investStoreFloorplan: "/images/invest/store_floorplan.webp",
  // 全域营销赋能 - 4 张真实截图 (2×2 铺满)
  investMarketing1: "/images/invest/invest_marketing_1.webp",
  investMarketing2: "/images/invest/invest_marketing_2.webp",
  investMarketing3: "/images/invest/invest_marketing_3.webp",
  investMarketing4: "/images/invest/invest_marketing_4.webp",
  // 总部代运营兜底 - 2 张真实截图 (一行排列)
  investOperations1: "/images/invest/invest_operations_1.webp",
  investOperations2: "/images/invest/invest_operations_2.webp",
} as const;

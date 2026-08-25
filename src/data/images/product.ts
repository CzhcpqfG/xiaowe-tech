/**
 * 产品页图片资源
 * 包含产品页 section 背景大图、Banner 标题图、4 个大 logo、原型提取图
 */

export const PRODUCT_IMAGES = {
  // 产品页 section 背景大图 (原网站真实布局:每个产品 section 整体是背景图 + 居中文字)

  // 子页面 Banner 标题图 (原网站用图片实现,非纯文字)

  // §4.2 产品台 - 12 款助听器产品全家福 (AI 生成)
  productFamilyPortrait: "/images/product/family_portrait.webp",

  // 大尺寸 logo (2026-07-21 浏览器多模态识别确认, 原注释全部错位, 已修正, 详见 public/images/LOGOS_IDENTIFICATION.md)

  // 原型提取图 (来源: public/images/product/)
  // §4.6 中文助听核心技术 - 芯片配图
  techRicDiagram: "/images/product/tech_ric_diagram.webp",
  // §4.6 产品系列 4 款助听器渲染图 (用于产品台区配图)
  productRicRender: "/images/product/product_ric_render.webp",

  // 12 款产品卡片配图 (2026-07-25 全部改为 AI 生成, 参考风格: product_bigsound_p1.png)
  // 按形态分类生成, 多款同形态产品共享同款图
  // 注: 软屏蔽产品 (isListed:false) 的 imageKey 保持引用但卡片不渲染, 待真实图补充后恢复
  // 缺图占位 (2026-08-22 清理: 原 AI 图文件不存在, 软屏蔽产品保留 key 防类型断裂, 取消屏蔽前需补图)
  productDabInEarP1: "/images/products/product_dab_in_ear_p1.webp", // DAB006 耳内式 (缺图, isListed:false)
  productDabNeckHungN1: "/images/products/product_dab_neck_hung_n1.webp", // SAN001 颈挂式 (缺图, isListed:false)

  // ============================================================
  // 真实产品主图 (2026-08-14 用户提供, 详情页补充2.0)
  // 替换上架产品的卡片配图, 未上架产品保持 AI 图占位但被软屏蔽
  // ============================================================
  productDab005: "/images/products/product_dab005_main.png", // DAB005 臻听版 (耳背, 缺图, isListed:false 软屏蔽, 取消屏蔽前需补图)
  productSap001: "/images/products/product_sap001_bg.png", // SAP001 悦享版 (骨导)
  productDaq001: "/images/products/product_daq001_bg.png", // DAQ001 尊享版 (耳内)
  productSaq003: "/images/products/product_saq003_bg.png", // SAQ003 (骨导)
  productSan003: "/images/products/product_san003_bg.png", // SAN003 尊享版 (颈挂)
  productBo: "/images/products/product_bo_bg.png", // BO (骨导)

  // ============================================================
  // 真实产品主图 (2026-08-14 第二批, 用户补充: 新建文件夹/后四)
  // ============================================================
  productDab007: "/images/products/product_dab007_bg.png", // DAB007 尊享版 (颈挂)
  productSab001: "/images/products/product_sab001_bg.png", // SAB001 (骨导)
  productSan002: "/images/products/product_san002_bg.png", // SAN002 优享版 (颈挂)
  productSaq002: "/images/products/product_saq002_bg.png", // SAQ002 尊享版 (骨导)

  // 旧版真实产品图 (xiaowe.cc 来源, 2026-07-25 已弃用; 2026-08-22 清理: bigsound_br/p1/q1/n1 文件已不存在且无引用, 删除)
  productSkyworthN2: "/images/products/product_skyworth_n2.webp",

  // §4.8 三甲医院同等百万级检查设备 (AI 生成, 参考原型 2×3 卡片)
  equipmentRealEarAnalyzer: "/images/equipment/real_ear_analyzer.webp",
  equipmentDigitalOtoscope: "/images/equipment/digital_otoscope.webp",
  equipmentAudiologyBooth: "/images/equipment/audiology_booth.webp",
  equipmentAudiometer: "/images/equipment/audiometer.webp",
  equipmentFittingSoftware: "/images/equipment/fitting_software.webp",
  equipmentCleaningDevice: "/images/equipment/cleaning_device.webp",
  // §4.7.1 国家医疗资质 - 资质认证徽章 (ISO9001/CE/FDA 等)
  certReal1: "/images/honors/real/cert_real_1.webp",
  certReal2: "/images/honors/real/cert_real_2.webp",
  certReal3: "/images/honors/real/cert_real_3.webp",
  certReal4: "/images/honors/real/cert_real_4.webp",
  certReal5: "/images/honors/real/cert_real_5.webp",
  clinicalReport: "/images/product/clinical_report.webp",
  // §4.7.2 临床医疗认证 - 山东省耳鼻喉医院 logo (大图)
  sdebhLogoLg: "/images/logos/sdebh_lg.webp",
  // §4.7.3 国家专利认证 - 用户提供的专利矩阵图
  patentMatrixCustom: "/images/product/patent_matrix.webp",
  // §4.7.3 国家专利认证 - 30+ 专利证书矩阵 (旧版, 已弃用, 保留兼容)
  remoteAudiologyConsultation: "/images/product/remote_audiology_consultation.webp",
  serviceCenterStore: "/images/product/service_center_store_hd.webp",
  // §4.8 听力服务中心 - 微信客服二维码
  qrWechatService: "/images/product/qr_wechat_service.webp",
} as const;

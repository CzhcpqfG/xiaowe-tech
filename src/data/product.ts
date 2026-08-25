/**
 * AI 中文助听器页数据 - /product
 * 数据源: PROTOTYPE_PAGES.md §四 (10 section)
 *
 * 模块结构:
 *   - hero: Banner 标题
 *   - productStage: 产品台标题 + 副标
 *   - categorySlogan: 产品分类说明标语
 *   - categories: 产品分类按钮 (4 个)
 *   - products: 12 款产品参数卡片
 *   - coreTech: 中文助听核心技术 (12 项)
 *   - endorsements: 权威背书 (3 子模块)
 *   - serviceCenter: 听力服务中心
 *   - lifecycleService: 全生命周期服务
 *   - warranty: 售后保修政策 (4 章节)
 *
 * 注: 旧版独立 /service 页面内容已合并进本页 section 7-10
 *
 * i18n 改造 (2026-07-25):
 *   - 所有可见文案改为 i18n key 引用 (titleKey / descKey / labelKey 等)
 *   - 保留 locale 无关字段: imageKey / 数字数据 (price / angles / radius 等)
 *   - 翻译文件: src/i18n/locales/{zh-CN,zh-TW,en}/product.json
 */

/** 产品分类按钮 (4 个) - PM 提示: 此列为按钮, 点击后出现对应形态的产品 */
export const PRODUCT_CATEGORY_KEYS = [
  "behind-ear",
  "in-ear",
  "neck-hung",
  "bone-conduction",
] as const;

export type ProductCategoryKey = (typeof PRODUCT_CATEGORY_KEYS)[number];

/** 产品形态分类 (用于产品卡片筛选, 与 PRODUCT_CATEGORY_KEYS 对应) */
export type ProductForm = ProductCategoryKey;

/**
 * 12 款产品参数卡片
 * 形态分类说明 (2026-08-15 PM 确认 8 款上架产品的形态):
 *   - 上架产品按展示顺序: DAB007/SAB001 = 耳背式, SAP001/DAQ001/SAQ002/SAQ003 = 耳内式, SAN003 = 颈挂式, BO = 骨导式
 *   - 未上架产品沿用原型推断: DAB005=耳背 / DAB006=耳内 / SAN001/SAN002=颈挂 (软屏蔽)
 */
export interface ProductItem {
  /** i18n key 前缀: "product:products.{idx}" */
  i18nPrefix: string;
  /** 形态 (用于 Tab 筛选) */
  form: ProductForm;
  /** 零售指导价 (locale 无关, 直接显示) */
  price: string;
  /** 6 项核心特性 (i18n key 前缀: "product:products.{idx}.features.{fIdx}") */
  featuresCount: 6;
  /** 配图 key (对应 IMAGES 中的字段) */
  imageKey: string;
  /**
   * 产品卡片是否上架 (2026-08-14 新增)
   * true  = 有真实配图, 正常显示
   * false = 缺图软屏蔽, 卡片不渲染 (等图片补充后再上)
   */
  isListed: boolean;
  /**
   * 详情页配图 URL 数组 (几十张电商长图, 全屏拼接)
   * 有值 → 卡片可点击进入详情子页面; 无值 → 卡片仅展示不跳转
   */
  detailImages?: readonly string[];
  /** 详情页 URL slug (如 "daq001"), 用于 /product/:slug 路由 */
  slug?: string;
}

/** 构造详情页配图 URL 数组 (2026-08-14 用户提供, 详情页补充2.0) */
const detail = (dir: string, files: readonly string[]): readonly string[] =>
  files.map((f) => `/images/product-detail/${dir}/${f}`);

/** 生成 1..n.webp 序号文件列表 (详情页图均为自然序号命名, 2026-08-16 转 WebP) */
const seq = (n: number): string[] =>
  Array.from({ length: n }, (_, i) => `${i + 1}.webp`);

export const PRODUCTS: ProductItem[] = [
  {
    i18nPrefix: "product:products.0",
    form: "behind-ear",
    price: "Pro 12999 / Max 15999",
    imageKey: "productDab005",
    isListed: false, // 缺产品图 (主图是 551x209 宽条占位图), 软屏蔽
    slug: "dab005", // 有主图, 无详情页 (DAB005没有详情页)
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.1",
    form: "in-ear",
    price: "15999",
    imageKey: "productDabInEarP1",
    isListed: false, // 缺图, 软屏蔽
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.2",
    form: "behind-ear",
    price: "Pro 5999 / Max 7999",
    imageKey: "productDab007",
    isListed: true,
    slug: "dab007",
    detailImages: detail("dab007", seq(40)),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.3",
    form: "behind-ear",
    price: "599",
    imageKey: "productSab001",
    isListed: true,
    slug: "sab001",
    detailImages: detail("sab001", seq(20)),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.4",
    form: "in-ear",
    price: "1799",
    imageKey: "productSap001",
    isListed: true,
    slug: "sap001",
    detailImages: detail("sap001", [
      "1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "5-2.webp", "6.webp", "7.webp",
      "8.webp", "9.webp", "10-1.webp", "10-2.webp", "11.webp", "12.webp", "13.webp", "14.webp",
    ]),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.5",
    form: "in-ear",
    price: "1999",
    imageKey: "productDaq001",
    isListed: true,
    slug: "daq001",
    detailImages: detail("daq001", [
      "1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp", "8.webp",
      "9.webp", "10.webp", "11.webp", "12.webp", "13.webp", "14.webp", "15.webp", "16.webp",
      "17.webp", "18.webp", "19.webp", "20.webp",
    ]),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.6",
    form: "in-ear",
    price: "1999",
    imageKey: "productSaq002",
    isListed: true,
    slug: "saq002",
    detailImages: detail("saq002", seq(40)),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.7",
    form: "in-ear",
    price: "1699",
    imageKey: "productSaq003",
    isListed: true,
    slug: "saq003",
    detailImages: detail("saq003", [
      "1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp", "8.webp",
      "9.webp", "10.webp", "11.webp", "12.webp", "13.webp", "14.webp", "15.webp", "16.webp",
      "16 -2.webp",
    ]),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.8",
    form: "neck-hung",
    price: "9999",
    imageKey: "productDabNeckHungN1",
    isListed: false, // 缺图, 软屏蔽
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.9",
    form: "neck-hung",
    price: "2399",
    imageKey: "productSan002",
    isListed: false, // 2026-08-15 用户要求屏蔽, 软屏蔽
    slug: "san002",
    detailImages: detail("san002", seq(40)),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.10",
    form: "neck-hung",
    price: "3599",
    imageKey: "productSan003",
    isListed: true,
    slug: "san003",
    detailImages: detail("san003", [
      "1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp", "8.webp",
      "9.webp", "10.webp", "11.webp", "12.webp", "13.webp", "14.webp", "15.webp", "16.webp",
      "17.webp", "18.webp", "19.webp", "20.webp", "21.webp", "22.webp", "23.webp", "24.webp",
      "25.webp", "26.webp", "27.webp", "28.webp", "29.webp", "30.webp", "31.webp", "32.webp",
      "33.webp", "34.webp", "35.webp", "36.webp", "37.webp", "38.webp", "39.webp", "40.webp",
    ]),
    featuresCount: 6,
  },
  {
    i18nPrefix: "product:products.11",
    form: "bone-conduction",
    price: "1999",
    imageKey: "productBo",
    isListed: true,
    slug: "bo",
    detailImages: detail("bo", [
      "1.webp", "2.webp", "3.webp", "4.webp", "5.webp", "6.webp", "7.webp", "8-1.webp",
      "8-2.webp", "9.webp", "10.webp", "11.webp", "12.webp", "13.webp", "14.webp", "15.webp",
      "16.webp", "17.webp", "18.webp", "19.webp", "20.webp", "21.webp", "22.webp", "23.webp",
      "24.webp", "25.webp", "26.webp", "27.webp", "28.webp",
    ]),
    featuresCount: 6,
  },
];

/**
 * 中文助听核心技术
 * 原型 §4.6 扇形图复刻: 1 个绿色扇区 + 5 个黑色扇区
 * 保留 12 项 list 供后续扩展使用
 */
const CORE_TECH = {
  titleKey: "product:coreTech.title",
  subtitleKey: "product:coreTech.subtitle",
  descKey: "product:coreTech.desc",
  imageKey: "techRicDiagram" as const,
  /**
   * 扇形图数据: 复刻原型 §4.6 环形海螺图
   * 内半径统一 60, 外半径顺时针递增, 绿色扇区最大 (海螺收尾)
   * 绿色扇区: 右上缺口处 0°-70°, 外半径 220 (最大)
   * 黑色扇区: 从绿色下方(右下)开始顺时针, 外半径 120 → 140 → 160 → 180 → 200
   *   黑5 (302°-360°, 右下, 绿色下方) 最小 120
   *   黑1 (70°-128°, 上偏右, 绿色上方) 最大 200
   */
  fanChart: {
    centerTextKey: "product:coreTech.fanChart.centerText",
    centerSubKey: "product:coreTech.fanChart.centerSub",
    centerHintKey: "product:coreTech.fanChart.centerHint",
    sectors: [
      {
        i18nPrefix: "product:coreTech.fanChart.sectors.0",
        color: "#1a1a1a",
        startAngle: 70,
        endAngle: 128,
        outerRadius: 200,
        innerRadius: 60,
        icon: "wave" as const,
      },
      {
        i18nPrefix: "product:coreTech.fanChart.sectors.1",
        color: "#1a1a1a",
        startAngle: 128,
        endAngle: 186,
        outerRadius: 180,
        innerRadius: 60,
        icon: "ai" as const,
      },
      {
        i18nPrefix: "product:coreTech.fanChart.sectors.2",
        color: "#1a1a1a",
        startAngle: 186,
        endAngle: 244,
        outerRadius: 160,
        innerRadius: 60,
        icon: "speaker" as const,
      },
      {
        i18nPrefix: "product:coreTech.fanChart.sectors.3",
        color: "#1a1a1a",
        startAngle: 244,
        endAngle: 302,
        outerRadius: 140,
        innerRadius: 60,
        icon: "scene" as const,
      },
      {
        i18nPrefix: "product:coreTech.fanChart.sectors.4",
        color: "#1a1a1a",
        startAngle: 302,
        endAngle: 360,
        outerRadius: 120,
        innerRadius: 60,
        icon: "ear" as const,
      },
    ],
    greenSector: {
      startAngle: 0,
      endAngle: 70,
      color: "#05a045",
      outerRadius: 220,
      innerRadius: 60,
    },
  },
};

/**
 * 权威背书 · 硬核实力 (3 子模块)
 */
const ENDORSEMENTS = {
  titleKey: "product:endorsements.title",
  // 4.7.1 国家医疗资质 - 5 张真实证书图 (honors/real/, 横版 certReal1 放第 3 张位置)
  medicalCerts: {
    titleKey: "product:endorsements.medicalCerts.title",
    certs: [
      { nameKey: "product:endorsements.medicalCerts.certs.0.name", imageKey: "certReal2" as const },
      { nameKey: "product:endorsements.medicalCerts.certs.1.name", imageKey: "certReal3" as const },
      { nameKey: "product:endorsements.medicalCerts.certs.2.name", imageKey: "certReal1" as const },
      { nameKey: "product:endorsements.medicalCerts.certs.3.name", imageKey: "certReal4" as const },
      { nameKey: "product:endorsements.medicalCerts.certs.4.name", imageKey: "certReal5" as const },
    ],
  },
  // 4.7.2 临床医疗认证 - 左文 + 右上下两个医院 logo + 底部报告截图
  clinical: {
    titleKey: "product:endorsements.clinical.title",
    descKey: "product:endorsements.clinical.desc",
    hospitals: [
      { nameKey: "product:endorsements.clinical.hospitals.0.name", logoKey: "sdebhLogoLg" as const },
      { nameKey: "product:endorsements.clinical.hospitals.1.name", logoKey: "partnerSysu" as const },
    ],
    reportImageKey: "clinicalReport" as const,
    reportDisclaimerKey: "product:endorsements.clinical.reportDisclaimer",
  },
  // 4.7.3 国家专利认证 - 使用用户提供的专利矩阵图 (图片1.png)
  patents: {
    titleKey: "product:endorsements.patents.title",
    descKey: "product:endorsements.patents.desc",
    imageKey: "patentMatrixCustom" as const,
    imageNoteKey: "product:endorsements.patents.imageNote",
  },
};

/**
 * 听力服务中心
 */
const SERVICE_CENTER = {
  titleKey: "product:serviceCenter.title",
  subtitleKey: "product:serviceCenter.subtitle",
  // 大声听力服务中心 一站式耳科服务 (左文右图)
  intro: {
    titleKey: "product:serviceCenter.intro.title",
    descKeys: [
      "product:serviceCenter.intro.desc.0",
      "product:serviceCenter.intro.desc.1",
    ],
    imageKey: "serviceCenterStore" as const,
  },
  // 三甲医院同等 百万级检查设备 (2×3 卡片, 统一两行文字结构: 标题 + 副标题)
  equipment: {
    titleKey: "product:serviceCenter.equipment.title",
    items: [
      {
        imageKey: "equipmentRealEarAnalyzer" as const,
        titleKey: "product:serviceCenter.equipment.items.0.title",
        subtitleKey: "product:serviceCenter.equipment.items.0.subtitle",
      },
      {
        imageKey: "equipmentDigitalOtoscope" as const,
        titleKey: "product:serviceCenter.equipment.items.1.title",
        subtitleKey: "product:serviceCenter.equipment.items.1.subtitle",
      },
      {
        imageKey: "equipmentAudiologyBooth" as const,
        titleKey: "product:serviceCenter.equipment.items.2.title",
        subtitleKey: "product:serviceCenter.equipment.items.2.subtitle",
      },
      {
        imageKey: "equipmentAudiometer" as const,
        titleKey: "product:serviceCenter.equipment.items.3.title",
        subtitleKey: "product:serviceCenter.equipment.items.3.subtitle",
      },
      {
        imageKey: "equipmentFittingSoftware" as const,
        titleKey: "product:serviceCenter.equipment.items.4.title",
        subtitleKey: "product:serviceCenter.equipment.items.4.subtitle",
      },
      {
        imageKey: "equipmentCleaningDevice" as const,
        titleKey: "product:serviceCenter.equipment.items.5.title",
        subtitleKey: "product:serviceCenter.equipment.items.5.subtitle",
      },
    ],
  },
  // 耳科级"声处方"指定 + 听力专家远程 AI 验配服务
  remoteTitleKey: "product:serviceCenter.remoteTitle",
  remoteDescKey: "product:serviceCenter.remoteDesc",
  remoteImageKey: "remoteAudiologyConsultation" as const,
  remoteQrKey: "qrWechatService" as const,
  // 声处方流程图 (SVG) - i18n keys 在 product:serviceCenter.processChart.* 下
  processChart: {
    leftColTitleKey: "product:serviceCenter.processChart.leftColTitle",
    leftColSubKey: "product:serviceCenter.processChart.leftColSub",
    rightColTitleKey: "product:serviceCenter.processChart.rightColTitle",
    rightColSubKey: "product:serviceCenter.processChart.rightColSub",
    stepColTitleKey: "product:serviceCenter.processChart.stepColTitle",
    stepColSubKey: "product:serviceCenter.processChart.stepColSub",
    leftNodesKeys: [
      "product:serviceCenter.processChart.leftNodes.0",
      "product:serviceCenter.processChart.leftNodes.1",
      "product:serviceCenter.processChart.leftNodes.2",
      "product:serviceCenter.processChart.leftNodes.3",
      "product:serviceCenter.processChart.leftNodes.4",
    ],
    rightNodesKeys: [
      "product:serviceCenter.processChart.rightNodes.0",
      "product:serviceCenter.processChart.rightNodes.1",
      "product:serviceCenter.processChart.rightNodes.2",
    ],
    stepsKeys: [
      {
        titleKey: "product:serviceCenter.processChart.steps.0.title",
        descKey: "product:serviceCenter.processChart.steps.0.desc",
      },
      {
        titleKey: "product:serviceCenter.processChart.steps.1.title",
        descKey: "product:serviceCenter.processChart.steps.1.desc",
      },
      {
        titleKey: "product:serviceCenter.processChart.steps.2.title",
        descKey: "product:serviceCenter.processChart.steps.2.desc",
      },
    ],
    arrowUploadLabelKey: "product:serviceCenter.processChart.arrowUploadLabel",
    arrowFeedbackLabelKey: "product:serviceCenter.processChart.arrowFeedbackLabel",
  },
  // 门店地址
  storeTitleKey: "product:serviceCenter.storeTitle",
  directStore: {
    labelKey: "product:serviceCenter.directStore.label",
    phone: "13116993115",
    addressKey: "product:serviceCenter.directStore.address",
  },
  franchiseStore: {
    labelKey: "product:serviceCenter.franchiseStore.label",
    addressKey: "product:serviceCenter.franchiseStore.address",
  },
  storeCardsKeys: [
    {
      titleKey: "product:serviceCenter.storeCards.0.title",
      descKey: "product:serviceCenter.storeCards.0.desc",
    },
    {
      titleKey: "product:serviceCenter.storeCards.1.title",
      descKey: "product:serviceCenter.storeCards.1.desc",
    },
    {
      titleKey: "product:serviceCenter.storeCards.2.title",
      descKey: "product:serviceCenter.storeCards.2.desc",
    },
  ],
  consultingPhoneLabelKey: "product:serviceCenter.consultingPhoneLabel",
};

/**
 * 全生命周期服务
 * 售前 4 个环节 + 售中售后 8 大保障 (原型说明 6 大保障但实际列了 8 项, 此处按 8 项实现)
 */
const LIFECYCLE_SERVICE = {
  titleKey: "product:lifecycleService.title",
  subtitleKey: "product:lifecycleService.subtitle",
  presalesTitleKey: "product:lifecycleService.presalesTitle",
  presalesKeys: [
    {
      titleKey: "product:lifecycleService.presales.0.title",
      descKey: "product:lifecycleService.presales.0.desc",
    },
    {
      titleKey: "product:lifecycleService.presales.1.title",
      descKey: "product:lifecycleService.presales.1.desc",
    },
    {
      titleKey: "product:lifecycleService.presales.2.title",
      descKey: "product:lifecycleService.presales.2.desc",
    },
    {
      titleKey: "product:lifecycleService.presales.3.title",
      descKey: "product:lifecycleService.presales.3.desc",
    },
  ],
  postalesTitleKey: "product:lifecycleService.postalesTitle",
  postalesKeys: [
    {
      titleKey: "product:lifecycleService.postales.0.title",
      descKey: "product:lifecycleService.postales.0.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.1.title",
      descKey: "product:lifecycleService.postales.1.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.2.title",
      descKey: "product:lifecycleService.postales.2.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.3.title",
      descKey: "product:lifecycleService.postales.3.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.4.title",
      descKey: "product:lifecycleService.postales.4.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.5.title",
      descKey: "product:lifecycleService.postales.5.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.6.title",
      descKey: "product:lifecycleService.postales.6.desc",
    },
    {
      titleKey: "product:lifecycleService.postales.7.title",
      descKey: "product:lifecycleService.postales.7.desc",
    },
  ],
};

/**
 * 售后保修政策 (4 章节)
 */
const WARRANTY = {
  titleKey: "product:warranty.title",
  sectionsKeys: [
    {
      number: "01",
      titleKey: "product:warranty.sections.0.title",
      contentKey: "product:warranty.sections.0.content",
    },
    {
      number: "02",
      titleKey: "product:warranty.sections.1.title",
      contentKey: "product:warranty.sections.1.content",
    },
    {
      number: "03",
      titleKey: "product:warranty.sections.2.title",
      contentKey: "product:warranty.sections.2.content",
    },
    {
      number: "04",
      titleKey: "product:warranty.sections.3.title",
      contentKey: "product:warranty.sections.3.content",
    },
  ],
};

/**
 * 产品页汇总数据
 * 按原型 §四 组织, hero 背景图=12 款助听器产品全家福 (AI 生成)
 * 产品台模块已删除, 全家福图改为 hero 背景图
 */
export const PRODUCT_PAGE = {
  heroTitleKey: "product:hero.title",
  heroSubtitleKey: "product:hero.subtitle",
  heroDescriptionKey: "product:hero.description",
  categorySloganKeys: ["product:categorySlogan.0", "product:categorySlogan.1"],
  // 第一个 tab "全部", 后续 4 个分类按钮按 PRODUCT_CATEGORY_KEYS 顺序
  categoriesKeys: ["product:categories.all", ...PRODUCT_CATEGORY_KEYS.map((k) => `product:categories.${k}`)],
  products: PRODUCTS,
  coreTech: CORE_TECH,
  endorsements: ENDORSEMENTS,
  serviceCenter: SERVICE_CENTER,
  lifecycleService: LIFECYCLE_SERVICE,
  warranty: WARRANTY,
};

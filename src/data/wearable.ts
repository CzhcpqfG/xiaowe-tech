/**
 * 健康智能穿戴页 (/wearable) 数据
 *
 * 数据源:
 *   - PROTOTYPE_PAGES.md §5 健康智能穿戴页 (6 section 简版)
 *   - PROTOTYPE_CONTENT.md §4 中右栏: 健康智能穿戴 + 智能蓝牙耳机
 *   - 真实产品信息: https://www.xiaowe.cc/h-col-103.html (创维官方商城, 2026-07-21 抓取)
 *
 * 完整产品线 (11 款, 3 大分类):
 *   成人手表 4 款 (蓝牙健康智能手表): C01 / C02 / R1 / S8
 *   儿童手表 3 款 (儿童健康智能手表): T9 / T10 / Z1
 *   蓝牙耳机 4 款 (OWS 开放式 + TWS 入耳式): OWS SEB002 / OWS SEP002 / OWS SES002 / TWS SEP001
 *
 * 页面交互参考 AI 中文助听器页 (/product): Tab 分类按钮 + 卡片网格筛选
 *
 * i18n 改造 (2026-07-25):
 *   - 所有可见文案改为 i18n key 引用 (modelKey / typeKey / colorsKey / altKey / features.labelKey 等)
 *   - WearableForm 改为英文 slug: "adult-watch" / "kids-watch" / "bluetooth-earphone"
 *   - WEARABLE_CATEGORIES 改为英文 slug 数组 (同上)
 *   - 保留 locale 无关字段: price (数字) / imageKey / id
 *   - 翻译文件: src/i18n/locales/{zh-CN,zh-TW,en}/wearable.json
 */

/** 产品分类按钮 (3 个, 不含"全部", 默认全部展示) - 英文 slug, locale 无关 */
export const WEARABLE_CATEGORIES = [
  "adult-watch",
  "kids-watch",
  "bluetooth-earphone",
] as const;

/** 产品形态 (用于 Tab 筛选, 与 WEARABLE_CATEGORIES 对应) - 英文 slug */
export type WearableForm = "adult-watch" | "kids-watch" | "bluetooth-earphone";

/** 单款产品信息 (用于产品卡片) */
export interface WearableProduct {
  /** 产品 ID (用于 i18n key 索引, 如 "c01" / "t9" / "seb002") */
  id: string;
  /** 产品型号 i18n key (wearable namespace, 如 "wearable:products.c01.model") */
  modelKey: string;
  /** 形态分类 (英文 slug, 用于 Tab 筛选) */
  form: WearableForm;
  /** 产品类型 i18n key (wearable namespace, 如 "wearable:products.c01.type") */
  typeKey: string;
  /** 起售价 (元, locale 无关数字) */
  price: number;
  /** 可选颜色 i18n key (wearable namespace) */
  colorsKey: string;
  /** 配图 key (对应 IMAGES 中的 key, locale 无关) */
  imageKey: string;
  /** 配图 alt 文本 i18n key (wearable namespace) */
  altKey: string;
  /** 4 项核心特性 (label + 描述, 各 2 个 i18n key) */
  features: { labelKey: string; descKey: string }[];
}

/** 核心技术项 */
export interface WearableTech {
  /** 技术名称 i18n key */
  nameKey: string;
  /** 简短描述 i18n key (可选) */
  descKey?: string;
}

/** 11 款产品完整数据 (从 xiaowe.cc 抓取真实信息, 2026-07-21) */
export const WEARABLE_PRODUCTS: WearableProduct[] = [
  // ===== 成人手表 4 款 =====
  {
    id: "c01",
    modelKey: "wearable:products.c01.model",
    form: "adult-watch",
    typeKey: "wearable:products.c01.type",
    price: 1299,
    colorsKey: "wearable:products.c01.colors",
    imageKey: "wearableAdultC01",
    altKey: "wearable:products.c01.alt",
    features: [
      { labelKey: "wearable:products.c01.features.0.label", descKey: "wearable:products.c01.features.0.desc" },
      { labelKey: "wearable:products.c01.features.1.label", descKey: "wearable:products.c01.features.1.desc" },
      { labelKey: "wearable:products.c01.features.2.label", descKey: "wearable:products.c01.features.2.desc" },
      { labelKey: "wearable:products.c01.features.3.label", descKey: "wearable:products.c01.features.3.desc" },
    ],
  },
  {
    id: "c02",
    modelKey: "wearable:products.c02.model",
    form: "adult-watch",
    typeKey: "wearable:products.c02.type",
    price: 1299,
    colorsKey: "wearable:products.c02.colors",
    imageKey: "wearableAdultC02",
    altKey: "wearable:products.c02.alt",
    features: [
      { labelKey: "wearable:products.c02.features.0.label", descKey: "wearable:products.c02.features.0.desc" },
      { labelKey: "wearable:products.c02.features.1.label", descKey: "wearable:products.c02.features.1.desc" },
      { labelKey: "wearable:products.c02.features.2.label", descKey: "wearable:products.c02.features.2.desc" },
      { labelKey: "wearable:products.c02.features.3.label", descKey: "wearable:products.c02.features.3.desc" },
    ],
  },
  {
    id: "r1",
    modelKey: "wearable:products.r1.model",
    form: "adult-watch",
    typeKey: "wearable:products.r1.type",
    price: 899,
    colorsKey: "wearable:products.r1.colors",
    imageKey: "wearableAdultR1",
    altKey: "wearable:products.r1.alt",
    features: [
      { labelKey: "wearable:products.r1.features.0.label", descKey: "wearable:products.r1.features.0.desc" },
      { labelKey: "wearable:products.r1.features.1.label", descKey: "wearable:products.r1.features.1.desc" },
      { labelKey: "wearable:products.r1.features.2.label", descKey: "wearable:products.r1.features.2.desc" },
      { labelKey: "wearable:products.r1.features.3.label", descKey: "wearable:products.r1.features.3.desc" },
    ],
  },
  {
    id: "s8",
    modelKey: "wearable:products.s8.model",
    form: "adult-watch",
    typeKey: "wearable:products.s8.type",
    price: 899,
    colorsKey: "wearable:products.s8.colors",
    imageKey: "wearableAdultS8",
    altKey: "wearable:products.s8.alt",
    features: [
      { labelKey: "wearable:products.s8.features.0.label", descKey: "wearable:products.s8.features.0.desc" },
      { labelKey: "wearable:products.s8.features.1.label", descKey: "wearable:products.s8.features.1.desc" },
      { labelKey: "wearable:products.s8.features.2.label", descKey: "wearable:products.s8.features.2.desc" },
      { labelKey: "wearable:products.s8.features.3.label", descKey: "wearable:products.s8.features.3.desc" },
    ],
  },

  // ===== 儿童手表 3 款 =====
  {
    id: "t9",
    modelKey: "wearable:products.t9.model",
    form: "kids-watch",
    typeKey: "wearable:products.t9.type",
    price: 899,
    colorsKey: "wearable:products.t9.colors",
    imageKey: "wearableKidsT9",
    altKey: "wearable:products.t9.alt",
    features: [
      { labelKey: "wearable:products.t9.features.0.label", descKey: "wearable:products.t9.features.0.desc" },
      { labelKey: "wearable:products.t9.features.1.label", descKey: "wearable:products.t9.features.1.desc" },
      { labelKey: "wearable:products.t9.features.2.label", descKey: "wearable:products.t9.features.2.desc" },
      { labelKey: "wearable:products.t9.features.3.label", descKey: "wearable:products.t9.features.3.desc" },
    ],
  },
  {
    id: "t10",
    modelKey: "wearable:products.t10.model",
    form: "kids-watch",
    typeKey: "wearable:products.t10.type",
    price: 799,
    colorsKey: "wearable:products.t10.colors",
    imageKey: "wearableKidsT10",
    altKey: "wearable:products.t10.alt",
    features: [
      { labelKey: "wearable:products.t10.features.0.label", descKey: "wearable:products.t10.features.0.desc" },
      { labelKey: "wearable:products.t10.features.1.label", descKey: "wearable:products.t10.features.1.desc" },
      { labelKey: "wearable:products.t10.features.2.label", descKey: "wearable:products.t10.features.2.desc" },
      { labelKey: "wearable:products.t10.features.3.label", descKey: "wearable:products.t10.features.3.desc" },
    ],
  },
  {
    id: "z1",
    modelKey: "wearable:products.z1.model",
    form: "kids-watch",
    typeKey: "wearable:products.z1.type",
    price: 599,
    colorsKey: "wearable:products.z1.colors",
    imageKey: "wearableKidsZ1",
    altKey: "wearable:products.z1.alt",
    features: [
      { labelKey: "wearable:products.z1.features.0.label", descKey: "wearable:products.z1.features.0.desc" },
      { labelKey: "wearable:products.z1.features.1.label", descKey: "wearable:products.z1.features.1.desc" },
      { labelKey: "wearable:products.z1.features.2.label", descKey: "wearable:products.z1.features.2.desc" },
      { labelKey: "wearable:products.z1.features.3.label", descKey: "wearable:products.z1.features.3.desc" },
    ],
  },

  // ===== 蓝牙耳机 4 款 =====
  {
    id: "seb002",
    modelKey: "wearable:products.seb002.model",
    form: "bluetooth-earphone",
    typeKey: "wearable:products.seb002.type",
    price: 399,
    colorsKey: "wearable:products.seb002.colors",
    imageKey: "wearableEarphoneSeb002",
    altKey: "wearable:products.seb002.alt",
    features: [
      { labelKey: "wearable:products.seb002.features.0.label", descKey: "wearable:products.seb002.features.0.desc" },
      { labelKey: "wearable:products.seb002.features.1.label", descKey: "wearable:products.seb002.features.1.desc" },
      { labelKey: "wearable:products.seb002.features.2.label", descKey: "wearable:products.seb002.features.2.desc" },
      { labelKey: "wearable:products.seb002.features.3.label", descKey: "wearable:products.seb002.features.3.desc" },
    ],
  },
  {
    id: "sep002",
    modelKey: "wearable:products.sep002.model",
    form: "bluetooth-earphone",
    typeKey: "wearable:products.sep002.type",
    price: 189,
    colorsKey: "wearable:products.sep002.colors",
    imageKey: "wearableEarphoneSep002",
    altKey: "wearable:products.sep002.alt",
    features: [
      { labelKey: "wearable:products.sep002.features.0.label", descKey: "wearable:products.sep002.features.0.desc" },
      { labelKey: "wearable:products.sep002.features.1.label", descKey: "wearable:products.sep002.features.1.desc" },
      { labelKey: "wearable:products.sep002.features.2.label", descKey: "wearable:products.sep002.features.2.desc" },
      { labelKey: "wearable:products.sep002.features.3.label", descKey: "wearable:products.sep002.features.3.desc" },
    ],
  },
  {
    id: "ses002",
    modelKey: "wearable:products.ses002.model",
    form: "bluetooth-earphone",
    typeKey: "wearable:products.ses002.type",
    price: 299,
    colorsKey: "wearable:products.ses002.colors",
    imageKey: "wearableEarphoneSes002",
    altKey: "wearable:products.ses002.alt",
    features: [
      { labelKey: "wearable:products.ses002.features.0.label", descKey: "wearable:products.ses002.features.0.desc" },
      { labelKey: "wearable:products.ses002.features.1.label", descKey: "wearable:products.ses002.features.1.desc" },
      { labelKey: "wearable:products.ses002.features.2.label", descKey: "wearable:products.ses002.features.2.desc" },
      { labelKey: "wearable:products.ses002.features.3.label", descKey: "wearable:products.ses002.features.3.desc" },
    ],
  },
  {
    id: "sep001",
    modelKey: "wearable:products.sep001.model",
    form: "bluetooth-earphone",
    typeKey: "wearable:products.sep001.type",
    price: 199,
    colorsKey: "wearable:products.sep001.colors",
    imageKey: "wearableEarphoneTwsSep001",
    altKey: "wearable:products.sep001.alt",
    features: [
      { labelKey: "wearable:products.sep001.features.0.label", descKey: "wearable:products.sep001.features.0.desc" },
      { labelKey: "wearable:products.sep001.features.1.label", descKey: "wearable:products.sep001.features.1.desc" },
      { labelKey: "wearable:products.sep001.features.2.label", descKey: "wearable:products.sep001.features.2.desc" },
      { labelKey: "wearable:products.sep001.features.3.label", descKey: "wearable:products.sep001.features.3.desc" },
    ],
  },
];

export const WEARABLE_PAGE = {
  /** Banner 标题 */
  heroTitleKey: "wearable:hero.title",
  /** Banner 副标 */
  heroSubtitleKey: "wearable:hero.subtitle",
  /** Banner 描述 (ProductCarouselHero 描述区) */
  heroDescriptionKey: "wearable:hero.description",

  /** 产品台模块 */
  productStage: {
    titleKey: "wearable:productStage.title",
    subtitleKey: "wearable:productStage.subtitle",
  },

  /** 产品分类说明标语 (双行, 参考 ProductPage) */
  categorySloganKeys: [
    "wearable:categorySlogan.0",
    "wearable:categorySlogan.1",
  ] as string[],

  /** 健康智能手表核心技术 (原型 §4.5, 扩展至 15 项, 5×3 网格) */
  watchTech: {
    titleKey: "wearable:watchTech.title",
    subtitleKey: "wearable:watchTech.subtitle",
    items: [
      { nameKey: "wearable:watchTech.items.0.name", descKey: "wearable:watchTech.items.0.desc" },
      { nameKey: "wearable:watchTech.items.1.name", descKey: "wearable:watchTech.items.1.desc" },
      { nameKey: "wearable:watchTech.items.2.name", descKey: "wearable:watchTech.items.2.desc" },
      { nameKey: "wearable:watchTech.items.3.name", descKey: "wearable:watchTech.items.3.desc" },
      { nameKey: "wearable:watchTech.items.4.name", descKey: "wearable:watchTech.items.4.desc" },
      { nameKey: "wearable:watchTech.items.5.name", descKey: "wearable:watchTech.items.5.desc" },
      { nameKey: "wearable:watchTech.items.6.name", descKey: "wearable:watchTech.items.6.desc" },
      { nameKey: "wearable:watchTech.items.7.name", descKey: "wearable:watchTech.items.7.desc" },
      { nameKey: "wearable:watchTech.items.8.name", descKey: "wearable:watchTech.items.8.desc" },
      { nameKey: "wearable:watchTech.items.9.name", descKey: "wearable:watchTech.items.9.desc" },
      { nameKey: "wearable:watchTech.items.10.name", descKey: "wearable:watchTech.items.10.desc" },
      { nameKey: "wearable:watchTech.items.11.name", descKey: "wearable:watchTech.items.11.desc" },
      { nameKey: "wearable:watchTech.items.12.name", descKey: "wearable:watchTech.items.12.desc" },
      { nameKey: "wearable:watchTech.items.13.name", descKey: "wearable:watchTech.items.13.desc" },
      { nameKey: "wearable:watchTech.items.14.name", descKey: "wearable:watchTech.items.14.desc" },
    ] as WearableTech[],
  },

  /** 智能蓝牙耳机核心技术 (原型 §4.6, 扩展至 10 项, 5×2 网格) */
  earphoneTech: {
    titleKey: "wearable:earphoneTech.title",
    subtitleKey: "wearable:earphoneTech.subtitle",
    items: [
      { nameKey: "wearable:earphoneTech.items.0.name", descKey: "wearable:earphoneTech.items.0.desc" },
      { nameKey: "wearable:earphoneTech.items.1.name", descKey: "wearable:earphoneTech.items.1.desc" },
      { nameKey: "wearable:earphoneTech.items.2.name", descKey: "wearable:earphoneTech.items.2.desc" },
      { nameKey: "wearable:earphoneTech.items.3.name", descKey: "wearable:earphoneTech.items.3.desc" },
      { nameKey: "wearable:earphoneTech.items.4.name", descKey: "wearable:earphoneTech.items.4.desc" },
      { nameKey: "wearable:earphoneTech.items.5.name", descKey: "wearable:earphoneTech.items.5.desc" },
      { nameKey: "wearable:earphoneTech.items.6.name", descKey: "wearable:earphoneTech.items.6.desc" },
      { nameKey: "wearable:earphoneTech.items.7.name", descKey: "wearable:earphoneTech.items.7.desc" },
      { nameKey: "wearable:earphoneTech.items.8.name", descKey: "wearable:earphoneTech.items.8.desc" },
      { nameKey: "wearable:earphoneTech.items.9.name", descKey: "wearable:earphoneTech.items.9.desc" },
    ] as WearableTech[],
  },
} as const;

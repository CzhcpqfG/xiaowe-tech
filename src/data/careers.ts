/**
 * 人才招聘页数据 - PROTOTYPE_PAGES.md §七 (5 section)
 *
 * 模块结构:
 *   - hero: Hero 招聘语 (主标 + 副标)
 *   - companyIntroTitle / companyIntro: 公司简介 (5 段, 同关于小维页 §2.4)
 *   - categoryTitle / categories: 职位分类 (4 类 + Tab)
 *   - jobList: 职位列表 (8 个完整 + 1 不完整, 原型说 16, 待 PM 补齐)
 *   - benefits: 福利待遇 (6 项)
 *   - apply: 投递方式 (邮箱 / 电话 / 地址)
 *
 * 设计风格沿用 2.0 朴素风格:
 *   - 主色 #05a045 / 选中色 #52b548
 *   - 无圆角 / 无阴影 / 无渐变
 *   - 字号规范参考原官网
 *
 * i18n 改造 (2026-07-25):
 *   - 所有可见文案改为 i18n key 引用 (titleKey / descKey / labelKey / valueKey 等)
 *   - JobCategory 改为英文 slug: "tech" / "manufacturing" / "marketing" / "admin"
 *   - tabs 改为英文 slug 数组: ["all", "tech", "manufacturing", "marketing", "admin"]
 *   - 保留 locale 无关字段: salary (如 "15-30K") / uploadDate (占位符 "—") / id
 *   - 翻译文件: src/i18n/locales/{zh-CN,zh-TW,en}/careers.json
 */

/** 职位分类 (英文 slug, locale 无关) */
export type JobCategory = "tech" | "manufacturing" | "marketing" | "admin";

/** 单个职位卡片 */
export interface JobItem {
  /** 职位 ID (1-8, 用于 i18n key 索引) */
  id: string;
  /** 类别 (英文 slug, locale 无关) */
  category: JobCategory;
  /** 职位名称 i18n key (careers namespace) */
  nameKey: string;
  /** 工作地点 i18n key (careers namespace) */
  locationKey: string;
  /** 招聘人数 i18n key (careers namespace, 如 "2" / "若干") */
  headcountKey: string;
  /** 薪资范围 (locale 无关, 如 "15-30K") */
  salary: string;
  /** 上传日期 (占位 "—", locale 无关, 待 PM 补齐) */
  uploadDate: string;
}

export const CAREERS_PAGE = {
  /* —— 7.2 Hero 招聘语 —— */
  hero: {
    mainTitleKey: "careers:hero.mainTitle",
    mainTitleSecondKey: "careers:hero.mainTitleSecond",
    subtitleKey: "careers:hero.subtitle",
  },

  /* —— 7.3 公司简介 (同关于小维页 §2.4, 5 段) —— */
  companyIntroTitleKey: "careers:companyIntroTitle",
  companyIntroKeys: [
    "careers:companyIntro.0",
    "careers:companyIntro.1",
    "careers:companyIntro.2",
    "careers:companyIntro.3",
    "careers:companyIntro.4",
  ],

  /* —— 7.4 职位分类 —— */
  categoryTitleKey: "careers:categoryTitle",
  categories: [
    { category: "tech", descKey: "careers:categories.tech.desc" },
    { category: "manufacturing", descKey: "careers:categories.manufacturing.desc" },
    { category: "marketing", descKey: "careers:categories.marketing.desc" },
    { category: "admin", descKey: "careers:categories.admin.desc" },
  ] as { category: JobCategory; descKey: string }[],

  /** Tab 筛选项 (含"全部") - 英文 slug, locale 无关, 渲染时用 t(`careers:tabs.${tab}`) */
  tabs: ["all", "tech", "manufacturing", "marketing", "admin"] as const,

  /* —— 7.5 职位列表 (原型说 16 个, 实际显示 8 个完整 + 1 不完整, 待 PM 补齐) —— */
  jobListTitleKey: "careers:jobListTitle",
  jobListNoteKey: "careers:jobListNote",
  jobList: [
    {
      id: "1",
      category: "tech",
      salary: "15-30K",
      uploadDate: "—",
      nameKey: "careers:jobs.1.name",
      locationKey: "careers:jobs.1.location",
      headcountKey: "careers:jobs.1.headcount",
    },
    {
      id: "2",
      category: "tech",
      salary: "12-24K",
      uploadDate: "—",
      nameKey: "careers:jobs.2.name",
      locationKey: "careers:jobs.2.location",
      headcountKey: "careers:jobs.2.headcount",
    },
    {
      id: "3",
      category: "manufacturing",
      salary: "8-15K",
      uploadDate: "—",
      nameKey: "careers:jobs.3.name",
      locationKey: "careers:jobs.3.location",
      headcountKey: "careers:jobs.3.headcount",
    },
    {
      id: "4",
      category: "marketing",
      salary: "8-12K",
      uploadDate: "—",
      nameKey: "careers:jobs.4.name",
      locationKey: "careers:jobs.4.location",
      headcountKey: "careers:jobs.4.headcount",
    },
    {
      id: "5",
      category: "marketing",
      salary: "5-9K",
      uploadDate: "—",
      nameKey: "careers:jobs.5.name",
      locationKey: "careers:jobs.5.location",
      headcountKey: "careers:jobs.5.headcount",
    },
    {
      id: "6",
      category: "marketing",
      salary: "5-7K",
      uploadDate: "—",
      nameKey: "careers:jobs.6.name",
      locationKey: "careers:jobs.6.location",
      headcountKey: "careers:jobs.6.headcount",
    },
    {
      id: "7",
      category: "admin",
      salary: "8-15K",
      uploadDate: "—",
      nameKey: "careers:jobs.7.name",
      locationKey: "careers:jobs.7.location",
      headcountKey: "careers:jobs.7.headcount",
    },
    {
      id: "8",
      category: "admin",
      salary: "5-7K",
      uploadDate: "—",
      nameKey: "careers:jobs.8.name",
      locationKey: "careers:jobs.8.location",
      headcountKey: "careers:jobs.8.headcount",
    },
  ] as JobItem[],

  /* —— 福利待遇 (6 项) —— */
  benefitsTitleKey: "careers:benefitsTitle",
  benefits: [
    { titleKey: "careers:benefits.0.title", descKey: "careers:benefits.0.desc" },
    { titleKey: "careers:benefits.1.title", descKey: "careers:benefits.1.desc" },
    { titleKey: "careers:benefits.2.title", descKey: "careers:benefits.2.desc" },
    { titleKey: "careers:benefits.3.title", descKey: "careers:benefits.3.desc" },
    { titleKey: "careers:benefits.4.title", descKey: "careers:benefits.4.desc" },
    { titleKey: "careers:benefits.5.title", descKey: "careers:benefits.5.desc" },
  ],

  /* —— 投递方式 —— */
  applyTitleKey: "careers:applyTitle",
  applyDescKey: "careers:applyDesc",
  applyItems: [
    { labelKey: "careers:applyItems.hotline.label", valueKey: "careers:applyItems.hotline.value" },
    { labelKey: "careers:applyItems.email.label", valueKey: "careers:applyItems.email.value" },
    { labelKey: "careers:applyItems.address.label", valueKey: "careers:applyItems.address.value" },
  ],
} as const;

/**
 * 关于小维页数据 - 来源 PROTOTYPE_PAGES.md §三 (11 section)
 *
 * 板块顺序 (与原型 §3.1 - §3.11 严格一致):
 *   1. hero             - 板块标题 (ProductCarouselHero 统一组件)
 *   2. skyworthGroup    - 创维集团简介 (3 段)
 *   3. skyworthStats    - 创维集团核心数据卡片 (8 张)
 *   4. xiaoweiHealth    - 小维健康科技 (5 段)
 *   5. researchDirections - 两大研究方向 (听力健康 + 穿戴健康)
 *   6. culture          - 企业文化 (使命 / 愿景 / 价值观 + 诠释)
 *   7. honors           - 荣誉资质 (9-11 张证书, 文本卡片占位)
 *   8. orgStructure     - 组织架构 (图片占位)
 *   9. team             - 核心团队 (创始人卡 + 高管卡)
 *   10. partners        - 战略合作伙伴 (复用 4 logos)
 *   11. timeline        - 发展历程 (5 个阶段 2022-2026)
 *
 * i18n 改造 (2026-07-25):
 *   - 所有可见文案改为 i18n key 引用 (titleKey / subtitleKey / paragraphKeys 等)
 *   - 保留 locale 无关的字段: imageKey / num / logoScale / sectionEnTitle
 *   - 翻译文件: src/i18n/locales/{zh-CN,zh-TW,en}/about.json
 */

/** 创维集团核心数据卡片单条 */
export interface SkyworthStatItem {
  /** 纯数字 (locale 无关), 如 "2", "3", "703.2" */
  num: string;
  /** 单位 i18n key (about namespace), 如 "about:skyworthStats.0.unit" */
  unitKey: string;
  /** 标签 i18n key (about namespace) */
  labelKey: string;
  /** 副标 i18n key (about namespace), 空字符串表示无副标 */
  subKey: string;
}

/** 研究方向单条 */
export interface ResearchDirectionItem {
  /** 主图 imageKey (locale 无关) */
  imageKey: string;
  /** 标题 i18n key */
  titleKey: string;
  /** 标签 i18n key */
  tagKey: string;
  /** 描述 i18n key */
  descKey: string;
}

/** 企业文化单条 */
export interface CultureItem {
  /** 配图 imageKey (locale 无关) */
  imageKey: string;
  /** 标签 i18n key (使命 / 愿景 / 价值观) */
  labelKey: string;
  /** 标题 i18n key */
  titleKey: string;
  /** 诠释 i18n key 数组 */
  interpretationKeys: string[];
}

/** 荣誉证书单条 */
export interface HonorItem {
  /** 证书图 imageKey (locale 无关) */
  imageKey: string;
  /** 证书名 i18n key (如 "证书 1" / "Certificate 1") */
  nameKey: string;
}

/** 团队成员 (创始人 + 高管) */
export interface TeamMember {
  /** 头像 imageKey (locale 无关) */
  imageKey: string;
  /** 姓名 i18n key (zh-CN/zh-TW 中文, en 拼音) */
  nameKey: string;
  /** 职务 i18n key */
  titleKey: string;
  /** 简介 i18n key 数组 */
  detailKeys: string[];
}

/** 战略合作伙伴单条 */
export interface PartnerItem {
  /** logo imageKey (locale 无关) */
  imageKey: string;
  /** 公司名 i18n key (部分需 i18n, 如中国老龄事业发展基金会) */
  nameKey: string;
  /** logo 缩放比例 (locale 无关, 可选) */
  logoScale?: number;
}

/** 时间线条目 */
export interface TimelineItem {
  /** 月份 i18n key (zh-CN/zh-TW 用「03月」, en 用 "Mar.") */
  monthKey: string;
  /** 事件 i18n key */
  eventKey: string;
}

/** 时间线阶段 */
export interface TimelineStage {
  /** 年份 i18n key (zh-CN/zh-TW 用「2022年」, en 用 "2022") */
  yearKey: string;
  /** 阶段名 i18n key */
  phaseKey: string;
  /** 月份事件列表 */
  items: TimelineItem[];
}

export const ABOUT_PAGE = {
  /* §3.1 板块标题 - ProductCarouselHero 统一组件 */
  hero: {
    titleKey: "about:hero.title",
    subtitleKey: "about:hero.subtitle",
    bgImageKey: "aboutHeroBg" as const,
  },

  /* §3.2 创维集团 - 3 段简介 */
  skyworthGroup: {
    sectionTitleKey: "about:skyworthGroup.sectionTitle",
    sectionEnTitle: "COMPANY PROFILE",
    paragraphKeys: [
      "about:skyworthGroup.paragraphs.0",
      "about:skyworthGroup.paragraphs.1",
      "about:skyworthGroup.paragraphs.2",
    ],
    /* 靠左副标 */
    subTitle1Key: "about:skyworthGroup.subTitle1",
    subTitle2Key: "about:skyworthGroup.subTitle2",
    altKey: "about:skyworthGroup.alt",
  },

  /* §3.3 创维集团核心数据卡片 - 8 张 */
  skyworthStats: [
    { num: "2", unitKey: "about:skyworthStats.0.unit", labelKey: "about:skyworthStats.0.label", subKey: "about:skyworthStats.0.sub" },
    { num: "3", unitKey: "about:skyworthStats.1.unit", labelKey: "about:skyworthStats.1.label", subKey: "about:skyworthStats.1.sub" },
    { num: "2", unitKey: "about:skyworthStats.2.unit", labelKey: "about:skyworthStats.2.label", subKey: "about:skyworthStats.2.sub" },
    { num: "5", unitKey: "about:skyworthStats.3.unit", labelKey: "about:skyworthStats.3.label", subKey: "about:skyworthStats.3.sub" },
    { num: "120", unitKey: "about:skyworthStats.4.unit", labelKey: "about:skyworthStats.4.label", subKey: "about:skyworthStats.4.sub" },
    { num: "703.2", unitKey: "about:skyworthStats.5.unit", labelKey: "about:skyworthStats.5.label", subKey: "about:skyworthStats.5.sub" },
    { num: "1", unitKey: "about:skyworthStats.6.unit", labelKey: "about:skyworthStats.6.label", subKey: "about:skyworthStats.6.sub" },
    { num: "20+", unitKey: "about:skyworthStats.7.unit", labelKey: "about:skyworthStats.7.label", subKey: "about:skyworthStats.7.sub" },
  ] as SkyworthStatItem[],

  /* §3.4 小维健康科技 - 5 段简介 */
  xiaoweiHealth: {
    sectionTitleKey: "about:xiaoweiHealth.sectionTitle",
    sectionEnTitle: "XIAOWEI HEALTH TECH",
    paragraphKeys: [
      "about:xiaoweiHealth.paragraphs.0",
      "about:xiaoweiHealth.paragraphs.1",
      "about:xiaoweiHealth.paragraphs.2",
      "about:xiaoweiHealth.paragraphs.3",
      "about:xiaoweiHealth.paragraphs.4",
    ],
  },

  /* §3.5 两大研究方向 - 接续 §3.4 小维健康科技之后 (无独立 section 标题) */
  researchDirections: {
    items: [
      {
        titleKey: "about:researchDirections.items.0.title",
        tagKey: "about:researchDirections.items.0.tag",
        descKey: "about:researchDirections.items.0.desc",
        imageKey: "researchHearingBg" as const,
      },
      {
        titleKey: "about:researchDirections.items.1.title",
        tagKey: "about:researchDirections.items.1.tag",
        descKey: "about:researchDirections.items.1.desc",
        imageKey: "researchWearableBg" as const,
      },
    ] as ResearchDirectionItem[],
  },

  /* §3.6 企业文化 - 使命 / 愿景 / 价值观 + 诠释 + 配图
     2026-07-23 用户指示: 企业文化模块要有图片配合设计, 不能纯前端代码
     配图: 3 张 16:9 横版图, 分别对应使命/愿景/价值观, 速创API gpt-image-2 生成 */
  culture: {
    sectionTitleKey: "about:culture.sectionTitle",
    sectionEnTitle: "CORPORATE CULTURE",
    items: [
      {
        labelKey: "about:culture.items.0.label",
        titleKey: "about:culture.items.0.title",
        imageKey: "cultureMission" as const,
        interpretationKeys: [
          "about:culture.items.0.interpretations.0",
          "about:culture.items.0.interpretations.1",
        ],
      },
      {
        labelKey: "about:culture.items.1.label",
        titleKey: "about:culture.items.1.title",
        imageKey: "cultureVision" as const,
        interpretationKeys: [
          "about:culture.items.1.interpretations.0",
          "about:culture.items.1.interpretations.1",
        ],
      },
      {
        labelKey: "about:culture.items.2.label",
        titleKey: "about:culture.items.2.title",
        imageKey: "cultureValues" as const,
        interpretationKeys: [
          "about:culture.items.2.interpretations.0",
          "about:culture.items.2.interpretations.1",
          "about:culture.items.2.interpretations.2",
        ],
      },
    ] as CultureItem[],
  },

  /* §3.7 荣誉资质 - 9 张真实证书 (public/images/honors/real/)
     2026-07-25 用户指示: 改用真实证书图, 按图片方向分两行排列
     - 第一行 row1: 4 张横版 (cert_real_1.png + cert1-3.webp)
     - 第二行 row2: 5 张竖版 (cert_real_2-6.png) */
  honors: {
    sectionTitleKey: "about:honors.sectionTitle",
    sectionEnTitle: "HONORS & QUALIFICATIONS",
    // 第一行: 4 张横版证书
    row1: [
      { nameKey: "about:honors.row1.0.name", imageKey: "honorReal1" as const },
      { nameKey: "about:honors.row1.1.name", imageKey: "honorReal7" as const },
      { nameKey: "about:honors.row1.2.name", imageKey: "honorReal8" as const },
      { nameKey: "about:honors.row1.3.name", imageKey: "honorReal9" as const },
    ] as HonorItem[],
    // 第二行: 5 张竖版证书
    row2: [
      { nameKey: "about:honors.row2.0.name", imageKey: "honorReal2" as const },
      { nameKey: "about:honors.row2.1.name", imageKey: "honorReal3" as const },
      { nameKey: "about:honors.row2.2.name", imageKey: "honorReal4" as const },
      { nameKey: "about:honors.row2.3.name", imageKey: "honorReal5" as const },
      { nameKey: "about:honors.row2.4.name", imageKey: "honorReal6" as const },
    ] as HonorItem[],
  },

  /* §3.8 + §3.9 合并 - 核心团队: 创始人王海 + 核心团队四人
     用户 2026-07-21 指示: 组织架构模块改为先展示创始人王海信息, 再展示核心团队四人信息
     用户 2026-07-21 补充: 创始人王海卡布局参考 public/images/prototype/founder_card_wanghai.webp
       - 横向单卡: 左侧照片 (40%) + 右侧上方绿色标题栏 (姓名+职务) + 下方白色简介列表
     用户 2026-07-23 补充: 核心团队四人信息参考 public/images/prototype/team_exec_card.webp, 头像由脚本裁剪生成 */
  team: {
    sectionTitleKey: "about:team.sectionTitle",
    sectionEnTitle: "ORG STRUCTURE",
    founder: {
      nameKey: "about:team.founder.name",
      titleKey: "about:team.founder.title",
      imageKey: "aboutFounder" as const,
      detailKeys: [
        "about:team.founder.details.0",
        "about:team.founder.details.1",
        "about:team.founder.details.2",
        "about:team.founder.details.3",
      ],
    },
    members: [
      {
        nameKey: "about:team.members.0.name",
        titleKey: "about:team.members.0.title",
        imageKey: "teamMemberCoo" as const,
        detailKeys: [
          "about:team.members.0.details.0",
          "about:team.members.0.details.1",
          "about:team.members.0.details.2",
          "about:team.members.0.details.3",
        ],
      },
      {
        nameKey: "about:team.members.1.name",
        titleKey: "about:team.members.1.title",
        imageKey: "teamMemberCmo" as const,
        detailKeys: [
          "about:team.members.1.details.0",
          "about:team.members.1.details.1",
          "about:team.members.1.details.2",
          "about:team.members.1.details.3",
        ],
      },
      {
        nameKey: "about:team.members.2.name",
        titleKey: "about:team.members.2.title",
        imageKey: "teamMemberRdDirector" as const,
        detailKeys: [
          "about:team.members.2.details.0",
          "about:team.members.2.details.1",
          "about:team.members.2.details.2",
          "about:team.members.2.details.3",
        ],
      },
      {
        nameKey: "about:team.members.3.name",
        titleKey: "about:team.members.3.title",
        imageKey: "teamMemberProductionDirector" as const,
        detailKeys: [
          "about:team.members.3.details.0",
          "about:team.members.3.details.1",
          "about:team.members.3.details.2",
          "about:team.members.3.details.3",
        ],
      },
    ] as TeamMember[],
  },

  /* §3.10 战略合作伙伴 - 分战略投资 + 战略合作两组 */
  partners: {
    sectionTitleKey: "about:partners.sectionTitle",
    sectionEnTitle: "STRATEGIC PARTNERS",
    strategicInvestment: {
      subTitleKey: "about:partners.strategicInvestment.subTitle",
      list: [
        { nameKey: "about:partners.strategicInvestment.list.0.name", imageKey: "partnerSkyworth" as const, logoScale: 0.5 },
        { nameKey: "about:partners.strategicInvestment.list.1.name", imageKey: "partnerHuapengfei" as const },
        { nameKey: "about:partners.strategicInvestment.list.2.name", imageKey: "partnerHaihe" as const },
        { nameKey: "about:partners.strategicInvestment.list.3.name", imageKey: "partnerXinsheng" as const, logoScale: 0.45 },
      ] as PartnerItem[],
    },
    strategicCooperation: {
      subTitleKey: "about:partners.strategicCooperation.subTitle",
      list: [
        { nameKey: "about:partners.strategicCooperation.list.0.name", imageKey: "partnerTencent" as const },
        { nameKey: "about:partners.strategicCooperation.list.1.name", imageKey: "partnerYinfa" as const },
        { nameKey: "about:partners.strategicCooperation.list.2.name", imageKey: "partnerSzu" as const },
        { nameKey: "about:partners.strategicCooperation.list.3.name", imageKey: "partnerChinaAging" as const },
        { nameKey: "about:partners.strategicCooperation.list.4.name", imageKey: "partnerSysu" as const },
      ] as PartnerItem[],
    },
  },

  /* §3.11 发展历程 - 5 个阶段 2022-2026 */
  timeline: {
    sectionTitleKey: "about:timeline.sectionTitle",
    sectionEnTitle: "DEVELOPMENT HISTORY",
    subtitleKey: "about:timeline.subtitle",
    stages: [
      {
        yearKey: "about:timeline.stages.0.year",
        phaseKey: "about:timeline.stages.0.phase",
        items: [
          { monthKey: "about:timeline.stages.0.items.0.month", eventKey: "about:timeline.stages.0.items.0.event" },
          { monthKey: "about:timeline.stages.0.items.1.month", eventKey: "about:timeline.stages.0.items.1.event" },
          { monthKey: "about:timeline.stages.0.items.2.month", eventKey: "about:timeline.stages.0.items.2.event" },
          { monthKey: "about:timeline.stages.0.items.3.month", eventKey: "about:timeline.stages.0.items.3.event" },
          { monthKey: "about:timeline.stages.0.items.4.month", eventKey: "about:timeline.stages.0.items.4.event" },
        ],
      },
      {
        yearKey: "about:timeline.stages.1.year",
        phaseKey: "about:timeline.stages.1.phase",
        items: [
          { monthKey: "about:timeline.stages.1.items.0.month", eventKey: "about:timeline.stages.1.items.0.event" },
          { monthKey: "about:timeline.stages.1.items.1.month", eventKey: "about:timeline.stages.1.items.1.event" },
          { monthKey: "about:timeline.stages.1.items.2.month", eventKey: "about:timeline.stages.1.items.2.event" },
          { monthKey: "about:timeline.stages.1.items.3.month", eventKey: "about:timeline.stages.1.items.3.event" },
          { monthKey: "about:timeline.stages.1.items.4.month", eventKey: "about:timeline.stages.1.items.4.event" },
          { monthKey: "about:timeline.stages.1.items.5.month", eventKey: "about:timeline.stages.1.items.5.event" },
          { monthKey: "about:timeline.stages.1.items.6.month", eventKey: "about:timeline.stages.1.items.6.event" },
        ],
      },
      {
        yearKey: "about:timeline.stages.2.year",
        phaseKey: "about:timeline.stages.2.phase",
        items: [
          { monthKey: "about:timeline.stages.2.items.0.month", eventKey: "about:timeline.stages.2.items.0.event" },
          { monthKey: "about:timeline.stages.2.items.1.month", eventKey: "about:timeline.stages.2.items.1.event" },
          { monthKey: "about:timeline.stages.2.items.2.month", eventKey: "about:timeline.stages.2.items.2.event" },
          { monthKey: "about:timeline.stages.2.items.3.month", eventKey: "about:timeline.stages.2.items.3.event" },
          { monthKey: "about:timeline.stages.2.items.4.month", eventKey: "about:timeline.stages.2.items.4.event" },
          { monthKey: "about:timeline.stages.2.items.5.month", eventKey: "about:timeline.stages.2.items.5.event" },
          { monthKey: "about:timeline.stages.2.items.6.month", eventKey: "about:timeline.stages.2.items.6.event" },
          { monthKey: "about:timeline.stages.2.items.7.month", eventKey: "about:timeline.stages.2.items.7.event" },
          { monthKey: "about:timeline.stages.2.items.8.month", eventKey: "about:timeline.stages.2.items.8.event" },
          { monthKey: "about:timeline.stages.2.items.9.month", eventKey: "about:timeline.stages.2.items.9.event" },
          { monthKey: "about:timeline.stages.2.items.10.month", eventKey: "about:timeline.stages.2.items.10.event" },
          { monthKey: "about:timeline.stages.2.items.11.month", eventKey: "about:timeline.stages.2.items.11.event" },
        ],
      },
      {
        yearKey: "about:timeline.stages.3.year",
        phaseKey: "about:timeline.stages.3.phase",
        items: [
          { monthKey: "about:timeline.stages.3.items.0.month", eventKey: "about:timeline.stages.3.items.0.event" },
          { monthKey: "about:timeline.stages.3.items.1.month", eventKey: "about:timeline.stages.3.items.1.event" },
          { monthKey: "about:timeline.stages.3.items.2.month", eventKey: "about:timeline.stages.3.items.2.event" },
          { monthKey: "about:timeline.stages.3.items.3.month", eventKey: "about:timeline.stages.3.items.3.event" },
          { monthKey: "about:timeline.stages.3.items.4.month", eventKey: "about:timeline.stages.3.items.4.event" },
          { monthKey: "about:timeline.stages.3.items.5.month", eventKey: "about:timeline.stages.3.items.5.event" },
          { monthKey: "about:timeline.stages.3.items.6.month", eventKey: "about:timeline.stages.3.items.6.event" },
          { monthKey: "about:timeline.stages.3.items.7.month", eventKey: "about:timeline.stages.3.items.7.event" },
          { monthKey: "about:timeline.stages.3.items.8.month", eventKey: "about:timeline.stages.3.items.8.event" },
          { monthKey: "about:timeline.stages.3.items.9.month", eventKey: "about:timeline.stages.3.items.9.event" },
          { monthKey: "about:timeline.stages.3.items.10.month", eventKey: "about:timeline.stages.3.items.10.event" },
        ],
      },
      {
        yearKey: "about:timeline.stages.4.year",
        phaseKey: "about:timeline.stages.4.phase",
        items: [
          { monthKey: "about:timeline.stages.4.items.0.month", eventKey: "about:timeline.stages.4.items.0.event" },
          { monthKey: "about:timeline.stages.4.items.1.month", eventKey: "about:timeline.stages.4.items.1.event" },
          { monthKey: "about:timeline.stages.4.items.2.month", eventKey: "about:timeline.stages.4.items.2.event" },
          { monthKey: "about:timeline.stages.4.items.3.month", eventKey: "about:timeline.stages.4.items.3.event" },
          { monthKey: "about:timeline.stages.4.items.4.month", eventKey: "about:timeline.stages.4.items.4.event" },
          { monthKey: "about:timeline.stages.4.items.5.month", eventKey: "about:timeline.stages.4.items.5.event" },
          { monthKey: "about:timeline.stages.4.items.6.month", eventKey: "about:timeline.stages.4.items.6.event" },
          { monthKey: "about:timeline.stages.4.items.7.month", eventKey: "about:timeline.stages.4.items.7.event" },
        ],
      },
    ] as TimelineStage[],
  },
} as const;

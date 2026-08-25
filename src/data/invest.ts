/**
 * 招商加盟页数据 - 来源 PROTOTYPE_PAGES.md §六 (6 section)
 *
 * 板块顺序 (与原型 §6.1 - §6.6 严格一致):
 *   1. hero           - 板块标题 + Hero 标语 (声价千亿 聚势共赢)
 *   2. prospect       - 行业前景好 — 听力行业的"三高一低"
 *                        (高流行 / 高危害 / 高可干预 / 低认知)
 *   3. advantages     - 项目优势强 — 赛道好 + 政府扶持 + 品牌实力强
 *   4. policy         - 合作政策 — 兜底式全面扶持
 *                        (开店全流程 / 专家全程带教 / 全域营销赋能 / 总部代运营兜底)
 *   5. contact        - 联系我们 (由全局 Footer 统一渲染)
 *
 * 视觉风格沿用原 2.0 复刻版 (朴素/绿主色/1200px 设计宽度/MiSans 字体)
 *
 * i18n 改造 (2026-07-25):
 *   - 所有可见文案改为 i18n key 引用 (titleKey / descKey / labelKey / altKey 等)
 *   - 保留 locale 无关字段: imageKey / 数字数据 (years / values / 人数等)
 *   - 翻译文件: src/i18n/locales/{zh-CN,zh-TW,en}/invest.json
 */

export const INVEST_PAGE = {
  /* §6.1 + §6.2 板块标题 + Hero 标语 */
  hero: {
    titleKey: "invest:hero.title",
    subtitleKey: "invest:hero.subtitle",
    descriptionKey: "invest:hero.description",
    imageAltKey: "invest:hero.imageAlt",
  },

  /* §6.3 行业前景好 — 听力行业的"三高一低" */
  prospect: {
    sectionTitleKey: "invest:prospect.sectionTitle",
    sectionSubtitleKey: "invest:prospect.sectionSubtitle",
    /* 高流行 */
    highPrevalence: {
      titleKey: "invest:prospect.highPrevalence.title",
      descKey: "invest:prospect.highPrevalence.desc",
      imageKey: "investHearingPrevalence",
      imageAltKey: "invest:prospect.highPrevalence.imageAlt",
      stats: [
        { numKey: "invest:prospect.highPrevalence.stats.0.num", labelKey: "invest:prospect.highPrevalence.stats.0.label", subKey: "invest:prospect.highPrevalence.stats.0.sub" },
        { numKey: "invest:prospect.highPrevalence.stats.1.num", labelKey: "invest:prospect.highPrevalence.stats.1.label", subKey: "invest:prospect.highPrevalence.stats.1.sub" },
        { numKey: "invest:prospect.highPrevalence.stats.2.num", labelKey: "invest:prospect.highPrevalence.stats.2.label", subKey: "invest:prospect.highPrevalence.stats.2.sub" },
        { numKey: "invest:prospect.highPrevalence.stats.3.num", labelKey: "invest:prospect.highPrevalence.stats.3.label", subKey: "invest:prospect.highPrevalence.stats.3.sub" },
      ],
    },
    /* 高危害 - 三大风险，每项含两个数据点 */
    highHarm: {
      titleKey: "invest:prospect.highHarm.title",
      descKey: "invest:prospect.highHarm.desc",
      risks: [
        {
          topicKey: "invest:prospect.highHarm.risks.0.topic",
          imageKey: "investHarmDementia",
          imageAltKey: "invest:prospect.highHarm.risks.0.imageAlt",
          stats: [
            { numKey: "invest:prospect.highHarm.risks.0.stats.0.num", labelKey: "invest:prospect.highHarm.risks.0.stats.0.label" },
            { numKey: "invest:prospect.highHarm.risks.0.stats.1.num", labelKey: "invest:prospect.highHarm.risks.0.stats.1.label" },
          ],
        },
        {
          topicKey: "invest:prospect.highHarm.risks.1.topic",
          imageKey: "investHarmFalling",
          imageAltKey: "invest:prospect.highHarm.risks.1.imageAlt",
          stats: [
            { numKey: "invest:prospect.highHarm.risks.1.stats.0.num", labelKey: "invest:prospect.highHarm.risks.1.stats.0.label" },
            { numKey: "invest:prospect.highHarm.risks.1.stats.1.num", labelKey: "invest:prospect.highHarm.risks.1.stats.1.label" },
          ],
        },
        {
          topicKey: "invest:prospect.highHarm.risks.2.topic",
          imageKey: "investHarmDepression",
          imageAltKey: "invest:prospect.highHarm.risks.2.imageAlt",
          stats: [
            { numKey: "invest:prospect.highHarm.risks.2.stats.0.num", labelKey: "invest:prospect.highHarm.risks.2.stats.0.label" },
            { numKey: "invest:prospect.highHarm.risks.2.stats.1.num", labelKey: "invest:prospect.highHarm.risks.2.stats.1.label" },
          ],
        },
      ],
    },
    /* 高可干预 */
    highIntervention: {
      titleKey: "invest:prospect.highIntervention.title",
      descKey: "invest:prospect.highIntervention.desc",
      imageKey: "investHearingLossGrade",
      imageAltKey: "invest:prospect.highIntervention.imageAlt",
    },
    /* 低认知 */
    lowAwareness: {
      titleKey: "invest:prospect.lowAwareness.title",
      descKey: "invest:prospect.lowAwareness.desc",
      groups: [
        {
          labelKey: "invest:prospect.lowAwareness.groups.0.label",
          itemKeys: [
            "invest:prospect.lowAwareness.groups.0.items.0",
            "invest:prospect.lowAwareness.groups.0.items.1",
            "invest:prospect.lowAwareness.groups.0.items.2",
          ],
        },
        {
          labelKey: "invest:prospect.lowAwareness.groups.1.label",
          itemKeys: [
            "invest:prospect.lowAwareness.groups.1.items.0",
            "invest:prospect.lowAwareness.groups.1.items.1",
            "invest:prospect.lowAwareness.groups.1.items.2",
          ],
        },
      ],
    },
  },

  /* §6.4 项目优势强 — 赛道好 + 政府扶持 + 品牌实力强 */
  advantages: {
    sectionTitleKey: "invest:advantages.sectionTitle",
    sectionSubtitleKey: "invest:advantages.sectionSubtitle",
    /* 赛道好 */
    track: {
      titleKey: "invest:advantages.track.title",
      descKey: "invest:advantages.track.desc",
      /* 双折线趋势图 - 中国助听器需求量 vs 资金规模 (单位: 亿) */
      lineChart: {
        titleKey: "invest:advantages.track.lineChart.title",
        yAxisUnitKey: "invest:advantages.track.lineChart.yAxisUnit",
        years: ["2000", "2010", "2015", "2020", "2025", "2030"],
        /* 橙色折线: 中国助听器需求量 */
        demand: [
          { year: "2000", value: 100 },
          { year: "2010", value: 160 },
          { year: "2015", value: 240 },
          { year: "2020", value: 350 },
          { year: "2025", value: 500 },
          { year: "2030", value: 680 },
        ],
        /* 绿色折线: 资金规模 */
        capital: [
          { year: "2000", value: 150 },
          { year: "2010", value: 230 },
          { year: "2015", value: 340 },
          { year: "2020", value: 490 },
          { year: "2025", value: 680 },
          { year: "2030", value: 900 },
        ],
        legendDemandKey: "invest:advantages.track.lineChart.legendDemand",
        legendCapitalKey: "invest:advantages.track.lineChart.legendCapital",
      },
    },
    /* 中国听力健康市场现状 - 2×2 布局 */
    marketStatus: {
      titleKey: "invest:advantages.marketStatus.title",
      descKey: "invest:advantages.marketStatus.desc",
      /* 2×2: 第一格 - 文本数据 */
      statText: {
        numKey: "invest:advantages.marketStatus.statText.num",
        labelKey: "invest:advantages.marketStatus.statText.label",
        subKey: "invest:advantages.marketStatus.statText.sub",
      },
      /* 2×2: 第二格 - 配图 (听力诊所场景图) */
      imageKey: "investChinaHearingLoss",
      imageAltKey: "invest:advantages.marketStatus.imageAlt",
      /* 2×2: 第三格 - 各国佩戴率对比 */
      countryRatesTitleKey: "invest:advantages.marketStatus.countryRatesTitle",
      countryRates: [
        { countryKey: "invest:advantages.marketStatus.countryRates.0.country", rate: "40%", isChina: false },
        { countryKey: "invest:advantages.marketStatus.countryRates.1.country", rate: "30%", isChina: false },
        { countryKey: "invest:advantages.marketStatus.countryRates.2.country", rate: "15%", isChina: false },
        { countryKey: "invest:advantages.marketStatus.countryRates.3.country", rate: "5%", isChina: true },
      ],
      footnoteKey: "invest:advantages.marketStatus.footnote",
      /* 2×2: 第四格 - 柱状图数据 */
      barChart: {
        titleKey: "invest:advantages.marketStatus.barChart.title",
        years: [
          { year: "2010", total: 21242, moderate: 6643 },
          { year: "2020", total: 25698, moderate: 8037 },
          { year: "2030", total: 31666, moderate: 9903 },
        ],
        legendTotalKey: "invest:advantages.marketStatus.barChart.legendTotal",
        legendModerateKey: "invest:advantages.marketStatus.barChart.legendModerate",
        totalTooltipKey: "invest:advantages.marketStatus.barChart.totalTooltip",
        moderateTooltipKey: "invest:advantages.marketStatus.barChart.moderateTooltip",
      },
    },
    /* 政策利好 */
    policy: {
      titleKey: "invest:advantages.policy.title",
      descKey: "invest:advantages.policy.desc",
      items: [
        {
          titleKey: "invest:advantages.policy.items.0.title",
          descKey: "invest:advantages.policy.items.0.desc",
        },
        {
          titleKey: "invest:advantages.policy.items.1.title",
          descKey: "invest:advantages.policy.items.1.desc",
        },
        {
          titleKey: "invest:advantages.policy.items.2.title",
          descKey: "invest:advantages.policy.items.2.desc",
        },
        {
          titleKey: "invest:advantages.policy.items.3.title",
          descKey: "invest:advantages.policy.items.3.desc",
        },
      ],
    },
    /* 全民听力健康意识提升 */
    awareness: {
      titleKey: "invest:advantages.awareness.title",
      descKey: "invest:advantages.awareness.desc",
      stats: [
        { numKey: "invest:advantages.awareness.stats.0.num", labelKey: "invest:advantages.awareness.stats.0.label", subKey: "invest:advantages.awareness.stats.0.sub" },
        { numKey: "invest:advantages.awareness.stats.1.num", labelKey: "invest:advantages.awareness.stats.1.label", subKey: "invest:advantages.awareness.stats.1.sub" },
        { numKey: "invest:advantages.awareness.stats.2.num", labelKey: "invest:advantages.awareness.stats.2.label", subKey: "invest:advantages.awareness.stats.2.sub" },
      ],
    },
    /* 著名上市创维集团旗下 — 3 个子模块 */
    brand: {
      titleKey: "invest:advantages.brand.title",
      subtitleKey: "invest:advantages.brand.subtitle",

      /* 品牌实力 4 大子模块 - InvestPage.tsx 3.5 渲染为 4 列文字卡 + 4 张配图 */
      items: [
        { titleKey: "invest:advantages.brand.items.0.title", descKey: "invest:advantages.brand.items.0.desc" },
        { titleKey: "invest:advantages.brand.items.1.title", descKey: "invest:advantages.brand.items.1.desc" },
        { titleKey: "invest:advantages.brand.items.2.title", descKey: "invest:advantages.brand.items.2.desc" },
        { titleKey: "invest:advantages.brand.items.3.title", descKey: "invest:advantages.brand.items.3.desc" },
      ],
      images: [
        { key: "productFamilyPortrait", altKey: "invest:advantages.brand.images.0.alt" },
        { key: "investOwnFactory", altKey: "invest:advantages.brand.images.1.alt" },
        { key: "investCertWall", altKey: "invest:advantages.brand.images.2.alt" },
        { key: "aboutHeroBg", altKey: "invest:advantages.brand.images.3.alt" },
      ],

      /* 1. 全线覆盖各程度 入门高端皆齐备 - 轮播图 */
      productCoverage: {
        titleKey: "invest:advantages.brand.productCoverage.title",
        slides: [
          {
            imageKey: "productFamilyPortrait",
            labelKey: "invest:advantages.brand.productCoverage.slides.0.label",
            descKey: "invest:advantages.brand.productCoverage.slides.0.desc",
          },
          {
            imageKey: "heroProductHearingAid",
            labelKey: "invest:advantages.brand.productCoverage.slides.1.label",
            descKey: "invest:advantages.brand.productCoverage.slides.1.desc",
          },
          {
            imageKey: "investHearingAidDemand",
            labelKey: "invest:advantages.brand.productCoverage.slides.2.label",
            descKey: "invest:advantages.brand.productCoverage.slides.2.desc",
          },
        ],
      },

      /* 2. 自有研发团队 自有生产工厂 - 参考图片附件布局 */
      rdFactory: {
        titleKey: "invest:advantages.brand.rdFactory.title",
        mainImageKey: "investOwnFactory",
        mainImageAltKey: "invest:advantages.brand.rdFactory.mainImageAlt",
        stats: [
          {
            imageKey: "investExpertTeam",
            number: "20+",
            unitKey: "invest:advantages.brand.rdFactory.stats.0.unit",
            labelKey: "invest:advantages.brand.rdFactory.stats.0.label",
            descKey: "invest:advantages.brand.rdFactory.stats.0.desc",
          },
          {
            imageKey: "investProductionEquipment",
            number: "30+",
            unitKey: "invest:advantages.brand.rdFactory.stats.1.unit",
            labelKey: "invest:advantages.brand.rdFactory.stats.1.label",
            descKey: "invest:advantages.brand.rdFactory.stats.1.desc",
          },
          {
            imageKey: "investPatentCerts",
            number: "50+",
            unitKey: "invest:advantages.brand.rdFactory.stats.2.unit",
            labelKey: "invest:advantages.brand.rdFactory.stats.2.label",
            descKey: "invest:advantages.brand.rdFactory.stats.2.desc",
          },
        ],
      },

      /* 3. 医疗资质齐全 官网真实可查 - 参考 about 荣誉资质模块 */
      qualifications: {
        titleKey: "invest:advantages.brand.qualifications.title",
        sectionSubtitleKey: "invest:advantages.brand.qualifications.sectionSubtitle",
        // 5 张真实证书 (横版 certReal1 放第 3 张位置居中)
        portrait: [
          { nameKey: "invest:advantages.brand.qualifications.portrait.0.name", imageKey: "certReal2" },
          { nameKey: "invest:advantages.brand.qualifications.portrait.1.name", imageKey: "certReal3" },
          { nameKey: "invest:advantages.brand.qualifications.portrait.2.name", imageKey: "certReal1" },
          { nameKey: "invest:advantages.brand.qualifications.portrait.3.name", imageKey: "certReal4" },
          { nameKey: "invest:advantages.brand.qualifications.portrait.4.name", imageKey: "certReal5" },
        ],
        // 国家专利认证 (复用 ProductPage 专利矩阵图)
        patents: {
          titleKey: "invest:advantages.brand.qualifications.patents.title",
          descKey: "invest:advantages.brand.qualifications.patents.desc",
          imageKey: "patentMatrixCustom",
          imageNoteKey: "invest:advantages.brand.qualifications.patents.imageNote",
        },
      },
    },
  },

  /* §6.5 合作政策 — 兜底式全面扶持 */
  policy: {
    sectionTitleKey: "invest:policy.sectionTitle",
    sectionSubtitleKey: "invest:policy.sectionSubtitle",
    /* 开店全流程服务 */
    storeOpen: {
      titleKey: "invest:policy.storeOpen.title",
      descKey: "invest:policy.storeOpen.desc",
      imageKey: "investStoreDesign",
      imageAltKey: "invest:policy.storeOpen.imageAlt",
      /* 联营店平面图 (AI 生成俯视图) */
      floorplanKey: "investStoreFloorplan",
      floorplanAltKey: "invest:policy.storeOpen.floorplanAlt",
      areaLabelKey: "invest:policy.storeOpen.areaLabel",
      storeTypes: [
        { typeKey: "invest:policy.storeOpen.storeTypes.0.type", area: "30-50m²" },
        { typeKey: "invest:policy.storeOpen.storeTypes.1.type", area: "10-30m²" },
      ],
    },
    /* 专家全程带教 */
    expertGuidance: {
      titleKey: "invest:policy.expertGuidance.title",
      descKey: "invest:policy.expertGuidance.desc",
      /* 专家团队照片 (AI 生成: 听力专家团队合影) */
      imageKey: "investExpertTeam",
      imageAltKey: "invest:policy.expertGuidance.imageAlt",
    },
    /* 全域营销赋能 */
    marketing: {
      titleKey: "invest:policy.marketing.title",
      descKey: "invest:policy.marketing.desc",
      images: [
        { key: "investMarketing1", altKey: "invest:policy.marketing.images.0.alt" },
        { key: "investMarketing2", altKey: "invest:policy.marketing.images.1.alt" },
        { key: "investMarketing3", altKey: "invest:policy.marketing.images.2.alt" },
        { key: "investMarketing4", altKey: "invest:policy.marketing.images.3.alt" },
      ],
    },
    /* 总部代运营兜底 */
    operations: {
      titleKey: "invest:policy.operations.title",
      descKey: "invest:policy.operations.desc",
      images: [
        { key: "investOperations1", altKey: "invest:policy.operations.images.0.alt" },
        { key: "investOperations2", altKey: "invest:policy.operations.images.1.alt" },
      ],
    },
  },

  /* §6.6 联系我们 - 由全局 Footer 统一渲染, 不在此重复声明 */
} as const;

/**
 * 站点全局配置
 * 包含站点基础信息、品牌信息、联系方式、备案信息、购物链接、社交平台等
 *
 * 数据源:
 *   - 旧版官网 (备案信息/医疗资质)
 *   - PROTOTYPE_PAGES.md §6.6 + §9.6 联系我们 (地址/电话/邮箱/在线客服)
 *   - PROTOTYPE_PAGES.md §9.1 选购指南 (3 类产品 × 3 个旗舰店)
 *   - PROTOTYPE_PAGES.md §9.5 关注我们 (微博/知乎)
 */

export const SITE_INFO = {
  name: "小维健康科技",
  brand: "小维健康科技",
  parentCompany: "小维健康科技（深圳）有限公司",
  /* —— 旗下两大品牌(用于品牌矩阵展示) —— */
  subBrands: {
    dasound: "Bigsound 大声", // AI 中文助听器品牌
    skyworth: "SKYWORTH 创维", // 健康智能穿戴品牌
  },

  /* —— 联系我们 (PROTOTYPE_PAGES.md §9.6) —— */
  hotline: "400-116-9566", // 服务咨询热线
  hotlineTel: "4001169566", // tel: 链接用 (无连字符)
  onlineServiceHours: "9:00-18:00", // 在线客服工作时间
  email: "admin@xiaowe.cc", // 企业邮箱 (2026-07-25 用户确认)
  companyAddress: "深圳市龙华区大浪街道兴亿1993数字时尚产业园A栋720",
  directStorePhone: "13116993115",
  directStoreAddress:
    "深圳市罗湖区喜荟城东区二层 238 号（地铁 5 号线太安站 C 口步行 700 米）",

  /* —— 旧版保留字段 (兼容现有引用) —— */
  phone: "0755-26902895",
  address: "深圳市龙华区大浪街道兴亿1993数字时尚产业园A栋720",

  /* —— 备案信息 —— */
  icp: "粤ICP备2022020947号",
  policeRecord: "粤公网安备44030002003867号",
  drugLicense: "互联网药品信息服务资格证 （粤）—经营性-2022-0419",
  copyright: "©2024 小维健康科技（深圳）有限公司 版权所有",
  medicalReg: "*粤械注准20232192086",
  medicalAd: "粤械广审（文）第280917-05538号",
  medicalNotice:
    "请仔细阅读产品说明书或在医务人员指导下购买和使用，禁忌内容或注意事项详见说明书。请在专业验配人员的指导下购买和使用",

  /* —— 社交平台 (PROTOTYPE_PAGES.md §9.5) —— */
  social: {
    weibo: "https://weibo.com/",
    zhihu: "https://www.zhihu.com/",
  },

  /* —— 大声听力服务中心 (官方直达) —— */
  hearingServiceUrl: "https://www.xiaowe.cc/h-col-104.html",

  /* —— 在线客服 (企业微信客服链接, 全站所有"在线咨询"入口统一跳转) —— */
  onlineConsultUrl: "https://work.weixin.qq.com/kfid/kfc48e42f711d1aaf9a",
} as const;

/**
 * 选购指南 - 官方店铺直达链接 (扁平列表, 无分类)
 * 数据源: 用户 2026-07-25 提供的最新店铺资料
 *
 * 2026-07-31 用户重新规划: 不再按产品分类, 所有官方店铺放在一个扁平列表里, 用平台标签区分。
 * 用户提供的全部 8 家店铺 + 1 官方服务中心 (大声听力服务中心):
 *   - 大声听力服务中心 (官方, xiaowe.cc) — Footer.tsx 单独置顶渲染, 走 hearingServiceUrl
 *   - 天猫·创维医疗器械旗舰店 (chuangweiylqx.tmall.com)
 *   - 京东·创维医疗器械旗舰店 (mall.jd.com/index-12400133)
 *   - 京东·创维助听器旗舰店 (mall.jd.com/index-19712207)
 *   - 拼多多·创维医疗器械旗舰店 (ps=0lDdljvIpE)
 *   - 拼多多·创维助听器医疗器械旗舰店 (ps=lae1OXGU7P)
 *   - 拼多多·小维医疗器械专营店 (ps=UYXZhOiOLG)
 *   - 天猫·创维声学专卖店 (skyworthsx.tmall.com)
 *   - 得物官方品牌页 (m.dewu.com brandId=1006814)
 *
 * 数据结构:
 *   - storeName: 具体店铺全名 (Footer 直接显示, 同平台多家店需区分)
 *   - platformKey: 平台 key (tmall/jd/pdd/dewu, 用于 i18n 平台标签)
 *   - href: 店铺直达 URL
 */
export type ShopPlatformKey = "tmall" | "jd" | "pdd" | "dewu";

export interface ShopLink {
  storeName: string;
  platformKey: ShopPlatformKey;
  href: string;
}

export const SHOP_LINKS: readonly ShopLink[] = [
  { storeName: "创维医疗器械旗舰店", platformKey: "tmall", href: "https://chuangweiylqx.tmall.com/" },
  { storeName: "创维医疗器械旗舰店", platformKey: "jd", href: "https://mall.jd.com/index-12400133.html?from=pc&cid=0" },
  { storeName: "创维助听器旗舰店", platformKey: "jd", href: "https://mall.jd.com/index-19712207.html?from=pc&cid=0" },
  { storeName: "创维医疗器械旗舰店", platformKey: "pdd", href: "https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE" },
  { storeName: "创维助听器医疗器械旗舰店", platformKey: "pdd", href: "https://mobile.yangkeduo.com/mall_page.html?ps=lae1OXGU7P" },
  { storeName: "小维医疗器械专营店", platformKey: "pdd", href: "https://mobile.yangkeduo.com/mall_page.html?ps=UYXZhOiOLG" },
  { storeName: "创维声学专卖店", platformKey: "tmall", href: "https://skyworthsx.tmall.com/" },
  { storeName: "得物官方品牌页", platformKey: "dewu", href: "https://m.dewu.com/router/product/BrandDetailPage?brandId=1006814" },
];

export type SiteInfo = typeof SITE_INFO;

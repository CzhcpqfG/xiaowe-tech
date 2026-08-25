/**
 * JSON-LD Schema 数据源
 *
 * 集中管理所有结构化数据 schema, 供 JsonLd 组件注入。
 *
 * 数据源:
 *   - SITE_INFO (config/site.ts): 公司名/电话/地址/邮箱/医疗资质
 *   - PRODUCTS (data/product.ts): 12 款产品
 *   - 各 i18n locale 文件: FAQ 问题列表
 *
 * Stage SEO/GEO B
 */

import { SITE_INFO } from "./site";

/** 站点根 URL */
export const SITE_ORIGIN = "https://www.xiaowe.cc";

/**
 * 把图片相对路径转成站点绝对 URL (供 JSON-LD 使用)
 *
 * 根路径部署 (2026-08-22): 资源引用统一为 "/images/...", 直接拼 SITE_ORIGIN。
 */
export function absoluteImage(path: string): string {
  return `${SITE_ORIGIN}${path}`;
}

/** Locale → hreflang 映射 */
const LOCALE_HREFLANG: Record<string, string> = {
  "zh-CN": "zh-CN",
  "zh-TW": "zh-TW",
  en: "en",
};

/**
 * Organization Schema - 公司/组织实体
 * 用于所有页面全局兜底, 让 AI 搜索引擎识别公司实体
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}/#organization`,
    name: "小维健康科技",
    alternateName: "Xiaowei Health Tech",
    legalName: "小维健康科技（深圳）有限公司",
    description:
      "小维健康科技（深圳）有限公司是创维集团旗下专注于智能穿戴设备、声学和听力健康系统研发、生产和营销一体化的高科技医疗器械与服务公司，旗下拥有 SKYWORTH 创维 与 Bigsound 大声 两大品牌，主营 AI 中文助听器、健康智能手表、儿童电话手表、蓝牙耳机等穿戴类产品。",
    url: SITE_ORIGIN,
    logo: `${SITE_ORIGIN}/images/common/logo.webp`,
    image: `${SITE_ORIGIN}/images/common/logo.webp`,
    telephone: SITE_INFO.hotline,
    email: "admin@xiaowe.cc",
    foundingDate: "2022",
    founders: [
      {
        "@type": "Person",
        name: "王海",
        jobTitle: "创始人 / 董事长",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "大浪街道兴亿1993数字时尚产业园A栋720",
      addressLocality: "深圳市龙华区",
      addressRegion: "广东省",
      addressCountry: "CN",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer service",
        telephone: `+86-${SITE_INFO.hotline}`,
        areaServed: "CN",
        availableLanguage: ["zh-CN", "en"],
        hoursAvailable: "Mo-Su 09:00-18:00",
      },
      {
        "@type": "ContactPoint",
        contactType: "sales",
        telephone: `+86-${SITE_INFO.directStorePhone}`,
        areaServed: "CN",
        availableLanguage: ["zh-CN"],
      },
    ],
    parentOrganization: {
      "@type": "Organization",
      name: "创维集团",
      alternateName: "Skyworth",
      url: "https://www.skyworth.com",
    },
    brand: [
      { "@type": "Brand", name: "Bigsound 大声" },
      { "@type": "Brand", name: "SKYWORTH 创维" },
    ],
    knowsAbout: [
      "助听器",
      "AI 中文助听器",
      "听力健康",
      "听力康复",
      "中文言语增强算法",
      "腾讯天籁",
      "医疗器械",
      "健康智能手表",
      "蓝牙耳机",
    ],
    sameAs: [
      SITE_INFO.hearingServiceUrl,
      SITE_INFO.social.weibo,
      SITE_INFO.social.zhihu,
    ],
  };
}

/**
 * WebSite Schema - 网站实体 + 搜索框
 * 让搜索引擎识别网站结构, 支持站点搜索框 (sitelinks search box)
 */
export function getWebsiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}/#website`,
    name: "小维健康科技官网",
    alternateName: "Xiaowei Health Tech 官网",
    url: SITE_ORIGIN,
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
    inLanguage: ["zh-CN", "zh-TW", "en"],
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_ORIGIN}/zh-CN/news?keyword={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * BreadcrumbList Schema - 面包屑
 * 用于子页面, 让搜索引擎识别页面层级
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Product Schema - 单款产品
 * 用于产品页, 让搜索引擎展示价格/品牌/评价等富片段
 */
export function getProductSchema(opts: {
  name: string;
  description: string;
  image: string;
  brand?: string;
  model?: string;
  category?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: opts.name,
    description: opts.description,
    image: opts.image,
    brand: {
      "@type": "Brand",
      name: opts.brand ?? "Bigsound 大声",
    },
    manufacturer: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.category ? { category: opts.category } : {}),
    ...(opts.url ? { url: opts.url } : {}),
  };
}

/**
 * MedicalDevice Schema - 医疗器械 (Product 的子类型)
 * 用于产品页, 强调医疗器械资质
 */
export function getMedicalDeviceSchema(opts: {
  name: string;
  description: string;
  image: string;
  model?: string;
  url?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalDevice",
    name: opts.name,
    description: opts.description,
    image: opts.image,
    brand: {
      "@type": "Brand",
      name: "Bigsound 大声",
    },
    manufacturer: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
    ...(opts.model ? { model: opts.model } : {}),
    ...(opts.url ? { url: opts.url } : {}),
    regulatoryIdentifier: SITE_INFO.medicalReg,
  };
}

/**
 * FAQPage Schema - FAQ 页面
 * 用于 FAQ 页 + 各核心页 FAQ 模块, 让 AI 搜索引擎直接抓取问答对
 *
 * 这是 GEO 优化最关键的 schema, 让豆包/ChatGPT 在用户提问时
 * 直接命中我们的问答, 回答时引用大声助听器
 */
export function getFaqSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/**
 * LocalBusiness Schema - 听力服务中心 (线下门店)
 * 用于产品页 / 服务中心模块, 让搜索引擎展示门店信息
 */
export function getLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "@id": `${SITE_ORIGIN}/#localbusiness`,
    name: "大声听力服务中心",
    alternateName: "Bigsound Hearing Service Center",
    description:
      "大声听力服务中心, 提供三甲医院同等百万级检查设备 + 耳科级声处方 + 远程 AI 验配服务",
    image: `${SITE_ORIGIN}/images/product/service_center_store_hd.webp`,
    url: SITE_INFO.hearingServiceUrl,
    telephone: SITE_INFO.directStorePhone,
    priceRange: "¥¥¥",
    address: {
      "@type": "PostalAddress",
      streetAddress: "喜荟城东区二层 238 号",
      addressLocality: "深圳市罗湖区",
      addressRegion: "广东省",
      addressCountry: "CN",
    },
    parentOrganization: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "09:00",
        closes: "21:00",
      },
    ],
  };
}

/**
 * WebPage Schema - 通用网页
 * 用于普通页面, 提供 canonical / language 信息
 */
export function getWebPageSchema(opts: {
  name: string;
  description: string;
  url: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale ?? "zh-CN",
    isPartOf: {
      "@id": `${SITE_ORIGIN}/#website`,
    },
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
  };
}

/**
 * AboutPage Schema - 关于页
 */
export function getAboutPageSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "关于小维",
    description:
      "小维健康科技, 创维生态旗下听力健康品牌, 专注 AI 中文助听器研发与服务",
    url,
    inLanguage: "zh-CN",
    isPartOf: {
      "@id": `${SITE_ORIGIN}/#website`,
    },
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
    mainEntity: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
  };
}

/**
 * ContactPage Schema - 联系页 (招商页 #contact 锚点)
 */
export function getContactPageSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "联系我们 - 小维健康科技招商加盟",
    description: "小维健康科技招商加盟联系方式: 服务热线 400-116-9566, 全国城市合伙人招募中",
    url,
    inLanguage: "zh-CN",
    isPartOf: {
      "@id": `${SITE_ORIGIN}/#website`,
    },
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
  };
}

/**
 * ItemList Schema - 产品/条目列表
 * 用于产品列表页 (Wearable), 让搜索引擎识别条目集合
 */
export function getItemListSchema(
  items: Array<{ name: string; url?: string; image?: string }>
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.url ? { url: item.url } : {}),
      ...(item.image ? { image: item.image } : {}),
    })),
  };
}

/**
 * CollectionPage Schema - 集合页 (资讯列表)
 * 用于资讯列表页, 标识该页为内容集合
 */
export function getCollectionPageSchema(opts: {
  name: string;
  description: string;
  url: string;
  locale?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    inLanguage: opts.locale ?? "zh-CN",
    isPartOf: {
      "@id": `${SITE_ORIGIN}/#website`,
    },
    publisher: {
      "@id": `${SITE_ORIGIN}/#organization`,
    },
  };
}

/** 导出 hreflang 映射供其他模块使用 */
export { LOCALE_HREFLANG };

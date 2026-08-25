/**
 * 路由路径常量 + locale-aware 路径生成函数
 *
 * URL 结构: /:locale/<path>
 *   - locale: zh-CN / zh-TW / en (默认 zh-CN)
 *   - path: about / product / wearable / invest / careers / news
 *
 * 用法:
 *   import { aboutPath, PATHS, newsDetailPath } from "./paths";
 *   import { useLocale } from "../i18n/useLocale";
 *
 *   const { locale } = useLocale();
 *   <Link to={aboutPath(locale)}>...</Link>
 *   <Link to={PATHS.HOME}>...</Link>  // 仅用于路由声明, 不能直接用于跳转
 */

import type { Locale } from "../i18n/types";
import { DEFAULT_LOCALE } from "../i18n/types";

/**
 * 路由路径模板 (用于路由声明, 不含 locale 前缀)
 *
 * 在 routes/index.tsx 中作为 <Route path={PATHS.ABOUT} /> 使用,
 * 这些路径会自动嵌套在 /:locale 父路由下。
 */
export const PATHS = {
  /** 首页 (index 路由) */
  HOME: "",
  /** 关于小维页 */
  ABOUT: "about",
  /** AI 中文助听器页 */
  PRODUCT: "product",
  /** 产品详情页 (动态参数 :slug) */
  PRODUCT_DETAIL: "product/:slug",
  /** 健康智能穿戴页 */
  WEARABLE: "wearable",
  /** 招商加盟页 */
  INVEST: "invest",
  /** 人才招聘页 */
  CAREERS: "careers",
  /** 资讯列表页 */
  NEWS: "news",
  /** 资讯分类页 (动态参数 :tag) */
  NEWS_CATEGORY: "news/category/:tag",
  /** 资讯详情页 (动态参数 :id) */
  NEWS_DETAIL: "news/:id",
  /** 常见问题页 */
  FAQ: "faq",
  /** 404 兜底路由 */
  NOT_FOUND: "*",
} as const;

/** 动态路由参数名 */
export const ROUTE_PARAMS = {
  /** 资讯详情页新闻 ID */
  NEWS_ID: "id",
  /** 资讯分类页标签 */
  NEWS_TAG: "tag",
  /** 资讯列表页分页参数 (URL query) */
  NEWS_PAGE: "m441page",
} as const;

/* ============================================================
   locale-aware 路径生成函数 (用于 <Link to={...}> 跳转)
   ============================================================ */

/** 给定 locale, 返回该 locale 的根路径 (如 /zh-CN) */
export function localeRoot(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}`;
}

/** 首页路径 */
export function homePath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}`;
}

/** 关于页路径 */
export function aboutPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/about`;
}

/** 产品页路径 */
export function productPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/product`;
}

/** 产品详情页路径 */
export function productDetailPath(
  locale: Locale = DEFAULT_LOCALE,
  slug: string
): string {
  return `/${locale}/product/${slug}`;
}

/** 智能穿戴页路径 */
export function wearablePath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/wearable`;
}

/** 招商加盟页路径 */
export function investPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/invest`;
}

/** 招聘页路径 */
export function careersPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/careers`;
}

/** 资讯列表页路径 */
export function newsPath(locale: Locale = DEFAULT_LOCALE, page?: number): string {
  if (!page || page <= 1) return `/${locale}/news`;
  return `/${locale}/news?${ROUTE_PARAMS.NEWS_PAGE}=${page}`;
}

/** 资讯分类页路径 (tag 已英文化 slug, 支持分页参数 m441page) */
export function newsCategoryPath(
  locale: Locale = DEFAULT_LOCALE,
  tag: string,
  page?: number
): string {
  const base = `/${locale}/news/category/${tag}`;
  if (!page || page <= 1) return base;
  return `${base}?${ROUTE_PARAMS.NEWS_PAGE}=${page}`;
}

/** 资讯详情页路径 */
export function newsDetailPath(
  locale: Locale = DEFAULT_LOCALE,
  id: string | number
): string {
  return `/${locale}/news/${id}`;
}

/** FAQ 页路径 */
export function faqPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/faq`;
}

/**
 * 兼容旧 API: newsDetailPath / newsCategoryPath / newsListPath 历史签名
 * (旧代码可能直接调用 newsDetailPath(id) 不传 locale, 此处兼容到当前 URL 的 locale)
 *
 * @deprecated 请使用 locale-aware 版本 (显式传 locale)
 */
export function newsDetailPathLegacy(id: string | number): string {
  return newsDetailPath(DEFAULT_LOCALE, id);
}

export function newsCategoryPathLegacy(tag: string): string {
  return newsCategoryPath(DEFAULT_LOCALE, tag);
}

export function newsListPathLegacy(page?: number): string {
  return newsPath(DEFAULT_LOCALE, page);
}

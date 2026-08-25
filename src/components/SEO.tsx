/**
 * SEO - 动态管理 <title> / <html lang> / hreflang / og:* / twitter:* / JSON-LD
 *
 * 用法:
 *   <SEO titleKey="home.title" descriptionKey="home.description" path="/" />
 *   <SEO titleKey="product.title" descriptionKey="product.description" path="/product"
 *        jsonLd={[productSchema, breadcrumbSchema]} />
 *
 * 注: titleKey / descriptionKey / keywordsKey 不含 "meta:" 前缀, 组件会自动拼接。
 *     path 不含 locale 前缀 (如 "/about" 而非 "/zh-CN/about")。
 *
 * 每个 locale 一个 meta.json, 包含所有页面的 title / description / keywords。
 * hreflang 自动生成 3 个 locale 的 alternate 链接, 供搜索引擎识别。
 *
 * Stage 5 of i18n + Stage SEO/GEO B (JSON-LD 注入) + Stage SEO/GEO D (OG/Twitter)
 */

import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { useLocale } from "../i18n/useLocale";
import { SUPPORTED_LOCALES } from "../i18n/types";
import { absoluteImage } from "../config/schema";

interface SEOProps {
  /** i18n key (不含 "meta:" 前缀), 如 "home.title" */
  titleKey: string;
  /** i18n key (不含 "meta:" 前缀), 如 "home.description" */
  descriptionKey: string;
  /** i18n key (不含 "meta:" 前缀, 可选), 如 "home.keywords" */
  keywordsKey?: string;
  /** 页面路径 (不含 locale 前缀), 如 "/" / "/about" / "/news/123" */
  path: string;
  /** 可选: 传入插值变量 (如 newsDetail 的 title / summary) */
  vars?: Record<string, string | number>;
  /** 可选: JSON-LD 结构化数据 (单个对象或数组) */
  jsonLd?: object | object[];
  /** 可选: OG 类型 (默认 website, 文章页用 article) */
  ogType?: "website" | "article";
  /** 可选: OG 图片 URL (默认用站点品牌图) */
  ogImage?: string;
  /** 可选: 是否禁止索引 (Login/Register/NotFound 用) */
  noindex?: boolean;
}

/** 站点根 URL (用于 canonical 与 hreflang) */
const SITE_ORIGIN = "https://www.xiaowe.cc";

/** 默认 OG 兜底图 (1200×630 专用分享图, scripts/generate-og.mjs 生成)
 * 经 absoluteImage 拼接 SITE_ORIGIN 得到绝对 URL */
const DEFAULT_OG_IMAGE = absoluteImage("/images/common/og-default.png");

export default function SEO({
  titleKey,
  descriptionKey,
  keywordsKey,
  path,
  vars,
  jsonLd,
  ogType = "website",
  ogImage,
  noindex,
}: SEOProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  const title = t(`meta:${titleKey}`, vars) as string;
  const description = t(`meta:${descriptionKey}`, vars) as string;
  const keywords = keywordsKey
    ? (t(`meta:${keywordsKey}`, vars) as string)
    : undefined;

  // 规范化 path: 确保以 / 开头, 末尾不带 / (除根路径)
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const canonical = `${SITE_ORIGIN}/${locale}${
    normalizedPath === "/" ? "" : normalizedPath
  }`;
  const ogImg = ogImage ?? DEFAULT_OG_IMAGE;
  const jsonLdArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonical} />
      {SUPPORTED_LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`${SITE_ORIGIN}/${loc}${
            normalizedPath === "/" ? "" : normalizedPath
          }`}
        />
      ))}
      {/* x-default 指向默认 locale (zh-CN) */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${SITE_ORIGIN}/zh-CN${
          normalizedPath === "/" ? "" : normalizedPath
        }`}
      />

      {/* Open Graph (Facebook / 微信 / LinkedIn) */}
      <meta property="og:locale" content={locale.replace("-", "_")} />
      <meta property="og:site_name" content="小维健康科技 Xiaowei Health Tech" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImg} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImg} />

      {/* JSON-LD 结构化数据 */}
      {jsonLdArray.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

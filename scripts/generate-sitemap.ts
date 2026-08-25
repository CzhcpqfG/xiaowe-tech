/**
 * 生成 sitemap.xml (GEO/SEO 关键)
 *
 * 覆盖范围 (2026-08-16 扩展):
 *   - 8 个静态主路由 × 3 locale = 27 URL
 *   - 产品详情动态路�?× 3 locale = 24 URL (�?detailImages �?8 �?
 *   - 新闻详情动态路�?× 3 locale = 54 URL (18 篇真实新�?
 * 每个 URL �?xhtml hreflang alternates (3 locale + x-default), 新闻�?lastmod (发布日期)
 *
 * 触发方式: build 前自动执�?(package.json "prebuild"), 或手�?npm run sitemap
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTS } from "../src/data/product";
import {
  SITEMAP_NEWS_IDS,
  NEWS_DATE_MAP,
  NEWS_CATEGORY_TAGS,
} from "./news-prerender-set";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORIGIN = "https://www.xiaowe.cc";
const LOCALES = ["zh-CN", "zh-TW", "en"] as const;
const DEFAULT_LOCALE = "zh-CN";

interface UrlEntry {
  url: string;
  freq: string;
  priority: string;
  lastmod?: string;
}

/** 静态主路由 (path 不含 locale 前缀) */
const STATIC_PATHS: Array<{ path: string; freq: string; priority: string }> = [
  { path: "", freq: "daily", priority: "1.0" },
  { path: "about", freq: "monthly", priority: "0.8" },
  { path: "product", freq: "weekly", priority: "0.9" },
  { path: "wearable", freq: "monthly", priority: "0.8" },
  { path: "invest", freq: "monthly", priority: "0.8" },
  { path: "careers", freq: "weekly", priority: "0.6" },
  { path: "news", freq: "daily", priority: "0.7" },
  { path: "faq", freq: "weekly", priority: "0.9" },
];

/** 有详情页的上架产�?slug (从数据源派生) */
const PRODUCT_DETAIL_SLUGS: readonly string[] = PRODUCTS.filter(
  (p) => p.detailImages?.length && p.slug && p.isListed
).map((p) => p.slug as string);

/** 新闻 id �?发布日期映射 (lastmod �?, 由共享集合模块提供全量列�?*/
const NEWS_IDS: readonly string[] = SITEMAP_NEWS_IDS;

/** 资讯分类�?(N4: 分类�?URL 独立可索�? canonical 指向分类�? */
const NEWS_CATEGORY_TAGS_LOCAL: readonly string[] = NEWS_CATEGORY_TAGS;

/** 组装全部 URL */
function buildUrls(): UrlEntry[] {
  const urls: UrlEntry[] = [];
  for (const locale of LOCALES) {
    // 1. 静态主路由
    for (const sp of STATIC_PATHS) {
      urls.push({
        url: `/${locale}${sp.path ? `/${sp.path}` : ""}`,
        freq: sp.freq,
        priority: sp.priority,
      });
    }
    // 2. 产品详情 (长尾转化主入�?
    for (const slug of PRODUCT_DETAIL_SLUGS) {
      urls.push({
        url: `/${locale}/product/${slug}`,
        freq: "weekly",
        priority: "0.8",
      });
    }
    // 3. 新闻详情
    for (const id of NEWS_IDS) {
      urls.push({
        url: `/${locale}/news/${id}`,
        freq: "monthly",
        priority: "0.6",
        lastmod: NEWS_DATE_MAP[id],
      });
    }
    // 4. 资讯分类�?(2026-08-18 N4 新增, canonical 指向分类�? 独立收录)
    for (const tag of NEWS_CATEGORY_TAGS_LOCAL) {
      urls.push({
        url: `/${locale}/news/category/${tag}`,
        freq: "weekly",
        priority: "0.7",
      });
    }
  }
  return urls;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 把某�?URL �?locale 前缀替换为目�?locale (生成 hreflang alternates) */
function withLocale(url: string, locale: string): string {
  return url.replace(/^\/(zh-CN|zh-TW|en)(\/|$)/, `/${locale}$2`);
}

function buildXml(urls: UrlEntry[]): string {
  const blocks = urls.map((u) => {
    const loc = `${ORIGIN}${u.url}`;
    const alternates = LOCALES.map(
      (l) =>
        `    <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(
          `${ORIGIN}${withLocale(u.url, l)}`
        )}" />`
    ).join("\n");
    const xDefault = `${ORIGIN}${withLocale(u.url, DEFAULT_LOCALE)}`;
    const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : "";
    return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <changefreq>${u.freq}</changefreq>
    <priority>${u.priority}</priority>${lastmod}
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(
      xDefault
    )}" />
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${blocks.join("\n")}
</urlset>
`;
}

const urls = buildUrls();
const xml = buildXml(urls);
writeFileSync(resolve(__dirname, "../public/sitemap.xml"), xml, "utf-8");
console.log(
  `�?sitemap.xml 已生�? ${urls.length} �?URL (静�?${STATIC_PATHS.length * LOCALES.length} + 产品详情 ${PRODUCT_DETAIL_SLUGS.length * LOCALES.length} + 新闻 ${NEWS_IDS.length * LOCALES.length} + 资讯分类 ${NEWS_CATEGORY_TAGS_LOCAL.length * LOCALES.length})`
);
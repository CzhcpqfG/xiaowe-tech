/**
 * 新闻预渲染集合 - sitemap 与 prerender 共享的选择逻辑 (N3 对齐)
 *
 * 背景 (2026-08-18):
 *   此前 sitemap 列全部 372 篇 (×3 locale = 1116 URL), 而 prerender 只预渲染
 *   最新 24 篇 (×3 = 72 页)。两个脚本各自维护集合, 产生漂移:
 *   348 篇 (1044 URL) 依赖 404.html SPA 兜底, 无 JS 爬虫只能拿到空壳。
 *
 * 本模块统一选择逻辑, 两个脚本共用, 避免再次漂移:
 *   - SITEMAP_NEWS_IDS:     全量 372 篇 (sitemap 收录全部, Google 可渲染 SPA 兜底)
 *   - PRERENDER_NEWS_IDS:   均衡子集 (全局最新 30 篇 ∪ 每分类最新 10 篇),
 *                           确保每个分类都有静态 HTML 落点, 而非只覆盖最新一篇分类
 *
 * 变更: 预渲染覆盖从 24 → ~50 篇 (3 locale ≈ 150 页, 总耗时 ~8min 可接受)
 */
import { NEWS_LIST, NEWS_CATEGORY_MAP, NEWS_CATEGORIES } from "../src/data/home";

/** 全局最新 N 篇 (覆盖主时间线) */
const GLOBAL_LATEST_COUNT = 30;
/** 每分类最新 N 篇 (确保 industry/company/product 三类都有静态覆盖) */
const PER_CATEGORY_COUNT = 10;

/** 全量新闻 id (sitemap 用, 保持有序) */
export const SITEMAP_NEWS_IDS: readonly string[] = NEWS_LIST.map((n) => n.id);

/** 资讯分类 tag 列表 (sitemap 分类页 URL 用) */
export const NEWS_CATEGORY_TAGS: readonly string[] = NEWS_CATEGORIES;

/** 新闻 id → 发布日期映射 (lastmod 用) */
export const NEWS_DATE_MAP: Record<string, string> = Object.fromEntries(
  NEWS_LIST.map((n) => [n.id, n.date])
);

/** 预渲染新闻 id (均衡子集, 去重保序) */
export const PRERENDER_NEWS_IDS: readonly string[] = (() => {
  const set = new Set<string>();

  // 1. 全局最新
  for (const n of NEWS_LIST.slice(0, GLOBAL_LATEST_COUNT)) {
    set.add(n.id);
  }

  // 2. 每分类最新
  for (const cat of NEWS_CATEGORIES) {
    let taken = 0;
    for (const n of NEWS_LIST) {
      if (NEWS_CATEGORY_MAP[n.id] === cat) {
        set.add(n.id);
        taken++;
        if (taken >= PER_CATEGORY_COUNT) break;
      }
    }
  }

  return [...set];
})();

/** 直接执行时打印统计 (import 时不打印) */
if (process.argv[1] && process.argv[1].endsWith("news-prerender-set.ts")) {
  console.log(
    `[news-prerender-set] sitemap ${SITEMAP_NEWS_IDS.length} 篇 | prerender ${PRERENDER_NEWS_IDS.length} 篇`
  );
  const byCat: Record<string, number> = {};
  for (const id of PRERENDER_NEWS_IDS) {
    const cat = NEWS_CATEGORY_MAP[id];
    byCat[cat] = (byCat[cat] ?? 0) + 1;
  }
  console.log(`  prerender 分类分布: ${JSON.stringify(byCat)}`);
}
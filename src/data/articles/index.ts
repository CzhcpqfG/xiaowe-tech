/**
 * 新闻文章异步加载器 (2026-08-18 分片优化)
 *
 * 372 篇正文约 1.5MB, 若全部打进主 bundle 会拖垮首屏 (曾 3.2MB)。
 * 现拆为 10 个分片 (每片 ~40 篇), 通过 getArticle(id) 按需加载。
 *
 * 使用:
 *   import { getArticle } from "../data/articles";
 *   const article = await getArticle("1243");
 */
import type { NewsArticle } from "./types";

export type { NewsArticle, ArticleBlock } from "./types";

/** 分片注册表: id → 分片加载函数 (按 id 数字段路由, 无需运行时遍历) */
const PARTS: Array<{ min: number; max: number; load: () => Promise<typeof import("./part1")> }> = [
  { min: 1158, max: 1243, load: () => import("./part1") },
  { min: 1065, max: 1156, load: () => import("./part2") },
  { min: 975, max: 1062, load: () => import("./part3") },
  { min: 893, max: 971, load: () => import("./part4") },
  { min: 802, max: 891, load: () => import("./part5") },
  { min: 719, max: 801, load: () => import("./part6") },
  { min: 633, max: 717, load: () => import("./part7") },
  { min: 547, max: 631, load: () => import("./part8") },
  { min: 106, max: 543, load: () => import("./part9") },
  { min: 51, max: 99, load: () => import("./part10") },
];

const cache = new Map<string, NewsArticle | undefined>();

/**
 * 异步获取单篇文章 (按 id 路由到对应分片并缓存)
 * 若 id 不存在返回 undefined
 */
export async function getArticle(id: string): Promise<NewsArticle | undefined> {
  if (cache.has(id)) return cache.get(id);
  const n = Number(id);
  if (!Number.isFinite(n)) return undefined;
  const part = PARTS.find((p) => n >= p.min && n <= p.max);
  if (!part) return undefined;
  const mod = await part.load();
  const article = mod.NEWS_ARTICLES_PART[id];
  cache.set(id, article);
  return article;
}

/**
 * 兼容旧 API: 同步获取 (仅用于类型检查/测试, 运行时请用 getArticle)
 * @deprecated 数据已分片, 请使用异步 getArticle
 */
export const NEWS_ARTICLES = {} as Record<string, NewsArticle>;

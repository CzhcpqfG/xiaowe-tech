/**
 * news namespace 按需加载 (P2-5 bundle 拆分)
 *
 * news.json 三语共 ~536KB, 仅新闻列表/详情两个页面使用。
 * 从 i18n 主包拆出, 进入新闻路由时动态 import + addResourceBundle 注入。
 *
 * 关键约束: 必须在新闻页组件 mount 前 await 完成, 否则 useTranslation("news")
 * 会渲染 key 裸串。由 routes/index.tsx 的 lazy loader 串行保证:
 *   lazy(async () => { await loadNewsNamespace(locale); return import("..."); })
 *
 * 已加载标记避免重复 import; locale 切换时补载新语言。
 */
import i18n from "./index";
import type { Locale } from "./types";

const loaded = new Set<Locale>();

/** 各语言的 news namespace chunk (vite 自动分割为独立 chunk) */
const loaders: Record<Locale, () => Promise<{ default: object }>> = {
  "zh-CN": () => import("./locales/zh-CN/news.json"),
  "zh-TW": () => import("./locales/zh-TW/news.json"),
  en: () => import("./locales/en/news.json"),
};

/**
 * 确保 news namespace 已注入 i18next。
 * 幂等: 同一 locale 只加载一次。失败向上抛出, 由调用方决定降级行为。
 */
export async function loadNewsNamespace(locale: Locale): Promise<void> {
  if (loaded.has(locale)) return;
  const mod = await loaders[locale]();
  i18n.addResourceBundle(locale, "news", mod.default, true, true);
  loaded.add(locale);
}

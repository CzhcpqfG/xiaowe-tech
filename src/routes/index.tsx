/**
 * 集中路由配置
 *
 * URL 结构: /:locale/<path>
 *   - 默认 locale: zh-CN
 *   - 支持的 locale: zh-CN / zh-TW / en
 *
 * 路由层级:
 *   <Routes>
 *     <Route path="/" element={<RootRedirect />} />          ← 根路径智能重定向
 *     <Route path=":locale" element={<LocaleLayout />}>      ← locale 校验 + Layout
 *       <Route index element={<HomePage />} />               ← 各业务页面 (带 Header/Footer)
 *       <Route path="about" ... />
 *       ...
 *       <Route path="*" element={<NotFoundPage />} />        ← 404 兜底
 *     </Route>
 *     <Route path="*" element={<RootRedirect />} />          ← 兜底重定向
 *   </Routes>
 */

import { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router-dom";
import Layout from "../components/layout/Layout";
import { PATHS } from "./paths";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from "../i18n/types";
import { pickInitialLocale } from "../i18n/useLocale";
import { useLocale } from "../i18n/useLocale";
import { loadNewsNamespace } from "../i18n/newsResources";
import RouteErrorBoundary from "./RouteErrorBoundary";

// 页面级代码分割 (P2-5): 全部业务页面懒加载, 主 chunk 只保留框架 + 共享 UI + 常用 i18n。
// prerender 为真实浏览器渲染, 会等待动态 chunks 加载完成后输出完整 HTML。
const HomePage = lazy(() => import("../pages/HomePage"));
const ProductPage = lazy(() => import("../pages/ProductPage"));
// 新闻两页需先注入 news namespace (体量大, 按需加载) 再挂载组件,
// 保证首帧渲染时翻译资源已就位 (避免 key 裸串/闪变)。
// lazy loader 执行时 Route 已匹配, window.location 即目标 URL, 从中取 locale。
function localeFromLocation(): Locale | null {
  const seg = window.location.pathname.split("/")[1];
  return isLocale(seg) ? seg : null;
}
const NewsListPage = lazy(async () => {
  const locale = localeFromLocation();
  if (locale) await loadNewsNamespace(locale);
  return import("../pages/NewsListPage");
});
const NewsDetailPage = lazy(async () => {
  const locale = localeFromLocation();
  if (locale) await loadNewsNamespace(locale);
  return import("../pages/NewsDetailPage");
});
const ProductDetailPage = lazy(() => import("../pages/ProductDetailPage"));
const AboutPage = lazy(() => import("../pages/AboutPage"));
const WearablePage = lazy(() => import("../pages/WearablePage"));
const InvestPage = lazy(() => import("../pages/InvestPage"));
const CareersPage = lazy(() => import("../pages/CareersPage"));
const FaqPage = lazy(() => import("../pages/FaqPage"));
const NotFoundPage = lazy(() => import("../pages/NotFoundPage"));

/**
 * Suspense 兜底占位
 * 注意: 仅在 chunk 网络加载期间出现 (本地预渲染/首次导航), 高度占满视口避免布局跳动。
 */
function PageFallback() {
  return <div className="min-h-[70vh]" aria-hidden="true" />;
}

/**
 * 根路径重定向: / → /{推荐 locale}
 *
 * 优先级: cookie > 浏览器语言 > DEFAULT_LOCALE
 */
function RootRedirect() {
  const location = useLocation();
  const target = pickInitialLocale();
  // 保留原始路径与查询参数
  const rest = location.pathname.replace(/^\/(zh-CN|zh-TW|en)?(\/?)/, "/");
  const fullPath = `/${target}${rest === "/" ? "" : rest}${location.search}${location.hash}`;
  return <Navigate to={fullPath} replace />;
}

/**
 * LocaleLayout - locale 校验 + Layout 容器
 *
 * - 从 URL 取 :locale, 校验合法性
 * - 调用 useLocale() 同步 i18next + <html lang> + cookie
 * - 非法 locale 则重定向到 /{DEFAULT_LOCALE}/{原 path}
 * - 合法则渲染 <Layout /> (内含 <Outlet />)
 */
function LocaleLayout() {
  const { locale: urlLocale } = useParams<{ locale: string }>();
  const location = useLocation();

  // 非法 locale → 重定向到默认 locale 的同一路径
  if (!isLocale(urlLocale)) {
    const rest = location.pathname.replace(/^\/[^/]+/, "");
    const newPath = `/${DEFAULT_LOCALE}${rest || ""}${location.search}${location.hash}`;
    return <Navigate to={newPath} replace />;
  }

  return <LocaleLayoutInner />;
}

/** LocaleLayout 内部组件 (locale 已校验合法, 用于触发 useLocale 的副作用) */
function LocaleLayoutInner() {
  // 调用 useLocale 触发 i18next + <html lang> 同步
  useLocale();
  return <Layout />;
}

/** 辅助: 类型检查用 */
const _supportedLocales: readonly Locale[] = SUPPORTED_LOCALES;
void _supportedLocales;

/**
 * 应用路由树
 */
export default function AppRoutes() {
  return (
    // ErrorBoundary 兜底 chunk 加载失败; Suspense 兜底加载期占位 (等高, 防布局跳动)
    <RouteErrorBoundary>
      <Suspense fallback={<PageFallback />}>
        <Routes>
      {/* 根路径智能重定向到 /{推荐 locale} */}
      <Route path="/" element={<RootRedirect />} />

      {/* 带 Layout 的业务页面 (locale 前缀) */}
      <Route path=":locale" element={<LocaleLayout />}>
        <Route index element={<HomePage />} />
        <Route path={PATHS.ABOUT} element={<AboutPage />} />
        <Route path={PATHS.PRODUCT} element={<ProductPage />} />
        <Route path={PATHS.PRODUCT_DETAIL} element={<ProductDetailPage />} />
        <Route path={PATHS.WEARABLE} element={<WearablePage />} />
        <Route path={PATHS.INVEST} element={<InvestPage />} />
        <Route path={PATHS.CAREERS} element={<CareersPage />} />
        <Route path={PATHS.NEWS} element={<NewsListPage />} />
        <Route path={PATHS.NEWS_CATEGORY} element={<NewsListPage />} />
        <Route path={PATHS.NEWS_DETAIL} element={<NewsDetailPage />} />
        <Route path={PATHS.FAQ} element={<FaqPage />} />
        <Route path={PATHS.NOT_FOUND} element={<NotFoundPage />} />
      </Route>

      {/* 兜底重定向 */}
        <Route path="*" element={<RootRedirect />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}

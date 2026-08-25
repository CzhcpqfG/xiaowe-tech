import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMAGES } from "../../data/images";
import { IMAGE_SIZES } from "../../data/generated/imageSizes";
import { NAV_ITEMS, LANGUAGE_OPTIONS } from "../../config/navigation";
import { homePath } from "../../routes/paths";
import { useLocale } from "../../i18n/useLocale";
import { LOCALE_LABELS, type Locale } from "../../i18n/types";

/* ============================================================
   Header - 顶部导航栏 (3.0 版, i18n 改造)
   数据源: PROTOTYPE_PAGES.md §1.2 导航菜单 + §1.3 全站通用组件

   结构:
     - 左侧: Logo (点击回首页)
     - 中间: 7 项主导航 (首页/关于小维/AI中文助听器/健康智能穿戴/招商加盟/人才招聘/资讯中心)
     - 右侧: 语言切换 (3 locale 全可用)

   i18n:
     - 所有可见文案通过 t("common:header.*") / t("common:nav.*") 翻译
     - 路径通过 locale-aware 函数 (homePath) 生成
     - 语言切换器调用 useLocale().changeLocale(newLocale) 实现 URL 跳转

   设计规范 (沿用 2.0 朴素风格):
     - 固定 1200px 设计宽度, h=89px (logo 40px, 居中对齐)
     - 选中色 #52b548 加粗, hover 同色 0.3s ease
     - 无圆角 / 无阴影 / 无渐变 (仅滚动后底部加 1px hairline 分割)
   ============================================================ */

export default function Header() {
  const { t } = useTranslation();
  const { locale, changeLocale } = useLocale();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 点击外部关闭语言下拉
  useEffect(() => {
    if (!langOpen) return;
    const onClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [langOpen]);

  // 路由切换时关闭移动端抽屉
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // 移动端抽屉打开时锁定 body 滚动
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // 当前语言对应的根路径 (如 /zh-CN), 用于 active 判定
  const localeRoot = `/${locale}`;

  const isActive = (path: string) => {
    // path 是 locale-aware 完整路径 (如 /zh-CN/about)
    if (path === localeRoot) {
      // 首页: 严格匹配 locale 根路径
      return pathname === localeRoot || pathname === `${localeRoot}/`;
    }
    // 其他页: startsWith 判定
    return pathname.startsWith(path);
  };

  const handleLangSelect = (code: Locale) => {
    if (code === locale) {
      setLangOpen(false);
      return;
    }
    changeLocale(code);
    setLangOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-white transition-shadow duration-300 ${
        scrolled ? "border-b border-ink-200" : "border-b border-transparent"
      }`}
    >
      <div className="container-page flex items-center justify-between h-[60px] lg:h-[89px]">
        {/* Logo - 左侧 */}
        <Link
          to={homePath(locale)}
          className="flex items-center"
          aria-label={t("common:header.logoAriaLabel")}
        >
          <img
            src={IMAGES.logo}
            alt={t("common:header.logoAlt")}
            width={IMAGE_SIZES[IMAGES.logo]?.[0]}
            height={IMAGE_SIZES[IMAGES.logo]?.[1]}
            className="h-[19px] lg:h-[24px] w-auto object-contain"
          />
        </Link>

        {/* 主导航 - 桌面端显示 */}
        <nav className="hidden lg:flex items-center gap-7">
          {NAV_ITEMS.map((item) => {
            const path = item.getPath(locale);
            return (
              <Link
                key={item.labelKey}
                to={path}
                className={`text-[15px] font-normal transition-colors duration-300 whitespace-nowrap ${
                  isActive(path)
                    ? "text-brand-green-light font-bold"
                    : "text-ink-700 hover:text-brand-green-light"
                }`}
              >
                {t(`common:${item.labelKey}`)}
              </Link>
            );
          })}
        </nav>

        {/* 右侧操作区: 语言切换 - 桌面端显示 */}
        <div className="hidden lg:flex items-center gap-4 ml-4">
          {/* 语言切换 */}
          <div className="relative" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1 text-[13px] text-ink-700 hover:text-brand-green-light transition-colors duration-300"
              aria-label={t("common:header.langSwitcherAria")}
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
              </svg>
              <span>{LOCALE_LABELS[locale]}</span>
              <svg
                className={`w-3 h-3 transition-transform duration-300 ${
                  langOpen ? "rotate-180" : ""
                }`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 min-w-[140px] bg-white border border-ink-200 py-1">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleLangSelect(opt.code as Locale)}
                    className={`flex items-center justify-between w-full px-4 py-2 text-[13px] transition-colors duration-200 ${
                      opt.code === locale
                        ? "text-brand-green-light font-bold bg-ink-100/60"
                        : "text-ink-700 hover:text-brand-green-light hover:bg-ink-100/40"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 汉堡按钮 - 移动端显示 */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          className="lg:hidden flex items-center justify-center w-10 h-10 -mr-2 text-ink-700 hover:text-brand-green-light transition-colors duration-300"
          aria-label={
            mobileMenuOpen
              ? t("common:header.menu.close")
              : t("common:header.menu.open")
          }
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </div>

      {/* 移动端抽屉菜单 - 全屏覆盖式 */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-[100]">
          {/* 遮罩 */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* 抽屉面板 */}
          <div className="absolute top-0 right-0 h-full w-[80%] max-w-[360px] bg-white overflow-y-auto">
            {/* 抽屉头部 */}
            <div className="flex items-center justify-between h-[60px] px-4 border-b border-ink-200">
              <span className="text-[16px] font-medium text-ink-900">
                {t("common:header.menu.title")}
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center w-10 h-10 -mr-2 text-ink-700 hover:text-brand-green-light transition-colors duration-300"
                aria-label={t("common:header.menu.close")}
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* 导航项 */}
            <nav className="flex flex-col py-2">
              {NAV_ITEMS.map((item) => {
                const path = item.getPath(locale);
                return (
                  <Link
                    key={item.labelKey}
                    to={path}
                    className={`px-5 py-3 text-[16px] transition-colors duration-200 border-b border-ink-100 ${
                      isActive(path)
                        ? "text-brand-green-light font-bold bg-ink-100/40"
                        : "text-ink-700 hover:text-brand-green-light hover:bg-ink-100/40"
                    }`}
                  >
                    {t(`common:${item.labelKey}`)}
                  </Link>
                );
              })}
            </nav>

            {/* 语言切换 */}
            <div className="px-5 py-4 border-b border-ink-100">
              <div className="text-[12px] text-ink-500 mb-2">
                {t("common:header.langTitle")}
              </div>
              <div className="flex gap-2">
                {LANGUAGE_OPTIONS.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => handleLangSelect(opt.code as Locale)}
                    className={`px-3 py-1.5 text-[13px] transition-colors duration-200 ${
                      opt.code === locale
                        ? "text-white bg-brand-green"
                        : "text-ink-700 border border-ink-200 hover:border-brand-green hover:text-brand-green-light"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

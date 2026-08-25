/**
 * useLocale - locale 感知 hook
 *
 * 从 URL :locale 参数读取当前 locale, 并:
 *   1. 同步 i18next.changeLanguage
 *   2. 同步 document.documentElement.lang (SEO + 无障碍)
 *   3. 提供 changeLocale(newLocale) 切换语言 (更新 URL + cookie)
 *
 * 用法:
 *   const { locale, changeLocale } = useLocale();
 *   changeLocale("en");  // URL 自动跳转到 /en/...
 *
 * 注: URL 是 locale 的唯一权威源。不使用 localStorage 避免双源不一致。
 */

import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { changeLanguage, DEFAULT_LOCALE, isLocale, type Locale } from "./index";

const LOCALE_COOKIE_NAME = "lang";
const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 年

/** 从 URL pathname 中提取 locale 前缀 */
export function extractLocaleFromPath(pathname: string): Locale | null {
  const match = pathname.match(/^\/(zh-CN|zh-TW|en)(\/|$|\?)/);
  if (!match) return null;
  return match[1] as Locale;
}

/** 从 cookie 读取 locale */
export function readLocaleCookie(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`${LOCALE_COOKIE_NAME}=(zh-CN|zh-TW|en)`)
  );
  return match ? (match[1] as Locale) : null;
}

/** 写入 cookie */
export function writeLocaleCookie(locale: Locale) {
  if (typeof document === "undefined") return;
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${LOCALE_COOKIE_MAX_AGE}`;
}

/** 浏览器语言偏好探测 (首次访问时用) */
export function detectBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || "";
  if (lang.startsWith("zh")) {
    return lang.includes("TW") || lang.includes("HK") || lang.includes("Hant")
      ? "zh-TW"
      : "zh-CN";
  }
  if (lang.startsWith("en")) return "en";
  return DEFAULT_LOCALE;
}

/** 推荐 locale: cookie > 浏览器语言 > 默认 */
export function pickInitialLocale(): Locale {
  return readLocaleCookie() ?? detectBrowserLocale();
}

export interface UseLocaleResult {
  /** 当前 locale (合法化后, 永不为 undefined) */
  locale: Locale;
  /** 切换到新 locale (更新 URL + cookie, 自动触发 i18next 切换) */
  changeLocale: (newLocale: Locale) => void;
}

export function useLocale(): UseLocaleResult {
  const params = useParams<{ locale?: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const urlLocale = isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;

  // 同步 i18next + <html lang>
  useEffect(() => {
    changeLanguage(urlLocale);
    document.documentElement.lang = urlLocale;
  }, [urlLocale]);

  const changeLocale = (newLocale: Locale) => {
    // 取当前 pathname, 去掉旧 locale 前缀
    const rest = location.pathname.replace(/^\/(zh-CN|zh-TW|en)/, "");
    writeLocaleCookie(newLocale);
    navigate(`/${newLocale}${rest || ""}${location.search}${location.hash}`);
  };

  return { locale: urlLocale, changeLocale };
}

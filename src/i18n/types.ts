/**
 * i18n 类型定义
 */

export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "zh-CN";

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
};

/** 判断字符串是否为合法 Locale */
export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}

/** 资源命名空间 */
export type Namespace =
  | "common"
  | "home"
  | "product"
  | "about"
  | "invest"
  | "wearable"
  | "careers"
  | "news"
  | "meta";

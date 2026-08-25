/**
 * i18n 初始化
 *
 * 使用 react-i18next + i18next
 * 三套 locale: zh-CN (默认) / zh-TW / en
 * 命名空间: common / home / product / about / invest / wearable / careers / news / meta
 *
 * 用法:
 *   import { useTranslation } from "react-i18next";
 *   const { t } = useTranslation();
 *   <h1>{t("common:nav.home")}</h1>
 *
 * 切换语言:
 *   通过 URL /:locale/... 路由参数驱动, LocaleContext 同步 i18next.changeLanguage
 */

import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// zh-CN (news namespace 体量大 ~178KB×3, 已拆分至 ./newsResources 按需加载, 见 P2-5)
import zhCNCommon from "./locales/zh-CN/common.json";
import zhCNHome from "./locales/zh-CN/home.json";
import zhCNProduct from "./locales/zh-CN/product.json";
import zhCNAbout from "./locales/zh-CN/about.json";
import zhCNInvest from "./locales/zh-CN/invest.json";
import zhCNWearable from "./locales/zh-CN/wearable.json";
import zhCNCareers from "./locales/zh-CN/careers.json";
import zhCNMeta from "./locales/zh-CN/meta.json";
import zhCNFaq from "./locales/zh-CN/faq.json";

// zh-TW
import zhTWCommon from "./locales/zh-TW/common.json";
import zhTWHome from "./locales/zh-TW/home.json";
import zhTWProduct from "./locales/zh-TW/product.json";
import zhTWAbout from "./locales/zh-TW/about.json";
import zhTWInvest from "./locales/zh-TW/invest.json";
import zhTWWearable from "./locales/zh-TW/wearable.json";
import zhTWCareers from "./locales/zh-TW/careers.json";
import zhTWMeta from "./locales/zh-TW/meta.json";
import zhTWFaq from "./locales/zh-TW/faq.json";

// en
import enCommon from "./locales/en/common.json";
import enHome from "./locales/en/home.json";
import enProduct from "./locales/en/product.json";
import enAbout from "./locales/en/about.json";
import enInvest from "./locales/en/invest.json";
import enWearable from "./locales/en/wearable.json";
import enCareers from "./locales/en/careers.json";
import enMeta from "./locales/en/meta.json";
import enFaq from "./locales/en/faq.json";

import { DEFAULT_LOCALE, type Locale } from "./types";

export * from "./types";

export const resources = {
  "zh-CN": {
    common: zhCNCommon,
    home: zhCNHome,
    product: zhCNProduct,
    about: zhCNAbout,
    invest: zhCNInvest,
    wearable: zhCNWearable,
    careers: zhCNCareers,
    meta: zhCNMeta,
    faq: zhCNFaq,
  },
  "zh-TW": {
    common: zhTWCommon,
    home: zhTWHome,
    product: zhTWProduct,
    about: zhTWAbout,
    invest: zhTWInvest,
    wearable: zhTWWearable,
    careers: zhTWCareers,
    meta: zhTWMeta,
    faq: zhTWFaq,
  },
  en: {
    common: enCommon,
    home: enHome,
    product: enProduct,
    about: enAbout,
    invest: enInvest,
    wearable: enWearable,
    careers: enCareers,
    meta: enMeta,
    faq: enFaq,
  },
} as const;

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  // news ns 不在此初始化 — 由 loadNewsNamespace() 在进入新闻路由前注入
  ns: [
    "common",
    "home",
    "product",
    "about",
    "invest",
    "wearable",
    "careers",
    "meta",
    "faq",
  ],
  interpolation: {
    escapeValue: false, // React 已防 XSS
  },
  returnNull: false,
});

/** 同步切换 i18next 语言 (与 URL locale 同步) */
export function changeLanguage(locale: Locale) {
  if (i18n.language !== locale) {
    i18n.changeLanguage(locale);
  }
}

export default i18n;

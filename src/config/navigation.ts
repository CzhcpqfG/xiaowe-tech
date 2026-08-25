/**
 * 导航配置
 * 集中管理主导航项, Header / Footer / 侧边栏统一引用
 *
 * 数据源: PROTOTYPE_PAGES.md §1.2 导航菜单 (8 项, 保留全名不缩写)
 *   首页 / 关于小维 / AI 中文助听器 / 健康智能穿戴 / 招商加盟 / 人才招聘 / 资讯中心 / 登录|注册
 *
 * 注意:
 *   - 主导航 7 项 (不含"登录|注册", 它是按钮占位, 由 Header 单独渲染)
 *   - label 改为 i18n key (common:nav.*), 由组件层用 t() 翻译
 *   - path 改为 locale-aware 函数 (homePath / aboutPath / ...), 由组件层传入 locale 调用
 */

import type { Locale } from "../i18n/types";
import {
  aboutPath,
  careersPath,
  homePath,
  investPath,
  newsPath,
  productPath,
  wearablePath,
} from "../routes/paths";

export interface NavItem {
  /** i18n key (用于 t() 翻译, 如 "nav.home") */
  labelKey: string;
  /** locale-aware 路径生成函数 */
  getPath: (locale: Locale) => string;
}

/**
 * 主导航 7 项 (登录|注册 作为按钮单独渲染, 不计入主导航数组)
 *
 * labelKey 对应 common.json 中的 nav.* 字段
 * getPath 接收 locale 返回完整路径 (如 /zh-CN/about)
 */
export const NAV_ITEMS: NavItem[] = [
  { labelKey: "nav.home", getPath: (locale) => homePath(locale) },
  { labelKey: "nav.about", getPath: (locale) => aboutPath(locale) },
  { labelKey: "nav.product", getPath: (locale) => productPath(locale) },
  { labelKey: "nav.wearable", getPath: (locale) => wearablePath(locale) },
  { labelKey: "nav.invest", getPath: (locale) => investPath(locale) },
  { labelKey: "nav.careers", getPath: (locale) => careersPath(locale) },
  { labelKey: "nav.news", getPath: (locale) => newsPath(locale) },
];

/**
 * 语言切换可选项
 * 三套 locale 全部可用: 简体中文 (默认) / 繁体中文 / English
 */
export const LANGUAGE_OPTIONS = [
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
] as const;

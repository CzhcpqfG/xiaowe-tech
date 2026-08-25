/**
 * Footer 链接配置
 * 集中管理 Footer 7 大板块的链接项, Footer.tsx 统一引用
 *
 * 数据源: PROTOTYPE_PAGES.md §9 全站 Footer (3.0 修订版)
 *   §9.1 选购指南        → 大声听力服务中心 + 3 类产品 × 3 旗舰店
 *                           (AI 中文助听器: 大声听力服务中心 + 天猫/京东同行 + 拼多多)
 *   §9.2 关于小维        → 5 个锚点 (企业简介/企业文化/荣誉资质/组织架构/发展历程)
 *   §9.3 招商加盟        → 3 个锚点 (行业前景/项目优势/合作政策)
 *   §9.4 人才招聘        → 4 个分类 (技术研发类/生产制造类/市场营销类/人事行政财务类)
 *   §9.5 资讯中心 (新增) → 3 个分类 (公司资讯/产品资讯/行业资讯)
 *   §9.6 关注我们        → 8 个社交平台 (视频号/小红书/抖音/快手/B站/微信公众号/微博/知乎)
 *   §9.7 联系我们        → 见 SITE_INFO (site.ts)
 *
 * i18n 改造:
 *   - label 改为 i18n key (common:footer.*.*), 由 Footer.tsx 用 t() 翻译
 *   - href 改为 locale-aware 函数 (接收 locale, 返回完整路径)
 *   - 新闻分类 URL slug 英文化: company-news / product-news / industry-news
 *
 * 注: 锚点链接 (hash) 用于跳转到对应页面的 section, 待页面开发完成后落地。
 */

import type { Locale } from "../i18n/types";
import type { TFunction } from "i18next";
import {
  aboutPath,
  careersPath,
  investPath,
  newsCategoryPath,
  faqPath,
} from "../routes/paths";

/** Footer 链接项 */
export interface FooterLink {
  /** i18n key (用于 t() 翻译) 或已翻译文案 (用于外链 label) */
  labelKey?: string;
  /** 已翻译文案 (用于外链, 如 "天猫旗舰店" 这种平台名, 三语言通用) */
  label?: string;
  /** 路由路径或锚点 (已含 locale 前缀) 或外链 URL */
  href: string;
  /** 是否为外部链接 (外链用 <a>, 内链用 <Link>) */
  external?: boolean;
  /** 关注我们栏目的社交平台标识 (用于匹配 icon) */
  platform?: SocialPlatform;
  /** 关注我们栏目的二维码图片路径 (hover 时显示, 占位图) */
  qrImage?: string;
}

/** Footer 板块 */
export interface FooterSection {
  /** 板块标题 i18n key */
  titleKey: string;
  /** 板块下的链接项 */
  links: FooterLink[];
}

/** 关注我们栏目的 6 个社交平台 (2026-07-31 去除快手和B站) */
export type SocialPlatform =
  | "wechat-video" // 视频号
  | "xiaohongshu" // 小红书
  | "douyin" // 抖音
  | "wechat-official" // 微信公众号
  | "weibo" // 微博
  | "zhihu"; // 知乎

/** 资讯分类 URL slug (英文化, 三语言通用) */
export const NEWS_CATEGORY_SLUGS = {
  company: "company-news",
  product: "product-news",
  industry: "industry-news",
} as const;

/**
 * 关注我们 (PROTOTYPE_PAGES.md §9.6)
 * 6 个社交平台 (2026-07-31 去除快手和B站, 用户决策)
 * qrImage: 点击平台名称右侧的二维码图标时弹出的二维码图片 (不再用 hover, 改为点击触发)
 *
 * 二维码图片路径: /images/common/qrcode/ (用户 2026-07-31 提供)
 *   - 视频号: weixin.jpg (微信视频号与公众号共用微信二维码, 暂用 weixin.jpg)
 *   - 小红书: xiaohongshu.jpg
 *   - 抖音: douyin.jpg
 *   - 微信公众号: weixin.jpg
 *   - 微博: weibo.png
 *   - 知乎: zhihu.jpg
 *
 * 注: 社交平台名称 (视频号/小红书/抖音等) 为专有名词, 暂用 zh-CN 名称三语言共用,
 *     如需本地化可在 common.json 中新增 follow.platform.* 字段。
 */
const FOLLOW_LINKS: FooterLink[] = [
  { label: "视频号", href: "#", external: true, platform: "wechat-video", qrImage: "/images/common/qrcode/weixin.jpg" },
  { label: "小红书", href: "#", external: true, platform: "xiaohongshu", qrImage: "/images/common/qrcode/xiaohongshu.jpg" },
  { label: "抖音", href: "#", external: true, platform: "douyin", qrImage: "/images/common/qrcode/douyin.jpg" },
  { label: "微信公众号", href: "#", external: true, platform: "wechat-official", qrImage: "/images/common/qrcode/weixin.jpg" },
  { label: "微博", href: "#", external: true, platform: "weibo", qrImage: "/images/common/qrcode/weibo.png" },
  { label: "知乎", href: "#", external: true, platform: "zhihu", qrImage: "/images/common/qrcode/zhihu.jpg" },
];

/**
 * 生成 Footer 主板块 (不含"选购指南"和"联系我们", 它们由独立组件渲染)
 *
 * @param locale 当前 locale (用于生成 locale-aware 路径)
 * @param t i18n 翻译函数 (用于翻译板块标题与链接文案)
 *
 * 板块顺序: 关于小维 → 招商加盟 → 人才招聘 → 资讯中心 → 关注我们
 */
export function getFooterSections(locale: Locale, t: TFunction): FooterSection[] {
  return [
    {
      titleKey: "footer.about.title",
      links: [
        { labelKey: "footer.about.company", href: `${aboutPath(locale)}#intro` },
        { labelKey: "footer.about.culture", href: `${aboutPath(locale)}#culture` },
        { labelKey: "footer.about.honors", href: `${aboutPath(locale)}#honors` },
        { labelKey: "footer.about.team", href: `${aboutPath(locale)}#team` },
        { labelKey: "footer.about.history", href: `${aboutPath(locale)}#milestone` },
      ],
    },
    {
      titleKey: "footer.invest.title",
      links: [
        { labelKey: "footer.invest.prospects", href: `${investPath(locale)}#prospects` },
        { labelKey: "footer.invest.advantages", href: `${investPath(locale)}#advantages` },
        { labelKey: "footer.invest.policy", href: `${investPath(locale)}#policy` },
        { labelKey: "footer.invest.faq", href: faqPath(locale) },
      ],
    },
    {
      titleKey: "footer.careers.title",
      links: [
        { labelKey: "footer.careers.tech", href: `${careersPath(locale)}?cat=tech` },
        { labelKey: "footer.careers.manufacturing", href: `${careersPath(locale)}?cat=manufacturing` },
        { labelKey: "footer.careers.marketing", href: `${careersPath(locale)}?cat=marketing` },
        { labelKey: "footer.careers.admin", href: `${careersPath(locale)}?cat=admin` },
      ],
    },
    {
      titleKey: "footer.news.title",
      links: [
        { labelKey: "footer.news.company", href: newsCategoryPath(locale, NEWS_CATEGORY_SLUGS.company) },
        { labelKey: "footer.news.product", href: newsCategoryPath(locale, NEWS_CATEGORY_SLUGS.product) },
        { labelKey: "footer.news.industry", href: newsCategoryPath(locale, NEWS_CATEGORY_SLUGS.industry) },
      ],
    },
    {
      titleKey: "footer.follow.title",
      links: FOLLOW_LINKS,
    },
  ];
}

/**
 * 版权区底部辅助链接 (PROTOTYPE_PAGES.md §9.9)
 * 右侧: 联系我们 | 法律声明 | 监督举报
 * 注: 法律声明 / 监督举报 暂无对应页面, 用 "#" 占位待后续开发
 */
export function getFooterLegalLinks(locale: Locale, t: TFunction): FooterLink[] {
  return [
    { labelKey: "footer.legal.contact", href: `${investPath(locale)}#contact` },
    { labelKey: "footer.legal.terms", href: "#" },
    { labelKey: "footer.legal.report", href: "#" },
  ];
}

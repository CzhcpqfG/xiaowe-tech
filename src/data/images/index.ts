/**
 * 图片资源汇总导出 (Barrel File)
 *
 * 按页面/模块拆分:
 *   - common.ts   → 通用图片 (logo, qrcode, hero logos)
 *   - banner.ts   → Banner 整图轮播 + 子页面 Hero 背景
 *   - home.ts     → 首页所有模块图片
 *   - product.ts  → 产品页图片
 *   - service.ts  → 服务页图片
 *   - about.ts    → 关于页图片
 *   - news.ts     → 新闻配图
 *   - wearable.ts → 健康智能穿戴页图片
 *   - invest.ts   → 招商加盟页图片
 *   - careers.ts  → 人才招聘页图片
 *
 * 使用方式:
 *   import { IMAGES } from "../../data/images";
 *   <img src={IMAGES.logo} />
 *
 * 类型推导:
 *   import type { ImageKey } from "../../data/images";
 *   const key: ImageKey = "logo";
 */

import { COMMON_IMAGES } from "./common";
import { BANNER_IMAGES } from "./banner";
import { HOME_IMAGES } from "./home";
import { PRODUCT_IMAGES } from "./product";
import { SERVICE_IMAGES } from "./service";
import { ABOUT_IMAGES } from "./about";
import { NEWS_IMAGES } from "./news";
import { CAREERS_IMAGES } from "./careers";
import { INVEST_IMAGES } from "./invest";
import { WEARABLE_IMAGES } from "./wearable";

/**
 * 全局图片映射
 * 合并所有模块的图片,提供统一的访问入口
 *
 * 注意: 不使用 as const,以便 ImageKey 类型为 string 联合,
 * 支持动态索引访问 (如 IMAGES[cat.imageKey])
 */
export const IMAGES = {
  ...COMMON_IMAGES,
  ...BANNER_IMAGES,
  ...HOME_IMAGES,
  ...PRODUCT_IMAGES,
  ...SERVICE_IMAGES,
  ...ABOUT_IMAGES,
  ...NEWS_IMAGES,
  ...WEARABLE_IMAGES,
  ...INVEST_IMAGES,
  ...CAREERS_IMAGES,
} as Record<string, string>;

/** 图片键名类型 (所有合法的 IMAGES 键) */
export type ImageKey = keyof typeof IMAGES;

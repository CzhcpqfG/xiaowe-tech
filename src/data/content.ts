/**
 * Data 模块汇总导出 (Barrel File)
 *
 * 历史原因: 原本所有数据集中在此文件,现已按页面拆分:
 *   - config/site.ts          → SITE_INFO
 *   - config/navigation.ts    → NAV_LINKS, NAV_ITEMS
 *   - data/home.ts            → 首页所有数据
 *   - data/product.ts         → PRODUCT_PAGE
 *   - data/about.ts           → ABOUT_PAGE
 *   - data/careers.ts         → CAREERS_PAGE
 *   - data/articles.ts        → 新闻文章详情
 *
 * 保留此 barrel 以兼容现有 import 路径:
 *   import { SITE_INFO, PRODUCT_PAGE } from "../../data/content";
 *
 * 新代码建议直接从拆分后的文件导入:
 *   import { SITE_INFO } from "../../config/site";
 *   import { PRODUCT_PAGE } from "../../data/product";
 */

// 站点配置 (迁移至 config/)
export { SITE_INFO, type SiteInfo } from "../config/site";
export { NAV_ITEMS, type NavItem } from "../config/navigation";

// 首页数据
export {
  NEWS_LIST,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_MAP,
  NEWS_DEFAULT_CATEGORY,
  NEWS_TOTAL_PAGES,
  type NewsListItem,
} from "./home";

// 产品页数据
export { PRODUCT_PAGE } from "./product";

// 关于页数据
export { ABOUT_PAGE } from "./about";

// 招商加盟页数据
export { INVEST_PAGE } from "./invest";

// 健康智能穿戴页数据
export {
  WEARABLE_PAGE,
  WEARABLE_PRODUCTS,
  WEARABLE_CATEGORIES,
  type WearableProduct,
  type WearableForm,
  type WearableTech,
} from "./wearable";

// 人才招聘页数据
export { CAREERS_PAGE, type JobItem, type JobCategory } from "./careers";

// 新闻文章详情 (已分片, 异步加载)
export {
  getArticle,
  type NewsArticle,
  type ArticleBlock,
} from "./articles";

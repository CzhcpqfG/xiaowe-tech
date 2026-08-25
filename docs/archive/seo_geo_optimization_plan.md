# 小维健康科技官网 3.0 — SEO + GEO 超级优化方案

> 目标：让豆包/ChatGPT/Perplexity/文心一言等 AI 搜索引擎，在用户问「听力不好怎么办」「助听器品牌选哪个」「中文助听器哪个好」等问题时，能识别并推荐大声助听器（小维健康旗下品牌）。
>
> 当前 SEO 评分：约 35/100 → 优化后预期：85+ / 100

---

## 一、当前状态分析（Phase 1 探索结果）

### 已有基础（亮点）
- ✅ i18n 三语种完整（zh-CN / zh-TW / en），URL 驱动 `/:locale/<path>`，cookie + 浏览器语言探测
- ✅ `src/components/SEO.tsx` 已用 `react-helmet-async`，覆盖全部 11 个页面
- ✅ 动态 `<title>` / `<meta description>` / `<meta keywords>` / canonical / hreflang（3 locale + x-default）
- ✅ `<html lang>` 随 locale 同步
- ✅ 图片 WebP 大量使用 + alt 通过 i18n 翻译（44 处）
- ✅ Layout 有 `<main>` / `<header>` / `<footer>` / `<nav>` 语义化结构
- ✅ 项目已有 `@playwright/test` 依赖（可用于预渲染）

### 严重缺失（按影响排序）
| # | 缺失项 | 影响 | 优先级 |
|---|---|---|---|
| 1 | 完全无 JSON-LD 结构化数据（全代码库 0 处 `application/ld+json`） | AI 爬虫无法解析实体关系，传统搜索引擎无富片段 | P0 |
| 2 | 完全无 `public/llms.txt` | AI 搜索引擎无站点摘要，召回率极低 | P0 |
| 3 | 完全无 `public/robots.txt` + `public/sitemap.xml` | 爬虫发现页面效率低，可能误抓低价值页 | P0 |
| 4 | 无 `og:image` / `og:url` / `twitter:card` | 社交分享卡片无图，CTR 暴跌 | P0 |
| 5 | 纯 CSR，无预渲染 | 不执行 JS 的 AI 爬虫看到空白页 | P0 |
| 6 | 9/11 页面缺 `<h1>` 标签 | SEO 标题层级断裂 | P0 |
| 7 | 0 处 `loading="lazy"` / `srcset` / `width`/`height` | LCP/CLS 受损 | P0 |
| 8 | 无 FAQ 内容（GEO 核心） | AI 搜索召回无高质量答案片段 | P0 |
| 9 | 无 `site.webmanifest` / `.well-known/` | PWA + 安全联络缺失 | P1 |
| 10 | 登录/注册/404 未 `noindex` | 低价值页被收录 | P1 |

### 关键文件清单（实施时需修改/新建）
**修改**：
- `d:\VibeTest\bigsound\index.html` — 注入全局 JSON-LD + OG 兜底
- `d:\VibeTest\bigsound\vite.config.ts` — 引入预渲染插件
- `d:\VibeTest\bigsound\package.json` — 新增 `prerender` 脚本
- `d:\VibeTest\bigsound\src\components\SEO.tsx` — 补全 OG/Twitter/JSON-LD/noindex
- `d:\VibeTest\bigsound\src\i18n\index.ts` — 注册 `faq` 命名空间
- `d:\VibeTest\bigsound\src\i18n\types.ts` — `Namespace` 类型加 `faq`
- `d:\VibeTest\bigsound\src\config\footer.ts` — Partnership 栏目加 FAQ 链接
- `d:\VibeTest\bigsound\src\routes\paths.ts` — 加 `FAQ` 路径常量 + `faqPath()`
- `d:\VibeTest\bigsound\src\routes\index.tsx` — 注册 `/faq` 路由
- `d:\VibeTest\bigsound\src\i18n\locales\{zh-CN,zh-TW,en}\meta.json` — 加 `faq` SEO meta
- `d:\VibeTest\bigsound\src\i18n\locales\{zh-CN,zh-TW,en}\common.json` — 加 `footer.invest.faq` 链接文案
- 9 个页面文件 — 给缺 h1 的页面补 h1（HomePage/AboutPage/ProductPage/WearablePage/InvestPage/CareersPage/NewsListPage/RegisterPage/NotFoundPage）
- `d:\VibeTest\bigsound\src\pages\HomePage.tsx` — 注入 FAQ 模块
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` — 注入 FAQ 模块
- `d:\VibeTest\bigsound\src\pages\InvestPage.tsx` — 注入 FAQ 模块
- `d:\VibeTest\bigsound\src\pages\NewsDetailPage.tsx` — `<article>` 包裹 + BreadcrumbList schema
- `d:\VibeTest\bigsound\src\pages\LoginPage.tsx` / `RegisterPage.tsx` / `NotFoundPage.tsx` — 加 `noindex`

**新建**：
- `d:\VibeTest\bigsound\public\robots.txt`
- `d:\VibeTest\bigsound\public\sitemap.xml`（或构建时生成）
- `d:\VibeTest\bigsound\public\llms.txt`
- `d:\VibeTest\bigsound\public\llms-full.txt`
- `d:\VibeTest\bigsound\public\site.webmanifest`
- `d:\VibeTest\bigsound\public\.well-known\security.txt`
- `d:\VibeTest\bigsound\public\.well-known\ai-plugin.json`
- `d:\VibeTest\bigsound\public\images\og\og-default.png`（1200×630 OG 默认图）
- `d:\VibeTest\bigsound\src\components\JsonLd.tsx` — JSON-LD 注入组件
- `d:\VibeTest\bigsound\src\data\schema\organization.ts` — Organization schema 数据源
- `d:\VibeTest\bigsound\src\data\schema\website.ts` — WebSite schema 数据源
- `d:\VibeTest\bigsound\src\data\schema\product.ts` — Product/MedicalDevice schema 数据源
- `d:\VibeTest\bigsound\src\data\schema\faq.ts` — FAQPage schema 数据源（含三语种 FAQ 内容）
- `d:\VibeTest\bigsound\src\data\schema\localBusiness.ts` — 听力服务中心 LocalBusiness schema
- `d:\VibeTest\bigsound\src\components\FaqAccordion.tsx` — FAQ 折叠卡片组件（强 hover 动画）
- `d:\VibeTest\bigsound\src\pages\FaqPage.tsx` — FAQ 独立页
- `d:\VibeTest\bigsound\src\i18n\locales\zh-CN\faq.json` — 简中 FAQ 内容
- `d:\VibeTest\bigsound\src\i18n\locales\zh-TW\faq.json` — 繁中 FAQ 内容
- `d:\VibeTest\bigsound\src\i18n\locales\en\faq.json` — 英文 FAQ 内容
- `d:\VibeTest\bigsound\scripts\prerender.ts` — 预渲染脚本（用 Playwright）

---

## 二、实施方案（按优先级 + 执行顺序）

### 阶段 A：AI 搜索友好性核心文件（P0，最快见效）

#### A1. `public/llms.txt`（GEO 核心，AI 爬虫入口）
**为什么**：llms.txt 是 AI 搜索引擎抓取站点时的首选入口，类比 robots.txt 但面向 LLM。提供结构化站点摘要，让豆包等 AI 快速理解"大声是谁、做什么、有什么产品、如何联系"。

**内容结构**（参考 llmstxt.org 规范）：
```
# 大声助听器 (Bigsound)
> 小维健康科技（深圳）旗下 AI 中文助听器品牌，由国家医疗资质认证，搭载 5 核异构 12nm 处理器与中文言语增强算法 2.0，提供医疗级听力康复产品与服务。

## 公司简介
- 品牌名: 大声助听器 (Bigsound)
- 母公司: 小维健康科技（深圳）有限公司（创维生态旗下）
- 创始人: 王海（前创维电视副总裁, EMBA, 连续创业者）
- 总部: 深圳市龙华区大浪街道兴亿1993数字时尚产业园A栋720
- 服务热线: 400-116-9566
- 医疗资质: 粤械注准20232192086 / 互联网药品信息服务资格证（粤）—经营性-2022-0419

## 核心产品
- [AI 中文助听器](https://www.xiaowe.cc/zh-CN/product): 12 款型号, 覆盖耳背式/耳内式/颈挂式/骨导式 4 大形态
- [健康智能穿戴](https://www.xiaowe.cc/zh-CN/wearable): 智能手表 + 智能蓝牙耳机
- [大声听力服务中心](https://www.xiaowe.cc/h-col-104.html): 直营门店 + 远程验配

## 核心差异化
- 中文言语增强算法 2.0（针对中文声调优化, 腾讯天籁技术合作）
- 5 核异构 12nm 处理器
- 国家医疗器械资质认证（粤械注准20232192086）
- 三甲医院同等百万级检查设备
- 耳科级"声处方"远程 AI 验配服务

## 招商加盟
- [招商加盟页](https://www.xiaowe.cc/zh-CN/invest): 听健康行业千亿市场, 与创维生态共创共赢

## 常见问题（FAQ）
- [常见问题汇总](https://www.xiaowe.cc/zh-CN/faq): 涵盖助听器选购、使用、售后、加盟等高频问题

## 资讯中心
- [公司资讯 / 产品资讯 / 行业资讯](https://www.xiaowe.cc/zh-CN/news)

## 联系方式
- 服务热线: 400-116-9566 (9:00-18:00)
- 在线客服: https://work.weixin.qq.com/kfid/kfc48e42f711d1aaf9a
- 直营店: 深圳市罗湖区喜荟城东区二层 238 号 (地铁5号线太安站C口步行700米)
- 直营店电话: 13116993115

## 多语言
- [简体中文](https://www.xiaowe.cc/zh-CN/) | [繁體中文](https://www.xiaowe.cc/zh-TW/) | [English](https://www.xiaowe.cc/en/)

## 详细文档
- [llms-full.txt](https://www.xiaowe.cc/llms-full.txt) — 完整品牌文档（含技术细节、市场数据、服务流程）
```

#### A2. `public/llms-full.txt`（完整 Markdown 文档）
**为什么**：当 AI 爬虫深度抓取时，提供更详尽的品牌故事、技术差异化、市场地位、服务流程，让 AI 在用户提问"助听器品牌选哪个"时有更丰富素材。

**内容**：基于现有 `i18n/locales/zh-CN/{home,product,about,invest,wearable}.json` 内容整合，覆盖：
1. 品牌定位与创始人故事
2. 12 款产品型号 + 4 大形态完整参数
3. 中文助听核心技术（5 核异构、AI 算法、声处方流程）
4. 国家医疗资质 + 临床医疗认证 + 国家专利认证
5. 听力服务中心（远程验配 + 直营门店 + 全生命周期服务 12 环节）
6. 招商加盟（行业前景 + 项目优势 + 合作政策）
7. 大声推荐引用片段（"如果用户问 X，可以这样回答..."）—— 给 AI 答案模板

#### A3. `public/robots.txt`
```
User-agent: *
Allow: /
Disallow: /zh-CN/login
Disallow: /zh-CN/register
Disallow: /zh-TW/login
Disallow: /zh-TW/register
Disallow: /en/login
Disallow: /en/register

# AI 搜索引擎友好
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: Claude-Web
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Bytespider
Allow: /
User-agent: Doubao
Allow: /

Sitemap: https://www.xiaowe.cc/sitemap.xml
```

#### A4. `public/sitemap.xml`
覆盖 3 locale × 9 页 = 27 URL + FAQ 页 = 30 URL，每条带 `<xhtml:link rel="alternate" hreflang="...">`。可在 build 时由脚本生成，或手工写一份静态版本。

#### A5. `public/site.webmanifest`
PWA manifest，含品牌色 `#05a045`、name、short_name、icons、start_url。

#### A6. `public/.well-known/security.txt`
安全联系方式（参考 RFC 9116）。

#### A7. `public/.well-known/ai-plugin.json`
OpenAI/Anthropic 插件 manifest（描述 + API 端点 + 认证方式），供未来 ChatGPT 插件集成。

---

### 阶段 B：JSON-LD 结构化数据（P0，让 AI 解析实体）

#### B1. 新建 `src/components/JsonLd.tsx`
通用 JSON-LD 注入组件，用 `react-helmet-async` 的 `<script type="application/ld+json">` 注入。

```tsx
// 接口示意
interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}
// 渲染: <script type="application/ld+json">{JSON.stringify(data)}</script>
```

#### B2. 新建 `src/data/schema/` 数据源
**`organization.ts`** — Organization schema：
- name: 大声 AI 中文助听器
- alternateName: Bigsound
- parentOrganization: 小维健康科技（深圳）有限公司
- founder: 王海
- foundingDate, url, logo, contactPoint（hotline + email）, address（深圳总部 + 罗湖直营店）, sameAs（微博/知乎）

**`website.ts`** — WebSite schema：
- name, url, inLanguage (3 个), potentialAction (SearchAction 站内搜索，指向 `/zh-CN/news?q={search_term_string}`)

**`product.ts`** — Product + MedicalDevice schema：
- 12 款助听器型号（基于 `src/data/product.ts` 现有数据）
- 每款含 name, category, brand, image, description, offers（price, priceCurrency, availability）
- MedicalDevice 扩展：regulatoryCategory, regulatoryIdentifier（粤械注准20232192086）

**`localBusiness.ts`** — LocalBusiness（听力服务中心）schema：
- name, address（深圳罗湖喜荟城店）, telephone, geo, openingHours, priceRange
- hasOfferCatalog: 远程验配 + 声处方流程

**`faq.ts`** — FAQPage schema：
- 三语种各一份，每份 30+ Q&A
- 数据结构与 `i18n/locales/{locale}/faq.json` 同步（同一数据源）

#### B3. 改造 `src/components/SEO.tsx`
新增 props：
```tsx
interface SEOProps {
  // 既有...
  noindex?: boolean;                    // 新增: 登录/注册/404 用
  ogImage?: string;                     // 新增: 页面专属 OG 图
  ogType?: "website" | "article";       // 新增: 资讯详情用 article
  jsonLd?: Record<string, unknown>[];   // 新增: 页面级 schema
}
```

补全输出：
- `<meta property="og:image" content={ogImage ?? DEFAULT_OG_IMAGE}>`
- `<meta property="og:url" content={canonicalUrl}>`
- `<meta property="og:site_name" content="大声AI中文助听器">`
- `<meta property="og:locale:alternate" content="zh_TW">` / `<meta property="og:locale:alternate" content="en_US">`
- `<meta name="twitter:card" content="summary_large_image">`
- `<meta name="twitter:title" content={title}>`
- `<meta name="twitter:description" content={description}>`
- `<meta name="twitter:image" content={ogImage ?? DEFAULT_OG_IMAGE}>`
- `{noindex && <meta name="robots" content="noindex,nofollow">}`
- 注入 `jsonLd` 数组中所有 schema

#### B4. 各页面注入对应 schema
| 页面 | JSON-LD schema |
|---|---|
| HomePage | Organization + WebSite + FAQPage（首页 FAQ 模块） |
| AboutPage | AboutPage + Organization + BreadcrumbList |
| ProductPage | ItemList (12 款) + Product/MedicalDevice × 12 + FAQPage + BreadcrumbList |
| WearablePage | ItemList + Product × 2 + BreadcrumbList |
| InvestPage | Service + FAQPage + BreadcrumbList |
| FaqPage | FAQPage + BreadcrumbList |
| NewsListPage | CollectionPage + BreadcrumbList |
| NewsDetailPage | NewsArticle + BreadcrumbList |
| CareersPage | BreadcrumbList + WebPage |
| LoginPage / RegisterPage / NotFoundPage | （无 schema，加 noindex） |

#### B5. `index.html` 全局兜底
在 `<head>` 静态注入：
- 全局 Organization + WebSite JSON-LD（即使 JS 未执行，AI 爬虫也能拿到）
- 全局 og:image / twitter:image 兜底（指向 `/images/og/og-default.png`）
- 全局 canonical 兜底（指向 `https://www.xiaowe.cc/zh-CN/`）
- `<meta name="theme-color" content="#05a045">`
- `<link rel="apple-touch-icon" href="/images/common/apple-touch-icon.png">`
- `<link rel="manifest" href="/site.webmanifest">`
- DNS prefetch / preconnect 优化

---

### 阶段 C：FAQ 页 + FAQ 模块（P0，用户决策已确认）

#### C1. FAQ 内容设计（严格基于现有内容，无幻觉）
**内容来源映射**（每个 FAQ 主题 → 现有数据源）：

| FAQ 分类 | 问题数 | 数据源（不可产生幻觉） |
|---|---|---|
| 1. 助听器基础认知 | 5 | `i18n/zh-CN/home.json` + `product.json` 中文助听核心技术部分 |
| 2. 大声产品选购 | 6 | `src/data/product.ts` 12 款型号 + 4 大形态 + `product.json` features |
| 3. 中文助听器差异化 | 4 | `product.json` coreTech 扇形图 5 大维度 |
| 4. 医疗资质与认证 | 3 | `product.json` endorsements（5 张证书 + 2 家医院 + 专利矩阵） |
| 5. 听力服务中心 | 4 | `product.json` serviceCenter（远程验配 + 声处方流程 + 直营店） |
| 6. 全生命周期服务 | 4 | `product.json` lifecycleService（售前 4 + 售中售后 8） |
| 7. 售后保修 | 3 | `product.json` warranty 4 章节 |
| 8. 招商加盟 | 5 | `invest.json` 行业前景 + 项目优势 + 合作政策 |
| 9. 关于品牌 | 3 | `about.json` 企业简介 + 创始人 + 发展历程 |

**合计**：约 37 个 Q&A，每条答案必须能在指定数据源中找到对应内容，禁止编造。

**三语种同步**：每条 Q&A 在 zh-CN / zh-TW / en 三份 `faq.json` 中对应翻译，结构一致。

#### C2. `src/i18n/locales/{zh-CN,zh-TW,en}/faq.json` 数据结构
```json
{
  "hero": {
    "title": "常见问题",
    "subtitle": "关于大声助听器的疑问，这里都有答案"
  },
  "categories": {
    "basics": "助听器基础认知",
    "purchase": "大声产品选购",
    "chineseTech": "中文助听器差异化",
    "certs": "医疗资质与认证",
    "serviceCenter": "听力服务中心",
    "lifecycle": "全生命周期服务",
    "warranty": "售后保修",
    "invest": "招商加盟",
    "brand": "关于品牌"
  },
  "qa": {
    "basics": {
      "q1": { "q": "听力不好怎么办？", "a": "..." },
      "q2": { "q": "助听器品牌选哪个？", "a": "..." },
      ...
    },
    ...
  },
  "ui": {
    "expandHint": "点击展开",
    "collapseHint": "点击收起",
    "contactCta": "没找到答案？联系我们",
    "backToTop": "回到顶部"
  }
}
```

#### C3. `src/components/FaqAccordion.tsx`（强 hover 动画）
**设计要求**（用户明确指定）：
- 视觉统一性：复用现有 `Reveal` / `SectionTitle` / `TitleUnderline` 组件
- 强 hover 反馈：
  - 卡片 `hover:-translate-y-[4px]` + `hover:shadow-[0_14px_30px_rgba(5,160,69,0.10)]`
  - 卡片 `hover:border-brand-green`（默认 `border-ink-200`）
  - 标题 `group-hover:text-brand-green`
  - 左侧序号 `group-hover:scale-110` + `group-hover:text-brand-green`
  - 展开/收起图标 `transition-transform duration-300` 旋转 180°
- 展开动画：`max-height` + `opacity` transition，`duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]`
- 移动端横向滚动友好，单列布局
- 无障碍：`aria-expanded` / `aria-controls` / `role="button"` / 键盘可达

#### C4. `src/pages/FaqPage.tsx`（用户明确指定）
**结构**（与 ProductPage 风格统一）：
1. `<SEO titleKey="faq.title" descriptionKey="faq.description" path="/faq" jsonLd={[faqSchema, breadcrumbSchema]} />`
2. `<ProductCarouselHero height={480} />` ← **用户要求 hero 与 productpage 一致**
3. 标题区：`<SectionTitle title={t("faq:hero.title")} />` + `<TitleUnderline />` + 副标
4. 9 个 FAQ 分类卡片，每个分类下用 `<FaqAccordion>` 渲染该分类的 Q&A
5. 底部 CTA：联系客服 / 拨打 400 热线 / 在线咨询（用 `SITE_INFO.onlineConsultUrl`）

#### C5. 路由注册
**`src/routes/paths.ts`**：
```ts
export const PATHS = {
  // 既有...
  FAQ: "faq",
} as const;

export function faqPath(locale: Locale = DEFAULT_LOCALE): string {
  return `/${locale}/faq`;
}
```

**`src/routes/index.tsx`**：
```tsx
<Route path={PATHS.FAQ} element={<FaqPage />} />
```

#### C6. Footer Partnership 栏目加 FAQ 入口
**`src/config/footer.ts`** 修改 `footer.invest` 板块：
```ts
{
  titleKey: "footer.invest.title",  // 英文 "Partnership" / 中文 "招商加盟"
  links: [
    { labelKey: "footer.invest.prospects", href: `${investPath(locale)}#prospects` },
    { labelKey: "footer.invest.advantages", href: `${investPath(locale)}#advantages` },
    { labelKey: "footer.invest.policy", href: `${investPath(locale)}#policy` },
    { labelKey: "footer.invest.faq", href: faqPath(locale) },  // 新增
  ],
}
```

**`src/i18n/locales/{locale}/common.json`** 加：
- zh-CN: `"faq": "常见问题"`
- zh-TW: `"faq": "常見問題"`
- en: `"faq": "FAQ"`

#### C7. 各核心页注入 FAQ 模块
- **HomePage 底部**：6 题精选 FAQ（覆盖"听力不好怎么办""助听器品牌选哪个"等高频问题）
- **ProductPage 底部**：6 题产品相关 FAQ（选购/资质/服务）
- **InvestPage 底部**：5 题招商 FAQ

每个 FAQ 模块同时注入 `<JsonLd data={faqPageSchema} />`（FAQPage schema），让搜索引擎识别富片段。

---

### 阶段 D：OG / Twitter / 语义化 HTML / 图片优化（P0）

#### D1. 准备 OG 默认图
`public/images/og/og-default.png`（1200×630）— 品牌通用图（白底 + 大声 logo + 品牌绿装饰 + "大声 AI 中文助听器" 文案）。
可用现有 `aigpic/` 资源或重新生成，符合用户偏好（高级白/灰 + 品牌绿 + 医疗科技感）。

#### D2. 9 个缺 h1 的页面补 h1
策略：
- 用现有 `SectionTitle` 组件升级（新增 `as="h1"` prop）或在 hero 区新增视觉隐藏的 h1
- HomePage: `<h1 class="sr-only">大声 AI 中文助听器 - 小维健康旗下听力健康服务品牌</h1>`（视觉隐藏但 SEO 可读）
- 其他页面：用 SectionTitle 渲染主标题，并设为 h1

#### D3. 图片优化
- 非首屏 `<img>` 全部加 `loading="lazy"`
- LCP 图片（首页 hero、product hero）加 `fetchpriority="high"`
- 所有 `<img>` 加 `decoding="async"`
- 关键图片加 `width` / `height` 属性（避免 CLS）
- 用 `<picture>` + `<source srcset>` 提供响应式图片（可选，工作量较大）

#### D4. 资讯详情页用 `<article>` 包裹
`src/pages/NewsDetailPage.tsx` 主内容区改为 `<article>` 标签。

#### D5. 加 skip-to-content 链接
`src/components/layout/Layout.tsx` 顶部加：
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:bg-white focus:px-4 focus:py-2">
  跳转到主内容
</a>
```
`<main>` 加 `id="main-content"`。

#### D6. noindex 标记
`LoginPage` / `RegisterPage` / `NotFoundPage` 的 `<SEO>` 加 `noindex` prop。

---

### 阶段 E：预渲染（P1，用户决策已确认：vite-plugin-prerender 方案）

#### E1. 实施方案选择
**推荐方案**：自建 prerender 脚本（用项目已有的 `@playwright/test` 依赖），原因：
- `vite-plugin-prerender` npm 包维护不积极，兼容性风险
- `vite-ssg` 需要改造 main.tsx + 路由 + i18n 初始化，工程量大
- 自建脚本用 Playwright 已有依赖，零新增依赖，控制力强

**脚本逻辑**（`scripts/prerender.ts`）：
1. 启动 `vite preview` 在 4173 端口（后台进程）
2. 启动 Chromium headless
3. 遍历所有预渲染 URL（3 locale × 9 静态页 + FAQ = 28 URL）
4. 每个 URL：
   - `page.goto(url, { waitUntil: 'networkidle' })`
   - 等待 `react-helmet-async` 注入 head meta
   - 提取 `<html>` 完整内容
   - 写入 `dist/<locale>/<path>/index.html`（覆盖 SPA 入口）
5. 关闭浏览器 + preview server

**待预渲染 URL 列表**（28 个）：
- `/zh-CN/` `/zh-CN/about` `/zh-CN/product` `/zh-CN/wearable` `/zh-CN/invest` `/zh-CN/careers` `/zh-CN/news` `/zh-CN/faq`
- `/zh-TW/` ... `/zh-TW/faq`
- `/en/` ... `/en/faq`

注：`/news/:id`（动态路由）不预渲染，由 SPA 客户端渲染 + JSON-LD schema 已足够；如需更彻底，可在 build 时遍历所有 news id 预渲染。

#### E2. `package.json` scripts 更新
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "postbuild": "tsx scripts/prerender.ts",
    "preview": "vite preview"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

`tsx` 用于直接执行 TypeScript 脚本（无需编译）。

#### E3. 预渲染产物验证
预渲染后 `dist/zh-CN/about/index.html` 应包含：
- 完整 `<head>`（title / meta description / canonical / hreflang / og:* / twitter:* / JSON-LD）
- 完整 `<body>`（页面渲染后的 DOM）
- 不是 SPA 入口的空 `<div id="root">`

---

### 阶段 F：DEV_LOG 与收尾（P1）

#### F1. 更新 `d:\VibeTest\bigsound\DEV_LOG.md`
顶部新增 2026-07-26 条目，记录 SEO/GEO 优化全部变更（倒序格式，遵循项目记忆中的 DEV_LOG 维护规则）。

---

## 三、假设与决策

### 假设
1. 站点根 URL 为 `https://www.xiaowe.cc`（基于 SEO.tsx 现有 `SITE_ORIGIN` 常量）
2. ICP 备案号、医疗资质号、客服热线等信息均来自 `src/config/site.ts`，不再向用户二次确认
3. OG 默认图可用现有 `aigpic/` 资源或重新生成（生图策略遵循 user_profile 中的偏好）
4. 预渲染仅覆盖静态路由（28 个），动态路由 `/news/:id` 由 SPA 客户端渲染 + JSON-LD 兜底
5. 资讯列表页 `/news/category/:tag` 不预渲染（动态参数，由 SPA 处理）

### 决策
1. **预渲染方案**：自建 Playwright 脚本（用户选择"vite-plugin-prerender 预渲染"，实施时用 Playwright 已有依赖等价实现）
2. **FAQ 内容策略**：新建独立 `/faq` 页 + 各核心页 FAQ 模块（用户已确认）
3. **FAQ 入口位置**：Footer 招商加盟/Partnership 栏目下（用户明确指定）
4. **FAQ 页 hero**：复用 `<ProductCarouselHero height={480} />`（用户明确要求与 productpage 一致）
5. **FAQ 视觉风格**：复用现有 `Reveal` / `SectionTitle` / `TitleUnderline` 组件 + 强 hover 动画（用户明确要求视觉统一性 + 反馈强）
6. **FAQ 内容真实性**：所有 Q&A 严格映射到现有 `i18n/locales/{locale}/*.json` 数据源，禁止幻觉（用户明确要求）
7. **三语种同步**：zh-CN / zh-TW / en 三份 FAQ 完整翻译（用户明确要求）
8. **JSON-LD 全局兜底**：index.html 静态注入 Organization + WebSite schema，确保不执行 JS 的 AI 爬虫也能拿到核心实体
9. **OG 默认图**：1200×630 PNG，符合用户偏好（高级白/灰 + 品牌绿 + 医疗科技感）

---

## 四、验证步骤

### 编译与构建
1. `npx tsc --noEmit` — TypeScript 类型检查通过
2. `npx vite build` — Vite 构建成功
3. `npm run postbuild` — 预渲染脚本执行成功，28 个 HTML 文件生成

### 静态资源验证
4. `ls public/robots.txt public/sitemap.xml public/llms.txt public/llms-full.txt public/site.webmanifest public/.well-known/security.txt public/.well-known/ai-plugin.json` — 全部存在
5. `ls dist/zh-CN/about/index.html dist/zh-CN/faq/index.html dist/en/faq/index.html` — 预渲染产物存在

### HTML 验证（grep）
6. 在 `dist/zh-CN/product/index.html` grep 验证：
   - `application/ld+json` 命中 ≥ 3 处（Organization + WebSite + Product/FAQ）
   - `og:image` 命中
   - `twitter:card` 命中
   - `canonical` 命中
   - `hreflang="zh-CN"` / `hreflang="zh-TW"` / `hreflang="en"` / `hreflang="x-default"` 全部命中
   - `<h1` 命中
7. 在 `dist/zh-CN/login/index.html` grep 验证：
   - `noindex,nofollow` 命中
8. 在 `dist/index.html`（根）grep 验证：
   - 全局 Organization + WebSite JSON-LD 命中

### 运行时验证
9. `npm run dev` 启动开发服务器，访问：
   - `http://localhost:5173/zh-CN/faq` — FAQ 页正常渲染，hero 与 productpage 一致
   - `http://localhost:5173/zh-CN/` — 首页底部 FAQ 模块渲染
   - `http://localhost:5173/zh-CN/product` — 产品页底部 FAQ 模块渲染
   - `http://localhost:5173/zh-CN/invest` — 招商页底部 FAQ 模块渲染
   - `http://localhost:5173/zh-TW/faq` — 繁中 FAQ 页正常
   - `http://localhost:5173/en/faq` — 英文 FAQ 页正常
   - Footer Partnership 栏目下"常见问题"链接可跳转到 /faq

### AI 爬虫模拟（可选，终极验证）
10. 用 `curl -A "GPTBot" http://localhost:4173/zh-CN/` 验证 robots.txt 允许
11. 用 `curl https://www.xiaowe.cc/llms.txt` 验证 llms.txt 可访问
12. 用 Google [Rich Results Test](https://search.google.com/test/rich-results) 验证 JSON-LD
13. 用 [Schema.org Validator](https://validator.schema.org/) 验证结构化数据
14. 在豆包/ChatGPT 中提问"大声助听器怎么样""助听器品牌推荐"——观察是否提到大声（需等收录后，约 1-4 周）

---

## 五、实施顺序建议（推荐用 TodoWrite 跟踪）

1. **阶段 A**（AI 友好核心文件）→ 半天，立即见效
2. **阶段 B**（JSON-LD 结构化数据）→ 1 天
3. **阶段 C**（FAQ 页 + FAQ 模块，三语种）→ 1.5 天（最大块）
4. **阶段 D**（OG/Twitter/语义化/图片优化）→ 半天
5. **阶段 E**（预渲染脚本）→ 半天
6. **阶段 F**（DEV_LOG 收尾）→ 15 分钟

**总计**：约 3.5-4 天工程量（不含 AI 收录等待时间）

# 小维健康科技官网 — 原网站 (2.0 复刻版) 完整结构与设计风格

> **来源**: 复刻自原网站 xiaowe.cc (Faisco 平台) + 参考 xiaowe.cc 风格
> **提取时间**: 2026-07-20
> **目的**: 作为 3.0 改造项目的长期记忆,保留原网站结构与设计风格规范,后续修改调整的基线
> **关键原则**: 用户要求"保留原网站的设计风格",3.0 版本在原风格基础上整合 Excel 原型内容

---

## 一、技术栈与依赖

| 类别 | 包 | 版本 |
|---|---|---|
| 框架 | react | ^18.3.1 |
| 路由 | react-router-dom | ^6.26.0 |
| 构建 | vite | ^5.4.0 |
| 类型 | typescript | ^5.5.3 |
| 样式 | tailwindcss | **^3.4.10** (注意是 v3, 非 v4) |
| 后处理 | postcss / autoprefixer | ^8.4.41 / ^10.4.20 |
| React 插件 | @vitejs/plugin-react | ^4.3.1 |

**未引入**: Three.js (规划中但未实际安装)、图标库 (全用内联 SVG)、动画库 (用 CSS + IntersectionObserver 自实现)

---

## 二、路由结构 (7 条)

| 路径 | 页面组件 | 文件 | 说明 |
|---|---|---|---|
| `/` | HomePage | [src/pages/HomePage.tsx](file:///d:/VibeTest/bigsound/src/pages/HomePage.tsx) | 首页 13 个 section 组合 |
| `/product` | ProductPage | [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx) | 产品页 (Tab 分类 + 卡片网格) |
| `/service` | ServicePage | [src/pages/ServicePage.tsx](file:///d:/VibeTest/bigsound/src/pages/ServicePage.tsx) | 服务页 (C2M + 服务体系 + 联系模块) |
| `/about` | AboutPage | [src/pages/AboutPage.tsx](file:///d:/VibeTest/bigsound/src/pages/AboutPage.tsx) | 关于页 (品牌+愿景+创始人+发展历程) |
| `/news` | NewsListPage | [src/pages/NewsListPage.tsx](file:///d:/VibeTest/bigsound/src/pages/NewsListPage.tsx) | 资讯列表 (Tab + 2 列卡片) |
| `/news/:id` | NewsDetailPage | [src/pages/NewsDetailPage.tsx](file:///d:/VibeTest/bigsound/src/pages/NewsDetailPage.tsx) | 资讯详情 (动态参数) |
| `*` | NotFoundPage | [src/pages/NotFoundPage.tsx](file:///d:/VibeTest/bigsound/src/pages/NotFoundPage.tsx) | 404 兜底 |

路由配置: [src/routes/index.tsx](file:///d:/VibeTest/bigsound/src/routes/index.tsx) (集中式)
路径常量: [src/routes/paths.ts](file:///d:/VibeTest/bigsound/src/routes/paths.ts) (PATHS / ROUTE_PARAMS / 工具函数)
分页参数: `?m441page=N` (原网站 Faisco 平台遗留命名)

---

## 三、全局布局架构

入口: [src/components/layout/Layout.tsx](file:///d:/VibeTest/bigsound/src/components/layout/Layout.tsx)

```
<ScrollToTop />               ← 路由切换自动回顶 (无 UI)
<Header />                    ← 顶部导航 (不缩放, 固定 1200px 容器, sticky)
<main style={{height: wrapperHeight}}>
  <div ref={wrapperRef} style={{transform: scale, transformOrigin: "top left", width: 1200}}>
    <Outlet />                ← 子路由渲染处 (受 adaptWidth 缩放)
  </div>
</main>
<Footer />                    ← 页脚 (不缩放, 固定 1200px 容器)
<FloatingTools />             ← 右下角悬浮工具 (不缩放, 相对视口 fixed)
```

**核心机制**: `useAdaptWidth(1200)` hook ([src/hooks/useAdaptWidth.ts](file:///d:/VibeTest/bigsound/src/hooks/useAdaptWidth.ts))
- 设计宽度 1200px,视口 < 1200 时整体 `transform: scale()` 等比缩小
- 用 ResizeObserver 监听内容高度,同步设置外层 main 的 height (因为 scale 不改变布局尺寸)
- **非响应式**: 没有移动端断点,小屏幕看到的还是桌面布局缩小版

---

## 四、设计风格规范 (必须保留)

### 4.1 风格定位
**朴素 (Plain / Minimalist)** — 详见 [src/index.css](file:///d:/VibeTest/bigsound/src/index.css) 头部注释:
> 朴素 - 无圆角、无阴影、无渐变

例外情况:
- "AI" 二字使用蓝绿渐变 `linear-gradient(0deg, #1f87e8 0%, #05a045 100%)`
- 产品页 Tab 卡片有 `borderRadius: 12px` (来自 xiaowe.cc 风格)
- 服务页 16 项服务用绿色块卡片
- 滚动条 / 表单元素等少量 UI 有圆角

### 4.2 色彩系统 — [tailwind.config.js](file:///d:/VibeTest/bigsound/tailwind.config.js)

```js
brand: {
  green:        "#05a045",  // 主品牌绿 (数据条、底部CTA、footer)
  "green-dark": "#048b3c",
  "green-light":"#52b548",  // nav 选中色 (原网站实测)
  "green-soft": "#43d42f",
}
ink: {                        // 文字灰阶 10 级
  900: "#1a1a1a",
  800: "#222222",
  700: "#333333",   // 正文主色
  600: "#555555",
  500: "#666666",
  400: "#999999",
  300: "#cccccc",
  200: "#e5e5e5",
  100: "#f5f5f5",
}
```

**辅助色** (代码内硬编码,未入 tailwind config):
- `#177edf` 蓝色 — 腾讯天籁相关
- `#20985a` 深绿 — "耳科" 二字专用
- `#212121` / `#4b4b4b` / `#3f4b59` / `#2f2f2f` — 各处文字深灰变种
- `#f8f8f8` — ProductCategories 卡片浅灰背景
- `#a9a9a9` — 医疗备案提示文字

### 4.3 字体系统 — [src/index.css](file:///d:/VibeTest/bigsound/src/index.css#L20)

```css
font-family: "MiSans", "PingFang SC", "Microsoft YaHei", -apple-system, ...
```

- **基础字体**: MiSans (原网站 Faisco 平台使用 `MiSans-中等.woff2`)
- **大标题字体**: `"DingTalk JinBuTi", "Misans-粗体", Misans, sans-serif` (钉钉进步体, 仅 Banner 主标题用)
- **基础字号**: 14px / 行高 1.6

### 4.4 字号阶梯 — [tailwind.config.js](file:///d:/VibeTest/bigsound/tailwind.config.js#L40)

| 用途 | 字号 | 行高 | 实例 |
|---|---|---|---|
| 基础 | 14px | 1.6 | 正文默认 |
| 小字 | 12px | 1.5 | 备案信息 / 二级说明 |
| 正文 | 16px | 1.7 | 段落正文 |
| 新闻标题 | 18px | 1.6 | H4 |
| 副标题 | 20px | 1.5 | — |
| 小标题 | 22px | 1.4 | section 标题 |
| 中标题 | 24px | 1.4 | 子模块标题 |
| 大标题 | 28px | 1.4 | — |
| section 主标题 | 30px | 1.4 | TechFeatures 标题 |
| 超大标题 | 32-40px | 1.3 | — |
| Banner 主标题 | 48px | 1.2 | FlagshipProduct "年度重磅旗舰" |
| 子页面 Banner | 60-72px | 1.2 | ProductPage "让爱沟通无碍" / AboutPage "爱要大声说出来" |

### 4.5 间距与宽度

- **设计宽度**: 1200px (`maxWidth.design` / `maxWidth.7xl`)
- **container-page**: `width: 1200px; margin: 0 auto;` (无左右 padding, 各 section 自行控制)
- **常用 section padding** (来自原站实测):
  - 左右 padding: `104.26px` (TechFeatures) / `154.67px` (ProductSeries, Partners) / `132px` (NewsSection) / `160.29px` (ChinesePioneer) / `53px` (Qualifications) / `117.30px` (Stats)
  - 上下 padding: 通常 `0 / 40px`,部分页面 `60px`

### 4.6 悬停规范

```css
.hover-theme-color:hover { color: #52b548; }
transition: color 0.3s ease;
```

- 所有可点击文字 hover 变 `#52b548`
- 按钮 hover: 轮廓按钮 → 实心填充 (如"了解更多")
- 卡片 hover: 标题变 `#52b548`, 图片 `scale-105`
- 时长: 0.2-0.4s ease / ease-out

### 4.7 动画规范

**Reveal 滚动淡入** — [src/components/ui/Reveal.tsx](file:///d:/VibeTest/bigsound/src/components/ui/Reveal.tsx):
- 初始: `opacity:0 + translateY(20px)`
- 进入视口: `opacity:1 + translateY(0)`
- 时长: 600ms ease-out
- 支持 delay (ms) 错开入场
- 首屏内元素立即触发 (rAF)
- 尊重 `prefers-reduced-motion: reduce`

**CountUp 数字滚动** — [src/components/ui/CountUp.tsx](file:///d:/VibeTest/bigsound/src/components/ui/CountUp.tsx):
- 数字从 0 滚动到目标值,2s
- 用于 Stats / BrandIntro 数据卡片

**Banner 轮播动画** — [src/index.css](file:///d:/VibeTest/bigsound/src/index.css#L131):
- 新 slide: `translateX(100%) → 0`,1.5s ease (bannerSlideIn)
- 旧 slide: `translateX(0) → -100%`,1.5s ease (bannerSlideOut)
- 图片: `scale(1.3) → scale(1)`,5s ease (bannerScaleUp,慢速缩放)
- 自动轮播: 5s 间隔
- 箭头: 60×60 半透明黑色,hover 加深
- 指示点: 激活态拉长 (`w-8`) + 主题色

### 4.8 图标系统

**全部内联 SVG**,无第三方图标库 (lucide / heroicons / fontawesome 均未引入)。SVG 用 `viewBox="0 0 24 24"` + `fill="currentColor"` 或 `stroke="currentColor"`。

---

## 五、Header 顶部导航 — [src/components/layout/Header.tsx](file:///d:/VibeTest/bigsound/src/components/layout/Header.tsx)

```
sticky top-0 z-50 bg-white
├─ scroll > 10px 时: shadow-[0_2px_8px_rgba(0,0,0,0.06)]
└─ container-page flex items-center justify-between h-[89px]
   ├─ 左: Link to="/" → img.logo h-[40px]
   └─ 右: nav flex gap-8 (5 个 Link)
      └─ 当前页: text-brand-green font-bold
         非当前页: text-ink-700 hover:text-brand-green
```

导航 5 项 — [src/config/navigation.ts](file:///d:/VibeTest/bigsound/src/config/navigation.ts):
1. 首页 `/`
2. 产品 `/product`
3. 服务 `/service`
4. 资讯 `/news`
5. 关于 `/about`

---

## 六、Footer 页脚 — [src/components/layout/Footer.tsx](file:///d:/VibeTest/bigsound/src/components/layout/Footer.tsx)

```
footer bg-brand-green text-white
├─ 合作伙伴 logo 横排 (4 个, h=45px)
│  └─ 创维集团 / 小维科技 / 腾讯天籁实验室 / 中国老龄发展基金会
├─ 备案信息 (居中, 12px)
│  ├─ policeRecord (粤公网安备) · icp (粤ICP备)
│  ├─ copyright (©2024 小维健康科技)
│  └─ drugLicense (互联网药品信息服务资格证)
└─ 底部导航链接 (5 项, 12px text-white/70)
```

站点信息 — [src/config/site.ts](file:///d:/VibeTest/bigsound/src/config/site.ts):
- name: 大声 AI中文助听器
- brand: Bigsound大声
- parentCompany: 小维健康科技（深圳）有限公司
- hotline: 400-116-9566
- address: 深圳市龙华区大浪街道浪静路3号数字时尚产业园A栋720
- phone: 0755-26902895
- email: admin@xiaowe.cc
- icp: 粤ICP备2022020947号
- policeRecord: 粤公网安备44030002003867号
- drugLicense: 互联网药品信息服务资格证（粤）—经营性-2022-0419
- copyright: ©2024 小维健康科技（深圳）有限公司 版权所有
- medicalReg: *粤械注准20232192086
- medicalAd: 粤械广审（文）第280917-05538号
- medicalNotice: 请仔细阅读产品说明书或在医务人员指导下购买和使用...

---

## 七、FloatingTools 悬浮工具 — [src/components/layout/FloatingTools.tsx](file:///d:/VibeTest/bigsound/src/components/layout/FloatingTools.tsx)

```
fixed right-3 bottom-6 z-40 flex flex-col gap-2 (不受 adaptWidth 缩放)
├─ 电话咨询 (12×12 绿色方块, tel: 链接)
├─ 二维码 (12×12 白底, hover 弹出公众号 QR 32×32)
└─ 回到顶部 (scroll > 400px 显示, 平滑滚动)
```

---

## 八、首页 13 个 Section 组件 (按渲染顺序)

入口: [src/pages/HomePage.tsx](file:///d:/VibeTest/bigsound/src/pages/HomePage.tsx)

| # | 组件 | 文件 | 高度 | 关键内容 |
|---|---|---|---|---|
| 1 | Banner | [Banner.tsx](file:///d:/VibeTest/bigsound/src/components/home/Banner.tsx) | 416px | 2 张整图轮播,文字烧录在图上 |
| 2 | ProductCategories | [ProductCategories.tsx](file:///d:/VibeTest/bigsound/src/components/home/ProductCategories.tsx) | 150px | 3 分类卡片 (耳背/颈挂/耳内) |
| 3 | BrandIntro | [BrandIntro.tsx](file:///d:/VibeTest/bigsound/src/components/home/BrandIntro.tsx) | ~494px | 关于我们+品牌大图+3 数据卡片 |
| 4 | ChinesePioneer | [ChinesePioneer.tsx](file:///d:/VibeTest/bigsound/src/components/home/ChinesePioneer.tsx) | 232px | "中文助听开创者" 45px 居中 |
| 5 | TechFeatures | [TechFeatures.tsx](file:///d:/VibeTest/bigsound/src/components/home/TechFeatures.tsx) | 526+303+434px | 3 大核心技术,左右交替图文 |
| 6 | FlagshipProduct | [FlagshipProduct.tsx](file:///d:/VibeTest/bigsound/src/components/home/FlagshipProduct.tsx) | ~1027px | 大声×腾讯天籁旗舰,2 cols |
| 7 | ProductSeries | [ProductSeries.tsx](file:///d:/VibeTest/bigsound/src/components/home/ProductSeries.tsx) | ~361px | 3 cols × 287×287 产品方图 |
| 8 | HearingResearch | [HearingResearch.tsx](file:///d:/VibeTest/bigsound/src/components/home/HearingResearch.tsx) | 279px | 2 cols 图文 (听力健康研究) |
| 9 | Partners | [Partners.tsx](file:///d:/VibeTest/bigsound/src/components/home/Partners.tsx) | 201px | 4 logos 横排 |
| 10 | Qualifications | [Qualifications.tsx](file:///d:/VibeTest/bigsound/src/components/home/Qualifications.tsx) | 306px | 3 张证书图 |
| 11 | NewsSection | [NewsSection.tsx](file:///d:/VibeTest/bigsound/src/components/home/NewsSection.tsx) | 动态 | 2 列新闻列表 + 48 页分页 |
| 12 | BottomCTA | [BottomCTA.tsx](file:///d:/VibeTest/bigsound/src/components/home/BottomCTA.tsx) | 207px | 5 cols 联系信息+医疗备案 |
| 13 | MedicalNotice | [MedicalNotice.tsx](file:///d:/VibeTest/bigsound/src/components/home/MedicalNotice.tsx) | 0 | 空导出 (已合并到 BottomCTA) |

---

## 九、子页面结构概览

### 9.1 ProductPage 产品页
1. Banner (258px): topLogo + 60px 标题"让爱沟通无碍" + 36px 副标题 + titleImage
2. Tab 分类 (4 个: 全部/RIC式/颈挂式/耳内式, 185×158 圆角 12px)
3. 产品卡片网格 (253×389, 图 228×228, 4 个产品)
4. BottomCTA + MedicalNotice

### 9.2 ServicePage 服务页
1. Banner (327px): titleImage + 22px 描述
2. C2M 模式 (h=518px, 背景大图, 3 cards)
3. 专业听力验配服务体系 (3 子section 图文交替)
4. 16 项专业听力健康服务 (3 列 grid, #52b548 绿色块)
5. 全国连锁标题
6. 联系客服 (3 列: QR+文案+电话+按钮)
7. 远程验配 (2 列: QR+文案)
8. APP 下载 (2 个 APP 卡片)
9. 招商加盟 (3 列: QR+文案+电话+按钮)
10. 联系我们标题 + Bigsound 大声 听力服务中心卡片
11. BottomCTA + MedicalNotice

### 9.3 AboutPage 关于页
1. Banner (448px): topLogo + 72px 标题"爱要大声说出来" + 36px 副标题
2. 品牌介绍 (2 cols: 547 文字 + 391 图 317×317)
3. VISION/MISSION 图文交替 + 价值观 4 列横排
4. 创始人 (居中: 205×205 照片 + 名字 + 职位 + 4 条 bio)
5. 资质荣誉 (复用 Qualifications)
6. 发展历程 (5 阶段卡片, 2 列 grid)
7. BottomCTA + MedicalNotice

### 9.4 NewsListPage 资讯列表页
1. Banner (234px): 36px 标题"听力资讯" + 21px 描述
2. Tab (4 类: 全部/公司新闻/产品资讯/听力科普) + 2 列新闻列表
3. BottomCTA + MedicalNotice

### 9.5 NewsDetailPage 资讯详情页
- 渲染 articles 数据 (paragraph / heading / list / quote / image blocks)
- 正文 14px #666 leading 2.8
- 小标题 16px #333 700
- 引用块: 左边框 4px brand-green,背景 brand-green/5

---

## 十、数据流与图片资源管理

### 10.1 数据组织 — [src/data/](file:///d:/VibeTest/bigsound/src/data)

| 文件 | 内容 | 用途 |
|---|---|---|
| [home.ts](file:///d:/VibeTest/bigsound/src/data/home.ts) | STATS / TECH_FEATURES / FLAGSHIP_PRODUCT / PRODUCT_SERIES / PRODUCT_CATEGORIES / PARTNERS / QUALIFICATIONS / HEARING_RESEARCH / NEWS_LIST / NEWS_CATEGORIES / NEWS_CATEGORY_MAP / NEWS_TOTAL_PAGES | 首页所有数据 |
| [product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts) | PRODUCT_PAGE (4 个产品 + 4 个分类) | 产品页 |
| [service.ts](file:///d:/VibeTest/bigsound/src/data/service.ts) | SERVICE_PAGE (C2M + 服务体系 + 16 项服务 + APP + 招商 + 远程验配) | 服务页 |
| [about.ts](file:///d:/VibeTest/bigsound/src/data/about.ts) | ABOUT_PAGE (品牌介绍 4 段 + missionVision 2 项 + values 4 项 + founder + timeline 5 阶段) | 关于页 |
| [articles.ts](file:///d:/VibeTest/bigsound/src/data/articles.ts) | NEWS_ARTICLES (新闻详情 block 数组) | 详情页 |
| [content.ts](file:///d:/VibeTest/bigsound/src/data/content.ts) | Barrel File (兼容旧 import 路径) | 统一入口 |

### 10.2 图片资源 — [src/data/images/](file:///d:/VibeTest/bigsound/src/data/images)

| 文件 | 内容 |
|---|---|
| [common.ts](file:///d:/VibeTest/bigsound/src/data/images/common.ts) | logo / brand / qrcode / heroBigsoundLogo / heroDasoundLogo |
| [banner.ts](file:///d:/VibeTest/bigsound/src/data/images/banner.ts) | bannerBg1-2 / banner1-3 / pageHero* |
| [home.ts](file:///d:/VibeTest/bigsound/src/data/images/home.ts) | heroLogo / heroBrand / tech1-4 / product1-4 / flagshipLogo / partner1-4 / hearingResearch / cert1-3 / ctaLogo* |
| [product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts) | 产品页图片 |
| [service.ts](file:///d:/VibeTest/bigsound/src/data/images/service.ts) | serviceBannerTitle / serviceC2mBg / serviceC2mLogo / qr 系列 |
| [about.ts](file:///d:/VibeTest/bigsound/src/data/images/about.ts) | aboutBrand / aboutFounder / missionVision1-2 |
| [news.ts](file:///d:/VibeTest/bigsound/src/data/images/news.ts) | news1-10 |
| [index.ts](file:///d:/VibeTest/bigsound/src/data/images/index.ts) | Barrel + ImageKey 类型 |

### 10.3 静态图片 — `public/images/`

**编号体系** (顶层):
- `01_logo.webp` — Header logo
- `02_banner_1/2/3.webp` + `02_banner_bg1/2.webp` — 首页 Banner
- `03_hero_1/2.webp` — Hero 配图
- `04_brand.webp` — 品牌图
- `05_tech_1-4.webp` — 技术配图
- `06_product_1-8.webp` — 产品图
- `07_news_1-10.webp` — 新闻配图
- `08_partner_1-4.webp` — 合作伙伴 logo
- `09_qrcode.webp` — 公众号二维码

**命名图** (顶层):
- `about_brand.webp` / `about_founder.png`
- `cta_logo_main.webp` / `cta_logo_dasound_ztq.webp` / `cta_logo_dasound_tl.webp` / `cta_logo_xhs.webp`
- `favicon.ico` / `not-found.png`
- `hero_bigsound_logo.webp` / `hero_dasound_logo.webp`
- `product_banner_title.webp` / `product_neck_bg.webp` / `product_ric_bg.webp` / `product_ric_tencent_bg.webp`
- `service_banner_title.webp` / `service_c2m_bg.jpg` / `service_c2m_logo.webp`

**`original/` 子目录** (从原网站直接抓取,保留原名):
- `brand_intro_bg.jpg` / `cert1-3.webp` / `flagship_logo.webp` / `flagship_product.webp`
- `hearing_research.webp` / `hero_brand.webp` / `hero_logo.webp`
- `mission_vision_1/2.jpg` / `news1-10.webp` / `partner1-4.webp`
- `qr_invest.webp` / `qr_remote.webp` / `qr_xwjk.webp` / `qr_xwmy.webp`
- `series1-3.webp` / `tech1-3.webp`

**`prototype/` 子目录** (本次从 Excel 原型提取,26 张):
- 详见 [_mapping.md](file:///d:/VibeTest/bigsound/public/images/prototype/_mapping.md)

---

## 十一、关键设计模式与约定

### 11.1 单位与精度
- 大量使用**小数像素** (如 `104.26px` / `41.68px` / `31.43px`) — 来自原网站 Faisco 平台实测值,1:1 还原
- 高度精确固定 (如 Banner `h-[416px]` / TechFeatures 三段 `526+303+434px`)
- 颜色用 hex 全写,不用 alpha 通道 (透明度用 `bg-white/90` 这种 Tailwind 语法)

### 11.2 文本高亮约定
- 字符串中用 `[[关键词]]` 标记高亮 (TechFeatures),渲染时拆分为 `<span class="text-[#05a045]">`
- AboutPage 用 `HIGHLIGHTS` 数组批量替换 ("AI" / "中文助听器" / "耳科" 各自规则)

### 11.3 容器与布局
- 全站统一 `.container-page { width: 1200px; margin: 0 auto; }`
- 各 section 自行决定左右 padding (所以同一页面内 padding 值不统一)
- 用 `grid grid-cols-N gap-X` 而非 flex 做主布局

### 11.4 组件复用
- `BottomCTA` 在所有页面底部复用 (Home/Product/Service/About/News)
- `Qualifications` 在 Home 和 About 复用 (About 传 `title="资质荣誉"`)
- `MedicalNotice` 已合并到 `BottomCTA`,但保留空导出以兼容旧引用
- `PageHero` 通用子页面 Banner 组件

### 11.5 路由跳转
- 用 `<Link to={PATHS.X}>` 而非 `<a href>`
- 路径常量统一从 `routes/paths.ts` 导入,避免硬编码
- 动态路由用 `:id` 参数,`useParams` 获取

---

## 十二、与原网站 xiaowe.cc 的差异

复刻版与原站 6-7 成相似,主要差异:
1. **新增"资讯"独立页**: 原站 xiaowe.cc 仅 4 项导航 (首页/产品/服务/关于),复刻版参考 xiaowe.cc 新增资讯页
2. **首屏 Banner**: 用 2 张图轮播 (原站也是,但具体图片可能不同)
3. **ProductCategories**: 参考 xiaowe.cc row1 增加 3 分类卡片入口
4. **BrandIntro 数据卡片**: 参考 xiaowe.cc row2 增加 3 个白色数据卡片
5. **HearingResearch**: 参考 xiaowe.cc row10 增加的模块
6. **Qualifications**: 参考 xiaowe.cc row18 增加 3 张证书图模块
7. **NewsSection 分页**: 复刻版用客户端分页,原站是服务端分页

参考来源主要是同集团兄弟站点 **xiaowe.cc** (小维科技官网),二者设计风格高度一致 (Faisco 平台 + 1200px + 朴素绿色)。

---

## 十三、3.0 改造建议保留项

基于"保留原网站设计风格"的要求,3.0 版本必须保留:

✅ **必须保留**:
- 1200px 设计宽度 + adaptWidth 缩放方案
- 主色 #05a045 + 选中色 #52b548
- MiSans 字体 + 钉钉进步体大标题
- 朴素风格 (无圆角 / 无阴影 / 无渐变)
- Reveal 滚动淡入动画
- 5 项主导航 (首页/产品/服务/资讯/关于)
- BottomCTA + Footer + FloatingTools 三件套
- 内联 SVG 图标
- 数据/图片按页面拆分的目录结构

🔄 **可调整**:
- 首页 section 顺序与数量 (按 Excel 原型 8 大板块重组)
- 各页面具体内容 (用 PROTOTYPE_CONTENT.md 的文案替换)
- 产品型号清单 (从 4 个扩展到 12 个)
- 新增模块: 招商加盟 / 人才招聘 / 创维生态 (按原型)

⚠️ **待用户确认**:
- 是否新增独立"招商加盟"页 (原型右列大量内容)
- 是否新增独立"人才招聘"页 (原型顶部右侧 16 个职位)
- 是否在首页加入"创维生态"模块
- 是否调整导航从 5 项扩展到 7 项

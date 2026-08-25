# 小维健康科技官网 3.0 — 多语言支持(繁体中文 + 英文)实施计划

> **决策已确认**
> - 路由策略:URL 前缀(`/:locale/...`),三套语言 `zh-CN` / `zh-TW` / `en`,`zh-CN` 为默认
> - 翻译范围:全量(UI + 8 个数据文件 + 文章正文 + 内联字符串)
> - 含中文艺术字的图片:为每种语言重新生成

---

## 一、当前状态分析

### 已就绪
- React 18.3 + TypeScript 5.5 + Vite 5.4 + react-router-dom 6.26 + Tailwind 3.4
- 路由树已集中管理:`src/routes/index.tsx` + `src/routes/paths.ts`
- 数据已采用「集中数据文件」模式:`src/data/*.ts`,8 个页面级数据文件
- 已预留语言切换 UI:`src/config/navigation.ts` 第 48-52 行 `LANGUAGE_OPTIONS`,`Header.tsx` 第 163-220 行下拉组件(点击 zh-TW/en 会弹"即将上线",仅 `useState` 不持久化)

### 主要问题
1. **无任何 i18n 库**:`package.json` 未引入 `i18next` / `react-i18next`
2. **无 locale 路由层**:`BrowserRouter` 直接挂在 `main.tsx` 第 10 行
3. **中文文案分布**:
   - 数据文件约 2 万字(`articles.ts` 3867 行最多)
   - 10 个页面组件内联中文(`ProductPage.tsx` 2635 处最多,含 SVG `<text>`)
   - 4 个 layout 共享组件(`Header.tsx` 476 / `Footer.tsx` 720 / `FloatingTools.tsx` 97 / `PageHero.tsx` 468)
   - `index.html` meta 硬编码 `lang="zh-CN"` + 中文 description/keywords/title
4. **图片含中文艺术字**:`public/images/hero/hero_invest.png`(「声价千亿 聚势共赢」)、可能还有其他证书图、banner 标题图
5. **字体栈硬编码**:`PageHero.tsx` 第 131-133 行指定 `DingTalk JinBuTi, MiSans, PingFang SC, Microsoft YaHei`,英文字符会回退到系统字体
6. **URL 含中文 tag**:`src/config/footer.ts` 第 91-93 行 `/news/category/公司新闻`
7. **表单校验消息内联**:`LoginPage.tsx` 第 65-79 行、`RegisterPage.tsx` 第 50-52 行密码强度标签
8. **无 SEO 组件**:`<title>` / `<html lang>` / hreflang / og:locale 均未动态化

---

## 二、实施计划(分 9 个阶段)

### 阶段 1:i18n 基础设施搭建

**目标**:安装库 + 创建目录结构 + Provider 接入

#### 1.1 安装依赖

```bash
npm install i18next react-i18next react-helmet-async
```

> `react-helmet-async` 用于动态管理 `<title>` / `<html lang>` / hreflang。

#### 1.2 创建目录与文件

```
src/i18n/
├── index.ts                    ← i18next 实例初始化
├── types.ts                    ← Locale 类型 + 资源命名空间类型
├── LocaleContext.tsx           ← Locale Provider + useLocale hook
└── locales/
    ├── zh-CN/
    │   ├── common.json         ← 通用 UI(按钮、表单、Header、Footer、FloatingTools)
    │   ├── home.json           ← 首页相关
    │   ├── product.json        ← 产品页
    │   ├── about.json          ← 关于页
    │   ├── invest.json         ← 招商页
    │   ├── wearable.json       ← 手表页
    │   ├── careers.json        ← 招聘页
    │   ├── news.json           ← 新闻列表+详情
    │   ├── auth.json           ← 登录/注册
    │   └── meta.json           ← SEO title/description/og
    ├── zh-TW/                  ← 同上 9 个文件
    └── en/                     ← 同上 9 个文件
```

#### 1.3 `src/i18n/index.ts` 配置

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import zhCN from "./locales/zh-CN";
import zhTW from "./locales/zh-TW";
import en from "./locales/en";

export const SUPPORTED_LOCALES = ["zh-CN", "zh-TW", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "zh-CN";
export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  en: "English",
};

i18n.use(initReactI18next).init({
  resources: { "zh-CN": zhCN, "zh-TW": zhTW, en },
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

export default i18n;
```

#### 1.4 `src/i18n/LocaleContext.tsx`

提供当前 locale 状态(与 URL `:locale` 参数同步)、`changeLocale(newLocale)` 方法(用于切换语言时跳转 URL)、`useLocale()` hook 返回 `{ locale, changeLocale }`。

#### 1.5 修改 `src/main.tsx`

```tsx
import "./i18n";                          // 初始化 i18next
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  </HelmetProvider>
);
```

---

### 阶段 2:路由层改造为 `/:locale/...`

**目标**:URL 加入 locale 前缀,默认重定向到 `/zh-CN`,语言切换器实际跳转

#### 2.1 修改 `src/routes/index.tsx`

```tsx
import { Navigate } from "react-router-dom";

function LocaleLayout() {
  const { locale } = useParams();           // 从 URL 取
  // 校验 locale 是否合法,非法则重定向到默认
  // 同步 i18next 语言 + document.documentElement.lang + cookie
  return <Layout />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/zh-CN" replace />} />
      <Route path=":locale" element={<LocaleLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="product" element={<ProductPage />} />
        <Route path="wearable" element={<WearablePage />} />
        <Route path="invest" element={<InvestPage />} />
        <Route path="careers" element={<CareersPage />} />
        <Route path="news" element={<NewsListPage />} />
        <Route path="news/category/:tag" element={<NewsListPage />} />
        <Route path="news/:id" element={<NewsDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="/:locale/login" element={<LoginPage />} />
      <Route path="/:locale/register" element={<RegisterPage />} />
    </Routes>
  );
}
```

#### 2.2 修改 `src/routes/paths.ts`

- 把所有路径常量从 `/about` 改为函数式:`aboutPath(locale) => \`/${locale}/about\``
- 保留 `newsDetailPath(locale, id)` / `newsCategoryPath(locale, tag)` 等生成函数
- 旧 `PATHS` 对象标记为 deprecated,提供迁移期包装(也可一次性改完)

#### 2.3 修改 `src/config/navigation.ts`

```typescript
export const LANGUAGE_OPTIONS = [
  { code: "zh-CN", label: "简体中文", enabled: true },
  { code: "zh-TW", label: "繁體中文", enabled: true },   // ← 改为 true
  { code: "en", label: "English", enabled: true },       // ← 改为 true
] as const;
```

`NAV_ITEMS` 改为函数:`navItems(locale) => [{ label: "...", href: \`/${locale}/...\` }]`,或者保留 `NAV_ITEMS` 但 `label` 改为 i18n key,`href` 用函数生成。

#### 2.4 修改 `src/components/layout/Header.tsx`

- 第 88-100 行 `handleLangSelect`:删除 `alert`,改为 `navigate(\`/${newLocale}${currentPathAfterLocale}\`)`
- 第 230 / 238 行登录/注册链接:用 `paths.loginPath(locale)` / `registerPath(locale)`
- 第 144-158 行 `NAV_ITEMS` 渲染:label 用 `t(navItem.labelKey)` 翻译,href 用 `paths.aboutPath(locale)` 等

#### 2.5 修改 `src/config/footer.ts`

- 第 91-93 行 `NEWS_LINKS`:label 用 i18n key,href 改用 `paths.newsCategoryPath(locale, "company-news")`(URL slug 英文化,见阶段 8)
- 其他 `FooterLink.label` 全部改为 i18n key

#### 2.6 修改 `src/components/layout/ScrollToTop.tsx`(若有)

确保切换 locale 跳转后保持滚动位置策略一致。

#### 2.7 内部跳转审计

- 全局搜索 `to="/about"` / `to="/product"` / `to="/news"` 等硬编码跳转,改为 `to={paths.aboutPath(locale)}`
- `<Link to="/login">` 等同改

---

### 阶段 3:数据文件按 locale 拆分

**目标**:8 个数据文件改造为「按 locale 拆分」,页面通过 hook 取当前 locale 数据

#### 3.1 拆分策略

每个数据文件拆为 3 个 locale 文件 + 1 个 barrel:

```
src/data/
├── home/
│   ├── home.zh-CN.ts        ← 内容从原 home.ts 迁移
│   ├── home.zh-TW.ts        ← 翻译
│   ├── home.en.ts           ← 翻译
│   └── index.ts             ← export const HOME_DATA: Record<Locale, HomeContent> = {...}
├── product/
├── about/
├── invest/
├── wearable/
├── careers/
├── service/
└── articles/
    ├── articles.zh-CN.ts
    ├── articles.zh-TW.ts
    ├── articles.en.ts
    └── index.ts
```

#### 3.2 类型保留

每个模块的 `types.ts` 提取类型定义(`HomeContent` / `ProductPageContent` / `Article` 等),三个 locale 文件共享类型。原 `data/*.ts` 中的内联类型一并迁出。

#### 3.3 页面消费方式

新增 `src/hooks/useLocaleData.ts`:

```typescript
export function useLocaleData<T>(data: Record<Locale, T>): T {
  const { locale } = useLocale();
  return data[locale];
}
```

页面组件改为:

```typescript
// 旧
import { PRODUCT_PAGE } from "../data/product";
const title = PRODUCT_PAGE.coreTech.title;

// 新
import { PRODUCT_PAGE } from "../data/product";
const data = useLocaleData(PRODUCT_PAGE);
const title = data.coreTech.title;
```

#### 3.4 旧 `data/*.ts` 文件处理

- `data/index.ts`(barrel)重新导出新结构
- 旧的 `data/home.ts` 等可保留为 re-export `./home/index.ts`,或一次性删除并改全部 import 路径(推荐后者,避免歧义)
- `data/mockUsers.ts` 用户 nickname 等用户内容不翻译
- `data/authRepository.ts` 错误消息改用 i18n key

#### 3.5 文章翻译策略

`articles.ts` 3867 行最大。拆分后:
- `articles.zh-CN.ts`:原内容直接搬入
- `articles.zh-TW.ts`:简转繁(可用工具批量转换后人工校对)
- `articles.en.ts`:人工/机翻 + 校对

每篇文章的 `id` 保持一致(用于跨语言 `news/:id` 链接稳定),`title` / `content[]` 各语言独立。

---

### 阶段 4:页面组件内联中文抽取

**目标**:把页面 JSX 中的硬编码中文抽到 i18n locale JSON

#### 4.1 通用做法

```typescript
// 旧
<h2>听力康复咨询</h2>

// 新
<h2>{t("product:serviceCards.consulting.title")}</h2>
```

#### 4.2 优先级清单(按内联中文数量降序)

| 文件 | 中文字符数 | 重点位置 |
|---|---|---|
| `pages/ProductPage.tsx` | 2635 | 第 147 行「零售指导价」、第 152 行「待定」、第 181 行空状态、第 428-449 行 SVG `<text>`、第 474-478 行左列节点、第 518-520 行右列节点、第 560-562 行步骤、第 712-758 行服务卡片、第 825 行「咨询电话」 |
| `pages/InvestPage.tsx` | 1746 | 第 36-47 行局部 `SectionTitle` + 各处 `INVEST_PAGE.xxx.title` 之外的硬编码 |
| `pages/AboutPage.tsx` | 1378 | 第 363 行「核心团队」等 |
| `pages/RegisterPage.tsx` | 710 | 卖点、校验消息、密码强度标签(第 50-52 行)、所有按钮文案 |
| `pages/CareersPage.tsx` | 667 | 岗位列表、福利标签、流程节点 |
| `pages/LoginPage.tsx` | 659 | 第 65-79 行校验消息、第 98 行错误提示、第 119-126 行品牌区文案、第 130-134 行 4 项卖点、所有按钮/占位符 |
| `pages/NewsListPage.tsx` | 329 | 分类标签、空状态 |
| `pages/WearablePage.tsx` | 624 | 产品规格、特性卡片 |
| `pages/NewsDetailPage.tsx` | 260 | 作者/日期/相关推荐 |
| `pages/NotFoundPage.tsx` | 136 | 全部文案(第 38/41/56 行) |
| `pages/HomePage.tsx` | 113 | 注释为主 |

#### 4.3 SVG `<text>` 特殊处理

`ProductPage.tsx` 第 428-449 行 SVG 内的中文(如「前端验配师」、「SOP+全数字化检查」)需用 `{t("...")}` 替换。SVG `<text>` 元素支持 JSX 表达式作为子节点。

#### 4.4 共享 layout 组件

- `Header.tsx`:第 139 行 logo `alt`、第 168 行 `aria-label`、第 230/238 行登录注册、第 282/296/303 行用户菜单、第 316/363/368/405 行移动端抽屉文案
- `Footer.tsx`:第 146/151/189/207 行板块标题、第 269-291 行联系信息标签、第 129 行 `扫码关注{link.label}` 模板
- `FloatingTools.tsx`:第 29/40/56/69/84 行 4 个按钮 title/aria-label
- `PageHero.tsx`:第 131-133 行 `fontFamily` 改为 locale-aware(见阶段 8)

---

### 阶段 5:SEO 与 Meta 动态化

**目标**:每个页面有 locale 感的 `<title>` / description / hreflang / og:locale

#### 5.1 修改 `index.html`

```html
<!DOCTYPE html>
<html lang="zh-CN">                            <!-- 默认值,运行时由 Helmet 修改 -->
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="..." />
    <!-- 静态 fallback,Helmet 覆盖 -->
    <title>大声AI中文助听器</title>
    <!-- hreflang 由 Helmet 注入 -->
  </head>
  ...
</html>
```

#### 5.2 创建 `src/components/SEO.tsx`

```typescript
import { Helmet } from "react-helmet-async";
import { useLocale, SUPPORTED_LOCALES } from "../i18n";

interface SEOProps {
  titleKey: string;            // i18n key,如 "meta:home.title"
  descriptionKey: string;
  path: string;                // 如 "/about"(不含 locale 前缀)
}

export function SEO({ titleKey, descriptionKey, path }: SEOProps) {
  const { locale } = useLocale();
  const { t } = useTranslation();
  const title = t(titleKey);
  const description = t(descriptionKey);

  return (
    <Helmet>
      <html lang={locale} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={`https://xiaowe.cc/${locale}${path}`} />
      {SUPPORTED_LOCALES.map((loc) => (
        <link
          key={loc}
          rel="alternate"
          hrefLang={loc}
          href={`https://xiaowe.cc/${loc}${path}`}
        />
      ))}
      <meta property="og:locale" content={locale.replace("-", "_")} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
    </Helmet>
  );
}
```

#### 5.3 每个页面接入 `<SEO />`

各页面顶部添加:

```typescript
<SEO
  titleKey="meta:product.title"
  descriptionKey="meta:product.description"
  path="/product"
/>
```

#### 5.4 创建 `src/i18n/locales/{locale}/meta.json`

每个 locale 一个 meta 文件,包含所有页面的 title / description / keywords。

---

### 阶段 6:含中文艺术字图片的多语言重生

**目标**:为每种语言生成对应版本,通过 locale 切换图片路径

#### 6.1 盘点所有「烤入中文文字」的图片

需逐张核实的目录:
- `public/images/hero/*.png`(尤其 `hero_invest.png` 含「声价千亿 聚势共赢」)
- `public/images/cta_logo_*.webp`
- `public/images/product_banner_title.webp` / `service_banner_title.webp`
- `public/images/honor_*.png` / `cert*.webp`(证书类,通常保留原图 + 添加语言说明)
- `public/images/team/team_member_*.png`(可能含中文姓名/职务)

输出清单:图片路径 + 是否含中文文字 + 是否需要重生。

#### 6.2 重生策略

- **含艺术字大标题**(如 `hero_invest.png`):用速创 API gpt-image-2 模型,基于原 prompt 调整文字内容:
  - zh-CN:保留「声价千亿 聚势共赢」
  - zh-TW:改为「聲價千亿 聚勢共贏」(繁体)
  - en:改为英文等价标语(如 "Billions in Sound · Synergy for All")
- **证书图**:zh-TW 保留中文(繁体化),en 保留中文原图 + HTML 叠加英文说明文字
- **团队照片**:确认是否含文字,无文字则三语言共用

#### 6.3 图片路径组织

```
public/images/hero/
├── zh-CN/
│   └── hero_invest.png       ← 原 hero_invest.png 迁入
├── zh-TW/
│   └── hero_invest.png       ← 重生繁体版
└── en/
    └── hero_invest.png       ← 重生英文版
```

#### 6.4 修改 `src/data/images/*.ts`

每个图片常量改为 `Record<Locale, string>`:

```typescript
// 旧
export const heroInvest = "/images/hero/hero_invest.png";

// 新
export const heroInvest: Record<Locale, string> = {
  "zh-CN": "/images/hero/zh-CN/hero_invest.png",
  "zh-TW": "/images/hero/zh-TW/hero_invest.png",
  en: "/images/hero/en/hero_invest.png",
};
```

#### 6.5 修改消费方

```typescript
// 旧
<img src={IMAGES.heroInvest} alt="..." />

// 新
const heroInvest = useLocaleData(IMAGES.heroInvest);
<img src={heroInvest} alt={t("common:alt.heroInvest")} />
```

---

### 阶段 7:表单与鉴权消息

**目标**:`LoginPage` / `RegisterPage` 校验消息、错误提示、密码强度标签全部 i18n 化

#### 7.1 修改 `src/pages/LoginPage.tsx`

- 第 65-79 行校验消息:抽到 `auth:login.errors.accountRequired` 等 key
- 第 98 行「登录失败,请稍后重试」:`auth:login.errors.generic`
- 第 119-126 行品牌区主标/副标:`auth:login.brand.title` / `auth:login.brand.subtitle`
- 第 130-134 行 4 项卖点:数组改为从 i18n JSON 取
- 所有按钮/占位符/aria-label:i18n key

#### 7.2 修改 `src/pages/RegisterPage.tsx`

- 第 50-52 行密码强度标签「弱/中/强」:`auth:register.strength.weak` / `medium` / `strong`
- 同样改造其他内联

#### 7.3 修改 `src/data/authRepository.ts`

- 第 488 行附近的错误消息:改用 i18n key 或返回错误 code,由页面层翻译
- `src/lib/supabase.ts` 第 34-40 行 `console.warn` 中文:可保留(开发者日志)或改英文

#### 7.4 修改 `src/contexts/AuthContext.tsx`

- `login` / `register` 返回的 `result.error?.message` 改为 error code,页面用 `t(\`auth:errors.${code}\`)` 翻译

---

### 阶段 8:字体栈与 URL slug 策略

#### 8.1 字体栈 locale-aware

修改 `src/components/layout/PageHero.tsx` 第 131-133 行:

```typescript
const fontFamilyByLocale: Record<Locale, string> = {
  "zh-CN": '"DingTalk JinBuTi", "MiSans", "PingFang SC", "Microsoft YaHei", sans-serif',
  "zh-TW": '"DingTalk JinBuTi", "MiSans", "PingFang TC", "Microsoft JhengHei", sans-serif',
  en: '"Inter", "system-ui", "Segoe UI", sans-serif',
};

// 使用
const { locale } = useLocale();
const fontFamily = fontFamilyByLocale[locale];
```

需要在 `index.html` 或 CSS 中加载 `Inter` 字体(可通过 Google Fonts 或 fontsource)。

#### 8.2 新闻分类 URL slug 英文化(决策)

**决策**:URL slug 固定为英文,显示用 i18n key 翻译。

修改 `src/config/footer.ts` 第 91-93 行:

```typescript
const NEWS_LINKS = (locale: Locale): FooterLink[] => [
  { label: t("footer:news.company"), href: paths.newsCategoryPath(locale, "company-news") },
  { label: t("footer:news.product"), href: paths.newsCategoryPath(locale, "product-news") },
  { label: t("footer:news.industry"), href: paths.newsCategoryPath(locale, "industry-news") },
];
```

`src/data/articles.ts` 中 `category` 字段也改为英文 slug,显示时通过 `NEWS_CATEGORY_MAP[locale][slug]` 翻译。

需建立 slug → 中文/繁中/英文 显示名的映射表。

---

### 阶段 9:语言切换器交互完善 + 持久化

**目标**:用户切换语言后,刷新页面或访问其他页面时保持选择

#### 9.1 持久化策略

- **主源**:URL `:locale` 参数(权威)
- **辅助**:cookie `lang=zh-CN`(供服务端识别 + 无 locale 路径访问时重定向)
- 不使用 localStorage(URL 已是权威源,localStorage 会引入不一致)

#### 9.2 修改 `src/components/layout/Header.tsx` 语言切换器

```typescript
const { locale } = useLocale();
const navigate = useNavigate();
const location = useLocation();

const handleLangSelect = (newLocale: Locale) => {
  // 取当前 pathname,去掉旧 locale 前缀,拼新 locale
  const rest = location.pathname.replace(/^\/(zh-CN|zh-TW|en)/, "");
  document.cookie = `lang=${newLocale};path=/;max-age=${60 * 60 * 24 * 365}`;
  navigate(`/${newLocale}${rest || ""}${location.search}${location.hash}`);
};
```

#### 9.3 根路径重定向智能化

修改 `src/routes/index.tsx`:

```typescript
function RootRedirect() {
  const cookieLang = document.cookie.match(/lang=(zh-CN|zh-TW|en)/)?.[1];
  const browserLang = navigator.language;
  const target = cookieLang
    ?? (browserLang.startsWith("zh") && browserLang.includes("TW") ? "zh-TW"
        : browserLang.startsWith("zh") ? "zh-CN"
        : browserLang.startsWith("en") ? "en"
        : DEFAULT_LOCALE);
  return <Navigate to={`/${target}`} replace />;
}
```

---

## 三、假设与决策记录

### 关键决策

1. **路由策略**:URL 前缀 `/:locale/...`(用户确认)。原因:SEO 友好,可分享特定语言链接,搜索引擎可独立收录。
2. **翻译范围**:全量(用户确认)。UI + 8 个数据文件 + 文章正文 + 内联字符串全部翻译。
3. **图片处理**:为每种语言重生(用户确认)。含中文艺术字的图片,繁体/英文版本独立生成。
4. **数据文件组织**:按 locale 拆分为 `data/{module}/{module}.{locale}.ts`,保留 TypeScript 类型安全。
5. **i18n 库**:`react-i18next` + `i18next`,社区主流、生态成熟、支持命名空间。
6. **SEO 库**:`react-helmet-async`,React 18 兼容、SSR 友好。
7. **URL slug 策略**:新闻分类 tag 改为英文 slug(`company-news` / `product-news` / `industry-news`),显示用 i18n key 翻译。URL 稳定且符合 SEO。
8. **持久化**:cookie + URL 双源,URL 为权威。不使用 localStorage。
9. **默认 locale**:`zh-CN`(原项目主语言)。
10. **文章 id 跨语言一致**:同篇文章在三种语言下 id 相同,便于跨语言链接与同步。
11. **证书图处理**:证书内容多为中文,繁体版保留中文(繁体化后),英文版保留原图 + HTML 叠加英文说明(不重生)。
12. **字体栈**:zh-CN/zh-TW 保留 DingTalk JinBuTi + MiSans(中文进步体),en 切换为 Inter + system-ui。
13. **mock 用户数据**:`mockUsers.ts` 的 nickname 等用户内容不翻译(属于用户生成内容范畴)。

### 假设

- 假设速创 API gpt-image-2 模型可生成含特定中文/英文文字的图片(项目已多次使用,验证可行)。
- 假设项目无 SSR 需求(纯 SPA),`react-helmet-async` 在客户端渲染足够。
- 假设文章翻译由人工/AI 翻译工具产出,本计划不规定翻译流程,仅规定文件结构与接入方式。
- 假设 Supabase 后端返回的错误 message 为英文 code(如 `invalid_credentials`),由前端翻译;若后端返回中文,需在后端或仓储层转换。

### 待办风险

- **文章翻译工作量极大**:3867 行 × 2 种语言 = 7734 行翻译,可能需要分批进行。建议 MVP 阶段先翻译标题+摘要,正文标记为「翻译中」,提供 fallback 到 zh-CN。
- **图片重生失败风险**:速创 API 偶有超时(参考 memory 记录),需准备 fallback prompt。
- **i18n key 命名冲突**:建议建立命名规范文档,如 `namespace:section.subsection.field`。

---

## 四、验证步骤

### 4.1 编译验证

```bash
npx tsc --noEmit       # TypeScript 类型检查
npx vite build         # 生产构建
```

### 4.2 功能验证(Playwright)

针对每种 locale (`/zh-CN/`、`/zh-TW/`、`/en/`) 执行:

1. 访问 `/` 应重定向到 `/zh-CN/`(或 cookie/浏览器语言对应的 locale)
2. 访问 `/zh-TW/about` 页面所有可见文字为繁体中文
3. 访问 `/en/product` 页面所有可见文字为英文
4. 在 `/zh-CN/product` 页面点击 Header 语言切换器选「English」→ URL 跳转到 `/en/product`,所有文字切换为英文
5. 在 `/en/about` 刷新页面,locale 保持英文
6. 访问 `/zh-CN/news/category/company-news` 显示「公司资讯」标签;切换到 `/en/news/category/company-news` 显示「Company News」
7. 访问 `/zh-TW/login` 表单校验消息为繁体中文
8. 访问 `/en/login` 输入错误手机号,提示「Please enter a valid phone number」
9. 检查 `<html lang="...">` 与当前 locale 一致
10. 检查页面 `<title>` 与 locale 一致
11. 检查 hreflang 标签包含所有 3 个 locale
12. 检查 `hero_invest.png` 在不同 locale 下加载不同图片

### 4.3 SEO 验证

- 用 `curl` 或浏览器开发者工具查看每种 locale 的 HTML 源码,确认 `<title>` / `<meta description>` / `<link rel="alternate">` 正确
- Google Rich Results Test 验证 hreflang 配置

### 4.4 视觉验证

- 1920px / 1200px / 768px / 375px 四种视口下,3 种 locale 页面布局无破版
- 英文版本字号是否需要调整(英文通常比中文长 20-30%,部分容器可能溢出)

### 4.5 回归验证

- 原有中文版本(zh-CN)功能与改造前一致
- 登录/注册流程在 3 种 locale 下均正常
- 鉴权状态在切换语言后保持(因为 locale 在 URL,auth 在 Context)

---

## 五、实施顺序建议

按依赖关系,推荐顺序:

1. **阶段 1**:i18n 基础设施(库 + 目录 + Provider)
2. **阶段 2**:路由层改造(占位翻译文件,UI 暂时显示 key)
3. **阶段 4**:共享 layout 组件抽取(Header/Footer/FloatingTools — 切换器实际工作)
4. **阶段 3**:数据文件拆分(逐个文件迁移)
5. **阶段 4 续**:页面组件抽取(逐页迁移,可并行多个页面)
6. **阶段 7**:表单与鉴权消息
7. **阶段 8**:字体栈 + URL slug 策略
8. **阶段 5**:SEO meta 动态化
9. **阶段 6**:图片重生(可与上述并行,不阻塞功能)
10. **阶段 9**:持久化与重定向优化

每个阶段完成后执行 `npx tsc --noEmit` + 浏览器手测,小步前进。

---

## 六、影响范围概览

| 文件类别 | 修改文件数 | 备注 |
|---|---|---|
| 新增 i18n 文件 | ~30 | `src/i18n/` 下 3 套 locale × 9 个命名空间 + index/types/Context |
| 新增 data 子目录 | 8 | `src/data/{module}/` 各含 3 个 locale 文件 + index |
| 修改页面组件 | 11 | `src/pages/*.tsx` 全部 |
| 修改 layout 组件 | 4 | `Header` / `Footer` / `FloatingTools` / `PageHero` |
| 修改路由 | 2 | `routes/index.tsx` / `routes/paths.ts` |
| 修改 config | 3 | `navigation.ts` / `footer.ts` / `site.ts` |
| 修改 data images | ~11 | `src/data/images/*.ts` 全部 |
| 修改鉴权 | 3 | `AuthContext.tsx` / `authRepository.ts` / `mockUsers.ts`(仅消息) |
| 修改入口 | 2 | `main.tsx` / `index.html` |
| 新增 SEO 组件 | 1 | `src/components/SEO.tsx` |
| 新增 hooks | 1 | `src/hooks/useLocaleData.ts` |
| 重生图片 | ~5-10 | 仅含中文艺术字的关键图片 |
| 新增依赖 | 3 | `i18next` / `react-i18next` / `react-helmet-async` |

**估算**:约 60-70 个文件变更,新增代码量约 8000-12000 行(主要为翻译 JSON)。

---

## 七、关键文件路径速查

- 入口:`src/main.tsx` / `src/App.tsx`
- 路由:`src/routes/index.tsx` / `src/routes/paths.ts`
- HTML 模板:`index.html`
- 配置:`src/config/site.ts` / `navigation.ts` / `footer.ts`
- 数据:`src/data/*.ts`(将拆为子目录)及 `src/data/images/*.ts`
- 共享组件:`src/components/layout/*.tsx`
- 页面:`src/pages/*.tsx`
- 鉴权:`src/contexts/AuthContext.tsx` / `src/data/authRepository.ts` / `src/data/mockUsers.ts` / `src/lib/supabase.ts`
- 招商 Hero 图(含中文艺术字):`public/images/hero/hero_invest.png`
- 字体栈硬编码:`src/components/layout/PageHero.tsx` 第 131-133 行
- 语言切换器:`src/components/layout/Header.tsx` 第 88-100 行 + 第 163-220 行
- `LANGUAGE_OPTIONS` 常量:`src/config/navigation.ts` 第 48-52 行

---

## 八、实施进度（2026-07-25 续作盘点）

### ✅ 已完成

| 阶段 | 内容 | 状态 |
|---|---|---|
| 阶段 1 | i18n 基础设施（i18next + react-i18next + react-helmet-async + 3 locales × 10 namespaces JSON） | ✅ |
| 阶段 2 | URL 前缀路由 `/:locale/...` + 智能根路径重定向（cookie > 浏览器语言 > 默认） | ✅ |
| 阶段 5 | SEO 组件（动态 title/description/hreflang/canonical/og:locale） | ✅ |
| 阶段 8.1 | PageHero 字体栈 locale-aware（zh-CN/zh-TW 钉钉进步体+MiSans；en Inter） | ✅ |
| 阶段 9 | Header 语言切换器实际跳转 + cookie 持久化 | ✅ |
| 阶段 4-A | Header / Footer / FloatingTools / PageHero 全部 i18n | ✅ |
| 阶段 4-B 部分 | HomePage / LoginPage / RegisterPage / NotFoundPage 全部 i18n | ✅ |
| 阶段 3 部分 | home.ts 中 HERO_PRODUCTS 改为 i18n key | ✅ |
| 阶段 7 部分 | LoginPage / RegisterPage 表单消息 i18n | ✅ |

**当前 `npx tsc --noEmit` 通过**（exit code 0）

### ❌ 剩余工作

#### 阶段 3：8 个数据文件按 locale 拆分（最大工作量）

| 数据文件 | 状态 | 备注 |
|---|---|---|
| `home.ts` | 部分 | HERO_PRODUCTS 已改；STATS / TECH_FEATURES / FLAGSHIP_PRODUCT / PRODUCT_SERIES / PRODUCT_CATEGORIES / PARTNERS / QUALIFICATIONS / HEARING_RESEARCH / NEWS_LIST / NEWS_CATEGORIES / NEWS_CATEGORY_MAP 未改 |
| `about.ts` | 未开始 | 11 section 全硬编码中文 |
| `product.ts` | 未开始 | 服务卡片 + SVG text |
| `wearable.ts` | 未开始 | 产品规格 + 特性卡片 |
| `invest.ts` | 未开始 | 招商模块多 |
| `careers.ts` | 未开始 | 岗位列表 + 福利标签 |
| `service.ts` | 未开始 | 服务页数据 |
| `articles.ts` | 未开始 | 3867 行；建议仅翻译 NEWS_LIST，详情页正文留 fallback |

#### 阶段 4-B：7 个页面内联中文抽取

| 页面 | 内联中文估算 | 备注 |
|---|---|---|
| NewsListPage | ~少量 | 仅余「暂无相关资讯」等空状态文案 |
| NewsDetailPage | ~260 | 作者/日期/相关推荐 |
| AboutPage | ~1378 | 11 section |
| CareersPage | ~667 | 岗位/福利/流程 |
| WearablePage | ~624 | 产品规格/特性 |
| InvestPage | ~1746 | 招商模块 |
| ProductPage | ~2635 | 最大；含 SVG `<text>` |

#### 阶段 6：含中文艺术字图片多语言重生

- `public/images/hero/hero_invest.png`（含「声价千亿 聚势共赢」）→ zh-TW / en 重生
- 盘点其他可能含中文文字的图片（证书图、团队照、banner 标题图等）
- `src/data/images/*.ts` 改为 `Record<Locale, string>`，消费方用 `useLocaleData(IMAGES.xxx)`

#### 阶段 7：鉴权消息收尾

- 检查 `AuthContext.tsx` 错误码替换
- 检查 `authRepository.ts` 错误消息替换

#### 阶段 8.2：新闻分类 URL slug 英文化

- 当前 `NEWS_CATEGORIES = ["公司新闻", "产品资讯", "行业资讯"]` 中文 slug
- 改为英文 slug `company-news` / `product-news` / `industry-news`
- 建立 slug → 三语言显示名映射表

#### 最终验证

- `npx tsc --noEmit`（当前 ✅）
- `npx vite build`
- 三种 locale 手测 + Playwright 自动化验证

---

## 九、剩余工作执行计划

### 优先级排序（按依赖关系 + 用户价值）

**P0 - 数据层与页面层并行推进（核心工作量）**

按页面复杂度 + 数据量分级处理，每完成一页即编译验证：

| 顺序 | 页面 | 数据文件 | 内联中文估算 | 备注 |
|---|---|---|---|---|
| 1 | NewsListPage 收尾 + NewsDetailPage | home.ts (NEWS_*) + articles.ts (兜底) | ~600 | 顺带完成阶段 8.2 URL slug 英文化 |
| 2 | AboutPage | about.ts | ~1378 | 含 11 section，结构清晰 |
| 3 | CareersPage | careers.ts | ~667 | 岗位列表 + 福利标签 |
| 4 | WearablePage | wearable.ts | ~624 | 产品规格 + 特性卡片 |
| 5 | InvestPage | invest.ts | ~1746 | 招商模块多 |
| 6 | ProductPage | product.ts + service.ts | ~2635 | 最复杂，含 SVG `<text>` |

**P1 - 图片多语言重生（阶段 6）**

- 盘点 `public/images/` 全部图片，标注含中文文字的图
- 用速创 API gpt-image-2 为 zh-TW / en 重生 `hero_invest.png` 等关键图
- `src/data/images/*.ts` 改为 `Record<Locale, string>`，消费方用 `useLocaleData(IMAGES.xxx)`

**P2 - 鉴权消息收尾（阶段 7）**

- 检查 `AuthContext.tsx` / `authRepository.ts` 错误码替换为 i18n key

**P3 - 最终验证**

- `npx tsc --noEmit` + `npx vite build`
- Playwright 三 locale 跑通：首页 / 关于 / 产品 / 登录 / 资讯分类切换 / 语言切换器

### 关键决策点（用户已确认 2026-07-25）

1. **`articles.ts` 翻译策略**：✅ **方案 A** - 仅翻译 `NEWS_LIST`（列表项 title/summary），详情页 `NewsDetailPage` 已有兜底逻辑显示外链摘要，正文暂不翻译，留 fallback 到 zh-CN

2. **图片重生范围**：✅ **仅 `hero_invest.png`** - 仅重生招商页 hero 图（含「声价千亿 聚势共赢」艺术字），其他证书图保留原图，团队照无中文文字

3. **执行节奏**：✅ **逐页推进** - 按 P0 顺序：News → About → Careers → Wearable → Invest → Product，每页完成后立即 `npx tsc --noEmit` 验证

### 验证检查点

每完成一个页面 + 对应数据文件后：

```bash
npx tsc --noEmit       # 必须通过
```

每完成一个阶段后：

```bash
npx vite build         # 生产构建
```

最终交付前：

- Playwright 跑通三种 locale 关键路径
- 视觉验证 1920/1200/768/375 四种视口
- hreflang 标签 + `<html lang>` 一致性核对

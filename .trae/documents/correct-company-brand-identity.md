# 纠正公司/品牌身份混淆 — 实施计划

## 背景与目标

**用户反馈**: 这个项目是【小维健康科技】的公司官网,不是大声助听器的官网。大声只是公司旗下的一个品牌(另一个是 SKYWORTH 创维),但网页里很多信息把"大声助听器"当成了站点身份,需要纠正。

**核心问题**: 项目目前的"外壳"(title/manifest/JSON-LD/og:site_name/llms.txt/copyright 等)被错误定位为"大声助听器官网",而内容层(about/careers/faq/news 正文)已正确写明"小维健康科技...旗下拥有 SKYWORTH 创维、Bigsound 大声 两大品牌"。需要让外壳与内容层对齐。

**最终定位**:
- **公司(站点身份)**: 小维健康科技(深圳)有限公司 — 站点身份、版权、JSON-LD Organization 的主体
- **旗下品牌 1**: Bigsound 大声 — AI 中文助听器产品线
- **旗下品牌 2**: SKYWORTH 创维 — 健康智能手表/儿童手表/蓝牙耳机产品线

## 用户已确认的决策

1. **站点名称分层使用**:
   - 短称"小维健康科技" → 用于 `title` / `manifest name` / `og:site_name` / `header logoAlt` / `WebSite schema name` 等显示场景
   - 全称"小维健康科技(深圳)有限公司" → 用于 `copyright` / `legalName` / 法律声明 / `<meta author>`

2. **Logo 处理**: 当前 `public/images/common/logo.png` 已是小维健康科技 logo,**只需更新 alt/aria-label 文案,图片保留不动**。

3. **页面 title 后缀**: 统一用公司名"- 小维健康科技"(zh-CN) / "- 小維健康科技"(zh-TW) / "- Xiaowei Health Tech"(en)。

## 当前状态分析(已识别的混淆清单)

### A. 站点身份层(最严重)— 把"大声助听器"当站点身份

| 文件 | 字段/位置 | 当前值(错误) |
|---|---|---|
| `src/config/site.ts` | `SITE_INFO.name` | `"大声 AI中文助听器"` |
| `src/config/site.ts` | `SITE_INFO.brand` | `"Bigsound大声"` (作为站点 brand 用错) |
| `index.html` | `<title>` | `"大声AI中文助听器，大声听力服务中心"` |
| `index.html` | `<meta name="description">` | 以"大声AI中文助听器"开头 |
| `index.html` | JSON-LD Organization `name` | `"大声助听器"` |
| `index.html` | JSON-LD Organization `description` | "大声助听器 (Bigsound) 是小维健康科技旗下..." (品牌定位描述,被错放在 Organization 实体上) |
| `index.html` | JSON-LD WebSite `name` | `"大声助听器官网"` |
| `index.html` | JSON-LD WebSite `alternateName` | `"Bigsound 官网"` |
| `index.html` | JSON-LD MedicalBusiness `name` | `"大声听力服务中心"` (此条正确,服务中心是大声品牌下属,保留) |
| `src/components/SEO.tsx` | `og:site_name` | `"大声助听器 Bigsound"` |
| `src/config/schema.ts` | `getOrganizationSchema().name` | `"大声助听器"` |
| `src/config/schema.ts` | `getOrganizationSchema().description` | "大声助听器 (Bigsound) 是小维健康科技旗下..." |
| `src/config/schema.ts` | `getWebsiteSchema().name` | `"大声助听器官网"` |
| `src/config/schema.ts` | `getWebsiteSchema().alternateName` | `"Bigsound 官网"` |
| `public/site.webmanifest` | `name` | `"大声AI中文助听器 - 大声听力服务中心"` |
| `public/site.webmanifest` | `short_name` | `"大声助听器"` |
| `public/site.webmanifest` | `description` | `"小维健康旗下听力健康服务品牌..."` (定位错,应反映公司) |
| `public/robots.txt` | 头部注释 | `"# 大声助听器 (Bigsound) - robots.txt"` |
| `public/llms.txt` | 标题 | `"# 大声助听器 (Bigsound)"` |
| `public/llms.txt` | 公司简介段 | "品牌名: 大声助听器 (Bigsound / Dasound)" (应改为"公司名: 小维健康科技... 旗下品牌: SKYWORTH创维、Bigsound大声") |
| `public/llms-full.txt` | 标题 | `"# 大声助听器 (Bigsound) — 完整品牌文档"` |

### B. 页面 title 后缀(全站统一错)— 10 个页面 × 3 个 locale

`src/i18n/locales/{zh-CN,zh-TW,en}/meta.json` 中所有非 home 页面的 title 后缀:

| 页面 | zh-CN 当前 | zh-TW 当前 | en 当前 |
|---|---|---|---|
| about | 关于小维 - 大声助听器 | 關於小維 - 大聲助聽器 | About - Dasound Hearing Aid |
| product | AI 中文助听器 - 大声助听器 | AI 中文助聽器 - 大聲助聽器 | AI Chinese Hearing Aid - Dasound |
| wearable | 健康智能穿戴 - **大声** | 健康智能穿戴 - **大聲** | Health Wearables - Dasound |
| invest | 招商加盟 - 大声助听器 | 招商加盟 - 大聲助聽器 | Partnership - Dasound Hearing Aid |
| careers | 人才招聘 - 大声助听器 | 人才招聘 - 大聲助聽器 | Careers - Dasound Hearing Aid |
| news | 资讯中心 - 大声助听器 | 資訊中心 - 大聲助聽器 | News - Dasound Hearing Aid |
| newsDetail | {{title}} - 大声助听器 | {{title}} - 大聲助聽器 | {{title}} - Dasound Hearing Aid |
| faq | 常见问题 FAQ - 大声助听器 | 常見問題 FAQ - 大聲助聽器 | FAQ - Dasound Hearing Aid |
| login | 登录 - 大声助听器 | 登入 - 大聲助聽器 | Log in - Dasound Hearing Aid |
| register | 注册 - 大声助听器 | 註冊 - 大聲助聽器 | Sign up - Dasound Hearing Aid |
| notFound | 页面未找到 - 大声助听器 | 頁面未找到 - 大聲助聽器 | Page not found - Dasound Hearing Aid |

`home.title` 也需调整:
- zh-CN: "大声AI中文助听器，大声听力服务中心" → 改为以小维健康科技为主体的表述
- zh-TW: 同上
- en: "Dasound AI Chinese Hearing Aid | Dasound Hearing Service Center" → 改为以 Xiaowei Health Tech 为主体的表述

### C. Header / Footer / 通用视觉文案

`src/i18n/locales/{zh-CN,zh-TW,en}/common.json`:

| 字段路径 | zh-CN 当前 | zh-TW 当前 | en 当前 |
|---|---|---|---|
| `header.logoAlt` | 大声 Bigsound 中文助听器 | 大聲 Bigsound 中文助聽器 | Dasound Bigsound AI Hearing Aid |
| `header.logoAriaLabel` | Bigsound 大声 | Bigsound 大聲 | Dasound Bigsound |
| `footer.copyright` | © {{year}} 大声助听器 保留所有权利 | © {{year}} 大聲助聽器 保留所有權利 | © {{year}} Dasound Hearing Aid. All rights reserved. |
| `notFound.logoAlt` | 大声 | 大聲 | Dasound |
| `alt.logo` | 大声 Bigsound logo | 大聲 Bigsound logo | Dasound Bigsound logo |

### D. 默认作者(news.json)

`src/i18n/locales/{zh-CN,zh-TW,en}/news.json` 的 `defaultAuthor` 字段:
- zh-CN: `"大声"` → `"小维健康科技"`
- zh-TW: `"大聲"` → `"小維健康科技"`
- en: `"Dasound"` → `"Xiaowei Health Tech"`

### E. 已正确表达的内容(无需修改,作为参考)

- `src/i18n/locales/zh-CN/about.json` §xiaoweiHealth.paragraphs.0: "旗下拥有 [ SKYWORTH 创维 ] 、[ Bigsound 大声 ] 两大品牌" ✓
- `src/i18n/locales/zh-CN/careers.json` companyIntroTitle: "小维健康科技" ✓
- `src/i18n/locales/zh-CN/faq.json` 品牌背景问答: "大声助听器 (Bigsound / Dasound) 是小维健康科技(深圳)有限公司旗下 AI 中文助听器品牌" ✓
- `src/i18n/locales/zh-CN/news.json` 各 title: 已正确区分"小维健康科技"(公司层面) vs "创维大声"(品牌层面) ✓
- `src/config/site.ts` `parentCompany` / `copyright` / `companyAddress` 字段已正确使用小维健康科技 ✓
- `index.html` `<meta author>`: "小维健康科技(深圳)有限公司" ✓
- `public/llms-full.txt` §二、母公司背景正文: 已正确写"小维健康科技...旗下拥有 [SKYWORTH 创维] 与 [Bigsound 大声] 两大品牌" ✓

## 实施方案

### 阶段 1: 站点身份层纠正(核心)

#### 1.1 修改 `src/config/site.ts`

```typescript
export const SITE_INFO = {
  name: "小维健康科技",                              // 原: "大声 AI中文助听器"
  brand: "小维健康科技",                              // 原: "Bigsound大声" — 站点层 brand 用公司名
  parentCompany: "小维健康科技（深圳）有限公司",       // 保留不变
  /* 旗下两大品牌(新增字段,用于品牌矩阵展示) */
  subBrands: {
    dasound: "Bigsound 大声",                         // AI 中文助听器品牌
    skyworth: "SKYWORTH 创维",                        // 健康智能穿戴品牌
  },
  // ... 其余字段保留不变
} as const;
```

#### 1.2 修改 `index.html`

- `<title>`: "大声AI中文助听器，大声听力服务中心" → "小维健康科技官网 - 创维生态下的健康科技公司"
- `<meta name="description">`: 改为以小维健康科技开头,例: "小维健康科技(深圳)有限公司 — 创维生态旗下的健康科技公司,旗下拥有 Bigsound 大声 与 SKYWORTH 创维 两大品牌,主营 AI 中文助听器、健康智能手表、儿童电话手表、蓝牙耳机等穿戴类产品"
- `<meta name="keywords">: 增加"小维健康科技,SKYWORTH创维"
- JSON-LD Organization `name`: "大声助听器" → "小维健康科技"
- JSON-LD Organization `alternateName`: "Bigsound" → "Xiaowei Health Tech"
- JSON-LD Organization `description`: 改为公司级描述(覆盖两大品牌),原"大声助听器 (Bigsound) 是小维健康科技旗下 AI 中文助听器品牌..." → "小维健康科技(深圳)有限公司是创维集团旗下专注于智能穿戴设备、声学和听力健康系统研发、生产和营销一体化的高科技医疗器械与服务公司,旗下拥有 SKYWORTH 创维 与 Bigsound 大声 两大品牌"
- JSON-LD Organization `brand`: 由单个 `{ "@type": "Brand", "name": "Bigsound 大声" }` 改为数组形式,包含两个品牌
- JSON-LD WebSite `name`: "大声助听器官网" → "小维健康科技官网"
- JSON-LD WebSite `alternateName`: "Bigsound 官网" → "Xiaowei Health Tech 官网"
- JSON-LD MedicalBusiness `name`: "大声听力服务中心" **保留不变**(此为大声品牌下属的服务中心,定位正确)

#### 1.3 修改 `src/components/SEO.tsx`

- 第 107 行 `<meta property="og:site_name" content="大声助听器 Bigsound" />` → content 改为 `"小维健康科技 Xiaowei Health Tech"`

#### 1.4 修改 `src/config/schema.ts`

- `getOrganizationSchema()`:
  - `name: "大声助听器"` → `name: "小维健康科技"`
  - `alternateName: "Bigsound"` → `alternateName: "Xiaowei Health Tech"`
  - `description`: 同 1.2 的 JSON-LD Organization description 修改
  - `brand`: 改为数组形式或 `Brand` 列表,包含 SKYWORTH 创维 与 Bigsound 大声 两个品牌
- `getWebsiteSchema()`:
  - `name: "大声助听器官网"` → `name: "小维健康科技官网"`
  - `alternateName: "Bigsound 官网"` → `alternateName: "Xiaowei Health Tech 官网"`

#### 1.5 修改 `public/site.webmanifest`

- `name`: "大声AI中文助听器 - 大声听力服务中心" → "小维健康科技官网"
- `short_name`: "大声助听器" → "小维健康"
- `description`: "小维健康旗下听力健康服务品牌..." → "小维健康科技(深圳)有限公司 — 创维生态下的健康科技公司,旗下拥有 Bigsound 大声 与 SKYWORTH 创维 两大品牌"

#### 1.6 修改 `public/robots.txt`

- 第 1 行注释: "# 大声助听器 (Bigsound) - robots.txt" → "# 小维健康科技 - robots.txt"

#### 1.7 修改 `public/llms.txt`

- 第 1 行标题: "# 大声助听器 (Bigsound)" → "# 小维健康科技 (Xiaowei Health Tech)"
- 第 3 行引言: "小维健康科技(深圳)有限公司旗下 AI 中文助听器品牌..." → 改为公司级描述,涵盖两大品牌
- 第 6-7 行"公司简介"段: 
  - 原: "品牌名: 大声助听器 (Bigsound / Dasound)" / "母公司: 小维健康科技(深圳)有限公司..."
  - 改: "公司名: 小维健康科技(深圳)有限公司" / "旗下品牌: Bigsound 大声 (AI 中文助听器) / SKYWORTH 创维 (健康智能手表、儿童手表、蓝牙耳机)" / "母集团: 创维集团(00751.HK / 创维数字 000810.SZ)"
- 第 17-19 行"核心产品"段: 保留产品链接,但描述需明确品牌归属(助听器→大声,穿戴→SKYWORTH创维)
- 第 68-69 行"关于小维"段: 保留不变(已正确)

#### 1.8 修改 `public/llms-full.txt`

- 第 1 行标题: "# 大声助听器 (Bigsound) — 完整品牌文档" → "# 小维健康科技 — 完整品牌文档"
- 第 3 行引言: "本文档供 AI 搜索引擎...内容均来源于大声助听器官网 https://www.bigsound.cc 真实页面" → "...内容均来源于小维健康科技官网 https://www.bigsound.cc 真实页面"
- §一、品牌定位: 整段保留不变(已正确描述"大声助听器 (Bigsound / Dasound) 是小维健康科技(深圳)有限公司旗下 AI 中文助听器品牌")
- §二、母公司背景: 保留不变(已正确)
- 其余各节内容保留不变

### 阶段 2: 页面 title 后缀统一纠正

#### 2.1 修改 `src/i18n/locales/zh-CN/meta.json`

后缀统一改为 "- 小维健康科技"。具体改动:

| 页面 key | 新 title |
|---|---|
| home.title | 小维健康科技官网 - 创维生态下的健康科技公司 |
| home.description | 小维健康科技(深圳)有限公司,创维生态旗下健康科技公司,拥有 Bigsound 大声 与 SKYWORTH 创维 两大品牌,主营 AI 中文助听器、健康智能手表、蓝牙耳机等 |
| home.keywords | (增加) 小维健康科技,SKYWORTH创维,Bigsound大声 + 原 keywords |
| about.title | 关于小维 - 小维健康科技 |
| product.title | AI 中文助听器 - 小维健康科技 |
| wearable.title | 健康智能穿戴 - 小维健康科技 |
| invest.title | 招商加盟 - 小维健康科技 |
| careers.title | 人才招聘 - 小维健康科技 |
| news.title | 资讯中心 - 小维健康科技 |
| newsDetail.title | {{title}} - 小维健康科技 |
| faq.title | 常见问题 FAQ - 小维健康科技 |
| login.title | 登录 - 小维健康科技 |
| register.title | 注册 - 小维健康科技 |
| notFound.title | 页面未找到 - 小维健康科技 |

`about.description` / `product.description` / `wearable.description` 等正文中提到"大声助听器"作为品牌定位的描述**保留不变**(那些是品牌层描述,正确)。

#### 2.2 修改 `src/i18n/locales/zh-TW/meta.json`

同 2.1,后缀统一改为 "- 小維健康科技":
- home.title: 小維健康科技官網 - 創維生態下的健康科技公司
- 各页 title 后缀: - 小維健康科技
- 各页 keywords: 增加"小維健康科技,SKYWORTH創維,Bigsound大聲"

#### 2.3 修改 `src/i18n/locales/en/meta.json`

后缀统一改为 "- Xiaowei Health Tech":
- home.title: Xiaowei Health Tech - Health Tech Company under Skyworth Ecosystem
- 各页 title 后缀: - Xiaowei Health Tech
- 各页 keywords: 增加 "Xiaowei Health Tech, SKYWORTH, Bigsound"

### 阶段 3: Header / Footer / 通用视觉文案纠正

#### 3.1 修改 `src/i18n/locales/zh-CN/common.json`

| 字段路径 | 新值 |
|---|---|
| header.logoAlt | "小维健康科技 logo" |
| header.logoAriaLabel | "小维健康科技" |
| footer.copyright | "© {{year}} 小维健康科技（深圳）有限公司 版权所有" |
| notFound.logoAlt | "小维健康" |
| alt.logo | "小维健康科技 logo" |

#### 3.2 修改 `src/i18n/locales/zh-TW/common.json`

| 字段路径 | 新值 |
|---|---|
| header.logoAlt | "小維健康科技 logo" |
| header.logoAriaLabel | "小維健康科技" |
| footer.copyright | "© {{year}} 小維健康科技（深圳）有限公司 版權所有" |
| notFound.logoAlt | "小維健康" |
| alt.logo | "小維健康科技 logo" |

#### 3.3 修改 `src/i18n/locales/en/common.json`

| 字段路径 | 新值 |
|---|---|
| header.logoAlt | "Xiaowei Health Tech logo" |
| header.logoAriaLabel | "Xiaowei Health Tech" |
| footer.copyright | "© {{year}} Xiaowei Health Tech (Shenzhen) Co., Ltd. All rights reserved." |
| notFound.logoAlt | "Xiaowei Health" |
| alt.logo | "Xiaowei Health Tech logo" |

### 阶段 4: 默认作者纠正

#### 4.1 修改 `src/i18n/locales/zh-CN/news.json`
- `defaultAuthor`: "大声" → "小维健康科技"

#### 4.2 修改 `src/i18n/locales/zh-TW/news.json`
- `defaultAuthor`: "大聲" → "小維健康科技"

#### 4.3 修改 `src/i18n/locales/en/news.json`
- `defaultAuthor`: "Dasound" → "Xiaowei Health Tech"

### 阶段 5: 编译产物同步(dist 目录)

`dist/` 是构建产物,会在下次 `vite build` 时自动重新生成。**不需要手动改 dist 目录文件**,但需要执行构建命令刷新 dist。

## 假设与决策

1. **假设域名不变**: 域名仍是 `bigsound.cc`(已备案,变更域名涉及工信部备案迁移,不在本次范围)。llms.txt 等文档中的 URL 保留 `https://www.bigsound.cc` 不变,仅修改品牌/公司名称文案。

2. **假设保留原视频/图片资产**: `public/videos/promo.mp4` 等媒体资产不在本次修改范围。

3. **决策: MedicalBusiness schema 保留"大声听力服务中心"名称**: 该 schema 描述的是大声品牌下属的听力服务中心(直营门店),不是站点身份。其 `name` 字段保留"大声听力服务中心"是正确的品牌-服务层级表达。

4. **决策: 大声品牌页面内容不修改**: `product.json` 中产品描述、`faq.json` 中关于大声助听器的问答、`invest.json` 中"创维生态 · 大声助听器 — 全国城市合伙人招募中"等**保留不变**(这些是品牌层面的正确表达,本次只改站点身份层)。

5. **决策: `index.html` 中的 `email: "service@dasound.cn"` 保留不变**: 该邮箱是大声品牌客服邮箱,在 JSON-LD Organization 上作为联系方式保留是合理的(公司可拥有多个品牌联系方式)。

6. **决策: 不修改 `src/data/about.ts` / `src/data/articles.ts` 等数据文件**: 这些数据文件中的 i18n key 引用不变,仅 i18n 翻译文案变化。

7. **决策: 暂不新增"小维健康科技logo"图片资源**: 用户确认现有 logo.png 即是小维健康科技 logo,只需更新 alt 文案。

## 实施顺序

1. **阶段 1**: 站点身份层(site.ts → index.html → SEO.tsx → schema.ts → webmanifest → robots.txt → llms.txt → llms-full.txt)
2. **阶段 2**: meta.json 三套 locale 的 title 后缀
3. **阶段 3**: common.json 三套 locale 的 logo alt / copyright / notFound
4. **阶段 4**: news.json 三套 locale 的 defaultAuthor
5. **阶段 5**: 运行 `npx tsc --noEmit` + `npx vite build` 验证,刷新 dist

## 验证步骤

### 5.1 编译验证
```bash
npx tsc --noEmit     # TypeScript 类型检查
npx vite build       # 构建产物,验证无运行时错误
```

### 5.2 浏览器手动验证
访问以下路径,确认 title / 版权 / logo alt 已更新:
- http://localhost:5173/zh-CN/ (首页)
- http://localhost:5173/zh-CN/about (关于小维)
- http://localhost:5173/zh-CN/product (产品页)
- http://localhost:5173/zh-CN/wearable (穿戴页)
- http://localhost:5173/zh-CN/invest (招商)
- http://localhost:5173/zh-CN/faq (FAQ)

检查项:
- [ ] 浏览器 tab 标题显示"- 小维健康科技"后缀
- [ ] Header logo 的 aria-label / alt 为"小维健康科技"
- [ ] Footer 版权信息为"© 2026 小维健康科技(深圳)有限公司 版权所有"
- [ ] 查看页面源码,JSON-LD Organization name 为"小维健康科技"
- [ ] 查看页面源码,og:site_name 为"小维健康科技 Xiaowei Health Tech"
- [ ] 切换到 zh-TW / en,验证对应翻译同步更新

### 5.3 文档资源验证
- 访问 http://localhost:5173/site.webmanifest 确认 name/short_name 已更新
- 访问 http://localhost:5173/robots.txt 确认头部注释已更新
- 访问 http://localhost:5173/llms.txt 确认标题与公司简介已更新
- 访问 http://localhost:5173/llms-full.txt 确认标题已更新,正文保留正确的双品牌描述

### 5.4 开发日志更新
在 `DEV_LOG.md` 顶部新增 2026-07-26 条目,记录:
- 类型: 信息架构纠正
- 摘要: 纠正站点身份层把"大声助听器"误用为公司身份的问题,统一改为"小维健康科技"(深圳)有限公司,大声与 SKYWORTH 创维作为旗下两大品牌
- 详细变更: 列出本次涉及的所有文件
- 影响范围: 全站 title / JSON-LD / og:site_name / manifest / llms.txt / 版权信息 / logo alt / 默认作者
- 关联文件: 见上文文件清单

## 不在本次修改范围(明确排除)

- ❌ `src/i18n/locales/*/about.json` §xiaoweiHealth / §skyworthGroup 正文(已正确)
- ❌ `src/i18n/locales/*/careers.json` companyIntro 段落(已正确)
- ❌ `src/i18n/locales/*/faq.json` 关于大声助听器品牌的问答(已正确,品牌层描述)
- ❌ `src/i18n/locales/*/news.json` 各新闻 title(已正确区分公司/品牌层面)
- ❌ `src/i18n/locales/*/product.json` 产品描述中的"大声"字样(品牌层正确)
- ❌ `src/i18n/locales/*/invest.json` 招商正文中"创维生态 · 大声助听器"等品牌联合表述(已正确)
- ❌ `public/videos/promo.mp4` 等媒体资产
- ❌ 域名 / 备案信息 / 医疗资质号 / 公司地址 / 电话等法律层信息
- ❌ `dist/` 目录手工修改(由 vite build 自动刷新)
- ❌ 新增小维健康科技 logo 图片(用户确认现有 logo 即可)

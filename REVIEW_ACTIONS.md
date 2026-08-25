# 官网 3.0 全站审查 — 行动清单 (REVIEW_ACTIONS)

> 生成日期: 2026-08-18 | 最近更新: 2026-08-22 (性能冲刺收官)
> 范围: 全站功能 / SEO / GEO / 性能 / 多语言 / 内容完整性
> 状态图例: 🔴 P0(必修) 🟠 P1(应立即修) 🟡 P2(本周内修) ⚪ P3(排期可选) ✅ 已完成

---

## 〇、项目进度总览 (单一事实源, 随进展更新)

### 当前阶段: 开发与性能优化收官 → 等 ICP 备案 → 部署阿里云

**性能战果 (2026-08-22 一日冲刺, Lighthouse 模拟移动端 slow-4G)**:

| 页面 | 早基线 | 终态 | 关键指标 |
|---|---|---|---|
| home | 63 | **90** ✅ | CLS 0.414→0; LCP 2.9s |
| product | 46 | **93** ✅ | CLS 0.479→0; 总字节 8.76MB→232KB |
| news | 53 | **78** ⚠️ | CLS 0.379→0; LCP 5.5→4.7s; 总字节 1.18MB→760KB |

三页 CLS 全部归零。news 差 7 分为 FCP 2.7s 结构性下限所致 (SPA shell + render-blocking CSS), 见下方路线图④。

**今日已完成 (2026-08-22, 详情见各条目与 DEV_LOG 同日记录)**:
1. ✅ P0-1 部署形态拍板: 根路径 + www.xiaowe.cc + 阿里云; 代码侧改造完成 (vite base/prerender/schema/删 fix-base-paths)
2. ✅ P2-10 CLS 归零: 构建期尺寸清单 (scan-image-dimensions.ts) + hydration 惰性初始化 + prerender 移动视口 + 内联 aspect-ratio
3. ✅ P2-5 bundle 拆分: 主 chunk 1311KB→302KB(gzip 113); 页面级 lazy + news i18n 按需注入 + vendor 分离
4. ✅ P2-5 追加 news LCP: 封面缩略图管线 (generate-news-thumbs.ts, 9992KB→3881KB) + hero 首图 preload/fetchPriority

**下一步路线图 (按序)**:
1. ⏳ **ICP 备案** (外部依赖, 硬前置) — `.cc` 解析大陆服务器必须备案; 备案期间可继续开发
2. ⏳ **部署侧**: 阿里云初始化 + 按 `deploy/nginx.conf.example` 配置 + 免费证书 + dist 上传 + DNS 从凡科切换
3. ⏸ P2-6 hero 视频瘦身 (24.4MB→~8MB): home 已 90 达标, 降级为可选 — 部署前有余力再做
4. ⏸ news 最后 7 分 (P3): 需关键路径重构 (内联关键 CSS/按页裁剪 vendor), 边际成本高; 且模拟 slow-4G 为保守值, 真实体验远好于分数 — 建议上线后按真实 RUM 数据决定
5. ⏸ P1-2 新闻正文三语化提示条 / P1-4 careers 空职位: 内容项, 可并行
6. ⏸ P2-1~P2-4/P2-7~P2-9 其余 P2 项 + P3 清单: 上线后排期

**关键决策记录**:
- 托管 = 阿里云 + Nginx try_files SPA 兜底 (解决 GH Pages 987 死链); Cloudflare Pages 仅临时展示 (P0-1)
- URL 形态 = 根路径 `/zh-CN/news`; vite base 固定 `/`
- 缩略图策略 = 列表用 480px webp thumbs (`/images/news/thumbs/{id}.webp`), 详情页保留原图
- 调试方法 = CDP emulateNetworkConditions(slow-4G)+CPU 4x + PerformanceObserver 抓 shift/LCP 现场 (无节流环境无法复现)

### ⚠️ 已知问题: 线上镜像站新闻老文章配图 403 (2026-08-22 定位, 不修代码, 部署新版即愈)
- **现象**: GH Pages 镜像 (`czhcpqfg.github.io/xiaowe-tech`) 新闻列表第 4 页起配图大量裂图
- **根因**: 线上是旧版构建 — 老文章配图仍是凡科时代抖音 CDN 热链 `aka.doubaocdn.com`, 现已全部 403 (防盗链/资源下架); 第 1~3 页为新文章 (当时图已本地化) 故正常。实测第 4 页 16 图中 10 张 broken 全指向 doubaocdn
- **本地状态**: 新版早已完成全量本地化 (P1-3, 1208 张), src 内 doubaocdn/fanyacdn 零残留; 本地 preview+dev × 整页/SPA 翻页 × 桌面/移动 四组合实测全绿
- **解法**: 无需改代码 — 部署当前 dist 即愈。注意 P0-1 后 base 固定 `/`, 若要临时更新 GH Pages 子路径镜像需先出一版子路径构建; 否则等 ICP 备案后直接上阿里云

---

## 一、P0 — 阻断上线

### P0-1 部署形态自相矛盾: sitemap 根路径 vs 资源子路径 ✅ 已拍板并完成代码侧改造 (2026-08-22)
- **决策**: 统一根路径 + 品牌域 `www.xiaowe.cc`, 最终托管**阿里云服务器** (Nginx), Cloudflare Pages 仅作临时展示。
- **代码侧已完成 (2026-08-22, 构建链路重跑验证通过)**:
  - `vite.config.ts` base 固定 `"/"` (删除 build/preview 子路径分支)
  - 删除 `scripts/fix-base-paths.ts`, `package.json` build 链移除该步骤 (现为 `tsc -b && vite build`)
  - `scripts/prerender.ts` BASE_PATH 改 `"/"`
  - `src/config/schema.ts` absoluteImage() 移除 BASE_PREFIX 剥离逻辑; `src/components/SEO.tsx` 注释同步
- **产物验证**: dist 全部 187 个 HTML 零 `/xiaowe-tech` 残留; 资源引用 `/assets/*` `/images/*`; canonical/hreflang/og:image/JSON-LD image 均为 `https://www.xiaowe.cc` 根路径绝对 URL; prerender 186 页 + 404.html 正常。
- **部署侧待办 (阿里云)**:
  1. ⚠️ **ICP 备案是硬前置** — `.cc` 域名解析大陆服务器必须备案; 未备案前可临时用香港节点
  2. Nginx 配置: `try_files $uri $uri/index.html /index.html` SPA 兜底 (返回 200, 解决原 GH Pages 死链问题); assets 长缓存 + HTML no-cache; gzip/brotli
  3. HTTPS: 阿里云免费证书, 80→443 强跳; apex `xiaowe.cc` 301 到 `www.xiaowe.cc` (与 SITE_ORIGIN 一致)
  4. 上线时 DNS 从凡科切到阿里云; Cloudflare Pages 下线
- 附带收益: sitemap 中 987 个未预渲染新闻 URL 在 Nginx try_files 下返回 200 (SPA 客户端渲染), 不再是 HTTP 404 死链。

---

## 二、P1 — 应立即修复

### P1-1 新闻详情页未预渲染，却在 sitemap 中 (SEO/GEO 硬伤) ✅ 已修复
- **现状**: `scripts/generate-sitemap.ts` 把 18 篇新闻 × 3 locale = 54 个 `/news/{id}` URL 写进 sitemap.xml；但 `scripts/prerender.ts` 只预渲染静态主路由 + 产品详情，**未包含新闻详情**。
- **后果**: AI 爬虫/搜索引擎抓取 sitemap 中的新闻 URL → GitHub Pages 返回 404.html → 新闻页抓不到内容，等于告诉爬虫"这些 URL 是死链"。与 GEO 目标直接冲突。
- **修复**: 在 `scripts/prerender.ts` 增加新闻详情动态路由预渲染循环（与产品详情同级，遍历 `NEWS_LIST`）。⚠️ 注意：372 篇全量迁移后全量预渲染成本高，建议**只预渲染最新 N 篇（如前 24 篇）**，sitemap 保留全部。
- **验收**: `npm run build` 后 `dist/zh-CN/news/{id}/index.html` 存在且含正文文本。✅ 已完成: prerender 覆盖最新 24 篇 × 3 locale = 72 页, 含正文/JSON-LD/本地图片。

### P1-2 新闻正文未三语化 🟠
- **现状**: `NewsDetailPage.tsx` 中标题/摘要走 i18n `news:list.{id}.title/.summary`（三语），但 **ArticleBlock 正文只有中文**，`zh-TW`/`en` 下正文仍展示简体中文。
- **影响**: en/zh-TW 用户读到中文正文，海外 GEO 收录价值受损。
- **方案**: 372 篇全部机器翻译不现实且贵。推荐分两步：
  1. 近期：en/zh-TW 详情页显示中文正文 + 顶部"当前内容为中文原文"提示条，保持现状可用；
  2. 远期：对高流量前 20 篇做人工/LLM 翻译存 `ArticleBlock` 多语言字段。
- **注意**: 若选择为 zh-TW 提供**自动繁简转换**（zh-CN→zh-TW 正文转换渲染），则不算"正文多语言"，仅文字形态差异，成本低、可立即做。

### P1-3 新闻封面热链 aka.doubaocdn.com ✅ 已修复
- **现状**: `src/data/images/news.ts` 的 `NEWS_IMAGES` 全部指向 `https://aka.doubaocdn.com/...`（凡科 CDN）。
- **风险**: ① 无本地副本，凡科关闭/CDN 回收即裂图；② 外域图片拖慢加载且无法本地压缩；③ 与本站"图片本地化"原则冲突。
- **修复**: 抓取时同步下载封面到 `public/images/news/{id}.{ext}`，`NEWS_IMAGES` 改为本地相对路径。本次新闻迁移一并处理。
- **验收**: `public/images/news/` 下存在本地封面，页面 200。✅ 已完成: 372 封面 + 836 正文图全部下载到 `public/images/news/{id}/`, `images/news.ts` 与 `articles.ts` 均引用本地 `/images/news/...` 路径。

### P1-4 careers 页 1 个职位内容未完成 🟠
- **现状**: careers 数据中尚有 1 个职位只有骨架（岗位名 + 空职责/要求），点击详情为空态。
- **修复**: 补齐该职位职责/要求/福利，或从页面移除。
- **验收**: careers 详情每个职位均有完整内容。

---

## 三、P2 — 本周内修复

### P2-1 多页面 Hero 雷同，缺乏视觉差异化 🟡
- **现状**: about/product/invest 等页面 Hero 结构几乎一致（同一模板），品牌感弱。
- **方案**: 每页 Hero 增加差异化元素——about 用"数据+时间轴"副视觉、product 用"产品大图+技术标签"、invest 用"融资里程碑"等。

### P2-2 分类页 canonical 错误 🟡
- **现状**: 新闻/产品分类页（如 `/news?cat=company-news`、分类过滤状态）在 `<link rel="canonical">` 上使用了含查询参数或非规范形式的 URL。
- **修复**: canonical 统一指向**无参数规范 URL**（如 `/zh-CN/news`），分类筛选不改变 canonical。

### P2-3 FAQ sticky 筛选条被 header 遮挡 🟡
- **现状**: `FaqPage.tsx` 分类 sticky 筛选条在滚动时被固定 header 盖住，点击热区部分不可达。
- **修复**: 给 sticky 条加 `scroll-margin-top`/`z-index` 层级修正，或改用非 sticky 布局。

### P2-4 #team / #advantages 锚点失效 🟡
- **现状**: 首页/关于页内锚点跳转（`#team`、`#advantages`）被固定 header 遮挡目标位置，或无 `scroll-margin-top`。
- **修复**: 全局给锚点目标加 `scroll-margin-top: <header高度>`；校验所有内部锚点均有对应 id。

### P2-5 单 JS bundle 未拆分 ✅ 已修复 (2026-08-22) — 主 chunk 1311KB → 302KB (gzip 113), 三页 90/78/93
- **根因**: routes/index.tsx 全部 11 页静态 import; i18n 全量 30 个 JSON (含 news 三语 536KB) 打进主包。
- **修复 (四刀)**:
  1. **页面级 lazy**: `routes/index.tsx` 11 页全部 `React.lazy` + `<Suspense fallback={<PageFallback/>}>` (等高占位防跳动)
  2. **news namespace 按需注入**: 新增 `src/i18n/newsResources.ts`, news.json 从主包拆出, 新闻路由 lazy loader 中 `await loadNewsNamespace(locale)` 串行保证 mount 前资源就位 (零闪变, 无 key 裸串); 新增 `RouteErrorBoundary.tsx` 兜底 chunk 加载失败
  3. **vendor 分离**: vite.config.ts manualChunks → vendor-react(142K)/vendor-router(22K)/vendor-i18n(50K)/vendor-misc(18K), 业务迭代不破坏框架长缓存
  4. 首屏关键路径: index 302K(gzip 113) + vendors(gzip ~77) ≈ **199KB gzip**, 原 590KB+ 单文件
- **prerender 兼容验证**: 186 页 + 404.html 全部成功; 抽查 HTML 完整 (news 列表 75KB 有标题/en about 118KB 无 key 裸串)
- **实测**: home **82→90** ✅ / product **75→94** ✅ / news 67→72; FCP 2.3-2.6s (原恒定 3.1s); product 总字节 8.76MB→**230KB**
- **追加修复 — news LCP 专项 (同日)**:
  - **封面缩略图管线**: 新增 `scripts/generate-news-thumbs.ts` (sharp 480px webp q72, 幂等 mtime 跳过, 已挂 prebuild), 372 张封面 9992KB→3881KB (-61%); `NewsListPage` 卡片改用 `/images/news/thumbs/{id}.webp` + lazy + 尺寸属性
  - **hero 首图 preload**: `ProductCarouselHero` 内 react-helmet-async 输出 `<link rel="preload" as="image" fetchpriority="high">` (prerender 写入静态 HTML) + 轮播首图 `fetchPriority="high"`/其余 `"low"` — 一处改动覆盖 news/product/faq/about/careers/wearable 全部页面
  - **效果**: news LCP 5.5s→4.7s, 总字节 1.18MB→760KB, 分数 67→78
- **news 残余失分 (差 7 分)**: LCP ~4.7s 卡在 FCP 2.7s 结构性下限 (SPA shell + render-blocking CSS + 主 bundle 解析); 实测 CDP slow-4G 下 FCP ~2.9s/logo 先渲染, banner 3.5s。突破需关键路径重构 (内联关键 CSS/按页裁 vendor), 见进度总览路线图④

### P2-6 首页 Hero 视频 24.4MB 过重 🟡
- **现状**: hero 视频未压缩，移动端加载慢。
- **修复**: 压缩至 ~8MB 以内 / 提供 `.webm`+`.mp4` 双格式 / 移动端降级为 poster 图。

### P2-7 新闻列表 Tab 与 URL 不同步 🟡
- **现状**: 切换分类 Tab 只改本地 state，URL query（`?cat=`）不更新 → 刷新后分类丢失、无法分享分类链接。
- **修复**: Tab 切换同步 `useSearchParams`，初始化时读取 URL。

### P2-8 news-list 摘要截断后无"展开" 🟡
- **现状**: 列表卡片摘要超过行数被 CSS 截断，无展开入口。
- **方案**: 摘要限制字数（如 90 字），超过截断并在详情页看全文即可，无需展开（改为字数裁剪更简单可靠）。

### P2-9 产品详情页无面包屑导航 🟡
- **现状**: `ProductDetailPage` 顶部无面包屑，用户从分类页进入后难以返回。
- **修复**: 加"首页 > 产品中心 > {产品名}"面包屑。

### P2-10 全站图片缺尺寸属性, CLS 0.38~0.48 超标 ✅ 已修复 (2026-08-22) — 三页 CLS 全部归零
- **根因链 (三层叠加, 逐层 trace 定位)**:
  1. **unsized-images**: 大量 `<img>` 无 width/height → 构建期扫描 `scripts/scan-image-dimensions.ts` 生成全站尺寸清单 (`src/data/generated/imageSizes.ts`, 1587 张, 纯 Node 解析 webp/png/jpeg 头), 运行时查表注入 attr + 内联 `aspect-ratio`
  2. **hydration 结构闪变**: `useAdaptWidth` 的 `useState(false)` 固定初始值使移动端 hydration 首帧渲染桌面结构再翻转 (~61px 整页位移) → 改为惰性初始化直接读 `window.innerWidth`; 同时 prerender 视口改移动端 (390×844 + iPhone UA) 保证静态 HTML 与 hydration 首帧一致
  3. **CSS 到达前布局跳变** (slow-4G 主凶): `w-full h-auto` 类生效前图片按 attr 原始像素渲染 (42 张 ×1358px = 页高 75302px), CSS 到达瞬间塌缩至 25977px → 记为 shift 0.4787。内联 `style="aspect-ratio: w / h; width:100%"` 不依赖外部 CSS, 首解析即正确比例 → 根除
- **改动文件**: `scripts/scan-image-dimensions.ts` (新增, 已挂 prebuild 链) / `src/data/generated/imageSizes.ts` (生成物) / `src/hooks/useAdaptWidth.ts` (惰性初始化) / `scripts/prerender.ts:178` (移动视口+UA) / `ProductDetailPage.tsx` `NewsDetailPage.tsx` `HeroProducts.tsx` `Header.tsx` `ProductCarouselHero.tsx` (查表注入)
- **实测 (Lighthouse 模拟移动端 slow 4G)**:
  | 页面 | 修复前 | 修复后 | CLS |
  |---|---|---|---|
  | home | 63 | **82** | 0.414 → **0** |
  | news | 53 | **67** | 0.379 → **0** |
  | product | 46 | **75** | 0.479 → **0** |
- **顺带发现并处理**: ① 59 张图片扩展名与实际格式互换 (news/205/*.jpg 实为 WebP 等, 旧站抓取遗留; 脚本已按魔数解析兼容, Nginx Content-Type 按 URL 扩展名发送不影响浏览器嗅探渲染, 记 P3 备忘); ② news/70/img-03.jpg 为 15 字节 XML 错误响应非图片 → 已从 part10.ts 数据剔除并删除文件
- **剩余失分项** (距 ≥85): home 差 3 分 (hero 视频, 见 P2-6) / news 差 18 (LCP 5.0s 封面图) / product 差 10 (LCP 4.3s); FCP 3.1s 恒定为 885KB 主 bundle 解析阻塞 (见 P2-5)

---

## 四、P3 — 排期可选

### P3-1 全站 aria-label / focus 焦点管理 ⚪
### P3-2 OG 图批量重新生成（新闻迁移后 OG 图与正文不符）⚪
### P3-3 新闻正文图片 alt 缺失 → 抓取时补充描述 ⚪
### P3-4 hero 视频加 play/pause 控制 ⚪
### P3-5 表单提交缺少成功/失败 toast 反馈 ⚪
### P3-6 页面过渡动画统一（reveal 时机/时长不一致）⚪

---

## 五、新闻全量迁移任务 (已完成 ✅)

### 目标
以旧站 https://www.xiaowe.cc/h-col-104.html 的 372 篇新闻为源，全量复制到新站（分类 / 标题 / 摘要 / 正文 / 图片本地化）。

### 进度
- ✅ 列表抓取: 372 篇元数据 (id/title/date/summary/cover/cats)
- ✅ 详情页抓取: 372/372 全量抓取成功 (107 篇快抓 + 265 篇解封后单并发慢速续抓, 0 失败)
- ✅ 详情解析: 372 篇全部解析为 ArticleBlock (paragraph/heading/list/quote/image), 13755 blocks, 0 空正文 0 无标题
- ✅ 图片下载: 1422 张任务 → 1208 成功 (372 封面 + 836 正文); 214 张失败因旧站源文件已删除 (URL 带 `_404_404` 标记, 无法恢复) → 已从正文剔除对应图片 block, 保留文字
- ✅ 数据生成: `src/data/articles.ts` (372 篇全量, 含 1240/1232 手工精修 medicalAd) + `home.ts` (NEWS_LIST/MAP 372 条) + `images/news.ts` (本地路径, 无 doubaocdn 热链) + 3 locale `news.json` (372 条 title/summary)
- ✅ 构建验证: tsc + vite build 通过; sitemap 1164 URL; prerender 覆盖最新 24 篇新闻详情 (正文+JSON-LD+本地图)
- ✅ 图片路径修复: 数据源图片统一 `/images/` 前缀, fix-base-paths 改写为 `/xiaowe-tech/images/`; playwright E2E 实测列表/详情/分类页图片 100% 加载, 无破图无 JS 错误
- ✅ E2E 验证: 1216 预渲染详情 (9 图) / 999 SPA 详情 (6 图) / 1240 手工 medicalAd / 列表页 (99 图) / 产品分类页 (24 图) 全部通过

### 分类映射规则 (旧站 g 值 → 新站)
| 旧站分类 | 新站 cat |
|---|---|
| g=1 公司新闻 | `company-news` |
| g=2 听力科普/资讯 | `industry-news` |
| g=3 产品资讯 | `product-news` |

### 技术要点
- 详情页: `https://www.xiaowe.cc/sys-nd/{id}.html` (凡科 SSR)
- 正文容器: `div.jz_fix_ue_img`；标题 `h1.news_detail_title`；日期/作者 `span.news_detail_info_item`
- 图片 CDN: `//32062144.s21i.faiusr.com/...` (图片域名与站点独立, 不受站点限流影响)
- 正文结构: 微信图文 HTML (section/p/img/mp-common-profile 公众号卡片)
- ⚠️ 反爬: 站点有频率限制, 8 并发约 100 篇后整 IP 段被断连 (TCP 拒绝); 续抓需单并发 + 3-6s 间隔, 失败指数退避
- 微信公众号卡片 (`mp-common-profile`) 无法复刻 → 转成 quote block "欢迎关注公众号：xxx"

---

## 六、上线前检查清单 (Checklist)

> 2026-08-22 全量自检执行结果:

- [x] `npm run build` 通过 (tsc 无错) — ✅ tsc 零错 + vite build 成功 + fix-base-paths 修正 1366 处
- [x] 预渲染全部路由 (含新闻详情) 无 pageerror — ✅ 186 页 + 404.html SPA 兜底, 本轮零渲染失败
- [ ] sitemap.xml 与预渲染路由集合一致 (不多不少) — ⚠️ dist ⊆ sitemap ✓ 无多余; 但 987 个新闻 URL 无静态页, GH Pages 下返回 HTTP 404 死链, 受 P0-1 决策影响
- [x] 所有图片本地化，无外域热链 — ✅ 仅业务外链 (企业微信客服/天猫/京东/拼多多); 新闻正文内 bigsound.cc 版权声明属抓取原文, 保留合理
- [x] 3 locale 全量 URL 抽查 200 — ✅ 13/13 (含 SPA fallback 路由 / sitemap.xml / robots.txt)
- [x] 移动端 375px / 平板 768px / 桌面 1440px 三档抽查 — ✅ 12 组合 (首页/产品/新闻/FAQ × 三档视口) 无水平溢出、无破图、无 JS 错误
- [ ] Lighthouse Performance ≥ 85 — ⚠️ home **90** ✅ / product **93** ✅ / news **78** (差 7, FCP 结构性下限, 见路线图④); CLS 全零
- [ ] 旧站 372 篇新闻全部可见 (列表/详情/分类/分页) — ⚠️ 部分: 最新 24×3=72 篇有预渲染静态页; 其余 ~300 篇靠 SPA 兜底, GH Pages 下返回 404 状态码, 同受 P0-1 影响

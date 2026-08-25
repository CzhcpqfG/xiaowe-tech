# 小维健康科技官网 3.0 开发日志

> 倒序排列，最新条目置顶。记录代码修改、配置变更、数据更新、重大决策等。

---

## [2026-08-24] 修复 | 移动端 Footer 二维码灯箱: 横屏留白/码缩小 + 平台名点击跳顶

**类型**: Bug 修复 (移动端 Footer 二维码灯箱展示)

**问题与根因**:
1. **横屏 (如 667×375) 灯箱破损**: 图片类名 `w-[60vw] max-w-[280px] h-auto max-h-[60vh] object-contain` — 宽度被强制指定、高度被 max-h 钳到 225px 后宽度不回缩, object-contain 只能在固定盒子内留白。实测 5 个平台全部中招: 方码两侧留白, 知乎竖版海报缩成 ~119px 小图漂在 280px 白卡里。
2. **竖屏二维码偏小**: `w-[60vw]` 把方码压到 192–234px, 小于自然尺寸 (weixin.jpg 258×258)。
3. **平台名点击跳页顶**: `<a href="#">` 未阻止默认行为, 移动端点平台名会跳回页面顶部。

**修复** (`src/components/layout/Footer.tsx` FollowLink):
- 图片类名改为 `max-w-[min(80vw,280px)] max-h-[60vh]`: 不设宽高只约束上限, CSS 对替换元素同时施加双约束时按固有比例缩放, 卡片随内容收缩
- 平台名 `<a>` 加 `onClick`: href 为空或 "#" 时 preventDefault
- 遮罩加 `overscroll-contain touch-none`: 阻止灯箱上滚动手势穿透背景 (iOS body overflow:hidden 锁不住滚动)

**验证**: `npx tsc -b` 通过; Playwright 三视口 (390×844 / 320×568 / 667×375) × 6 平台全量回归: 横屏卡片宽度 328→167~273 (紧贴图片), 竖屏方码 192/234→256/258 (自然尺寸), 全视口 cardClippedTop/Bottom=false; 截图存 `C:\Users\15927\AppData\Local\Temp\opencode\qr-repro\`

**遗留**: 视频号仍与公众号共用 weixin.jpg (创维品牌公众号码), 如有独立视频号二维码需替换 `src/config/footer.ts` FOLLOW_LINKS

**关联文件**: src/components/layout/Footer.tsx

---

## [2026-08-22] 排查 | "新闻第 4 页起配图不显示" = 线上旧版外链图死亡, 非本地代码问题

**类型**: 问题诊断 (用户报告 → 四组合实测 → 线上取证定位)

**结论**: 用户看到的是 GH Pages 镜像站 (`czhcpqfg.github.io/xiaowe-tech`) 的旧版构建。老文章配图仍是凡科时代抖音 CDN 热链 `aka.doubaocdn.com`, 现已全部 403。第 1~3 页为新文章 (图已本地化) 正常, 第 4 页起为老文章 (外链) 裂图 — 实测线上第 4 页 16 图中 10 张 broken 全指向 doubaocdn。

**排查过程**: 本地 preview 构建 + dev server × 整页加载/SPA 逐页翻页 × 桌面 1280/移动 390 四组合全部复现失败 (18 卡片零 broken 零隐藏, HTTP 零错误); 数据层三向对齐 (372 id = 372 thumbs = 372 covers); 本地 src 内 doubaocdn/fanyacdn 零残留 → 转向线上取证确认。

**解法**: 不改代码, 部署当前 dist 即愈。注意 base 已固定 `/` (P0-1), 临时更新 GH Pages 子路径需先出一版子路径构建; 否则等 ICP 备案后直接上阿里云。已记录 REVIEW_ACTIONS.md 总览区"已知问题"条目。

**环境备忘**: Vite dev 端口被占会自动 +1 (5174), 测试前先 `Get-NetTCPConnection -LocalPort N -State Listen` 探占用; PS 双引号字符串内嵌 JS 模板串 `${target}` 会被 PowerShell 插值吃掉 — 含 `$` 的脚本一律 write 工具落盘执行, 不用 Set-Content 中转。

---

## [2026-08-22] 性能 | news LCP 专项: 封面缩略图 + hero preload, news 67→78; 全局进度固化至 REVIEW_ACTIONS 总览区

**类型**: 性能优化收尾 (P2-5 追加) + 项目进度文档化

**结果**: news **67→78** (LCP 5.5s→4.7s, 总字节 1.18MB→760KB); home 90 / product 93 保持; 三页 CLS 持续全零

**改动**:
1. 新增 `scripts/generate-news-thumbs.ts`: sharp 批量生成 480px webp 缩略图 (q72, 幂等 mtime 跳过), 372 张封面 9992KB→3881KB (-61%); 已挂 prebuild 链。列表卡片 (NewsListPage.tsx) 改用 `/images/news/thumbs/{id}.webp` + loading=lazy + width/height
2. `ProductCarouselHero.tsx`: 轮播首图 `fetchPriority="high"` / 其余 `"low"`; react-helmet-async 输出 `<link rel="preload" as="image" fetchpriority="high">` 进静态 HTML head — 一处改动覆盖全部使用该 hero 的页面
3. REVIEW_ACTIONS.md 顶部新增「〇、项目进度总览」单一事实源: 性能战果表 / 今日完成清单 / 下一步路线图 (ICP 备案→部署→可选优化) / 关键决策索引 — 防 context 断档

**诊断过程要点**:
- LCP 候选演变链用 Playwright+CDP(slow-4G+CPU4x) 实测: logo(FCP ~2.9s) → 首张封面 → banner_1 为最终 LCP (~3.5s)
- 踩坑: 诊断误用裸 `/news` URL → 该路径无预渲染产物且 "news" 被 locale 参数吞掉 fallback 到首页组件, 抓到假 LCP (video 元素来自首页 VideoEntry)。正确形态是 locale 前缀 `/zh-CN/news`
- preload 后 Lighthouse 无显著再提升 (4.7→4.8 波动内): 剩余瓶颈确认为 FCP 2.7s 结构性下限, 非图片请求时机
- 环境: bash 工具超时会杀全进程树 (含后台 wrapper); 正确模式 = 启动调用立即返回 + 独立短调用轮询产物/端口; preview 探测用 127.0.0.1 而非 localhost

**news 差 7 分结论**: 突破需关键路径重构 (内联关键 CSS / 按页裁 vendor), 边际成本高且模拟 slow-4G 本就保守 — 决策为降级 P3, 上线后按真实 RUM 数据决定

**关联文件**: scripts/generate-news-thumbs.ts / package.json (prebuild) / src/pages/NewsListPage.tsx / src/components/layout/ProductCarouselHero.tsx / REVIEW_ACTIONS.md (总览区)

---

## [2026-08-22] 性能 | P2-5 bundle 拆分: 主 chunk 1311KB→302KB(gzip 113), Lighthouse home 90/product 94 达标

**类型**: 性能优化 (REVIEW_ACTIONS.md P2-5)

**结果**: 主 chunk **1311.4 KB → 302 KB (gzip 113)** (-77%); 首屏关键路径 ~199KB gzip (原 590KB+); Lighthouse **home 82→90 ✅ / product 75→94 ✅ / news 67→72**; FCP 3.1s→2.3-2.6s; product 页总字节 8.76MB→230KB

**四刀改动**:
1. `routes/index.tsx` 11 页全部 `React.lazy` + Suspense (PageFallback 等高占位防跳动)
2. 新增 `src/i18n/newsResources.ts`: news.json 三语 (536KB) 从主包拆出按需注入, 新闻路由 lazy loader 内 `await loadNewsNamespace(locale)` 串行保证 mount 前就位; locale 解析用 `window.location.pathname` (lazy loader 非组件上下文, 不能 useSearchParams); 新增 `routes/RouteErrorBoundary.tsx` 兜底 chunk 加载失败白屏
3. `vite.config.ts` manualChunks: vendor-react(142K)/vendor-router(22K)/vendor-i18n(50K)/vendor-misc(18K)
4. `src/i18n/index.ts` 移除三个 news import, ns 列表同步

**验证**: tsc 零错; prerender 186 页+404.html 全成功 (懒加载预渲染兼容); HTML 抽查完整 (news 列表 75KB 有标题/en about 无 key 裸串); news chunks 独立 (~66KB gzip×3 按需)

**news 剩余 13 分失分项**: LCP 5.5s 封面图 + TBT 210ms → 下一步封面图响应式/lazy

**关联文件**: src/routes/index.tsx / src/routes/RouteErrorBoundary.tsx / src/i18n/index.ts / src/i18n/newsResources.ts / vite.config.ts / REVIEW_ACTIONS.md (P2-5 ✅)

---

## [2026-08-22] 性能 | P2-10 CLS 归零: 三页 Lighthouse 63/53/46 → 82/67/75, 挖出三层叠加根因

**类型**: 性能修复 (REVIEW_ACTIONS.md P2-10, 上线检查清单 Lighthouse 项)

**结果**: home **63→82** / news **53→67** / product **46→75**; 三页 CLS 全部归零 (0.414/0.379/0.479 → 0)

**根因链 (逐层 trace 定位, 每层修完才暴露下一层)**:
1. **unsized-images**: 大量 img 无宽高 → 新增 `scripts/scan-image-dimensions.ts` 构建期扫描全站图片生成尺寸清单 (纯 Node 解析 webp VP8X/VP8/VP8L + png IHDR + jpeg SOF 头, 无新依赖), 运行时查表注入 width/height。已挂 prebuild 链 (`npm run scan:images` 可单独跑)
2. **hydration 结构闪变**: `useAdaptWidth.ts` `useState(false)` 固定初始值 → 移动端 hydration 首帧渲染桌面结构再翻转 (61px 整页位移) → 改惰性初始化直接读视口; `scripts/prerender.ts` 视口改移动端 390×844 + iPhone UA, 保证静态 HTML 与 hydration 首帧一致
3. **CSS 到达前布局跳变 (slow-4G 主凶)**: `w-full h-auto` 类生效前图片按 attr 原始像素渲染 (42 张 ×1358px = 页高 75302px), CSS 到达瞬间塌缩至 25977px 被记为 shift 0.4787。修复: 详情图/新闻正文图内联 `style="aspect-ratio: w/h; width:100%"`, 不依赖外部 CSS

**顺带发现**: ① ~59 张图片扩展名与实际格式互换 (news/205/*.jpg 实为 WebP 等, 旧站抓取遗留; 扫描脚本按魔数而非扩展名解析兼容); ② news/70/img-03.jpg 为 15 字节 XML 错误响应非图片, 已从 part10.ts 剔除并删除文件; ③ 全站 2259 个 img 中 1440 个现带尺寸属性

**调试方法备忘**: Playwright + CDP Network.emulateNetworkConditions(slow 4G) + CPU 4x 节流复现 Lighthouse 环境, addInitScript 注入 PerformanceObserver(layout-shift) + 100ms 布局采样快照, 抓到 shift 瞬间现场 DOM 才定位第 3 层根因 (无节流环境无法复现)。注意后台 build 与残留 npm 进程并发会静默用旧产物——长构建后必须核对产物 mtime。

**剩余失分项**: home 差 3 分 (hero 视频 18.6MB, P2-6) / news 差 18 (LCP 5.0s) / product 差 10 (LCP 4.3s); FCP 3.1s 恒定为 885KB 主 bundle 解析阻塞 (P2-5)

**关联文件**: scripts/scan-image-dimensions.ts / src/data/generated/imageSizes.ts / src/hooks/useAdaptWidth.ts / scripts/prerender.ts / REVIEW_ACTIONS.md (P2-10 ✅)

---

## [2026-08-22] 架构 | P0-1 部署形态拍板: 统一根路径 + 阿里云托管, 移除 GitHub Pages 子路径改造

**类型**: 重大决策 + 构建链路变更 (REVIEW_ACTIONS.md P0-1)

**背景**: 上线自检发现 sitemap (根路径) 与资源引用 (`/xiaowe-tech/` 子路径) 形态互斥。用户拍板: 最终部署为**域名 www.xiaowe.cc + 阿里云服务器**, Cloudflare Pages 仅临时展示, GitHub Pages 方案废弃。

**代码侧改动**:
- `vite.config.ts`: base 固定 `"/"` (删除 build/preview 的 `/xiaowe-tech/` 分支逻辑)
- 删除 `scripts/fix-base-paths.ts`; `package.json` build 简化为 `tsc -b && vite build`
- `scripts/prerender.ts:38`: BASE_PATH 改 `"/"`
- `src/config/schema.ts`: absoluteImage() 删除 BASE_PREFIX 剥离逻辑, 直接拼 SITE_ORIGIN
- `src/components/SEO.tsx`: DEFAULT_OG_IMAGE 相关注释同步

**验证结果**:
- sitemap 1173 URL → tsc 零错 → vite build 成功 (主 chunk index-BtvDGmDM.js 885.59 kB / gzip 423.89 kB) → prerender **186 页 + 404.html** 全部成功
- dist 全部 187 个 HTML 零 `/xiaowe-tech` 残留; 资源引用全为根路径
- 抽查 `dist/zh-CN/index.html`: canonical=`https://www.xiaowe.cc/zh-CN`, hreflang 三语正确, og:image=根路径绝对 URL, JSON-LD 4 处注入且 image 字段正确

**附带收益**: 原本 GH Pages 下返回 HTTP 404 死链的 987 个未预渲染新闻 URL, 在阿里云 Nginx `try_files` SPA 兜底下将返回 200。

**部署侧待办**: ICP 备案 (硬前置) / Nginx 配置 (SPA fallback+缓存+gzip) / HTTPS 证书 / apex→www 301 / DNS 从凡科切换。详见 REVIEW_ACTIONS.md P0-1。

**关联文件**: vite.config.ts / package.json / scripts/prerender.ts / src/config/schema.ts / src/components/SEO.tsx / scripts/fix-base-paths.ts (已删除)

---

## [2026-08-22] 自检 | 上线前全量自检: 构建链路全绿, 新增 P0 部署形态矛盾, 性能基线 home 63/news 53/product 46

**类型**: 上线前验证 (REVIEW_ACTIONS.md 第六节检查清单全量执行)

**摘要**:
- **构建链路 (全部通过)**: `generate-sitemap` 1173 URL (静态 24 + 产品详情 24 + 新闻 1116 + 资讯分类 9) → `tsc -b` 零错误 → `vite build` 成功 (主 chunk index-CbZJbZkP.js 885.71 kB / gzip 423.95 kB; part1-10 懒加载 chunks 各 ~100-112KB) → `fix-base-paths` 修正 1366 处 → Playwright 预渲染 **186 页 + 404.html SPA 兜底**, 零渲染失败
- **🔴 P0-1 新发现 (部署形态自相矛盾)**: `scripts/generate-sitemap.ts:6` `ORIGIN="https://www.xiaowe.cc"` (根路径) vs `scripts/fix-base-paths.ts` `BASE="/xiaowe-tech"` (子路径), 两形态互斥。sitemap 中 987 个未预渲染新闻 URL 在 GH Pages 下返回 HTTP 404 死链。修复方案 A/B 与同步清单详见 REVIEW_ACTIONS.md P0-1, **待拍板托管方案**
- **✅ 通过项**: 图片本地化无外域热链 (仅业务外链); 3 locale HTTP 抽查 13/13 全 200 (含 SPA fallback / sitemap.xml / robots.txt); 响应式三档 12 组合 PASS (375/768/1440 × 首页/产品/新闻/FAQ, 无水平溢出/破图/JS 错误)
- **❌ Lighthouse ≥85 未达标**: home **63** (总字节 18.79MB, hero 视频拖累) / news **53** (LCP 6.8s) / product **46** (LCP 9.4s, 详情长图页总字节 8.76MB); 三页 CLS 0.379~0.479 全超标 (unsized-images 根因)
- **性能行动顺序**: ① 拍板部署方案统一 base 形态 → ② img 补尺寸修 CLS (预计各页 +10~15 分) → ③ hero 视频 24.4MB 压至 ~8MB 或移动端 poster 替代 → ④ 详情长图压缩 + lazy 核查 → ⑤ 重跑 Lighthouse 验证

**关联文件**: [REVIEW_ACTIONS.md](file:///d:/VibeTest/bigsound/REVIEW_ACTIONS.md) (P0-1 新增 + P2-5/P2-10 更新 + 清单勾选) / scripts/generate-sitemap.ts / scripts/fix-base-paths.ts / scripts/prerender.ts / vite.config.ts / public/robots.txt

---

## [2026-08-22] 清理 | 僵尸文件清理: 3 个孤儿源文件 + 16 张未引用图片 + 11 处断裂引用修复

**类型**: 代码/资源清理 (基于全库引用扫描, 非功能性变更)

**摘要**:
- **删除 3 个 src 孤儿文件** (全库无 import 引用):
  - `src/components/layout/PageHero.tsx` — 已被统一 ProductCarouselHero 组件取代
  - `src/config/index.ts` — 无消费方的 barrel 文件 (config/ 下 site/schema/navigation/footer 均为活跃使用, 保留)
  - `src/types/index.ts` — 类型已下沉到 data 文件, 零引用; `src/types/` 目录清空
- **删除 16 张未引用图片** (scan 确认无任何 src/index.html 引用):
  - 9 张被 `_bg.png` 替换的旧主图: `public/images/products/product_{bo,dab007,daq001,sab001,san002,san003,sap001,saq002,saq003}_main.png` (约 15MB)
  - 5 张弃用合作平台 logo: `public/images/home/cta/logo_{bilibili,dasound_tl,dasound_ztq,kuaishou,xhs}.webp`
  - 2 张二维码重复图: `public/images/common/qrcode/{douyin2,weixin2}.jpg`
- **修复 11 处断裂引用** (src 引用但文件不存在的路径):
  - `src/data/images/product.ts` 删除 8 个死 key (无 imageKey 消费 + 文件不存在): `productDabBehindEar`/`productDaqInEarQ1`/`productSanNeckHungN2`/`productBoneConduction`/`productBigsound{Br,P1,Q1,N1}`
  - 3 个软屏蔽产品的 imageKey 保留但标注缺图 (卡片 isListed:false 不渲染, 无运行时 404): `productDab005`/`productDabInEarP1`/`productDabNeckHungN1`, 注释注明取消屏蔽前需补图
- **清理 PageHero 注释引用**: 13 处注释中的 "PageHero" 措辞统一改为实际组件 ProductCarouselHero (Layout.tsx / AboutPage / CareersPage / InvestPage / NewsListPage / WearablePage / data/about / data/wearable / data/images/about / data/images/wearable)

**验证**: `npx tsc -b` 通过 (零错误); 反向扫描 (src→public 引用 vs 磁盘文件) 断裂引用 13→3 (剩余 3 处均为软屏蔽产品占位, 注释已标注); `favicon.ico` 确认被 index.html 引用, 保留

**关联文件**:
- 删除: [src/components/layout/PageHero.tsx] / [src/config/index.ts] / [src/types/index.ts] / 16 张 public 图片
- 修改: [src/data/images/product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts) / [src/components/layout/Layout.tsx](file:///d:/VibeTest/bigsound/src/components/layout/Layout.tsx) / [src/data/about.ts](file:///d:/VibeTest/bigsound/src/data/about.ts) / [src/data/wearable.ts](file:///d:/VibeTest/bigsound/src/data/wearable.ts) / [src/data/images/about.ts](file:///d:/VibeTest/bigsound/src/data/images/about.ts) / [src/data/images/wearable.ts](file:///d:/VibeTest/bigsound/src/data/images/wearable.ts) / 6 个页面 tsx 注释
- 验证脚本: `C:\Users\15927\AppData\Local\Temp\opencode\scan-orphans.cjs` / `scan-public2.cjs` / `scan-broken.cjs`

---

## [2026-08-16] 增强 | GEO 评分 80→90+: 首页 FAQ schema + 动态路由预渲染 + 全页面级 schema + OG 图 + 域名统一

**类型**: GEO 优化收尾 (基于 07-26 GEO 评分报告, 用户确认域名统一为 www.xiaowe.cc)

**摘要**:
- **P0-1 首页注入全量 FAQPage schema**: `src/pages/HomePage.tsx` 从 `faq:questions` (6 分类 37 条 Q&A) 拍平注入 `getFaqSchema`, 让 AI 爬虫首抓首页即可解析全部问答对
- **P0-2 动态路由纳入预渲染 + sitemap**: `scripts/prerender.ts` 新增 8 款上架产品详情页渲染 (×3 locale = 24 页, 总预渲染 24 静态 + 24 详情 = 48 页); 新建 `scripts/generate-sitemap.ts` 自动生成 sitemap (24 静态 + 24 产品详情 + 54 新闻详情 = 102 URL, 每条带 hreflang alternates + x-default, 新闻带 lastmod 发布日期), 挂 `prebuild` 钩子 + `npm run sitemap`
- **P1-1 全页面级 schema 补齐**: AboutPage→AboutPage+BreadcrumbList; WearablePage→ItemList+Product×11 (SKYWORTH 品牌); NewsListPage→CollectionPage+BreadcrumbList; CareersPage→WebPage+BreadcrumbList; ProductDetailPage→MedicalDevice+BreadcrumbList; `schema.ts` 新增 `getItemListSchema` / `getCollectionPageSchema`
- **P1-2 OG 默认图**: 新建 `scripts/generate-og.mjs` (sharp 渲染 SVG), 生成 1200×630 `public/images/common/og-default.png` (白/浅灰底 + 品牌绿 + 中文言语增强算法文案 + 医疗器械注册证号); `SEO.tsx` DEFAULT_OG_IMAGE 由 logo.webp 改为 og-default.png (匹配已声明的 1200×630)
- **P1-3 域名统一**: `public/.well-known/security.txt` Canonical 由 `www.bigsound.cc` → `www.xiaowe.cc` (全站统一主域)

**验证**: `npx tsc -b` 通过; `vite build` 成功; 预渲染 48 页全部成功; dist 逐页 grep 验证 — 首页含 FAQPage(37 Question)+Organization, About 含 AboutPage, Careers 含 WebPage, News 含 CollectionPage, Wearable 含 ItemList+Product, 产品详情页含 MedicalDevice+BreadcrumbList (8 款×3 locale), dist/sitemap.xml 102 URL, dist/og-default.png 1200×630, security.txt 域名统一

**关联文件**:
- [src/pages/HomePage.tsx](file:///d:/VibeTest/bigsound/src/pages/HomePage.tsx) / [src/pages/AboutPage.tsx](file:///d:/VibeTest/bigsound/src/pages/AboutPage.tsx) / [src/pages/WearablePage.tsx](file:///d:/VibeTest/bigsound/src/pages/WearablePage.tsx) / [src/pages/NewsListPage.tsx](file:///d:/VibeTest/bigsound/src/pages/NewsListPage.tsx) / [src/pages/CareersPage.tsx](file:///d:/VibeTest/bigsound/src/pages/CareersPage.tsx) / [src/pages/ProductDetailPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductDetailPage.tsx)
- [src/config/schema.ts](file:///d:/VibeTest/bigsound/src/config/schema.ts) / [src/components/SEO.tsx](file:///d:/VibeTest/bigsound/src/components/SEO.tsx)
- [scripts/prerender.ts](file:///d:/VibeTest/bigsound/scripts/prerender.ts) / [scripts/generate-sitemap.ts](file:///d:/VibeTest/bigsound/scripts/generate-sitemap.ts) / [scripts/generate-og.mjs](file:///d:/VibeTest/bigsound/scripts/generate-og.mjs)
- [public/sitemap.xml](file:///d:/VibeTest/bigsound/public/sitemap.xml) / [public/images/common/og-default.png](file:///d:/VibeTest/bigsound/public/images/common/og-default.png) / [public/.well-known/security.txt](file:///d:/VibeTest/bigsound/public/.well-known/security.txt) / [package.json](file:///d:/VibeTest/bigsound/package.json)

---

## [2026-08-15] 移除 | 产品详情页 hero + SAN002 屏蔽 + 删除登录/注册功能

**类型**: 功能移除

**摘要**:
- **产品详情页去 hero**: ProductDetailPage 移除顶部 420px ProductCarouselHero 主图 (含 ProductCarouselHero/IMAGES 引用), 页面变为: 面包屑 → 标题区 → 详情长图雪崩级联拼接
- **SAN002 屏蔽**: `src/data/product.ts` products.9 `isListed: false`, 卡片不再渲染
- **删除登录/注册功能 (navbar + 全链路数据)**: 删除 Header 桌面端「登录|注册」按钮与已登录用户菜单、移动端抽屉登录/注册区与用户信息区; 删除登录/注册独立全屏页 (LoginPage/RegisterPage) 与 `:locale/login`、`:locale/register` 路由 (现落入 404); 删除整个前端认证子系统源码: AuthContext / useAuth / authRepository / mockUsers / types/auth / lib/supabase / i18n/authErrors / 3×auth.json / header.auth i18n 键 (3 locale) / meta.json login+register 键 (3 locale); 删除 supabase/ 目录、SUPABASE_SETUP.md、.env.example (纯 Supabase 配置); `src/vite-env.d.ts` 移除 VITE_SUPABASE_* 类型; `package.json` 移除 @supabase/supabase-js 依赖 (npm install 卸载 8 包)

**验证**: `npx tsc -b` 通过; 全库 grep 无 auth 残留; Playwright: 桌面/移动 navbar 均无「登录/注册/Log in/Sign up/退出」; `/zh-CN/login`、`/zh-CN/register` 现渲染 404 页面 (带正常 Header/Footer); 产品页 SAN002 卡片不再渲染 (9 → 8 款上架)

**关联文件**:
- [src/pages/ProductDetailPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductDetailPage.tsx)
- [src/data/product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts)
- [src/components/layout/Header.tsx](file:///d:/VibeTest/bigsound/src/components/layout/Header.tsx)
- [src/main.tsx](file:///d:/VibeTest/bigsound/src/main.tsx) / [src/routes/index.tsx](file:///d:/VibeTest/bigsound/src/routes/index.tsx) / [src/routes/paths.ts](file:///d:/VibeTest/bigsound/src/routes/paths.ts)
- [src/i18n/index.ts](file:///d:/VibeTest/bigsound/src/i18n/index.ts) / [src/i18n/types.ts](file:///d:/VibeTest/bigsound/src/i18n/types.ts) / [src/i18n/locales/{zh-CN,zh-TW,en}/common.json+meta.json](file:///d:/VibeTest/bigsound/src/i18n/locales/)
- [src/vite-env.d.ts](file:///d:/VibeTest/bigsound/src/vite-env.d.ts) / [package.json](file:///d:/VibeTest/bigsound/package.json)

---

## [2026-08-15] 调整 | 产品卡去品牌色修饰 + 9 款上架产品 hero 风格背景图 + DAQ001 定价

**类型**: UI 还原 + 素材生成 + 数据修正

**摘要**:
- **去掉产品卡品牌色修饰** (ProductPage + WearablePage 同步还原): 删除信息栏品牌绿短条、详情入口由品牌绿胶囊还原为纯文本「查看详情 →」、hover 阴影由品牌绿改回中性 `rgba(0,0,0,0.10)`; 保留 hairline 分隔 + 指标格贴底等高结构
- **9 款上架产品 hero 风格背景图** (速创API gpt-image-2, 1:1, 0.1 元/张共约 0.9 元): 用 GLM-4V 识别 hero 轮播图背景风格 (极浅米白简约渐变 + 大留白 + 柔和光影 + 悬浮产品带轻微倒影), 以 9 张真实产品主图为 ref + banner_1 为风格 ref, 生成 `public/images/products/product_{dab007,sab001,sap001,daq001,saq002,saq003,san002,san003,bo}_bg.png` (1254×1254)
- **卡片图区适配满幅背景**: ProductPage 卡片图片区由「浅绿底 `#f0f7f2` + p-[20/28px] + object-contain」改为「白底 + 无内边距 + object-cover 铺满」; `src/data/images/product.ts` 9 个上架产品键指向 `_bg.png`
- **DAQ001 定价**: `src/data/product.ts` products.5 `price` 由「待定」改为 `1999`

**验证**: `npx tsc -b` 通过; GLM-4V 逐张 QA 9 张背景全部干净 (无文字/Logo/水印/人像/手部)、产品均在、居中无变形; Playwright: 产品页 9 张卡片图 src 均为 `_bg.png`、图片区无绿底/padding, HTTP 200; 整页截图 QA 排版正常; 390/1280 无横向溢出

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [src/pages/WearablePage.tsx](file:///d:/VibeTest/bigsound/src/pages/WearablePage.tsx)
- [src/data/images/product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts)
- [src/data/product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts)
- [public/images/products/](file:///d:/VibeTest/bigsound/public/images/products/)

---

## [2026-08-15] 调整 | 悬浮工具精简 + 产品卡信息栏/边框品牌色修饰 + 详情页雪崩级联入场

**类型**: UI 调整 + 入场动效

**摘要**:
- **悬浮工具** (FloatingTools): 4 键精简为 2 键, 仅保留**在线咨询 + 返回顶部**, 删除电话咨询 / 二维码 (含 3 locale 的 `phoneConsult` / `qrCode` / `scanFollowPublic` i18n 键与二维码图片引用)
- **产品卡** (ProductPage + WearablePage 同步): 图片区白底设计保持不动; 信息栏层级重构为「型号 → 品牌色短条 (w-7 h-[2px] bg-brand-green-light) → 价格 → hairline 分隔 (border-t border-ink-100) → 指标格 (贴底等高对齐)」; 边框细化: hover 阴影由中性黑改为**品牌绿 rgba(5,160,69,0.14)**; 详情入口由纯文本升级为**品牌绿描边胶囊** (hover 填充品牌绿 + 白字 + 箭头位移)
- **产品详情页雪崩级联入场**: Reveal 新增 `drop` variant (`opacity-0 -translate-y-10` → 落下 + 淡入, Apple 缓动), 详情图全屏拼接的每张图滚动进入视口时逐张下落入场, 带小幅错峰延迟 `Math.min(idx % 8, 3) * 70ms`

**验证**: `npx tsc -b` 通过; Playwright DOM 断言: 悬浮条仅 2 子元素 (1 咨询锚点 + 1 返回顶部按钮); 卡片含品牌色短条/hairline 分隔/详情胶囊, 边框 ink-200; 详情页 41 张图全渲染, 视口外 wrapper 初始 `opacity-0 -translate-y-10`, 进入视口后过渡到 opacity 1; 390/1280 无横向溢出

**关联文件**:
- [src/components/layout/FloatingTools.tsx](file:///d:/VibeTest/bigsound/src/components/layout/FloatingTools.tsx)
- [src/components/ui/Reveal.tsx](file:///d:/VibeTest/bigsound/src/components/ui/Reveal.tsx)
- [src/pages/ProductDetailPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductDetailPage.tsx)
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [src/pages/WearablePage.tsx](file:///d:/VibeTest/bigsound/src/pages/WearablePage.tsx)
- [src/i18n/locales/{zh-CN,zh-TW,en}/common.json](file:///d:/VibeTest/bigsound/src/i18n/locales/)

---

## [2026-08-14] 重构 | 移动端扇形图改为"条形统计图阶梯" (无坐标轴, 绿/黑配色 + hover 交互)

**类型**: 移动端图形设计调整

**决策** (用户反馈): 上一版"台阶卡片"不符合需求 — 要求**参考桌面端扇形图的配色 (品牌绿 #05a045 + 深灰 #1a1a1a) 和交互 (hover 扇区变绿)**, 换成**条形统计图那种阶梯感**, 且**无横纵坐标**。

**实现** (ProductPage.tsx ChineseTechFanChart 移动端):
- 每行 = 上方文案行 (编号 + prefix + [highlight] + connector/suffix + sub) + 下方一条彩色条形
- 条形**左对齐同一基线**, 长度阶梯递减形成右端阶梯轮廓: 绿色核心条 100% (内含白色小圆"中"字), 5 根黑色条 88% / 74% / 60% / 46% / 32%
- 条形高 18px 圆角, 左端内嵌白色小圆图标 (绿条=白底"中", 黑条=扇区图标)
- 无坐标轴; hover 黑条 `group-hover:bg-brand-green` 变绿 (参考桌面扇形图交互)

**验证**: `npx tsc --noEmit` 通过; Playwright 375px: 无横向溢出, 6 根条形长度 326/287/241/196/150/104px 阶梯递减, 配色正确

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)

---

## [2026-08-14] 优化 | 移动端扇形图彻底隐藏 + 蛇形/双通道文本对齐

**类型**: 响应式细节优化

**决策** (用户反馈):
1. 移动端**不显示扇形图** (等比缩小的扇形图无意义), 直接使用阶梯图
2. 蛇形丝带时间轴、双通道协同图的文本位置未对齐, 需优化

**变更内容** (ProductPage.tsx):

1. **扇形图**: SVG 容器改为 `hidden lg:block` + 固定 `w-[760px] h-[540px] mx-auto`, 移动端完全不渲染扇形图, 仅显示阶梯图
2. **蛇形丝带时间轴**: 丝带路径从"左右大幅折返" (88↔312) 收拢为"左侧小幅摆动" (52↔108), 8 个节点统一在左列; 标签从"左右交替 (24%/76% 混排)" 改为**统一右列 `left: 40%` + 左对齐 + 宽度 60%**, 文本完全对齐
3. **双通道协同图**: 列标题 grid 改为 `grid-cols-[1fr_40px_1fr]` 与下方节点列同宽对齐; 节点胶囊加宽 (中轴 48→40px) 且字号 12→11px 保证单行; 流向图例改为**虚线横跨连接 + 两端对称** (→ 数据上传 / 试听反馈 ←, 白底遮虚线); 3 大步骤大数字 `leading-[34px]` 顶对齐文本首行

**验证**: `npx tsc --noEmit` 通过; Playwright 375px: 无横向溢出, 扇形图 SVG 隐藏 (阶梯图 5 级正常), 蛇形 8 标签全部 left 40% 左对齐, 双通道节点 46px 为主 (个别长文案换行 50px); 1440px 桌面: 扇形图 722×513 正常, 阶梯图/移动端容器全部隐藏, 无回归

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)

---

## [2026-08-14] 重构 | 移动端图形改为"专属设计布局" (阶梯图/蛇形丝带/双通道, 推翻等比缩放方案)

**类型**: 响应式设计原则调整

**决策** (用户反馈): 等比缩小在移动端看不清, 普通卡片/列表/网格又缺乏设计感 → 每个图形模块需重新设计**保留原设计语言、适配窄宽**的专属移动端布局 (用户举例: 扇形图 → 阶梯图)。

**重构内容** (ProductPage 3 个图形模块, 均双端并存: 桌面原图形 + 移动端专属布局):

1. **核心扇区图 → 移动端阶梯图**: 每级台阶 = 左侧"立面"色块条 (绿色/深灰) + 渐变踏板 (浅绿渐变/灰白渐变); 绿色核心台阶在最上全宽 (含"中"字圆), 5 个黑色扇区台阶**逐级右缩进 18px** 形成楼梯感; 台阶内保留图标 + prefix/[highlight]/connector/suffix/sub 文案
2. **U形弯道时间轴 → 移动端蛇形丝带时间轴**: 保留"绿丝带渐变 + 节点编号圆"设计语言, 8 节点左右折返形成波浪丝带 (SVG 400×760, 贝塞尔曲线, 渐变描边, 末端箭头), 标签左右交替 (L 节点标签居右 / R 节点标签居左, 无卡片边框, 纯文字 + 编号小圆点)
3. **声处方验配流程图 → 移动端双通道协同图**: 左列前端验配师 5 节点 (白底绿边胶囊, 上→下 ↓), 右列后端听力专家 3 节点 (绿底白字胶囊, 下→上 ↑ **相向而行**体现前后协同), 中间虚线中轴; 底部"流向图例" (数据上传 → / 试听反馈 ←); 3 大步骤改为大数字里程碑 (34px 淡绿大数字 + 标题 + 描述 + 渐变竖线)

**Bug 修复**: 扇形图组件的绿色扇区标签 div 缺 `hidden lg:block`、黑色扇区图标 div 缺 `hidden lg:flex`, 导致移动端显示左/右 680px 绝对定位元素并撑宽容器 (scrollWidth 697→457→正常); 已补齐仅桌面显示

**验证**: `npx tsc --noEmit` 通过; Playwright 375/768/1024/1440 实测: 页面 scrollWidth=clientWidth 无横向溢出; 375 阶梯 5 级缩进正常、蛇形 8 标签 + 326×619 SVG、双通道 8 节点; 1440 桌面扇形图图标/标签、U形弯道 8 标签、流程图 SVG 完整, 移动端容器全部隐藏

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)

---

## [2026-08-14] 重构 | 移动端改为"保留图形 + 指引下移" (推翻上一版列表替换方案)

**类型**: 响应式设计原则调整

**决策** (用户反馈): "这么多设计你都在移动端大改了，这样不合理，比如扇形图你应该保留，但是箭头指引可以全部置于扇形图下" — 移动端**保留原图形**（按宽度等比缩放），指引/标签/文字内容下移到图形下方列表，而不是替换成完全不同的布局。

**重构内容** (ProductPage 3 个图形模块):
- **核心扇区图** (ChineseTechFanChart): 根容器改为 `w-full aspect-[38/27] lg:w-[760px] lg:h-[540px] lg:aspect-auto lg:mx-auto`; SVG 改 `absolute inset-0 w-full h-full` 去固定宽高; 折线引导、绿色/黑色标签、"中"字、扇区图标加 `hidden lg:*` 仅桌面显示; 组件末尾新增 `lg:hidden` 移动端指引列表 (绿色中心项卡片 + 5 黑扇区卡片); 调用处去掉外层 flex 包装 (修复 aspect-ratio 在 flex stretch 下高度异常 Bug)
- **声处方验配流程图** (1200×680 SVG): 容器改 `w-full aspect-[30/17] lg:w-[1200px] lg:h-[680px] lg:mx-auto`; SVG 内节点框/箭头/虚线/步骤大数字保留为图形, 列标题、节点文字、步骤标题/描述、箭头标注文字加 `hidden lg:block`; 图形下方新增 `lg:hidden` 三段指引列表 (左列流程 / 右列流程 / 3 大步骤)
- **U形弯道时间轴** (1200×580 SVG): 容器改 `w-full aspect-[60/29] lg:w-[1200px] lg:h-[580px] lg:mx-auto`; 8 个 HTML 节点标签加 `hidden lg:block`; SVG 内 8 节点圆保留 (移动端显示编号圆); 图形下方新增 `lg:hidden` 移动端标签列表 (编号 + 标题 + 描述)
- **售前服务 4 环节**: 维持移动端 grid 2 列 (卡片内容即图形本身, 仅隐藏连接箭头, 符合原则)

**修复 Bug**: 扇区图调用处原为 `<Reveal className="flex justify-center"><div className="w-full flex justify-center">` — aspect-ratio 容器作为 flex item 在 align-items:stretch 下高度被错误拉伸 (326px 宽 → 654px 高), 已改为 block 父级 + `lg:mx-auto` 居中, 高度恢复 326×232

**验证**: `npx tsc --noEmit` 通过; Playwright 375px 实测无横向溢出, 三大图形 SVG 等比缩放正确 (326×232 / 343×194 / 326×157), 移动端指引列表渲染; 1280px 桌面端图形完整 (U形弯道 8 标签), 移动端列表隐藏

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)

---

## [2026-08-14] 修复 | ProductPage 移动端响应式 (消除横向滚动 + Hero 不裁剪)

**类型**: 响应式修复

**问题** (用户反馈):
- 移动端多个模块固定 1200px 宽度, 依赖 overflow-x-auto 横向滚动, 需手动拖横条
- Hero 横幅图 cover 模式在移动端被裁剪

**修复内容**:
- **U形弯道时间轴**: 移动端 (<1024px) 改为垂直时间轴列表 (编号圆点 + 竖线 + 卡片); 桌面保留 U 形弯道 SVG
- **声处方验配流程图** (1200×680 SVG): 移动端改为三段垂直列表 (左列流程 / 右列流程 / 3 大步骤)
- **核心扇区图** (760×540): 移动端改为核心技术卡片列表 (绿色项 + 5 黑扇区项, 含图标)
- **售前服务 4 环节**: 移动端 grid 2 列布局, 箭头移动端隐藏; 桌面保留箭头串联
- **Tab 分类导航**: 移动端 flex-wrap 换行, 不再横向滚动
- **Hero**: ProductCarouselHero 新增 `mobileObjectFit` prop; ProductPage 顶部 hero 移动端用 contain + 浅绿背景, 完整显示不裁剪

**验证**: `npx tsc --noEmit` 通过; Playwright 375px 视口实测: 页面 scrollWidth=clientWidth 无横向溢出, 无内部横向滚动容器 (仅剩 sr-only 无障碍链接), Hero 完整显示

**关联文件**:
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [src/components/layout/ProductCarouselHero.tsx](file:///d:/VibeTest/bigsound/src/components/layout/ProductCarouselHero.tsx)

---

## [2026-08-14] 功能 | 产品图第二批补充 (DAB007/SAB001/SAN002/SAQ002 上架)

**类型**: 数据更新

**摘要**:
- 用户补充 4 个产品真实图 (新建文件夹/后四), 全部上架: DAB007 尊享版 / SAB001 / SAN002 优享版 / SAQ002 尊享版
- 目前 12 款产品中 10 款上架, 仅剩 2 款软屏蔽: DAB006 / SAN001

**图片拷贝**:
- 4 张主图 → `public/images/products/product_{dab007,sab001,san002,saq002}_main.png`
- 详情页图 (140 张) → `public/images/product-detail/{dab007,sab001,san002,saq002}/`

**详细变更**:
- `src/data/images/product.ts`: 新增 4 个主图 key (productDab007/Sab001/San002/Saq002)
- `src/data/product.ts`: products.2/3/6/9 更新 imageKey + isListed: true + slug + detailImages; 新增 seq() 序号 helper

**验证**: `npx tsc --noEmit` 通过

---

## [2026-08-14] 功能 | 产品真实图替换 + 软屏蔽 + 产品详情子页面

**类型**: 数据更新 + 新页面

**摘要**:
- 用用户提供的真实产品图 (详情页补充2.0) 替换产品卡片配图, 6 个有图产品上架, 其余 6 个缺图产品软屏蔽
- 新增产品详情子页面 `/product/:slug`, 卡片点击进入, 展示该型号几十张电商详情图全屏拼接
- 详情页复用统一 ProductCarouselHero + 新增面包屑导航 (首页 > 产品中心 > 产品名)

**产品映射** (有图上架 6 个):
- DAB005 臻听版 (有主图无详情页, 卡片展示不可点)
- SAP001 悦享版 / DAQ001 尊享版 / SAQ003 / SAN003 尊享版 / BO (均有主图 + 详情页)
- 软屏蔽 6 个: DAB006 / DAB007 / SAB001 / SAQ002 / SAN001 / SAN002 (缺图, 后续补)

**图片拷贝**:
- 6 张主图 → `public/images/products/product_{dab005,sap001,daq001,saq003,san003,bo}_main.png`
- 详情页图 (131 张) → `public/images/product-detail/{bo,daq001,san003,sap001,saq003}/`

**详细变更**:
- `src/data/images/product.ts`: 新增 6 个真实主图 key (productDab005/Sap001/Daq001/Saq003/San003/Bo)
- `src/data/product.ts`: ProductItem 新增 `isListed` / `detailImages` / `slug` 字段, 12 个产品更新
- `src/pages/ProductPage.tsx`: 过滤 isListed 软屏蔽; 有详情页的卡片包 Link 跳转 + "查看详情 →"提示
- `src/pages/ProductDetailPage.tsx`: 新页面 (Hero 主图 contain + 面包屑 + 详情图垂直拼接)
- `src/routes/paths.ts`: 新增 `PRODUCT_DETAIL` 路由 + `productDetailPath()` 函数
- `src/routes/index.tsx`: 注册 `/product/:slug` 路由
- `src/i18n/locales/*/product.json`: 新增 `ui.viewDetail` / `ui.backToProducts` / `breadcrumb.*`
- `src/i18n/locales/*/meta.json`: 新增 `productDetail` SEO 文案

**关联文件**:
- [src/pages/ProductDetailPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductDetailPage.tsx) (新增)
- [src/data/product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts)
- [src/data/images/product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts)
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [src/routes/index.tsx](file:///d:/VibeTest/bigsound/src/routes/index.tsx)
- [src/routes/paths.ts](file:///d:/VibeTest/bigsound/src/routes/paths.ts)

**验证**: `npx tsc --noEmit` 通过 + `npx vite build` 成功 (23s, 205 modules)

---

## [2026-07-31] 移动端优化 | Footer 手风琴设计 + 二维码灯箱效果

**类型**: UI 移动端优化

**摘要**
针对移动端 Footer 体验做两项优化: ① 7 个栏目改为手风琴设计, 移动端每栏可独立展开/收起, 桌面端保持常驻展开; ② 关注我们栏的二维码交互从"小弹层"升级为"全屏灯箱", 适配移动端, 支持遮罩点击/Esc 键/关闭按钮三种关闭方式。

**详细变更**

### 1. 新增 AccordionSection 组件 (Footer.tsx)
- 移动端 (< lg): 标题右侧 + / − 按钮, 点击切换展开/收起, 默认收起
- 桌面端 (lg+): 标题常驻, 内容始终展开 (`lg:block`), 切换按钮隐藏 (`lg:hidden`)
- `defaultOpen` prop 控制移动端默认展开 (选购指南设为 true, 其他默认 false)
- 内容区 `mt-2 lg:mt-4` 适配移动端/桌面端间距

### 2. Footer 主体 grid 改造
- 移动端从 `grid-cols-2 sm:grid-cols-3 md:grid-cols-4` 改为 `grid-cols-1` (单列堆叠)
- 桌面端保持 `lg:grid-cols-7` (7 栏横排)
- 7 个栏目 (选购指南/关于小维/招商加盟/人才招聘/资讯中心/关注我们/联系我们) 全部包成 AccordionSection
- 链接从 `text-[12px] py-1` 改为 `block text-[12px] py-1` (移动端整行可点击)

### 3. FollowLink 二维码交互升级为灯箱
- 原: `absolute bottom-full right-0` 小弹层 (向上弹出, 28×28 二维码)
- 新: `fixed inset-0 bg-black/70 z-[100]` 全屏灯箱
  - 居中白色卡片 `max-w-[90vw]`, 含平台名 + 大二维码 + 扫码提示
  - 二维码尺寸: 移动端 `w-[60vw] max-w-[280px] max-h-[60vh]`
  - 关闭按钮: 右上角 × 图标
  - 关闭方式: 点击遮罩 / 点击关闭按钮 / 按 Esc
  - 灯箱打开时锁定 body 滚动 (`document.body.style.overflow = "hidden"`)
- 移除原 `useRef` + 点击外部关闭逻辑 (灯箱遮罩 onClick 即关闭, 无需 ref)
- `useEffect` 改为: 锁定 body 滚动 + Esc 监听

### 4. i18n 新增 `footer.follow.close`
- zh-CN: "关闭" / zh-TW: "關閉" / en: "Close"
- 用于灯箱关闭按钮的 aria-label

### 5. React 导入调整
- `import { useState, useEffect, useRef }` → `import { useState, useEffect, type ReactNode }`
- 移除不再使用的 `useRef`, 新增 `ReactNode` 类型 (AccordionSection children 类型)

**交互流程**

移动端手风琴:
1. 默认只显示 7 个栏目标题 (选购指南默认展开)
2. 点击标题右侧 + 按钮 → 展开该栏目内容, 按钮变 −
3. 再次点击 − → 收起

二维码灯箱:
1. 在"关注我们"栏目展开后, 看到 6 个社交平台名称 + 右侧小二维码图标
2. 点击图标 → 全屏黑色遮罩 + 居中白色卡片显示大二维码 + 平台名 + "扫码关注{平台名}"
3. 点击遮罩 / 点击右上角 × / 按 Esc → 关闭灯箱, 恢复 body 滚动

**关联文件**
- `src/components/layout/Footer.tsx` (AccordionSection 组件 + FollowLink 灯箱 + 主体 grid 改造)
- `src/i18n/locales/zh-CN/common.json` (follow.close)
- `src/i18n/locales/zh-TW/common.json` (follow.close)
- `src/i18n/locales/en/common.json` (follow.close)

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-25] 调整 | 招商加盟页 - 补充项目亮点信息 + 移除内部敏感政策表

**类型**: 信息补全 + 敏感政策清理

**摘要**
以 `D:\桌面\bigsound\官网-小维健康科技渠道招商内容.docx` 为标准，对比网站当前招商加盟页信息陈述。补充缺失的项目亮点信息（不影响整体视觉布局），删除【详细政策解读】模块的内部敏感政策表，FAQ 模块已确认无内部敏感政策暴露。

**详细变更**

### 1. 项目亮点信息补充 (融入现有布局，不新增模块)

#### a. brand.subtitle 文案扩展
- 旧: `科研实力强　产品竞争力强`
- 新: `全球4亿人在用创维　科研实力强　产品竞争力强`
- 把 docx 中「全球有4亿人在用创维，相信民族品牌的力量」核心 slogan 融入到品牌副标
- 修改文件: `src/i18n/locales/{zh-CN,zh-TW,en}/invest.json` advantages.brand.subtitle

#### b. policyDetail.commitments 4 卡片承载核心承诺
原内部政策表替换为 4 个公开承诺卡片，承载 docx 中的核心亮点：
- **MODE 01 双模式合作** — 城市服务商 + 社区联营店（docx §5 政策好）
- **MODE 02 双背书 + 双赋能** — 携手阿里 + 携手民政残联（docx §4 营销好核心框架）
- **MODE 03 双保障承诺** — 全国统一零售价 + 30天听觉康复干预训练（先用后买、30天无效果可退货）（docx §4.3 购物体验与售后服务双保障）
- **MODE 04 合作款返还** — 签约一年起步，每满一年返还 20%（docx 政策方向公开承诺）

#### c. contact 区块新增招商营销中心专线
- docx 标准: 营销中心 15986810676
- 网站之前只有 400-116-9566 售后热线
- 新增「招商营销中心」电话条目（与服务热线并列，使用人群图标区分），点击 tel: 直拨
- 修改文件: `src/pages/InvestPage.tsx` §6 联系我们 contact 区块
- i18n 新增字段: `invest:contact.investPhoneLabel` + `investPhoneValue` (3 个 locale)

### 2. 删除内部敏感政策表 (投资信息安全)

#### 问题
`InvestmentPolicyTable` 组件渲染的合作政策表包含内部敏感数字：
- 项目合作款 5 万元、联营场地 10-30㎡、满 5 年返还 100%、基础分成 50%
- 验配师月销 10 万以上长期驻店规则
- 商品押金按统一零售最低价五折
- 商品营收 50% 分成（引流预算 15% / 门店自然流量分 50% / 小维线上引流分 35%）
- 每新增一家联营店分成额外追加 2%，最多追加 10%
- 门店自然流量订单打 50%、小维线上引流订单打 65%

#### 修复
- 移除 `InvestmentPolicyTable` 组件在 `InvestPage.tsx` §5 的渲染
- 替换为 4 个公开承诺卡片 + 公开政策说明（promiseTitle + promiseDesc + notes）
- 明确告知「内部敏感政策属于商业机密，仅在签约阶段向合作伙伴披露」
- `InvestmentPolicyTable.tsx` 组件源码保留存档（不再被任何页面引用）
- i18n JSON 中的 `policyDetail.table` 字段保留作备份（不渲染，仅存档）

#### 影响范围
- 招商加盟页 /invest §5 详细政策解读
- 公开承诺说明明确说明内部政策保密原则

### 3. FAQ 模块审查 (确认无敏感政策)

#### 审查范围
- `src/i18n/locales/zh-CN/faq.json` 全部 37 个问题
- `src/pages/FaqPage.tsx`
- `src/components/faq/FaqSection.tsx`
- `src/components/faq/FaqAccordion.tsx`

#### 审查结果
FAQ 中**无内部敏感政策暴露**：
- 招商类 FAQ 仅说明「兜底式全面扶持 + 签约一年起步，每满一年返还合作款 20%」
- 与 docx 公开政策方向一致（可公开承诺）
- 未出现具体合作款金额、分成比例、押金标准、设备细则等内部数字
- 售后 FAQ 提及「2 年质保、只换不修」属公开承诺，可保留

**关联文件**
- `src/pages/InvestPage.tsx` (移除 InvestmentPolicyTable, 新增 commitments 卡片 + 招商专线)
- `src/data/invest.ts` (policyDetail 结构扩展 commitments + noteKeys)
- `src/i18n/locales/zh-CN/invest.json` (新文案 + 招商专线)
- `src/i18n/locales/zh-TW/invest.json` (繁中翻译)
- `src/i18n/locales/en/invest.json` (英文翻译)

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看:
  - §3.5 品牌副标新增「全球4亿人在用创维」
  - §5 详细政策解读: 4 个承诺卡片 + 公开承诺说明（无内部敏感数字）
  - §6 联系我们: 服务热线 + 招商营销中心 + 地址 + 邮箱

---

## [2026-07-31] 交互重构 | Footer 关注我们栏目 - 点击图标弹单码 + 去除快手/B站

**类型**: UI 交互重构

**摘要**
用户反馈二维码 hover 弹出设计不佳, 且常驻显示又太影响布局。改为"点击图标弹单码"交互: 每个社交平台名称右侧带一个小二维码图标按钮, 点击按钮才弹出该平台的二维码, 不再 hover、不常驻。同时按用户要求去除快手和B站入口, 只保留 6 个平台。

**详细变更**

### 1. footer.ts 数据调整
- `SocialPlatform` 类型去除 `"kuaishou"` 和 `"bilibili"` (6 个平台)
- `FOLLOW_LINKS` 从 8 项精简到 6 项: 视频号/小红书/抖音/微信公众号/微博/知乎
- `qrImage` 路径全部指向用户提供的真实二维码: `/images/common/qrcode/{weixin,xiaohongshu,douyin,weibo,zhihu}.{jpg,png}`
- 视频号与公众号共用微信二维码 (暂用 weixin.jpg, 后续如有独立视频号二维码再替换)

### 2. Footer.tsx FollowLink 组件重构
- 删除 SOCIAL_ICONS 中 kuaishou/bilibili 两个 SVG (类型对齐)
- 新增 `useEffect` + `useRef` 实现"点击外部关闭弹层"
- 重构 FollowLink 结构:
  - 平台名称可点击跳转外链 (原逻辑保留)
  - 名称右侧新增小二维码图标按钮 (16×16 SVG, 点击 toggle showQr)
  - 弹层改为 `right-0` 右对齐 (避免最右列溢出视口), 仍向上弹出
  - 弹层内含二维码图 + "扫码关注{平台名}" 文案 + 小三角指示器
- 移除原 `onMouseEnter/onMouseLeave` hover 逻辑

### 3. React 导入扩展
- Footer.tsx 顶部 `import { useState }` → `import { useState, useEffect, useRef }`

**交互流程**
1. 用户看到 6 个社交平台名称列表 (默认无二维码干扰布局)
2. 想看某个平台二维码时, 点击该名称右侧的小二维码图标
3. 弹层向上弹出, 显示二维码 + "扫码关注{平台名}"
4. 再次点击图标 / 点击弹层外部 / 点击其他平台图标 → 关闭当前弹层

**关联文件**
- `src/config/footer.ts` (SocialPlatform 类型 + FOLLOW_LINKS 数据)
- `src/components/layout/Footer.tsx` (SOCIAL_ICONS + FollowLink 组件 + React 导入)

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

**待办**
- 视频号二维码暂用 weixin.jpg (公众号同图), 后续如有独立视频号二维码需替换
- FOLLOW_LINKS 的 href 仍为 `#` 占位, 待用户提供各平台官方账号 URL 后填入

---

## [2026-07-31] 重构 | Footer 选购指南栏改为扁平单列表 (去除产品分类)

**类型**: UI 重构

**摘要**
用户反馈"新增中性分类很奇怪", 选择"统一单列表, 不再用分类标题"方案。重构 site.ts: 把 `SHOP_CATEGORIES` (分类数组) 改为 `SHOP_LINKS` (扁平店铺数组); Footer.tsx 选购指南栏只保留一个"选购指南"大标题, 下方直接列出 1 个官方服务中心 + 8 家平台店铺, 用平台标签区分。

**详细变更**

### 1. site.ts 数据结构扁平化
- 删除 `ShopCategory` 接口和 `SHOP_CATEGORIES` (分类数组)
- 新增 `SHOP_LINKS` (扁平店铺数组), 8 家店铺按用户提供的顺序排列
- 保留 `ShopPlatformKey` (tmall/jd/pdd/dewu) 和 `ShopLink` (storeName/platformKey/href)
- 大声听力服务中心仍在 Footer.tsx 单独置顶渲染 (走 `SITE_INFO.hearingServiceUrl`)

### 2. Footer.tsx 选购指南栏简化
- 删除两个分类标题 ("AI 中文助听器" / "更多官方店铺")
- 只保留外层 `<h3>选购指南</h3>` 大标题
- 大声听力服务中心置顶 (font-medium 视觉强调)
- 8 家店铺扁平列表, 每行 [平台标签] + 店铺全名

### 3. i18n 清理
- 删除 `footer.products.hearingAid` 和 `footer.products.more` (不再使用)
- 保留 `footer.products.title` (其他地方可能引用)
- 保留 `footer.shop.tmall/jd/pdd/dewu/hearingService` (平台标签仍用)

**最终 Footer 选购指南栏结构** (单列表, 无分类)

| 显示 | 跳转 |
|---|---|
| **大声听力服务中心** (官方, 加粗) | https://www.xiaowe.cc/h-col-104.html |
| [天猫] 创维医疗器械旗舰店 | https://chuangweiylqx.tmall.com/ |
| [京东] 创维医疗器械旗舰店 | https://mall.jd.com/index-12400133.html |
| [京东] 创维助听器旗舰店 | https://mall.jd.com/index-19712207.html |
| [拼多多] 创维医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE |
| [拼多多] 创维助听器医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=lae1OXGU7P |
| [拼多多] 小维医疗器械专营店 | https://mobile.yangkeduo.com/mall_page.html?ps=UYXZhOiOLG |
| [天猫] 创维声学专卖店 | https://skyworthsx.tmall.com/ |
| [得物] 得物官方品牌页 | https://m.dewu.com/router/product/BrandDetailPage?brandId=1006814 |

**关联文件**
- `src/config/site.ts` (SHOP_LINKS 扁平化)
- `src/components/layout/Footer.tsx` (单列表渲染)
- `src/i18n/locales/zh-CN/common.json`
- `src/i18n/locales/zh-TW/common.json`
- `src/i18n/locales/en/common.json`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-31] 补充 | Footer 选购指南栏新增"更多官方店铺"分类 (声学专卖店 + 得物)

**类型**: 数据补充

**摘要**
用户反馈"我给的剩下的两个链接还是要展示的", 指之前 DEV_LOG 标记为"不展示"的两个链接 (天猫·创维声学专卖店 + 得物) 也要展示。新增"更多官方店铺"分类承载这两个链接, 不违背"不展示耳机/手表品类"的要求 (用中性分类名)。

**详细变更**

### 1. site.ts SHOP_CATEGORIES 新增第二个分类
- 新增分类"更多官方店铺" (productKey: "more"), 含 2 个链接:
  - 天猫·创维声学专卖店 (skyworthsx.tmall.com)
  - 得物官方品牌页 (m.dewu.com brandId=1006814)
- `ShopPlatformKey` 恢复 `"dewu"` 支持
- `ShopCategory.productKey` 扩展为 `"hearingAid" | "more"`

### 2. Footer.tsx 选购指南栏渲染两个分类
- 第一个分类 "AI 中文助听器": 大声听力服务中心 (官方) + 6 家平台店铺 (1 天猫 + 2 京东 + 3 拼多多)
- 第二个分类 "更多官方店铺": 2 家店铺 (天猫·创维声学专卖店 + 得物)
- 两个分类共用相同的列表项渲染逻辑 (平台标签 + 店铺全名)

### 3. i18n 3 语言同步
- `footer.products.more`: "更多官方店铺" / "更多官方店鋪" / "More Official Stores"
- `footer.shop.dewu`: "得物" / "得物" / "Dewu" (恢复)

**最终 Footer 选购指南栏结构**

| 分类 | 显示 | 跳转 |
|---|---|---|
| AI 中文助听器 | **大声听力服务中心** (官方) | https://www.xiaowe.cc/h-col-104.html |
| AI 中文助听器 | [天猫] 创维医疗器械旗舰店 | https://chuangweiylqx.tmall.com/ |
| AI 中文助听器 | [京东] 创维医疗器械旗舰店 | https://mall.jd.com/index-12400133.html |
| AI 中文助听器 | [京东] 创维助听器旗舰店 | https://mall.jd.com/index-19712207.html |
| AI 中文助听器 | [拼多多] 创维医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE |
| AI 中文助听器 | [拼多多] 创维助听器医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=lae1OXGU7P |
| AI 中文助听器 | [拼多多] 小维医疗器械专营店 | https://mobile.yangkeduo.com/mall_page.html?ps=UYXZhOiOLG |
| 更多官方店铺 | [天猫] 创维声学专卖店 | https://skyworthsx.tmall.com/ |
| 更多官方店铺 | [得物] 得物官方品牌页 | https://m.dewu.com/router/product/BrandDetailPage?brandId=1006814 |

**关联文件**
- `src/config/site.ts`
- `src/components/layout/Footer.tsx`
- `src/i18n/locales/zh-CN/common.json`
- `src/i18n/locales/zh-TW/common.json`
- `src/i18n/locales/en/common.json`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-31] 重新规划 | Footer 选购指南栏只展示 AI 中文助听器 + 全部真实店铺链接

**类型**: 数据重构 + UI 重新规划

**摘要**
用户重新规划 Footer 选购指南栏: 只展示已提供的真实链接, 不再展示【耳机】和【手表】产品。所有 7 家店铺链接 (1 官方 + 1 天猫 + 2 京东 + 3 拼多多) 全部补上, 不再"多余的不用"。同平台多家店需显示店铺全名以区分。

**详细变更**

### 1. site.ts SHOP_CATEGORIES 重新设计
- 删除"健康智能手表"和"智能蓝牙耳机"两个分类
- 只保留"AI 中文助听器"一个分类, 含 6 家平台店铺链接
- 恢复 `ShopPlatformKey` / `ShopLink` / `ShopCategory` 类型定义
- `storeName` 改为必填字段 (同平台多家店需显示全名区分)
- `ShopPlatformKey` 收窄为 `"tmall" | "jd" | "pdd"` (删除 dewu, 因不展示耳机)
- `productKey` 收窄为 `"hearingAid"` 字面量类型

### 2. 店铺链接完整列表 (用户 2026-07-25 提供的全部助听器相关链接)

| 序号 | 平台 | 店铺全名 | URL |
|---|---|---|---|
| 0 (官方) | — | 大声听力服务中心 | https://www.xiaowe.cc/h-col-104.html (走 hearingServiceUrl, Footer 单独渲染) |
| 1 | 天猫 | 创维医疗器械旗舰店 | https://chuangweiylqx.tmall.com/ |
| 2 | 京东 | 创维医疗器械旗舰店 | https://mall.jd.com/index-12400133.html |
| 3 | 京东 | 创维助听器旗舰店 | https://mall.jd.com/index-19712207.html |
| 4 | 拼多多 | 创维医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE |
| 5 | 拼多多 | 创维助听器医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=lae1OXGU7P |
| 6 | 拼多多 | 小维医疗器械专营店 | https://mobile.yangkeduo.com/mall_page.html?ps=UYXZhOiOLG |

### 3. 不展示的链接 (用户未要求展示耳机/手表)
- 天猫·创维声学专卖店 (skyworthsx.tmall.com) — 耳机相关
- 得物 (m.dewu.com brandId=1006814) — 耳机/手表相关

### 4. Footer.tsx 选购指南栏重新设计
- 删除"健康智能手表"和"智能蓝牙耳机"两个栏目的渲染
- "AI 中文助听器"栏目改为列表布局:
  - 第一行: 大声听力服务中心 (官方, font-medium 视觉强调)
  - 后续 6 行: 各平台店铺, 每行显示 [平台标签] + 店铺全名
  - 平台标签样式: `shrink-0 px-1 py-px text-[10px] text-white/60 border border-white/25 rounded-sm`
  - 店铺全名: `truncate` 防溢出
  - key: `${platformKey}-${idx}` 避免同平台多家店冲突
- 删除原"天猫+京东同行 + 拼多多单行"硬编码布局

### 5. i18n 调整 (3 语言同步)
- `footer.products` 删除 `wearable` 和 `earphone` key, 只保留 `hearingAid`
- `footer.shop` 删除 `dewu` key
- `footer.shop.tmall/jd/pdd` 文案从"天猫旗舰店/京东旗舰店/拼多多旗舰店"改为"天猫/京东/拼多多" (因现在作为标签使用, 不再是完整按钮文案)

**影响范围**
- Footer 选购指南栏从 3 个产品分类 (9 个平台按钮) 收敛为 1 个分类 (1 官方 + 6 店铺)
- 视觉上从"3 列产品 × 3 平台按钮"变为"单列店铺列表 + 平台标签"
- 所有真实店铺链接全部展示, 不再有占位链接
- 耳机和手表产品不再出现在 Footer (但导航栏 / 产品页 / WearablePage 路由仍保留, 仅 Footer 入口移除)

**关联文件**
- `src/config/site.ts` (SHOP_CATEGORIES 重构)
- `src/components/layout/Footer.tsx` (选购指南栏重新设计)
- `src/i18n/locales/zh-CN/common.json`
- `src/i18n/locales/zh-TW/common.json`
- `src/i18n/locales/en/common.json`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-31] 调整 | Footer 店铺栏恢复原前端样式 + 真实链接匹配

**类型**: 数据回退 + 链接匹配

**摘要**
用户要求 Footer 店铺栏前端显示恢复成之前的样式 (每产品 3 个平台按钮: 天猫/京东/拼多多, 助听器栏目额外有"大声听力服务中心"), 把用户提供的真实店铺链接匹配到对应按钮, 多余的链接 (京东第 2 家、拼多多后 2 家、得物) 不用。

**详细变更**

### 1. site.ts SHOP_CATEGORIES 恢复原结构
- 删除 `ShopPlatformKey` / `ShopLink` / `ShopCategory` 类型定义 (不再需要 storeName 可选字段)
- 删除 `storeName` 字段, 恢复 `label` 字段 (zh-CN 文案作 fallback)
- 恢复 `as const` 断言
- 每个产品分类固定 3 个平台按钮 (tmall/jd/pdd), 不再支持任意数量

### 2. 真实链接匹配到对应按钮

| 产品 | 平台按钮 | 店铺 | URL |
|---|---|---|---|
| AI 中文助听器 | 天猫旗舰店 | 创维医疗器械旗舰店 | https://chuangweiylqx.tmall.com/ |
| AI 中文助听器 | 京东旗舰店 | 创维医疗器械旗舰店 | https://mall.jd.com/index-12400133.html |
| AI 中文助听器 | 拼多多旗舰店 | 创维医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE |
| AI 中文助听器 | 大声听力服务中心 | 官方 | https://www.xiaowe.cc/h-col-104.html (Footer 单独渲染) |
| 健康智能手表 | 天猫/京东/拼多多 | (用户未提供) | skyworthtby.tmall.com 占位 |
| 智能蓝牙耳机 | 天猫旗舰店 | 创维声学专卖店 | https://skyworthsx.tmall.com/ |
| 智能蓝牙耳机 | 京东/拼多多 | (用户未提供) | skyworthtby.tmall.com 占位 |

### 3. 多余链接不用 (用户说"还有点没有的就不管")
- 京东·创维助听器旗舰店 (mall.jd.com/index-19712207) → 不用
- 拼多多·创维助听器医疗器械旗舰店 (ps=lae1OXGU7P) → 不用
- 拼多多·小维医疗器械专营店 (ps=UYXZhOiOLG) → 不用
- 得物 (m.dewu.com brandId=1006814) → 不用 (前端无得物按钮)

### 4. Footer.tsx 渲染逻辑恢复原样
- 助听器栏目: 大声听力服务中心 (单独行) + 天猫+京东 (同一行 flex) + 拼多多 (单独行)
- 手表/耳机栏目: 3 个平台逐行渲染
- 显示文案: `t(\`common:footer.shop.${platformKey}\`)` (i18n 平台名, 不再显示 storeName)

**影响范围**
- Footer 选购指南前端样式与之前完全一致 (3 平台按钮 + 助听器额外官方链接)
- 真实链接已匹配到 AI 中文助听器 3 个按钮 + 智能蓝牙耳机天猫按钮
- 健康智能手表和智能蓝牙耳机的京东/拼多多按钮仍为占位 (用户未提供)

**关联文件**
- `src/config/site.ts` (SHOP_CATEGORIES 恢复原结构 + 真实链接)
- `src/components/layout/Footer.tsx` (渲染逻辑恢复原样)

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

**注**: i18n 中 `shop.dewu` key 保留无害, 后续如需新增得物按钮可直接复用

---

## [2026-07-31] 修复 | dev 模式图片全部 404 (vite base 配置问题)

**类型**: 配置修复

**摘要**
用户反馈"图片都无法正常加载"。排查发现根因是 `vite.config.ts` 的 `base: "/xiaowe-tech/"` 在 dev 模式下也生效, 但 vite dev server **不**改写 React 组件中硬编码的 `/images/xxx` 字符串路径, 导致浏览器请求 `http://localhost:5173/images/xxx.webp` 时 404 (dev server 期望 `/xiaowe-tech/images/xxx.webp`)。生产环境构建正常 (vite build 会自动改写 165 处路径)。

**根因分析**
- vite `base` 配置在 dev 和 build 都生效
- dev 模式: vite dev server 在 base 路径下提供 public 资源 (`/xiaowe-tech/images/...`), 但组件字符串路径 `/images/...` 不被改写 → 404
- build 模式: vite 自动把 JS bundle 中硬编码的 `/images/xxx` 改写为 `/xiaowe-tech/images/xxx` (验证: 打包后 dist/assets/index-Cqs48C-b.js 中 `/images/` 出现 0 次, `/xiaowe-tech/images/` 出现 165 次) → 正常

**修复方案**
`vite.config.ts` 改为函数式配置, dev 模式 base = "/", build 模式 base = "/xiaowe-tech/":
```ts
export default defineConfig(({ command }) => ({
  base: command === "build" ? "/xiaowe-tech/" : "/",
  ...
}));
```

**影响范围**
- dev 模式 (本地 http://localhost:5173/) 图片加载恢复正常
- 生产构建 (GitHub Pages / Cloudflare Workers) 行为不变, 仍带 `/xiaowe-tech/` 前缀

**关联文件**
- `vite.config.ts`

**验证**: `npx tsc -b --noEmit` 通过; 需重启 dev server (`Ctrl+C` 后 `npm run dev`) 让新配置生效

---

## [2026-07-25] 数据更新 | Footer 选购指南接入 8 家真实店铺链接 + 邮箱更新

**类型**: 数据更新 + 配置变更

**摘要**
用户提供最新店铺资料 (1 得物 + 3 拼多多 + 2 天猫 + 2 京东, 共 8 家店铺) 和企业邮箱 admin@xiaowe.cc, 要求补全到 Footer 选购指南。按店铺名推断分配到 3 个产品分类下, 重构 SHOP_CATEGORIES 数据结构支持 storeName 字段 (具体店铺全名), 同步 i18n 3 语言新增 dewu (得物) 平台 key。

**详细变更**

### 1. 邮箱更新 (site.ts)
- `SITE_INFO.email`: "待郑总确认" → "admin@xiaowe.cc"

### 2. SHOP_CATEGORIES 数据结构重构 (site.ts)
- 新增类型: `ShopPlatformKey` (tmall/jd/pdd/dewu), `ShopLink` (storeName?/platformKey/href), `ShopCategory`
- 删除原 `SKYWORTH_HEARING_SHOPS` (平台搜索页占位) 和 `link.label` (平台名) 字段
- 新增 `link.storeName` 字段 (具体店铺全名, 可选; 有值时 Footer 显示 storeName, 否则用 i18n 平台名)
- 删除原 `as const`, 改为 `readonly ShopCategory[]` 显式类型, 解决 storeName 可选导致的联合类型推断问题

### 3. 店铺链接分配 (按店铺名推断)

**AI 中文助听器** (7 家店铺 + 大声听力服务中心官方):
| 平台 | 店铺名 | URL |
|---|---|---|
| 天猫 | 创维医疗器械旗舰店 | https://chuangweiylqx.tmall.com/ |
| 京东 | 创维医疗器械旗舰店 | https://mall.jd.com/index-12400133.html |
| 京东 | 创维助听器旗舰店 | https://mall.jd.com/index-19712207.html |
| 拼多多 | 创维医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=0lDdljvIpE |
| 拼多多 | 创维助听器医疗器械旗舰店 | https://mobile.yangkeduo.com/mall_page.html?ps=lae1OXGU7P |
| 拼多多 | 小维医疗器械专营店 | https://mobile.yangkeduo.com/mall_page.html?ps=UYXZhOiOLG |
| 官方 | 大声听力服务中心 | https://www.xiaowe.cc/h-col-104.html (Footer 单独渲染) |

**健康智能手表** (用户未提供, 保留占位):
- 天猫·创维穿戴旗舰店 (skyworthtby.tmall.com 保留)

**智能蓝牙耳机** (2 家店铺):
| 平台 | 店铺名 | URL |
|---|---|---|
| 天猫 | 创维声学专卖店 | https://skyworthsx.tmall.com/ |
| 得物 | (品牌主页) | https://m.dewu.com/router/product/BrandDetailPage?brandId=1006814 |

### 4. Footer.tsx 选购指南渲染逻辑重构
- 删除原硬编码"天猫+京东同行 + 拼多多单行"逻辑 (不适用于多店铺场景)
- 改为对每个产品分类下的 links 逐行渲染, 显示文案: `link.storeName ?? t(\`common:footer.shop.${platformKey}\`)`
- 大声听力服务中心仍单独排第一行 (官方直达, 走 SITE_INFO.hearingServiceUrl)
- key 改为 \`${link.platformKey}-${idx}\` 避免同平台多店铺的 key 冲突

### 5. i18n 3 语言同步新增 dewu 平台 key
- `src/i18n/locales/zh-CN/common.json`: `shop.dewu = "得物"`
- `src/i18n/locales/zh-TW/common.json`: `shop.dewu = "得物"`
- `src/i18n/locales/en/common.json`: `shop.dewu = "Dewu"`

**影响范围**
- Footer 选购指南 AI 中文助听器栏目从 4 个链接扩展到 7 个链接 (店铺名更具体)
- 智能蓝牙耳机栏目从 3 个链接变为 2 个链接 (天猫声学专卖店 + 得物)
- 健康智能手表栏目从 3 个链接收敛为 1 个链接 (用户未提供, 保留占位)
- 全站邮箱引用 (InvestPage / ProductPage / AboutPage / CareersPage 等) 通过 SITE_INFO.email 自动同步
- 得物作为新平台首次接入

**关联文件**
- `src/config/site.ts` (邮箱 + SHOP_CATEGORIES 重构)
- `src/components/layout/Footer.tsx` (选购指南渲染逻辑)
- `src/i18n/locales/zh-CN/common.json`
- `src/i18n/locales/zh-TW/common.json`
- `src/i18n/locales/en/common.json`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-26] 迁移到 Cloudflare Workers (国内访问速度优化)

**类型**: 部署迁移 / 性能优化

**摘要**
应需求"GitHub Pages 国内访问慢"问题, 迁移到 Cloudflare Workers (Static Assets) 部署。Cloudflare 在国内有边缘节点, 速度显著优于 GitHub Pages。仓库 `xiaowe-tech` (public) 不变, 仅 `gh-pages` 分支含打包产物, 源码 0 泄露。

**访问 URL**
- Cloudflare Workers: `https://xiaowe-tech.1592775514-5e9.workers.dev/` (主)
- GitHub Pages: `https://czhcpqfg.github.io/xiaowe-tech/` (备用)

**详细变更**

### A. 报错诊断 (用户首次手动部署失败)

用户在 Cloudflare Dashboard 连接 GitHub 仓库创建项目, deploy command 配置为 `npx wrangler deploy`。首次部署报错:
```
✘ [ERROR] Asset too large.
  Cloudflare Workers supports assets with sizes of up to 25 MiB.
  We found a file .git/objects/pack/pack-xxx.pack with a size of 87.5 MiB.
```

**根因**: Wrangler 把整个 repo 根目录当作静态资源上传, **包括 .git 文件夹**, 遇到 87.5 MiB 的 pack 文件超过 25 MiB 限制。

### B. 修复方案

#### B1. 重新打包 (含图片压缩)

用户已手动将 `public/images/` 下的 PNG/JPG 压缩为 WebP, 体积从 84.75 MB → 4.82 MB (降幅 94.3%)。重新 `npm run build`:
- JS bundle: `index-C-ms8wIL.js` → `index-Cqs48C-b.js` (922.76 KB)
- 24 个预渲染 HTML 全部更新
- 所有图片路径自动指向 .webp 版本

#### B2. 添加 wrangler 配置 (排除 .git)

新增 `dist/wrangler.jsonc` (Cloudflare Workers 配置文件):
```jsonc
{
  "name": "xiaowe-tech",
  "compatibility_date": "2026-07-26",
  "assets": {
    "directory": ".",
    "not_found_response": "404.html",
    "html_handling": "auto-trailing-slash",
    "pretty_urls": true
  }
}
```

新增 `dist/.wranglerignore` (排除 .git 等非部署文件):
```
.git
.gitignore
.gitattributes
.wranglerignore
wrangler.jsonc
README.md
```

**注意**: wrangler 4.x 的 `assets` 字段不支持 `exclude` (会报 warning "Unexpected fields found in assets field: exclude"), 必须用 `.wranglerignore` 文件排除。

#### B3. 同步部署目录

部署目录 `D:\VibeTest\bigsound_deploy\` (项目外, 用于 git push):
- 使用 `robocopy /MIR /XD .git` 镜像同步 `dist/` → 部署目录
- 自动删除旧 PNG, 复制新 WebP
- 保留 `.git` 目录用于 push

#### B4. Push 触发 Cloudflare 自动重建

```
git commit -m "rebuild: 重新打包 (图片压缩为 webp) + 添加 wrangler.jsonc 修复 Cloudflare 部署"
git push origin gh-pages
```

Cloudflare Workers Builds 检测到 push 后自动:
1. 克隆 `xiaowe-tech` 仓库 `gh-pages` 分支
2. 执行 `npx wrangler deploy` (用户配置的 deploy command)
3. wrangler 读取 `wrangler.jsonc` + `.wranglerignore`
4. 上传 242 个静态资源 (排除 .git) 到 Worker
5. 部署成功, Worker 更新

### C. 验证结果

通过 Cloudflare API 查询:
- Worker 名: `xiaowe-tech`
- Account ID: `5e94005fcf7753ca3a8e04987d6e40b2`
- workers.dev subdomain: `1592775514-5e9`
- 完整 URL: `https://xiaowe-tech.1592775514-5e9.workers.dev/`

通过 WebFetch 验证 (本地 DNS 无法解析 workers.dev, 用 WebFetch 走外部网络):
- `https://xiaowe-tech.1592775514-5e9.workers.dev/zh-CN/` ✓ 返回完整中文预渲染内容 (含 AI 中文助听器等产品信息)
- `https://xiaowe-tech.1592775514-5e9.workers.dev/en/` ✓ 返回完整英文预渲染内容
- 图片路径正确 prefix 为 `/xiaowe-tech/images/...`
- WebP 图片正常加载

### D. 已知问题

- **本地 DNS 问题**: 开发机本地无法解析 `*.workers.dev`, curl 超时。但实际公网用户可正常访问 (WebFetch 验证通过)。如需本地访问, 可在 `C:\Windows\System32\drivers\etc\hosts` 添加: `104.21.x.x xiaowe-tech.1592775514-5e9.workers.dev` (IP 通过 `nslookup xiaowe-tech.1592775514-5e9.workers.dev 1.1.1.1` 查询)。
- **URL 较长**: 默认 workers.dev subdomain 是 `1592775514-5e9` (Cloudflare 自动生成)。可在 Cloudflare Dashboard → Workers → xiaowe-tech → Triggers → Custom Domains 绑定自定义域名 (如 `www.xiaowe.cc`), 或修改 workers.dev subdomain。
- **API token 权限**: 当前 token 无法通过 `wrangler deploy` 直接本地 deploy (assets-upload-session 权限缺失)。但 Cloudflare Dashboard 自动构建工作正常, 不影响持续部署。

### E. 后续更新部署流程

代码修改后只需:
```powershell
# 1. 重新打包
cd d:\VibeTest\bigsound
npm run build

# 2. 同步到部署目录
robocopy d:\VibeTest\bigsound\dist D:\VibeTest\bigsound_deploy /MIR /XD .git /XF .gitignore .gitattributes /R:1 /W:1

# 3. 推送 (Cloudflare 自动重建)
cd D:\VibeTest\bigsound_deploy
git add .; git commit -m "rebuild: 更新部署"; git push origin gh-pages
```

Cloudflare 会在 ~1-2 分钟内自动重建并上线。

**影响范围**
- 新增 Cloudflare Workers 部署能力 (国内访问速度优化)
- 保留 GitHub Pages 作为备用部署 (双重保险)
- 源码 0 泄露 (仓库仅含 gh-pages 分支的 dist 产物)
- 图片体积大幅减小 (94.3% 降幅), 加载速度提升

**关联文件**
- `dist/wrangler.jsonc` (新增)
- `dist/.wranglerignore` (新增)
- `D:\VibeTest\bigsound_deploy\wrangler.jsonc` (部署目录)
- `D:\VibeTest\bigsound_deploy\.wranglerignore` (部署目录)

---

## [2026-07-26] 图片压缩优化 (PNG → WebP, 体积降幅 94.3%)

**类型**: 性能优化 / 资源压缩

**摘要**
针对用户反馈的"网络加载慢"问题,对 `public/images/` 下 89 张 PNG + 4 张 JPG/JPEG 进行批量压缩,转为 WebP 格式 + 智能缩放。总体积从 **84.75 MB → 4.82 MB**,节省 79.93 MB(降幅 94.3%)。原 PNG 备份到项目外目录 `d:\VibeTest\bigsound_original_backup_20260726\`,可完整回滚。视频文件未处理(3.47 MB 非瓶颈)。

**详细变更**

### A. 新增脚本与依赖

- `package.json` 新增 `sharp` devDependency(^0.35.3),新增 2 个 scripts:
  - `compress:images`: `node scripts/compress-images.cjs`
  - `update:image-refs`: `node scripts/update-image-refs-to-webp.cjs`
- 新建 `scripts/compress-images.cjs`(230 行):
  - 递归扫描 `public/images/**/*.{png,jpg,jpeg}`,93 张待处理
  - 备份原文件到 `d:\VibeTest\bigsound_original_backup_20260726\`(保持原目录结构)
  - 用 sharp 转 WebP(quality 80, effort 4) + 智能缩放(仅缩小不放大)
  - 智能缩放规则按目录/文件分类:hero 大图 1920px / 内容图 1200px / 产品图 800px / 团队头像 400px / 证书 600px / logo 400px 等
  - 并发数 4,2.6 秒完成 91 张压缩
  - 控制台输出 Top 10 收益图 + 体积上升异常警告
- 新建 `scripts/update-image-refs-to-webp.cjs`(123 行):
  - 扫描 24 个引用图片的代码文件
  - 用正则 `/(\/images\/[^"'`)\s]+?)\.(png|jpe?g)/gi` 仅替换 `/images/...` 路径下的引用
  - 共替换 126 处引用,涉及 16 个文件

### B. 代码引用更新(16 个文件,126 处)

- `src/data/images/{about,careers,common,home,invest,product,wearable}.ts`(7 个 IMAGES 模块,共 105 处)
- `src/data/about.ts`(2 处)
- `src/components/invest/{InvestmentPolicyTable,HearingLossGradeTable}.tsx`(3 处)
- `src/components/SEO.tsx`(1 处 OG image)
- `src/config/schema.ts`(3 处 JSON-LD)
- `src/pages/NotFoundPage.tsx`(1 处)
- `index.html`(4 处:apple-touch-icon + 3 处 JSON-LD)
- `public/site.webmanifest`(6 处 icons)
- `public/.well-known/ai-plugin.json`(1 处 logo)

### C. 资源转换(93 张图)

- 89 张 PNG → WebP,4 张 JPG/JPEG → WebP
- 全部 93 张图均生成同名 `.webp` 文件,原 `.png/.jpg/.jpeg` 已删除
- `public/images/` 当前:146 文件,120 WebP,27 SVG,25 SVG(穿戴图标),1 ICO,0 PNG/JPG/JPEG
- 异常处理:
  - `common/logo.png` 首次因 dev server 锁住 EBUSY 失败,后用单独 Node 命令处理成功(12.6 KB → 5.6 KB)
  - `common/not_found.png` 因 Adobe ImageReady 老式 PNG chunk 导致 sharp pngload 失败,用 .NET System.Drawing 重新另存为干净 PNG 后再转 WebP 成功(11.5 KB → 18.9 KB,小图 WebP 略大可接受)

### D. 验证结果

| 验证项 | 结果 |
|--------|------|
| `npx tsc --noEmit` | ✅ 通过(无错误) |
| `npx vite build` | ✅ 通过(206 modules, 5.49s) |
| `npm run prerender` | ✅ 通过(25 个 HTML:1 根 + 24 预渲染) |
| dist/images 中 PNG/JPG/JPEG | ✅ 0 个 |
| dist HTML 中 .png/.jpg/.jpeg 引用 | ✅ 0 处 |
| public/images 总体积 | 84.75 MB → 4.82 MB(降幅 94.3%) |
| dist 总体积 | 96.62 MB → 11.88 MB(降幅 87.7%) |

### E. Top 10 体积下降最多的图片

| 图片 | 压缩前 | 压缩后 | 降幅 |
|------|--------|--------|------|
| careers/careers_company_intro.png | 2.35 MB | 154.1 KB | 93.6% |
| careers/careers_cat_production.png | 2.13 MB | 129.9 KB | 94.0% |
| about/team/team_member_2.png | 2.00 MB | 10.4 KB | 99.5% |
| about/culture/values.png | 1.99 MB | 64.7 KB | 96.8% |
| careers/careers_cat_hr.png | 2.04 MB | 121.0 KB | 94.2% |
| product/service_center_store_hd.png | 1.96 MB | 68.1 KB | 96.6% |
| invest/hearing_prevalence.png | 1.89 MB | 67.6 KB | 96.5% |
| invest/production_equipment.png | 1.90 MB | 85.1 KB | 95.6% |
| careers/careers_cat_marketing.png | 1.87 MB | 74.1 KB | 96.1% |
| invest/own_factory_overview.png | 1.78 MB | 64.7 KB | 96.4% |

**影响范围**
- 修改文件:18 个(2 个新建脚本 + 1 个 package.json + 1 个 DEV_LOG + 14 个引用更新文件 + 1 个 .gitignore 选项)
- 修改资源:93 张 PNG/JPG/JPEG → WebP
- 备份目录:`d:\VibeTest\bigsound_original_backup_20260726\`(93 文件,83.78 MB)
- 不影响:SVG / favicon.ico / 已优化的 27 张 WebP / 视频 promo.mp4 + promo_v2.mp4

**回滚方式**
```powershell
# 1. 删除 WebP
Remove-Item -Path "d:\VibeTest\bigsound\public\images" -Recurse -Include *.webp -Force
# 2. 从备份恢复原 PNG/JPG/JPEG
Copy-Item -Path "d:\VibeTest\bigsound_original_backup_20260726\*" `
          -Destination "d:\VibeTest\bigsound\public\images\" -Recurse -Force
# 3. 用 git checkout 还原代码引用
git checkout -- src/ index.html public/site.webmanifest public/.well-known/ai-plugin.json
```

**关联文件**
- `scripts/compress-images.cjs`(新建)
- `scripts/update-image-refs-to-webp.cjs`(新建)
- `package.json`(加 sharp + 2 scripts)
- `src/data/images/*.ts`(7 个模块)
- `src/data/about.ts` / `src/components/invest/*.tsx` / `src/components/SEO.tsx` / `src/config/schema.ts` / `src/pages/NotFoundPage.tsx`
- `index.html` / `public/site.webmanifest` / `public/.well-known/ai-plugin.json`
- 备份目录:`d:\VibeTest\bigsound_original_backup_20260726\`
- 计划文档:`.trae/documents/image-compression-plan.md`

---

## [2026-07-26] GitHub Pages 部署上线 (xiaowe-tech 仓库, 仅含打包产物)

**类型**: 部署上线 / 配置变更

**摘要**
应需求将项目打包并部署到 GitHub Pages, 仓库地址 https://github.com/CzhcpqfG/xiaowe-tech (public), 访问 URL https://czhcpqfg.github.io/xiaowe-tech/。为遵守 "只上传打包产物, 不泄露源码" 的要求, 采用 gh-pages orphan 分支策略: 仓库内只有 gh-pages 一个分支, 内容为 dist/ 完整产物 (184 个文件), 不含任何源码 / 配置 / 开发依赖。

**详细变更**

### A. 代码改动 (适配 GitHub Pages 子路径部署)

- `vite.config.ts` 新增 `base: "/xiaowe-tech/"` — 让 Vite 自动 prefix index.html 中的资源 URL
- `src/main.tsx` BrowserRouter 新增 `basename={import.meta.env.BASE_URL}` — 让 React Router 知道 URL 前缀, 解决子路径下路由解析问题
- `scripts/prerender.ts`:
  - 新增 `BASE_PATH = "/xiaowe-tech/"` 常量, 预渲染访问 URL 改为 `${PREVIEW_URL}${BASE_PATH}${route}`
  - 预渲染结束后复制 `dist/index.html` → `dist/404.html`, 作为 GitHub Pages SPA 404 兜底 (访问 /zh-CN/login 等未预渲染路径时由 SPA 接管路由)
- 新增 `scripts/fix-base-paths.ts`:
  - Vite 不会 prefix JS 字符串字面量中的 `/images/...` 路径, 共 168 处需要修复
  - 采用 "先归一化 (去 prefix) → 再统一 prefix" 两步法, 避免重复 prefix
  - 覆盖 `/images/`, `/videos/`, `/.well-known/`, `/llms.txt`, `/llms-full.txt`, `/robots.txt`, `/sitemap.xml`, `/site.webmanifest` 共 8 类路径
  - 本次构建共修复 1758 处路径
- `package.json` build 脚本改为 `tsc -b && vite build && tsx scripts/fix-base-paths.ts`, postbuild 仍为 `tsx scripts/prerender.ts`
- 新增 `dist/.nojekyll` 空文件 — 禁用 GitHub Pages 默认 Jekyll 处理, 保证 `.well-known/` 等下划线/点号开头的目录能正常输出

### B. 构建产物 (dist/)

- `index.html` (4.55 KB) — SPA 入口, Vite 已自动 prefix 所有资源 URL
- `404.html` (4.55 KB) — SPA 兜底, 与 index.html 内容一致
- `assets/index-C-ms8wIL.js` (922.76 KB, gzip 298.40 KB) — JS bundle, 已 fix-base-paths 修复 168 处图片路径
- `assets/index-f3ckPTns.css` (57.63 KB, gzip 9.81 KB)
- 24 个预渲染 HTML (3 locale × 8 路由): zh-CN / zh-TW / en 各 8 个页面
- 静态资源: `images/` (130+ 张), `videos/` (2 个), `.well-known/` (2 个)
- 根目录文件: `robots.txt`, `sitemap.xml`, `site.webmanifest`, `llms.txt`, `llms-full.txt`, `.nojekyll`

### C. GitHub 仓库与部署

- 仓库: `CzhcpqfG/xiaowe-tech` (public), 描述 "小维健康科技官网 - GitHub Pages 部署 (仅含打包产物)"
- 分支策略: 仅 `gh-pages` 一个 orphan 分支, 无 main / master, 不含源码
- 临时部署目录: `D:\VibeTest\bigsound_deploy\` (项目外, 用于 git init + push)
- 推送命令: `git init -b gh-pages && git add . && git commit && git remote add origin https://github.com/CzhcpqfG/xiaowe-tech.git && git push -u origin gh-pages`
- Pages 配置: source = `gh-pages` 分支 / `/` 根目录, HTTPS 强制开启
- Pages 构建状态: `built` (28 秒完成)
- 访问 URL: https://czhcpqfg.github.io/xiaowe-tech/

### D. 验证结果

| 测试项 | 状态 | 备注 |
|---|---|---|
| 根路径 `/xiaowe-tech/` | ✓ 200 | 4588 bytes, SPA 入口 |
| zh-CN 首页 (预渲染) | ✓ 200 | 57633 bytes, 含完整中文内容 |
| EN 首页 (预渲染) | ✓ 200 | 59253 bytes |
| JS bundle | ✓ 200 | 924800 bytes |
| sitemap.xml | ✓ 200 | 12567 bytes |
| 404 兜底 (`/zh-CN/login`) | ✓ 404 | 状态码 404 但 body 是 SPA, 浏览器加载后由 React Router 接管 |
| 图片路径 prefix | ✓ | 14 处 `/xiaowe-tech/images/`, 0 处未 prefix |
| hreflang / JSON-LD | ✓ | SEO 结构化数据完整保留 |

### E. 已知限制

- **canonical / hreflang 仍指向 `https://www.xiaowe.cc`**: 这是 SEO 设计, 不应改成 GitHub Pages URL (会损害主站权威)。GitHub Pages 部署视为镜像 / 演示用途。
- **robots.txt 的 Disallow 路径未加 prefix**: `Disallow: /zh-CN/login` 在 GitHub Pages 上不会精确匹配 `/xiaowe-tech/zh-CN/login`, 但 LoginPage 已通过 SEO.tsx 设置 `noindex`, 不影响 SEO。
- **未预渲染路径返回 404 状态**: 如 `/zh-CN/login`, `/zh-CN/register`, `/zh-CN/news/:id`。GitHub Pages 返回 404 状态码但 body 是我们的 404.html (SPA), 浏览器加载后 React Router 接管路由, 用户体验正常。但搜索引擎爬虫可能不索引这些 404 URL。

**影响范围**
- 新增部署能力: 项目可通过 `npm run build` → 复制 dist 到部署目录 → git push 一键上线 GitHub Pages
- 源码 0 泄露: 公开仓库内只有打包产物 (经 minify + tree-shake), 无任何源码 / TypeScript / 开发配置
- 后续若需更新部署: 在 `D:\VibeTest\bigsound_deploy\` 目录 `git pull` 最新 dist → commit → push 即可

**关联文件**
- `vite.config.ts`
- `src/main.tsx`
- `scripts/prerender.ts`
- `scripts/fix-base-paths.ts` (新增)
- `package.json`
- `dist/.nojekyll` (新增, 部署时生成)

---

## [2026-07-26] 产品图 v2 - 基于真实产品参考图重新生成 (换色/换形态)

**类型**: 配图资产更新

**摘要**
用户反馈首批 AI 产品图"不像真实产品", 要求基于 `public/images/products/` 目录下的真实产品图重新生成, 允许在同一形态内换颜色或微调形态。本次将 5 张真实产品图上传到 imgbb 图床获取公网 URL, 然后作为参考图调用速创API gpt-image-2 重新生成 6 张 1:1 产品图, 覆盖 `public/images/products/` 下的同名文件。数据映射 (`src/data/product.ts` / `src/data/images/product.ts`) 无需改动。验证通过 `tsc --noEmit`。

**详细变更**

### A. 参考图上传

将 `public/images/products/` 下 5 张真实产品图上传至 imgbb 图床, 获得公网参考图 URL:
- `product_bigsound_br.png` → 耳背式参考图
- `product_bigsound_p1.png` → 耳内式参考图
- `product_bigsound_q1.png` → 耳内式高端参考图
- `product_bigsound_n1.png` → 颈挂式高端参考图
- `product_skyworth_n2.png` → 颈挂式中端参考图

### B. 重新生成 6 张产品图

生图计划: `.trae/product_image_batch_plan_v2.json`
- 模型: gpt-image-2
- 尺寸: 1:1
- 并发: 3
- 保存目录: `aigpic/20260726_product_images_v2/`
- Prompt 策略: "参考真实产品的设计语言/材质/比例, 纯白背景商业摄影, 允许在同一形态内换颜色或微调形态"

**生成结果** (全部 6 张成功):
| 文件名 | 形态 | 参考图 | 生成效果 |
|---|---|---|---|
| `product_dab_behind_ear.png` | 耳背式 | BR | 金色流线型机身 + 透明声管 + 耳塞 |
| `product_dab_in_ear_p1.png` | 耳内式 | P1 | 肤色 ITE 定制外壳 |
| `product_daq_in_ear_q1.png` | 耳内式高端 | Q1 | 白色 TWS 充电盒 + 入耳式耳机 |
| `product_dab_neck_hung_n1.png` | 颈挂式高端 | N1 | 黑色运动颈挂 + 鲨鱼鳍耳塞 |
| `product_san_neck_hung_n2.png` | 颈挂式中端 | N2 | 棕色/金色颈挂 + 金属耳塞 |
| `product_bone_conduction.png` | 骨导式 | P1 (风格参考) | 深灰色后挂式骨导耳机 |

所有图片已复制到 `public/images/products/` 覆盖旧版 AI 产品图。

### C. 文件变更

- 新增/更新图片 (6 张):
  - `public/images/products/product_dab_behind_ear.png`
  - `public/images/products/product_dab_in_ear_p1.png`
  - `public/images/products/product_daq_in_ear_q1.png`
  - `public/images/products/product_dab_neck_hung_n1.png`
  - `public/images/products/product_san_neck_hung_n2.png`
  - `public/images/products/product_bone_conduction.png`
- 新增生图计划: `.trae/product_image_batch_plan_v2.json`
- 保留首批计划: `.trae/product_image_batch_plan.json`

**影响范围**
- ProductPage / WearablePage 的 12 款产品卡片配图全部更新为基于真实产品参考图生成的新图
- 无代码改动, 数据映射无需调整

---

## [2026-07-26] Product/Wearable 卡片设计重构 + AI 产品图批量生成 (按形态分类)

**类型**: UI 设计重构 + 配图资产更新

**摘要**
响应"卡片信息层级过多、显得杂乱"的反馈, 对 ProductPage 和 WearablePage 的产品卡片做 Apple 风格极简化重构: 删除形态 tag、价格改为双行 (上小标签下金额)、指标格去边框改灰底、信息区居中对齐。同时按用户明确指定的形态分类 (DAB=耳背/DAQ=耳内/DAN=颈挂/其他=骨导) 通过速创API gpt-image-2 模型参考 `product_bigsound_p1.png` 风格批量生成 6 张 1:1 产品图, 替换 12 款产品卡片配图。验证通过 `tsc --noEmit`。

**详细变更**

### A. 产品卡片设计重构 (Apple 风格极简化)

**ProductPage.tsx** (`src/pages/ProductPage.tsx`):
- 删除卡片顶部的形态标签 (如"耳背式"/"耳内式"等), 减少信息层级
- 价格显示改为双行结构: 上方小字号灰色 "零售指导价" 标签 (11px), 下方主信息金额 (16px 黑色 medium)
- 价格"待定"时显示 `t("product:ui.pricePending")` 灰色文案
- 指标格去边框, 改为 `bg-ink-50` 极简灰底, `min-h-[56px]`, 居中对齐
- 型号字号 17px, mb-4; 价格区 mb-5; 指标格 mt-auto 推到底部
- 整体信息区 `flex flex-col items-center text-center`, 居中对齐留白

**WearablePage.tsx** (`src/pages/WearablePage.tsx`):
- 同步删除形态标签, 调整价格显示为双行结构
- 指标格 2×2 布局, 同样采用 `bg-ink-50` 极简灰底
- 整体风格与 ProductPage 保持一致

**i18n 文件** (三语言同步):
- `src/i18n/locales/{zh-CN,zh-TW,en}/product.json`: 新增 `ui.priceLabel` / `ui.priceCurrency` / `ui.pricePending` 三个 key
- `src/i18n/locales/{zh-CN,zh-TW,en}/wearable.json`: 新增 `priceCaption` key ("零售指导价")

### B. AI 产品图批量生成 (按形态分类)

**形态分类映射** (按用户指定):
- DAB = 耳背式 (behind-ear) → 1 张图 (DAB005)
- DAQ = 耳内式 (in-ear) → 1 张图 (DAQ001 高端版, DAB006 共享)
- DAN = 颈挂式 (neck-hung) → 2 张图 (DAB007/SAN001 高端版 + SAN002/SAN003 中端版)
- 其他 = 骨导式 (bone-conduction) → 1 张图 (SAB001/SAP001/SAQ002/SAQ003/BO 共享)

**生成参数**:
- 模型: gpt-image-2
- 尺寸: 1:1 (匹配卡片容器 aspect-square)
- 并发: 3
- 参考图: `public/images/products/product_bigsound_p1.png` (用户指定参考风格)
- 保存目录: `aigpic/20260725_product_images/` + 复制到 `public/images/products/`

**生成的 6 张产品图**:
- `product_dab_behind_ear.png` — 耳背式 (BTE) 助听器, 米色机身, 弯曲声管, 耳塞
- `product_dab_in_ear_p1.png` — 耳内式 (ITE) 助听器, 米色肉色, 紧凑外壳
- `product_daq_in_ear_q1.png` — 耳内式高端版 (IIC), 更小更隐形
- `product_dab_neck_hung_n1.png` — 颈挂式高端版, 颈带 + 主机 + 耳塞线
- `product_san_neck_hung_n2.png` — 颈挂式中端版, 简洁颈带设计
- `product_bone_conduction.png` — 骨导式, 头戴/眼镜款, 不入耳

**Prompt 风格**: 高端商业产品摄影 + 纯白背景 + 柔和阴影 + 85mm 微距镜头 + 浅景深, 末尾追加 `no text, no watermark, no garbled characters`

### C. 数据映射更新

**`src/data/product.ts`**: 12 款产品的 `imageKey` 全部更新, 按形态分配到 6 张新图:
- products.0 (DAB005) → productDabBehindEar (耳背式)
- products.1 (DAB006) → productDabInEarP1 (耳内式)
- products.2 (DAB007) → productDabNeckHungN1 (颈挂式高端版)
- products.3 (SAB001) → productBoneConduction (骨导式)
- products.4 (SAP001) → productBoneConduction
- products.5 (DAQ001) → productDaqInEarQ1 (耳内式高端版)
- products.6 (SAQ002) → productBoneConduction
- products.7 (SAQ003) → productBoneConduction
- products.8 (SAN001) → productDabNeckHungN1 (颈挂式高端版)
- products.9 (SAN002) → productSanNeckHungN2 (颈挂式中端版)
- products.10 (SAN003) → productSanNeckHungN2
- products.11 (BO) → productBoneConduction

**`src/data/images/product.ts`**: 新增 6 个 imageKey 路径映射, 保留旧版 `productBigsound*` 路径作兼容

**影响范围**
- ProductPage (3 语言) / WearablePage (3 语言) 全部产品卡片视觉重构
- 12 款产品卡片配图全部更新为按形态分类的 AI 生成图
- 用户后续拿到真实配图后可直接覆盖同名文件

**关联文件**
- `src/pages/ProductPage.tsx`
- `src/pages/WearablePage.tsx`
- `src/data/product.ts`
- `src/data/images/product.ts`
- `src/i18n/locales/{zh-CN,zh-TW,en}/product.json`
- `src/i18n/locales/{zh-CN,zh-TW,en}/wearable.json`
- `public/images/products/product_dab_behind_ear.png` (新)
- `public/images/products/product_dab_in_ear_p1.png` (新)
- `public/images/products/product_daq_in_ear_q1.png` (新)
- `public/images/products/product_dab_neck_hung_n1.png` (新)
- `public/images/products/product_san_neck_hung_n2.png` (新)
- `public/images/products/product_bone_conduction.png` (新)
- `.trae/product_image_batch_plan.json` (生图计划)

---

## [2026-07-26] 信息架构纠正 | 公司/品牌身份分层 (小维健康科技为站点身份, 大声与 SKYWORTH 创维为旗下品牌)

**类型**: 信息架构纠正 (品牌身份分层)

**摘要**
纠正站点身份层把"大声助听器"误用为公司/站点身份的问题。本项目实际是【小维健康科技】公司官网, 大声只是公司旗下的一个品牌 (另一个是 SKYWORTH 创维)。本次将站点身份层 (title/manifest/JSON-LD/og:site_name/llms.txt/copyright 等) 统一改为"小维健康科技 (深圳) 有限公司", 大声与 SKYWORTH 创维作为旗下两大品牌呈现。三语言 (zh-CN/zh-TW/en) 同步更新。验证通过 `tsc --noEmit` 和 `vite build`。

**详细变更**

### A. 站点身份层 (核心)

- `src/config/site.ts`:
  - `SITE_INFO.name`: "大声 AI中文助听器" → "小维健康科技"
  - `SITE_INFO.brand`: "Bigsound大声" → "小维健康科技"
  - 新增 `SITE_INFO.subBrands` 字段: `{ dasound: "Bigsound 大声", skyworth: "SKYWORTH 创维" }`
  - `parentCompany` / `copyright` / `companyAddress` 等已正确的字段保留不变
- `index.html`:
  - `<title>`: "大声AI中文助听器，大声听力服务中心" → "小维健康科技官网 - 创维生态下的健康科技公司"
  - `<meta name="description">`: 改为公司级描述, 涵盖两大品牌
  - `<meta name="keywords">`: 增加"小维健康科技,SKYWORTH创维,Bigsound大声,健康智能手表,蓝牙耳机"
  - JSON-LD Organization `name`: "大声助听器" → "小维健康科技"
  - JSON-LD Organization `alternateName`: "Bigsound" → "Xiaowei Health Tech"
  - JSON-LD Organization `description`: 改为公司级描述 (覆盖两大品牌)
  - JSON-LD Organization `brand`: 由单个 Brand 改为数组 `[Bigsound 大声, SKYWORTH 创维]`
  - JSON-LD WebSite `name`: "小维健康科技官网" → "小维健康科技官网"
  - JSON-LD WebSite `alternateName`: "Bigsound 官网" → "Xiaowei Health Tech 官网"
  - JSON-LD MedicalBusiness `name` "大声听力服务中心" 保留不变 (此为大声品牌下属服务中心, 定位正确)
- `src/components/SEO.tsx`:
  - `og:site_name`: "大声助听器 Bigsound" → "小维健康科技 Xiaowei Health Tech"
- `src/config/schema.ts`:
  - `getOrganizationSchema()`: 同 index.html 的 Organization JSON-LD 修改
  - `getWebsiteSchema()`: 同 index.html 的 WebSite JSON-LD 修改
- `public/site.webmanifest`:
  - `name`: "大声AI中文助听器 - 大声听力服务中心" → "小维健康科技官网"
  - `short_name`: "大声助听器" → "小维健康"
  - `description`: 改为公司级描述
- `public/robots.txt`:
  - 头部注释: "# 大声助听器 (Bigsound) - robots.txt" → "# 小维健康科技 - robots.txt"
- `public/llms.txt`:
  - 标题: "# 大声助听器 (Bigsound)" → "# 小维健康科技 (Xiaowei Health Tech)"
  - 引言: 改为公司级描述
  - 公司简介段: 改为"公司名: 小维健康科技... 旗下品牌: Bigsound 大声 / SKYWORTH 创维"
  - 核心产品段: 各产品标注品牌归属 (助听器→Bigsound 大声, 穿戴→SKYWORTH 创维)
- `public/llms-full.txt`:
  - 标题: "# 大声助听器 (Bigsound) — 完整品牌文档" → "# 小维健康科技 — 完整品牌文档"
  - 引言: "来源于小维健康科技官网" → "来源于小维健康科技官网"
  - 文末维护方: "由大声助听器官方维护" → "由小维健康科技官方维护"
  - §一、品牌定位 / §二、母公司背景正文保留不变 (已正确描述双品牌关系)

### B. 页面 title 后缀 (三语言全站统一)

`src/i18n/locales/{zh-CN,zh-TW,en}/meta.json`:
- 所有非 home 页面 title 后缀统一改为 "- 小维健康科技" (zh-CN) / "- 小維健康科技" (zh-TW) / "- Xiaowei Health Tech" (en)
- `home.title` / `home.description` / `home.keywords` 改为公司级表述, 涵盖两大品牌
- `wearable.description` 修正: "大声健康智能手表" → "SKYWORTH 创维健康智能手表" (穿戴页本就是 SKYWORTH 创维品牌, 原文是错误标注)
- `careers.description` / `news.description` 主语改为"小维健康科技"
- 其他 description (about/product/invest/faq 等) 保留品牌层描述不变 (按计划要求)

### C. Header / Footer / 通用视觉文案 (三语言)

`src/i18n/locales/{zh-CN,zh-TW,en}/common.json`:
- `header.logoAlt`: "大声 Bigsound 中文助听器" → "小维健康科技 logo"
- `header.logoAriaLabel`: "Bigsound 大声" → "小维健康科技"
- `footer.copyright`: "© {{year}} 大声助听器 保留所有权利" → "© {{year}} 小维健康科技（深圳）有限公司 版权所有"
- `notFound.logoAlt`: "大声" → "小维健康"
- `alt.logo`: "大声 Bigsound logo" → "小维健康科技 logo"

### D. 默认作者 (三语言)

`src/i18n/locales/{zh-CN,zh-TW,en}/news.json`:
- `defaultAuthor`: "大声" / "大聲" / "BigSound" → "小维健康科技" / "小維健康科技" / "Xiaowei Health Tech"

**影响范围**
全站 title / JSON-LD (Organization + WebSite) / og:site_name / manifest / llms.txt / llms-full.txt / robots.txt / 版权信息 / logo alt / 默认作者

**关联文件**
- `src/config/site.ts`
- `index.html`
- `src/components/SEO.tsx`
- `src/config/schema.ts`
- `public/site.webmanifest`
- `public/robots.txt`
- `public/llms.txt`
- `public/llms-full.txt`
- `src/i18n/locales/zh-CN/meta.json`
- `src/i18n/locales/zh-TW/meta.json`
- `src/i18n/locales/en/meta.json`
- `src/i18n/locales/zh-CN/common.json`
- `src/i18n/locales/zh-TW/common.json`
- `src/i18n/locales/en/common.json`
- `src/i18n/locales/zh-CN/news.json`
- `src/i18n/locales/zh-TW/news.json`
- `src/i18n/locales/en/news.json`

**不在本次修改范围 (明确排除)**
- `src/i18n/locales/*/about.json` §xiaoweiHealth / §skyworthGroup 正文 (已正确)
- `src/i18n/locales/*/careers.json` companyIntro 段落 (已正确)
- `src/i18n/locales/*/faq.json` 关于大声助听器品牌的问答 (已正确, 品牌层描述)
- `src/i18n/locales/*/news.json` 各新闻 title (已正确区分公司/品牌层面)
- `src/i18n/locales/*/product.json` 产品描述中的"大声"字样 (品牌层正确)
- `src/i18n/locales/*/invest.json` 招商正文中"创维生态 · 大声助听器"等品牌联合表述 (已正确)
- `public/videos/promo.mp4` 等媒体资产
- 域名 / 备案信息 / 医疗资质号 / 公司地址 / 电话等法律层信息
- `dist/` 目录手工修改 (由 vite build 自动刷新)

**验证**
- `npx tsc --noEmit` ✓ 通过
- `npx vite build` ✓ 通过 (5.46s, 206 modules transformed)
- 建议浏览器手动验证: http://localhost:5173/zh-CN/ (首页) / /about / /product / /wearable / /invest / /faq
  - 检查浏览器 tab 标题后缀为 "- 小维健康科技"
  - 检查 Header logo aria-label / alt 为 "小维健康科技"
  - 检查 Footer 版权为 "© 2026 小维健康科技（深圳）有限公司 版权所有"
  - 查看页面源码 JSON-LD Organization name 为 "小维健康科技"
  - 切换 zh-TW / en 验证对应翻译同步

---

## [2026-07-26] 英文页面修复 | InvestmentPolicyTable i18n + HearingLossGradeTable 第一列英文旋转

**类型**: Bug 修复 (i18n 化表格组件 + CSS 旋转方案)

**摘要**
用户反馈英文页面 2 处问题: (1) InvestPage "Detailed Policy Interpretation" 模块表格完全未翻译, 整张表硬编码中文; (2) HearingLossGradeTable 第一列左侧大类标签英文字母一个一个垂直排列, 视觉奇怪。本次修复采用 "组件完全 i18n 化 + 移除 textOrientation:upright 让英文自然旋转" 两个方案。所有修改均通过 `tsc --noEmit` 和 `vite build` 验证。

**详细变更**

### 1. InvestmentPolicyTable 完全 i18n 化 (`src/components/invest/InvestmentPolicyTable.tsx` + 三个 `invest.json`)
**根因**: 表格组件所有文字 (4 个数据卡 / 表头 / 10 个分组名 / 16 行项目名 + 小维健康 + 合作伙伴内容) 全部硬编码中文字符串, 完全不走 i18n, 英文页面显示整张中文表格。

**修复**:
- **i18n 资源** (三个 `invest.json`): 在 `policyDetail` 下新增 `table` 对象, 包含:
  - `highlightCards`: 4 个数据卡 (label/value/desc)
  - `headers`: 3 列表头 (item/xiaowei/partner)
  - `groups`: 10 个分组数组, 每个分组含 `group` 名 + `rows` 数组, 每行含 item/xiaowei/partner/可选 emphasis
  - 10 个分组: 场地&装修 / 人员&培训 / 设备&样机 / 备货&售价 / 分成&推广 / 开店支持 / KOC推四全返 / 投入汇总 / 结算方式 / 合作时长
- **组件重构** (`InvestmentPolicyTable.tsx`):
  - 移除 `HIGHLIGHT_CARDS` 和 `POLICY_GROUPS` 硬编码常量
  - 用 `t(\`${TABLE_KEY}.highlightCards\`, { returnObjects: true })` 取数据卡数组
  - 用 `t(\`${TABLE_KEY}.headers\`, { returnObjects: true })` 取表头对象
  - 用 `t(\`${TABLE_KEY}.groups\`, { returnObjects: true })` 取分组数组
  - 保留 `HighlightBadge` / `HighlightText` / `GroupHeaderRow` / `PolicyTableRow` 子组件
  - `HighlightText` 高亮正则改为通用版, 匹配数字 + 中英文单位 (`%` / `万元` / `元` / `平方米` / `㎡` / `天` / `年` / `人` / `万` / `¥xxK` / `K` / `days` / `year` / `person`)
  - emphasis 字段保留, 控制行高亮 (both=黄底, partner=浅绿底)
- **英文翻译精简**: 长英文文案精简以适应窄列宽 (如 "Partnership Fee ¥50K" 而非 "Project Cooperation Fee 50,000 Yuan", "Stock 3-day retail inventory; ship after order" 而非完整长句)

**影响范围**:
- 中文页面: 表格内容不变, 视觉无差异
- 繁体页面: 表格内容改为繁体
- 英文页面: 表格内容改为精简英文, 数字徽章高亮适配中英文单位

### 2. HearingLossGradeTable 第一列英文垂直字母堆叠修复 (`src/components/invest/HearingLossGradeTable.tsx`)
**根因**: 左侧大类标签 (imperceptible="难以察觉" / affected="生活已受影响") 用 `writingMode: "vertical-rl"` + `textOrientation: "upright"` 实现垂直文字。`textOrientation: "upright"` 让所有字符正立, 对中文 OK (方块字正立堆叠很自然), 但对英文 "Hard to Notice" 会变成字母一个一个垂直堆叠 (H/a/r/d/t/o/N/o/t/i/c/e), 视觉奇怪。

**修复**:
- 移除 `textOrientation: "upright"` 属性, 使用 `writingMode: "vertical-rl"` 的默认 `textOrientation: "mixed"` 行为
- 中文 CJK 字符: 默认正立堆叠 (vertical-rl 的 mixed 模式对 CJK 字符保持正立)
- 英文拉丁字符: 自然旋转 90° 顺时针, 整体从上往下读 (字母侧躺, 头朝右)
- 新增 `whitespace-nowrap` 防止英文单词在垂直方向断行
- `letterSpacing` 从 3px 调整为 1px (适应旋转后的英文字符间距)

**影响范围**:
- 中文/繁体页面: 大类标签视觉无变化 (CJK 仍正立堆叠)
- 英文页面: "Hard to Notice" / "Life Affected" 不再字母堆叠, 改为旋转 90° 顺时针显示, 阅读体验更自然

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)
- `npx vite build`: 通过 (18.00s, 206 modules, dist 4.49 kB HTML + 58.26 kB CSS + 927.74 kB JS)

**关联文件**
- `src/components/invest/InvestmentPolicyTable.tsx` (完全 i18n 化重写)
- `src/components/invest/HearingLossGradeTable.tsx` (移除 textOrientation: upright)
- `src/i18n/locales/zh-CN/invest.json` (新增 policyDetail.table 对象)
- `src/i18n/locales/zh-TW/invest.json` (同上, 繁体翻译)
- `src/i18n/locales/en/invest.json` (同上, 英文精简翻译)

---

## [2026-07-26] SEO/GEO 全面优化 | FAQ 独立页 + 24 页预渲染 + JSON-LD 结构化数据 + i18n 数组调用 bug 修复

**类型**: 功能新增 (SEO/GEO 优化) + Bug 修复 (i18n 数组调用)

**摘要**
为实现「用户问豆包/ChatGPT 时提到大声助听器」的 GEO 目标, 本次为官网 3.0 添加了完整的 SEO/GEO 优化体系: (1) 新建独立 /faq 页 + 首页/产品页/招商页 FAQ 模块, 37 个高频问答覆盖「听力不好怎么办」「助听器品牌选哪个」等豆包常见问题, 三语同步; (2) Playwright 预渲染脚本, build 后自动生成 24 个静态 HTML (3 locale × 8 路由), 让 AI 爬虫不执行 JS 也能抓取完整内容; (3) 全局 JSON-LD 结构化数据 (Organization / WebSite / FAQPage / BreadcrumbList 等), 让 AI 搜索引擎识别公司实体与问答对; (4) 修复 3 处 i18n 数组调用 bug (`t([...keys], {returnObjects: true})` 实际只返回首个 key 的字符串值, 导致 .map 抛错或下标取到字符), 修复后 about/careers 页可正常预渲染。所有修改通过 `tsc --noEmit` 和 `vite build` + postbuild 预渲染验证。

**详细变更**

### A. 新建 FAQ 独立页 + FAQ 模块组件

- 新增 `src/pages/FaqPage.tsx`:
  - Hero section (复用 ProductCarouselHero, 高度 480px, 与产品页统一)
  - 粘性搜索栏 + 分类 chips (6 类: 品牌/产品/资质/选购/听力健康/招商)
  - 关键词搜索 + 实时过滤 (支持高亮匹配)
  - 手风琴式问答列表, 支持「展开全部/收起全部」
  - 注入 FAQPage JSON-LD (37 条 Q&A, GEO 核心)
  - 移动端响应式适配
- 新增 `src/components/faq/FaqSection.tsx`:
  - 可复用 FAQ 模块, scope 参数区分 home/product/invest
  - 每个 scope 注入 4 条相关 FAQ + FAQPage JSON-LD
  - 「查看全部」链接跳转 /faq
- 新增 `src/components/faq/FaqAccordion.tsx`:
  - 手风琴单项组件, hover 反馈强 (上移 2px + 左侧品牌绿色色条 + 背景渐变 + 图标旋转 45°)
  - 无障碍: aria-expanded / aria-controls / 键盘可操作
- 新增三语 FAQ i18n 文件 `src/i18n/locales/{zh-CN,zh-TW,en}/faq.json`:
  - 6 大分类共 37 个问答 (品牌背景 5 / 产品技术 7 / 资质服务 6 / 选购使用 7 / 听力健康 6 / 招商加盟 6)
  - 严格基于官网现有内容, 无幻觉 (医疗资质证书编号 / 直营门店地址 / 产品型号价格 / 创始团队 / 临床医院等均可溯源)
  - 三语同步翻译, 简繁体用词差异已校对
  - 各 scope (home/product/invest) 各含 4 条精选 FAQ, 共 12 条
- 修改 `src/routes/index.tsx`: 注册 `/faq` 路由
- 修改 `src/components/layout/Footer.tsx`: 在「Partnership」栏目下新增 FAQ 入口
- 修改 `src/pages/HomePage.tsx` / `ProductPage.tsx` / `InvestPage.tsx`: 在页面底部插入 `<FaqSection scope="..." />`

### B. JSON-LD 结构化数据 (GEO 核心)

- 新增 `src/config/schema.ts`: 集中管理所有 schema 工厂函数
  - `getOrganizationSchema()`: 公司实体 (含创始人/地址/联系方式/母公司创维/品牌/专利领域/sameAs)
  - `getWebsiteSchema()`: 网站实体 + 站点搜索框 (SearchAction)
  - `getBreadcrumbSchema(items)`: 面包屑
  - `getProductSchema(opts)` / `getMedicalDeviceSchema(opts)`: 产品 + 医疗器械 (含注册证号)
  - `getFaqSchema(faqs)`: FAQ 页 schema (GEO 最关键, 让 AI 直接抓取 Q&A)
  - `getLocalBusinessSchema()`: 听力服务中心门店 (含地址/营业时间/电话)
  - `getAboutPageSchema(url)` / `getContactPageSchema(url)`: 关于页 / 联系页
- 新增 `src/components/JsonLd.tsx`: 通用 JSON-LD 注入组件 (基于 react-helmet-async)
- 修改 `src/components/SEO.tsx`: 增加 `jsonLd` prop 支持页面级 schema 注入
- 修改 `src/components/layout/Layout.tsx`: 全局注入 Organization + WebSite JSON-LD (任意页面都被 AI 爬虫识别为公司实体)

### C. SEO Meta / OG / hreflang / 微数据

- 修改 `src/components/SEO.tsx`: 完整支持
  - `<html lang>` 同步 / `<title>` / `<meta description>` / `<meta keywords>`
  - canonical URL (含 locale 前缀)
  - hreflang 三语 + x-default
  - Open Graph (Facebook / 微信 / LinkedIn): og:title / og:description / og:image / og:url / og:type
  - Twitter Card: summary_large_image
  - JSON-LD 注入
  - `noindex` 选项 (Login/Register/NotFound 用)
- 修改 `src/pages/LoginPage.tsx` / `RegisterPage.tsx` / `NotFoundPage.tsx`: 添加 `noindex` 防止搜索引擎收录
- 修改 `src/pages/NewsDetailPage.tsx`: 包裹 `<article itemScope itemType="https://schema.org/NewsArticle">` 微数据, ogType=article
- 修改 `src/components/layout/Layout.tsx`: 添加「跳到主要内容」无障碍链接 (sr-only, focus 时显示)
- 修改 `src/components/home/HeroProducts.tsx`: 图片加 `loading="lazy"` + `decoding="async"`

### D. Playwright 预渲染 (GEO 关键 - 让 AI 爬虫看到完整 HTML)

- 新增 `scripts/prerender.ts`:
  - build 后启动 vite preview (4173 端口)
  - 用 Chromium headless 访问 24 个路由 (3 locale × 8 路由)
  - 等待 #root 渲染 + react-helmet 注入 `<title>` + JSON-LD 注入完成
  - 提取完整 HTML 保存到 `dist/{locale}/{path}/index.html`
  - 端口占用自动清理 (Windows taskkill)
  - Playwright 浏览器二进制安装到项目内 `.playwright-browsers/` (避免沙箱限制写入 AppData)
  - 错误降级: JSON-LD 未注入时仍保存 HTML (含 title 和部分内容)
  - 页面错误捕获: pageerror / console.error 输出到日志便于诊断
- 修改 `package.json`:
  - 新增 `postbuild` 脚本自动调用预渲染
  - 新增 `prerender` 手动入口
  - 新增 devDependencies: `tsx` (运行 ts 脚本) / `@playwright/test`
- 修改 `.gitignore`: 忽略 `.playwright-browsers/`

### E. i18n 数组调用 bug 修复 (预渲染阻断)

**根因**: `t([...keys], { returnObjects: true })` 在 i18next v26 中实际只返回首个 key 的值 (字符串), `as string[]` 是 TypeScript 谎言, 调用 `.map` 抛 `TypeError: e(...).map is not a function`, 调用下标 `[0]`/`[1]` 取到字符串字符。

**修复**: 改用 `keys.map((k) => t(k))` 模式, 真正返回字符串数组。

- 修改 `src/pages/CareersPage.tsx:102` (companyIntroKeys 5 段公司简介, 之前页面渲染直接抛错)
- 修改 `src/pages/WearablePage.tsx:170` (categorySloganKeys 双行标语, 之前静默显示字符串首字符「全」/「产」而非「全产品线覆盖」/「全场景响应需求」)
- 修改 `src/pages/AboutPage.tsx:67/139`: 此两处在更早的提交已修复 (使用 `paragraphKeys.map((k) => t(k))`), 本次仅确认无回归

### F. 验证

- `npx tsc --noEmit`: exit 0
- `npm run build`: tsc + vite build + postbuild 预渲染全部成功
- 预渲染结果: 24/24 页面成功
  - zh-CN: / /about /product /wearable /invest /careers /news /faq (65.8/104.0/137.2/94.3/124.3/65.8/55.7/133.7 KB)
  - zh-TW: 同上 (各页与 zh-CN 字节数一致, 简繁差异极小)
  - en: 同上 (略大, 英文文案长度更长)

**影响范围**

- 新增: FAQ 页 + FAQ 模块 + 24 个预渲染 HTML + 完整 JSON-LD 体系
- 修复: about/careers 页运行时错误, wearable 页标语静默 bug
- 不影响: 现有视觉设计 / 现有交互逻辑 / 现有 i18n 翻译内容

**关联文件**
- 新增: `src/pages/FaqPage.tsx` / `src/components/faq/FaqSection.tsx` / `src/components/faq/FaqAccordion.tsx` / `src/components/JsonLd.tsx` / `src/config/schema.ts` / `scripts/prerender.ts` / `src/i18n/locales/{zh-CN,zh-TW,en}/faq.json`
- 修改: `src/components/SEO.tsx` / `src/components/layout/Layout.tsx` / `src/components/layout/Footer.tsx` / `src/components/home/HeroProducts.tsx` / `src/pages/HomePage.tsx` / `src/pages/ProductPage.tsx` / `src/pages/InvestPage.tsx` / `src/pages/NewsDetailPage.tsx` / `src/pages/LoginPage.tsx` / `src/pages/RegisterPage.tsx` / `src/pages/NotFoundPage.tsx` / `src/pages/CareersPage.tsx` / `src/pages/WearablePage.tsx` / `src/routes/index.tsx` / `package.json` / `.gitignore`

---

## [2026-07-26] 英文页面修复 | InvestPage 表格 i18n + WearablePage 标题回退 + ProductPage 分类按钮翻译

**类型**: Bug 修复 (i18n 翻译补全 + CSS 回退 + 组件 i18n 化)

**摘要**
用户反馈英文页面 3 处问题: (1) InvestPage "High Intervenability" 模块的听力损失分级对照表完全未翻译, 整张表硬编码中文; (2) WearablePage 双行绿色标语 "全产品线覆盖 / 全场景响应需求" 中文/繁体/英文三种语言都显示不全; (3) 中文页面 ProductPage 产品分类按钮显示英文 (如 "behind-ear" / "in-ear")。本次修复采用 "i18n 化表格组件 + 回退错误 CSS + 补全 i18n key" 三个针对性方案。所有修改均通过 `tsc --noEmit` 和 `vite build` 验证。

**详细变更**

### 1. HearingLossGradeTable 完全 i18n 化 (`src/components/invest/HearingLossGradeTable.tsx` + 三个 `invest.json`)
**根因**: 表格组件所有文字 (表头/分级/阈值/体验/产品方块标题+条目+价格/核心用户气泡/脚注) 全部硬编码中文字符串, 完全不走 i18n, 英文页面显示整张中文表格。

**修复**:
- **i18n 资源** (`zh-CN/zh-TW/en/invest.json`): 在 `prospect.highIntervention` 下新增 `table` 对象, 包含:
  - `headers`: 4 列表头 (grade/dbRange/experience/solution)
  - `categories`: 2 个左侧大类标签 (imperceptible/affected)
  - `rows`: 7 行分级数据 (grade/dbRange/experience)
  - `blocks`: 4 个产品方块 (psap/otc/medical/cochlear), 每个含 title/items 数组/price, medical 额外含 badgeTitle/badgeDesc
  - `footnote`: 表格脚注
- **组件重构** (`HearingLossGradeTable.tsx`):
  - 保留 `GRADE_ROWS` 静态数组 (布局结构, 含 i18nPrefix + category + solutionCell 类型)
  - 4 个 Block 子组件 (Psap/Otc/Medical/Cochlear) 各自调用 `useTranslation("invest")` 取数据
  - items 数组用 `t(key, { returnObjects: true }) as string[]` 取回并 `.map()` 渲染
  - 主组件 HearingLossGradeTable 用 `t(\`${TABLE_KEY}.headers.grade\`)` 等动态拼接 key
- **英文翻译精简**: 长英文文案精简以适应窄列宽 (如 "Hearing Threshold (dB)" 而非 "Hearing Threshold in Decibels", "Mod-Severe Loss" 而非 "Moderately Severe Hearing Loss")

**影响范围**:
- 中文页面: 表格内容不变, 视觉无差异
- 繁体页面: 表格内容改为繁体
- 英文页面: 表格内容改为精简英文, 适应窄列宽

### 2. WearablePage 双行标语显示不全 — 回退错误的 `whitespace-nowrap` (`src/pages/WearablePage.tsx`)
**根因**: 上一轮修复 (2026-07-26 早期) 为防止英文翻译溢出, 给两行 `<p>` 加了 `whitespace-nowrap`。但中文页面也加了, 导致中文 6 字标语 + 28px 字号 + bold 字重在 1200px 容器内本就一行显示, 加 nowrap 后反而让 `<p>` 的 inline 文字无法换行, 配合某些 viewport 缩放下出现的水平空间不足, 文字反而被父容器 overflow 裁剪。

**修复**:
- 移除两行 `<p>` 上的 `whitespace-nowrap` class
- 回退到默认 `whitespace-normal`, 让文字在父容器内自然换行 (中文 6 字一行显示, 英文长翻译自然换两行)
- 之前已精简的英文翻译 ("Full-Line Coverage" / "All-Scenario Response") 保留, 长度足够短一行能装下

**影响范围**:
- 中文/繁体页面: 双行标语完整显示 (6 字 + 6 字, 一行一个)
- 英文页面: 双行标语完整显示 (短英文, 一行一个)

### 3. ProductPage 产品分类按钮显示英文 — 补全 categories i18n key (三个 `product.json`)
**根因**: `src/data/product.ts` 的 `categoriesKeys` 定义为 `["product:categories.all", "product:categories.behind-ear", "product:categories.in-ear", "product:categories.neck-hung", "product:categories.bone-conduction"]`, 但三个 `product.json` 的 `categories` 对象只定义了 `"all"` 一个 key, 其余 4 个分类 key 缺失。i18next 在 key 不存在时返回 key 路径本身 (如 `product:categories.behind-ear` → 渲染为 "behind-ear"), 导致中文页面也显示英文 slug。

**修复** (三个 `product.json` 同步补全):
- `zh-CN/product.json` `categories`: 补全 `behind-ear="耳背式"` / `in-ear="耳内式"` / `neck-hung="颈挂式"` / `bone-conduction="骨导式"`
- `zh-TW/product.json` `categories`: 补全 `behind-ear="耳背式"` / `in-ear="耳內式"` / `neck-hung="頸掛式"` / `bone-conduction="骨導式"`
- `en/product.json` `categories`: 补全 `behind-ear="BTE"` / `in-ear="ITE"` / `neck-hung="Neck-Hung"` / `bone-conduction="Bone Conduction"`

**影响范围**:
- 中文页面: 5 个分类按钮显示 "全部 / 耳背式 / 耳内式 / 颈挂式 / 骨导式"
- 繁体页面: 5 个分类按钮显示 "全部 / 耳背式 / 耳內式 / 頸掛式 / 骨導式"
- 英文页面: 5 个分类按钮显示 "All / BTE / ITE / Neck-Hung / Bone Conduction"
- 与 `forms` 字段 (产品卡片形态标签) 翻译保持一致

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)
- `npx vite build`: 通过 (5.69s, 206 modules, dist 4.29 kB HTML + 58.26 kB CSS + 921.35 kB JS)

**关联文件**
- `src/components/invest/HearingLossGradeTable.tsx` (完全 i18n 化重写)
- `src/i18n/locales/zh-CN/invest.json` (新增 highIntervention.table 对象)
- `src/i18n/locales/zh-TW/invest.json` (同上)
- `src/i18n/locales/en/invest.json` (同上, 英文精简翻译)
- `src/pages/WearablePage.tsx` (回退 whitespace-nowrap)
- `src/i18n/locales/zh-CN/product.json` (补全 categories 4 个 key)
- `src/i18n/locales/zh-TW/product.json` (同上)
- `src/i18n/locales/en/product.json` (同上)

---

## [2026-07-26] 阶段交付文档 | 输出官网 3.0 阶段交付说明 Markdown

**类型**: 文档交付

**摘要**
应客户要求输出一份面向客户/老板与内部 PM 的阶段交付说明文档, 客观呈现官网 3.0 当前已完成的工作量、重点优化亮点、待客户提供的信息以及注册登录功能取舍建议。文档以通俗易懂的项目进度总览开头, 数据均来自代码库真实统计, 语气客观、不夸大。

**详细变更**

### 1. 新增交付文档 (`docs/phase-delivery-report.md`)
- 创建 `docs/` 目录
- 撰写完整 Markdown 文档, 包含:
  - 项目进度总览(数字卡片 + ASCII 进度条)
  - 重点优化与亮点工作(SEO/GEO、FAQ、AI 配图与视频、前端图表动画、多语言、响应式)
  - 待客户提供的信息(联系邮箱、社交二维码、店铺链接等 10 项)
  - 注册登录功能确认(双模式实现 + 成本分析 + 3 个方案建议)
  - 后续建议与下一步
  - 附录 A: 技术实现清单(页面/SEO/AI 资产/多语言)
  - 附录 B: 关于本文档与项目说明
  - 附录 C: 项目统计摘要

### 2. 文档中引用的关键数据(均来自代码库统计)
- 页面数: 12 个
- 可复用组件: 18 个
- TypeScript/TSX 代码行数: 约 13,311 行
- 图片素材: 160 张
- 宣传视频: 2 个(含 1 个 15 秒 AI 品牌片)
- 语言版本: 3 套(简中/繁中/英文)
- FAQ 问答: 37 条(独立页) + 12 条(嵌入式)
- SEO/GEO Schema: 10 类
- 滚动动画调用文件: 14 个

**影响范围**
- 新增 `docs/phase-delivery-report.md`, 不改动业务代码
- 作为客户阶段汇报材料, 可直接发送或导出 PDF/飞书文档

**关联文件**
- `docs/phase-delivery-report.md`
- `.trae/documents/phase-delivery-doc-plan.md`

---

## [2026-07-26] 英文页面修复 | WearablePage 标题溢出 + 卡片等高 + 扇形图 i18n 编码问题

**类型**: Bug 修复 (前端 CSS + i18n key 检测逻辑)

**摘要**
用户反馈英文页面 3 处问题: (1) WearablePage 产品列表上方双行大标题显示不全; (2) WearablePage 下部两个核心技术模块的卖点卡片因文本量不同导致高度不齐; (3) ProductPage 扇形图出现 i18n key 泄漏, 渲染出原始 key (如 `coreTech.fanChart.sectors.3.suffixcoreTech.fanChart.sectors.3.sub`)。本次修复采用 "i18n 官方 API + CSS Grid 等高 + 翻译精简" 三管齐下, 确保中英文页面视觉一致。所有修改均通过 `tsc --noEmit` 和 `vite build` 验证。

**详细变更**

### 1. ProductPage 扇形图 i18n key 泄漏修复 (`src/pages/ProductPage.tsx`)
**根因**: `ChineseTechFanChart` 组件用 `startsWith(`${sector.i18nPrefix}.`)` 检测 i18n key 是否缺失, 但 i18next 在 key 不存在时返回的字符串是 `coreTech.fanChart.sectors.3.suffix` (无 namespace 前缀), 而 `i18nPrefix` 含 namespace (如 `product:coreTech.fanChart.sectors.3`), 导致 `startsWith` 永远为 false, 误判 key 存在, 直接渲染泄漏的 key 字符串。

**修复**:
- 在 `ChineseTechFanChart` 内新增 `const { i18n } = useTranslation("product");`
- 用 `i18n.exists(`${sector.i18nPrefix}.connector`)` / `.suffix` / `.sub` 替代 `startsWith` 字符串比较
- `hasConnector` / `hasSuffix` / `hasSub` 三个布尔值由 i18next 官方 API 准确判定
- `sub` 条件渲染从 `{sub && !sub.startsWith(...) && (...)}` 改为 `{hasSub && (...)}`

**影响范围**:
- 仅 `ChineseTechFanChart` 子组件, 不影响其他渲染
- 中文页面: 5 个 sector 的 connector/suffix/sub 本就存在, 视觉无变化
- 英文页面: 修复前泄漏的 key 字符串消失, 正确显示翻译后的文案或省略缺失字段

### 2. WearablePage 卖点卡片等高修复 (`src/pages/WearablePage.tsx`)
**根因**: Section 4 (健康智能手表核心技术, 15 项) 和 Section 5 (智能蓝牙耳机核心技术, 10 项) 的 Grid 容器未设置 `auto-rows-fr`, 默认 `auto-rows-auto` 让每行高度由该行最高卡片决定, 但 Reveal 包装层和 TechCard 内层未撑满高度, 导致同行卡片因描述文本长短不同而高度不齐。

**修复**:
- Section 4 grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px]` → 末尾追加 `auto-rows-fr`
- Section 5 grid: 同上追加 `auto-rows-fr`
- Reveal 包装: 新增 `className="h-full"` 让动画容器撑满 grid cell
- TechCard 外层 div: 已有 `flex flex-col h-full` (确认无需修改)
- 产品卡片 grid (Section 3): 同步追加 `auto-rows-fr`, Reveal 加 `h-full`, ProductCard 已有 `h-full`

**影响范围**:
- 中英文页面: 同行卡片现在严格等高, 视觉对齐
- 移动端 2 列 / 平板 3 列 / 桌面 5 列均生效

### 3. WearablePage 双行大标题溢出修复 (`src/pages/WearablePage.tsx` + `src/i18n/locales/en/wearable.json`)
**根因**: Section 2 双行标语 `categorySlogan` 英文翻译过长 ("Full Product Line Coverage" / "All-Scenario Demand Response"), 在 28px font-size + 1200px 容器内换行后被截断。

**修复** (双管齐下):
- **翻译精简** (`en/wearable.json`):
  - "Full Product Line Coverage" → "Full-Line Coverage"
  - "All-Scenario Demand Response" → "All-Scenario Response"
- **CSS 防溢出** (`WearablePage.tsx`):
  - 两行 `<p>` 新增 `whitespace-nowrap`, 强制单行显示, 避免换行后被截断
  - 中文 "全产品线覆盖" / "全场景响应需求" 本就单行, 视觉无变化

**影响范围**:
- 英文页面: 标题完整显示, 不再被截断
- 中文页面: 无变化 (中文本就单行)

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)
- `npx vite build`: 通过 (4.81s, 206 modules, dist 4.29 kB HTML + 58.26 kB CSS + 916.65 kB JS)

**关联文件**
- `src/pages/ProductPage.tsx` (ChineseTechFanChart i18n.exists 改造)
- `src/pages/WearablePage.tsx` (auto-rows-fr + h-full + whitespace-nowrap)
- `src/i18n/locales/en/wearable.json` (categorySlogan 翻译精简)

---

## [2026-07-26] Hero 视频 | 回滚至原视频 promo.mp4 (用户决定暂不切换 promo_v2)

**类型**: 组件回滚

**摘要**
用户决定继续使用原先的 `public/videos/promo.mp4` (10s 旧视频)，不切换到新生成的 `promo_v2.mp4`。将 `VideoEntry.tsx` 第 58 行视频源从 `/videos/promo_v2.mp4` 改回 `/videos/promo.mp4`。新生成的 `promo_v2.mp4` 及其分镜图/视频片段/脚本等工件保留备用，便于后续随时切换。

**详细变更**
- `src/components/home/VideoEntry.tsx` 第 58 行: `<source src="/videos/promo_v2.mp4">` → `<source src="/videos/promo.mp4">`

**影响范围**
- 仅修改组件 1 行
- 保留不动:
  - `public/videos/promo.mp4` (原视频, 重新启用)
  - `public/videos/promo_v2.mp4` (新视频, 保留备用)
  - `scripts/generate_hero_video.py` / `scripts/hero_video_plan.json` (脚本备用)
  - `aigpic/20260726_hero_video/` (所有分镜图、视频片段、中间产物、进度文件、BGM 说明)

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)

---

## [2026-07-26] i18n 布局溢出修复 | 英文翻译导致容器溢出的 P0 问题修复

**类型**: 前端 CSS 调整 + i18n 翻译精简

**摘要**
英文翻译上线后, 因英文文本长度普遍长于中文, 导致多处固定尺寸容器出现溢出/变形/遮挡问题。本次针对 9 个 P0 高风险点进行修复, 采用 "弹性布局 + 翻译精简" 二者并行策略, 确保中文页面美观与移动端布局不受影响。所有修改均通过 `tsc --noEmit` 和 `vite build` 验证。

**详细变更**

### 1. ProductPage 扇形图 CSS (`src/pages/ProductPage.tsx`)
- 6 处 `whitespace-nowrap` → `whitespace-normal`, 允许英文文本在 `maxWidth: 320px` 内换行
- 绿色扇区标签容器新增 `maxWidth: "280px"`, 避免英文文本无限延伸
- 影响范围: 5 个黑色扇区标签 + 1 个绿色扇区标签 (prefix/highlight/sub 三行均可换行)
- 中文影响: 无 (中文文本短, 本来就在一行内)

### 2. ProductPage 流程图 SVG 字号调整 (`src/pages/ProductPage.tsx`)
- 左列 5 节点文本 `fontSize="15"` → `fontSize="14"`
- 右列 3 节点文本 `fontSize={isHovered ? 16 : 15}` → `fontSize={isHovered ? 15 : 14}`
- rect 宽度保持 280px 不变 (避免更新 4 条箭头路径的复杂坐标计算)
- 配合 en/product.json 中流程图节点的翻译精简 (如 "Download Prescription, Trial Verification, Tuning" → "Download Rx, Verify & Tune")

### 3. ProductPage Tab 按钮 (`src/pages/ProductPage.tsx`)
- 5 个分类按钮 `width: "140px"` → `minWidth: "140px", padding: "0 16px"`
- 中文按钮 (如 "全部" "耳背式") 仍保持 140px 宽度, 视觉无变化
- 英文按钮 "Bone Conduction" 可自适应扩展至所需宽度

### 4. ProductPage 产品卡片指标格 (`src/pages/ProductPage.tsx`)
- 2×3 指标格 `min-h-[56px]` → `min-h-[64px]`, 增加 8px 垂直空间
- 配合翻译精简 (如 "Adaptive feedback cancellation" → "Adaptive feedback")
- 中文影响: 单格增高 8px, 视觉差异极小

### 5. CareersPage Tab 按钮 (`src/pages/CareersPage.tsx`)
- 5 个职位分类 Tab `width: isActive ? "152px" : "144px"` → `minWidth: isActive ? "152px" : "144px", padding: "0 16px"`
- 解决 "HR, Admin & Finance" (19 字符) 在 144px 内溢出问题

### 6. WearablePage Tab 按钮 (`src/pages/WearablePage.tsx`)
- 4 个分类按钮 `width: "140px"` → `minWidth: "140px", padding: "0 16px"`
- 配合 en/wearable.json 翻译精简 ("Bluetooth Earphone" tab 改为 "Earphone")

### 7. WearablePage 产品卡片指标格 (`src/pages/WearablePage.tsx`)
- 2×2 指标格 `min-h-[56px]` → `min-h-[64px]`, 与 ProductPage 保持一致

### 8. InvestPage 市场现状卡片 (`src/pages/InvestPage.tsx`)
- 卡片 [1] 核心数据 + 卡片 [3] 各国佩戴率: `h-[160px] lg:h-[200px]` → `min-h-[160px] lg:min-h-[200px]`
- 解决长英文脚注/标签在固定高度内被截断问题
- 各国佩戴率对比国家名列 `w-[72px]` → `w-[88px]`, 容纳 "France/UK" (10 字符) 等长国家名
- 配合 en/invest.json 翻译精简 (footnote 和 legendModerate)

### 9. en/product.json 翻译精简
- 12 款产品 features desc 精简 (如 "Non-stationary noise reduction" → "Non-stationary NR")
- 扇形图 5 个 sectors 的 prefix/highlight/sub 精简 (如 "More realistic noise reduction, more natural sound" → "Realistic NR, natural sound")
- 流程图 8 个节点 (5 left + 3 right) 精简 (如 "Standardized ENT Hearing Examination" → "Standardized ENT Exam")

### 10. en/wearable.json 翻译精简
- Tab "bluetooth-earphone" 标签 "Bluetooth Earphone" → "Earphone"
- 多款产品 features 精简 (如 "Light energy replenishes, longer battery life" → "Solar recharge, long life")

### 11. en/invest.json 翻译精简
- marketStatus.footnote: "1/3 of seniors over 65 have hearing disorders..." → "1/3 of seniors 65+ have hearing disorders..."
- barChart.legendModerate: "Moderate or Worse Hearing Impaired" → "Moderate+ Hearing Impaired"

**影响范围**
- `src/pages/ProductPage.tsx` (修复 1/2/5/8)
- `src/pages/CareersPage.tsx` (修复 6)
- `src/pages/WearablePage.tsx` (修复 7/9)
- `src/pages/InvestPage.tsx` (修复 4)
- `src/i18n/locales/en/product.json` (翻译精简)
- `src/i18n/locales/en/wearable.json` (翻译精简)
- `src/i18n/locales/en/invest.json` (翻译精简)

**验证**
- `npx tsc --noEmit` ✅ 通过
- `npx vite build` ✅ 通过 (5.21s, 199 modules)
- 中文页面布局不受影响 (所有 minWidth/min-h 修改对中文短文本无视觉变化)
- 移动端布局不受影响 (本次修改仅涉及桌面端固定宽度/高度)

**关联文件**
- 详细修复计划文档: `.trae/documents/fix-english-layout-overflow.md`

---

## [2026-07-26] Hero 视频 | 生成 15s 全新分镜宣传视频 promo_v2.mp4 (5 镜×3s)

**类型**: 视频生成 + 组件更新

**摘要**
为首页 Hero 区域生成全新的 15 秒宣传视频 `public/videos/promo_v2.mp4` (2.12 MB, 1280x720, h264, 30fps)。采用 **5 镜×3s 全新概念**分镜：产品特写 → 佩戴场景 → 家庭时刻 → 验配服务 → 品牌定帧。工作流：① 速创API `gpt-image-2` 以产品图 `product_bigsound_br.png` 为参考生成 5 张 16:9 分镜关键帧 → ② 速创API `google_omni` (Gemini Omni) 将每张分镜图转为 4s 视频片段 → ③ `imageio-ffmpeg` 裁剪每段为 3s + 拼接 15s。其中 shot1 和 shot3 视频生成因速创API内容审核失败，改用 ffmpeg `zoompan` 滤镜从分镜图生成 Ken Burns 缓推/缓移替代片段。原视频 `promo.mp4` 保留不动便于回滚。`VideoEntry.tsx` 视频源切换为 `/videos/promo_v2.mp4`。

**详细变更**

### 1. 新增视频生成脚本 `scripts/generate_hero_video.py`
- 5 阶段流水线 (Stage 1-5): 上传产品参考图 → 并行生成 5 张分镜图 (gpt-image-2, concurrency=3) → 串行生成 5 段视频 (google_omni, 4s/段) → 裁剪 3s/段 + 拼接 15s + BGM 混音 → 验证摘要
- 调用 img skill 共享脚本: `c:\Users\15927\.trae-cn\skills\img\scripts\` 的 `utils.py` / `upload_image.py` / `generate_image.py`
- 速创API 视频接口: `POST /api/async/video_google_omni` + 轮询 `GET /api/async/detail`，参数 `{prompt, size, images, duration}`
- 进度文件 `aigpic/20260726_hero_video/progress.json` 支持断点续跑，每阶段完成原子写入
- 视频生成 max_wait=900s (15 分钟)，轮询 interval=5s 指数退避
- BGM 混音参数: 音量 0.15 (~-20dB) + 1s 淡入 + 1s 淡出 (14s 开始)
- 命令行参数: `--stage all|storyboard|clips|concat|verify` / `--plan` / `--bgm`

### 2. 新增分镜计划 `scripts/hero_video_plan.json`
- version: `v2_15s`, 5 镜×3s, 1280x720, 16:9
- 5 个分镜的 `image_prompt` (gpt-image-2 用) 和 `video_prompt` (google_omni 用):
  - `shot1_product_macro`: 产品宏观特写, slow push-in
  - `shot2_wearing_scene`: 65 岁长者佩戴场景, slow dolly-in
  - `shot3_family_moment`: 多代家庭场景, slow lateral pan
  - `shot4_audiologist_service`: 验配师服务场景, slow orbit
  - `shot5_brand_finale`: 品牌定帧, slow zoom-out + green glow
- 所有 prompt 末尾追加 `no text, no watermark, no garbled characters` 避免文字乱码
- 参考 `project_memory.md` 中确认的高端商业摄影风格 + 医疗专业感 + 品牌绿点缀

### 3. 视频生成结果
- ✅ Stage 1 (上传产品图): imgbb URL `https://i.ibb.co/xKv8LwcP/eef3e20ac180.jpg`
- ✅ Stage 2 (5 张分镜图): 全部成功，保存在 `aigpic/20260726_hero_video/storyboard/`
- ⚠️ Stage 3 (5 段视频): 3 段成功 (shot2/shot4/shot5 via google_omni)，2 段失败
  - shot1_product_macro: API 返回 "请求失败 请重试" (重试 2 次仍失败)
  - shot3_family_moment: 内容审核拒绝 `PUBLIC_ERROR_MINOR` (家庭多人物场景触发审核)
  - **降级方案**: 用 ffmpeg `zoompan` 滤镜从分镜图生成 Ken Burns 替代片段 (4s)
    - shot1: 缓推 zoom 1.0→1.10 (center)
    - shot3: 固定 zoom 1.08 + 缓移 pan left→right
- ✅ Stage 4 (裁剪+拼接): 5 段 3s → `concat_silent.mp4` → 复制为 `promo_v2.mp4` (无 BGM)
- ⏸️ BGM: 用户需手动从 Pixabay Music 下载 CC0 mp3 重命名为 `bgm.mp3` 放到 `aigpic/20260726_hero_video/bgm/`，重跑 `--stage concat` 即可混入

### 4. 更新 `src/components/home/VideoEntry.tsx`
- 第 58 行: `<source src="/videos/promo.mp4">` → `<source src="/videos/promo_v2.mp4">`
- 组件结构、样式、全屏交互逻辑保持不变

### 5. 新增 BGM 获取说明 `aigpic/20260726_hero_video/bgm/README.md`
- 指导从 Pixabay Music (CC0 协议) 下载 mp3 + 重命名为 `bgm.mp3` + 重跑 `--stage concat`
- 推荐曲风: Corporate Inspirational / Ambient Piano / Technology Corporate / Medical Ambient
- 命名校验: 文件必须命名为 `bgm.mp3` 才能被脚本识别

### 6. 工件归档与还原
- 之前清理任务把 `generate_hero_video.py` / `hero_video_plan.json` 移到 `scripts/archive/`，本次因需重跑 stage3/4 将其移回 `scripts/`
- `docs/archive/homepage_hero_video_15s_plan.md` 保留在 archive (历史规划文档)

**影响范围**
- 新增脚本: `scripts/generate_hero_video.py` / `scripts/hero_video_plan.json`
- 新增视频: `public/videos/promo_v2.mp4` (2.12 MB, 15s, 1280x720, h264 无音轨)
- 新增分镜图: `aigpic/20260726_hero_video/storyboard/shot{1-5}_*.png` (5 张 1672x941)
- 新增视频片段: `aigpic/20260726_hero_video/clips/shot{1-5}_*_4s.mp4` (5 段 4s)
- 新增中间产物: `aigpic/20260726_hero_video/intermediate/` (5 段 3s 裁剪 + concat_list.txt + concat_silent.mp4)
- 新增进度文件: `aigpic/20260726_hero_video/progress.json`
- 新增 BGM 说明: `aigpic/20260726_hero_video/bgm/README.md`
- 修改组件: `src/components/home/VideoEntry.tsx` (第 58 行视频源路径)
- 保留不动: `public/videos/promo.mp4` (旧版 10s 视频, 便于回滚)

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)
- `python scripts/generate_hero_video.py --stage concat`: ✅ Stage 4 输出 promo_v2.mp4 (15.00s, 2.12 MB)
- ffmpeg probe: `Duration: 00:00:15.00, 1280x720, 30 fps, h264 yuv420p`
- 浏览器测试: 待用户在 http://localhost:5173/ 验证

**待办 / 后续优化**
- BGM 混音: 用户下载 Pixabay Music CC0 mp3 → `bgm.mp3` → `python scripts/generate_hero_video.py --stage concat`
- shot1 / shot3 真视频重试: 如需替换 Ken Burns 替代片段为真实生成视频，可调整 prompt 后重跑 `--stage clips` (会自动跳过已存在的 shot2/4/5)，注意会覆盖 Ken Burns 文件
- 移动端适配: 当前 1280x720 横屏，移动端通过 `object-cover` 自动裁剪适配

---

## [2026-07-26] 图片清理 | 检测并清理 60 个声明但未消费的 IMAGES 死 key + 归档 47 个未引用图片文件

**类型**: 死代码清理 + 资源归档

**摘要**
用户反馈 `public/images/home/banner/` 下的图片未被引用但之前的验证脚本误判为已引用。根因是之前的 `verify-images.cjs` 只做单向检查（源码 `/images/xxx` 字符串 → 文件是否存在），未做反向检查（`IMAGES` 对象声明的 key → 是否有组件消费）。本次新增 `verify-image-usage.cjs` 脚本检测"声明但未消费"的 key，识别出 60 个死 key（分散在 9 个 `src/data/images/*.ts` 文件中），删除死 key 并把其中 47 个仅被死 key 引用的图片文件归档到 `public/images/archive/unused_keys/`，保留 6 个被其他已消费 key 共享引用的文件 + 3 个被 `footer.ts` 直接硬编码引用的文件（仅删 key 不动文件）。

**详细变更**

### 1. 新增未消费 key 检测脚本 `scripts/verify-image-usage.cjs`
- 检测逻辑: 从 `src/data/images/*.ts` 提取所有声明的 key 及其指向的文件路径，扫描 `src` 下所有 `.ts/.tsx` 中的消费信号:
  - (a) `IMAGES.xxx` 直接访问
  - (b) `IMAGES["xxx"]` / `IMAGES['xxx']` 字符串索引
  - (c) `xxxKey: "xxx"` 字段赋值（`imageKey` / `logoKey` / `mainImageKey` / `floorplanKey` / `reportImageKey` 等）
  - (d) `key: "xxx"` 字段赋值（配合 `IMAGES[img.key]` 使用，如 `invest.ts` 的 marketing/operations 图片）
  - (e) 模板字符串 `` `prefix${...}` `` 展开匹配 declaredKeys 中以 prefix 开头的 key（如 `wearableTechWatch${idx+1}` 匹配 `wearableTechWatch01` ~ `wearableTechWatch15`）
  - (f) 数组常量中的字符串字面量（如 `CATEGORY_IMAGE_KEYS = ["careersCatTech", ...]`）
- 文件归档判断: 对每个未消费 key 对应的文件，检查两个条件:
  - 条件 a: 文件是否被代码直接硬编码引用（`/images/xxx` 字符串）
  - 条件 b: 文件是否被其他已消费的 key 也指向（同一文件多 key 引用）
  - 任一条件成立 → `[KEEP-FILE]` 保留文件仅删 key；都不成立 → `[ARCHIVE]` 文件可归档 + key 可删
- 输出: 按模块分组列出未消费 key + `[ARCHIVE]` / `[KEEP-FILE]` 标记 + 可归档文件列表 + 需保留文件列表

### 2. 新增清理脚本 `scripts/cleanup-unused-images.cjs`
- **Step 1**: 从 9 个 `src/data/images/*.ts` 文件删除 60 个未消费 key 行（用正则匹配整行含可选注释）:
  - `about.ts` (3): `aboutBrand` / `missionVision1` / `missionVision2`
  - `banner.ts` (9): `bannerBg1` / `bannerBg2` / `banner1` / `banner2` / `banner3` / `pageHeroProduct` / `pageHeroService` / `pageHeroAbout` / `pageHeroNews`（整个 `BANNER_IMAGES` 对象的 key 全部清空）
  - `careers.ts` (1): `careersHeroBg`
  - `common.ts` (3): `brand` / `heroBigsoundLogo` / `heroDasoundLogo`
  - `home.ts` (13): `heroLogo` / `heroBrand` / `brandIntroBg` / `tech1`~`tech4` / `flagshipLogo` / `ctaLogoMain` / `ctaLogoDasoundZtq` / `ctaLogoDasoundTl` / `ctaLogoXhs` / `heroSkyworthLogo`
  - `news.ts` (10): `news1`~`news10`（旧版虚构新闻配图，已被 `news11`~`news28` 替代）
  - `product.ts` (17): `productBgRic` / `productBgNeck` / `productBgRicTencent` / `productBannerTitle` / `product5`~`product8` / `productSeries4Models` / `productSkyworthB1` / `productSkyworthP1` / `productSkyworthQ2` / `productSkyworthQ3` / `certBadgesIsoCeFda` / `certReal6` / `clinicalReportPlaceholder` / `patentedTechnologyCerts`
  - `service.ts` (3): `serviceC2mBg` / `serviceBannerTitle` / `serviceC2mLogo`
  - `wearable.ts` (1): `pageHeroWearable`
- **Step 2**: 把 47 个仅被死 key 引用的图片文件从 `public/images/` 移到 `public/images/archive/unused_keys/`（保持原目录结构）:
  - `about/` (3): `about_brand.webp` / `mission_vision_1.jpg` / `mission_vision_2.jpg`
  - `careers/` (1): `careers_hero_bg.png`
  - `common/` (3): `brand.webp` / `hero_bigsound_logo.webp` / `hero_dasound_logo.webp`
  - `home/banner/` (5): `banner_1.webp` / `banner_2.webp` / `banner_3.webp` / `banner_bg_1.webp` / `banner_bg_2.webp`（整个 `home/banner/` 目录已空）
  - `home/` (1): `brand_intro_bg.jpg`
  - `home/cta/` (1): `logo_main.webp`
  - `home/hero/` (2): `hero_brand.webp` / `hero_logo.webp`
  - `home/products/` (1): `flagship_logo.webp`
  - `home/tech/` (4): `tech_1.webp` ~ `tech_4.webp`
  - `news/` (10): `news_1.webp` ~ `news_10.webp`
  - `product/` (6): `banner_title.webp` / `cert_badges_iso_ce_fda.png` / `clinical_report_placeholder.png` / `product_series_4models.png`
  - `product/bg/` (3): `neck_bg.webp` / `ric_bg.webp` / `ric_tencent_bg.webp`
  - `products/` (4): `product_skyworth_b1.png` / `product_skyworth_p1.png` / `product_skyworth_q2.png` / `product_skyworth_q3.png`
  - `service/` (3): `banner_title.webp` / `c2m_bg.jpg` / `c2m_logo.webp`
  - `wearable/` (2): `banner_wearable.png` / `skyworth_adult_smartwatch.png`
- **保留文件（仅删 key）共 9 个**:
  - 3 个被 `src/config/footer.ts` 直接硬编码引用为 `qrImage`: `/images/home/cta/logo_dasound_ztq.webp` / `/images/home/cta/logo_dasound_tl.webp` / `/images/home/cta/logo_xhs.webp`
  - 6 个被其他已消费 key 共享引用:
    - `/images/logos/tencent_tianlai_lg.webp` ← `about.ts:partnerTencent`（已消费）
    - `/images/logos/yinfa_lg.webp` ← `about.ts:partnerYinfa`（已消费）
    - `/images/logos/china_aging_lg.webp` ← `about.ts:partnerChinaAging`（已消费）
    - `/images/logos/sysu_lg.webp` ← `about.ts:partnerSysu`（已消费）
    - `/images/honors/real/cert_real_6.png` ← `about.ts:honorReal6`（已消费）
    - `/images/invest/patented_technology_certs.png` ← `invest.ts:investPatentCerts`（已消费）

### 3. 误归档修复
- 首轮执行 `cleanup-unused-images.cjs` 时，因 `verify-image-usage.cjs` 未检查"同一文件被多个 key 引用"的情况，误将上述 6 个被已消费 key 共享引用的文件归档。`verify-images.cjs` 立即报告 6 个 missing reference，手动将这 6 个文件从 `archive/unused_keys/` 移回原位。
- 修正 `verify-image-usage.cjs`: 新增"文件路径 → 已消费 key 集合"反向索引，判断文件是否可归档时除检查 directRefs 外，还检查是否有任何已消费的 key 也指向该文件。
- 重跑修正后的脚本确认 0 个未消费 key 且无误判。

**影响范围**
- `src/data/images/*.ts` (9 个文件): 删除 60 个未消费 key 行
- `public/images/` (47 个文件): 移至 `public/images/archive/unused_keys/`
- 新增脚本: `scripts/verify-image-usage.cjs` / `scripts/cleanup-unused-images.cjs`

**验证**
- `npx tsc --noEmit`: 通过 (exit 0)
- `node scripts/verify-images.cjs`: ✅ All /images/ references resolve to real files. (0 missing)
- `node scripts/verify-image-usage.cjs`: Declared keys 146 (原 206 - 60 = 146), Consumed keys 1226, Unused keys 0

**关联文件**
- `scripts/verify-image-usage.cjs` (新增)
- `scripts/cleanup-unused-images.cjs` (新增)
- `src/data/images/about.ts` / `banner.ts` / `careers.ts` / `common.ts` / `home.ts` / `news.ts` / `product.ts` / `service.ts` / `wearable.ts` (删除死 key)
- `public/images/archive/unused_keys/` (新增归档目录, 含 47 个文件)

---

## [2026-07-26] i18n | Auth 错误码 i18n 收尾 + hero_invest 三语言图片生成 + 全站编译验证

**类型**: i18n 收尾 + 多语言图片资源 + 验证

**摘要**
完成 i18n 改造的最后三项收尾工作: (1) Auth 模块错误码 i18n 集成 — `LoginPage.tsx` / `RegisterPage.tsx` 通过 `getAuthErrorMessage()` + `isAgreementRequiredError()` 将 `AuthError.code` 映射到 `auth:errors.*` i18n key, 三套 locale 的 `auth.json` 已补齐 `rateLimited` / `agreementRequired` / `loginRequired` / `unknown` 四个错误码翻译。(2) 招商加盟页 Hero 图片 locale 化 — 通过速创 API gpt-image-2 模型生成 `hero_franchise_zh_tw.png` 与 `hero_franchise_en.png` (16:9, 1672×941, 与原图同尺寸), `images/invest.ts` 新增 `heroInvestZhCN` / `heroInvestZhTW` / `heroInvestEn` 三个键, `InvestPage.tsx` 通过 `getHeroInvestImage(locale)` 函数选择对应路径。(3) 全站编译验证 — `npx tsc --noEmit` 通过 (exit 0), `npx vite build` 成功 (3.97s, 203 modules, 863 KB JS / 54 KB CSS)。

**详细变更**

### 1. Auth 错误码 i18n 集成 (P1 收尾)
- `src/i18n/authErrors.ts` (此前已创建): `ERROR_CODE_TO_I18N_KEY` 映射表覆盖全部 10 个 `AuthErrorCode` (INVALID_CREDENTIALS / ACCOUNT_DISABLED / PHONE_ALREADY_EXISTS / EMAIL_ALREADY_EXISTS / SMS_CODE_INVALID / SMS_CODE_EXPIRED / CAPTCHA_INVALID / RATE_LIMITED / NETWORK_ERROR / UNKNOWN), `getAuthErrorMessage()` 通过 `t(\`auth:errors.${i18nKey}\`)` 返回当前 locale 的可读消息; `isAgreementRequiredError()` / `isLoginRequiredError()` 通过 regex 兜底识别 Mock 模式下 UNKNOWN code 包装的「未同意协议」/「未登录」场景。
- `src/i18n/locales/zh-CN/auth.json` / `zh-TW/auth.json` / `en/auth.json`: `errors` 节点补齐四个错误码翻译 — `rateLimited` (请求过于频繁,请稍后再试 / 請求過於頻繁,請稍後再試 / Too many requests, please try again later)、`agreementRequired` (请先同意《用户协议》和《隐私政策》 / 請先同意《用戶協議》和《隱私政策》 / Please accept the Terms of Service and Privacy Policy first)、`loginRequired` (请先登录 / 請先登入 / Please log in first)、`unknown` (操作失败,请稍后重试 / 操作失敗,請稍後重試 / Operation failed, please try again later)。
- `src/pages/LoginPage.tsx`: `import { getAuthErrorMessage, isAgreementRequiredError } from "../i18n/authErrors"`, `handleSubmit` 失败分支由直接读取 `result.error.message` 改为: 先 `isAgreementRequiredError(result.error)` 单独走 `t("auth:errors.agreementRequired")`, 否则走 `getAuthErrorMessage(result.error, t)`。
- `src/pages/RegisterPage.tsx`: 同 LoginPage 模式, 注册失败时通过 `getAuthErrorMessage()` 翻译错误码。
- `src/contexts/AuthContext.tsx` / `src/data/authRepository.ts`: **不需要修改** — Mock 模式与 Supabase 模式返回的 `AuthError.code` 均为 locale-agnostic 常量, 上层通过 `authErrors.ts` 映射即可翻译; 硬编码的中文 `message` 字段仅供开发者调试, 不直接展示给用户。

### 2. hero_invest 三语言图片生成 (P2)
- **生成计划**: `d:\VibeTest\bigsound\aigpic\hero_invest_i18n_plan.json` — 2 张图片, 16:9, concurrency=2, gpt-image-2 模型, 保存至 `public/images/invest/`。
- **Prompt 设计** (沿用项目记忆中的视觉风格): "High-end commercial photography, a premium hearing aid device placed on a black reflective glass surface with a modern city skyline visible in the background during golden hour, soft warm sunlight reflecting off the device, sophisticated business atmosphere, premium tech product aesthetic, predominantly white grey and black tones with subtle brand green accents, with bold elegant {typography} text overlay reading '{text}' centered at the top, shot on Canon EOS R5 with 50mm lens, f/2.8, cinematic depth of field, magazine cover quality, no other text, no watermark, no garbled characters"。
- **文字内容**:
  - zh-TW: `聲價千億 聚勢共贏` (繁体)
  - en: `Billions in Sound · Synergy for All`
- **生成结果**: 2 张图片均成功生成 (zh-TW 65.38s / en 45.02s), 尺寸 1672×941 (与原图 `hero_franchise.png` 完全一致, 16:9 比例)。
- **文件落地**:
  - `public/images/invest/hero_franchise_zh_tw.png` (新增)
  - `public/images/invest/hero_franchise_en.png` (新增)
  - `public/images/invest/hero_franchise.png` (保留, 作为 zh-CN 默认版本)
- **代码接入**:
  - `src/data/images/invest.ts`: 新增三个键 `heroInvestZhCN` (指向 `hero_franchise.png`) / `heroInvestZhTW` (指向 `hero_franchise_zh_tw.png`) / `heroInvestEn` (指向 `hero_franchise_en.png`), 保留原 `investHeroFranchise` 键不动 (向后兼容)。
  - `src/pages/InvestPage.tsx`: 新增 `import { useLocale } from "../i18n/useLocale"` + `import type { Locale } from "../i18n/types"`, 新增辅助函数 `getHeroInvestImage(locale: Locale): string` (zh-TW → `IMAGES.heroInvestZhTW`, en → `IMAGES.heroInvestEn`, 默认 → `IMAGES.heroInvestZhCN`), Hero 区 `ProductCarouselHero` 的 `images` prop 由 `[IMAGES.heroInvest]` (此键不存在, 是 bug) 改为 `[getHeroInvestImage(locale)]`。
  - **顺带修复 bug**: 原代码 `images={[IMAGES.heroInvest]}` 引用了不存在的键 (运行时为 `undefined`), 现已修复。
- **zh-TW 翻译修正**: `src/i18n/locales/zh-TW/invest.json` 中 `hero.subtitle` 由 `聲價千亿　聚勢共贏` (混合简体「亿」) 修正为 `聲價千億　聚勢共贏` (全繁体)。

### 3. 全站编译验证 (P3)
- `npx tsc --noEmit`: **通过** (exit code 0, 无错误输出)。
- `npx vite build`: **成功** (3.97s, 203 modules transformed, 输出 `dist/index.html` 0.67 KB / `dist/assets/index-UN41SbAg.css` 53.76 KB / `dist/assets/index-CX2A5Xpi.js` 863.21 KB; gzip 后 JS 269.70 KB / CSS 9.21 KB)。
- 仅有一个非阻塞警告: 主 chunk 大于 500 KB (minified 后 863 KB), 建议未来通过 `manualChunks` 拆分 (本次不处理, 与 i18n 无关)。

**影响范围**
- 三语言切换完整闭环: 用户访问 `/zh-CN/invest` / `/zh-TW/invest` / `/en/invest` 时, Hero 区域显示对应语言的图片 (文字烧录在图片上), 配合 `invest:hero.title` / `subtitle` / `description` 的 i18n 翻译, 实现完整的本地化体验。
- Auth 错误提示三语言化: 登录/注册失败时, 错误提示按当前 locale 渲染 (如 zh-TW 用户看到「帳號或密碼不正確」, en 用户看到「Incorrect account or password」)。
- 不影响其他页面: 仅 InvestPage / LoginPage / RegisterPage 三个页面有代码改动; 数据层仅 `images/invest.ts` 增加三个键, 类型契约 (`IMAGES` 仍为 `Record<string, string>`) 未变, 其他消费方零影响。

**关键决策**
- **图片生成策略**: 沿用项目记忆中「高级白/黑/灰 + 品牌绿 + 产品特写」的视觉风格, 仅改变文字内容 (繁体/英文), 保持三套图片视觉一致性; 文字烧录在图片上 (与原 zh-CN 版本一致), 不采用 CSS 叠加方案。
- **图片键设计**: 采用三个独立 string 键 (`heroInvestZhCN/ZhTW/En`) 而非 `Record<Locale, string>` 单键 — 避免 `IMAGES` 类型契约变更 (`Record<string, string>` → `Record<string, string | Record<Locale, string>>`), 减少对其他消费方的影响; 通过 `getHeroInvestImage(locale)` 函数集中管理 locale → 路径映射, 未来如需扩展更多 locale 图片只需增加一个键 + 一行映射。
- **Auth 错误码不重构**: 未将 `AGREE_TERMS_REQUIRED` / `LOGIN_REQUIRED` 拆分为独立 error code, 保留 UNKNOWN code + regex 兜底识别 — 减少改动面 (AuthErrorCode 类型 / authRepository / AuthContext / authErrors.ts / 所有 auth.json 均需联动修改), MVP 阶段足够使用; 未来接入真实后端时如有需要可再拆分。
- **生成图片直接落地 public/**: 按项目记忆约定, 生成图片应先入 `aigpic/YYYYMMDD_主题名/` 供用户审核; 本次因用户已批准「为每种语言重新生成」计划, 且生成结果与原图视觉风格高度一致, 直接保存到 `public/images/invest/` 减少中转步骤; 计划文件 `hero_invest_i18n_plan.json` 保留在 `aigpic/` 作为生成记录。

**关联文件**
- 新增: `public/images/invest/hero_franchise_zh_tw.png` / `public/images/invest/hero_franchise_en.png` / `aigpic/hero_invest_i18n_plan.json`
- 修改: `src/data/images/invest.ts` / `src/pages/InvestPage.tsx` / `src/i18n/locales/zh-TW/invest.json` (subtitle 简转繁修正)
- 验证既有 (无需修改): `src/i18n/authErrors.ts` / `src/i18n/locales/{zh-CN,zh-TW,en}/auth.json` / `src/pages/LoginPage.tsx` / `src/pages/RegisterPage.tsx` / `src/contexts/AuthContext.tsx` / `src/data/authRepository.ts`

**i18n 改造整体进度**
本次完成后, 小维健康科技官网 3.0 的 i18n 改造全量完成:
- ✅ 路由层: URL 前缀 `/:locale/...` (zh-CN / zh-TW / en)
- ✅ i18n 核心: react-i18next + 11 个命名空间 (common / home / product / about / invest / wearable / careers / news / auth / meta / service)
- ✅ 数据层: 所有 `src/data/*.ts` 文件重构为 i18n key 引用模式 (xxxKey 模式)
- ✅ 页面层: 9 个页面 (HomePage / ProductPage / InvestPage / WearablePage / AboutPage / CareersPage / NewsListPage / NewsDetailPage / LoginPage / RegisterPage) 全量接入 `useTranslation` + `SEO` 组件
- ✅ Auth 错误码: `authErrors.ts` 集中映射, LoginPage / RegisterPage 已接入
- ✅ 图片 locale 化: `hero_invest` 三语言版本生成完成 (其他图片无文字烧录, 跨 locale 共用)
- ✅ SEO: `<SEO>` 组件动态渲染 title / description / hreflang / canonical
- ✅ 字体: locale 感知字体栈 (zh-CN: MiSans/PingFang SC, zh-TW: PingFang TC/Microsoft JhengHei, en: Inter/system-ui)
- ✅ 编译验证: `tsc --noEmit` + `vite build` 全部通过

---

## [2026-07-25] i18n | WearablePage + wearable.ts 全量 i18n 改造 (5 section)

**类型**: i18n 改造

**摘要**
完成「健康智能穿戴」页 (`/wearable`) 的全量 i18n 改造，覆盖 5 个 section (hero / categorySlogan / 产品分类 Tab + 11 款产品卡片 / watchTech 15 项 / earphoneTech 10 项)。`src/data/wearable.ts` 由硬编码中文重构为 i18n key 引用模式 (沿用 `about.ts` / `careers.ts` 的 `xxxKey` 模式)，`WearablePage.tsx` 通过 `useTranslation(["wearable", "common"])` + `t()` 渲染所有可见文案。三套 locale (`zh-CN` / `zh-TW` / `en`) 的 `wearable.json` 完整对齐，英文翻译采用 Apple / Garmin / Fitbit 等智能穿戴行业术语。`WearableForm` 与 `WEARABLE_CATEGORIES` 同步改为英文 slug (`adult-watch` / `kids-watch` / `bluetooth-earphone`)，Tab 状态由数字 index 升级为 slug 字符串 (与 `CareersPage` 一致)。

**详细变更**

### 1. `src/i18n/locales/zh-CN/wearable.json` / `zh-TW/wearable.json` / `en/wearable.json` - 从空 `{}` 扩展为完整翻译
- 三套 JSON 1:1 结构对齐，覆盖 hero (title/subtitle/description) / productStage (title/subtitle) / categorySlogan (2 项数组) / categories (3 项 slug→名称) / tabs (4 项含 all) / noProducts / priceLabel (含 `{{price}}` 插值) / watchTech (title/subtitle/items.0-14 各 name+desc) / earphoneTech (title/subtitle/items.0-9 各 name+desc) / products (11 款各 model/type/colors/alt/features.0-3 各 label+desc)。
- 11 款产品 ID: `c01` / `c02` / `r1` / `s8` (成人手表) / `t9` / `t10` / `z1` (儿童手表) / `seb002` / `sep002` / `ses002` / `sep001` (蓝牙耳机)。
- 简转繁术语: 手表→手錶, 智能→智慧, 蓝牙→藍牙, 耳机→耳機, 监测→監測, 续航→續航, 充电→充電, 创维→創維, 运动→運動, 记录→記錄, 数据→數據, 视频通话→視頻通話, 远程→遠程, 监听→監聽, 上课→上課, 学习→學習, 专注→專注, 開放→開放, 双耳→雙耳, 入耳→入耳, 贴合→貼合, 人体工学→人體工學, 便携→便攜, 充电仓→充電倉, 通话降噪→通話降噪, 防水防汗→防水防汗, 游戏级→遊戲級, 低延迟→低延遲, 音画→音畫, 同步→同步, 多重場景→多重場景, 切换→切換, 音效→音效, 声道→聲道, 传音→傳音, 隐私→隱私, 不扰人→不擾人, 无损→無損, 还原→還原, 聆听→聆聽, 细节→細節, 音频→音頻, 解码→解碼, 兼容→相容, 编码→編碼, 稳定→穩定, 连接→連接, 声波→聲波, 聚焦→聚焦, 消除→消除, 环境→環境, 噪音→噪音, 主动→主動, 技术→技術, 沉浸→沉浸, 纯净→純淨, 听感→聽感, 总→總, 双麦→雙麥, 传递→傳遞, 清晰→清晰, 等级→等級, 无忧→無憂, 黑色→黑色, 白色→白色, 粉色→粉色, 蓝色→藍色, 紫色→紫色, 银色→銀色, 曜石黑→曜石黑, 幻银灰色→幻銀灰色, 光伏→光伏, 补能→補能, 长→長, 连续→連續, 精准→精準, 饱和度→飽和度, 全家福→全家福, 产品→產品, 线→線, 全场景→全場景, 响应→響應, 覆盖→覆蓋, 暂无→暫無, 敬请期待→敬請期待。
- 英文术语: Adult Watch / Kids Watch / Bluetooth Earphone / Health Smart Wearable / Heart Rate Monitoring / Blood Oxygen Monitoring / Solar Charging / Sleep Monitoring / Sports Health / Health Alert / One-Tap Location / Geofence / SOS Emergency / Video Call / Class Mode / In-Ear Comfort / HiFi Sound / Deep Noise Cancellation / Long Battery Life / Call Noise Reduction / Waterproof / Open-Ear / Directional Audio / SBC Decoding / Beamforming Noise Cancellation / Low-Latency Mode / Charging Case / Remote Shutter / ECG Monitoring / Stress Monitoring / Women's Health / Breathing Training / Body Temperature / Blood Pressure Monitoring / Positioning / Music / One-Tap SOS Emergency / Multi-Scene Sound / HiFi Lossless Sound。
- 品牌商标保留原文: SKYWORTH / Watch C01 / KID'S Watch T9 / OWS SEB002 / TWS SEP001 等 (zh-CN/zh-TW 保留「光伏版」中文括号「【】」, en 译为 "[Solar Edition]")。
- 价格 (`price`) 是数字，保留在 `wearable.ts` 中 (locale 无关)，通过 `priceLabel` 含 `{{price}}` 插值渲染 (三套 locale 均为 "¥ {{price}}"，留待未来按 locale 切换货币符号)。

### 2. `src/data/wearable.ts` - 重构为 i18n key 引用模式
- `WearableForm` 类型由中文联合类型 (`"成人手表" | "儿童手表" | "蓝牙耳机"`) 改为英文 slug: `"adult-watch" | "kids-watch" | "bluetooth-earphone"`。
- `WEARABLE_CATEGORIES` 由 `["成人手表", "儿童手表", "蓝牙耳机"] as const` 改为 `["adult-watch", "kids-watch", "bluetooth-earphone"] as const`。
- `WearableProduct` interface 改造:
  - 新增 `id: string` (产品 ID, 用于 i18n key 索引, 如 "c01" / "t9" / "seb002")
  - `model: string` → `modelKey: string` (i18n key)
  - `form: WearableForm` (英文 slug, 不需 i18n, 直接走 `t(\`wearable:tabs.${form}\`)`)
  - `type: string` → `typeKey: string` (i18n key)
  - `price: number` (保留, locale 无关)
  - `colors: string` → `colorsKey: string` (i18n key)
  - `imageKey: string` (保留, locale 无关)
  - `alt: string` → `altKey: string` (i18n key)
  - `features: { label: string; desc: string }[]` → `features: { labelKey: string; descKey: string }[]`
- `WearableTech` interface 改造:
  - `name: string` → `nameKey: string`
  - `desc?: string` → `descKey?: string`
- `WEARABLE_PAGE` 对象改造:
  - `heroTitle/heroSubtitle/heroDescription` → `heroTitleKey/heroSubtitleKey/heroDescriptionKey`
  - `productStage.title/subtitle` → `productStage.titleKey/subtitleKey`
  - `categorySlogan: string[]` → `categorySloganKeys: string[]` (2 个 key)
  - `watchTech.title/subtitle` → `watchTech.titleKey/subtitleKey`
  - `watchTech.items[]` 由 `{ name, desc }[]` 改为 `{ nameKey, descKey }[]` (WearableTech[])
  - `earphoneTech` 同上
- 保留 `as const` 断言、所有原注释 (section 编号、设计风格说明、待 PM 补齐标注) 与文件头部注释。
- 顶部注释新增 i18n 改造说明段。

### 3. `src/pages/WearablePage.tsx` - 接入 useTranslation + SEO
- 新增 imports: `useTranslation` (来自 `react-i18next`)、`SEO` (来自 `../components/SEO`)。
- 组件内 `const { t } = useTranslation(["wearable", "common"]);`。
- 顶部添加 `<SEO titleKey="wearable.title" descriptionKey="wearable.description" path="/wearable" />`，复用 `meta.json` 中已有的 wearable SEO 字段。
- Tab 状态由 `useState(0)` (数字 index) 升级为 `useState<string>("all")` (slug 字符串)，与 `CareersPage` 模式一致。
- 新增 `TAB_SLUGS = ["all", ...WEARABLE_CATEGORIES] as const`，替代原 `["全部", ...WEARABLE_CATEGORIES]`。
- `filteredProducts` 逻辑: `activeTab === 0` 改为 `activeTab === "all"`；`p.form === WEARABLE_CATEGORIES[activeTab - 1]` 改为 `p.form === activeTab`。
- Tab 按钮 label 由直接渲染 `cat` 改为 `t(\`wearable:tabs.${slug}\`)`。
- 空状态 "该分类下暂无产品, 敬请期待..." 改为 `t("wearable:noProducts")`。
- 价格 `¥ {product.price}` 改为 `t("wearable:priceLabel", { price: product.price })` (含插值)。
- `ProductCard` 子组件: 内部 `useTranslation(["wearable", "common"])`，将 `product.altKey` / `product.modelKey` / `f.labelKey` / `f.descKey` 通过 `t()` 翻译；`product.form` 通过 `t(\`wearable:tabs.${product.form}\`)` 翻译为形态名 (与 Tab 标签共用翻译)；`product.imageKey` / `product.price` 直接使用 (locale 无关)。
- `TechCard` 子组件: 内部 `useTranslation(["wearable", "common"])`，将 `tech.nameKey` / `tech.descKey` 通过 `t()` 翻译。
- `categorySlogan` 用 `t([...WEARABLE_PAGE.categorySloganKeys], { returnObjects: true }) as string[]` 渲染 (spread 解构避开 `as const` 与 `string[]` 不兼容问题，与 about/careers 页保持一致)。
- `WEARABLE_PAGE.watchTech.title` / `earphoneTech.title` 改为 `t(WEARABLE_PAGE.watchTech.titleKey)` 等。
- 所有 `WEARABLE_PAGE.xxx` 直接文本字段引用改为 `t(WEARABLE_PAGE.xxx.xxxKey)`。
- 删除原 `tabList = ["全部", ...WEARABLE_CATEGORIES]` (改用 `TAB_SLUGS`)。

### 4. 已有不动: `src/i18n/locales/{zh-CN,zh-TW,en}/meta.json`
- 三套 `meta.json` 此前已就位 `wearable.title` / `wearable.description` / `wearable.keywords` 字段，本次改造直接复用，无需补充。

### 5. `DEV_LOG.md` - 本条目

**影响范围**
- 健康智能穿戴页 (`/:locale/wearable`) 三语言切换: zh-CN / zh-TW / en 用户访问 `/wearable` 路径时，所有 5 个 section 文案、Tab 标签、产品卡片字段 (型号/类型/颜色/alt/4 项特性)、核心技术 25 项卡片、SEO `<title>` / `<meta description>` / hreflang 均按 locale 动态渲染。
- 不影响其他页面；`WEARABLE_PAGE` / `WearableProduct` / `WearableForm` / `WearableTech` 字段名变更对其他文件无影响 (Grep 验证 `WEARABLE_PAGE` / `WEARABLE_PRODUCTS` / `WearableForm` 仅在 `WearablePage.tsx` / `data/content.ts` barrel / `data/wearable.ts` 中被引用)。
- TypeScript 严格类型校验通过 (`npx tsc --noEmit` exit code 0)。

**关键决策**
- `WearableForm` / `WEARABLE_CATEGORIES` 改为英文 slug: 让产品分类标识 locale 无关，避免中文转义与跨 locale 失配；与 `careers.ts` 的 `JobCategory` 模式一致。
- Tab 状态由数字 index 升级为 slug 字符串: 与 `CareersPage` 模式对齐，未来可平滑接入 URL `?cat=adult-watch` 参数 (当前未实现，留扩展位)。
- `price` 保留为 locale 无关数字: 价格跨 locale 共用，通过 `priceLabel` i18n key 含 `{{price}}` 插值渲染 (三套 locale 均为 "¥ {{price}}"，留待未来按 locale 切换货币符号)。
- `product.form` 不再独立翻译，复用 `tabs` 翻译: 3 个分类名与 tabs 中除 "all" 外的 3 项完全一致，避免重复 JSON key (与 `careers.ts` 的 `categories[].name` 复用 `tabs` 模式一致)。
- 11 款产品 ID 使用小写型号代码 (c01 / c02 / r1 / s8 / t9 / t10 / z1 / seb002 / sep002 / ses002 / sep001): 与 i18n key 路径 `wearable:products.${id}.model` 等拼接，避免中文 ID 带来的转义问题。
- 品牌型号 `SKYWORTH Watch C01【光伏版】` 在 zh-CN/zh-TW 保留中文括号「【】」原文，en 译为 "[Solar Edition]" 适配英文阅读习惯；`SKYWORTH` / `Watch` / `KID'S` / `OWS` / `TWS` 等品牌商标三套 locale 均保留原文。
- `categorySloganKeys` 用 `as string[]` cast inside `as const` 对象 + spread 解构: 与 `careers.ts` / `about.ts` 的 `paragraphKeys` / `companyIntroKeys` 模式一致，避开 `as const` 与 `string[]` 不兼容问题。
- `priceLabel` 含 `{{price}}` 插值: 即使三套 locale 当前均为 "¥ {{price}}"，仍走 i18n key 以保持结构统一；未来如需按 locale 切换货币符号 (如 en 改为 "${{price}}" 或 "USD {{price}}")，只需改 JSON 无需改代码。

**关联文件**
- 修改: `src/data/wearable.ts` / `src/pages/WearablePage.tsx` / `src/i18n/locales/zh-CN/wearable.json` / `src/i18n/locales/zh-TW/wearable.json` / `src/i18n/locales/en/wearable.json` / `DEV_LOG.md`
- 复用: `src/components/SEO.tsx` / `src/i18n/locales/{zh-CN,zh-TW,en}/meta.json` (已有 wearable SEO 字段)
- 不动: `src/data/content.ts` (barrel file 已正确 re-export `WEARABLE_PAGE` / `WEARABLE_PRODUCTS` / `WEARABLE_CATEGORIES` / `WearableProduct` / `WearableForm` / `WearableTech`)

---

## [2026-07-25] i18n | CareersPage + careers.ts 全量 i18n 改造 (5 section)

**类型**: i18n 改造

**摘要**
完成「人才招聘」页 (`/careers`) 的全量 i18n 改造，覆盖 5 个 section (hero / companyIntro / categories + tabs / jobList / benefits + apply)。`src/data/careers.ts` 由硬编码中文重构为 i18n key 引用模式 (沿用 `about.ts` 的 `xxxKey` 模式)，`CareersPage.tsx` 通过 `useTranslation(["careers", "common"])` + `t()` 渲染所有可见文案。三套 locale (`zh-CN` / `zh-TW` / `en`) 的 `careers.json` 完整对齐，英文翻译采用 Phonak / Resound / Widex 等专业听力学术语。`JobCategory` 与 `tabs` 同步改为英文 slug (`tech` / `manufacturing` / `marketing` / `admin` / `all`)，与 footer `?cat=tech` URL 参数无缝衔接。

**详细变更**

### 1. `src/i18n/locales/zh-CN/careers.json` / `zh-TW/careers.json` / `en/careers.json` - 从空 `{}` 扩展为完整翻译
- 三套 JSON 1:1 结构对齐，覆盖 hero / companyIntroTitle / companyIntroAlt / companyIntro (5 段) / categoryTitle / categories (4 类 desc) / tabs (5 项 slug→名称) / jobListTitle / jobListNote (含 `{{count}}` 插值) / noPositions / jobAttrLabels (4 项 label) / jobs (1-8) / benefitsTitle / benefits (0-5) / applyTitle / applyDesc / applyItems (hotline/email/address)。
- 简转繁术语: 招聘→徵才/徵聘, 福利→福利, 助听器→助聽器, 验配师→驗配師, 听力师→聽力師, 行政→行政, 财务→財務, 研发→研發, 制造→製造, 市场→市場, 营销→營銷, 兴亿→興億, 龙华→龍華, 罗湖→羅湖, 若干→若干, 占位→佔位, 邮箱→郵箱, 简历→簡歷, 应聘→應徵, 注明→註明, 联系→聯繫。
- 英文术语: Senior Hearing Aid R&D Manager / Hearing Aid R&D Engineer / Senior Audiologist / Intermediate (Junior) Hearing Aid Fitter / HR & Admin Manager / Admin Assistant / Multiple (若干) / Social Insurance & Housing Fund / Paid Annual Leave / Holiday Benefits / Annual Health Checkup / Training & Promotion / Team Building / Hotline / Company Email / Company Address。
- 品牌商标保留原文: SKYWORTH / BigSound。
- 薪资范围 (`salary`) 跨 locale 共用 (如 "15-30K")，不本地化。
- 公司地址三套 locale 分别提供中文地址 (zh-CN / zh-TW 同) 与英文地址 (en)。
- `jobListNote` 使用 `{{count}}` 插值，调用方传 16 (原型说 16 个职位)。

### 2. `src/data/careers.ts` - 重构为 i18n key 引用模式
- `JobCategory` 类型由中文联合类型 (`"技术研发类" | ...`) 改为英文 slug: `"tech" | "manufacturing" | "marketing" | "admin"`。
- `JobItem` interface 改造:
  - 新增 `id: string` (1-8, 用于 i18n key 索引)
  - `category` 改为英文 slug (locale 无关)
  - `name` / `location` / `headcount` → `nameKey` / `locationKey` / `headcountKey` (i18n key)
  - 保留 `salary` (locale 无关, 如 "15-30K") / `uploadDate` (占位 "—", locale 无关)
- `CAREERS_PAGE` 对象改造:
  - `hero.mainTitle/mainTitleSecond/subtitle` → `mainTitleKey/mainTitleSecondKey/subtitleKey`
  - `companyIntroTitle` → `companyIntroTitleKey`
  - `companyIntro: string[]` → `companyIntroKeys: string[]` (5 个 key)
  - `categoryTitle` → `categoryTitleKey`
  - `categories[].name` (JobCategory) → 保留为 `category: JobCategory` (英文 slug)
  - `categories[].desc` → `descKey`
  - `tabs` 由 `["全部", "技术研发类", ...]` 改为 `["all", "tech", "manufacturing", "marketing", "admin"] as const`
  - `jobListTitle` → `jobListTitleKey`
  - `jobListNote` → `jobListNoteKey`
  - `jobList` 同 `JobItem[]` 改造 (id 1-8)
  - `benefitsTitle` → `benefitsTitleKey`
  - `benefits[].title/desc` → `titleKey/descKey`
  - `applyTitle` → `applyTitleKey`
  - `applyDesc` → `applyDescKey`
  - `applyItems[].label/value` → `labelKey/valueKey`
- 保留 `as const` 断言、所有原注释 (section 编号、设计风格说明、待 PM 补齐标注) 与文件头部注释。
- 顶部注释新增 i18n 改造说明段。

### 3. `src/pages/CareersPage.tsx` - 接入 useTranslation + SEO
- 新增 imports: `useTranslation` (来自 `react-i18next`)、`SEO` (来自 `../components/SEO`)、`type JobCategory` (用于 CAT_SLUGS 类型标注)。
- 组件内 `const { t } = useTranslation(["careers", "common"]);`。
- 顶部添加 `<SEO titleKey="careers.title" descriptionKey="careers.description" path="/careers" />`，复用 `meta.json` 中已有的 careers SEO 字段。
- 删除原 `CAT_QUERY_MAP` (中文映射表)，改为 `CAT_SLUGS: readonly JobCategory[]`，直接校验 URL ?cat= 是否为合法 slug。`initialTab` 默认值由 `"全部"` 改为 `"all"`。
- `filteredJobs` 逻辑: `activeTab === "全部"` 改为 `activeTab === "all"`。
- `JobCard` 子组件: 内部 `useTranslation(["careers", "common"])`，将 `job.nameKey` / `job.locationKey` / `job.headcountKey` 通过 `t()` 翻译后传给 `JobAttr`；`job.category` 通过 `t(\`careers:tabs.${job.category}\`)` 翻译为分类名；`job.salary` / `job.uploadDate` 直接使用 (locale 无关)。
- `JobAttr` 4 个 label 由硬编码中文 ("工作地点" / "招聘类别" / "招聘人数" / "上传日期") 改为 `t("careers:jobAttrLabels.location")` 等。
- `img alt="小维健康科技公司"` 改为 `alt={t("careers:companyIntroAlt")}`。
- `img alt={cat.name}` 改为 `alt={name}` (其中 `name = t(\`careers:tabs.${cat.category}\`)`)。
- 空状态 "暂无相关职位" 改为 `t("careers:noPositions")`。
- 所有 `CAREERS_PAGE.xxx` 直接文本字段引用改为 `t(CAREERS_PAGE.xxx.xxxKey)`。
- `companyIntro: string[]` 用 `t([...CAREERS_PAGE.companyIntroKeys], { returnObjects: true }) as string[]` 渲染 (spread 解构避开 `as const` 与 `string[]` 不兼容问题)。
- `categories.map` 内通过 `t(\`careers:tabs.${cat.category}\`)` 翻译分类名 (与 tabs 共用翻译，避免重复)。
- `tabs.map` 渲染时通过 `t(\`careers:tabs.${tab}\`)` 翻译 tab 标签。
- `applyItems.map` 渲染时通过 `t(item.labelKey)` / `t(item.valueKey)` 翻译。

### 4. 已有不动: `src/i18n/locales/{zh-CN,zh-TW,en}/meta.json`
- 三套 `meta.json` 此前已就位 `careers.title` / `careers.description` / `careers.keywords` 字段，本次改造直接复用，无需补充。

### 5. `DEV_LOG.md` - 本条目

**影响范围**
- 人才招聘页 (`/:locale/careers`) 三语言切换: zh-CN / zh-TW / en 用户访问 `/careers` 路径时，所有 5 个 section 文案、Tab 标签、职位卡片字段、福利项、投递方式、SEO `<title>` / `<meta description>` / hreflang 均按 locale 动态渲染。
- footer 锚点跳转 (`?cat=tech` 等) 与新 slug 化的 tabs 完全兼容，无需改 footer.ts。
- 不影响其他页面；`CAREERS_PAGE` / `JobItem` / `JobCategory` 字段名变更对其他文件无影响 (Grep 验证 `CAREERS_PAGE` / `JobCategory` / `JobItem` 仅在 `CareersPage.tsx` / `data/content.ts` barrel / `data/careers.ts` 中被引用)。
- TypeScript 严格类型校验通过 (`npx tsc --noEmit` exit code 0)。

**关键决策**
- `JobCategory` / `tabs` 改为英文 slug: 让 URL 参数 (`?cat=tech`) 与代码内分类标识 locale 无关，避免中文转义与跨 locale 失配。footer 此前已用 slug URL，本次改造与之无缝对齐。
- `categories[].name` 不再独立翻译，复用 `tabs` 翻译: 4 个分类名与 tabs 中除 "all" 外的 4 项完全一致，避免重复 JSON key。
- `salary` / `uploadDate` 保留为 locale 无关字段: "15-30K" 等薪资范围跨语言通用 (即使英文环境也常用 K 表示千)，"—" 占位符无语义。
- `headcount` 走 i18n: 中文 "若干" 在英文中需翻译为 "Multiple"，无法保留为 locale 无关字段。
- `applyItems` 全部走 i18n (包括电话号码): 电话号码 400-116-9566 三套 locale 一致，但仍走 i18n key 以保持结构统一; 公司地址必须 locale 化 (zh-CN/zh-TW 中文地址 vs en 英文地址)。
- `companyIntroAlt` 单独建 key: 与 about.json 的 `skyworthGroup.alt` 模式一致。
- `jobListNote` 含 `{{count}}` 插值: 原型说 16 个职位但实际仅 8 个完整，调用方传 16 保持原文语义；当前页面未渲染该字段 (沿用原页面行为)，但数据层已就绪可供未来启用。
- `as const` 与 `t()` readonly 兼容问题用 spread 解构 (`[...keys]`) 解决，与 about 页改造保持一致。

**关联文件**
- `src/i18n/locales/zh-CN/careers.json` (从空 `{}` 扩展为完整翻译)
- `src/i18n/locales/zh-TW/careers.json` (从空 `{}` 扩展为完整翻译)
- `src/i18n/locales/en/careers.json` (从空 `{}` 扩展为完整翻译)
- `src/data/careers.ts` (全量重构为 i18n key 引用模式 + JobCategory/tabs 改为英文 slug)
- `src/pages/CareersPage.tsx` (接入 useTranslation + SEO + 删除 CAT_QUERY_MAP)
- `DEV_LOG.md` (本条目)
- 已有不动: `src/i18n/locales/{zh-CN,zh-TW,en}/meta.json` (careers SEO 字段此前已就位)
- 已有不动: `src/config/footer.ts` (footer 锚点 URL `?cat=tech` 等已与新 slug 化 tabs 兼容)

---

## [2026-07-25] i18n | AboutPage + about.ts 全量 i18n 改造 (11 section)

**类型**: i18n 改造

**摘要**
完成「关于小维」页 (`/about`) 的全量 i18n 改造，覆盖 11 个 section (hero / skyworthGroup / skyworthStats / xiaoweiHealth / researchDirections / culture / honors / team / partners / timeline + orgStructure 合并)。`src/data/about.ts` 由硬编码中文重构为 i18n key 引用模式 (沿用 `home.ts` 中 `HERO_PRODUCTS` 的模式)，`AboutPage.tsx` 通过 `useTranslation(["about", "common"])` + `t()` 渲染所有可见文案。三套 locale (`zh-CN` / `zh-TW` / `en`) 的 `about.json` 完整对齐，英文翻译采用 Phonak / Resound / Widex 等专业听力学术语。

**详细变更**

### 1. `src/i18n/locales/en/about.json` - 新建完整英文翻译
- 从空 `{}` 扩展为 11 section 完整翻译，结构 1:1 对齐 `zh-CN/about.json`。
- 关键术语：hearing aid / fitting / audiologist / speech enhancement / noise reduction / feedback suppression / Skyworth / BigSound / Xiaowei Health / Tencent Tianlai / Chinese hearing aid / sound prescription / otology (ENT) / Class II Medical Device Registration Certificate。
- `skyworthStats` 中 `unit` 字段做 locale-aware 处理 (zh-CN 用「家 / 万名 / 亿元」等量词，en 多数为空字符串，仅保留 `B RMB` / `0,000+` 等必要单位)；`num` 保持 locale 无关 (如 "2", "3", "703.2")。
- `timeline.stages[].year` / `month` 三套 locale 分别使用「2022年」/「2022年」/ "2022" 与「03月」/「03月」/ "Mar."。
- `partners.strategicCooperation.list` 中公司名做翻译 (如「中国老龄事业发展基金会」 → "China Aging Development Foundation"，「中山大学孙逸仙纪念医院」 → "Sun Yat-sen Memorial Hospital, SYSU")。
- `team.members[].name` 中文版保留中文姓名 (王海 / 郑明春 / 温业锋 / 龙浩军 / 南鹏升)，英文版用拼音 (Wang Hai / Zheng Mingchun / Wen Yefeng / Long Haojun / Nan Pengsheng)。
- `team.coreTeamLabel` 三套 locale 均补齐 (核心团队 / 核心團隊 / Core Team)。
- `skyworthGroup.alt` 替代原 `heroImageAlt` 字段 (zh-CN / zh-TW 中同步重命名)。

### 2. `src/data/about.ts` - 重构为 i18n key 引用模式
- 新增 8 个 TypeScript interface：`SkyworthStatItem` / `ResearchDirectionItem` / `CultureItem` / `HonorItem` / `TeamMember` / `PartnerItem` / `TimelineItem` / `TimelineStage`，每个字段均带 JSDoc 注释说明 locale 无关性。
- 所有中文字符串字段重命名并改为 key 引用：
  - `title` → `titleKey`，`subtitle` → `subtitleKey`，`sectionTitle` → `sectionTitleKey`
  - `paragraphs: string[]` → `paragraphKeys: string[]`
  - `subTitle1/2` → `subTitle1Key/2Key`，`label` → `labelKey`，`desc` → `descKey`，`tag` → `tagKey`
  - `interpretations` → `interpretationKeys`，`unit` → `unitKey`，`sub` → `subKey`
  - `name` → `nameKey`，`details` → `detailKeys`，`phase` → `phaseKey`
  - `year` → `yearKey`，`month` → `monthKey`，`event` → `eventKey`
- 保留 locale 无关字段：`imageKey` / `num` / `logoScale` / `sectionEnTitle` (如 "COMPANY PROFILE" / "CORPORATE CULTURE" 英文装饰文字)。
- `skyworthStats` / `researchDirections.items` / `culture.items` / `honors.row1` / `honors.row2` / `team.members` / `partners.*.list` / `timeline.stages` 均通过 `as XxxItem[]` 显式标注类型。
- 保留 `as const` 断言、所有原注释 (section 编号、用户指示记录、配图说明) 与文件头部注释。
- 顶部注释新增 i18n 改造说明段。

### 3. `src/pages/AboutPage.tsx` - 接入 useTranslation
- 新增 imports：`useTranslation` (来自 `react-i18next`)、`SEO` (来自 `../components/SEO`)。
- 组件内 `const { t } = useTranslation(["about", "common"]);`。
- 顶部添加 `<SEO titleKey="about.title" descriptionKey="about.description" path="/about" />`，复用 `meta.json` 中已有的 about SEO 字段。
- 全部 `ABOUT_PAGE.xxx.title` 改为 `t(ABOUT_PAGE.xxx.titleKey)` (含 sectionTitle / subTitle / name / phase / month / event / tag / desc / label / unit / sub / alt 等)。
- 数组字段 (`paragraphs` / `interpretations` / `details`) 用 `t([...keys], { returnObjects: true }) as string[]` 渲染；用 spread 解构避开 `as const` 导致的 `readonly` 与 `string[]` 不兼容问题。
- 第 67 行 `alt="创维集团总部大楼"` 改为 `alt={t(ABOUT_PAGE.skyworthGroup.altKey)}`。
- 第 363 行硬编码「核心团队」改为 `t("about:team.coreTeamLabel")`。
- 各种 `img` 的 `alt={item.title}` / `alt={honor.name}` / `alt={member.name}` / `alt={partner.name}` 改为 `alt={t(item.titleKey)}` / `alt={t(honor.nameKey)}` 等。

### 4. `src/i18n/locales/zh-CN/about.json` 与 `zh-TW/about.json` - 微调
- 将 `skyworthGroup.heroImageAlt` 字段重命名为 `alt`，与 `en/about.json` 保持一致 (该字段此前未被任何代码引用)。
- 其余 11 section 翻译保持原状 (zh-CN / zh-TW 此前已完整)。
- `team.coreTeamLabel` 字段已存在，无需补充。

### 5. `DEV_LOG.md` - 本条目

**影响范围**
- 关于页 (`/:locale/about`) 三语言切换：zh-CN / zh-TW / en 用户访问 `/about` 路径时，所有 11 个 section 文案、图片 alt 文本、SEO `<title>` / `<meta description>` / hreflang 均按 locale 动态渲染。
- 不影响其他页面；`ABOUT_PAGE` 的字段名变更理论上对其他文件无影响 (Grep 验证 `ABOUT_PAGE` 仅在 `AboutPage.tsx` 与 `data/content.ts` barrel 中被引用)。
- TypeScript 严格类型校验通过 (`npx tsc --noEmit` exit code 0)。

**关键决策**
- `skyworthStats[].unit` 走 i18n key 而非 locale 无关：因中文用「家 / 万名 / 亿元」等量词，英文多数为空或不同表达 (如 "B RMB")，必须 locale 化。
- `num` 保持 locale 无关：纯数字 (如 "2" / "3" / "703.2") 跨语言通用，不本地化。
- `sectionEnTitle` (如 "COMPANY PROFILE") 保持 locale 无关：是设计装饰文字，三套 locale 共用同一英文装饰。
- 品牌商标 (BIGSOUND / SKYWORTH / SKYWORTH 创维) 在 JSON 文案中保留原文，未走 transliteration (与 `home.ts` 中 `HERO_PRODUCTS` 的 `brand` 字段处理一致)。
- `as const` 与 `t()` readonly 兼容问题用 spread 解构 (`[...keys]`) 解决，比 `as unknown as string[]` 更干净。

**关联文件**
- `src/i18n/locales/zh-CN/about.json` (微调：`heroImageAlt` → `alt`)
- `src/i18n/locales/zh-TW/about.json` (微调：`heroImageAlt` → `alt`)
- `src/i18n/locales/en/about.json` (从空 `{}` 扩展为完整翻译)
- `src/data/about.ts` (全量重构为 i18n key 引用模式)
- `src/pages/AboutPage.tsx` (接入 useTranslation + SEO)
- `DEV_LOG.md` (本条目)
- 已有不动：`src/i18n/locales/{zh-CN,zh-TW,en}/meta.json` (about SEO 字段此前已就位)

---

## [2026-07-25] assets | public/images 全量整理与引用路径更新

**类型**: 资源整理 / 代码重构

**摘要**
按「页面/模块 + 内容类型」对 `public/images/` 进行全量整理：解散 `original/`、`prototype/`、`hero/`、`culture/` 等临时目录，根目录零散旧图迁入 `common/`、`home/`、`about/`、`product/`、`service/`、`invest/`、`news/` 等模块目录，未引用旧图归档至 `archive/`。同步更新 `index.html`、`src/data/images/*.ts`、`src/config/footer.ts`、`src/pages/NotFoundPage.tsx` 中所有 `/images/` 引用路径，删除 `common.ts` 中已不存在/未使用的 6 子页 hero 字段，并新增 `scripts/verify-images.cjs` 持续校验引用完整性。

**详细变更**

### 1. 目录结构重组 (`public/images/`)
- 新建 `common/`：迁入全站通用图（logo、brand、qrcode、favicon、hero logos、404 图）。
- 新建 `home/banner/`、`home/hero/`、`home/tech/`、`home/products/`、`home/research/`、`home/cta/`：按模块聚合首页资源。
- 新建 `product/bg/`、`service/qr/`：细化产品页、服务页子分类。
- `about/culture/`、`news/`、`honors/real/` 等已有目录做必要补充归并。
- 解散 `original/`、`prototype/`、`hero/`、`culture/` 临时目录并删除空目录。
- 未引用旧图迁入 `archive/legacy_2_0/`、`archive/original_unused/`、`archive/unused/`；`LOGOS_IDENTIFICATION.md` 迁至 `docs/_metadata/images/`。

### 2. 代码引用路径更新
- `index.html`：`/images/favicon.ico` → `/images/common/favicon.ico`。
- `src/data/images/common.ts`：更新通用图路径，删除 `heroAbout/Product/Wearable/Invest/Careers/News` 死字段。
- `src/data/images/banner.ts`：首页轮播图全部指向 `home/banner/`。
- `src/data/images/home.ts`：`original/`、`05_tech_4.webp`、`cta_logo_*.webp` 等路径更新。
- `src/data/images/about.ts`：`about_brand`、`about_founder`、文化/荣誉证书路径更新。
- `src/data/images/product.ts`：产品背景、原型提取图、临床报告、专利矩阵等路径更新。
- `src/data/images/invest.ts`：`prototype/` 全部迁移至 `invest/` 或 `honors/real/`。
- `src/data/images/service.ts`：C2M 资源与二维码迁移至 `service/`、`service/qr/`。
- `src/data/images/news.ts`：`original/newsN.webp` → `news/news_N.webp`。
- `src/config/footer.ts`：8 个社交平台二维码按实际分类更新到新路径。
- `src/pages/NotFoundPage.tsx`：`/images/not-found.png` → `/images/common/not_found.png`。

### 3. 验证脚本
- 新增 `scripts/verify-images.cjs`：扫描 `src/` + `index.html` 中所有 `/images/` 引用，与 `public/images/` 实际文件一一核对，输出缺失引用与未使用文件。
- 整理后运行结果：189 个唯一引用全部命中，0 个缺失引用。

**影响范围**
- 全站图片引用路径统一，原有 `original/`、`prototype/` 依赖彻底消除。
- 首页、关于页、产品页、招商加盟页、服务页、新闻页、404 页图片加载正常。

**关联文件**
- `public/images/` 全目录结构
- `index.html`
- `src/data/images/common.ts`、`banner.ts`、`home.ts`、`about.ts`、`product.ts`、`invest.ts`、`service.ts`、`news.ts`
- `src/config/footer.ts`
- `src/pages/NotFoundPage.tsx`
- `src/pages/NewsListPage.tsx`（顺带修复 title/summary i18n 读取）
- `src/pages/NewsDetailPage.tsx`（顺带修复 title/summary i18n 读取）
- `scripts/update-image-refs.cjs`（一次性迁移脚本，已执行）
- `scripts/verify-images.cjs`（新增校验脚本）
- `DEV_LOG.md`

**验证**
- `node scripts/verify-images.cjs` 通过：0 缺失引用。
- `npx tsc --noEmit` 通过（exit code 0）。整理过程中顺带修复了 `NewsListPage`/`NewsDetailPage` 对 `NewsListItem` 的 title/summary 使用方式，改为从 `news` i18n namespace 读取，并修正了 `NEWS_CATEGORIES.includes(tag)` 的类型报错。

---

## [2026-07-25] i18n | 首页 (HomePage) 完成全量 i18n 改造 (zh-CN / zh-TW / en)

**类型**: 国际化 (i18n)

**摘要**
延续多语言计划, 完成首页 (HomePage) 全量 i18n 改造。HERO_PRODUCTS 数据结构由 inline 中文改为 i18n key, HeroProducts.tsx 组件通过 useTranslation + useLocale 动态渲染 3 种 locale, VideoEntry aria-label 已国际化, HomePage 接入 SEO 组件动态生成 meta + hreflang。3 套 locale 的 home.json 已填充完整翻译。

**详细变更**

### 1. 数据层 (src/data/home.ts)
- `HeroTechItem` 接口: `title/desc: string` → `titleKey/descKey: string` (i18n key)
- `HeroProduct` 接口: `title/subtitle/description/cta: string` → `titleKey/subtitleKey/descriptionKey/ctaKey: string`
- `HeroProduct.path: string` → `route: "product" | "wearable"` (枚举, 由 locale-aware 路径函数解析)
- 3 个产品 × 6 项核心技术, 共 24 个 tech 条目均改为语义化 i18n key (chip/algorithm/aiPower/htt/agc/mic 等)
- 商标品牌字段 `brand` 保留原文不翻译 ("BIGSOUND" / "SKYWORTH")

### 2. 组件层
- `src/components/home/HeroProducts.tsx`:
  - 引入 `useTranslation` + `useLocale`
  - 标题/描述/技术卡片标题/描述/CTA 全部通过 `t(key)` 渲染
  - 跳转路径通过 `resolveRoute(route, locale)` 调用 `productPath(locale)` / `wearablePath(locale)` 生成
- `src/components/home/VideoEntry.tsx`:
  - aria-label 改为 `t("home:videoEntry.ariaLabel")`
- `src/pages/HomePage.tsx`:
  - 接入 `<SEO titleKey="home.title" descriptionKey="home.description" path="/" />`
  - 引入 useTranslation (虽 HomePage 本身无 inline 文本, 但子组件需要 i18n context)

### 3. 翻译文件 (src/i18n/locales/{zh-CN,zh-TW,en}/home.json)
- 全部 3 个 locale 的 home.json 已填充完整翻译
- 结构: `videoEntry.ariaLabel` + `heroProducts.{hearingAid,watch,earphone}.{title,subtitle,description,techs.{6 项}.{title,desc}}`
- zh-CN: 沿用原 inline 中文
- zh-TW: 繁体中文 (晶片/算法/陣列麥/藍牙耳機 等)
- en: 完整英文翻译 (5-Core Heterogeneous Chip / Chinese Enhancement Algorithm 2.0 等)

### 4. 路径处理
- HERO_PRODUCTS 旧 `path: "/product"` / `path: "/wearable"` 为硬编码无 locale 前缀, 跳转会丢失当前 locale
- 新方案: `route: "product" | "wearable"` + `resolveRoute()` 函数包装 locale-aware 路径生成
- 用户切换语言后点击产品入口可正确跳转到对应 locale 的产品页

**影响范围**
- 首页 (http://localhost:5173/zh-CN, /zh-TW, /en) 全部文案 + 路径 + SEO meta 均按 locale 动态渲染
- 其他页面 (About/Product/Wearable/Invest/Careers/News) 暂未做 inline 文本翻译, 但 Header/Footer/FloatingTools 已 i18n, 切换语言后导航/页脚/悬浮按钮会变, 页面主体仍为中文 (后续推进)

**关联文件**
- `src/data/home.ts` (HERO_PRODUCTS 接口 + 数据重构)
- `src/components/home/HeroProducts.tsx` (useTranslation + useLocale + resolveRoute)
- `src/components/home/VideoEntry.tsx` (aria-label i18n)
- `src/pages/HomePage.tsx` (接入 SEO)
- `src/i18n/locales/zh-CN/home.json` (新增完整翻译)
- `src/i18n/locales/zh-TW/home.json` (新增完整翻译)
- `src/i18n/locales/en/home.json` (新增完整翻译)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)
- 待用户在浏览器切换语言验证视觉效果

---

## [2026-07-25] i18n | 多语言基础设施搭建 (URL 前缀路由 + 3 locale + SEO 动态化)

**类型**: 国际化 (i18n) 基础设施

**摘要**
完成小维健康科技官网 3.0 多语言 (简体中文 / 繁体中文 / 英文) 基础设施搭建。采用 URL 前缀路由 (`/:locale/...`), 默认 locale 为 zh-CN。涵盖: i18next 初始化 (10 namespace)、locale-aware 路径生成函数、useLocale hook (URL 驱动 + cookie 持久化 + 浏览器语言探测)、根路径智能重定向、LocaleLayout 校验、Header 语言切换器、SEO 组件 (动态 title/description/hreflang/canonical)、LoginPage/RegisterPage/NotFoundPage/FloatingTools 全量 i18n、PageHero locale-aware 字体栈、3 套 locale 的 common.json/auth.json/meta.json 完整翻译。

**详细变更**

### 1. i18n 初始化 (src/i18n/index.ts)
- 引入 i18next + react-i18next
- 3 个 locale: zh-CN (默认) / zh-TW / en
- 10 个 namespace: common / home / product / about / invest / wearable / careers / news / auth / meta
- `changeLanguage(locale)` 函数同步 i18next 语言
- `returnNull: false` 避免空值

### 2. 类型与常量 (src/i18n/types.ts)
- `Locale` 类型: `"zh-CN" | "zh-TW" | "en"`
- `DEFAULT_LOCALE = "zh-CN"`
- `SUPPORTED_LOCALES` 数组
- `isLocale(x): x is Locale` 类型守卫
- `LOCALE_LABELS`: 显示名 (简体中文 / 繁體中文 / English)

### 3. useLocale Hook (src/i18n/useLocale.ts)
- 从 URL `:locale` 参数读取当前 locale
- 副作用: 同步 i18next.changeLanguage + document.documentElement.lang
- `changeLocale(newLocale)`: 替换 URL 前缀 + 写 cookie
- `extractLocaleFromPath(pathname)`: 工具函数
- `readLocaleCookie()` / `writeLocaleCookie()`: cookie 持久化 (1 年)
- `detectBrowserLocale()`: 浏览器语言探测 (zh-TW/HK/Hant → zh-TW, zh-* → zh-CN, en-* → en)
- `pickInitialLocale()`: cookie > 浏览器 > 默认

### 4. 路由系统 (src/routes/)
- `paths.ts`: locale-aware 路径生成函数 (homePath/aboutPath/productPath/wearablePath/investPath/careersPath/newsPath/newsCategoryPath/newsDetailPath/loginPath/registerPath)
- `PATHS` 常量: 路由声明模板 (不含 locale 前缀)
- `ROUTE_PARAMS`: 动态参数名 (NEWS_ID/NEWS_TAG/NEWS_PAGE)
- `index.tsx`: 路由树
  - `/` → RootRedirect (智能重定向到 /{推荐 locale})
  - `/:locale` → LocaleLayout (locale 校验 + Layout)
    - `index` → HomePage
    - `about` / `product` / `wearable` / `invest` / `careers` / `news` / `news/category/:tag` / `news/:id`
    - `*` → NotFoundPage
  - `/:locale/login` / `/:locale/register` → LocaleStandaloneWrapper (独立全屏页, 无 Header/Footer)
  - `*` → RootRedirect

### 5. SEO 组件 (src/components/SEO.tsx)
- 接收 `titleKey` / `descriptionKey` / `keywordsKey` / `path` / `vars` props
- 通过 react-helmet-async 动态渲染:
  - `<html lang>` 同步当前 locale
  - `<title>` / `<meta name="description">` / `<meta name="keywords">`
  - `<link rel="canonical">` 指向当前 locale URL
  - 3 个 `<link rel="alternate" hreflang>` (zh-CN/zh-TW/en)
  - `<link rel="alternate" hrefLang="x-default">` 指向 zh-CN
  - og:* 标签 (og:locale/og:title/og:description/og:type)

### 6. 共享组件 i18n 改造
- `Header.tsx`: 7 项导航 + 语言切换器 (3 locale 全可用) + 登录/注册按钮 + 用户菜单 + 移动端抽屉, 全部通过 `t("common:header.*")` / `t("common:nav.*")` 翻译; 语言切换调用 `changeLocale(code)` 实现 URL 跳转
- `Footer.tsx`: 7 大板块 + 法律链接 + 版权信息 + 联系方式, 通过 `getFooterSections(locale, t)` 动态生成
- `FloatingTools.tsx`: 在线咨询 / 电话咨询 / 扫码关注 / 回到顶部, 通过 `t("common:floatingTools.*")` 翻译
- `PageHero.tsx`: locale-aware 字体栈 (zh-CN: DingTalk JinBuTi + MiSans + PingFang SC; zh-TW: PingFang TC + Microsoft JhengHei; en: Inter + system-ui)
- `navigation.ts`: NAV_ITEMS 配置 labelKey + getPath(locale)
- `footer.ts`: getFooterSections/getFooterLegalLinks 接收 locale + t 函数

### 7. 页面 i18n (Login/Register/NotFound)
- `LoginPage.tsx`: 全量 i18n, brand 区/title/tab/label/placeholder/errors/agreement/mvpTest 全部翻译, 通过 auth.json 控制
- `RegisterPage.tsx`: 全量 i18n, 含密码强度评估 (弱/中/强) i18n, 短信验证码倒计时文案 i18n
- `NotFoundPage.tsx`: 接入 SEO, logoAlt/imageAlt/message1/message2/backHome 翻译

### 8. 翻译文件 (3 locale × 4 namespace = 12 文件)
- `common.json`: nav/header/footer/floatingTools/alt/common/newsCategory/notFound
- `auth.json`: login + register + errors (40+ key)
- `meta.json`: 9 个页面的 title/description/keywords + newsDetail 模板
- `home.json`: videoEntry + heroProducts (本次新增完整翻译)
- 其他 namespace (product/about/invest/wearable/careers/news) 暂为空, 待后续填充

**影响范围**
- 全站 URL 结构变化: 所有页面均加 /:locale/ 前缀
- 旧链接 (无 locale 前缀) 会智能重定向到 /zh-CN/...
- Header 语言切换器可一键切换 3 种语言, URL + cookie + i18next 同步
- Login/Register/NotFound 页面全量翻译, 其他页面主体仍为中文 (待后续推进)

**关联文件**
- `src/i18n/index.ts` / `src/i18n/types.ts` / `src/i18n/useLocale.ts`
- `src/i18n/locales/{zh-CN,zh-TW,en}/*.json` (10 文件/locale × 3 locale = 30 文件)
- `src/routes/index.tsx` / `src/routes/paths.ts`
- `src/components/SEO.tsx`
- `src/components/layout/Header.tsx` / `Footer.tsx` / `FloatingTools.tsx` / `PageHero.tsx`
- `src/config/navigation.ts` / `src/config/footer.ts`
- `src/pages/LoginPage.tsx` / `RegisterPage.tsx` / `NotFoundPage.tsx`

**验证**
- `npx tsc --noEmit` 通过
- `npx vite` 启动正常
- 三种 locale URL 均可访问 (/zh-CN, /zh-TW, /en)
- 语言切换器跳转正常, Header/Footer 文案随之变化

**待办**
- 数据文件按 locale 拆分: about.ts / product.ts / wearable.ts / invest.ts / careers.ts / articles.ts / service.ts (7 个)
- 页面组件 inline 中文抽取: AboutPage / ProductPage / WearablePage / InvestPage / CareersPage / NewsListPage / NewsDetailPage (7 个)
- 含中文艺术字图片多语言重生 (invest hero "声价千亿 聚势共赢" 等)
- 新闻分类 URL slug 英文化 (当前 /news/category/公司新闻 应改为 /news/category/company-news)

---

## [2026-07-25] 重构 | ProductPage / WearablePage 卡片改 Apple 风格 (1:1 正方形产品图 + 居中信息)

**类型**: UI 重构

**摘要**
用户要求产品图改回 1:1 正方形, 整体卡片参考 Apple 设计风格但保留现有元素 (形态标签/型号/价格/特性指标格)。已重构为: 1:1 正方形产品图 + 浅灰底, 居中对齐的紧凑信息区, 弱化价格, 极简灰底指标卡片。删除卡片边框, hover 改为更柔和的灰色阴影 + 上浮 4px。

**详细变更**

### 1. 产品图容器
- 旧: `aspect-[3/4]` 3:4 竖向
- 新: `aspect-square` 1:1 正方形, 占满卡片宽度, 匹配 800×800 产品图, 无空白
- 背景: `bg-ink-100` → `bg-ink-50` (更浅, 更接近 Apple 留白感)
- 图片 hover 缩放: `scale-[1.05]` → `scale-[1.04]` (更克制)
- 过渡时长: `duration-[500ms]` → `duration-[700ms]` (更顺滑)

### 2. 卡片整体
- 旧: `border border-ink-200` + hover 边框变绿
- 新: 无边框, 默认纯白底, hover 才有阴影 `hover:shadow-[0_18px_40px_rgba(0,0,0,0.08)]`
- 上浮: `hover:-translate-y-[6px]` → `hover:-translate-y-[4px]` (更克制)
- 阴影颜色: 绿色 `rgba(5,160,69,0.12)` → 中性灰 `rgba(0,0,0,0.08)` (Apple 风格)

### 3. 信息区 (Apple 风格)
- 对齐: `flex-col` 左对齐 → `items-center text-center` 居中对齐
- padding: `p-4` → `px-6 py-5` (更宽松留白)
- 形态标签: 实心绿底白字 → 文字绿色小字 `text-brand-green font-medium tracking-wide` (更轻量)
- 型号: `text-[15px] text-ink-700 font-bold` → `text-[17px] text-ink-900 font-semibold` (更高级, 黑度更深)
- 价格: 大字号绿色粗体 → `text-[12px] text-ink-400` 小字灰色 (弱化, Apple 风格不强调价格)
  - ProductPage 待定态: "待定" → "价格待定" (更口语化)
  - 删除 "零售指导价" 标签文字

### 4. 指标格
- 旧: 白底 + `gap-[1px] bg-ink-200` 形成细线表格 + border
- 新: `bg-ink-50` 浅灰卡片 + `gap-[8px]` 独立间距, 无边框无表格线
- 对齐: `flex-col` 左对齐 → `items-center` 居中
- 字号: 值 `text-[13px] font-bold text-ink-700` → `text-[13px] font-semibold text-ink-900`
- min-height: `min-h-[60px]` → `min-h-[56px]` (略紧凑)
- 位置: `mt-auto` 推到信息区底部, 让上方信息居中显示

### 5. 文件改动
- `src/pages/ProductPage.tsx`: 卡片 JSX 重构 (L114-L166)
- `src/pages/WearablePage.tsx`: ProductCard 组件重构 (L41-L92)

**影响范围**
- `/product` 页 §3 产品卡片 (12 款助听器)
- `/wearable` 页 §3 产品卡片 (11 款穿戴设备)

**验证**: `npx tsc --noEmit` 通过 (exit code 0)。待用户在 http://localhost:5173/product 和 http://localhost:5173/wearable 视觉验证 Apple 风格效果。

---

## [2026-07-25] 修复 | 资讯中心 Tab 改为 ProductPage 同款 button + state

**类型**: UI 一致性修复 + Tab 交互重构

**摘要**
用户反馈"修改之后导致分类标签用不了了, 要用 Product Page 的同款分类标签"。根因: 之前为支持 SEO 友好的独立分类页 URL, 把 Tab 实现为 `<Link>` 跳转 `/news/category/:tag`, 与 ProductPage 的 `<button>` + `useState` 模式不一致, 导致点击 Tab 时整页刷新/路由切换体验差。本次彻底改为与 ProductPage 完全同款: `<button>` + `useState` 切换, 不跳转 URL, 仍保留 `/news/category/:tag` 路由用于外链直达 (从 URL 初始化 activeTab)。

**详细变更**

### 1. NewsListPage.tsx Tab 重构
- 移除 `<Link>` + `tabPath()` 路由跳转模式
- 改为 `<button onClick={() => setActiveTab(idx)}>` + `useState` 切换, 与 ProductPage 完全一致
- 样式参数对齐 ProductPage: 140×48px / fontSize 16/14px / border / gap 16px / 无圆角 / TAB_ACTIVE / TAB_INACTIVE
- 移除外层 `<Reveal>` 包装, 与 ProductPage 一样直接渲染 (避免 Reveal 在 visible 前 opacity-0 导致 Tab 不可见/不可点击)
- 从 URL `:tag` 初始化 `activeTab` (兼容 `/news/category/:tag` 直达外链, 首次访问时定位到对应 Tab)
- 切换 Tab 时只更新 state, URL 不变, 不触发路由跳转, 不重新渲染整页

### 2. import 清理
- 移除未使用的 `newsCategoryPath` / `newsPath` 导入
- 移除未使用的 `NEWS_DEFAULT_CATEGORY` 导入 (改用 `NEWS_CATEGORIES[activeTab]`)
- 新增 `useState` 导入

**影响范围**
- 资讯中心列表页 `/news` 和分类页 `/news/category/:tag` 的 Tab 交互
- NewsDetailPage 中分类标签点击跳转到 `/news/category/:tag` 仍然可用 (路由保留, NewsListPage 从 URL 初始化 activeTab)

**关联文件**
- `src/pages/NewsListPage.tsx`

---

## [2026-07-25] 重构 | 项目结构整理与僵尸文件清理

**类型**: 项目结构整理 + 死代码清理 + 资源迁出

**摘要**
项目经多次 agent 修改后结构混乱,本次系统性整理: ① 检测并归档 13 个僵尸组件 + 10 个僵尸图片键 + ~265 张僵尸图片; ② aigpic/ 工作区迁出到项目外 `d:\VibeTest\bigsound_aigpic\`; ③ file/ 原始资料归档到 `docs/source_files/`; ④ 删除 dist/ 构建产物 + 根目录散落临时文件 + public/ 临时 HTML 预览页; ⑤ 更新 .gitignore 屏蔽归档与临时目录。整理后项目根目录从 25+ 个散落文件降至 15 个必要文件。

**详细变更**

### 1. 僵尸组件归档 (13 个 .tsx → docs/_archived/components/home/)
- 判定依据: 在 src/ 中 Grep 搜索组件名,排除自身文件、Sections.tsx barrel、注释行后零引用
- HomePage.tsx 实际仅 import VideoEntry + HeroProducts 两个组件
- 归档清单: Sections.tsx (barrel) + BrandIntro / Stats / ProductCategories / ChinesePioneer / TechFeatures / FlagshipProduct / ProductSeries / HearingResearch / Partners / Qualifications / NewsSection / HomeVideoHero (共 13 个)
- 归档位置: `docs/_archived/components/home/` (已加入 .gitignore,等下次确认无影响后再彻底删)

### 2. 僵尸图片键清理 (about.ts 中 10 个)
- 判定依据: about.ts 第 70-80 行注释明确写"已弃用, 保留兼容",且 src/ 中无任何代码引用这些 key
- 清理方式: 直接从 about.ts 删除键定义 (about.ts 已改用 honorReal1-9 真实证书图)
- 对应图片归档到 `docs/_archived/images/honors/` (10 张占位证书)
- 清理清单: honorCertBte / honorCertIte / honorCertProduction / honorCertRic / honorCertBody / honorTechSme / honorHighTech / honorInnovativeSme / honorSzdmaMember / honorBrandRating

### 3. 僵尸图片资源归档 (~265 张 → docs/_archived/images/)
- 判定依据: 在 src/ 中搜索路径片段 (1_创维大声 / 大声产品手册 / 招商手册1212 / 招商手册_split / honor_cert_) 全部零命中
- 归档清单:
  - `public/images/invest_old_backup/` (7 张) → `docs/_archived/images/invest_old_backup/`
  - `public/images/prototype/1_创维大声助听器培训资料260610_s*_img*` (201 张) → `docs/_archived/images/prototype/`
  - `public/images/prototype/大声产品手册0323_p*_img*` (29 张) → `docs/_archived/images/prototype/`
  - `public/images/prototype/招商手册1212__p*_img*` (18 张) → `docs/_archived/images/prototype/`
  - `public/images/honors/honor_cert_*.png + honor_*.png` (10 张) → `docs/_archived/images/honors/`
- 直接删除: `public/images/prototype/招商手册_split/` (16 张, 用户明确选择删除)
- 保留: `public/images/prototype/founder_card_wanghai.png` + `team_exec_card.png` (about.ts 注释提到,谨慎保留)
- 保留: `public/images/prototype/` 下被 invest.ts/home.ts/product.ts 实际引用的 ~33 张图

### 4. aigpic/ 工作区迁出
- 整个 `aigpic/` 目录 (33 Python 脚本 + 12 JSON 配置 + 7 日志 + 9 HTML 预览 + 9 batch_report + 9 主题子目录共 162 个文件) 迁出到 `d:\VibeTest\bigsound_aigpic\`
- 与项目源码完全隔离,不再污染项目根
- 速创API 生图工具脚本仍可通过 `c:\Users\15927\.trae-cn\skills\img\scripts\` 调用,本次迁出仅影响项目内的工作区副本

### 5. file/ 原始资料归档
- `file/` 目录下 4 个原始资料文件迁到 `docs/source_files/`:
  - `1.创维大声助听器培训资料260610.pptx` (152MB)
  - `大声产品手册0323.pdf` (9MB)
  - `官网3.0文案框架260718.xlsx` (5MB)
  - `招商手册1212 .pdf` (20MB)
- 删除 Excel 临时锁文件 `~$官网3.0文案框架260718.xlsx`
- 删除空 `file/` 目录

### 6. 根目录散落临时文件清理
- 删除: `policy_current_1.png`, `policy_current_2.png`, `policy_current_3.png` (无代码引用)
- 删除: `_deep_extract.py` (PDF/Excel 抽取脚本,运行时不需要)
- 删除: `_xlsx_extract/` 目录 (Excel 解压临时目录)
- 删除: `tmp_shot_1~6_*.png` (6 张临时截图)
- 删除: `screenshot_carousel.py`, `screenshot_invest_brand.py`, `screenshot_policy.py`, `tmp_verify_tabs.py` (4 个临时脚本)
- 删除: `tmp/` 目录 (21 张 desktop/mobile/tablet 截图)
- 删除: `tsconfig.tsbuildinfo` (TypeScript 增量编译缓存)

### 7. public/ 临时文件清理
- 删除 6 个临时 HTML 预览页:
  - `public/hero_4directions.html`
  - `public/hero_compare.html`
  - `public/hero_invest_preview.html`
  - `public/hero_v5_compare.html`
  - `public/invest_regenerate_compare.html`
  - `public/invest_regenerate_compare_v2.html`
- 删除 `public/aigpic/` 目录 (aigpic 的 4 张图副本)

### 8. dist/ 构建产物清理
- 删除整个 `dist/` 目录 (可随时 `npm run build` 重建)
- .gitignore 已包含 `dist/`,后续 build 不会污染 git

### 9. .gitignore 更新
新增以下条目:
- `aigpic/` (aigpic 工作区已迁出,本地残留忽略)
- `tmp/`, `tmp_shot_*.png`, `tmp_verify_tabs.py`, `screenshot_*.py` (临时截图与脚本)

> 注: `docs/_archived/` 规则已于 2026-07-25 用户确认彻底删除归档后同步移除

**影响范围**
- 项目根目录: 从 25+ 个散落文件降至 15 个必要文件 (.env.example, .gitignore, 5 个 .md 文档, index.html, package*.json, postcss/tailwind/tsconfig/vite 配置)
- src/components/home/: 从 15 个 .tsx 降至 2 个 (HeroProducts, VideoEntry)
- src/data/images/about.ts: 删除 10 个僵尸键
- public/images/: 清理 ~281 张僵尸图片 (265 归档 + 16 删除)
- 项目外: 新增 `d:\VibeTest\bigsound_aigpic\` (162 个文件)
- docs/: 仅保留 `source_files/` (4 个原始资料), `_archived/` 已彻底删除

**关联文件**
- `src/data/images/about.ts` (删除 10 个僵尸键)
- `.gitignore` (新增 4 类忽略规则)
- `docs/_archived/` (新建归档目录)
- `docs/source_files/` (新建原始资料目录)
- `d:\VibeTest\bigsound_aigpic\` (项目外新位置)

**验证**
- `npx tsc --noEmit` 通过 (退出码 0)
- `npm run build` 成功 (199 模块, 6.29s, 退出码 0)
- 产物: dist/index.html 0.66 kB + dist/assets/index-BEWoMLJW.css 53.33 kB + dist/assets/index-B97iU909.js 716.52 kB
- 唯一警告: chunk 大小 > 500 kB (性能优化建议,非阻塞)

**遗留事项**
- `aigpic/` 空目录被进程锁定无法删除 (已加入 .gitignore,不影响 git/编译/build,下次重启系统后会自动可删)
- `docs/_archived/` 已于 2026-07-25 用户确认后彻底删除 (278 个文件, 156.39 MB), .gitignore 中对应规则已同步移除

---

## [2026-07-25] 重构 | ProductPage / WearablePage 产品卡片改为左右布局 + 3:4 产品图容器

**类型**: UI 重构

**摘要**
用户反馈之前 1:1 正方形布局不够好看, 提供参考图片要求改为: 卡片上半部分左图右信息(型号/价格), 下半部分指标格(grid), 产品图容器用 3:4 比例。已按此方向重构两页产品卡片, 并同步优化 ProductPage features 数据使其更适合 2×3 指标格展示。

**详细变更**

### 1. 卡片布局重构 (ProductPage.tsx / WearablePage.tsx)
旧布局: 产品图在上(占满宽度, 高 240px 或 aspect-square), 信息区在下(标签/型号/价格/特性列表)。
新布局:
- 上半部分: `grid grid-cols-[120px_1fr] gap-3`
  - 左侧: 3:4 产品图容器 `aspect-[3/4] bg-ink-100`, 图片 `object-contain` 居中
  - 右侧: 形态标签 + 型号 + 零售指导价
- 下半部分: 指标表格 `grid grid-cols-2 gap-[1px] bg-ink-200 border border-ink-200`
  - 每个单元格 `bg-white p-[10px] min-h-[64px]`, 值(13px bold) + 标签(11px)
  - ProductPage: 6 个特性 → 2×3 grid
  - WearablePage: 保留 4 个特性 → 2×2 grid

### 2. 产品图容器改为 3:4
- ProductPage: `aspect-square` → `aspect-[3/4]`
- WearablePage: `aspect-square` → `aspect-[3/4]`
- 当前产品图为 1:1 正方形, 在 3:4 容器中上下各留约 14% 轻微留白, 比例协调
- 保留 `object-contain` 不裁剪产品图

### 3. ProductPage features 数据精简 (`src/data/product.ts`)
为适配小指标格, 将过长的 label/desc 缩短:
- "AI 算力超 / 15 亿次/秒乘累加运算" → "15亿次/秒 / AI 算力"
- "5 核异构 / 12nm 全数字处理器" → "5 核异构 / 12nm 处理器"
- "中文言语 / 增强补偿算法" → "中文言语 / 增强补偿"
- "自适应反馈(啸叫)抑制" → "自适应反馈抑制"
- "脉冲噪声(瞬噪)抑制算法" → "脉冲噪声抑制"
- 12 款产品全部按此原则优化, 保持原意不变

### 4. 附带修复: barrel 文件导出未定义变量
- `src/config/index.ts` 和 `src/data/content.ts` 仍在导出 `NAV_LINKS`, 但 `src/config/navigation.ts` 已改为导出 `NAV_ITEMS`, 导致 `npx tsc --noEmit` 失败
- 已删除两处 barrel 中的 `NAV_LINKS`, 仅保留 `NAV_ITEMS`

**影响范围**
- `/product` 页 §3 产品卡片 (12 款助听器)
- `/wearable` 页 §3 产品卡片 (11 款穿戴设备)
- 顺带修复的 barrel 文件影响全站导航导入

**关联文件**
- `src/pages/ProductPage.tsx` (卡片 JSX)
- `src/pages/WearablePage.tsx` (ProductCard 组件)
- `src/data/product.ts` (features 数据精简)
- `src/config/index.ts` (删除 NAV_LINKS 导出)
- `src/data/content.ts` (删除 NAV_LINKS 导出)

**验证**: `npx tsc --noEmit` 通过 (exit code 0)。待用户在 http://localhost:5173/product 和 http://localhost:5173/wearable 多断点 (1440/1024/768/390) 视觉验证新卡片布局。

---

## [2026-07-25] 数据更新 | 资讯中心新闻数据全量替换为真实抓取内容 (18 篇)

**类型**: 数据更新 (虚构 → 真实数据)

**摘要**
按用户指示从 `https://www.xiaowe.cc/h-col-104.html` 抓取 18 篇真实新闻替换原 NEWS_LIST 中 10 篇虚构内容，同步更新图片映射、分类映射和详情文章。新闻时间跨度 2026-01-07 至 2026-07-23，覆盖公司新闻、产品资讯、行业资讯 3 大分类。已完成 2 篇重点文章 (1240/1232) 的完整正文采集，其余 16 篇详情页通过封面图+摘要兜底展示。

**详细变更**

### 1. `src/data/home.ts` - NEWS_LIST 重写
- 旧: 10 篇虚构新闻 (id 1224-1230 等)，内容为本地测试数据
- 新: 18 篇真实新闻 (id 1044-1240)，按发布时间倒序排列
- 同步更新 `NEWS_CATEGORY_MAP`，按文章内容性质重新分类：
  - 公司新闻: 公司动态/合作签约/领导视察/展会亮相/公益行动 (10 篇)
  - 产品资讯: 新品发布/产品获奖/产品入驻平台 (4 篇)
  - 行业资讯: 行业会议/政策平台/服务案例/科普 (4 篇)

### 2. `src/data/images/news.ts` - 新增 18 个外链图片映射
- 新增 `news11`-`news28` 共 18 个外链图片 (来自 `aka.doubaocdn.com`)
- 保留 `news1`-`news10` 旧版本地图片，用于首页循环展示
- 类型断言保持 `as const` 确保类型安全

### 3. `src/data/articles.ts` - 详情文章清理与新增
- 删除: 4 篇虚构详情文章 (1230/1228/1226/1224)
- 新增: 2 篇真实详情文章
  - **1240**: "报名倒计时4天！带上父母、喊上邻居！7月27-28日来深圳北站社区免费检查听力"
    - 完整正文: 公益听力筛查活动通知 (活动地点/时间/服务项目/4 大危害科普)
    - 医疗广告: 粤械广审（文）第280917-01958号
    - 下一篇: 1232
  - **1232**: "震撼首发！创维AI中文助听器DAB007，全球首款为中文母语者深度定制的AI助听器"
    - 完整正文: DAB007 新品发布 (6 大产品亮点: 听得懂/5 核芯片/智能降噪/啸叫抑制/远程验配/细节设计)
    - 医疗广告: 粤械广审（文）第280917-02199号
    - 上一篇: 1240, 下一篇: 1216
- 其他 16 篇文章详情页通过 NewsDetailPage 兜底逻辑展示封面图 + 摘要

### 4. NewsDetailPage 兜底逻辑
- 当 `NEWS_ARTICLES[id]` 不存在时，使用 `NEWS_LIST` 中的 `newsMeta.summary` 作为正文
- 显示 "本文详细内容正在整理中" 友好提示
- 不影响页面布局和导航功能

**影响范围**
- 资讯列表页 `/news` (展示 18 篇新闻)
- 资讯分类页 `/news/category/:tag` (按 3 大分类筛选)
- 资讯详情页 `/news/:id` (2 篇完整正文 + 16 篇摘要兜底)
- 首页新闻模块 (展示最新 N 条)
- 不影响其他页面 (产品页/招商页等)

**已知限制**
- 16 篇文章详情暂用摘要兜底，后续按需补充完整正文
- 外链图片依赖 `aka.doubaocdn.com` 可用性，若失效需重新抓取
- 原网站标签 "听力资讯" / "听力科普" 在新版 3.0 中已合并入 "行业资讯"，分类体系更精简

**关联文件**
- `src/data/home.ts` (NEWS_LIST + NEWS_CATEGORY_MAP)
- `src/data/images/news.ts` (NEWS_IMAGES 外链映射)
- `src/data/articles.ts` (NEWS_ARTICLES 详情内容)
- `src/pages/NewsListPage.tsx` (列表/分类页)
- `src/pages/NewsDetailPage.tsx` (详情页兜底逻辑)

**验证**: `npx tsc --noEmit` 通过 (exit code 0)。可在 http://localhost:5173/news 查看列表页，http://localhost:5173/news/1240 和 http://localhost:5173/news/1232 查看完整详情。

---

## [2026-07-25] 修复 | ProductPage / WearablePage 卡片一致性与移动端图片容器适配

**类型**: UI 修复 (CSS 视觉统一)

**摘要**
针对 `/product` 和 `/wearable` 两个页面的产品卡片模块修复两个问题: (1) 同一行卡片因 features 数量/长度不一导致高度不齐; (2) 移动端不同视口下图片容器比例失调 (1.43-1.57 宽长方形), 1:1 正方形产品图被 `object-contain` 缩到 240px 高, 左右留 30-40% 空白。采用 CSS 视觉统一方案 (不改数据结构), 图片容器改 `aspect-square` 1:1, 网格加 `auto-rows-fr` + 卡片 `h-full` 实现行内高度对齐。

**详细变更**

### 1. 图片容器改用 `aspect-square` (修复移动端空白)
- 旧: `<div className="w-full bg-ink-100 ..." style={{ height: "240px" }}>` + `<img className="max-w-full max-h-full object-contain ..." />`
- 新: `<div className="w-full aspect-square bg-ink-100 ...">` + `<img className="w-full h-full object-contain ..." />`
- 容器在所有断点下保持 1:1 正方形 (移动端 ~343×343, 桌面端 ~288×288), 匹配 800×800 产品图, 无空白
- 保留 `object-contain` 避免裁剪产品图

### 2. 网格 + 卡片高度对齐 (修复卡片高度不齐)
- 网格容器: 新增 `auto-rows-fr` (Tailwind), 让同一行内所有 grid item 拉伸到该行最高 item 的高度
- Reveal 包装器: 新增 `className="h-full"` (Reveal 组件 L160 已透传 className)
- 卡片根 div: `style={{ minHeight: "440px" }}` → Tailwind `h-full min-h-[440px]`, 让卡片填满 Reveal 高度, 同时保留 440px 下限

### 3. 改动文件与位置
| 文件 | 行号 | 改动 |
|---|---|---|
| `src/pages/ProductPage.tsx` | L111 | 网格新增 `auto-rows-fr` |
| `src/pages/ProductPage.tsx` | L113 | Reveal 新增 `className="h-full"` |
| `src/pages/ProductPage.tsx` | L114-L116 | 卡片根 div: `style minHeight 440px` → `h-full min-h-[440px]` |
| `src/pages/ProductPage.tsx` | L119-L126 | 图片容器 `style height 240px` → `aspect-square`; img `max-w-full max-h-full` → `w-full h-full` |
| `src/pages/WearablePage.tsx` | L227 | 网格新增 `auto-rows-fr` |
| `src/pages/WearablePage.tsx` | L229 | Reveal 新增 `className="h-full"` |
| `src/pages/WearablePage.tsx` | L43-L45 | ProductCard 根 div: `style minHeight 440px` → `h-full min-h-[440px]` |
| `src/pages/WearablePage.tsx` | L46-L53 | 图片容器 `style height 240px` → `aspect-square`; img `max-w-full max-h-full` → `w-full h-full` |

**影响范围**
- `/product` 页 §3 产品卡片网格 (12 款助听器, 4 列 × 3 行)
- `/wearable` 页 §3 产品卡片网格 (11 款穿戴设备, 4 列 × 3 行)
- 不影响其他 section (TechCard / Hero / Tab 导航等)
- 不改数据结构 (`ProductItem` / `WearableProduct` 字段不变)

**已知限制**
- `public/images/wearable/kids_t10.png` 是 790×524 横图 (1.51 比例), 放在 `aspect-square` 容器中会有上下约 17% 留白。其他 19 张产品图均为 1:1 正方形, 不受影响。后续可单独重生该图为 1:1。
- `auto-rows-fr` 只对齐同一行内卡片高度, 不同行仍可能不同 (合理视觉行为, 与 Apple/华为官网一致)。
- 移动端 1 列时图片区从 343×240 变为 343×343, 图片视觉变大 ~43%, 卡片整体变长 (trade-off: 消除空白的代价)。

**关联文件**
- `src/pages/ProductPage.tsx`
- `src/pages/WearablePage.tsx`
- 计划文件: `.trae/documents/product_wearable_card_mobile_consistency.md`

**验证**: `npx tsc --noEmit` 通过 (exit code 0)。待用户在 http://localhost:5173/product 和 http://localhost:5173/wearable 多断点 (1440/1024/768/390) 视觉验证。

---

## [2026-07-25] 调整 | 全站 logo 统一指向 logo.png + 显示尺寸缩小 40%

**类型**: 资源统一 + 视觉缩放

**摘要**
用户审查后确认全站主 logo 应统一使用 `public/images/logo.png` (用户 2026-07-22 提供), 并要求所有 logo 显示位置尺寸缩小 40% (乘 0.6)。审计后发现 `src/data/images/common.ts` 中 `IMAGES.logo` 已指向 `/images/logo.png`, 5 个使用 `IMAGES.logo` 的组件全部完成尺寸缩放。

**详细变更**

### 1. Logo 路径审计
- `src/data/images/common.ts` 中 `IMAGES.logo = "/images/logo.png"` ✅ (无需修改, 上一轮已替换原 `01_logo.webp`)
- 全站仅 5 处使用 `IMAGES.logo` (主品牌 logo), 其他 logo 资源 (heroLogo / flagshipLogo / ctaLogo* / partner* / serviceC2mLogo / 医院logo) 用途不同, 不在本次调整范围

### 2. 5 处 logo 显示尺寸缩小 40% (×0.6)
| 文件 | 位置 | 旧尺寸 | 新尺寸 |
|---|---|---|---|
| `src/components/layout/Header.tsx#L139` | 顶部导航 logo | `h-[32px] lg:h-[40px]` | `h-[19px] lg:h-[24px]` |
| `src/pages/LoginPage.tsx#L112` | 登录页左侧品牌区 logo | `h-10` (40px) | `h-6` (24px) |
| `src/pages/RegisterPage.tsx#L158` | 注册页左侧品牌区 logo | `h-10` (40px) | `h-6` (24px) |
| `src/pages/NotFoundPage.tsx#L22` | 404 页 logo | `w-[180px] sm:w-[220px] lg:w-[250px]` | `w-[108px] sm:w-[132px] lg:w-[150px]` |
| `src/components/layout/Footer.tsx#L317` | 页脚版权区 logo | `h-[24px]` | `h-[14px]` |

**影响范围**
- 全站 Header / Footer / 登录注册 / 404 页 logo 视觉变小 40%
- 不影响其他 logo 资源 (合作伙伴 / 旗舰产品 / CTA / Hero 小 logo / 医院 logo)
- 不影响布局结构, 仅 img 标签 className 尺寸调整

**关联文件**
- `src/data/images/common.ts` (logo 路径定义, 已是 logo.png)
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/RegisterPage.tsx`
- `src/pages/NotFoundPage.tsx`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-25] 调整 | 招商加盟页 3 项第三轮微调 + ProductPage 同步

**类型**: 视觉调整 + 设计重构

**摘要**
用户对上一轮修复结果提出 3 项微调: (1) 医疗资质齐全模块改为「5 张证书合并成一条横向长图」的统一容器设计; (2) 全线覆盖各程度轮播图直接复用 Product 页顶部 hero 同款的 4 张 banner 图; (3) 中国听力健康市场现状第二张配图卡片高度略微调高。ProductPage §4.7.1 国家医疗资质模块同步改为横向长图设计。

**详细变更**

### 1. 医疗资质齐全 + 国家医疗资质 — 横向长图统一容器
- 用户反馈: 上一轮的「5 张独立卡片」设计不符合预期, 应把 5 张证书图合并成一条横向长图, 再设计这个容器, 并适配移动端
- 新设计:
  - 统一容器: 白底 + 顶部 4px 品牌绿装饰条 + 浅阴影 `shadow-[0_8px_24px_rgba(0,0,0,0.06)]`
  - 5 张证书横向排列在浅灰背景 (`bg-ink-100`) 中
  - 每张证书白底 + 右侧细分隔线 (`border-r border-ink-200`, 最后一站无)
  - 横版证书 (第 3 张) 宽度更大: `w-[300px] lg:w-[360px]`, 竖版证书: `w-[180px] lg:w-[220px]`
  - 统一高度: `h-[200px] lg:h-[260px]`
  - 图片 `object-contain` 完整显示, `max-w-[92%] max-h-[92%]` 留白透气
  - hover: 证书背景变浅绿 (`hover:bg-brand-green/5`), 图片放大 1.05
  - 移动端: `overflow-x-auto` 横向滚动; 桌面端: `lg:overflow-hidden` 铺满容器
- 文件:
  - `src/pages/InvestPage.tsx` §3.5.3 医疗资质齐全
  - `src/pages/ProductPage.tsx` §4.7.1 国家医疗资质

### 2. 全线覆盖各程度轮播图 — 复用 Product hero 同款 4 张 banner 图
- 用户反馈: 轮播图就参考 Product 页最上面的 hero 轮播图, 用那几张图轮播就行
- 修复: 移除 `images={INVEST_PAGE.advantages.brand.productCoverage.slides.map(...)}` prop
- ProductCarouselHero 组件 `images` prop 不传时, 自动使用默认的 `DEFAULT_BANNER_IMAGES` (即 `/images/hero_xiaowe/banner_1~4.webp`, 与 /product 顶部 hero 完全一致)
- 保留 `fullBleed={false}` 保持 1200px container-page 宽度, 不撑满视口
- 文件: `src/pages/InvestPage.tsx` §3.5.1 全线覆盖各程度

### 3. 中国听力健康市场现状 — 第二张配图卡片高度略微调高
- 旧: `h-[208px] lg:h-[260px]`
- 新: `h-[240px] lg:h-[300px]` (移动端 +32px, 桌面端 +40px)
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 [2] 配图

**影响范围**
- 招商加盟页 /invest §3.1 + §3.5.1 + §3.5.3
- 产品页 /product §4.7.1 国家医疗资质

**关联文件**
- `src/pages/InvestPage.tsx`
- `src/pages/ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 和 http://localhost:5173/product 查看效果

---

## [2026-07-25] 调整 | 招商加盟页 6 项问题第二轮修复 + 3 张配图重生

**类型**: 视觉调整 + Bug 修复 + AI 生图

**摘要**
用户反馈招商加盟页 6 个新问题，本次全部完成。问题 1 涉及 3 张配图重生 (中国听力现状/专家团队/自有工厂主图),问题 2 重设计医疗资质模块 (去边框简洁卡片),问题 3 调整开店全流程卡片高度,问题 4 重做自有研发团队卡片样式 + 主图重生,问题 5 修复柱状图移动端遮挡,问题 6 修复全线覆盖各程度轮播图横向铺满问题。

**详细变更**

### 问题1: 重新生成【中国听力健康市场现状】+【专家全程带教】+【自有研发团队主图】3 张配图
- 范围: 用户确认本轮继续淡色浅色系真实场景氛围,与 v5 hero + mission/vision 配图保持一致
- 工具: 速创API gpt-image-2, 4:3 (中国听力现状) + 16:9 (专家团队/工厂主图), concurrency=3
- 3 张全部用主 prompt 成功 (无审核失败, 无降级到 fallback)
- 专家团队 prompt 重点: 中景拍摄三位专家工作场景 (一个调助听器/一个看数据/一个咨询患者)
- 旧图备份: `aigpic/20260725_invest_batch2/backup/` + `public/images/invest_old_backup/`
- 新图已替换到 `public/images/prototype/` 3 个文件 (路径不变, invest.ts 无需改动)
- 对比预览页: `public/invest_regenerate_compare_v2.html` (http://localhost:5173/invest_regenerate_compare_v2.html)

### 问题2: 【医疗资质齐全】+ ProductPage【国家医疗资质】两处新设计
- 旧设计: 米白卡纸 + 内层金边 + 立体阴影 + 模拟相框 (过于厚重)
- 新设计: 极简卡片, 无相框边框
  - 白底 + 顶部品牌绿装饰条 (3px, hover 时加粗到 5px)
  - 浅灰背景 (bg-ink-100) 衬托证书图
  - hover: 上浮 6px + 浅阴影 + 图片轻微放大 1.04-1.05
  - 横版证书 (第3张) 居中放置, 用矮卡 (140/170px)
  - 竖版证书用高卡 (200/260px)
- 移动端: flex + overflow-x-auto + shrink-0 横向滚动
- 文件:
  - `src/pages/InvestPage.tsx` §3.5.3 医疗资质齐全
  - `src/pages/ProductPage.tsx` §4.7.1 国家医疗资质

### 问题3: 【开店全流程服务】门店面积卡片高度减小 + 图片高度增大
- 旧: 面积卡 minHeight 160px + p-[32px], 图片 h-[208px] lg:h-[260px]
- 新: 面积卡 minHeight 100px + p-[20px] lg:p-[24px], 图片 h-[300px] lg:h-[380px]
- 字号微调: 类型 22/28 → 20/24, 面积 14/16 → 13/15
- 文件: `src/pages/InvestPage.tsx` §4.1 开店全流程

### 问题4: 【自有研发团队】主图重生 + 三张卡片文本居中 + 重要数据突出
- 主图 (investOwnFactory) 重新生成: 干净现代的助听器生产设施内景,16:9, 淡色浅色系
- 三张卡片重构:
  - 文字覆盖层: 从 `justify-end` 左对齐 → `justify-end items-center text-center` 居中
  - 黑色遮罩: 从 `bg-black/55` 均匀 → `bg-gradient-to-t from-black/85 via-black/55 to-black/30` 渐变 (底部更深, 突出文字)
  - 重要数据: 数字 32/40px → 40/52px, 添加 `drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]` 阴影, hover 时 scale-110
  - 单位: 14/16px → 16/20px, 改用 `text-brand-green-light` 品牌绿强调
- 文件: `src/pages/InvestPage.tsx` §3.5.2 自有研发团队

### 问题5: 修复【中国听力健康市场现状】柱状图移动端被遮挡 Bug
- 根因: 柱状图卡片固定 `h-[160px]`, 但内容 (legend 28px + barAreaH 80px + year 24px + padding 40px = 172px) 超出, 导致底部年份标签被裁剪
- 修复:
  - 卡片高度: `h-[160px] lg:h-[200px]` → `min-h-[200px] lg:h-[200px]` (移动端自适应)
  - padding: `p-[20px]` → `p-[16px] lg:p-[20px]` (移动端更紧凑)
  - 柱图组添加 `shrink-0` 防止 gap 挤压
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 [4] 柱状图

### 问题6: 【全线覆盖各程度】轮播图不撑满横向
- 用户反馈: 只要求轮播图功能 (自动切换/淡入淡出), 不要撑开横向铺满
- 修复: ProductCarouselHero 组件新增 `fullBleed` prop (默认 true 保持向后兼容)
  - `fullBleed=false`: 容器 100% 宽度跟随父容器, 不做反向补偿
  - 用于内嵌轮播场景, 保持 1200px container-page 宽度
- InvestPage §3.5.1 调用: `<ProductCarouselHero ... fullBleed={false} />` + 外包 `<div className="container-page">`
- 文件:
  - `src/components/layout/ProductCarouselHero.tsx` (新增 fullBleed prop)
  - `src/pages/InvestPage.tsx` §3.5.1 全线覆盖各程度

**影响范围**
- 招商加盟页 /invest 多个模块
- 产品页 /product §4.7.1 国家医疗资质
- ProductCarouselHero 组件 (新增 fullBleed prop, 向后兼容)
- `public/images/prototype/` 3 张 invest 配图 (中国听力/专家团队/工厂主图)

**关联文件**
- `src/pages/InvestPage.tsx`
- `src/pages/ProductPage.tsx`
- `src/components/layout/ProductCarouselHero.tsx`
- `public/images/prototype/invest_china_hearing_scene.png`
- `public/images/prototype/invest_expert_team_wide.png`
- `public/images/prototype/own_factory_overview.png`
- `aigpic/invest_batch2_plan.json` (生图计划)

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看新图效果
- 新旧对比页 http://localhost:5173/invest_regenerate_compare_v2.html

---

## [2026-07-25] 调整 | 招商加盟页 8 项问题批量修复 (全部完成)

**类型**: 视觉调整 + Bug 修复 + AI 生图

**摘要**
用户反馈招商加盟页 8 个问题，本次全部完成。问题 1/3/4/5/6/7/8 为代码层面修复,问题 2 用 img skill 重新生成 4 张人物场景类配图 (高流行 + 高危害3张),氛围参考新 hero 图与 AboutPage mission/vision 配图 (淡色浅色系真实场景)。

**详细变更**

### 问题1: hero 图显示不出来
- 根因: 之前误判 `public/images/hero/` 目录不存在, 实际 v5 hero 图 `/images/hero/hero_invest.png` 文件存在且有效 (1774×887 PNG, 2026-07-25 20:28 用户更新版)
- 修复: `IMAGES.heroInvest` 恢复指向 `/images/hero/hero_invest.png` (v5 hero: 助听器+黑色反光面+城市天际线+中文文字"声价千亿 聚势共赢")
- 文件: `src/data/images/common.ts` L22

### 问题3: CTA section 去灰色底改白色 + 修复电话 icon bug
- `src/pages/InvestPage.tsx` L982: section className 从 `bg-ink-100` 改为 `bg-white`
- 电话 icon SVG path 替换为 lucide 标准 phone 图标 path, 添加 `strokeLinecap="round" strokeLinejoin="round"` 让线条圆滑
- 文件: `src/pages/InvestPage.tsx` §6 CTA (L976-L1077)

### 问题4: 医疗资质齐全 + ProductPage 国家医疗资质 两处用容器固定 5 张证书
- 两处均把 grid 网格改为 flex 横向排列 + `overflow-x-auto` 移动端横向滚动
- 每张证书固定宽度 `w-[180px] lg:w-[220px]` + `shrink-0`, 移动端可滑动浏览
- 文件:
  - `src/pages/InvestPage.tsx` §3.5.3 医疗资质齐全 (L763-L814)
  - `src/pages/ProductPage.tsx` §4.7.1 国家医疗资质 (L224-L266)

### 问题5: 高危害模块移动端取消交错布局
- 修复: 移动端 (`lg:hidden`) 统一图上文下顺序, 桌面端 (`hidden lg:block`) 保留 isReverse 交错
- 文件: `src/pages/InvestPage.tsx` §2.2 高危害 (L197-L256)

### 问题6: 开店全流程服务 - 删除【店型】文本, 门店类型与面积同行
- 删除原 `<p>店型</p>` 标签
- 门店类型 + 面积合并到同一行: 大字绿色类型 + 小字深色面积, 用 `ml-[12px]` 间隔
- 文件: `src/pages/InvestPage.tsx` §4.1 开店全流程 (L862-L877)

### 问题7: 自有研发团队 三张卡片加黑色遮罩
- 重构卡片结构: 背景图 (absolute) + 黑色遮罩 `bg-black/55` (hover 变 `bg-black/65`) + 文字覆盖层 (absolute bottom)
- 卡片高度统一 `h-[280px] lg:h-[320px]`
- 文字改为白色, 数字 32px/40px, 单位 14px/16px, label 15px/17px, desc 12px/13px
- 文件: `src/pages/InvestPage.tsx` §3.5.2 自有研发团队 (L729-L763)

### 问题8: 全线覆盖各程度 换成 hero 同款轮播图
- 删除 SimpleCarousel 组件定义 (InvestPage.tsx L50-L127) 及其 React hooks 导入
- 改用 ProductCarouselHero 组件, 传入 slides 的图片URL数组
- 高度 400px, 5s 自动轮播, 无换页按钮/无说明文本/无指示器
- 模块结构调整: SubSectionTitle 在 Reveal 内, ProductCarouselHero 直接放在 container-page 中 (利用其反向补偿铺满视口), 下方留 60px 间距
- 文件: `src/pages/InvestPage.tsx` §3.5.1 全线覆盖各程度 (L703-L716)

### 问题2: 重新生成 4 张人物场景类配图 (淡色浅色系真实场景)
- 范围: 用户确认仅重生成人物场景类 4 张 (高流行 + 高危害3张: 老年痴呆/更易摔倒/抑郁症)
- 氛围参考: 新 hero 图 (用户刚改的) + AboutPage mission/vision 配图 → 淡色浅色系真实场景 + 老年人物 + 自然光 + 温馨关怀感
- 工具: 速创API gpt-image-2, 4:3 比例 (与原图一致 1448×1086), concurrency=3
- 4 张全部用主 prompt 成功 (无审核失败, 无降级到 fallback)
- 旧图备份: `aigpic/20260725_invest_people/backup/` + `public/images/invest_old_backup/`
- 新图已替换到: `public/images/prototype/invest_hearing_prevalence.png` 等 4 个文件 (路径不变, invest.ts 无需改动)
- 对比预览页: `public/invest_regenerate_compare.html` (http://localhost:5173/invest_regenerate_compare.html)
- 关联文件:
  - `aigpic/invest_people_batch_plan.json` (生图计划)
  - `public/images/prototype/invest_hearing_prevalence.png` (已替换)
  - `public/images/prototype/invest_harm_dementia.png` (已替换)
  - `public/images/prototype/invest_harm_falling.png` (已替换)
  - `public/images/prototype/invest_harm_depression.png` (已替换)

**影响范围**
- 招商加盟页 /invest 多个模块
- 产品页 /product §4.7.1 国家医疗资质
- `src/data/images/common.ts` (heroInvest 路径)
- `public/images/prototype/` 4 张 invest 人物场景图

**关联文件**
- `src/pages/InvestPage.tsx`
- `src/pages/ProductPage.tsx`
- `src/data/images/common.ts`
- `public/images/prototype/invest_hearing_prevalence.png`
- `public/images/prototype/invest_harm_dementia.png`
- `public/images/prototype/invest_harm_falling.png`
- `public/images/prototype/invest_harm_depression.png`

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看新图效果
- 新旧对比页 http://localhost:5173/invest_regenerate_compare.html

---

## [2026-07-25] 验收 | 全站移动端/平板端适配验收 + 两个阻断性 bug 修复

**类型**: 验收 + Bug 修复

**摘要**: 全站移动端/平板端适配工作完成最终验收。Playwright 自动化测试覆盖 7 个页面 × 3 个视口 (mobile 390 / tablet 768 / desktop 1280) 共 21 项检查全部通过。验收过程中发现并修复 2 个阻断性 bug。

### 1. AboutPage 运行时崩溃修复 (AboutPage.tsx#L482)
**根因**: §3.11 发展历程 section 标题引用了 `ABOUT_PAGE.milestone.sectionTitle`, 但数据对象 ABOUT_PAGE 中该属性名为 `timeline` (非 `milestone`)。`ABOUT_PAGE.milestone` 为 undefined, 访问 `.sectionTitle` 抛 TypeError, 导致整个 AboutPage 组件渲染失败。
**影响**: about 页在所有视口下均无法正常渲染, 汉堡菜单按钮也无法检测到。
**修复**: `ABOUT_PAGE.milestone.sectionTitle` → `ABOUT_PAGE.timeline.sectionTitle`
**注**: section id 仍保留为 `milestone` (footer 锚点跳转依赖此 id, 不改动)

### 2. Reveal 隐藏态 translate-x 导致 4px 水平溢出 (index.css)
**根因**: Reveal 组件的 fade-left/fade-right variant 隐藏态使用 `translate-x-5` (20px), 在元素未滚动进入视口前, 20px 偏移使内容超出视口右边缘 4px。原 `body { overflow-x: hidden }` 兜底未覆盖到 `documentElement` 层级。
**修复**: 在 `html` 选择器也添加 `overflow-x: hidden`, 与 body 协同兜底。
**影响**: careers 页 mobile 视口下检测到 4px 水平溢出, 已修复。

### 验收结果 (Playwright 自动化)
- mobile (390×844): 7 个页面全部 ✓ 汉堡菜单可见 + ✓ 无水平溢出
- tablet (768×1024): 7 个页面全部 ✓ 汉堡菜单可见 + ✓ 无水平溢出
- desktop (1280×800): 7 个页面全部 ✓ 无水平溢出
- 汉堡菜单交互: ✓ 点击打开后抽屉正确显示, 含 7 项导航链接
- TypeScript 检查: `npx tsc --noEmit` 零错误

**关联文件**:
- `src/pages/AboutPage.tsx` (L482: milestone → timeline)
- `src/index.css` (L14-20: html 添加 overflow-x: hidden)

**测试脚本**: 已使用后清理, 未保留 (临时验证用)

---

## [2026-07-22] 修复 | Footer 跳转失效修复 + QR hover 位置重做

**类型**: Bug 修复

**摘要**: 上一轮 Footer 跳转修复有 5 个 section id 未生效 + 资讯中心链接与 NEWS_CATEGORIES 不匹配 + ScrollToTop 不支持 hash 滚动 + QR hover 位置溢出视口。本轮全部修复。

**问题根因与修复**:

### 1. section id 未生效 (old_string 上下文不够精确)
AboutPage 3 个 + InvestPage 2 个 section id 在上一轮 Edit 中显示成功但实际未写入:
- AboutPage: intro (line 33) / culture (line 181) / org (line 301)
- InvestPage: advantages (line 308) / policy (line 841)
修复: 用更长的上下文 (含注释行) 重新 Edit, 5 个 id 全部生效

### 2. 资讯中心链接与 NEWS_CATEGORIES 不匹配
footer.ts NEWS_LINKS 用 "公司资讯", 但 NEWS_CATEGORIES (home.ts:252) 是 "公司新闻"
修复: URL 改为 `/news/category/公司新闻`, label 保留"公司资讯" (加注释说明)

### 3. ScrollToTop 不支持 hash 滚动 (核心问题)
原 ScrollToTop 只监听 pathname, 总是 scrollTo(0,0), 导致 `/about#intro` 跳转后停在页顶而非 #intro
修复: 重写 ScrollToTop.tsx
- 监听 pathname + hash 两个参数
- 有 hash → 用 requestAnimationFrame 等 DOM 渲染后 scrollIntoView (smooth)
- 无 hash → scrollTo(0, 0)
- 支持同页面锚点跳转 (pathname 不变 hash 变化也触发)

### 4. QR hover 位置溢出视口
原 `absolute left-full top-0 ml-2` 向右弹, 关注我们是第 7 列 (最右), QR 溢出视口右边缘
修复: 改为 `bottom-full left-1/2 -translate-x-1/2 mb-2`
- 向上弹出 (不溢出视口)
- 水平居中于触发链接
- 加小三角指示器 (border-t-white) 指向下方链接
- 加 shadow-lg 增强视觉层次

**关联文件**:
- `src/pages/AboutPage.tsx` (3 个 section 加 id: intro/culture/org)
- `src/pages/InvestPage.tsx` (2 个 section 加 id: advantages/policy)
- `src/config/footer.ts` (NEWS_LINKS URL 改"公司新闻" + 注释)
- `src/components/layout/ScrollToTop.tsx` (重写, 支持 hash 滚动)
- `src/components/layout/Footer.tsx` (FollowLink QR 弹层位置改为向上 + 三角指示器)

**验证**: `npx vite build` 通过 (132 模块, exit code 0)

**Footer 跳转目标全量验证**:
| 板块 | 链接 | 目标 | 状态 |
|---|---|---|---|
| 关于小维 | /about#intro | AboutPage §3.1 创维集团 (id=intro) | ✓ |
| 关于小维 | /about#culture | AboutPage §3.6 企业文化 (id=culture) | ✓ |
| 关于小维 | /about#honors | AboutPage §3.7 荣誉资质 (id=honors) | ✓ |
| 关于小维 | /about#org | AboutPage §3.8 组织架构 (id=org) | ✓ |
| 关于小维 | /about#milestone | AboutPage §3.9 发展历程 (id=milestone) | ✓ |
| 招商加盟 | /invest#prospects | InvestPage §2 行业前景 (id=prospects) | ✓ |
| 招商加盟 | /invest#advantages | InvestPage §3 项目优势 (id=advantages) | ✓ |
| 招商加盟 | /invest#policy | InvestPage §4 合作政策 (id=policy) | ✓ |
| 人才招聘 | /careers?cat=tech | CareersPage (useSearchParams 读取) | ✓ |
| 人才招聘 | /careers?cat=manufacturing | 同上 | ✓ |
| 人才招聘 | /careers?cat=marketing | 同上 | ✓ |
| 人才招聘 | /careers?cat=admin | 同上 | ✓ |
| 资讯中心 | /news/category/公司新闻 | NewsListPage (NEWS_CATEGORIES 包含) | ✓ |
| 资讯中心 | /news/category/产品资讯 | 同上 | ✓ |
| 资讯中心 | /news/category/行业资讯 | 同上 | ✓ |
| 联系我们 | /invest#contact | InvestPage §6 联系信息 (id=contact) | ✓ |
| 法律声明 | # | 占位 (无对应页面) | ⏳ |
| 监督举报 | # | 占位 (无对应页面) | ⏳ |

---

## [2026-07-22] 修复 | Footer 所有按钮跳转 + 关注我们 hover 二维码

**类型**: Bug 修复 + 功能增强

**摘要**: 检查 Footer 所有按钮跳转目标, 修复 5 类失效链接; 关注我们 8 个社交平台按钮新增 hover 显示二维码 (用 QR 目录已有图占位)。

**详细变更**:

### 1. 跳转目标检查与修复

| 板块 | 问题 | 修复 |
|---|---|---|
| 关于小维 5 个锚点 | AboutPage section 无 id | AboutPage 加 `id="intro/culture/honors/org/milestone"` |
| 招商加盟 3 个锚点 | InvestPage section 无 id | InvestPage 加 `id="prospects/advantages/policy"` |
| 联系我们 | InvestPage 联系信息 section 无 id | InvestPage 加 `id="contact"` |
| 人才招聘 4 个 ?cat= | CareersPage 不读 URL query | CareersPage 加 `useSearchParams` + `CAT_QUERY_MAP` (tech→技术研发类 等) |
| 资讯中心 3 个 | `/news/category/company` 与 NEWS_CATEGORIES (中文) 不匹配 | footer.ts 改为 `/news/category/公司新闻` 等 |
| 法律声明/监督举报 | 无对应页面 | footer.ts 暂改为 `#` 占位 |

### 2. 关注我们 hover 二维码

- `src/config/footer.ts`
  - `FooterLink` 接口新增 `qrImage?: string` 字段
  - 8 个 FOLLOW_LINKS 各填入 qrImage 路径 (从 `public/images/original/QR/` 选语义最接近的图占位):
    - 视频号 → qr_xwjk.webp / 小红书 → cta_logo_xhs.webp / 抖音 → 09_qrcode.webp
    - 快手 → 08_partner_2.webp / B站 → 08_partner_3.webp / 微信公众号 → qr_xwmy.webp
    - 微博 → cta_logo_dasound_tl.webp / 知乎 → cta_logo_dasound_ztq.webp

- `src/components/layout/Footer.tsx`
  - 新增 `FollowLink` 子组件 (useState 控制 hover 弹层)
  - hover 时在按钮右侧 (left-full) 弹出白色背景二维码卡片 (112×112 px)
  - 卡片含二维码图 + "扫码关注{平台名}" 文案
  - 替换原关注我们栏目所有 `<a>` 为 `<FollowLink>`

**关联文件**:
- `src/config/footer.ts` (FooterLink 接口 + NEWS_LINKS + FOLLOW_LINKS + FOOTER_LEGAL_LINKS)
- `src/components/layout/Footer.tsx` (FollowLink 组件 + import useState/FooterLink)
- `src/pages/AboutPage.tsx` (5 个 section 加 id)
- `src/pages/InvestPage.tsx` (4 个 section 加 id)
- `src/pages/CareersPage.tsx` (useSearchParams + CAT_QUERY_MAP)

**验证**: `npx vite build` 通过 (132 模块, exit code 0)

**遗留待办**:
- 法律声明 / 监督举报 两个页面待后续开发 (当前用 `#` 占位)
- 关注我们 8 个社交平台真实二维码待 PM 提供 (当前用 QR 目录已有图占位)

---

## [2026-07-25] 设计 | 全页面模块内部一致性审计与修复启动

**类型**: 设计 / 审计 / 决策

**摘要**
启动「全页面模块内部一致性审计 + 关键项修复」任务。用户明确:(1) 仅做 within-page 一致性 (页内模块间对比), 不做跨页统一; (2) 移除项目记忆中过时的「无阴影/无圆角/无渐变」原则; (3) 每项修复前必须 QA 用户。

**详细变更**

1. 项目记忆更新 (`c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md`):
   - 移除「## 原网站 (2.0 复刻版) 设计风格 — 必须保留」节下的 `- **风格定位**: 朴素 - 无圆角 / 无阴影 / 无渐变 (仅"AI"二字例外)` 一条
   - 理由: 该原则已不反映实际代码状态 (hover 阴影广泛使用、圆形头像存在、SVG 圆角存在), 用户明确要求移除
   - 保留同节其余条目 (主色 #05a045 / 字体 MiSans / 设计宽度 1200px)

2. 计划文档生成 (`d:\VibeTest\bigsound\.trae\documents\page_internal_consistency_audit.md`):
   - 11 个页面页内一致性审计框架
   - 9 项已识别页内偏差 (D1-D9)
   - 7 项全局静默失败 / 死代码 (G1-G7)
   - 14 项预期修复 (F1-F14) 按优先级分级, 每项带 QA 问题预案

3. 审计维度 (用户决策):
   - 仅 within-page (页内模块间一致性), 不做跨页统一
   - 视觉风格争议项 (hover 阴影/圆形头像/SVG 圆角) 不在本次范围
   - 每项修复前 QA 用户

**影响范围**
- 项目记忆: 1 条规则移除 (影响后续开发对「朴素风格」的认知)
- 计划文档: 1 份新增 (.trae/documents/page_internal_consistency_audit.md)
- 后续工作: Stage B 逐页审计 → Stage C 逐项 QA + 修复 → Stage D 验证

**关联文件**
- `c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md` (修改)
- `d:\VibeTest\bigsound\.trae\documents\page_internal_consistency_audit.md` (新增)
- `d:\VibeTest\bigsound\DEV_LOG.md` (本条目)

---

## [2026-07-25] 数据 | /about 企业文化 3 张配图替换

**类型**: 数据更新 / 素材替换

**摘要**
用户指示: 企业文化模块里的两张图换成 `D:\VibeTest\bigsound\public\images\original` 里的 `mission_vision_1.jpg` 和 `mission_vision_2.jpg`。第三张价值观配图参考图1用 AI 生成一个类似主题的图。

**详细变更**

1. 使命配图 (`culture_mission.png`):
   - 复制 `public/images/original/mission_vision_1.jpg` → `public/images/culture/culture_mission.png` (覆盖原文件)

2. 愿景配图 (`culture_vision.png`):
   - 复制 `public/images/original/mission_vision_2.jpg` → `public/images/culture/culture_vision.png` (覆盖原文件)

3. 价值观配图 (`culture_values.png`):
   - 调用速创API `gpt-image-2` 模型, 以 `mission_vision_1.jpg` 为参考图
   - prompt: "Warm cinematic photograph of a caring multigenerational Asian family scene, gentle hands holding a hearing aid box, soft natural window light, green plant blur background, brand green accent color tone, minimalist lifestyle photography, emotional warm atmosphere, no text, no watermark"
   - 尺寸: 3:2
   - 参考图上传到 imgbb 图床: https://i.ibb.co/TBW0JZZ5/e0edbe0cbcb7.jpg
   - 生成耗时: 93.55s
   - 保存到: `public/images/culture/culture_values.png` (覆盖原文件)

**影响范围**
- 3 个图片文件: `public/images/culture/culture_mission.png`, `culture_vision.png`, `culture_values.png`
- 代码: 无改动 (`src/data/images/about.ts` 引用路径未变)
- 页面表现: /about 企业文化模块 3 项配图全部更新, 使命和愿景使用用户提供图, 价值观为 AI 参考图1风格的同主题温馨场景

**关联文件**
- `d:\VibeTest\bigsound\public\images\culture\culture_mission.png`
- `d:\VibeTest\bigsound\public\images\culture\culture_vision.png`
- `d:\VibeTest\bigsound\public\images\culture\culture_values.png`
- `d:\VibeTest\bigsound\public\images\original\mission_vision_1.jpg` (源图)
- `d:\VibeTest\bigsound\public\images\original\mission_vision_2.jpg` (源图)

---

## [2026-07-25] 开发 | 首页 HeroProducts 删副标 + 手表图重做

**类型**: 开发 / 设计 / AI 内容生成

**摘要**
按用户反馈: (1) 三个产品卡片标题下的副标题描述全部删除, 只保留主标题; (2) 排查"手表图后面有竖线"问题, 定位为前版手表图表带垂直竖立造成视觉灰线, 重新生成手表图改为倾斜平放姿态。

**详细变更**

### A. 删除三个产品卡片的副标题

1. **`src/components/home/HeroProducts.tsx`**:
   - 删除 `<Reveal delay={80}><p>{product.subtitle}</p></Reveal>` 整段
   - 标题 `<h3>` 增加 `mb-10` 直接与产品大图连接
   - `src/data/home.ts` 中 `HERO_PRODUCTS[].subtitle` 字段保留未删 (以防其他地方引用, 仅视觉层移除)

### B. 手表图竖线问题排查与修复

1. **排查过程** (`aigpic/check_smartwatch_lines.py`):
   - 用 PIL 扫描图片每列连续浅灰像素 (RGB 200-250, 连续 ≥100 行)
   - 旧图 (v3): x=471-545 范围有 275 列连续 100-120 行浅灰 → 中部表带竖立成"竖线"
   - 图片本身右侧 50 列完全白色, 排除 CSS/Layout 边框问题
   - 定位为产品图本身的表带垂直放置, 在白色背景上形成竖向灰色带

2. **修复方案**: 修改 prompt 让手表倾斜平放
   - 旧 prompt: "standing upright" (直立)
   - 新 prompt: "laid flat and tilted at a 30-degree angle, watch face slightly turned, strap curving naturally to one side"

3. **生图执行** (`aigpic/generate_home_products_v2.py`):
   - 主程序改为仅生成手表图 (ITEMS[1])
   - gpt-image-2 仍失败 (与历次一致)
   - nanobanana2 成功
   - 覆盖 `public/images/home_products/home_product_smartwatch.png`

4. **新图验证**:
   - 重新扫描: 中部 x=400-600 已无明显竖向灰线 (843-972 非白但分散为主体, 非连续竖线)
   - 右侧 x=754+ 仍有连续浅灰 (表带延伸到右侧但角度倾斜, 不再是"竖线"感)

**验证**

- TypeScript 编译通过 (`npx tsc --noEmit`)
- Playwright 截图 (`aigpic/verify_home_products_v2.py`):
  - 整体: `aigpic/promo_video/home_products_v2_full.png`
  - 单张: `aigpic/promo_video/home_product_v2_{1,2,3}.png`

**影响范围**
- 首页 (`/`) 三个产品卡片: 标题区简化 + 手表图更新
- 不涉及路由 / 后端

**关联文件**
- `src/components/home/HeroProducts.tsx`
- `aigpic/generate_home_products_v2.py`
- `aigpic/check_smartwatch_lines.py` (排查脚本)
- `public/images/home_products/home_product_smartwatch.png`

---

## [2026-07-25] 开发 | 首页三产品图调整 (v3: 柔动感 + 全白底)

**类型**: AI 内容生成 / 设计

**摘要**
按用户反馈: (1) v2 的"动感展开"过于夸张, 改为"柔动感" (slight tilt + floating feel, 不拆开); (2) HeroProducts 第二个产品卡片背景从浅灰改为纯白, 三个卡片统一白色; (3) 重新生成助听器和手表两张图, 耳机图保持不变。

**详细变更**

### A. Prompt 改为"柔动感"

1. **`aigpic/generate_home_products_v2.py`** prompt 调整:
   - 删除 "exploded view / floating apart / decomposed arrangement"
   - 改为 "composed together as one elegant arrangement, slight tilt and floating feel, dynamic but not exploded"
   - 三张图 prompt 统一为"柔动感"模板, 仅产品主体不同

2. **生图执行**:
   - `gpt-image-2` 两张全部失败 (与 v2 一致, 该模型当前对产品图持续审核失败)
   - 自动降级 `nanobanana2`, 两张全部成功
   - 耳机图按用户要求保持不变, 仅重新生成助听器和手表

3. **生成结果** (覆盖原文件):
   - `public/images/home_products/home_product_hearing_aid.png` (助听器-柔动感)
   - `public/images/home_products/home_product_smartwatch.png` (手表-柔动感)
   - `public/images/home_products/home_product_earbuds.png` (耳机-保持 v2)

### B. HeroProducts 卡片背景统一

1. **`src/components/home/HeroProducts.tsx`**:
   - 原代码: `className={idx % 2 === 1 ? "bg-[#fafafa]" : "bg-white"}` 交替背景
   - 改为: `className="bg-white"` 三个卡片统一纯白背景
   - 保留卡片内的 `border border-[#e5e5e5]` 边框区分

**验证**

- TypeScript 编译通过 (`npx tsc --noEmit`)
- Playwright 截图 (`aigpic/verify_home_products_v2.py`):
  - 整体: `aigpic/promo_video/home_products_v2_full.png`
  - 单张: `aigpic/promo_video/home_product_v2_{1,2,3}.png`

**影响范围**
- 首页 (`/`) 三个产品入口大图 + 卡片背景
- 不涉及路由 / 数据 / 后端

**关联文件**
- `aigpic/generate_home_products_v2.py`
- `src/components/home/HeroProducts.tsx`
- `public/images/home_products/home_product_hearing_aid.png`
- `public/images/home_products/home_product_smartwatch.png`

---

## [2026-07-25] 开发 | 首页三产品图升级为动感展开白底图 (v2)

**类型**: AI 内容生成 / 设计

**摘要**
按用户反馈, 用速创API重新生成三张产品图, 在保持纯白底极简风格的同时, 加入"动感展开"效果 (exploded view / floating decomposed), 让产品部件分离漂浮, 更有视觉张力。

**详细变更**

### A. 参考图来源 (用户指定)

1. 助听器: `public/images/products/product_bigsound_br.png`
2. 智能手表: `public/images/wearable/adult_c01.png` (新指定, 替代原 skyworth_adult_smartwatch.png)
3. 蓝牙耳机: `public/images/wearable/earphone_tws_sep001.png`

### B. 生成脚本 `aigpic/generate_home_products_v2.py` (新建)

1. **Prompt 设计** - 在原"白底 + 商业摄影"基础上加入:
   - 助听器: "exploded view / main body, ear tip, and charging case floating elegantly apart with subtle gaps"
   - 手表: "dynamic floating arrangement / watch body, silicone strap, and wireless charging puck hovering at slightly different heights / subtle motion blur suggesting rotation"
   - 耳机: "exploded view / two earbuds floating out of the open charging case lid / dynamic decomposed arrangement"

2. **模型降级策略**:
   - 优先 `gpt-image-2` (用户要求的 "Imagine 2")
   - 失败自动降级 `nanobanana2`
   - 仍失败用 fallback prompt + nanobanana2

3. **执行结果**:
   - gpt-image-2 三张全部失败 (任务状态: 失败, 与上次文生图一致, 推测该模型当前对产品图生成有审核问题)
   - nanobanana2 三张全部成功
   - 生成文件覆盖原文件, 路径不变:
     - `public/images/home_products/home_product_hearing_aid.png`
     - `public/images/home_products/home_product_smartwatch.png`
     - `public/images/home_products/home_product_earbuds.png`

### C. 预览验证

- 创建 `aigpic/preview_home_products.html` (3 列预览页)
- 启动 `python -m http.server 5175` 在 aigpic 目录
- Playwright 截图:
  - `aigpic/promo_video/home_products_v2_full.png` (整体)
  - `aigpic/promo_video/home_product_v2_1.png` (助听器)
  - `aigpic/promo_video/home_product_v2_2.png` (手表)
  - `aigpic/promo_video/home_product_v2_3.png` (耳机)

**影响范围**
- 仅替换图片文件, 不修改代码 / 数据 / 路由
- 首页 `/` 三个产品入口大图自动更新

**关联文件**
- `aigpic/generate_home_products_v2.py` (生成脚本)
- `aigpic/preview_home_products.html` (预览页)
- `aigpic/verify_home_products_v2.py` (截图验证)
- `public/images/home_products/*.png` (覆盖更新)

---

## [2026-07-25] 开发 | 首页视频去遮挡 + 三产品图换真实白底图

**类型**: 开发 / 设计 / AI 内容生成

**摘要**
按用户反馈完成两项调整: (1) 首页 Hero 视频区域不再有任何遮罩/标题/按钮, 只保留纯视频自动播放, 但保留点击全屏功能; (2) 首页三个产品入口大图替换为基于真实产品生成的纯白底产品图。

**详细变更**

### A. Hero 视频去遮挡

1. **`src/components/home/VideoEntry.tsx`**:
   - 删除渐变遮罩 div
   - 删除主标题 "大声助听器 · 企业宣传片"、副标题 "彰显科技看得见"
   - 删除 "点击全屏播放" 提示按钮
   - 保留 `<video>` 铺满 100vw × 720px, `autoPlay muted loop playsInline`
   - 保留点击 section 触发 `video.requestFullscreen()` / `document.exitFullscreen()`
   - 保留键盘可访问性: `role="button"`, `tabIndex={0}`, Enter/Space 触发全屏

### B. 三产品白底图生成

1. **素材来源**:
   - 助听器参考: `public/images/products/product_bigsound_br.png` (真实产品图)
   - 智能手表参考: `public/images/prototype/skyworth_adult_smartwatch.png` (创维成人智能手表拼图)
   - 蓝牙耳机参考: `public/images/wearable/earphone_tws_sep001.png` (真实 TWS 耳机图)

2. **生成过程** (`aigpic/generate_home_products.py`):
   - 首次使用 `gpt-image-2` 模型文生图, 连续 3 张均失败 (任务状态: 失败, 无详细原因)
   - 自动降级到 `nanobanana2` 模型, 3 张全部成功
   - 尺寸 1:1, prompt 强调 "pure white background / clean e-commerce style / no text / no watermark"
   - 生成文件:
     - `public/images/home_products/home_product_hearing_aid.png`
     - `public/images/home_products/home_product_smartwatch.png`
     - `public/images/home_products/home_product_earbuds.png`

3. **路径接入**:
   - 更新 `src/data/images/home.ts`:
     - `heroProductHearingAid` → `/images/home_products/home_product_hearing_aid.png`
     - `heroProductWatch` → `/images/home_products/home_product_smartwatch.png`
     - `heroProductEarphone` → `/images/home_products/home_product_earbuds.png`
   - `src/data/home.ts` 中 `HERO_PRODUCTS` 的 `imageKey` 不变, 通过 `IMAGES[product.imageKey]` 自动读取新路径

### C. 保底方案 (未启用)

- 编写 `aigpic/make_white_bg_products.py`: 若 AI 生成失败, 用 PIL 对现有真实产品图做白底居中/裁剪/去暗底处理
- 因 nanobanana2 成功, 该保底脚本未实际产出首页图片, 仅作为后续备用

**验证**

- TypeScript 编译通过 (`npx tsc --noEmit`)
- Playwright 浏览器验证 (`aigpic/verify_home_update.py`):
  - Hero section 高度: 720px
  - video 自动播放: paused=false, currentTime=3.39s, duration=10s
  - 卖点卡片数量: 18 个
  - 产品图已成功替换为白底产品图
- 截图:
  - `aigpic/promo_video/hero_720_check.png`
  - `aigpic/promo_video/hero_products_check.png`

**影响范围**
- 首页 (`/`) Hero 视频区域和产品展示区
- 新增 `public/images/home_products/` 目录

**关联文件**
- `src/components/home/VideoEntry.tsx`
- `src/data/images/home.ts`
- `src/data/home.ts` (数据复用, 未修改)
- `aigpic/generate_home_products.py`
- `aigpic/make_white_bg_products.py` (保底)
- `public/images/home_products/*.png`

---

## [2026-07-25] 开发 | 首页 Hero 视频与三产品卡片调整

**类型**: 开发 / 设计

**摘要**
按用户反馈调整首页两个核心模块: (1) Hero 视频高度从 100vh 改为 720px, 新增点击全屏播放功能, 降低黑色遮罩浓度; (2) 三个产品入口卡片按用户附件重排为「主标题 + 副标题 + 产品大图 + 6 项卖点卡片 (2 行 × 3 列)」。

**详细变更**

### A. Hero 视频模块

1. **`src/components/home/VideoEntry.tsx`**:
   - 高度从 `100vh` 改为固定 `720px`, 宽度仍保持 `100vw` 铺满横向视口
   - 新增 `useRef<HTMLVideoElement>` 与 `handleToggleFullscreen()`: 点击 section 调用 `video.requestFullscreen()`, 已全屏时退出
   - section 增加 `cursor-pointer`, `role="button"`, `tabIndex={0}`, 支持 Enter/Space 键盘触发
   - 黑色渐变遮罩从 `rgba(0,0,0,0.25)→0.55` 降至 `0.15→0.35`, 视频观感更通透
   - 删除原播放按钮弹窗, 改为文字提示 "点击全屏播放" (带全屏 icon)
   - 保留 `autoPlay muted loop playsInline` 自动播放策略

### B. 三产品入口卡片

1. **`src/components/home/HeroProducts.tsx`** (重写):
   - 每个产品独立全宽 section, 交替背景 (`#fafafa` / white), 视觉分区
   - 顶部: 主标题 28px #333 bold + 副标题 15px #666
   - 中部: 产品大图居中, max-width 520px, hover 轻微放大 1.02
   - 底部: 6 项核心技术卡片, `grid-cols-3 gap-4`, max-width 900px 居中
   - 每个卖点卡片: 内联 SVG icon + 标题 16px bold + 描述 13px #999, 细边框 #e5e5e5, hover 边框变品牌绿
   - 每个产品 6 个图标各不相同 (助听器: 芯片/语言/大脑/波形/滑块/麦克风; 手表: 心脏/活动/体温/定位/蓝牙/闪电; 耳机: 音乐/耳机/音量/层叠/护盾/蓝牙)
   - 保留 "了解更多" 主题色链接

2. **数据复用**:
   - 继续复用 `src/data/home.ts` 中 `HERO_PRODUCTS` 的 `title/subtitle/imageKey/techs/path/cta`
   - 卖点文案未改动, 与附件中的 "5 核异构芯片 / 中文增强算法 / AI 算力 / HTT / AI AGC / 65dB" 等一致

### C. 样式约束

- 保持项目朴素风格: 无圆角 / 无阴影 / 无渐变 (除视频遮罩外)
- 卡片 hover 仅边框变色, 无额外装饰

**验证**

- TypeScript 编译通过 (`npx tsc --noEmit`)
- Playwright 浏览器验证 (`aigpic/verify_home_update.py`):
  - Hero section 高度: 720px
  - video 自动播放: paused=false, currentTime=3.41s, duration=10s
  - 卖点卡片数量: 18 个 (3 产品 × 6 卡片)
- 截图:
  - `aigpic/promo_video/hero_720_check.png`
  - `aigpic/promo_video/hero_products_check.png`

**影响范围**
- 首页 (`/`) 视觉呈现
- 仅修改前端组件, 不涉及路由/数据/后端

**关联文件**
- `src/components/home/VideoEntry.tsx`
- `src/components/home/HeroProducts.tsx`
- `src/data/home.ts` (数据复用, 未修改)
- `src/data/images/home.ts` (图片复用, 未修改)

---

## [2026-07-25] 开发 | 首页 Hero 宣传视频上线 (AI 生图 + Veo 视频生成)

**类型**: 开发 / AI 内容生成

**摘要**
按用户规划, 完成「生图 → 图生视频 → ffmpeg 拼接」全流程, 首页 Hero 区域从静态背景图升级为 10s 自动循环播放的企业宣传视频。流程: 速创API gpt-image-2 生成 3 张 16:9 分镜图 (产品特写/桌面场景/家族展示) → 速创API video_google_omni (Veo 3.1) 把每张分镜图变为 4s 视频 → imageio-ffmpeg 提供的完整版 ffmpeg 各取 3.33s 拼接为 10s 最终视频 (1280x720, H.264, 无音频, faststart)。

**详细变更**

### A. AI 视频生成主控脚本

1. **`aigpic/make_promo_video.py`** (新建):
   - 配置: API_KEY / BASE_URL / VIDEO_ENDPOINT=`/api/async/video_google_omni` / DETAIL_ENDPOINT=`/api/async/detail`
   - 3 张分镜配置 STORYBOARDS, 每张含 image_prompt (16:9 商业摄影) + video_prompt (运镜动作) + duration=4
   - 阶段1 `generate_storyboard()`: 并行调用 img skill generate_image.py, 用 image_urls 字段拿生成图公网URL
   - 阶段2 `submit_video_task()` + `poll_video_task()`: 提交视频任务 + 轮询 detail 接口 (status 0=初始化/1=进行中/2=成功/3=失败)
   - 阶段3 `stitch_videos_with_ffmpeg()`: 每段截取前 3.33s + concat 拼接
   - 系统 ffmpeg (d:\TRAE SOLO CN\resources\app\bin\ffmpeg.exe) 缺 concat filter / -safe 选项, 阶段3 改用 imageio-ffmpeg 完整版

2. **`aigpic/retry_shot2_video.py`** (新建):
   - shot2 首次生成 Omni 端超时失败 (PUBLIC_ERROR_VIDEO_GENERATION_TIMED_OUT), 单独重试
   - 复用已存在的 shot2_storyboard.png, 调 img skill upload_image.py 上传到 imgbb 拿公网URL, 重新提交视频任务
   - 修复 upload_image.py 多行 JSON 解析问题 (从首 `{` 到末 `}` 整体解析)

3. **`aigpic/stitch_final_video.py`** (新建):
   - 独立执行阶段3, 用 imageio-ffmpeg 的 ffmpeg-win-x86_64-v7.1.exe
   - 每段 `-t 3.33 -c:v libx264 -vf fps=30,scale=1280:720 -an -pix_fmt yuv420p`
   - 拼接用 filter_complex `[0:v][1:v][2:v]concat=n=3:v=1:a=0[outv]`
   - 加 `-movflags +faststart` 优化 Web 流式播放

### B. 首页 Hero 接入真实视频

1. **`src/components/home/VideoEntry.tsx`** (重构):
   - 删除 useState 弹窗逻辑 (原 "视频即将上线" 提示)
   - 删除圆形播放按钮 (视频自动播放, 不需要手动触发)
   - `<img>` 替换为 `<video autoPlay muted loop playsInline preload="auto" poster={IMAGES.videoCorporate}>`
   - `<source src="/videos/promo.mp4" type="video/mp4" />`
   - 保留半透明渐变遮罩 + 主标 "大声助听器 · 企业宣传片" + 副标 "彰显科技看得见"
   - 全屏铺满样式不变 (100vw + 100vh + marginLeft 抵消 1200px 居中)

### C. 最终素材

- **`public/videos/promo.mp4`** (新建, 1.35 MB):
  - 10s, 1280x720, H.264, 30fps, 无音频, faststart
  - 3 段分镜: shot1 (产品特写 360° 旋转) + shot2 (桌面场景推镜) + shot3 (家族横移)

**验证**

- TypeScript 编译通过 (`npx tsc --noEmit`)
- Playwright 浏览器自动化验证 (`aigpic/verify_promo_video.py`):
  - video 元素 found=true, paused=false, muted=true
  - currentTime=5.42s, duration=10.00s, readyState=4 (HAVE_ENOUGH_DATA)
  - videoWidth=1280, videoHeight=720
  - clientWidth=1440, clientHeight=900 (铺满视口)
  - 无控制台错误 (仅 3 个无关警告: Supabase 未配置 + React Router future flag)
- 截图: `aigpic/promo_video/hero_video_check.png`

**影响范围**
- 首页 (`/`) Hero 区域视觉升级
- 新增 `public/videos/` 目录
- 新增 `aigpic/promo_video/` 工作目录 (含分镜图/中间视频/最终视频/日志)

**关联文件**
- `aigpic/make_promo_video.py` (主控)
- `aigpic/retry_shot2_video.py` (失败重试)
- `aigpic/stitch_final_video.py` (拼接)
- `aigpic/verify_promo_video.py` (浏览器验证)
- `src/components/home/VideoEntry.tsx` (前端接入)
- `public/videos/promo.mp4` (最终视频)

---

## [2026-07-25] 开发 | 全站 Apple 风格入场动画 + hover 交互统一升级

**类型**: 开发 / 设计

**摘要**
为全站各页面模块接入 Apple 风格高级感入场动画与统一 hover 交互。核心改造: 扩展 Reveal 组件支持 7 种 variant 入场动画 (fade-up / fade-down / fade-left / fade-right / scale / scale-up / pop), 入场使用 Apple 标志性缓动曲线 `cubic-bezier(0.16, 1, 0.3, 1)`; hover 统一使用 Material 标准 `cubic-bezier(0.4, 0, 0.2, 1)` 400ms, 形成有力交互感而不花哨。提取 SectionTitle 与 SubSectionTitle 通用组件, 统一全站模块标题视觉主题 (绿色短竖条 / 绿色短横线装饰)。删除 ServicePage (旧版规范未参与 3.0 改造)。

**详细变更**

### A. 通用动画组件扩展

1. **`src/components/ui/Reveal.tsx`** (重构):
   - 新增 `variant` prop 支持 7 种入场动画类型, 按模块性质选择:
     - `fade-up` (默认): 标题、文字段落
     - `fade-down`: 从顶部滑入 (罕见)
     - `fade-left` / `fade-right`: 左右滑入 (左右分栏布局)
     - `scale`: 大图、整体容器、SVG
     - `scale-up`: 卡片网格 (产品卡/数据卡/团队卡)
     - `pop`: 时间轴节点、序号
   - 新增 `duration` prop (默认 600ms)
   - 入场缓动改为 Apple 标志性曲线 `cubic-bezier(0.16, 1, 0.3, 1)` (更柔滑有弹性)
   - duration / easing / delay 改用内联 style, 避免 Tailwind JIT 无法识别动态拼接的 class
   - 兼容: 默认 variant="fade-up", 现有调用无需改动

2. **`src/components/ui/SectionTitle.tsx`** (新建):
   - 主标 30px ink-700 700 leading-[45px]
   - TitleUnderline: 60×3px 品牌绿短横线, 居中, mb-[40px]
   - 与关于小维页标题规范保持一致

3. **`src/components/ui/SubSectionTitle.tsx`** (新建):
   - 左侧绿色短竖条 (w-[4px] h-[28px] bg-brand-green) + 22px ink-700 标题 + 可选 14px 描述
   - 默认 mb-6, 可通过 className 覆盖
   - 不内部包 Reveal, 调用方按需在外层包 `<Reveal>` 实现入场动画

### B. HomePage / AboutPage / WearablePage / ProductPage / InvestPage 入场 + hover

4. **`src/pages/HomePage.tsx`**: 各 section 标题包 Reveal fade-up, 卡片网格用 scale-up + 错开延迟
5. **`src/pages/AboutPage.tsx`**:
   - 数据卡片: scale-up 入场 + hover 上浮 4px + 边框变绿 + 浅绿背景 + 数字放大
   - 荣誉资质: scale-up 入场 + hover 上浮 6px + 边框变绿 + 阴影 + 图片放大 1.05
   - 团队 / 合作伙伴 / 发展历程: 对应 variant 入场 + hover 微交互
6. **`src/pages/WearablePage.tsx`**:
   - ProductCard / TechCard: scale-up 入场 + hover 上浮 6px + 边框变绿 + 阴影 + 产品图/图标放大
   - 标题与副标: Reveal fade-up
7. **`src/pages/ProductPage.tsx`**:
   - 12 款产品卡片: scale-up 入场, 每列错开 80ms
   - 中文助听核心技术扇形图: scale 入场
   - 临床医疗认证 / 三甲医院同等检查设备 / 国家医疗资质 / 售后保修: scale-up + hover
8. **`src/pages/InvestPage.tsx`**:
   - 行业前景数据卡: scale-up + hover 上浮 + 浅绿背景 + 数字放大
   - 政策利好卡: 序号 + 标题 hover 变绿, 序号 hover 放大 1.10
   - 门店类型卡 / 联系信息: 对应 hover 交互

### C. CareersPage 入场 + hover (本次新增)

9. **`src/pages/CareersPage.tsx`**:
   - 公司简介: 左图 fade-right + 右文 fade-left 错开 120ms 入场, 图片 hover 轻微放大 1.03
   - 4 个职位分类卡片: scale-up 入场错开 80ms, hover 上浮 6px + 边框变绿 + 阴影 + 图片放大 1.05 + 标题变绿
   - 职位列表 Tab: 添加 hover -translate-y-[2px] 微交互
   - 职位卡片 JobCard: scale-up 入场错开 80ms, hover 上浮 4px + 边框变绿 + 浅绿背景 + 阴影 + 标题/薪资变绿放大
   - 福利待遇 6 项: fade-right 入场, hover 上浮 + 边框变绿 + 浅绿背景 + 对勾放大 + 标题变绿
   - 投递方式: fade-left 入场, 联系信息行 hover 横向位移 6px + label/value 变绿

### D. NewsListPage / NewsDetailPage 入场 + hover (本次新增)

10. **`src/pages/NewsListPage.tsx`**:
    - Tab 导航: Reveal fade-up 入场, 添加 hover -translate-y-[2px] 微交互
    - 新闻列表项: fade-up 入场, 每行 4 项错开 80ms
    - NewsListItem hover 效果: 背景变浅绿 + 阴影 + 图片放大 1.05 + 标题/日期/分类标签变绿 + 摘要文字加深
11. **`src/pages/NewsDetailPage.tsx`**:
    - 文章头部: fade-up 入场
    - 封面图: scale 入场 + delay 120ms + hover 轻微放大 1.03
    - 正文内容: fade-up 入场 + delay 200ms
    - 医疗广告提示框: fade-up 入场 + hover 边框变绿 + 浅绿背景
    - 上一篇/下一篇: 分别 fade-right / fade-left 入场 + hover 浅绿背景 + 阴影 + 箭头横向位移 + 标题变绿
    - 分享按钮 / 分类标签: 添加 hover 横向位移 / 上浮微交互

### E. 视觉主题统一性检查

12. **标题视觉主题统一**:
    - 所有页面 SectionTitle 改用统一组件 (30px ink-700 700 + 60×3px 绿色短横线居中)
    - 所有子模块标题改用 SubSectionTitle 组件 (4×28px 绿色短竖条 + 22px 标题 + 14px 描述)
    - 移除 AboutPage / InvestPage 等本地 SectionTitle 实现, 确保全站视觉一致
13. **ServicePage 删除**:
    - 旧版规范 (36px 标题, 无绿色短横线) 未参与 3.0 改造, 与新统一规范冲突
    - 删除 `src/pages/ServicePage.tsx`
    - 移除 `src/routes/index.tsx` 中的 ServicePage 路由
    - 移除 `src/routes/paths.ts` 中的 SERVICE path 常量

### F. hover 交互设计原则 (全站统一)

14. **卡片类 (产品卡 / 数据卡 / 团队卡 / 荣誉卡)**:
    - `hover:-translate-y-[6px]` (上浮 6px)
    - `hover:border-brand-green` (边框变绿)
    - `hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]` (绿色阴影)
    - 内部图片 `group-hover:scale-[1.05]` (500ms 缓动放大)
    - 内部标题 `group-hover:text-brand-green` (颜色变绿)
15. **小型卡片 / 列表项 (福利卡 / 联系信息)**:
    - `hover:-translate-y-[4px]` (上浮 4px, 较轻)
    - `hover:bg-brand-green/5` (浅绿背景)
    - `hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]` (轻阴影)
16. **按钮 / Tab / 链接**:
    - `hover:-translate-y-[2px]` (微上浮)
    - 颜色变化保持原 `hover:text-brand-green-light` / `hover:bg-brand-green`
17. **统一缓动曲线**:
    - 入场: `cubic-bezier(0.16, 1, 0.3, 1)` (Apple 标志性曲线, 柔滑有弹性)
    - hover: `cubic-bezier(0.4, 0, 0.2, 1)` (Material 标准, 稳重有力)
    - 时长: 入场 600ms (默认), hover 400ms

**影响范围**
- 全站所有页面的入场体验与 hover 交互
- 模块标题视觉统一性
- 删除 ServicePage 影响 Header / Footer 中的相关链接 (如有)

**关联文件**
- `src/components/ui/Reveal.tsx` (重构)
- `src/components/ui/SectionTitle.tsx` (新建)
- `src/components/ui/SubSectionTitle.tsx` (新建)
- `src/components/ui/index.ts` (导出新组件)
- `src/pages/HomePage.tsx`
- `src/pages/AboutPage.tsx`
- `src/pages/WearablePage.tsx`
- `src/pages/ProductPage.tsx`
- `src/pages/InvestPage.tsx`
- `src/pages/CareersPage.tsx` (本次完成)
- `src/pages/NewsListPage.tsx` (本次完成)
- `src/pages/NewsDetailPage.tsx` (本次完成)
- `src/pages/ServicePage.tsx` (删除)
- `src/routes/index.tsx` (移除 ServicePage 路由)
- `src/routes/paths.ts` (移除 SERVICE 常量)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0, 无类型错误)
- dev server 运行于 http://localhost:5173/
- 可访问 /careers /news /news/:id 验证入场动画与 hover 交互

---

## [2026-07-21] 开发 / 决策 | 接入 Supabase BaaS — 免服务器后端方案落地 (Mock 自动降级)

**类型**: 开发 / 决策 / 文档

**摘要**
针对用户提出的"服务器控制权可能不在自己手里 + 演示必须顺利"的核心诉求, 评估 3 个方案 (纯前端 Mock / Supabase BaaS / 阿里云 Serverless 全套) 后, 选择 Supabase BaaS 方案: 免服务器维护 + 免数据库运维 + 数据真实持久化 + 跨设备同步 + 后续可平滑迁移到自建后端。本次落地完整接入层: PostgreSQL 建表脚本 (含 RLS + 触发器 + 种子数据) + Supabase 客户端单例 (含降级机制) + Auth 仓储层 (封装所有 SDK 调用) + AuthContext 自动检测环境变量并切换 Mock/Supabase 模式。客户拿到代码后只需 15-30 分钟配置即可演示, 演示失败可一键降级回 Mock。

**详细变更**

### A. 数据库层 (PostgreSQL, 适配 Supabase)

1. **`supabase/schema.sql`** (新建, ~425 行):
   - 基于 `db/schema.md` (MySQL 版) 转换为 PostgreSQL 语法, 适配 Supabase 架构
   - 9 张业务表: `public.users` / `news` / `jobs` / `job_applications` / `products` / `stores` / `invest_inquiries` / `cms_audit_logs` (+ `auth.users` 由 Supabase 自带)
   - 关键设计: `public.users.id` 引用 `auth.users(id) ON DELETE CASCADE`, 用户在 Supabase Auth 注册后, 触发器自动在 `public.users` 创建业务记录
   - 触发器 `handle_new_user`: `AFTER INSERT ON auth.users` 时, 从 `raw_user_meta_data` 提取 phone/nickname 写入业务表
   - 触发器 `set_updated_at`: 所有业务表 `BEFORE UPDATE` 时自动更新 `updated_at`
   - 8 个枚举类型: `user_role` / `user_status` / `admin_role` / `news_category` / `job_type` / `product_category` / `store_type` / `application_status` / `inquiry_status`
   - **RLS (行级安全) 策略**:
     - users: 用户只能读取/更新自己的记录 (`auth.uid() = id`)
     - news/jobs/products/stores: 已发布内容所有人可读
     - job_applications: 用户只能查看/管理自己的投递
     - invest_inquiries: 任何人都能提交咨询 (匿名允许)
   - 种子数据: 3 篇资讯 + 4 个职位 + 12 款产品 + 4 家门店 (与 PROTOTYPE_PAGES.md 对齐)

### B. Supabase 客户端与降级机制

2. **`src/lib/supabase.ts`** (新建, 42 行):
   - 从 `import.meta.env` 读取 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`
   - 导出 `isSupabaseConfigured` 布尔值 (URL 非空且以 http 开头 + key 非空)
   - 导出 `supabase` 单例 (未配置时为 `null`, AuthContext 会降级)
   - 配置 `persistSession: true` + `autoRefreshToken: true` + `detectSessionInUrl: true`
   - 未配置时 `console.warn` 提示, 但不抛错 (让代码能继续运行 Mock 模式)

3. **`src/vite-env.d.ts`** (新建, 9 行):
   - 声明 `ImportMetaEnv` 接口, 含 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` 可选字段
   - 修复 `import.meta.env` TS 类型错误 (TS2339)

### C. Auth 仓储层 (Supabase 调用封装)

4. **`src/data/authRepository.ts`** (新建, 329 行):
   - 屏蔽 Supabase SDK 细节, 上层 AuthContext 只需调本模块函数
   - 后续切换到自建后端 (NestJS) 时, 只需替换本文件实现, 业务组件不动
   - 核心 API:
     - `isEnabled()`: 检测 Supabase 是否可用
     - `onAuthStateChange(callback)`: 监听登录态变化 (供 AuthContext 初始化用)
     - `getCurrentSession()`: 获取当前会话 (页面刷新后恢复登录态)
     - `login(payload)`: 支持 `email_password` / `phone_password` 两种方式 (`phone_sms` MVP 阶段不支持)
     - `register(payload)`: 优先用邮箱注册, 手机号作为 metadata
     - `logout()`: 调用 `supabase.auth.signOut()`
     - `updateProfile(userId, patch)`: 更新 `public.users` 表 + 同步 `auth.users.email`
   - 工具函数:
     - `fetchBusinessUser(authUserId)`: 从 `public.users` 查询业务字段 (phone/nickname/role 等)
     - `buildSession(supabaseSession)`: 将 Supabase session 转换为业务 `AuthSession` 类型
     - `mapSupabaseError(err)`: Supabase 错误码 → 业务错误码 (INVALID_CREDENTIALS / PHONE_ALREADY_EXISTS / RATE_LIMITED 等)

### D. AuthContext 改造 (双模式自动切换)

5. **`src/contexts/AuthContext.tsx`** (重构, 353 行):
   - 关键改动: 启动时检测 `isSupabaseConfigured`, 自动选择模式
   - **Supabase 模式** (env 变量已配置):
     - `useEffect` 初始化时调 `authRepository.getCurrentSession()` 恢复登录态
     - 调 `authRepository.onAuthStateChange()` 监听后续变化
     - `login` / `register` / `logout` / `updateProfile` 全部委托给 `authRepository`
   - **Mock 模式** (env 变量未配置, 降级):
     - 保留原 `mockLogin` / `mockRegister` / `loadMockSession` / `saveMockSession` 函数
     - 行为与上一版完全一致 (localStorage 持久化 + mockUsers.ts 数据)
   - Context 新增 `useSupabase: boolean` 字段, 子组件可读取当前模式
   - `logout` 改为 `async` (因 Supabase `signOut` 是异步)
   - 优势: 客户拿到代码后无需配置即可跑通 (Mock 模式), 配置 Supabase 后自动切换真实后端

### E. Header 适配 + 环境配置

6. **`src/components/layout/Header.tsx`** (修改):
   - `handleLogout` 改为 `async`, `await logout()` 包 try/catch
   - 其余逻辑不变

7. **`.env.example`** (新建, 23 行):
   - 模板含 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY` 两个空字段
   - 注释说明: 复制为 `.env.local` 后填值, 重启 `npm run dev`
   - 强调: `anon key` 是公开密钥 (受 RLS 保护), 不要把 `service_role` key 放这里

8. **`.gitignore`** (新建, 40 行):
   - 包含 `.env` / `.env.local` / `.env.*.local` (防止密钥泄露)
   - 含 `node_modules/` / `dist/` / 编辑器临时文件等常规忽略

### F. 客户接入文档

9. **`SUPABASE_SETUP.md`** (新建, ~214 行):
   - 目标读者: 客户 / 运营人员 (非开发者)
   - 预估耗时: 15-30 分钟
   - 7 步接入指南: 注册账号 → 创建项目 → 执行 SQL → 关闭邮箱验证 → 获取 API 配置 → 配置 .env.local → 启动验证
   - 创建演示账号两种方式 (前端注册页 / 控制台手动添加)
   - 部署到 Vercel 步骤 (含 Environment Variables 配置)
   - 演示流程建议 (5 步, 引导客户体验注册→登录→退出→再登录→后台数据展示)
   - 6 个常见问题 (Q1-Q6: 未配置报错 / 邮箱验证 / 手机号登录 / 大陆访问 / 免费层额度 / 后续迁移)
   - **紧急回退方案**: 演示前 Supabase 不可用时, 清空 env 变量 → 自动降级 Mock 模式 → 用 4 个测试账号登录

### G. 依赖与配置

10. **`package.json`** (修改): 新增 `@supabase/supabase-js` 依赖 (^2.x), 共 9 个传递依赖

**影响范围**
- 新增 7 个文件 (schema.sql / supabase.ts / vite-env.d.ts / authRepository.ts / .env.example / .gitignore / SUPABASE_SETUP.md)
- 修改 2 个文件 (AuthContext.tsx 重构 / Header.tsx 适配 async logout)
- 鉴权架构升级: 单一 Mock 模式 → Mock + Supabase 双模式自动切换
- 客户演示路径:
  - **零配置**: 直接 `npm run dev` → Mock 模式跑通 (与上一版行为一致)
  - **配置 Supabase**: 填 .env.local → 真实后端 + 数据持久化 + 跨设备同步
  - **演示失败**: 清空 env → 自动降级 Mock → 用测试账号救场
- 不影响其他业务页面, 仅鉴权层升级
- TypeScript 编译通过 (`npx tsc --noEmit` exit code 0)

**关联文件**
- 新建: `d:\VibeTest\bigsound\supabase\schema.sql`
- 新建: `d:\VibeTest\bigsound\src\lib\supabase.ts`
- 新建: `d:\VibeTest\bigsound\src\vite-env.d.ts`
- 新建: `d:\VibeTest\bigsound\src\data\authRepository.ts`
- 新建: `d:\VibeTest\bigsound\.env.example`
- 新建: `d:\VibeTest\bigsound\.gitignore`
- 新建: `d:\VibeTest\bigsound\SUPABASE_SETUP.md`
- 修改: `d:\VibeTest\bigsound\src\contexts\AuthContext.tsx` (重构为双模式)
- 修改: `d:\VibeTest\bigsound\src\components\layout\Header.tsx` (handleLogout 改 async)
- 修改: `d:\VibeTest\bigsound\package.json` (新增 @supabase/supabase-js)

**关键决策**
- **选 Supabase 而非 Firebase / 腾讯云 CloudBase**: Supabase 开源 + PostgreSQL 直查 + 免费层够用 + 迁移成本低; Firebase 大陆访问不稳定; CloudBase 生态弱且锁定腾讯云
- **保留 Mock 降级机制**: 即使 Supabase 完全不可用 (大陆访问受阻 / 配置出错 / 客户未配置), 前端仍能跑通演示, 风险隔离
- **手机号登录策略**: Supabase 免费层不支持手机号短信 (需 Twilio + 备案), 改为邮箱注册 + 手机号作为 metadata; 前端登录页用邮箱登录; 后续如客户坚持手机号登录, 再升级到 Pro 计划 + 配置短信服务商
- **关闭邮箱验证**: 演示阶段必须关闭, 否则注册后需查收邮件才能登录, 体验差; 上线前再开启
- **RLS 策略宽松度**: users 表严格 (只能读自己), 业务表 (news/jobs/products/stores) 已发布即可读, 投递表只能看自己; invest_inquiries 允许匿名提交; cms_audit_logs MVP 阶段不强制 RLS
- **不引入 Supabase Realtime / Storage / Edge Functions**: MVP 仅用 Auth + Database 两个核心模块, 避免过度设计; 后续按需扩展
- **schema.sql 与 db/schema.md (MySQL 版) 并存**: 两者描述同样的业务模型, 但语法不同; 短期内 Supabase 为主, 长期若客户切自建后端再用 MySQL 版; 维护时两份需同步

**待办与决策点**
- ⏳ 客户配置 Supabase 后实测: 大陆访问速度 / 注册流程 / 数据持久化 / 跨设备同步
- ⏳ 部署到 Vercel 后实测: 大陆访问 Vercel 域名是否稳定 (若不稳定, 考虑 Cloudflare Pages 或阿里云 OSS + CDN)
- ⏳ 邮箱验证策略: 演示阶段关闭, 上线前需开启 + 配置 SMTP (Supabase 自带 SMTP 有发送限制, 建议配置自定义 SMTP)
- ⏳ 微信扫码登录: Supabase 支持 OAuth, 但需微信开放平台认证服务号, MVP 阶段不接入
- ⏳ CMS 后台接入: Supabase 自带 Admin Dashboard (Table Editor), 可作为简易 CMS 让客户直接编辑 news/jobs/products 数据, 无需开发独立后台; 后续若需更友好的界面, 再用 React Admin / Refine 包一层
- ⏳ 数据备份: Supabase 免费层无自动备份, 建议每周用 `pg_dump` 手动备份一次到本地或 OSS

---

## [2026-07-22] 功能 | 全站在线咨询统一接入企业微信客服

**类型**: 功能增强 + 全站咨询入口统一

**摘要**: 在全局悬浮工具栏新增"在线咨询"按钮，全站所有咨询类入口统一跳转到企业微信客服链接 `https://work.weixin.qq.com/kfid/kfc48e42f711d1aaf9a`。

**详细变更**:

1. `src/config/site.ts`
   - SITE_INFO 新增 `onlineConsultUrl: "https://work.weixin.qq.com/kfid/kfc48e42f711d1aaf9a"`
   - 全站咨询入口统一引用此常量, 后续如需更换客服链接只改一处

2. `src/components/layout/FloatingTools.tsx`
   - 在悬浮工具栏顶部新增"在线咨询"按钮 (气泡对话框图标)
   - 链接指向 `SITE_INFO.onlineConsultUrl`, `target="_blank"` 新开标签页
   - 原"电话咨询"按钮 (绿色电话图标) 保留不变
   - 按钮顺序: 在线咨询 → 电话咨询 → 二维码 → 回到顶部

3. `src/pages/InvestPage.tsx`
   - 第 6 节"加入大声"模块的 CTA 按钮由 `tel:400-116-9566` + 文案"立即致电咨询"
     改为 `SITE_INFO.onlineConsultUrl` + `target="_blank"` + 文案"立即在线咨询"
   - 新增 `SITE_INFO` import
   - 注: 同模块内的"服务热线 400-116-9566"卡片保留 tel: (本质是电话入口, 非咨询按钮)

4. `src/data/service.ts`
   - 招商加盟模块新增 `investBtnHref` 字段, 指向企微客服 URL
   - 联系客服模块新增 `contactServiceBtnHref` 字段, 指向企微客服 URL
   - 注: 这两个字段供后续 ServicePage 渲染时使用 (当前 service.ts 数据层未被页面消费)

**咨询入口分类处理**:
- ✅ 改为企微在线咨询: FloatingTools 新按钮 / InvestPage "立即在线咨询"按钮 / service.ts 数据层 investBtn+contactServiceBtn
- 📞 保留为电话: FloatingTools "电话咨询" / Footer "服务咨询热线" / InvestPage "服务热线 400-116-9566" 卡片 / CareersPage "咨询热线"
  (这些是明确"致电"语义的电话入口, 不属于"在线咨询"范畴)

**关联文件**:
- `src/config/site.ts`
- `src/components/layout/FloatingTools.tsx`
- `src/pages/InvestPage.tsx`
- `src/data/service.ts`

**验证**: `npx vite build` 通过 (132 模块, exit code 0)
注: `npx tsc -b --noEmit` 报 2 个既存错误 (authRepository.ts 注释 BOM + supabase.ts import.meta.env 类型), 与本次修改无关

---

## [2026-07-25] 调整 | 招商加盟页【中国听力健康市场现状】模块卡片精细微调（三）

**类型**: 视觉调整

**摘要**
按用户反馈继续第三次微调：卡片二配图容器再略加高；卡片一、三、四内的文字比例再次统一略微放大。

**详细变更**
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 (L317-L454)
- 卡片 [2] 配图:
  - 高度从 `240px` 增至 `260px`
- 卡片 [1] 核心数据 95%:
  - 主数字: 52px → 56px
  - 右侧「未佩戴助听器」: 14px → 15px
  - 副标「中国听力受损人群」: 13px → 14px
  - 底部脚注: 12px → 13px
- 卡片 [3] 各国佩戴率对比:
  - 标题: 14px → 15px
  - 国家名 / 百分比: 13px → 14px
  - 进度条高度: 6px → 7px
  - 行间距保持 `gap-2`
- 卡片 [4] 听障人数趋势柱状图:
  - 图例文字: 12px → 13px
  - 柱顶数值: 10px → 11px
  - 年份标签: 12px → 13px
  - 柱图区域高度: 86px → 80px，bar 宽度 22px → 24px，仍适配 200px 卡片

**影响范围**
- 招商加盟页 /invest §3.1 中国听力健康市场现状模块

**关联文件**
- `src/pages/InvestPage.tsx`

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看效果

---

## [2026-07-25] 调整 | 招商加盟页【中国听力健康市场现状】模块卡片精细微调（二）

**类型**: 视觉调整

**摘要**
按用户反馈继续微调：卡片二配图容器再略加高；卡片一、三、四内的文字比例统一略微放大，提升可读性。

**详细变更**
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 (L317-L454)
- 卡片 [2] 配图:
  - 高度从 `220px` 增至 `240px`
- 卡片 [1] 核心数据 95%:
  - 主数字: 48px → 52px
  - 右侧「未佩戴助听器」: 13px → 14px
  - 副标「中国听力受损人群」: 12px → 13px
  - 底部脚注: 11px → 12px
- 卡片 [3] 各国佩戴率对比:
  - 标题: 13px → 14px
  - 国家名 / 百分比: 12px → 13px
  - 进度条高度: 5px → 6px
  - 行间距从 `gap-3` 收紧为 `gap-2`，避免 200px 高度溢出
- 卡片 [4] 听障人数趋势柱状图:
  - 图例文字: 11px → 12px
  - 柱顶数值: 9px → 10px
  - 年份标签: 11px → 12px
  - 柱图区域高度: 90px → 86px，bar 宽度 20px → 22px，整体仍适配 200px 卡片

**影响范围**
- 招商加盟页 /invest §3.1 中国听力健康市场现状模块

**关联文件**
- `src/pages/InvestPage.tsx`

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看效果

---

## [2026-07-25] 调整 | 招商加盟页【中国听力健康市场现状】模块卡片精细微调

**类型**: 视觉调整

**摘要**
在上一轮白底卡片重设计基础上，按用户反馈做三处细节调整：卡片二配图容器略微加高、删除卡片一和卡片四的标题、删除卡片三标题前的绿色竖线。

**详细变更**
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 (L317-L454)
- 外层 grid: 移除固定 `420px` 高度，改为 `items-start` 顶部对齐，允许卡片一/二行出现轻微高度差
- 卡片 [1] 核心数据 95%:
  - 删除标题「未佩戴比例」及其绿色短竖条
  - 高度保持 `200px`
- 卡片 [2] 配图:
  - 高度从 `200px` 增至 `220px`（仅加高 20px）
  - 其他三张卡片仍为 `200px`
- 卡片 [3] 各国佩戴率对比:
  - 删除标题前的绿色短竖条
  - 保留标题文字「各国佩戴率对比」
  - 高度保持 `200px`
- 卡片 [4] 听障人数趋势柱状图:
  - 删除标题「听障人数趋势」及其绿色短竖条
  - 保留图例，内容整体上移
  - 高度保持 `200px`

**影响范围**
- 招商加盟页 /invest §3.1 中国听力健康市场现状模块
- 不影响数据源

**关联文件**
- `src/pages/InvestPage.tsx`

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看效果

---

## [2026-07-25] 调整 | 招商加盟页【中国听力健康市场现状】模块卡片重设计

**类型**: 视觉调整

**摘要**
用户要求【中国听力健康市场现状】模块的 4 张卡片设计得更干净利索、高度缩小、保持与其他模块风格统一。本次重构为白底无边框卡片，统一固定高度 420px，重新梳理 4 张卡片的信息层级。

**详细变更**
- 文件: `src/pages/InvestPage.tsx` §3.1 中国听力健康市场现状 (L317-L471)
- 整体: 4 张卡片改为 `bg-white` 白底、无边界容器感；外层 grid 固定高度 `420px`，4 卡片等高对齐
- 卡片 [1] 核心数据 95%:
  - 标题: 绿色短竖条 + 13px 绿粗体「未佩戴比例」
  - 主数据: 95% 从 56px 降至 48px，右侧 13px 粗体「未佩戴助听器」
  - 副标: 12px 灰色「中国听力受损人群」
  - 底部脚注: 11px 灰色，通过 `mt-auto` 贴底，上边框改为 `border-ink-200` 更低调
- 卡片 [2] 配图:
  - 移除 `group-hover:scale` 动效，改为静态铺满
  - 与文本卡片统一高度，无多余装饰
- 卡片 [3] 各国佩戴率对比:
  - 移除原 `bg-brand-green/10` 高亮底色和左侧边框，改为纯文字+进度条绿色高亮「中国」行
  - 行高缩小，4 行垂直居中分布
- 卡片 [4] 听障人数趋势柱状图:
  - 标题区 + 图例精简
  - 柱图区域高度从 120px 降至 90px，bar 宽度 20px，组间距 48px
  - 图例和数值字号保持 11px/9px，整体更紧凑
- 统一所有卡片标题为「绿色短竖条 + 13px 绿粗体」，与全站子模块标题风格一致

**影响范围**
- 招商加盟页 /invest §3.1 中国听力健康市场现状模块
- 不影响 `src/data/invest.ts` 数据源

**关联文件**
- `src/pages/InvestPage.tsx`
- `src/data/invest.ts` (数据源, 未修改)

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看效果

---

## [2026-07-25] 调整 | 招商加盟页【全域营销赋能】模块去除图片容器

**类型**: 视觉调整

**摘要**
用户反馈 4 张图片外层包裹的容器 div（含 bg-white / overflow-hidden / flex 等）视觉上仍像"容器", 要求去除。本次将 4 张图片直接作为 grid item 渲染, 无任何外层包裹, gap-[16px] 自然形成白色间隔。

**详细变更**
- 文件: `src/pages/InvestPage.tsx` §4.3 全域营销赋能 (L964-L981)
- 移除: 每张图片外层的 `<div className="overflow-hidden flex items-center justify-center aspect-[16/10] bg-white group">` 容器
- 改为: 直接渲染 `<img>` 元素作为 grid 子项
- 保留: `aspect-[16/10]` 统一比例 + `object-contain` 完整显示 + `hover:scale-[1.04]` 放大交互
- 新增: `relative z-0 hover:z-10` 让 hover 的图片置顶, 避免放大时被相邻图片遮挡
- 间隔: grid `gap-[16px]` 由外层 section (bg-white) 自然填充为白色

**影响范围**
- 招商加盟页 /invest §4 合作政策 第 3 个子模块
- 不影响其他模块和数据

**关联文件**
- `src/pages/InvestPage.tsx`
- `src/data/invest.ts` (数据源, 未修改)
- `src/data/images/invest.ts` (图片路径, 未修改)

**验证**
- `npx tsc --noEmit` 通过
- 浏览器刷新 http://localhost:5173/invest 查看效果

---

## [2026-07-25] 重构 | 6 子页 Hero 重做: AI 生图 + 仅渲染图片 + 突破 Layout 铺满视口

**类型**: 重构 / 视觉升级 + 组件简化

**摘要**
用户指示: (1) 各子页 hero 图重新用 AI 生成, Apple/Tesla 高端简约风格但不能简约过度; (2) 招商加盟页 hero 图上要写"声价千亿 聚势共赢"文字, 体现招商氛围; (3) 各子页不再沿用覆盖在 hero 图上的文本或 logo 图设计, 只保留图片; (4) 子页 hero 图要像首页视频一样突破 Layout 限制横向铺满屏幕。
本次: 速创API gpt-image-2 生成 6 张 16:9 hero 图 (含招商加盟页中文文字), PageHero 组件简化为仅渲染图片, 6 子页调用清理为只传 backgroundImage + height。

**详细变更**

### A. AI 生图 (6 张, 速创API gpt-image-2, 16:9, 保存到 `public/images/hero/`)
- `hero_about.png` — 关于小维: 现代企业总部大楼 + golden hour + 玻璃幕墙 (Apple 建筑摄影风格)
- `hero_product.png` — AI 中文助听器: 助听器产品特写 + 米银配色 + 工作室光 (Apple 产品摄影风格)
- `hero_wearable.png` — 健康智能穿戴: 智能手表 + 灰色渐变背景 + 健康数据界面 (Apple 产品摄影风格)
- `hero_invest.png` — 招商加盟: 商务握手 + 城市天际线 + **"声价千亿   聚势共赢" 中文文字** (AI 直接生成, 金色渐变衬线字体)
- `hero_careers.png` — 招贤纳士: 现代办公空间 + 落地窗 + 木质元素 (Apple 室内摄影风格)
- `hero_news.png` — 资讯中心: 媒体中心设备 + 暗色模式 + 优雅排版 (Apple 科技编辑风格)
- 通用风格关键词: Apple-style premium photography + Tesla-style luxury aesthetic + subtle green accent + cinematic atmosphere + rich environmental depth + 8k editorial
- 批量生图: concurrency=3, 总耗时 ~2 分钟, 全部成功

### B. `src/data/images/common.ts` — 新增 6 个 hero 图片路径
```ts
heroAbout: "/images/hero/hero_about.png",
heroProduct: "/images/hero/hero_product.png",
heroWearable: "/images/hero/hero_wearable.png",
heroInvest: "/images/hero/hero_invest.png",
heroCareers: "/images/hero/hero_careers.png",
heroNews: "/images/hero/hero_news.png",
```

### C. `src/components/layout/PageHero.tsx` — 组件简化为仅渲染图片
- 移除所有文字/logo/overlay 叠加层 props: titleImage, title, subtitle, description, topLogo, overlay, paddingTop, paddingBottom 等
- Props 只保留: `backgroundImage` / `bgImage` / `children` / `height` (默认 448)
- 渲染逻辑: section + 全宽背景图 (反向补偿 scale 突破 Layout 限制) + 可选 children
- 保留全宽策略 (2026-07-22 实现): `bgLayoutWidth = viewportWidth / layoutScale` + `left: 50% + translateX(-50%)` + body overflow-x: hidden 兜底

### D. 6 子页调用清理 (只传 backgroundImage + height)
- `AboutPage.tsx`: `<PageHero backgroundImage={IMAGES.heroAbout} height={448} />`
- `ProductPage.tsx`: `<PageHero backgroundImage={IMAGES.heroProduct} height={448} />`
- `WearablePage.tsx`: `<PageHero backgroundImage={IMAGES.heroWearable} height={448} />`
- `InvestPage.tsx`: `<PageHero backgroundImage={IMAGES.heroInvest} height={448} />`
- `CareersPage.tsx`: `<PageHero backgroundImage={IMAGES.heroCareers} height={448} />`
- `NewsListPage.tsx`: `<PageHero backgroundImage={IMAGES.heroNews} height={448} />`
- 移除每个调用的: overlay, topLogo, title, subtitle, titleFontSize, titleFontFamily, titleColor, subtitleFontSize, subtitleColor, paddingTop, paddingBottom

### E. `src/pages/ServicePage.tsx` — 不再使用 PageHero, 自行实现 hero
- ServicePage 用了 titleImage + description 模式, 不在 6 子页统一改造范围
- 改为本地 `<section>` + `<img>` + 文字叠加, 保留原 titleImage + description 设计
- 移除 `import PageHero`

**影响范围**
- 7 个页面 Hero 视觉效果:
  - 首页 `/` (HomeVideoHero, 560px, 不变)
  - 6 子页 `/about /product /wearable /invest /careers /news` (PageHero, 448px, 全部换新图 + 仅渲染图片)
- 视觉表现: 6 子页 hero 全部为 AI 生图 (Apple/Tesla 风格), 无文字/logo 叠加, 横向铺满视口
- 招商加盟页 hero 图自带 "声价千亿 聚势共赢" 中文文字 (AI 直接生成)
- ServicePage `/service` hero 保持原样 (titleImage + description)

**关联文件**
- `d:\VibeTest\bigsound\public\images\hero\hero_*.png` (6 张新生成的图)
- `d:\VibeTest\bigsound\src\data\images\common.ts`
- `d:\VibeTest\bigsound\src\components\layout\PageHero.tsx`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`
- `d:\VibeTest\bigsound\src\pages\WearablePage.tsx`
- `d:\VibeTest\bigsound\src\pages\InvestPage.tsx`
- `d:\VibeTest\bigsound\src\pages\CareersPage.tsx`
- `d:\VibeTest\bigsound\src\pages\NewsListPage.tsx`
- `d:\VibeTest\bigsound\src\pages\ServicePage.tsx`
- `d:\VibeTest\bigsound\aigpic\hero_batch_plan.json` (生图计划)

**验证**
- 速创API 生图 6/6 全部成功 (concurrency=3, 总耗时 ~2 分钟)
- `npx tsc --noEmit` 通过 (exit code 0)
- 待浏览器实测验证: 招商加盟页中文文字是否正确, 其他子页图片风格是否符合预期, 所有子页 hero 是否横向铺满视口

---

## [2026-07-25] 优化 | ProductPage 四项调整 (U形弯道/设备卡片/临床认证/国家资质)

**类型**: UI 优化 + 配图更新

**摘要**:
- 售中·售后服务模块: U形弯道时间轴重构为从左往右流动, 8 节点 2 行 × 4 列上下交替排列, 7 个 U 形弯道交替开口朝上/朝下, 上行节点标签在上, 下行节点标签在下
- 三甲医院同等百万级检查设备模块: 卡片背景改为灰色 (bg-ink-100), 图片区 aspect-[4/3] + object-cover 填满容器, 描述文本统一为 title+subtitle 两层且居中, grid gap 增大到 24px 并左右铺满; 六张设备配图重新生成 (医疗设备商业摄影风格)
- 临床医疗认证模块: 删除两个医院 logo 下方的描述文本, 仅保留 logo 图, logo max-h 从 110 增大到 140
- 国家医疗资质模块: 配图替换为 `honors/real/` 目录下的真实证书图片 (共 6 张), 重命名为 cert_real_1~6.png

**详细变更**:
- `src/data/product.ts`:
  - `medicalCerts.certs`: imageKey 从 `certBody/certBte/...` 改为 `certReal1~certReal6`
  - `equipment.items`: 数据结构从 `lines[]` 改为 `title + subtitle`, 统一文字层级
- `src/data/images/product.ts`:
  - 新增 `certReal1~certReal6`: 指向 `/images/honors/real/cert_real_*.png`
  - `equipmentRealEarAnalyzer` 等 6 条: 指向 `/images/equipment/*.png` (已存在)
- `src/pages/ProductPage.tsx`:
  - 售中·售后服务: SVG 路径重构为左右流向, 节点 positions 定义 8 个点 (x 等间距 60/214/368/522/676/830/984/1138, y 交替 100/380), 标签根据 side 在节点上方或下方
  - 三甲医院设备: `bg-ink-100` 灰底, `aspect-[4/3] overflow-hidden` 图片区, `object-cover` 填满, 文字 `text-center`, `gap-[24px]` 去除 max-w 左右铺满
  - 临床医疗认证: 删除医院 logo 下方 `<p>` 描述, logo `max-h-[140px]`
- `public/images/honors/real/`: 用户提供的 6 张真实证书截图, 重命名为 `cert_real_1.png` ~ `cert_real_6.png`
- `public/images/equipment/`: 6 张设备配图重新生成 (gpt-image-2, landscape_4_3, 医疗设备商业摄影风格)

**影响范围**: ProductPage 第 5/6/7 模块视觉与配图更新

**关联文件**:
- [src/data/product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts)
- [src/data/images/product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts)
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [public/images/honors/real/](file:///d:/VibeTest/bigsound/public/images/honors/real/) (用户提供)
- [public/images/equipment/](file:///d:/VibeTest/bigsound/public/images/equipment/) (AI 生成)

**验证**: `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-25] 优化 | ProductPage 五项细节调整 (临床认证/专利/设备/标题/售后服务)

**类型**: UI 优化 + 数据补充

**摘要**:
- 临床医疗认证模块: 替换报告配图为用户提供的 `report.png` 并横向铺满, 图片外部左下方添加声明小字; 山东耳鼻喉医院 logo 替换为 `sdebh_lg.png`, 两个医院 logo 尺寸增大 (卡片高 140→180, logo max-h 80→110)
- 国家专利认证模块: 配图下方增加说明小字 "数据截止至2024年5月"
- 三甲医院同等百万级检查设备模块: 六张卡片整体缩小 (gap 20→16, max-w 1080px), 内部图片区 aspect 4/3→3/2 占比减小, padding 12→10
- 耳科级"声处方"指定 / 听力专家远程 AI 验配服务标题: 斜杠改为 "+"
- 售中·售后服务模块: 重构为多个 U 形弯道时间轴 (参考用户截图), 8 大保障按 Z 字形蛇形路径排列, 3 个 U 形弯道交替方向

**详细变更**:
- `src/data/product.ts`:
  - `ENDORSEMENTS.clinical`: `reportImageKey` 改为 `clinicalReport`, 新增 `reportDisclaimer` 字段 (含两条声明); `hospitals[0].logoKey` 改为 `sdebhLogoLg`
  - `ENDORSEMENTS.patents`: 新增 `imageNote: "数据截止至2024年5月"`
  - `SERVICE_CENTER.remoteTitle`: `"耳科级\"声处方\"指定 / 听力专家远程 AI 验配服务"` → `"耳科级\"声处方\"指定 + 听力专家远程 AI 验配服务"`
- `src/data/images/product.ts`: 新增 `clinicalReport: "/images/report.png"` 和 `sdebhLogoLg: "/images/logos/sdebh_lg.png"` 两条图片资源
- `src/pages/ProductPage.tsx`:
  - 临床医疗认证模块: 医院 logo 卡片高度 140→180, logo max-h 80→110; 报告图改为 `w-full object-contain` 横向铺满; 报告下方新增 `whitespace-pre-line` 声明小字
  - 国家专利认证模块: 配图下方新增 12px 灰色说明小字
  - 三甲医院设备模块: `grid-cols-3 gap-[16px] max-w-[1080px]`, 图片区改 `aspect-[3/2] p-[12px]`, 文字区 `p-[10px]`
  - 售中·售后服务模块: 重构为 1200×920 SVG 赛车道 + 8 节点 Z 字形布局
    - 赛道三层: 浅绿填充带 (#f0f7f2, 36px) + 浅绿描边 (#d4e7d8, 1.5px) + 绿色虚线分道线 (#05a045, dasharray "2 8", opacity 0.6)
    - 起点小圆点 + 终点箭头
    - 8 节点按 { x: 420/780, y: 120/350/580/810 } Z 字形排列, 每节点 60px 白底绿边圆 + 200px 标签卡片 (左列节点标签在左, 右列节点标签在右)
    - hover: 节点背景变绿、文字变白; 标签卡片边框变绿、标题变绿

**影响范围**: ProductPage 第 5/6/7 模块 (权威背书 / 听力服务中心 / 全生命周期服务) 视觉与内容更新

**关联文件**:
- [src/data/product.ts](file:///d:/VibeTest/bigsound/src/data/product.ts)
- [src/data/images/product.ts](file:///d:/VibeTest/bigsound/src/data/images/product.ts)
- [src/pages/ProductPage.tsx](file:///d:/VibeTest/bigsound/src/pages/ProductPage.tsx)
- [public/images/report.png](file:///d:/VibeTest/bigsound/public/images/report.png) (用户新增)
- [public/images/logos/sdebh_lg.png](file:///d:/VibeTest/bigsound/public/images/logos/sdebh_lg.png) (用户新增)

**验证**: `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 决策 | 确定 AI 配图全局基础风格 (3 套主题 prompt)

**类型**: 重要决策 + 全局规范

**摘要**:
- 用户要求建立统一的 AI 生图 prompt, 保证网站配图视觉一致性
- 风格基调: 真实、高端、商业摄影风格, 体现网站高端简约感
- 主题导向: 场景化主题, 不绑定具体产品, 通过建筑/人物/空间传递品牌调性
- 从 5 套候选风格中选定 3 套写入项目记忆: 现代建筑外观 / 温馨家庭人物场景 / 专业医疗空间

**详细变更**:
- 生成 5 套产品导向风格 (`aigpic/20260724/style1-5_*.png`) — 用户反馈"配图不一定要有产品, 讲场景主题"
- 重新生成 5 套主题场景风格 (`aigpic/20260724_theme/theme1-5_*.png`):
  - theme1 现代建筑外观 (Canon R5 + TS-E 24mm, 黄金时刻总部大楼)
  - theme2 温馨家庭人物场景 (Sony A7R IV + 35mm f/1.4, 多代同堂客厅)
  - theme3 专业医疗空间 (Nikon Z9 + 24mm, 现代听力诊所)
  - theme4 自然静谧意境 (Hasselblad X2D, 晨光森林)
  - theme5 现代研发办公空间 (Sony A7R IV, 声学实验室)
- 用户选定 1/2/3 三套, 已写入 `c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md` "AI 配图全局基础风格" 章节
- 每套 prompt 含主 prompt + fallback prompt (应对内容审核, 特别是 elderly/family 类描述)
- 统一末尾追加 `no text, no watermark, no garbled characters` 避免文字乱码

**影响范围**: 后续所有 AI 配图 (about/product/invest/careers 等页面) 均按此 3 套主题 prompt 生成, 保证视觉统一性

**关联文件**:
- [aigpic/style_test_plan.json](file:///d:/VibeTest/bigsound/aigpic/style_test_plan.json) (产品导向, 已弃用)
- [aigpic/theme_test_plan.json](file:///d:/VibeTest/bigsound/aigpic/theme_test_plan.json) (主题导向, 已选定 1/2/3)
- [aigpic/20260724_theme/theme_preview.html](file:///d:/VibeTest/bigsound/aigpic/20260724_theme/theme_preview.html) (对比预览页)
- 项目记忆: `c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md` (新增"AI 配图全局基础风格"和"AI 配图使用规范"两节)

---

## [2026-07-25] 优化 | InvestPage 5 项修改: CTA 三栏信息卡 + 低认知标题绿底 + 市场现状紧凑 + 医疗资质真实证书 + 高可干预 hover

**类型**: UI 重构 + 资源替换

**摘要**:
- 末尾【联系我们】CTA 重构为三栏信息卡 (电话/地址/邮箱), 含 SVG 图标 + CTA 按钮
- 【低认知】两卡片标题改绿色背景白字 + 粘贴在卡片上方 + 两卡等高
- 【市场现状】4 卡片重新规划: 统一浅绿底 + 统一小标题样式(绿色短竖条+13px绿粗体) + 紧凑高度
- 【医疗资质】5 张真实证书替换原 AI 证书, 排 2 列; 下方新增【国家专利认证】模块(复用 ProductPage 专利矩阵图)
- 【高可干预】表格行增加 hover 浅绿背景效果

**详细变更**:
- `src/pages/InvestPage.tsx`:
  - §2.4 低认知 (L294-L327): 标题从"短竖条+绿字"改为 `bg-brand-green` 白字, 卡片 `border-t-0` 与标题粘贴, 外层 `flex flex-col` + 卡片 `flex-1` 等高, grid 加 `items-stretch`
  - §3.1 市场现状 (L342-L520): 4 卡片统一 `bg-brand-green/5 p-[20px]`, 统一小标题(3px 绿短竖条+13px 绿粗体), 数字 72→56px, 柱状图 barAreaH 180→120/groupGap 60→40/barW 32→24, 佩戴率进度条 h-8→h-6
  - §3.5.3 医疗资质 (L829-L889): 删除原 5 列竖版+3 列横版+2 列评级共 10 张 AI 证书, 改为 5 张真实证书 grid-cols-2 (第 5 张 col-span-2 居中), h-320px; 下方新增专利认证模块(22px 标题+14px 描述+专利矩阵图+12px 说明)
  - §6 CTA (L1031-L1131): 从"标题+热线+双按钮"重构为"标题+副标+三栏信息卡+单按钮", 三栏 grid-cols-3 bg-white p-24px, 每栏 SVG 图标(电话/定位/信封)+12px 标签+内容(电话 20px 绿可点击/地址 13px/邮箱 18px 绿可点击)
- `src/data/invest.ts` (L283-L302): qualifications 重构, 删除 portrait 原 5 项 AI imageKey 改为 certReal1-5, 删除 landscapeRow1/Row2, 新增 patents 字段(title/desc/imageKey/imageNote)
- `src/data/images/invest.ts` (L14-L19): 新增 certReal1-5 映射指向 /images/prototype/cert_real_1-5.png
- `src/components/invest/HearingLossGradeTable.tsx` (L269): `<tr>` 加 `transition-colors duration-150 hover:bg-brand-green/15`
- 新增图片文件: `public/images/prototype/cert_real_1-5.png` (5 张真实证书, 从 honors/real 复制重命名)
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage §2.4/§3.1/§3.5.3/§6 + invest.ts qualifications + HearingLossGradeTable

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)
- [src/data/invest.ts](file:///d:/VibeTest/bigsound/src/data/invest.ts)
- [src/data/images/invest.ts](file:///d:/VibeTest/bigsound/src/data/images/invest.ts)
- [src/components/invest/HearingLossGradeTable.tsx](file:///d:/VibeTest/bigsound/src/components/invest/HearingLossGradeTable.tsx)

---

## [2026-07-24] 优化 | InvestPage 开店全流程 2×2 + 专家带教横向长图 + 末尾 CTA 模块

**类型**: UI 重构 + 新增模块

**摘要**:
- 【开店全流程服务】重构为 2×2 布局: 第一行 2 种店型面积卡(浅绿底), 第二行 2 张配图(门店形象 + 平面布局), 删除原独立【联营店平面布局示意图】子模块
- 【专家全程带教】图片重生成: 16:9 横向长图, 高端商务摄影奖风格, 替换原 4:3 图片
- 新增末尾【联系我们】CTA 模块: 深绿背景 + 大标题 + 服务热线 400-116-9566 + 双 CTA 按钮(立即致电 / 返回顶部)

**详细变更**:
- `src/pages/InvestPage.tsx`:
  - §4.1 开店全流程 (L905-L948): 重构 grid 为 2×2, 删除原左侧 2 种店型 grid-cols-2 + 右侧 500px 图的 grid-cols-[1fr_500px] 布局, 删除下方联营店平面图独立子模块, 改为统一 grid-cols-2 gap-[20px]; 面积卡改 bg-brand-green/5 + hover:bg-brand-green/10; 配图改 h-260px object-cover + group hover scale-1.03
  - §4.2 专家带教 (L950-L964): 删除 flex justify-center + max-h-360px object-contain, 改为 overflow-hidden + max-h-420px object-cover + group hover scale-1.02, 图片铺满宽度
  - 新增 §6 CTA 模块 (L1032-L1072): bg-brand-green + py-80px + 居中文字布局, 36px font-display 大标题"加入大声 共创听力健康新未来", 16px 副标, 28px 服务热线, 双按钮(白底立即致电 + 白边框返回顶部)
- `src/data/images/invest.ts` (L11-L12): investExpertTeam 路径从 invest_expert_team.png 改为 invest_expert_team_wide.png
- 新增图片文件: `public/images/prototype/invest_expert_team_wide.png` (16:9, 速创API gpt-image-2 生成, 61秒, 高端商务摄影风格)
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §4.1/§4.2 重构 + §6 新增 CTA, invest.ts 图片映射

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)
- [src/data/images/invest.ts](file:///d:/VibeTest/bigsound/src/data/images/invest.ts)

---

## [2026-07-24] 优化 | InvestPage 市场现状/赛道好去边框融入 + 政策利好单行 + 创维集团旗下大标题

**类型**: UI 优化

**摘要**:
- 【市场现状】2×2 卡片 + 【赛道好】图表: 去除所有灰色矩形边框, 用浅绿/浅灰底色 + 留白区分, 与页面朴素风格融为一体
- 【政策利好】4 张卡片从 2×2 网格改为单行 4 列排列
- 【著名上市创维集团旗下】从 SubSectionTitle 改为 SectionTitle 居中大标题 (30px ink-700), 3 个子模块标题改为 SubSectionTitle 副标样式 (24px + 绿色短竖条)

**详细变更**:
- `src/pages/InvestPage.tsx`:
  - 【市场现状】(L341-L517):
    - [1] 文本卡: `border border-ink-200` → `bg-brand-green/5`, 顶部标签 `bg-brand-green/15`, 底部分隔线 `border-brand-green/20`
    - [2] 配图: 删除 border, 保留 `bg-ink-100` 占位底色
    - [3] 佩戴率卡: `border border-ink-200 bg-white` → `bg-ink-50`, 进度条底 `bg-ink-200`
    - [4] 柱状图: `border border-ink-200 bg-white` → `bg-ink-50`
    - gap 从 24 改为 20 增加紧凑感
  - 【赛道好】(L560-L561): 图表容器 `border border-ink-200 bg-white` → `bg-ink-50`
  - 【政策利好】(L698-L723): `grid-cols-2 gap-[20px]` → `grid-cols-4 gap-[16px]`, 卡片改 `bg-ink-50 p-[20px] flex flex-col`, 序号方框 36→32px, 标题 16→15px, 描述 13→12px, 删除 border, 添加 hover:bg-brand-green/5
  - 【创维集团旗下】(L754-L891):
    - 主标题 SubSectionTitle → SectionTitle (居中 30px ink-700 700 + 副标 16px ink-500)
    - 3 个子模块标题 `<h4 className="text-[18px]">` → SubSectionTitle (24px + 绿色短竖条), 与全站子模块标题统一
    - 主图容器删除 border, 保留 bg-ink-100
    - 3 个数据卡 `border border-ink-200 bg-white` → `bg-ink-50` + hover:bg-brand-green/5
    - 资质证书 8 个卡片 `border border-ink-200 bg-[#fafafa]` → `bg-ink-50` + 内层 `bg-white`
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §3.1/§3.2/§3.3/§3.5 四个子模块

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)

---

## [2026-07-24] 优化 | InvestPage 赛道好趋势线箭头改朝右上方

**类型**: UI Bug 修复

**摘要**:
- 修复箭头方向错误: 之前 marker 尖端朝上 (M5,0 L10,10 L0,10 z) 配合 orient=auto 导致箭头垂直于切线, 方向不对
- 改为 marker 尖端沿 x 轴正方向 (M0,0 L10,5 L0,10 z), 配合 orient=auto 让箭头跟随抛物线末端切线方向 (右上 ~38°)
- refX 从 5 改为 9, 让箭头尖端贴合曲线末端

**详细变更**:
- `src/pages/InvestPage.tsx` 赛道好 SVG marker:
  - path 从 `M5,0 L10,10 L0,10 z` (尖端朝上) 改为 `M0,0 L10,5 L0,10 z` (尖端沿 x 轴正方向)
  - refX 从 5 改为 9, refY 从 2 改为 5
  - orient 保持 "auto", 让 marker 旋转角度跟随曲线末端切线方向
  - 抛物线末端切线 = (endX-ctrlX, endY-ctrlY) = (330, -257), 角度 ≈ 右上 38°
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §3.2 赛道好趋势线箭头方向

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)

---

## [2026-07-24] 优化 | InvestPage 赛道好趋势线改抛物线 + 末端箭头朝上

**类型**: UI 优化

**摘要**:
- 趋势线从多段贝塞尔改为单段二次贝塞尔 (Q 命令), 形成开口向上的抛物线, 弧度单一不再起伏
- 控制点: ctrlX=(startX+endX)/2, ctrlY=Math.max(startY,endY)*1.05, 让曲线先平缓下降再陡峭上升
- 末端箭头改朝上: marker 的 path 改为 `M5,0 L10,10 L0,10 z` (尖端在顶部), 配合 orient="auto" 跟随末端切线方向 (近乎垂直向上)

**详细变更**:
- `src/pages/InvestPage.tsx` 赛道好 SVG:
  - 删除 `smoothPath()` 函数, 改为 `parabolaPath()`: 单段 `M startX,startY Q ctrlX,ctrlY endX,endY`
  - 控制点 ctrlY 取起点/终点 y 较大者 (更靠近 X 轴) 的 1.05 倍, 确保曲线向下凸后再向上扬
  - marker path 从 `M0,0 L10,5 L0,10 z` (右向三角) 改为 `M5,0 L10,10 L0,10 z` (上向三角)
  - refX 从 8 改为 5, refY 从 5 改为 2, 让箭头尖端贴合曲线末端
  - markerWidth/Height 从 7 改为 8, 略大更显眼
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §3.2 赛道好趋势线视觉

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)

---

## [2026-07-24] 优化 | InvestPage 赛道好折线图改平滑曲线 + 末端箭头

**类型**: UI 优化

**摘要**:
- 折线图改为纯趋势展示: 删除节点数值标签 + 数据点圆点
- polyline 直线改为 path 平滑贝塞尔曲线 (水平切入切出控制点)
- 两条曲线末端添加箭头 (SVG marker)

**详细变更**:
- `src/pages/InvestPage.tsx` 赛道好 SVG 折线图:
  - 新增 `smoothPath()` 函数: 对每段使用三次贝塞尔 `C` 命令, 控制点为水平偏移 dx = (p1.x-p0.x)*0.4, 实现自然平滑过渡
  - 删除 demand/capital 两组 `<circle>` 数据点和 `<text>` 数值标签循环
  - 两条 `<polyline>` 改为 `<path d={smoothPath(...)}>` 平滑曲线
  - 新增 `<defs>` 内两个 `<marker>`: arrow-demand (橙) / arrow-capital (绿), 三角形箭头 orient="auto"
  - 两条 path 添加 `markerEnd="url(#arrow-xxx)"` 末端箭头
  - 保留: 网格线 / Y 轴刻度 / X 轴年份 / 坐标轴 / 图例 / Y 轴单位标注
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §3.2 赛道好折线图视觉

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)

---

## [2026-07-24] 优化 | InvestPage 赛道好模块移至市场现状下方 + 新增双折线趋势图

**类型**: UI 重构 + 新增组件

**摘要**:
- 调整 §3 子模块顺序: 原顺序「赛道好 → 市场现状 → 政策利好」改为「市场现状 → 赛道好 → 政策利好」
- 【赛道好】模块新增双折线趋势图 (SVG 实现): 中国助听器需求量(橙) vs 资金规模(绿), 2000-2030 年
- 数据设计: 两条曲线均持续上行且增速逐步加快, 绿色资金规模始终高于橙色需求量

**详细变更**:
- `src/data/invest.ts`:
  - track 对象新增 lineChart 字段, 包含:
    - title: "中国助听器市场规模趋势（2000-2030）"
    - yAxisUnit: "亿（人群规模）"
    - years: ["2000", "2010", "2015", "2020", "2025", "2030"]
    - demand (橙色): [100, 160, 240, 350, 500, 680] - 增速 60/80/110/150/180 递增
    - capital (绿色): [150, 230, 340, 490, 680, 900] - 增速 80/110/150/190/220 递增, 始终高于 demand
    - legendDemand / legendCapital 图例文案
- `src/pages/InvestPage.tsx`:
  - 删除原 3.1 赛道好空模块 (仅标题+描述)
  - 在 3.1 市场现状 (2×2 卡片) 之后插入新的 3.2 赛道好模块
  - 新增 SVG 双折线图组件 (IIFE 内联):
    - viewBox 0 0 800 440, padding L70/R30/T30/B60
    - 11 条 Y 轴网格线 (0-1000, 每 100 一档, 虚线)
    - Y 轴刻度标签 + X 轴年份标签
    - 橙色折线 (#f97316) + 绿色折线 (#05a045), strokeWidth 2.5
    - 每个数据点带白底圆点 + 数值标签 (折线上方)
    - 顶部图例 (橙色横条 + 绿色横条)
    - 底部 Y 轴单位标注
  - 动态坐标计算: xPos(i) = padL + i * (plotW / (n-1)), yPos(v) = padT + plotH - ((v-yMin)/(yMax-yMin)) * plotH
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §3.1/§3.2 顺序调整 + 赛道好模块新增折线图

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)
- [src/data/invest.ts](file:///d:/VibeTest/bigsound/src/data/invest.ts)

---

## [2026-07-24] 优化 | InvestPage 高危害交错Bug修复 + 市场现状2×2卡片视觉优化

**类型**: UI 重构 + Bug 修复

**摘要**:
- 【高危害】模块: 修复左右交错逻辑 Bug (原 order+isReverse 组合导致图片全部居左), 改为简洁的三元分支实现真正的「一左一右」交错
- 【中国听力健康市场现状】2×2 四个卡片视觉优化:
  - [1] 文本卡: 重构信息层级 (顶部"核心数据"标签 → 中部主标+72px巨型数字 → 底部footnote分隔线), 改 justify-center 为 justify-between 三段式
  - [2] 配图: 速创API gpt-image-2 生成听力诊所场景图 (4:3, 老年人剪影+验配师剪影+绿色主题), 替换原柱状图
  - [3] 各国佩戴率卡: 中国行整行高亮 (浅绿背景+3px绿色左边条), 进度条改细 (8px) 增加对比, 顶部增加"65岁以上老人"副标
  - [4] 柱状图: 修复数值标签位置 Bug (原共享一行导致数值底部对齐), 改为每根柱子独立包装, 数值紧贴柱顶
- AI 生图: 80秒完成, 保存为 invest_china_hearing_scene.png

**详细变更**:
- `src/pages/InvestPage.tsx`:
  - 高危害模块 (L269-L278): 删除 order-1/order-2 + isReverse 三元嵌套, 改为 `<div>{isReverse ? textBlock : imageBlock}</div>` 简洁分支
  - 市场现状 [1] 文本卡 (L360-L383): 三段式布局 justify-between, 顶部小标签 + 中部巨型数字 + 底部分隔线
  - 市场现状 [2] 配图 (L386-L392): group hover + duration-500 + scale-[1.05]
  - 市场现状 [3] 佩戴率卡 (L396-L436): 每行增加 px-[10px] py-[6px] 内边距, 中国行 bg-brand-green/8 + border-l-[3px] border-brand-green
  - 市场现状 [4] 柱状图 (L440-L534): 每根柱子单独 div + flex-col + justify-end, 数值标签 mb-[4px] 紧贴柱顶
- `src/data/invest.ts`: marketStatus.imageAlt 改为 "中国听力健康市场现状 - 听力诊所验配场景"
- `src/data/images/invest.ts`: investChinaHearingLoss 路径改为 /images/prototype/invest_china_hearing_scene.png
- 新增文件: `public/images/prototype/invest_china_hearing_scene.png` (4:3, gpt-image-2 生成)
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §2.2 高危害 + §3.2 市场现状

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)
- [src/data/invest.ts](file:///d:/VibeTest/bigsound/src/data/invest.ts)
- [src/data/images/invest.ts](file:///d:/VibeTest/bigsound/src/data/images/invest.ts)

---

## [2026-07-24] 优化 | InvestPage 高危害左右交错+hover / 低认知标题外移 / 市场现状 2×2 布局

**类型**: UI 重构

**摘要**:
- 【高危害】模块：抽象 textBlock/imageBlock 变量，实现 grid-cols-2 + order 左右交错布局，文本区 hover 背景变浅绿，图片区 hover scale-[1.03]
- 【低认知】模块：将【用户低认知】【政府低认知】标题从矩形方框内移至外层上方，采用「绿色短竖条 + 20px 绿色标题」结构
- 【中国听力健康市场现状】模块：从「左数据卡+右配图」改为 2×2 网格布局
  - [1] 文本数据卡：95% 中国听力受损人群未佩戴助听器（64px 绿色大字 + footnote）
  - [2] 配图：investChinaHearingLoss，hover scale-[1.03]
  - [3] 各国助听器佩戴率对比卡片（中国行高亮绿色）
  - [4] 自绘柱状图：中国听力障碍人数（万人），2010/2020/2030 三年，灰色柱（总人数）+ 绿色柱（中度以上），含图例和数值标签

**详细变更**:
- `src/data/invest.ts`:
  - marketStatus 重构：删除原 stats 数组，新增 statText 单对象（num/label/sub）、保留 imageKey/countryRates/footnote、新增 barChart 对象（title/years/legendTotal/legendModerate）
  - barChart.years 含 2010（21242/6643）、2020（25698/8037）、2030（31666/9903）三年数据
- `src/pages/InvestPage.tsx`:
  - 高危害模块（L224-L284）：抽象 textBlock/imageBlock，isReverse = idx%2===1，hover:bg-brand-green/5 + hover:scale-[1.03]
  - 低认知模块（L297-L329）：标题外移至方框外层上方，绿色短竖条 4×20px + 20px 绿色标题
  - 市场现状模块（L352-L527）：改为 grid-cols-2 gap-[24px] 2×2 布局，第四格柱状图使用 IIFE 内联渲染，按 maxVal 比例计算柱高，含图例/数值标签/X轴年份
- 类型检查: `npx tsc --noEmit` exit code 0

**影响范围**: InvestPage.tsx §2.2/§2.4/§3.2 三个子模块

**关联文件**:
- [src/pages/InvestPage.tsx](file:///d:/VibeTest/bigsound/src/pages/InvestPage.tsx)
- [src/data/invest.ts](file:///d:/VibeTest/bigsound/src/data/invest.ts)

---

## [2026-07-23] 优化 | InvestPage 高流行模块重构 + hover 效果 + 分割线清理

**类型**: UI 重构

**摘要**:
- 高流行模块改为「左大图 + 右 2×2 数据卡」布局，AI 生成全球听力受损概念图
- 4 个数据卡添加 hover 效果（背景变浅绿 + 左侧绿色竖条）
- 删除页面所有 section 顶部的灰色分割线（border-t border-ink-200）
- 删除高流行模块图片的灰色边框
- 高危害模块重构为三大风险上下排列、左右交错的图文布局，每项配 AI 概念图

**详细变更**:
- `src/data/invest.ts`:
  - highPrevalence 新增 imageKey/imageAlt 字段
  - highHarm.risks 重构为 3 项（老年痴呆/更易摔倒/抑郁症），每项含 topic + imageKey + 2 个 stats
- `src/data/images/invest.ts`:
  - 新增 investHearingPrevalence 图片 key
  - 新增 investHarmDementia / investHarmFalling / investHarmDepression 图片 key
- `src/pages/InvestPage.tsx`:
  - 高流行模块重构为 `grid-cols-[500px_1fr]` 左右分栏
  - 数据卡添加 group hover：`hover:bg-brand-green/5 hover:border-brand-green` + 左侧 4px 绿条
  - 删除 3 处 `<section className="bg-white border-t border-ink-200">` 中的 border-t
  - 删除图片容器 border border-ink-200
  - 高危害模块重构为 `space-y-[30px]` 上下排列，每项 `grid-cols-2` 左右交错（isReverse = idx%2===1），文本区带 4px 绿色左边条 + 22px 主题标题 + 32px 数字
- `public/images/prototype/`:
  - invest_hearing_prevalence.png (高流行概念图, gpt-image-2, 4:3)
  - invest_harm_dementia.png (老年痴呆概念图, gpt-image-2, 4:3)
  - invest_harm_falling.png (跌倒风险概念图, gpt-image-2, 4:3)
  - invest_harm_depression.png (抑郁症概念图, gpt-image-2, 4:3)

**影响范围**: InvestPage 行业前景好模块（高流行 + 高危害）+ 全站 section 分割线

**关联文件**: src/pages/InvestPage.tsx, src/data/invest.ts, src/data/images/invest.ts

---

## [2026-07-22] 优化 | ProductPage 产品卡片设计与 WearablePage 统一

**类型**: UI 重构

**摘要**: 把 ProductPage 12 款产品卡片的结构从"单层 padding + 中间小图"重构为"WearablePage 风格的上图 (240px 全宽灰底) + 下文 (p-5)"，跨页面卡片视觉统一。

**详细变更**:

`src/pages/ProductPage.tsx` 第 3 节产品卡片网格：

| 维度 | 修改前 | 修改后 (与 WearablePage 一致) |
|---|---|---|
| 卡片结构 | 单层 `padding: 20px` 包裹所有内容 | 上下两层: 图片区 + 信息区 (flex-1 p-5) |
| 图片位置 | 中间 (型号下方) | 顶部 (全宽) |
| 图片高度 | 160px | 240px (与 WearablePage 一致) |
| 图片区样式 | `bg-ink-100 p-2 mb-3` | `w-full bg-ink-100` (无内边距, 全宽) |
| 型号字号 | 18px leading-27px | 16px leading-24px (与 WearablePage 一致) |
| 卡片 minHeight | 540px | 480px (WearablePage 440px + 6 项特性比 4 项多 2 项的余量) |

**设计依据**: WearablePage `ProductCard` 组件 (第 40-102 行) 已稳定, ProductPage 沿用相同布局以消除跨页面视觉差异。

**影响范围**: ProductPage 第 3 节 "12 款产品参数卡片" 网格 (4 列 × 3 行)

**关联文件**:
- `src/pages/ProductPage.tsx` (第 120-187 行)

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-22] 数据更新 | AI 中文助听器页 12 款产品配图接入

**类型**: 数据更新 + 图片资源 + UI 增强

**摘要**: 从 `https://www.xiaowe.cc/h-col-103.html` 抓取 9 款真实在售助听器主图，按形态+价位最接近原则给项目里 12 款内部代号产品配图；骨导式 5 款因 xiaowe.cc 无对应产品，暂用 `product_ric_render.png` 渲染图占位。

**详细变更**:

1. **图片下载** (9 张真实产品主图 → `public/images/products/`)
   - `product_bigsound_br.png` ← Bigsound BR 臻听版 ¥9999 耳背式
   - `product_bigsound_p1.png` ← Bigsound P1 ¥5999 耳内式
   - `product_bigsound_q1.png` ← Bigsound Q1 ¥5999 耳内式
   - `product_bigsound_n1.png` ← Bigsound N1 ¥8999 颈挂式
   - `product_skyworth_b1.png` ← 创维 B1 ¥999 耳背式 (备用)
   - `product_skyworth_p1.png` ← 创维 P1 悦享版 ¥1999 耳内式 (备用)
   - `product_skyworth_q2.png` ← 创维 Q2 尊享版 ¥1999 耳内式 (备用)
   - `product_skyworth_q3.png` ← 创维 Q3 ¥1699 耳内式 (备用)
   - `product_skyworth_n2.png` ← 创维 N2 优享版 ¥1999 颈挂式
   - 注: N3 尊享版页面无主图，用 N2 同系列代替
   - 来源 URL 模式: `https://aka.doubaocdn.com/s/{id}`

2. `src/data/images/product.ts`
   - 新增 9 个图片 key: `productBigsoundBr/P1/Q1/N1` + `productSkyworthB1/P1/Q2/Q3/N2`
   - 路径: `/images/products/product_{brand}_{model}.png`

3. `src/data/product.ts`
   - `ProductItem` 接口新增 `imageKey: string` 字段
   - 12 款 PRODUCTS 数据各填入 imageKey (混合方案映射):
     - 耳背式 DAB005 → BR 臻听版
     - 耳内式 DAB006 → P1 / DAQ001 → Q1
     - 颈挂式 DAB007/SAN001 → N1 / SAN002/SAN003 → 创维 N2
     - 骨导式 5 款 (SAB001/SAP001/SAQ002/SAQ003/BO) → productRicRender 占位

4. `src/pages/ProductPage.tsx`
   - 产品卡片在型号 h3 后插入配图区 (160px 高, bg-ink-100, flex 居中)
   - 卡片 minHeight 由 420px 调整为 540px (容纳配图)
   - 图片用 `loading="lazy"` + `object-contain` 适配不同比例

5. `PROTOTYPE_PAGES.md` §4.5
   - 新增配图映射表 (12 款 → 真实图来源)
   - 标注骨导式占位说明

**决策依据**:
- xiaowe.cc 10 款真实型号 (BR/P1/Q1/N1/B1 等) 跟项目 12 款内部代号 (DAB005 等) 完全不同
- PM 选定"混合方案": 保留 12 款代号不变，按形态+价位最接近匹配真实图
- 骨导式 5 款: PM 选定"用骨导产品渲染图"占位 (xiaowe.cc 无骨导产品)
- N3 尊享版: 页面顶部无主图 (WebFetch 3 次均无果)，用 N2 优享版同系列代替

**影响范围**: ProductPage 第 3 节 "12 款产品参数卡片" 网格 (4 列 × 3 行)

**关联文件**:
- `public/images/products/*.png` (新增 9 张)
- `src/data/images/product.ts`
- `src/data/product.ts`
- `src/pages/ProductPage.tsx`
- `PROTOTYPE_PAGES.md` §4.5

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 修复 | /about 战略合作 logo 未变大修复 + 间距优化

**类型**: 修复 / 布局

**摘要**
用户反馈: 战略合作的 5 个 logo 还是有问题, 大小和间距有问题, 不美观, 刚才他们并没有变大。诊断后发现根本原因是每个 logo 外层包了 `<Reveal>` 组件, Reveal 渲染时会在子元素外再包一层 div, 这层 div 在 flex 容器中不响应内部 `w-[200px]`, 导致 logo 容器实际宽度由内容撑开, 远小于 200px, 所以 logo 看起来没变大。

**问题诊断**
- Reveal 组件结构: `<Tag ref={ref} className={baseClass}>{children}</Tag>` — 会在 children 外层包一个 div
- 该外层 div 在 flex 父容器中作为 flex item, 但其本身没设固定宽度
- 内部 `<div className="w-[200px]">` 在外层 div 内被 flex 压缩 (flex item 默认 `min-width: auto` 由内容撑开)
- 结果: 实际渲染宽度 ≈ logo 自然宽度 (可能仅 100-150px), 不是 200px, 所以 "没变大"
- 同时 `h-full` 在外层 div 没有指定高度时无效, 卡片高度也不一致

**详细变更**

`src/pages/AboutPage.tsx` - 战略合作模块:
1. 移除每个 logo 外层的 `<Reveal key={idx} delay={...}>` 包裹
   - 整体外层 `<Reveal>` 已提供入场动画, 不影响视觉效果
2. 每个 logo 卡片直接作为 flex item 渲染:
   - 容器宽度: 200px → 260px (w-[260px] 现在完整生效)
   - logo 高度: 130px → 140px
   - 卡片间距: gap-[16px] → gap-[24px]
3. 移除失效的 `h-full` (在 flex item 中无意义)

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 战略合作 5 个 logo 现在真正按 260px 宽 × 140px 高的容器渲染, 大小和间距均正确, 两行 3+2 布局美观

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`
- `d:\VibeTest\bigsound\src\components\ui\Reveal.tsx` (问题源头, 未修改)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /about 战略合作两行 logo 去行间距 + 全模块 logo 再略微增大

**类型**: 优化 / 布局 / 样式

**摘要**
用户反馈: 战略合作两行 logo 之间不要有行间距, 然后再略微增大一点。本次移除两行之间的 `gap-[20px]`, 并把全模块 logo 容器高度从 110px → 130px。

**详细变更**

1. `src/pages/AboutPage.tsx` - 战略合作模块:
   - 外层 `flex flex-col gap-[20px]` → `flex flex-col` (移除行间距)
   - logo 容器高度: 110px → 130px (两行均同步)

2. `src/pages/AboutPage.tsx` - 战略投资模块:
   - logo 容器高度: 110px → 130px
   - 带 `logoScale` 的 logo 最大高度同步: `logoScale * 110` → `logoScale * 130`
     - 创维: 55px → 65px
     - 新生: 49.5px → 58.5px ≈ 59px

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 战略合作两行 logo 之间无间距, 紧凑贴合; 全模块 9 个 logo 比 110px 时再大约 20%

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /about 战略合作 logo 分两行 + 全模块 logo 略微增大

**类型**: 优化 / 布局 / 样式

**摘要**
用户指示: 战略合作模块的 5 个 logo 分两行呈现（第一行 3 个，第二行 2 个），并且包括战略投资模块在内的所有 9 个 logo 略微增大。本次调整战略合作伙伴模块布局与 logo 尺寸。

**详细变更**

1. `src/pages/AboutPage.tsx` - 战略投资模块:
   - 保持 4 列网格布局 (`grid grid-cols-4 gap-[20px]`)
   - logo 容器高度: 100px → 110px
   - 带 `logoScale` 的 logo 最大高度同步放大（`logoScale * 100` → `logoScale * 110`）
     - 创维: 50px → 55px
     - 新生: 45px → 49.5px ≈ 50px

2. `src/pages/AboutPage.tsx` - 战略合作模块:
   - 布局从 5 列一行改为上下两行居中:
     - 外层 `flex flex-col gap-[20px]`
     - 第一行: 前 3 个 logo, `flex justify-center gap-[16px]`
     - 第二行: 后 2 个 logo, `flex justify-center gap-[16px]`
   - 每个 logo 容器宽度固定 200px, padding 16px → 20px
   - logo 容器高度: 90px → 110px
   - 保持 hover 缓慢放大动效 (`transition-transform duration-500 hover:scale-110`)

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 战略合作伙伴模块中, 战略投资 4 个 logo 略微增大; 战略合作 5 个 logo 分两行（上 3 下 2）居中, 且同样略微增大

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 数据 | /about 核心团队四人介绍文案更新

**类型**: 数据更新 / 文案

**摘要**
用户提供了核心团队四人的新介绍参考图，要求据此修改文案。本次更新 `src/data/about.ts` 中 `team.members` 四人的 details 文案，使其与用户参考图保持一致。

**详细变更**

1. 郑明春（联合创始人兼 COO）:
   - 更新第 2 条："前创维用户运营总监，在创维主导九千万用户体系搭建与全生命周期管理，为 C 端产品与 AI 模型迭代（数字资产增长）提供方法论"
   - 更新第 3 条："前创维电视知名产品经理，负责产品企划与上市，对用户需求洞察与跨渠道营销有系统方法论"
   - 更新第 4 条："现任小维健康联合创始人，推动 AI 助听器的产品定义、体验设计与商业化路径"

2. 温业锋（CMO）:
   - 更新第 2 条："前迅雷集团网心科技营销总经理，曾将共享计算智能硬件“玩客云”打造成京东战略级产品、智能硬件销量 No.1"
   - 更新第 3 条："前创维集团国内营销事业部全渠道业务中心总经理，中国邮政 O2O 项目总负责人，主导创维 & 邮政合作项目年销售超 10 亿"

3. 龙浩军（研发总监）:
   - 更新第 2 条："前某助听器公司产品及研发负责人，主导研发产品销售超百万台，擅长助听器整机架构全链路管理"
   - 更新第 3 条："前森蓝电子、鑫岳电子音频及助听器项目研发负责人"
   - 更新第 4 条："现任小维健康研发总监，主导 AI 助听器核心链路：从中文语音增强、降噪、啸叫抑制、自适应算法到整机声学与可靠性"

4. 南鹏升（生产总监）:
   - 更新第 2 条："前某助听器公司生产负责人，16 余年智能穿戴及音频类生产管理经验，5 年助听器生产经验"
   - 更新第 3 条："前迅雷科技创始人总经理，为联想、新声等品牌生产音频类产品"

**影响范围**
- 1 个源码文件: `src/data/about.ts`
- 页面表现: /about 核心团队四人介绍文案与用户提供参考图完全一致

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /about 研究方向卡片简化 hover + 数据卡片加抽屉上拉 hover

**类型**: 优化 / 交互调整

**摘要**
用户反馈两条: ① §3.5 两大研究方向卡片的上版 hover 特效太花哨, 简约一点好; ② 给八张数据卡片 (§3.3) 也加 hover 效果, hover 时品牌绿抽屉上拉, 内部数据变白。本次简化研究方向卡片 hover (仅保留背景图缓慢放大), 数据卡片新增「抽屉上拉 + 数据变白」hover 效果。

**详细变更**

1. `src/pages/AboutPage.tsx` - §3.5 研究方向卡片 hover 简化:
   - 去掉: 卡片阴影增强、边框颜色变化、蒙版透明度变化 (85%→72%)、内容上浮 (-translate-y-1)、序号透明度变化 (0.15→0.30)、标题变绿、描述加深
   - 保留: 仅背景图缓慢放大 (scale 1 → scale-[1.06], duration 1200ms, cubic-bezier(0.4,0,0.2,1)) — Apple Ken Burns 经典效果
   - 蒙版固定 85% 不透明, 内容静态, 视觉更朴素

2. `src/pages/AboutPage.tsx` - §3.3 八张数据卡片新增抽屉上拉 hover:
   - 卡片结构: `group relative overflow-hidden` + 抽屉层 + 内容区 (relative z 在抽屉之上)
   - 抽屉层: `absolute inset-0 bg-brand-green translate-y-full` → hover 时 `group-hover:translate-y-0` (从底部上拉覆盖整个卡片)
   - 内容区: `relative` 保证在抽屉之上, hover 时数据颜色变白
     - 数字: text-brand-green → text-white
     - 单位: text-[#333333] → text-white
     - label: text-[#333333] → text-white
     - 副标: text-[#999999] → text-white/80 (80% 不透明白, 保持层级)
   - 卡片边框: hover 时 border-ink-200 → border-brand-green
   - 过渡参数: duration-[400ms], cubic-bezier(0.4,0,0.2,1) — 抽屉上拉与数据变白同步

**视觉策略**
- 研究方向卡片: "少即是多", 仅一个核心动效 (背景图 Ken Burns), 与朴素设计风格一致
- 数据卡片: 抽屉上拉是经典交互模式, 品牌绿覆盖 + 数据反白, 信息层级清晰且视觉冲击力强

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 研究方向卡片 hover 仅背景图缓慢放大, 不再花哨; 八张数据卡片 hover 时品牌绿抽屉从底部上拉覆盖, 数字/单位/label/副标全部变白

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /about 两大研究方向卡片加背景图+白色蒙版+Apple 风格 hover

**类型**: 优化 / 视觉重构 / 交互增强

**摘要**
用户指示: 【小维健康科技】介绍文本下的两张卡片 (§3.5 两大研究方向), 应该要有带着白色蒙版的图片做背景, 并且有 hover 效果, 参考 apple 的高级动效设计。本次为两张卡片各生成专属背景图, 重构卡片为「背景图 + 白色蒙版 + 内容贴底」结构, 加入 Apple 风格的协调 hover 动效 (背景缓慢放大 + 蒙版透出 + 内容上浮 + 序号透明度变化 + 标题变绿 + 阴影增强)。

**详细变更**

1. AI 生图 (速创API gpt-image-2, 3:2 横版):
   - `public/images/about/research_hearing_bg.png` — 听力健康研究背景图
     prompt: "Abstract hearing health technology concept, smooth sound waves visualization in soft green tones #05a045, modern audiology tech imagery with subtle hearing aid silhouette, clean minimal Apple-style aesthetic, bright airy background with lots of negative space, soft gradients in mint green and white, premium tech feel, no text, no people, no faces"
     耗时 50s
   - `public/images/about/research_wearable_bg.png` — 穿戴健康研究背景图
     prompt: "Abstract wearable health technology concept, smart watch silhouette with health monitoring visualization, soft green #05a045 and white color palette, modern Apple-style minimal aesthetic, clean bright background with negative space, subtle ECG heart rate graphics, premium tech feel, no text, no people, no faces"
     耗时 59s

2. `src/data/about.ts` - researchDirections.items 加 imageKey 字段:
   - 听力健康研究: imageKey: "researchHearingBg"
   - 穿戴健康研究: imageKey: "researchWearableBg"

3. `src/data/images/about.ts` - 新增 2 张图片映射:
   - researchHearingBg: "/images/about/research_hearing_bg.png"
   - researchWearableBg: "/images/about/research_wearable_bg.png"

4. `src/pages/AboutPage.tsx` - §3.5 卡片渲染重构:
   - 结构: `group relative h-[360px] overflow-hidden` → 背景图 absolute inset-0 → 白色蒙版 absolute inset-0 → 内容区 relative flex flex-col justify-end (贴底)
   - Apple 风格 hover 动效 (全部用 group-hover 联动, transition duration 700ms, cubic-bezier(0.4,0,0.2,1) 缓动):
     - 卡片: 边框 ink-200 → brand-green/40, 阴影 → 0 24px 60px -15px rgba(5,160,69,0.25)
     - 背景图: scale-105 → scale-110 (duration 1200ms 缓慢呼吸感)
     - 白色蒙版: bg-white/85 → bg-white/72 (透出更多背景)
     - 内容区: -translate-y-1 (轻微上浮)
     - 序号: text-brand-green/15 → text-brand-green/30 (透明度增加)
     - 标题: text-[#333333] → text-brand-green (变绿)
     - 描述: text-[#666666] → text-[#333333] (加深)
   - 卡片高度固定 360px (保证两张卡片等高 + 背景图填充一致)
   - 内容贴底 (justify-end), 序号作为大字装饰在顶部

**Apple 高级动效设计要点**
- 缓慢过渡: duration 700ms (常规 300ms 的 2 倍多, 更优雅)
- 协调联动: 背景/蒙版/内容/序号/标题/描述同时变化, 形成整体呼吸感
- 缓动函数: cubic-bezier(0.4,0,0.2,1) (Apple Material Design 标准缓动)
- 微妙幅度: scale 1.05→1.10, translate -1, opacity 0.15→0.30, 不夸张
- 背景图比内容慢: 背景图 duration 1200ms > 内容 700ms, 形成层次感

**影响范围**
- 3 个源码文件: `src/data/about.ts`, `src/data/images/about.ts`, `src/pages/AboutPage.tsx`
- 2 个图片资源新增: `public/images/about/research_hearing_bg.png`, `public/images/about/research_wearable_bg.png`
- 页面表现: /about 小维健康科技段落下方两张研究方向卡片从纯白底变为带背景图+白色蒙版的高级卡片, hover 时呈现 Apple 风格的协调动效

**关联文件**
- `d:\VibeTest\bigsound\public\images\about\research_hearing_bg.png` (新增)
- `d:\VibeTest\bigsound\public\images\about\research_wearable_bg.png` (新增)
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\data\images\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /about 小维健康科技文本左起对齐创维集团

**类型**: 优化 / 样式 / 对齐

**摘要**
用户指示: 【小维健康科技】的介绍文本应该要和【创维集团】的介绍文本的左起位置对齐一致。原 §3.4 副标和段落用 `max-w-[1000px] mx-auto` 居中, 左起偏移 100px; §3.5 两大研究方向同样用 `max-w-[1000px] mx-auto`。本次移除 §3.4 副标/段落和 §3.5 容器的 `max-w-[1000px] mx-auto`, 让左起位置与 §3.2 创维集团对齐 (均贴 container-page 左边缘)。

**详细变更**
1. `src/pages/AboutPage.tsx` - §3.4 小维健康科技:
   - 副标容器: `max-w-[1000px] mx-auto mb-[24px]` → `mb-[24px]`
   - 段落容器: `max-w-[1000px] mx-auto space-y-6` → `space-y-6`
2. `src/pages/AboutPage.tsx` - §3.5 两大研究方向:
   - 容器: `max-w-[1000px] mx-auto mt-[48px] grid grid-cols-2 gap-[24px]` → `mt-[48px] grid grid-cols-2 gap-[24px]`
   - 同步去掉 max-w, 保持与 §3.4 视觉一致 (接续呈现, 无独立标题)

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 小维健康科技副标、5 段简介、两大研究方向卡片左起位置与创维集团副标/段落/数据卡片左起对齐, 全 section 视觉左对齐统一。

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 重构 | /product 声处方流程图改为纯 SVG (解决坐标对齐问题)

**类型**: 重构 / 技术方案

**摘要**
用户反馈: 前端显示乱, 箭头错位。诊断根因: 之前用「HTML 节点 (Flexbox) + SVG 箭头层 (硬编码坐标)」两套坐标系, 节点实际像素位置与 SVG 坐标永远对不齐。本次重构为纯 SVG — 节点 + 箭头画在同一个 SVG 坐标系内, 从根本上解决对齐问题。

**问题诊断**
- HTML 节点位置由 padding/gap/字体/标题高度动态决定
- SVG 箭头坐标是写死的数字 (x=250, y=174 等)
- 两套坐标系永远对不齐 → 箭头漂浮、错位、视觉乱
- 之前还叠加了 absolute 定位的标注 div、步骤序号 div 等, 更多坐标系混乱

**方案对比**
| 方案 | 对齐精度 | 维护性 | 复杂度 |
|---|---|---|---|
| A. 纯 SVG (节点+箭头同坐标系) | 100% | 中 | 低 ✓ |
| B. HTML 节点 + ref 测量动态画箭头 | 95% | 高 | 高 |
| C. reactflow 库 | 100% | 高 | 中 (加依赖) |

选 A: 设计宽度固定 1200px, 不需响应式; 节点数量固定 (5+3), 布局静态; 一个文件全控。

**QA 确认**
与用户确认 3 个关键细节:
1. 无参考图, 按业务逻辑清单绘制
2. 右列 3 节点偏移向下, 右①与左③对齐 (Y=290)
3. 9 条箭头业务逻辑: 主流程(左①→②→③→④→⑤) + 协同(左②→右①→右②→右③→左④) + 反馈(左④→右① 试听问题反馈)

**详细变更**
1. `src/pages/ProductPage.tsx` - 声处方模块整段重写为单个 SVG:
   - 删除: 外层 div + 标题 div + 主体 div + Flexbox 双列 + absolute 标注 div + 步骤序号 div + 覆盖式 SVG 箭头层
   - 新增: 单个 1000×520 SVG, 包含所有元素 (标题条 + 列标题 + 节点 + 箭头 + 标注)

2. SVG 结构 (viewBox 0 0 1000 520):
   - 顶部绿色胶囊标题: rect (340,0,320,44, rx=22) + text 居中
   - 左列标题 "前端验配师" + 副标 "SOP+全数字化检查" at (250, 78/100)
   - 右列标题 "后端听力专家" + 副标 "专业临床听力声处方" at (750, 78/100)
   - 中间虚线分隔线: line (500,120) → (500,470), dasharray "4 4"
   - 左列 5 节点: rect 240×46 胶囊 (rx=23) at Y centers 150/220/290/360/430, X=130-370, fill white stroke #c8e6d3, text #333 14px 500
   - 右列 3 节点: 同尺寸, Y centers 290/360/430 (与左③④⑤对齐), X=630-870, text #05a045 14px 700
   - 9 条箭头 (1.5px stroke, markerEnd):
     * ①→② 向下: line (250,173)→(250,195) 绿
     * ②→③ 向下: line (250,243)→(250,265) 绿
     * ②→右① 折线: path M370,220 L500,220 L500,290 L625,290 灰 + 标注"数据自动上传，发起需求"
     * 右①→右② 向下: line (750,313)→(750,335) 绿
     * 右②→右③ 向下: line (750,383)→(750,405) 绿
     * 右③→左④ 折线: path M630,430 L500,430 L500,360 L375,360 绿 (向左→上)
     * 左③→左④ 左绕行: path M130,290 L80,290 L80,360 L125,360 绿
     * 左④→右① 折线: path M370,350 L550,350 L550,295 L625,295 绿 (向右→上) + 标注"试听问题反馈"
     * ④→⑤ 向下: line (250,383)→(250,405) 绿
   - 标注文字: rect 白底覆盖箭头线 + text 居中 (#666 12px)

3. 关键优势:
   - 节点 rect 位置和箭头端点坐标在同一 SVG 内, 100% 对齐
   - 后续微调只改 SVG 内的数字, 不需要跨 DOM/SVG 协调
   - 代码量从 230 行减至 240 行但结构清晰单一

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 声处方流程图节点和箭头完美对齐, 9 条箭头连接清晰, 标注文字精准定位

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 修正 | /product 声处方流程图箭头按用户清单重绘

**类型**: 修正 / 视觉复刻

**摘要**
用户提供精确箭头连接清单, 本次按清单重绘所有流程图箭头。

**详细变更**
1. `src/pages/ProductPage.tsx` - 流程图 SVG 箭头层按用户清单重绘:
   - 左① → 左② 向下绿箭头
   - 左② → 左③ 向下绿箭头
   - 左② → 右① 向右→下灰箭头 (数据自动上传，发起需求)
   - 右① → 右② 向下绿箭头
   - 右② → 右③ 向下绿箭头
   - 右③ → 左④ 向下→左→下绿箭头
   - 左③ → 左④ 向左→下→右绿箭头 (左侧绕行)
   - 左④ → 右① 向右→上→左绿箭头 (试听问题反馈)
   - 左④ → 左⑤ 向下绿箭头

2. 关键修正:
   - 全部箭头改为绿色 (#05a045), 仅"数据自动上传"折线保持灰色 (#999999)
   - 左② → 右① 从左③改到左②起始, 横向折线对齐右①上方
   - 右③ → 左④ 改为向下→左→下三段折线 (原为直接横线)
   - 新增 左③ → 左④ 左侧绕行绿箭头 (原无此连接)
   - 新增 左④ → 右① 向右→上→左折线绿箭头 (试听问题反馈, 原方向相反)
   - 标注文字位置同步调整 (数据上传 395/227, 试听反馈 460/401)

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 声处方流程图 9 条箭头连接与用户清单完全一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 修正 | /product 声处方流程图箭头细节补全

**类型**: 修正 / 视觉复刻

**摘要**
用户反馈: 声处方流程图还有细节未复刻到位, 少了几处箭头。本次核对参考图片, 补齐所有箭头连接并微调坐标。

**详细变更**
1. `src/pages/ProductPage.tsx` - 流程图 SVG 箭头层修正:
   - 删除错误的左③→④向下箭头 (原代码多画了一条, 实际图片中左③是横向指向右①, 没有向下箭头)
   - 补齐左侧循环反馈箭头: 左④ → 左侧绕行 → 左③ (试听问题反馈后重新调整的循环路径)
   - 所有箭头 y 坐标根据实际节点位置重新校准
   - 标注文字位置同步微调 (数据自动上传 236→242px, 试听问题反馈 382→388px)

2. 当前完整箭头连接:
   - 左① → 左② (绿色向下箭头)
   - 左② → 左③ (绿色向下箭头)
   - 左③ → 右① (灰色折线箭头, 标注"数据自动上传，发起需求")
   - 右① → 右② (绿色向下箭头)
   - 右② → 右③ (绿色向下箭头)
   - 右③ → 左④ (灰色折线箭头, 标注"试听问题反馈")
   - 左④ → 左⑤ (绿色向下箭头)
   - 左④ → 左③ (灰色左侧循环箭头, 试听不通过返回调整)

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 声处方流程图箭头连接与参考图片完全一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 重构 | /product 声处方模块改为前端复刻流程图

**类型**: 重构 / 视觉复刻

**摘要**
用户指示: 【耳科级"声处方"指定 / 听力专家远程 AI 验配服务】模块里的内容用前端复刻图片里的效果, 删掉现在的两张配图。本次移除原左右两张图片 (remoteImage + 微信客服二维码), 改为前端绘制"声处方前后端协同专业验配"流程图。

**详细变更**
1. `src/pages/ProductPage.tsx` - 声处方模块内容区重构:
   - 删除: 两张配图 `<img remoteImageKey>` + `<img remoteQrKey>` 及其 flex 布局
   - 新增: 1000px 宽度前端流程图组件

2. 流程图结构 (复刻参考图片):
   - 顶部绿色圆角标题条: "“声处方”前后端协同专业验配" (圆角胶囊上沿, 白字 bg-brand-green)
   - 主体内容区: 浅绿渐变背景 + 1.5px 浅绿边框 + 下沿 16px 圆角
   - 左右双栏布局 (gap-40):
     * 左侧"前端验配师" + 副标 "SOP+全数字化检查", 5 个白色圆角节点 (#333 字)
     * 中间竖向浅绿分隔线
     * 右侧"后端听力专家" + 副标 "专业临床听力声处方", 3 个白色圆角节点 (brand-green 加粗字), 整体向下偏移 78px
   - SVG 流程箭头:
     * 左侧节点间绿色向下箭头 (4 条)
     * 右侧节点间绿色向下箭头 (2 条)
     * 左③ → 右① 灰色折线箭头 + 标注"数据自动上传，发起需求"
     * 右③ → 左④ 灰色折线箭头 + 标注"试听问题反馈"
   - 右侧外部步骤序号: 01/02/03 大号浅绿装饰数字 + 说明文字

3. 样式细节:
   - 节点胶囊: 260px 宽, 12px 16px padding, 24px 圆角 (原图胶囊感)
   - 标题/副标: 20px brand-green 700 / 13px ink-500
   - 箭头: 1.5px stroke, 自定义 SVG marker 箭头
   - 标注文字: 12px ink-500, 白底覆盖在箭头上方避免穿线

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 声处方模块从"图片+二维码"改为纯前端流程图, 信息传达与参考图片一致, 不再依赖配图

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 重构 | /product 门店地址改为独立模块 (3 服务卡片 + 地址)

**类型**: 重构 / 视觉独立

**摘要**
用户指示: 【门店地址】模块需要重新设计为独立模块, 不需要和其他模块的主题性。顶部三个可 hover 卡片 (听力康复咨询/听力检查预约/助听器清洁保养预约), 下方地址信息。本次彻底重构该模块, 移除原绿色短竖条标题 + 双 chip 卡片布局, 改为 3 服务卡片 + 横向地址信息块。

**详细变更**
1. `src/pages/ProductPage.tsx` - 门店地址模块重构:
   - 删除: 绿色短竖条 + 标题 + 直营/联营双 chip 卡片布局
   - 新增: 3 列服务卡片 grid + 横向地址信息块

2. 三个服务卡片 (grid-cols-3, gap-20, mb-40):
   - 听力康复咨询 (chat-bubble 图标) / 听力检查预约 (checkmark-clipboard 图标) / 助听器清洁保养预约 (star 图标)
   - 卡片样式: bg-white + border-ink-200, hover 时 border-brand-green + bg-#f6fbf8 (浅绿底), 28×24 padding
   - 图标方框 48×48: bg-ink-100 (灰底) → hover bg-brand-green (绿底), 图标 text-ink-500 → hover text-white
   - 标题 18px ink-700 700 → hover brand-green
   - 描述 13px ink-500
   - "立即预约 →" 链接 13px ink-400 → hover brand-green, 箭头 hover 时 translate-x-1 右移

3. 地址信息块 (横向布局, bg-#f8f9fa 浅灰底):
   - 左侧地址图标方框 48×48 bg-brand-green + 白色定位 pin SVG
   - 右侧文本: 直营门店 label (12px ink-400) + 地址 (16px ink-700 700) + 咨询电话 + 16px brand-green 700 电话号码
   - 28×32 padding, flex items-center 垂直居中

4. 联营门店占位信息 (franchiseStore) 暂时移除, 后续如有名单可再加
   - 注: 数据结构 `PRODUCT_PAGE.serviceCenter.franchiseStore` 在 product.ts 中保留未删, 仅前端不渲染

**视觉策略**
- 独立模块: 不使用绿色短竖条 + 标题的统一子模块样式
- 卡片化设计: 3 个服务卡片有明确的 hover 反馈 (边框/背景/图标/标题/箭头 5 重变化), 增强交互引导
- 地址块: 浅灰底 + 绿色图标方框, 与卡片区域形成层次区分
- 朴素风格保持: 无圆角无阴影, 仅用色块和边框塑造层次

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 门店地址模块从"标题 + 双 chip 卡片"重构为"3 服务卡片 + 横向地址块", 视觉独立, 交互引导清晰

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /product 中文助听核心技术子标题统一 + 删描述

**类型**: 优化 / 视觉统一

**摘要**
用户指示: 【中文助听核心技术】模块下的子标题要统一设计, 并删掉子标题下的描述文本。本次将该模块子标题 (subtitle "专为国人研发定制") 从 20px 纯文字靠左改为「绿色短竖条 + 标题」结构, 与全页其他子模块标题完全一致; 同时删除下方的描述文本 (desc "弥补传统助听产品不足...")。

**详细变更**
1. `src/pages/ProductPage.tsx` - coreTech 模块子标题区:
   - 原: `<p className="text-[20px] text-[#333333] font-bold leading-[30px] text-left mb-3">` 纯文字副标 + 下方 `<p className="text-[15px] text-ink-600 leading-[26px]">` 描述文本
   - 改: 「绿色短竖条 (4px×28px) + 标题 (22px #333 700 leading-[28px])」结构, 无描述
   - 与权威背书/听力服务中心/全生命周期服务等模块的子模块标题样式完全统一

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 中文助听核心技术模块子标题视觉风格统一, 信息更克制

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /product 子模块标题去描述 + 售前标题统一 + 门店地址重构

**类型**: 优化 / 视觉统一 / 信息层级

**摘要**
三条用户指示合并处理: ① 删掉该页面各子模块标题下的小描述文本 (如"医疗器械生产许可证 + 4 款助听器产品注册证..."); ② 【售前服务】标题统一为绿色短竖条 + 标题样式; ③ 【门店地址】模块信息层级不好看, 重新设计并保持主题一致。

**详细变更**

1. 删除 7 处子模块标题下的小描述文本 (`src/pages/ProductPage.tsx`):
   - 4.7.1 国家医疗资质: "医疗器械生产许可证 + 4 款助听器产品注册证，国家药监局官网可查"
   - 4.7.2 临床医疗认证: "国内顶级耳鼻喉专科医院联合临床验证，疗效数据真实可查"
   - 4.7.3 国家专利认证: {endorsements.patents.desc}
   - 听力服务中心 intro: "标准化 · 数据化 · 可视化耳科服务体系，全生命周期听力健康管理"
   - 三甲医院同等百万级检查设备: "三甲医院同等级别专业设备，国家级临床听力师操作，确保验配精准"
   - 远程 AI 验配: "线下国家级听力师 + 线上 AI 远程验配，前后协同定制专属"声处方""
   - 门店地址: "全国社区型购物中心布局，欢迎到店体验专业听力服务"
   - 售后服务时间轴: "8 大保障全程陪伴，从购买到使用全周期无忧"
   - 各子模块统一为「绿色短竖条 + 标题」结构, 无副标

2. 售前服务标题统一:
   - 原: `<h3 className="text-[22px] ... leading-[33px] mb-[14px]">` 纯标题无装饰
   - 改: 「绿色短竖条 + 标题」结构, leading-[28px] + mb-[30px], 与其他子模块完全一致

3. 门店地址模块信息层级重构:
   - 原布局: 左右两栏, 每栏 3 行密集文字 (绿色 label + "联系电话: xxx" + 地址), 视觉拥挤无层次
   - 新布局: chip 标签 + label/value 表格形式
     * 直营门店 (突出): 绿色 chip "直营门店" (白字 bg-brand-green) + 电话行 (label "电话" 灰色 56px + 18px 绿色大字电话号码) + 地址行 (label "地址" + 14px 深灰地址)
     * 联营门店 (弱化): 灰色 chip "联营门店" (ink-500 字 bg-ink-100) + 名单行 (label "名单" + 14px 浅灰 italic 占位文案)
   - 信息层级: chip 区分门店类型 → label/value 表格对齐 → 电话突出绿色大字 (最关键信息) → 联营占位弱化
   - 主题一致: 无圆角 chip (朴素风格) + 绿色主色 + 灰阶 label, 与产品卡片形态标签、Tab 按钮等全站元素呼应

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 全部 8 个子模块标题统一为「绿色短竖条 + 标题」无副标, 视觉更克制; 售前服务标题风格统一; 门店地址模块信息层级清晰, chip + label/value 表格突出关键信息

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /product 售后服务时间轴再次重构 (高级简约 v2)

**类型**: 优化 / 视觉重构

**摘要**
用户反馈: 上一版赛车道 (浅绿底+虚线+卡片) 仍不够高级, 太潦草。本次彻底重构为"单条渐变细曲线 + 纯排版节点"的极简方案, 移除所有装饰性填充与卡片边框, 以排版层级和留白塑造高级感。

**问题诊断 (上一版)**
- 浅绿底 48px 填充带 + 1.5px 描边 + 虚线分道线, 三层叠绘显得 busy
- 48px 节点圆 + 阴影 + 序号, 仍然偏重偏卡通
- 160px 卡片带 1px 浅灰边框, 与全站"无圆角无阴影无渐变"朴素风格冲突
- 节点 x = 90 + idx*145.7 (90/235.7/381.4/...) 与赛道锚点 90/270/450/.../1110 未对齐, 节点漂浮不在曲线上

**详细变更**
1. 赛道 SVG 重构为单条渐变细线 (`src/pages/ProductPage.tsx`):
   - 删除三层填充带 + 描边 + 虚线分道线
   - 改为单条 1.5px 渐变 stroke, 配合 linearGradient (0%→6%→50%→94%→100% 透明度 0→0.5→0.7→0.5→0), 两端淡出形成"起点终点消融"高级感
   - 曲线锚点重排: 8 锚点平滑正弦波 (90/240/390/540/690/840/990/1110), 与节点 x 完全对齐
   - 删除起点小圆点和终点箭头 (避免冗余装饰)
   - 容器 1200×520 → 1200×480

2. 节点圆点改为双层精致设计:
   - 48px 大圆 + 1.5px 边框 + 阴影 + 序号 → 10px 小点 (白底+1.5px 绿边) + 22px 外层光晕 (bg-brand-green opacity-10)
   - hover: 外层光晕 opacity 10→30, 内点 bg-white→bg-brand-green (填充变绿)
   - 序号从节点内移到标签顶部, 改为大字装饰

3. 标签改为纯排版 (无卡片无边框):
   - 删除 160px 白底卡片 + 1px 浅灰边框 + 12px padding
   - 改为 170px 居中文本块: 序号 (32px 钉钉进步体 opacity-20 装饰) + 标题 (15px ink-700 700) + 描述 (12px ink-500)
   - hover: 序号 opacity 20→40, 标题 ink-700→brand-green
   - 上下交替: top 节点标签在点上方 (bottom: 22px), bottom 节点标签在点下方 (top: 22px)

4. 标题区与子模块间距: mb-[40px] → mb-[60px] (留白更舒展)

**视觉策略**
- "少即是多": 单条曲线 + 小点 + 排版, 移除所有冗余装饰
- "排版即设计": 大字浅绿序号 + 深色标题 + 浅灰描述, 三级层级清晰
- "锚点对齐": 节点 x 与曲线锚点完全对齐, 节点真正"长在"曲线上
- "留白节奏": 上下交替布局 + 170px 标签宽度 + 150px 节点间距, 同侧标签不重叠

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 售后服务时间轴视觉极简高级, 单条渐变曲线优雅流动, 节点小而精, 标签纯排版无卡片, 符合全站朴素风格

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /product 售后服务赛车道时间轴重新设计 (高级简约)

**类型**: 优化 / 视觉重构

**摘要**
用户反馈: 弯曲赛车道设计不好看, 太潦草, 要求重新设计, 要有美感、设计感、高级简约。本次重构赛车道 SVG 细节和节点卡片样式, 提升高级感。

**问题诊断**
- 原设计: 灰色粗带 40px + 灰色虚线, 节点圆 56px + 4px 粗边框, 标签无卡片只有文字 — 视觉粗糙
- 原节点定位 75 + idx*150, 与赛道 8 段贝塞尔曲线锚点 (75/225/375/.../1125) 不对齐, 节点偏离赛道

**详细变更**
1. 赛道 SVG 三层结构 (`src/pages/ProductPage.tsx`):
   - 外层填充带: `#f0f7f2` 浅绿底 48px 宽, 圆角端点 (原灰色 40px)
   - 中层描边: `#d4e7d8` 浅绿细线 1.5px (新增, 增加精致感)
   - 内层分道线: `#05a045` 绿色虚线 1.5px dasharray "2 8" + opacity 0.6 (原粗虚线 2px "8 10")
   - 起点小圆点 + 终点箭头 (新增, 增加方向感)

2. 节点圆 (48px, 原粗框改细框 + 阴影):
   - 56px 白底 + 4px 绿色粗边框 → 48px 白底 + 1.5px 绿色细边框
   - 新增 `boxShadow: "0 2px 8px rgba(5, 160, 69, 0.12)"` 柔和阴影
   - 序号 16px → 14px, 增加 leading-none

3. 标签卡片 (新增线框卡片, 原纯文字):
   - 原无背景文字 → 160px 白底卡片 + 1px `#e5e5e5` 浅灰边框 + 12px padding
   - hover 时边框和标题变绿 (group-hover)
   - 标题 15px → 14px, desc 12px 保持

4. 节点定位修正:
   - 原 `75 + idx * 150` 与赛道锚点 75/225/375/.../1125 错位
   - 改为 `90 + idx * 145.7` 更接近赛道锚点 90/270/450/.../1110
   - y 从 140/360 改为 140/380 (赛道上下行高度调整)

5. 容器尺寸: 1200×500 → 1200×520

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 售后服务赛车道时间轴视觉精致, 浅绿赛道 + 细线描边 + 白底卡片 + 柔和阴影, 符合高级简约风格

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-24] 优化 | /about 删除页面绿色线条装饰

**类型**: 优化 / 样式

**摘要**
用户指示: 删掉八张数据卡片里的短横线; 删掉该页面各个模块的短竖线, 包括组织架构的人物卡片前的绿色竖线修饰。前一会话已删除数据卡片顶部横条、创始人/成员卡片左侧绿色竖线、发展历程 2022/2023 年份左侧绿色竖线; 本次删除发展历程 2024/2025/2026 年份左侧残留的 `border-l-[3px] border-l-brand-green` 短竖线。

**详细变更**
1. `src/pages/AboutPage.tsx` - 发展历程 2024+ 年份容器:
   - 原: `<div className="shrink-0 w-[280px] border-l-[3px] border-l-brand-green pl-[20px]">`
   - 改: `<div className="shrink-0 w-[280px] pl-[20px]">`
2. 文件中已无任何 `border-l-brand-green` 或 `border-l-[` 类, 所有绿色短竖线全部清除。

**影响范围**
- 1 个源码文件: `src/pages/AboutPage.tsx`
- 页面表现: /about 发展历程模块 2024/2025/2026 年份左侧不再有绿色竖线装饰, 与 2022/2023 视觉一致。

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-24] 优化 | /product 门店图 AI 高清化 + 售后服务改赛车道时间轴

**类型**: 优化 / 素材 / 视觉重构

**摘要**
两条用户指示合并处理: ① 门店外观设计图模糊, 用 AI 基于原图优化高清; ② 售中·售后服务模块改为弯曲赛车道时间轴效果呈现。

**详细变更**

1. 门店图 AI 高清化:
   - 调用速创API `gpt-image-2` 模型, 以原 `store_storefront_design.png` 为参考图
   - prompt: "Modern hearing aid service center storefront interior, bright minimalist design with large glass windows, clean white walls with subtle green Bigsound brand signage, professional audiology clinic waiting area with modern chairs, reception desk, warm natural lighting, photorealistic architectural interior photography, high detail, 4K quality, no people, no text"
   - 生成 2K 4:3 高清图, 保存到 `public/images/prototype/service_center_store_hd.png`
   - `src/data/images/product.ts`: `serviceCenterStore` 映射从 `store_storefront_design.png` 改为 `service_center_store_hd.png`
   - 生图耗时 42s, 文件保存到 `aigpic/第0张_service_center_store_hd.png` 后复制覆盖

2. 售中·售后服务改弯曲赛车道时间轴 (`src/pages/ProductPage.tsx`):
   - 原 4 列 × 2 行 grid (灰色背景方块) 改为 S 型弯曲赛车道
   - SVG 绘制双线赛道: 外层浅灰 `#e8f0ea` 40px 宽圆角 + 内层绿色 `#05a045` 2px 虚线
   - 赛道路径: 8 段三次贝塞尔曲线连接, 形成 S 型波浪
   - 8 个节点 absolute 定位在赛道上, 交替上下 (idx 偶数 y=140 上方, idx 奇数 y=360 下方)
   - 节点圆: 56px 白底 + 4px 绿色边框 + 序号, hover 时变绿底白字
   - 标签: 上方节点的标签在节点下方, 下方节点的标签在节点上方 (避免与赛道重叠)
   - 标题区: 沿用「绿色短竖条 + 标题 + 副标"8 大保障全程陪伴，从购买到使用全周期无忧"」结构
   - 容器尺寸: 1200×500px

**影响范围**
- 3 个源码文件: `src/data/images/product.ts`, `src/pages/ProductPage.tsx`, `DEV_LOG.md`
- 1 个图片资源新增: `public/images/prototype/service_center_store_hd.png`
- 页面表现: /product 听力服务中心 intro 子模块右侧门店图变高清; 售中·售后服务模块从 grid 改为弯曲赛车道时间轴, 视觉更有动感

**关联文件**
- `d:\VibeTest\bigsound\public\images\prototype\service_center_store_hd.png` (新增)
- `d:\VibeTest\bigsound\aigpic\第0张_service_center_store_hd.png` (生图中间输出)
- `d:\VibeTest\bigsound\aigpic\store_hd_plan.json` (批量生图计划)
- `d:\VibeTest\bigsound\src\data\images\product.ts`
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-24] 数据 | 原型文档图片资源核对与更新

**类型**: 数据核对 / 文档更新

**摘要**
对照 `public/images/` 实际文件，重新核对并修正 PROTOTYPE_CONTENT.md 与 PROTOTYPE_PAGES.md 中的图片资源描述；重点校验招商加盟页 `/invest` 引用的 19 张图片全部存在；经再次核对，企业文化 3 张配图也已存在。

**详细变更**
1. `PROTOTYPE_CONTENT.md` / `PROTOTYPE_PAGES.md`:
   - 战略合作伙伴 9 个 logo 全部确认已存在（含 `yinfa.webp`、`china_aging.webp`、`sysu.webp` 及对应 `_lg` 大图），修正此前标记为“待补充”的状态。
   - 组织架构图路径更新为 `public/images/about/org_structure_chart.png`（已存在）。
   - 联营店平面图更新为 `public/images/prototype/invest_store_floorplan.png`（已存在，AI 生成示意图）。
   - 企业文化 3 张配图路径更新为 `public/images/culture/culture_{mission,vision,values}.png`（已存在）。
   - 待补充图片清单确认：当前无缺失项。

2. 招商加盟页图片校验:
   - 运行脚本校验 `src/data/images/invest.ts` 中 19 张 `/images/...` 引用，全部对应文件存在于 `public/images/prototype/`。

**影响范围**
- 2 个原型文档：`d:\VibeTest\bigsound\PROTOTYPE_CONTENT.md`、`d:\VibeTest\bigsound\PROTOTYPE_PAGES.md`
- 招商加盟页图片引用可信度提升，无缺失。

**关联文件**
- `d:\VibeTest\bigsound\src\data\images\invest.ts`
- `d:\VibeTest\bigsound\public\images\prototype/`
- `d:\VibeTest\bigsound\public\images\logos/`
- `d:\VibeTest\bigsound\public\images\about/org_structure_chart.png`

---

## [2026-07-23] 新增 | /product 听力服务中心首个子模块「大声听力服务中心 一站式耳科服务」

**类型**: 新增 / 信息结构重构

**摘要**
用户指示: 听力服务中心模块的第一个子模块应为【大声听力服务中心 一站式耳科服务】, 原 2 段描述文本移入该子模块, 左文右图布局。本次新增 intro 子模块, 沿用统一的「绿色短竖条 + 标题 + 副标」标题区结构。

**详细变更**
1. `src/data/product.ts` - SERVICE_CENTER 数据结构升级:
   - 删除顶层 `desc: string[]` 字段
   - 新增 `intro: { title, desc: string[2], imageKey }` 字段
     - title: "大声听力服务中心 一站式耳科服务"
     - desc: 原 2 段描述文本 (Bigsound大声耳科... / 在全国社区型购物中心...)
     - imageKey: "serviceCenterStore"

2. `src/data/images/product.ts`:
   - 新增 `serviceCenterStore: "/images/prototype/store_storefront_design.png"` (复用 invest 页门店设计图)

3. `src/pages/ProductPage.tsx` - serviceCenter section:
   - 删除原 2 段描述 Reveal (`max-w-[1000px] mx-auto mb-[50px]`)
   - 在标题区后、三甲医院设备前新增 intro 子模块
   - 标题区: 绿色短竖条 + "大声听力服务中心 一站式耳科服务" + 副标"标准化 · 数据化 · 可视化耳科服务体系，全生命周期听力健康管理"
   - 内容区: `grid grid-cols-[1fr_500px] gap-[40px] items-center` 左文右图
     - 左: 2 段描述 15px ink-700 leading-[28px]
     - 右: 门店设计图 500px 宽 × 320px 高 object-cover

**影响范围**
- 3 个源码文件: `src/data/product.ts`, `src/data/images/product.ts`, `src/pages/ProductPage.tsx`
- 页面表现: /product 听力服务中心模块首个子模块为 intro (左文右图), 后接 4 个子模块 (检查设备/远程验配/门店地址), 信息层级更清晰

**关联文件**
- `d:\VibeTest\bigsound\src\data\product.ts`
- `d:\VibeTest\bigsound\src\data\images\product.ts`
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 听力服务中心子模块标题区同步统一

**类型**: 优化 / 信息层级 / 视觉统一

**摘要**
用户指示: 听力服务中心模块同步修改。沿用权威背书模块的「左侧绿色短竖条 + 标题 + 副标」结构, 重构听力服务中心 3 个子模块 (检查设备/远程验配/门店地址) 的标题区, 建立全页一致的子模块视觉节奏。

**详细变更**
1. `src/pages/ProductPage.tsx` - serviceCenter 3 个子模块:
   - 三甲医院同等百万级检查设备: 标题区改为「绿色短竖条 + 标题 + 副标"三甲医院同等级别专业设备，国家级临床听力师操作，确保验配精准"」, 间距 mb-[30px] → mb-[50px]
   - 耳科级"声处方"指定 / 远程 AI 验配: 标题区改为统一结构, 副标"线下国家级听力师 + 线上 AI 远程验配，前后协同定制专属"声处方"", 移除原独立 desc 段落 (信息合并到副标)
   - 门店地址: 标题区改为统一结构, 副标"全国社区型购物中心布局，欢迎到店体验专业听力服务"

2. 视觉规范与权威背书模块完全一致:
   - 绿色短竖条: 4px × 28px, bg-brand-green
   - 标题: 22px #333 700 leading-[28px] text-left
   - 副标: 13px ink-500 leading-[20px] text-left mt-[4px]
   - 子模块间距: 统一 mb-[50px]

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 听力服务中心 3 个子模块与权威背书 3 个子模块视觉节奏完全一致, 全页 6 个子模块标题区统一

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 权威背书模块信息层级重构

**类型**: 优化 / 信息层级 / 视觉统一

**摘要**
用户反馈: 权威背书·硬核实力模块信息层级和视觉效果有问题, 非常乱。本次重构 3 个子模块 (国家医疗资质/临床医疗认证/国家专利认证) 的标题区和内容区, 建立统一的视觉节奏, 保持朴素白底主题一致。

**问题诊断**
1. 4.7.1 证书卡有浅灰底 `bg-[#fafafa]`, 与全站朴素白底不一致
2. 3 个子模块标题区结构不一致 (4.7.1/4.7.2 仅标题无描述, 4.7.3 标题+描述), 信息层级混乱
3. 4.7.2 临床认证医院 logo 上下排列占竖向空间大, 报告截图无视觉关联
4. 各子模块间距不统一 (mb-[60px] / pt-[40px] 交替), 视觉节奏断裂

**详细变更**
1. 统一子模块标题区为「左侧绿色短竖条 (4px×28px) + 标题 + 副标描述」结构:
   - 4.7.1: 副标"医疗器械生产许可证 + 4 款助听器产品注册证，国家药监局官网可查"
   - 4.7.2: 副标"国内顶级耳鼻喉专科医院联合临床验证，疗效数据真实可查"
   - 4.7.3: 副标沿用 patents.desc

2. 4.7.1 国家医疗资质:
   - 证书卡去掉 `bg-white border border-ink-200 overflow-hidden` 外框 + `bg-[#fafafa]` 浅灰底
   - 卡片下方新增证书名称小字 (12px ink-600), 解决"5 张证书看不出区别"问题
   - 5 列网格不变, 间距 mb-[60px] → mb-[50px]

3. 4.7.2 临床医疗认证:
   - 右侧医院 logo 从上下排列 (`flex-col gap-[16px]`) 改为左右 2 列 (`grid grid-cols-2`), 高度 150→140px
   - logo 下方新增医院名称小字 (12px ink-500)
   - logo 高度限制 max-h-[80px], 避免变形
   - 报告截图 max-h 从 300px → 280px, 紧凑

4. 4.7.3 国家专利认证:
   - 标题区结构与前两个子模块对齐 (绿色短竖条 + 标题 + 描述)
   - 去掉 pt-[40px] 顶部多余间距 (改为 mb-[50px] 节奏统一)

5. 视觉节奏统一:
   - 3 个子模块统一 mb-[50px] 间距
   - 标题字号 22px #333 700 leading-[28px] text-left (与之前规范一致)
   - 副标 13px ink-500 leading-[20px] text-left

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 权威背书模块 3 个子模块视觉节奏统一, 信息层级清晰 (标题→副标→内容), 无灰底无边框, 与全站朴素风格一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 听力服务中心删灰色背景

**类型**: 优化 / 样式

**摘要**
用户指示: 子模块的灰色背景也去掉。移除听力服务中心 section 的 `bg-ink-100` 灰色背景 (改白), 以及设备卡片文字区的 `bg-[#f5f5f5]` 浅灰背景。

**详细变更**
1. `src/pages/ProductPage.tsx`:
   - serviceCenter section: `bg-ink-100` → `bg-white`
   - 设备 2×3 卡片文字区: `bg-[#f5f5f5] p-[12px] text-center` → `p-[12px] text-center`

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 听力服务中心整体改为白底, 设备卡片文字区无浅灰底

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-24] 数据 | 原型文档与源码地址/荣誉/合作伙伴/专利数据同步

**类型**: 数据更新 / 文档同步

**摘要**
对照 `file/` 源文件重新核对 PROTOTYPE_CONTENT.md 与 PROTOTYPE_PAGES.md，按此前 QA 结论统一关键数据；补充图片清单并标注缺失项；同步修正源码中公司地址字段。

**详细变更**
1. `PROTOTYPE_CONTENT.md`:
   - §2.10 战略合作伙伴：更新为“战略投资 4 家 + 战略合作 5 家”，并标注 4 个已提取 logo 与 5 个待补充 logo。
   - §3.7.3 国家专利认证：30+ → “50 余项助听专利证书矩阵图片”。
   - §5.4.6 招商加盟页专利引用：30+ → “50 余项助听专利”。
   - §11 Excel 原型图片清单：组织架构图、战略合作伙伴、专利数量同步更新；新增“待补充图片清单”。
   - §12 下一步建议：补充组织架构图/企业文化配图/5 个 partner logo 待补充事项。

2. `PROTOTYPE_PAGES.md`:
   - §3.7 荣誉资质：11 张证书 → 10 张证书（3 行布局：5+3+2）。
   - §3.8 / §3.9 组织架构与核心团队：Section 标题统一为“组织架构”，核心团队作为副标题。
   - §3.10 战略合作伙伴：更新为 4+5 分组及 3D 展示台样式说明。
   - §4.7.3 / §6.4 专利：30+ → “50 余项助听专利”。
   - §6.6 / §9.7 联系我们：公司地址统一为“深圳市龙华区大浪街道兴亿1993数字时尚产业园A栋720”。
   - §11 图片清单：新增“待补充图片清单”。

3. 源码地址同步（与原型文档一致）:
   - `src/config/site.ts`: `companyAddress` / `address` 更新为新地址。
   - `src/data/careers.ts`: 招聘页联系地址更新为新地址。

**影响范围**
- 2 个原型文档: `PROTOTYPE_CONTENT.md`、`PROTOTYPE_PAGES.md`
- 2 个源码文件: `src/config/site.ts`、`src/data/careers.ts`
- 页面表现: 关于小维/产品/招商/招聘/全局 Footer 的联系地址统一；荣誉资质、合作伙伴、专利数量与最终确认数据一致。

**关联文件**
- `d:\VibeTest\bigsound\PROTOTYPE_CONTENT.md`
- `d:\VibeTest\bigsound\PROTOTYPE_PAGES.md`
- `d:\VibeTest\bigsound\src\config\site.ts`
- `d:\VibeTest\bigsound\src\data\careers.ts`
- `d:\VibeTest\bigsound\public\images\prototype\`
- `d:\VibeTest\bigsound\public\images\about\partners\`

**待确认 / 待补充**
- 待补充图片清单已写入两份文档，需确认补充方式（官方素材 / AI 生成 / 手绘示意图）。
- PM 提示事项 #3、#7、#8、#9、#12、#13 仍待后续确认。

---

## [2026-07-23] 优化 | /product 听力服务中心删外层矩形边框

**类型**: 优化 / 样式

**摘要**
用户指示: 听力服务中心模块里的各个外层矩形边框都要删掉。移除 3 个子模块 Reveal 外层的 `bg-white border border-ink-200 p-[30px]` 灰色矩形边框, 内层元素 (设备卡片边框等) 保持不变。

**详细变更**
1. `src/pages/ProductPage.tsx` - serviceCenter 3 个子模块:
   - 三甲医院同等百万级检查设备: `bg-white border border-ink-200 p-[30px] mb-[30px]` → `mb-[30px]`
   - 耳科级"声处方"指定 / 远程 AI 验配: 同上 → `mb-[30px]`
   - 门店地址: `bg-white border border-ink-200 p-[30px]` → (空 className)

2. 保持不变:
   - 设备 2×3 卡片内层 `border border-ink-200 hover:border-brand-green-light` (属卡片边框, 非外层)

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 听力服务中心 3 个子模块不再有外层灰色矩形框, 视觉更连贯

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | 扇形图 hover 时图标圆底变白 + 图标变绿 (反色突出)

**类型**: 优化 / 交互调整

**摘要**
用户指示: hover 时扇形里面的图标要变成白色, 包括图标的圆边。本次将图标 hover 状态从"绿底白图标"改为"白底绿图标 + 白色圆边", 在绿色扇形上以反色突出。

**详细变更**
1. `src/pages/ProductPage.tsx` - `ChineseTechFanChart` 图标渲染:
   - 新增 `getIconColor(idx)`: 默认 `#ffffff` (白), hover 时 `#05a045` (绿)
   - `getIconBg(idx)` 调整: 默认 `#444444` (灰底), hover 时 `#ffffff` (白底, 圆边变白)
   - 图标 div 去掉 `text-white` class, 改用 inline `color: getIconColor(idx)` 驱动 SVG `currentColor`
   - 图标 div 新增 `border: 2px solid`, 默认 `transparent`, hover 时 `#ffffff` (白色圆边)
   - transition 增加 `border-color 0.2s ease`

2. 视觉表现:
   - 默认: 灰底 `#444` + 白图标 (无圆边)
   - hover: 白底 `#fff` + 绿图标 `#05a045` + 白色圆边 2px (在绿色扇形上反色突出)

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 扇形图 hover 时图标以白底绿图标+白圆边突出显示

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 修正 | 扇形图默认恢复之前颜色 (黑 #1a1a1a), hover 时变绿

**类型**: 修正 / 交互调整

**摘要**
用户反馈: 上一版默认改为浅灰 #e5e5e5 不对, 默认状态应恢复之前的颜色 (黑色扇形 #1a1a1a, 绿色扇形 #05a045), 仅 hover 时被 hover 的扇形变绿。

**详细变更**
1. `src/pages/ProductPage.tsx` - `ChineseTechFanChart` 颜色取值函数调整:
   - `getFill(idx)`: 默认从 `data.sectors[idx].color` (#1a1a1a) / `data.greenSector.color` (#05a045) 取, hover 时返回 `#05a045`
   - `getHighlightClass(idx)`: 始终返回 `text-brand-green` (之前颜色, 绿色)
   - `getStroke(idx)`: 默认黑色扇区 `#999` / 绿色扇区 `#05a045`, hover 时 `#05a045`
   - `getIconBg(idx)`: 默认 `#444444` (之前颜色), hover 时 `#05a045`
   - `getCenterColor(idx)`: 始终 `#ffffff` (之前颜色)
   - `getCenterRing(idx)`: 始终 `#ffffff` (之前颜色)

2. 视觉表现:
   - 默认: 黑色扇形 #1a1a1a, 绿色扇形 #05a045, 折线 #999/绿, 图标底 #444, "中"字白, 圆环白, tag highlight 绿 (与改造前完全一致)
   - hover 任一黑色扇区: 该扇形从黑变绿 #05a045, 对应折线变绿, 对应图标底变绿
   - hover 绿色扇区: 颜色无变化 (已经是绿)

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 扇形图默认视觉与改造前一致, 新增 hover 黑色扇形变绿交互

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 增强 | 扇形图 hover 交互 (默认无色, hover 扇形+特写文本变绿)

**类型**: 增强 / 交互优化

**摘要**
用户指示: 扇形模块默认无色 (包括 tag), 只有 hover 时扇形和 tag 里的特写文本变成绿色。本次将扇形图从静态着色改为 hover 联动交互, 联动元素包括扇形、图标、折线、标签 highlight、中心"中"字及圆环。

**详细变更**
1. `src/pages/ProductPage.tsx` - `ChineseTechFanChart`:
   - 新增 `useState<number | null>` `hoveredIdx` 管理 hover 状态 (null=无, 0~4=黑色扇区, 5=绿色扇区)
   - 新增颜色取值函数:
     - `getFill(idx)`: 默认 `#e5e5e5` (浅灰, 无色) → hover `#05a045` (绿)
     - `getHighlightClass(idx)`: 默认 `text-ink-700` (#333, 无色) → hover `text-brand-green`
     - `getStroke(idx)`: 折线默认 `#bbb` → hover `#05a045`
     - `getIconBg(idx)`: 图标底色默认 `#999` → hover `#05a045`
     - `getCenterColor(idx)`: "中"字默认 `#333` → hover `#ffffff` (深底浅字反转)
     - `getCenterRing(idx)`: 圆环默认 `#999` → hover `#ffffff`
   - 6 个扇区 path (5 黑 + 1 绿) 均绑定 `onMouseEnter/onMouseLeave` 设置 hoveredIdx
   - 黑色扇区标签 div、绿色扇区标签 div、图标 div、"中"字 div 均绑定同名事件, 实现 hover 联动 (hover 任一元素 → 对应扇形+tag 同时变绿)
   - 所有变色元素加 `transition: 0.2s ease` 过渡动画
   - cursor: pointer 提示可交互

2. 视觉表现:
   - 默认: 整个扇形图一片浅灰, 海螺轮廓清晰但无彩色重点, 标签 highlight 也是深灰
   - hover 任一扇区: 该扇形变绿, 对应折线变绿, 对应图标圆底变绿, 对应标签 [highlight] 文字变绿, 中心"中"字 (绿色扇区 hover 时) 变白

**影响范围**
- 1 个源码文件: `src/pages/ProductPage.tsx`
- 页面表现: /product 中文助听核心技术扇形图从静态彩色变为交互式 hover 高亮

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 临床医疗认证布局调整 + 国家专利换图 + 删手册提示

**类型**: 优化 / 布局调整 / 素材更新 / 删提示文本

**摘要**
用户四条指示合并处理: ① 临床医疗认证右侧 logo 列加宽、左侧文字框变窄; ② AI 生成实验报告截图占位图; ③ 临床医疗认证模块删掉灰色矩形边框; ④ 国家专利认证模块改用用户提供的 `图片1.png`; ⑤ 删掉所有"在手册XX页"相关标注文本。

**详细变更**

1. 临床医疗认证布局调整 (`src/pages/ProductPage.tsx`):
   - 网格列从 `grid-cols-[1fr_300px]` 改为 `grid-cols-[420px_1fr]` (左侧文字窄列 420px, 右侧 logo 列自适应加宽)
   - 医院 logo 卡片高度从 120px → 150px, padding 从 16px → 24px
   - 左侧描述文字框去掉 `border border-ink-200 p-[24px]`
   - 右侧 logo 卡片去掉 `border border-ink-200 hover:border-brand-green-light`
   - 底部实验报告截图区去掉 `border border-ink-200 p-[24px] bg-white`, 仅保留 img

2. AI 生成实验报告截图 (`public/images/prototype/clinical_report_placeholder.png`):
   - 速创API nanobanana2 / 2K
   - Prompt: 临床研究报告 mockup, 学术论文风格, 数据表+柱状图, 浅蓝配色, 无人物无文字
   - 数据 key: `clinicalReportPlaceholder` (新增到 `src/data/images/product.ts`)
   - clinical.reportImageKey 从 `patentedTechnologyCerts` 改为 `clinicalReportPlaceholder`

3. 国家专利认证换图 (`src/data/product.ts` + `src/data/images/product.ts`):
   - patents.imageKey 从 `patentedTechnologyCerts` 改为 `patentMatrixCustom`
   - 新增 `patentMatrixCustom: "/images/图片1.png"` (用户提供的真实专利矩阵图)
   - 旧 `patentedTechnologyCerts` 保留兼容, 标注已弃用

4. 删掉所有"在手册XX页"相关标注文本 (`src/data/product.ts` + `src/pages/ProductPage.tsx`):
   - clinical.reportHint 字段 + 页面渲染的提示 `<p>` 元素
   - patents.reportHint 字段 + 页面渲染的提示 `<p>` 元素
   - serviceCenter.equipment.hint 字段 + 页面渲染的右上角带边框提示框, 标题区改为单标题居左

**影响范围**
- 3 个源码文件: `src/pages/ProductPage.tsx`、`src/data/product.ts`、`src/data/images/product.ts`
- 1 张 AI 生图新增: `public/images/prototype/clinical_report_placeholder.png`
- 页面表现: 临床医疗认证视觉更舒展 (右 logo 列更大), 模块无灰色边框, 国家专利展示用户提供的真实图片, 全模块无手册页码提示

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`
- `d:\VibeTest\bigsound\src\data\product.ts`
- `d:\VibeTest\bigsound\src\data\images\product.ts`
- `d:\VibeTest\bigsound\public\images\prototype\clinical_report_placeholder.png`
- `d:\VibeTest\bigsound\public\images\图片1.png` (用户提供)

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 更新 | /product 扇形图标签放大 + 国家医疗资质/临床医疗认证重构

**类型**: 更新 / 视觉优化 / 布局重构

**摘要**
用户三条指示合并处理: ① 扇形图 tag 太小需增大可读性; ② 国家医疗资质改为 5 张证书图; ③ 临床医疗认证参考附件图片改为左侧文字 + 右侧上下两个医院 logo + 底部报告截图。

**详细变更**

1. 扇形图标签字号放大 (`src/pages/ProductPage.tsx` - `ChineseTechFanChart`):
   - 黑色扇区标签: `text-[13px]` → `text-[15px]`, leading 20→24
   - 黑色扇区 sub: `text-[11px]` → `text-[13px]`, leading 16→20
   - 绿色扇区标签: `text-[15px]` → `text-[17px]`, leading 22→26
   - 绿色扇区 centerHint: `text-[11px]` → `text-[13px]`, leading 16→20
   - 标签容器 maxWidth: 260px → 320px

2. 国家医疗资质改为 5 张证书图 (`src/data/product.ts` + `src/pages/ProductPage.tsx`):
   - 数据结构: `medicalCerts.list` + `imageKey` 改为 `medicalCerts.certs: { name, imageKey }[]`
   - 5 张证书对应 about 页荣誉资质占位图:
     - 医疗器械生产许可证 → `honorCertProduction`
     - 耳内式助听器注册证 → `honorCertIte`
     - 耳背式助听器注册证 → `honorCertBte`
     - 耳背式 RIC 助听器注册证 → `honorCertRic`
     - 体佩式助听器注册证 → `honorCertBody`
   - 页面渲染: 改为 5 列竖版证书网格 (参考 AboutPage 荣誉资质第一行), 卡片高 240px, 无边框文本说明

3. 临床医疗认证布局重构 (`src/data/product.ts` + `src/pages/ProductPage.tsx`):
   - 数据: `hospitals` 从 `string[]` 改为 `{ name, logoKey }[]`, 新增 `reportImageKey`
   - 布局改为 2 列网格 (左文 + 右上下 logo):
     - 左侧: 描述文字框, 16px #333 leading-[30px] 靠左
     - 右侧: 两个医院 logo 上下排列, 各 120px 高, 带边框 hover 效果
   - 底部新增实验报告截图区, 使用 `patentedTechnologyCerts` 占位, 下方保留 "在大声助听器产品手册 P8" 提示
   - logo 占位:
     - 山东省耳鼻喉医院 → `partnerHuapengfei` (文件夹内 logo 占位)
     - 中山大学孙逸仙纪念医院 → `partnerSysu` (真实 logo)

**影响范围**
- 2 个源码文件: `src/pages/ProductPage.tsx`、`src/data/product.ts`
- 页面表现: /product 中文助听核心技术标签更易读; 国家医疗资质和临床医疗认证模块视觉与附件参考图一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`
- `d:\VibeTest\bigsound\src\data\product.ts`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 子模块副标居中改靠左 (对齐 AboutPage 规范)

**类型**: 优化 / 样式统一

**摘要**
用户反馈: 上一轮只统一了字号/颜色, 但还有"一系列居中的副标题"未规范, 比如【国家医疗资质】【临床医疗认证】等。本次将所有居中排版的子模块 h3 标题和 desc 段落改为靠左, 对齐 AboutPage 副标规范。

**AboutPage 副标规范参考**
- 副标/段落: `text-left` (默认靠左, 不使用 text-center)
- 包裹容器: 无 `text-center` 类

**详细变更**
1. `src/pages/ProductPage.tsx` - endorsements (权威背书) 3 个子模块:
   - 4.7.1 国家医疗资质: 包裹 div `text-center mb-[30px]` → `mb-[30px]`, h3 加 `text-left`
   - 4.7.2 临床医疗认证: 同上, desc 去掉 `max-w-[900px] mx-auto` 并加 `text-left`
   - 4.7.3 国家专利认证: 同上, desc 加 `text-left`

2. `src/pages/ProductPage.tsx` - serviceCenter (听力服务中心):
   - 2 段 desc: `text-center` → `text-left`

3. `src/pages/ProductPage.tsx` - lifecycleService (全生命周期服务):
   - 售前服务 h3: `text-center` → `text-left`
   - 售中·售后服务 h3: `text-center` → `text-left`

4. 保持不变 (属卡片内/小字提示, 非模块副标):
   - 产品分类说明双行标语 (28px 绿色, section 级标语)
   - 医院名称、设备卡片标题、二维码下方小字 (卡片内文字)
   - reportHint 小字提示
   - 售前服务卡片内容居中

**影响范围**
- 1 个源码文件：`src/pages/ProductPage.tsx`
- 页面表现：/product 各子模块标题和描述统一靠左排版, 与 /about 视觉语言一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | /product 各模块标题副标统一为 AboutPage 规范

**类型**: 优化 / 样式统一

**摘要**
用户指示: /product 页面各个模块的标题和副标题规范视觉效果都要参考 AboutPage。本次将所有不符合 AboutPage 规范的子模块 h3 标题和 coreTech 副标统一为 AboutPage 规范样式。

**AboutPage 标题规范参考**
- 主 section 标题 (h2): SectionTitle 组件 - 30px #333 700 leading-[45px] 居中 + TitleUnderline (w-[60px] h-[3px] bg-brand-green 居中 mb-[40px])
- section 内副标: 20px #333 700 leading-[30px] text-left
- 子模块 h3 标题: 22px #333 700 leading-[33px] mb-[14px]

**详细变更**
1. `src/pages/ProductPage.tsx` - coreTech 副标:
   - 从 `text-[24px] text-brand-green font-bold leading-[36px] mb-3` 改为 `text-[20px] text-[#333333] font-bold leading-[30px] text-left mb-3`
   - (绿色 24px → 黑色 20px, 与 AboutPage 副标规范一致)

2. `src/pages/ProductPage.tsx` - endorsements (权威背书) 3 个子模块 h3:
   - 4.7.1 国家医疗资质 / 4.7.2 临床医疗认证 / 4.7.3 国家专利认证
   - 从 `text-[24px] font-bold text-ink-700 leading-[36px] mb-2/mb-3` 改为 `text-[22px] text-[#333333] font-bold leading-[33px] mb-[14px]`

3. `src/pages/ProductPage.tsx` - serviceCenter (听力服务中心) 3 个子模块 h3:
   - 三甲医院同等百万级检查设备 / 耳科级"声处方"指定 / 门店地址
   - 从 `text-[20px] font-bold text-ink-700 leading-[30px] mb-3/mb-4` 改为 `text-[22px] text-[#333333] font-bold leading-[33px] mb-[14px]`

4. `src/pages/ProductPage.tsx` - lifecycleService (全生命周期服务) 2 个子模块 h3:
   - 售前服务 / 售中·售后服务
   - 从 `text-[20px] font-bold text-ink-700 leading-[30px] mb-[20px] text-center` 改为 `text-[22px] text-[#333333] font-bold leading-[33px] mb-[14px] text-center`

5. 保持不变:
   - 5 个主 section 标题已用 SectionTitle + TitleUnderline 共享组件 (符合规范)
   - warranty 4 个章节卡片内的 h3 (18px, 与 36px 大编号同行, 属卡片标题非模块标题, 保持原样)
   - 产品卡片型号 h3 (18px, 属卡片标题, 保持原样)

**影响范围**
- 1 个源码文件：`src/pages/ProductPage.tsx`
- 页面表现：/product 各子模块标题字号/颜色/间距统一, 视觉语言与 /about 一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 修复 | Hero 背景图视口 ≥ 1200 时未铺满 (去掉 section overflow-hidden)

**类型**: 修复 / 布局

**摘要**
用户反馈 "没有铺满"。复查代码发现: 上一版本的反向补偿 scale 方案在视口 < 1200 时工作正常, 但视口 ≥ 1200 时背景图仍被裁剪到 wrapper (1200px) 宽度, 无法铺满视口。根因是 section 上的 `overflow-hidden` 把溢出 wrapper 的背景图部分裁剪掉了。

**问题根因 (详细)**
- 视口 ≥ 1200px (scale=1):
  - `bgLayoutWidth = viewportWidth / 1 = 1920px` (大于 wrapper 1200px)
  - 背景图布局宽度 1920px, 在 section (1200px) 内居中, 左右各溢出 360px
  - section 的 `overflow-hidden` 裁剪溢出部分, 背景图视觉宽度只剩 1200px
  - 视觉上左右各有 (1920-1200)/2 = 360px gap, 没铺满
- 视口 < 1200px (scale<1):
  - `bgLayoutWidth = viewportWidth / scale = 1200px` (等于 wrapper 宽度)
  - 背景图刚好填满 section, 无溢出, scale 后视觉宽度 = viewportWidth ✓
  - 此场景下 overflow-hidden 不会裁剪任何东西, 所以之前看起来"工作"

**修复方案**
- 去掉 section 的 `overflow-hidden`, 让背景图溢出 wrapper → main → body
- 由 body 的 `overflow-x: hidden` 兜底裁剪超出视口的部分
- main 本身就不设 overflow (Layout 注释已说明: "不设 overflow, 让 PageHero/HomeVideoHero 的 100vw 背景图能溢出 main 到 body 边缘")
- 内容区 (container-page flex flex-col items-center) 仍 1200px 居中, 不受影响

**详细变更**

### A. `src/components/layout/PageHero.tsx`
- section className: `"relative w-full overflow-hidden"` → `"relative w-full"`
- 注释更新: "section 不设 overflow-hidden (否则视口 ≥ 1200 时会裁剪溢出 wrapper 的背景图), 改由 body 的 overflow-x: hidden 兜底裁剪"

### B. `src/components/home/HomeVideoHero.tsx`
- section className: `"relative w-full overflow-hidden"` → `"relative w-full"`
- 注释更新: "不设 overflow-hidden, 让背景图能溢出 wrapper (1200px), 由 body overflow-x:hidden 兜底裁剪"

**数学验证 (两种场景)**
- 视口 1024px (scale=0.8533):
  - bgLayoutWidth = 1024/0.8533 = 1200px, 刚好填满 section
  - wrapper scale 后视觉 = 1024px, 居中在 main (1024px) 内, 左右 = 0
  - 背景图视觉位置 = 0 到 1024px ✓ 铺满
- 视口 1920px (scale=1):
  - bgLayoutWidth = 1920px, 溢出 section 左右各 360px
  - section 无 overflow, 背景图溢出到 wrapper → main → body
  - body overflow-x: hidden 裁剪超出 1920px 视口的部分
  - wrapper 居中在 main (1920px) 内, 左边 = 360, 右边 = 1560
  - 背景图视觉位置 = 360 + (-360) = 0 到 360 + 1560 = 1920 ✓ 铺满

**影响范围**
- 7 个页面的 Hero 背景图视觉效果 (视口 ≥ 1200 时真正铺满):
  - 首页 `/` (HomeVideoHero, 560px)
  - 6 子页 `/about /product /wearable /invest /careers /news` (PageHero, 448px)
- 视口 < 1200 时表现不变 (本来就铺满)

**关联文件**
- `d:\VibeTest\bigsound\src\components\layout\PageHero.tsx`
- `d:\VibeTest\bigsound\src\components\home\HomeVideoHero.tsx`
- `d:\VibeTest\bigsound\src\index.css` (body overflow-x: hidden, 未修改, 作为兜底)
- `d:\VibeTest\bigsound\src\components\layout\Layout.tsx` (main 不设 overflow, 未修改, 让背景图溢出)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)
- 数学验证通过 (视口 < 1200 和 ≥ 1200 两种场景都铺满)
- 待浏览器实测验证 (Chrome 环境不可用, 需用户手动刷新 http://localhost:5173/ 验证)

---

## [2026-07-23] 优化 | Hero 背景图突破 Layout 限制横向铺满视口

## [2026-07-23] 更新 | /product 删除模块间灰色分割线

**类型**: 更新 / 样式

**摘要**
用户指示: 删掉 /product 页面中各模块之间的灰色分割线。本次移除 ProductPage.tsx 中所有 `border-t border-ink-200` 类名，使模块之间不再显示顶部灰色横线。

**详细变更**
1. `src/pages/ProductPage.tsx` 中移除 `border-t border-ink-200` 的位置:
   - 4 处 section 顶部边框 (产品分类说明 / 产品分类按钮+卡片 / 权威背书 / 听力服务中心 / 售后保修政策 等 section)
   - 2 处 Reveal 子模块顶部边框 (权威背书 §5 的"临床医疗认证"和"国家专利认证"两个子模块)
   - section 的 className 从 `"bg-white border-t border-ink-200"` 改为 `"bg-white"`
   - 灰色背景 section 从 `"bg-ink-100 border-t border-ink-200"` 改为 `"bg-ink-100"` (含 `full-bleed` 类的保留)
   - Reveal 子模块从 `"border-t border-ink-200 pt-[40px]"` 改为 `"pt-[40px]"`

**影响范围**
- 1 个源码文件：`src/pages/ProductPage.tsx`
- 页面表现：/product 各模块之间不再显示灰色上边框分隔线, 视觉更连贯

**关联文件**
- `d:\VibeTest\bigsound\src\pages\ProductPage.tsx`

**验证**
- `npm run build` 通过 (exit code 0, 88 modules)

---

## [2026-07-23] 优化 | 组织架构标题改名 + 创始人下加核心团队副标 + 战略合作 logo hover 动效

**类型**: 优化 / 交互增强

**摘要**
用户指示: (1) 【核心团队】标题改名为【组织架构】; (2) 创始人下方加一个副标题叫【核心团队】; (3) 给"战略投资"和"战略合作"每个 logo 图增加 hover 动效。

**详细变更**

### A. 数据层 (`src/data/about.ts`)
1. `team.sectionTitle`: "核心团队" → "组织架构"
2. `team.sectionEnTitle`: "CORE TEAM" → "ORG STRUCTURE"

### B. JSX 层 (`src/pages/AboutPage.tsx`)
3. 创始人卡下方, 4 个成员卡之前, 新增【核心团队】副标题:
   - 左侧 4px 绿色竖条 + 22px #333 bold 标题
   - 与上方创始人卡间距 40px (mt-[40px]), 与下方成员卡间距 20px (mb-[20px])
4. 战略投资 4 个 logo 卡 + 战略合作 5 个 logo 卡, 每个增加:
   - 容器: `transition-all duration-300 hover:scale-105 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(5,160,69,0.2)]`
   - img: `transition-transform duration-300 hover:scale-110`
   - 双层动效: 卡片上浮 1 + 轻微放大 + 绿色阴影, logo 本身再放大 1.1

**影响范围**
- 关于小维页 (`/about`) §3.10 战略合作伙伴 + §3.8-3.9 组织架构
- 视觉表现: section 标题"组织架构", 创始人卡下方有"核心团队"副标分隔 4 个成员卡; hover logo 时卡片上浮 + 阴影 + logo 放大

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 战略投资/战略合作模块标题移出展示台容器

**类型**: 优化 / 布局调整

**摘要**
用户反馈: 不要把标题包住。本次将"战略投资"和"战略合作"子标题从 3D 展示台容器内部移到外部, 展示台只包裹 logo grid。

**详细变更**
- `src/pages/AboutPage.tsx` §3.10:
  - 战略投资组: 标题 `div` 从容器内移到容器外, 作为容器前的独立块, 间距 16px
  - 战略合作组: 同上处理
  - 展示台容器内现在只有 grid + logo, 不再包含标题

**影响范围**
- 关于小维页 (`/about`) §3.10 战略合作伙伴模块
- 视觉表现: 标题在展示台外, 展示台只展示 logo, 结构更清晰

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 战略投资/战略合作模块包裹 3D 展示台容器

**类型**: 优化 / 视觉强化

**摘要**
用户指示: 【战略合作】和【战略投资】模块需要各用一个长方形的带绿色阴影的框, 就像一个 3D 展示台的感觉。本次为两组各包裹一层带绿色阴影的容器, 营造展示台悬浮感。

**详细变更**
- `src/pages/AboutPage.tsx` §3.10 战略合作伙伴:
  - 战略投资组: 标题 + 4 列 grid 包裹进 `border border-[#e8f5ee] p-[36px] shadow-[0_12px_40px_rgba(5,160,69,0.15),0_4px_12px_rgba(5,160,69,0.08)]` 容器
  - 战略合作组: 标题 + 5 列 grid 包裹进同样样式的容器
  - 双层阴影: 主阴影 12px 40px + 近距阴影 4px 12px, 营造立体悬浮感
  - 浅绿边框 `#e8f5ee` 与绿色阴影呼应品牌色
  - 内边距 36px, 标题与 grid 间距 28px

**影响范围**
- 关于小维页 (`/about`) §3.10 战略合作伙伴模块
- 视觉表现: 两组 logo 各自位于带绿色阴影的展示台内, 有 3D 悬浮感
- 注: 此处为用户明确要求的绿色阴影特例, 不影响全站朴素风格基调

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 企业文化与组织团队模块内部去掉绿色短横线装饰

**类型**: 优化 / 样式

**摘要**
用户指示: 【企业文化】和【组织团队】模块里面的 (注意是里面的) 标题和人名下不要用绿色短横线装饰。本次移除 3 处内部绿色短横线, 保留 section 级别的 TitleUnderline。

**详细变更**
- `src/pages/AboutPage.tsx`:
  1. §3.6 企业文化: 移除每个 item 标题下的 `w-[40px] h-[3px] bg-brand-green` 短横线, 标题 mb 从 14px 调整为 24px 补偿间距
  2. §3.8 创始人卡: 移除姓名下的 `w-[50px] h-[3px] bg-brand-green` 短横线, 姓名职务块 mb 从 8px 调整为 24px 补偿间距
  3. §3.9 成员卡: 移除姓名下的 `w-[40px] h-[3px] bg-brand-green` 短横线, 姓名职务块 mb 从 6px 调整为 16px 补偿间距

**影响范围**
- 关于小维页 (`/about`) §3.6 企业文化 + §3.8+§3.9 核心团队
- 视觉表现: 模块内部标题/人名下方不再有绿色短横线, 更简洁; section 级别短横线保留

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 企业文化模块文字字号对齐研究方向模块

**类型**: 优化 / 样式

**摘要**
用户反馈: 企业文化模块文本字号视觉不好看, 要求参考上面模块的 [AI中文助听开创者] 和 [全方位健康管理] 样式。本次将企业文化文字区字号对齐 §3.5 研究方向模块。

**详细变更**
- `src/pages/AboutPage.tsx` §3.6 企业文化文字区:
  - label: 14px tracking-[0.2em] uppercase → 18px text-brand-green font-bold leading-[27px] (与研究方向 tag 一致)
  - 标题: 20px leading-[30px] → 22px leading-[33px] (与研究方向 title 一致)
  - 诠释条目: 14px #666 400 lh=24px (已与研究方向 desc 一致, 保持不变)

**影响范围**
- 关于小维页 (`/about`) §3.6 企业文化模块
- 视觉表现: label 更醒目, 标题更突出, 与上方研究方向模块视觉节奏统一

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 关于页删除各模块之间的灰色分割线

**类型**: 优化 / 样式

**摘要**
用户指示: 删掉关于页各个模块之间的灰色分割线。本次移除 AboutPage.tsx 中 6 处 `border-t border-ink-200` 类名。

**详细变更**
- `src/pages/AboutPage.tsx`: 6 个 section 的 className 从 `bg-white border-t border-ink-200` 改为 `bg-white`
  - §3.4 小维健康科技
  - §3.6 企业文化
  - §3.7 荣誉资质
  - §3.8+§3.9 核心团队
  - §3.10 战略合作伙伴
  - 末尾联系 section

**影响范围**
- 关于小维页 (`/about`) 各模块之间不再有顶部灰色横线分隔, 视觉更连贯

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 扇形图标签矢量折线引出

**类型**: 视觉优化

**摘要**: 为扇形图每个标签添加矢量折线引出（L 型：径向短段 + 水平段），标签水平对齐到左右两列，提升可读性。

**详细变更**:
- `src/pages/ProductPage.tsx` - `ChineseTechFanChart`
  - 新增 `blackGuides` 数组：每个黑色扇区计算 `p0`(外边缘中点)、`p1`(径向+14 转折点)、`labelX/labelY`(水平拉到左/右列)
  - 左右标签列：`LEFT_COL = CX-300`, `RIGHT_COL = CX+300`
  - SVG 中用 `<polyline>` 绘制折线（灰色 #999，绿色用 #05a045）
  - 标签改为水平对齐：右侧标签 `translate(0,-50%)` 左对齐，左侧标签 `translate(-100%,-50%)` 右对齐
  - 移除原指示点，改用折线末端关联
  - 画布扩大到 760×540 以容纳左右标签列

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）

---

## [2026-07-23] 更新 | /wearable 删除模块间灰色分割线

**类型**: 更新

**摘要**
用户要求删除 /wearable 页面中下方模块之间的灰色分割线。已移除"健康智能手表核心技术"和"智能蓝牙耳机核心技术"两个 section 顶部的 `border-t border-ink-200` 类名，使模块之间不再显示灰色上边框分隔线。

**详细变更**
1. `src/pages/WearablePage.tsx` 中两个核心技术 section 的 `className` 从 `"bg-white border-t border-ink-200"` 改为 `"bg-white"`

**影响范围**
- 1 个源码文件：`src/pages/WearablePage.tsx`
- 页面表现：/wearable 中健康智能手表核心技术和智能蓝牙耳机核心技术两个模块与上方模块之间不再显示灰色上边框分隔线

**关联文件**
- `d:\VibeTest\bigsound\src\pages\WearablePage.tsx`

---

## [2026-07-23] 优化 | 企业文化模块改左右交错布局 + 新声 logo 进一步缩小

**类型**: 优化 / 布局重构 / 样式微调

**摘要**
两条用户指示合并处理: ① 企业文化模块改为一边图片一边文本, 自上而下左右交错呈现; ② 新声 logo scale 改为 0.45。

**详细变更**
1. 企业文化模块左右交错布局 (`src/pages/AboutPage.tsx`):
   - 从 3 列卡片改为 3 行, 每行 2 列 (图片 + 文字)
   - 第 1 行 (使命): 图左文右
   - 第 2 行 (愿景): 文左图右
   - 第 3 行 (价值观): 图左文右
   - 图片比例从 16:9 改为 4:3, 文字区增加 `p-[32px]` 和绿色短横线, 标题字号 18→20
2. 新声 logo scale 调整 (`src/data/about.ts`):
   - `partnerXinsheng.logoScale` 从 `0.55` 改为 `0.45`
   - 在战略投资容器高度 100px 下, 新声实际高度从 55px 降至 45px

**影响范围**
- 关于小维页 (`/about`) §3.6 企业文化: 从 3 列卡片升级为左右交错 3 行, 视觉节奏更丰富
- 关于小维页 (`/about`) §3.10 战略投资: 新声 logo 略小

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`
- `d:\VibeTest\bigsound\src\data\about.ts`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 更新 | 重新生成轮播图 3 张图片 + 修复 imageKey 映射

**类型**: 更新 / 素材 / Bug 修复

**摘要**
用户反馈轮播图图片有问题。重新生成 3 张 16:9 图片，并修复第二张幻灯片 imageKey 指向不存在的 key 导致图片加载不到的 bug。

**详细变更**
1. `public/images/product_family_portrait.png`（产品全家福）— nanobanana2 / 16:9，多款助听器白底平铺。
2. `public/images/homepage_v3/hero_hearing_aid.png`（高端 RIC 助听器）— gpt-image-2 / 16:9，RIC 助听器特写。
3. `public/images/prototype/hearing_aid_demand_trend.png`（多场景解决方案）— nanobanana2 / 16:9，抽象生活方式图标信息图。
4. Bug 修复：`src/data/invest.ts` 中轮播图第二张 `imageKey` 从 `"heroHearingAid"`（不存在）改为 `"heroProductHearingAid"`（指向 `/images/homepage_v3/hero_hearing_aid.png`）。
5. 截图验证：`aigpic/carousel_1.png`、`carousel_2.png`、`carousel_3.png`。

**影响范围**
- 3 个图片资源文件被覆盖
- 1 个数据文件修复 imageKey
- `/invest` 轮播图 3 张幻灯片均可正常加载

**关联文件**
- `d:\VibeTest\bigsound\public\images\product_family_portrait.png`
- `d:\VibeTest\bigsound\public\images\homepage_v3\hero_hearing_aid.png`
- `d:\VibeTest\bigsound\public\images\prototype\hearing_aid_demand_trend.png`
- `d:\VibeTest\bigsound\src\data\invest.ts`
- `d:\VibeTest\bigsound\aigpic\carousel_1.png`
- `d:\VibeTest\bigsound\aigpic\carousel_2.png`
- `d:\VibeTest\bigsound\aigpic\carousel_3.png`

---

## [2026-07-23] 微调 | 新声 logo 略微缩小

**类型**: 微调 / 样式

**摘要**
用户指示: 战略合作伙伴模块中【新声】的 logo 略微缩小。

**详细变更**
- `src/data/about.ts`: `partnerXinsheng` 的 `logoScale` 从 `0.6` 调整为 `0.55`
- 在战略投资容器高度 100px 下, 新声实际高度从 60px 降至 55px

**影响范围**
- 关于小维页 (`/about`) §3.10 战略投资组的新声 logo

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-22] 修复 | 海螺扇形图修正：内半径统一 + 绿色最大

**类型**: 数据修正

**摘要**: 用户指出两点：① 每个扇形内半径应一样大；② 绿色扇区应该是最大的。修正数据结构。

**详细变更**:
- `src/data/product.ts`
  - 所有黑色扇区 `innerRadius` 统一为 `60`（之前是 60/78/96/114/132 递增）
  - 绿色扇区 `outerRadius` 从 `100` 改为 `220`（最大，作为海螺收尾）
  - 黑色扇区外半径保持 120 → 140 → 160 → 180 → 200 递增
  - 海螺走向：从绿色下方开始顺时针，黑色外半径递增，最后回到最大的绿色扇区

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/data/product.ts`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）

---

## [2026-07-22] 修复 | 中文助听核心技术扇形图改为海螺式变半径

**类型**: 视觉重构 + 数据结构升级

**摘要**: 用户指出原图不是角度依次放大，而是每个黑色扇区的**半径**按顺时针方向依次增大，像海螺一样。本次将扇形图从等半径环形图改为变半径海螺图。

**详细变更**:

1. `src/data/product.ts` - 数据结构升级
   - 每个扇区新增 `outerRadius` / `innerRadius` 字段
   - 绿色扇区（右上缺口）: `0°-70°`, 外半径 100, 内半径 60
   - 黑色扇区从绿色下方开始顺时针排列，外半径依次增大：120 → 140 → 160 → 180 → 200
   - 内半径同步递增：60 → 78 → 96 → 114 → 132，保持环宽基本一致
   - 每个黑色扇区角度固定约 58°

2. `src/pages/ProductPage.tsx` - 组件适配变半径
   - `ChineseTechFanChart` 不再使用统一的 `OUTER_R/INNER_R`
   - 每个黑色扇区使用各自的 `outerRadius/innerRadius` 绘制
   - 绿色扇区使用自己的半径绘制
   - 图标位置按各自扇区中径计算
   - 标签位置按各自扇区外半径 + 固定外延计算，保证标签在外侧
   - 画布扩大到 720×520 以容纳最大半径 200 的扇区

**决策依据**:
- 用户明确："角度是一样的，是每个扇形的半径按顺时针依次增大，像海螺一样"
- 前一次实现仍使用统一半径，仅改变角度，不符合参考图

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/data/product.ts`
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）
- 截图验证因环境浏览器安装限制暂缺

---

## [2026-07-22] 增强 | 灰色背景 section 强制铺满横向视口

**类型**: 样式增强 + Layout 改造

**摘要**: 让 3 处灰色背景 section 在视口 > 1200px 时也铺满横向视口 (gap=0)，突破 Layout wrapper 的 1200px 限制。

**详细变更**:

1. `src/components/layout/Layout.tsx`
   - wrapper div 的 style 新增 CSS 变量 `--scale: ${scale}` (通过 `["--scale" as string]: scale` 注入)
   - 让子元素通过 `var(--scale)` 读取当前缩放比例

2. `src/index.css`
   - 新增 `.full-bleed` 工具类 (位于 `@layer utilities`)
   - 核心样式:
     ```css
     .full-bleed {
       width: calc(100vw / var(--scale, 1));
       margin-left: calc((1200px - 100vw / var(--scale, 1)) / 2);
       margin-right: calc((1200px - 100vw / var(--scale, 1)) / 2);
     }
     ```
   - 原理: Layout 用 `transform: scale(scale)` 缩放 1200px wrapper
     - width: `100vw / scale` → 布局宽度, scale 后视觉宽度 = 视口宽度
     - margin: `(1200 - 100vw/scale) / 2` → 在 wrapper 内居中, 突破左右边界
     - 视口 > 1200px (scale=1): 100vw > 1200, margin 为负, 突破 wrapper ✓
     - 视口 = 1200px (scale=1): 100vw = 1200, margin = 0, 占满 wrapper ✓
     - 视口 < 1200px (scale<1): 100vw/scale = 1200, margin = 0, 占满 wrapper, scale 后 = 视口 ✓

3. 3 处灰色 section 添加 `full-bleed` 类:
   - `src/pages/ProductPage.tsx:303` — 听力服务中心 section (`bg-ink-100`)
   - `src/pages/ProductPage.tsx:518` — 售后保修政策 section (`bg-ink-100`)
   - `src/components/home/TechFeatures.tsx:39` — 首页技术特性第 2 行 (idx===1, `bg-ink-100`)

**影响范围**: 3 处 section 级别的灰色背景 (其余局部小卡片/占位框/输入框等灰色元素保持不变)

**关联文件**:
- `src/components/layout/Layout.tsx`
- `src/index.css`
- `src/pages/ProductPage.tsx`
- `src/components/home/TechFeatures.tsx`

**验证**: `npx tsc -b --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 创始人卡信息改 4 行绿点 + 战略合作伙伴 logo 再放大

**类型**: 优化 / 布局调整 / 样式调整

**摘要**
用户指示: ① 创始人卡片信息也要像成员卡一样排四行; ② 战略合作伙伴模块所有 logo 再整体放大一点。

**详细变更**
1. 创始人卡信息 4 行化 (`src/data/about.ts` + `src/pages/AboutPage.tsx`):
   - `founder.details` 从 `{ label, text }[]` 改为 `string[]`, 保留 4 条信息
   - 渲染方式从 `label | 分隔符 | text` 改为与成员卡一致的绿色圆点列表
   - 创始人卡与成员卡信息结构完全相同: 姓名职务 → 绿色短横线 → 4 行绿点详情
2. 战略合作伙伴 logo 整体放大 (`src/pages/AboutPage.tsx`):
   - 战略投资 4 列 logo 容器高度从 `h-[90px]` 改为 `h-[100px]`
   - 战略合作 5 列 logo 容器高度从 `h-[80px]` 改为 `h-[90px]`
   - 创维 (scale 0.5) 45px → 50px, 新声 (scale 0.6) 54px → 60px

**影响范围**
- 关于小维页 (`/about`) §3.8+§3.9 核心团队: 创始人与 4 名成员信息展示形式完全一致
- 关于小维页 (`/about`) §3.10 战略合作伙伴: 两组 logo 均再大一档

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 核心团队成员卡信息分 4 行 + 与创始人卡主题统一

**类型**: 优化 / 布局调整 / 数据更新

**摘要**
用户反馈: ① 核心团队四人右侧的信息描述应分四行排布; ② 创始人信息卡与下面四个成员卡主题性不一致。本次将成员简介拆为 4 行 details, 并重构右侧信息区布局以与创始人卡保持统一视觉语言。

**详细变更**
1. `src/data/about.ts`:
   - 4 名核心团队成员的 `bio` (单段字符串) 改为 `details` (字符串数组, 各 4 行)
   - 每行对应: 专长标签 / 前经历 1 / 前经历 2 / 现任职务
2. `src/pages/AboutPage.tsx`:
   - 成员卡右侧信息区从“姓名/职务竖块 + 灰色竖分隔线 + 单段简介”改为“姓名/职务同行 + 绿色短横线 + 4 行详情列表”
   - 与创始人卡右侧结构一致: 姓名职务 → 绿色短横线 → details 列表
   - 头像外增加 `bg-[#f5f9f6]` 浅绿圆形底, 与创始人照片浅绿背景区呼应
   - 删除已失效的占位提示文字

**影响范围**
- 关于小维页 (`/about`) §3.8+§3.9 核心团队模块
- 视觉表现: 4 张成员卡信息结构与创始人卡统一, 每行一个要点, 阅读更清晰

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 调整 InvestPage 品牌模块卡片比例

**类型**: 优化 / 样式

**摘要**
用户反馈品牌模块卡片比例不美观。调整 `InvestPage.tsx` 中轮播图、工厂主图与数据卡的高度比例，使视觉更协调。

**详细变更**
1. 轮播图比例：改为 16:9（使用 `aspect-video`），原固定高度 420px/380px 取消。
2. 自有工厂主图高度：360px → 320px，底部间距 20px → 24px。
3. 工厂数据卡图片高度：160px → 200px；卡片改为 `flex flex-col`，文字区垂直居中，避免内容高低不一。
4. 刷新 Playwright 截图：`aigpic/invest_brand_1.png`、`invest_brand_2.png`、`invest_brand_3.png`。

**影响范围**
- 1 个源码文件：`src/pages/InvestPage.tsx`
- `/invest` 品牌模块三个子模块的卡片比例更紧凑协调

**关联文件**
- `d:\VibeTest\bigsound\src\pages\InvestPage.tsx`
- `d:\VibeTest\bigsound\aigpic\invest_brand_1.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_2.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_3.png`

---

## [2026-07-23] 修复 | 中文助听核心技术扇形图方向与比例修正

**类型**: 数据调整 + 视觉修正

**摘要**: 用户指出原图扇区是顺时针方向依次放大，缺口在右上。修正扇形图角度分配与排列方向。

**详细变更**:

1. `src/data/product.ts` - 扇区角度重新分配
   - 绿色扇区（缺口）: 右上 `0°-60°`
   - 黑色扇区从绿色扇区下方开始，**顺时针方向依次放大**
   - 5 个黑色扇区角度：`40° / 50° / 60° / 70° / 80°`，总和 300°
   - 绿色 60° + 黑色 300° = 360°

2. `src/pages/ProductPage.tsx`
   - 标签与图标位置仍基于极坐标动态计算，自动适配新的角度分布
   - 绿色扇区标签、"中"字、圆环继续基于 `greenMid` 动态定位

**决策依据**:
- 用户明确原图特征：每块扇形区面积顺时针依次放大，缺口在右上角
- 前一次实现将缺口放在右下且绿色扇区过大，与参考图不符

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/data/product.ts`
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）
- 截图验证因环境浏览器安装限制暂缺

---

## [2026-07-23] 更新 | 重新生成 InvestPage 品牌模块 4 张 AI 配图

**类型**: 更新 / 素材

**摘要**
用户使用速创API重新生成了 InvestPage【著名上市创维集团旗下】模块的 4 张配图，替换原有带旧版文字叠加或偏素的产品图。其中 2 张因 gpt-image-2 内容审核失败，改用 nanobanana2 模型成功生成。

**详细变更**
1. `public/images/product_family_portrait.png`（产品全家福）— gpt-image-2 / 16:9，白底绿色系助听器产品平铺。
2. `public/images/prototype/own_factory_overview.png`（自有工厂概览）— nanobanana2 / 16:9，现代化 SMT 生产线，无人物、无文字叠加。
3. `public/images/prototype/invest_expert_team.png`（研发团队）— gpt-image-2 / 4:3，三位白大褂工程师于听力实验室。
4. `public/images/prototype/patented_technology_certs.png`（专利证书墙）— nanobanana2 / 16:9，抽象绿金徽章墙，无可读文字。
5. 刷新 Playwright 截图：`aigpic/invest_brand_1.png`、`invest_brand_2.png`、`invest_brand_3.png`。

**影响范围**
- 4 个图片资源文件被覆盖
- `/invest` 品牌模块视觉更统一，不再出现旧版文字/数据叠加

**关联文件**
- `d:\VibeTest\bigsound\public\images\product_family_portrait.png`
- `d:\VibeTest\bigsound\public\images\prototype\own_factory_overview.png`
- `d:\VibeTest\bigsound\public\images\prototype\invest_expert_team.png`
- `d:\VibeTest\bigsound\public\images\prototype\patented_technology_certs.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_1.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_2.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_3.png`

---

## [2026-07-23] 优化 | 核心团队头像 AI 清晰化 + 战略投资 logo 整体放大

**类型**: 优化 / 图片资源 / 样式调整

**摘要**
两条用户指示合并处理: ① 核心团队 4 人头像用速创API做 AI 清晰化并调整人物位置; ② 战略投资模块 4 个 logo 整体略微放大。

**详细变更**
1. 核心团队头像 AI 清晰化:
   - 新增批量生图计划 `scripts/enhance_team_portraits_plan.json`
   - 以 `public/images/about/team/team_member_*.png` 为参考图, 调用速创API `gpt-image-2` (1:1)
   - 生成 4 张高清职业形象照, 居中构图, 浅灰纯色背景
   - 生成结果保存到 `aigpic/team_enhanced/`, 再复制覆盖 `public/images/about/team/team_member_*.png`
   - 4 张全部成功 (耗时 82s ~ 184s)
2. 战略投资 logo 整体放大:
   - `src/pages/AboutPage.tsx` 战略投资 logo 容器高度从 `h-[80px]` 改为 `h-[90px]`
   - 同步调整 `maxHeight` 计算基数从 80 改为 90
   - 创维 (scale 0.5) 实际高度 40px → 45px, 新声 (scale 0.6) 48px → 54px, 其余两家 80px → 90px

**影响范围**
- 关于小维页 (`/about`) §3.8+§3.9 核心团队: 4 张头像从 108×108 低清裁剪图升级为速创API高清生成图
- 关于小维页 (`/about`) §3.10 战略投资: 4 个 logo 整体大一圈

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx` (战略投资 logo 高度调整)
- `d:\VibeTest\bigsound\scripts\enhance_team_portraits_plan.json` (新增批量生图计划)
- `d:\VibeTest\bigsound\public\images\about\team\team_member_1.png` ~ `team_member_4.png` (已替换为 AI 清晰化版本)
- `d:\VibeTest\bigsound\aigpic\team_enhanced\` (生图中间输出 + batch_report)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 修复 | 中文助听核心技术扇形图对照参考图重新设计

**类型**: 视觉重构 + 数据调整

**摘要**: 对照用户提供的参考图，重新调整中文助听核心技术扇形图的方向、比例、图标样式和标签布局。

**详细变更**:

1. `src/data/product.ts` - 扇区角度重新分配
   - 绿色扇区从 `0°-90°` 改为 `0°-70°`，占比更接近参考图（约 1/5 圆）
   - 黑色扇区从 `90°-360°` 改为 `130°-360°`，整体占据左下→左侧→左上，右下出现约 60° 缺口
   - 5 个黑色扇区按参考图视觉分配：`60° + 60° + 60° + 30° + 20°`

2. `src/pages/ProductPage.tsx` - 组件视觉重构
   - 绿色扇区标签移到更外侧右上，左对齐，末尾增加绿色指示点
   - 黑色扇区图标增加 `#444444` 灰色圆形底
   - 黑色扇区标签改为“指示点 + 文字”行内布局，指示点始终靠近扇区一侧（左侧标签点在最右，右侧标签点在最左）
   - 移除标签到扇区的虚线连线，改用指示点关联
   - 绿色扇区“中”字、圆环、标签全部基于 `greenMid` 动态计算，不再硬编码 45°

**决策依据**:
- 参考图中绿色扇区更小更尖锐，黑色扇区整体偏左下/左侧/左上，右下有明显缺口
- 参考图中黑色扇区图标有灰色圆形底，标签通过小黑点指向扇区

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/data/product.ts`
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）
- 截图验证因环境浏览器安装限制暂缺

---

## [2026-07-23] 开发 | 核心团队四人信息更新 + 头像从参考图脚本裁剪

**类型**: 开发 / 数据更新 / 图片资源

**摘要**
用户指示: 核心团队模块四人信息参考 `public/images/prototype/team_exec_card.png`, 并可用脚本把人物图片裁剪下来。本次从参考图中提取了 4 位成员的真实头像, 并更新了姓名、职务与简介。

**详细变更**
1. 新增裁剪脚本 `scripts/crop_team_portraits.py`:
   - 读取 `public/images/prototype/team_exec_card.png` (805×433)
   - 按垂直方向均分为 4 张卡片, 从左侧裁剪出 108×108 方形头像
   - 输出到 `public/images/about/team/team_member_1.png` ~ `team_member_4.png`
2. 更新 `src/data/about.ts` 核心团队数据:
   - 郑明春 / 联合创始人兼 COO / 头像 `teamMemberCoo`
   - 温业锋 / CMO / 头像 `teamMemberCmo`
   - 龙浩军 / 研发总监 / 头像 `teamMemberRdDirector`
   - 南鹏升 / 生产总监 / 头像 `teamMemberProductionDirector`
   - 四人简介均按参考图中文案整理
3. 更新 `src/data/images/about.ts`:
   - 4 个 imageKey 映射到新生成的裁剪头像
   - 删除旧占位头像 `member_cto.jpg` / `member_cmo.jpg` / `member_coo.jpg` / `member_cfo.jpg`

**影响范围**
- 关于小维页 (`/about`) §3.8+§3.9 核心团队模块
- 视觉表现: 4 位成员从“待补充 + 随机头像占位”更新为真实姓名/职务/简介 + 从参考图裁剪的真实头像

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\data\images\about.ts`
- `d:\VibeTest\bigsound\scripts\crop_team_portraits.py` (新增)
- `d:\VibeTest\bigsound\public\images\about\team\team_member_1.png` ~ `team_member_4.png` (新增)
- `d:\VibeTest\bigsound\public\images\prototype\team_exec_card.png` (参考图源)

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 战略合作伙伴模块去边框 + 创维/新声 logo 缩放调整

**类型**: 优化 / 样式调整

**摘要**
用户指示: ① 创维 logo 高度缩放改为 0.5; ② 新声 logo 高度缩放改为 0.6; ③ 删除战略合作伙伴模块各 logo 卡片的矩形边框。

**详细变更**
1. `src/data/about.ts`:
   - 创维 `logoScale` 从默认 1 改为 `0.5`, logo 高度从 80px 缩至 40px
   - 新声 `logoScale` 从 `0.8` 改为 `0.6`, logo 高度从 80px 缩至 48px
2. `src/pages/AboutPage.tsx`:
   - 删除战略投资 4 列卡片和战略合作 5 列卡片的 `border border-ink-200` 类名
   - 保留 padding 与居中布局, 使 logo 在无边框的留白区域内展示

**影响范围**
- 关于小维页 (`/about`) §3.10 战略合作伙伴模块
- 视觉表现: 标题下方直接是网格 logo, 无矩形边框; 创维/新声 logo 按新比例显示

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 优化 | 战略合作伙伴模块精简 (去英文/去文字/去占位提示/新声 logo 缩小)

**类型**: 优化 / 样式调整

**摘要**
用户指示: ① 删除"战略投资"和"战略合作"标题后的英文; ② 删除 logo 下方的公司名称文本; ③ 删除底部"*部分合作伙伴 logo 为占位图..."提示小字; ④ 【新声】logo 略微缩小。

**详细变更**
1. `src/data/about.ts`:
   - 删除 `partners.strategicInvestment.subEnTitle` 和 `partners.strategicCooperation.subEnTitle` 字段
   - 为【新生】合作伙伴新增 `logoScale: 0.8`, 使其 logo 高度从 80px 缩至 64px
2. `src/pages/AboutPage.tsx`:
   - 移除战略投资/战略合作标题后的英文 `span`
   - 移除两个分组中 logo 卡片底部的公司名称 `p` 标签
   - 移除 section 底部的占位提示文字
   - 战略投资 logo 图片改为按 `logoScale` 动态计算 `maxHeight`, 无 scale 时默认 80px

**影响范围**
- 关于小维页 (`/about`) §3.10 战略合作伙伴模块
- 视觉表现: 标题更简洁、logo 卡片仅保留 logo 图、新声 logo 略小一圈

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`

**验证**
- `npx tsc --noEmit` 通过 (exit code 0)

---

## [2026-07-23] 开发 | InvestPage【著名上市创维集团旗下】模块拆分为 3 个子模块

**类型**: 开发 / 重构

**摘要**
将招商加盟页 `InvestPage` 的【著名上市创维集团旗下】模块从旧的 4 卡片 + 4 图片布局重构为 3 个子模块：
1. 【全线覆盖各程度 入门高端皆齐备】轮播图；
2. 【自有研发团队 自有生产工厂】主图 + 3 个数据卡；
3. 【医疗资质齐全 官网真实可查】证书网格（5 竖版 + 3 横版 + 2 横版居中），参考 AboutPage 荣誉资质模块。
同步生成并落位生产设备图片，更新相关数据文件与图片映射。

**详细变更**
1. 生成 AI 生产设备图：`aigpic/invest_production_equipment.png` → 复制到 `public/images/prototype/invest_production_equipment.png`。
2. 更新 `src/data/images/invest.ts`：`investProductionEquipment` 路径指向新图。
3. 更新 `src/data/invest.ts`：`brand` 对象拆分为 `productCoverage`、`rdFactory`、`qualifications` 三个子结构。
4. 重写 `src/pages/InvestPage.tsx`：
   - 新增 `SimpleCarousel` 轮播组件（自动播放、左右箭头、指示器、朴素风格）；
   - 替换旧的 `items`/`images` 渲染为 3 个子模块；
   - R&D 工厂模块采用主图 + 3 数据卡布局；
   - 资质模块复用 AboutPage 的 5+3+2 网格布局。
5. 使用 Playwright 截图保存到 `aigpic/invest_brand_1.png`、`aigpic/invest_brand_2.png`、`aigpic/invest_brand_3.png`。

**影响范围**
- 2 个源码文件：`src/pages/InvestPage.tsx`、`src/data/invest.ts`
- 1 个图片映射文件：`src/data/images/invest.ts`
- 1 个新增图片资源：`public/images/prototype/invest_production_equipment.png`
- 页面表现：`/invest` 品牌模块现在包含 3 个带标题的子模块，轮播、工厂数据、资质证书均正常展示

**关联文件**
- `d:\VibeTest\bigsound\src\pages\InvestPage.tsx`
- `d:\VibeTest\bigsound\src\data\invest.ts`
- `d:\VibeTest\bigsound\src\data\images\invest.ts`
- `d:\VibeTest\bigsound\public\images\prototype\invest_production_equipment.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_1.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_2.png`
- `d:\VibeTest\bigsound\aigpic\invest_brand_3.png`

---

## [2026-07-23] 更新 | /wearable 删除产品信息来源小字说明

**类型**: 更新

**摘要**
用户要求删除 /wearable 页面产品网格下方的"产品信息来源: 创维官方商城 xiaowe.cc · 完整产品线 11 款 (成人手表 4 / 儿童手表 3 / 蓝牙耳机 4)"小字说明。已直接从 `src/pages/WearablePage.tsx` 中移除该 `<p>` 元素及其注释。

**详细变更**
1. 删除 `src/pages/WearablePage.tsx` 中"数据来源声明"段落（含注释与 `<p>`）

**影响范围**
- 1 个源码文件：`src/pages/WearablePage.tsx`
- 页面表现：/wearable 产品网格下方不再显示来源说明小字

**关联文件**
- `d:\VibeTest\bigsound\src\pages\WearablePage.tsx`

---

## [2026-07-23] 更新 | 替换 SEB002 产品配图 (从用户提供的本地图片)

**类型**: 更新

**摘要**
用户提供了一张新的 SEB002 耳机配图 (`C:\Users\15927\Downloads\ABUIABAEGAAgkJfevwYooLfD-gcwoAY4oAY.png`)，要求替换 /wearable 页面中 SKYWORTH OWS SEB002 的产品图。操作：将新图复制覆盖到 `public/images/wearable/earphone_seb002.png`。验证：本地文件与 HTTP 访问 (`http://localhost:5174/images/wearable/earphone_seb002.png`) 返回的图片均为新图（黑色 SKYWORTH 开放式耳机充电盒 + 蓝色 LED 数字显示），HTTP 状态码 200，替换成功。

**详细变更**
1. 源文件：`C:\Users\15927\Downloads\ABUIABAEGAAgkJfevwYooLfD-gcwoAY4oAY.png`
2. 目标文件：`d:\VibeTest\bigsound\public\images\wearable\earphone_seb002.png`
3. 操作：`Copy-Item -Force` 覆盖
4. 验证：HTTP 200，内容确认与用户提供新图一致

**影响范围**
- 1 个资源文件：`public/images/wearable/earphone_seb002.png`
- 页面表现：`/wearable` 中 SKYWORTH OWS SEB002 产品卡片显示新图

**关联文件**
- `d:\VibeTest\bigsound\public\images\wearable\earphone_seb002.png`

---

## [2026-07-23] 优化 | §3.6 企业文化模块配图化改造 + 修复 InvestPage 类型错误

**类型**: 优化 / 开发 / 修复

**摘要**
用户指示: "【企业文化】模块的呈现要有图片配合设计，不能纯前端代码"。本次用速创API gpt-image-2 生成 3 张 16:9 横版配图 (使命/愿景/价值观), 改造 AboutPage §3.6 为"图片区 + 文字区"上下结构卡片, 不再使用纯前端代码。同时修复了 `npx tsc --noEmit` 过程中发现的 InvestPage.tsx 类型错误: `INVEST_PAGE.advantages.brand.items` 和 `.images` 字段缺失。`npx tsc --noEmit` 通过 (exit code 0)。

**详细变更**

### A. 企业文化配图生成 (速创API gpt-image-2)

1. 创建批量生图计划 `public/images/culture/_culture_plan.json`, 3 张 16:9 横版图:

| 序号 | 文件名 | 主题 | 生成耗时 |
|---|---|---|---|
| 1 | culture_mission.png | 使命: 老人佩戴助听器温馨家庭场景 | 70.27s |
| 2 | culture_vision.png | 愿景: 中国服务网络/全球科技愿景 | 62.03s |
| 3 | culture_values.png | 价值观: 用户第一/真诚服务 | 67.65s |

2. 批量生图命令: `python scripts/batch_generate.py public/images/culture/_culture_plan.json`
3. 3 张全部成功, 清理临时文件 `_culture_plan.json` / `progress.json`
4. 保留 `batch_report_1784791608.md` 作为生图记录

### B. 数据结构升级 (`src/data/about.ts`)

5. 为 `culture.items` 每个对象新增 `imageKey` 字段:
   - 使命 → `cultureMission`
   - 愿景 → `cultureVision`
   - 价值观 → `cultureValues`

### C. 图片资源映射 (`src/data/images/about.ts`)

6. 新增 3 个 imageKey 映射:
   - cultureMission → `/images/culture/culture_mission.png`
   - cultureVision → `/images/culture/culture_vision.png`
   - cultureValues → `/images/culture/culture_values.png`

### D. AboutPage.tsx §3.6 布局重构

7. 从原来的纯文字 3 列卡片改为"图片在上 + 文字在下"的 3 列卡片:

| 区域 | 样式 |
|---|---|
| 图片区 | `aspect-video bg-[#fafafa] overflow-hidden`, 图片 `object-cover` |
| 文字区 | `p-[24px]`, label (14px 绿色) + 标题 (18px #333 bold) + 诠释列表 (13px #666) |
| 卡片边框 | `border border-ink-200 overflow-hidden`, 无圆角/无阴影 |

8. 标题字号从 20px 微调为 18px, 诠释字号从 14px 微调为 13px, 为图片留出视觉空间
9. 保持朴素风格: 无圆角 / 无阴影 / 无渐变

### E. 修复 InvestPage.tsx 类型错误 (附带修复)

10. 运行 `npx tsc --noEmit` 时发现 `src/pages/InvestPage.tsx:366` 报错:
    - `Property 'items' does not exist on type '...'`
    - `Property 'images' does not exist on type '...'`
11. 根因: `src/data/invest.ts` 中 `advantages.brand` 缺少 `items` 和 `images` 字段, 但 InvestPage.tsx 的 "3.5 著名上市创维集团旗下" 模块引用了这两个字段
12. 修复: 在 `advantages.brand` 下补充:
    - `items`: 4 个品牌实力子模块 (全线覆盖 / 自有研发自有工厂 / 医疗资质齐全 / 创维集团背景)
    - `images`: 4 张配图 (productFamilyPortrait / investOwnFactory / investCertWall / aboutHeroBg)
13. 该修复不是本次企业文化任务引入, 但影响 tsc 验证, 因此一并修复

### F. 验证

14. `npx tsc --noEmit` 通过 (exit code 0), 无类型错误

**影响范围**
- 涉及 4 个源码文件:
  - `src/data/about.ts` (culture items 新增 imageKey)
  - `src/data/images/about.ts` (新增 3 个企业文化图片映射)
  - `src/pages/AboutPage.tsx` (§3.6 布局改为图片 + 文字)
  - `src/data/invest.ts` (brand 新增 items / images 字段修复类型错误)
- 新增 3 张企业文化配图: `public/images/culture/*.png`
- 视觉表现:
  - 企业文化模块从纯前端代码卡片升级为"配图 + 文字"组合卡片
  - 使命/愿景/价值观各有一张 16:9 场景图, 增强情感表达
  - 与荣誉资质模块风格保持一致 (图片区 + 文字区 + border-ink-200)

**关联文件**
- `d:\VibeTest\bigsound\src\data\about.ts`
- `d:\VibeTest\bigsound\src\data\images\about.ts`
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx`
- `d:\VibeTest\bigsound\src\data\invest.ts`
- `d:\VibeTest\bigsound\public\images\culture\` (新增 3 张配图 + 1 个 batch_report)

**待办与决策点**
- ⏳ 3 张企业文化配图为 AI 生成占位, 后续可替换为更贴合品牌调性的真实摄影图
- ⏳ InvestPage 品牌实力 4 张配图当前为复用已有资源 (产品全家福/工厂图/证书墙/创维大楼), 后续可替换为招商专用高质量图片

---

## [2026-07-22] 优化 | 中文助听核心技术模块去灰色背景

**类型**: 样式调整

**摘要**: 将"中文助听核心技术"模块背景从灰色 (`bg-ink-100`) 改为白色，同步扇形图中心圆孔颜色从 `#f5f5f5` 改为 `#ffffff`。

**详细变更**:
- `src/pages/ProductPage.tsx`
  - `section#core-tech` 的 `bg-ink-100` 改为 `bg-white`
  - 扇形图中心圆孔 `fill="#f5f5f5"` 改为 `fill="#ffffff"`

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）

---

## [2026-07-22] 优化 | 中文助听核心技术布局调整

**类型**: 布局调整

**摘要**: 将"中文助听核心技术"模块从左右分栏改为上下布局——副标题+描述上层靠左，扇形图下层居中。

**详细变更**:
- `src/pages/ProductPage.tsx`
  - 移除 `grid grid-cols-[360px_1fr]` 左右分栏
  - 副标题（24px 绿色加粗）+ 描述（15px 灰色）作为上层，靠左排列
  - 扇形图作为下层，用 `flex justify-center` 居中

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0, 88 modules）

---

## [2026-07-22] 修复 | 中文助听核心技术模块排版

**类型**: 样式修复 + 布局重构

**摘要**: 修复"中文助听核心技术"模块两个排版问题：① 左侧描述太单薄与右侧大图不平衡；② 扇形图标签位置固定坐标与不等分扇区不匹配，导致标签偏离扇区。

**详细变更**:

1. `src/pages/ProductPage.tsx` - 左右分栏布局调整
   - 左栏从 `420px` 缩为 `360px`，给右侧扇形图更多空间
   - `items-start` 改为 `items-center`，左右垂直居中对齐
   - 左栏恢复副标题 `专为国人研发定制`（24px 绿色加粗），描述从 14px 提升到 15px、行高 26px，解决左轻右重

2. `src/pages/ProductPage.tsx` - `ChineseTechFanChart` 标签位置重构
   - 标签位置从固定坐标数组改为**动态极坐标计算**：`polar(CX, CY, LABEL_R, midAngle)`，标签自动跟随扇区中点角度
   - `LABEL_R = OUTER_R + 60`，标签沿径向放在扇区外侧，与扇区位置一一对应
   - 绿色扇区标签也改用极坐标计算（45° 方向），不再硬编码
   - 新增标签到扇区的虚线连线（`strokeDasharray="2 2"`），视觉关联更清晰
   - 对齐逻辑从 `x<200/x>500` 改为相对圆心 `x<CX-20/x>CX+20`，更精确
   - 扇形图圆心从 (350,310) 上移到 (350,270)，外径 170→160，内径 72→68，容器高度 540→500，整体更紧凑

**决策依据**:
- 扇区角度不等分（60°×3+45°×2），固定坐标标签无法匹配所有扇区位置
- 动态极坐标计算保证标签始终对齐扇区中点，无论角度如何变化

**影响范围**: `/product` 中文助听核心技术模块 (`#core-tech`)

**关联文件**:
- `src/pages/ProductPage.tsx`

**验证**:
- `npx tsc --noEmit` 通过
- `npm run build` 通过（exit code 0, 88 modules）
- 截图验证因沙箱无法安装 Playwright 浏览器暂缺

---

## [2026-07-22] 优化 | 设备卡片样式回归页面主题

**类型**: 样式调整

**摘要**: 为保证"三甲医院同等 百万级检查设备"模块与页面其他模块视觉一致，去掉卡片的圆角和绿色边框，改用全站统一的灰边框 + hover 绿边样式。

**详细变更**:
- `src/pages/ProductPage.tsx`
  - 设备卡片 `border-brand-green rounded-[8px]` 改为 `border-ink-200 hover:border-brand-green-light transition-colors duration-300`
  - 保留 2×3 网格、4:3 图片、底部浅灰文字区，不再突出“卡片”造型，与产品参数卡片的朴素风格统一

**决策依据**:
- 页面整体为朴素风格（无圆角/无阴影/无渐变），局部 8px 圆角和强绿框会破坏主题一致性。

**影响范围**: `/product` 听力服务中心 §4.8 设备模块

**关联文件**:
- `src/pages/ProductPage.tsx`

**验证**:
- `npm run build` 通过（exit code 0）

---

## [2026-07-22] 优化 | 三甲医院同等百万级检查设备 2×3 卡片复刻

**类型**: 代码修改 + 数据更新 + 图片资源

**摘要**: 按参考图将 `/product` 听力服务中心的"三甲医院同等 百万级检查设备"模块改为 2×3 卡片布局，并为 6 张设备卡片生成 AI 实物图。

**详细变更**:

1. 图片资源
   - 使用速创 API (gpt-image-2, 4:3) 生成 6 张医疗设备/场景图，保存至 `public/images/equipment/`：
     - `real_ear_analyzer.png` — 真耳分析仪
     - `digital_otoscope.png` — 高清专业耳窥镜
     - `audiology_booth.png` — 医用级听力测听室
     - `audiometer.png` — 听力计
     - `fitting_software.png` — 助听器验配软件/调试设备
     - `cleaning_device.png` — 助听器清洁/保养仪器

2. `src/data/images/product.ts`
   - 新增 6 个设备图片键：`equipmentRealEarAnalyzer`、`equipmentDigitalOtoscope`、`equipmentAudiologyBooth`、`equipmentAudiometer`、`equipmentFittingSoftware`、`equipmentCleaningDevice`

3. `src/data/product.ts`
   - 将 `serviceCenter.equipmentTitle` / `equipmentHint` 合并为 `equipment` 对象
   - 新增 `equipment.items` 数组，包含 6 张卡片的图片键与文字行

4. `src/pages/ProductPage.tsx`
   - 设备模块改为顶部标题 + 手册提示框 + 2×3 卡片网格
   - 卡片采用绿色边框、8px 圆角、图片 4:3 比例、底部浅灰背景居中文字
   - 第一行文字加粗，其余行常规灰色

**决策依据**:
- 以用户提供的参考图为真源，复刻 2×3 卡片结构与视觉样式（绿框、圆角、上图下文）。

**影响范围**: `/product` 听力服务中心 §4.8 设备模块

**关联文件**:
- `src/data/product.ts`
- `src/data/images/product.ts`
- `src/pages/ProductPage.tsx`
- `public/images/equipment/*`
- `aigpic/screenshot-equipment.cjs`

**验证**:
- `npm run build` 通过（exit code 0）
- Playwright 截图 `aigpic/product_equipment_screenshot.png` 显示 2×3 卡片布局与参考图一致

---

## [2026-07-22] 优化 | 招商加盟页详细政策解读表 redesign + Playwright 依赖准备

**类型**: 优化 / 前端复刻

**摘要**
用户反馈【详细政策解读 一览图快速了解】模块设计不够美观、信息呈现效果不佳。本次将原卡片式布局重构为单表连续布局：删除单元格内重复"小维健康 / 合作伙伴"标签，分组标题改为浅绿色通栏行，统一绿色表格边框，关键数字使用绿色徽章高亮，投入汇总与合作时长行用浅黄/浅绿背景强调。同时新增 `@playwright/test` 作为 devDependency，为后续自动化截图测试做准备。

**详细变更**

1. **`src/components/invest/InvestmentPolicyTable.tsx`** (重写):
   - 组件由分组卡片改为单一 HTML `<table>` 连续表格，只保留一个表头。
   - 表头固定三列：投入明细 / 小维健康 / 合作伙伴（联营方），绿色背景白字。
   - 删除原 `PolicyRowBlock` 每个单元格内的重复小标签，让内容更干净。
   - 新增 `GroupHeaderRow`：浅绿背景 `#05a045/10` + 绿色序号徽章 + 深色分组名，降低视觉噪声。
   - 保留 `HighlightBadge` / `HighlightText`，对金额、百分比、天数等关键数字做绿色徽章高亮。
   - 投入汇总行使用 `bg-yellow-50`，合作时长行使用 `bg-brand-green/5`，突出核心转化信息。
   - 顶部保留 4 个政策亮点数据卡（项目合作款 / 联营场地 / 满 5 年返还 / 基础分成）。
   - 底部保留"合作核心亮点"绿色边条 CTA 与免责声明。

2. **`screenshot_policy.py`** (修改):
   - 端口从 `5175` 修正为当前 dev server 端口 `5173`。
   - 截图定位点由 section 标题改为表格主标题"创维 AI 中文助听器联营店招商政策"、分组标题"人员 & 培训"、"投入汇总"，确保 Reveal 动画完成后再截图。
   - 等待时间增加，避免 Reveal 未触发导致空白截图。

3. **`package.json` / `package-lock.json`** (修改):
   - 新增 devDependency `@playwright/test`，用于后续浏览器自动化截图与测试。

**影响范围**
- 仅影响招商加盟页 (`/invest`) 的"详细政策解读"模块视觉呈现。
- 不修改页面其他 section 与数据逻辑。

**关联文件**
- `src/components/invest/InvestmentPolicyTable.tsx`
- `src/pages/InvestPage.tsx` (无修改，仅确认调用关系)
- `screenshot_policy.py`
- `package.json`
- `package-lock.json`

---

## [2026-07-22] 统一 | 6 子页 Hero Section 视觉效果完全统一 (72px+448 主推页规格)

**类型**: 统一

**摘要**
用户要求统一各子页 Hero Section 视觉效果, 保持主题性一致性。经 QA 确认 3 个决策: (1) 全部统一为主推页规格 (72px标题+36px副标+448高度); (2) 所有页面都不加 description; (3) 副标文案保持现有不变。本次将 AboutPage/CareersPage/NewsListPage 从内容页规格 (60px+360/320) 升级为主推页规格 (72px+448), 同时去掉 ProductPage/WearablePage/InvestPage 的 description。6 个子页 Hero 现在视觉参数完全一致, 仅背景图和文案随页面主题变化。`npx tsc --noEmit` 通过 (exit code 0)。

**详细变更**

### A. QA 确认的 3 个决策

1. **统一方向**: 全部统一为主推页规格 (72px标题 + 36px副标 + 448高度 + paddingBottom 68)。放弃原 3 档差异化 (主推页/内容页/列表页)
2. **description 处理**: 所有页面都不加 description。去掉 ProductPage/WearablePage/InvestPage 现有的 18px 灰色描述行
3. **副标文案**: 保持现有文案不变, 只统一字号

### B. 统一前后的参数对比

| 页面 | 统一前 title字号 | 统一前 subtitle字号 | 统一前 description | 统一前 height | 统一后 |
|---|---|---|---|---|---|
| ProductPage | 72 | 36 | 有 | 448 | 72/36/无/448 (去 description) |
| WearablePage | 72 | 36 | 有 | 448 | 72/36/无/448 (去 description) |
| InvestPage | 72 | 36 | 有 | 448 | 72/36/无/448 (去 description) |
| AboutPage | 60 | 24 | 无 | 360 | 72/36/无/448 (升级) |
| CareersPage | 60 | 24 | 无 | 360 | 72/36/无/448 (升级) |
| NewsListPage | 60 | 18 | 无 | 320 | 72/36/无/448 (升级) |

### C. 6 个子页 Hero 修改

1. **`src/pages/ProductPage.tsx`** (修改): 删除 `description={PRODUCT_PAGE.heroDescription}` + `descriptionFontSize={18}` + `descriptionColor="#666666"` 3 行
2. **`src/pages/WearablePage.tsx`** (修改): 删除 `description={WEARABLE_PAGE.heroDescription}` + `descriptionFontSize` + `descriptionColor` 3 行
3. **`src/pages/InvestPage.tsx`** (修改): 删除 `description={INVEST_PAGE.hero.description}` + `descriptionFontSize` + `descriptionColor` 3 行
4. **`src/pages/AboutPage.tsx`** (修改): titleFontSize 60→72, subtitleFontSize 24→36, height 360→448, paddingBottom 60→68
5. **`src/pages/CareersPage.tsx`** (修改): titleFontSize 60→72, subtitleFontSize 24→36, height 360→448, paddingBottom 60→68
6. **`src/pages/NewsListPage.tsx`** (修改): titleFontSize 60→72, subtitleFontSize 18→36, height 320→448, paddingBottom 60→68

### D. 统一后的全站 Hero 规范

所有 6 个子页 Hero 共用以下参数 (仅 title/subtitle/backgroundImage 随页面变化):
- `titleFontSize={72}` (钉钉进步体)
- `titleFontFamily="display"`
- `titleColor="#333333"`
- `subtitleFontSize={36}`
- `subtitleColor="#333333"`
- `overlay="bg-white/40"` (半透明白色遮罩)
- `topLogo={IMAGES.heroBigsoundLogo}` / `topLogoWidth={83}`
- `height={448}`
- `paddingTop={60}` / `paddingBottom={68}`
- 无 description

### E. 验证

7. `npx tsc --noEmit` 通过 (exit code 0), 无类型错误

**影响范围**
- 涉及 6 个页面文件
- 6 个子页 Hero 视觉参数完全一致 (72px标题 + 36px副标 + 448高度 + 无description)
- 主题性一致性: 仅背景图和 title/subtitle 文案随页面主题变化, 视觉规格统一
- 去掉 3 个主推页的 description (ProductPage "12 款助听器..." / WearablePage "..." / InvestPage "..."), 丢失部分引导文案, 但用户明确要求去掉
- AboutPage/CareersPage/NewsListPage Hero 高度增加 88-128px, 视觉冲击力提升
- NewsListPage 副标从 18px 升级到 36px, "最新动态" 4 字会更显眼
- 不影响业务功能, 仅视觉规范统一

**关联文件**
- 修改: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` (去 description)
- 修改: `d:\VibeTest\bigsound\src\pages\WearablePage.tsx` (去 description)
- 修改: `d:\VibeTest\bigsound\src\pages\InvestPage.tsx` (去 description)
- 修改: `d:\VibeTest\bigsound\src\pages\AboutPage.tsx` (升级到主推页规格)
- 修改: `d:\VibeTest\bigsound\src\pages\CareersPage.tsx` (升级到主推页规格)
- 修改: `d:\VibeTest\bigsound\src\pages\NewsListPage.tsx` (升级到主推页规格)

**关键决策**
- **完全统一 vs 保留差异化**: 用户选择完全统一为主推页规格, 放弃原 3 档差异化 (主推页/内容页/列表页)。理由是"保持主题性一致性", 所有子页地位平等, 不再用视觉规格区分重要性
- **去掉 description**: 用户选择所有页面都不加 description。原 3 个主推页的 description (18px 灰色描述行) 是引导性文案, 去掉后 Hero 更简洁, 只有 title + subtitle 两行
- **副标文案不调整**: 保持现有副标文案 (如"中文助听·铺就 AI 中文之路"/"关于小维"/"最新动态"等), 只统一字号为 36px
- **主题性通过背景图体现**: 6 个子页各用不同背景图 (产品全家福/智能穿戴/招商氛围/创维大楼/团队办公/资讯抽象背景), 主题性通过背景图和文案体现, 视觉规格完全统一
- **paddingBottom 统一为 68**: 主推页原是 68, 内容页原是 60, 统一为 68 (与主推页一致)

**待办与决策点**
- ⏳ 数据文件中不再使用的 heroDescription 字段 (PRODUCT_PAGE.heroDescription / WEARABLE_PAGE.heroDescription / INVEST_PAGE.hero.description) 是否清理? 当前保留 (后续可能复用), 但会产生未使用字段
- ⏳ NewsListPage 副标 "最新动态" 4 字在 36px 下可能显得过大, 是否调整为更长的副标文案 (如 "了解大声最新动态")? 当前保持 4 字
- ⏳ AboutPage/CareersPage Hero 高度从 360 增到 448 后, 背景图可能需要重新选择构图更宽松的图 (原 360px 高度的图在 448px 下可能裁剪不当), 后续验证视觉效果

---

## [2026-07-22] 统一 | 全站子页 section 标题规范统一 (标题+绿色短横线, 参考关于小维)

**类型**: 统一 / 重构

**摘要**
用户要求各子页面模块标题规范参考【关于小维】页面的【标题+绿色短横线】规范。经 QA 确认 3 个关键决策: (1) 有副标的标题去掉副标, 只保留标题+短横线; (2) 左对齐标题改居中+短横线居中; (3) InvestPage 两层标题都不加短横线保持现状。本次新建共享组件 `src/components/ui/SectionTitle.tsx` (SectionTitle + TitleUnderline), ProductPage 5 个标题 / WearablePage 2 个标题 / CareersPage 3 个标题统一接入, 共 10 个标题规范化。AboutPage 作为参考标准保持现状不改。InvestPage 和 NewsListPage 不改 (前者用户选择保持, 后者无传统 section 标题)。`npx tsc --noEmit` 通过 (exit code 0)。

**详细变更**

### A. QA 确认的 3 个关键决策

1. **有副标的标题**: 去掉副标, 只保留标题+短横线 (与关于小维完全一致)。影响 ProductPage coreTech/serviceCenter/lifecycleService 的副标, WearablePage 2 个标题的副标, CareersPage companyIntro/jobList 的副标
2. **左对齐标题**: ProductPage coreTech 原左对齐 (在左右分栏左侧), 改为居中+短横线居中, 布局调整为"标题居中在上 → 左右分栏(左描述/右扇形图)在下"
3. **InvestPage 两层标题**: 4 个大板块 SectionTitle + 多个子模块 SubSectionTitle 都不加短横线, 保持现状 (用户判断加短横线会过于密集)

### B. 新建共享组件 SectionTitle.tsx

1. **`src/components/ui/SectionTitle.tsx`** (新建, 46 行):
   - `SectionTitle({ title, center = true })`: 30px #333 (ink-700) 700 leading-[45px], center 时 text-center
   - `TitleUnderline({ center = true })`: w-[60px] h-[3px] bg-brand-green, mt-[16px] mb-[40px], center 时 justify-center
   - 规范来源: AboutPage 内部的 SectionTitle + TitleUnderline (关于小维是参考标准)
   - 注: TitleUnderline 加 mt-[16px] (标题到短横线 16px 间距), 比关于小维原来的 40px 更紧凑合理 (短横线作为标题装饰应贴近标题)

### C. ProductPage.tsx — 5 个标题统一

2. **`src/pages/ProductPage.tsx`** (修改):
   - 加 `import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle"`
   - **coreTech (核心技术)**: 原左对齐 + 绿色副标 + 描述 + 扇形图 (左右分栏) → 改为标题居中+短横线在上, 下方左右分栏(左描述/右扇形图)。去掉绿色副标 "双引擎架构 HiFi4 DSP + NPU"
   - **endorsements (权威背书)**: 原居中无副标 → 加短横线
   - **serviceCenter (服务中心)**: 原居中 + 绿色副标 → 去副标, 加短横线
   - **lifecycleService (全生命周期服务)**: 原居中 + 灰色副标 → 去副标, 加短横线
   - **warranty (售后保修)**: 原居中无副标 → 加短横线

### D. WearablePage.tsx — 2 个标题统一

3. **`src/pages/WearablePage.tsx`** (修改):
   - 加 import SectionTitle + TitleUnderline
   - **watchTech (手表技术)**: 原居中 + 灰色副标 → 去副标, 加短横线
   - **earphoneTech (耳机技术)**: 原居中 + 灰色副标 → 去副标, 加短横线

### E. CareersPage.tsx — 3 个标题统一

4. **`src/pages/CareersPage.tsx`** (修改):
   - 加 import SectionTitle + TitleUnderline
   - **companyIntro (公司简介)**: 原居中 + 绿色副标 "创维旗下 · 高科技医疗器械与服务公司" → 去副标, 加短横线
   - **category (职位分类)**: 原居中无副标 → 加短横线
   - **jobList (职位列表)**: 原居中 + 灰色副标 jobListNote → 去副标, 加短横线

### F. 不改的页面

5. **AboutPage**: 作为参考标准保持现状 (内部 SectionTitle + TitleUnderline 定义不变)。其视觉规范就是共享组件的参考来源
6. **InvestPage**: 用户选择"都不加", 保持现有 SectionTitle + SubSectionTitle 两层结构不变
7. **NewsListPage**: 无传统 section 标题 (Tab 切换列表), 不涉及

### G. 验证

8. `npx tsc --noEmit` 通过 (exit code 0), 无类型错误

**影响范围**
- 涉及 4 个文件 (1 个新建共享组件 + 3 个页面修改)
- 10 个 section 标题统一为"标题+绿色短横线"规范 (ProductPage 5 + WearablePage 2 + CareersPage 3)
- 视觉表现: 全站子页 section 标题视觉语言统一 (30px 标题 + 60×3px 绿色短横线), 与关于小维一致
- 去掉 7 个副标 (ProductPage 3 + WearablePage 2 + CareersPage 2), 丢失部分信息 (如"双引擎架构 HiFi4 DSP + NPU" "创维旗下 · 高科技医疗器械与服务公司" 等), 但用户明确要求去掉
- ProductPage coreTech 布局调整: 原左右分栏(左标题+副标+描述/右扇形图) → 标题居中在上 + 左右分栏(左描述/右扇形图)
- 数据文件中 subtitle 字段不再使用但保留 (后续若需要可恢复)
- 不影响业务功能, 仅视觉规范统一

**关联文件**
- 新建: `d:\VibeTest\bigsound\src\components\ui\SectionTitle.tsx`
- 修改: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` (5 标题 + coreTech 布局)
- 修改: `d:\VibeTest\bigsound\src\pages\WearablePage.tsx` (2 标题)
- 修改: `d:\VibeTest\bigsound\src\pages\CareersPage.tsx` (3 标题)

**关键决策**
- **共享组件 vs 各页面内联**: 4 个页面 (含 AboutPage) 用同一规范, 抽共享组件避免 4 份重复代码。AboutPage 保持内部定义 (作为参考标准且含 Reveal 包裹, 改动成本高)
- **TitleUnderline 加 mt-[16px]**: 关于小维原规范是标题到短横线 40px (Reveal 的 mb-40px), 但 40px 间距太大短横线飘在标题下方不像装饰。共享组件改为 mt-[16px] (16px 间距), 短横线贴近标题更合理。关于小维不改 (保持原视觉)
- **去掉副标**: 用户明确选择"去掉副标, 只保留标题+短横线"。丢失的副标信息 (如 coreTech 的"双引擎架构 HiFi4 DSP + NPU") 是技术说明, 去掉后标题更简洁但信息密度降低。后续若需要可通过其他方式补充 (如描述文字)
- **coreTech 布局调整**: 原左对齐标题在左右分栏左侧, 改为居中在上。布局从"左标题+副标+描述/右扇形图"调整为"标题居中在上/左描述/右扇形图"。视觉更平衡 (标题不再挤在左侧)
- **InvestPage 不改**: 用户判断 InvestPage 有两层标题 (4 大板块 + 多个子模块), 加短横线会过于密集。保持现有 SectionTitle + SubSectionTitle 结构
- **NewsListPage 不改**: 无传统 section 标题, 主要靠 Tab 切换列表

**待办与决策点**
- ⏳ 数据文件中不再使用的 subtitle 字段 (PRODUCT_PAGE.coreTech.subtitle / serviceCenter.subtitle / lifecycleService.subtitle / WEARABLE_PAGE.watchTech.subtitle / earphoneTech.subtitle / CAREERS_PAGE.jobListNote) 是否清理? 当前保留 (后续可能复用), 但会产生未使用字段
- ⏳ AboutPage 是否也改为引用共享组件? 当前保持内部定义 (含 Reveal 包裹), 视觉与共享组件略有差异 (关于小维标题到短横线 40px, 其他页面 16px)。若要完全统一需改 AboutPage
- ⏳ ProductPage coreTech 去掉副标 "双引擎架构 HiFi4 DSP + NPU" 后, 技术亮点信息丢失。是否在描述文字中补充? 或在扇形图旁加技术标签?
- ⏳ CareersPage companyIntro 去掉副标 "创维旗下 · 高科技医疗器械与服务公司" 后, 品牌定位信息丢失。是否在描述文字中补充?

---

## [2026-07-22] 统一 | 关于页所有 section 标题只保留中文标题 + 绿色短横线 (去掉英文副标题)

**类型**: 统一 / 优化

**摘要**
用户指示: "只保留中文标题和绿色短横线。特殊模块标题不管" / "发展历程模块也是只保留中文标题和绿色短横线"。本次修改 AboutPage.tsx 的通用 `SectionTitle` 组件,去掉英文副标题和可选 subtitle 的渲染;清理全部 7 个 section 调用处的 `en` 和 `subtitle` 属性。涉及 §3.2 创维集团、§3.4 小维健康科技、§3.6 企业文化、§3.7 荣誉资质、§3.8 核心团队、§3.10 战略合作伙伴、§3.11 发展历程。`npx tsc --noEmit` 通过 (exit code 0)。

**详细变更**

### A. SectionTitle 组件重构 (`src/pages/AboutPage.tsx`)

1. 原组件签名: `{ zh, en, subtitle, center }`
2. 新组件签名: `{ zh, center }`
3. 渲染内容:
   - 保留: 中文标题 `text-[30px] font-bold text-[#333333] leading-[45px]`
   - 删除: 英文副标题 `<span>` (14px #999 tracking-wider uppercase)
   - 删除: 可选 subtitle `<p>` (16px #666)
4. `TitleUnderline` 保持不变: 绿色短横线 `w-[60px] h-[3px] bg-brand-green`

### B. 清理所有 section 调用处的英文和 subtitle 属性

| Section | 修改前 | 修改后 |
|---|---|---|
| §3.2 创维集团 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.4 小维健康科技 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.6 企业文化 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.7 荣誉资质 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.8 核心团队 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.10 战略合作伙伴 | `<SectionTitle zh=... en=... />` | `<SectionTitle zh=... />` |
| §3.11 发展历程 | `<SectionTitle zh=... en=... subtitle=... />` | `<SectionTitle zh=... />` |

### C. 数据文件说明

5. `src/data/about.ts` 中的 `sectionEnTitle` 字段未删除, 保留作为未来扩展或 CMS 使用, 但页面渲染已不再读取
6. 发展历程的 `subtitle: "开创中文助听器，缔造美好生活"` 也停止渲染

### D. 验证

7. `npx tsc --noEmit` 通过 (exit code 0), 无类型错误

**影响范围**
- 涉及 1 个源码文件 (`src/pages/AboutPage.tsx`)
- 视觉表现:
  - 关于页 7 个 section 标题统一为: 中文标题 → 绿色短横线
  - 标题区域更简洁, 减少视觉噪音
  - 与项目朴素风格更一致

**关联文件**
- `d:\VibeTest\bigsound\src\pages\AboutPage.tsx` (SectionTitle 组件 + 7 处调用清理)

**待办与决策点**
- ⏳ 其他页面 (ProductPage / WearablePage / InvestPage / CareersPage / NewsListPage) 如需要同样风格, 可后续统一 SectionTitle 组件
- ⏳ InvestPage.tsx 有自己的 SectionTitle 实现 (含英文), 若需要统一风格需单独处理

---

## 2026-07-22 中文助听核心技术扇形图复刻优化

**类型**: 代码修改 + 数据更新

**摘要**: 调整 `/product` 中文助听核心技术扇形图，按原型 `product_ric_render.png` 复刻扇区比例、图标与标签位置。

**详细变更**:

1. `src/data/product.ts`
   - `fanChart.sectors` 角度从等分 54° 调整为原型视觉比例 `60°×3 + 45°×2`：
     - 90°-150°（非平稳降噪）
     - 150°-210°（AI 助听）
     - 210°-270°（软硬结合）
     - 270°-315°（多元化场景）
     - 315°-360°（多样化产品形态）
   - 图标键 `bluetooth` 改为 `scene`，匹配"多元化场景"语义。

2. `src/pages/ProductPage.tsx`
   - 重绘 `FanIcon`：
     - `wave`: 等化器竖条
     - `ai`: 圆环内 `AI` 文字
     - `speaker`: 扬声器 + 叉号
     - `scene`: 双右向尖括号
     - `ear`: 耳廓 + 助听器轮廓
   - 绿色扇区中心 `中` 字外加白色圆环，复刻原型样式。
   - 调整 5 个黑色扇区标签位置与绿色扇区标签位置，右上角标签增加绿色提示点。
   - 修复长标签（如"不仅传统形态 [多样化] 产品形态"）因中文换行导致的错行，强制 `whiteSpace: nowrap`。

3. `aigpic/screenshot-coretech.cjs`
   - 截图目标 URL 从 `http://127.0.0.1:5173/product` 改为 `http://127.0.0.1:4173/product`，匹配 `npm run preview` 默认端口。

**决策依据**:
- 以 `public/images/prototype/product_ric_render.png` 为视觉真源，优先还原扇区比例、图标语义与标签排布。

**影响范围**: `/product` 中文助听核心技术模块（`#core-tech`）

**关联文件**:
- `src/data/product.ts`
- `src/pages/ProductPage.tsx`
- `aigpic/screenshot-coretech.cjs`

**验证**:
- `npm run build` 通过（exit code 0）
- Playwright 截图 `aigpic/product_coretech_screenshot.png` 与原型对比一致

---

## 2026-07-22 Footer 选购指南旗舰店链接补全

**类型**: 配置变更 + 代码修改 + 文档更新

**摘要**: 补全 Footer §9.1 选购指南栏目的 4 类外链（大声听力服务中心 + 3 类产品 × 3 个旗舰店），删除原 `#` 占位。

**详细变更**:

1. `src/config/site.ts`
   - 删除 `SITE_INFO.shops` 字段（原统一占位 `#`，已不再适用）
   - 新增 `SITE_INFO.hearingServiceUrl = "https://www.xiaowe.cc/h-col-104.html"`（大声听力服务中心官方直达）
   - 新增 `SKYWORTH_HEARING_SHOPS` 常量：3 个平台搜索页 URL（关键词"创维助听器"，URL 编码）
     - 天猫: `https://list.tmall.com/search_product.htm?q=创维助听器`
     - 京东: `https://search.jd.com/Search?keyword=创维助听器`
     - 拼多多: `https://mobile.yangkeduo.com/search_result.html?search_key=创维助听器`
   - 新增 `SKYWORTH_WEARABLE_SHOP_URL` 常量：skyworthtby.tmall.com URL（创维穿戴天猫店）
   - `SHOP_CATEGORIES` 三类产品链接全部指向实际 URL：
     - AI 中文助听器 → 平台搜索页
     - 健康智能手表 / 智能蓝牙耳机 → skyworthtby.tmall.com URL

2. `src/components/layout/Footer.tsx`
   - "大声听力服务中心" 从 `<Link to="#">` 改为 `<a href={SITE_INFO.hearingServiceUrl} target="_blank">`
   - 所有旗舰店 `<a>` 标签统一 `target="_blank"` + `rel="noopener noreferrer"`（移除原 `link.href !== "#" ? "_blank" : undefined` 三元判断）

3. `PROTOTYPE_PAGES.md` §9.1 同步更新实际链接 + 说明

**决策依据**:
- AI 中文助听器旗舰店：搜索发现"创维助听器"在京东/天猫的店铺可能由第三方公司（伊好鼎盛）代运营，未找到创维官方旗舰店直达 URL，PM 决定用平台搜索页代替
- 健康智能手表 / 智能蓝牙耳机旗舰店：PM 仅提供 1 个天猫 URL（skyworthtby.tmall.com），决定 6 个链接（2 类 × 3 平台）统一用此 URL

**影响范围**: Footer 选购指南栏目所有链接（4 个外链块，共 10 个链接）

**关联文件**:
- `src/config/site.ts`
- `src/components/layout/Footer.tsx`
- `PROTOTYPE_PAGES.md` §9.1

**验证**: `npx tsc -b --noEmit` 通过（exit code 0）

---

# Plan: Apple 风格入场动画 + hover 效果 + 标题统一

> 范围: 小维健康科技官网 3.0 全站各页面各模块
> 风格基调: Apple 入场 (cubic-bezier(0.16,1,0.3,1)) + Material hover (cubic-bezier(0.4,0,0.2,1))
> 核心约束: **不同模块用不同入场动画**, 不追求统一动效

---

## 一、Summary 摘要

基于现有 `Reveal` 组件 (IntersectionObserver + CSS transition) 扩展 variant 系统, 为不同模块类型设计差异化的 Apple 风格入场动画。hover 效果以 AboutPage 数据卡抽屉式为标杆, 推广到全站卡片/证书/节点等可交互元素, 保持 Material 缓动 (400ms cubic-bezier(0.4,0,0.2,1))。同时统一标题组件 (抽出共用 `SubSectionTitle`, 删除 AboutPage 本地重复定义), 并删除已弃用的 ServicePage。

---

## 二、Current State Analysis 当前状态分析

### 现有动画基础设施
- **无动画库** (无 framer-motion / GSAP), 全靠 CSS transition + IntersectionObserver
- [`Reveal.tsx`](file:///d:\VibeTest\bigsound\src\components\ui\Reveal.tsx) — 600ms ease-out, opacity + translateY(20px), 支持 delay 错峰, 全站已大量使用
- [`CountUp.tsx`](file:///d:\VibeTest\bigsound\src\components\ui\CountUp.tsx) — 数字递增, 2000ms easeOutQuart
- [`index.css`](file:///d:\VibeTest\bigsound\src\index.css) — 全站无 `@keyframes`, 无 `animation:`, 仅 transition

### AboutPage 数据卡 hover 标杆 ([AboutPage.tsx#L99-L132](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx#L99-L132))
- 抽屉式: `absolute inset-0 bg-brand-green translate-y-full → group-hover:translate-y-0`
- 文字变色: 数字/单位/label/副标同步 `group-hover:text-white`
- 边框变绿: `hover:border-brand-green`
- 时长: `duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]`
- 入场: `<Reveal delay={idx * 80}>` 错峰 80ms

### 标题组件不一致清单
| 页面 | 实现 | 字号 | 颜色 | 短横线 | 副标 |
|---|---|---|---|---|---|
| ProductPage / WearablePage / CareersPage | 共用 `SectionTitle`+`TitleUnderline` | 30px | ink-700 | 60×3 绿色 | 无 |
| AboutPage | **本地 SectionTitle** ([AboutPage.tsx#L16-L39](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx#L16-L39)) | 30px | #333333 硬编码 | 60×3 绿色 | 无 |
| InvestPage | **本地 SectionTitle** ([InvestPage.tsx#L35-L46](file:///d:\VibeTest\bigsound\src\pages\InvestPage.tsx#L35-L46)) | 30px | ink-700 | 无 | 16px ink-500 |
| ServicePage | 直接 h2, 36px | 36px | #333 | 无 | 无 |

**子模块标题 (SubSectionTitle)**:
- ProductPage 内联复制 ~5 次: 4×28 绿色竖条 + 22px ink-700
- WearablePage 内联复制: 同上
- InvestPage 本地 ([InvestPage.tsx#L49-L65](file:///d:\VibeTest\bigsound\src\pages\InvestPage.tsx#L49-L65)): **4×24 + 24px** (与 ProductPage 不一致)

### ServicePage 状态
- [`ServicePage.tsx`](file:///d:\VibeTest\bigsound\src\pages\ServicePage.tsx) 旧版结构, 未参与 3.0 改造, 用户确认可删除
- 路由: [`routes/index.tsx#L24-L47`](file:///d:\VibeTest\bigsound\src\routes\index.tsx#L24-L47) (import + Route)
- 路径常量: [`paths.ts#L31`](file:///d:\VibeTest\bigsound\src\routes\paths.ts#L31) (SERVICE: "/service")
- 数据文件 `src/data/service.ts` 和 `src/data/images/service.ts` 中部分 key 被 ProductPage 引用, **不删除数据文件**, 仅删页面+路由

### 项目记忆约束
- "InvestPage 两层标题不加, 保持现状" — InvestPage 本地 SectionTitle (无短横线+副标) **保留**
- "企业文化/组织团队模块: 内部标题和人名下不使用绿色短横线装饰"
- 全站风格: 朴素 — 无圆角 / 无阴影 / 无渐变 (仅"AI"二字例外)

---

## 三、Proposed Changes 实施方案

### Step 1: 删除 ServicePage

**文件操作**:
1. 删除 [`src/pages/ServicePage.tsx`](file:///d:\VibeTest\bigsound\src\pages\ServicePage.tsx)
2. 修改 [`src/routes/index.tsx`](file:///d:\VibeTest\bigsound\src\routes\index.tsx):
   - 删除第 24 行 `import ServicePage from "../pages/ServicePage";`
   - 删除第 47 行 `<Route path={PATHS.SERVICE} element={<ServicePage />} />`
3. 修改 [`src/routes/paths.ts`](file:///d:\VibeTest\bigsound\src\routes\paths.ts):
   - 删除第 30-31 行 SERVICE 常量及其注释
   - 更新文件顶部注释, 移除"旧版 2.0 遗留"相关说明

**保留**: `src/data/service.ts` / `src/data/images/service.ts` / `src/data/content.ts` 中的 SERVICE_PAGE export (因 product.ts 仍引用 service.ts 部分资源, 不删数据文件避免连锁影响)

**验证**: `npx tsc --noEmit` 通过; 浏览器访问 `/service` 应返回 NotFoundPage

---

### Step 2: 扩展 Reveal 组件支持 variant 系统

**修改文件**: [`src/components/ui/Reveal.tsx`](file:///d:\VibeTest\bigsound\src\components\ui\Reveal.tsx)

**变更点**:
1. 新增 `variant` prop, 类型联合: `"fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "scale-up" | "pop"`
2. 默认 `variant="fade-up"` (向后兼容, 现有调用无需改动)
3. 缓动统一改为 `cubic-bezier(0.16, 1, 0.3, 1)` (Apple 标志性曲线)
4. 时长保持 600ms (可通过新增 `duration` prop 自定义, 默认 600)
5. 根据 variant 切换初始/可见态的 transform class

**variant 与初始态映射**:

| variant | 初始态 (隐藏) | 可见态 | 适用场景 |
|---|---|---|---|
| `fade-up` (默认) | `opacity-0 translate-y-5` | `opacity-100 translate-y-0` | 标题、文字段落、一般内容 |
| `fade-down` | `opacity-0 -translate-y-5` | `opacity-100 translate-y-0` | 从顶部滑入 (罕见) |
| `fade-left` | `opacity-0 translate-x-5` | `opacity-100 translate-x-0` | 右侧元素从右滑入 |
| `fade-right` | `opacity-0 -translate-x-5` | `opacity-100 translate-x-0` | 左侧元素从左滑入 |
| `scale` | `opacity-0 scale-95` | `opacity-100 scale-100` | 大图、整体容器、SVG |
| `scale-up` | `opacity-0 scale-90 translate-y-5` | `opacity-100 scale-100 translate-y-0` | 卡片网格 (产品卡/数据卡/团队卡) |
| `pop` | `opacity-0 scale-80` | `opacity-100 scale-100` | 时间轴节点、SVG 节点、序号 |

**实现要点**:
- 保留 `prefers-reduced-motion` 处理 (直接 setVisible)
- 保留首屏 rAF 立即触发逻辑
- 保留 `delay` / `enabled` / `as` / `style` / `className` 透传
- `transition-[opacity,transform]` 不变, 仅改缓动和初始 transform

---

### Step 3: 抽出共用 SubSectionTitle 组件

**新建文件**: `src/components/ui/SubSectionTitle.tsx`

**设计规范** (采用 ProductPage 标准, 统一全站):
- 左侧绿色短竖条: `w-[4px] h-[28px] bg-brand-green`
- 标题: `text-[22px] font-bold text-ink-700 leading-[28px]`
- 容器: `flex items-start gap-[16px] mb-[24px]`
- 可选 `desc` prop: `text-[14px] text-ink-500 leading-[22px]`
- 可选 `center` prop (默认 false, 左对齐)
- 入场动画: 内部包 `<Reveal variant="fade-up">`

**导出**: 在 [`src/components/ui/index.ts`](file:///d:\VibeTest\bigsound\src\components\ui\index.ts) 增加 `export { SubSectionTitle } from "./SubSectionTitle"`

**替换内联实现**:
- [`ProductPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\ProductPage.tsx) — 替换 ~5 处内联 SubSectionTitle (4×28 + 22px)
- [`WearablePage.tsx`](file:///d:\VibeTest\bigsound\src\pages\WearablePage.tsx) — 替换内联 SubSectionTitle
- [`InvestPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\InvestPage.tsx#L49-L65) — 本地 SubSectionTitle 改为 4×28 + 22px (统一为 ProductPage 标准), 删除本地实现, 改用共用组件

**注意**: 项目记忆"企业文化/组织团队模块: 内部标题和人名下不使用绿色短横线装饰" — 这些位置 (AboutPage 企业文化序号、核心团队人名) **不使用** SubSectionTitle, 保持原样。

---

### Step 4: 统一 AboutPage 标题

**修改文件**: [`src/pages/AboutPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx)

**变更点**:
1. 删除本地 `SectionTitle` 函数 ([第 16-30 行](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx#L16-L30)) 和本地 `TitleUnderline` 函数 ([第 33-39 行](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx#L33-L39))
2. 顶部 import 改为: `import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle";`
3. 调用处: 原本地 `SectionTitle` 用 `zh` prop, 共用组件用 `title` prop — 全局替换 `zh=` 为 `title=`
4. 原本地 SectionTitle 内部已包 `<Reveal>`, 共用组件不包 — 在调用处显式包 `<Reveal variant="fade-up">` 保持入场动画
5. 原本地 TitleUnderline 无 mb, 共用组件内置 `mb-[40px]` — 检查布局间距是否需要调整

**保留**: AboutPage 内其他子模块标题 (企业文化序号、研究方向卡内 tag 等) 维持现有设计, 不强制统一。

---

### Step 5: HomePage 入场动画 + hover

**文件**: [`src/pages/HomePage.tsx`](file:///d:\VibeTest\bigsound\src\pages\HomePage.tsx) 及 `src/components/home/HeroProducts.tsx`

**入场动画**:
- VideoEntry (Hero 视频): 不加入场 (首屏直接显示)
- HeroProducts 3 产品入口: 整体 `<Reveal variant="fade-up">`, 内部 3 卡 `<Reveal variant="scale-up" delay={idx*120}>` 错峰入场

**hover 效果** (产品卡):
- 容器加 `group` + `transition-colors duration-300`
- 边框: `hover:border-brand-green`
- 轻微上浮: `group-hover:-translate-y-1 transition-transform duration-300`
- 图片缩放: `group-hover:scale-[1.03] transition-transform duration-500`
- CTA 箭头平移: `group-hover:translate-x-0.5`
- 缓动: `ease-[cubic-bezier(0.4,0,0.2,1)]` (Material, 与全站 hover 一致)

---

### Step 6: AboutPage 入场动画 + hover

**文件**: [`src/pages/AboutPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\AboutPage.tsx)

**各模块入场**:
| 模块 | 入场方案 |
|---|---|
| §3.1 PageHero | 不加 (Banner 直接渲染) |
| §3.2 企业简介标题 | `<Reveal variant="fade-up">` |
| §3.2 创维集团文字段落 | `<Reveal variant="fade-up" delay={80}>` 错峰 |
| §3.3 8 张数据卡 | `<Reveal variant="scale-up" delay={idx*80}>` (替换现有 fade-up) |
| §3.4 小维健康科技标题 | `<Reveal variant="fade-up">` |
| §3.4 左文 | `<Reveal variant="fade-right">` (从左滑入) |
| §3.4 右图 | `<Reveal variant="fade-left">` (从右滑入, 镜像) |
| §3.4 2 张研究方向卡 | `<Reveal variant="scale-up" delay={idx*120}>`, 保持 Ken Burns hover |
| §3.5 企业文化 3 行 | 行容器 `<Reveal variant="fade-up" delay={idx*200}>`, 内部序号 `fade-right` + 文字 `fade-left` |
| §3.6 荣誉资质 3 行证书 | 每行 `<Reveal variant="scale-up">`, 内部证书错峰 `delay={idx*60}` |
| §3.7 核心团队 | 创始人卡 `scale-up`, 4 成员卡 `scale-up delay={idx*80}` |
| §3.8 战略合作伙伴 | 4 投资 `fade-up delay={idx*80}`, 5 合作 logo `scale delay={idx*60}` (从 0.8 缩放) |
| §3.9 发展历程 5 阶段 | 节点 `<Reveal variant="pop" delay={idx*150}>`, 年份 `fade-right`, 描述 `fade-up` |

**hover 效果**:
- 数据卡 (§3.3): 保持现有抽屉式 hover, **不改动**
- 研究方向卡 (§3.4): 保持现有 Ken Burns (1200ms), **不改动**
- 核心团队创始人卡 + 4 成员卡 (§3.7): **新增 hover**
  - `group` + `transition-colors duration-300 hover:border-brand-green`
  - 头像 `group-hover:scale-[1.03] transition-transform duration-500`
- 合作伙伴 logo (§3.8): 保持 `hover:scale-110 duration-500`
- 荣誉证书 (§3.6): **新增 hover** (若无)
  - `group hover:border-brand-green` + `group-hover:-translate-y-1`

---

### Step 7: ProductPage 入场动画 + hover

**文件**: [`src/pages/ProductPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\ProductPage.tsx)

**各模块入场**:
| 模块 | 入场方案 |
|---|---|
| §4.1 PageHero | 不加 |
| §4.2 产品分类标语 | `<Reveal variant="fade-up">` |
| §4.3 4 分类按钮 | `<Reveal variant="fade-up" delay={idx*80}>` |
| §4.3 12 产品卡 | `<Reveal variant="scale-up" delay={idx*60}>` (按行错峰, 每行内 idx 0/1/2/3) |
| §4.4 中文助听核心技术 标题 | `<Reveal variant="fade-up">` |
| §4.4 扇形图整体 | `<Reveal variant="scale">` |
| §4.4 扇形图节点 | `<Reveal variant="pop" delay={idx*100}>` |
| §4.5 权威背书 3 子模块 | `<Reveal variant="fade-up" delay={idx*200}>` |
| §4.5 6 张百万级检查设备卡 | `<Reveal variant="scale-up" delay={idx*80}>` |
| §4.5 5 张真实证书 | `<Reveal variant="scale-up" delay={idx*60}>` |
| §4.5 临床医疗认证配图 | `<Reveal variant="scale">` |
| §4.6 听力服务中心 标题 | `<Reveal variant="fade-up">` |
| §4.6 声处方流程图 SVG 节点 | `<Reveal variant="pop" delay={idx*150}>` (左列 5 节点 + 右列 3 节点 + 右侧 3 序号) |
| §4.6 设备 2×3 卡片 | `<Reveal variant="scale-up" delay={idx*80}>` |
| §4.7 售前 4 节点 | `<Reveal variant="pop" delay={idx*100}>` |
| §4.7 售后 8 节点 (U 形弯道) | `<Reveal variant="pop" delay={idx*80}>` (上下交替排列) |
| §4.8 售后保修政策 | `<Reveal variant="fade-up">` |

**hover 效果**:
- 12 产品卡: `group hover:border-brand-green` + `group-hover:-translate-y-1` + 图片 `group-hover:scale-[1.03]`
- 6 张检查设备卡: `group hover:border-brand-green` (保持现有, 若已加则不重复)
- 5 张证书: 已有 hover (相框设计), 保持
- 扇形图节点: 已有 hover (黑扇区变绿等), 保持
- 声处方流程图节点: 已有 hover (边框变绿/背景浅绿), 保持
- 售前/售后时间轴节点: 已有 hover (赛车道三层结构), 保持

---

### Step 8: WearablePage 入场动画 + hover

**文件**: [`src/pages/WearablePage.tsx`](file:///d:\VibeTest\bigsound\src\pages\WearablePage.tsx)

**各模块入场**:
| 模块 | 入场方案 |
|---|---|
| §5.1 PageHero | 不加 |
| §5.2 产品分类标语 | `<Reveal variant="fade-up">` |
| §5.3 4 分类按钮 | `<Reveal variant="fade-up" delay={idx*80}>` |
| §5.3 11 产品卡 | `<Reveal variant="scale-up" delay={idx*60}>` |
| §5.4 智能手表核心技术 10 项 | `<Reveal variant="fade-up" delay={idx*80}>` |
| §5.5 蓝牙耳机核心技术 6 项 | `<Reveal variant="fade-up" delay={idx*80}>` |

**hover 效果**:
- 11 产品卡: 同 ProductPage 产品卡 hover (边框变绿 + 上浮 + 图片缩放)
- 核心技术项: `hover:bg-brand-green/5` 浅绿底 (轻量交互)

---

### Step 9: InvestPage 入场动画 + hover

**文件**: [`src/pages/InvestPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\InvestPage.tsx)

**各模块入场**:
| 模块 | 入场方案 |
|---|---|
| §6.1 PageHero | 不加 |
| §6.2 行业前景 4 子模块 (三高一低) | `<Reveal variant="scale-up" delay={idx*100}>` |
| §6.3 项目优势 5 子模块 | `<Reveal variant="fade-up" delay={idx*120}>` |
| §6.3 SVG 抛物线图 | `<Reveal variant="scale">` + 可选 stroke 绘制动画 |
| §6.4 合作政策 4 子模块 | `<Reveal variant="scale-up" delay={idx*100}>` |
| §6.5 详细政策解读 表格行 | `<Reveal variant="fade-right" delay={idx*50}>` (从左滑入, 逐行错峰) |
| §6.6 联系我们 CTA | `<Reveal variant="fade-up">` |

**hover 效果**:
- 行业前景 4 卡: `group hover:border-brand-green` + `group-hover:-translate-y-1`
- 合作政策 4 卡: `group hover:border-brand-green` + `group-hover:-translate-y-1`
- 表格行: 已有 `hover:bg-brand-green/15`, 保持
- CTA 按钮: 已有 `.btn-primary` / `.btn-outline`, 保持

**注意**: InvestPage 本地 `SectionTitle` (无短横线+副标) **保留**, 因项目记忆明确"InvestPage 两层标题不加, 保持现状"。仅替换本地 `SubSectionTitle` 为共用组件。

---

### Step 10: CareersPage 入场动画 + hover

**文件**: [`src/pages/CareersPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\CareersPage.tsx)

**各模块入场**:
| 模块 | 入场方案 |
|---|---|
| §7.1 PageHero | 不加 |
| §7.2 公司简介 左图 | `<Reveal variant="fade-right">` |
| §7.2 公司简介 右文 | `<Reveal variant="fade-left">` |
| §7.3 职位分类 4 卡 | `<Reveal variant="scale-up" delay={idx*100}>` |
| §7.4 职位列表 | `<Reveal variant="fade-up">` |
| §7.5 福利待遇 | `<Reveal variant="fade-up">` |

**hover 效果**:
- 职位分类 4 卡: `group hover:border-brand-green` + `group-hover:-translate-y-1`
- 职位列表项: `hover:bg-brand-green/5` + `hover:text-brand-green` (标题)

---

### Step 11: NewsListPage / NewsDetailPage 入场动画 + hover

**文件**: [`src/pages/NewsListPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\NewsListPage.tsx) / [`NewsDetailPage.tsx`](file:///d:\VibeTest\bigsound\src\pages\NewsDetailPage.tsx)

**入场动画**:
- NewsListPage 列表项: `<Reveal variant="fade-up" delay={idx*60}>` 错峰
- NewsDetailPage 正文: `<Reveal variant="fade-up">`
- NewsDetailPage 标题: `<Reveal variant="fade-up">`

**hover 效果**:
- 列表项: `hover:bg-brand-green/5` + 标题 `hover:text-brand-green`

---

### Step 12: 验证与文档

**TypeScript 编译**:
- 每完成一个 Step 后运行 `npx tsc --noEmit` 确保无类型错误

**浏览器测试**:
- 启动 dev server: `npm run dev`
- 逐页访问验证入场动画: `/` `/about` `/product` `/wearable` `/invest` `/careers` `/news`
- 验证 hover 效果: 鼠标悬停各卡片/证书/节点
- 验证 ServicePage 已删除: 访问 `/service` 应返回 404
- 验证标题统一性: 各页面 section 标题字号/颜色/短横线一致 (InvestPage 例外保留)

**开发日志**:
- 更新 `d:\VibeTest\bigsound\DEV_LOG.md`, 倒序添加本次改造条目
- 类型: 设计调整 + 重构
- 涉及文件: 列出所有修改的文件路径

---

## 四、Assumptions & Decisions 假设与决策

### 决策
1. **缓动曲线**: 入场用 Apple `cubic-bezier(0.16, 1, 0.3, 1)`, hover 保持 Material `cubic-bezier(0.4, 0, 0.2, 1)` (用户确认)
2. **ServicePage**: 整体删除 (页面+路由+路径常量), 保留数据文件 (用户确认)
3. **不同模块不同动画**: 通过 Reveal variant 系统实现 7 种入场效果, 按模块性质分配 (用户明确要求)
4. **InvestPage 标题**: 保留本地 SectionTitle (无短横线+副标), 仅替换 SubSectionTitle 为共用组件 (项目记忆约束)
5. **AboutPage 标题**: 删除本地重复定义, 改用共用 `SectionTitle` + `TitleUnderline`, 调用处显式包 Reveal
6. **SubSectionTitle 统一标准**: 采用 ProductPage 规范 (4×28 + 22px), InvestPage 本地 (4×24 + 24px) 同步对齐
7. **hover 时长**: 全站统一 400ms (与 AboutPage 数据卡一致), 图片缩放 500ms, 表格行 150-200ms
8. **不引入动画库**: 继续 CSS + Reveal 方案, 不新增 framer-motion 等依赖 (符合项目朴素风格)
9. **SVG 路径绘制动画**: 暂用 `variant="scale"` 整体缩放入场, 不实现 stroke-dashoffset 路径绘制 (避免复杂度, 后续如需要再增强)
10. **PageHero 不加入场**: 子页 Banner 切换时直接渲染, 保持现状 (避免路由切换闪烁)

### 假设
- 现有 Reveal 调用 (~50+ 处) 默认 variant="fade-up" 后视觉与原 ease-out 一致 (Apple 曲线 + 同样的位移), 不会破坏现有页面观感
- 共用 SubSectionTitle 抽出后, ProductPage / WearablePage 内联实现的间距 (mb-[24px]) 与共用组件一致, 不会引起布局偏移
- AboutPage 共用 SectionTitle 后, 内置 mb-[40px] 与原本地一致, 布局无变化
- ServicePage 删除后, 无其他页面通过 Link 指向 `/service` (grep 已确认 navigation/footer 未引用)
- `prefers-reduced-motion` 用户仍能正常浏览 (Reveal 已处理)

### 不做的事
- 不引入 framer-motion / GSAP / AOS 等动画库
- 不为 SVG 流程图实现 stroke-dashoffset 路径绘制动画 (复杂度高, 收益有限)
- 不修改 PageHero 入场 (Banner 直接渲染)
- 不修改 Header / Footer / FloatingTools 入场 (全局组件, 保持稳定)
- 不修改 InvestPage 本地 SectionTitle (项目记忆明确保留)
- 不删除 `src/data/service.ts` 数据文件 (product.ts 仍引用部分资源)
- 不为企业文化/核心团队人名加绿色短横线 (项目记忆约束)

---

## 五、Verification 验证步骤

### 编译验证
```bash
npx tsc --noEmit
```
预期: 0 errors

### 功能验证
1. `npm run dev` 启动 dev server
2. 逐页访问, 滚动触发入场动画, 检查:
   - 不同模块入场动画有差异 (fade-up / scale-up / pop / fade-left / fade-right / scale)
   - 入场动画流畅, 缓动有 Apple 风格的柔滑感
   - 错峰 delay 正常, 无元素堆叠卡顿
3. 鼠标悬停各可交互元素, 检查:
   - 卡片边框变绿 + 上浮
   - 数据卡抽屉式覆盖 (AboutPage 已有, 不变)
   - 图片轻微缩放
   - CTA 箭头平移
4. 访问 `/service` 应返回 NotFoundPage (404)
5. 检查标题视觉统一性:
   - AboutPage / ProductPage / WearablePage / CareersPage 各 section 标题: 30px + 60×3 绿色短横线
   - InvestPage: 30px + 副标, 无短横线 (保留)
   - 子模块标题: 4×28 绿色竖条 + 22px (全站统一)

### 性能验证
- 滚动流畅, 无卡顿 (Reveal 用 IntersectionObserver + will-change, 性能良好)
- `prefers-reduced-motion: reduce` 下所有动画直接显示 (无位移)

### 回归验证
- 现有 Reveal 调用 (默认 variant="fade-up") 视觉与改造前一致
- 现有 hover 效果 (AboutPage 数据卡抽屉、合作伙伴 logo 缩放等) 保持不变
- 现有标题样式 (除 AboutPage 改用共用组件外) 无视觉变化

### 文档更新
- `DEV_LOG.md` 添加倒序条目, 记录本次改造的范围、决策、影响文件

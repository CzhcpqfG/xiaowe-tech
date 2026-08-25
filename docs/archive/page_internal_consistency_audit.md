# 小维健康科技官网 3.0 — 全页面模块内部一致性审计与关键项修复计划

## 摘要 (Summary)

针对项目 `d:\VibeTest\bigsound` 的 11 个页面，进行「页面内部模块间一致性」审计 —— 不追求跨页统一，而是分析每个页面自身的各个模块在 **间距 / 标题副标题规范 / 字号 / 视觉效果** 上是否存在内部偏差。审计完成后，按「关键项 + 低风险」原则迭代修复，**每项修复前必须 QA 用户确认**。同时更新项目记忆，移除已过时的「无阴影 / 无圆角 / 无渐变」原则。

---

## 用户决策 (Decisions from Phase 2 QA)

| # | 问题 | 用户回答 |
|---|------|----------|
| 1 | 交付物 | 审计 + 关键项修复（不修复视觉风格争议项） |
| 2 | 「无阴影/无圆角/无渐变」原则 | 不管此类，并从项目记忆中移除该原则 |
| 3 | 统一基准 | 不以原始 2.0 为参考；分析**单一页面各个模块之间**的一致性（within-page consistency） |
| 4 | 流程约束（用户主动追加） | 每次修改某项前一定要 QA 用户 |

---

## 当前状态分析 (Current State Analysis)

### 项目页面清单（11 个页面）

| # | 页面 | 路径 | 模块数 | 内部一致性初判 |
|---|------|------|--------|----------------|
| 1 | HomePage | `src/pages/HomePage.tsx` | 2（VideoEntry + HeroProducts） | 待 Stage B 细审 |
| 2 | AboutPage | `src/pages/AboutPage.tsx` | 11（§3.1–§3.11） | 已知偏差见下表 |
| 3 | ProductPage | `src/pages/ProductPage.tsx` | 8 | 已知偏差见下表 |
| 4 | WearablePage | `src/pages/WearablePage.tsx` | 5 | 已知偏差同 ProductPage |
| 5 | InvestPage | `src/pages/InvestPage.tsx` | 6 | 本地 SectionTitle；`bg-ink-50` 未定义 |
| 6 | CareersPage | `src/pages/CareersPage.tsx` | 5 | §5 inline h2 偏离 §1–§4 |
| 7 | NewsListPage | `src/pages/NewsListPage.tsx` | 2（Hero + Tab+List） | 待 Stage B 细审 |
| 8 | NewsDetailPage | `src/pages/NewsDetailPage.tsx` | 1（Breadcrumb + Article） | 单模块，N/A |
| 9 | LoginPage | `src/pages/LoginPage.tsx` | 2-column aside+form（无 Layout 包裹） | 待 Stage B 细审 |
| 10 | RegisterPage | `src/pages/RegisterPage.tsx` | 2-column aside+form | 待 Stage B 细审 |
| 11 | NotFoundPage | `src/pages/NotFoundPage.tsx` | 1 | 单模块，N/A |

### 已识别的页内偏差（来自 Phase 1 探查，待 Stage B 复核 + QA 确认是否为设计意图）

| # | 页面 | 文件 + 行号 | 偏差描述 | 当前值 | 该页主导模式 | 备注 |
|---|------|------------|----------|--------|-------------|------|
| D1 | AboutPage | `AboutPage.tsx` §3.5 附近 | 副标用左对齐 `text-[20px] text-[#333333] font-bold` | 20px 左对齐硬编码 | 共享 SectionTitle 30px 居中 ink-700 | 疑似设计意图，待 QA |
| D2 | AboutPage | `AboutPage.tsx` §3.5 容器 | `max-w-[1000px] mx-auto` 嵌套在已是 1200px 的 `container-page` 内 | 1000px 内层 | container-page 1200px | 已被用户在 2026-07-25 调整对齐时主动设置，可能有意为之，待 QA |
| D3 | ProductPage | `ProductPage.tsx` §2 | inline `text-[28px] font-bold text-brand-green` 绿色 slogan | 28px 绿色 inline | 共享 SectionTitle 30px ink-700 | 疑似 hero slogan 设计意图，待 QA |
| D4 | ProductPage | `ProductPage.tsx` §3 | inline `paddingTop: 20px; paddingBottom: 60px` 不对称 | 20/60 不对称 | py-[60px] | 疑似视觉节奏设计，待 QA |
| D5 | WearablePage | `WearablePage.tsx` §2 | 同 D3 | 28px 绿色 inline | 共享 SectionTitle | 待 QA |
| D6 | WearablePage | `WearablePage.tsx` §3 | 同 D4 | 20/60 不对称 | py-[60px] | 待 QA |
| D7 | CareersPage | `CareersPage.tsx` §5 (约 L218) | inline `<h2 className="text-[24px] font-bold text-ink-700 mb-8 leading-[36px]">` | 24px 无 underline | §1–§4 共享 SectionTitle 30px + underline | 看似无意偏差，待 QA |
| D8 | InvestPage | `InvestPage.tsx` 全页 6 个 section | 本地 SectionTitle（无 underline，有 subtitle prop） | 本地组件 | — | **若页内 6 个 section 全部使用此本地组件，则页内一致，非偏差**；Stage B 需确认 |
| D9 | InvestPage | `InvestPage.tsx` 多处（L498, L646, L730 等） | `bg-ink-50` 引用未定义的 Tailwind token | `bg-ink-50` 不渲染 | — | 静默失败，建议修复（补 token 或移除引用） |

### 全局静默失败 / 死代码（非页内一致性问题，但属关键项）

| # | 类型 | 文件 | 描述 |
|---|------|------|------|
| G1 | 未定义 token | `tailwind.config.js` / `InvestPage.tsx` | `ink-50` 未定义（最低为 `ink-100: #f5f5f5`），`bg-ink-50` 不渲染 |
| G2 | 未定义 class | `NewsDetailPage.tsx` L227 | `prose-content` class 在 `index.css` 与 Tailwind config 均无定义 |
| G3 | CSS 与组件不一致 | `src/index.css` | `.section-title` (`text-3xl font-semibold text-ink-900`) 与 `SectionTitle` 组件 (`text-[30px] font-bold text-ink-700`) typography 不一致；CSS class 无人使用 |
| G4 | 死代码 | `src/components/layout/PageHero.tsx` | 0 引用（所有子页改用 ProductCarouselHero） |
| G5 | 死代码 | `src/components/home/HomeVideoHero.tsx` | HomePage 已改用 VideoEntry |
| G6 | 死代码 | `src/components/home/` 13 个组件 | BrandIntro / ChinesePioneer / FlagshipProduct / HearingResearch / NewsSection / Partners / ProductCategories / ProductSeries / Qualifications / Sections / Stats / TechFeatures 等 |
| G7 | Barrel 缺失 | `src/components/layout/index.ts` | 未导出 `ProductCarouselHero`，各子页通过相对路径直接导入 |

---

## 提议的变更 (Proposed Changes)

### Stage A：项目记忆更新（先执行，无 QA 门槛）

**文件**：`c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md`

**变更**：移除「## 原网站 (2.0 复刻版) 设计风格 — 必须保留」节下的 `- **风格定位**: 朴素 - 无圆角 / 无阴影 / 无渐变 (仅"AI"二字例外)` 这一条。其余条目（主色 / 选中色 / 蓝色辅助 / 字体 / 设计宽度）保留不变。

**理由**：用户明确指示「不管此类，并把此类项目记忆去掉」。该原则已不反映实际代码状态（hover 阴影广泛使用、圆形头像存在、SVG 圆角存在），保留会误导后续开发。

**执行后**：DEV_LOG.md 追加一条变更记录。

---

### Stage B：页内一致性细审（无代码修改，仅产出审计清单）

**方法**：对 11 个页面逐页扫描，每页提取以下维度的「主导模式」与「内部偏差」：

1. `<section>` 的 padding（`py-[60px]` / `py-[40px]` / `py-12` / inline 等）
2. 标题元素（h1/h2/SectionTitle/本地 SectionTitle）的 typography 与是否使用共享组件
3. 副标题元素的 typography 与对齐方式
4. hover 效果配方（translate 量 + shadow 颜色/opacity）
5. Tab 按钮样式（尺寸 / 字号 / gap）
6. 颜色使用（Tailwind token vs 硬编码 hex）

**输出**：直接在对话中向用户呈现「逐页审计表」，每页一份，包含：
- 主导模式摘要
- 内部偏差列表（每条带：文件路径 + 行号 + 当前值 + 主导模式值 + 修复建议 + 「待 QA」标记）

**预期细审页面顺序**（按模块数从多到少，便于发现更多偏差）：
1. AboutPage（11 模块）
2. ProductPage（8 模块）
3. InvestPage（6 模块）
4. WearablePage（5 模块）
5. CareersPage（5 模块）
6. NewsListPage（2 模块 + Tab）
7. HomePage（2 模块）
8. LoginPage / RegisterPage（独立全屏）
9. NewsDetailPage / NotFoundPage（单模块，跳过）

---

### Stage C：关键 + 低风险修复（每项 QA 后执行）

**修复原则**：

- ✅ 修复：静默失败（G1 `bg-ink-50`、G2 `prose-content`）
- ✅ 修复：经 QA 确认为「无意偏差」的页内偏差（如 D7 CareersPage §5）
- ✅ 修复：barrel 缺失（G7）、CSS 与组件不一致（G3）
- ✅ 修复：冗余嵌套（D2，若 QA 确认非设计意图）
- ❌ 不修复：视觉风格争议项（hover 阴影配方 / 圆形头像 / SVG 圆角）—— 用户明确表示「不管」
- ❌ 不修复：经 QA 确认为「设计意图」的偏差（如 D3/D5 绿色 slogan 若是 hero 元素）
- ❌ 不修复：跨页统一化（如不强制 NewsListPage 用 py-[60px]）—— 用户明确表示以页内一致为准
- ⚠️ 待 QA：死代码清理（G4/G5/G6）—— 一次性确认「全删 / 保留 / 部分删」

**每项修复流程（强制 QA 门槛）**：

1. 在对话中呈现该项具体偏差（文件路径 + 行号 + 当前值 + 目标值 + 修复方案）
2. 用 `AskUserQuestion` 询问：「是否修复？是 / 否 / 改方案」
3. 用户确认后 → 执行 Edit
4. `npx tsc --noEmit` 验证 TypeScript 编译
5. 用户在浏览器强制刷新对应路由（Ctrl+Shift+R）验证视觉无回归
6. 在对话中标记该项为「已修复」或「用户保留」

**预期修复项清单**（按优先级排序，逐项 QA）：

| # | 优先级 | 类型 | 文件 | 描述 | QA 问题预案 |
|---|--------|------|------|------|-------------|
| F1 | 高 | 静默失败 | `tailwind.config.js` 或 `InvestPage.tsx` | `bg-ink-50` 未定义 → 补 token `ink-50: #fafafa` 或移除引用 | 「补 token 还是移除引用？」 |
| F2 | 高 | 页内偏差 | `CareersPage.tsx` §5 | inline h2 → 共享 SectionTitle + TitleUnderline | 「是否将 §5 标题改为与 §1–§4 一致？」 |
| F3 | 中 | 页内偏差 | `ProductPage.tsx` §3 | inline paddingTop:20px → py-[60px] | 「§3 顶部 20px 是否为视觉节奏设计？改回 py-[60px]？」 |
| F4 | 中 | 页内偏差 | `WearablePage.tsx` §3 | 同 F3 | 同 F3 |
| F5 | 中 | 页内偏差 | `AboutPage.tsx` §3.5 | 移除 redundant `max-w-[1000px] mx-auto` 嵌套 | 「§3.5 内层 max-w-[1000px] 是否保留？」（注意：项目记忆显示用户 2026-07-25 主动设置此值对齐左侧副标题，可能需保留） |
| F6 | 中 | 设计意图确认 | `ProductPage.tsx` §2 / `WearablePage.tsx` §2 | 28px 绿色 slogan 是否改为共享 SectionTitle | 「§2 是 hero slogan 还是 section title？保留还是统一？」 |
| F7 | 中 | 设计意图确认 | `AboutPage.tsx` | 左对齐 20px 副标是否改为居中 SectionTitle 风格 | 「左对齐副标是设计意图吗？」 |
| F8 | 低 | 死代码 | `src/components/layout/PageHero.tsx` | 删除（0 引用） | 「删除 PageHero 还是保留备后用？」 |
| F9 | 低 | 死代码 | `src/components/home/HomeVideoHero.tsx` | 删除 | 同 F8 |
| F10 | 低 | 死代码 | `src/components/home/` 13 个未使用组件 | 删除 / 保留 / 部分删 | 「13 个未使用 home 组件如何处理？」 |
| F11 | 低 | Barrel | `src/components/layout/index.ts` | 添加 `ProductCarouselHero` 导出，子页改用 barrel 导入 | 「是否统一 barrel 导入？」 |
| F12 | 低 | CSS 清理 | `src/index.css` | 移除未使用的 `.section-title` / `.section-subtitle`，或对齐到组件实际 typography | 「删除还是对齐？」 |
| F13 | 低 | 未定义 class | `NewsDetailPage.tsx` L227 | 移除 `prose-content` 引用或补 CSS 定义 | 「移除还是补 CSS？」 |
| F14 | 低 | InvestPage 本地 SectionTitle | `InvestPage.tsx` | 若 Stage B 确认页内 6 个 section 全部使用本地组件 → 非偏差，保留；若有混用 → 统一 | 待 Stage B 复核 |

---

### Stage D：验证

**每项修复后**：
1. `npx tsc --noEmit` 通过
2. 浏览器访问修复页面对应路由，强制刷新（Ctrl+Shift+R）验证视觉无回归
3. 在对话中标记该项状态（已修复 / 用户保留 / 改方案）

**全部完成后**：
4. 重新跑一次 Stage B 细审，确认所有「待修复」项已清零或已标记「用户保留」
5. 在对话中输出最终汇总（每页修复前/后对比 + 保留项说明）
6. DEV_LOG.md 追加一条本次审计 + 修复的总结条目

---

## 假设与约束 (Assumptions & Decisions)

1. **审计维度**：仅 within-page（页内模块间一致性），不做跨页统一。即使 NewsListPage 用 `py-[40px]` 而其他页用 `py-[60px]`，只要 NewsListPage 内部各 section 都用 `py-[40px]`，视为一致。
2. **不修复项**：视觉风格争议（hover 阴影 / 圆形头像 / SVG 圆角）不在本次范围，且从项目记忆中移除对应规则。
3. **QA 强制**：每项修复前必须 QA 用户确认。用户回答「不确定 / 看代码」时，提供更详细分析后再问。
4. **死代码清理**：G4/G5/G6 待 QA 一次性确认处理策略（全删 / 保留 / 部分删）。
5. **「设计意图」偏差**：D3/D5（28px 绿色 slogan）、D1（左对齐副标）默认假定为设计意图，仅在 QA 用户明确表示「这是偏差」时才修复。
6. **记忆更新**：仅移除「风格定位: 朴素 - 无圆角 / 无阴影 / 无渐变」一条；其余设计风格条目（主色 / 字体 / 设计宽度）保留。
7. **审计文档**：不创建独立审计 .md 文件（遵循「不主动创建文档」原则），审计清单在对话中呈现。
8. **执行顺序**：Stage A → Stage B（逐页）→ Stage C（逐项 QA + 修复）→ Stage D（验证）。Stage A 与 Stage B 可并行。

---

## 验证步骤 (Verification Steps)

1. **Stage A 验证**：读取更新后的 `project_memory.md`，确认「风格定位」一条已移除，其余条目保留。
2. **Stage B 验证**：审计清单覆盖 11 个页面中的 9 个（排除 2 个单模块页），每页至少 6 个维度全覆盖。
3. **Stage C 验证**：
   - 每项修复后 `npx tsc --noEmit` 通过
   - 每项修复后浏览器视觉验证（强制刷新）
   - 每项修复前有 QA 记录（用户回答可追溯）
4. **Stage D 验证**：
   - 重审时所有「待修复」项已清零或标记「用户保留」
   - DEV_LOG.md 已追加本次审计总结条目
   - 最终汇总在对话中呈现给用户

---

## 关键文件路径速查

**页面文件**（`d:\VibeTest\bigsound\src\pages\`）：
- HomePage.tsx / AboutPage.tsx / ProductPage.tsx / WearablePage.tsx / InvestPage.tsx / CareersPage.tsx / NewsListPage.tsx / NewsDetailPage.tsx / LoginPage.tsx / RegisterPage.tsx / NotFoundPage.tsx

**共享组件**（`d:\VibeTest\bigsound\src\components\`）：
- `ui/SectionTitle.tsx` / `ui/SubSectionTitle.tsx` / `ui/Reveal.tsx`
- `layout/Layout.tsx` / `layout/Header.tsx` / `layout/Footer.tsx` / `layout/PageHero.tsx`（死代码）/ `layout/ProductCarouselHero.tsx` / `layout/FloatingTools.tsx` / `layout/index.ts`
- `home/VideoEntry.tsx` / `home/HeroProducts.tsx` / `home/HomeVideoHero.tsx`（死代码）/ 其余 13 个未使用组件

**全局配置**：
- `d:\VibeTest\bigsound\tailwind.config.js`（token 定义）
- `d:\VibeTest\bigsound\src\index.css`（全局 CSS / 容器规范）

**项目记忆**：
- `c:\Users\15927\.trae-cn\memory\projects\-d-VibeTest-bigsound\project_memory.md`

**开发日志**：
- `d:\VibeTest\bigsound\DEV_LOG.md`

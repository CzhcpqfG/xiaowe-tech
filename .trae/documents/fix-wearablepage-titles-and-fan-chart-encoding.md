# 修复计划: WearablePage 标题显示 + 扇形图 i18n 编码 + 底部模块卡片高度

## 摘要

本次修复 3 个问题:
1. **WearablePage categorySlogan 双行标语显示不全** — 英文版本比中文长 4 倍, 需调查根因并修复
2. **ProductPage 扇形图 i18n 编码 Bug** — `coreTech.fanChart.sectors.3.suffixcoreTech.fanChart.sectors.3.sub` 原始 key 字符串泄漏到页面上
3. **WearablePage 底部两个模块 (watchTech + earphoneTech) 卡片高度不齐** — 同行卡片因文本量不同导致高度不一, 视觉不对齐

修复策略: 优先用 CSS 修复, 必要时辅以翻译精简。所有修改不影响中文页面美观和移动端布局。

---

## Current State Analysis (现状分析)

### 问题 1: categorySlogan 显示不全

**渲染位置**: `src/pages/WearablePage.tsx` 第 192-203 行

```jsx
<section className="bg-white">
  <div className="container-page py-[40px] lg:py-[60px] text-center">
    <Reveal>
      <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px]">
        {t(WEARABLE_PAGE.categorySloganKeys[0])}
      </p>
      <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px] mt-[6px]">
        {t(WEARABLE_PAGE.categorySloganKeys[1])}
      </p>
    </Reveal>
  </div>
</section>
```

**i18n 文案对比** (`src/i18n/locales/{en,zh-CN}/wearable.json` 第 11-14 行):

| Locale | categorySlogan[0] | categorySlogan[1] | 字符数 |
|--------|-------------------|-------------------|--------|
| zh-CN | 全产品线覆盖 | 全场景响应需求 | 6 / 7 |
| en | Full Product Line Coverage | All-Scenario Demand Response | 26 / 28 |

**根因分析**:
- 英文文本长度是中文的 ~4 倍
- 桌面端 lg:text-[28px] font-bold 下, "All-Scenario Demand Response" 估算宽度约 476px (28 字符 × 17px/字符), 在 1200px container-page 内可容纳
- **但移动端 (text-[22px]) 在 375px 视口下**, 可用宽度约 343px (375 - 32 padding), 英文文本会换行成 2-3 行, 视觉上显得"显示不全"或"凌乱"
- 中文版本在所有视口下都稳定显示为 2 行 (每行一条 slogan), 英文版本可能变成 4-6 行
- 此外, `transform: scale()` 缩放系统在视口 < 1200px 时会整体缩小页面, 进一步影响视觉密度

**修复方案**: 精简英文翻译 + 添加 `whitespace-nowrap` 保证桌面端不换行

### 问题 2: 扇形图 i18n 编码 Bug

**渲染位置**: `src/pages/ProductPage.tsx` 第 1210-1264 行 (ChineseTechFanChart 组件)

**关键代码** (第 1213-1221 行):
```tsx
const prefix = t(`${sector.i18nPrefix}.prefix`);
const highlight = t(`${sector.i18nPrefix}.highlight`);
const sub = t(`${sector.i18nPrefix}.sub`);
const connector = t(`${sector.i18nPrefix}.connector`);
const suffix = t(`${sector.i18nPrefix}.suffix`);

// 当 connector/suffix 不存在时, i18next 会返回 key 字符串本身; 这里用 fallback 判断
const hasConnector = connector && !connector.startsWith(`${sector.i18nPrefix}.`);
const hasSuffix = suffix && !suffix.startsWith(`${sector.i18nPrefix}.`);
const hasLongLine = !!hasSuffix;
```

**i18nPrefix 值** (`src/data/product.ts` 第 169-212 行):
- Sector 0-4 的 `i18nPrefix` 均包含 `product:` 命名空间前缀
- 例如 Sector 3: `"product:coreTech.fanChart.sectors.3"`

**根因分析**:
1. 当 `t("product:coreTech.fanChart.sectors.3.suffix")` 调用时, 若 key 缺失, i18next 默认返回 **不含命名空间前缀** 的 key 字符串: `"coreTech.fanChart.sectors.3.suffix"`
2. 但 fallback 检查 `suffix.startsWith("product:coreTech.fanChart.sectors.3.")` 用的字符串 **包含** 命名空间前缀
3. 所以 `startsWith` 永远返回 `false`, `hasSuffix = !false = true`, 原始 key 字符串被渲染到页面上
4. 同样的 Bug 影响 `hasConnector` 和 `sub` 的条件渲染
5. 受影响的 sector:
   - **Sector 3** (zh-CN 和 en 都缺 `sub` 和 `suffix`): 渲染了 `coreTech.fanChart.sectors.3.suffix` 和 `coreTech.fanChart.sectors.3.sub`
   - **Sector 4** (zh-CN 和 en 都缺 `sub` 和 `connector`): 同样会渲染原始 key

**i18n 配置确认** (`src/i18n/index.ts` 第 105-127 行): 未设置 `appendNamespaceToMissingKey: true`, 所以缺失 key 返回值不含命名空间。

**修复方案**: 改用 `i18n.exists()` API 准确判断 key 是否存在, 替代脆弱的 `startsWith` 字符串比较

### 问题 3: 底部两个模块卡片高度不齐

**渲染位置**: `src/pages/WearablePage.tsx`

**Section 4 (watchTech) grid** (第 271 行):
```jsx
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px]">
  {WEARABLE_PAGE.watchTech.items.map((tech, idx) => (
    <Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60}>
      <TechCard ... />
    </Reveal>
  ))}
</div>
```

**Section 5 (earphoneTech) grid** (第 300 行): 同上结构

**TechCard 外层 div** (第 122 行):
```jsx
<div className="group bg-white border border-ink-200 flex flex-col transition-all ...">
```

**根因分析** (对比 Section 3 产品卡 第 241 行, 该 grid 是齐的):
| 元素 | Section 3 (产品卡, 齐) | Section 4/5 (技术卡, 不齐) |
|------|------------------------|----------------------------|
| Grid 容器 | `grid grid-cols-... auto-rows-fr` | `grid grid-cols-...` (缺 auto-rows-fr) |
| Reveal 包裹器 | `<Reveal className="h-full">` | `<Reveal>` (缺 h-full) |
| 卡片外层 | `<div className="... flex flex-col h-full">` | `<div className="... flex flex-col">` (缺 h-full) |

三处缺一都会导致同行卡片高度独立, 取决于各自内容 (desc 文本量不同), 视觉上不对齐。

**修复方案**: 给 Section 4 和 Section 5 的 grid + Reveal + TechCard 都补上对应类 (与 Section 3 保持一致)

---

## Proposed Changes (具体修改)

### Fix 1: categorySlogan 显示修复

**文件**: `src/i18n/locales/en/wearable.json` (第 11-14 行)

**修改**: 精简英文翻译, 使其更接近中文版本的双行短句节奏

```json
"categorySlogan": [
  "Full Product Line Coverage",
  "All-Scenario Demand Response"
],
```

改为:

```json
"categorySlogan": [
  "Full-Line Coverage",
  "All-Scenario Response"
],
```

**理由**:
- "Full Product Line Coverage" → "Full-Line Coverage": 去掉冗余的 "Product", 保留核心含义
- "All-Scenario Demand Response" → "All-Scenario Response": 去掉 "Demand", 保留核心含义
- 字符数: 26→19, 28→21, 减少约 27%, 移动端不再换行
- 与中文 "全产品线覆盖" / "全场景响应需求" 长度比例更接近

**文件**: `src/pages/WearablePage.tsx` (第 195, 198 行)

**修改**: 添加 `whitespace-nowrap` 防止桌面端意外换行

```jsx
<p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px] whitespace-nowrap">
  {t(WEARABLE_PAGE.categorySloganKeys[0])}
</p>
<p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px] mt-[6px] whitespace-nowrap">
  {t(WEARABLE_PAGE.categorySloganKeys[1])}
</p>
```

**理由**:
- 桌面端 1200px 容器下, 精简后的英文 (19/21 字符) 在 lg:text-[28px] 下宽度约 323/357px, 远小于 1200px, 不会溢出
- 移动端 375px 视口下, 精简后英文 (19/21 字符) 在 text-[22px] 下宽度约 266/294px, 小于 343px 可用宽度, 不会溢出
- `whitespace-nowrap` 确保 slogan 强制单行显示, 视觉与中文版一致
- 中文版本身字符数少, `whitespace-nowrap` 不影响其中文显示

### Fix 2: 扇形图 i18n 编码 Bug 修复

**文件**: `src/pages/ProductPage.tsx` (第 1213-1264 行附近, ChineseTechFanChart 组件)

**修改 1**: 引入 `i18n.exists` API

在第 1210 行附近 (sector 渲染循环开始处), 修改 `useTranslation` 解构:

```tsx
// 原代码 (假设):
const { t } = useTranslation("product");
// 改为:
const { t, i18n } = useTranslation("product");
```

注: 需先确认 ChineseTechFanChart 组件顶部 `useTranslation` 的位置, 在 Phase 4 实施时定位。

**修改 2**: 替换 fallback 检查逻辑 (第 1219-1221 行)

```tsx
// 原代码:
const hasConnector = connector && !connector.startsWith(`${sector.i18nPrefix}.`);
const hasSuffix = suffix && !suffix.startsWith(`${sector.i18nPrefix}.`);
const hasLongLine = !!hasSuffix;

// 改为:
const hasConnector = i18n.exists(`${sector.i18nPrefix}.connector`);
const hasSuffix = i18n.exists(`${sector.i18nPrefix}.suffix`);
const hasLongLine = hasSuffix;
```

**修改 3**: 替换 sub 的条件渲染 (第 1257 行)

```tsx
// 原代码:
{sub && !sub.startsWith(`${sector.i18nPrefix}.`) && (
  <div className="text-[13px] text-ink-500 leading-[20px] whitespace-normal">
    {sub}
  </div>
)}

// 改为:
{i18n.exists(`${sector.i18nPrefix}.sub`) && (
  <div className="text-[13px] text-ink-500 leading-[20px] whitespace-normal">
    {sub}
  </div>
)}
```

**修改 4**: 同步修复绿色扇区标签的 fallback 逻辑

绿色扇区使用 `data.centerSubKey` 和 `data.centerHintKey` (第 1234-1235 行附近), 这些 key 在 zh-CN 和 en 中都存在, 但为了一致性和健壮性, 也用 `i18n.exists` 包裹。若确认这两个 key 在所有 locale 中都存在, 可不动。

**理由**:
- `i18n.exists()` 是 i18next 官方 API, 准确判断 key 是否存在, 不依赖字符串比较
- 不需要处理命名空间前缀的复杂性
- 修复后 sector 3 不再渲染 `coreTech.fanChart.sectors.3.suffix` 和 `coreTech.fanChart.sectors.3.sub` 原始 key
- 修复后 sector 4 也不再渲染 `coreTech.fanChart.sectors.4.sub` 和 `coreTech.fanChart.sectors.4.connector` 原始 key
- 中英文版本同时受益 (因为 zh-CN 也存在相同的缺失 key 问题, 只是用户在英文版更明显看到)

### Fix 3: 底部两个模块卡片同行等高

**文件**: `src/pages/WearablePage.tsx`

**修改 1**: Section 4 grid 添加 `auto-rows-fr` (第 271 行)

```jsx
// 原代码:
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px]">

// 改为:
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px] auto-rows-fr">
```

**修改 2**: Section 4 Reveal 添加 `h-full` (第 273 行)

```jsx
// 原代码:
<Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60}>

// 改为:
<Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60} className="h-full">
```

**修改 3**: Section 5 grid 添加 `auto-rows-fr` (第 300 行)

```jsx
// 原代码:
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px]">

// 改为:
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px] auto-rows-fr">
```

**修改 4**: Section 5 Reveal 添加 `h-full` (第 302 行)

```jsx
// 原代码:
<Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60}>

// 改为:
<Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60} className="h-full">
```

**修改 5**: TechCard 外层 div 添加 `h-full` (第 122 行)

```jsx
// 原代码:
<div className="group bg-white border border-ink-200 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]">

// 改为:
<div className="group bg-white border border-ink-200 flex flex-col h-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]">
```

**理由**:
- `auto-rows-fr`: 让同一行内所有 grid 单元格的高度等于该行最高单元格的高度 (CSS Grid 标准 equal-height 行为)
- Reveal `h-full`: 让 Reveal 包裹器撑满 grid 单元格高度
- TechCard `h-full`: 让卡片本身撑满 Reveal 高度
- 三者结合, 同行卡片高度完全对齐
- 不影响中文布局 (中文卡片本来内容相近, 等高后视觉差异极小)
- 不影响移动端布局 (移动端 grid 是 2 列, 同行 2 卡片也会等高)
- 不使用固定高度, 避免长文本被截断

---

## Assumptions & Decisions (假设与决策)

### 假设
1. 用户报告的 categorySlogan "显示不全" 是指英文文本在移动端换行成多行, 与中文双行布局不一致
2. 用户希望英文版也保持双行布局 (每行一条 slogan)
3. 用户接受英文翻译适度精简, 以保持视觉一致性
4. 扇形图 sector 3 和 sector 4 在 zh-CN 和 en 中确实缺 sub/suffix/connector key (不需要补充, 因为原本设计就是部分 sector 没有这些字段)
5. 底部两个模块的卡片高度问题仅限 WearablePage, 不扩展到其他页面 (用户已确认)

### 决策
1. **categorySlogan 修复**: 翻译精简 + `whitespace-nowrap` 双管齐下, 比单纯改 CSS 更稳妥
2. **i18n fallback 修复**: 用 `i18n.exists()` 替代 `startsWith` 字符串比较, 更健壮且语义清晰
3. **卡片高度修复**: 用 `auto-rows-fr + h-full` 同行等高, 而非固定高度, 避免文本截断风险
4. **不补充缺失的 i18n key**: sector 3/4 缺 sub/suffix/connector 是设计意图 (不同 sector 显示不同字段组合), 修复 fallback 逻辑即可, 不需要在 i18n 文件中补全
5. **不修改 zh-CN 翻译**: categorySlogan 中文版本不变, 只改英文

---

## Verification (验证步骤)

### 1. 编译验证
```bash
npx tsc --noEmit
npx vite build
```
两者均需通过, 无 TypeScript 错误。

### 2. 功能验证 — categorySlogan
- 访问 `/zh-CN/wearable` — 双行绿色标语显示 "全产品线覆盖" / "全场景响应需求", 单行无换行
- 访问 `/zh-TW/wearable` — 同上, 繁体版本
- 访问 `/en/wearable` — 双行绿色标语显示 "Full-Line Coverage" / "All-Scenario Response", 单行无换行
- 移动端 (375px viewport) 测试 — 三种语言都是双行布局, 无意外换行

### 3. 功能验证 — 扇形图 i18n
- 访问 `/zh-CN/product` — 滚动到扇形图 section, 检查 5 个黑色扇区 + 1 个绿色扇区
  - Sector 3 (右下, "不只言语沟通 / 突破 / 多元化场景") 不应出现 `coreTech.fanChart.sectors.3.suffix` 或 `.sub` 字样
  - Sector 4 (左下, "不仅传统形态 / 多样化 / 产品形态") 不应出现 `coreTech.fanChart.sectors.4.sub` 或 `.connector` 字样
- 访问 `/en/product` — 同上验证, 英文版本不应有原始 key 字符串
- 访问 `/zh-TW/product` — 同上验证

### 4. 功能验证 — 卡片同行等高
- 访问 `/zh-CN/wearable` — 滚动到 "健康智能手表核心技术" section
  - 桌面端 5 列布局: 同行 5 张卡片高度完全对齐
  - 平板端 3 列布局: 同行 3 张卡片高度对齐
  - 移动端 2 列布局: 同行 2 张卡片高度对齐
- 同样验证 "智能蓝牙耳机核心技术" section
- 切换到 `/en/wearable` — 英文版本同样同行等高, 即使 desc 文本更长
- 检查中文版本卡片高度无视觉变化 (本来内容相近, 等高后差异极小)

### 5. 回归验证
- 检查 ProductPage 其他 section (产品卡, 流程图, 售后保修) 无视觉变化
- 检查 WearablePage 其他 section (产品卡, Tab 按钮) 无视觉变化
- 移动端布局无破坏 (所有修改仅影响桌面端英文版的特定区域)

---

## 影响范围

### 文件修改清单
1. `src/i18n/locales/en/wearable.json` — categorySlogan 翻译精简 (2 行)
2. `src/pages/WearablePage.tsx` — 添加 whitespace-nowrap (2 处) + 卡片等高修复 (5 处)
3. `src/pages/ProductPage.tsx` — 扇形图 i18n fallback 修复 (3 处 + useTranslation 解构)

### 不变的部分
- 中文翻译文件 (zh-CN, zh-TW) 不变
- 其他页面 (ProductPage 流程图/产品卡, InvestPage, CareersPage, AboutPage) 不变
- 移动端响应式布局策略不变
- Layout 的 scale 缩放系统不变

---

## 实施顺序

1. **Fix 2 (扇形图 i18n)** — 最直接的 Bug 修复, 不影响其他模块
2. **Fix 3 (卡片等高)** — 纯 CSS 修改, 风险低
3. **Fix 1 (categorySlogan)** — 翻译 + CSS 双重修改, 最后做
4. 编译验证 (tsc + vite build)
5. 浏览器三语言验证 (zh-CN / zh-TW / en)
6. 更新 DEV_LOG.md

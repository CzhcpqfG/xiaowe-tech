# ProductPage / WearablePage 卡片一致性与移动端适配修复

## 摘要

针对 `/product` 和 `/wearable` 两个页面的产品卡片模块，修复两个问题：

1. **卡片信息量不一致导致卡片大小不同** — 同一行卡片高度不齐，视觉节奏混乱。
2. **移动端不同比例下图片容器比例改变，图片只显示一部分，容器内有空白** — 桌面端正常，移动端出现明显空白。

采用 CSS 视觉统一方案（不改动数据结构），结合 `aspect-square` 1:1 图片容器策略，最小改动覆盖两个页面。

---

## 当前状态分析

### 文件清单

| 文件 | 路径 | 角色 |
|------|------|------|
| ProductPage | `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` | 12 款助听器卡片，内联 JSX（L113-L174） |
| WearablePage | `d:\VibeTest\bigsound\src\pages\WearablePage.tsx` | 11 款穿戴卡片，已抽 `ProductCard` 组件（L41-L103） |
| 产品数据 | `d:\VibeTest\bigsound\src\data\product.ts` | `ProductItem`，6 项 features，price 为 string（含 "待定"/复合价） |
| 穿戴数据 | `d:\VibeTest\bigsound\src\data\wearable.ts` | `WearableProduct`，4 项 features + colors 字段，price 为 number |
| 产品图 | `public/images/products/*.png` | 9 张全部 800×800（1:1 正方形） |
| 穿戴图 | `public/images/wearable/*.png` | 10 张 800×800 + 1 张 790×524（`kids_t10.png`，1.51 横图） |
| Reveal 组件 | `d:\VibeTest\bigsound\src\components\ui\Reveal.tsx` | 滚动入场动画，渲染 `<div>` 并透传 `className`/`style` |

### 问题 1 根因：卡片高度不齐

两个页面卡片当前结构（高度计算示意，以 ProductPage 为例）：

```
卡片 minHeight: 440px (inline style)
├── 图片区: style={{ height: "240px" }}  ← 固定 240px
└── 信息区: flex-1 p-5 flex flex-col     ← 至少 ~280px (form+model+price+6 features)
    ├── form tag: ~36px
    ├── model h3: ~32px
    ├── price block: ~67px (含 border-b)
    └── ul.space-y-2.flex-1: 6 features × (18px行高 + 8px间距) ≈ 148px
```

理论最小高度 = 240 + 40(padding) + 36 + 32 + 67 + 148 = **563px**，已超过 `minHeight: 440px`。

**问题表现**：因 features 的 `label`/`desc` 长度不一（如 "AI 算力超 15 亿次/秒乘累加运算" 会换行变 2 行，而 "5 核异构 12nm 全数字处理器" 也换行），单条 feature 高度可能从 18px 涨到 36px，导致同一行 4 张卡片高度差 30-60px。

WearablePage 还有 colors 字段（"曜石黑" vs "黑色、白色、蓝色、粉色、紫色"），但 colors 单行不会换行，影响较小。

### 问题 2 根因：移动端图片容器比例失调

图片容器当前样式（两页一致，L48-L51 / L120-L122）：

```jsx
<div
  className="w-full bg-ink-100 flex items-center justify-center overflow-hidden"
  style={{ height: "240px" }}
>
  <img className="max-w-full max-h-full object-contain ..." />
</div>
```

**根因**：容器 `w-full` × `height: 240px`，宽高比随断点变化：

| 断点 | 网格列数 | 卡片宽（约） | 容器宽×高 | 容器比例 |
|------|---------|------------|----------|---------|
| mobile (<640px) | 1 列 | ~343px | 343×240 | **1.43**（宽长方形） |
| sm (≥640px) | 2 列 | ~376px | 376×240 | **1.57**（更宽） |
| lg (≥1024px) | 4 列 | ~288px | 288×240 | 1.20（接近正方） |

产品图为 1:1 正方形，`object-contain` 会把图片缩到容器较短边（高度 240px），导致宽度只剩 240px，左右各留 ~50px 空白（mobile）或 ~68px 空白（sm）。

桌面端因容器比例 1.20 接近 1:1，空白不明显；移动端容器比例 1.43/1.57 严重失调，空白占比 30%-40%。

### 数据层已知问题（本次不修复，仅记录）

- `ProductItem.price: string` vs `WearableProduct.price: number`，且 ProductPage 有 `"待定"` / `"Pro 12999 / Max 15999"` 复合字符串
- WearablePage 多一个 `colors` 字段，ProductPage 无
- `kids_t10.png` 是 790×524 横图，与其他 10 张 1:1 不一致
- `wearableKidsZ1` 引用 `kids_z1.png`，文件存在（已确认）
- ProductPage 用 `alt={product.model}`，WearablePage 用 `alt={product.alt}`
- ProductPage `<img loading="lazy">`，WearablePage 无

这些差异属于数据层 / 长期重构范畴，本次仅做 CSS 视觉统一。

---

## 提议改动

### 改动 1：图片容器改用 `aspect-square`（修复问题 2）

**目标**：让图片容器在所有断点下保持 1:1 正方形，匹配 1:1 产品图，消除空白。

#### ProductPage.tsx L120-L130

```jsx
// 改动前
<div
  className="w-full bg-ink-100 flex items-center justify-center overflow-hidden"
  style={{ height: "240px" }}
>
  <img
    src={IMAGES[product.imageKey]}
    alt={product.model}
    className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
    loading="lazy"
  />
</div>

// 改动后
<div className="w-full aspect-square bg-ink-100 flex items-center justify-center overflow-hidden">
  <img
    src={IMAGES[product.imageKey]}
    alt={product.model}
    className="w-full h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
    loading="lazy"
  />
</div>
```

**变更点**：
- 容器：删除 `style={{ height: "240px" }}`，新增 `aspect-square` 类
- 图片：`max-w-full max-h-full` → `w-full h-full`（与 `aspect-square` 配合，让图片填满容器；`object-contain` 仍保证不裁剪）

#### WearablePage.tsx L48-L57（ProductCard 组件内）

同样改动：

```jsx
// 改动前
<div
  className="w-full bg-ink-100 flex items-center justify-center overflow-hidden"
  style={{ height: "240px" }}
>
  <img
    src={IMAGES[product.imageKey]}
    alt={product.alt}
    className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
  />
</div>

// 改动后
<div className="w-full aspect-square bg-ink-100 flex items-center justify-center overflow-hidden">
  <img
    src={IMAGES[product.imageKey]}
    alt={product.alt}
    className="w-full h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
  />
</div>
```

### 改动 2：网格 + 卡片高度对齐（修复问题 1）

**目标**：同一行内所有卡片高度自动对齐到该行最高卡片，消除高度差。

#### ProductPage.tsx L111 网格容器

```jsx
// 改动前
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">

// 改动后
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] auto-rows-fr">
```

#### ProductPage.tsx L113 Reveal 包装器

```jsx
// 改动前
<Reveal key={`${product.model}-${idx}`} variant="scale-up" delay={(idx % 4) * 80}>

// 改动后
<Reveal key={`${product.model}-${idx}`} variant="scale-up" delay={(idx % 4) * 80} className="h-full">
```

#### ProductPage.tsx L114-L116 卡片根 div

```jsx
// 改动前
<div
  className="group bg-white border border-ink-200 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]"
  style={{ minHeight: "440px" }}
>

// 改动后
<div
  className="group bg-white border border-ink-200 flex flex-col h-full min-h-[440px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]"
>
```

**变更点**：
- 删除 `style={{ minHeight: "440px" }}`，改为 Tailwind `min-h-[440px]`
- 新增 `h-full`，让卡片填满 Reveal 包装器（从而填满 grid 行高）

#### WearablePage.tsx L231 网格容器

```jsx
// 改动前
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px]">

// 改动后
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] auto-rows-fr">
```

#### WearablePage.tsx L232-L234 Reveal 包装器

```jsx
// 改动前
<Reveal key={`${product.model}-${idx}`} variant="scale-up" delay={(idx % 4) * 80}>
  <ProductCard product={product} />
</Reveal>

// 改动后
<Reveal key={`${product.model}-${idx}`} variant="scale-up" delay={(idx % 4) * 80} className="h-full">
  <ProductCard product={product} />
</Reveal>
```

#### WearablePage.tsx L43-L46 ProductCard 根 div

```jsx
// 改动前
<div
  className="group bg-white border border-ink-200 flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]"
  style={{ minHeight: "440px" }}
>

// 改动后
<div
  className="group bg-white border border-ink-200 flex flex-col h-full min-h-[440px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]"
>
```

### 改动 3：Reveal 组件确认（无需修改）

已确认 `d:\VibeTest\bigsound\src\components\ui\Reveal.tsx` L160 透传 `className`：

```jsx
<Tag ref={ref} className={`${baseClass} ${className}`} style={mergedStyle}>
  {children}
</Tag>
```

传入 `className="h-full"` 会附加到 Reveal 根 div，从而让 grid `auto-rows-fr` 拉伸 Reveal 后，内部卡片 `h-full` 能填满 Reveal。**Reveal 组件无需改动**。

### 改动汇总表

| 文件 | 行号 | 改动类型 | 内容 |
|------|------|---------|------|
| ProductPage.tsx | L111 | 网格 | 新增 `auto-rows-fr` |
| ProductPage.tsx | L113 | Reveal | 新增 `className="h-full"` |
| ProductPage.tsx | L114-L116 | 卡片根 div | `style={{ minHeight: "440px" }}` → `h-full min-h-[440px]` |
| ProductPage.tsx | L120-L130 | 图片容器+img | `style={{ height: "240px" }}` → `aspect-square`；img `max-w-full max-h-full` → `w-full h-full` |
| WearablePage.tsx | L231 | 网格 | 新增 `auto-rows-fr` |
| WearablePage.tsx | L232-L234 | Reveal | 新增 `className="h-full"` |
| WearablePage.tsx | L43-L46 | ProductCard 根 div | `style={{ minHeight: "440px" }}` → `h-full min-h-[440px]` |
| WearablePage.tsx | L48-L57 | 图片容器+img | `style={{ height: "240px" }}` → `aspect-square`；img `max-w-full max-h-full` → `w-full h-full` |

---

## 假设与决策

### 假设

1. 产品图为 1:1 正方形（已通过 PowerShell 检查 9 张产品图 + 10 张穿戴图确认，仅 `kids_t10.png` 例外）。
2. Reveal 组件透传 `className` 的行为稳定（L160 已验证）。
3. `auto-rows-fr` 是 Tailwind v3+ 支持的标准类（项目已用 Tailwind，可假定支持）。
4. 当前 `minHeight: 440px` 是合理的卡片高度下限（自然高度 ~563px，下限 440px 防止内容稀疏时过矮）。

### 决策

1. **不改数据结构**：用户选择「CSS 视觉统一」，保留 `ProductItem` / `WearableProduct` 现有字段差异（price 类型、colors 字段、features 条数）。
2. **不抽共享组件**：本次仅做 CSS 修复，不重构为共享 `ProductCard`。两页独立改动但改动内容一致，便于未来抽取。
3. **保留 `object-contain`**：避免裁剪产品图（裁剪对电商产品图不友好）。`aspect-square` + `object-contain` 组合在 1:1 图上完美填充，无空白。
4. **保留 `min-h-[440px]`**：作为卡片高度下限，防止极端情况（如 features 极短）卡片过矮。
5. **不处理 `kids_t10.png` 横图**：该图 1.51 比例放在 `aspect-square` 容器中会有上下留白（约 17% 上下各），属于已知小瑕疵。建议后续单独重生该图为 1:1（不在本次范围内）。

### 不做的事

- ❌ 不修改 `product.ts` / `wearable.ts` 数据
- ❌ 不抽取共享 `ProductCard` 组件
- ❌ 不统一 `price` 字段类型
- ❌ 不重生 `kids_t10.png`
- ❌ 不修改 Reveal 组件
- ❌ 不修改 `TAB_ACTIVE` / `TAB_INACTIVE` 常量
- ❌ 不修改其他 section（如 WearablePage 的 TechCard）

---

## 已知限制 / 边缘情况

### 1. `kids_t10.png` 上下留白

- 该图为 790×524（1.51 横图），放在 `aspect-square` 容器 + `object-contain` 下，会按宽度填充，上下各留约 17% 空白。
- 影响范围：WearablePage 儿童手表 Tab 下的 T10 卡片（1/11）。
- 后续修复建议：用 PIL 裁剪为 800×800（居中裁剪）或重新生成 1:1 主图。

### 2. 不同行卡片高度仍可能不同

- `auto-rows-fr` 只对齐同一行内的卡片高度，不同行仍可能不同。
- 例如行 1 最高卡片 580px，行 2 最高卡片 540px，则行 1 全部 580px、行 2 全部 540px。
- 这是合理的视觉行为（每行内部对齐），与 Apple/华为官网做法一致。
- 若需全网格等高，需用 `grid-rows-3`（12 项 / 4 列 = 3 行）+ 固定行高，但风险是内容溢出。**不推荐**。

### 3. 卡片信息量差异仍然存在

- ProductPage 6 features，WearablePage 4 features + colors。
- CSS 修复后视觉上对齐，但信息密度差异仍在。
- 用户已确认接受（选择「CSS 视觉统一」），未来若需统一信息量再单独处理。

### 4. 移动端 1 列时图片变大

- mobile 下卡片宽 ~343px，`aspect-square` 让图片区也是 343×343（原 343×240）。
- 图片视觉变大 ~43%，可能让卡片整体变长。
- 这是 trade-off：消除空白的代价是图片更大。一般电商移动端用大图更利于看清楚产品，可接受。

---

## 验证步骤

### 1. TypeScript 编译检查

```bash
npx tsc --noEmit
```

预期：无错误。

### 2. 启动开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173/product` 和 `http://localhost:5173/wearable`。

### 3. 桌面端验证（≥1024px）

- [ ] 4 列卡片网格，每行 4 张卡片高度一致（用 DevTools 量取，应相同）
- [ ] 图片容器为正方形（宽=高），无空白
- [ ] Hover 卡片：上浮 6px + 边框变绿 + 阴影 + 图片轻微放大（与原行为一致）
- [ ] 切换 Tab（耳背式/耳内式/颈挂式/骨导式）后，新一行卡片仍高度对齐

### 4. 平板验证（≥640px，<1024px）

- DevTools 切换到 iPad Mini（768px）或类似
- [ ] 2 列卡片网格，每行 2 张卡片高度一致
- [ ] 图片容器为正方形，无空白（原此处空白最严重，1.57 比例）

### 5. 移动端验证（<640px）

- DevTools 切换到 iPhone 12（390px）或类似
- [ ] 1 列卡片，每张卡片图片区为正方形（~343×343），无左右空白
- [ ] 卡片高度自然，不被强行拉长
- [ ] 横向滚动 Tab 仍正常工作

### 6. 边缘案例验证

- [ ] ProductPage 切换到「骨导式」Tab（5 张卡片均用 `productRicRender` 占位图），图片应正常显示无空白
- [ ] WearablePage 切换到「儿童手表」Tab，T10 卡片图片有上下留白（已知小瑕疵，1.51 横图所致），T9/Z1 正常
- [ ] WearablePage「全部」Tab 下 11 张卡片混合显示，每行高度对齐

### 7. 视觉对比

- 改动前后截图对比 4 个断点：1440px / 1024px / 768px / 390px
- 确认无回归（其他 section 不受影响）

### 8. DEV_LOG 更新

- 在 `d:\VibeTest\bigsound\DEV_LOG.md` 顶部新增条目，记录本次改动（类型：UI 修复，影响范围：ProductPage / WearablePage 卡片模块）。

---

## 实施顺序

1. 读取本计划文件刷新上下文
2. 读取 ProductPage.tsx 和 WearablePage.tsx 确认当前行号（可能因其他改动略有偏移）
3. 修改 ProductPage.tsx（4 处改动：网格 / Reveal / 卡片根 div / 图片容器+img）
4. 修改 WearablePage.tsx（4 处改动：网格 / Reveal / ProductCard 根 div / 图片容器+img）
5. 运行 `npx tsc --noEmit` 验证编译
6. 启动 `npm run dev`，按上述验证步骤逐项检查
7. 更新 `DEV_LOG.md`

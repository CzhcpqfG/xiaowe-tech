# 修复英文翻译导致的布局溢出问题

> **范围**: P0 极高+高风险 (9 处)
> **策略**: 双管齐下 — CSS 弹性化 + 翻译精简, 按需逐点选择
> **约束**: 不影响中文版视觉美观, 不破坏移动端布局

---

## 一、摘要

英文翻译上线后, 多处固定宽度/高度的容器出现文本溢出、卡片变形、SVG 标签重叠等问题。本轮针对 9 个 P0 级问题点 (4 极高 + 5 高) 进行修复, 优先保证中文版与移动端视觉零回归, 同时让英文版可用。

---

## 二、当前状态分析

### 2.1 问题根因

1. **中文短、英文长**: 中文 2-4 字符的关键词, 英文翻译后普遍 15-30 字符, 长段落甚至 200+ 字符
2. **固定容器**: 多处 `w-[Npx]` / `h-[Npx]` / `whitespace-nowrap` 锁死了中文时代的尺寸
3. **SVG 文字无换行**: SVG `<text>` 不支持自动换行, 长英文直接溢出 rect 边界
4. **grid 缺 auto-rows-fr**: 同行卡片高度不齐, 英文撑高后视觉错乱

### 2.2 P0 修复清单 (9 处)

| # | 文件 | 行号 | 问题 | 风险 |
|---|------|------|------|------|
| 1 | ProductPage.tsx | 1138-1262 | 扇形图标签 whitespace-nowrap, 英文溢出 SVG | 极高 |
| 2 | ProductPage.tsx | 442-519 | 流程图 SVG rect 280px, 英文节点文字溢出 | 极高 |
| 3 | ProductPage.tsx | 852-898 | U 形时间轴卡片 180px, 英文 desc 严重溢出 | 极高 |
| 4 | InvestPage.tsx | 268-398 | marketStatus 4 卡 h-[200px], 英文撑破 | 极高 |
| 5 | ProductPage.tsx | 106-121 | Tab 按钮 width:140px, "Bone Conduction" 溢出 | 高 |
| 6 | CareersPage.tsx | 188-212 | Tab 按钮 width:144px, "HR, Admin & Finance" 溢出 | 高 |
| 7 | WearablePage.tsx | 216-235 | Tab 按钮 width:140px, "Bluetooth Earphone" 溢出 | 高 |
| 8 | ProductPage.tsx | 162-176 | 产品卡 2×3 指标格 min-h-[56px], 英文 desc 溢出 | 高 |
| 9 | WearablePage.tsx | 85-100 | 同上 (WearablePage 产品卡) | 高 |

---

## 三、修复原则 (用户约束落地)

### 3.1 三选一决策树

每个问题点按以下顺序选择方案:

1. **优先 CSS 弹性化** — 当中文版用同样规则视觉不变 (例: Tab 按钮 `width → minWidth + padding`, 中文短词仍占 140px 不变)
2. **次选翻译精简** — 当 CSS 改动会让中文版视觉变差 (例: SVG 扇形图改 flex 会破坏布局, 只能精简英文)
3. **二者并行** — 当单一方案都不够 (例: U 形时间轴卡片宽度受限, 同时精简翻译 + 微调字号)

### 3.2 中文版零回归检查清单

- [ ] 改动后中文版视觉与改动前像素级一致 (或可接受的微调)
- [ ] 中文版不出现"卡片变高留白"等副作用
- [ ] 中文版 Tab 按钮宽度不变 (或仅 active 态微宽)

### 3.3 移动端零回归检查清单

- [ ] 移动端 (sm 断点) 布局不受影响
- [ ] `overflow-x-auto` 横向滚动仍可用
- [ ] 触控目标尺寸不缩小 (按钮高度 ≥ 44px)

---

## 四、具体修复方案

### 修复 1: ProductPage 扇形图 (极高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 1138-1262

**当前问题**:
- 5 个扇区标签均使用 `whitespace-nowrap`
- 容器固定 760×540px, 标签 maxWidth 320px
- 英文 sub 行如 `More realistic noise reduction, more natural sound` (51 字符) 直接溢出 SVG 边界, 与相邻扇区重叠

**修复方案**: 二者并行

**CSS 改动** (ProductPage.tsx):
- 行 1151: `whitespace-nowrap` → `whitespace-normal text-center` (centerSubKey 行)
- 行 1154: `whitespace-nowrap` → `whitespace-normal text-center` (centerHintKey 行)
- 行 1238: `whitespace-nowrap` → `whitespace-normal text-center` (prefix 行)
- 行 1248: `whitespace-nowrap` → `whitespace-normal text-center` (highlight 行)
- 行 1256: `whitespace-nowrap` → `whitespace-normal text-center` (sub 行)
- 标签容器 maxWidth 维持 320px, 让英文自然换行

**翻译精简** (`src/i18n/locales/en/product.json` 的 `coreTech.fanChart.sectors`):
- sector 0 sub: `More realistic noise reduction, more natural sound` → `Realistic NR, natural sound`
- sector 1 sub: `Hardware + fitting service full-stack AI` → `Hardware + fitting full-stack AI`
- sector 2 sub: `Solving the worldwide howling challenge` → `Solving the howling challenge`
- sector 0 prefix: `Not stationary, but` → `Not static, but`
- sector 3 prefix: `Beyond verbal communication` → `Beyond communication`

**中文版影响**: 无 (中文短词如"非平稳降噪"不会换行, `whitespace-normal` 不影响单行文本)

**移动端影响**: 无 (扇形图在移动端是缩放展示, 不参与响应式布局)

---

### 修复 2: ProductPage 流程图 SVG (极高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 442-519

**当前问题**:
- leftNodes rect 宽 280px, fontSize 15
- 英文节点 `Download Prescription, Trial Verification, Tuning` (49 字符) 严重溢出 rect 边界
- rightNodes + steps 同样问题

**修复方案**: 翻译精简为主, CSS 微调为辅

**翻译精简** (`src/i18n/locales/en/product.json` 的 `serviceCenter.processChart`):

leftNodes:
- `0`: `Reception/Consultation, Communication` → `Reception & Consultation`
- `1`: `Standardized ENT Hearing Examination` → `Standardized ENT Exam`
- `2`: `Product Selection and Trial` → `Product Selection & Trial`
- `3`: `Download Prescription, Trial Verification, Tuning` → `Download Rx, Verify & Tune`
- `4`: `Usage Instructions, Rehabilitation Guidance` → `Usage Guide & Rehab`

rightNodes:
- `0`: `"Sound Prescription" Plan Development` → `Sound Rx Plan Development`
- `1`: `Professional Fitting Tuning, Parameter Adjustment` → `Fitting Tuning & Params`
- `2`: `Product Customization, Ear Mold Customization Plan` → `Product & Ear Mold Custom`

steps:
- `0.title`: `Fitter Submits Application` → `Fitter Submits Request`
- `0.desc`: `Front-end examination completed, data auto-uploaded` → `Exam done, data auto-uploaded`
- `1.title`: `Audiologist Outputs Sound Prescription` → `Audiologist Issues Sound Rx`
- `1.desc`: `Back-end expert creates customized sound prescription` → `Expert creates custom Sound Rx`
- `2.title`: `Fitter Applies Sound Prescription` → `Fitter Applies Sound Rx`
- `2.desc`: `Download prescription and guide user trial verification` → `Download Rx, guide trial`

arrowUploadLabel: `Data auto-uploaded, request initiated` → `Data uploaded, request sent`
arrowFeedbackLabel: `试听问题反馈` 对应英文已是 `Trial feedback` (确认)

**CSS 微调** (ProductPage.tsx):
- 行 442: leftNodes rect `width="280"` → `width="300"`, fontSize `15` → `14`
- 行 521: rightNodes rect `width="280"` → `width="300"`, fontSize `15` → `14`

**中文版影响**: rect 加宽 20px + 字号降 1px, 中文节点文字会更宽松, 视觉更舒展, 不会变差

**移动端影响**: 流程图在移动端通过 `overflow-x-auto` 横向滚动, 加宽 20px 不影响

---

### 修复 3: ProductPage U 形时间轴 (极高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 852-898

**当前问题**:
- 8 节点卡片宽 180px, 相邻间距仅 154px (x: 60→214→368...)
- 英文 desc 如 `Free hearing tests/maintenance/care/tuning services` (51 字符) 严重溢出, 强制 3-4 行
- 多个相邻卡片英文 desc 撑高后会重叠

**修复方案**: 翻译精简为主, CSS 不动 (避免重叠)

**翻译精简** (`src/i18n/locales/en/product.json` 的 `lifecycleService`):

postales:
- `1.desc`: `Non-artificial damage within warranty / All parts replaced` → `Warranty non-artificial damage: full replacement`
- `2.desc`: `Hand-by-hand teaching / HD video demos` → `Hand-by-hand + HD video`
- `3.desc`: `Continuous follow-up / Four-week usage guide` → `Continuous follow-up, 4-week guide`
- `4.desc`: `Purchase = Member / Extended warranty service` → `Purchase = Member, extended warranty`
- `5.desc`: `Free store tuning appointments / Lifetime service` → `Free store tuning, lifetime service`
- `6.desc`: `Free hearing tests/maintenance/care/tuning services` → `Free tests, maintenance, care, tuning`

**CSS 不动**: 卡片宽 180px 不变 (改宽会与相邻卡片重叠), 依赖翻译精简让英文 desc 控制在 2 行内

**中文版影响**: 无 (仅改英文 JSON)

**移动端影响**: 无

---

### 修复 4: InvestPage marketStatus 4 卡片 (极高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 268-398

**当前问题**:
- 卡片 [1] `h-[200px]` 固定, 英文 footnote 109 字符强制 2 行, 紧贴底部边界
- 卡片 [3] `h-[200px]` 固定, `France/UK` 9 字符在 72px 列宽内紧贴
- 卡片 [4] `min-h-[200px] lg:h-[200px]`, 图例 `Moderate or Worse Hearing Impaired` 34 字符紧贴

**修复方案**: 二者并行

**CSS 改动** (InvestPage.tsx):
- 行 270: 卡片 [1] `h-[160px] lg:h-[200px]` → `min-h-[160px] lg:min-h-[200px]`
- 行 290: 卡片 [3] `h-[160px] lg:h-[200px]` → `min-h-[160px] lg:min-h-[200px]`
- 行 299: 卡片 [4] `min-h-[200px] lg:h-[200px]` → `min-h-[200px]` (移除 lg:h-[200px] 上限)
- 行 340 (如有): 同上
- 行 304: 国家名 `w-[72px]` → `w-[88px]`

**翻译精简** (`src/i18n/locales/en/invest.json`):
- 卡片 [1] footnote: `1/3 of seniors over 65 have hearing disorders. By 2030, moderate hearing loss population will reach 100 million` → `1/3 of seniors 65+ have hearing disorders. By 2030, moderate hearing loss will reach 100M`
- 卡片 [4] 图例: `Moderate or Worse Hearing Impaired` → `Moderate+ Hearing Impaired`
- 卡片 [4] 图例: `Total Hearing Impaired` → 保持 (22 字符 OK)

**中文版影响**:
- `min-h` 替代 `h`: 中文内容刚好 200px, `min-h-[200px]` 不会让中文卡变高, 视觉零变化
- 国家名 `w-[88px]`: 中文 "法/英" 3 字符在 88px 宽内更宽松, 视觉更好

**移动端影响**: 无 (移动端 `min-h-[160px]` 不变)

---

### 修复 5: ProductPage Tab 按钮 (高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 106-121

**当前问题**:
- `width: "140px"` 固定, 14px 字号
- `Bone Conduction` 15 字符在 140px 内紧贴或溢出

**修复方案**: CSS 弹性化

**CSS 改动** (ProductPage.tsx 行 112-116):
```tsx
style={{
  minWidth: "140px",
  height: "48px",
  padding: "0 16px",
  fontSize: isActive ? "16px" : "14px",
}}
```
(移除 `width: "140px"`, 改为 `minWidth: "140px"` + `padding: "0 16px"`)

**中文版影响**:
- 中文 `全部` (2 字符) + padding 32px = 仍 140px 宽 (min-width 触发), 视觉零变化
- 中文 `骨导式` (3 字符) 同上, 仍 140px

**移动端影响**: 无 (`shrink-0` + `overflow-x-auto` 仍可横向滚动)

---

### 修复 6: CareersPage Tab 按钮 (高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\CareersPage.tsx` 行 188-212

**当前问题**:
- `width: isActive ? "152px" : "144px"` 固定
- active 时 18px 字号 + `HR, Admin & Finance` 19 字符严重溢出

**修复方案**: CSS 弹性化

**CSS 改动** (CareersPage.tsx 行 202-207):
```tsx
style={{
  minWidth: "144px",
  height: "47px",
  padding: "0 20px",
  fontSize: isActive ? "18px" : "16px",
  marginRight: idx < CAREERS_PAGE.tabs.length - 1 ? "30px" : "0",
}}
```
(移除 `width`, 改 `minWidth` + `padding`)

**中文版影响**:
- 中文 `全部` 2 字符 + padding 40px = 仍 144px 宽, 视觉零变化
- 中文 `人力行政` 4 字符同上

**移动端影响**: 无

---

### 修复 7: WearablePage Tab 按钮 (高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\WearablePage.tsx` 行 216-235

**当前问题**:
- `width: "140px"` 固定
- `Bluetooth Earphone` 18 字符紧贴或溢出

**修复方案**: CSS 弹性化 + 翻译精简

**CSS 改动** (WearablePage.tsx 行 226-230):
```tsx
style={{
  minWidth: "140px",
  height: "48px",
  padding: "0 16px",
  fontSize: isActive ? "16px" : "14px",
}}
```

**翻译精简** (`src/i18n/locales/en/wearable.json`):
- `tabs.bluetooth-earphone`: `Bluetooth Earphone` → `Earphone` (单按钮内单词足够清晰)

**中文版影响**: 中文 `蓝牙耳机` 4 字符 + padding 32px = 仍 140px 宽, 视觉零变化

**移动端影响**: 无

---

### 修复 8: ProductPage 产品卡 features 指标格 (高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\ProductPage.tsx` 行 162-176

**当前问题**:
- 4 列卡片网格, 每卡 ~270px, 2 列指标格每格 ~125px
- `min-h-[56px]` 固定, 英文 desc 如 `Adaptive feedback cancellation` (31 字符) 强制 2-3 行撑破

**修复方案**: 翻译精简为主, CSS 微调为辅

**翻译精简** (`src/i18n/locales/en/product.json` 的 `products.*.features`):

12 款产品的 features desc 全部精简到 ≤ 22 字符 (单行容纳):
- `Chinese speech enhancement` → `Chinese speech enhance`
- `Auto gain control` → `Auto gain` (保留)
- `Non-stationary noise reduction` → `Non-stationary NR`
- `Non-stationary cross-cut NR` → `Non-stationary NR`
- `Wind noise suppression` → `Wind NR`
- `Dual howling suppression` → `Dual howling supp.`
- `Adaptive feedback cancellation` → `Adaptive feedback`
- `Adaptive feedback suppression` → `Adaptive feedback`
- `Impulse noise reduction` → `Impulse NR`
- `Impulse noise suppression` → `Impulse NR`
- `High-freq millisecond reshaping` → `High-freq reshape`
- `12nm processor` → `12nm chip`
- `AI computing` → `AI compute`
- `WDRC` → 保留
- `Simple operation` → 保留
- `Smart noise reduction` → `Smart NR`
- `Omni-directional mic` → `Omni mic`
- `Full-on gain` → 保留
- `Max output` → 保留
- `Pro hearing chip` → 保留
- `Enhancement compensation` → `Speech enhance`
- `Long battery life` → 保留
- `Sudden noise suppression` → `Sudden NR`
- `Video AI fitting` → 保留

**CSS 微调** (ProductPage.tsx 行 167):
- `min-h-[56px]` → `min-h-[64px]` (英文 2 行 desc 有 8px 余量)
- desc 字号 `text-[11px]` 保持, leading-[15px] → `leading-[14px]` (压缩行高)

**中文版影响**:
- 中文 desc 短 (4-6 字符), min-h-[64px] 会让中文卡片每格多 8px 高度
- 但 `auto-rows-fr` 让同行卡片等高, 中文卡整体每行多 8px, 视觉差异极小, 可接受

**移动端影响**: 无 (移动端 2 列, 每格更宽, 文字更宽松)

---

### 修复 9: WearablePage 产品卡 features 指标格 (高风险)

**文件**: `d:\VibeTest\bigsound\src\pages\WearablePage.tsx` 行 85-100

**当前问题**: 同修复 8

**修复方案**: 翻译精简为主, CSS 微调为辅

**翻译精简** (`src/i18n/locales/en/wearable.json` 的 `products.*.features`):

主要长描述精简:
- `Light energy replenishes, longer battery life` → `Solar recharge, long life`
- `24-hour continuous monitoring` → `24h monitoring`
- `Precise SpO₂ saturation` → `Precise SpO₂`
- `Real-time abnormal reminders` → `Real-time alerts`
- `Full-cycle sleep analysis` → `Sleep analysis`
- `Multiple sport modes` → `Multi-sport`
- `Entry/exit safety zone alerts` → `Safety zone alerts`
- `One-tap SOS for help` → `One-tap SOS`
- `Parent remote monitoring` → `Remote monitoring`
- `Family chat, zero distance` → `Family chat`
- `No ear canal pressure, all-day comfort` → `No ear pressure, comfy`
- `Precise direction, no disturbance` → `Directional, quiet`
- `High-fidelity lossless audio` → `Hi-fi audio`
- `Active noise cancellation, immersive` → `ANC, immersive`
- `Ergonomic comfortable fit` → `Ergonomic fit`
- `Portable, long battery life` → `Portable, long life`

**CSS 微调** (WearablePage.tsx 行 90):
- `min-h-[56px]` → `min-h-[64px]`
- desc `leading-[15px]` → `leading-[14px]`

**中文版影响**: 同修复 8

**移动端影响**: 无

---

## 五、假设与决策

### 5.1 关键假设

1. **`whitespace-normal` 在中文单行文本上等价于 `whitespace-nowrap`**: 中文短词不会触发换行, 改动安全
2. **`min-h` 替代 `h` 不影响中文**: 中文内容刚好达到 min-h 临界值, 不会触发额外撑高
3. **`minWidth` + `padding` 在中文短词上等价于 `width`**: 短词触发 minWidth 边界, padding 仅影响内部留白, 视觉与原版一致
4. **SVG rect 加宽 20px 不破坏整体布局**: 流程图总宽 ~1200px, 加宽 20px 仍在容器内

### 5.2 关键决策

1. **扇形图选 CSS+翻译双修**: 纯 CSS 改 `whitespace-normal` 会让英文换行, 但换行后行数不可控, 配合翻译精简保证 ≤ 2 行
2. **流程图选翻译为主**: SVG `<text>` 不支持自动换行, 只能精简翻译到 rect 宽度内
3. **U 形时间轴选翻译为主**: 卡片宽度受相邻间距限制 (154px), 改宽会重叠, 只能精简翻译
4. **Tab 按钮统一选 CSS 弹性化**: `minWidth + padding` 在中英文上表现一致, 是最优雅的方案
5. **产品卡 features 选翻译为主 + min-h 微调**: 翻译精简到 ≤ 22 字符可单行容纳, min-h 从 56→64 给英文 2 行留余量, 中文影响 8px 可接受

### 5.3 已排除的方案

- ❌ 改 grid 列数 (4→3): 会让中文版视觉大变, 排除
- ❌ 移动端单独适配: 用户要求"不影响移动端", 本轮方案均不触发移动端变化
- ❌ 重写 SVG 为 HTML+CSS: 工作量过大, 不在 P0 范围

---

## 六、验证步骤

### 6.1 编译验证

```bash
cd d:\VibeTest\bigsound
npx tsc --noEmit
npx vite build
```
两项均需通过。

### 6.2 中文版回归验证

启动 dev server 后, 用浏览器访问:
- `http://localhost:5173/zh-CN/product` — 检查扇形图、流程图、U 形时间轴、Tab 按钮、产品卡
- `http://localhost:5173/zh-CN/wearable` — 检查 Tab 按钮、产品卡
- `http://localhost:5173/zh-CN/careers` — 检查 Tab 按钮
- `http://localhost:5173/zh-CN/invest` — 检查 marketStatus 4 卡片

**预期**: 与改动前像素级一致 (或仅有 min-h 64px 处的 8px 微调, 视觉几乎不可见)。

### 6.3 英文版功能验证

访问:
- `http://localhost:5173/en/product` — 扇形图标签不溢出, 流程图节点文字在 rect 内, U 形时间轴卡片不重叠, Tab 按钮 "Bone Conduction" 完整显示, 产品卡 features desc 单行或 2 行内
- `http://localhost:5173/en/wearable` — Tab "Earphone" 完整显示, 产品卡 features desc 不撑破
- `http://localhost:5173/en/careers` — Tab "HR, Admin & Finance" 完整显示
- `http://localhost:5173/en/invest` — 4 卡片不撑破, 国家名 `France/UK` 完整显示

### 6.4 移动端验证

Chrome DevTools 切到 iPhone 14 (375×812):
- 各页面 Tab 按钮横向滚动正常
- 产品卡 2 列布局正常
- 流程图横向滚动正常

### 6.5 DEV_LOG 记录

修复完成后, 在 `d:\VibeTest\bigsound\DEV_LOG.md` 顶部新增 2026-07-26 条目, 记录:
- 9 处 P0 修复详情 (文件 + 行号 + 改动摘要)
- 修复策略 (CSS / 翻译 / 双管齐下)
- 中文版回归验证结果
- 英文版功能验证结果

---

## 七、实施顺序建议

按依赖关系排序:

1. **翻译精简类** (独立可做, 不影响代码):
   - 修复 3: U 形时间轴翻译
   - 修复 8: ProductPage features 翻译
   - 修复 9: WearablePage features 翻译
   - 修复 2: 流程图翻译
   - 修复 1: 扇形图翻译 (部分)
   - 修复 7: WearablePage Tab 翻译
   - 修复 4: InvestPage 翻译

2. **CSS 改动类** (按文件聚合, 一次改完一个文件):
   - 修复 5: ProductPage Tab CSS
   - 修复 1: ProductPage 扇形图 CSS
   - 修复 2: ProductPage 流程图 CSS
   - 修复 8: ProductPage features CSS
   - 修复 6: CareersPage Tab CSS
   - 修复 7: WearablePage Tab CSS
   - 修复 9: WearablePage features CSS
   - 修复 4: InvestPage marketStatus CSS

3. **验证类**:
   - 6.1 编译验证
   - 6.2 中文版回归
   - 6.3 英文版功能
   - 6.4 移动端
   - 6.5 DEV_LOG

---

## 八、不在本轮范围 (P1+ 后续处理)

以下中风险点留待后续迭代:
- AboutPage 时间线 2024-2026 阶段 2 列布局过窄
- AboutPage 月份列 32-40px 紧贴
- CareersPage 福利卡片长描述
- CareersPage JobAttr label 80px 紧贴
- InvestPage 政策利好 4 卡片长描述
- InvestPage lineChart 图例
- Header 桌面端导航 gap-7
- Footer 联系区地址溢出
- ProductPage 售后保修政策长段落
- ProductPage 临床医疗认证描述段落
- ProductPage 门店地址栏

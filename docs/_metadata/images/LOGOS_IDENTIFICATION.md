# 2.0 资源图片识别报告

> 识别时间: 2026-07-21
> 识别方法: 浏览器多模态视觉识别 (通过 Vite dev server 加载图片 + browser_take_screenshot + 视觉识别)
> 识别依据: 图片中的文字 (中英文) / 图形 / 颜色 / 整体风格

## 一、合作伙伴 logo 识别结果

原 2.0 网站资源中, 8 张合作伙伴 logo 图实际只有 4 个机构 (每个机构有小大两个尺寸版本):

| 机构名 | 小尺寸 (原文件名) | 大尺寸 (原文件名) | 识别依据 |
|---|---|---|---|
| 腾讯天籁 | `original/partner1.webp` | `06_product_5.webp` | 蓝色图形标识 + "腾讯天籁" 中文字样 |
| 中国老龄事业发展基金会 | `original/partner2.webp` | `06_product_6.webp` | 红色圆形图形 + "中国老龄事业发展基金会" 中文 + "CHINA AGEING DEVELOPMENT FOUNDATION" 英文 |
| 银发听力健康 | `original/partner3.webp` | `06_product_7.webp` | 蓝色图形标识 + "银发听力健康" 中文字样 + 小字副标 |
| 中山大学孙逸仙纪念医院 | `original/partner4.webp` | `06_product_8.webp` | 绿色徽章图形 + "中山大学孙逸仙纪念医院" 中文 + "SUN YAT-SEN MEMORIAL HOSPITAL SUN YAT-SEN UNIVERSITY" 英文 |

## 二、原 2.0 注释错误汇总

原 2.0 资源中, `partner1-4.webp` 和 `06_product_5-8.webp` 的注释全部错误:

| 原文件名 | 原注释 (错误) | 实际内容 (正确) |
|---|---|---|
| `partner1.webp` | 创维集团 | 腾讯天籁 |
| `partner2.webp` | 小维科技 | 中国老龄事业发展基金会 |
| `partner3.webp` | 腾讯天籁实验室 | 银发听力健康 |
| `partner4.webp` | 中国老龄发展基金会 | 中山大学孙逸仙纪念医院 |
| `06_product_5.webp` | 创维集团 logo (大) | 腾讯天籁 (大) |
| `06_product_6.webp` | 小维科技 logo (大) | 中国老龄事业发展基金会 (大) |
| `06_product_7.webp` | 腾讯天籁 logo (大) | 银发听力健康 (大) |
| `06_product_8.webp` | 中国老龄 logo (大) | 中山大学孙逸仙纪念医院 (大) |

## 三、缺失 logo

9 个合作伙伴中, 以下 2 个机构在 2.0 资源里**没有真实 logo**:

| 机构名 | 状态 | 当前处理 |
|---|---|---|
| 创维 (Skyworth) | 已补充 | ✅ 从 logo.nuanque.com 文章下载真实创维 logo (`logos/skyworth.jpg`, 蓝色 "Skyworth" + "创维" 文字标志) |
| 小维科技 (Xiaowei Tech) | 缺失 | ⏳ home.ts 中 PARTNERS 数组原 "小维科技" 项已修正为 "战略投资 4 家" (创维/华鹏飞/海和/新生) |

## 四、重命名整理

为统一管理, 8 张图已重命名移动到 `public/images/logos/` 目录:

| 原路径 | 新路径 | 机构 | 尺寸 |
|---|---|---|---|
| `public/images/original/partner1.webp` | `public/images/logos/tencent_tianlai.webp` | 腾讯天籁 | 小 |
| `public/images/original/partner2.webp` | `public/images/logos/china_aging.webp` | 中国老龄事业发展基金会 | 小 |
| `public/images/original/partner3.webp` | `public/images/logos/yinfa.webp` | 银发听力健康 | 小 |
| `public/images/original/partner4.webp` | `public/images/logos/sysu.webp` | 中山大学孙逸仙纪念医院 | 小 |
| `public/images/06_product_5.webp` | `public/images/logos/tencent_tianlai_lg.webp` | 腾讯天籁 | 大 |
| `public/images/06_product_6.webp` | `public/images/logos/china_aging_lg.webp` | 中国老龄事业发展基金会 | 大 |
| `public/images/06_product_7.webp` | `public/images/logos/yinfa_lg.webp` | 银发听力健康 | 大 |
| `public/images/06_product_8.webp` | `public/images/logos/sysu_lg.webp` | 中山大学孙逸仙纪念医院 | 大 |

命名规则:
- 文件名 = 机构英文缩写 + `_lg` 后缀 (大尺寸)
- 小尺寸用于首页 Partners 组件 (4 列网格)
- 大尺寸用于关于页 §3.10 战略合作伙伴 section (更大的展示)

## 五、引用更新清单

以下文件的图片路径引用已更新:

### 1. `src/data/images/home.ts` (首页图片资源)
- `partner1` 路径: `/images/original/partner1.webp` → `/images/logos/tencent_tianlai.webp`
- `partner2` 路径: `/images/original/partner2.webp` → `/images/logos/china_aging.webp`
- `partner3` 路径: `/images/original/partner3.webp` → `/images/logos/yinfa.webp`
- `partner4` 路径: `/images/original/partner4.webp` → `/images/logos/sysu.webp`

### 2. `src/data/home.ts` (首页 PARTNERS 数组)
修正名字与 logo 的错位 (原 4 个名字全部错位):
- 原 "创维集团" → "腾讯天籁实验室" (partner1 实际是腾讯天籁)
- 原 "小维科技" → "中国老龄发展基金会" (partner2 实际是中国老龄)
- 原 "腾讯天籁实验室" → "银发听力健康" (partner3 实际是银发听力健康)
- 原 "中国老龄发展基金会" → "中山大学孙逸仙纪念医院" (partner4 实际是中山大学孙逸仙纪念医院)

### 3. `src/data/images/product.ts` (产品页图片资源)
- `product5` 路径: `/images/06_product_5.webp` → `/images/logos/tencent_tianlai_lg.webp`
- `product6` 路径: `/images/06_product_6.webp` → `/images/logos/china_aging_lg.webp`
- `product7` 路径: `/images/06_product_7.webp` → `/images/logos/yinfa_lg.webp`
- `product8` 路径: `/images/06_product_8.webp` → `/images/logos/sysu_lg.webp`

### 4. `src/data/images/about.ts` (关于页图片资源)
- `partnerTencent` 路径: `/images/original/partner1.webp` → `/images/logos/tencent_tianlai_lg.webp`
- `partnerChinaAging` 路径: `/images/06_product_6.webp` → `/images/logos/china_aging_lg.webp`
- `partnerYinfa` 路径: `/images/06_product_7.webp` → `/images/logos/yinfa_lg.webp`
- `partnerSysu` 路径: `/images/original/partner4.webp` → `/images/logos/sysu_lg.webp`
- `partnerSkyworth` (创维): ✅ 已从网上下载真实 logo `/images/logos/skyworth.jpg`

## 六、待办

- ✅ 创维 (Skyworth) 真实 logo 已从网上下载落地 (`logos/skyworth.jpg`)
- ✅ 首页 Partners 组件已改为方案 B (战略投资 4 家: 创维/华鹏飞/海和/新生), 与关于页 §3.10 战略投资组保持一致
- ⏳ 小维科技 logo 是否需要? home.ts 原 "小维科技" 项已改为 "战略投资 4 家"

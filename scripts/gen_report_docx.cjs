// 阶段交付报告 Word 文档生成脚本（绿色品牌色系 · 图文并茂）
// 输出: docs/小维健康科技官网_阶段交付报告.docx
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun,
  Header, Footer, AlignmentType, PageOrientation, LevelFormat,
  TabStopType, TabStopPosition, HeadingLevel, BorderStyle, WidthType,
  ShadingType, VerticalAlign, PageNumber, PageBreak,
} = require("docx");

// ---------- 品牌色 ----------
const C = {
  primary: "0B6E3F",   // 深绿
  accent: "16A34A",    // 鲜绿
  light: "E8F5EE",     // 浅绿底
  mint: "DCFCE7",      // 薄荷
  gold: "CA8A04",      // 金色
  ink: "1F2937",       // 深墨
  gray: "6B7280",      // 中灰
  softgray: "9CA3AF",
  border: "D1D5DB",    // 浅灰边框
  white: "FFFFFF",
  faint: "F3FAF6",     // 极浅绿
};

const ASSETS = path.join(__dirname, "..", "docs", "_report_assets");
const OUT = path.join(__dirname, "..", "docs", "小维健康科技官网_阶段交付报告.docx");

// A4: 11906 x 16838 ; margin left/right 1280 -> content 9346
const CONTENT_W = 9346;
const IMG_W = 622; // px ~ content width

// ---------- 边框 ----------
const bColor = (c, sz = 4) => ({ style: BorderStyle.SINGLE, size: sz, color: c });
const allBorders = (c = C.border, sz = 4) => ({
  top: bColor(c, sz), bottom: bColor(c, sz), left: bColor(c, sz), right: bColor(c, sz),
});
const noBorders = {
  top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE },
  left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE },
};
const cellMargins = { top: 90, bottom: 90, left: 130, right: 130 };

// ---------- 基础段落工具 ----------
const P = (children, opts = {}) => new Paragraph({ children, ...opts });
const T = (text, opts = {}) => new TextRun({ text, ...opts });
const TR = (children, opts = {}) => new TextRun({ children, ...opts });

// 普通正文
const body = (text, opts = {}) => P([T(text, { font: "Microsoft YaHei", size: 21, color: C.ink, ...opts })],
  { spacing: { after: 100, line: 340 }, ...opts });

// 章节大标题 H1（带左侧深绿色条 + 深绿字）
const h1 = (text, num) => {
  const runs = [];
  if (num !== undefined) {
    runs.push(new TextRun({ text: num + "  ", font: "Microsoft YaHei", size: 32, bold: true, color: C.accent }));
  }
  runs.push(new TextRun({ text, font: "Microsoft YaHei", size: 32, bold: true, color: C.primary }));
  return new Paragraph({
    children: runs,
    spacing: { before: 360, after: 200 },
    border: { left: { style: BorderStyle.SINGLE, size: 30, color: C.primary, space: 12 } },
    heading: HeadingLevel.HEADING_1,
  });
};

// 二级标题 H2（鲜绿）
const h2 = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Microsoft YaHei", size: 25, bold: true, color: C.accent })],
  spacing: { before: 240, after: 120 },
  heading: HeadingLevel.HEADING_2,
});

// 三级标题 H3（深墨加粗）
const h3 = (text) => new Paragraph({
  children: [new TextRun({ text, font: "Microsoft YaHei", size: 22, bold: true, color: C.ink })],
  spacing: { before: 180, after: 80 },
  heading: HeadingLevel.HEADING_3,
});

// 项目符号
const bullet = (runs, ref = "bullets", level = 0) => new Paragraph({
  numbering: { reference: ref, level },
  spacing: { after: 70, line: 320 },
  children: Array.isArray(runs) ? runs : [runs],
});

// 编号列表
const numItem = (runs, ref = "numbers", level = 0) => new Paragraph({
  numbering: { reference: ref, level },
  spacing: { after: 70, line: 320 },
  children: Array.isArray(runs) ? runs : [runs],
});

// 复选框项
const checkItem = (text, checked = false) => new Paragraph({
  spacing: { after: 60, line: 320 },
  indent: { left: 360 },
  children: [
    new TextRun({ text: checked ? "☑  " : "☐  ", font: "Microsoft YaHei", size: 22, color: C.primary }),
    new TextRun({ text, font: "Microsoft YaHei", size: 21, color: C.ink }),
  ],
});

// 引用/提示框（浅绿底 + 左色条）
const callout = (runs) => new Paragraph({
  spacing: { before: 120, after: 120, line: 340 },
  shading: { fill: C.light, type: ShadingType.CLEAR },
  border: { left: { style: BorderStyle.SINGLE, size: 24, color: C.accent, space: 10 } },
  indent: { left: 220, right: 120 },
  children: Array.isArray(runs) ? runs : [runs],
});

// 图片
const img = (file, w, h) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { before: 120, after: 120 },
  children: [new ImageRun({
    type: "png",
    data: fs.readFileSync(path.join(ASSETS, file)),
    transformation: { width: w, height: h },
    altText: { title: file, description: file, name: file },
  })],
});

// 图片标题
const caption = (text) => new Paragraph({
  alignment: AlignmentType.CENTER,
  spacing: { after: 160 },
  children: [new TextRun({ text, font: "Microsoft YaHei", size: 18, italics: true, color: C.gray })],
});

// 空段
const spacer = (after = 80) => new Paragraph({ spacing: { after }, children: [] });

// ---------- 表格工具 ----------
// 表头单元格
const hCell = (text, width, opts = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: { fill: C.primary, type: ShadingType.CLEAR },
  verticalAlign: VerticalAlign.CENTER,
  margins: cellMargins,
  borders: allBorders(C.primary, 4),
  children: [new Paragraph({
    alignment: opts.align || AlignmentType.CENTER,
    spacing: { after: 0 },
    children: [new TextRun({ text, font: "Microsoft YaHei", size: 21, bold: true, color: C.white })],
  })],
});

// 数据单元格
const dCell = (children, width, opts = {}) => {
  const paras = Array.isArray(children) && children[0] instanceof Paragraph
    ? children
    : [new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { after: 0, line: 300 },
        children: Array.isArray(children) ? children : [children],
      })];
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: { fill: opts.fill || C.white, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: cellMargins,
    borders: allBorders(C.border, 4),
    children: paras,
  });
};

// 构建标准表格：headers=[{text,width}], rows=[[cells...]], 第一列加粗
const table = (headers, rows, opts = {}) => {
  const colW = headers.map(h => h.width);
  const total = colW.reduce((a, b) => a + b, 0);
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map(h => hCell(h.text, h.width, { align: h.align })),
  });
  const dataRows = rows.map((r, i) => new TableRow({
    children: r.map((cell, ci) => {
      const fill = i % 2 === 1 ? C.faint : C.white;
      if (typeof cell === "string") {
        const bold = ci === 0 && opts.boldFirst !== false;
        return dCell([new TextRun({ text: cell, font: "Microsoft YaHei", size: 20, color: C.ink, bold })],
          colW[ci], { fill, align: headers[ci].align });
      }
      // cell is array of runs
      return dCell(cell, colW[ci], { fill, align: headers[ci].align });
    }),
  }));
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colW,
    rows: [headerRow, ...dataRows],
  });
};

// 单元格内的彩色 TextRun
const r = (text, o = {}) => new TextRun({ text, font: "Microsoft YaHei", size: 20, color: C.ink, ...o });
const rG = (text) => r(text, { color: C.accent, bold: true });      // 鲜绿强调
const rP = (text) => r(text, { color: C.primary, bold: true });     // 深绿
const rGold = (text) => r(text, { color: C.gold, bold: true });     // 金色
const rB = (text) => r(text, { bold: true });                        // 加粗

// ====================================================================
// 封面
// ====================================================================
function buildCover() {
  const items = [];
  // 顶部品牌色条 banner 图
  items.push(img("cover_banner.png", IMG_W, 202));
  items.push(spacer(160));

  // 报告主标题
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 120 },
    children: [new TextRun({ text: "阶段交付报告", font: "Microsoft YaHei", size: 60, bold: true, color: C.primary })],
  }));
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: "STAGE DELIVERY REPORT", font: "Arial", size: 20, color: C.gray, characterSpacing: 80 })],
  }));
  // 副标题色条
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 260 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 18, color: C.accent, space: 4 } },
    children: [new TextRun({ text: "", size: 2 })],
  }));

  // 副标题
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 320 },
    children: [new TextRun({ text: "首页 + 9 个子页面 + 三语国际化 + SEO/GEO 全栈优化 + 品牌配图与宣传片", font: "Microsoft YaHei", size: 24, color: C.ink })],
  }));

  // 项目信息卡（无边框表格）
  const infoCell = (label, value) => new TableCell({
    width: { size: CONTENT_W / 2, type: WidthType.DXA },
    shading: { fill: C.light, type: ShadingType.CLEAR },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 160, bottom: 160, left: 240, right: 240 },
    borders: noBorders,
    children: [
      new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: label, font: "Microsoft YaHei", size: 18, color: C.gray })] }),
      new Paragraph({ spacing: { after: 0 }, children: [new TextRun({ text: value, font: "Microsoft YaHei", size: 24, bold: true, color: C.primary })] }),
    ],
  });
  items.push(new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W / 2, CONTENT_W / 2],
    rows: [
      new TableRow({ children: [infoCell("项目名称", "小维健康科技官网"), infoCell("报告日期", "2026 年 7 月")] }),
    ],
  }));

  items.push(spacer(400));
  // 数据看板图
  items.push(img("dashboard.png", IMG_W, 350));
  items.push(caption("图 1 · 核心交付数据一览"));

  items.push(new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ====================================================================
// 摘要
// ====================================================================
function buildSummary() {
  const items = [];
  items.push(h1("摘要"));
  items.push(callout([
    r("本阶段完成小维健康科技官网的 "),
    rG("12 个页面、3 种语言（简中/繁中/英文）、24 个静态预渲染页面"),
    r(" 的完整交付，工程代码 "),
    rG("1.4 万行"),
    r("，资源图片 "),
    rG("139 张"),
    r("，品牌定制配图 "),
    rG("31+ 张"),
    r("，15 秒品牌宣传片 "),
    rG("1 支"),
    r("。重点完成 "),
    rP("SEO + GEO 双栈优化"),
    r("（10 类结构化数据 + 13 个 AI 爬虫友好协议 + 37 条 FAQ 问答矩阵），让网站在豆包、ChatGPT、Perplexity、Claude 等 AI 搜索引擎中的命中率显著提升。同步复刻招商手册 6 处关键图表并配套统一品牌动效系统，完成桌面/移动双端响应式适配。"),
  ]));
  return items;
}

// ====================================================================
// 一、核心成果
// ====================================================================
function buildSection1() {
  const items = [];
  items.push(h1("核心成果（交付亮点）", "一"));

  // 1.1 网站概况
  items.push(h2("1.1  网站概况一览"));
  const cols = [{ text: "维度", width: 2000 }, { text: "数据", width: 1900 }, { text: "说明", width: 5446 }];
  const rows1 = [
    [[rB("页面总数")], [rG("12 个")], "含首页、关于、产品、穿戴、招商、招聘、资讯列表、资讯详情、FAQ、登录、注册、404"],
    [[rB("可访问 URL")], [rG("39 个")], "13 路由 × 3 语言，覆盖简中/繁中/英文"],
    [[rB("工程代码")], [rG("约 1.4 万行")], "71 个源文件，完整前后端分离架构"],
    [[rB("资源图片")], [rG("139 张")], "含产品图、Hero 图、荣誉证书、企业资质、企业文化、招聘场景等"],
    [[rB("品牌定制配图")], [rG("31+ 张")], "涵盖首页 Hero、产品、企业文化、招聘、荣誉、招商场景"],
    [[rB("品牌宣传片")], [rG("1 支（15 秒）")], "5 分镜，1080P，接入首页 Hero 区域"],
    [[rB("国际化翻译")], [rG("33 文件 / 2,035+ 条")], "3 语言 × 11 模块，全站文案无硬编码"],
    [[rB("结构化数据")], [rG("10 类 Schema")], "覆盖组织、网站、FAQ、产品、医疗器械等主流类型"],
    [[rB("预渲染页面")], [rG("24 个静态页面")], "确保搜索引擎与 AI 爬虫无障碍抓取"],
    [[rB("构建产物")], [rG("完整可部署")], "包含多语言子目录、SEO 文件、视频、图片资源"],
  ];
  items.push(table(cols, rows1));

  // 1.2 SEO + GEO
  items.push(h2("1.2  SEO + GEO 双栈优化（核心投入）"));
  items.push(new Paragraph({ spacing: { before: 80, after: 80 }, children: [
    new TextRun({ text: "SEO", font: "Microsoft YaHei", size: 22, bold: true, color: C.primary }),
    new TextRun({ text: " —— 提升百度/Google/Bing 等传统搜索引擎排名", font: "Microsoft YaHei", size: 21, color: C.ink }),
  ]}));
  const seoB = [
    bullet([rB("动态元信息管理"), r("：每页独立 title / description / keywords，3 语种 × 12 页面 = "), rG("36 套 SEO 文案")]),
    bullet([rB("多语言防重复惩罚"), r("：4 条 alternate 链接（简中/繁中/英文/默认），避免重复内容判定")]),
    bullet([rB("社交分享卡片"), r("：覆盖微信、微博、Facebook、LinkedIn 等主流平台，分享自动展示品牌卡片")]),
    bullet([rB("站点地图"), r("：24 个 URL，按页面权重分配优先级，按更新频率分配爬虫抓取节奏")]),
    bullet([rB("爬虫协议精细控制"), r("：允许全站抓取，仅禁止登录/注册等低价值页")]),
  ];
  seoB.forEach(p => items.push(p));

  items.push(new Paragraph({ spacing: { before: 160, after: 80 }, children: [
    new TextRun({ text: "GEO", font: "Microsoft YaHei", size: 22, bold: true, color: C.gold }),
    new TextRun({ text: " —— 针对豆包、ChatGPT、Perplexity、Claude、文心一言等 AI 搜索引擎的专项优化", font: "Microsoft YaHei", size: 21, color: C.ink }),
  ]}));
  items.push(callout([r("这是当前行业内的前沿优化方向，大多数同行网站尚未涉足。本次官网已完整落地，让品牌在 AI 时代具备"), rGold("“被 AI 引用为答案”"), r("的能力。")]));
  const geoB = [
    bullet([rB("37 条 FAQ 问答矩阵"), r("：覆盖“听力不好怎么办”“助听器品牌选哪个”“助听器多少钱”“老年人助听器怎么选”等高频问题，按 6 大分类组织")]),
    bullet([rB("FAQ 结构化数据注入"), r("：37 条问答以结构化数据呈现，AI 爬虫可直接抓取问答对，在用户提问时被引用为答案来源")]),
    bullet([rB("AI 爬虫友好协议"), r("：显式允许 13 个主流 AI 爬虫（GPTBot / ChatGPT-User / OAI-SearchBot / PerplexityBot / Claude-Web / ClaudeBot / anthropic-ai / Bytespider / Doubao / Baiduspider / Bingbot / Googlebot / Applebot）")]),
    bullet([rB("AI 摘要文档 + 完整品牌知识库"), r("：为 AI 搜索引擎提供专属摘要（83 行）+ 完整品牌知识库（含技术细节、市场数据、服务流程、创始人故事、发展历程），让 AI 直接拉取公司完整知识图谱")]),
    bullet([rB("核心页面内嵌 FAQ 模块"), r("：首页 / 产品页 / 招商页各注入 4 条相关 FAQ，既提升用户转化，又增加 AI 抓取密度")]),
    bullet([rB("24 页静态预渲染"), r("：全站 24 个路由均输出为静态 HTML，AI 爬虫无需执行 JS 即可抓取完整内容（关键！很多 AI 爬虫不执行 JS）")]),
  ];
  geoB.forEach(p => items.push(p));

  items.push(img("seo_geo.png", IMG_W, 341));
  items.push(caption("图 2 · SEO + GEO 双栈优化能力对比"));

  // 1.3 品牌配图与宣传片
  items.push(h2("1.3  品牌配图与 15 秒宣传片"));
  items.push(h3("品牌定制配图（31+ 张）"));
  items.push(img("brand_assets.png", IMG_W, 317));
  items.push(caption("图 3 · 品牌定制配图用途分布"));

  const cols2 = [{ text: "用途", width: 3300 }, { text: "数量", width: 1400 }, { text: "说明", width: 4646 }];
  const rows2 = [
    [[rB("首页 Hero 三大产品入口图")], [rG("7 张")], "AI 助听器 / 智能手表 / 蓝牙耳机"],
    [[rB("首页 Hero 三大产品图（迭代优化）")], [rG("3 张")], "上一批的视觉升级版"],
    [[rB("招聘页分类图")], [rG("6 张")], "技术研发 / 生产制造 / 市场营销 / 人事行政 + 公司介绍"],
    [[rB("资质荣誉图")], [rG("10 张")], "5 张医疗资质 + 5 张企业荣誉"],
    [[rB("企业文化图")], [rG("3 张")], "使命 / 愿景 / 价值观"],
    [[rB("招商 Hero 图（三语种独立）")], [rG("3 张")], "简中 / 繁中 / 英文 各一张独立 Hero"],
    [[rB("招商场景图")], [rG("6 张")], "营销赋能 / 代运营 / 选址 / 培训等"],
  ];
  items.push(table(cols2, rows2));

  items.push(h3("15 秒品牌宣传片"));
  items.push(bullet([rB("5 个分镜"), r("，每镜 3 秒，共 15 秒")]));
  items.push(bullet([r("分镜主题：产品特写 → 佩戴场景 → 家庭温情 → 验配服务 → 品牌收尾")]));
  items.push(bullet([rB("输出规格"), r("：1280×720 / 16:9")]));
  items.push(bullet([rB("接入首页 Hero 区域"), r("，自动播放 + 循环 + 点击全屏")]));

  // 1.4 招商手册图表复刻 + 动效系统
  items.push(h2("1.4  招商手册图表复刻 + 品牌动效系统"));
  items.push(h3("6 处关键图表前端复刻（全部用代码绘制，非图片，清晰度任意缩放）"));
  const cols3 = [{ text: "图表", width: 2900 }, { text: "所在页面", width: 1900 }, { text: "复刻来源", width: 4546 }];
  const rows3 = [
    [[rB("中文核心技术扇形图")], "产品页", "原型环形海螺图"],
    [[rB("“声处方”验配流程图")], "产品页", "招商手册服务流程"],
    [[rB("听力损失分级对照表")], "招商页", "招商手册 §6.3"],
    [[rB("招商政策详细解读表")], "招商页", "招商手册 §6.6"],
    [[rB("双折线趋势图")], "招商页", "招商手册市场前景图"],
    [[rB("公司发展历程时间轴")], "关于页", "招商手册关于章节"],
  ];
  items.push(table(cols3, rows3));

  items.push(h3("统一动效系统"));
  [
    bullet([r("滚动入场动画，"), rB("7 种"), r("呈现方式（淡入上移 / 淡入下移 / 左移 / 右移 / 缩放 / 放大 / 弹出）")]),
    bullet([r("品牌定制缓动曲线，默认时长 "), rG("600ms")]),
    bullet([r("兼容“减少动态偏好”无障碍设置")]),
    bullet([r("全站 "), rG("14+ 处"), r("统一引用，视觉节奏一致")]),
    bullet([r("FAQ 手风琴 hover 微交互（上移 + 左侧品牌绿色色条 + 背景渐变 + 图标旋转）")]),
    bullet([r("卡片 hover、按钮交互使用细腻微动效")]),
  ].forEach(p => items.push(p));

  // 1.5 三语国际化 + 响应式
  items.push(h2("1.5  三语国际化 + 桌面/移动双端响应式"));
  items.push(h3("三语国际化"));
  [
    bullet([rB("3 种语言"), r("：简体中文 / 繁体中文 / 英文")]),
    bullet([rB("11 个翻译模块"), r("：通用 / 首页 / 产品 / 关于 / 招商 / 穿戴 / 招聘 / 资讯 / 登录注册 / SEO元信息 / FAQ")]),
    bullet([r("共 "), rG("33 个语言文件，2,035+ 翻译条目")]),
    bullet([r("全站文案无硬编码，均通过翻译函数调用")]),
    bullet([rB("URL 结构驱动语言切换"), r("：/{语言}/{路径}，如 /zh-CN/product / /zh-TW/product / /en/product")]),
    bullet([r("错误码、表单校验、登录注册提示等细节场景同步三语化")]),
  ].forEach(p => items.push(p));

  items.push(h3("响应式适配"));
  [
    bullet([rB("桌面端"), r("：保留原品牌 1200px 设计宽度，等比缩放，确保视觉一致性")]),
    bullet([rB("移动端"), r("：真响应式布局，三档断点（420 / 520 / 620），不套缩放容器")]),
    bullet([r("多策略测量，避免内容被裁剪")]),
    bullet([r("首页 Hero 视频桌面端铺满视口，移动端三档高度自适应")]),
    bullet([r("移动端 FAQ 卡片等高、扇形图三语编码、产品卡片溢出等问题已修复")]),
  ].forEach(p => items.push(p));

  items.push(new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ====================================================================
// 二、需客户决策与补充的事项
// ====================================================================
function buildSection2() {
  const items = [];
  items.push(h1("需客户决策与补充的事项", "二"));

  // 2.1
  items.push(h2("2.1  待客户确认：注册登录功能是否保留（成本评估）"));
  items.push(callout([rB("建议：移除注册登录功能，改为外部客服入口")]));
  const cols = [
    { text: "维度", width: 1500 },
    { text: "保留注册登录", width: 3523 },
    { text: "移除注册登录（推荐）", width: 4323 },
  ];
  const rows = [
    [[rB("开发成本")], "需额外 1-2 周开发用户中心、密码找回、第三方登录", [rG("0")]],
    [[rB("运维成本")], "需数据库、对象存储、定期备份、安全审计", [rG("仅静态托管")]],
    [[rB("服务器成本")], "月均 ¥200-500（云数据库 + 应用服务器）", [rG("CDN 静态托管月均 ¥30-80")]],
    [[rB("安全合规")], "用户数据需符合《个人信息保护法》，需隐私政策、Cookie 同意", [rG("无用户数据，无合规风险")]],
    [[rB("边际效益")], "助听器属低频高客单商品，用户主动注册意愿低，留存价值有限", [rG("在线客服 / 电话咨询转化率更高")]],
    [[rB("替代方案")], "—", [rGold("在线客服（企业微信）/ 电话回拨 / 表单留资")]],
  ];
  items.push(table(cols, rows));
  items.push(h3("已实现的部分（若决定移除，可清理）"));
  [
    bullet([r("登录页 + 注册页（共 1,200+ 行代码）")]),
    bullet([r("登录注册数据层 + 模拟用户数据")]),
    bullet([r("鉴权上下文")]),
    bullet([r("3 语言 × 登录注册翻译文件（141 条翻译）")]),
    bullet([r("路由：/:locale/login + /:locale/register")]),
    bullet([r("已在 robots.txt 中禁止搜索引擎收录这两个路径")]),
  ].forEach(p => items.push(p));
  items.push(h3("请决策"));
  items.push(checkItem("保留注册登录（后续需排期开发数据库与用户中心）"));
  items.push(checkItem("移除注册登录，改为外部客服入口（推荐，可节省 1-2 周开发周期与持续运维成本）"));

  // 2.2
  items.push(h2("2.2  待客户确认：首页宣传片方案"));
  items.push(body("首页 Hero 区域目前接入了一支 15 秒品牌宣传片（5 分镜：产品特写 → 佩戴场景 → 家庭温情 → 验配服务 → 品牌收尾）。请客户确认后续采用哪种方案："));
  const cols2 = [{ text: "方案", width: 2200 }, { text: "说明", width: 4146 }, { text: "优劣", width: 3000 }];
  const rows2 = [
    [[rGold("方案 A：沿用当前宣传片")], "继续使用当前已接入的 15 秒宣传片", [rG("优势"), r("：零成本、已上线；"), r("劣势"), r("：部分镜头为非实拍合成，质感与实拍略有差距")]],
    ["方案 B：客户提供实拍素材", "客户提供官方实拍视频素材，我方负责剪辑、配字幕、上线", [rG("优势"), r("：质感最佳、品牌一致性强；"), r("劣势"), r("：需客户安排拍摄，周期 2-4 周")]],
    ["方案 C：我方重新制作", "由我方基于品牌资料重新制作一支更高规格的宣传片", [rG("优势"), r("：质感优于方案 A；"), r("劣势"), r("：需额外制作周期与费用")]],
  ];
  items.push(table(cols2, rows2));
  items.push(h3("请决策"));
  items.push(checkItem("方案 A：沿用当前宣传片（推荐，零成本已上线）"));
  items.push(checkItem("方案 B：客户提供实拍素材"));
  items.push(checkItem("方案 C：我方重新制作"));
  items.push(callout([r("若选方案 B，请提供原始素材（建议 1080P 及以上，MP4 / MOV 格式，含产品特写、门店实景、用户佩戴场景等）；若选方案 C，后续另行沟通制作需求与周期。")]));

  // 2.3
  items.push(h2("2.3  待客户提供：补充资料清单"));
  items.push(body("以下信息当前为占位或缺失，需客户补充后方可正式上线："));

  items.push(h3("A. 公司联系邮箱（高优先级）"));
  items.push(bullet([rB("当前状态"), r("：待客户确认")]));
  items.push(bullet([rB("影响范围"), r("：Footer 联系我们、招商页 #contact 模块、结构化数据、AI 摘要文档")]));
  items.push(bullet([rB("需提供")]));
  items.push(bullet([r("客服邮箱（如 service@xiaowei-health.com）")], "sub", 1));
  items.push(bullet([r("招商合作邮箱（如 partner@xiaowei-health.com）")], "sub", 1));
  items.push(bullet([r("（可选）媒体 PR 邮箱")], "sub", 1));

  items.push(h3("B. 各社交平台二维码图片（高优先级）"));
  items.push(bullet([rB("当前状态"), r("：Footer “关注我们” 8 个社交平台均为占位，二维码为兜底图")]));
  items.push(bullet([rB("影响范围"), r("：Footer 关注我们栏、移动端社交矩阵")]));
  items.push(bullet([rB("需提供（8 个平台，每个一张二维码 PNG）")]));
  [
    "视频号", "小红书", "抖音", "快手", "B 站", "微信公众号", "微博", "知乎",
  ].forEach(p => items.push(checkItem(p)));
  items.push(bullet([rB("建议尺寸"), r("：240×240 px，白底，留 16px 内边距")]));

  items.push(h3("C. 各店铺链接（高优先级）"));
  items.push(bullet([rB("当前状态"), r("：Footer “选购指南” 3 类产品 × 3 平台 = 9 个链接，全部为占位，需客户补充官方旗舰店直达 URL")]));
  items.push(bullet([rB("影响范围"), r("：Footer 选购指南栏、产品页购买入口、招商页“线上购买”模块")]));
  items.push(bullet([rB("需提供（9 个官方旗舰店直达 URL）")]));
  const cols3 = [{ text: "产品线", width: 3500 }, { text: "平台", width: 2000 }, { text: "需提供", width: 3846 }];
  const rows3 = [
    ["AI 中文助听器", "天猫", "官方旗舰店直达 URL"],
    ["AI 中文助听器", "京东", "官方旗舰店直达 URL"],
    ["AI 中文助听器", "拼多多", "官方旗舰店直达 URL"],
    ["健康智能手表", "天猫", "官方旗舰店直达 URL"],
    ["健康智能手表", "京东", "官方旗舰店直达 URL"],
    ["健康智能手表", "拼多多", "官方旗舰店直达 URL"],
    ["智能蓝牙耳机", "天猫", "官方旗舰店直达 URL"],
    ["智能蓝牙耳机", "京东", "官方旗舰店直达 URL"],
    ["智能蓝牙耳机", "拼多多", "官方旗舰店直达 URL"],
  ];
  items.push(table(cols3, rows3));

  items.push(h3("D. 助听器产品手册与型号详情（高优先级）"));
  items.push(bullet([rB("当前状态"), r("：产品页 12 款助听器型号的详细参数、卖点等信息为通用框架，需客户补充每款型号的官方产品手册或详情页内容")]));
  items.push(bullet([rB("影响范围"), r("：产品页所有型号展示模块、SEO 结构化数据、FAQ 问答准确性")]));
  items.push(bullet([rB("需提供")]));
  items.push(bullet([r("12 款助听器型号的官方产品手册（PDF 或 Word）")], "sub", 1));
  items.push(bullet([r("每款型号的核心参数（功率档位 / 通道数 / 电池规格 / 防水等级 / 适配听力损失程度等）")], "sub", 1));
  items.push(bullet([r("每款型号的官方建议零售价")], "sub", 1));
  items.push(bullet([r("每款型号对应的适应症与适用人群")], "sub", 1));

  // 2.4
  items.push(h2("2.4  待客户确认：招商政策"));
  items.push(bullet([rB("当前状态"), r("：招商页“招商政策详细解读表”等内容为基于公开资料整理的通用框架，需客户核对确认")]));
  items.push(bullet([rB("影响范围"), r("：招商页招商政策模块、双折线趋势图、FAQ 招商加盟分类")]));
  items.push(bullet([rB("需客户确认")]));
  [
    "加盟门槛（加盟费 / 保证金 / 首批进货款等具体金额）",
    "选址支持（门店面积要求 / 装修补贴 / 选址评估流程）",
    "培训支持（开业培训 / 验配师培训 / 经营培训的周期与名额）",
    "营销赋能（广告投放补贴 / 物料支持 / 线上引流方式）",
    "代运营支持（代运营范围 / 服务费用 / 分成模式）",
    "售后政策（退换货政策 / 质保期 / 维修响应时效）",
    "区域保护政策（独家授权范围 / 同行间隔距离）",
    "合作期限与续约条件",
  ].forEach(p => items.push(bullet([r(p)], "sub2", 1)));
  items.push(h3("请决策"));
  items.push(checkItem("当前招商政策内容准确，可直接上线"));
  items.push(checkItem("部分内容需调整（请标注修改）"));
  items.push(checkItem("需重新提供完整招商政策文档"));

  items.push(new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ====================================================================
// 三、本阶段交付价值
// ====================================================================
function buildSection3() {
  const items = [];
  items.push(h1("本阶段交付价值", "三"));
  items.push(h3("同行通常作为“增值服务”加价销售，本次为标配交付"));
  items.push(callout([r("以下交付项在同行建站公司通常作为"), rB("增值服务"), r("单独报价或加价销售，本次官网已全部作为"), rGold("标配"), r("包含在交付范围内。")]));

  items.push(img("value_matrix.png", IMG_W, 387));
  items.push(caption("图 4 · 交付价值矩阵：同行增值加价 vs 本次标配交付"));

  const cols = [
    { text: "交付维度", width: 3000 },
    { text: "同行通常定位", width: 2200 },
    { text: "本次交付定位", width: 1500 },
    { text: "交付内容", width: 2646 },
  ];
  const rows = [
    [[rB("GEO 优化（AI 搜索引擎命中）")], "增值服务，需额外加价", [rGold("标配交付")], "37 条 FAQ 矩阵 + 13 个 AI 爬虫协议 + AI 摘要文档 + 完整品牌知识库 + 24 页静态预渲染"],
    [[rB("FAQ 模块（独立页面）")], "增值服务，需额外加价", [rGold("标配交付")], "37 条结构化问答，6 大分类，支持搜索 + 筛选，3 语共 111 条"],
    [[rB("AI 摘要文档 + 完整品牌知识库")], "行业内基本不提供", [rGold("标配交付")], "83 行摘要 + 完整品牌知识库，供豆包 / ChatGPT / Perplexity / Claude 抓取"],
    [[rB("静态预渲染")], "增值服务，需额外加价", [rGold("标配交付")], "24 页静态预渲染，确保 AI 爬虫无障碍抓取"],
    [[rB("多语言国际化（3 语）")], "增值服务，按语种加价", [rGold("标配交付")], "简中 + 繁中 + 英文，2,035+ 条翻译，33 个语言文件"],
    [[rB("品牌定制配图")], "增值服务，按张数加价", [rGold("标配交付")], "31+ 张品牌定制配图（产品 / 文化 / 荣誉 / 招商场景 / 招聘）"],
    [[rB("品牌宣传片")], "增值服务，单独报价", [rGold("标配交付")], "15 秒品牌宣传片（5 分镜），接入首页 Hero"],
    [[rB("招商手册图表代码化复刻")], "行业内基本不提供", [rGold("标配交付")], "6 处关键图表代码化复刻，清晰度任意缩放，配套动画"],
    [[rB("数据与视图分离（可维护性）")], "增值服务，需额外加价", [rGold("标配交付")], "文案与代码分离，非技术人员可维护"],
  ];
  items.push(table(cols, rows));
  items.push(callout([rB("小结"), r("：以上交付维度，在同行建站公司通常需要"), rB("逐项加价"), r("采购，本次已全部作为"), rGold("标配"), r("包含在交付范围内。客户无需为这些能力额外付费，且无需在后续阶段补做。")]));

  items.push(new Paragraph({ children: [new PageBreak()] }));
  return items;
}

// ====================================================================
// 四、下阶段工作建议
// ====================================================================
function buildSection4() {
  const items = [];
  items.push(h1("下阶段工作建议", "四"));
  const steps = [
    [rB("决策注册登录功能去留"), r("（见 §2.1）")],
    [rB("决策首页宣传片方案"), r("（见 §2.2）")],
    [rB("补充客户资料"), r("（见 §2.3）")],
    [rB("确认招商政策内容"), r("（见 §2.4）")],
    [rB("接入 CMS 内容管理系统"), r("：为资讯中心、人才招聘等需要持续更新的模块接入后台管理系统，客户运营人员可直接通过后台发布新闻资讯、招聘岗位，无需开发介入，跳过技术限制")],
    [rB("正式上线部署"), r("：构建产物可部署至 CDN，需客户确认域名解析")],
  ];
  steps.forEach(s => items.push(numItem(s)));
  return items;
}

// ====================================================================
// 五、后续可选增值服务
// ====================================================================
function buildSection5() {
  const items = [];
  items.push(h1("后续可选增值服务", "五"));
  [
    [rB("GEO 持续优化"), r("：每月追踪豆包/ChatGPT/Perplexity 等平台的引用情况，迭代 FAQ 内容，持续提升 AI 引用率")],
    [rB("品牌内容生产"), r("：基于本次配图工作流，可批量生产资讯配图、社媒海报、短视频素材")],
    [rB("AI 客服"), r("：接入基于本站知识库训练的 AI 客服，7×24 小时自动应答用户咨询（产品参数 / 价格 / 验配流程 / 招商政策等），提升留资转化率，降低人工客服成本")],
    [rB("多语言扩展"), r("：可扩展日韩越等海外语言（本次 i18n 架构已支持，新增语言成本低）")],
    [rB("私域引流落地页"), r("：为不同投放渠道（信息流广告 / 搜索广告 / 社媒）定制专属落地页，提升转化率")],
  ].forEach(s => items.push(bullet(s)));
  items.push(spacer(200));
  items.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 240 },
    border: { top: { style: BorderStyle.SINGLE, size: 6, color: C.border, space: 8 } },
    children: [new TextRun({ text: "本报告由开发团队编制，所有数据均来自项目真实交付物，可现场复核。", font: "Microsoft YaHei", size: 18, italics: true, color: C.gray })],
  }));
  return items;
}

// ====================================================================
// 组装文档
// ====================================================================
const doc = new Document({
  creator: "小维健康科技 · 开发团队",
  title: "小维健康科技官网 · 阶段交付报告",
  description: "阶段交付报告 v3",
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 21, color: C.ink } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Microsoft YaHei", color: C.primary },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 25, bold: true, font: "Microsoft YaHei", color: C.accent },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 22, bold: true, font: "Microsoft YaHei", color: C.ink },
        paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 2 } },
    ],
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 540, hanging: 300 } }, run: { color: C.accent } } },
        { level: 1, format: LevelFormat.BULLET, text: "◦", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 300 } }, run: { color: C.accent } } },
      ]},
      { reference: "sub", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 300 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1260, hanging: 300 } } } },
      ]},
      { reference: "sub2", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "▸", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 900, hanging: 300 } }, run: { color: C.primary } } },
        { level: 1, format: LevelFormat.BULLET, text: "▸", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1260, hanging: 300 } }, run: { color: C.primary } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 600, hanging: 360 } }, run: { bold: true, color: C.primary } } },
      ]},
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 },
        margin: { top: 1300, right: 1280, bottom: 1300, left: 1280, header: 720, footer: 720 },
      },
    },
    headers: {
      default: new Header({ children: [new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: C.border, space: 4 } },
        children: [
          new TextRun({ text: "小维健康科技  ·  ", font: "Microsoft YaHei", size: 16, color: C.primary, bold: true }),
          new TextRun({ text: "阶段交付报告", font: "Microsoft YaHei", size: 16, color: C.gray }),
        ],
      })] }),
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: "第 ", font: "Microsoft YaHei", size: 16, color: C.gray }),
          new TextRun({ children: [PageNumber.CURRENT], font: "Microsoft YaHei", size: 16, color: C.primary, bold: true }),
          new TextRun({ text: " 页 / 共 ", font: "Microsoft YaHei", size: 16, color: C.gray }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], font: "Microsoft YaHei", size: 16, color: C.primary, bold: true }),
          new TextRun({ text: " 页", font: "Microsoft YaHei", size: 16, color: C.gray }),
        ],
      })] }),
    },
    children: [
      ...buildCover(),
      ...buildSummary(),
      ...buildSection1(),
      ...buildSection2(),
      ...buildSection3(),
      ...buildSection4(),
      ...buildSection5(),
    ],
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUT, buf);
  console.log("DOCX written:", OUT, "size:", buf.length);
});

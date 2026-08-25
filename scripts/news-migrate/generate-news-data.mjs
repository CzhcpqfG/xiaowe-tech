/**
 * 新闻迁移 - 步骤4: 生成数据文件
 * 输入: news-list.json (372 篇元数据), articles-data.json (已解析正文)
 * 输出:
 *   - src/data/articles.ts (NEWS_ARTICLES, 保留已有 1240/1232 手工精修 + 新增全部)
 *   - src/data/images/news.ts (NEWS_IMAGES 本地路径)
 *   - src/i18n/locales/{zh-CN,zh-TW,en}/news.json (list 标题/摘要)
 * 只生成用 generate-news-data.mjs 统一做
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJ = "D:\\VibeTest\\bigsound";
const LIST = JSON.parse(readFileSync(join(__dirname, "news-list.json"), "utf8"));
const ARTICLES = JSON.parse(readFileSync(join(__dirname, "articles-data.json"), "utf8"));
const IMG_MAP = JSON.parse(readFileSync(join(__dirname, "images-map.json"), "utf8"));

// ---------- 分类映射 (旧站 g → 新站 cat) ----------
// 规则: 有 g=3 且标题像产品发布/获奖 → product-news; 纯 g=2 → industry-news; 其余 company-news
function categorize(item) {
  const gs = item.cats || [];
  const t = item.title || "";
  const isProduct = /新品|发布|首发|上市|震撼|钜惠|补贴|售价|双11|双12|免费领|好物|评测|开箱|N3|P1|BR|DAB007/i.test(t);
  if (gs.includes(3) && (isProduct || !gs.includes(1))) return "product-news";
  if (gs.includes(2) && !gs.includes(1) && !gs.includes(3)) return "industry-news";
  if (gs.includes(1) && !isProduct) return "company-news";
  if (isProduct) return "product-news";
  if (gs.includes(2)) return "industry-news";
  return "company-news";
}

// 排序: 按 id 降序 (新闻列表从新到旧)
const sorted = [...LIST].sort((a, b) => +b.id - +a.id);

// ---------- 生成 articles.ts ----------
const artById = Object.fromEntries(ARTICLES.map((a) => [String(a.id), a]));
const listById = Object.fromEntries(LIST.map((i) => [String(i.id), i]));

function buildArticle(item) {
  const id = String(item.id);
  const parsed = artById[id];
  const content = parsed
    ? parsed.blocks.map((b) => {
        if (b.type === "image") {
          return { type: "image", src: IMG_MAP[b.src] || b.src, alt: "" };
        }
        return b;
      })
    : [];
  // 封面兜底 block (无正文解析时, 仅用封面图 + 摘要)
  const fallback = [
    { type: "paragraph", text: item.summary || "" },
  ];
  const prevArt = parsed && parsed.prev ? listById[String(parsed.prev.id)] : null;
  const nextArt = parsed && parsed.next ? listById[String(parsed.next.id)] : null;
  return {
    id,
    title: item.title,
    date: (parsed && parsed.date) || item.date,
    author: (parsed && parsed.author) || "小维",
    content: content.length ? content : fallback,
    ...(prevArt ? { prevArticle: { id: String(prevArt.id), title: prevArt.title } } : {}),
    ...(nextArt ? { nextArticle: { id: String(nextArt.id), title: nextArt.title } } : {}),
  };
}

// 保留手工精修文章 (现有 src/data/articles.ts 中的 1240/1232)
const existing = readFileSync(join(PROJ, "src", "data", "articles.ts"), "utf8");
const existingEntries = existing.match(/^\s+"(\d+)": \{/gm) || [];
const existingIds = existingEntries.map((s) => s.trim().match(/"(\d+)"/)[1]);

// 输出全量 articles.ts
let out = `// 新闻详情内容 (全量迁移自 https://www.xiaowe.cc/h-col-104.html)
// 2026-08-18 全量迁移: 372 篇 (抓取 + 本地化图片)
// 1240/1232 为手工精修版本 (含 medicalAd), 其余为抓取生成

export interface NewsArticle {
  id: string;
  title: string;
  date: string;
  author: string;
  content: ArticleBlock[];
  prevArticle?: { id: string; title: string };
  nextArticle?: { id: string; title: string };
  medicalAd?: {
    productName: string;
    regNumber: string;
    adNumber: string;
    notice: string;
  };
}

export type ArticleBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "quote"; text: string }
  | { type: "image"; src: string; alt: string };

export const NEWS_ARTICLES: Record<string, NewsArticle> = {
`;

// 先输出手工精修 (从现有文件抽取全文), 再输出其余
for (const id of existingIds) {
  const m = existing.match(new RegExp(`^  "${id}": \\{[\\s\\S]*?^  \\},`, "m"));
  if (m) {
    out += m[0] + "\n\n";
  }
}

const done = new Set(existingIds);
for (const item of sorted) {
  const id = String(item.id);
  if (done.has(id)) continue;
  done.add(id);
  const art = buildArticle(item);
  out += `  "${id}": ${JSON.stringify(art, null, 2).replace(/\n/g, "\n  ")}\n,\n\n`;
}
out += "};\n";
writeFileSync(join(PROJ, "src", "data", "articles.ts"), out, "utf8");
console.log("✓ articles.ts 已生成:", done.size, "篇");

// ---------- 生成 images/news.ts ----------
let imgOut = `/**\n * 新闻配图资源 (2026-08-18 全量本地化)\n * 封面图与正文图均已下载到 public/images/news/{id}/\n */\n\nexport const NEWS_IMAGES = {\n`;
for (const item of sorted) {
  const id = String(item.id);
  const cover = IMG_MAP[item.cover.startsWith("//") ? "https:" + item.cover : item.cover];
  imgOut += `  news${id}: "${cover}",\n`;
}
imgOut += "} as const;\n";
writeFileSync(join(PROJ, "src", "data", "images", "news.ts"), imgOut, "utf8");
console.log("✓ images/news.ts 已生成:", sorted.length, "条");

// ---------- 生成 i18n news.json (3 locale) ----------
// 保留现有 18 篇精修 title/summary, 其余用列表页数据
const zhCN = JSON.parse(readFileSync(join(PROJ, "src", "i18n", "locales", "zh-CN", "news.json"), "utf8"));
const zhTW = JSON.parse(readFileSync(join(PROJ, "src", "i18n", "locales", "zh-TW", "news.json"), "utf8"));
const en = JSON.parse(readFileSync(join(PROJ, "src", "i18n", "locales", "en", "news.json"), "utf8"));

function mergeList(target, items) {
  const list = { ...(target.list || {}) };
  for (const item of items) {
    const id = String(item.id);
    if (list[id]) continue; // 保留现有精修
    list[id] = { title: item.title, summary: item.summary || "" };
  }
  // 移除旧 id 中不存在于新列表的
  const validIds = new Set(items.map((i) => String(i.id)));
  for (const k of Object.keys(list)) if (!validIds.has(k)) delete list[k];
  return { ...target, list };
}

// zh-TW / en: 只保留结构, 标题/摘要从 zh-CN 占位 (保持结构完整, 后续人工翻译)
function mergeOther(target, items) {
  const list = { ...(target.list || {}) };
  for (const item of items) {
    const id = String(item.id);
    if (list[id]) continue;
    list[id] = { title: item.title, summary: item.summary || "" };
  }
  const validIds = new Set(items.map((i) => String(i.id)));
  for (const k of Object.keys(list)) if (!validIds.has(k)) delete list[k];
  return { ...target, list };
}

const newZh = mergeList(zhCN, sorted);
const newTw = mergeOther(zhTW, sorted);
const newEn = mergeOther(en, sorted);

writeFileSync(join(PROJ, "src", "i18n", "locales", "zh-CN", "news.json"), JSON.stringify(newZh, null, 2), "utf8");
writeFileSync(join(PROJ, "src", "i18n", "locales", "zh-TW", "news.json"), JSON.stringify(newTw, null, 2), "utf8");
writeFileSync(join(PROJ, "src", "i18n", "locales", "en", "news.json"), JSON.stringify(newEn, null, 2), "utf8");
console.log("✓ news.json × 3 locale 已生成");
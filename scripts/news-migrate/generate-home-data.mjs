/**
 * 生成 home.ts 的 NEWS_LIST + NEWS_CATEGORY_MAP
 * 替换 home.ts 中从 "export const NEWS_LIST" 到 "export const NEWS_TOTAL_PAGES" 的段落
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJ = "D:\\VibeTest\\bigsound";
const LIST = JSON.parse(readFileSync(join(__dirname, "news-list.json"), "utf8"));

// 分类规则与 generate-news-data.mjs 保持一致
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

const sorted = [...LIST].sort((a, b) => +b.id - +a.id);

// NEWS_LIST 段落
let newsList = `export const NEWS_LIST: NewsListItem[] = [\n`;
for (const item of sorted) {
  const date = (item.date || "").split(" ")[0];
  newsList += `  { id: "${item.id}", date: "${date}", imageKey: "news${item.id}" as const },\n`;
}
newsList += `];\n`;

// NEWS_CATEGORY_MAP 段落
const mapLines = sorted.map((item) => {
  const cat = categorize(item);
  const shortTitle = (item.title || "").length > 26 ? item.title.slice(0, 26) + "…" : item.title || "";
  return `  "${item.id}": "${cat}", // ${shortTitle}`;
});

const homeSrc = readFileSync(join(PROJ, "src", "data", "home.ts"), "utf8");
// 替换区间: 从 "export const NEWS_LIST" 到 "export const NEWS_TOTAL_PAGES = 48;"
const startMarker = "export const NEWS_LIST: NewsListItem[] = [";
const endMarker = "export const NEWS_TOTAL_PAGES = 48;";
const startIdx = homeSrc.indexOf(startMarker);
const endIdx = homeSrc.indexOf(endMarker);
if (startIdx === -1 || endIdx === -1) {
  console.error("✗ 未找到替换区间");
  process.exit(1);
}
const endOfEnd = homeSrc.indexOf(";", endIdx) + 1;

const replacement = `${newsList}

/**
 * 新闻分类映射 (id -> category slug)
 *
 * 分类原则 (基于文章内容性质):
 *   - company-news (公司新闻): 公司动态/合作签约/领导视察/展会亮相/公益行动
 *   - product-news (产品资讯): 新品发布/产品获奖/产品入驻平台
 *   - industry-news (行业资讯): 行业会议/政策平台/服务案例/科普知识
 *
 * 2026-08-18 全量迁移: 372 篇 (旧站 g 值 1=公司新闻/2=听力科普/3=产品资讯)
 */
export const NEWS_CATEGORY_MAP: Record<string, string> = {
${mapLines.join(",\n")}
};

/** 新闻总页数 (原网站带分页,共 48 页; 全量迁移 372 篇后保留常量, 列表页当前全量渲染不分页) */
export const NEWS_TOTAL_PAGES = 48;`;

const newSrc = homeSrc.slice(0, startIdx) + replacement + homeSrc.slice(endOfEnd);
writeFileSync(join(PROJ, "src", "data", "home.ts"), newSrc, "utf8");
console.log("✓ home.ts 已更新: NEWS_LIST", sorted.length, "条, NEWS_CATEGORY_MAP", mapLines.length, "条");
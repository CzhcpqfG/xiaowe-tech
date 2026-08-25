/**
 * 新闻迁移 - 步骤2: 解析详情页 HTML → 结构化数据
 * 用法: node parse-news-html.mjs
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HTML_DIR = join(__dirname, "news-html");
const LIST = JSON.parse(readFileSync(join(__dirname, "news-list.json"), "utf8"));
const listById = Object.fromEntries(LIST.map((i) => [String(i.id), i]));

function htmlToText(html) {
  return (html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|blockquote|section|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ldquo;|&rdquo;|\\u201C|\\u201D/g, '"')
    .replace(/&middot;/g, "·")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s) {
  return s
    .replace(/\\u201C/g, "“").replace(/\\u201D/g, "”")
    .replace(/\\u2018/g, "‘").replace(/\\u2019/g, "’")
    .replace(/\\n/g, " ").replace(/\\\//g, "/")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .trim();
}

/** 把正文 HTML (jz_fix_ue_img 内容) 转成 ArticleBlock[] */
function htmlToBlocks(raw) {
  const blocks = [];
  let html = raw;

  // 微信 profile 卡片 → 替换为引用块 (支持自闭合与成对两种)
  html = html.replace(/<mp-common-profile[^>]*?data-nickname="([^"]*)"[^>]*?\/?>(?:[\s\S]*?<\/mp-common-profile>)?/g, (m, nick) => {
    return `<blockquote>欢迎关注公众号：${decodeEntities(nick)}</blockquote>`;
  });
  // mp 占位标签清理
  html = html.replace(/<mp-common-[^>]+>[\s\S]*?<\/mp-common-[^>]+>/g, "");

  // 先剥离独立 blockquote (避免被外层 section 吞掉)
  const quotes = [];
  html = html.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (m, inner) => {
    const t = htmlToText(inner);
    if (t) quotes.push({ type: "quote", text: t });
    return "";
  });

  // 简易 DOM 扫描: 依次取出顶层元素 (p/section/ul/ol/blockquote/img/h1-h6/div)
  let rest = html;
  const tagRe = /<(p|section|ul|ol|blockquote|img|h[1-6]|div|figure)\b[^>]*>[\s\S]*?<\/\1\s*>|<img\b[^>]*\/?>/gi;
  let m;
  while ((m = tagRe.exec(rest)) !== null) {
    const el = m[0];
    const tag = m[1] || "img";
    if (tag === "img") {
      const src = el.match(/src="([^"]+)"/);
      if (src) {
        let u = decodeEntities(src[1]);
        u = u.startsWith("//") ? "https:" + u : u;
        blocks.push({ type: "image", src: u, alt: "" });
      }
      continue;
    }
    if (tag === "blockquote") continue; // 已在上面剥离
    if (tag === "ul" || tag === "ol") {
      const items = [];
      const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let li;
      while ((li = liRe.exec(el)) !== null) {
        const t = htmlToText(li[1]);
        if (t) items.push(t);
      }
      if (items.length) blocks.push({ type: "list", items });
      continue;
    }
    if (/^h[1-6]$/.test(tag)) {
      const t = htmlToText(el);
      if (t && t.length <= 120) blocks.push({ type: "heading", text: t });
      else if (t) blocks.push({ type: "paragraph", text: t });
      continue;
    }
    // p / section / div / figure: 提取内部文本与图片
    const innerImgs = [...el.matchAll(/<img[^>]*src="([^"]+)"/g)].map((mm) => {
      let u = decodeEntities(mm[1]);
      u = u.startsWith("//") ? "https:" + u : u;
      return u;
    });
    // 判断是否"标题行": 短文本且含加粗/大字号标记
    const isBold = /font-weight:\s*bold|<b>|<strong>|font-size:\s*(18|20|22|24|26|28)/i.test(el);
    const t = htmlToText(el).replace(/\n+/g, "\n").split("\n").map((x) => x.trim()).filter(Boolean);
    if (innerImgs.length) {
      for (const u of innerImgs) blocks.push({ type: "image", src: u, alt: "" });
    }
    for (const line of t) {
      if (!line) continue;
      const isShort = line.length <= 40;
      const looksHeading = /^[【\[\]·0-9、\s]|^[一二三四五六七八九十]+[、.]|^第.+[章节]/.test(line);
      if (isShort && (isBold || looksHeading)) {
        blocks.push({ type: "heading", text: line });
      } else {
        blocks.push({ type: "paragraph", text: line });
      }
    }
  }
  // 合并相邻 paragraph? 保留原样。过滤空。
  const result = quotes.concat(blocks);
  return result.filter((b) => {
    if (b.type === "paragraph") return !!b.text;
    if (b.type === "list") return b.items.length > 0;
    return true;
  });
}

function parseFile(id) {
  const file = join(HTML_DIR, id + ".html");
  if (!existsSync(file)) return null;
  const h = readFileSync(file, "utf8");
  if (!h.includes("__INITIAL_STATE__")) return null;

  const listMeta = listById[id] || {};

  // 标题: 页面 h1
  const titleM = h.match(/<h1 class="news_detail_title">([\s\S]*?)<\/h1>/);
  const title = titleM ? htmlToText(titleM[1]) : listMeta.title || "";

  // 日期/作者
  let date = listMeta.date || "";
  let author = "小维";
  const infoM = h.match(/<div class="news_detail_info_left">([\s\S]*?)<\/div>/);
  if (infoM) {
    const spans = [...infoM[1].matchAll(/news_detail_info_item">([\s\S]*?)<\/span>/g)].map((mm) => htmlToText(mm[1]));
    if (spans[0]) date = spans[0].trim();
    if (spans[1]) author = spans[1];
  }

  // 正文
  let blocks = [];
  const bodyStart = h.indexOf('class="jz_fix_ue_img"');
  if (bodyStart !== -1) {
    // 找到 jz_fix_ue_img 的完整闭合: 从 start 开始配对 <div>
    const openIdx = h.lastIndexOf("<div", bodyStart);
    let depth = 0;
    let i = openIdx;
    let end = -1;
    for (let j = openIdx; j < h.length; j++) {
      if (h.startsWith("<div", j)) depth++;
      else if (h.startsWith("</div>", j)) {
        depth--;
        if (depth === 0) { end = j + 6; break; }
      }
    }
    const raw = end > 0 ? h.slice(openIdx + 5, end - 6) : "";
    blocks = htmlToBlocks(raw);
  }

  // 上一篇/下一篇
  let prev = null, next = null;
  const prevM = h.match(/news_pagenation_prev[\s\S]*?href="https:\/\/www\.xiaowe\.cc\/sys-nd\/(\d+)\.html"[^>]*>([\s\S]*?)<\/a>/);
  const nextM = h.match(/news_pagenation_next[\s\S]*?href="https:\/\/www\.xiaowe\.cc\/sys-nd\/(\d+)\.html"[^>]*>([\s\S]*?)<\/a>/);
  if (prevM) prev = { id: prevM[1], title: htmlToText(prevM[2]) };
  if (nextM) next = { id: nextM[1], title: htmlToText(nextM[2]) };

  return { id, title, date, author, blocks, prev, next, listMeta };
}

const files = readdirSync(HTML_DIR).filter((f) => f.endsWith(".html"));
const out = [];
let noBody = 0, emptyBlocks = 0;
for (const f of files) {
  const id = f.replace(".html", "");
  const art = parseFile(id);
  if (!art) continue;
  if (!art.blocks.length) emptyBlocks++;
  if (!art.title) noBody++;
  out.push(art);
}
out.sort((a, b) => +b.id - +a.id);
writeFileSync(join(__dirname, "articles-data.json"), JSON.stringify(out, null, 1), "utf8");
console.log("解析完成:", out.length, "篇 (", files.length, "个 HTML )");
console.log("空正文:", emptyBlocks, "无标题:", noBody);
const totalBlocks = out.reduce((s, a) => s + a.blocks.length, 0);
console.log("总 block 数:", totalBlocks, "均:", Math.round(totalBlocks / out.length));

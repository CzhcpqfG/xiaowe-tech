/**
 * 新闻迁移 - 步骤3: 下载图片到本地
 * - 封面图: public/images/news/{id}/cover.{ext}  (372 张)
 * - 正文图: public/images/news/{id}/img-01.{ext} ...
 * 生成 images-map.json: 原 URL → 本地相对路径
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = "D:\\VibeTest\\bigsound\\public\\images\\news";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const LIST = JSON.parse(readFileSync(join(__dirname, "news-list.json"), "utf8"));
const ARTICLES = JSON.parse(readFileSync(join(__dirname, "articles-data.json"), "utf8"));

function extOf(url) {
  const clean = url.split("?")[0].split("#")[0];
  // 去掉 faiusr 尺寸变体 !xxx 后缀 (原图 URL 才有变体后缀问题)
  let e = extname(clean);
  if (!e || e.length > 5) e = ".jpg";
  return e.toLowerCase();
}

async function download(url, destPath) {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://www.xiaowe.cc/" } });
    if (!res.ok) throw new Error("HTTP " + res.status);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(destPath, buf);
    return true;
  } catch (e) {
    return { url, err: String(e) };
  }
}

// 需要下载的对: [{url, dest}]
const tasks = [];
const map = {}; // url -> 相对路径

// 1. 封面图
for (const item of LIST) {
  const url = item.cover.startsWith("//") ? "https:" + item.cover : item.cover;
  const dir = join(OUT_DIR, String(item.id));
  mkdirSync(dir, { recursive: true });
  const dest = join(dir, "cover" + extOf(url));
  tasks.push({ url, dest });
  map[url] = "images/news/" + item.id + "/cover" + extOf(url);
}

// 2. 正文图 (每篇顺序编号)
for (const art of ARTICLES) {
  const dir = join(OUT_DIR, String(art.id));
  mkdirSync(dir, { recursive: true });
  let n = 1;
  for (const b of art.blocks) {
    if (b.type === "image") {
      const url = b.src;
      const dest = join(dir, "img-" + String(n).padStart(2, "0") + extOf(url));
      tasks.push({ url, dest });
      map[url] = "images/news/" + art.id + "/img-" + String(n).padStart(2, "0") + extOf(url);
      n++;
    }
  }
}

console.log("待下载:", tasks.length, "张");

// 并发下载 (CDN 不限制, 用 10 并发)
const failures = [];
let done = 0;
const concurrency = 10;
const queue = [...tasks];
async function worker() {
  while (queue.length) {
    const t = queue.shift();
    const r = await download(t.url, t.dest);
    if (r !== true) failures.push(r);
    done++;
    if (done % 50 === 0) console.log("  progress", done + "/" + tasks.length);
  }
}
await Promise.all(Array.from({ length: concurrency }, worker));
console.log("下载完成: 成功", done - failures.length, "失败", failures.length);
if (failures.length) {
  writeFileSync(join(__dirname, "image-failures.json"), JSON.stringify(failures, null, 2), "utf8");
  console.log("失败明细 → image-failures.json");
}
writeFileSync(join(__dirname, "images-map.json"), JSON.stringify(map, null, 1), "utf8");
console.log("映射表 → images-map.json (" + Object.keys(map).length + " 条)");

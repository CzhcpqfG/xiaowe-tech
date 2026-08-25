/**
 * Playwright 预渲染脚本 (GEO 关键)
 *
 * 用途:
 *   - vite build 后, 启动 vite preview, 用 Playwright 访问每个路由
 *   - 等待 React 渲染 + JSON-LD 注入完成, 提取完整 HTML
 *   - 保存到 dist/{locale}/{path}/index.html, 让 AI 爬虫不执行 JS 也能看到内容
 *
 * 触发方式:
 *   - pnpm build 自动调用 postbuild 钩子 (package.json)
 *   - 或手动: npx tsx scripts/prerender.ts
 *
 * Stage SEO/GEO E
 */
import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, writeFile, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PRODUCTS } from "../src/data/product";
import { PRERENDER_NEWS_IDS, NEWS_CATEGORY_TAGS } from "./news-prerender-set";

// 指定 Playwright 浏览器安装位置 (避免沙箱限制写入 AppData)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, "..");
process.env.PLAYWRIGHT_BROWSERS_PATH = join(PROJECT_ROOT, ".playwright-browsers");

// 动态引入 playwright (确保 env 已设置)
const { chromium } = await import("playwright");
type Browser = Awaited<ReturnType<typeof chromium.launch>>;
type Page = Awaited<ReturnType<Browser["newPage"]>>;

const DIST_DIR = join(PROJECT_ROOT, "dist");
const PREVIEW_PORT = 4173;
const PREVIEW_URL = `http://localhost:${PREVIEW_PORT}`;
// 与 vite.config.ts 的 base 保持一致: 根路径部署 (阿里云 + www.xiaowe.cc)
const BASE_PATH = "/";

/** 待预渲染的路由列表 (3 locale × 8 主路由 + 产品详情动态) */
const LOCALES = ["zh-CN", "zh-TW", "en"] as const;
const STATIC_PATHS = [
  "",
  "about",
  "product",
  "wearable",
  "invest",
  "careers",
  "news",
  "faq",
];

/**
 * 产品详情 slug 列表 (有详情页的上架产品, 从数据源派生避免漂移)
 * 2026-08-16 新增: 动态路由 /product/:slug 纳入预渲染, 让 AI 爬虫可抓取产品详情页
 */
const PRODUCT_DETAIL_SLUGS: readonly string[] = PRODUCTS.filter(
  (p) => p.detailImages?.length && p.slug && p.isListed
).map((p) => p.slug as string);

/**
 * 新闻详情预渲染范围 (2026-08-18 N3 对齐后)
 * 集合来自共享模块 news-prerender-set.ts, 与 sitemap 选择逻辑同源:
 *   - 全局最新 30 篇 ∪ 每分类最新 10 篇 (确保 industry/company/product 三类都有静态覆盖)
 *   - sitemap 保持全量 372 篇 (Google 可渲染 SPA 兜底)
 * 其余详情由 404.html SPA 兜底渲染, 不影响真实用户
 */
const NEWS_DETAIL_IDS: readonly string[] = PRERENDER_NEWS_IDS;

/** 启动 vite preview */
function startPreviewServer(): Promise<ChildProcess> {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(
      "npx",
      ["vite", "preview", "--port", String(PREVIEW_PORT), "--strictPort"],
      {
        cwd: PROJECT_ROOT,
        shell: process.platform === "win32",
        stdio: "pipe",
      }
    );

    child.stdout?.on("data", (data: Buffer) => {
      const msg = data.toString();
      process.stdout.write(`[preview] ${msg}`);
      if (msg.includes("Local:") || msg.includes("running")) {
        resolveP(child);
      }
    });
    child.stderr?.on("data", (data: Buffer) => {
      process.stderr.write(`[preview err] ${data}`);
    });
    child.on("error", (err) => rejectP(err));

    // 8s 超时兜底
    setTimeout(() => resolveP(child), 8000);
  });
}

/** 端口占用时, 杀掉占用进程 (Windows) */
async function killPortInUse(port: number) {
  if (process.platform !== "win32") return;
  try {
    const { execSync } = await import("node:child_process");
    const out = execSync(
      `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`,
      { stdio: "pipe" }
    );
    console.log(`[port] 清理端口 ${port} 占用: ${out.toString().trim()}`);
  } catch {
    // 端口无占用, 忽略
  }
}

/** 等待页面就绪: React 渲染 + react-helmet 注入完成 */
async function waitPageReady(page: Page, route: string) {
  // 等 #root 有内容
  await page.waitForFunction(
    () => {
      const root = document.getElementById("root");
      return root && root.children.length > 0;
    },
    { timeout: 15000 }
  );
  // 等 react-helmet 注入 <title> (SEO 关键)
  await page.waitForFunction(
    () => {
      const title = document.title;
      return title && title.length > 0;
    },
    { timeout: 15000 }
  );
  // 等 JSON-LD 脚本注入 (GEO 关键, 但允许降级)
  try {
    await page.waitForFunction(
      () => {
        const scripts = document.querySelectorAll(
          'script[type="application/ld+json"]'
        );
        return scripts.length > 0;
      },
      { timeout: 8000 }
    );
  } catch {
    console.warn("    ⚠ JSON-LD 未检测到, 降级继续 (页面仍有 SEO title)");
  }

  // 新闻详情页: 等待文章分片异步加载完成 (data-article-state=ready)
  // 2026-08-18 分片优化后, 文章正文通过动态 import 加载, 需要额外等待
  const isNewsDetail = /\/news\/\d+$/.test(route);
  if (isNewsDetail) {
    try {
      await page.waitForFunction(
        () => {
          const article = document.querySelector('[data-article-state]');
          if (!article) return true; // 文章元素未渲染 (异常降级)
          return article.getAttribute("data-article-state") !== "loading";
        },
        { timeout: 20000 }
      );
      // 额外等 300ms 让正文 DOM 稳定
      await page.waitForTimeout(300);
    } catch {
      console.warn("    ⚠ 文章加载超时, 降级继续");
    }
  }

  // 额外等待 500ms, 让所有 effect 跑完 (含图片懒加载触发)
  await page.waitForTimeout(500);
}

/** 渲染单一路由 → 保存到 dist/{locale}/{path}/index.html */
async function prerenderRoute(
  browser: Browser,
  route: string,
  outDir: string
) {
  // 移动视口预渲染 (390x844, iPhone 12/13/14 逻辑分辨率):
  // Layout.useAdaptWidth 以 1024px 为界输出两套 DOM — 桌面 scale wrapper / 移动直渲染。
  // 若用默认桌面视口预渲染, 静态 HTML 是桌面结构, 移动端 hydration 后 isMobile 翻转
  // 触发整树切换 → 整页位移 ~61px, 实测贡献 product 页 CLS 0.479 (2026-08-22 trace 定位)。
  // mobile-first: 预渲染移动版让多数真实流量首屏即最终结构; Googlebot 也以移动端为主。
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  });
  const pageErrors: string[] = [];
  const consoleMsgs: string[] = [];

  // 捕获页面错误
  page.on("pageerror", (err) => pageErrors.push(`[pageerror] ${err.message}`));
  page.on("console", (msg) => {
    const type = msg.type();
    if (type === "error" || type === "warning") {
      consoleMsgs.push(`[${type}] ${msg.text()}`);
    }
  });

  try {
    const url = `${PREVIEW_URL}${BASE_PATH}${route}`;
    console.log(`  → 渲染: ${url}`);
    // 用 domcontentloaded 替代 networkidle, 避免 404 资源导致永远无法 idle
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await waitPageReady(page, route);

    const html = await page.content();
    const targetDir = join(DIST_DIR, outDir);
    await mkdir(targetDir, { recursive: true });
    await writeFile(join(targetDir, "index.html"), html, "utf-8");
    console.log(`    ✓ ${outDir}/index.html (${(html.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`    ✗ 渲染失败: ${route}`, err);
    if (pageErrors.length) {
      console.error("    页面错误:");
      pageErrors.forEach((e) => console.error(`      ${e}`));
    }
    if (consoleMsgs.length) {
      console.error("    控制台警告/错误:");
      consoleMsgs.slice(0, 5).forEach((m) => console.error(`      ${m}`));
    }
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("\n======== Playwright 预渲染开始 ========\n");

  // 检查 dist 目录
  if (!existsSync(DIST_DIR)) {
    console.error(`✗ dist 目录不存在: ${DIST_DIR}`);
    console.error("  请先运行 `pnpm build` 再运行本脚本");
    process.exit(1);
  }

  // 启动 preview server
  console.log(`启动 vite preview (${PREVIEW_URL}) ...`);
  await killPortInUse(PREVIEW_PORT);
  const server = await startPreviewServer();
  // 等服务器确实就绪
  await new Promise((r) => setTimeout(r, 2000));

  const browser = await chromium.launch({ headless: true });

  try {
    // 渲染所有 locale × 静态路由
    let count = 0;
    for (const locale of LOCALES) {
      console.log(`\n--- Locale: ${locale} ---`);
      for (const path of STATIC_PATHS) {
        const route = path ? `${locale}/${path}` : locale;
        const outDir = route;
        await prerenderRoute(browser, route, outDir);
        count++;
      }
    }

    // 产品详情动态路由预渲染 (2026-08-16 新增, GEO: 长尾转化主入口)
    for (const locale of LOCALES) {
      for (const slug of PRODUCT_DETAIL_SLUGS) {
        const route = `${locale}/product/${slug}`;
        await prerenderRoute(browser, route, route);
        count++;
      }
    }

    // 新闻详情动态路由预渲染 (2026-08-18 N3 对齐后, 均衡子集; GEO: 列表页爬虫落点)
    for (const locale of LOCALES) {
      for (const id of NEWS_DETAIL_IDS) {
        const route = `${locale}/news/${id}`;
        await prerenderRoute(browser, route, route);
        count++;
      }
    }

    // 资讯分类页预渲染 (2026-08-18 N4 新增, canonical 指向分类根, sitemap 收录)
    for (const locale of LOCALES) {
      for (const tag of NEWS_CATEGORY_TAGS) {
        const route = `${locale}/news/category/${tag}`;
        await prerenderRoute(browser, route, route);
        count++;
      }
    }

    console.log(`\n======== 预渲染完成: ${count} 个页面 ========\n`);

    // 复制 index.html 到 404.html, 作为 GitHub Pages 的 SPA 404 兜底
    // 当访问未预渲染的路径 (如 /zh-CN/login, /zh-CN/news/123) 时, GitHub Pages 会返回 404
    // 通过 404.html 加载 SPA, 让 react-router 接管路由
    const indexHtmlPath = join(DIST_DIR, "index.html");
    const notFoundHtmlPath = join(DIST_DIR, "404.html");
    if (existsSync(indexHtmlPath)) {
      await copyFile(indexHtmlPath, notFoundHtmlPath);
      console.log(`✓ 已生成 404.html (SPA 兜底) → ${notFoundHtmlPath}\n`);
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch((err) => {
  console.error("预渲染异常:", err);
  process.exit(1);
});

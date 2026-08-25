import { useMemo } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import Reveal from "../components/ui/Reveal";
import SEO from "../components/SEO";
import {
  SITE_ORIGIN,
  getCollectionPageSchema,
  getBreadcrumbSchema,
} from "../config/schema";
import {
  NEWS_LIST,
  NEWS_CATEGORIES,
  NEWS_CATEGORY_MAP,
} from "../data/content";
import {
  newsDetailPath,
  newsPath,
  newsCategoryPath,
  ROUTE_PARAMS,
} from "../routes/paths";
import { useLocale } from "../i18n/useLocale";
import type { Locale } from "../i18n/types";

/** Tab 切换时按钮样式 (与 ProductPage 同款, 无圆角 + border 朴素风格) */
const TAB_ACTIVE = "bg-brand-green-light text-white border-brand-green-light";
const TAB_INACTIVE =
  "bg-transparent text-ink-800 hover:text-brand-green-light border-ink-200";

/** 每页新闻条数 (旧站 48 页 ÷ 372 篇 ≈ 8 篇/页偏碎, 取 18 平衡页面充实度与页数) */
const NEWS_PER_PAGE = 18;

/* ============================================================
   单条新闻列表项 - 1:1 复刻 xiaowe.cc 资讯页新闻列表项
   xiaowe.cc 真实布局 (实测):
     列表项 547×269, padding 30px, 2列网格 (无 gap)
     内部 flex: 图片 185×109 + marginRight 30 + 内容 272×185
     内容:
       header (flex items-start): 标题 166×96 (16px #000 400 lh=24px) + 日期 76×24 (14px #999 lh=24px)
       摘要 272×24 (14px #666 lh=23.8px, 1行截断)
       分类标签 65×27 (12px #999 lh=18px, inline-flex)
   ============================================================ */
function NewsListItem({
  news,
  category,
  locale,
}: {
  news: (typeof NEWS_LIST)[number];
  category: string;
  locale: Locale;
}) {
  const { t } = useTranslation("news");
  const title = t(`list.${news.id}.title`);
  const summary = t(`list.${news.id}.summary`);
  return (
    <Link
      to={newsDetailPath(locale, news.id)}
      className="group block p-[16px] sm:p-[20px] lg:p-[30px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
    >
      <div className="flex">
        {/* 图片 - 移动端 120×80 / 桌面端 185×109, hover 轻微放大
            缩略图: scripts/generate-news-thumbs.ts 生成 480px webp (~10KB),
            原图 1200px (~27KB) 仅详情页使用; slow-4G 下避免列表排队挤占 LCP 带宽 */}
        <div className="overflow-hidden shrink-0 w-[120px] h-[80px] sm:w-[150px] sm:h-[90px] lg:w-[185px] lg:h-[109px]">
          <img
            src={`/images/news/thumbs/${news.id}.webp`}
            alt={title}
            width={370}
            height={218}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
          />
        </div>
        {/* 内容, marginLeft 30 */}
        <div className="flex flex-col ml-[16px] sm:ml-[20px] lg:ml-[30px] flex-1 min-w-0 lg:w-[272px]">
          {/* header: 标题 + 日期, items-start 顶部对齐
              移动端: 标题占满, 日期显示在标题下方; 桌面端: 同行 */}
          <div className="flex items-start mb-[12px] lg:mb-[18px] flex-col lg:flex-row lg:items-start">
            <h4 className="text-[14px] sm:text-[15px] lg:text-[16px] text-ink-900 font-normal leading-[20px] lg:leading-[24px] group-hover:text-brand-green transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] line-clamp-2 lg:line-clamp-none">
              {title}
            </h4>
            <span className="text-[12px] lg:text-[14px] text-ink-400 font-normal leading-[18px] lg:leading-[24px] lg:ml-[30px] shrink-0 mt-[4px] lg:mt-0 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
              {news.date}
            </span>
          </div>
          {/* 摘要 14px ink-500 lh=23.8px, 2行截断 (移动端) / 1行截断 (桌面端) */}
          <p className="text-[13px] lg:text-[14px] text-ink-500 leading-[20px] lg:leading-[23.8px] overflow-hidden line-clamp-2 lg:line-clamp-1 mb-[8px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-ink-700">
            {summary}
          </p>
          {/* 分类标签 12px ink-400 65×27 - hover 变绿 */}
          <div>
            <span
              className="inline-flex items-center justify-center text-[12px] text-ink-400 leading-[18px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green px-[6px]"
              style={{ height: "27px" }}
            >
              {t(`category.${category}.label`)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================
   分页条 - 朴素风格 (上一页 / 页码窗口 / 下一页)
   URL 参数: m441page=N (沿用旧站参数名, 见 paths.ts ROUTE_PARAMS)
   规则:
     - 首页 = 第 1 页 (无分页参数, 保证 canonical 干净)
     - 页码窗口: 当前页前后各 2 页 + 首尾页 + 省略号
   ============================================================ */
function Pagination({
  total,
  current,
  baseTo,
}: {
  total: number;
  current: number;
  /** 页码 → 路径 (locale-aware, 第 1 页返回无参数路径) */
  baseTo: (page: number) => string;
}) {
  const { t } = useTranslation("news");
  if (total <= 1) return null;

  const pages: Array<number | "…"> = [];
  const WINDOW = 2;
  for (let i = 1; i <= total; i++) {
    if (
      i === 1 ||
      i === total ||
      (i >= current - WINDOW && i <= current + WINDOW)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  const pageBtnCls = (active: boolean) =>
    `flex items-center justify-center min-w-[40px] h-[40px] px-[12px] border text-[14px] font-bold transition-colors duration-300 ${
      active
        ? "bg-brand-green-light text-white border-brand-green-light"
        : "bg-white text-ink-700 border-ink-200 hover:text-brand-green hover:border-brand-green"
    }`;

  return (
    <nav
      className="flex items-center justify-center gap-[8px] mt-[40px] lg:mt-[48px]"
      aria-label={t("paginationAria", { defaultValue: "分页导航" })}
    >
      {/* 上一页 */}
      {current > 1 ? (
        <Link
          to={baseTo(current - 1)}
          className={pageBtnCls(false)}
          aria-label={t("prevPage", { defaultValue: "上一页" })}
        >
          ‹
        </Link>
      ) : (
        <span
          className={`${pageBtnCls(false)} opacity-40 pointer-events-none`}
          aria-hidden
        >
          ‹
        </span>
      )}

      {/* 页码窗口 */}
      {pages.map((p, idx) =>
        p === "…" ? (
          <span
            key={`e-${idx}`}
            className="px-[8px] text-[14px] text-ink-400 select-none"
          >
            …
          </span>
        ) : (
          <Link
            key={p}
            to={baseTo(p)}
            className={pageBtnCls(p === current)}
            aria-current={p === current ? "page" : undefined}
          >
            {p}
          </Link>
        ),
      )}

      {/* 下一页 */}
      {current < total ? (
        <Link
          to={baseTo(current + 1)}
          className={pageBtnCls(false)}
          aria-label={t("nextPage", { defaultValue: "下一页" })}
        >
          ›
        </Link>
      ) : (
        <span
          className={`${pageBtnCls(false)} opacity-40 pointer-events-none`}
          aria-hidden
        >
          ›
        </span>
      )}
    </nav>
  );
}

/* ============================================================
   NewsListPage - 资讯中心列表页
   数据源: PROTOTYPE_PAGES.md §八 资讯中心 + §十二 Hero 设计

   同时承载两个路由:
     - /news                 默认 Tab (公司新闻)
     - /news/category/:tag   按 Tab 筛选归档 (独立 URL, 可被搜索引擎索引)

   Tab 与 URL 同步 (2026-08-18 N2/N4):
     - 点击 Tab → navigate 到对应分类路径 (公司新闻 = /news, 其余 = /news/category/:tag)
     - URL 含 :tag 时定位对应 Tab; 非法 tag 回退默认 Tab
     - 分页参数 m441page=N (URL query), 切 Tab 重置到第 1 页
     - canonical 随分类动态化; 分页页 canonical 指向第 1 页 (避免分页重复收录)
   ============================================================ */
function NewsListPage() {
  const { tag } = useParams<{ tag: string }>();
  const { locale } = useLocale();
  const { t } = useTranslation("news");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 当前分类: URL :tag 合法则用之, 否则默认 Tab (公司新闻)
  const activeCategory =
    tag && (NEWS_CATEGORIES as readonly string[]).includes(tag)
      ? tag
      : NEWS_CATEGORIES[0];

  // 分页: 从 m441page 参数解析, clamp 到合法范围
  const pageParam = Number(searchParams.get(ROUTE_PARAMS.NEWS_PAGE));
  const requestedPage =
    Number.isFinite(pageParam) && pageParam >= 1 ? Math.floor(pageParam) : 1;

  // 按分类筛选
  const filteredNews = useMemo(
    () => NEWS_LIST.filter((n) => NEWS_CATEGORY_MAP[n.id] === activeCategory),
    [activeCategory],
  );

  const totalPages = Math.max(1, Math.ceil(filteredNews.length / NEWS_PER_PAGE));
  const currentPage = Math.min(requestedPage, totalPages);

  // 当前页新闻
  const pagedNews = useMemo(
    () =>
      filteredNews.slice(
        (currentPage - 1) * NEWS_PER_PAGE,
        currentPage * NEWS_PER_PAGE,
      ),
    [filteredNews, currentPage],
  );

  // 分类 URL 构造: 公司新闻 = /news (默认 Tab 无分类路径), 其余 = /news/category/:tag
  // 注意: paths 函数返回含 locale 前缀的完整路径; SEO 组件会自行拼接 locale,
  //       故传给 SEO 的 path 必须是不含 locale 的纯路径
  const categoryPathFor = (tagSlug: string) =>
    tagSlug === NEWS_CATEGORIES[0]
      ? newsPath(locale)
      : newsCategoryPath(locale, tagSlug);

  // 纯路径 (无 locale 前缀), 供 SEO canonical/hreflang 使用
  const seoPath = activeCategory === NEWS_CATEGORIES[0]
    ? "/news"
    : `/news/category/${activeCategory}`;

  // 页码 → 路径 (第 1 页返回分类根路径, 无 m441page 参数, canonical 干净)
  const pageToPath = (page: number) => {
    const base = categoryPathFor(activeCategory);
    if (page <= 1) return base;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}${ROUTE_PARAMS.NEWS_PAGE}=${page}`;
  };

  // Tab 点击 → 同步 URL (切分类重置到第 1 页)
  const handleTabClick = (cat: string) => {
    if (cat === activeCategory) return;
    navigate(categoryPathFor(cat));
  };

  // JSON-LD 用的分类根 URL (含 locale)
  const collectionUrl = `${SITE_ORIGIN}${categoryPathFor(activeCategory)}`;
  const categoryLabel = t(`category.${activeCategory}.label`);

  return (
    <>
      <SEO
        titleKey="news.title"
        descriptionKey="news.description"
        path={seoPath}
        jsonLd={[
          getCollectionPageSchema({
            name: `${categoryLabel} · 听力资讯`,
            description: t("meta:news.description") as string,
            url: collectionUrl,
            locale,
          }),
          getBreadcrumbSchema([
            { name: t("breadcrumb.home"), url: `${SITE_ORIGIN}/${locale}/` },
            {
              name: t("breadcrumb.news"),
              url: `${SITE_ORIGIN}/${locale}/news`,
            },
            ...(activeCategory !== NEWS_CATEGORIES[0]
              ? [
                  {
                    name: categoryLabel,
                    url: `${SITE_ORIGIN}/${locale}/news/category/${activeCategory}`,
                  },
                ]
              : []),
          ]),
        ]}
      />
      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">{`听力资讯中心 · ${categoryLabel}`}</h1>
      {/* ============================================================
          1. Hero - 资讯中心 Banner
          2026-07-25 v3: 浅米白暖调背景 + 中部 HTML 叠加标题 (钉钉进步体)
          AI 图: 媒体元素在右侧, 中部左侧留白给文字
          ============================================================ */}
      <ProductCarouselHero height={480} mobileObjectFit="contain" />

      {/* ============================================================
          2. Tab 导航 + 新闻列表 - 与 ProductPage 同款
          Tab: Active 140×48 bg=brand-green-light 16px #fff 700
               Inactive 140×48 14px ink-800 700
               gap 16px, 无圆角 + border 朴素风格
          列表: 2列网格, 每项 547×269
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[30px] lg:py-[40px]">
          {/* Tab 分类导航 - 点击同步 URL (公司新闻=/news, 其余=/news/category/:tag) */}
          <div
            className="flex flex-wrap justify-start lg:justify-center mb-[30px] lg:mb-[40px]"
            style={{ gap: "12px 16px" }}
          >
            {NEWS_CATEGORIES.map((cat) => {
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  onClick={() => handleTabClick(cat)}
                  className={`flex items-center justify-center font-bold transition-colors duration-300 cursor-pointer border shrink-0 ${
                    isActive ? TAB_ACTIVE : TAB_INACTIVE
                  }`}
                  style={{
                    width: "140px",
                    height: "48px",
                    fontSize: isActive ? "16px" : "14px",
                  }}
                >
                  {t(`category.${cat}.label`)}
                </button>
              );
            })}
          </div>

          {/* 新闻列表 - 2列网格 (移动端 1 列 / 桌面端 2 列)
              桌面端无列间距, 行间距 20px (原 xiaowe.cc 风格) */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2"
            style={{ columnGap: "0px", rowGap: "20px" }}
          >
            {pagedNews.map((news, idx) => (
              <Reveal key={news.id} variant="fade-up" delay={(idx % 4) * 80}>
                <NewsListItem
                  news={news}
                  category={activeCategory}
                  locale={locale}
                />
              </Reveal>
            ))}
          </div>

          {/* 空状态 */}
          {filteredNews.length === 0 && (
            <div className="text-center py-[60px] lg:py-[80px] text-[14px] text-ink-400">
              {t("empty")}
            </div>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <Pagination
              total={totalPages}
              current={currentPage}
              baseTo={pageToPath}
            />
          )}
        </div>
      </section>

    </>
  );
}

export default NewsListPage;

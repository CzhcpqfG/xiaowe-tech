import { useEffect, useMemo, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import Reveal from "../components/ui/Reveal";
import SEO from "../components/SEO";
import { getArticle, type ArticleBlock, type NewsArticle } from "../data/articles";
import { NEWS_LIST, NEWS_CATEGORY_MAP, NEWS_DEFAULT_CATEGORY } from "../data/content";
import { IMAGES } from "../data/images";
import { IMAGE_SIZES } from "../data/generated/imageSizes";
import { newsCategoryPath, newsDetailPath, homePath, newsPath } from "../routes/paths";
import { useLocale } from "../i18n/useLocale";
import { useTranslation } from "react-i18next";
import { SITE_ORIGIN, absoluteImage } from "../config/schema";
import type { Locale } from "../i18n/types";

/* ============================================================
   渲染文章正文 block
   朴素风格 - 无圆角、无阴影
   原网站字号规范:
     正文 p 14px #666 line-height 39.2px (leading-[2.8])
     小标题 16px #333 700
     列表项 14px #666
   ============================================================ */
function renderBlock(block: ArticleBlock, idx: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={idx} className="text-[14px] text-ink-500 leading-[2.8] mb-5">
          {block.text}
        </p>
      );
    case "heading":
      return (
        <h2 key={idx} className="text-[16px] font-bold text-ink-700 mt-8 mb-4 leading-snug">
          {block.text}
        </h2>
      );
    case "list":
      return (
        <ul key={idx} className="space-y-3 mb-6 pl-1">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[14px] text-ink-500 leading-[1.8]">
              <svg className="w-4 h-4 mt-1.5 text-brand-green shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
              </svg>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      );
    case "quote":
      return (
        <blockquote
          key={idx}
          className="my-6 border-l-4 border-brand-green bg-brand-green/5 pl-5 pr-4 py-4"
        >
          <p className="text-[14px] text-ink-500 leading-[1.8] italic">
            {block.text}
          </p>
        </blockquote>
      );
    case "image":
      return (
        <figure key={idx} className="my-6">
          <img
            src={block.src}
            alt={block.alt}
            width={IMAGE_SIZES[block.src]?.[0]}
            height={IMAGE_SIZES[block.src]?.[1]}
            style={IMAGE_SIZES[block.src] ? { aspectRatio: `${IMAGE_SIZES[block.src][0]} / ${IMAGE_SIZES[block.src][1]}`, width: "100%", height: "auto" } : undefined}
            className="w-full h-auto"
            loading="lazy"
          />
          {block.alt && (
            <figcaption className="text-center text-[12px] text-ink-400 mt-2">
              {block.alt}
            </figcaption>
          )}
        </figure>
      );
    default:
      return null;
  }
}

/* ============================================================
   面包屑 - 资讯详情页顶部
   原型 §8.3 详情页不含 Banner, 改用面包屑导航
   布局: 首页 > 资讯中心 > [分类] > 当前文章标题
   ============================================================ */
function Breadcrumb({
  category,
  title,
  locale,
  t,
}: {
  category: string;
  title: string;
  locale: Locale;
  t: (key: string) => string;
}) {
  return (
    <nav className="border-b border-ink-200 bg-white">
      <div className="container-page py-[16px]">
        <ol className="flex items-center flex-wrap gap-[6px] text-[13px] text-ink-400 leading-[20px]">
          <li>
            <Link
              to={homePath(locale)}
              className="hover:text-brand-green-light transition-colors duration-300"
            >
              {t("breadcrumb.home")}
            </Link>
          </li>
          <li className="text-ink-300">/</li>
          <li>
            <Link
              to={newsPath(locale)}
              className="hover:text-brand-green-light transition-colors duration-300"
            >
              {t("breadcrumb.news")}
            </Link>
          </li>
          <li className="text-ink-300">/</li>
          <li>
            <Link
              to={newsCategoryPath(locale, category)}
              className="hover:text-brand-green-light transition-colors duration-300"
            >
              {t(`category.${category}.label`)}
            </Link>
          </li>
          <li className="text-ink-300">/</li>
          <li className="text-ink-700 line-clamp-1" aria-current="page">
            {title}
          </li>
        </ol>
      </div>
    </nav>
  );
}

function NewsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { locale } = useLocale();
  const { t } = useTranslation("news");

  // 异步加载文章正文 (分片懒加载, 避免 372 篇数据进入主 bundle)
  const [article, setArticle] = useState<NewsArticle | undefined>(undefined);
  const [articleLoaded, setArticleLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setArticle(undefined);
    setArticleLoaded(false);
    if (!id) {
      setArticleLoaded(true);
      return;
    }
    getArticle(id).then((art) => {
      if (cancelled) return;
      setArticle(art);
      setArticleLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  // 从列表中找到该新闻的元信息（封面图、摘要）
  const newsMeta = useMemo(
    () => NEWS_LIST.find((n) => n.id === id),
    [id],
  );

  // 文章加载完成且不存在 + 元信息也不存在 → 非法 id 重定向
  if (articleLoaded && !article && !newsMeta) {
    return <Navigate to={newsPath(locale)} replace />;
  }

  const title = article?.title || (id && t(`list.${id}.title`)) || "";
  const summary = (id && t(`list.${id}.summary`)) || "";
  const date = article?.date || newsMeta?.date || "";
  const coverImage = newsMeta ? IMAGES[newsMeta.imageKey] : undefined;
  // 分类标签: 优先从 NEWS_CATEGORY_MAP 取, 否则用默认 Tab
  const category =
    (id && NEWS_CATEGORY_MAP[id]) || NEWS_DEFAULT_CATEGORY;

  // NewsArticle JSON-LD - 让 AI 搜索引擎解析新闻实体 (GEO)
  const newsJsonLd = useMemo<object | undefined>(() => {
    if (!id) return undefined;
    const url = `${SITE_ORIGIN}/${locale}/news/${id}`;
    const image = coverImage ? absoluteImage(coverImage) : undefined;
    return {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: title,
      description: summary,
      datePublished: date,
      dateModified: date,
      author: {
        "@type": "Person",
        name: article?.author || t("defaultAuthor"),
      },
      publisher: { "@id": `${SITE_ORIGIN}/#organization` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      ...(image ? { image } : {}),
      url,
    };
  }, [id, locale, title, summary, date, coverImage, article?.author, t]);

  return (
    <>
      <SEO
        titleKey="newsDetail.title"
        descriptionKey="newsDetail.description"
        path={`/news/${id}`}
        vars={{ title, summary }}
        ogType="article"
        ogImage={
          coverImage ? absoluteImage(coverImage) : undefined
        }
        jsonLd={newsJsonLd}
      />
      {/* 1. 面包屑导航 - 原型 §8.3 详情页不含 Banner */}
      <Breadcrumb category={category} title={title} locale={locale} t={t} />

      {/* 2. 文章主体 section
          原网站字号规范:
            h1 标题 22px #333 400 line-height 28.6px (非bold!)
            日期 14px #999
            分类标签 12px #fff bg=#52b548
            分享 13px #666
            医疗广告 16px #666 line-height 44.8px
            上一篇/下一篇 label 14px #333 400 leading-[21px] */}
      <section className="py-[32px] lg:py-12 bg-white">
        <div className="container-page">
          <article
            className="max-w-[717px] mx-auto"
            itemScope
            itemType="https://schema.org/NewsArticle"
            data-article-state={articleLoaded ? (article ? "ready" : "missing") : "loading"}
          >
            {/* 文章头部 - fade-up 入场 */}
            <Reveal>
              <header className="mb-6 lg:mb-8">
                {/* h1 标题 22px font-normal #333 leading-[28.6px] */}
                <h1 className="text-[20px] lg:text-[22px] font-normal text-ink-700 leading-[28px] lg:leading-[28.6px] mb-4">
                  {title}
                </h1>
                <div className="flex items-center gap-3 lg:gap-4 text-[13px] lg:text-[14px] text-ink-400 pb-5 border-b border-ink-200 flex-wrap">
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
                    </svg>
                    {date}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                    {article?.author || t("defaultAuthor")}
                  </span>
                  {/* 分类标签 - 原型 §8.3 要求 */}
                  <Link
                    to={newsCategoryPath(locale, category)}
                    className="inline-flex items-center justify-center px-[10px] h-[20px] bg-brand-green-light text-white text-[12px] font-normal transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-brand-green hover:-translate-y-[2px]"
                  >
                    {t(`category.${category}.label`)}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title, url: window.location.href }).catch(() => {});
                      } else {
                        navigator.clipboard?.writeText(window.location.href);
                      }
                    }}
                    className="ml-auto flex items-center gap-1.5 text-[13px] text-ink-500 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:text-brand-green hover:translate-x-[2px]"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
                    </svg>
                    {t("share")}
                  </button>
                </div>
              </header>
            </Reveal>

            {/* 封面图 - scale 入场 */}
            {coverImage && (
              <Reveal variant="scale" delay={120} className="mb-6 lg:mb-8">
                <div className="aspect-[16/9] overflow-hidden bg-ink-100">
                  <img
                    src={coverImage}
                    alt={title}
                    className="w-full h-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03]"
                  />
                </div>
              </Reveal>
            )}

            {/* 正文内容 - fade-up 入场 */}
            <Reveal delay={200}>
              <div className="prose-content">
                {article ? (
                  article.content.map((block, idx) => renderBlock(block, idx))
                ) : (
                  <>
                    <p className="text-[14px] text-ink-500 leading-[2.8] mb-5">
                      {summary}
                    </p>
                    {articleLoaded ? (
                      <p className="text-[14px] text-ink-500 leading-[2.8] mb-5">
                        {t("fallbackNotice")}
                      </p>
                    ) : (
                      <p className="text-[14px] text-ink-500 leading-[2.8] mb-5">
                        {t("loadingNotice")}
                      </p>
                    )}
                  </>
                )}
              </div>
            </Reveal>

            {/* 3. 医疗广告提示 - 原网站字号 16px #666 leading-[44.8px] */}
            {article?.medicalAd && (
              <Reveal variant="fade-up" className="mt-8 lg:mt-10">
                <div className="p-4 lg:p-5 bg-ink-100 border border-ink-300 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green hover:bg-brand-green/5">
                  <p className="text-[14px] lg:text-[16px] text-ink-500 leading-[32px] lg:leading-[44.8px] mb-2">
                    <span className="font-semibold text-ink-700">
                      {t("medicalAd.productNameLabel")}
                    </span>
                    {article.medicalAd.productName}
                  </p>
                  <p className="text-[14px] lg:text-[16px] text-ink-500 leading-[32px] lg:leading-[44.8px] mb-2">
                    <span className="font-semibold text-ink-700">{t("medicalAd.regNumberLabel")}</span>
                    {article.medicalAd.regNumber}
                  </p>
                  <p className="text-[14px] lg:text-[16px] text-ink-500 leading-[32px] lg:leading-[44.8px] mb-2">
                    <span className="font-semibold text-ink-700">
                      {t("medicalAd.adNumberLabel")}
                    </span>
                    {article.medicalAd.adNumber}
                  </p>
                  <p className="text-[14px] lg:text-[16px] text-ink-400 leading-[32px] lg:leading-[44.8px] mt-3 pt-3 border-t border-ink-300">
                    {article.medicalAd.notice}
                  </p>
                </div>
              </Reveal>
            )}

            {/* 4. 上一篇/下一篇 - label 14px #333 400 leading-[21px]
                移动端 1 列 / 桌面端 2 列 */}
            <div className="mt-8 lg:mt-10 pt-6 lg:pt-8 border-t border-ink-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {article?.prevArticle ? (
                <Reveal variant="fade-right">
                  <Link
                    to={newsDetailPath(locale, article.prevArticle.id)}
                    className="group flex items-start gap-3 p-4 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                  >
                    <svg className="w-5 h-5 text-ink-400 group-hover:text-brand-green transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-x-1 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    <div>
                      <p className="text-[14px] font-normal text-ink-700 leading-[21px] mb-1">{t("prevArticle")}</p>
                      <p className="text-[14px] text-ink-700 group-hover:text-brand-green transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] line-clamp-2">
                        {article.prevArticle.title}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ) : (
                <div />
              )}
              {article?.nextArticle ? (
                <Reveal variant="fade-left" delay={100}>
                  <Link
                    to={newsDetailPath(locale, article.nextArticle.id)}
                    className="group flex items-start gap-3 p-4 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)] text-right flex-row-reverse"
                  >
                    <svg className="w-5 h-5 text-ink-400 group-hover:text-brand-green transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-1 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <div>
                      <p className="text-[14px] font-normal text-ink-700 leading-[21px] mb-1">{t("nextArticle")}</p>
                      <p className="text-[14px] text-ink-700 group-hover:text-brand-green transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] line-clamp-2">
                        {article.nextArticle.title}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ) : (
                <div />
              )}
            </div>
          </article>
        </div>
      </section>

    </>
  );
}

export default NewsDetailPage;

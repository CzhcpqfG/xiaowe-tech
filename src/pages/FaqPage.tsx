import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import FaqAccordion from "../components/faq/FaqAccordion";
import Reveal from "../components/ui/Reveal";
import { SubSectionTitle } from "../components/ui/SubSectionTitle";
import SEO from "../components/SEO";
import { SITE_INFO } from "../config/site";
import { getFaqSchema, getBreadcrumbSchema } from "../config/schema";
import { faqPath, homePath } from "../routes/paths";
import { useLocale } from "../i18n/useLocale";
import type { Locale } from "../i18n/types";

/* ============================================================
   FaqPage - 常见问题独立页 (/faq)

   设计规范:
     - Hero 与 ProductPage 一致 (ProductCarouselHero height=480)
     - 主模块沿用全站朴素风格 (无圆角 / 无阴影 / 无渐变)
     - hover 反馈: FaqAccordion 已有上移 + 色条 + 背景渐变
     - 1200px 设计宽度 (container-page)

   GEO 优化关键:
     - 注入 FAQPage JSON-LD, 让豆包/ChatGPT/Perplexity 直接抓取问答对
     - 37 个高频问题覆盖「听力不好怎么办」「助听器品牌选哪个」等
   ============================================================ */

/** FAQ 分类 key 列表 (与 faq.json categories 对应) */
const CATEGORY_KEYS = [
  "company",
  "product",
  "qualification",
  "purchase",
  "hearingHealth",
  "invest",
] as const;

type CategoryKey = (typeof CATEGORY_KEYS)[number];

/** 从 i18n 拉取当前 locale 的全部 FAQ 数据 (用于渲染 + JSON-LD) */
function useFaqData() {
  const { t } = useTranslation("faq");
  const all = CATEGORY_KEYS.map((key) => {
    const questions = t(`questions.${key}`, { returnObjects: true }) as Array<{
      q: string;
      a: string;
    }>;
    return { key, title: t(`categories.${key}.title`), subtitle: t(`categories.${key}.subtitle`), questions };
  });
  return all;
}

function FaqPage() {
  const { t } = useTranslation("faq");
  const { locale } = useLocale();
  const [activeCategory, setActiveCategory] = useState<CategoryKey | "all">(
    "all"
  );

  const allData = useFaqData();
  const visibleData =
    activeCategory === "all"
      ? allData
      : allData.filter((c) => c.key === activeCategory);

  // JSON-LD: FAQPage (GEO 核心) + Breadcrumb
  const faqSchema = useMemo(() => {
    const faqs = allData.flatMap((c) =>
      c.questions.map((q) => ({ question: q.q, answer: q.a }))
    );
    return getFaqSchema(faqs);
  }, [allData]);

  const breadcrumbSchema = useMemo(
    () =>
      getBreadcrumbSchema([
        { name: t("breadcrumb.home", { defaultValue: "首页" }), url: homePath(locale as Locale) },
        { name: t("breadcrumb.faq", { defaultValue: "常见问题" }), url: faqPath(locale as Locale) },
      ]),
    [t, locale]
  );

  return (
    <>
      <SEO
        titleKey="faq.title"
        descriptionKey="faq.description"
        keywordsKey="faq.keywords"
        path="/faq"
        jsonLd={[faqSchema, breadcrumbSchema]}
      />

      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">常见问题 FAQ · 关于小维健康科技你想知道的都在这</h1>

      {/* ============================================================
          1. Hero - 与 ProductPage hero 一致 (ProductCarouselHero 480px)
          ============================================================ */}
      <ProductCarouselHero height={480} interval={60000} mobileObjectFit="contain" />

      {/* ============================================================
          2. 分类筛选 (sticky)
          ============================================================ */}
      <section className="bg-white sticky top-0 z-10 border-b border-ink-100">
        <div className="container-page py-[16px] lg:py-[20px]">
          <div className="flex items-center gap-[8px] overflow-x-auto pb-[2px]">
            <CategoryChip
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
              label={t("ui.categoryAll", { defaultValue: "全部" })}
            />
            {allData.map((cat) => (
              <CategoryChip
                key={cat.key}
                active={activeCategory === cat.key}
                onClick={() => setActiveCategory(cat.key)}
                label={cat.title}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          3. FAQ 主体 - 按 category 分块, 每块标题 + FaqAccordion 列表
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <div className="space-y-[40px] lg:space-y-[56px]">
            {visibleData.map((cat) => (
              <div key={cat.key} id={`cat-${cat.key}`}>
                {/* 分类标题 - 统一使用 SubSectionTitle 组件 (与 ProductPage 规范一致) */}
                <Reveal>
                  <SubSectionTitle
                    title={cat.title}
                    desc={cat.subtitle}
                    className="mb-[20px] lg:mb-[24px]"
                  />
                </Reveal>
                {/* 问题列表 (左侧序号 + 卡片) */}
                <div className="space-y-[12px] lg:space-y-[16px] pl-[18px]">
                  {cat.questions.map((q, idx) => (
                    <Reveal key={`${cat.key}-${idx}`} variant="fade-up">
                      <FaqAccordion
                        question={q.q}
                        answer={q.a}
                        index={idx}
                        defaultOpen={false}
                      />
                    </Reveal>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. 底部 CTA - 未找到答案？拨打热线
          (full-bleed 血崩式撑开: 突破 1200px 容器, 背景铺满视口)
          ============================================================ */}
      <section className="bg-brand-green/5 full-bleed border-t border-ink-100">
        <div className="container-page py-[40px] lg:py-[60px]">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-[20px] lg:gap-[32px]">
            <div className="text-center lg:text-left">
              <h2 className="text-[20px] lg:text-[26px] font-bold text-ink-700 leading-[28px] lg:leading-[36px] mb-2">
                {t("cta.title", { defaultValue: "还有疑问？专业听力顾问为您解答" })}
              </h2>
              <p className="text-[13px] lg:text-[15px] text-ink-500 leading-[20px] lg:leading-[24px]">
                {t("cta.desc", { defaultValue: "拨打全国统一服务热线，免费听力检查预约，全程专业指导" })}
              </p>
            </div>
            <a
              href={`tel:${SITE_INFO.hotline}`}
              className="inline-flex items-center gap-[8px] bg-brand-green text-white text-[15px] lg:text-[16px] font-bold px-[32px] py-[14px] hover:bg-brand-green-light transition-colors whitespace-nowrap"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              {SITE_INFO.hotline}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

/** 分类筛选 chip */
function CategoryChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        shrink-0 px-[14px] lg:px-[18px] h-[36px] lg:h-[40px] inline-flex items-center
        text-[13px] lg:text-[14px] font-bold leading-[20px] border transition-all duration-200
        ${
          active
            ? "bg-brand-green text-white border-brand-green"
            : "bg-white text-ink-600 border-ink-200 hover:border-brand-green hover:text-brand-green hover:-translate-y-[1px]"
        }
      `}
    >
      {label}
    </button>
  );
}

export default FaqPage;

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import FaqAccordion from "./FaqAccordion";
import Reveal from "../ui/Reveal";
import { getFaqSchema } from "../../config/schema";
import { Helmet } from "react-helmet-async";
import { faqPath } from "../../routes/paths";
import type { Locale } from "../../i18n/types";
import { useLocale } from "../../i18n/useLocale";

/* ============================================================
   FaqSection - 产品页/招商页 FAQ 模块 (2 模块共用)

   用法:
     <FaqSection scope="product" /> // 产品页 FAQ 模块
     <FaqSection scope="invest" />  // 招商页 FAQ 模块

   设计规范:
     - 标题 + 副标 + "查看全部"链接
     - 4 条 FAQ 手风琴 (FaqAccordion 组件)
     - 注入 FAQPage JSON-LD (4 条 Q&A, GEO 核心)
     - hover 反馈: FaqAccordion 已有上移 + 色条 + 背景渐变
   ============================================================ */

type FaqSectionProps = {
  scope: "product" | "invest";
};

/** 背景色 (与宿主页 section 风格匹配) */
const SECTION_BG: Record<FaqSectionProps["scope"], string> = {
  product: "bg-white",
  invest: "bg-white",
};

export default function FaqSection({ scope }: FaqSectionProps) {
  const { t } = useTranslation("faq");
  const { locale } = useLocale();

  // 从 i18n 拉取当前 scope 的 4 条 FAQ
  const items = t(`${scope}.items`, {
    returnObjects: true,
  }) as Array<{ q: string; a: string }>;

  const sectionTitle = t(`${scope}.sectionTitle`);
  const sectionSubtitle = t(`${scope}.sectionSubtitle`);
  const viewAllLabel = t(`${scope}.viewAll`, {
    count: items.length,
  });

  // JSON-LD: FAQPage (GEO 核心, 让 AI 抓取这 4 条 Q&A)
  const faqSchema = useMemo(
    () =>
      getFaqSchema(
        items.map((it) => ({ question: it.q, answer: it.a }))
      ),
    [items]
  );

  return (
    <section className={`${SECTION_BG[scope]} border-t border-ink-100`}>
      {/* 注入 FAQPage JSON-LD (GEO 关键) */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqSchema)}
        </script>
      </Helmet>

      <div className="container-page py-[40px] lg:py-[60px]">
        {/* 板块标题 */}
        <Reveal>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-[24px] lg:mb-[36px] gap-[12px]">
            <div>
              <h2 className="text-[24px] lg:text-[30px] font-bold text-ink-700 leading-[36px] lg:leading-[45px] mb-2">
                {sectionTitle}
              </h2>
              <p className="text-[14px] lg:text-[16px] text-ink-500 leading-[22px] lg:leading-[24px]">
                {sectionSubtitle}
              </p>
            </div>
            <Link
              to={faqPath(locale as Locale)}
              className="inline-flex items-center gap-[6px] text-[13px] lg:text-[14px] text-brand-green font-bold hover:underline leading-[20px] shrink-0"
            >
              {viewAllLabel}
              <span aria-hidden>→</span>
            </Link>
          </div>
        </Reveal>

        {/* FAQ 列表 */}
        <div className="pl-[18px] space-y-[12px] lg:space-y-[16px]">
          {items.map((item, idx) => (
            <Reveal key={`${scope}-${idx}`} variant="fade-up">
              <FaqAccordion
                question={item.q}
                answer={item.a}
                index={idx}
                defaultOpen={false}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

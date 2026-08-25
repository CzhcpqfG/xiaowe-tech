import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import VideoEntry from "../components/home/VideoEntry";
import HeroProducts from "../components/home/HeroProducts";
import SEO from "../components/SEO";
import JsonLd from "../components/JsonLd";
import { getFaqSchema } from "../config/schema";

/**
 * 首页 - 官网 3.0 (基于 PROTOTYPE_PAGES.md §二, 按用户 2026-07-23 反馈精简, i18n 改造)
 *
 * 结构 (2 个 section):
 *   1. Hero 视频 (全宽铺满, 720px 高, 企业宣传片预热, MVP 占位)
 *   2. Hero 三产品入口 (AI 中文助听器 / 健康智能手表 / 智能蓝牙耳机, 各含 6 项核心技术)
 *
 * i18n:
 *   - SEO meta 通过 <SEO titleKey="home.title" ... /> 动态化
 *   - 子组件 (VideoEntry/HeroProducts) 各自调用 useTranslation
 *
 * GEO (2026-08-16):
 *   - 注入全量 FAQPage JSON-LD (faq:questions 全部分类), 让 AI 搜索引擎在
 *     首抓首页时即可解析全部 45 个问答对, 覆盖"助听器怎么选/听力不好怎么办"
 *     等高召回场景
 */
function HomePage() {
  const { t } = useTranslation("faq");

  // 全量 FAQ schema: faq:questions 是 { category: [{q, a}] } 结构, 全部拍平
  const faqSchema = useMemo(() => {
    const questions = t("questions", {
      returnObjects: true,
    }) as Record<string, Array<{ q: string; a: string }>>;
    const all = Object.values(questions ?? {}).flat();
    return getFaqSchema(
      all.map((it) => ({ question: it.q, answer: it.a }))
    );
  }, [t]);

  return (
    <>
      <SEO
        titleKey="home.title"
        descriptionKey="home.description"
        path="/"
      />
      {/* 全量 FAQPage JSON-LD (GEO 核心) */}
      <JsonLd data={faqSchema} />
      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">小维健康科技 · 大声 AI 中文助听器与健康智能穿戴</h1>
      {/* 1. Hero 视频 - 全宽铺满 */}
      <VideoEntry />
      {/* 2. Hero 三产品入口 */}
      <HeroProducts />
    </>
  );
}

export default HomePage;

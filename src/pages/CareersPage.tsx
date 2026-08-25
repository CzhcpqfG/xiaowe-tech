import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import Reveal from "../components/ui/Reveal";
import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle";
import { CAREERS_PAGE, type JobItem, type JobCategory } from "../data/content";
import { IMAGES } from "../data/images";
import SEO from "../components/SEO";
import {
  SITE_ORIGIN,
  getWebPageSchema,
  getBreadcrumbSchema,
} from "../config/schema";
import { useLocale } from "../i18n/useLocale";

/** URL ?cat= 参数支持的 4 个分类 slug (不含 "all") */
const CAT_SLUGS: readonly JobCategory[] = ["tech", "manufacturing", "marketing", "admin"];

/* ============================================================
   人才招聘页 - PROTOTYPE_PAGES.md §七 (5 section)
   设计规范 (全站统一):
     - 主色 brand-green #05a045 / 选中色 brand-green-light #52b548
     - 字体: MiSans (默认) / 钉钉进步体 (大标题, 通过 font-display class)
     - 灰阶: ink-700 #333 / ink-600 #555 / ink-500 #666 / ink-400 #999 / ink-200 #e5e5e5
     - Section 标题: 30px ink-700 700 leading-[45px]
     - 副标: 16px ink-500 400 leading-[24px]
     - 无圆角 / 无阴影 / 无渐变
     - 1200px 设计宽度 (container-page)
   配图: 由速创API (gpt-image-2) 生成, 保存在 public/images/careers/

   i18n 改造 (2026-07-25):
     - 所有可见文案通过 t(CAREERS_PAGE.xxx.xxxKey) 翻译 (careers namespace)
     - 数组字段 (companyIntro) 用 t(keys, { returnObjects: true })
     - JobCategory / tabs 改为英文 slug, 渲染时用 t(`careers:tabs.${slug}`)
     - SEO 通过 <SEO titleKey="careers.title" ... /> 动态化
   ============================================================ */

/** 4 个职位分类 → 对应配图的 key */
const CATEGORY_IMAGE_KEYS = [
  "careersCatTech",
  "careersCatProduction",
  "careersCatMarketing",
  "careersCatHr",
] as const;

function CareersPage() {
  const { t } = useTranslation(["careers", "common"]);
  const { locale } = useLocale();

  // 读取 URL ?cat= 参数, 校验是否为合法分类 slug (用于 footer 锚点跳转后默认选中对应 Tab)
  const [searchParams] = useSearchParams();
  const catParam = searchParams.get("cat");
  const initialTab =
    catParam && (CAT_SLUGS as readonly string[]).includes(catParam) ? catParam : "all";

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const filteredJobs = useMemo<JobItem[]>(() => {
    if (activeTab === "all") return [...CAREERS_PAGE.jobList];
    return CAREERS_PAGE.jobList.filter((j) => j.category === activeTab);
  }, [activeTab]);

  return (
    <>
      <SEO
        titleKey="careers.title"
        descriptionKey="careers.description"
        path="/careers"
        jsonLd={[
          getWebPageSchema({
            name: "人才招聘",
            description: "小维健康科技人才招聘, 深耕助听赛道广纳英才",
            url: `${SITE_ORIGIN}/${locale}/careers`,
            locale,
          }),
          getBreadcrumbSchema([
            { name: "首页", url: `${SITE_ORIGIN}/${locale}/` },
            { name: "人才招聘", url: `${SITE_ORIGIN}/${locale}/careers` },
          ]),
        ]}
      />

      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">小维健康科技人才招聘 · 深耕助听赛道广纳英才</h1>

      {/* ============================================================
          1. Hero - 接入统一 ProductCarouselHero 组件
          2026-07-25 v3: 浅米白暖调背景 + 中部 HTML 叠加标题 (钉钉进步体)
          AI 图: 办公空间元素在右侧, 中部左侧留白给文字
          主标为双行: "深耕助听赛道" + "广纳四海英才"
          ============================================================ */}
      <ProductCarouselHero height={480} mobileObjectFit="contain" />

      {/* ============================================================
          2. 公司简介 - 同关于小维页 §2.4 (5 段)
          字号规范:
            标题 30px #333 700 line-height 45px
            正文 14px #4b4b4b 400 line-height 28px
          配图: 速创API生成的现代化公司大楼
          布局: 左图 (547×340) + 右文字 (547)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 板块标题 - 居中 + 绿色短横线 (去副标) */}
          <Reveal>
            <SectionTitle title={t(CAREERS_PAGE.companyIntroTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 左右布局: 左配图 + 右文字 (移动端纵向堆叠) */}
          <div className="grid grid-cols-1 lg:grid-cols-[547px_1fr] gap-[24px] lg:gap-[40px] items-center">
            {/* 左: 配图 - fade-right 入场 (移动端 4:3, 桌面端 547×340) */}
            <Reveal variant="fade-right" className="overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[340px]">
              <img
                src={IMAGES.careersCompanyIntro}
                alt={t("careers:companyIntroAlt")}
                className="w-full h-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.03]"
              />
            </Reveal>

            {/* 右: 5 段正文 14px #4b4b4b line-height 28px - fade-left 入场 */}
            <Reveal variant="fade-left" delay={120} className="space-y-4">
              {(CAREERS_PAGE.companyIntroKeys.map((k) => t(k))).map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-[14px] text-ink-600 leading-[24px] lg:leading-[28px] text-left"
                >
                  {paragraph}
                </p>
              ))}
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============================================================
          3. 职位分类 - 4 个分类卡片
          原型 §7.4, 每个含 "配图 + 名称 + 描述"
          配图: 速创API生成的 4 张分类场景图
          字号规范:
            板块标题 30px #333 700
            分类名称 22px #333 700
            分类描述 14px #666 400
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 板块标题 - 居中 + 绿色短横线 */}
          <Reveal>
            <SectionTitle title={t(CAREERS_PAGE.categoryTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 4 个分类卡片 grid (移动端 1 列 / 平板 2 列 / 桌面 4 列) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] lg:gap-[30px]">
            {CAREERS_PAGE.categories.map((cat, idx) => {
              const name = t(`careers:tabs.${cat.category}`);
              return (
                <Reveal key={idx} variant="scale-up" delay={idx * 80}>
                  <div
                    className="group bg-white border border-ink-200 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)] flex flex-col h-full"
                  >
                    {/* 配图 (移动端 4:3, 桌面端 180px 高) */}
                    <div className="overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[180px]">
                      <img
                        src={IMAGES[CATEGORY_IMAGE_KEYS[idx]]}
                        alt={name}
                        className="w-full h-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
                      />
                    </div>
                    {/* 文案区 padding 20 */}
                    <div className="p-5 flex-1">
                      {/* 分类名称 22px #333 700 */}
                      <h3 className="text-[18px] lg:text-[22px] font-bold text-ink-700 leading-[27px] lg:leading-[33px] mb-2 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                        {name}
                      </h3>
                      {/* 分类描述 14px #666 400 */}
                      <p className="text-[14px] text-ink-500 leading-[21px]">
                        {t(cat.descKey)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          4. 职位列表 - Tab 筛选 + 职位卡片网格
          原型 §7.5, MVP 卡片只展示 6 项字段 (职位名称 / 地点 / 类别 / 人数 / 薪资 / 上传日期)
          字号规范:
            Tab Active: 18px #fff 700, bg #52b548
            Tab Inactive: 16px #212121 700, transparent
            卡片职位名 18px #212121 700
            卡片属性 14px #666 400
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 板块标题 - 居中 + 绿色短横线 (去副标) */}
          <Reveal>
            <SectionTitle title={t(CAREERS_PAGE.jobListTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* Tab 导航 - 5 个 Tab, 无圆角朴素风格
              移动端: 自动换行, 不需要横向拖拽; 桌面端: 居中 flex */}
          <Reveal className="mb-[30px] lg:mb-[40px]">
            <div className="flex flex-wrap justify-start lg:justify-center" style={{ gap: "16px 30px" }}>
              {CAREERS_PAGE.tabs.map((tab, idx) => {
                const isActive = tab === activeTab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`inline-flex items-center justify-center cursor-pointer font-bold transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shrink-0 ${
                      isActive
                        ? "bg-brand-green-light text-white"
                        : "bg-transparent text-ink-800 hover:text-brand-green-light hover:-translate-y-[2px]"
                    }`}
                    style={{
                      minWidth: isActive ? "152px" : "144px",
                      padding: "0 16px",
                      height: "47px",
                      fontSize: isActive ? "18px" : "16px",
                    }}
                  >
                    {t(`careers:tabs.${tab}`)}
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* 职位卡片网格 (移动端 1 列 / 平板+桌面 2 列) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] lg:gap-[20px]">
            {filteredJobs.map((job, idx) => (
              <Reveal key={`${job.id}-${idx}`} variant="scale-up" delay={(idx % 2) * 80}>
                <JobCard job={job} />
              </Reveal>
            ))}
          </div>

          {/* 空状态 */}
          {filteredJobs.length === 0 && (
            <div className="text-center py-[60px] lg:py-[80px] text-[14px] text-ink-400">
              {t("careers:noPositions")}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          5. 福利待遇 + 投递方式
          左右两栏布局: 左 福利待遇 (6 项 grid), 右 投递方式 (3 行联系信息)
          字号规范:
            板块标题 24px #333 700
            福利项标题 16px #333 700
            福利项描述 13px #666 400
            投递方式 label 14px #999 400
            投递方式 value 16px #333 700
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] lg:gap-[60px]">
            {/* 左: 福利待遇 - fade-right 入场 */}
            <Reveal variant="fade-right">
              <h2 className="text-[22px] lg:text-[24px] font-bold text-ink-700 mb-6 lg:mb-8 leading-[33px] lg:leading-[36px]">
                {t(CAREERS_PAGE.benefitsTitleKey)}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[16px] lg:gap-[20px]">
                {CAREERS_PAGE.benefits.map((b, idx) => (
                  <div
                    key={idx}
                    className="group border border-ink-200 bg-white p-5 flex items-start gap-3 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:border-brand-green hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                  >
                    {/* 绿色对勾 icon - hover 放大 */}
                    <svg
                      className="w-5 h-5 mt-1 text-brand-green shrink-0 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                    </svg>
                    <div>
                      <h3 className="text-[16px] font-bold text-ink-700 leading-[24px] mb-1 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                        {t(b.titleKey)}
                      </h3>
                      <p className="text-[13px] text-ink-500 leading-[19.5px]">
                        {t(b.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* 右: 投递方式 - fade-left 入场 */}
            <Reveal variant="fade-left" delay={120}>
              <h2 className="text-[22px] lg:text-[24px] font-bold text-ink-700 mb-6 lg:mb-8 leading-[33px] lg:leading-[36px]">
                {t(CAREERS_PAGE.applyTitleKey)}
              </h2>
              {/* 投递说明 14px #666 line-height 28px */}
              <p className="text-[14px] text-ink-500 leading-[24px] lg:leading-[28px] mb-6 lg:mb-8">
                {t(CAREERS_PAGE.applyDescKey)}
              </p>
              {/* 3 行联系信息 */}
              <div className="space-y-6">
                {CAREERS_PAGE.applyItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-4 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:translate-x-[6px]"
                  >
                    {/* label 14px #999 400, w 80 */}
                    <span
                      className="text-[14px] text-ink-400 font-normal leading-[21px] shrink-0 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green"
                      style={{ width: "80px" }}
                    >
                      {t(item.labelKey)}
                    </span>
                    {/* value 16px #333 700 */}
                    <span className="text-[16px] text-ink-700 font-bold leading-[24px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                      {t(item.valueKey)}
                    </span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

    </>
  );
}

/* ============================================================
   JobCard - 职位卡片
   原型 §7.5, MVP 卡片只展示 6 项字段:
     职位名称 / 地点 / 类别 / 人数 / 薪资 / 上传日期
   字号规范:
     职位名称 18px #212121 700
     属性 label 12px #999 400 / value 14px #333 400
   ============================================================ */
function JobCard({ job }: { job: JobItem }) {
  const { t } = useTranslation(["careers", "common"]);
  const categoryName = t(`careers:tabs.${job.category}`);

  return (
    <div className="group bg-white border border-ink-200 p-6 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:border-brand-green hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]">
      {/* 头部: 职位名 + 薪资 */}
      <div className="flex items-start justify-between mb-4">
        {/* 职位名称 18px #212121 700 */}
        <h3 className="text-[18px] text-ink-800 font-bold leading-[27px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
          {t(job.nameKey)}
        </h3>
        {/* 薪资 18px #52b548 700 */}
        <span className="text-[18px] text-brand-green-light font-bold leading-[27px] shrink-0 ml-4 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105 inline-block">
          {job.salary}
        </span>
      </div>

      {/* 属性 grid 2×2: 地点 / 类别 / 人数 / 上传日期 */}
      <div className="grid grid-cols-2 gap-3">
        <JobAttr label={t("careers:jobAttrLabels.location")} value={t(job.locationKey)} />
        <JobAttr label={t("careers:jobAttrLabels.category")} value={categoryName} />
        <JobAttr label={t("careers:jobAttrLabels.headcount")} value={t(job.headcountKey)} />
        <JobAttr label={t("careers:jobAttrLabels.uploadDate")} value={job.uploadDate} />
      </div>
    </div>
  );
}

function JobAttr({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      {/* label 12px #999 400 */}
      <span className="text-[12px] text-ink-400 font-normal leading-[18px] shrink-0">
        {label}：
      </span>
      {/* value 14px #333 400 */}
      <span className="text-[14px] text-ink-700 font-normal leading-[21px]">
        {value}
      </span>
    </div>
  );
}

export default CareersPage;

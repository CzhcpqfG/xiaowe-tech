import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Reveal from "../components/ui/Reveal";
import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle";
import { SubSectionTitle } from "../components/ui/SubSectionTitle";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import {
  PRODUCT_PAGE,
  PRODUCTS,
  PRODUCT_CATEGORY_KEYS,
  type ProductItem,
} from "../data/product";
import { IMAGES } from "../data/images";
import SEO from "../components/SEO";
import FaqSection from "../components/faq/FaqSection";
import { useLocale } from "../i18n/useLocale";
import { productDetailPath } from "../routes/paths";
import { SITE_ORIGIN, getMedicalDeviceSchema, absoluteImage } from "../config/schema";
import { useMemo } from "react";
import type { Locale } from "../i18n/types";
import type { TFunction } from "i18next";

/* ============================================================
   AI 中文助听器页 /product
   数据源: PROTOTYPE_PAGES.md §四
   设计风格: 沿用 2.0 朴素风格 (无圆角/无阴影/无渐变, 1200px, #05a045 主色)

   i18n 改造 (2026-07-25):
     - 所有可见文案通过 t("product:...") 翻译
     - 数据文件 src/data/product.ts 仅保留 locale-agnostic 字段
     - SEO 通过 <SEO titleKey="product.title" ... /> 动态化

   设计规范 (全站统一):
     - 主色 brand-green #05a045 / 选中色 brand-green-light #52b548
     - 字体: MiSans (默认) / 钉钉进步体 (大标题, 通过 font-display class 或 inline fontFamily)
     - 灰阶: ink-700 #333 / ink-600 #555 / ink-500 #666 / ink-400 #999 / ink-200 #e5e5e5
     - Section 标题: 30px #333 700 leading-[45px]
     - 副标: 16px #666 400 leading-[24px]
     - 无圆角 / 无阴影 / 无渐变 (仅"AI"二字例外)
     - 1200px 设计宽度 (container-page)

   8 section (布局参考 WearablePage 前几个模块):
     1. Banner (Hero) - ProductCarouselHero 组件
     2. 产品分类说明 - "全产品线覆盖 / 全场景响应需求"
     3. 产品分类按钮 (4 个) + 12 款产品参数卡片
     4. 中文助听核心技术 - 左侧标题/副标题/描述 + 右侧 SVG 环形扇区图
     5. 权威背书 · 硬核实力 (3 子模块: 国家医疗资质/临床医疗认证/国家专利认证)
     6. 听力服务中心 (含远程验配 + 门店地址)
     7. 全生命周期服务 (售前 4 + 售中售后 8)
     8. 售后保修政策 (4 章节)
   ============================================================ */

/** Tab 切换时按钮样式 (无圆角, 朴素风格) */
const TAB_ACTIVE = "bg-brand-green-light text-white border-brand-green-light";
const TAB_INACTIVE = "bg-transparent text-ink-800 hover:text-brand-green-light border-ink-200";

function ProductPage() {
  const { t, i18n } = useTranslation("product");
  const { locale } = useLocale();
  // 0=全部, 1=耳背式, 2=耳内式, 3=颈挂式, 4=骨导式
  const [activeTab, setActiveTab] = useState(0);
  // 声处方流程图 hover 状态 (-1 = 未 hover 任何元素)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 分类标签 (从 i18n key 数组翻译)
  const categories = PRODUCT_PAGE.categoriesKeys.map((k) => t(k));

  // 过滤产品: activeTab=0 显示全部, 否则按 PRODUCT_CATEGORY_KEYS 索引筛选 form
  // 仅显示 isListed 的产品 (缺图产品软屏蔽, 等图片补充后再上)
  const filteredProducts: ProductItem[] = (
    activeTab === 0
      ? PRODUCTS
      : PRODUCTS.filter((p) => p.form === PRODUCT_CATEGORY_KEYS[activeTab - 1])
  ).filter((p) => p.isListed);

  // JSON-LD: ItemList + 12 款 MedicalDevice 产品 (GEO 核心, 让 AI 解析产品实体)
  const productSchemas = useMemo(() => {
    const listed = PRODUCTS.filter((p) => p.isListed);
    const products = listed.map((p) => {
      const name = t(`${p.i18nPrefix}.model`) as string;
      const category = t(`product:categories.${p.form}`) as string;
      const image = absoluteImage(IMAGES[p.imageKey]);
      return getMedicalDeviceSchema({
        name,
        description: `${name} · ${category}`,
        image,
        model: name,
        url: p.slug
          ? `${SITE_ORIGIN}${productDetailPath(locale as Locale, p.slug)}`
          : undefined,
      });
    });
    return [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        itemListElement: products.map((item, idx) => ({
          "@type": "ListItem",
          position: idx + 1,
          item,
        })),
      },
      ...products,
    ];
  }, [t, locale, i18n.language]);

  return (
    <>
      <SEO
        titleKey="product.title"
        descriptionKey="product.description"
        path="/product"
        jsonLd={productSchemas}
      />

      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">大声 AI 中文助听器 · 12 款型号 4 大形态</h1>

      {/* ============================================================
          1. Hero - 接入统一 ProductCarouselHero 组件
          ============================================================ */}
      {/* 移动端 contain 文档流: 图片按自然比例铺满宽度, 无上下留白 */}
      <ProductCarouselHero height={480} mobileObjectFit="contain" backgroundColor="#f0f7f2" />

      {/* ============================================================
          2. 产品分类说明 - 双行标语 (与 WearablePage 间距一致: py-[60px])
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px] text-center">
          <Reveal>
            <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px]">
              {t(PRODUCT_PAGE.categorySloganKeys[0])}
            </p>
            <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px] mt-[6px]">
              {t(PRODUCT_PAGE.categorySloganKeys[1])}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          3. 产品分类按钮 (4 个) + 12 款产品参数卡片
          ============================================================ */}
      <section className="bg-white pt-[20px] pb-[40px] lg:pb-[60px]">
        <div className="container-page">
          {/* Tab 分类导航 - 5 个按钮 (含"全部") 移动端换行, 避免横向滚动 */}
          <div className="flex flex-wrap justify-start lg:justify-center mb-[30px] lg:mb-[40px]" style={{ gap: "12px 16px" }}>
            {categories.map((cat, idx) => {
              const isActive = idx === activeTab;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center justify-center font-bold transition-colors duration-300 cursor-pointer border ${
                    isActive ? TAB_ACTIVE : TAB_INACTIVE
                  }`}
                  style={{
                    minWidth: "140px",
                    padding: "0 16px",
                    height: "48px",
                    fontSize: isActive ? "16px" : "14px",
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* 产品参数卡片网格 - 4 列 × 3 行 (缺图产品已软屏蔽) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] auto-rows-fr">
            {filteredProducts.map((product, idx) => {
              // 有 slug + 详情图的产品 → 卡片可点击进入详情子页面
              const isClickable = Boolean(product.slug && product.detailImages?.length);
              const card = (
                <div
                  className="group bg-white border border-ink-200 flex flex-col h-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:border-brand-green hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
                >
                  {/* 产品图区域 - 1:1 正方形
                      hero 风格满幅背景图 (速创API 生成), 无内边距, object-cover 铺满 */}
                  <div className="w-full aspect-square bg-white flex items-center justify-center overflow-hidden">
                    <img
                      src={IMAGES[product.imageKey]}
                      alt={t(`${product.i18nPrefix}.model`)}
                      className="w-full h-full object-cover transition-transform duration-[700ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
                      loading="lazy"
                    />
                  </div>

                  {/* 信息区 - Apple 风格: 居中对齐, 宽松留白, 价格作为主信息
                      层级: 型号 → 价格 → hairline 分隔 → 指标格 + 详情入口 */}
                  <div className="px-6 py-5 lg:py-6 flex flex-col items-center text-center flex-1 border-t border-ink-100">
                    {/* 型号 */}
                    <h3 className="text-[17px] text-ink-900 font-semibold leading-[24px] mb-4 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                      {t(`${product.i18nPrefix}.model`)}
                    </h3>

                    {/* 零售指导价 */}
                    <div className="mb-5">
                      <p className="text-[11px] text-ink-400 leading-[16px] mb-1">
                        {t("product:ui.priceLabel")}
                      </p>
                      <p className="text-[18px] text-ink-900 font-bold leading-[24px]">
                        {product.price === "待定" ? (
                          <span className="text-ink-400 font-medium">{t("product:ui.pricePending")}</span>
                        ) : (
                          <>{t("product:ui.priceCurrency", { price: product.price })}</>
                        )}
                      </p>
                    </div>

                    {/* 底部区块: hairline 分隔 + 指标格 + 详情入口 (整体贴底, 行内卡片等高对齐) */}
                    <div className="mt-auto w-full pt-4 border-t border-ink-100">
                      {/* 2×3 指标格 - 极简灰底卡片, 无边框 */}
                      <div className="grid grid-cols-2 gap-[8px]">
                        {Array.from({ length: product.featuresCount }).map((_, fIdx) => (
                          <div
                            key={fIdx}
                            className="bg-ink-50 px-3 py-[10px] flex flex-col items-center justify-center min-h-[64px]"
                          >
                            <span className="text-[13px] font-semibold text-ink-900 leading-[18px]">
                              {t(`${product.i18nPrefix}.features.${fIdx}.label`)}
                            </span>
                            <span className="text-[11px] text-ink-500 leading-[15px] mt-[2px]">
                              {t(`${product.i18nPrefix}.features.${fIdx}.desc`)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* 详情入口提示 (仅可点击卡片显示) */}
                      {isClickable && (
                        <p className="mt-4 inline-flex items-center gap-[6px] text-[12px] text-brand-green font-medium leading-[18px]">
                          {t("product:ui.viewDetail")}
                          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-[3px]">→</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );

              return (
                <Reveal key={`${product.i18nPrefix}-${idx}`} variant="scale-up" delay={(idx % 4) * 80} className="h-full">
                  {isClickable ? (
                    <Link
                      to={productDetailPath(locale, product.slug!)}
                      className="block h-full"
                      aria-label={t(`${product.i18nPrefix}.model`)}
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </Reveal>
              );
            })}
          </div>

          {/* 空状态提示 */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-[60px] text-[14px] text-ink-400">
              {t("product:ui.emptyCategory")}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          4. 中文助听核心技术 (复刻原型 §4.6 扇形图)
          ============================================================ */}
      <section id="core-tech" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 标题区 - 居中 + 绿色短横线 */}
          <Reveal>
            <SectionTitle title={t(PRODUCT_PAGE.coreTech.titleKey)} />
            <TitleUnderline />
          </Reveal>
          {/* 子模块标题: 绿色短竖条 + 标题 (统一风格, 删描述) */}
          <Reveal className="mt-[30px] mb-[40px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.coreTech.subtitleKey)} />
          </Reveal>

          {/* 下层: 扇形图 (图形保留, 移动端等比缩放 + 指引下移, 组件内自适应) */}
          <Reveal variant="scale" delay={150}>
            <ChineseTechFanChart data={PRODUCT_PAGE.coreTech.fanChart} t={t} />
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          5. 权威背书 · 硬核实力 (3 子模块)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 主标题 - 居中 + 绿色短横线 */}
          <Reveal>
            <SectionTitle title={t(PRODUCT_PAGE.endorsements.titleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 4.7.1 国家医疗资质 - 5 张证书合并为一条横向长图 */}
          <Reveal variant="scale-up" className="mb-[40px] lg:mb-[50px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.endorsements.medicalCerts.titleKey)} className="mb-[24px]" />
            <div className="bg-ink-100 py-[24px] lg:py-[40px]">
              <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25),0_10px_20px_-5px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]">
                <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1.7fr_1fr_1fr]">
                  {PRODUCT_PAGE.endorsements.medicalCerts.certs.map((cert, idx) => {
                    const isLandscape = idx === 2;
                    const mobileBorder = [
                      "border-r border-b border-ink-100",
                      "border-b border-ink-100",
                      "border-b border-ink-100",
                      "border-r border-ink-100",
                      "",
                    ][idx];
                    return (
                      <div
                        key={idx}
                        className={`group relative flex items-center justify-center h-[180px] lg:h-[260px] p-[16px] lg:p-0 ${mobileBorder} ${
                          idx < 4 ? "lg:border-r lg:border-ink-100" : ""
                        } ${isLandscape ? "col-span-2 lg:col-span-1" : ""}`}
                      >
                        <img
                          src={IMAGES[cert.imageKey]}
                          alt={t(cert.nameKey)}
                          className={`max-w-[88%] max-h-[88%] object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05] ${isLandscape ? "w-full lg:w-auto" : ""}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Reveal>

          {/* 4.7.2 临床医疗认证 - 左侧文字 + 右侧上下两个医院 logo + 底部报告截图 */}
          <Reveal variant="scale-up" className="mb-[40px] lg:mb-[50px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.endorsements.clinical.titleKey)} className="mb-[24px]" />

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-[24px] lg:gap-[30px] mb-[24px]">
              {/* 左侧描述文字 */}
              <div className="flex items-center">
                <p className="text-[14px] lg:text-[15px] text-ink-700 leading-[26px] lg:leading-[28px] text-left">
                  {t(PRODUCT_PAGE.endorsements.clinical.descKey)}
                </p>
              </div>

              {/* 右侧上下两个医院 logo */}
              <div className="grid grid-cols-2 gap-[12px] lg:gap-[16px]">
                {PRODUCT_PAGE.endorsements.clinical.hospitals.map((h, idx) => (
                  <div
                    key={idx}
                    className="group flex flex-col items-center justify-center h-[140px] lg:h-[180px] p-[12px] lg:p-[16px] bg-white border border-ink-200 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green"
                  >
                    <img
                      src={IMAGES[h.logoKey]}
                      alt={t(h.nameKey)}
                      className="max-w-full max-h-[100px] lg:max-h-[140px] object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 底部实验报告截图 */}
            <img
              src={IMAGES[PRODUCT_PAGE.endorsements.clinical.reportImageKey]}
              alt={t("product:ui.clinicalReportAlt")}
              className="w-full object-contain"
            />
            {/* 报告外部左下方声明小字 */}
            <p className="text-[12px] text-ink-500 leading-[18px] text-left mt-[10px] whitespace-pre-line">
              {t(PRODUCT_PAGE.endorsements.clinical.reportDisclaimerKey)}
            </p>
          </Reveal>

          {/* 4.7.3 国家专利认证 - 专利矩阵图 */}
          <Reveal variant="scale">
            <SubSectionTitle title={t(PRODUCT_PAGE.endorsements.patents.titleKey)} className="mb-[24px]" />
            <img
              src={IMAGES[PRODUCT_PAGE.endorsements.patents.imageKey]}
              alt={t(PRODUCT_PAGE.endorsements.patents.titleKey)}
              className="w-full object-contain"
            />
            <p className="text-[12px] text-ink-500 leading-[18px] text-left mt-[10px]">
              {t(PRODUCT_PAGE.endorsements.patents.imageNoteKey)}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          6. 听力服务中心
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 标题区 - 居中 + 绿色短横线 */}
          <Reveal>
            <SectionTitle title={t(PRODUCT_PAGE.serviceCenter.titleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 大声听力服务中心 一站式耳科服务 (左文右图) */}
          <Reveal variant="fade-up" className="mb-[40px] lg:mb-[50px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.serviceCenter.intro.titleKey)} className="mb-[24px]" />
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-[24px] lg:gap-[40px] items-center">
              {/* 左侧文本 */}
              <div>
                {PRODUCT_PAGE.serviceCenter.intro.descKeys.map((key, idx) => (
                  <p
                    key={idx}
                    className="text-[14px] lg:text-[15px] text-ink-700 leading-[26px] lg:leading-[28px] mb-4 text-left last:mb-0"
                  >
                    {t(key)}
                  </p>
                ))}
              </div>
              {/* 右侧配图 */}
              <div className="overflow-hidden">
                <img
                  src={IMAGES[PRODUCT_PAGE.serviceCenter.intro.imageKey]}
                  alt={t(PRODUCT_PAGE.serviceCenter.intro.titleKey)}
                  className="w-full h-[220px] lg:h-[320px] object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.04]"
                />
              </div>
            </div>
          </Reveal>

          {/* 三甲医院同等 百万级检查设备 */}
          <Reveal variant="scale-up" className="mb-[40px] lg:mb-[50px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.serviceCenter.equipment.titleKey)} className="mb-[24px]" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px] lg:gap-[24px]">
              {PRODUCT_PAGE.serviceCenter.equipment.items.map((item, idx) => (
                <Reveal key={idx} variant="scale-up" delay={(idx % 3) * 80}>
                  <div
                    className="group bg-ink-100 border border-ink-200 overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:bg-white hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]"
                  >
                    <div className="aspect-[4/3] bg-ink-100 overflow-hidden">
                      <img
                        src={IMAGES[item.imageKey]}
                        alt={t(item.titleKey)}
                        className="w-full h-full object-cover transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
                      />
                    </div>
                    <div className="p-[14px] lg:p-[16px] text-center">
                      <p className="text-[14px] font-bold text-ink-700 leading-[20px] mb-[4px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                        {t(item.titleKey)}
                      </p>
                      <p className="text-[12px] text-ink-500 leading-[18px]">
                        {t(item.subtitleKey)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          {/* 耳科级"声处方"指定 / 听力专家远程 AI 验配服务 */}
          <Reveal className="mb-[40px] lg:mb-[50px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.serviceCenter.remoteTitleKey)} className="mb-[24px]" />

            {/* "声处方"前后端协同专业验配流程图 (纯 SVG) - 桌面端 (仅 ≥1024px 显示) */}
            <div className="hidden lg:block">
              <div className="relative w-[1200px] h-[680px] mx-auto">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1200 680"
              >
                <defs>
                  <marker
                    id="arrowGreen"
                    markerWidth="10"
                    markerHeight="10"
                    refX="8"
                    refY="3"
                    orient="auto"
                    markerUnits="strokeWidth"
                  >
                    <path d="M0,0 L8,3 L0,6 Z" fill="#05a045" />
                  </marker>
                </defs>

                {/* 左列标题 */}
                <text x="200" y="38" textAnchor="middle" fill="#05a045" fontSize="22" fontWeight="700" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.leftColTitleKey)}
                </text>
                <text x="200" y="62" textAnchor="middle" fill="#666" fontSize="14" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.leftColSubKey)}
                </text>

                {/* 右列标题 */}
                <text x="600" y="38" textAnchor="middle" fill="#05a045" fontSize="22" fontWeight="700" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.rightColTitleKey)}
                </text>
                <text x="600" y="62" textAnchor="middle" fill="#666" fontSize="14" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.rightColSubKey)}
                </text>

                {/* 右侧序号栏标题 */}
                <text x="1065" y="38" textAnchor="middle" fill="#05a045" fontSize="22" fontWeight="700" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.stepColTitleKey)}
                </text>
                <text x="1065" y="62" textAnchor="middle" fill="#666" fontSize="14" className="hidden lg:block">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.stepColSubKey)}
                </text>

                {/* 中间虚线分隔线 */}
                <line x1="400" y1="90" x2="400" y2="630" stroke="#c8e6d3" strokeWidth="1" strokeDasharray="4 4" />
                <line x1="800" y1="90" x2="800" y2="630" stroke="#c8e6d3" strokeWidth="1" strokeDasharray="4 4" />

                {/* 左列 5 节点 */}
                {PRODUCT_PAGE.serviceCenter.processChart.leftNodesKeys.map((key, idx) => {
                  const yList = [130, 200, 270, 480, 550];
                  const y = yList[idx];
                  const k = `left-${idx}`;
                  const isHovered = hoveredNode === k;
                  return (
                    <g
                      key={k}
                      onMouseEnter={() => setHoveredNode(k)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: "default" }}
                    >
                      <rect
                        x="60"
                        y={y - 23}
                        width="280"
                        height="46"
                        rx="23"
                        ry="23"
                        fill={isHovered ? "#f0f9f4" : "white"}
                        stroke={isHovered ? "#05a045" : "#c8e6d3"}
                        strokeWidth={isHovered ? 2 : 1.5}
                        style={{ transition: "all 0.3s ease" }}
                      />
                      <text
                        x="200"
                        y={y + 5}
                        textAnchor="middle"
                        fill={isHovered ? "#05a045" : "#333"}
                        fontSize="14"
                        fontWeight={isHovered ? 700 : 500}
                        className="hidden lg:block"
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {t(key)}
                      </text>
                    </g>
                  );
                })}

                {/* 右列 3 节点 */}
                {PRODUCT_PAGE.serviceCenter.processChart.rightNodesKeys.map((key, idx) => {
                  const yList = [270, 340, 410];
                  const y = yList[idx];
                  const k = `right-${idx}`;
                  const isHovered = hoveredNode === k;
                  return (
                    <g
                      key={k}
                      onMouseEnter={() => setHoveredNode(k)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: "default" }}
                    >
                      <rect
                        x="460"
                        y={y - 23}
                        width="280"
                        height="46"
                        rx="23"
                        ry="23"
                        fill={isHovered ? "#f0f9f4" : "white"}
                        stroke={isHovered ? "#05a045" : "#c8e6d3"}
                        strokeWidth={isHovered ? 2 : 1.5}
                        style={{ transition: "all 0.3s ease" }}
                      />
                      <text
                        x="600"
                        y={y + 5}
                        textAnchor="middle"
                        fill="#05a045"
                        fontSize={isHovered ? 15 : 14}
                        fontWeight="700"
                        className="hidden lg:block"
                        style={{ transition: "all 0.3s ease" }}
                      >
                        {t(key)}
                      </text>
                    </g>
                  );
                })}

                {/* 右侧序号栏 3 项 */}
                {PRODUCT_PAGE.serviceCenter.processChart.stepsKeys.map((step, idx) => {
                  const yList = [270, 340, 410];
                  const y = yList[idx];
                  const num = String(idx + 1).padStart(2, "0");
                  const k = `step-${idx}`;
                  const isHovered = hoveredNode === k;
                  return (
                    <g
                      key={k}
                      onMouseEnter={() => setHoveredNode(k)}
                      onMouseLeave={() => setHoveredNode(null)}
                      style={{ cursor: "default" }}
                    >
                      <rect
                        x="820"
                        y={y - 28}
                        width="360"
                        height="56"
                        rx="8"
                        ry="8"
                        fill={isHovered ? "#f0f9f4" : "transparent"}
                        style={{ transition: "fill 0.3s ease" }}
                      />
                      <text
                        x="850"
                        y={y + 12}
                        textAnchor="middle"
                        fill="#05a045"
                        fontSize="42"
                        fontWeight="700"
                        opacity={isHovered ? 0.5 : 0.18}
                        style={{ transition: "opacity 0.3s ease" }}
                      >
                        {num}
                      </text>
                      <text
                        x="920"
                        y={y - 6}
                        textAnchor="start"
                        fill={isHovered ? "#05a045" : "#333"}
                        fontSize="15"
                        fontWeight="700"
                        className="hidden lg:block"
                        style={{ transition: "fill 0.3s ease" }}
                      >
                        {t(step.titleKey)}
                      </text>
                      <text
                        x="920"
                        y={y + 14}
                        textAnchor="start"
                        fill="#666"
                        fontSize="12"
                        className="hidden lg:block"
                      >
                        {t(step.descKey)}
                      </text>
                    </g>
                  );
                })}

                {/* ========== 9 条流程箭头 ========== */}
                <line x1="200" y1="153" x2="200" y2="175" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <line x1="200" y1="223" x2="200" y2="245" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <path d="M 340 200 L 400 200 L 400 270 L 460 270" fill="none" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <line x1="600" y1="293" x2="600" y2="315" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <line x1="600" y1="363" x2="600" y2="385" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <path d="M 460 410 L 400 410 L 400 480 L 340 480" fill="none" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <path d="M 60 270 L 20 270 L 20 480 L 60 480" fill="none" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <path d="M 340 490 L 770 490 L 770 270 L 740 270" fill="none" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />
                <line x1="200" y1="503" x2="200" y2="525" stroke="#05a045" strokeWidth="1.5" markerEnd="url(#arrowGreen)" />

                {/* 标注文字 */}
                <text
                  x="400"
                  y="238"
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                  stroke="white"
                  strokeWidth="4"
                  paintOrder="stroke"
                  className="hidden lg:block"
                >
                  {t(PRODUCT_PAGE.serviceCenter.processChart.arrowUploadLabelKey)}
                </text>
                <text
                  x="770"
                  y="385"
                  textAnchor="middle"
                  fill="#666"
                  fontSize="12"
                  stroke="white"
                  strokeWidth="4"
                  paintOrder="stroke"
                  className="hidden lg:block"
                >
                  {t(PRODUCT_PAGE.serviceCenter.processChart.arrowFeedbackLabelKey)}
                </text>
              </svg>
              </div>
            </div>

            {/* 移动端: 双通道协同图 (前端验配师 ↓ / 后端听力专家 ↑ 相向而行, 底部流向图例 + 大数字步骤) */}
            <div className="lg:hidden w-full">
              {/* 列标题 (与下方节点列同宽对齐) */}
              <div className="grid grid-cols-[1fr_40px_1fr] mb-[18px]">
                <div>
                  <p className="text-[14px] font-bold text-brand-green leading-[20px]">
                    {t(PRODUCT_PAGE.serviceCenter.processChart.leftColTitleKey)}
                  </p>
                  <p className="text-[11px] text-ink-500 leading-[16px] mt-[2px]">
                    {t(PRODUCT_PAGE.serviceCenter.processChart.leftColSubKey)}
                  </p>
                </div>
                {/* 中间 40px 间隔列占位 (否则右列标题会被挤进该列, 文字竖排) */}
                <div />
                <div className="text-right">
                  <p className="text-[14px] font-bold text-brand-green leading-[20px]">
                    {t(PRODUCT_PAGE.serviceCenter.processChart.rightColTitleKey)}
                  </p>
                  <p className="text-[11px] text-ink-500 leading-[16px] mt-[2px]">
                    {t(PRODUCT_PAGE.serviceCenter.processChart.rightColSubKey)}
                  </p>
                </div>
              </div>

              {/* 双通道主体: 左列上→下 / 右列下→上 (相向而行) */}
              <div className="relative h-[400px]">
                {/* 中轴虚线 */}
                <div className="absolute left-1/2 top-0 bottom-0 -translate-x-1/2 border-l border-dashed border-[#c8e6d3]" />

                {/* 左列 5 节点 (前端验配师, 上→下) */}
                {PRODUCT_PAGE.serviceCenter.processChart.leftNodesKeys.map((k, idx) => (
                  <div key={`l-${idx}`} className="absolute left-0 w-[calc(50%-20px)]" style={{ top: idx * 80 }}>
                    <div className="min-h-[46px] flex items-center justify-center rounded-full bg-white border border-brand-green px-[10px] py-[8px] text-center shadow-[0_2px_8px_rgba(5,160,69,0.08)]">
                      <span className="text-[11px] text-ink-700 font-medium leading-[16px]">{t(k)}</span>
                    </div>
                  </div>
                ))}
                {/* 左列连接箭头 ↓ */}
                {PRODUCT_PAGE.serviceCenter.processChart.leftNodesKeys.slice(0, -1).map((_, idx) => (
                  <div
                    key={`la-${idx}`}
                    className="absolute left-[calc(25%-8px)] w-[16px] text-center text-brand-green text-[15px] leading-none"
                    style={{ top: idx * 80 + 50 }}
                  >
                    ↓
                  </div>
                ))}

                {/* 右列 3 节点 (后端听力专家, 下→上 相向而行) */}
                {PRODUCT_PAGE.serviceCenter.processChart.rightNodesKeys.map((k, idx) => {
                  const ys = [240, 120, 0];
                  const y = ys[idx];
                  return (
                    <div key={`r-${idx}`} className="absolute right-0 w-[calc(50%-20px)]" style={{ top: y }}>
                      <div className="min-h-[46px] flex items-center justify-center rounded-full bg-brand-green px-[10px] py-[8px] text-center shadow-[0_4px_12px_rgba(5,160,69,0.25)]">
                        <span className="text-[11px] text-white font-bold leading-[16px]">{t(k)}</span>
                      </div>
                    </div>
                  );
                })}
                {/* 右列连接箭头 ↑ */}
                {PRODUCT_PAGE.serviceCenter.processChart.rightNodesKeys.slice(0, -1).map((_, idx) => {
                  const ys = [240, 120, 0];
                  return (
                    <div
                      key={`ra-${idx}`}
                      className="absolute right-[calc(25%-8px)] w-[16px] text-center text-brand-green text-[15px] leading-none"
                      style={{ top: ys[idx + 1] + 50 }}
                    >
                      ↑
                    </div>
                  );
                })}
              </div>

              {/* 流向图例: 虚线连接两端, 数据上传 (→) / 试听反馈 (←) 对称 */}
              <div className="mt-[18px] relative">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-brand-green/25" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-[5px] bg-white pr-[6px] text-brand-green">
                    <span className="text-[12px] leading-none">→</span>
                    <span className="text-[11px] font-bold leading-[15px]">
                      {t(PRODUCT_PAGE.serviceCenter.processChart.arrowUploadLabelKey)}
                    </span>
                  </div>
                  <div className="flex items-center gap-[5px] bg-white pl-[6px] text-brand-green">
                    <span className="text-[11px] font-bold leading-[15px]">
                      {t(PRODUCT_PAGE.serviceCenter.processChart.arrowFeedbackLabelKey)}
                    </span>
                    <span className="text-[12px] leading-none">←</span>
                  </div>
                </div>
              </div>

              {/* 3 大步骤里程碑 (大数字 + 标题 + 描述, 数字顶对齐文本) */}
              <div className="mt-[26px]">
                <p className="text-[14px] font-bold text-brand-green leading-[20px] mb-[14px]">
                  {t(PRODUCT_PAGE.serviceCenter.processChart.stepColTitleKey)}
                </p>
                <div>
                  {PRODUCT_PAGE.serviceCenter.processChart.stepsKeys.map((step, idx) => (
                    <div key={idx} className="relative flex gap-[16px] pb-[20px] last:pb-0">
                      <div className="relative shrink-0 w-[48px]">
                        <span className="block text-[34px] font-bold text-brand-green leading-[34px] opacity-25 tracking-tight">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        {idx < PRODUCT_PAGE.serviceCenter.processChart.stepsKeys.length - 1 && (
                          <div className="absolute left-[24px] top-[36px] bottom-[-20px] w-[2px] bg-gradient-to-b from-brand-green/30 to-brand-green/5" />
                        )}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-ink-700 leading-[19px]">
                          {t(step.titleKey)}
                        </p>
                        <p className="text-[11px] text-ink-500 leading-[16px] mt-[2px]">
                          {t(step.descKey)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>

          {/* 门店地址 - 独立模块: 3 个服务卡片 + 地址信息 */}
          <Reveal variant="scale-up">
            {/* 三个可 hover 服务卡片 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] lg:gap-[20px] mb-[30px] lg:mb-[40px]">
              {PRODUCT_PAGE.serviceCenter.storeCardsKeys.map((card, idx) => (
                <div
                  key={idx}
                  className="group bg-white border border-ink-200 hover:border-brand-green hover:bg-[#f6fbf8] hover:-translate-y-[4px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] cursor-pointer"
                  style={{ padding: "28px 24px" }}
                >
                  {/* 图标方框 */}
                  <div
                    className="flex items-center justify-center mb-[18px] bg-ink-100 group-hover:bg-brand-green transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                    style={{ width: "48px", height: "48px" }}
                  >
                    <svg
                      className="w-6 h-6 text-ink-500 group-hover:text-white transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      {idx === 0 && (
                        <path
                          d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                        />
                      )}
                      {idx === 1 && (
                        <>
                          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
                        </>
                      )}
                      {idx === 2 && (
                        <path
                          d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                        />
                      )}
                    </svg>
                  </div>
                  {/* 标题 */}
                  <h4 className="text-[18px] text-ink-700 group-hover:text-brand-green font-bold leading-[26px] mb-[8px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]">
                    {t(card.titleKey)}
                  </h4>
                  {/* 描述 */}
                  <p className="text-[13px] text-ink-500 leading-[20px]">
                    {t(card.descKey)}
                  </p>
                </div>
              ))}
            </div>

            {/* 地址信息 - 横向简洁布局 */}
            <div className="bg-[#f8f9fa] flex flex-col sm:flex-row items-start sm:items-center" style={{ padding: "20px 16px", gap: "16px" }}>
              <div className="sm:hidden text-[12px] text-ink-400 leading-[18px]">
                {t(PRODUCT_PAGE.serviceCenter.directStore.labelKey)}
              </div>
              {/* 地址图标方框 */}
              <div
                className="flex items-center justify-center shrink-0 sm:mr-[24px] bg-brand-green"
                style={{ width: "48px", height: "48px" }}
              >
                <svg
                  className="w-6 h-6 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* 地址文本 */}
              <div className="flex-1">
                <p className="hidden sm:block text-[12px] text-ink-400 leading-[18px] mb-[6px]">
                  {t(PRODUCT_PAGE.serviceCenter.directStore.labelKey)}
                </p>
                <p className="text-[14px] sm:text-[16px] text-ink-700 font-bold leading-[22px] sm:leading-[24px] mb-[8px]">
                  {t(PRODUCT_PAGE.serviceCenter.directStore.addressKey)}
                </p>
                <div className="flex items-center gap-[10px]">
                  <span className="text-[12px] sm:text-[13px] text-ink-400">
                    {t(PRODUCT_PAGE.serviceCenter.consultingPhoneLabelKey)}
                  </span>
                  <span className="text-[14px] sm:text-[16px] text-brand-green font-bold leading-[22px] sm:leading-[24px]">
                    {PRODUCT_PAGE.serviceCenter.directStore.phone}
                  </span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          7. 全生命周期服务
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 标题区 */}
          <Reveal>
            <SectionTitle title={t(PRODUCT_PAGE.lifecycleService.titleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 售前服务 - 4 个环节, 用箭头串联 */}
          <Reveal variant="scale-up" className="mb-[30px] lg:mb-[40px]">
            <SubSectionTitle title={t(PRODUCT_PAGE.lifecycleService.presalesTitleKey)} className="mb-[24px] lg:mb-[30px]" />
            <div className="grid grid-cols-2 gap-[12px] lg:flex lg:items-stretch lg:justify-center lg:gap-0 lg:overflow-visible">
              {PRODUCT_PAGE.lifecycleService.presalesKeys.map((item, idx) => (
                <div key={idx} className="flex items-stretch">
                  <div
                    className="group flex flex-col items-center justify-center text-center border border-ink-200 hover:border-brand-green hover:-translate-y-[4px] hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] bg-white w-full lg:w-[180px]"
                    style={{ padding: "16px" }}
                  >
                    <span className="text-[14px] sm:text-[16px] text-brand-green font-bold leading-[22px] sm:leading-[24px] mb-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[14px] sm:text-[16px] text-ink-700 font-bold leading-[22px] sm:leading-[24px] mb-1 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                      {t(item.titleKey)}
                    </span>
                    <span className="text-[11px] sm:text-[12px] text-ink-500 leading-[16px] sm:leading-[18px]">
                      {t(item.descKey)}
                    </span>
                  </div>
                  {idx < PRODUCT_PAGE.lifecycleService.presalesKeys.length - 1 && (
                    <div className="hidden lg:flex items-center justify-center w-[40px] shrink-0">
                      <svg
                        className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green-light"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          {/* 售中 · 售后服务 - U 形弯道时间轴 (8 大保障) */}
          <Reveal variant="scale">
            <SubSectionTitle title={t(PRODUCT_PAGE.lifecycleService.postalesTitleKey)} className="mb-[40px] lg:mb-[60px]" />

            {/* ===== 桌面端: U 形弯道时间轴 (仅 ≥1024px 显示) ===== */}
            <div className="hidden lg:block">
              <div className="relative w-[1200px] h-[580px] mx-auto">
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1200 580"
              >
                <defs>
                  <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2ecc71" />
                    <stop offset="50%" stopColor="#05a045" />
                    <stop offset="100%" stopColor="#047a35" />
                  </linearGradient>
                </defs>

                <path
                  d="M 60 280
                     L 60 180
                     C 60 100, 214 100, 214 180
                     L 214 280
                     L 214 380
                     C 214 460, 368 460, 368 380
                     L 368 280
                     L 368 180
                     C 368 100, 522 100, 522 180
                     L 522 280
                     L 522 380
                     C 522 460, 676 460, 676 380
                     L 676 280
                     L 676 180
                     C 676 100, 830 100, 830 180
                     L 830 280
                     L 830 380
                     C 830 460, 984 460, 984 380
                     L 984 280
                     L 984 180
                     C 984 100, 1138 100, 1138 180
                     L 1138 280"
                  fill="none"
                  stroke="url(#ribbonGradient)"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {[
                  { x: 60, y: 280 },
                  { x: 214, y: 280 },
                  { x: 368, y: 280 },
                  { x: 522, y: 280 },
                  { x: 676, y: 280 },
                  { x: 830, y: 280 },
                  { x: 984, y: 280 },
                  { x: 1138, y: 280 },
                ].map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="24" fill="#05a045" stroke="#ffffff" strokeWidth="3" />
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                ))}

                <path d="M 1138 273 L 1152 280 L 1138 287 Z" fill="#05a045" />
              </svg>

              {/* 8 个节点标签 (上下交替) */}
              {PRODUCT_PAGE.lifecycleService.postalesKeys.map((item, idx) => {
                const positions = [
                  { x: 60, y: 280, side: "top" as const },
                  { x: 214, y: 280, side: "bottom" as const },
                  { x: 368, y: 280, side: "top" as const },
                  { x: 522, y: 280, side: "bottom" as const },
                  { x: 676, y: 280, side: "top" as const },
                  { x: 830, y: 280, side: "bottom" as const },
                  { x: 984, y: 280, side: "top" as const },
                  { x: 1138, y: 280, side: "bottom" as const },
                ];
                const pos = positions[idx];
                return (
                  <div
                    key={idx}
                    className="absolute group cursor-default"
                    style={{
                      left: `${pos.x}px`,
                      top: `${pos.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <div className="w-[48px] h-[48px]" />

                    <div
                      className="absolute left-1/2 -translate-x-1/2 bg-white border border-ink-200 group-hover:border-brand-green transition-colors duration-300"
                      style={{
                        width: "180px",
                        padding: "12px 14px",
                        borderRadius: "6px",
                        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                        ...(pos.side === "top"
                          ? { bottom: "52px" }
                          : { top: "52px" }),
                      }}
                    >
                      <div className="w-[6px] h-[6px] rounded-full bg-brand-green mx-auto mb-[8px]" />
                      <p className="text-[14px] text-ink-700 font-bold leading-[20px] mb-[4px] group-hover:text-brand-green transition-colors duration-300 text-center">
                        {t(item.titleKey)}
                      </p>
                      <p className="text-[12px] text-ink-500 leading-[17px] text-center">
                        {t(item.descKey)}
                      </p>
                    </div>
                  </div>
                );
              })}
              </div>
            </div>

            {/* ===== 移动端: 蛇形丝带时间轴 (保留绿丝带+节点设计语言, 折返式曲线适配窄宽) ===== */}
            <div className="lg:hidden w-full relative" style={{ aspectRatio: "400 / 760" }}>
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 760">
                <defs>
                  <linearGradient id="ribbonGradientMobile" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2ecc71" />
                    <stop offset="50%" stopColor="#05a045" />
                    <stop offset="100%" stopColor="#047a35" />
                  </linearGradient>
                </defs>
                {/* 蛇形丝带路径: 左侧小幅左右折返 */}
                <path
                  d="M 52 36
                     C 52 83, 108 83, 108 130
                     C 108 177, 52 177, 52 224
                     C 52 271, 108 271, 108 318
                     C 108 365, 52 365, 52 412
                     C 52 459, 108 459, 108 506
                     C 108 553, 52 553, 52 600
                     C 52 647, 108 647, 108 694"
                  fill="none"
                  stroke="url(#ribbonGradientMobile)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 8 个节点 */}
                {[
                  { x: 52, y: 36 },
                  { x: 108, y: 130 },
                  { x: 52, y: 224 },
                  { x: 108, y: 318 },
                  { x: 52, y: 412 },
                  { x: 108, y: 506 },
                  { x: 52, y: 600 },
                  { x: 108, y: 694 },
                ].map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="15" fill="#05a045" stroke="#ffffff" strokeWidth="2.5" />
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="700"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </text>
                  </g>
                ))}
                <path d="M 124 687 L 138 694 L 124 701 Z" fill="#05a045" />
              </svg>

              {/* 8 个节点标签 (统一右列左对齐, 与左侧节点保持对齐) */}
              {PRODUCT_PAGE.lifecycleService.postalesKeys.map((item, idx) => {
                const nodes = [
                  { y: 36 },
                  { y: 130 },
                  { y: 224 },
                  { y: 318 },
                  { y: 412 },
                  { y: 506 },
                  { y: 600 },
                  { y: 694 },
                ];
                const n = nodes[idx];
                return (
                  <div
                    key={`sn-${idx}`}
                    className="absolute"
                    style={{
                      left: "40%",
                      top: `${(n.y / 760) * 100}%`,
                      transform: "translate(0, -50%)",
                      width: "60%",
                      textAlign: "left",
                    }}
                  >
                    <div className="flex items-center gap-[6px] mb-[4px]">
                      <span className="w-[5px] h-[5px] rounded-full bg-brand-green shrink-0" />
                      <span className="text-[10px] text-brand-green font-bold leading-none tracking-[0.08em]">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="text-[14px] text-ink-700 font-bold leading-[20px]">
                      {t(item.titleKey)}
                    </p>
                    <p className="text-[11px] text-ink-500 leading-[16px] mt-[2px]">
                      {t(item.descKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          8. 售后保修政策 (4 章节)
          ============================================================ */}
      <section className="bg-ink-100 full-bleed">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 标题区 */}
          <Reveal>
            <SectionTitle title={t(PRODUCT_PAGE.warranty.titleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 4 章节卡片 - 2 列布局 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] lg:gap-[20px]">
            {PRODUCT_PAGE.warranty.sectionsKeys.map((section, idx) => (
              <Reveal key={idx} variant="scale-up" delay={(idx % 2) * 100}>
                <div className="group bg-white border border-ink-200 h-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.10)]" style={{ padding: "20px" }}>
                  <div className="flex items-baseline mb-3 pb-3 border-b border-ink-200">
                    <span className="text-[36px] font-bold text-brand-green leading-[40px] mr-3 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 inline-block">
                      {section.number}
                    </span>
                    <h3 className="text-[18px] text-ink-700 font-bold leading-[27px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                      {t(section.titleKey)}
                    </h3>
                  </div>
                  <p className="text-[13px] text-ink-600 leading-[24px] whitespace-pre-line">
                    {t(section.contentKey)}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          9. FAQ 模块 (GEO 核心, 4 条高频问答 + FAQPage JSON-LD)
          ============================================================ */}
      <FaqSection scope="product" />

    </>
  );
}

/* ============================================================
   中文助听核心技术 - 环形扇区图 (复刻原型 §4.6)
   ============================================================ */

type FanChartData = typeof PRODUCT_PAGE.coreTech.fanChart;
type SectorIcon = FanChartData["sectors"][number]["icon"];

/** 标准数学极坐标: 0°=右, 逆时针增加, y 轴向上 */
function polar(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy - radius * Math.sin(rad),
  };
}

/** 环形扇区路径 */
function annularSectorPath(
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polar(cx, cy, outerR, startAngle);
  const outerEnd = polar(cx, cy, outerR, endAngle);
  const innerEnd = polar(cx, cy, innerR, endAngle);
  const innerStart = polar(cx, cy, innerR, startAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${outerStart.x} ${outerStart.y} A ${outerR} ${outerR} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y} L ${innerEnd.x} ${innerEnd.y} A ${innerR} ${innerR} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y} Z`;
}

/** 扇区中心图标 */
function FanIcon({ type, className }: { type: SectorIcon; className?: string }) {
  const iconClass = className || "w-full h-full";
  switch (type) {
    case "wave":
      return (
        <svg className={iconClass} viewBox="0 0 32 32" fill="none">
          <rect x="4" y="13" width="4" height="6" rx="1" fill="currentColor" />
          <rect x="10" y="9" width="4" height="14" rx="1" fill="currentColor" />
          <rect x="16" y="5" width="4" height="22" rx="1" fill="currentColor" />
          <rect x="22" y="10" width="4" height="12" rx="1" fill="currentColor" />
          <rect x="28" y="13" width="2" height="6" rx="1" fill="currentColor" />
        </svg>
      );
    case "ai":
      return (
        <svg className={iconClass} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
          <text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="bold" fill="currentColor">
            AI
          </text>
        </svg>
      );
    case "speaker":
      return (
        <svg className={iconClass} viewBox="0 0 32 32" fill="none">
          <path d="M8 12h4l6-5v18l-6-5H8V12z" fill="currentColor" />
          <path d="M23 11l6 5.5M29 11l-6 5.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      );
    case "scene":
      return (
        <svg className={iconClass} viewBox="0 0 32 32" fill="none">
          <path d="M7 8l9 8-9 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M17 8l9 8-9 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "ear":
      return (
        <svg className={iconClass} viewBox="0 0 32 32" fill="none">
          <path
            d="M11 11c0-3.5 3.5-6 7-6s7 2.5 7 6c0 2.5-1.5 4.5-2.5 6s-1.5 3.5-1.5 5 0.5 2.5 2.5 2.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="20" cy="11" r="2.2" fill="currentColor" />
          <path d="M16 21c0 2 1.5 3.5 3.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    default:
      return null;
  }
}

function ChineseTechFanChart({ data, t }: { data: FanChartData; t: TFunction }) {
  // 取 i18n 对象用于 exists() 检查 (TFunction 本身没有 exists 方法)
  const { i18n } = useTranslation("product");
  const CX = 360;
  const CY = 260;
  const GREEN_OUTER = data.greenSector.outerRadius;
  const GREEN_INNER = data.greenSector.innerRadius;

  const greenMid = (data.greenSector.startAngle + data.greenSector.endAngle) / 2;

  const RADIAL_EXT = 14;
  const LEFT_COL = CX - 300;
  const RIGHT_COL = CX + 300;

  const GREEN_IDX = data.sectors.length;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const HOVER_FILL = "#05a045";
  const getFill = (idx: number) => {
    if (hoveredIdx === idx) return HOVER_FILL;
    return idx === GREEN_IDX ? data.greenSector.color : data.sectors[idx].color;
  };
  const getHighlightClass = (idx: number) => "text-brand-green";
  const getStroke = (idx: number) => {
    if (hoveredIdx === idx) return HOVER_FILL;
    return idx === GREEN_IDX ? data.greenSector.color : "#999";
  };
  const getIconBg = (idx: number) => (hoveredIdx === idx ? "#ffffff" : "#444444");
  const getIconColor = (idx: number) => (hoveredIdx === idx ? HOVER_FILL : "#ffffff");
  const getCenterColor = (idx: number) => "#ffffff";
  const getCenterRing = (idx: number) => "#ffffff";

  const blackGuides = data.sectors.map((sector) => {
    const mid = (sector.startAngle + sector.endAngle) / 2;
    const p0 = polar(CX, CY, sector.outerRadius, mid);
    const p1 = polar(CX, CY, sector.outerRadius + RADIAL_EXT, mid);
    const onRight = p1.x >= CX;
    const labelX = onRight ? RIGHT_COL : LEFT_COL;
    const labelY = p1.y;
    return { p0, p1, labelX, labelY, onRight };
  });

  const greenP0 = polar(CX, CY, GREEN_OUTER, greenMid);
  const greenP1 = polar(CX, CY, GREEN_OUTER + RADIAL_EXT, greenMid);
  const greenOnRight = greenP1.x >= CX;
  const greenLabelX = greenOnRight ? RIGHT_COL + 20 : LEFT_COL - 20;
  const greenLabelY = greenP1.y;

  return (
    <>
    {/* 扇形图容器: 仅桌面端显示 (移动端使用下方阶梯图) */}
    <div className="hidden lg:block relative w-[760px] h-[540px] mx-auto">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 760 540">
        {/* 绿色扇区 */}
        <path
          d={annularSectorPath(CX, CY, GREEN_OUTER, GREEN_INNER, data.greenSector.startAngle, data.greenSector.endAngle)}
          fill={getFill(GREEN_IDX)}
          onMouseEnter={() => setHoveredIdx(GREEN_IDX)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{ cursor: "pointer", transition: "fill 0.2s ease" }}
        />

        {/* 黑色扇区 */}
        {data.sectors.map((sector, idx) => (
          <path
            key={idx}
            d={annularSectorPath(CX, CY, sector.outerRadius, sector.innerRadius, sector.startAngle, sector.endAngle)}
            fill={getFill(idx)}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{ cursor: "pointer", transition: "fill 0.2s ease" }}
          />
        ))}

        {/* 中心圆孔 */}
        <circle cx={CX} cy={CY} r={GREEN_INNER} fill="#ffffff" />

        {/* 绿色扇区中心 "中" 字圆环 */}
        <circle
          cx={polar(CX, CY, (GREEN_OUTER + GREEN_INNER) / 2, greenMid).x}
          cy={polar(CX, CY, (GREEN_OUTER + GREEN_INNER) / 2, greenMid).y}
          r="22"
          fill="none"
          stroke={getCenterRing(GREEN_IDX)}
          strokeWidth="2"
          style={{ transition: "stroke 0.2s ease" }}
        />

        {/* 黑色扇区折线引出 */}
        {blackGuides.map((g, idx) => (
          <polyline
            key={`bl-${idx}`}
            className="hidden lg:block"
            points={`${g.p0.x},${g.p0.y} ${g.p1.x},${g.p1.y} ${g.labelX},${g.labelY}`}
            fill="none"
            stroke={getStroke(idx)}
            strokeWidth="1"
            style={{ transition: "stroke 0.2s ease" }}
          />
        ))}

        {/* 绿色扇区折线引出 */}
        <polyline
          className="hidden lg:block"
          points={`${greenP0.x},${greenP0.y} ${greenP1.x},${greenP1.y} ${greenLabelX},${greenLabelY}`}
          fill="none"
          stroke={getStroke(GREEN_IDX)}
          strokeWidth="1"
          style={{ transition: "stroke 0.2s ease" }}
        />
      </svg>

      {/* 绿色扇区标签 (仅桌面端) */}
      <div
        className="absolute hidden lg:block"
        style={{
          left: greenLabelX,
          top: greenLabelY,
          transform: greenOnRight ? "translate(0, -50%)" : "translate(-100%, -50%)",
          textAlign: greenOnRight ? "left" : "right",
          maxWidth: "280px",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHoveredIdx(GREEN_IDX)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        <div className={`text-[17px] font-bold leading-[26px] whitespace-normal ${getHighlightClass(GREEN_IDX)}`}>
          [ {t(`${data.centerSubKey}`)} ]
        </div>
        <div className={`text-[13px] leading-[20px] whitespace-normal ${getHighlightClass(GREEN_IDX)}`}>
          {t(`${data.centerHintKey}`)}
        </div>
      </div>

      {/* 绿色扇区中心 "中" 字 (桌面端) */}
      <div
        className="absolute hidden lg:flex items-center justify-center text-[26px] font-bold"
        style={{
          left: polar(CX, CY, (GREEN_OUTER + GREEN_INNER) / 2, greenMid).x,
          top: polar(CX, CY, (GREEN_OUTER + GREEN_INNER) / 2, greenMid).y,
          width: "44px",
          height: "44px",
          transform: "translate(-50%, -50%)",
          color: getCenterColor(GREEN_IDX),
          transition: "color 0.2s ease",
          cursor: "pointer",
        }}
        onMouseEnter={() => setHoveredIdx(GREEN_IDX)}
        onMouseLeave={() => setHoveredIdx(null)}
      >
        {t(data.centerTextKey)}
      </div>

      {/* 黑色扇区图标 (仅桌面端) */}
      {data.sectors.map((sector, idx) => {
        const mid = (sector.startAngle + sector.endAngle) / 2;
        const pos = polar(CX, CY, (sector.outerRadius + sector.innerRadius) / 2, mid);
        return (
          <div
            key={`icon-${idx}`}
            className="absolute hidden lg:flex items-center justify-center rounded-full"
            style={{
              left: pos.x,
              top: pos.y,
              width: "36px",
              height: "36px",
              transform: "translate(-50%, -50%)",
              padding: "7px",
              backgroundColor: getIconBg(idx),
              color: getIconColor(idx),
              border: `2px solid ${hoveredIdx === idx ? "#ffffff" : "transparent"}`,
              transition: "background-color 0.2s ease, color 0.2s ease, border-color 0.2s ease",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            <FanIcon type={sector.icon} />
          </div>
        );
      })}

      {/* 黑色扇区标签 (折线末端, 水平对齐) */}
      {data.sectors.map((sector, idx) => {
        const g = blackGuides[idx];
        // 通过 i18n key 拉取该扇区的所有文案 (prefix / highlight / sub / connector / suffix)
        const prefix = t(`${sector.i18nPrefix}.prefix`);
        const highlight = t(`${sector.i18nPrefix}.highlight`);
        const sub = t(`${sector.i18nPrefix}.sub`);
        const connector = t(`${sector.i18nPrefix}.connector`);
        const suffix = t(`${sector.i18nPrefix}.suffix`);
        // 用 i18n.exists() 准确判断 key 是否存在 (避免命名空间前缀导致的 startsWith 失效 Bug)
        const hasConnector = i18n.exists(`${sector.i18nPrefix}.connector`);
        const hasSuffix = i18n.exists(`${sector.i18nPrefix}.suffix`);
        const hasSub = i18n.exists(`${sector.i18nPrefix}.sub`);
        const hasLongLine = hasSuffix;
        const hlClass = getHighlightClass(idx);
        return (
          <div
            key={`label-${idx}`}
            className="absolute hidden lg:block"
            style={{
              left: g.labelX,
              top: g.labelY,
              transform: g.onRight ? "translate(0, -50%)" : "translate(-100%, -50%)",
              textAlign: g.onRight ? "left" : "right",
              maxWidth: "320px",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
          >
            {hasLongLine ? (
              <>
                <div className="text-[15px] text-ink-700 leading-[24px] whitespace-normal">
                  {prefix}
                </div>
                <div className="text-[15px] text-ink-700 leading-[24px] whitespace-normal">
                  {hasConnector && <span className="mr-1">{connector}</span>}
                  <span className={`font-bold ${hlClass}`} style={{ transition: "color 0.2s ease" }}>[{highlight}]</span>
                  {hasSuffix && <span className="ml-1">{suffix}</span>}
                </div>
              </>
            ) : (
              <div className="text-[15px] text-ink-700 leading-[24px] whitespace-normal">
                {prefix}
                {hasConnector && <span className="ml-1">{connector}</span>}
                <span className={`font-bold mx-1 ${hlClass}`} style={{ transition: "color 0.2s ease" }}>[{highlight}]</span>
                {hasSuffix && <span>{suffix}</span>}
              </div>
            )}
            {hasSub && (
              <div className="text-[13px] text-ink-500 leading-[20px] whitespace-normal">
                {sub}
              </div>
            )}
          </div>
        );
      })}
    </div>

    {/* 移动端: 条形统计图阶梯 (无横纵坐标, 参考桌面扇形图绿/黑配色 + hover 变绿交互)
        信息层次: 序号固定列 + 标题文本块 (换行对齐一致) + 描述统一缩进 + 条形 */}
    <div className="lg:hidden w-full mt-[20px]">
      {/* 绿色核心条 (全宽, 顶部小圆"中"字) */}
      <div className="mb-[24px]">
        <p className="text-[13px] text-brand-green font-bold leading-[20px] mb-[2px]">
          [ {t(`${data.centerSubKey}`)} ]
        </p>
        <p className="text-[12px] text-ink-500 leading-[18px] mb-[10px]">
          {t(`${data.centerHintKey}`)}
        </p>
        <div
          className="flex items-center bg-brand-green"
          style={{ width: "100%", height: "22px" }}
        >
          <span className="w-[20px] h-[20px] rounded-full bg-white text-brand-green text-[11px] font-bold flex items-center justify-center shrink-0 ml-[2px] leading-none">
            {t(data.centerTextKey)}
          </span>
        </div>
      </div>

      {/* 5 根黑色条 (长度阶梯递减) */}
      {data.sectors.map((sector, idx) => {
        const prefix = t(`${sector.i18nPrefix}.prefix`);
        const highlight = t(`${sector.i18nPrefix}.highlight`);
        const connector = t(`${sector.i18nPrefix}.connector`);
        const suffix = t(`${sector.i18nPrefix}.suffix`);
        const sub = t(`${sector.i18nPrefix}.sub`);
        const hasConnector = i18n.exists(`${sector.i18nPrefix}.connector`);
        const hasSuffix = i18n.exists(`${sector.i18nPrefix}.suffix`);
        const hasSub = i18n.exists(`${sector.i18nPrefix}.sub`);
        const widths = [88, 74, 60, 46, 32];
        return (
          <div key={`m-${idx}`} className="mb-[26px] last:mb-0 group">
            {/* 标题行: 序号固定列宽 + 标题文本 flex-1 (长文本换行时对齐一致, 不会缩到序号下方) */}
            <div className="flex items-baseline gap-[10px]">
              <span className="shrink-0 w-[26px] text-[13px] font-bold text-brand-green leading-[22px]">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <p className="flex-1 text-[13px] text-ink-700 leading-[22px]">
                {prefix}
                {hasConnector && <span className="ml-[2px]">{connector}</span>}
                <b className="text-brand-green mx-[3px]">[{highlight}]</b>
                {hasSuffix && <span>{suffix}</span>}
              </p>
            </div>
            {/* 描述 (如有): 与标题文本左对齐 (序号列宽 + gap) */}
            {hasSub && (
              <p className="text-[12px] text-ink-500 leading-[18px] mt-[4px] pl-[36px]">
                {sub}
              </p>
            )}
            {/* 条形 */}
            <div
              className="mt-[8px] flex items-center bg-[#1a1a1a] group-hover:bg-brand-green transition-colors duration-300"
              style={{ width: `${widths[idx]}%`, height: "20px" }}
            >
              <span className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0 p-[2px] ml-[2px]">
                <FanIcon type={sector.icon} className="w-full h-full text-white" />
              </span>
            </div>
          </div>
        );
      })}
    </div>
    </>
  );
}

export default ProductPage;

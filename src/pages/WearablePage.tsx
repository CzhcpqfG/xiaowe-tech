import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import Reveal from "../components/ui/Reveal";
import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle";
import {
  WEARABLE_PAGE,
  WEARABLE_PRODUCTS,
  WEARABLE_CATEGORIES,
  type WearableProduct,
  type WearableTech,
} from "../data/content";
import { IMAGES } from "../data/images";
import SEO from "../components/SEO";
import {
  SITE_ORIGIN,
  getItemListSchema,
  getProductSchema,
  absoluteImage,
} from "../config/schema";
import { useLocale } from "../i18n/useLocale";

/* ============================================================
   WearablePage - 健康智能穿戴页 (/wearable)
   数据源: PROTOTYPE_PAGES.md §5 健康智能穿戴页
            + xiaowe.cc 真实产品信息 (11 款, 2026-07-21 抓取)

   页面结构 (5 section, 参考 ProductPage 交互模式):
     1. Hero Banner - 标题 + 副标 + 描述 (复用 ProductCarouselHero 组件, bg-white/40 遮罩)
     2. 产品分类说明 - 双行标语 "全产品线覆盖 / 全场景响应需求"
     3. 产品分类按钮 (4 个含"全部") + 11 款产品卡片网格 (按 Tab 筛选)
     4. 健康智能手表核心技术 (10 项)
     5. 智能蓝牙耳机核心技术 (6 项)

   注: 全局 Footer 由 Layout 组件统一渲染

   设计规范 (沿用 2.0 朴素风格, 与 ProductPage 一致):
     - 主色 #05a045, 选中色 #52b548
     - 字体: MiSans > PingFang SC > Microsoft YaHei, 大标题用 DingTalk JinBuTi
     - 无圆角 / 无阴影 / 无渐变
     - 1200px 设计宽度 (container-page)

   i18n 改造 (2026-07-25):
     - 所有可见文案通过 t(WEARABLE_PAGE.xxx.xxxKey) 翻译 (wearable namespace)
     - 数组字段 (categorySlogan) 用 t(keys, { returnObjects: true })
     - WearableForm / WEARABLE_CATEGORIES 改为英文 slug, 渲染时用 t(`wearable:tabs.${slug}`)
     - SEO 通过 <SEO titleKey="wearable.title" ... /> 动态化
   ============================================================ */

/** Tab 切换时按钮样式 (无圆角, 朴素风格, 与 ProductPage 一致) */
const TAB_ACTIVE = "bg-brand-green-light text-white border-brand-green-light";
const TAB_INACTIVE = "bg-transparent text-ink-800 hover:text-brand-green-light border-ink-200";

/** Tab slug 列表 (含 "all", locale 无关, 渲染时用 t(`wearable:tabs.${slug}`)) */
const TAB_SLUGS = ["all", ...WEARABLE_CATEGORIES] as const;

/** 产品卡片 - 单款产品信息展示 (参考 ProductPage 卡片结构)
 *  hover: 卡片上浮 + 边框变绿 + 阴影 + 产品图轻微放大
 *  信息栏层级: 型号 → 价格 → hairline 分隔 → 指标格 */
function ProductCard({ product }: { product: WearableProduct }) {
  const { t } = useTranslation(["wearable", "common"]);
  return (
    <div
      className="group bg-white border border-ink-200 flex flex-col h-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:border-brand-green hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)]"
    >
      {/* 产品图区域 - 1:1 正方形, 占满卡片宽度
          浅绿底 (#f0f7f2) 衬托白底产品图, 与白卡身形成层次 (保持不动) */}
      <div className="w-full aspect-square bg-[#f0f7f2] flex items-center justify-center overflow-hidden p-[20px] lg:p-[28px]">
        <img
          src={IMAGES[product.imageKey]}
          alt={t(product.altKey)}
          className="w-full h-full object-contain transition-transform duration-[700ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]"
        />
      </div>

      {/* 信息区 - Apple 风格: 居中对齐, 宽松留白, 价格作为主信息
          层级: 型号 → 价格 → hairline 分隔 → 指标格 */}
      <div className="px-6 py-5 lg:py-6 flex flex-col items-center text-center flex-1 border-t border-ink-100">
        {/* 型号 */}
        <h3 className="text-[17px] text-ink-900 font-semibold leading-[24px] mb-4 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
          {t(product.modelKey)}
        </h3>

        {/* 零售指导价 */}
        <div className="mb-5">
          <p className="text-[11px] text-ink-400 leading-[16px] mb-1">
            {t("wearable:priceCaption")}
          </p>
          <p className="text-[18px] text-ink-900 font-bold leading-[24px]">
            {t("wearable:priceLabel", { price: product.price })}
          </p>
        </div>

        {/* 底部区块: hairline 分隔 + 指标格 (整体贴底, 行内卡片等高对齐) */}
        <div className="mt-auto w-full pt-4 border-t border-ink-100">
          {/* 2×2 指标格 - 极简灰底卡片, 无边框 (4 项核心特性) */}
          <div className="grid grid-cols-2 gap-[8px]">
            {product.features.map((f, fIdx) => (
              <div
                key={fIdx}
                className="bg-ink-50 px-3 py-[10px] flex flex-col items-center justify-center min-h-[64px]"
              >
                <span className="text-[13px] font-semibold text-ink-900 leading-[18px]">
                  {t(f.labelKey)}
                </span>
                <span className="text-[11px] text-ink-500 leading-[15px] mt-[2px]">
                  {t(f.descKey)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/** 核心技术卡片 - 上图下文布局 (参考截图设计)
 *  上半部分: 浅色背景 + 居中 SVG 图标 (140px 高)
 *  下半部分: 白色背景 + 序号 + 名称 + 描述
 *  hover: 卡片上浮 + 边框变绿 + 阴影 + 图标轻微放大
 */
function TechCard({
  tech,
  index,
  imageKey,
}: {
  tech: WearableTech;
  index: number;
  imageKey: keyof typeof IMAGES;
}) {
  const { t } = useTranslation(["wearable", "common"]);
  return (
    <div className="group bg-white border border-ink-200 flex flex-col h-full transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[6px] hover:border-brand-green hover:shadow-[0_14px_30px_rgba(5,160,69,0.12)]">
      {/* 上半部分: 浅绿背景 + 居中图标 (140px 高) */}
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: "140px",
          backgroundColor: "#f0f9f3",
        }}
      >
        <img
          src={IMAGES[imageKey]}
          alt={t(tech.nameKey)}
          width={88}
          height={88}
          className="object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.10]"
        />
      </div>
      {/* 下半部分: 序号 + 名称 + 描述 (padding 20px) */}
      <div className="p-5 flex-1">
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-[12px] text-brand-green font-bold leading-[18px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 inline-block">
            {String(index + 1).padStart(2, "0")}
          </span>
          <h4 className="text-[16px] text-ink-700 font-bold leading-[24px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
            {t(tech.nameKey)}
          </h4>
        </div>
        {tech.descKey && (
          <p className="text-[12px] text-ink-500 leading-[20px]">
            {t(tech.descKey)}
          </p>
        )}
      </div>
    </div>
  );
}

function WearablePage() {
  const { t } = useTranslation(["wearable", "common"]);
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<string>("all"); // "all" / "adult-watch" / "kids-watch" / "bluetooth-earphone"

  // GEO schema: ItemList + Product×11 (2026-08-16)
  const wearableSchema = useMemo(() => {
    const products = WEARABLE_PRODUCTS.map((p) => ({
      name: t(p.modelKey),
      image: absoluteImage(IMAGES[p.imageKey]),
    }));
    return [
      getItemListSchema(products),
      ...products.map((p, idx) =>
        getProductSchema({
          name: p.name,
          description: t(WEARABLE_PRODUCTS[idx].typeKey),
          image: p.image,
          brand: "SKYWORTH 创维",
        })
      ),
    ];
  }, [t]);

  // Tab 筛选: "all"=全部, 否则按英文 slug 筛选
  const filteredProducts: WearableProduct[] =
    activeTab === "all"
      ? WEARABLE_PRODUCTS
      : WEARABLE_PRODUCTS.filter((p) => p.form === activeTab);

  // 分类标语 (双行)
  const categorySlogans = WEARABLE_PAGE.categorySloganKeys.map((k) => t(k));

  return (
    <>
      <SEO
        titleKey="wearable.title"
        descriptionKey="wearable.description"
        path="/wearable"
        jsonLd={wearableSchema}
      />

      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">创维健康智能穿戴 · 智能手表与蓝牙耳机</h1>

      {/* ============================================================
          1. Hero - 用 ProductCarouselHero 组件
          2026-07-25 v3: 浅米白暖调背景 + 中部 HTML 叠加标题 (钉钉进步体)
          AI 图: 智能手表主体在右侧, 中部左侧留白给文字
          ============================================================ */}
      <ProductCarouselHero height={480} mobileObjectFit="contain" />

      {/* ============================================================
          2. 产品分类说明 - 双行标语 (与 ProductPage 一致)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px] text-center">
          <Reveal>
            <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px]">
              {categorySlogans[0]}
            </p>
            <p className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-brand-green leading-[34px] sm:leading-[38px] lg:leading-[42px] mt-[6px]">
              {categorySlogans[1]}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          3. 产品分类按钮 (4 个含"全部") + 11 款产品卡片网格
          Tab 样式 (无圆角, 朴素风格, 与 ProductPage 一致):
            Active: 20px #fff 700, bg=brand-green-light
            Inactive: 18px ink-800 700, transparent
          PM 提示: 此列为按钮, 点击后出现对应形态的产品
          ============================================================ */}
      <section className="bg-white pt-[20px] pb-[40px] lg:pb-[60px]">
        <div className="container-page">
          {/* Tab 分类导航 - 4 个按钮 (含"全部"), 无圆角保持朴素
              移动端: 自动换行, 不需要横向拖拽; 桌面端: 居中 flex */}
          <div className="flex flex-wrap justify-start lg:justify-center mb-[30px] lg:mb-[40px]" style={{ gap: "12px 16px" }}>
            {TAB_SLUGS.map((slug, idx) => {
              const isActive = slug === activeTab;
              return (
                <button
                  key={slug}
                  onClick={() => setActiveTab(slug)}
                  className={`flex items-center justify-center font-bold transition-colors duration-300 cursor-pointer border shrink-0 ${
                    isActive ? TAB_ACTIVE : TAB_INACTIVE
                  }`}
                  style={{
                    minWidth: "140px",
                    padding: "0 16px",
                    height: "48px",
                    fontSize: isActive ? "16px" : "14px",
                  }}
                >
                  {t(`wearable:tabs.${slug}`)}
                </button>
              );
            })}
          </div>

          {/* 11 款产品卡片网格 - 4 列 (默认全部)
              移动端 1 列 / 平板 2 列 / 桌面 4 列 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[16px] auto-rows-fr">
            {filteredProducts.map((product, idx) => (
              <Reveal key={`${product.id}-${idx}`} variant="scale-up" delay={(idx % 4) * 80} className="h-full">
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>

          {/* 空状态提示 */}
          {filteredProducts.length === 0 && (
            <div className="text-center py-[40px] lg:py-[60px] text-[14px] text-ink-400">
              {t("wearable:noProducts")}
            </div>
          )}

        </div>
      </section>

      {/* ============================================================
          4. 健康智能手表核心技术 - 15 项卡片网格 (5×3)
          标题 30px #333 700 + 副标 16px #666 400
          卡片布局: 上图下文 (140px 浅绿图标区 + 序号/名称/描述)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(WEARABLE_PAGE.watchTech.titleKey)} />
            <TitleUnderline />
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px] auto-rows-fr">
            {WEARABLE_PAGE.watchTech.items.map((tech, idx) => (
              <Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60} className="h-full">
                <TechCard
                  tech={tech}
                  index={idx}
                  imageKey={`wearableTechWatch${String(idx + 1).padStart(
                    2,
                    "0"
                  )}` as keyof typeof IMAGES}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          5. 智能蓝牙耳机核心技术 - 10 项卡片网格 (5×2)
          标题 30px #333 700 + 副标 16px #666 400
          卡片布局: 上图下文 (140px 浅绿图标区 + 序号/名称/描述)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(WEARABLE_PAGE.earphoneTech.titleKey)} />
            <TitleUnderline />
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-[12px] lg:gap-[20px] auto-rows-fr">
            {WEARABLE_PAGE.earphoneTech.items.map((tech, idx) => (
              <Reveal key={idx} variant="scale-up" delay={(idx % 5) * 60} className="h-full">
                <TechCard
                  tech={tech}
                  index={idx}
                  imageKey={`wearableTechEarphone${String(idx + 1).padStart(
                    2,
                    "0"
                  )}` as keyof typeof IMAGES}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 全局 Footer 由 Layout 组件统一渲染 */}
    </>
  );
}

export default WearablePage;

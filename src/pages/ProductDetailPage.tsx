/**
 * 产品详情页 - /product/:slug
 * 2026-08-14 新增: 产品卡片点击进入对应型号详情子页面
 *
 * 结构:
 *   1. 面包屑 - 首页 > 产品中心 > 产品名
 *   2. 产品标题区 + 返回产品中心
 *   3. 详情页图全屏拼接 - 几十张电商长图垂直堆叠, 滚动时逐张"下落+淡入"雪崩级联入场
 */

import { useMemo } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "../components/ui/Reveal";
import SEO from "../components/SEO";
import { PRODUCTS } from "../data/product";
import { IMAGES } from "../data/images";
import { IMAGE_SIZES } from "../data/generated/imageSizes";
import { useLocale } from "../i18n/useLocale";
import { homePath, productPath } from "../routes/paths";
import type { Locale } from "../i18n/types";
import {
  SITE_ORIGIN,
  getMedicalDeviceSchema,
  getBreadcrumbSchema,
  absoluteImage,
} from "../config/schema";

/* ============================================================
   面包屑 - 产品详情页顶部
   布局: 首页 > 产品中心 > 当前产品名
   (复用 NewsDetailPage 的面包屑视觉模式)
   ============================================================ */
function Breadcrumb({
  title,
  locale,
  t,
}: {
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
              to={productPath(locale)}
              className="hover:text-brand-green-light transition-colors duration-300"
            >
              {t("breadcrumb.productCenter")}
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

function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useLocale();
  const { t } = useTranslation("product");

  const product = slug ? PRODUCTS.find((p) => p.slug === slug) : undefined;

  // 找不到产品 或 该产品无详情页 → 重定向回产品列表
  if (!product || !product.detailImages?.length) {
    return <Navigate to={productPath(locale)} replace />;
  }

  const title = t(`${product.i18nPrefix}.model`);

  // GEO schema: MedicalDevice + BreadcrumbList (2026-08-16)
  const detailSchema = useMemo(() => {
    if (!product || !slug) return undefined;
    const url = `${SITE_ORIGIN}/${locale}/product/${slug}`;
    const category = t(`product:categories.${product.form}`) as string;
    const image = absoluteImage(IMAGES[product.imageKey]);
    return [
      getMedicalDeviceSchema({
        name: title,
        description: `${title} · ${category}`,
        image,
        model: title,
        url,
      }),
      getBreadcrumbSchema([
        { name: "首页", url: `${SITE_ORIGIN}/${locale}/` },
        { name: "产品中心", url: `${SITE_ORIGIN}/${locale}/product` },
        { name: title, url },
      ]),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, slug, locale, title]);

  return (
    <>
      <SEO
        titleKey="productDetail.title"
        descriptionKey="productDetail.description"
        path={`/product/${slug}`}
        vars={{ title }}
        jsonLd={detailSchema}
      />

      {/* 1. 面包屑导航 */}
      <Breadcrumb title={title} locale={locale} t={t} />

      {/* 2. 产品标题区 + 返回产品中心 */}
      <section className="bg-white">
        <div className="container-page py-[32px] lg:py-[40px] text-center">
          <h1 className="text-[24px] lg:text-[30px] font-bold text-ink-700 leading-[34px] lg:leading-[42px]">
            {title}
          </h1>
          <Link
            to={productPath(locale)}
            className="inline-block mt-[16px] text-[13px] text-brand-green hover:text-brand-green-light transition-colors duration-300"
          >
            ← {t("ui.backToProducts")}
          </Link>
        </div>
      </section>

      {/* 3. 详情页图全屏拼接 - 几十张电商长图垂直堆叠, 无间隙
           滚动入场: 每张图从上方滑落 + 淡入 (雪崩级联), 小幅错峰延迟避免并排同时入场 */}
      <section className="bg-white">
        {product.detailImages.map((src, idx) => {
          // CLS 防抖: 查构建期尺寸清单注入 width/height, 配合 CSS w-full h-auto 仅取比例预留布局 (P2-10)
          const dim = IMAGE_SIZES[src];
          return (
          <Reveal
            key={idx}
            variant="drop"
            duration={700}
            delay={Math.min(idx % 8, 3) * 70}
            className="w-full"
          >
            <img
              src={src}
              alt={`${title} 详情 ${idx + 1}`}
              width={dim?.[0]}
              height={dim?.[1]}
              style={dim ? { aspectRatio: `${dim[0]} / ${dim[1]}`, width: "100%", height: "auto" } : undefined}
              className="w-full h-auto block"
              loading="lazy"
              draggable={false}
            />
          </Reveal>
          );
        })}
      </section>
    </>
  );
}

export default ProductDetailPage;

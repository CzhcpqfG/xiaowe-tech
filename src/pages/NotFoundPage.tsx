import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { IMAGES } from "../data/images";
import { useLocale } from "../i18n/useLocale";
import { homePath } from "../routes/paths";
import SEO from "../components/SEO";

/* ============================================================
   404 页面 - 1:1 复刻原网站 "页面未找到" 结构 (i18n 改造)
   原网站结构:
     - logo 图片 250×70 居中
     - "找不到" 插图 居中
     - "很抱歉，您访问的页面不存在！" 16px #333 line-height 30px 居中
     - "请仔细检查您输入的网址是否正确。" 16px #333 line-height 30px 居中
     - "返回首页" 按钮 100×32, border 1px solid #E3E2E8, color #333, 13px, display block, margin 30px auto
   ============================================================ */
function NotFoundPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <>
      <SEO
        titleKey="notFound.title"
        descriptionKey="notFound.description"
        path="/not-found"
        noindex
      />
      <section className="py-[60px] lg:py-16">
        <div className="container-page">
          {/* 页面主标题 (SEO 语义, 视觉隐藏) */}
          <h1 className="sr-only">{t("common:notFound.message1")}</h1>
          {/* logo 250×70 居中 (移动端缩小) */}
          <div className="text-center mb-6 lg:mb-8">
            <img
              src={IMAGES.logo}
              alt={t("common:notFound.logoAlt")}
              className="mx-auto w-[108px] sm:w-[132px] lg:w-[150px] h-auto"
              style={{ objectFit: "contain" }}
            />
          </div>

          {/* "找不到" 插图 (移动端控制宽度) */}
          <div className="text-center mb-6">
            <img
              src="/images/common/not_found.webp"
              alt={t("common:notFound.imageAlt")}
              className="mx-auto max-w-[280px] sm:max-w-[360px] lg:max-w-none w-full h-auto"
            />
          </div>

          {/* 提示文字 16px #333 line-height 30px 居中 */}
          <div className="text-center text-[14px] lg:text-[16px] leading-[26px] lg:leading-[30px] text-[#333333]">
            {t("common:notFound.message1")}
          </div>
          <div className="text-center text-[14px] lg:text-[16px] leading-[26px] lg:leading-[30px] text-[#333333]">
            {t("common:notFound.message2")}
          </div>

          {/* "返回首页" 按钮 100×32, border 1px solid #E3E2E8, color #333, 13px */}
          <Link
            to={homePath(locale)}
            className="block mx-auto text-center text-[13px] text-[#333333] hover:text-[#52b548] hover:border-[#52b548] transition-colors duration-300"
            style={{
              width: 100,
              height: 32,
              lineHeight: "32px",
              border: "1px solid #E3E2E8",
              marginTop: 30,
            }}
          >
            {t("common:notFound.backHome")}
          </Link>
        </div>
      </section>
    </>
  );
}

export default NotFoundPage;

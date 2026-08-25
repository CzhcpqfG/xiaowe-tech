import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Reveal from "../ui/Reveal";
import { HERO_PRODUCTS } from "../../data/home";
import { IMAGES } from "../../data/images";
import { IMAGE_SIZES } from "../../data/generated/imageSizes";
import { useLocale } from "../../i18n/useLocale";
import { productPath, wearablePath } from "../../routes/paths";

/* ============================================================
   Hero 三产品入口 - 官网 3.0 首页 (i18n 改造)
   布局参考用户附件:
     - 每个产品独立全宽 section (交替背景)
     - 顶部: 主标题 + 副标题
     - 中部: 产品大图
     - 底部: 6 项核心技术卡片 (2 行 × 3 列)
     - 保持朴素风格: 无圆角 / 无阴影 / 无渐变

   i18n:
     - 所有可见文案通过 t(product.titleKey) / t(tech.titleKey) 翻译
     - 路径通过 locale-aware 函数 (productPath/wearablePath) 生成
     - 商标品牌 (BIGSOUND / SKYWORTH) 保留原文不翻译
   ============================================================ */

// 简单内联 SVG 图标, 每个产品固定 6 个, 避免引入图标库
const TECH_ICONS: Record<string, JSX.Element> = {
  chip: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="4" y="4" width="16" height="16" rx="1" />
      <path d="M9 9h6v6H9z" />
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9.5 4a5 5 0 0 1 5 5v11a5 5 0 0 1-10 0v-11a5 5 0 0 1 5-5z" />
      <path d="M14.5 4a5 5 0 0 1 5 5v11a5 5 0 0 1-10 0v-11a5 5 0 0 1 5-5z" />
      <path d="M9 9h6M9 14h6" />
    </svg>
  ),
  volume: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 12h2l2-8 4 16 4-10 4 10 2-8h2" />
    </svg>
  ),
  mic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
    </svg>
  ),
  heart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  mapPin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  thermometer: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  bluetooth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polyline points="6.5 6.5 17.5 12 6.5 17.5 6.5 6.5" />
      <line x1="17.5" y1="6.5" x2="6.5" y2="17.5" />
    </svg>
  ),
  layers: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  headphones: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  ),
  sliders: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

// 每个产品 6 个卖点卡片对应 6 个不同图标
const ICON_KEYS = [
  // AI 中文助听器
  ["chip", "language", "brain", "wave", "sliders", "mic"],
  // 健康智能手表
  ["heart", "activity", "thermometer", "mapPin", "bluetooth", "zap"],
  // 智能蓝牙耳机
  ["music", "headphones", "volume", "layers", "shield", "bluetooth"],
];

/** 根据 route 名 + locale 生成跳转路径 */
function resolveRoute(route: "product" | "wearable", locale: "zh-CN" | "zh-TW" | "en"): string {
  return route === "product" ? productPath(locale) : wearablePath(locale);
}

export function HeroProducts() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <section className="bg-white">
      {HERO_PRODUCTS.map((product, idx) => {
        const iconKeys = ICON_KEYS[idx] || ICON_KEYS[0];
        const title = t(product.titleKey);
        return (
          <div
            key={idx}
            className="bg-white pt-[40px] pb-[40px] sm:pt-[60px] sm:pb-[60px] lg:pt-[80px] lg:pb-[80px]"
          >
            <div className="container-page text-center">
              {/* 标题区 */}
              <Reveal>
                <h3 className="text-[22px] sm:text-[24px] lg:text-[28px] font-bold text-[#333333] leading-[32px] sm:leading-[36px] lg:leading-[40px] mb-6 sm:mb-8 lg:mb-10">
                  {title}
                </h3>
              </Reveal>

              {/* 产品大图 */}
              <Reveal variant="scale" delay={120}>
                <img
                  src={IMAGES[product.imageKey]}
                  alt={title}
                  width={IMAGE_SIZES[IMAGES[product.imageKey]]?.[0]}
                  height={IMAGE_SIZES[IMAGES[product.imageKey]]?.[1]}
                  loading="lazy"
                  decoding="async"
                  className="object-contain mx-auto w-full h-auto max-w-[280px] sm:max-w-[360px] lg:max-w-[520px] transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:scale-[1.02]"
                />
              </Reveal>

              {/* 6 项核心技术卡片 - 移动端 1 列 / 平板 2 列 / 桌面 3 列 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4 mt-8 lg:mt-12 max-w-[900px] mx-auto">
                {product.techs.map((tech, tIdx) => {
                  const iconKey = iconKeys[tIdx];
                  return (
                    <Reveal
                      key={tIdx}
                      variant="scale-up"
                      delay={160 + tIdx * 60}
                    >
                      <div
                        className="flex flex-col items-center justify-center py-6 px-4 bg-white border border-[#e5e5e5] transition-colors duration-300 hover:border-brand-green group min-h-[120px]"
                      >
                        <div
                          className="w-8 h-8 mb-3 text-[#999999] transition-colors duration-300 group-hover:text-brand-green"
                          aria-hidden="true"
                        >
                          {TECH_ICONS[iconKey]}
                        </div>
                        <div className="text-[16px] font-bold text-[#333333] leading-[24px]">
                          {t(tech.titleKey)}
                        </div>
                        <div className="text-[13px] text-[#999999] leading-[20px] mt-1">
                          {t(tech.descKey)}
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>

              {/* 了解更多链接 */}
              <Reveal delay={500}>
                <Link
                  to={resolveRoute(product.route, locale)}
                  className="inline-flex items-center text-[14px] text-brand-green hover:text-brand-green-dark transition-colors duration-300 group mt-8 lg:mt-10"
                >
                  <span>{t(product.ctaKey)}</span>
                  <svg
                    className="w-3 h-3 ml-1 transition-transform duration-300 group-hover:translate-x-1"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </Reveal>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export default HeroProducts;

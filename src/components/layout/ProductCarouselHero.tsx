import { useEffect, useLayoutEffect, useState, type CSSProperties } from "react";
import { Helmet } from "react-helmet-async";
import { IMAGE_SIZES } from "../../data/generated/imageSizes";

/* ============================================================
   ProductCarouselHero - 产品轮播 Hero (统一组件)
   用于 6 个子页 (/about /product /wearable /invest /careers /news) 顶部 hero 区

   设计规范 (2026-07-25 v10 重构 — 用户指示):
     - 4 张产品轮播图扒自原站 xiaowe.cc/h-col-103.html, 保存于 /public/images/hero_xiaowe/
     - 自动轮播 (5s), 淡入淡出过渡, hover 暂停
     - 删除 HTML 标题叠加 (用户: 换图了, 不用再叠加文字)
     - 删除圆点导航 (用户: 不要圆点)
     - 高度: 480px
     - 横向铺满视口 (突破 Layout wrapper 的 1200px + scale 限制)

   全宽策略 (2026-07-25 v10 — section 自己变宽, 不用反向 transform):
     根因复盘:
       - v6/v9 (img absolute + 反向补偿 width): 用户反馈没铺开
       - v7/v8 (section 100vw + margin-left + transform scale(1/scale)): 铺开了
         但 v8 section 视觉高度 = 480, main 分配 = 480 × scale, 视口 < 1200 时溢出遮挡下方
     正解 (v10): section 自己变宽, 不用 transform scale
       - section width = viewportWidth / scale (反向补偿, 让视觉宽度 = viewportWidth)
       - section margin-left = (1200 - width) / 2 (居中 wrapper)
       - section 布局高度 = 480px, 视觉高度 = 480 × scale = main 分配 ✓ 不溢出
       - img width 100% height 100%, 跟随 section
     数学验证 (视口 ≥ 1200, scale=1):
       · section width = 1920, margin-left = (1200 - 1920) / 2 = -360
       · section 布局左边 (相对 wrapper) = -360
       · wrapper scale 1, 视觉左边 (视口) = 360 (justifyContent center)
       · section 视觉左边 = 360 + (-360) × 1 = 0 ✓
       · section 视觉宽度 = 1920 × 1 = 1920 ✓ 铺满
       · section 视觉高度 = 480 × 1 = 480 = main 分配 ✓ 不溢出
     数学验证 (视口 < 1200, scale=0.833):
       · section width = 1000 / 0.833 = 1200, margin-left = 0
       · section 布局左边 (相对 wrapper) = 0
       · wrapper scale 0.833, 视觉左边 (视口) = 0 (填满视口)
       · section 视觉左边 = 0 ✓
       · section 视觉宽度 = 1200 × 0.833 = 1000 ✓ 铺满
       · section 视觉高度 = 480 × 0.833 = 400 = main 分配 ✓ 不溢出
   ============================================================ */

type ProductCarouselHeroProps = {
  /** 轮播图片 URL 数组 (默认用原站 4 张产品图) */
  images?: string[];
  /** 高度 (默认 480px) */
  height?: number;
  /** 轮播间隔 (默认 5000ms) */
  interval?: number;
  /** 图片填充模式: cover 裁剪铺满 (默认), contain 完整显示不裁剪 (左右留白) */
  objectFit?: "cover" | "contain";
  /** 移动端图片填充模式 (默认跟随 objectFit). 移动端横幅图 cover 会严重裁剪, 可传 "contain" 完整显示 */
  mobileObjectFit?: "cover" | "contain";
  /** 容器背景色 (contain 模式下左右留白的填充色, 默认透明) */
  backgroundColor?: string;
  /** 是否铺满视口宽度 (默认 true, 突破 1200px wrapper). false 时容器 100% 宽度跟随父容器 */
  fullBleed?: boolean;
};

// 原站 4 张产品轮播图 (扒自 xiaowe.cc/h-col-103.html banner_pic_0~3)
const DEFAULT_BANNER_IMAGES = [
  "/images/hero_xiaowe/banner_1.webp",
  "/images/hero_xiaowe/banner_2.webp",
  "/images/hero_xiaowe/banner_3.webp",
  "/images/hero_xiaowe/banner_4.webp",
];

const DESIGN_WIDTH = 1200;

export default function ProductCarouselHero({
  images = DEFAULT_BANNER_IMAGES,
  height = 480,
  interval = 5000,
  objectFit = "cover",
  mobileObjectFit,
  backgroundColor = "transparent",
  fullBleed = true,
}: ProductCarouselHeroProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);

  // LCP 优化: 首图 preload 注入 <head> (react-helmet-async, prerender 时写入静态 HTML)。
  // 比等 body 深处 <img> 被解析更早发起请求, 省 resourceLoadDelay (~300-500ms @slow-4G)。
  // HelmetProvider 已在 App 根部挂载 (SEO 组件同机制)。见下方 return 的 Helmet 块。

  // 自动轮播
  useEffect(() => {
    if (paused || images.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, interval);
    return () => clearInterval(timer);
  }, [paused, images.length, interval]);

  // 自己拿 scale, 不依赖 Layout 的 useAdaptWidth (避免 useEffect 首帧 race condition)
  // lazy initializer: 首次渲染就拿到正确值, 浏览器首帧绘制就是正确的
  const [scale, setScale] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const w = window.innerWidth;
    return w < DESIGN_WIDTH ? w / DESIGN_WIDTH : 1;
  });

  // 用 window.innerWidth 而非 100vw, 因 100vw 含滚动条会溢出 body
  const [viewportWidth, setViewportWidth] = useState<number>(
    typeof window !== "undefined" ? window.innerWidth : 1200
  );

  // 移动端判断: < 1024 走真响应式, 不需要反向补偿
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );

  // useLayoutEffect: 在浏览器绘制前同步更新, 避免 resize 时首帧闪烁
  useLayoutEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      setScale(w < DESIGN_WIDTH ? w / DESIGN_WIDTH : 1);
      setIsMobile(w < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // 反向补偿 width: viewportWidth / scale
  // 视口 ≥ 1200 (scale=1): section width = viewportWidth, 溢出 wrapper, 居中铺满视口
  // 视口 < 1200 (scale<1): section width = viewportWidth/scale = 1200, 等于 wrapper 宽度
  const sectionWidth = viewportWidth / scale;
  // 居中 wrapper: margin-left = (1200 - sectionWidth) / 2
  const sectionMarginLeft = (DESIGN_WIDTH - sectionWidth) / 2;

  // 移动端样式: 直接铺满, 不做反向补偿 (Layout 已不套 scale wrapper)
  const defaultMobileHeight = Math.round(height * 0.75); // 移动端高度按桌面 0.75 倍
  const effectiveMobileFit = mobileObjectFit ?? objectFit;

  // contain 模式 (移动端): 当前图走文档流 (width:100%; height:auto), 容器高度
  // 严格跟随图片自然比例, 彻底消除固定高度 + object-fit:contain 造成的同色留白
  // (宽横幅图如 2.95:1 banner 在移动端不再出现上下大片背景色)
  const mobileContainStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    overflow: "hidden",
    backgroundColor,
  };

  // cover 模式 (移动端): 固定高度, object-fit:cover 裁剪铺满
  const mobileCoverStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: `${defaultMobileHeight}px`,
    overflow: "hidden",
    backgroundColor,
  };

  const mobileStyle = effectiveMobileFit === "contain" ? mobileContainStyle : mobileCoverStyle;

  // 非全宽 (fullBleed=false): 容器 100% 宽度跟随父容器, 不做反向补偿
  // 用于内嵌轮播场景 (如招商页"全线覆盖各程度"模块), 保持 1200px container-page 宽度
  const desktopInlineStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: `${height}px`,
    overflow: "hidden",
    backgroundColor,
  };

  const desktopFullBleedStyle: CSSProperties = {
    position: "relative",
    width: `${sectionWidth}px`,
    marginLeft: `${sectionMarginLeft}px`,
    height: `${height}px`,
    overflow: "hidden",
    backgroundColor,
  };

  const desktopStyle = fullBleed ? desktopFullBleedStyle : desktopInlineStyle;

  // 移动端 contain 模式: 当前图走文档流 (relative), 其余图绝对定位覆盖
  // (仅移动端 + contain 生效; 桌面端/cover 模式仍为全绝对定位 + object-fit)
  const isMobileContainFlow = isMobile && effectiveMobileFit === "contain";

  // fullBleed=false 时桌面用 desktopInlineStyle (100% 宽度跟随父容器);
  // 移动端一律走 mobileStyle (contain 高度跟随图片自然比例 / cover 0.75 倍高),
  // 修复 2026-08-15: 原逻辑在 fullBleed=false 时移动端强制走固定高 cover, 横幅图被上下裁切
  const sectionStyle = isMobile
    ? mobileStyle
    : (fullBleed ? desktopStyle : desktopInlineStyle);

  const imgStyle: CSSProperties = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    // 移动端横幅图 cover 会严重裁剪, 支持单独指定 contain 完整显示
    objectFit: isMobile ? (mobileObjectFit ?? objectFit) : objectFit,
    objectPosition: "center",
  };

  // 点击切换下一张
  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % images.length);
  };

  return (
    <>
      <Helmet>
        <link rel="preload" as="image" href={images[0]} fetchPriority="high" />
      </Helmet>
      <section
      style={sectionStyle}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={handleNext}
      role="button"
      aria-label="点击切换下一张产品图"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNext();
        }
      }}
    >
      {/* 轮播图层: 所有图全部渲染, 通过 opacity 切换 */}
      {images.map((src, idx) => {
        const isCurrent = idx === current;
        // 移动端 contain 文档流模式: 当前图撑起容器高度 (width:100%; height:auto),
        //   非当前图绝对定位覆盖在容器顶部做交叉淡化, 无 object-fit 留白
        const flowStyle: CSSProperties = {
          width: "100%",
          height: "auto",
          display: "block",
          position: isCurrent ? "relative" : "absolute",
          top: isCurrent ? undefined : 0,
          left: isCurrent ? undefined : 0,
          opacity: isCurrent ? 1 : 0,
          transition: "opacity 0.8s ease-in-out",
        };
        // LCP 优化: 首图是多数页面 (news/product/faq/about) 的 LCP 元素,
        // 高优先抢占 slow-4G 带宽; 其余轮播图初始不可见 (opacity:0),
        // 压低优先级避免与首屏内容竞争
        return (
          <img
            key={idx}
            src={src}
            alt=""
            width={IMAGE_SIZES[src]?.[0]}
            height={IMAGE_SIZES[src]?.[1]}
            fetchPriority={idx === 0 ? "high" : "low"}
            style={isMobileContainFlow ? flowStyle : { ...imgStyle, opacity: isCurrent ? 1 : 0, transition: "opacity 0.8s ease-in-out" }}
            draggable={false}
          />
        );
      })}
    </section>
    </>
  );
}

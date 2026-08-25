import { Outlet } from "react-router-dom";
import { useAdaptWidth } from "../../hooks/useAdaptWidth";
import Header from "./Header";
import Footer from "./Footer";
import ScrollToTop from "./ScrollToTop";
import FloatingTools from "./FloatingTools";

/**
 * Layout - 全局布局
 * 结构:
 *   <ScrollToTop />              ← 路由切换滚动到顶部 (无 UI)
 *   <Header />                   ← 顶部导航 (不缩放,固定 1200px 容器)
 *   <main>                       ← adaptWidth 缩放容器 (flex 居中)
 *     <Outlet />                 ← 子路由渲染处
 *   </main>
 *   <Footer />                   ← 页脚 (不缩放,固定 1200px 容器)
 *   <FloatingTools />            ← 右下角悬浮工具 (不缩放,相对视口)
 *
 * 设计宽度: 1200px (Faisco 平台标准)
 * 缩放规则: 视口 < 1200px 时等比缩小,≥ 1200px 不缩放
 *
 * 移动端适配 (2026-07-25 新增):
 *   - 视口 < 1024px (isMobile=true): 不套 scale wrapper, 走真响应式布局
 *     .container-page 在 index.css @media (max-width: 1023px) 下变为 100% 宽度
 *   - 视口 ≥ 1024px (isMobile=false): 走原有 scale 桌面端逻辑
 *   - 阈值 1024 与 Tailwind lg 断点对齐
 *
 * 居中策略 (2026-07-21 修复):
 *   - main: display flex + justify-content center + align-items flex-start
 *   - wrapper: transformOrigin "top center" (而非 "top left")
 *   - 数学验证:
 *     · 视口 ≥ 1200px (scale=1): wrapper 布局左边 = (100vw-1200)/2 > 0,
 *       视觉左边 = 布局左边 + 600*(1-1) = 布局左边, 左右留白对称 ✓
 *     · 视口 < 1200px (scale=100vw/1200): wrapper 布局左边 = (100vw-1200)/2 < 0,
 *       视觉左边 = (100vw-1200)/2 + 600*(1-scale) = 0, 填满视口 ✓
 *
 * 高度策略 (2026-07-21 二次修复 — 解决 Footer 遮挡内容):
 *   - main: height = wrapperHeight (scrollHeight * scale, 视觉高度)
 *   - main: align-items flex-start (防止 wrapper 被 stretch 到 main 高度,
 *     否则 wrapperHeight 偏小时 wrapper 被压缩, 内容溢出 main 被 overflow 裁剪)
 *   - main: 不设 overflow (默认 visible), 让 ProductCarouselHero/HomeVideoHero 的 100vw
 *     背景图能溢出 main 到 body 边缘, 由 body 的 overflow-x: hidden 兜底裁剪
 *     (此前用 overflowX: clip 裁剪了 100vw 元素, 导致右边出现 滚动条/2 的 gap)
 *   - wrapper: flexShrink 0 (防止视口 < 1200px 时 wrapper 被 flex 压缩,
 *     保持 1200px 设计宽度)
 *   - body: overflow-x hidden (兜底防止水平滚动条 + 裁剪 100vw 溢出)
 *   - useAdaptWidth: useLayoutEffect + load 事件监听 (图片加载后及时重测高度)
 */
const DESIGN_WIDTH = 1200;

export default function Layout() {
  const { scale, wrapperRef, wrapperHeight, isMobile } =
    useAdaptWidth(DESIGN_WIDTH);

  // 移动端/平板端: 不套 scale wrapper, 直接渲染, 让 .container-page 走 CSS @media 响应式
  if (isMobile) {
    return (
      <>
        <ScrollToTop />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-brand-green focus:px-4 focus:py-2 focus:font-bold focus:shadow-lg focus:border focus:border-brand-green"
        >
          跳到主要内容
        </a>
        <Header />
        <main id="main-content" className="w-full">
          <div className="w-full">
            <Outlet />
          </div>
        </main>
        <Footer />
        <FloatingTools />
      </>
    );
  }

  // 桌面端: 现有 scale 模式不变
  return (
    <>
      <ScrollToTop />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:bg-white focus:text-brand-green focus:px-4 focus:py-2 focus:font-bold focus:shadow-lg focus:border focus:border-brand-green"
      >
        跳到主要内容
      </a>
      <Header />
      <main
        id="main-content"
        style={{
          height: wrapperHeight,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <div
          ref={wrapperRef}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top center",
            width: DESIGN_WIDTH,
            flexShrink: 0,
            // 暴露 scale 给子元素, .full-bleed 工具类用它突破 1200px wrapper 限制铺满视口
            ["--scale" as string]: scale,
          }}
        >
          <Outlet />
        </div>
      </main>
      <Footer />
      <FloatingTools />
    </>
  );
}

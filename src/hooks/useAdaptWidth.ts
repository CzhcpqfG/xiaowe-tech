import {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

/**
 * adaptWidth 缩放 hook
 * 模仿原站 (Faisco 平台) 的 adaptWidth 缩放模式:
 *   - 设计宽度固定 1200px
 *   - 根据视口宽度计算缩放比例 ratio = viewportWidth / 1200
 *   - 视口 ≥ 1200px 时 ratio = 1 (不缩放)
 *   - 视口 < 1200px 时 ratio < 1 (等比缩小,保持桌面布局)
 *
 * 移动端适配 (2026-07-25 新增):
 *   - 新增 isMobile 返回值: viewport < 1024 时为 true
 *   - isMobile=true 时, Layout 不套 scale wrapper, 走真响应式布局
 *   - isMobile=false 时, 走原有 scale 桌面端逻辑
 *   - 阈值 1024 与 Tailwind lg 断点对齐
 *
 * 用法:
 *   const { scale, wrapperRef, wrapperHeight, isMobile } = useAdaptWidth(1200);
 *   <main style={{ height: wrapperHeight, display: "flex", justifyContent: "center", alignItems: "flex-start", overflowX: "clip" }}>
 *     <div ref={wrapperRef} style={{ transform: `scale(${scale})`, transformOrigin: "top center", width: 1200, flexShrink: 0 }}>
 *       ...内容
 *     </div>
 *   </main>
 *   父容器需要设置 height: wrapperHeight 来避免底部空白
 *   父容器需要 display:flex + justify-content:center + align-items:flex-start + overflowX:clip 实现水平居中
 *   (transformOrigin 必须为 "top center" 而非 "top left", 否则视口 ≥ 1200px 时内容贴左)
 *   (align-items 必须 flex-start, 否则 wrapper 被 stretch 到 main 高度, wrapperHeight 偏小时内容被裁剪)
 *
 * 高度测量策略 (2026-07-21 二次修复 — 解决 Footer 遮挡内容):
 *   - useLayoutEffect: 在浏览器绘制前测量, 避免 wrapperHeight 滞后导致内容被裁剪
 *   - ResizeObserver: 观察 wrapper 元素, 内容变化时重新测量
 *   - window load 事件 (capture): 捕获图片加载完成, 及时重新测量
 *     (img load 不冒泡, 必须用 capture 模式在 window 上监听)
 *   - 字体加载: document.fonts.ready 后重新测量 (字体加载会改变文字高度)
 */
export function useAdaptWidth(designWidth: number = 1200) {
  // 惰性初始化: 首帧即按真实视口取值, 与预渲染 HTML 结构一致, 消除 hydration 闪变。
  // 此前固定初始值 (scale=1 / isMobile=false), 移动端首帧先渲染桌面结构,
  // useEffect 再翻转 → 整页位移 ~61px, 是 product 页 CLS 0.479 的根因 (2026-08-22 trace 定位)。
  const [scale, setScale] = useState(() => {
    if (typeof window === "undefined") return 1;
    const w = window.innerWidth;
    return w < designWidth ? w / designWidth : 1;
  });
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < 1024;
  });
  const [wrapperHeight, setWrapperHeight] = useState<number | undefined>(
    undefined
  );
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 计算缩放比例 + 移动端判断
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const s = w < designWidth ? w / designWidth : 1;
      setScale(s);
      // 与 Tailwind lg 断点对齐: < 1024 视为移动端, 走真响应式
      setIsMobile(w < 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [designWidth]);

  // 监听 wrapper 内容高度变化, 动态调整父容器高度
  // (transform: scale 不会改变布局尺寸, 需要手动调整高度避免底部空白)
  const measureHeight = useCallback(() => {
    if (!wrapperRef.current) return;
    const h = wrapperRef.current.scrollHeight;
    setWrapperHeight(h * scale);
  }, [scale]);

  // 用 useLayoutEffect 在浏览器绘制前测量, 避免 wrapperHeight 滞后导致内容被裁剪
  useLayoutEffect(() => {
    measureHeight();
    if (!wrapperRef.current) return;

    // ResizeObserver: 观察 wrapper 元素尺寸变化 (内容增减、Tab 切换等)
    const observer = new ResizeObserver(() => measureHeight());
    observer.observe(wrapperRef.current);

    // 监听图片 load 事件 (capture 模式, 因为 img load 不冒泡)
    // 图片加载完成后 wrapper 高度可能变化, 需要重新测量
    const handleLoad = () => measureHeight();
    window.addEventListener("load", handleLoad, true);

    // 监听字体加载完成 (字体加载会改变文字高度)
    let fontReady = false;
    if (typeof document !== "undefined" && (document as any).fonts?.ready) {
      (document as any).fonts.ready.then(() => {
        fontReady = true;
        measureHeight();
      });
    }

    return () => {
      observer.disconnect();
      window.removeEventListener("load", handleLoad, true);
      void fontReady;
    };
  }, [measureHeight]);

  return { scale, wrapperRef, wrapperHeight, isMobile };
}

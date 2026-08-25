import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

/* ============================================================
   Reveal - 滚动触发入场动画 (Apple 风格)

   variant 系统 (按模块性质选择不同入场效果):
     - "fade-up"     (默认) 标题、文字段落、一般内容
     - "fade-down"           从顶部滑入 (罕见)
     - "fade-left"           右侧元素从右滑入
     - "fade-right"          左侧元素从左滑入
     - "scale"               大图、整体容器、SVG
     - "scale-up"            卡片网格 (产品卡/数据卡/团队卡)
      - "pop"                 时间轴节点、SVG 节点、序号
      - "drop"                详情长图等整块内容从上段落入 (雪崩级联)

   缓动: cubic-bezier(0.16, 1, 0.3, 1) — Apple 标志性曲线
   时长: 600ms (默认), 可通过 duration prop 自定义

   兼容: 默认 variant="fade-up", 现有调用无需改动
   ============================================================ */

type RevealVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "scale"
  | "scale-up"
  | "pop"
  | "drop";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** 延迟 (ms) - 用于错开多个元素的入场 */
  delay?: number;
  /** 是否启用动画 (默认 true) */
  enabled?: boolean;
  /** 作为什么 HTML 元素渲染 (默认 div) */
  as?: "div" | "section" | "li" | "article";
  /** 透传给根元素的 style (会与 transitionDelay 合并) */
  style?: CSSProperties;
  /** 入场动画类型 (默认 "fade-up") */
  variant?: RevealVariant;
  /** 入场时长 ms (默认 600) */
  duration?: number;
};

/** Apple 标志性缓动曲线 */
const APPLE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/** 根据 variant 返回 (隐藏态 class, 可见态 class) */
function getVariantClasses(variant: RevealVariant): {
  hidden: string;
  visible: string;
} {
  switch (variant) {
    case "fade-up":
      return { hidden: "opacity-0 translate-y-5", visible: "opacity-100 translate-y-0" };
    case "fade-down":
      return { hidden: "opacity-0 -translate-y-5", visible: "opacity-100 translate-y-0" };
    case "fade-left":
      return { hidden: "opacity-0 translate-x-5", visible: "opacity-100 translate-x-0" };
    case "fade-right":
      return { hidden: "opacity-0 -translate-x-5", visible: "opacity-100 translate-x-0" };
    case "scale":
      return { hidden: "opacity-0 scale-95", visible: "opacity-100 scale-100" };
    case "scale-up":
      return { hidden: "opacity-0 scale-90 translate-y-5", visible: "opacity-100 scale-100 translate-y-0" };
    case "pop":
      return { hidden: "opacity-0 scale-[0.8]", visible: "opacity-100 scale-100" };
    case "drop":
      return { hidden: "opacity-0 -translate-y-10", visible: "opacity-100 translate-y-0" };
    default:
      return { hidden: "opacity-0 translate-y-5", visible: "opacity-100 translate-y-0" };
  }
}

export default function Reveal({
  children,
  className = "",
  delay = 0,
  enabled = true,
  as = "div",
  style,
  variant = "fade-up",
  duration = 600,
}: RevealProps) {
  // 直接使用 HTMLDivElement 类型,避免 ref 类型 cast 导致 React 不正确附加 ref
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!enabled) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;

    // 减少动画偏好
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }

    // 1. 首屏内元素立即触发 (使用 rAF 保证 transition 生效)
    const viewportH =
      window.innerHeight || document.documentElement.clientHeight;
    const rect = el.getBoundingClientRect();
    if (rect.top < viewportH * 0.9 && rect.bottom > 0) {
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    }

    // 2. 滚动进入视口时触发
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: "0px 0px -10% 0px",
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enabled]);

  const Tag = as as "div";

  const { hidden, visible: visibleCls } = getVariantClasses(variant);

  const baseClass = enabled
    ? `transition-[opacity,transform] will-change-[opacity,transform] ${
        visible ? visibleCls : hidden
      }`
    : "opacity-100";

  // 用内联 style 设置 duration / easing / delay, 避免 Tailwind JIT 无法识别动态拼接的 class
  const mergedStyle: CSSProperties = {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: APPLE_EASE,
    ...(delay ? { transitionDelay: `${delay}ms` } : null),
    ...style,
  };

  return (
    <Tag ref={ref} className={`${baseClass} ${className}`} style={mergedStyle}>
      {children}
    </Tag>
  );
}

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop - 路由切换时滚动控制
 *
 * 行为:
 * 1. pathname 变化 (跨页面跳转):
 *    - 有 hash → 等待页面渲染后滚动到对应 section
 *    - 无 hash → 滚动到顶部
 * 2. pathname 不变但 hash 变化 (同页面锚点跳转):
 *    - 滚动到对应 section
 * 3. pathname 和 hash 都不变 → 不处理
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // 有 hash: 滚动到对应元素 (用 requestAnimationFrame 等待 DOM 渲染完成)
      const id = hash.replace("#", "");
      const scrollIntoView = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        } else {
          // 元素不存在 (可能页面还在加载), 短暂延迟后重试一次
          requestAnimationFrame(() => {
            document.getElementById(id)?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });
          });
        }
      };
      // 先用 rAF 确保目标页面的 DOM 已挂载
      requestAnimationFrame(scrollIntoView);
    } else {
      // 无 hash: 滚动到顶部
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [pathname, hash]);

  return null;
}

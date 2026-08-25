/**
 * 路由级错误边界 (P2-5 配套)
 *
 * 场景: lazy 页面 chunk 加载失败 (弱网/发版后旧 HTML 引用已指纹更替的 chunk)。
 * 无边界时 React 整树卸载白屏; 有边界时展示可恢复 UI。
 * "重试" 通过整页刷新实现 — 刷新后会拿到最新 index.html 与新指纹 chunk。
 */
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class RouteErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 上报通道暂缺, 先落 console 便于线上排查
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-[15px] text-ink-500">页面加载失败，请重试</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2 rounded-full bg-[#1a1a1a] text-white text-[14px]"
          >
            重新加载
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default RouteErrorBoundary;

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 统一根路径部署 (2026-08-22 拍板):
//   - 最终托管: 阿里云服务器 + www.xiaowe.cc (Nginx 根路径), Cloudflare Pages 仅临时展示
//   - base 固定 "/", dev / build / preview 三模式一致, 无需子路径改写
//   - 原 GitHub Pages 子路径方案已废弃 (scripts/fix-base-paths.ts 已随链路移除)
export default defineConfig({
  base: "/",
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        // vendor 分离 (P2-5): 框架代码独立 chunk, 业务迭代不破坏其长缓存
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) {
            return "vendor-react";
          }
          if (/[\\/]node_modules[\\/](@remix-run|react-router|react-router-dom)[\\/]/.test(id)) {
            return "vendor-router";
          }
          if (/[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/.test(id)) {
            return "vendor-i18n";
          }
          return "vendor-misc"; // react-helmet-async 等小依赖
        },
      },
    },
  },
});

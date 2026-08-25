/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 大声品牌色（基于原网站提取）
        brand: {
          green: "#05a045",          // 主品牌绿（数据条、底部CTA、footer）
          "green-dark": "#048b3c",
          "green-light": "#52b548",   // nav 选中色（原网站实测）
          "green-soft": "#43d42f",
        },
        // 文字灰阶（原网站使用）
        ink: {
          50: "#f7f7f7",     // 浅灰底 (此前缺失, 导致 bg-ink-50 静默失效)
          900: "#1a1a1a",
          800: "#222222",
          700: "#333333",   // 正文主色
          600: "#555555",
          500: "#666666",
          400: "#999999",
          300: "#cccccc",
          200: "#e5e5e5",
          100: "#f5f5f5",
        },
      },
      fontFamily: {
        // 与 src/index.css body 保持一致: MiSans 优先, 覆盖全站默认 sans
        sans: [
          "MiSans",
          "PingFang SC",
          "Microsoft YaHei",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        // 大标题专用: 钉钉进步体 (DingTalk JinBuTi), 用于子页 Banner 大标题
        // fallback 顺序与 index.css 一致: DingTalk JinBuTi → MiSans → PingFang SC
        display: [
          "DingTalk JinBuTi",
          "MiSans",
          "PingFang SC",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      fontSize: {
        // 还原原网站字号（原网站基础字号14px）
        xs: ["12px", "1.5"],
        sm: ["14px", "1.6"],   // 原网站默认正文
        base: ["16px", "1.7"],
        lg: ["18px", "1.6"],   // 新闻标题 H4
        xl: ["20px", "1.5"],
        "2xl": ["24px", "1.4"],
        "3xl": ["28px", "1.4"],
        "4xl": ["32px", "1.3"],
        "5xl": ["40px", "1.2"],
        "6xl": ["48px", "1.2"],
      },
      maxWidth: {
        "design": "1200px",   // 原网站真实设计宽度
        "7xl": "1200px",
        "8xl": "1400px",
      },
    },
  },
  plugins: [],
};

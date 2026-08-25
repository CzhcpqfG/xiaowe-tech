import { useState } from "react";
import { useTranslation } from "react-i18next";

/* ============================================================
   FaqAccordion - 单个 FAQ 折叠面板 (手风琴)
   设计规范 (沿用全站朴素风格):
     - 无圆角 / 无阴影 / 无渐变
     - 主色 brand-green #05a045 / 选中色 brand-green-light #52b548
     - hover: 卡片整体上移 2px + 左侧色条变粗 + 背景渐变到品牌绿浅色
     - 展开: 内容平滑滑出 + 标题颜色变深 + 右侧 + → × 旋转
   ============================================================ */

interface FaqAccordionProps {
  question: string;
  answer: string;
  /** 默认是否展开 */
  defaultOpen?: boolean;
  /** 问题序号 (显示在左侧) */
  index?: number;
}

export default function FaqAccordion({
  question,
  answer,
  defaultOpen = false,
  index,
}: FaqAccordionProps) {
  const { t } = useTranslation("faq");
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div
      className={`
        group relative border-l-[3px] transition-all duration-300
        ${
          open
            ? "border-brand-green bg-[#f6fcf7]"
            : "border-ink-200 hover:border-brand-green hover:bg-[#fafafa] hover:-translate-y-[2px]"
        }
      `}
    >
      {/* 问题按钮 */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={`faq-answer-${index ?? ""}`}
        className="w-full flex items-center gap-3 sm:gap-4 text-left px-5 sm:px-6 lg:px-8 py-5 lg:py-6"
      >
        {/* 序号 (装饰性) */}
        {typeof index === "number" && (
          <span
            className={`
              shrink-0 inline-flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8
              text-[12px] lg:text-[13px] font-bold leading-none
              transition-colors duration-300
              ${open ? "bg-brand-green text-white" : "bg-ink-100 text-ink-500 group-hover:bg-brand-green group-hover:text-white"}
            `}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        )}

        {/* 问题文本 */}
        <span
          className={`
            flex-1 text-[15px] sm:text-[16px] lg:text-[17px] font-bold leading-[24px] lg:leading-[26px]
            transition-colors duration-300
            ${open ? "text-brand-green" : "text-ink-700 group-hover:text-brand-green"}
          `}
        >
          {question}
        </span>

        {/* +/× 图标 (旋转动画) */}
        <span
          className={`
            shrink-0 relative w-6 h-6 lg:w-7 lg:h-7 inline-flex items-center justify-center
            transition-transform duration-300
            ${open ? "rotate-45" : "rotate-0"}
          `}
          aria-label={open ? t("ui.closeAria") : t("ui.openAria")}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 lg:w-3.5 h-[2px] bg-current transition-colors duration-300"
            style={{ color: open ? "#05a045" : "#666" }}
          />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[2px] h-3 lg:h-3.5 bg-current transition-colors duration-300"
            style={{ color: open ? "#05a045" : "#666" }}
          />
        </span>
      </button>

      {/* 答案内容 (展开时显示) */}
      <div
        id={`faq-answer-${index ?? ""}`}
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${open ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <div className="px-5 sm:px-6 lg:px-8 pb-5 lg:pb-6 pl-[60px] sm:pl-[72px] lg:pl-[88px]">
          <p className="text-[14px] lg:text-[15px] text-ink-600 leading-[24px] lg:leading-[26px] whitespace-pre-line">
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}

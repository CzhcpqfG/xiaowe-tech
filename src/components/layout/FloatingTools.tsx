import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SITE_INFO } from "../../config/site";

/**
 * FloatingTools - 悬浮工具栏 (右下角)
 * 包含: 在线咨询 / 回到顶部
 * 不受 adaptWidth 缩放影响,固定尺寸,相对视口定位
 *
 * i18n: 所有 title / aria-label 通过 t("common:floatingTools.*") 翻译
 */
export default function FloatingTools() {
  const { t } = useTranslation();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed right-3 bottom-6 z-40 flex flex-col gap-2">
      {/* 在线咨询 (企业微信客服, 全站统一入口) */}
      <a
        href={SITE_INFO.onlineConsultUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex flex-col items-center justify-center w-12 h-12 bg-brand-green text-white hover:bg-brand-green-dark transition-colors duration-300"
        title={t("common:floatingTools.onlineConsult")}
        aria-label={t("common:floatingTools.onlineConsult")}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3C6.5 3 2 6.8 2 11.5c0 2.2 1 4.2 2.7 5.7-.1 1-.6 2.4-1.7 3.5-.2.2-.2.5 0 .7.1.1.2.1.3.1 1.8-.2 3.3-.7 4.4-1.2 1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3zm-4 9.5c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5zm4 0c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z" />
        </svg>
      </a>

      {/* 回到顶部 */}
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`flex flex-col items-center justify-center w-12 h-12 bg-white text-ink-700 border border-ink-300/40 hover:border-[#52b548] hover:text-[#52b548] transition-colors duration-300 ${
          showTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        title={t("common:floatingTools.backToTop")}
        aria-label={t("common:floatingTools.backToTop")}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      </button>
    </div>
  );
}

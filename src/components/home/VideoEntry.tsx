import { useRef } from "react";
import { useTranslation } from "react-i18next";

/* ============================================================
   Hero 视频 - 官网 3.0 首页 (i18n 改造)
   结构:
     - 高度 720px (桌面) / 420-620px (移动端响应式)
     - 纯视频展示, 无遮罩 / 无标题 / 无按钮
     - 点击视频区域进入全屏播放
   浏览器自动播放策略: muted + loop + playsInline + autoPlay

   i18n:
     - aria-label 通过 t("home:videoEntry.ariaLabel") 翻译

   响应式适配 (2026-07-25):
     - 移动端 (<1024px): w-full + h-[420px]/[520px]/[620px] 三档
     - 桌面端 (≥1024px): w-[100vw] + ml-[calc((1200px-100vw)/2)] 反向补偿
       突破 Layout 1200px scale wrapper 铺满视口
   ============================================================ */

export function VideoEntry() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleToggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      video.requestFullscreen?.().catch(() => {
        video.parentElement?.requestFullscreen?.().catch(() => {});
      });
    }
  };

  return (
    <section
      className="relative overflow-hidden cursor-pointer w-full h-[420px] sm:h-[520px] md:h-[620px] lg:w-[100vw] lg:h-[720px] lg:ml-[calc((1200px-100vw)/2)]"
      onClick={handleToggleFullscreen}
      aria-label={t("home:videoEntry.ariaLabel")}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleToggleFullscreen();
      }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src="/videos/promo.mp4" type="video/mp4" />
      </video>
    </section>
  );
}

export default VideoEntry;

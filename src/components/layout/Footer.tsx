import { useState, useEffect, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SITE_INFO, SHOP_LINKS } from "../../config/site";
import {
  getFooterSections,
  getFooterLegalLinks,
  type FooterLink,
  type SocialPlatform,
} from "../../config/footer";
import { IMAGES } from "../../data/images";
import { useLocale } from "../../i18n/useLocale";

/* ============================================================
   Footer - 页脚 (3.0 修订版, i18n 改造)
   数据源: PROTOTYPE_PAGES.md §9 全站 Footer (修订版)

   i18n:
     - 所有可见文案通过 t("common:footer.*") 翻译
     - 板块标题与链接通过 getFooterSections(locale, t) 生成
     - 法律链接通过 getFooterLegalLinks(locale, t) 生成
     - 选购指南中的产品名/店铺名通过 productKey/platformKey 翻译

   设计规范 (沿用 2.0 朴素风格):
     - 背景 #05a045 (品牌绿), 文字白色
     - 1200px 设计宽度, 无圆角无阴影无渐变
     - 字号: 板块标题 14px 加粗, 链接 12-13px 常规
     - hover: 链接变白 (white/70 → white)
   ============================================================ */

/* —— 6 个社交平台 icon (内联 SVG, 不引入第三方图标库) ——
   来源: Simple Icons (https://simpleicons.org) 开源品牌 SVG 库
   - 5 个官方 path: 微博/知乎/小红书/微信公众号/抖音(TikTok)
   - 视频号: Simple Icons 无独立资源, 自定义 (微信气泡 + 播放三角组合)
   - 2026-07-31 去除快手和B站 (用户决策) —— */
const SOCIAL_ICONS: Record<SocialPlatform, JSX.Element> = {
  // 视频号 (自定义: 微信气泡 + 播放三角, Simple Icons 无此品牌)
  "wechat-video": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M2 12c0-3.3 2.7-6 6-6h8c3.3 0 6 2.7 6 6s-2.7 6-6 6H8c-3.3 0-6-2.7-6-6zm9-2.5v5l4-2.5-4-2.5z" />
    </svg>
  ),
  // 小红书 (Simple Icons: xiaohongshu)
  xiaohongshu: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.405 9.879c.002.016.01.02.07.019h.725a.797.797 0 0 0 .78-.972.794.794 0 0 0-.884-.618.795.795 0 0 0-.692.794c0 .101-.002.666.001.777zm-11.509 4.808c-.203.001-1.353.004-1.685.003a2.528 2.528 0 0 1-.766-.126.025.025 0 0 0-.03.014L7.7 16.127a.025.025 0 0 0 .01.032c.111.06.336.124.495.124.66.01 1.32.002 1.981 0 .01 0 .02-.006.023-.015l.712-1.545a.025.025 0 0 0-.024-.036zM.477 9.91c-.071 0-.076.002-.076.01a.834.834 0 0 0-.01.08c-.027.397-.038.495-.234 3.06-.012.24-.034.389-.135.607-.026.057-.033.042.003.112.046.092.681 1.523.787 1.74.008.015.011.02.017.02.008 0 .033-.026.047-.044.147-.187.268-.391.371-.606.306-.635.44-1.325.486-1.706.014-.11.021-.22.03-.33l.204-2.616.022-.293c.003-.029 0-.033-.03-.034zm7.203 3.757a1.427 1.427 0 0 1-.135-.607c-.004-.084-.031-.39-.235-3.06a.443.443 0 0 0-.01-.082c-.004-.011-.052-.008-.076-.008h-1.48c-.03.001-.034.005-.03.034l.021.293c.076.982.153 1.964.233 2.946.05.4.186 1.085.487 1.706.103.215.223.419.37.606.015.018.037.051.048.049.02-.003.742-1.642.804-1.765.036-.07.03-.055.003-.112zm3.861-.913h-.872a.126.126 0 0 1-.116-.178l1.178-2.625a.025.025 0 0 0-.023-.035l-1.318-.003a.148.148 0 0 1-.135-.21l.876-1.954a.025.025 0 0 0-.023-.035h-1.56c-.01 0-.02.006-.024.015l-.926 2.068c-.085.169-.314.634-.399.938a.534.534 0 0 0-.02.191.46.46 0 0 0 .23.378.981.981 0 0 0 .46.119h.59c.041 0-.688 1.482-.834 1.972a.53.53 0 0 0-.023.172.465.465 0 0 0 .23.398c.15.092.342.12.475.12l1.66-.001c.01 0 .02-.006.023-.015l.575-1.28a.025.025 0 0 0-.024-.035zm-6.93-4.937H3.1a.032.032 0 0 0-.034.033c0 1.048-.01 2.795-.01 6.829 0 .288-.269.262-.28.262h-.74c-.04.001-.044.004-.04.047.001.037.465 1.064.555 1.263.01.02.03.033.051.033.157.003.767.009.938-.014.153-.02.3-.06.438-.132.3-.156.49-.419.595-.765.052-.172.075-.353.075-.533.002-2.33 0-4.66-.007-6.991a.032.032 0 0 0-.032-.032zm11.784 6.896c0-.014-.01-.021-.024-.022h-1.465c-.048-.001-.049-.002-.05-.049v-4.66c0-.072-.005-.07.07-.07h.863c.08 0 .075.004.075-.074V8.393c0-.082.006-.076-.08-.076h-3.5c-.064 0-.075-.006-.075.073v1.445c0 .083-.006.077.08.077h.854c.075 0 .07-.004.07.07v4.624c0 .095.008.084-.085.084-.37 0-1.11-.002-1.304 0-.048.001-.06.03-.06.03l-.697 1.519s-.014.025-.008.036c.006.01.013.008.058.008 1.748.003 3.495.002 5.243.002.03-.001.034-.006.035-.033v-1.539zm4.177-3.43c0 .013-.007.023-.02.024-.346.006-.692.004-1.037.004-.014-.002-.022-.01-.022-.024-.005-.434-.007-.869-.01-1.303 0-.072-.006-.071.07-.07l.733-.003c.041 0 .081.002.12.015.093.025.16.107.165.204.006.431.002 1.153.001 1.153zm2.67.244a1.953 1.953 0 0 0-.883-.222h-.18c-.04-.001-.04-.003-.042-.04V10.21c0-.132-.007-.263-.025-.394a1.823 1.823 0 0 0-.153-.53 1.533 1.533 0 0 0-.677-.71 2.167 2.167 0 0 0-1-.258c-.153-.003-.567 0-.72 0-.07 0-.068.004-.068-.065V7.76c0-.031-.01-.041-.046-.039H17.93s-.016 0-.023.007c-.006.006-.008.012-.008.023v.546c-.008.036-.057.015-.082.022h-.95c-.022.002-.028.008-.03.032v1.481c0 .09-.004.082.082.082h.913c.082 0 .072.128.072.128V11.19s.003.117-.06.117h-1.482c-.068 0-.06.082-.06.082v1.445s-.01.068.064.068h1.457c.082 0 .076-.006.076.079v3.225c0 .088-.007.081.082.081h1.43c.09 0 .082.007.082-.08v-3.27c0-.029.006-.035.033-.035l2.323-.003c.098 0 .191.02.28.061a.46.46 0 0 1 .274.407c.008.395.003.79.003 1.185 0 .259-.107.367-.33.367h-1.218c-.023.002-.029.008-.028.033.184.437.374.871.57 1.303a.045.045 0 0 0 .04.026c.17.005.34.002.51.003.15-.002.517.004.666-.01a2.03 2.03 0 0 0 .408-.075c.59-.18.975-.698.976-1.313v-1.981c0-.128-.01-.254-.034-.38 0 .078-.029-.641-.724-.998z" />
    </svg>
  ),
  // 抖音 (Simple Icons: tiktok, 因抖音国际版 TikTok 与抖音 logo 相似)
  douyin: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  ),
  // 微信公众号 (Simple Icons: wechat)
  "wechat-official": (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z" />
    </svg>
  ),
  // 微博 (Simple Icons: sinaweibo)
  weibo: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.601l.014-.028zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.615.375-.977.42-1.804 0-2.404-.781-1.112-2.915-1.053-5.364-.03 0 0-.766.331-.571-.271.376-1.217.315-2.224-.27-2.809-1.338-1.337-4.869.045-7.888 3.08C1.309 10.87 0 13.273 0 15.348c0 3.981 5.099 6.395 10.086 6.395 6.536 0 10.888-3.801 10.888-6.82 0-1.822-1.547-2.854-2.915-3.284v.01zm1.908-5.092c-.766-.856-1.908-1.187-2.96-.962-.436.09-.706.511-.616.932.09.42.511.691.932.602.511-.105 1.067.044 1.442.465.376.421.466.977.316 1.473-.136.406.089.856.51.992.405.119.857-.105.992-.512.33-1.021.12-2.178-.646-3.035l.03.045zm2.418-2.195c-1.576-1.757-3.905-2.419-6.054-1.968-.496.104-.812.587-.706 1.081.104.496.586.813 1.082.707 1.532-.331 3.185.15 4.296 1.383 1.112 1.246 1.429 2.943.947 4.416-.165.48.106 1.007.586 1.157.479.165.991-.104 1.157-.586.675-2.088.241-4.478-1.338-6.235l.03.045z" />
    </svg>
  ),
  // 知乎 (Simple Icons: zhihu)
  zhihu: (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M5.721 0C2.251 0 0 2.25 0 5.719V18.28C0 21.751 2.252 24 5.721 24h12.56C21.751 24 24 21.75 24 18.281V5.72C24 2.249 21.75 0 18.281 0zm1.964 4.078c-.271.73-.5 1.434-.68 2.11h4.587c.545-.006.445 1.168.445 1.171H9.384a58.104 58.104 0 01-.112 3.797h2.712c.388.023.393 1.251.393 1.266H9.183a9.223 9.223 0 01-.408 2.102l.757-.604c.452.456 1.512 1.712 1.906 2.177.473.681.063 2.081.063 2.081l-2.794-3.382c-.653 2.518-1.845 3.607-1.845 3.607-.523.468-1.58.82-2.64.516 2.218-1.73 3.44-3.917 3.667-6.497H4.491c0-.015.197-1.243.806-1.266h2.71c.024-.32.086-3.254.086-3.797H6.598c-.136.406-.158.447-.268.753-.594 1.095-1.603 1.122-1.907 1.155.906-1.821 1.416-3.6 1.591-4.064.425-1.124 1.671-1.125 1.671-1.125zM13.078 6h6.377v11.33h-2.573l-2.184 1.373-.401-1.373h-1.219zm1.313 1.219v8.86h.623l.263.937 1.455-.938h1.456v-8.86z" />
    </svg>
  ),
};

/* ============================================================
   FollowLink - 关注我们栏目的社交平台链接
   - 平台名称可点击 (跳转外链 href)
   - 名称右侧带一个小二维码图标按钮, 点击后弹出全屏灯箱展示二维码
   - 不使用 hover, 改为点击触发 (用户 2026-07-31 决策)
   - 灯箱: 全屏黑色遮罩 + 居中白色卡片, 适配移动端
   - 关闭方式: 点击遮罩 / 点击关闭按钮 / 按 Esc
   - 灯箱打开时锁定 body 滚动
   ============================================================ */
function FollowLink({ link }: { link: FooterLink }) {
  const { t } = useTranslation();
  const [showQr, setShowQr] = useState(false);

  // 显示文案: 优先使用已翻译 label (社交平台名), 否则用 labelKey 翻译
  const labelText = link.label ?? (link.labelKey ? t(`common:${link.labelKey}`) : "");

  // 灯箱打开时: 锁定 body 滚动 + 监听 Esc 关闭
  useEffect(() => {
    if (!showQr) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowQr(false);
    };
    document.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onEsc);
    };
  }, [showQr]);

  return (
    <div className="flex items-center gap-1">
      {/* 平台名称 (可点击跳转外链; href="#" 时阻止默认行为, 避免移动端点击跳回页顶) */}
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => {
          if (!link.href || link.href === "#") e.preventDefault();
        }}
        className="flex items-center gap-1.5 text-[12px] text-white/80 hover:text-white transition-colors duration-300"
        title={labelText}
      >
        {link.platform && (
          <span className="text-white/90 shrink-0">
            {SOCIAL_ICONS[link.platform]}
          </span>
        )}
        <span className="truncate">{labelText}</span>
      </a>

      {/* 二维码图标按钮 (点击打开灯箱, 仅当 link.qrImage 存在时显示) */}
      {link.qrImage && (
        <button
          type="button"
          onClick={() => setShowQr(true)}
          aria-label={`${labelText} ${t("common:footer.follow.scanFollow", { label: labelText })}`}
          className="shrink-0 text-white/70 hover:text-white transition-colors duration-300 p-0.5"
        >
          {/* 二维码图标 (14×14) */}
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3h-3zM20 14v3M14 20h3M20 20v1" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {showQr && link.qrImage && (
        /* QR 灯箱: 全屏黑色遮罩 + 居中白色卡片
           - z-[100] 确保浮在所有内容之上 (含 Header)
           - 移动端适配: 二维码 max-w-[80vw], 卡片 max-w-[90vw]
           - 点击遮罩关闭, 卡片内点击不冒泡 */
        <div
          className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 overscroll-contain touch-none"
          onClick={() => setShowQr(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${labelText} ${t("common:alt.qrcode")}`}
        >
          <div
            className="bg-white p-4 sm:p-6 max-w-[90vw] flex flex-col items-center relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => setShowQr(false)}
              aria-label={t("common:footer.follow.close")}
              className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center text-ink-500 hover:text-ink-900 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 6l12 12M6 18L18 6" strokeLinecap="round" />
              </svg>
            </button>

            {/* 平台名称 */}
            <p className="text-[14px] sm:text-[15px] font-bold text-ink-900 mb-3 pr-6">
              {labelText}
            </p>

            {/* 二维码图片
                - 不强制宽度, 仅约束最大宽高: CSS 对替换元素同时施加 max-width/max-height
                  时按固有比例缩放, 避免横屏下高度被 max-h 钳制后出现留白/码缩小的 bug
                - 移动端最宽 80vw, 桌面端最大 280px */}
            <img
              src={link.qrImage}
              alt={`${labelText} ${t("common:alt.qrcode")}`}
              className="max-w-[min(80vw,280px)] max-h-[60vh]"
            />

            {/* 扫码提示 */}
            <p className="text-[13px] text-ink-600 text-center mt-3">
              {t("common:footer.follow.scanFollow", { label: labelText })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   AccordionSection - 移动端手风琴栏目 (桌面端常驻展开)
   - 移动端 (< lg): 标题右侧 + / − 按钮, 点击切换展开/收起
   - 桌面端 (lg+): 标题常驻, 内容始终展开, 无切换按钮
   - defaultOpen: 移动端默认是否展开 (默认 false)
   ============================================================ */
function AccordionSection({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-bold text-white">{title}</h3>
        {/* 切换按钮: 仅移动端显示, 桌面端隐藏 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "收起" : "展开"}
          aria-expanded={open}
          className="lg:hidden text-white/80 text-[18px] leading-none w-6 h-6 flex items-center justify-center"
        >
          {open ? "−" : "+"}
        </button>
      </div>
      {/* 内容区: 移动端根据 open 切换, 桌面端始终 block */}
      <div
        className={`${
          open ? "block" : "hidden"
        } lg:block mt-2 lg:mt-4`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const { t } = useTranslation();
  const { locale } = useLocale();

  // 动态生成 Footer 板块 (含 locale-aware 路径 + i18n label)
  const sections = getFooterSections(locale, t);
  const legalLinks = getFooterLegalLinks(locale, t);

  // 当前年份 (用于版权信息)
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-brand-green text-white">
      {/* —— 主体: 7 大板块横排 (桌面) / 移动端手风琴单列堆叠 —— */}
      <div className="container-page grid grid-cols-1 lg:grid-cols-7 gap-5 pt-8 lg:pt-12 pb-8">
        {/* §9.1 选购指南 */}
        <AccordionSection title={t("common:footer.service.title")} defaultOpen>
          {/* 官方店铺 (用户 2026-07-31 重新规划: 不再按产品分类, 统一单列表) */}
          <div>
            {/* 大声听力服务中心 → 官方直达 (置顶, 视觉强调) */}
            <a
              href={SITE_INFO.hearingServiceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-[11px] text-white/90 hover:text-white transition-colors duration-300 py-0.5 font-medium"
            >
              {t("common:footer.shop.hearingService")}
            </a>
            {/* 各平台官方店铺 (扁平列表, 用平台标签区分) */}
            {SHOP_LINKS.map((link, idx) => (
              <a
                key={`${link.platformKey}-${idx}`}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[11px] text-white/70 hover:text-white transition-colors duration-300 py-0.5"
              >
                <span className="shrink-0 px-1 py-px text-[10px] text-white/60 border border-white/25 rounded-sm">
                  {t(`common:footer.shop.${link.platformKey}`)}
                </span>
                <span className="truncate">{link.storeName}</span>
              </a>
            ))}
          </div>
        </AccordionSection>

        {/* §9.2-9.6: 关于小维 / 招商加盟 / 人才招聘 / 资讯中心 / 关注我们 */}
        {sections.map((section) => (
          <AccordionSection
            key={section.titleKey}
            title={t(`common:${section.titleKey}`)}
          >
            {section.titleKey === "footer.follow.title" ? (
              /* 关注我们: 6 个社交平台, 单列布局, 点击图标打开灯箱 */
              <div className="flex flex-col gap-1.5">
                {section.links.map((link, idx) => (
                  <FollowLink key={`${link.label}-${idx}`} link={link} />
                ))}
              </div>
            ) : (
              /* 其他板块: 单列链接列表 */
              section.links.map((link, idx) => {
                const labelText =
                  link.label ??
                  (link.labelKey ? t(`common:${link.labelKey}`) : "");

                return link.external ? (
                  <a
                    key={`${labelText}-${idx}`}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[12px] text-white/80 hover:text-white transition-colors duration-300 py-1"
                  >
                    {labelText}
                  </a>
                ) : (
                  <Link
                    key={`${labelText}-${idx}`}
                    to={link.href}
                    className="block text-[12px] text-white/80 hover:text-white transition-colors duration-300 py-1"
                  >
                    {labelText}
                  </Link>
                );
              })
            )}
          </AccordionSection>
        ))}

        {/* §9.7 联系我们 */}
        <AccordionSection title={t("common:footer.contact.title")}>
          <div className="text-[12px] text-white/90 mb-2.5">
            <div className="text-white/70 mb-0.5">
              {t("common:footer.contact.hotline")}
            </div>
            <a
              href={`tel:${SITE_INFO.hotlineTel}`}
              className="text-[16px] font-bold text-white hover:text-white/90 transition-colors duration-300"
            >
              {SITE_INFO.hotline}
            </a>
          </div>
          <div className="text-[12px] text-white/80 mb-2.5">
            <span className="text-white/60">
              {t("common:footer.contact.onlineService")}
            </span>{" "}
            <span>{SITE_INFO.onlineServiceHours}</span>
          </div>
          <div className="text-[12px] text-white/80 mb-2.5">
            <span className="text-white/60">
              {t("common:footer.contact.email")}
            </span>{" "}
            <span>{SITE_INFO.email}</span>
          </div>
          <div className="text-[12px] text-white/80 mb-2.5 leading-[1.6]">
            <span className="text-white/60">
              {t("common:footer.contact.address")}
            </span>
            <br />
            <span>{SITE_INFO.companyAddress}</span>
          </div>
          <div className="text-[12px] text-white/80 leading-[1.6]">
            <span className="text-white/60">
              {t("common:footer.contact.stores")}
            </span>
            <br />
            <span>{SITE_INFO.directStoreAddress}</span>
            <br />
            <a
              href={`tel:${SITE_INFO.directStorePhone}`}
              className="text-white/90 hover:text-white transition-colors duration-300"
            >
              {SITE_INFO.directStorePhone}
            </a>
          </div>
        </AccordionSection>
      </div>

      {/* —— §9.8 底部分割线 —— */}
      <div className="container-page">
        <div className="border-t border-white/20" />
      </div>

      {/* —— §9.9 版权区 (精简: 仅保留 1 个网站审批号) —— */}
      <div className="container-page flex flex-col sm:flex-row items-center gap-3 sm:gap-3 py-4 text-[12px] text-white/80">
        {/* 左: 版权 */}
        <div className="flex items-center gap-3 text-center sm:text-left">
          <img
            src={IMAGES.logo}
            alt={t("common:alt.logo")}
            className="h-[14px] w-auto object-contain brightness-0 invert"
          />
          <span>{t("common:footer.copyright", { year: currentYear })}</span>
        </div>

        {/* 中: 1 个网站审批号 (ICP 备案号) */}
        <div className="flex items-center sm:ml-auto">
          <a
            href="#"
            className="text-white/70 hover:text-white transition-colors duration-300"
          >
            {SITE_INFO.icp}
          </a>
        </div>

        {/* 右: 法律辅助链接 */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          {legalLinks.map((link, idx) => (
            <span key={link.labelKey ?? idx} className="flex items-center gap-3">
              {idx > 0 && <span className="text-white/40">|</span>}
              <Link
                to={link.href}
                className="text-white/70 hover:text-white transition-colors duration-300"
              >
                {link.labelKey ? t(`common:${link.labelKey}`) : link.label}
              </Link>
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}

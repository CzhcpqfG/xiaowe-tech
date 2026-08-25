import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import Reveal from "../components/ui/Reveal";
import { SectionTitle, TitleUnderline } from "../components/ui/SectionTitle";
import { ABOUT_PAGE } from "../data/content";
import { IMAGES } from "../data/images";
import SEO from "../components/SEO";
import {
  SITE_ORIGIN,
  getAboutPageSchema,
  getBreadcrumbSchema,
} from "../config/schema";
import { useLocale } from "../i18n/useLocale";

/* ============================================================
   关于小维页 - 严格按 PROTOTYPE_PAGES.md §三 (11 section) 顺序渲染
   设计风格: 沿用原 2.0 复刻版
     - 朴素: 无圆角 / 无阴影 / 无渐变 (仅"AI"二字例外)
     - 主色: #05a045 / 选中色: #52b548
     - 设计宽度: 1200px (container-page)
     - 字体: MiSans > PingFang SC > Microsoft YaHei

   i18n 改造 (2026-07-25):
     - 所有可见文案通过 t(ABOUT_PAGE.xxx.xxxKey) 翻译 (about namespace)
     - 数组字段 (paragraphs / interpretations / details) 用 t(keys, { returnObjects: true })
     - SEO 通过 <SEO titleKey="about.title" ... /> 动态化
   ============================================================ */

function AboutPage() {
  const { t } = useTranslation(["about", "common"]);
  const { locale } = useLocale();

  // GEO schema: AboutPage + BreadcrumbList (2026-08-16)
  const aboutSchema = getAboutPageSchema(`${SITE_ORIGIN}/${locale}/about`);
  const breadcrumbSchema = getBreadcrumbSchema([
    { name: "首页", url: `${SITE_ORIGIN}/${locale}/` },
    { name: "关于小维", url: `${SITE_ORIGIN}/${locale}/about` },
  ]);

  return (
    <>
      <SEO
        titleKey="about.title"
        descriptionKey="about.description"
        path="/about"
        jsonLd={[aboutSchema, breadcrumbSchema]}
      />

      {/* ============================================================
          §3.1 Hero - 接入统一 ProductCarouselHero 组件 (关于小维)
          2026-07-25 v3: 浅米白暖调背景 + 中部 HTML 叠加标题 (钉钉进步体)
          AI 图: 主体在右侧, 中部左侧留白给文字
          ============================================================ */}
      <ProductCarouselHero height={480} mobileObjectFit="contain" />

      {/* ============================================================
          §3.2 + §3.3 企业简介 - 创维集团 + 小维健康科技 + 8 张核心数据卡片
          2026-07-23 用户指示:
            - 标题改为 "企业简介"
            - 副标 1 "创维集团" + 副标 2 "小维健康科技", 靠左
            - 删除 "集团核心数据" 标题
          ============================================================ */}
      <section id="intro" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.skyworthGroup.sectionTitleKey)} as="h1" />
            <TitleUnderline />
          </Reveal>
          {/* 靠左副标 */}
          <Reveal>
            <div className="mb-[24px]">
              <p className="text-[16px] lg:text-[20px] text-[#333333] font-bold leading-[24px] lg:leading-[30px] text-left">
                {t(ABOUT_PAGE.skyworthGroup.subTitle1Key)}
              </p>
            </div>
          </Reveal>
          {/* 左文右图布局 */}
          <Reveal>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_500px] gap-[24px] lg:gap-[40px] items-center mb-[36px] lg:mb-[48px]">
              {/* 左侧: 段落文本 (垂直居中, 对齐右边配图中心) */}
              <div className="space-y-4 lg:space-y-6">
                {(ABOUT_PAGE.skyworthGroup.paragraphKeys.map((k) => t(k)) as string[]).map((paragraph, idx) => (
                  <p
                    key={idx}
                    className="text-[14px] lg:text-[16px] text-[#3f4b59] leading-[24px] lg:leading-[30px] text-left"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
              {/* 右侧: 创维大楼配图 */}
              <div className="aspect-[4/3] bg-[#fafafa] overflow-hidden">
                <img
                  src={IMAGES.aboutHeroBg}
                  alt={t(ABOUT_PAGE.skyworthGroup.altKey)}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </Reveal>
          {/* §3.3 核心数据卡片 - 8 张, 4 列 × 2 行 (删除 "集团核心数据" 标题)
              2026-07-24 用户指示: hover 时品牌绿抽屉上拉, 内部数据变白 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-[12px] lg:gap-[20px]">
            {ABOUT_PAGE.skyworthStats.map((stat, idx) => (
              <Reveal key={idx} variant="scale-up" delay={idx * 80}>
                <div className="group relative bg-white border border-ink-200 p-[16px] lg:p-[20px] h-full flex flex-col overflow-hidden transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green">
                  {/* 抽屉层 - 品牌绿背景, 从底部上拉覆盖 */}
                  <div className="absolute inset-0 bg-brand-green translate-y-full transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-y-0" />
                  {/* 内容区 - relative 保证在抽屉之上, hover 时数据变白 */}
                  <div className="relative flex flex-col h-full">
                    {/* 数字 + 单位 */}
                    <div className="flex items-baseline gap-[4px] mb-[8px]">
                      <span className="text-[32px] lg:text-[42px] font-bold text-brand-green leading-none tracking-tight transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-white">
                        {stat.num}
                      </span>
                      <span className="text-[12px] lg:text-[14px] text-[#333333] font-normal transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-white">
                        {t(stat.unitKey)}
                      </span>
                    </div>
                    {/* label */}
                    <p className="text-[13px] lg:text-[14px] text-[#333333] font-bold leading-[20px] lg:leading-[22px] mb-[6px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-white">
                      {t(stat.labelKey)}
                    </p>
                    {/* 副标 (如有) */}
                    {t(stat.subKey) && (
                      <p className="text-[11px] lg:text-[12px] text-[#999999] font-normal leading-[16px] lg:leading-[18px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-white/80">
                        {t(stat.subKey)}
                      </p>
                    )}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          §3.4 小维健康科技 - 5 段简介 + 接续 §3.5 两大研究方向 (无独立标题)
          用户 2026-07-21 指示: 去掉两大研究方向的标题, 内容接续在 §3.4 之后
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          {/* 小维健康科技 - 副标 (与创维集团副标同一效果, 不再用 SectionTitle) */}
          <Reveal>
            <div className="mb-[24px]">
              <p className="text-[16px] lg:text-[20px] text-[#333333] font-bold leading-[24px] lg:leading-[30px] text-left">
                {t(ABOUT_PAGE.xiaoweiHealth.sectionTitleKey)}
              </p>
            </div>
          </Reveal>
          <Reveal>
            <div className="space-y-4 lg:space-y-6">
              {(ABOUT_PAGE.xiaoweiHealth.paragraphKeys.map((k) => t(k)) as string[]).map((paragraph, idx) => (
                <p
                  key={idx}
                  className="text-[14px] lg:text-[16px] text-[#3f4b59] leading-[24px] lg:leading-[30px] text-left"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </Reveal>
          {/* §3.5 两大研究方向 - 接续 §3.4 之后, 无独立 section 标题
              2026-07-24 用户指示: 卡片加白色蒙版的背景图; 简约 hover (仅背景图缓慢放大) */}
          <div className="mt-[36px] lg:mt-[48px] grid grid-cols-1 lg:grid-cols-2 gap-[20px] lg:gap-[24px]">
            {ABOUT_PAGE.researchDirections.items.map((item, idx) => (
              <Reveal key={idx} variant="scale-up" delay={idx * 120}>
                <div className="group relative bg-white border border-ink-200 h-[280px] lg:h-[360px] overflow-hidden">
                  {/* 背景图 - hover 时缓慢放大 (Apple Ken Burns 经典效果) */}
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={IMAGES[item.imageKey]}
                      alt={t(item.titleKey)}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.06]"
                    />
                  </div>
                  {/* 白色蒙版 - 固定 85% 不透明保证文字可读 */}
                  <div className="absolute inset-0 bg-white/85" />
                  {/* 内容区 - 相对定位贴底 */}
                  <div className="relative h-full p-[20px] lg:p-[32px] flex flex-col justify-end">
                    {/* 序号 - 大号浅绿装饰 */}
                    <span className="text-[40px] lg:text-[60px] font-bold text-brand-green/15 leading-none mb-[8px] lg:mb-[12px]">
                      0{idx + 1}
                    </span>
                    {/* tag - 18px #05a045 700 */}
                    <p className="text-[15px] lg:text-[18px] text-brand-green font-bold leading-[22px] lg:leading-[27px] mb-[8px] lg:mb-[10px]">
                      {t(item.tagKey)}
                    </p>
                    {/* 标题 - 22px #333 700 */}
                    <h3 className="text-[18px] lg:text-[22px] text-[#333333] font-bold leading-[27px] lg:leading-[33px] mb-[10px] lg:mb-[14px]">
                      {t(item.titleKey)}
                    </h3>
                    {/* 描述 - 14px #666 400 */}
                    <p className="text-[13px] lg:text-[14px] text-[#666666] font-normal leading-[20px] lg:leading-[24px]">
                      {t(item.descKey)}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================
          §3.6 企业文化 - 左右交错布局 (使命 / 愿景 / 价值观)
          2026-07-23 用户指示: 一边图片一边文本, 自上而下左右交错呈现
          布局: 3 行, 每行 2 列 (图片 + 文字), 偶数行图左文右, 奇数行文左图右
          ============================================================ */}
      <section id="culture" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.culture.sectionTitleKey)} />
            <TitleUnderline />
          </Reveal>
          <div>
            {ABOUT_PAGE.culture.items.map((item, idx) => {
              const imageOnLeft = idx % 2 === 0;
              const interpretations = item.interpretationKeys.map((k) => t(k)) as string[];
              return (
                <Reveal key={idx} variant={imageOnLeft ? "fade-right" : "fade-left"} delay={idx * 120}>
                  <div className="group grid grid-cols-1 lg:grid-cols-2 items-stretch overflow-hidden bg-white border border-ink-200 transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green">
                    {/* 图片区 - 4:3, hover 时缓慢放大 (Ken Burns 效果) */}
                    <div
                      className={`bg-[#fafafa] overflow-hidden ${
                        imageOnLeft ? "lg:order-1" : "lg:order-2"
                      }`}
                    >
                      <img
                        src={IMAGES[item.imageKey]}
                        alt={t(item.titleKey)}
                        className="w-full h-full object-cover aspect-[4/3] transition-transform duration-[1200ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
                      />
                    </div>
                    {/* 文字区 */}
                    <div
                      className={`p-[20px] lg:p-[32px] flex flex-col justify-center ${
                        imageOnLeft ? "lg:order-2" : "lg:order-1"
                      }`}
                    >
                      {/* label - 60px 浅绿装饰 (对应研究方向卡片 01/02 序号效果) */}
                      <span className="text-[40px] lg:text-[60px] font-bold text-brand-green/15 leading-none mb-[8px] lg:mb-[12px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green/25">
                        {t(item.labelKey)}
                      </span>
                      {/* title - 18px #05a045 700 (对应研究方向 tag 效果) */}
                      <p className="text-[15px] lg:text-[18px] text-brand-green font-bold leading-[22px] lg:leading-[27px] mb-[10px] lg:mb-[14px] mt-[6px] lg:mt-[10px]">
                        {t(item.titleKey)}
                      </p>
                      {/* 诠释条目列表 - 14px #666 400 lh=24px (对应研究方向 desc 效果) */}
                      <ul className="space-y-[8px] lg:space-y-[10px]">
                        {interpretations.map((interp, iIdx) => (
                          <li
                            key={iIdx}
                            className="text-[13px] lg:text-[14px] text-[#666666] font-normal leading-[20px] lg:leading-[24px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-ink-700"
                          >
                            {interp}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          §3.7 荣誉资质 - 参考用户图片布局 (3 行: 5 竖版注册证 + 3 横版企业资质 + 2 横版会员/评级)
          2026-07-21 用户指示: 参考图片布局, 包含竖版和横版图片, 用证书类占位图, 暂时不用真实图片
          第一行: 5 个竖版小卡片 (高 260px)
          第二行: 3 个横版卡片 (高 200px)
          第三行: 2 个横版卡片 (高 200px)
          ============================================================ */}
      <section id="honors" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.honors.sectionTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 荣誉资质证书墙 - 重新设计: 横版 4 张 + 竖版 5 张, 分两行排列
              展示台效果: 卡片本体 (展品) + 下方台座 (左右凸出 6px, 顶部接缝+底部深色底沿)
              + 台座下方微弱投影矩形, 营造博物馆展品质感
              横版卡片高 220px, 竖版卡片高 320px, 各自比例匹配图片内容 */}
          <Reveal variant="scale-up">
            {/* 移动端 2 列 (2×2), 桌面 4 列 — 2026-08-15 修复移动端图片挤压 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-[12px] lg:gap-[16px] mb-[24px]">
              {ABOUT_PAGE.honors.row1.map((honor, idx) => (
                <Reveal key={`r1-${idx}`} variant="scale-up" delay={idx * 60}>
                  <div className="group">
                    {/* 卡片主体 (展品) */}
                    <div className="bg-white border border-ink-200 p-[16px] h-[220px] flex items-center justify-center overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-[6px] group-hover:border-brand-green">
                      <img
                        src={IMAGES[honor.imageKey]}
                        alt={t(honor.nameKey)}
                        className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
                      />
                    </div>
                    {/* 展示台台座 (左右凸出 6px, 顶部接缝 + 底部深色底沿) */}
                    <div className="-mx-[6px] h-[10px] bg-[#e8e8e8] border-t border-[#d8d8d8] border-b-[2px] border-b-[#bcbcbc] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-[#dadada]" />
                    {/* 台座下方投影 (微弱矩形) */}
                    <div className="mx-[14px] h-[3px] bg-black/[0.05]" />
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>

          <Reveal variant="scale-up" delay={100}>
            {/* 移动端 2 列 flex 布局 (第 5 张自动居中), 桌面 5 列
                2026-08-15 修复移动端图片挤压 */}
            <div className="flex flex-wrap justify-center lg:grid lg:grid-cols-5 gap-[12px] lg:gap-[16px]">
              {ABOUT_PAGE.honors.row2.map((honor, idx) => (
                <Reveal
                  key={`r2-${idx}`}
                  variant="scale-up"
                  delay={idx * 60}
                  className="w-[calc(50%-6px)] lg:w-auto"
                >
                  <div className="group">
                    {/* 卡片主体 (展品) */}
                    <div className="bg-white border border-ink-200 p-[16px] h-[320px] flex items-center justify-center overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:-translate-y-[6px] group-hover:border-brand-green">
                      <img
                        src={IMAGES[honor.imageKey]}
                        alt={t(honor.nameKey)}
                        className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05]"
                      />
                    </div>
                    {/* 展示台台座 (左右凸出 6px, 顶部接缝 + 底部深色底沿) */}
                    <div className="-mx-[6px] h-[10px] bg-[#e8e8e8] border-t border-[#d8d8d8] border-b-[2px] border-b-[#bcbcbc] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:bg-[#dadada]" />
                    {/* 台座下方投影 (微弱矩形) */}
                    <div className="mx-[14px] h-[3px] bg-black/[0.05]" />
                  </div>
                </Reveal>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          §3.8 + §3.9 合并 - 核心团队: 创始人王海 + 核心团队四人
          用户 2026-07-21 指示: 组织架构模块先展示创始人王海, 再展示核心团队四人
          用户 2026-07-21 三次优化: 统一视觉语言 (创始人 + 成员都用"左侧绿色边条 + 圆形头像 + 右侧信息")
            - 去掉创始人卡的绿色标题栏大色块 (与项目朴素风格更协调)
            - 创始人卡: 左侧绿色边条 + 圆形半身照 + 右侧 (姓名 + 职务 + 绿色短横线 + details)
            - 成员卡: 左侧绿色边条 + 小圆头像 + 右侧 (姓名 + 职务 + 简介)
            - 视觉语言完全统一, 仅尺寸差异化 (创始人 > 成员)
          ============================================================ */}
      <section id="org" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.team.sectionTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 创始人王海 - 横向大卡 (左侧绿色边条 + 圆形半身照 + 右侧信息)
              hover: 卡片边框变绿 + 头像边框加深
              移动端: 头像区在上, 信息在下, 纵向堆叠 */}
          <Reveal variant="scale-up" className="mb-[24px]">
            <div className="group bg-white border border-ink-200 flex flex-col sm:flex-row transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green">
              {/* 左侧: 王海圆形半身照 (浅绿背景区, 居中圆形照片) */}
              <div className="shrink-0 w-full sm:w-[220px] lg:w-[260px] bg-[#f5f9f6] flex items-center justify-center p-[20px] lg:p-[24px]">
                <div className="w-[160px] h-[160px] lg:w-[200px] lg:h-[200px] rounded-full overflow-hidden border-[5px] border-brand-green transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.04]">
                  <img
                    src={IMAGES[ABOUT_PAGE.team.founder.imageKey]}
                    alt={t(ABOUT_PAGE.team.founder.nameKey)}
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
              {/* 右侧: 信息区 (姓名 + 职务 + details) */}
              <div className="flex-1 px-[20px] lg:px-[36px] py-[20px] lg:py-[28px] flex flex-col justify-center">
                {/* 姓名 + 职务 */}
                <div className="mb-[16px] lg:mb-[24px]">
                  <span className="text-[24px] lg:text-[36px] font-bold text-[#333333] leading-[32px] lg:leading-[50px] mr-[12px] lg:mr-[16px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                    {t(ABOUT_PAGE.team.founder.nameKey)}
                  </span>
                  <span className="text-[14px] lg:text-[16px] text-brand-green font-bold leading-[22px] lg:leading-[24px]">
                    {t(ABOUT_PAGE.team.founder.titleKey)}
                  </span>
                </div>
                {/* details 列表 - 4 行绿色圆点, 与成员卡统一 */}
                <ul className="space-y-[6px] lg:space-y-[8px]">
                  {(ABOUT_PAGE.team.founder.detailKeys.map((k) => t(k)) as string[]).map((detail, idx) => (
                    <li key={idx} className="flex items-start gap-[10px] text-[13px] lg:text-[14px] text-[#333333] font-normal leading-[20px] lg:leading-[24px]">
                      <span className="shrink-0 mt-[8px] lg:mt-[10px] w-[4px] h-[4px] bg-brand-green" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>

          {/* 核心团队四人 - 与创始人卡统一视觉语言: 左侧绿色边条 + 圆形头像 + 右侧 (姓名/职务 + 4 行 details) */}
          <div className="mb-[20px] mt-[30px] lg:mt-[40px]">
            <span className="text-[18px] lg:text-[22px] font-bold text-[#333333] leading-[27px] lg:leading-[33px]">
              {t("about:team.coreTeamLabel")}
            </span>
          </div>
          <div className="space-y-[12px]">
            {ABOUT_PAGE.team.members.map((member, idx) => {
              const details = member.detailKeys.map((k) => t(k)) as string[];
              return (
              <Reveal key={idx} variant="fade-right" delay={idx * 80}>
                <div className="group bg-white border border-ink-200 px-[16px] lg:px-[24px] py-[14px] lg:py-[18px] flex items-center gap-[14px] lg:gap-[20px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green hover:bg-brand-green/5">
                  {/* 左侧: 小圆形头像 (90×90) */}
                  <div className="shrink-0 w-[72px] h-[72px] lg:w-[96px] lg:h-[96px] rounded-full bg-[#f5f9f6] flex items-center justify-center">
                    <div className="w-[68px] h-[68px] lg:w-[90px] lg:h-[90px] rounded-full overflow-hidden border-[3px] border-brand-green/40 transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:border-brand-green group-hover:scale-[1.05]">
                      <img
                        src={IMAGES[member.imageKey]}
                        alt={t(member.nameKey)}
                        className="w-full h-full object-cover object-top"
                      />
                    </div>
                  </div>
                  {/* 右侧: 姓名/职务 + 4 行 details */}
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <div className="mb-[10px] lg:mb-[16px]">
                      <span className="text-[16px] lg:text-[20px] font-bold text-[#333333] leading-[24px] lg:leading-[28px] mr-[10px] lg:mr-[12px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                        {t(member.nameKey)}
                      </span>
                      <span className="text-[12px] lg:text-[13px] text-brand-green font-bold leading-[18px] lg:leading-[20px]">
                        {t(member.titleKey)}
                      </span>
                    </div>
                    <ul className="space-y-[4px] lg:space-y-[6px]">
                      {details.map((detail, dIdx) => (
                        <li
                          key={dIdx}
                          className="flex items-start gap-[8px] text-[12px] lg:text-[14px] text-[#666666] font-normal leading-[18px] lg:leading-[22px]"
                        >
                          <span className="shrink-0 mt-[7px] lg:mt-[9px] w-[4px] h-[4px] bg-brand-green" />
                          <span className="flex-1">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============================================================
          §3.10 战略合作伙伴 - 战略投资 4 家 + 战略合作 5 家
          用户 2026-07-21 指示: 拆为战略投资 (创维/华鹏飞/海和/新生) + 战略合作 (腾讯天籁/银发听力/深圳大学/中国老龄基金会/中山大学孙逸仙纪念医院)
          logo 来源: 3 张真实 (06_product_5/7/8.webp) + 6 张 AI 生图占位 (public/images/about/partners/)
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.partners.sectionTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 战略投资 - 4 家, 4 列网格, logo 略微增大 */}
          <Reveal variant="scale-up" className="mb-[30px] lg:mb-[40px]">
            <div className="mb-[16px]">
              <span className="text-[18px] lg:text-[22px] font-bold text-[#333333] leading-[27px] lg:leading-[33px]">
                {t(ABOUT_PAGE.partners.strategicInvestment.subTitleKey)}
              </span>
            </div>
            <div className="bg-white border border-[#e8f5ee] p-[16px] sm:p-[24px] lg:p-[36px] shadow-[0_12px_40px_rgba(5,160,69,0.15),0_4px_12px_rgba(5,160,69,0.08)]">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-[12px] lg:gap-[20px]">
                {ABOUT_PAGE.partners.strategicInvestment.list.map((partner, idx) => (
                  <Reveal key={idx} variant="scale-up" delay={idx * 80}>
                    <div className="group bg-white p-[12px] lg:p-[20px] w-[180px] lg:w-full flex flex-col items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px]">
                      {/* logo - 130px 高度 (略微再增大) */}
                      <div className="w-full h-[100px] lg:h-[130px] flex items-center justify-center">
                        <img
                          src={IMAGES[partner.imageKey]}
                          alt={t(partner.nameKey)}
                          className="max-w-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
                          style={{
                            maxHeight:
                              "logoScale" in partner && partner.logoScale
                                ? `${partner.logoScale * 130}px`
                                : "130px",
                          }}
                        />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 战略合作 - 5 家, 分两行: 第一行 3 个 (3 列) + 第二行 2 个居中
              logo 尺寸与战略投资完全一致 (h-[100px] lg:h-[130px]), 避免移动端变小
              移动端: 2 列 (与战略投资一致); 桌面: 第一行 3 列, 第二行 2 列居中 */}
          <Reveal variant="scale-up">
            <div className="mb-[16px]">
              <span className="text-[18px] lg:text-[22px] font-bold text-[#333333] leading-[27px] lg:leading-[33px]">
                {t(ABOUT_PAGE.partners.strategicCooperation.subTitleKey)}
              </span>
            </div>
            <div className="bg-white border border-[#e8f5ee] p-[16px] sm:p-[24px] lg:p-[36px] shadow-[0_12px_40px_rgba(5,160,69,0.15),0_4px_12px_rgba(5,160,69,0.08)]">
              {/* 第一行: 3 个 logo (移动端 2 列, 桌面 3 列) */}
              <div className="flex flex-col items-center lg:grid lg:grid-cols-3 gap-[12px] lg:gap-[20px] mb-[12px] lg:mb-[20px]">
                {ABOUT_PAGE.partners.strategicCooperation.list.slice(0, 3).map((partner, idx) => (
                  <Reveal key={`s1-${idx}`} variant="scale-up" delay={idx * 80}>
                    <div className="group bg-white p-[12px] lg:p-[20px] w-[180px] lg:w-full flex flex-col items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px]">
                      {/* logo - 与战略投资一致: 100px / 130px */}
                      <div className="w-full h-[100px] lg:h-[130px] flex items-center justify-center">
                        <img
                          src={IMAGES[partner.imageKey]}
                          alt={t(partner.nameKey)}
                          className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              {/* 第二行: 2 个 logo 居中 (移动端 2 列等宽, 桌面 flex 居中) */}
              <div className="flex flex-col items-center lg:flex-row lg:justify-center gap-[12px] lg:gap-[20px]">
                {ABOUT_PAGE.partners.strategicCooperation.list.slice(3, 5).map((partner, idx) => (
                  <Reveal key={`s2-${idx}`} variant="scale-up" delay={idx * 80}>
                    <div className="group bg-white p-[12px] lg:p-[20px] w-[180px] lg:w-auto flex flex-col items-center justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px]">
                      {/* logo - 与战略投资一致: 100px / 130px */}
                      <div className="w-full h-[100px] lg:h-[130px] flex items-center justify-center">
                        <img
                          src={IMAGES[partner.imageKey]}
                          alt={t(partner.nameKey)}
                          className="max-w-full max-h-full object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ============================================================
          §3.11 发展历程 - 5 个阶段卡片 (2022-2026)
          用户 2026-07-21 指示: 2022 和 2023 排在同一行两列, 其他年份保持单行
          原网站字号规范:
            年份 24px #333 700 / 阶段名 20px #212121 700 / 事件 14px #4b4b4b 400
          ============================================================ */}
      <section id="milestone" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle title={t(ABOUT_PAGE.timeline.sectionTitleKey)} />
            <TitleUnderline />
          </Reveal>

          {/* 2022 + 2023 同一行两列 (上下布局, 月份事件 1 列) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-[16px] lg:gap-[24px] mb-[16px] lg:mb-[24px]">
            {ABOUT_PAGE.timeline.stages.slice(0, 2).map((stage, idx) => (
              <Reveal key={idx} variant="scale-up" delay={idx * 80}>
                <div className="group bg-white border border-ink-200 p-[20px] lg:p-[28px] h-full flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:border-brand-green hover:shadow-[0_12px_30px_rgba(5,160,69,0.10)]">
                  {/* 年份 + 阶段名 (顶部, 带左侧绿色竖条) */}
                  <div className="pl-[12px] lg:pl-[16px] mb-[16px] lg:mb-[20px]">
                    <div className="text-[22px] lg:text-[28px] font-bold text-brand-green leading-[30px] lg:leading-[36px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-[2px]">
                      {t(stage.yearKey)}
                    </div>
                    {t(stage.phaseKey) && (
                      <div className="text-[14px] lg:text-[16px] font-bold text-[#212121] leading-[22px] lg:leading-[24px] mt-[4px]">
                        {t(stage.phaseKey)}
                      </div>
                    )}
                  </div>
                  {/* 月份事件列表 - 1 列 (窄宽度) */}
                  <ul className="space-y-[6px] lg:space-y-[8px]">
                    {stage.items.map((item, iIdx) => (
                      <li
                        key={iIdx}
                        className="flex items-start gap-[10px] text-[12px] lg:text-[13px] text-[#4b4b4b] leading-[18px] lg:leading-[22px]"
                      >
                        <span className="shrink-0 w-[32px] lg:w-[36px] text-brand-green font-bold">
                          {t(item.monthKey)}
                        </span>
                        <span className="flex-1">{t(item.eventKey)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          {/* 2024 + 2025 + 2026 单行 (左右布局, 月份事件 2 列)
              移动端: 单列纵向堆叠 */}
          <div className="space-y-[16px] lg:space-y-[24px]">
            {ABOUT_PAGE.timeline.stages.slice(2).map((stage, idx) => (
              <Reveal key={idx} variant="fade-right" delay={idx * 80}>
                <div className="group bg-white border border-ink-200 p-[20px] lg:p-[32px] transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:border-brand-green hover:shadow-[0_12px_30px_rgba(5,160,69,0.10)]">
                  {/* 年份 + 阶段名 (左侧时间轴竖条 + 右侧内容) */}
                  <div className="flex flex-col sm:flex-row items-start gap-[12px] sm:gap-[24px] mb-[16px] sm:mb-[24px]">
                    {/* 左侧: 年份 + 阶段名 */}
                    <div className="shrink-0 w-full sm:w-[240px] lg:w-[280px] pl-[16px] sm:pl-[20px]">
                      <div className="text-[24px] lg:text-[32px] font-bold text-brand-green leading-[32px] lg:leading-[40px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:translate-x-[2px]">
                        {t(stage.yearKey)}
                      </div>
                      {t(stage.phaseKey) && (
                        <div className="text-[15px] lg:text-[18px] font-bold text-[#212121] leading-[22px] lg:leading-[27px] mt-[6px]">
                          {t(stage.phaseKey)}
                        </div>
                      )}
                    </div>
                    {/* 右侧: 月份事件列表 - 2 列 */}
                    <div className="flex-1">
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-[24px] lg:gap-x-[40px] gap-y-[6px] lg:gap-y-[10px]">
                        {stage.items.map((item, iIdx) => (
                          <li
                            key={iIdx}
                            className="flex items-start gap-[10px] lg:gap-[12px] text-[13px] lg:text-[14px] text-[#4b4b4b] leading-[20px] lg:leading-[25.2px]"
                          >
                            <span className="shrink-0 w-[36px] lg:w-[40px] text-brand-green font-bold">
                              {t(item.monthKey)}
                            </span>
                            <span className="flex-1">{t(item.eventKey)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

export default AboutPage;

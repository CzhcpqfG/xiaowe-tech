import { useTranslation } from "react-i18next";
import ProductCarouselHero from "../components/layout/ProductCarouselHero";
import { INVEST_PAGE } from "../data/content";
import { IMAGES } from "../data/images";
import { SITE_INFO } from "../config/site";
import Reveal from "../components/ui/Reveal";
import { SubSectionTitle } from "../components/ui/SubSectionTitle";
import HearingLossGradeTable from "../components/invest/HearingLossGradeTable";
import FaqSection from "../components/faq/FaqSection";
import SEO from "../components/SEO";

/* ============================================================
   InvestPage - 招商加盟页 (/invest)
   数据源: PROTOTYPE_PAGES.md §六 (6 section)

   6 个 section:
     1. Hero Banner        - 招商加盟 + 声价千亿 聚势共赢
     2. 行业前景好          - 听力行业的"三高一低"
                              (高流行 / 高危害 / 高可干预 / 低认知)
     3. 项目优势强          - 赛道好 + 政府扶持 + 品牌实力强
                              (赛道好 / 中国市场现状 / 政策利好 / 全民意识提升 / 创维集团旗下)
     4. 合作政策            - 兜底式全面扶持
                              (开店全流程 / 专家全程带教 / 全域营销赋能 / 总部代运营兜底)
     5. 联系我们            - 由全局 Footer 统一渲染

   设计规范 (全站统一):
     - 主色 brand-green #05a045 / 选中色 brand-green-light #52b548
     - 字体: MiSans (默认) / 钉钉进步体 (大标题, 通过 font-display class)
     - 灰阶: ink-700 #333 / ink-600 #555 / ink-500 #666 / ink-400 #999 / ink-200 #e5e5e5
     - Section 标题: 30px ink-700 700 leading-[45px]
     - 副标: 16px ink-500 400 leading-[24px]
     - 无圆角 / 无阴影 / 无渐变
     - 1200px 设计宽度 (container-page)
   ============================================================ */

/* 板块标题 - 主标 30px ink-700 700 + 副标 16px ink-500 400 */
function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-[24px] lg:text-[30px] font-bold text-ink-700 mb-3 leading-[36px] lg:leading-[45px]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[14px] lg:text-[16px] text-ink-500 leading-[22px] lg:leading-[24px]">{subtitle}</p>
      )}
    </div>
  );
}

function InvestPage() {
  const { t, i18n } = useTranslation("invest");

  // 根据 locale 切换 hero 图 (文字烧录在图片上, 三套版本)
  const heroImage =
    i18n.language.startsWith("zh-TW")
      ? IMAGES.heroInvestZhTW
      : i18n.language.startsWith("en")
        ? IMAGES.heroInvestEn
        : IMAGES.heroInvest;

  return (
    <>
      <SEO
        titleKey="invest.title"
        descriptionKey="invest.description"
        path="/invest"
      />
      {/* 视觉隐藏 h1 - 页面主标题 (SEO 语义, 不影响视觉) */}
      <h1 className="sr-only">小维健康科技招商加盟 · 与创维生态共创共赢</h1>
      {/* ============================================================
          1. Hero - 接入统一 ProductCarouselHero 组件 (仅渲染图片)
          2026-07-25 重构: 只保留图片, 去掉文字/logo 叠加层 (Apple/Tesla 高端简约风格)
          背景: AI 生图 (商务合作场景, 图片自带 "声价千亿 聚势共赢" 文字, 2:1)
          i18n: 根据 locale 切换 zh-CN/zh-TW/en 三套 hero 图 (文字烧录在图片上)
          ============================================================ */}
      <ProductCarouselHero
        images={[heroImage]}
        height={480}
        interval={60000}
        mobileObjectFit="contain"
      />

      {/* ============================================================
          2. 行业前景好 — 听力行业的"三高一低"
          4 个子模块: 高流行 / 高危害 / 高可干预 / 低认知
          ============================================================ */}
      <section id="prospects" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle
              title={t(INVEST_PAGE.prospect.sectionTitleKey)}
              subtitle={t(INVEST_PAGE.prospect.sectionSubtitleKey)}
            />
          </Reveal>

          {/* 2.1 高流行 - 左大图 + 右 2×2 数据卡 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.prospect.highPrevalence.titleKey)}
              desc={t(INVEST_PAGE.prospect.highPrevalence.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 lg:grid-cols-[500px_1fr] gap-[40px] items-stretch">
              {/* 左侧: 主题概念图 */}
              <div className="flex items-center justify-center">
                <img
                  src={IMAGES[INVEST_PAGE.prospect.highPrevalence.imageKey]}
                  alt={t(INVEST_PAGE.prospect.highPrevalence.imageAltKey)}
                  className="w-full h-auto object-contain"
                />
              </div>
              {/* 右侧: 2×2 数据卡 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
                {INVEST_PAGE.prospect.highPrevalence.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="group relative border border-ink-200 bg-white p-6 flex flex-col items-start justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:bg-brand-green/5 hover:border-brand-green hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                  >
                    {/* 左侧绿色竖条 - hover 时出现 */}
                    <span className="absolute left-0 top-0 bottom-0 w-[4px] bg-brand-green opacity-0 group-hover:opacity-100 transition-opacity duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]" />
                    <span className="text-[28px] lg:text-[36px] font-bold text-brand-green leading-[32px] lg:leading-[40px] mb-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 inline-block">
                      {t(stat.numKey)}
                    </span>
                    <span className="text-[14px] text-ink-700 font-bold leading-[22px] mb-1">
                      {t(stat.labelKey)}
                    </span>
                    {stat.subKey && (
                      <span className="text-[12px] text-ink-400 leading-[18px]">
                        {t(stat.subKey)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 2.2 高危害 - 三大风险，上下排列，桌面端左右交错 / 移动端统一图上文下 */}
          <Reveal variant="fade-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.prospect.highHarm.titleKey)}
              desc={t(INVEST_PAGE.prospect.highHarm.descKey)}
            />
            <div className="pl-[16px] space-y-[30px]">
              {INVEST_PAGE.prospect.highHarm.risks.map((risk, idx) => {
                const isReverse = idx % 2 === 1; // 桌面端: 偶数索引左图右文, 奇数索引左文右图
                /* 文本区 - hover 背景变浅绿 */
                const textBlock = (
                  <div className="p-[32px] flex flex-col justify-center transition-colors duration-200 hover:bg-brand-green/5">
                    {/* 大号浅绿装饰序号 */}
                    <span className="text-[44px] lg:text-[60px] font-bold text-brand-green/15 leading-none mb-[12px]">
                      0{idx + 1}
                    </span>
                    {/* 主题标题 - 绿色 */}
                    <h4 className="text-[18px] lg:text-[22px] text-brand-green font-bold leading-[27px] lg:leading-[33px] mb-[24px]">
                      {t(risk.topicKey)}
                    </h4>
                    {/* 两个数据点: 大数字 + 标签 baseline 对齐 */}
                    <div className="space-y-[16px]">
                      {risk.stats.map((s, sIdx) => (
                        <div key={sIdx} className="flex items-baseline gap-[12px]">
                          <span className="text-[28px] lg:text-[36px] font-bold text-brand-green leading-[32px] lg:leading-[40px] shrink-0">
                            {t(s.numKey)}
                          </span>
                          <span className="text-[14px] text-ink-600 leading-[22px]">
                            {t(s.labelKey)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
                /* 图片区 - hover 轻微放大 */
                const imageBlock = (
                  <div className="overflow-hidden">
                    <img
                      src={IMAGES[risk.imageKey]}
                      alt={t(risk.imageAltKey)}
                      className="w-full h-auto object-contain transition-transform duration-300 hover:scale-[1.03]"
                    />
                  </div>
                );
                return (
                  <div
                    key={idx}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-[40px] items-center"
                  >
                    {/* 移动端统一: 图上文下; 桌面端: isReverse 控制 (false=左图右文, true=左文右图) */}
                    <div className="lg:hidden">{imageBlock}</div>
                    <div className="lg:hidden">{textBlock}</div>
                    <div className="hidden lg:block">{isReverse ? textBlock : imageBlock}</div>
                    <div className="hidden lg:block">{isReverse ? imageBlock : textBlock}</div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          {/* 2.3 高可干预 - 描述 + 听力损失分级对照表 (前端代码复刻) */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.prospect.highIntervention.titleKey)}
              desc={t(INVEST_PAGE.prospect.highIntervention.descKey)}
            />
            <div className="pl-[16px]">
              <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0 lg:overflow-visible">
                <HearingLossGradeTable />
              </div>
            </div>
          </Reveal>

          {/* 2.4 低认知 - 用户低认知 + 政府低认知 (2 列)
                 标题绿色背景白字 + 粘贴在卡片上方 + 两卡等高 */}
          <Reveal variant="scale-up">
            <SubSectionTitle
              title={t(INVEST_PAGE.prospect.lowAwareness.titleKey)}
              desc={t(INVEST_PAGE.prospect.lowAwareness.descKey)}
            />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-[30px] pl-[16px] items-stretch">
              {INVEST_PAGE.prospect.lowAwareness.groups.map((group, idx) => (
                <div key={idx} className="flex flex-col">
                  {/* 标题 - 绿色背景白字, 粘贴在卡片上方 */}
                  <div className="bg-brand-green px-[20px] py-[10px]">
                    <p className="text-[15px] lg:text-[18px] font-bold text-white leading-[22px] lg:leading-[24px]">
                      {t(group.labelKey)}
                    </p>
                  </div>
                  {/* 卡片 - border-t-0 与标题粘贴, flex-1 等高 */}
                  <div className="border border-ink-200 border-t-0 bg-ink-100 p-6 flex-1">
                    <ul className="space-y-3">
                      {group.itemKeys.map((itemKey, iIdx) => (
                        <li
                          key={iIdx}
                          className="flex items-start gap-2 text-[14px] text-ink-600 leading-[24px]"
                        >
                          <span className="shrink-0 mt-[8px] inline-block w-[4px] h-[4px] bg-brand-green" />
                          <span className="flex-1">{t(itemKey)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          3. 项目优势强 — 赛道好 + 政府扶持 + 品牌实力强
          5 个子模块: 赛道好 / 市场现状 / 政策利好 / 全民意识 / 创维集团旗下
          ============================================================ */}
      <section className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle
              title={t(INVEST_PAGE.advantages.sectionTitleKey)}
              subtitle={t(INVEST_PAGE.advantages.sectionSubtitleKey)}
            />
          </Reveal>

          {/* 3.1 中国听力健康市场现状 - 2×2 卡片
                 白底无边框、卡片二略高、文字比例放大 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.marketStatus.titleKey)}
              desc={t(INVEST_PAGE.advantages.marketStatus.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 lg:grid-cols-2 gap-[16px] items-start">
              {/* [1] 核心数据 - 95% 未佩戴 (无标题) */}
              <div className="bg-white p-[20px] flex flex-col min-h-[160px] lg:min-h-[200px]">
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[44px] lg:text-[56px] font-bold text-brand-green leading-[44px] lg:leading-[56px]">
                      {t(INVEST_PAGE.advantages.marketStatus.statText.numKey)}
                    </span>
                    <span className="text-[15px] text-ink-700 font-bold leading-[24px]">
                      {t(INVEST_PAGE.advantages.marketStatus.statText.subKey)}
                    </span>
                  </div>
                  <p className="text-[14px] text-ink-500 leading-[22px] mt-1">
                    {t(INVEST_PAGE.advantages.marketStatus.statText.labelKey)}
                  </p>
                </div>
                <p className="text-[13px] text-ink-400 leading-[20px] pt-3 mt-auto border-t border-ink-200">
                  {t(INVEST_PAGE.advantages.marketStatus.footnoteKey)}
                </p>
              </div>

              {/* [2] 配图 - 略高于其他卡片 */}
              <div className="overflow-hidden bg-ink-100 h-[240px] lg:h-[300px]">
                <img
                  src={IMAGES[INVEST_PAGE.advantages.marketStatus.imageKey]}
                  alt={t(INVEST_PAGE.advantages.marketStatus.imageAltKey)}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* [3] 各国助听器佩戴率对比 (标题无绿线) */}
              <div className="bg-white p-[20px] flex flex-col min-h-[160px] lg:min-h-[200px]">
                <p className="text-[15px] font-bold text-brand-green leading-[22px] mb-3">
                  {t(INVEST_PAGE.advantages.marketStatus.countryRatesTitleKey)}
                </p>
                <div className="flex-1 flex flex-col justify-center gap-2">
                  {INVEST_PAGE.advantages.marketStatus.countryRates.map(
                    (c, idx) => {
                      const rateNum = parseInt(c.rate, 10);
                      const isChina = c.isChina;
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <span
                            className={`text-[14px] w-[88px] shrink-0 ${isChina ? "text-brand-green font-bold" : "text-ink-700"}`}
                          >
                            {t(c.countryKey)}
                          </span>
                          <div className="flex-1 h-[7px] bg-ink-200 relative">
                            <div
                              className={`absolute left-0 top-0 h-full ${isChina ? "bg-brand-green" : "bg-ink-400"}`}
                              style={{ width: `${rateNum * 2.5}%` }}
                            />
                          </div>
                          <span
                            className={`text-[14px] w-[42px] text-right ${isChina ? "text-brand-green font-bold" : "text-ink-700"}`}
                          >
                            {c.rate}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>

              {/* [4] 听障人数趋势柱状图 (无标题) - 移动端高度自适应避免遮挡 */}
              {(() => {
                const barData = INVEST_PAGE.advantages.marketStatus.barChart;
                const maxVal = Math.max(...barData.years.map((y) => y.total));
                const barAreaH = 80;
                const barW = 24;
                return (
                  <div className="bg-white p-[16px] lg:p-[20px] flex flex-col min-h-[200px] lg:h-[200px]">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center gap-[6px]">
                        <span className="inline-block w-[10px] h-[10px] bg-ink-400" />
                        <span className="text-[13px] text-ink-600 leading-[20px]">
                          {t(barData.legendTotalKey)}
                        </span>
                      </div>
                      <div className="flex items-center gap-[6px]">
                        <span className="inline-block w-[10px] h-[10px] bg-brand-green" />
                        <span className="text-[13px] text-ink-600 leading-[20px]">
                          {t(barData.legendModerateKey)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-end justify-center gap-[16px] lg:gap-[48px] overflow-x-auto">
                      {barData.years.map((y, idx) => {
                        const totalH = (y.total / maxVal) * barAreaH;
                        const moderateH = (y.moderate / maxVal) * barAreaH;
                        return (
                          <div
                            key={idx}
                            className="flex flex-col items-center justify-end shrink-0"
                            style={{ height: barAreaH + 24 }}
                          >
                            <div className="flex items-end gap-[6px]" style={{ height: barAreaH }}>
                              <div className="flex flex-col items-center justify-end" style={{ height: barAreaH }}>
                                <span className="text-[11px] text-ink-500 leading-[16px] mb-[2px]">
                                  {y.total}
                                </span>
                                <div
                                  className="bg-ink-400"
                                  style={{ width: barW, height: totalH }}
                                  title={t(barData.totalTooltipKey, { year: y.year, value: y.total })}
                                />
                              </div>
                              <div className="flex flex-col items-center justify-end" style={{ height: barAreaH }}>
                                <span className="text-[11px] text-brand-green font-bold leading-[16px] mb-[2px]">
                                  {y.moderate}
                                </span>
                                <div
                                  className="bg-brand-green"
                                  style={{ width: barW, height: moderateH }}
                                  title={t(barData.moderateTooltipKey, { year: y.year, value: y.moderate })}
                                />
                              </div>
                            </div>
                            <p className="text-[13px] text-ink-700 font-bold leading-[20px] mt-[6px]">
                              {y.year}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </Reveal>

          {/* 3.2 赛道好 - 双折线趋势图 (中国助听器需求量 vs 资金规模) */}
          <Reveal variant="scale" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.track.titleKey)}
              desc={t(INVEST_PAGE.advantages.track.descKey)}
            />
            {(() => {
              const lc = INVEST_PAGE.advantages.track.lineChart;
              /* SVG 坐标系: viewBox 0 0 800 440 */
              const padL = 70;
              const padR = 30;
              const padT = 30;
              const padB = 60;
              const plotW = 800 - padL - padR; // 700
              const plotH = 440 - padT - padB; // 350
              const yMax = 1000;
              const yMin = 0;
              const yTicks = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
              /* X 坐标: 6 个点均匀分布 */
              const xStep = plotW / (lc.years.length - 1);
              const xPos = (i: number) => padL + i * xStep;
              /* Y 坐标: value → Y */
              const yPos = (v: number) =>
                padT + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
              /* 抛物线路径: 从起点到终点, 单段二次贝塞尔 Q, 控制点在底部
                 开口向上的抛物线: 控制点 y 取起点和终点 y 的较高位置 (即更靠近 X 轴) */
              const parabolaPath = (vals: number[]) => {
                if (vals.length < 2) return "";
                const startX = xPos(0);
                const startY = yPos(vals[0]);
                const endX = xPos(vals.length - 1);
                const endY = yPos(vals[vals.length - 1]);
                /* 控制点 x 在中间, y 取起点/终点较高者 (更靠近 X 轴, y 更大)
                   这样曲线先平缓下降再陡峭上升, 形成开口向上的抛物线 */
                const ctrlX = (startX + endX) / 2;
                const ctrlY = Math.max(startY, endY) * 1.05; // 略低于较高点
                return `M ${startX},${startY} Q ${ctrlX},${ctrlY} ${endX},${endY}`;
              };
              const demandPath = parabolaPath(lc.demand.map((d) => d.value));
              const capitalPath = parabolaPath(lc.capital.map((d) => d.value));
              return (
                <div className="pl-[16px]">
                  <div className="bg-ink-50 p-[24px]">
                    {/* 标题 + 图例 */}
                    <div className="flex items-center justify-between mb-[16px] flex-wrap gap-[8px]">
                      <p className="text-[15px] text-ink-700 font-bold leading-[22px]">
                        {t(lc.titleKey)}
                      </p>
                      <div className="flex items-center gap-[16px]">
                        <div className="flex items-center gap-[6px]">
                          <span className="inline-block w-[14px] h-[3px] bg-orange-500" />
                          <span className="text-[12px] text-ink-600 leading-[18px]">
                            {t(lc.legendDemandKey)}
                          </span>
                        </div>
                        <div className="flex items-center gap-[6px]">
                          <span className="inline-block w-[14px] h-[3px] bg-brand-green" />
                          <span className="text-[12px] text-ink-600 leading-[18px]">
                            {t(lc.legendCapitalKey)}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* SVG 折线图 */}
                    <svg
                      viewBox="0 0 800 440"
                      className="w-full h-auto"
                      preserveAspectRatio="xMidYMid meet"
                    >
                      {/* 箭头 marker 定义 - 尖端沿 x 轴正方向, 配合 orient=auto 跟随切线方向 (抛物线末端切线朝右上) */}
                      <defs>
                        <marker
                          id="arrow-demand"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="8"
                          markerHeight="8"
                          orient="auto"
                        >
                          <path d="M0,0 L10,5 L0,10 z" fill="#f97316" />
                        </marker>
                        <marker
                          id="arrow-capital"
                          viewBox="0 0 10 10"
                          refX="9"
                          refY="5"
                          markerWidth="8"
                          markerHeight="8"
                          orient="auto"
                        >
                          <path d="M0,0 L10,5 L0,10 z" fill="#05a045" />
                        </marker>
                      </defs>
                      {/* 水平网格线 (每 100 一档, 虚线) */}
                      {yTicks.map((tick, idx) => (
                        <line
                          key={`grid-${idx}`}
                          x1={padL}
                          y1={yPos(tick)}
                          x2={800 - padR}
                          y2={yPos(tick)}
                          stroke="#e5e5e5"
                          strokeWidth={1}
                          strokeDasharray={tick === 0 ? "0" : "4 4"}
                        />
                      ))}
                      {/* Y 轴刻度标签 */}
                      {yTicks.map((tick, idx) => (
                        <text
                          key={`ylabel-${idx}`}
                          x={padL - 10}
                          y={yPos(tick) + 4}
                          textAnchor="end"
                          fontSize={11}
                          fill="#999"
                        >
                          {tick}
                        </text>
                      ))}
                      {/* X 轴刻度标签 (年份) */}
                      {lc.years.map((year, idx) => (
                        <text
                          key={`xlabel-${idx}`}
                          x={xPos(idx)}
                          y={440 - padB + 24}
                          textAnchor="middle"
                          fontSize={12}
                          fontWeight={600}
                          fill="#555"
                        >
                          {year}
                        </text>
                      ))}
                      {/* 橙色抛物线 - 中国助听器需求量 (末端箭头朝上) */}
                      <path
                        d={demandPath}
                        fill="none"
                        stroke="#f97316"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        markerEnd="url(#arrow-demand)"
                      />
                      {/* 绿色抛物线 - 资金规模 (末端箭头朝上) */}
                      <path
                        d={capitalPath}
                        fill="none"
                        stroke="#05a045"
                        strokeWidth={2.5}
                        strokeLinecap="round"
                        markerEnd="url(#arrow-capital)"
                      />
                      {/* 坐标轴 */}
                      <line
                        x1={padL}
                        y1={padT}
                        x2={padL}
                        y2={padT + plotH}
                        stroke="#999"
                        strokeWidth={1}
                      />
                      <line
                        x1={padL}
                        y1={padT + plotH}
                        x2={800 - padR}
                        y2={padT + plotH}
                        stroke="#999"
                        strokeWidth={1}
                      />
                    </svg>
                    {/* Y 轴单位标注 */}
                    <p className="text-[11px] text-ink-400 leading-[16px] text-right mt-[4px]">
                      {t("invest:advantages.track.lineChart.unitLabel")}：{t(lc.yAxisUnitKey)}
                    </p>
                  </div>
                </div>
              );
            })()}
          </Reveal>

          {/* 3.3 政策利好 - 4 项政策单行排列 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.policy.titleKey)}
              desc={t(INVEST_PAGE.advantages.policy.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-2 lg:grid-cols-4 gap-[16px]">
              {INVEST_PAGE.advantages.policy.items.map((item, idx) => (
                <div
                  key={idx}
                  className="group bg-ink-50 p-[20px] flex flex-col transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:bg-brand-green/5 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                >
                  <span className="inline-flex items-center justify-center w-[32px] h-[32px] bg-brand-green text-white text-[14px] font-bold mb-[12px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <p className="text-[15px] text-ink-700 font-bold leading-[22px] mb-[8px] transition-colors duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:text-brand-green">
                    {t(item.titleKey)}
                  </p>
                  <p className="text-[12px] text-ink-500 leading-[20px]">
                    {t(item.descKey)}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>

          {/* 3.4 全民听力健康意识提升 - 3 项数据 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.awareness.titleKey)}
              desc={t(INVEST_PAGE.advantages.awareness.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
              {INVEST_PAGE.advantages.awareness.stats.map((stat, idx) => (
                <div
                  key={idx}
                  className="group border-t-[3px] border-brand-green bg-white p-6 text-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                  style={{ minHeight: "140px" }}
                >
                  <p className="text-[28px] lg:text-[36px] font-bold text-brand-green leading-[32px] lg:leading-[40px] mb-2 transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110 inline-block">
                    {t(stat.numKey)}
                  </p>
                  <p className="text-[14px] text-ink-700 font-bold leading-[22px] mb-1">
                    {t(stat.labelKey)}
                  </p>
                  {stat.subKey && t(stat.subKey) && (
                    <p className="text-[12px] text-ink-400 leading-[18px]">
                      {t(stat.subKey)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Reveal>

          {/* 3.5 著名上市创维集团旗下 - 居中大标题 + 副标 (参考 §3 板块标题样式) */}
          <Reveal className="mb-[20px]">
            <SectionTitle
              title={t(INVEST_PAGE.advantages.brand.titleKey)}
              subtitle={t(INVEST_PAGE.advantages.brand.subtitleKey)}
            />
          </Reveal>

          {/* 3.5.1 全线覆盖各程度 入门高端皆齐备 - hero 同款轮播图 (无换页按钮/无说明文本)
                 fullBleed=false: 轮播图功能复用, 但保持在 1200px container-page 宽度内, 不撑满视口
                 images 不传: 使用 ProductCarouselHero 默认的 4 张 hero_xiaowe banner 图 (与 /product 顶部 hero 一致)
                 mobileObjectFit="contain": 移动端完整显示不裁剪; mb 移动端 24px 与相邻标题间距统一 (2026-08-15) */}
          <Reveal variant="scale" className="mb-[20px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.brand.productCoverage.titleKey)}
            />
          </Reveal>
          {/* 轮播图容器: 外层 div 承担 mb (container-page 的 unlayered margin:0 auto 会覆盖 margin class, 2026-08-15) */}
          <div className="mb-[24px] lg:mb-[60px]">
            <div className="container-page">
              <ProductCarouselHero
                height={400}
                interval={5000}
                fullBleed={false}
                mobileObjectFit="contain"
              />
            </div>
          </div>

          {/* 3.5.2 自有研发团队 自有生产工厂 (副标样式)
              mb 移动端 24px 与相邻标题间距统一 (2026-08-15) */}
          <Reveal variant="scale-up" className="mb-[24px] lg:mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.brand.rdFactory.titleKey)}
            />
            <div className="pl-[16px]">
              {/* 主图 - 无边框 */}
              <div className="bg-ink-100 mb-[24px] h-[240px] lg:h-[320px]">
                <img
                  src={IMAGES[INVEST_PAGE.advantages.brand.rdFactory.mainImageKey]}
                  alt={t(INVEST_PAGE.advantages.brand.rdFactory.mainImageAltKey)}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* 3 个数据卡 - 文字覆盖图片 + 黑色遮罩 + 文本居中 + 数据突出
                  移动端单列, 桌面 3 列 — 2026-08-15 修复移动端卡片挤压 (原 grid-cols-3 在手机上每张仅 ~95px) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] lg:gap-[20px]">
                {INVEST_PAGE.advantages.brand.rdFactory.stats.map((stat, idx) => (
                  <div
                    key={idx}
                    className="relative overflow-hidden h-[280px] lg:h-[320px] group"
                  >
                    {/* 背景图 */}
                    <img
                      src={IMAGES[stat.imageKey]}
                      alt={t(stat.labelKey)}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    {/* 黑色渐变遮罩 - 底部更深, 突出文字 */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/30 transition-colors duration-300 group-hover:from-black/90" />
                    {/* 文字覆盖层 - 居中对齐 */}
                    <div className="absolute inset-0 p-5 flex flex-col justify-end items-center text-center text-white">
                      {/* 重要数据 - 大字号 + 品牌绿强调 */}
                      <div className="flex items-baseline gap-1 mb-2 justify-center">
                        <span className="text-[40px] lg:text-[52px] font-bold leading-[44px] lg:leading-[56px] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110">
                          {stat.number}
                        </span>
                        <span className="text-[16px] lg:text-[20px] text-brand-green-light font-bold leading-[22px] lg:leading-[28px]">
                          {t(stat.unitKey)}
                        </span>
                      </div>
                      <p className="text-[15px] lg:text-[17px] text-white font-bold leading-[22px] lg:leading-[24px] mb-1">
                        {t(stat.labelKey)}
                      </p>
                      <p className="text-[12px] lg:text-[13px] text-white/80 leading-[18px] lg:leading-[20px]">
                        {t(stat.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* 3.5.3 医疗资质齐全 官网真实可查 (副标样式)
                 新设计: 5 张证书合并为一条横向长图, 统一容器 + 顶部品牌绿条 + 浅阴影
                 桌面端: 5 张证书横向排列拼接成一条长图 (横版证书居中放置, 宽度更大)
                 移动端: 横向滚动查看 */}
          <Reveal variant="scale-up">
            <SubSectionTitle
              title={t(INVEST_PAGE.advantages.brand.qualifications.titleKey)}
            />
            <div className="pl-[16px]">
              {/* 5 张证书展示台 - 立体阴影质感设计
                  浅灰背景衬托 + 白底展示台容器 + 多层立体阴影 (底部更深模拟从下方打光)
                  桌面端: grid 5 列按比例 1:1:1.7:1:1 自动分配, 第 3 张横版占 1.7 比例
                  移动端: grid 2 列, 横版证书 (第 3 张) 跨 2 列, 自动换行
                  分隔线: 移动端按 2 列布局 (行1: 0|1, 行2: 2, 行3: 3|4), 桌面端按 5 列布局 */}
              <div className="bg-ink-100 py-[24px] lg:py-[40px] mb-[40px]">
                <div className="bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.25),0_10px_20px_-5px_rgba(0,0,0,0.08),0_4px_8px_rgba(0,0,0,0.04)]">
                  <div className="grid grid-cols-2 lg:grid-cols-[1fr_1fr_1.7fr_1fr_1fr]">
                    {INVEST_PAGE.advantages.brand.qualifications.portrait.map(
                      (item, idx) => {
                        const isLandscape = idx === 2; // 第 3 张为横版
                        // 移动端分隔线: idx 0/1/2 底分隔, idx 0/3 右分隔; 桌面端: idx 0-3 右分隔
                        const mobileBorder = [
                          "border-r border-b border-ink-100",
                          "border-b border-ink-100",
                          "border-b border-ink-100",
                          "border-r border-ink-100",
                          "",
                        ][idx];
                        return (
                          <div
                            key={idx}
                            className={`group relative flex items-center justify-center h-[180px] lg:h-[260px] p-[16px] lg:p-0 ${mobileBorder} ${
                              idx < 4 ? "lg:border-r lg:border-ink-100" : ""
                            } ${isLandscape ? "col-span-2 lg:col-span-1" : ""}`}
                          >
                            <img
                              src={IMAGES[item.imageKey]}
                              alt={t(item.nameKey)}
                              className={`max-w-[88%] max-h-[88%] object-contain transition-transform duration-[500ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-[1.05] ${isLandscape ? "w-full lg:w-auto" : ""}`}
                            />
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>

              {/* 专利矩阵图 - 与医疗资质合一, 无独立标题 */}
              <div>
                <img
                  src={
                    IMAGES[
                      INVEST_PAGE.advantages.brand.qualifications.patents
                        .imageKey
                    ]
                  }
                  alt={t(INVEST_PAGE.advantages.brand.qualifications.patents.titleKey)}
                  className="w-full object-contain"
                />
                <p className="text-[12px] text-ink-400 leading-[18px] mt-[8px]">
                  {t(INVEST_PAGE.advantages.brand.qualifications.patents.imageNoteKey)}
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          4. 合作政策 — 兜底式全面扶持
          4 个子模块: 开店全流程 / 专家全程带教 / 全域营销赋能 / 总部代运营兜底
          ============================================================ */}
      <section id="policy" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <Reveal>
            <SectionTitle
              title={t(INVEST_PAGE.policy.sectionTitleKey)}
              subtitle={t(INVEST_PAGE.policy.sectionSubtitleKey)}
            />
          </Reveal>

          {/* 4.1 开店全流程服务 - 2×2 布局
                 第一行: 直营店面积 | 联营店面积
                 第二行: 门店形象设计图 | 联营店平面布局图 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.policy.storeOpen.titleKey)}
              desc={t(INVEST_PAGE.policy.storeOpen.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
              {/* 第一行: 2 种店型面积卡 (门店类型 + 面积同行) - 高度减小 */}
              {INVEST_PAGE.policy.storeOpen.storeTypes.map((store, idx) => (
                <div
                  key={idx}
                  className="group bg-brand-green/5 p-[20px] lg:p-[24px] flex flex-col justify-center transition-all duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-[4px] hover:bg-brand-green/10 hover:shadow-[0_10px_24px_rgba(5,160,69,0.10)]"
                  style={{ minHeight: "100px" }}
                >
                  <p className="text-[20px] lg:text-[24px] font-bold text-brand-green leading-[26px] lg:leading-[32px] transition-transform duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-105">
                    {t(store.typeKey)}
                    <span className="text-[13px] lg:text-[15px] text-ink-700 font-bold ml-[12px]">
                      {t(INVEST_PAGE.policy.storeOpen.areaLabelKey)} {store.area}
                    </span>
                  </p>
                </div>
              ))}
              {/* 第二行: 2 张配图 - 高度增大 */}
              <div className="overflow-hidden bg-ink-100 group h-[300px] lg:h-[380px]">
                <img
                  src={IMAGES[INVEST_PAGE.policy.storeOpen.imageKey]}
                  alt={t(INVEST_PAGE.policy.storeOpen.imageAltKey)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="overflow-hidden bg-ink-100 group flex items-center justify-center h-[300px] lg:h-[380px]">
                <img
                  src={IMAGES[INVEST_PAGE.policy.storeOpen.floorplanKey]}
                  alt={t(INVEST_PAGE.policy.storeOpen.floorplanAltKey)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
            </div>
          </Reveal>

          {/* 4.2 专家全程带教 - 描述 + 横向长图 (高端商务/摄影奖风格) */}
          <Reveal variant="scale" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.policy.expertGuidance.titleKey)}
              desc={t(INVEST_PAGE.policy.expertGuidance.descKey)}
            />
            <div className="pl-[16px] overflow-hidden bg-ink-100 group">
              <img
                src={IMAGES[INVEST_PAGE.policy.expertGuidance.imageKey]}
                alt={t(INVEST_PAGE.policy.expertGuidance.imageAltKey)}
                className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02] max-h-[336px] lg:max-h-[420px]"
              />
            </div>
          </Reveal>

          {/* 4.3 全域营销赋能 - 2×2 铺满 4 张真实截图
                 无容器, 统一 16:10 比例, 白色 gap 间隔 */}
          <Reveal variant="scale-up" className="mb-[60px]">
            <SubSectionTitle
              title={t(INVEST_PAGE.policy.marketing.titleKey)}
              desc={t(INVEST_PAGE.policy.marketing.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 sm:grid-cols-2 gap-[16px]">
              {INVEST_PAGE.policy.marketing.images.map((img, idx) => (
                <img
                  key={idx}
                  src={IMAGES[img.key]}
                  alt={t(img.altKey)}
                  className="w-full aspect-[16/10] object-contain transition-transform duration-500 hover:scale-[1.04] relative z-0 hover:z-10"
                />
              ))}
            </div>
          </Reveal>

          {/* 4.4 总部代运营兜底 - 一行 2 张真实截图
                 统一 2:1 比例, object-contain 完整显示, 浅灰底填充留白 */}
          <Reveal variant="scale-up">
            <SubSectionTitle
              title={t(INVEST_PAGE.policy.operations.titleKey)}
              desc={t(INVEST_PAGE.policy.operations.descKey)}
            />
            <div className="pl-[16px] grid grid-cols-1 lg:grid-cols-2 gap-[20px]">
              {INVEST_PAGE.policy.operations.images.map((img, idx) => (
                <div
                  key={idx}
                  className="overflow-hidden bg-ink-100 flex items-center justify-center aspect-[2/1] group"
                >
                  <img
                    src={IMAGES[img.key]}
                    alt={t(img.altKey)}
                    className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============================================================
          6. 联系我们 CTA - 左右分栏: 深绿情感区 + 白色信息区
          左侧深绿背景: 大标题 + 副标 + CTA 按钮 (情感召唤)
          右侧白色卡片: 三栏联系信息 (电话/地址/邮箱) 垂直堆叠
          整体白底, 与下方深绿 Footer 区分
          ============================================================ */}
      <section id="contact" className="bg-white">
        <div className="container-page py-[40px] lg:py-[60px]">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-0 overflow-hidden" style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
            {/* 左侧: 深绿情感区 */}
            <div className="bg-brand-green p-[28px] lg:p-[48px] text-white flex flex-col justify-center">
              <p className="text-[13px] text-white/70 leading-[18px] mb-[12px] tracking-[2px]">
                {t("invest:contact.badge")}
              </p>
              <h2 className="text-[26px] lg:text-[32px] font-bold leading-[36px] lg:leading-[44px] mb-[14px] font-display">
                {t("invest:contact.title1")}
                <br />
                {t("invest:contact.title2")}
              </h2>
              <p className="text-[14px] text-white/85 leading-[24px] mb-[32px] max-w-[380px]">
                {t("invest:contact.desc")}
              </p>
              <div className="flex items-center gap-[14px]">
                <a
                  href={SITE_INFO.onlineConsultUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-[8px] bg-white text-brand-green text-[14px] lg:text-[15px] font-bold px-[28px] py-[13px] hover:bg-ink-100 transition-colors duration-200"
                >
                  {t("invest:contact.consultBtn")}
                  <span aria-hidden>→</span>
                </a>
                <a
                  href="#top"
                  className="inline-flex items-center text-white text-[14px] font-bold px-[20px] py-[13px] border border-white/40 hover:bg-white/10 transition-colors duration-200"
                >
                  {t("invest:contact.backToTopBtn")}
                </a>
              </div>
            </div>
            {/* 右侧: 白色信息区, 三栏联系信息垂直堆叠 */}
            <div className="bg-white p-[24px] lg:p-[36px] flex flex-col justify-center">
              {/* 服务热线 */}
              <a
                href={`tel:${t("invest:contact.hotlineValue")}`}
                className="flex items-center gap-[16px] py-[16px] border-b border-ink-100 hover:bg-brand-green/5 transition-colors group"
              >
                <div className="w-[40px] h-[40px] bg-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green group-hover:text-white transition-colors">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ink-400 leading-[16px] mb-[2px]">
                    {t("invest:contact.hotlineLabel")}
                  </p>
                  <p className="text-[17px] lg:text-[20px] font-bold text-brand-green leading-[24px] lg:leading-[26px]">
                    {t("invest:contact.hotlineValue")}
                  </p>
                </div>
              </a>
              {/* 招商营销中心专线 - 2026-07-25 补充 (来自 docx 招商内容) */}
              <a
                href={`tel:${t("invest:contact.investPhoneValue")}`}
                className="flex items-center gap-[16px] py-[16px] border-b border-ink-100 hover:bg-brand-green/5 transition-colors group"
              >
                <div className="w-[40px] h-[40px] bg-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green group-hover:text-white transition-colors">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ink-400 leading-[16px] mb-[2px]">
                    {t("invest:contact.investPhoneLabel")}
                  </p>
                  <p className="text-[17px] lg:text-[20px] font-bold text-brand-green leading-[24px] lg:leading-[26px]">
                    {t("invest:contact.investPhoneValue")}
                  </p>
                </div>
              </a>
              {/* 公司地址 */}
              <div className="flex items-center gap-[16px] py-[16px] border-b border-ink-100">
                <div className="w-[40px] h-[40px] bg-brand-green/10 flex items-center justify-center shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green">
                    <path d="M12 21s-7-7.5-7-12a7 7 0 1114 0c0 4.5-7 12-7 12z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ink-400 leading-[16px] mb-[2px]">
                    {t("invest:contact.addressLabel")}
                  </p>
                  <p className="text-[14px] text-ink-700 leading-[20px]">
                    {t("invest:contact.addressValue")}
                  </p>
                </div>
              </div>
              {/* 公司邮箱 */}
              <a
                href={`mailto:${t("invest:contact.emailValue")}`}
                className="flex items-center gap-[16px] py-[16px] hover:bg-brand-green/5 transition-colors group"
              >
                <div className="w-[40px] h-[40px] bg-brand-green/10 flex items-center justify-center shrink-0 group-hover:bg-brand-green transition-colors">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-green group-hover:text-white transition-colors">
                    <rect x="3" y="5" width="18" height="14" />
                    <path d="M3 7l9 6 9-6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-[11px] text-ink-400 leading-[16px] mb-[2px]">
                    {t("invest:contact.emailLabel")}
                  </p>
                  <p className="text-[14px] lg:text-[16px] font-bold text-brand-green leading-[20px] lg:leading-[22px] break-all">
                    {t("invest:contact.emailValue")}
                  </p>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          7. FAQ 模块 (GEO 核心, 4 条招商高频问答 + FAQPage JSON-LD)
          ============================================================ */}
      <FaqSection scope="invest" />

    </>
  );
}

export default InvestPage;

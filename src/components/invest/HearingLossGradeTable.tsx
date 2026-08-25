/**
 * HearingLossGradeTable - 听力损失分级对照表
 *
 * 复刻来源: 招商加盟页 §6.3 高可干预 模块配图
 *   原图: public/images/invest/hearing_loss_grade_table.webp
 *
 * 设计还原:
 *   - 4 列表格: 分级 / 听力阈值(分贝) / 噪声下体验 / 解决方案
 *   - 整体背景: 绿→白 由下至上线性渐变 (#c8e6c0 → #ffffff)
 *   - 表格分割线: 全部使用绿色 (brand-green-light #52b548)
 *   - 顶部绿色表头 (#05a045 白字)
 *   - 左侧大类标签 (跨行合并, 竖排):
 *       难以察觉 (灰底) - 含 正常听力 + 轻度下降 2 行
 *       生活已受影响 (绿色实底 白字) - 含 中度及以下 5 行
 *   - 解决方案列内承载 4 个产品方块 (用 rowSpan 跨行, 非浮层):
 *       辅听产品 PSAPs - 虚线边框, 锚定 轻度下降 行 (1 行)
 *       OTC 助听器 - 实线边框, 锚定 中度下降 行 (1 行)
 *       医疗级助听器 - 绿色加粗边框 + 绿色"核心用户"气泡,
 *                      跨 中重度+重度+极重度+完全听力丧失 4 行
 *       人工耳蜗 - 实线边框, 嵌入医疗级方块右下角 (完全听力丧失行)
 *
 * i18n 改造 (2026-07-26):
 *   - 所有可见文案 (表头/分级名/阈值/体验/产品方块标题+条目+价格/核心用户气泡/脚注)
 *     通过 useTranslation("invest") 取自 invest:prospect.highIntervention.table.*
 *   - 数据结构 (行顺序、跨行合并、解决方案类型) 仍由 GRADE_ROWS 静态定义,
 *     保证表格布局与原设计一致
 */

import { useTranslation } from "react-i18next";
import Reveal from "../ui/Reveal";

/* 表格行数据 - 仅保留布局结构, 文案从 i18n 取
 * category 字段用于左侧大类标签的合并 (imperceptible / affected)
 * solutionCell 字段用于控制解决方案列的渲染类型与 rowSpan */
type GradeRow = {
  /** i18n key 前缀: invest:prospect.highIntervention.table.rows.{idx} */
  i18nPrefix: string;
  category: "imperceptible" | "affected";
  /** 本行解决方案列应该渲染什么 (用于 rowSpan 控制) */
  solutionCell:
    | { type: "dash" } // 显示 "-"
    | { type: "psap" }
    | { type: "otc" }
    | { type: "medical"; rowSpan: 3 } // 医疗级跨 3 行 (中重度/重度/极重度)
    | { type: "cochlear" } // 人工耳蜗 (独立方块, 完全听力丧失行)
    | { type: "spanned" }; // 本行被上方 rowSpan 占用, 不渲染 td
};

const GRADE_ROWS: GradeRow[] = [
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.0",
    category: "imperceptible", // 恢复: 正常听力也属于"难以察觉"
    solutionCell: { type: "dash" },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.1",
    category: "imperceptible",
    solutionCell: { type: "psap" },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.2",
    category: "affected",
    solutionCell: { type: "otc" },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.3",
    category: "affected",
    solutionCell: { type: "medical", rowSpan: 3 },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.4",
    category: "affected",
    solutionCell: { type: "spanned" },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.5",
    category: "affected",
    solutionCell: { type: "spanned" },
  },
  {
    i18nPrefix: "invest:prospect.highIntervention.table.rows.6",
    category: "affected",
    solutionCell: { type: "cochlear" },
  },
];

/* 表头基础 key (用于 i18nPrefix 拼接) */
const TABLE_KEY = "invest:prospect.highIntervention.table";

/* PSAP 方块 (虚线边框) */
function PsapBlock() {
  const { t } = useTranslation("invest");
  const blockKey = `${TABLE_KEY}.blocks.psap`;
  const items = t(`${blockKey}.items`, { returnObjects: true }) as string[];
  return (
    <div className="border border-dashed border-ink-400 bg-white p-2.5 h-full">
      <p className="text-[13px] font-bold text-[#333333] leading-[18px] mb-1">
        {t(`${blockKey}.title`)}
      </p>
      <ul className="space-y-[1px]">
        {items.map((item, idx) => (
          <li key={idx} className="text-[10px] text-[#666666] leading-[14px] flex items-start gap-1">
            <span className="shrink-0 mt-[4px] inline-block w-[3px] h-[3px] bg-[#999]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] font-bold text-brand-green mt-1.5">
        {t(`${blockKey}.price`)}
      </p>
    </div>
  );
}

/* OTC 方块 (实线边框) */
function OtcBlock() {
  const { t } = useTranslation("invest");
  const blockKey = `${TABLE_KEY}.blocks.otc`;
  const items = t(`${blockKey}.items`, { returnObjects: true }) as string[];
  return (
    <div className="border border-[#bbb] bg-white p-2.5 h-full">
      <p className="text-[13px] font-bold text-[#333333] leading-[18px] mb-1">
        {t(`${blockKey}.title`)}
      </p>
      <ul className="space-y-[1px]">
        {items.map((item, idx) => (
          <li key={idx} className="text-[10px] text-[#666666] leading-[14px] flex items-start gap-1">
            <span className="shrink-0 mt-[4px] inline-block w-[3px] h-[3px] bg-[#999]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] font-bold text-brand-green mt-1.5">
        {t(`${blockKey}.price`)}
      </p>
    </div>
  );
}

/* 医疗级方块 (绿色加粗边框 + 核心用户气泡) */
function MedicalBlock() {
  const { t } = useTranslation("invest");
  const blockKey = `${TABLE_KEY}.blocks.medical`;
  const items = t(`${blockKey}.items`, { returnObjects: true }) as string[];
  return (
    <div className="relative h-full">
      <div className="border-2 border-brand-green bg-white p-2.5 h-full flex flex-col">
        <p className="text-[13px] font-bold text-brand-green leading-[18px] mb-1">
          {t(`${blockKey}.title`)}
        </p>
        <ul className="space-y-[1px] flex-1">
          {items.map((item, idx) => (
            <li key={idx} className="text-[10px] text-[#666666] leading-[14px] flex items-start gap-1">
              <span className="shrink-0 mt-[4px] inline-block w-[3px] h-[3px] bg-[#999]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="text-[10px] font-bold text-brand-green mt-1.5">
          {t(`${blockKey}.price`)}
        </p>
      </div>

      {/* 核心用户 气泡 - 浮在方块右上角外侧 */}
      <div
        className="absolute z-10 bg-brand-green text-white px-3 py-1.5 text-center"
        style={{ top: "-32px", right: "10px" }}
      >
        <p className="text-[12px] font-bold leading-[14px]">
          {t(`${blockKey}.badgeTitle`)}
        </p>
        <p className="text-[9px] font-normal mt-[2px] leading-[12px]">
          {t(`${blockKey}.badgeDesc`)}
        </p>
        {/* 三角下指 */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: "-8px",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid #05a045",
          }}
        />
      </div>
    </div>
  );
}

/* 人工耳蜗方块 (实线边框, 独立) */
function CochlearBlock() {
  const { t } = useTranslation("invest");
  const blockKey = `${TABLE_KEY}.blocks.cochlear`;
  const items = t(`${blockKey}.items`, { returnObjects: true }) as string[];
  return (
    <div className="border border-[#bbb] bg-white p-2.5 h-full">
      <p className="text-[13px] font-bold text-[#333333] leading-[18px] mb-1">
        {t(`${blockKey}.title`)}
      </p>
      <ul className="space-y-[1px]">
        {items.map((item, idx) => (
          <li key={idx} className="text-[10px] text-[#666666] leading-[14px] flex items-start gap-1">
            <span className="shrink-0 mt-[4px] inline-block w-[3px] h-[3px] bg-[#999]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] font-bold text-brand-green mt-1.5">
        {t(`${blockKey}.price`)}
      </p>
    </div>
  );
}

function HearingLossGradeTable() {
  const { t } = useTranslation("invest");
  return (
    <Reveal>
      {/* 整体容器: 绿→白 由下至上渐变背景 + 绿框 */}
      <div
        className="relative border border-brand-green-light"
        style={{
          background:
            "linear-gradient(to top, #c8e6c0 0%, #d6ecd0 30%, #ecf6e8 55%, #ffffff 100%)",
        }}
      >
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: "50px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "120px" }} />
            <col style={{ width: "240px" }} />
          </colgroup>
          <thead>
            <tr>
              {/* 第一列表头: 空开 (与正文第一列对应) */}
              <th className="bg-brand-green border-r border-brand-green-light" />
              <th className="bg-brand-green text-white py-2 text-[13px] font-bold border-r border-brand-green-light">
                {t(`${TABLE_KEY}.headers.grade`)}
              </th>
              <th className="bg-brand-green text-white py-2 text-[13px] font-bold border-r border-brand-green-light">
                {t(`${TABLE_KEY}.headers.dbRange`)}
              </th>
              <th className="bg-brand-green text-white py-2 text-[13px] font-bold border-r border-brand-green-light">
                {t(`${TABLE_KEY}.headers.experience`)}
              </th>
              <th className="bg-brand-green text-white py-2 text-[13px] font-bold">
                {t(`${TABLE_KEY}.headers.solution`)}
              </th>
            </tr>
          </thead>
          <tbody>
            {GRADE_ROWS.map((row, idx) => {
              const isFirstInCategory =
                idx === 0 || GRADE_ROWS[idx - 1].category !== row.category;
              const categoryLabel = t(`${TABLE_KEY}.categories.${row.category}`);

              return (
                <tr key={idx} className="transition-colors duration-150 hover:bg-brand-green/15">
                  {/* 左侧大类标签 (跨行合并) */}
                  {isFirstInCategory ? (
                    <td
                      rowSpan={
                        GRADE_ROWS.filter((r) => r.category === row.category)
                          .length
                      }
                      className={`border-r border-brand-green-light border-t border-brand-green-light align-middle text-center ${
                        row.category === "imperceptible"
                          ? "bg-ink-200"
                          : "bg-brand-green text-white"
                      }`}
                    >
                      <span
                        className="inline-block text-[12px] font-bold leading-[16px] whitespace-nowrap"
                        style={{
                          writingMode: "vertical-rl",
                          letterSpacing: "1px",
                          padding: "12px 0",
                        }}
                      >
                        {categoryLabel}
                      </span>
                    </td>
                  ) : null}

                  {/* 分级 */}
                  <td className="border-r border-brand-green-light border-t border-brand-green-light px-3 py-3 text-center text-[13px] text-[#333333] font-bold align-middle">
                    {t(`${row.i18nPrefix}.grade`)}
                  </td>
                  {/* 听力阈值 */}
                  <td className="border-r border-brand-green-light border-t border-brand-green-light px-3 py-3 text-center text-[13px] text-[#333333] italic align-middle">
                    {t(`${row.i18nPrefix}.dbRange`)}
                  </td>
                  {/* 噪声下体验 */}
                  <td className="border-r border-brand-green-light border-t border-brand-green-light px-3 py-3 text-center text-[13px] text-[#4b4b4b] align-middle">
                    {t(`${row.i18nPrefix}.experience`)}
                  </td>

                  {/* 解决方案列 - 根据 solutionCell 类型渲染 */}
                  {row.solutionCell.type === "dash" && (
                    <td className="border-t border-brand-green-light px-2 py-3 align-middle text-center text-[12px] text-[#999]">
                      -
                    </td>
                  )}
                  {row.solutionCell.type === "psap" && (
                    <td className="border-t border-brand-green-light px-2 py-2 align-middle">
                      <PsapBlock />
                    </td>
                  )}
                  {row.solutionCell.type === "otc" && (
                    <td className="border-t border-brand-green-light px-2 py-2 align-middle">
                      <OtcBlock />
                    </td>
                  )}
                  {row.solutionCell.type === "medical" && (
                    <td
                      rowSpan={row.solutionCell.rowSpan}
                      className="border-t border-brand-green-light px-2 py-2 align-middle"
                      style={{ verticalAlign: "stretch" }}
                    >
                      <MedicalBlock />
                    </td>
                  )}
                  {row.solutionCell.type === "cochlear" && (
                    <td className="border-t border-brand-green-light px-2 py-2 align-middle">
                      <CochlearBlock />
                    </td>
                  )}
                  {/* spanned: 不渲染 td (被上方 rowSpan 占用) */}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 脚注 */}
      <p className="text-[11px] text-[#999999] leading-[16px] mt-2">
        {t(`${TABLE_KEY}.footnote`)}
      </p>
    </Reveal>
  );
}

export default HearingLossGradeTable;

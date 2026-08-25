/* ============================================================
   SubSectionTitle — 全站通用子模块标题组件

   设计规范 (采用 ProductPage 标准, 统一全站):
     - 左侧绿色短竖条: w-[4px] h-[28px] bg-brand-green
     - 标题: 22px ink-700 (#333) 700 leading-[28px]
     - 可选描述: 14px ink-500 leading-[22px]
     - 容器: flex items-start gap-[16px]
     - 默认 mb-6 (24px), 可通过 className 覆盖

   用法:
     <SubSectionTitle title="国家专利认证" />                       // 默认 mb-6
     <SubSectionTitle title="临床医疗认证" desc="..." className="mb-[50px]" />

   注: 不内部包 Reveal, 调用方按需在外层包 <Reveal> 实现入场动画
   ============================================================ */

type SubSectionTitleProps = {
  title: string;
  desc?: string;
  /** 透传给根元素 (默认 "mb-6", 可覆盖) */
  className?: string;
};

export function SubSectionTitle({
  title,
  desc,
  className = "mb-6",
}: SubSectionTitleProps) {
  return (
    <div className={`flex items-start gap-[12px] lg:gap-[16px] ${className}`}>
      <span className="inline-block w-[4px] h-[24px] lg:h-[28px] bg-brand-green shrink-0 mt-[2px]" />
      <div className="flex-1 min-w-0">
        <h3 className="text-[18px] sm:text-[20px] lg:text-[22px] text-ink-700 font-bold leading-[26px] lg:leading-[28px] text-left">
          {title}
        </h3>
        {desc && (
          <p className="text-[13px] lg:text-[14px] text-ink-500 leading-[20px] lg:leading-[22px] mt-[6px] text-left">
            {desc}
          </p>
        )}
      </div>
    </div>
  );
}

export default SubSectionTitle;

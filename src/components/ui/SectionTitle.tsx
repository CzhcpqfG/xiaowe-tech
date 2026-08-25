/* ============================================================
   SectionTitle + TitleUnderline — 全站通用 section 标题组件
   规范来源: AboutPage (关于小维) 的标题规范

   设计规范:
     - 标题: 30px #333 (ink-700) 700 leading-[45px]
     - 短横线: w-[60px] h-[3px] bg-brand-green (品牌绿)
     - 居中布局 (与关于小维一致)
     - 无副标 (副标已统一去除, 保持视觉简洁)

    用法:
     <SectionTitle title="核心技术" />
     <SectionTitle title="企业简介" as="h1" />  // SEO: 页面主标题
     <TitleUnderline />
     <div>内容...</div>

    注: TitleUnderline 内置 mb-[40px], 与关于小维一致
    as 仅改变标签语义 (h1/h2), 视觉样式完全一致
   ============================================================ */

export function SectionTitle({
  title,
  center = true,
  as = "h2",
}: {
  title: string;
  center?: boolean;
  as?: "h1" | "h2";
}) {
  const Tag = as;
  return (
    <div className={center ? "text-center" : ""}>
      <Tag className="text-[22px] sm:text-[26px] lg:text-[30px] font-bold text-ink-700 leading-[33px] sm:leading-[39px] lg:leading-[45px]">
        {title}
      </Tag>
    </div>
  );
}

export function TitleUnderline({ center = true }: { center?: boolean }) {
  return (
    <div
      className={`flex ${center ? "justify-center" : ""} mt-[12px] lg:mt-[16px] mb-[28px] lg:mb-[40px]`}
    >
      <span className="block w-[50px] lg:w-[60px] h-[3px] bg-brand-green" />
    </div>
  );
}

export default SectionTitle;

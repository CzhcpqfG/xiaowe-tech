/**
 * JsonLd - 结构化数据注入组件
 *
 * 用法:
 *   <JsonLd data={organizationSchema} />
 *   <JsonLd data={[schema1, schema2]} />
 *
 * 实现: 通过 react-helmet-async 注入 <script type="application/ld+json">
 *
 * Stage SEO/GEO B: JSON-LD 结构化数据
 */
import { Helmet } from "react-helmet-async";

interface JsonLdProps {
  /** JSON-LD 数据对象或数组 */
  data: object | object[];
}

export default function JsonLd({ data }: JsonLdProps) {
  const json = Array.isArray(data) ? data : [data];
  return (
    <Helmet>
      {json.map((item, idx) => (
        <script key={idx} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}

# 新闻迁移工具 (news-migrate)

从旧站 https://www.xiaowe.cc/h-col-104.html 全量迁移新闻到新站。

## 流程

```
1. 抓取详情页   → news-html/{id}.html          (断点续传, 可中断)
2. 解析正文     → articles-data.json
3. 下载图片     → ../public/images/news/{id}/   + images-map.json
4. 生成数据     → ../src/data/articles.ts, images/news.ts, i18n news.json
5. 生成 home    → ../src/data/home.ts (NEWS_LIST / NEWS_CATEGORY_MAP)
6. 构建验证     → npm run build + prerender
```

## 依赖文件

| 文件 | 用途 |
|---|---|
| `news-list.json` | 372 篇元数据 (id/title/date/summary/cover/cats) — 已抓取, 无需更新 |
| `news-html/` | 详情页原始 HTML (抓取产物) |
| `articles-data.json` | 解析后的结构化正文 (中间产物) |
| `images-map.json` | 原 URL → 本地路径映射 (中间产物) |

## 脚本说明

### 1. 抓取详情页
```bash
node fetch-news-html.mjs        # 快抓 (8 并发, 约 100 篇后可能触发 IP 封禁)
node wait-and-fetch.mjs         # 慢抓 (单并发 3-6s 间隔, 自动轮询等待解封, 推荐续抓)
```
- 站点反爬: 快抓约 100 篇后整 IP 段被断连 (TCP 拒绝), 封禁时长不定 (实测 >40 分钟)
- 图片 CDN (32062144.s21i.faiusr.com) 与站点独立, 不受限流影响
- 微信公众号卡片 (mp-common-profile) 转成 quote block "欢迎关注公众号：xxx"

### 2-5. 解析 + 生成
```bash
node parse-news-html.mjs        # 生成 articles-data.json (只处理 news-html/ 已抓的文件)
node download-images.mjs        # 下载封面+正文图到 public/images/news/, 生成 images-map.json
node generate-news-data.mjs     # 生成 src/data/articles.ts + images/news.ts + i18n news.json (3 locale)
node generate-home-data.mjs     # 更新 src/data/home.ts (NEWS_LIST + NEWS_CATEGORY_MAP)
```

注意: generate-news-data.mjs 内部 `PROJ` 常量硬编码为 `D:\VibeTest\bigsound`, 若项目路径变化需同步修改。

## 分类映射规则 (旧站 g 值 → 新站 cat)

| 旧站分类 | 新站 cat |
|---|---|
| g=1 公司新闻 | `company-news` |
| g=2 听力科普/资讯 | `industry-news` |
| g=3 产品资讯 | `product-news` |

多分类文章按标题关键词启发式归类, 生成后可人工微调 `home.ts` 的 `NEWS_CATEGORY_MAP`。

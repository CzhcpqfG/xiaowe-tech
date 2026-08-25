# 官网3.0原型图片命名映射

来源文件: `官网3.0文案框架260718.xlsx`

共 26 张图片 (image1-image26, 其中 image18 为 jpeg)

## 文件映射表

| 原文件名 | 新文件名 | Excel位置 | 内容描述 | 详情 |
|---|---|---|---|---|
| `image1.png` | `founder_card_wanghai.png` | A6:E6 | 王海创始人/董事长卡片 | 左侧人物介绍卡片，含教育背景、创维经历、连续创业经历 |
| `image2.png` | `team_exec_card.png` | A6:E7 | 团队高管卡片 | 3位高管介绍卡片（市场/研发/运营总监） |
| `image3.png` | `tech_ric_diagram.png` | A8:E8 | RIC助听器技术原理图 | AI智能、双麦克风、40dB增益、降噪等技术特性图示 |
| `image4.png` | `product_ric_render.png` | F6:J6 | RIC耳背式助听器渲染图 | 产品渲染图，无文字 |
| `image5.png` | `patented_technology_certs.png` | F10:J11 + P14:S15 (复用2次) | 国家专利技术证书矩阵 | 顶部绿色标题+4组数字统计+30+专利证书矩阵 |
| `image6.png` | `cert_badges_iso_ce_fda.png` | F12:J13 | 资质认证徽章 | ISO9001/CE/FDA等认证标识 |
| `image7.png` | `product_series_4models.png` | F14:J14 | 4款助听器产品系列图 | 4款产品并列展示 |
| `image8.png` | `remote_audiology_consultation.png` | J14:J14 | 远程验配/视频咨询场景 | 居家用户与诊室医生视频咨询分屏图 |
| `image9.png` | `skyworth_adult_smartwatch.png` | K1:O1 | 创维成人智能手表合集 | 4款成人智能手表C01/C02/R1/S8 (创维品牌) |
| `image10.png` | `skyworth_kids_smartwatch.png` | K2:L2 | 创维儿童智能手表合集 | 3款儿童智能手表T9/T10/Z1 (创维品牌) |
| `image11.png` | `skyworth_audio_hearing_product.png` | K2:M2 | 创维音频/听力产品合集 | 4款OWS/TWS音频产品 (创维品牌) |
| `image12.png` | `hearing_loss_grade_table.png` | P5:S5 | 听力损失分级对照表 | 正常/轻度/中度/中重度/重度/极重度分级+解决方案 |
| `image13.png` | `china_hearing_loss_population.png` | Q8:R9 | 中国听力障碍人数柱状图 | 2010/2020/2030年听力障碍人数对比 |
| `image14.png` | `hearing_aid_demand_trend.png` | P9:Q9 | 中国助听器需求规模趋势 | 需求量与行业规模折线图 2000-2030 |
| `image15.png` | `own_factory_overview.png` | P13:S13 | 自有工厂介绍 | 工厂照片+研发团队+生产设备+专利 |
| `image16.png` | `certifications_registrations.png` | Q13:S14 | 医疗器械认证证书墙 | 7张医疗器械生产/经营/注册证书 |
| `image17.png` | `store_storefront_design.png` | P16:Q16 | 店铺形象设计 | 门店外观+绿色Bigsound标识 |
| `image18.jpeg` | `qr_wechat_service.jpeg` | Q16:R16 | 微信客服二维码 | 客服/咨询二维码 |
| `image19.png` | `kol_koc_testimonial_grid.png` | Q18:S18 | KOL/KOC种草内容合集 | 12张博主/用户场景图 3x4网格 |
| `image20.png` | `public_welfare_initiative.png` | Q17:S18 | 政企公益行动 | 政府公益/企业公益/社区义诊3张照片 |
| `image21.png` | `annual_brand_event.png` | P17:Q18 | 年度品牌活动 | 大型会议/演讲/听力检测现场3张照片 |
| `image22.png` | `local_life_map_groupbuying.png` | P18:Q18 | 本地生活(地图/团购)入口 | 5个手机界面截图(百度地图/高德/美团等) |
| `image23.png` | `local_services_platforms_grid.png` | Q19:S19 | 本地生活服务平台矩阵 | 5个本地生活平台手机界面 |
| `image24.png` | `official_social_media_matrix.png` | P19:Q19 | 自营官方号营销矩阵 | 5个社交平台账号截图(小红书/公众号/抖音/微博/知乎) |
| `image25.png` | `investment_policy_franchise.png` | (未放置) | 招商政策表格(上半) | 创维AI中文助听器联营店招商政策-投入/分成/推广 |
| `image26.png` | `franchise_policy_part2.png` | (未放置) | 招商政策表格(下半) | 招商政策-开店支持/KOC返现/投入汇总/结算/合作时长 |

## 命名规则

- 使用小写英文 + 下划线 (snake_case)
- 保留原扩展名 (.png / .jpeg)
- 名称反映内容用途，便于开发时按需引用

## 复用说明

- `patented_technology_certs.png` (原 image5.png) 在 Excel 中复用 2 次：
  - 中列 F10:J11 (产品/技术区)
  - 右列 P14:S15 (资质/信任区)

## 未放置图片

- `investment_policy_franchise.png` (原 image25.png) 和 `franchise_policy_part2.png` (原 image26.png) 在 Excel 媒体库中存在但未放置到工作表上，属于招商政策表格的上/下半部分，可能是备选内容或单独文档使用。

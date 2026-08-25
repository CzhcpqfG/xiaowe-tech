/**
 * 健康智能穿戴页 (/wearable) 图片资源
 *
 * 数据源:
 *   - 11 张产品主图: 从 xiaowe.cc 创维官方商城下载 (真实产品图, 2026-07-21)
 *     成人手表 4 款: C01 / C02 / R1 / S8
 *     儿童手表 3 款: T9 / T10 / Z1
 *     蓝牙耳机 4 款: OWS SEB002 / OWS SEP002 / OWS SES002 / TWS SEP001
 *   - Hero banner: 速创 API gpt-image-2 生成 (中间留白, 16:9, 智能穿戴主题)
 */

export const WEARABLE_IMAGES = {
  // ===== 成人手表 4 款 =====
  wearableAdultC01: "/images/wearable/adult_c01.webp",
  wearableAdultC02: "/images/wearable/adult_c02.webp",
  wearableAdultR1: "/images/wearable/adult_r1.webp",
  wearableAdultS8: "/images/wearable/adult_s8.webp",

  // ===== 儿童手表 3 款 =====
  wearableKidsT9: "/images/wearable/kids_t9.webp",
  wearableKidsT10: "/images/wearable/kids_t10.webp",
  wearableKidsZ1: "/images/wearable/kids_z1.webp",

  // ===== 蓝牙耳机 4 款 =====
  wearableEarphoneSeb002: "/images/wearable/earphone_seb002.webp",
  wearableEarphoneSep002: "/images/wearable/earphone_sep002.webp",
  wearableEarphoneSes002: "/images/wearable/earphone_ses002.webp",
  wearableEarphoneTwsSep001: "/images/wearable/earphone_tws_sep001.webp",

  // Hero 背景图 - 智能穿戴主题 (速创 API 生成, 16:9, 中间留白)
  wearableTechWatch01: "/images/wearable/tech/tech_watch_01.svg", // 心率监测
  wearableTechWatch02: "/images/wearable/tech/tech_watch_02.svg", // 血氧监测
  wearableTechWatch03: "/images/wearable/tech/tech_watch_03.svg", // 定位功能
  wearableTechWatch04: "/images/wearable/tech/tech_watch_04.svg", // 运动健康
  wearableTechWatch05: "/images/wearable/tech/tech_watch_05.svg", // 睡眠监测
  wearableTechWatch06: "/images/wearable/tech/tech_watch_06.svg", // 体温测量
  wearableTechWatch07: "/images/wearable/tech/tech_watch_07.svg", // 血压监测
  wearableTechWatch08: "/images/wearable/tech/tech_watch_08.svg", // 心电监测
  wearableTechWatch09: "/images/wearable/tech/tech_watch_09.svg", // 压力监测
  wearableTechWatch10: "/images/wearable/tech/tech_watch_10.svg", // 女性健康
  wearableTechWatch11: "/images/wearable/tech/tech_watch_11.svg", // 呼吸训练
  wearableTechWatch12: "/images/wearable/tech/tech_watch_12.svg", // 电子围栏
  wearableTechWatch13: "/images/wearable/tech/tech_watch_13.svg", // 遥控拍照
  wearableTechWatch14: "/images/wearable/tech/tech_watch_14.svg", // 音乐功能
  wearableTechWatch15: "/images/wearable/tech/tech_watch_15.svg", // 一键SOS紧急呼救

  // ===== 智能蓝牙耳机 10 项核心技术图标 (iconify mdi 图标集, 120×120, 品牌绿 #05a045) =====
  wearableTechEarphone01: "/images/wearable/tech/tech_earphone_01.svg", // 多重场景声
  wearableTechEarphone02: "/images/wearable/tech/tech_earphone_02.svg", // 声道定向传音
  wearableTechEarphone03: "/images/wearable/tech/tech_earphone_03.svg", // HiFi 无损音质
  wearableTechEarphone04: "/images/wearable/tech/tech_earphone_04.svg", // SBC 音频解码
  wearableTechEarphone05: "/images/wearable/tech/tech_earphone_05.svg", // 声波聚焦消音
  wearableTechEarphone06: "/images/wearable/tech/tech_earphone_06.svg", // 深度降噪
  wearableTechEarphone07: "/images/wearable/tech/tech_earphone_07.svg", // 长效续航
  wearableTechEarphone08: "/images/wearable/tech/tech_earphone_08.svg", // 通话降噪
  wearableTechEarphone09: "/images/wearable/tech/tech_earphone_09.svg", // 低延迟模式
  wearableTechEarphone10: "/images/wearable/tech/tech_earphone_10.svg", // 防水防汗
} as const;

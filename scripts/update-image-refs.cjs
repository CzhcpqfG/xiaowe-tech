const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const files = [
  path.join(root, 'index.html'),
  path.join(root, 'src', 'pages', 'NotFoundPage.tsx'),
  path.join(root, 'src', 'data', 'images', 'common.ts'),
  path.join(root, 'src', 'data', 'images', 'banner.ts'),
  path.join(root, 'src', 'data', 'images', 'home.ts'),
  path.join(root, 'src', 'data', 'images', 'about.ts'),
  path.join(root, 'src', 'data', 'images', 'product.ts'),
  path.join(root, 'src', 'data', 'images', 'invest.ts'),
  path.join(root, 'src', 'data', 'images', 'service.ts'),
  path.join(root, 'src', 'data', 'images', 'news.ts'),
  path.join(root, 'src', 'config', 'footer.ts'),
];

// 全局字符串替换（按旧路径长度降序，避免部分匹配）
const replacements = [
  // index + common
  ['/images/favicon.ico', '/images/common/favicon.ico'],
  ['/images/logo.png', '/images/common/logo.png'],
  ['/images/04_brand.webp', '/images/common/brand.webp'],
  ['/images/09_qrcode.webp', '/images/common/qrcode.webp'],
  ['/images/hero_bigsound_logo.webp', '/images/common/hero_bigsound_logo.webp'],
  ['/images/hero_dasound_logo.webp', '/images/common/hero_dasound_logo.webp'],
  ['/images/not-found.png', '/images/common/not_found.png'],

  // banner
  ['/images/02_banner_bg1.webp', '/images/home/banner/banner_bg_1.webp'],
  ['/images/02_banner_bg2.webp', '/images/home/banner/banner_bg_2.webp'],
  ['/images/02_banner_1.webp', '/images/home/banner/banner_1.webp'],
  ['/images/02_banner_2.webp', '/images/home/banner/banner_2.webp'],
  ['/images/02_banner_3.webp', '/images/home/banner/banner_3.webp'],

  // home
  ['/images/original/hero_logo.webp', '/images/home/hero/hero_logo.webp'],
  ['/images/original/hero_brand.webp', '/images/home/hero/hero_brand.webp'],
  ['/images/original/brand_intro_bg.jpg', '/images/home/brand_intro_bg.jpg'],
  ['/images/original/hearing_research.webp', '/images/home/research/hearing_research.webp'],
  ['/images/original/flagship_product.webp', '/images/home/products/flagship_product.webp'],
  ['/images/original/flagship_logo.webp', '/images/home/products/flagship_logo.webp'],
  ['/images/original/series1.webp', '/images/home/products/series_1.webp'],
  ['/images/original/series2.webp', '/images/home/products/series_2.webp'],
  ['/images/original/series3.webp', '/images/home/products/series_3.webp'],
  ['/images/original/tech1.webp', '/images/home/tech/tech_1.webp'],
  ['/images/original/tech2.webp', '/images/home/tech/tech_2.webp'],
  ['/images/original/tech3.webp', '/images/home/tech/tech_3.webp'],
  ['/images/05_tech_4.webp', '/images/home/tech/tech_4.webp'],
  ['/images/original/cert1.webp', '/images/honors/real/cert_1.webp'],
  ['/images/original/cert2.webp', '/images/honors/real/cert_2.webp'],
  ['/images/original/cert3.webp', '/images/honors/real/cert_3.webp'],
  ['/images/cta_logo_main.webp', '/images/home/cta/logo_main.webp'],
  ['/images/cta_logo_dasound_ztq.webp', '/images/home/cta/logo_dasound_ztq.webp'],
  ['/images/cta_logo_dasound_tl.webp', '/images/home/cta/logo_dasound_tl.webp'],
  ['/images/cta_logo_xhs.webp', '/images/home/cta/logo_xhs.webp'],
  ['/images/prototype/skyworth_adult_smartwatch.png', '/images/wearable/skyworth_adult_smartwatch.png'],

  // about
  ['/images/about_brand.webp', '/images/about/about_brand.webp'],
  ['/images/about_founder.png', '/images/about/about_founder.png'],
  ['/images/original/mission_vision_1.jpg', '/images/about/mission_vision_1.jpg'],
  ['/images/original/mission_vision_2.jpg', '/images/about/mission_vision_2.jpg'],
  ['/images/culture/culture_mission.png', '/images/about/culture/mission.png'],
  ['/images/culture/culture_vision.png', '/images/about/culture/vision.png'],
  ['/images/culture/culture_values.png', '/images/about/culture/values.png'],
  ['/images/honors/real/cert1.webp', '/images/honors/real/cert_1.webp'],
  ['/images/honors/real/cert2.webp', '/images/honors/real/cert_2.webp'],
  ['/images/honors/real/cert3.webp', '/images/honors/real/cert_3.webp'],

  // product
  ['/images/product_ric_bg.webp', '/images/product/bg/ric_bg.webp'],
  ['/images/product_neck_bg.webp', '/images/product/bg/neck_bg.webp'],
  ['/images/product_ric_tencent_bg.webp', '/images/product/bg/ric_tencent_bg.webp'],
  ['/images/product_banner_title.webp', '/images/product/banner_title.webp'],
  ['/images/product_family_portrait.png', '/images/product/family_portrait.png'],
  ['/images/prototype/tech_ric_diagram.png', '/images/product/tech_ric_diagram.png'],
  ['/images/prototype/product_series_4models.png', '/images/product/product_series_4models.png'],
  ['/images/prototype/product_ric_render.png', '/images/product/product_ric_render.png'],
  ['/images/prototype/cert_badges_iso_ce_fda.png', '/images/product/cert_badges_iso_ce_fda.png'],
  ['/images/prototype/clinical_report_placeholder.png', '/images/product/clinical_report_placeholder.png'],
  ['/images/report.png', '/images/product/clinical_report.png'],
  ['/images/图片1.png', '/images/product/patent_matrix.png'],
  ['/images/prototype/patented_technology_certs.png', '/images/invest/patented_technology_certs.png'],
  ['/images/prototype/remote_audiology_consultation.png', '/images/product/remote_audiology_consultation.png'],
  ['/images/prototype/service_center_store_hd.png', '/images/product/service_center_store_hd.png'],
  ['/images/prototype/qr_wechat_service.jpeg', '/images/product/qr_wechat_service.jpeg'],

  // invest (prototype -> invest / honors)
  ['/images/prototype/invest_expert_team_wide.png', '/images/invest/expert_team_wide.png'],
  ['/images/prototype/invest_expert_team.png', '/images/invest/expert_team.png'],
  ['/images/prototype/invest_hero_franchise.png', '/images/invest/hero_franchise.png'],
  ['/images/prototype/cert_real_1.png', '/images/honors/real/cert_real_1.png'],
  ['/images/prototype/cert_real_2.png', '/images/honors/real/cert_real_2.png'],
  ['/images/prototype/cert_real_3.png', '/images/honors/real/cert_real_3.png'],
  ['/images/prototype/cert_real_4.png', '/images/honors/real/cert_real_4.png'],
  ['/images/prototype/cert_real_5.png', '/images/honors/real/cert_real_5.png'],
  ['/images/prototype/invest_hearing_prevalence.png', '/images/invest/hearing_prevalence.png'],
  ['/images/prototype/invest_harm_dementia.png', '/images/invest/harm_dementia.png'],
  ['/images/prototype/invest_harm_falling.png', '/images/invest/harm_falling.png'],
  ['/images/prototype/invest_harm_depression.png', '/images/invest/harm_depression.png'],
  ['/images/prototype/hearing_loss_grade_table.png', '/images/invest/hearing_loss_grade_table.png'],
  ['/images/prototype/invest_china_hearing_scene.png', '/images/invest/china_hearing_scene.png'],
  ['/images/prototype/hearing_aid_demand_trend.png', '/images/invest/hearing_aid_demand_trend.png'],
  ['/images/prototype/own_factory_overview.png', '/images/invest/own_factory_overview.png'],
  ['/images/prototype/certifications_registrations.png', '/images/invest/certifications_registrations.png'],
  ['/images/prototype/invest_production_equipment.png', '/images/invest/production_equipment.png'],
  ['/images/prototype/store_storefront_design.png', '/images/invest/store_storefront_design.png'],
  ['/images/prototype/invest_store_floorplan.png', '/images/invest/store_floorplan.png'],
  ['/images/prototype/investment_policy_franchise.png', '/images/invest/investment_policy_franchise.png'],
  ['/images/prototype/franchise_policy_part2.png', '/images/invest/franchise_policy_part2.png'],

  // service
  ['/images/service_c2m_bg.jpg', '/images/service/c2m_bg.jpg'],
  ['/images/service_banner_title.webp', '/images/service/banner_title.webp'],
  ['/images/service_c2m_logo.webp', '/images/service/c2m_logo.webp'],
  ['/images/original/qr_xwjk.webp', '/images/service/qr/qr_xwjk.webp'],
  ['/images/original/qr_xwmy.webp', '/images/service/qr/qr_xwmy.webp'],
  ['/images/original/qr_invest.webp', '/images/service/qr/qr_invest.webp'],
  ['/images/original/qr_remote.webp', '/images/service/qr/qr_remote.webp'],

  // footer QR (original/QR/*)
  ['/images/original/QR/cta_logo_dasound_ztq.webp', '/images/home/cta/logo_dasound_ztq.webp'],
  ['/images/original/QR/cta_logo_dasound_tl.webp', '/images/home/cta/logo_dasound_tl.webp'],
  ['/images/original/QR/cta_logo_xhs.webp', '/images/home/cta/logo_xhs.webp'],
  ['/images/original/QR/qr_xwjk.webp', '/images/service/qr/qr_xwjk.webp'],
  ['/images/original/QR/qr_xwmy.webp', '/images/service/qr/qr_xwmy.webp'],
  ['/images/original/QR/09_qrcode.webp', '/images/common/qrcode.webp'],
  ['/images/original/QR/08_partner_2.webp', '/images/home/cta/logo_kuaishou.webp'],
  ['/images/original/QR/08_partner_3.webp', '/images/home/cta/logo_bilibili.webp'],

  // news
  ['/images/original/news1.webp', '/images/news/news_1.webp'],
  ['/images/original/news2.webp', '/images/news/news_2.webp'],
  ['/images/original/news3.webp', '/images/news/news_3.webp'],
  ['/images/original/news4.webp', '/images/news/news_4.webp'],
  ['/images/original/news5.webp', '/images/news/news_5.webp'],
  ['/images/original/news6.webp', '/images/news/news_6.webp'],
  ['/images/original/news7.webp', '/images/news/news_7.webp'],
  ['/images/original/news8.webp', '/images/news/news_8.webp'],
  ['/images/original/news9.webp', '/images/news/news_9.webp'],
  ['/images/original/news10.webp', '/images/news/news_10.webp'],
];

files.forEach((file) => {
  if (!fs.existsSync(file)) {
    console.warn('SKIP (missing):', file);
    return;
  }
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;
  replacements.forEach(([oldStr, newStr]) => {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      changed = true;
    }
  });

  // common.ts: 删除已不存在/未使用的 6 子页 hero 字段
  if (path.basename(file) === 'common.ts') {
    const before = content;
    content = content.replace(
      /\n {2}\/\/ 6 子页 Hero 背景图 \(2026-07-25 AI 生图[^\n]*\)[\s\S]*?heroNews: "\/images\/hero\/hero_news\.png", \/\/ 资讯中心 - 媒体中心\n/,
      '\n'
    );
    if (content !== before) changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('UPDATED:', path.relative(root, file));
  } else {
    console.log('NO CHANGE:', path.relative(root, file));
  }
});

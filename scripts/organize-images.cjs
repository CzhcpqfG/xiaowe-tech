const fs = require('fs');
const path = require('path');

const base = path.join(__dirname, '../public/images');

function move(src, dst) {
  const srcPath = path.join(base, src);
  const dstPath = path.join(base, dst);
  if (!fs.existsSync(srcPath)) {
    console.warn(`MISSING SOURCE: ${src}`);
    return;
  }
  const dstDir = path.dirname(dstPath);
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  fs.renameSync(srcPath, dstPath);
  console.log(`MOVED: ${src} -> ${dst}`);
}

function archive(src, dst) {
  const srcPath = path.join(base, src);
  if (!fs.existsSync(srcPath)) {
    console.warn(`MISSING ARCHIVE SOURCE: ${src}`);
    return;
  }
  const dstPath = path.join(base, 'archive', dst);
  const dstDir = path.dirname(dstPath);
  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }
  fs.renameSync(srcPath, dstPath);
  console.log(`ARCHIVED: ${src} -> archive/${dst}`);
}

// 4.1 root -> common/
move('logo.png', 'common/logo.png');
move('favicon.ico', 'common/favicon.ico');
move('not-found.png', 'common/not_found.png');
move('04_brand.webp', 'common/brand.webp');
move('hero_bigsound_logo.webp', 'common/hero_bigsound_logo.webp');
move('hero_dasound_logo.webp', 'common/hero_dasound_logo.webp');

// 4.2 root + original -> home/
move('02_banner_bg1.webp', 'home/banner/banner_bg_1.webp');
move('02_banner_bg2.webp', 'home/banner/banner_bg_2.webp');
move('02_banner_1.webp', 'home/banner/banner_1.webp');
move('02_banner_2.webp', 'home/banner/banner_2.webp');
move('02_banner_3.webp', 'home/banner/banner_3.webp');
move('original/hero_logo.webp', 'home/hero/hero_logo.webp');
move('original/hero_brand.webp', 'home/hero/hero_brand.webp');
move('original/brand_intro_bg.jpg', 'home/brand_intro_bg.jpg');
move('original/tech1.webp', 'home/tech/tech_1.webp');
move('original/tech2.webp', 'home/tech/tech_2.webp');
move('original/tech3.webp', 'home/tech/tech_3.webp');
move('05_tech_4.webp', 'home/tech/tech_4.webp');
move('original/flagship_product.webp', 'home/products/flagship_product.webp');
move('original/flagship_logo.webp', 'home/products/flagship_logo.webp');
move('original/series1.webp', 'home/products/series_1.webp');
move('original/series2.webp', 'home/products/series_2.webp');
move('original/series3.webp', 'home/products/series_3.webp');
move('original/hearing_research.webp', 'home/research/hearing_research.webp');
move('cta_logo_main.webp', 'home/cta/logo_main.webp');
move('original/QR/cta_logo_dasound_ztq.webp', 'home/cta/logo_dasound_ztq.webp');
move('original/QR/cta_logo_dasound_tl.webp', 'home/cta/logo_dasound_tl.webp');
move('original/QR/cta_logo_xhs.webp', 'home/cta/logo_xhs.webp');

// 4.3 root -> about/
move('about_brand.webp', 'about/about_brand.webp');
move('about_founder.png', 'about/about_founder.png');

// 4.4 original -> about / honors / news
move('original/mission_vision_1.jpg', 'about/mission_vision_1.jpg');
move('original/mission_vision_2.jpg', 'about/mission_vision_2.jpg');
move('original/cert1.webp', 'honors/real/cert_1.webp');
move('original/cert2.webp', 'honors/real/cert_2.webp');
move('original/cert3.webp', 'honors/real/cert_3.webp');
for (let i = 1; i <= 10; i++) {
  move(`original/news${i}.webp`, `news/news_${i}.webp`);
}

// 4.5 root -> product/
move('product_ric_bg.webp', 'product/bg/ric_bg.webp');
move('product_neck_bg.webp', 'product/bg/neck_bg.webp');
move('product_ric_tencent_bg.webp', 'product/bg/ric_tencent_bg.webp');
move('product_banner_title.webp', 'product/banner_title.webp');
move('product_family_portrait.png', 'product/family_portrait.png');
move('report.png', 'product/clinical_report.png');
move('图片1.png', 'product/patent_matrix.png');

// 4.6 prototype -> product / invest / about / wearable
move('prototype/tech_ric_diagram.png', 'product/tech_ric_diagram.png');
move('prototype/product_series_4models.png', 'product/product_series_4models.png');
move('prototype/product_ric_render.png', 'product/product_ric_render.png');
move('prototype/cert_badges_iso_ce_fda.png', 'product/cert_badges_iso_ce_fda.png');
move('prototype/clinical_report_placeholder.png', 'product/clinical_report_placeholder.png');
move('prototype/remote_audiology_consultation.png', 'product/remote_audiology_consultation.png');
move('prototype/service_center_store_hd.png', 'product/service_center_store_hd.png');
move('prototype/qr_wechat_service.jpeg', 'product/qr_wechat_service.jpeg');

move('prototype/invest_hero_franchise.png', 'invest/hero_franchise.png');
move('prototype/invest_expert_team.png', 'invest/expert_team.png');
move('prototype/invest_expert_team_wide.png', 'invest/expert_team_wide.png');
move('prototype/invest_china_hearing_scene.png', 'invest/china_hearing_scene.png');
move('prototype/invest_hearing_prevalence.png', 'invest/hearing_prevalence.png');
move('prototype/invest_harm_dementia.png', 'invest/harm_dementia.png');
move('prototype/invest_harm_falling.png', 'invest/harm_falling.png');
move('prototype/invest_harm_depression.png', 'invest/harm_depression.png');
move('prototype/hearing_loss_grade_table.png', 'invest/hearing_loss_grade_table.png');
move('prototype/hearing_aid_demand_trend.png', 'invest/hearing_aid_demand_trend.png');
move('prototype/own_factory_overview.png', 'invest/own_factory_overview.png');
move('prototype/certifications_registrations.png', 'invest/certifications_registrations.png');
move('prototype/patented_technology_certs.png', 'invest/patented_technology_certs.png');
move('prototype/invest_production_equipment.png', 'invest/production_equipment.png');
move('prototype/store_storefront_design.png', 'invest/store_storefront_design.png');
move('prototype/invest_store_floorplan.png', 'invest/store_floorplan.png');
move('prototype/investment_policy_franchise.png', 'invest/investment_policy_franchise.png');
move('prototype/franchise_policy_part2.png', 'invest/franchise_policy_part2.png');
move('prototype/annual_brand_event.png', 'invest/annual_brand_event.png');
move('prototype/kol_koc_testimonial_grid.png', 'invest/kol_koc_testimonial_grid.png');
move('prototype/local_life_map_groupbuying.png', 'invest/local_life_map_groupbuying.png');
move('prototype/local_services_platforms_grid.png', 'invest/local_services_platforms_grid.png');
move('prototype/official_social_media_matrix.png', 'invest/official_social_media_matrix.png');
move('prototype/public_welfare_initiative.png', 'invest/public_welfare_initiative.png');
move('prototype/china_hearing_loss_population.png', 'invest/china_hearing_loss_population.png');

move('prototype/founder_card_wanghai.png', 'about/founder_card_wanghai.png');
move('prototype/team_exec_card.png', 'about/team_exec_card.png');
move('prototype/skyworth_adult_smartwatch.png', 'wearable/skyworth_adult_smartwatch.png');
move('prototype/skyworth_kids_smartwatch.png', 'wearable/skyworth_kids_smartwatch.png');
move('prototype/skyworth_audio_hearing_product.png', 'wearable/skyworth_audio_hearing_product.png');

// 4.7 root + original/QR -> service/
move('service_c2m_bg.jpg', 'service/c2m_bg.jpg');
move('service_banner_title.webp', 'service/banner_title.webp');
move('service_c2m_logo.webp', 'service/c2m_logo.webp');
move('original/QR/qr_xwjk.webp', 'service/qr/qr_xwjk.webp');
move('original/QR/qr_xwmy.webp', 'service/qr/qr_xwmy.webp');
move('original/QR/qr_invest.webp', 'service/qr/qr_invest.webp');
move('original/QR/qr_remote.webp', 'service/qr/qr_remote.webp');
move('original/QR/09_qrcode.webp', 'common/qrcode.webp');

// 4.8 hero -> invest/
move('hero/hero_invest.png', 'invest/hero_invest.png');

// 4.9 culture -> about/culture/
move('culture/culture_mission.png', 'about/culture/mission.png');
move('culture/culture_vision.png', 'about/culture/vision.png');
move('culture/culture_values.png', 'about/culture/values.png');

// 4.10 archive unused files
archive('01_logo.webp', 'legacy_2_0/01_logo.webp');
archive('03_hero_1.webp', 'legacy_2_0/03_hero_1.webp');
archive('03_hero_2.webp', 'legacy_2_0/03_hero_2.webp');
archive('05_tech_1.webp', 'legacy_2_0/05_tech_1.webp');
archive('05_tech_2.webp', 'legacy_2_0/05_tech_2.webp');
archive('05_tech_3.webp', 'legacy_2_0/05_tech_3.webp');
for (let i = 1; i <= 4; i++) {
  archive(`06_product_${i}.webp`, `legacy_2_0/06_product_${i}.webp`);
}
for (let i = 1; i <= 10; i++) {
  archive(`07_news_${i}.webp`, `legacy_2_0/07_news_${i}.webp`);
}
archive('08_partner_1.webp', 'legacy_2_0/08_partner_1.webp');
archive('original/QR/08_partner_4.webp', 'original_unused/08_partner_4.webp');

console.log('Done.');

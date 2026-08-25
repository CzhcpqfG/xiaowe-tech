const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();
  const htmlPath = path.resolve(__dirname, '../docs/report_investor.html');
  const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');

  await page.goto(fileUrl, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  await page.setViewportSize({ width: 1400, height: 1980 });
  await page.screenshot({ path: 'docs/_report_assets/check_cover.png' });

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/_report_assets/check_summary.png' });

  await page.evaluate(() => window.scrollTo(0, 2400));
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/_report_assets/check_part01.png' });

  await page.evaluate(() => window.scrollTo(0, 12500));
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'docs/_report_assets/check_value.png' });

  await browser.close();
  console.log('Screenshots saved');
})();

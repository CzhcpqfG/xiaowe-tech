const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const htmlPath = path.resolve(__dirname, '../docs/report_investor.html');
  const pdfPath  = path.resolve(__dirname, '../docs/小维健康科技官网_阶段交付报告_投资人版.pdf');
  const fileUrl  = 'file:///' + htmlPath.replace(/\\/g, '/');

  console.log('Launching Chrome...');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  console.log('Loading HTML:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'networkidle' });

  // 给一点时间让字体渲染稳定
  await page.waitForTimeout(800);

  console.log('Generating PDF (A4)...');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    margin: { top: '22mm', right: '20mm', bottom: '22mm', left: '20mm' },
    printBackground: true,
    preferCSSPageSize: false,
  });

  console.log('PDF saved to:', pdfPath);

  // 也输出一个单页预览截图
  const previewPath = path.resolve(__dirname, '../docs/_report_assets/preview_page1.png');
  await page.setViewportSize({ width: 1400, height: 1980 });
  await page.waitForTimeout(300);
  await page.screenshot({ path: previewPath, fullPage: false });
  console.log('Preview screenshot:', previewPath);

  // 输出长图预览（前3页）
  await page.setViewportSize({ width: 1400, height: 6000 });
  await page.waitForTimeout(300);
  const longPreviewPath = path.resolve(__dirname, '../docs/_report_assets/preview_long.png');
  await page.screenshot({ path: longPreviewPath, fullPage: true });
  console.log('Long preview:', longPreviewPath);

  await browser.close();
  console.log('DONE');
})();

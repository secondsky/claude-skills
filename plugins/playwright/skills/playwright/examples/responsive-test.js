// Example: Test responsive design across multiple viewports
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000'; // Change as needed

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
  const page = await browser.newPage();

  const viewports = [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 },
  ];

  for (const viewport of viewports) {
    console.log(`\nTesting ${viewport.name} (${viewport.width}x${viewport.height})`);

    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });

    await page.goto(TARGET_URL);
    // Wait for network to be idle before taking screenshot
    await page.waitForLoadState('networkidle');

    await page.screenshot({
      path: `/tmp/${viewport.name.toLowerCase()}.png`,
      fullPage: true,
    });

    console.log(`✅ Screenshot saved: /tmp/${viewport.name.toLowerCase()}.png`);
  }

  console.log('\n✅ All viewports tested');
  await browser.close();
})();

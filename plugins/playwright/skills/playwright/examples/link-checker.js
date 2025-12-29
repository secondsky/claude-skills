// Example: Check for broken links on a page
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000'; // Change as needed

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  console.log(`Checking links on: ${TARGET_URL}\n`);
  await page.goto(TARGET_URL);

  // Get all links, then filter to http(s) only
  // Note: This excludes relative links (/about), mailto:, tel:, and #anchors
  const allLinks = await page.locator('a[href]').all();
  const httpLinks = [];

  for (const link of allLinks) {
    const href = await link.getAttribute('href');
    // Filter to only http(s) and protocol-relative links
    if (href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//'))) {
      httpLinks.push({ locator: link, href });
    }
  }

  console.log(`Found ${httpLinks.length} external http(s) links to check\n`);

  const results = { working: 0, broken: [] };

  for (const { locator: link, href } of httpLinks) {
    try {
      const response = await page.request.head(href);
      if (response.ok()) {
        results.working++;
        console.log(`✅ ${href}`);
      } else {
        results.broken.push({ url: href, status: response.status() });
        console.log(`❌ ${href} (Status: ${response.status()})`);
      }
    } catch (e) {
      results.broken.push({ url: href, error: e.message });
      console.log(`❌ ${href} (Error: ${e.message})`);
    }
  }

  console.log(`\n\n=== RESULTS ===`);
  console.log(`✅ Working links: ${results.working}`);
  console.log(`❌ Broken links: ${results.broken.length}`);

  if (results.broken.length > 0) {
    console.log('\nBroken link details:');
    console.log(JSON.stringify(results.broken, null, 2));
  }

  await browser.close();
})();

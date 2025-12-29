// Example: Fill and submit a form
const { chromium } = require('playwright');

const TARGET_URL = 'http://localhost:3000'; // Change as needed

(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 50 });
  const page = await browser.newPage();

  await page.goto(`${TARGET_URL}/contact`);

  // Fill form fields
  await page.fill('input[name="name"]', 'John Doe');
  await page.fill('input[name="email"]', 'john@example.com');
  await page.fill('textarea[name="message"]', 'This is a test message');

  // Submit form
  await page.click('button[type="submit"]');

  // Verify submission
  try {
    await page.waitForSelector('.success-message', { timeout: 5000 });
    console.log('✅ Form submitted successfully');
  } catch (e) {
    console.log('❌ Form submission failed or success message not found');
  }

  await browser.close();
})();

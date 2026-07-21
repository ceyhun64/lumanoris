const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${OUT}\\ux_state.json` });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));

    await page.goto('http://localhost:3000/dashboard/checkout', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: `${OUT}\\UX_17_checkout_page.png`, fullPage: false });

    const t0 = Date.now();
    await page.locator('button', { hasText: 'Sepeti Onayla' }).click({ timeout: 8000 }).catch((e) => console.log('confirm click failed:', e.message));
    await page.waitForTimeout(2000);
    console.log('Time to complete order:', Date.now() - t0, 'ms');
    console.log('URL after confirm:', page.url());
    await page.screenshot({ path: `${OUT}\\UX_18_after_confirm.png`, fullPage: false });

    await page.goto('http://localhost:3000/dashboard/purchased', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}\\UX_19_purchased_after_checkout.png`, fullPage: false });

    await browser.close();
})();

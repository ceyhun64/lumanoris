const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${OUT}\\ux_state.json` });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

    await page.goto('http://localhost:3000/dashboard/chat/?botId=24', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    await page.locator('button', { hasText: 'Satın Al' }).first().click();
    await page.waitForTimeout(800);

    const t0 = Date.now();
    await page.locator('[role="dialog"] button', { hasText: 'Satın Al' }).last().click();
    await page.waitForTimeout(2000);
    console.log('Time for purchase to complete:', Date.now() - t0, 'ms');
    await page.screenshot({ path: `${OUT}\\UX_15_after_purchase.png`, fullPage: false });

    // Check Satın Aldıklarım
    await page.goto('http://localhost:3000/dashboard/purchased', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}\\UX_16_purchased_list.png`, fullPage: false });

    await browser.close();
})();

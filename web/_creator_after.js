const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle' });
    await page.fill('input[type="email"], input[name="email"]', 'demo@lumanoris.test');
    await page.fill('input[type="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 20000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}\\AFTER2_sidebar_dashboard.png`, fullPage: false });

    await page.goto('http://localhost:3000/dashboard/chatbots', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}\\AFTER2_sidebar_chatbots.png`, fullPage: false });

    await browser.close();
})();

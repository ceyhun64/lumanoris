const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

async function shootVerified(page, path, outFile) {
    for (let attempt = 1; attempt <= 8; attempt++) {
        await page.goto('http://localhost:3000' + path, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
        const title = await page.title().catch(() => '');
        if (title.includes('Lumanoris')) {
            await page.waitForTimeout(900);
            await page.screenshot({ path: outFile, fullPage: false });
            return true;
        }
        await page.waitForTimeout(1500);
    }
    console.log('FAILED verification for', path);
    return false;
}

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();

    await shootVerified(page, '/login', `${OUT}\\_tmp_login_check.png`);
    await page.fill('input[type="email"], input[name="email"]', 'demo@lumanoris.test');
    await page.fill('input[type="password"]', 'Demo1234!');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard**', { timeout: 40000 });
    await page.waitForTimeout(1000);

    await shootVerified(page, '/dashboard/following', `${OUT}\\AFTER2_following.png`);
    await shootVerified(page, '/dashboard/purchased', `${OUT}\\AFTER2_purchased.png`);

    await browser.close();
})();

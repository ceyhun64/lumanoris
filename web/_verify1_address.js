const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

async function shootVerified(page, path, outFile) {
    for (let attempt = 1; attempt <= 8; attempt++) {
        await page.goto('http://localhost:3000' + path, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
        const title = await page.title().catch(() => '');
        if (title.includes('Lumanoris')) {
            await page.waitForTimeout(1200);
            await page.screenshot({ path: outFile, fullPage: false });
            return true;
        }
        await page.waitForTimeout(1500);
    }
    return false;
}

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${OUT}\\ux_state.json` });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));
    page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

    await shootVerified(page, '/dashboard/settings', `${OUT}\\VERIFY_settings_before_tab.png`);
    await page.locator('button', { hasText: 'Ödeme Bilgileri' }).click({ timeout: 5000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${OUT}\\VERIFY1_settings_split_form.png`, fullPage: true });

    // Fill ONLY the address section — no TC Kimlik, no IBAN, no Hesap Türü
    await page.locator('button', { hasText: 'İl Seç' }).click({ timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}\\VERIFY1_il_dropdown.png`, fullPage: false });
    const firstIl = page.locator('[role="option"]').first();
    await firstIl.click();
    await page.waitForTimeout(800);

    await page.locator('button', { hasText: 'İlçe Seç' }).click({ timeout: 5000 });
    await page.waitForTimeout(600);
    const firstIlce = page.locator('[role="option"]').first();
    await firstIlce.click();
    await page.waitForTimeout(500);

    await page.fill('input[name="mahalle"]', 'Test Mahallesi');
    await page.fill('input[name="sokak"]', 'Test Sokak');
    await page.fill('textarea[name="address"]', 'Test adres detay bilgisi, No:1');
    await page.screenshot({ path: `${OUT}\\VERIFY1_address_filled.png`, fullPage: true });

    await page.locator('button', { hasText: 'Adresi Kaydet' }).click({ timeout: 5000 });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${OUT}\\VERIFY1_address_saved.png`, fullPage: true });

    // Now go to checkout and confirm the address-missing blocker is gone
    await shootVerified(page, '/dashboard/checkout', `${OUT}\\VERIFY1_checkout_after_address.png`);

    await browser.close();
})();

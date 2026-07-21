const { chromium } = require('playwright');
const OUT = 'C:\\Users\\Ceyhun\\AppData\\Local\\Temp\\claude\\c--PROJECTS-lumanoris-dashboard\\88275bee-298c-4336-8793-d37706c4295d\\scratchpad';

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: `${OUT}\\ux_state.json` });
    const page = await context.newPage();
    page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));
    let chunkReqCount = 0;
    page.on('request', (req) => { if (req.url().includes('get_training_chunks')) chunkReqCount++; });

    // We already know botId=24 is İngilizce Hoca from the previous repro
    const t0 = Date.now();
    await page.goto('http://localhost:3000/dashboard/chat/?botId=24', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2500);
    console.log('Chat page load time:', Date.now() - t0, 'ms');
    console.log('Training-chunk requests fired so far:', chunkReqCount);
    await page.screenshot({ path: `${OUT}\\UX_12_bot_chat_page.png`, fullPage: false });

    // Open info dialog via the slim header button
    await page.locator('header button, div button').filter({ hasText: 'İngilizce Hoca' }).first().click({ timeout: 5000 }).catch(async () => {
        // fallback: the header is not a <header> tag, just click by aria/text near top
        await page.getByText('İngilizce Hoca', { exact: false }).first().click();
    });
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${OUT}\\UX_13_info_dialog.png`, fullPage: false });

    // Click Satın Al inside the open dialog specifically
    const t1 = Date.now();
    const dialogBuy = page.locator('[role="dialog"] button', { hasText: 'Satın Al' });
    const dialogBuyCount = await dialogBuy.count();
    console.log('Buy buttons inside dialog:', dialogBuyCount);
    if (dialogBuyCount > 0) {
        await dialogBuy.first().click();
    } else {
        // dialog may not have opened; press Escape and use the persistent header pill instead
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        await page.locator('button', { hasText: 'Satın Al' }).first().click();
    }
    await page.waitForTimeout(900);
    console.log('Time to reach BuyModal:', Date.now() - t1, 'ms');
    await page.screenshot({ path: `${OUT}\\UX_14_buy_modal.png`, fullPage: false });

    await browser.close();
})();

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
    return false;
}

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    page.on('console', (msg) => { if (msg.type() === 'error') console.log('BROWSER ERROR:', msg.text()); });
    page.on('pageerror', (err) => console.log('PAGE EXCEPTION:', err.message));

    // 1. Fresh login screen
    await shootVerified(page, '/login', `${OUT}\\UX_01_login.png`);

    // 2. Switch to register tab
    const t0 = Date.now();
    await page.click('text=Kayıt Ol');
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}\\UX_02_register_tab.png`, fullPage: false });

    // 3. Fill register form with a fresh throwaway user
    const stamp = Date.now();
    const email = `uxtest${stamp}@lumanoris.test`;
    await page.fill('input[name="eposta"]', email);
    await page.fill('input[name="dogum_tarihi"]', '1998-05-15');
    await page.fill('input[name="telefon"]', '5551234567');
    await page.fill('input[name="sifre"]', 'UxTest1234!');
    await page.screenshot({ path: `${OUT}\\UX_03_register_filled.png`, fullPage: false });

    await page.click('button[type="submit"]:has-text("Kayıt Ol")');
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}\\UX_04_after_register_submit.png`, fullPage: false });
    console.log('Time from register-tab-click to post-submit screenshot:', Date.now() - t0, 'ms');
    console.log('Registered email:', email);

    // 4. Now log in with the new account (register flow historically doesn't auto-login)
    const t1 = Date.now();
    await page.fill('input[type="email"], input[name="email"]', email).catch(async () => {});
    await page.fill('input[type="password"]', 'UxTest1234!').catch(async () => {});
    await page.screenshot({ path: `${OUT}\\UX_05_login_filled.png`, fullPage: false });
    await page.click('button[type="submit"]:has-text("Giriş Yap")');
    await page.waitForURL('**/dashboard**', { timeout: 20000 }).catch((e) => console.log('LOGIN NAV FAILED:', e.message));
    console.log('Time from login submit to dashboard nav:', Date.now() - t1, 'ms');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}\\UX_06_first_dashboard.png`, fullPage: false });

    // Save storage state so subsequent scripts can reuse this fresh-user session
    await context.storageState({ path: `${OUT}\\ux_state.json` });
    console.log('Session saved. Email:', email);

    await browser.close();
})();

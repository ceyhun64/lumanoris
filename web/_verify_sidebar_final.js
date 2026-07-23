const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ storageState: 'C:/Users/Ceyhun/AppData/Local/Temp/claude/c--PROJECTS-lumanoris-dashboard/88275bee-298c-4336-8793-d37706c4295d/scratchpad/qa_state.json', viewport: { width: 1440, height: 800 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (err) => errors.push(err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });

  await page.goto('http://localhost:3000/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'C:/Users/Ceyhun/AppData/Local/Temp/claude/c--PROJECTS-lumanoris-dashboard/88275bee-298c-4336-8793-d37706c4295d/scratchpad/SBFIX_dashboard.png' });

  // Click a real nav link and confirm real navigation happens
  const walletLink = page.locator('a:has-text("Bakiyem")').first();
  console.log('Wallet nav link found:', await walletLink.count() > 0);
  if (await walletLink.count() > 0) {
    await walletLink.click();
    await page.waitForTimeout(1500);
    console.log('URL after clicking Bakiyem:', page.url());
  }
  await page.screenshot({ path: 'C:/Users/Ceyhun/AppData/Local/Temp/claude/c--PROJECTS-lumanoris-dashboard/88275bee-298c-4336-8793-d37706c4295d/scratchpad/SBFIX_wallet.png' });

  // Collapse toggle still works
  const toggle = page.locator('button[aria-label="Daralt"], button[aria-label="Genişlet"]').first();
  console.log('Toggle btn found:', await toggle.count() > 0);
  if (await toggle.count() > 0) {
    await toggle.click();
    await page.waitForTimeout(500);
  }
  await page.screenshot({ path: 'C:/Users/Ceyhun/AppData/Local/Temp/claude/c--PROJECTS-lumanoris-dashboard/88275bee-298c-4336-8793-d37706c4295d/scratchpad/SBFIX_collapsed.png' });

  console.log('Errors:', errors.length ? errors.join('\n') : '(none)');
  await browser.close();
})();

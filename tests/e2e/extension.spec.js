import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('C:/Users/qin23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

describe('Org Viewer End-to-End Browser Tests', () => {
  it('loads standalone viewer and renders sample document', async () => {
    const extPath = path.resolve('C:/projects/chrome_extension');

    // Launch headless Chromium with extension loaded
    const browser = await chromium.launch({
      headless: true,
      args: [
        `--disable-extensions-except=${extPath}`,
        `--load-extension=${extPath}`
      ]
    });

    const page = await browser.newPage();
    const viewerUrl = `file:///${path.join(extPath, 'src/ui/viewer/viewer.html').replace(/\\/g, '/')}`;
    await page.goto(viewerUrl);

    // 1. Verify Drop Screen is shown initially
    const dropTitle = await page.textContent('.drop-title');
    assert.match(dropTitle || '', /Drop your \.org file here/);

    // 2. Click "Load Sample" button
    await page.click('#btn-load-sample');

    // 3. Verify Rendered View is shown
    await page.waitForSelector('#org-viewer-app');
    const docBadge = await page.textContent('.org-doc-badge');
    assert.match(docBadge || '', /Org-mode Full Capabilities Demo/);

    // 4. Verify Table of Contents is generated
    const tocItems = await page.$$('.org-toc-item');
    assert(tocItems.length >= 4, `Expected at least 4 TOC items, found ${tocItems.length}`);

    // 5. Test Heading Folding
    const firstSection = await page.$('.org-section');
    assert(firstSection, 'Expected section element');
    const initialClasses = await firstSection.getAttribute('class');
    assert(!initialClasses?.includes('org-folded'), 'Section should initially be unfolded');

    await page.click('.org-heading');
    const afterFoldClasses = await firstSection.getAttribute('class');
    assert(afterFoldClasses?.includes('org-folded'), 'Section should be folded after click');

    // 6. Test Raw View toggle
    await page.click('#org-btn-raw');
    const rawVisible = await page.isVisible('#org-raw-content');
    const mainVisible = await page.isVisible('#org-rendered-content');
    assert.strictEqual(rawVisible, true);
    assert.strictEqual(mainVisible, false);

    // Toggle back to rendered view
    await page.click('#org-btn-raw');
    assert.strictEqual(await page.isVisible('#org-rendered-content'), true);

    // 7. Test Theme toggle
    const initialBodyClass = await page.evaluate(() => document.body.className);
    await page.click('#org-btn-theme');
    const themeLabel = await page.textContent('#org-theme-label');
    assert(themeLabel, 'Theme label should be updated');

    await browser.close();
  });

  it('loads welcome and options pages without errors', async () => {
    const extPath = path.resolve('C:/projects/chrome_extension');
    const browser = await chromium.launch({
      headless: true,
      args: [`--disable-extensions-except=${extPath}`, `--load-extension=${extPath}`]
    });

    const page = await browser.newPage();

    // Check Welcome page
    const welcomeUrl = `file:///${path.join(extPath, 'src/ui/welcome/welcome.html').replace(/\\/g, '/')}`;
    await page.goto(welcomeUrl);
    const welcomeTitle = await page.textContent('.welcome-title');
    assert.match(welcomeTitle || '', /Welcome to Org Viewer/);

    // Check Options page
    const optionsUrl = `file:///${path.join(extPath, 'src/ui/options/options.html').replace(/\\/g, '/')}`;
    await page.goto(optionsUrl);
    const optionsTitle = await page.textContent('.options-title');
    assert.match(optionsTitle || '', /Org Viewer Settings/);

    await browser.close();
  });
});
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function loadPlaywright() {
  const candidates = [
    'playwright',
    'C:/Users/qin23/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'
  ];
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {
      // Try the next candidate.
    }
  }
  return null;
}

const playwright = loadPlaywright();
const chromium = playwright ? playwright.chromium : null;
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const suite = chromium ? describe : describe.skip;
const BASE = process.env.ORG_TEST_SERVER || 'http://127.0.0.1:49154';
const ORG_FILE = path.resolve('test_org.org');
const SHOT_DIR = path.resolve('dist');
const STYLES = [
  'src/ui/styles/github-theme.css',
  'src/ui/styles/toc.css',
  'src/ui/styles/print.css',
  'src/ui/styles/phycat-theme.css'
];

// Mirrors what the background service worker injects into file:// pages.
async function openInjectedPage(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/test_org.org`);
  for (const style of STYLES) {
    await page.addStyleTag({ content: fs.readFileSync(style, 'utf8') });
  }
  await page.addScriptTag({ path: path.resolve('src/content/renderer.js') });
  await page.waitForSelector('#org-viewer-app');
  return page;
}

async function openViewerFilePage(context) {
  const page = await context.newPage();
  await page.goto(`${BASE}/src/ui/viewer/viewer.html`);
  await page.setInputFiles('#file-input', ORG_FILE);
  await page.waitForSelector('#org-viewer-app');
  return page;
}

async function openViewerPastePage(context, text) {
  const page = await context.newPage();
  await page.goto(`${BASE}/src/ui/viewer/viewer.html`);
  await page.fill('#paste-input', text);
  await page.click('#btn-render-paste');
  await page.waitForSelector('#org-viewer-app');
  return page;
}

function shellSnapshot() {
  const content = document.getElementById('org-rendered-content');
  const toc = document.getElementById('org-toc-sidebar');
  const resizer = document.querySelector('.org-sidebar-resizer');
  const sidebarRect = toc.getBoundingClientRect();
  const contentRect = content.getBoundingClientRect();
  return {
    contentHtml: content.innerHTML,
    tocHtml: toc.innerHTML,
    buttons: Array.from(document.querySelectorAll('.org-topbar-right .org-btn'))
      .map((button) => button.id)
      .filter((id) => id !== 'btn-open-another'),
    iconButtons: document.querySelectorAll('.org-topbar-right .org-btn > svg').length,
    sidebarWidth: Math.round(sidebarRect.width),
    sidebarPosition: getComputedStyle(toc).position,
    resizerDisplay: resizer ? getComputedStyle(resizer).display : 'missing',
    contentWidth: Math.round(contentRect.width),
    bodyMargin: getComputedStyle(document.body).margin
  };
}

async function sidebarWidth(page) {
  return page.evaluate(() => Math.round(document.getElementById('org-toc-sidebar').getBoundingClientRect().width));
}

suite('Unified rendering and resizable outline', () => {
  it('renders the same document from every entry point', async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const injected = await openInjectedPage(context);
      const viewerFile = await openViewerFilePage(context);
      const viewerPaste = await openViewerPastePage(context, fs.readFileSync(ORG_FILE, 'utf8'));

      const snapshots = {
        injected: await injected.evaluate(shellSnapshot),
        viewerFile: await viewerFile.evaluate(shellSnapshot),
        viewerPaste: await viewerPaste.evaluate(shellSnapshot)
      };

      const [a, b, c] = [snapshots.injected, snapshots.viewerFile, snapshots.viewerPaste];
      assert.strictEqual(b.contentHtml, a.contentHtml, 'viewer file render differs from in-place render');
      assert.strictEqual(c.contentHtml, a.contentHtml, 'viewer paste render differs from in-place render');
      assert.strictEqual(b.tocHtml, a.tocHtml, 'viewer outline differs from in-place outline');
      assert.strictEqual(c.tocHtml, a.tocHtml, 'paste outline differs from in-place outline');
      assert.deepStrictEqual(b.buttons, a.buttons);
      assert.deepStrictEqual(c.buttons, a.buttons);

      for (const [name, snap] of Object.entries(snapshots)) {
        assert.strictEqual(snap.sidebarPosition, 'sticky', `${name}: sidebar should be a sticky panel`);
        assert.strictEqual(snap.bodyMargin, '0px', `${name}: host page margins should be normalized`);
        assert.strictEqual(snap.resizerDisplay, 'block', `${name}: resizer handle missing`);
        assert.ok(snap.iconButtons >= 5, `${name}: toolbar buttons should carry icons`);
        const expected = Math.round(1440 * 0.2);
        assert.ok(Math.abs(snap.sidebarWidth - expected) <= 2, `${name}: outline should default to 20% of viewport (got ${snap.sidebarWidth})`);
        assert.ok(snap.contentWidth > 500, `${name}: content column must stay visible`);
      }

      await injected.screenshot({ path: path.join(SHOT_DIR, 'layout-inplace-1440.png') });
      await viewerFile.screenshot({ path: path.join(SHOT_DIR, 'layout-viewer-1440.png') });
    } finally {
      await browser.close();
    }
  });

  it('resizes the outline by dragging, keyboard, and double-click reset', async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await openInjectedPage(context);
      const resizer = page.locator('.org-sidebar-resizer');

      const before = await sidebarWidth(page);
      const box = await resizer.boundingBox();
      assert.ok(box, 'resizer should have a hit area');

      await page.mouse.move(box.x + box.width / 2, box.y + 300);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 120, box.y + 300, { steps: 10 });
      await page.mouse.up();
      const dragged = await sidebarWidth(page);
      assert.ok(Math.abs(dragged - (before + 120)) <= 4, `drag should widen outline (before=${before}, after=${dragged})`);

      const contentAfterDrag = await page.evaluate(() => Math.round(document.getElementById('org-rendered-content').getBoundingClientRect().width));
      assert.ok(contentAfterDrag > 400, 'content must remain visible after resizing');

      await resizer.dblclick();
      const reset = await sidebarWidth(page);
      assert.ok(Math.abs(reset - Math.round(1440 * 0.2)) <= 2, `double-click should restore 20% default (got ${reset})`);

      await resizer.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      const keyed = await sidebarWidth(page);
      assert.ok(Math.abs(keyed - (reset + 32)) <= 2, `arrow keys should adjust width (got ${keyed})`);

      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-resized-1440.png') });
    } finally {
      await browser.close();
    }
  });

  it('keeps content readable when the outline overlays on narrow windows', async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    try {
      const context = await browser.newContext({ viewport: { width: 800, height: 700 } });
      const page = await openInjectedPage(context);
      const snap = await page.evaluate(shellSnapshot);
      assert.strictEqual(snap.sidebarPosition, 'fixed', 'narrow windows should overlay the outline');
      assert.strictEqual(snap.resizerDisplay, 'none', 'resizer is not usable in overlay mode');
      assert.ok(snap.contentWidth >= 700, 'content should use the full narrow window');

      const isHidden = () => page.evaluate(() => document.getElementById('org-toc-sidebar').classList.contains('org-toc-hidden'));
      assert.ok(await isHidden(), 'overlay outline should start closed so the article is readable');
      await page.click('#org-btn-outline');
      assert.strictEqual(await isHidden(), false, 'outline button should open the overlay');
      await page.click('.org-toc-link');
      await page.waitForTimeout(400);
      assert.ok(await isHidden(), 'overlay outline should close after navigating');
      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-narrow-800.png') });
    } finally {
      await browser.close();
    }
  });

  it('ships the same shell inside the packaged extension viewer', async (t) => {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    const unpacked = path.resolve(`dist/org-viewer-v${manifest.version}`);
    assert.ok(fs.existsSync(path.join(unpacked, 'manifest.json')), 'run `npm run build` before e2e tests');

    const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'org-viewer-layout-'));
    const context = await chromium.launchPersistentContext(profilePath, {
      executablePath: chromePath,
      headless: true,
      args: [`--disable-extensions-except=${unpacked}`, `--load-extension=${unpacked}`]
    });
    try {
      let serviceWorker = context.serviceWorkers()[0];
      if (!serviceWorker) {
        try {
          serviceWorker = await context.waitForEvent('serviceworker', { timeout: 12000 });
        } catch {
          // Branded Chrome stable ignores --load-extension; needs unbranded Chromium.
          await context.close().catch(() => {});
          fs.rmSync(profilePath, { recursive: true, force: true });
          t.skip('Requires unbranded Chromium: Google Chrome stable ignores --load-extension.');
          return;
        }
      }
      const extensionId = new URL(serviceWorker.url()).host;

      const page = await context.newPage();
      await page.goto(`chrome-extension://${extensionId}/src/ui/viewer/viewer.html`);
      await page.click('#btn-load-sample');
      await page.waitForSelector('#org-viewer-app');

      const snap = await page.evaluate(shellSnapshot);
      assert.strictEqual(snap.sidebarPosition, 'sticky');
      assert.strictEqual(snap.resizerDisplay, 'block');
      assert.ok(snap.iconButtons >= 5, 'packaged viewer toolbar should carry icons');
      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-extension-viewer.png') });
    } finally {
      await context.close();
      fs.rmSync(profilePath, { recursive: true, force: true });
    }
  });
  it('renders images, captions, editor gutter and the phycat theme', async () => {
    const browser = await chromium.launch({ headless: true, executablePath: chromePath });
    try {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await context.newPage();
      await page.goto(`${BASE}/tests/manual/inplace-preview.html?doc=/tests/manual/showcase.org`);
      await page.waitForSelector('#org-viewer-app');

      const facts = await page.evaluate(() => ({
        figures: document.querySelectorAll('#org-rendered-content figure').length,
        captions: document.querySelectorAll('#org-rendered-content figcaption').length,
        missing: document.querySelectorAll('.org-image-missing').length,
        codeLines: document.querySelectorAll('.org-code-line').length,
        gutterFirst: getComputedStyle(document.querySelector('.org-code-line'), '::before').content,
        langs: Array.from(document.querySelectorAll('.org-src-lang')).map((n) => n.textContent)
      }));
      // The missing image resolves after the load error event fires.
      await page.waitForSelector('.org-image-missing', { timeout: 5000 });
      assert.ok(facts.figures >= 3, 'images should render as figures');
      assert.ok(facts.captions >= 2, 'descriptions and #+CAPTION should become figcaptions');
      assert.ok(facts.codeLines > 100, 'code blocks should emit per-line gutter spans');
      assert.match(facts.gutterFirst, /counter/, 'gutter should use CSS counters');
      assert.ok(facts.langs.includes('python') && facts.langs.includes('csharp') && facts.langs.includes('yaml'), 'common languages should be labelled');

      // system -> light -> dark -> phycat
      await page.click('#org-btn-theme');
      await page.click('#org-btn-theme');
      await page.evaluate(() => {
        const el = document.querySelector('.org-src-block');
        if (el) el.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-code-dark-1440.png') });
      await page.click('#org-btn-theme');
      const themed = await page.evaluate(() => ({
        phycat: document.body.classList.contains('org-theme-phycat'),
        label: document.getElementById('org-theme-label').textContent,
        h2bg: getComputedStyle(document.querySelector('.org-level-2 > .org-heading')).backgroundImage
      }));
      assert.ok(themed.phycat, 'theme cycle should reach phycat');
      assert.match(themed.label, /Phycat/i);
      assert.match(themed.h2bg, /gradient/, 'phycat H2 should use the gradient ribbon');

      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-phycat-1440.png') });
      await page.click('#org-btn-theme'); // back to system/light for the code shot
      await page.evaluate(() => {
        const el = document.querySelector('.org-src-block');
        if (el) el.scrollIntoView({ block: 'center' });
      });
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(SHOT_DIR, 'layout-code-light-1440.png') });
    } finally {
      await browser.close();
    }
  });

});

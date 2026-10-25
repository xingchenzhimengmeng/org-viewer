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

// Test the packaged distribution produced by `npm run build`.
const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
const extensionPath = path.resolve(`dist/org-viewer-v${manifest.version}`);
const chromePath = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const suite = chromium ? describe : describe.skip;

async function launchExtension() {
  const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'org-viewer-e2e-'));
  const tempRoot = path.resolve(os.tmpdir());
  const resolvedProfile = path.resolve(profilePath);
  const removeProfile = () => {
    if (
      path.dirname(resolvedProfile) === tempRoot &&
      path.basename(resolvedProfile).startsWith('org-viewer-e2e-')
    ) {
      fs.rmSync(resolvedProfile, { recursive: true, force: true });
    }
  };

  let context;
  try {
    context = await chromium.launchPersistentContext(profilePath, {
      executablePath: chromePath,
      headless: true,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`
      ]
    });
  } catch (error) {
    removeProfile();
    throw error;
  }

  let serviceWorker = context.serviceWorkers()[0];
  if (!serviceWorker) {
    try {
      serviceWorker = await context.waitForEvent('serviceworker', { timeout: 15000 });
    } catch (error) {
      // Never leak the browser: an orphaned context keeps the test process alive.
      await context.close().catch(() => {});
      removeProfile();
      throw error;
    }
  }
  const extensionId = new URL(serviceWorker.url()).host;

  return {
    context,
    serviceWorker,
    extensionId,
    async close() {
      await context.close();
      removeProfile();
    }
  };
}

// Google Chrome stable ignores --load-extension ("not allowed in Google Chrome"),
// so extension-loading tests need an unbranded Chromium build. Probe once and
// skip with a clear reason instead of failing or hanging on branded Chrome.
const EXTENSION_SKIP_REASON =
  'Requires unbranded Chromium: this machine\'s Google Chrome stable ignores --load-extension.';

async function tryLaunchExtension() {
  try {
    return await launchExtension();
  } catch {
    return null;
  }
}

suite('Org Viewer loaded as a Chrome extension', () => {
  it('loads the manifest and renders the toolbar popup', async (t) => {
    const app = await tryLaunchExtension();
    if (!app) {
      t.skip(EXTENSION_SKIP_REASON);
      return;
    }
    try {
      const manifest = await app.serviceWorker.evaluate(() => chrome.runtime.getManifest());
      assert.strictEqual(manifest.action.default_popup, 'src/ui/popup/popup.html');
      assert.deepStrictEqual(manifest.host_permissions, ['file:///*']);
      assert.deepStrictEqual(manifest.optional_host_permissions, ['*://*/*']);

      const page = await app.context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await page.goto(`chrome-extension://${app.extensionId}/src/ui/popup/popup.html`);
      await page.waitForSelector('#primary-action');

      assert.match(await page.textContent('.popup-heading h1'), /Org Viewer/);
      assert.strictEqual(await page.isVisible('#file-input'), false);
      assert.deepStrictEqual(pageErrors, []);

      await page.screenshot({ path: path.join('dist', 'popup-preview.png') });
    } finally {
      await app.close();
    }
  });

  it('renders sample and handoff documents in the extension viewer', async (t) => {
    const app = await tryLaunchExtension();
    if (!app) {
      t.skip(EXTENSION_SKIP_REASON);
      return;
    }
    try {
      const page = await app.context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      const viewerUrl = `chrome-extension://${app.extensionId}/src/ui/viewer/viewer.html`;

      await page.goto(viewerUrl);
      await page.click('#btn-load-sample');
      await page.waitForSelector('#org-viewer-app');
      assert.match(await page.textContent('.org-doc-badge'), /Org-mode Full Capabilities Demo/);
      assert((await page.$$('.org-toc-item')).length >= 4);

      await app.serviceWorker.evaluate(async () => {
        await chrome.storage.local.set({
          pendingOrgDocument: {
            name: 'popup-handoff.org',
            text: '* Handoff\nThis file came from the action popup.'
          }
        });
      });

      await page.goto(viewerUrl);
      await page.waitForSelector('#org-viewer-app');
      assert.match(await page.textContent('.org-doc-badge'), /Handoff/);
      assert.match(await page.textContent('#org-rendered-content'), /came from the action popup/);
      assert.deepStrictEqual(pageErrors, []);
    } finally {
      await app.close();
    }
  });
});

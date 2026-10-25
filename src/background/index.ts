/**
 * Org Viewer Background Service Worker.
 * Handles dynamic script/CSS injection, onboarding navigation, and permission checking.
 */

import { detectDefaultLanguage } from '../utils/i18n.js';
import { isOrgUrl } from '../utils/org.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Use the browser locale and timezone on first install.
    try {
      const initialLang = detectDefaultLanguage();
      await chrome.storage.sync.set({ language: initialLang });
    } catch (e) {
      console.warn('Initial language detection error:', e);
    }

    // Check if file scheme access is enabled
    chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
      if (!isAllowed) {
        // Open welcome onboarding page to guide user
        chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/welcome/welcome.html') });
      }
    });
  }
});

// Listen for messages from content-detector.ts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ORG_DETECTED' && sender.tab?.id != null) {
    const tabId = sender.tab.id;
    injectViewer(tabId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('Failed to inject Org Viewer:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // async response
  }

  if (message.type === 'RENDER_ACTIVE_TAB' && typeof message.tabId === 'number') {
    injectViewer(message.tabId)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('Failed to render active Org tab:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }

  if (message.type === 'CHECK_FILE_ACCESS') {
    chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
      sendResponse({ isAllowed });
    });
    return true;
  }
});

// When optional web access is granted, render matching pages without a permanent
// all-site content script.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !isOrgUrl(tab.url) || tab.url?.startsWith('file:')) {
    return;
  }

  chrome.permissions.contains({ origins: ['*://*/*'] }, (granted) => {
    if (granted) {
      injectViewer(tabId).catch((err) => {
        console.warn('Could not auto-render web Org file:', err);
      });
    }
  });
});

async function injectViewer(tabId: number): Promise<void> {
  const [pageState] = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const pre = document.querySelector('body > pre');
      return {
        alreadyMounted: Boolean((window as any).__ORG_VIEWER_MOUNTED__),
        isPlainText: document.contentType === 'text/plain' ||
          Boolean(pre && document.body.children.length === 1)
      };
    }
  });

  if (pageState?.result?.alreadyMounted) {
    return;
  }
  if (!pageState?.result?.isPlainText) {
    throw new Error('The page is not a plain-text Org document.');
  }

  // Inject CSS stylesheets in order
  await injectStyles(tabId);

  // Inject the renderer execution bundle
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/renderer.js']
  });
}

const INJECTED_STYLES = [
  'src/ui/styles/github-theme.css',
  'src/ui/styles/toc.css',
  'src/ui/styles/print.css',
  'src/ui/styles/phycat-theme.css'
];

// insertCSS receives the stylesheet text verbatim, so the packaged files must be
// BOM-free; build.js strips any BOM from src/**/*.css on every build.
async function injectStyles(tabId: number): Promise<void> {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: INJECTED_STYLES
  });
}

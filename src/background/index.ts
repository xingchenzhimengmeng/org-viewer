/**
 * Org Viewer Background Service Worker.
 * Handles dynamic script/CSS injection, onboarding navigation, and permission checking.
 */

import { detectLanguageByIp } from '../utils/i18n.js';

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Auto-detect country via IP or timezone on first install
    try {
      const initialLang = await detectLanguageByIp();
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

  if (message.type === 'CHECK_FILE_ACCESS') {
    chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
      sendResponse({ isAllowed });
    });
    return true;
  }
});

async function injectViewer(tabId: number): Promise<void> {
  // Inject CSS stylesheets in order
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: [
      'src/ui/styles/github-theme.css',
      'src/ui/styles/toc.css',
      'src/ui/styles/print.css'
    ]
  });

  // Inject the renderer execution bundle
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ['src/content/renderer.js']
  });
}
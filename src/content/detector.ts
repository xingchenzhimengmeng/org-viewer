/**
 * Lightweight detector script (<5KB).
 * Runs at document_idle on file:///* and authorized web URLs.
 * Checks if the current page is an Org-mode plain text document.
 */

(function () {
  // Prevent duplicate runs
  if ((window as any).__ORG_VIEWER_LOADED__) return;

  const pathname = window.location.pathname.toLowerCase();
  if (!pathname.endsWith('.org')) {
    return;
  }

  // Verify that document is plain text or has single pre element
  const isPlainContentType = document.contentType === 'text/plain';
  const pre = document.querySelector('body > pre');
  const isOnlyPre = pre && document.body.children.length === 1;

  if (!isPlainContentType && !isOnlyPre) {
    return;
  }

  (window as any).__ORG_VIEWER_LOADED__ = true;

  const rawText = pre ? pre.textContent || '' : document.body.textContent || '';
  const textBytes = new Blob([rawText]).size;
  const FIVE_MB = 5 * 1024 * 1024;

  if (textBytes > FIVE_MB) {
    // Show large file warning banner
    const banner = document.createElement('div');
    banner.style.cssText =
      'position:fixed;top:0;left:0;right:0;padding:12px 20px;background:#fff8c5;color:#574000;border-bottom:1px solid #d4a72c;font-family:sans-serif;font-size:14px;display:flex;align-items:center;justify-content:space-between;z-index:999999;box-shadow:0 2px 8px rgba(0,0,0,0.1);';
    banner.innerHTML = `
      <span><strong>Org Viewer:</strong> This file is larger than 5MB (${(textBytes / (1024 * 1024)).toFixed(1)} MB). Automatic rendering was paused to preserve browser performance.</span>
      <button id="org-render-anyway-btn" style="background:#0969da;color:#fff;border:none;padding:6px 14px;border-radius:6px;cursor:pointer;font-weight:600;">Render Anyway</button>
    `;
    document.body.prepend(banner);

    document.getElementById('org-render-anyway-btn')?.addEventListener('click', () => {
      banner.remove();
      triggerRenderer();
    });
    return;
  }

  triggerRenderer();

  function triggerRenderer() {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      chrome.runtime.sendMessage({ type: 'ORG_DETECTED' });
    }
  }
})();
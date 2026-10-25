/**
 * Org Viewer In-Place Renderer Bundle.
 * Injected dynamically by the background service worker when an Org file is detected.
 * Delegates all UI construction to the shared shell so every render path matches.
 */

import { mountOrgShell } from '../ui/shell.js';

(async function initRenderer() {
  if ((window as any).__ORG_VIEWER_MOUNTED__) return;

  const pre = document.querySelector('body > pre');
  const isPlainText = document.contentType === 'text/plain' ||
    Boolean(pre && document.body.children.length === 1);
  if (!isPlainText) return;

  const rawText = pre ? pre.textContent || '' : document.body.textContent || '';
  if (!rawText.trim()) return;

  (window as any).__ORG_VIEWER_MOUNTED__ = true;

  let docName = '';
  try {
    docName = decodeURIComponent(window.location.pathname.split('/').pop() || '');
  } catch {
    docName = window.location.pathname.split('/').pop() || '';
  }

  await mountOrgShell({
    rawText,
    docName,
    host: document.body,
    mode: 'in-place',
    persistKey: window.location.href
  });
})();

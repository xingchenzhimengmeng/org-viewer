/**
 * Org Viewer In-Place Renderer Bundle.
 * Injected dynamically by the background service worker when an Org file is detected.
 */

import { compileOrg } from '../parser/compiler.js';
import { getSettings, saveSettings, getSessionDocState, saveSessionDocState } from '../utils/storage.js';
import { t } from '../utils/i18n.js';

(async function initRenderer() {
  // Prevent duplicate mount
  if ((window as any).__ORG_VIEWER_MOUNTED__) return;
  (window as any).__ORG_VIEWER_MOUNTED__ = true;

  const pre = document.querySelector('body > pre');
  const rawText = pre ? pre.textContent || '' : document.body.textContent || '';
  if (!rawText.trim()) return;

  const currentUrl = window.location.href;
  const settings = await getSettings();
  const sessionState = getSessionDocState(currentUrl);

  // Compile Org to HTML and TOC
  const result = compileOrg(rawText);

  // Document Title
  if (result.title) {
    document.title = `${result.title} - Org Viewer`;
  }

  // Create UI Root
  const root = document.createElement('div');
  root.className = 'org-viewer-root';
  root.id = 'org-viewer-app';

  // Apply Theme
  let currentTheme = settings.theme;
  applyTheme(currentTheme);

  // Build Topbar
  const topbar = document.createElement('header');
  topbar.className = 'org-topbar';
  topbar.innerHTML = `
    <div class="org-topbar-left">
      <div class="org-brand">
        <svg class="org-brand-icon" viewBox="0 0 24 24" fill="none" stroke="#6E41A4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Org Viewer</span>
      </div>
      <span class="org-doc-badge" title="${escapeHtml(result.title)}">${escapeHtml(result.title)}</span>
    </div>
    <div class="org-topbar-right">
      <button class="org-btn" id="org-btn-raw" title="Toggle Raw Org source text">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>
        <span id="org-raw-label">${t('rawView')}</span>
      </button>
      <button class="org-btn" id="org-btn-outline" title="Toggle Outline sidebar">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
        <span>${t('outline')}</span>
      </button>
      <button class="org-btn" id="org-btn-fold-all" title="Expand or collapse all sections">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="7 11 12 6 17 11"></polyline><polyline points="7 17 12 12 17 17"></polyline></svg>
        <span id="org-fold-label">${t('collapseAll')}</span>
      </button>
      <button class="org-btn" id="org-btn-theme" title="Switch Theme">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
        <span id="org-theme-label">${formatThemeLabel(currentTheme)}</span>
      </button>
      <button class="org-btn" id="org-btn-print" title="Print document">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        <span>${t('print')}</span>
      </button>
    </div>
  `;

  // Build Layout
  const layout = document.createElement('div');
  layout.className = 'org-layout';

  // Build TOC Sidebar
  const tocSidebar = document.createElement('aside');
  tocSidebar.className = `org-toc-sidebar ${settings.defaultTocExpanded ? '' : 'org-toc-hidden'}`;
  tocSidebar.id = 'org-toc-sidebar';

  let tocHtml = `<div class="org-toc-header">${t('outline')}</div><ul class="org-toc-list">`;
  result.toc.forEach(item => {
    let badge = '';
    if (item.todoState) {
      badge = `<span class="org-toc-badge ${item.isDone ? 'org-todo-done' : 'org-todo-active'}">${escapeHtml(item.todoState)}</span> `;
    }
    tocHtml += `
      <li class="org-toc-item org-toc-level-${item.level}" data-target="${item.id}">
        <a href="#${item.id}" class="org-toc-link" title="${escapeHtml(item.title)}">
          ${badge}<span>${escapeHtml(item.title)}</span>
        </a>
      </li>
    `;
  });
  tocHtml += `</ul>`;
  tocSidebar.innerHTML = tocHtml;

  // Main Rendered Content
  const mainContent = document.createElement('main');
  mainContent.className = 'org-content-container';
  mainContent.id = 'org-rendered-content';
  mainContent.innerHTML = result.html;

  // Raw Content Container (Hidden by default)
  const rawContent = document.createElement('div');
  rawContent.className = 'org-content-container';
  rawContent.id = 'org-raw-content';
  rawContent.style.display = 'none';
  const rawPre = document.createElement('pre');
  rawPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:14px;line-height:1.6;margin:0;';
  rawPre.textContent = rawText;
  rawContent.appendChild(rawPre);

  layout.appendChild(tocSidebar);
  layout.appendChild(mainContent);
  layout.appendChild(rawContent);

  root.appendChild(topbar);
  root.appendChild(layout);

  // Replace document body content safely
  document.body.innerHTML = '';
  document.body.appendChild(root);

  // Restore Fold State
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.org-section'));
  if (sessionState && sessionState.foldedSectionIds) {
    sessionState.foldedSectionIds.forEach(id => {
      const sec = document.getElementById(id);
      if (sec) sec.classList.add('org-folded');
    });
  }

  // Restore Raw view state if saved
  let isRawView = sessionState?.rawView || false;
  if (isRawView) {
    toggleRawView(true);
  }

  // Restore Scroll Position
  if (sessionState && sessionState.scrollY) {
    window.scrollTo({ top: sessionState.scrollY, behavior: 'instant' });
  }

  // Event Listeners

  // 1. Heading Folding
  document.querySelectorAll<HTMLElement>('.org-heading').forEach(heading => {
    heading.addEventListener('click', (e) => {
      // Don't toggle fold if clicking an actual link inside the heading
      if ((e.target as HTMLElement).closest('a')) return;

      const section = heading.closest<HTMLElement>('.org-section');
      if (section) {
        section.classList.toggle('org-folded');
        persistSessionState();
      }
    });
  });

  // 2. Raw / Rendered Toggle
  document.getElementById('org-btn-raw')?.addEventListener('click', () => {
    toggleRawView(!isRawView);
  });

  function toggleRawView(showRaw: boolean) {
    isRawView = showRaw;
    const rawBtn = document.getElementById('org-btn-raw');
    const rawLabel = document.getElementById('org-raw-label');
    if (isRawView) {
      mainContent.style.display = 'none';
      rawContent.style.display = 'block';
      rawBtn?.classList.add('org-btn-active');
      if (rawLabel) rawLabel.textContent = t('renderedView');
    } else {
      rawContent.style.display = 'none';
      mainContent.style.display = 'block';
      rawBtn?.classList.remove('org-btn-active');
      if (rawLabel) rawLabel.textContent = t('rawView');
    }
    persistSessionState();
  }

  // 3. Expand / Collapse All
  let allCollapsed = false;
  document.getElementById('org-btn-fold-all')?.addEventListener('click', () => {
    allCollapsed = !allCollapsed;
    sections.forEach(sec => {
      if (allCollapsed) sec.classList.add('org-folded');
      else sec.classList.remove('org-folded');
    });
    const foldLabel = document.getElementById('org-fold-label');
    if (foldLabel) {
      foldLabel.textContent = allCollapsed ? t('expandAll') : t('collapseAll');
    }
    persistSessionState();
  });

  // 4. Outline Sidebar Toggle
  document.getElementById('org-btn-outline')?.addEventListener('click', () => {
    tocSidebar.classList.toggle('org-toc-hidden');
    saveSettings({ defaultTocExpanded: !tocSidebar.classList.contains('org-toc-hidden') });
  });

  // 5. Theme Switching
  document.getElementById('org-btn-theme')?.addEventListener('click', () => {
    if (currentTheme === 'system') currentTheme = 'light';
    else if (currentTheme === 'light') currentTheme = 'dark';
    else currentTheme = 'system';

    applyTheme(currentTheme);
    const themeLabel = document.getElementById('org-theme-label');
    if (themeLabel) themeLabel.textContent = formatThemeLabel(currentTheme);
    saveSettings({ theme: currentTheme });
  });

  // 6. Print
  document.getElementById('org-btn-print')?.addEventListener('click', () => {
    window.print();
  });

  // 7. TOC link smooth scrolling
  document.querySelectorAll<HTMLAnchorElement>('.org-toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      if (!targetId) return;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        // Expand target section if folded
        let parentSec: HTMLElement | null = targetEl;
        while (parentSec) {
          if (parentSec.classList.contains('org-folded')) {
            parentSec.classList.remove('org-folded');
          }
          parentSec = parentSec.parentElement ? parentSec.parentElement.closest('.org-section') : null;
        }
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });

  // 8. Active TOC item highlight on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        document.querySelectorAll('.org-toc-item').forEach(item => {
          if (item.getAttribute('data-target') === id) {
            item.classList.add('org-toc-active');
          } else {
            item.classList.remove('org-toc-active');
          }
        });
      }
    });
  }, { rootMargin: '-60px 0px -70% 0px' });

  sections.forEach(sec => observer.observe(sec));

  // 9. Session Persistence on Scroll
  let scrollTimeout: number | undefined;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(persistSessionState, 150);
  }, { passive: true });

  function persistSessionState() {
    const foldedIds = Array.from(document.querySelectorAll<HTMLElement>('.org-section.org-folded')).map(s => s.id);
    saveSessionDocState(currentUrl, {
      scrollY: window.scrollY,
      foldedSectionIds: foldedIds,
      rawView: isRawView
    });
  }

  function applyTheme(theme: 'system' | 'light' | 'dark') {
    document.body.classList.remove('org-theme-dark', 'org-theme-light');
    if (theme === 'dark') {
      document.body.classList.add('org-theme-dark');
    } else if (theme === 'light') {
      document.body.classList.add('org-theme-light');
    } else {
      // System
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('org-theme-dark');
      }
    }
  }

  function formatThemeLabel(theme: 'system' | 'light' | 'dark'): string {
    if (theme === 'light') return t('themeLight');
    if (theme === 'dark') return t('themeDark');
    return t('themeSystem');
  }

  function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
})();
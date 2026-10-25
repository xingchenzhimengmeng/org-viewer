/**
 * Shared viewer shell used by every rendering entry point:
 * in-place file:// takeover and the standalone drag/paste viewer page.
 * Builds the toolbar, outline sidebar (with drag-to-resize), and content panes
 * so all paths render the exact same document.
 */

import { compileOrg } from '../parser/compiler.js';
import { getSettings, saveSettings, getSessionDocState, saveSessionDocState } from '../utils/storage.js';
import { t } from '../utils/i18n.js';

export interface ShellOptions {
  rawText: string;
  docName: string;
  host: HTMLElement;
  mode: 'in-place' | 'standalone';
  persistKey: string | null;
  onOpenAnother?: () => void;
}

const SIDEBAR_MIN_PX = 160;
const SIDEBAR_MAX_RATIO = 0.6;

const ICONS: Record<string, string> = {
  open: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line>',
  raw: '<polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline>',
  outline: '<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>',
  fold: '<polyline points="7 11 12 6 17 11"></polyline><polyline points="7 17 12 12 17 17"></polyline>',
  theme: '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="19.78" x2="19.78" y2="20.78"></line>',
  print: '<polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect>'
};

function icon(name: string): string {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatThemeLabel(theme: 'system' | 'light' | 'dark' | 'phycat'): string {
  if (theme === 'light') return t('themeLight');
  if (theme === 'dark') return t('themeDark');
  if (theme === 'phycat') return t('themePhycat');
  return t('themeSystem');
}

function applyTheme(theme: 'system' | 'light' | 'dark' | 'phycat'): void {
  document.body.classList.remove('org-theme-dark', 'org-theme-light', 'org-theme-phycat');
  if (theme === 'phycat') {
    // The phycat stylesheet picks its light/dark variant from the system scheme.
    document.body.classList.add('org-theme-phycat');
    return;
  }
  if (theme === 'dark') {
    document.body.classList.add('org-theme-dark');
  } else if (theme === 'light') {
    document.body.classList.add('org-theme-light');
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.body.classList.add('org-theme-dark');
  }
}

function sidebarMaxPx(): number {
  return Math.max(SIDEBAR_MIN_PX, Math.floor(window.innerWidth * SIDEBAR_MAX_RATIO));
}

// Relative or missing image sources (common in the standalone viewer) become a
// labelled placeholder instead of a broken image glyph.
function markBrokenImages(scope: HTMLElement): void {
  scope.querySelectorAll('img').forEach((img) => {
    img.addEventListener('error', () => {
      const src = img.getAttribute('src') || '';
      let name = src;
      try {
        name = decodeURIComponent(src.split('/').pop() || src);
      } catch {
        name = src;
      }
      const placeholder = document.createElement('span');
      placeholder.className = 'org-image-missing';
      placeholder.title = src;
      placeholder.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<line x1="2" y1="2" x2="22" y2="22"></line>' +
        '<path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"></path>' +
        '<line x1="13.5" y1="13.5" x2="6" y2="21"></line>' +
        '<line x1="18" y1="12" x2="21" y2="15"></line>' +
        '<path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59"></path>' +
        '</svg>';
      const label = document.createElement('span');
      label.textContent = name;
      placeholder.appendChild(label);
      img.replaceWith(placeholder);
    }, { once: true });
  });
}

function clampSidebarWidth(px: number): number {
  return Math.min(sidebarMaxPx(), Math.max(SIDEBAR_MIN_PX, Math.round(px)));
}

function setSidebarWidth(px: number): void {
  document.documentElement.style.setProperty('--org-sidebar-width', `${px}px`);
}

function resetSidebarWidth(): void {
  document.documentElement.style.removeProperty('--org-sidebar-width');
}

function initSidebarResizer(resizer: HTMLElement, tocSidebar: HTMLElement, savedWidth: number): void {
  if (savedWidth > 0) {
    setSidebarWidth(clampSidebarWidth(savedWidth));
  }

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  const currentWidth = () => tocSidebar.getBoundingClientRect().width;

  resizer.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    dragging = true;
    startX = event.clientX;
    startWidth = currentWidth();
    resizer.setPointerCapture(event.pointerId);
    resizer.classList.add('org-resizer-active');
    document.body.classList.add('org-resizing');
    event.preventDefault();
  });

  resizer.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    setSidebarWidth(clampSidebarWidth(startWidth + (event.clientX - startX)));
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('org-resizer-active');
    document.body.classList.remove('org-resizing');
    void saveSettings({ sidebarWidth: Math.round(currentWidth()) });
  };
  resizer.addEventListener('pointerup', endDrag);
  resizer.addEventListener('pointercancel', endDrag);

  resizer.addEventListener('dblclick', () => {
    resetSidebarWidth();
    void saveSettings({ sidebarWidth: 0 });
  });

  resizer.addEventListener('keydown', (event) => {
    if (event.key === 'Home') {
      event.preventDefault();
      resetSidebarWidth();
      void saveSettings({ sidebarWidth: 0 });
      return;
    }
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const delta = event.key === 'ArrowRight' ? 16 : -16;
    const next = clampSidebarWidth(currentWidth() + delta);
    setSidebarWidth(next);
    void saveSettings({ sidebarWidth: next });
  });

  // Keep a saved pixel width usable when the window shrinks.
  window.addEventListener('resize', () => {
    const inline = document.documentElement.style.getPropertyValue('--org-sidebar-width');
    if (!inline) return;
    const px = parseFloat(inline);
    if (!Number.isFinite(px)) return;
    const clamped = clampSidebarWidth(px);
    if (clamped !== Math.round(px)) setSidebarWidth(clamped);
  });
}

export async function mountOrgShell(options: ShellOptions): Promise<HTMLElement> {
  const settings = await getSettings();
  const sessionState = options.persistKey ? getSessionDocState(options.persistKey) : null;

  const result = compileOrg(options.rawText);
  const docTitle = result.title || options.docName;
  document.title = `${docTitle} - Org Viewer`;
  document.body.classList.add('org-viewer-mounted');

  const root = document.createElement('div');
  root.className = 'org-viewer-root';
  root.id = 'org-viewer-app';

  let currentTheme = settings.theme;
  applyTheme(currentTheme);

  const openAnotherButton = options.mode === 'standalone'
    ? `<button class="org-btn" id="btn-open-another" title="${escapeHtml(t('openFile'))}">${icon('open')}<span>${escapeHtml(t('openFile'))}</span></button>`
    : '';

  const topbar = document.createElement('header');
  topbar.className = 'org-topbar';
  topbar.innerHTML = `
    <div class="org-topbar-left">
      <div class="org-brand">
        <svg class="org-brand-icon" viewBox="0 0 24 24" fill="none" stroke="#6E41A4" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <span>Org Viewer</span>
      </div>
      <span class="org-doc-badge" title="${escapeHtml(docTitle)}">${escapeHtml(docTitle)}</span>
    </div>
    <div class="org-topbar-right">
      ${openAnotherButton}
      <button class="org-btn" id="org-btn-raw" title="${escapeHtml(t('rawView'))}">
        ${icon('raw')}
        <span id="org-raw-label">${escapeHtml(t('rawView'))}</span>
      </button>
      <button class="org-btn" id="org-btn-outline" title="${escapeHtml(t('outline'))}">
        ${icon('outline')}
        <span>${escapeHtml(t('outline'))}</span>
      </button>
      <button class="org-btn" id="org-btn-fold-all" title="${escapeHtml(t('collapseAll'))}">
        ${icon('fold')}
        <span id="org-fold-label">${escapeHtml(t('collapseAll'))}</span>
      </button>
      <button class="org-btn" id="org-btn-theme" title="${escapeHtml(t('themeSystem'))}">
        ${icon('theme')}
        <span id="org-theme-label">${escapeHtml(formatThemeLabel(currentTheme))}</span>
      </button>
      <button class="org-btn" id="org-btn-print" title="${escapeHtml(t('print'))}">
        ${icon('print')}
        <span>${escapeHtml(t('print'))}</span>
      </button>
    </div>
  `;

  const layout = document.createElement('div');
  layout.className = 'org-layout';

  const tocSidebar = document.createElement('aside');
  tocSidebar.className = `org-toc-sidebar ${settings.defaultTocExpanded ? '' : 'org-toc-hidden'}`;
  tocSidebar.id = 'org-toc-sidebar';

  let tocHtml = `<div class="org-toc-header">${escapeHtml(t('outline'))}</div><ul class="org-toc-list">`;
  result.toc.forEach(item => {
    const badge = item.todoState
      ? `<span class="org-toc-badge ${item.isDone ? 'org-todo-done' : 'org-todo-active'}">${escapeHtml(item.todoState)}</span>`
      : '';
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

  const resizer = document.createElement('div');
  resizer.className = 'org-sidebar-resizer';
  resizer.setAttribute('role', 'separator');
  resizer.setAttribute('aria-orientation', 'vertical');
  resizer.setAttribute('tabindex', '0');
  resizer.title = t('resizeOutline');
  resizer.setAttribute('aria-label', t('resizeOutline'));

  const mainContent = document.createElement('main');
  mainContent.className = 'org-content-container';
  mainContent.id = 'org-rendered-content';
  mainContent.innerHTML = result.html;
  markBrokenImages(mainContent);

  const rawContent = document.createElement('div');
  rawContent.className = 'org-content-container';
  rawContent.id = 'org-raw-content';
  rawContent.style.display = 'none';
  const rawPre = document.createElement('pre');
  rawPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:14px;line-height:1.6;margin:0;';
  rawPre.textContent = options.rawText;
  rawContent.appendChild(rawPre);

  layout.appendChild(tocSidebar);
  layout.appendChild(resizer);
  layout.appendChild(mainContent);
  layout.appendChild(rawContent);

  root.appendChild(topbar);
  root.appendChild(layout);

  options.host.innerHTML = '';
  options.host.appendChild(root);

  initSidebarResizer(resizer, tocSidebar, settings.sidebarWidth);

  const sections = Array.from(document.querySelectorAll<HTMLElement>('.org-section'));

  // In overlay mode (narrow windows) the panel would cover the article,
  // so start closed there regardless of the desktop preference.
  const overlayMode = () => window.matchMedia('(max-width: 960px)').matches;
  if (overlayMode()) {
    tocSidebar.classList.add('org-toc-hidden');
  }

  if (sessionState && sessionState.foldedSectionIds) {
    sessionState.foldedSectionIds.forEach(id => {
      const sec = document.getElementById(id);
      if (sec) sec.classList.add('org-folded');
    });
  }

  function persistSessionState(): void {
    if (!options.persistKey) return;
    const foldedIds = Array.from(document.querySelectorAll<HTMLElement>('.org-section.org-folded')).map(s => s.id);
    saveSessionDocState(options.persistKey, {
      scrollY: window.scrollY,
      foldedSectionIds: foldedIds,
      rawView: isRawView
    });
  }

  // 1. Heading folding
  document.querySelectorAll<HTMLElement>('.org-heading').forEach(heading => {
    heading.addEventListener('click', (event) => {
      if ((event.target as HTMLElement).closest('a')) return;
      const section = heading.closest<HTMLElement>('.org-section');
      if (section) {
        section.classList.toggle('org-folded');
        persistSessionState();
      }
    });
  });

  // 2. Raw / rendered toggle
  let isRawView = false;
  function toggleRawView(showRaw: boolean): void {
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
  document.getElementById('org-btn-raw')?.addEventListener('click', () => {
    toggleRawView(!isRawView);
  });
  if (sessionState?.rawView) {
    toggleRawView(true);
  }

  // 3. Expand / collapse all
  let allCollapsed = false;
  document.getElementById('org-btn-fold-all')?.addEventListener('click', () => {
    allCollapsed = !allCollapsed;
    sections.forEach(sec => {
      if (allCollapsed) sec.classList.add('org-folded');
      else sec.classList.remove('org-folded');
    });
    const foldLabel = document.getElementById('org-fold-label');
    if (foldLabel) foldLabel.textContent = allCollapsed ? t('expandAll') : t('collapseAll');
    persistSessionState();
  });

  // 4. Outline sidebar toggle
  document.getElementById('org-btn-outline')?.addEventListener('click', () => {
    tocSidebar.classList.toggle('org-toc-hidden');
    void saveSettings({ defaultTocExpanded: !tocSidebar.classList.contains('org-toc-hidden') });
  });

  // 5. Theme switching
  document.getElementById('org-btn-theme')?.addEventListener('click', () => {
    if (currentTheme === 'system') currentTheme = 'light';
    else if (currentTheme === 'light') currentTheme = 'dark';
    else if (currentTheme === 'dark') currentTheme = 'phycat';
    else currentTheme = 'system';
    applyTheme(currentTheme);
    const themeLabel = document.getElementById('org-theme-label');
    if (themeLabel) themeLabel.textContent = formatThemeLabel(currentTheme);
    void saveSettings({ theme: currentTheme });
  });

  // 6. Print
  document.getElementById('org-btn-print')?.addEventListener('click', () => {
    window.print();
  });

  // 7. Standalone: return to the drop/paste workspace
  if (options.onOpenAnother) {
    document.getElementById('btn-open-another')?.addEventListener('click', options.onOpenAnother);
  }

  // 8. TOC link smooth scrolling
  document.querySelectorAll<HTMLAnchorElement>('.org-toc-link').forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetId = link.getAttribute('href')?.slice(1);
      if (!targetId) return;
      const targetEl = document.getElementById(targetId);
      if (!targetEl) return;
      let parentSec: HTMLElement | null = targetEl;
      while (parentSec) {
        if (parentSec.classList.contains('org-folded')) {
          parentSec.classList.remove('org-folded');
        }
        parentSec = parentSec.parentElement ? parentSec.parentElement.closest('.org-section') : null;
      }
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (overlayMode()) {
        tocSidebar.classList.add('org-toc-hidden');
      }
      if (options.mode === 'in-place') {
        history.pushState(null, '', `#${targetId}`);
      }
    });
  });

  // 9. Active TOC item highlight on scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      document.querySelectorAll('.org-toc-item').forEach(item => {
        if (item.getAttribute('data-target') === id) {
          item.classList.add('org-toc-active');
        } else {
          item.classList.remove('org-toc-active');
        }
      });
    });
  }, { rootMargin: '-60px 0px -70% 0px' });
  sections.forEach(sec => observer.observe(sec));

  // 10. Session persistence on scroll
  let scrollTimeout: number | undefined;
  window.addEventListener('scroll', () => {
    clearTimeout(scrollTimeout);
    scrollTimeout = window.setTimeout(persistSessionState, 150);
  }, { passive: true });

  if (sessionState && sessionState.scrollY) {
    window.scrollTo(0, sessionState.scrollY);
  }

  return root;
}

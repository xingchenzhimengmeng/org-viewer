/**
 * Standalone & Popup Viewer Controller.
 */
import { compileOrg } from '../../parser/compiler.js';
import { getSettings, saveSettings } from '../../utils/storage.js';
import { t, setActiveLanguage } from '../../utils/i18n.js';
const dropScreen = document.getElementById('drop-screen');
const dropCard = document.querySelector('.drop-card');
const fileInput = document.getElementById('file-input');
const pasteInput = document.getElementById('paste-input');
const viewerContainer = document.getElementById('viewer-container');
// Initialize language on startup
getSettings().then(settings => {
    setActiveLanguage(settings.language);
    applyDropzoneI18n(settings.language);
});
function applyDropzoneI18n(lang) {
    const title = document.querySelector('.drop-title');
    if (title)
        title.textContent = t('dropzoneTitle');
    const subtitle = document.querySelector('.drop-subtitle');
    if (subtitle)
        subtitle.textContent = t('dropzoneSubtitle');
    const chooseBtn = document.querySelector('.file-btn span');
    if (chooseBtn)
        chooseBtn.textContent = t('chooseFile');
    const sampleBtn = document.getElementById('btn-load-sample');
    if (sampleBtn)
        sampleBtn.textContent = lang === 'zh_CN' ? '载入示例' : 'Load Sample';
    const divider = document.querySelector('.divider span');
    if (divider)
        divider.textContent = t('orPasteText');
    if (pasteInput)
        pasteInput.placeholder = t('pastePlaceholder');
    const renderBtn = document.getElementById('btn-render-paste');
    if (renderBtn)
        renderBtn.textContent = t('renderButton');
}
function getSettingsLang() {
    try {
        return document.documentElement.lang || 'en';
    }
    catch {
        return 'en';
    }
}
// Drag and drop handlers
['dragenter', 'dragover'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropCard.classList.add('drag-over');
    });
});
['dragleave', 'drop'].forEach(eventName => {
    window.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropCard.classList.remove('drag-over');
    });
});
window.addEventListener('drop', (e) => {
    e.preventDefault();
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
        loadFile(files[0]);
    }
});
fileInput.addEventListener('change', () => {
    if (fileInput.files && fileInput.files.length > 0) {
        loadFile(fileInput.files[0]);
    }
});
document.getElementById('btn-render-paste')?.addEventListener('click', () => {
    const text = pasteInput.value;
    if (text.trim()) {
        renderDocument(text, 'Pasted Document');
    }
});
document.getElementById('btn-load-sample')?.addEventListener('click', () => {
    const sample = `#+TITLE: Org-mode Full Capabilities Demo
#+AUTHOR: Org Viewer Team
#+DATE: 2026-10-24
#+TODO: TODO NEXT IN-PROGRESS WAITING | DONE CANCELLED

* Getting Started with Org Viewer
Welcome! This viewer turns plain-text *.org* files into styled, modern web articles with outline navigation.

** Features Included
- *Bold*, /italic/, _underlined_, and ~inline code~ styling
- Mathematical formulas: $E = mc^2$ and $$\\int_0^\\infty e^{-x} dx = 1$$
- Automated Table of Contents with section folding
- Syntax highlighting for 10+ programming languages
- Todo state badges and priority markers

* Project Management
** TODO [#A] Master Org-mode syntax :workflow:urgent:
SCHEDULED: <2026-10-24 Sat>
- [X] Download and test Org Viewer
- [ ] Organize notes into projects
- [ ] Connect with Emacs or use standalone

** IN-PROGRESS [#B] Write technical documentation :docs:
DEADLINE: <2026-10-28 Wed>
#+BEGIN_SRC python
def greet(name: str) -> str:
    """Return a warm greeting message."""
    return f"Hello, {name}! Welcome to Org Viewer."

print(greet("Emacs Enthusiast"))
#+END_SRC

** DONE Tables & Checklists :feature:
| Milestone | Target Date | Status      |
|-----------+-------------+-------------|
| Alpha     | 2026-10-01  | Completed   |
| Beta      | 2026-10-15  | Completed   |
| Release   | 2026-10-24  | Launching   |

* Footnotes Example
This document has a footnote reference[fn:1].

[fn:1] Bidirectional footnotes are rendered at the bottom!
`;
    renderDocument(sample, 'Org-mode Full Capabilities Demo');
});
function loadFile(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target?.result || '';
        renderDocument(text, file.name);
    };
    reader.readAsText(file);
}
async function renderDocument(orgText, filename) {
    const settings = await getSettings();
    setActiveLanguage(settings.language);
    const result = compileOrg(orgText);
    document.title = `${result.title || filename} - Org Viewer`;
    // Hide drop screen and show viewer container
    dropScreen.style.display = 'none';
    viewerContainer.style.display = 'block';
    viewerContainer.innerHTML = '';
    const root = document.createElement('div');
    root.className = 'org-viewer-root';
    root.id = 'org-viewer-app';
    let currentTheme = settings.theme;
    applyTheme(currentTheme);
    // Topbar
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
        </svg>
        <span>Org Viewer</span>
      </div>
      <span class="org-doc-badge">${escapeHtml(result.title || filename)}</span>
    </div>
    <div class="org-topbar-right">
      <button class="org-btn" id="btn-open-another" title="Open another file">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
        <span>${t('openFile')}</span>
      </button>
      <button class="org-btn" id="org-btn-raw" title="Toggle Raw Org source text">
        <span id="org-raw-label">${t('rawView')}</span>
      </button>
      <button class="org-btn" id="org-btn-outline" title="Toggle Outline sidebar">
        <span>${t('outline')}</span>
      </button>
      <button class="org-btn" id="org-btn-fold-all" title="Expand or collapse all sections">
        <span id="org-fold-label">${t('collapseAll')}</span>
      </button>
      <button class="org-btn" id="org-btn-theme" title="Switch Theme">
        <span id="org-theme-label">${formatThemeLabel(currentTheme)}</span>
      </button>
      <button class="org-btn" id="org-btn-print" title="Print document">
        <span>${t('print')}</span>
      </button>
    </div>
  `;
    // Layout & Sidebar
    const layout = document.createElement('div');
    layout.className = 'org-layout';
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
        <a href="#${item.id}" class="org-toc-link">
          ${badge}<span>${escapeHtml(item.title)}</span>
        </a>
      </li>
    `;
    });
    tocHtml += `</ul>`;
    tocSidebar.innerHTML = tocHtml;
    const mainContent = document.createElement('main');
    mainContent.className = 'org-content-container';
    mainContent.id = 'org-rendered-content';
    mainContent.innerHTML = result.html;
    const rawContent = document.createElement('div');
    rawContent.className = 'org-content-container';
    rawContent.id = 'org-raw-content';
    rawContent.style.display = 'none';
    const rawPre = document.createElement('pre');
    rawPre.style.cssText = 'white-space:pre-wrap;word-break:break-word;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:14px;line-height:1.6;margin:0;';
    rawPre.textContent = orgText;
    rawContent.appendChild(rawPre);
    layout.appendChild(tocSidebar);
    layout.appendChild(mainContent);
    layout.appendChild(rawContent);
    root.appendChild(topbar);
    root.appendChild(layout);
    viewerContainer.appendChild(root);
    // Wire up handlers
    document.getElementById('btn-open-another')?.addEventListener('click', () => {
        viewerContainer.style.display = 'none';
        dropScreen.style.display = 'flex';
    });
    let isRawView = false;
    document.getElementById('org-btn-raw')?.addEventListener('click', () => {
        isRawView = !isRawView;
        const rawLabel = document.getElementById('org-raw-label');
        if (isRawView) {
            mainContent.style.display = 'none';
            rawContent.style.display = 'block';
            if (rawLabel)
                rawLabel.textContent = t('renderedView');
        }
        else {
            rawContent.style.display = 'none';
            mainContent.style.display = 'block';
            if (rawLabel)
                rawLabel.textContent = t('rawView');
        }
    });
    const sections = Array.from(document.querySelectorAll('.org-section'));
    document.querySelectorAll('.org-heading').forEach(heading => {
        heading.addEventListener('click', (e) => {
            if (e.target.closest('a'))
                return;
            const sec = heading.closest('.org-section');
            if (sec)
                sec.classList.toggle('org-folded');
        });
    });
    let allCollapsed = false;
    document.getElementById('org-btn-fold-all')?.addEventListener('click', () => {
        allCollapsed = !allCollapsed;
        sections.forEach(sec => {
            if (allCollapsed)
                sec.classList.add('org-folded');
            else
                sec.classList.remove('org-folded');
        });
        const foldLabel = document.getElementById('org-fold-label');
        if (foldLabel)
            foldLabel.textContent = allCollapsed ? t('expandAll') : t('collapseAll');
    });
    document.getElementById('org-btn-outline')?.addEventListener('click', () => {
        tocSidebar.classList.toggle('org-toc-hidden');
    });
    document.getElementById('org-btn-theme')?.addEventListener('click', () => {
        if (currentTheme === 'system')
            currentTheme = 'light';
        else if (currentTheme === 'light')
            currentTheme = 'dark';
        else
            currentTheme = 'system';
        applyTheme(currentTheme);
        const themeLabel = document.getElementById('org-theme-label');
        if (themeLabel)
            themeLabel.textContent = formatThemeLabel(currentTheme);
        saveSettings({ theme: currentTheme });
    });
    document.getElementById('org-btn-print')?.addEventListener('click', () => {
        window.print();
    });
    document.querySelectorAll('.org-toc-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href')?.slice(1);
            if (!targetId)
                return;
            const targetEl = document.getElementById(targetId);
            if (targetEl) {
                let parentSec = targetEl;
                while (parentSec) {
                    if (parentSec.classList.contains('org-folded'))
                        parentSec.classList.remove('org-folded');
                    parentSec = parentSec.parentElement ? parentSec.parentElement.closest('.org-section') : null;
                }
                targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    function applyTheme(theme) {
        document.body.classList.remove('org-theme-dark', 'org-theme-light');
        if (theme === 'dark')
            document.body.classList.add('org-theme-dark');
        else if (theme === 'light')
            document.body.classList.add('org-theme-light');
        else {
            const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
            if (prefersDark)
                document.body.classList.add('org-theme-dark');
        }
    }
    function formatThemeLabel(theme) {
        if (theme === 'light')
            return t('themeLight');
        if (theme === 'dark')
            return t('themeDark');
        return t('themeSystem');
    }
    function escapeHtml(text) {
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

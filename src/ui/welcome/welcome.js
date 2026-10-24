/**
 * Welcome Page Controller with multi-language support.
 */
import { getSettings } from '../../utils/storage.js';
import { t, setActiveLanguage } from '../../utils/i18n.js';
const SAMPLE_ORG_CONTENT = `#+TITLE: Org Viewer Sample Document
#+AUTHOR: Org Viewer Team
#+DATE: 2026-10-24
#+TODO: TODO NEXT WAITING | DONE CANCELLED

* Welcome to Org-mode in Chrome
This document demonstrates the core parsing and styling capabilities of *Org Viewer*.

** Features at a Glance
- Full *bold*, /italic/, _underline_, +strikethrough+, and ~inline code~ support.
- Mathematical expressions: $E = mc^2$ and \\( \\sum_{i=1}^n i = \\frac{n(n+1)}{2} \\)
- Automated outline and table of contents generation.
- Interactive section folding and unfolding.
- Complete offline privacy and security.

* Tasks and Projects
** TODO [#A] Try opening a local .org file :getting_started:
SCHEDULED: <2026-10-24 Sat>
- [X] Install Org Viewer extension
- [ ] Enable "Allow access to file URLs" in chrome://extensions
- [ ] Drag this sample file into Chrome

** NEXT [#B] Explore code block syntax highlighting :developer:
#+BEGIN_SRC typescript
interface Note {
  title: string;
  tags: string[];
  isDone: boolean;
}

function renderNote(note: Note): string {
  return \`[\${note.isDone ? 'DONE' : 'TODO'}] \${note.title}\`;
}
#+END_SRC

** DONE Review sample tables :feature:
| Feature       | Status     | Notes                   |
|---------------+------------+-------------------------|
| Tables        | Supported  | With headers & stripes  |
| Checkboxes    | Supported  | [X] Done, [ ] Pending   |
| Syntax Colors | High-res   | Highlight.js compatible |

* Footnotes Example
Org Viewer supports bidirectional footnotes[fn:1]!

[fn:1] Footnotes are automatically linked and collected at the bottom of the document.
`;
let currentLang = 'en';
let isFileAccessGranted = false;
function applyI18n(lang) {
    currentLang = lang;
    setActiveLanguage(lang);
    document.title = t('welcomeTitle', lang);
    const title = document.querySelector('.welcome-title');
    if (title)
        title.textContent = t('welcomeTitle', lang);
    const subtitle = document.querySelector('.welcome-subtitle');
    if (subtitle) {
        subtitle.textContent = lang === 'zh_CN'
            ? '在 Google Chrome 中直接将 .org 纯文本优雅渲染为现代化网页。'
            : 'A modern, beautiful, and secure Org-mode previewer directly inside Google Chrome.';
    }
    // Step 1
    const step1Title = document.querySelector('#card-file-access h2');
    if (step1Title)
        step1Title.textContent = t('welcomeStep1', lang);
    const step1Desc = document.querySelector('#card-file-access p');
    if (step1Desc)
        step1Desc.textContent = t('welcomeStep1Desc', lang);
    const btnOpen = document.getElementById('btn-open-extensions');
    if (btnOpen)
        btnOpen.textContent = t('welcomeStep1Action', lang);
    const instructions = document.querySelector('.instruction-box ol');
    if (instructions) {
        if (lang === 'zh_CN') {
            instructions.innerHTML = `
        <li>点击上方按钮（或在地址栏输入 <code>chrome://extensions</code>）。</li>
        <li>找到 <strong>Org Viewer</strong> 并点击 <strong>详细信息</strong>。</li>
        <li>向下滑动，找到并打开 <strong>「允许访问文件网址」</strong> 开关。</li>
      `;
        }
        else {
            instructions.innerHTML = `
        <li>Click the button above (or navigate to <code>chrome://extensions</code>).</li>
        <li>Find <strong>Org Viewer</strong> and click <strong>Details</strong>.</li>
        <li>Scroll down and toggle ON <strong>"Allow access to file URLs"</strong>.</li>
      `;
        }
    }
    // Step 2
    const step2Title = document.querySelectorAll('.welcome-card h2')[1];
    if (step2Title)
        step2Title.textContent = t('welcomeStep2', lang);
    const step2Desc = document.querySelectorAll('.welcome-card p')[1];
    if (step2Desc)
        step2Desc.textContent = t('welcomeStep2Desc', lang);
    const btnDownload = document.getElementById('btn-download-sample');
    if (btnDownload)
        btnDownload.textContent = t('sampleDownload', lang);
    const btnOpenViewer = document.querySelector('.welcome-card a.btn-secondary');
    if (btnOpenViewer) {
        btnOpenViewer.textContent = lang === 'zh_CN' ? '打开拖拽预览页' : 'Open Drag & Drop Viewer';
    }
    updateStatusBox();
}
function updateStatusBox() {
    const statusEl = document.getElementById('file-access-status');
    const textEl = document.getElementById('file-access-text');
    const indicator = statusEl?.querySelector('.status-indicator');
    if (isFileAccessGranted) {
        if (indicator)
            indicator.className = 'status-indicator granted';
        if (textEl) {
            textEl.textContent = currentLang === 'zh_CN'
                ? '本地文件访问权限：已开启！您现在可以直接双击或拖拽 .org 文件。'
                : 'Local file access is ENABLED! You can now view .org files in Chrome.';
        }
    }
    else {
        if (indicator)
            indicator.className = 'status-indicator missing';
        if (textEl) {
            textEl.textContent = currentLang === 'zh_CN'
                ? '本地文件访问权限：未开启。请按照下方说明开启开关。'
                : 'Local file access is DISABLED. Please enable it in extension settings.';
        }
    }
}
function checkPermission() {
    if (typeof chrome !== 'undefined' && chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
            isFileAccessGranted = isAllowed;
            updateStatusBox();
        });
    }
    else {
        // When previewed outside extension runtime (e.g. localhost test server)
        const textEl = document.getElementById('file-access-text');
        if (textEl) {
            textEl.textContent = currentLang === 'zh_CN'
                ? '提示：在 Chrome 扩展中加载后将自动实时检测权限。'
                : 'Tip: Permission status will be automatically verified when running as an unpacked extension.';
        }
    }
}
getSettings().then(settings => {
    applyI18n(settings.language);
    checkPermission();
});
document.getElementById('btn-open-extensions')?.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
        const extId = chrome.runtime.id;
        chrome.tabs.create({ url: `chrome://extensions/?id=${extId}` });
    }
});
document.getElementById('btn-download-sample')?.addEventListener('click', () => {
    const blob = new Blob([SAMPLE_ORG_CONTENT], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_document.org';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
});
setInterval(checkPermission, 1500);

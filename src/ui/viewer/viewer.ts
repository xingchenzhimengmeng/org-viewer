/**
 * Standalone & Popup Viewer Controller.
 * Handles the drop/paste workspace; rendering itself is delegated to the
 * shared shell so this page matches the in-place file:// rendering exactly.
 */

import { getSettings } from '../../utils/storage.js';
import { t, setActiveLanguage } from '../../utils/i18n.js';
import { mountOrgShell } from '../../ui/shell.js';
import { isOrgFilename, PENDING_ORG_DOCUMENT_KEY, type PendingOrgDocument } from '../../utils/org.js';

const dropScreen = document.getElementById('drop-screen') as HTMLElement;
const dropCard = document.querySelector('.drop-card') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const pasteInput = document.getElementById('paste-input') as HTMLTextAreaElement;
const viewerContainer = document.getElementById('viewer-container') as HTMLElement;
const fileError = document.getElementById('file-error') as HTMLElement;

async function initializeViewer(): Promise<void> {
  const settings = await getSettings();
  setActiveLanguage(settings.language);
  applyDropzoneI18n(settings.language);
  await restorePendingDocument();
}

function applyDropzoneI18n(lang: string) {
  const title = document.querySelector('.drop-title');
  if (title) title.textContent = t('dropzoneTitle');

  const subtitle = document.querySelector('.drop-subtitle');
  if (subtitle) subtitle.textContent = t('dropzoneSubtitle');

  const chooseBtn = document.querySelector('.file-btn span');
  if (chooseBtn) chooseBtn.textContent = t('chooseFile');

  const sampleBtn = document.getElementById('btn-load-sample');
  if (sampleBtn) sampleBtn.textContent = lang === 'zh_CN' ? '载入示例' : 'Load Sample';

  const divider = document.querySelector('.divider span');
  if (divider) divider.textContent = t('orPasteText');

  if (pasteInput) pasteInput.placeholder = t('pastePlaceholder');

  const renderBtn = document.getElementById('btn-render-paste');
  if (renderBtn) renderBtn.textContent = t('renderButton');
}

function showFileError(message: string): void {
  fileError.textContent = message;
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
    void loadFile(files[0]);
  }
});

fileInput.addEventListener('change', () => {
  if (fileInput.files && fileInput.files.length > 0) {
    void loadFile(fileInput.files[0]);
  }
});

document.getElementById('btn-render-paste')?.addEventListener('click', () => {
  const text = pasteInput.value;
  if (text.trim()) {
    void renderDocument(text, 'Pasted Document');
  }
});

document.getElementById('btn-load-sample')?.addEventListener('click', () => {
  renderDocument(buildSampleDocument(), 'Org-mode Full Capabilities Demo');
});

function buildSampleDocument(): string {
  return `#+TITLE: Org-mode Full Capabilities Demo
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
}

async function loadFile(file: File): Promise<void> {
  if (!isOrgFilename(file.name)) {
    showFileError(t('popupOnlyOrg'));
    fileInput.value = '';
    return;
  }

  showFileError('');
  try {
    await renderDocument(await file.text(), file.name);
  } catch (error) {
    showFileError(error instanceof Error ? error.message : String(error));
  }
}

async function restorePendingDocument(): Promise<void> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;

  try {
    const stored = await chrome.storage.local.get(PENDING_ORG_DOCUMENT_KEY);
    const pending = stored[PENDING_ORG_DOCUMENT_KEY] as PendingOrgDocument | undefined;
    if (!pending) return;

    await chrome.storage.local.remove(PENDING_ORG_DOCUMENT_KEY);
    if (isOrgFilename(pending.name) && pending.text.trim()) {
      await renderDocument(pending.text, pending.name);
    }
  } catch (error) {
    console.warn('Could not restore the selected Org document:', error);
  }
}

async function renderDocument(orgText: string, filename: string): Promise<void> {
  const settings = await getSettings();
  setActiveLanguage(settings.language);
  showFileError('');

  dropScreen.style.display = 'none';
  viewerContainer.style.display = 'block';

  await mountOrgShell({
    rawText: orgText,
    docName: filename,
    host: viewerContainer,
    mode: 'standalone',
    persistKey: null,
    onOpenAnother: () => {
      viewerContainer.style.display = 'none';
      viewerContainer.innerHTML = '';
      dropScreen.style.display = 'flex';
    }
  });
}

void initializeViewer();

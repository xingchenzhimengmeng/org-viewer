import { getSettings } from '../../utils/storage.js';
import { setActiveLanguage, t } from '../../utils/i18n.js';
import {
  isOrgFilename,
  isOrgUrl,
  PENDING_ORG_DOCUMENT_KEY,
  type PendingOrgDocument
} from '../../utils/org.js';

const currentDocument = document.getElementById('current-document') as HTMLElement;
const primaryAction = document.getElementById('primary-action') as HTMLButtonElement;
const primaryLabel = document.getElementById('primary-label') as HTMLElement;
const chooseLabel = document.getElementById('choose-label') as HTMLElement;
const viewerLabel = document.getElementById('viewer-label') as HTMLElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const openViewerButton = document.getElementById('open-viewer') as HTMLButtonElement;
const popupMessage = document.getElementById('popup-message') as HTMLElement;
const accessLabel = document.getElementById('access-label') as HTMLElement;
const accessValue = document.getElementById('access-value') as HTMLElement;
const accessIndicator = document.getElementById('access-indicator') as HTMLElement;
const manageAccess = document.getElementById('manage-access') as HTMLButtonElement;
const openSettings = document.getElementById('open-settings') as HTMLButtonElement;

let activeTab: { id?: number; url?: string; title?: string } | undefined;
let fileAccessAllowed = false;
let currentIsOrg = false;

function showMessage(message: string, isError = false): void {
  popupMessage.textContent = message;
  popupMessage.classList.toggle('is-error', isError);
}

function displayNameFromUrl(rawUrl: string | undefined): string {
  if (!rawUrl) return t('popupReady');

  try {
    const url = new URL(rawUrl);
    const name = decodeURIComponent(url.pathname.split('/').pop() || '');
    return name || t('popupReady');
  } catch {
    return t('popupReady');
  }
}

function updateFileAccessUi(): void {
  accessLabel.textContent = t('popupLocalAccess');
  accessIndicator.classList.toggle('is-enabled', fileAccessAllowed);
  accessIndicator.classList.toggle('is-disabled', !fileAccessAllowed);
  accessValue.textContent = fileAccessAllowed ? t('popupAccessEnabled') : t('popupAccessDisabled');
  manageAccess.textContent = t('popupManageAccess');
}

function updatePrimaryAction(): void {
  if (currentIsOrg && fileAccessAllowed) {
    primaryLabel.textContent = t('popupRenderCurrent');
  } else if (currentIsOrg && activeTab?.url?.startsWith('file:')) {
    primaryLabel.textContent = t('popupEnableAccess');
  } else {
    primaryLabel.textContent = t('popupOpenViewer');
  }
}

function applyI18n(): void {
  chooseLabel.textContent = t('popupChooseOrg');
  viewerLabel.textContent = t('popupOpenViewer');
  document.getElementById('settings-label')!.textContent = t('popupSettings');
  updateFileAccessUi();
  updatePrimaryAction();

  if (currentIsOrg) {
    currentDocument.textContent = displayNameFromUrl(activeTab?.url);
    currentDocument.title = activeTab?.url || '';
  } else {
    currentDocument.textContent = t('popupReady');
    currentDocument.title = '';
  }
}

function openExtensionDetails(): void {
  chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime.id}` });
}

function openViewer(): void {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/viewer/viewer.html') });
  window.close();
}

async function renderCurrentPage(): Promise<void> {
  if (!currentIsOrg || activeTab?.id == null) {
    openViewer();
    return;
  }

  if (activeTab.url?.startsWith('file:') && !fileAccessAllowed) {
    openExtensionDetails();
    return;
  }

  primaryAction.disabled = true;
  primaryLabel.textContent = t('popupRendering');

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'RENDER_ACTIVE_TAB',
      tabId: activeTab.id
    });
    if (!response?.success) {
      throw new Error(response?.error || 'Render failed');
    }
    showMessage(t('popupRenderComplete'));
  } catch (error) {
    showMessage(error instanceof Error ? error.message : String(error), true);
  } finally {
    primaryAction.disabled = false;
    updatePrimaryAction();
  }
}

async function openSelectedFile(file: File): Promise<void> {
  if (!isOrgFilename(file.name)) {
    showMessage(t('popupOnlyOrg'), true);
    fileInput.value = '';
    return;
  }

  try {
    const document: PendingOrgDocument = { name: file.name, text: await file.text() };
    await chrome.storage.local.set({ [PENDING_ORG_DOCUMENT_KEY]: document });
    chrome.tabs.create({ url: chrome.runtime.getURL('src/ui/viewer/viewer.html') });
    window.close();
  } catch (error) {
    showMessage(error instanceof Error ? error.message : String(error), true);
    fileInput.value = '';
  }
}

primaryAction.addEventListener('click', () => {
  if (currentIsOrg && (fileAccessAllowed || !activeTab?.url?.startsWith('file:'))) {
    void renderCurrentPage();
  } else if (currentIsOrg) {
    openExtensionDetails();
  } else {
    openViewer();
  }
});

openViewerButton.addEventListener('click', openViewer);

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) {
    void openSelectedFile(file);
  }
});

manageAccess.addEventListener('click', openExtensionDetails);

openSettings.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
  window.close();
});

async function init(): Promise<void> {
  const [settings, tabs] = await Promise.all([
    getSettings(),
    chrome.tabs.query({ active: true, currentWindow: true })
  ]);

  setActiveLanguage(settings.language);
  activeTab = tabs[0];
  currentIsOrg = isOrgUrl(activeTab?.url);

  fileAccessAllowed = await new Promise<boolean>((resolve) => {
    chrome.extension.isAllowedFileSchemeAccess((allowed) => resolve(allowed));
  });

  applyI18n();
}

void init();

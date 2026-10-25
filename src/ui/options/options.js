/**
 * Options Page Controller with dynamic language switching.
 */
import { getSettings, saveSettings } from '../../utils/storage.js';
import { t, setActiveLanguage } from '../../utils/i18n.js';
const selectLanguage = document.getElementById('select-language');
const selectTheme = document.getElementById('select-theme');
const selectOutline = document.getElementById('select-outline');
const toggleWeb = document.getElementById('toggle-web');
const fileAccessDesc = document.getElementById('file-access-desc');
const saveToast = document.getElementById('save-toast');
let isFileAllowed = false;
function applyI18n(lang) {
    setActiveLanguage(lang);
    document.title = t('optionsTitle', lang);
    document.getElementById('page-title').textContent = t('optionsTitle', lang);
    document.getElementById('page-subtitle').textContent = lang === 'zh_CN'
        ? '自定义语言、主题、大纲默认状态及渲染权限。'
        : 'Customize language, theme, outline defaults, and rendering permissions.';
    document.getElementById('label-language').textContent = t('optionsLanguageLabel', lang);
    document.getElementById('desc-language').textContent = t('optionsLanguageDesc', lang);
    document.getElementById('label-theme').textContent = t('optionsThemeLabel', lang);
    document.getElementById('desc-theme').textContent = lang === 'zh_CN'
        ? '选择渲染文档时的默认视觉外观。'
        : 'Choose the preferred visual appearance for rendered documents.';
    document.getElementById('opt-theme-system').textContent = t('themeSystem', lang);
    document.getElementById('opt-theme-light').textContent = t('themeLight', lang);
    document.getElementById('opt-theme-dark').textContent = t('themeDark', lang);
    document.getElementById('opt-theme-phycat').textContent = t('themePhycat', lang);
    document.getElementById('label-outline').textContent = t('optionsOutlineLabel', lang);
    document.getElementById('desc-outline').textContent = lang === 'zh_CN'
        ? '文档加载时左侧目录大纲栏是否默认展开。'
        : 'Whether the Table of Contents sidebar is open by default when a document loads.';
    document.getElementById('opt-outline-expanded').textContent = t('optionsOutlineExpanded', lang);
    document.getElementById('opt-outline-collapsed').textContent = t('optionsOutlineCollapsed', lang);
    document.getElementById('label-web').textContent = t('optionsWebAccessLabel', lang);
    document.getElementById('desc-web').textContent = t('optionsWebAccessDesc', lang);
    document.getElementById('label-file').textContent = t('optionsFileAccessLabel', lang);
    document.getElementById('btn-file-settings').textContent = t('managePermission', lang);
    if (isFileAllowed) {
        fileAccessDesc.textContent = t('statusEnabled', lang);
        fileAccessDesc.style.color = '#1a7f37';
    }
    else {
        fileAccessDesc.textContent = t('statusDisabled', lang);
        fileAccessDesc.style.color = '#cf222e';
    }
    saveToast.textContent = t('optionsSave', lang);
}
async function init() {
    const settings = await getSettings();
    selectLanguage.value = settings.language;
    selectTheme.value = settings.theme;
    selectOutline.value = String(settings.defaultTocExpanded);
    toggleWeb.checked = settings.webRenderingEnabled;
    // Check file access status
    if (typeof chrome !== 'undefined' && chrome.extension && chrome.extension.isAllowedFileSchemeAccess) {
        chrome.extension.isAllowedFileSchemeAccess((isAllowed) => {
            isFileAllowed = isAllowed;
            applyI18n(settings.language);
        });
    }
    else {
        applyI18n(settings.language);
    }
    // Language change
    selectLanguage.addEventListener('change', async () => {
        const newLang = selectLanguage.value;
        applyI18n(newLang);
        await saveSettings({ language: newLang });
        showToast();
    });
    // Theme change
    selectTheme.addEventListener('change', async () => {
        await saveSettings({ theme: selectTheme.value });
        showToast();
    });
    // Outline change
    selectOutline.addEventListener('change', async () => {
        await saveSettings({ defaultTocExpanded: selectOutline.value === 'true' });
        showToast();
    });
    // Web access toggle with optional permissions
    toggleWeb.addEventListener('change', async () => {
        if (toggleWeb.checked) {
            if (typeof chrome !== 'undefined' && chrome.permissions) {
                chrome.permissions.request({ origins: ['*://*/*'] }, async (granted) => {
                    if (granted) {
                        await saveSettings({ webRenderingEnabled: true });
                        showToast();
                    }
                    else {
                        toggleWeb.checked = false;
                        await saveSettings({ webRenderingEnabled: false });
                    }
                });
            }
            else {
                await saveSettings({ webRenderingEnabled: true });
                showToast();
            }
        }
        else {
            if (typeof chrome !== 'undefined' && chrome.permissions) {
                chrome.permissions.remove({ origins: ['*://*/*'] });
            }
            await saveSettings({ webRenderingEnabled: false });
            showToast();
        }
    });
    document.getElementById('btn-file-settings')?.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs) {
            const extId = chrome.runtime.id;
            chrome.tabs.create({ url: `chrome://extensions/?id=${extId}` });
        }
    });
}
function showToast() {
    saveToast.classList.add('show');
    setTimeout(() => saveToast.classList.remove('show'), 2000);
}
init();

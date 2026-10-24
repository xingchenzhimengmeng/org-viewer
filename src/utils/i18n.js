/**
 * Internationalization helper for Org Viewer.
 * Supports manual language switching (zh_CN and en) and automatic IP / location detection.
 */
export const MESSAGES = {
    en: {
        extensionName: "Org Viewer",
        extensionDescription: "A modern, beautiful, and secure Org-mode document viewer for Chrome. Preview .org files in-place or via drag-and-drop.",
        rawView: "Raw Source",
        renderedView: "Rendered View",
        expandAll: "Expand All",
        collapseAll: "Collapse All",
        outline: "Outline",
        themeSystem: "System Theme",
        themeLight: "Light Theme",
        themeDark: "Dark Theme",
        print: "Print Document",
        largeFileWarning: "This file is larger than 5MB. Automatic rendering was paused to preserve performance.",
        renderAnyway: "Render Anyway",
        dropzoneTitle: "Drop your .org file here",
        dropzoneSubtitle: "or browse from computer, or paste Org text below",
        chooseFile: "Choose File",
        pastePlaceholder: "Paste Org-mode plain text here...",
        renderButton: "Render Org Text",
        openFile: "Open File",
        orPasteText: "OR PASTE TEXT",
        optionsTitle: "Org Viewer Settings",
        optionsLanguageLabel: "Interface Language",
        optionsLanguageDesc: "Choose the display language for Org Viewer.",
        langZhCN: "中文 (简体)",
        langEn: "English",
        optionsThemeLabel: "Default Theme",
        optionsOutlineLabel: "Outline Default State",
        optionsOutlineExpanded: "Expanded by default",
        optionsOutlineCollapsed: "Collapsed by default",
        optionsWebAccessLabel: "Web .org Auto-Rendering",
        optionsWebAccessDesc: "Automatically render .org files when visiting web URLs (requires optional permission)",
        optionsFileAccessLabel: "Local File URL Access",
        optionsFileAccessGranted: "Enabled (local file:///*.org files will be rendered)",
        optionsFileAccessMissing: "Disabled (Click to enable 'Allow access to file URLs')",
        managePermission: "Manage Permission",
        statusEnabled: "Status: Enabled. Local file:///*.org files will be rendered.",
        statusDisabled: "Status: Disabled. Click Manage Permission to enable 'Allow access to file URLs'.",
        optionsSave: "Settings saved",
        welcomeTitle: "Welcome to Org Viewer",
        welcomeStep1: "Enable Local File Access",
        welcomeStep1Desc: "Chrome requires manual permission for extensions to read local file:/// URLs. To view your local .org notes:",
        welcomeStep1Action: "Open Chrome Extension Details",
        welcomeStep1Tip: "Scroll down and toggle ON 'Allow access to file URLs'.",
        welcomeStep2: "Try It Out",
        welcomeStep2Desc: "Open any .org file directly in Chrome, or drag and drop it into the Org Viewer tab.",
        sampleDownload: "Download Sample .org File"
    },
    zh_CN: {
        extensionName: "Org Viewer - Org-mode 预览器",
        extensionDescription: "现代、优雅且安全的 Chrome Org-mode 文档预览器。支持原地预览本地及网络 .org 文件，支持文件拖拽与即时渲染。",
        rawView: "查看源码",
        renderedView: "渲染视图",
        expandAll: "全部展开",
        collapseAll: "全部折叠",
        outline: "大纲目录",
        themeSystem: "跟随系统",
        themeLight: "浅色模式",
        themeDark: "深色模式",
        print: "打印文档",
        largeFileWarning: "此文件大于 5MB，已暂停自动渲染以保护浏览器性能。",
        renderAnyway: "仍然渲染",
        dropzoneTitle: "拖拽 .org 文件到此处",
        dropzoneSubtitle: "或者从电脑选择文件，或在下方直接粘贴 Org 文本",
        chooseFile: "选择文件",
        pastePlaceholder: "在此粘贴 Org-mode 纯文本内容...",
        renderButton: "立即渲染",
        openFile: "打开文件",
        orPasteText: "或在此粘贴内容",
        optionsTitle: "Org Viewer 设置",
        optionsLanguageLabel: "界面语言",
        optionsLanguageDesc: "选择 Org Viewer 的显示语言。",
        langZhCN: "中文 (简体)",
        langEn: "English",
        optionsThemeLabel: "默认主题",
        optionsOutlineLabel: "大纲默认状态",
        optionsOutlineExpanded: "默认展开",
        optionsOutlineCollapsed: "默认收起",
        optionsWebAccessLabel: "网页端 .org 自动渲染",
        optionsWebAccessDesc: "在访问网络 URL 上的 .org 纯文本时自动渲染（需要申请可选权限）",
        optionsFileAccessLabel: "本地文件网址访问权限",
        optionsFileAccessGranted: "已开启（本地 file:///*.org 文件将自动接管渲染）",
        optionsFileAccessMissing: "未开启（点击直达扩展设置开启“允许访问文件网址”）",
        managePermission: "前往设置",
        statusEnabled: "状态：已开启。本地 file:///*.org 文件将自动接管渲染。",
        statusDisabled: "状态：未开启。请点击“前往设置”开启“允许访问文件网址”。",
        optionsSave: "设置已保存",
        welcomeTitle: "欢迎使用 Org Viewer",
        welcomeStep1: "第一步：开启本地文件访问权限",
        welcomeStep1Desc: "出于安全考虑，Chrome 默认禁止扩展直接读取 file:/// 网址。如需预览本地 .org 文件：",
        welcomeStep1Action: "打开扩展管理详情页",
        welcomeStep1Tip: "向下滑动，找到并打开「允许访问文件网址」开关。",
        welcomeStep2: "第二步：开始体验",
        welcomeStep2Desc: "直接在 Chrome 中打开任何 .org 文件，或者拖拽文件到 Org Viewer 标签页中。",
        sampleDownload: "下载示例 .org 文件"
    }
};
let currentLanguage = 'en';
export function setActiveLanguage(lang) {
    if (lang === 'zh_CN' || lang === 'en') {
        currentLanguage = lang;
    }
}
export function getActiveLanguage() {
    return currentLanguage;
}
/**
 * Detect default language based on system timezone and browser language.
 * If user is in a China timezone or uses Chinese locale, defaults to zh_CN.
 */
export function detectDefaultLanguage() {
    try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
        if (/Asia\/(Shanghai|Chongqing|Harbin|Urumqi)/i.test(tz)) {
            return 'zh_CN';
        }
        const navLang = (typeof navigator !== 'undefined' ? navigator.language : '') || '';
        if (/^zh/i.test(navLang)) {
            return 'zh_CN';
        }
        if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getUILanguage) {
            const uiLang = chrome.i18n.getUILanguage() || '';
            if (/^zh/i.test(uiLang)) {
                return 'zh_CN';
            }
        }
    }
    catch {
        // ignore
    }
    return 'en';
}
/**
 * Asynchronously detects user country via public lightweight GeoIP service.
 * If country is China (CN), returns zh_CN; otherwise returns en.
 * Times out gracefully after 1.5s to fall back to timezone / locale detection.
 */
export async function detectLanguageByIp() {
    const fallback = detectDefaultLanguage();
    if (typeof fetch === 'undefined')
        return fallback;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        // Free, lightweight public GeoIP lookup (country code only, zero data sent)
        const res = await fetch('https://api.country.is/', {
            signal: controller.signal
        }).catch(() => null);
        clearTimeout(timer);
        if (res && res.ok) {
            const data = await res.json().catch(() => null);
            if (data && data.country) {
                return data.country.toUpperCase() === 'CN' ? 'zh_CN' : 'en';
            }
        }
    }
    catch {
        // Network unavailable or blocked, safely fallback
    }
    return fallback;
}
export function t(key, lang) {
    const targetLang = lang || currentLanguage;
    const dict = MESSAGES[targetLang] || MESSAGES.en;
    if (dict && dict[key]) {
        return dict[key];
    }
    // Fallback to English dictionary
    if (MESSAGES.en[key]) {
        return MESSAGES.en[key];
    }
    // Fallback to chrome.i18n if available
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
        const msg = chrome.i18n.getMessage(key);
        if (msg)
            return msg;
    }
    return key;
}

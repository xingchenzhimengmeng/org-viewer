/**
 * Storage helpers for Org Viewer.
 * Uses chrome.storage.sync for user preferences.
 * Uses sessionStorage for session scroll and heading fold states per URL.
 */

import { SupportedLanguage, detectDefaultLanguage, setActiveLanguage } from './i18n.js';

export interface UserSettings {
  theme: 'system' | 'light' | 'dark' | 'phycat';
  defaultTocExpanded: boolean;
  webRenderingEnabled: boolean;
  language: SupportedLanguage;
  sidebarWidth: number;
}

function getDefaultSettings(): UserSettings {
  return {
    theme: 'system',
    defaultTocExpanded: true,
    webRenderingEnabled: false,
    language: detectDefaultLanguage(),
    sidebarWidth: 0
  };
}

export async function getSettings(): Promise<UserSettings> {
  const defaults = getDefaultSettings();
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    try {
      const res = await chrome.storage.sync.get(['theme', 'defaultTocExpanded', 'webRenderingEnabled', 'language', 'sidebarWidth']);
      const settings: UserSettings = {
        theme: res.theme ?? defaults.theme,
        defaultTocExpanded: res.defaultTocExpanded ?? defaults.defaultTocExpanded,
        webRenderingEnabled: res.webRenderingEnabled ?? defaults.webRenderingEnabled,
        language: res.language ?? defaults.language,
        sidebarWidth: typeof res.sidebarWidth === 'number' ? res.sidebarWidth : defaults.sidebarWidth
      };
      setActiveLanguage(settings.language);
      return settings;
    } catch {
      setActiveLanguage(defaults.language);
      return defaults;
    }
  }
  setActiveLanguage(defaults.language);
  return defaults;
}

export async function saveSettings(settings: Partial<UserSettings>): Promise<void> {
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
    try {
      await chrome.storage.sync.set(settings);
      if (settings.language) {
        setActiveLanguage(settings.language);
      }
    } catch (e) {
      console.warn('Failed to save settings:', e);
    }
  }
}

// Session state persistence (scroll position and folded sections)
export interface SessionDocState {
  scrollY: number;
  foldedSectionIds: string[];
  rawView: boolean;
}

export function saveSessionDocState(url: string, state: SessionDocState): void {
  try {
    const key = `org_doc_${url}`;
    sessionStorage.setItem(key, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save session state:', e);
  }
}

export function getSessionDocState(url: string): SessionDocState | null {
  try {
    const key = `org_doc_${url}`;
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

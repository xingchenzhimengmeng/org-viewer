import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { t, setActiveLanguage, getActiveLanguage, detectDefaultLanguage, MESSAGES } from '../src/utils/i18n.js';

describe('Internationalization & Language Detection', () => {
  it('provides complete translation dictionaries for both en and zh_CN', () => {
    const enKeys = Object.keys(MESSAGES.en);
    const zhKeys = Object.keys(MESSAGES.zh_CN);

    assert(enKeys.length > 25, 'Should have rich English dictionary');
    assert(zhKeys.length > 25, 'Should have rich Chinese dictionary');

    // Ensure all critical keys exist in both languages
    const criticalKeys = [
      'optionsTitle', 'optionsLanguageLabel', 'langZhCN', 'langEn',
      'rawView', 'renderedView', 'outline', 'collapseAll', 'expandAll',
      'themeSystem', 'themeLight', 'themeDark', 'print', 'dropzoneTitle'
    ];

    criticalKeys.forEach(k => {
      assert(MESSAGES.en[k], `Missing English key: ${k}`);
      assert(MESSAGES.zh_CN[k], `Missing Chinese key: ${k}`);
    });
  });

  it('translates correctly based on explicit language parameter', () => {
    assert.strictEqual(t('outline', 'en'), 'Outline');
    assert.strictEqual(t('outline', 'zh_CN'), '大纲目录');
    assert.strictEqual(t('rawView', 'en'), 'Raw Source');
    assert.strictEqual(t('rawView', 'zh_CN'), '查看源码');
  });

  it('switches active language dynamically', () => {
    setActiveLanguage('zh_CN');
    assert.strictEqual(getActiveLanguage(), 'zh_CN');
    assert.strictEqual(t('print'), '打印文档');

    setActiveLanguage('en');
    assert.strictEqual(getActiveLanguage(), 'en');
    assert.strictEqual(t('print'), 'Print Document');
  });

  it('detects China timezone (Asia/Shanghai) as zh_CN', () => {
    // Current environment is Asia/Shanghai
    const detected = detectDefaultLanguage();
    // In this Asia/Shanghai environment, it must resolve to zh_CN!
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz.includes('Shanghai')) {
      assert.strictEqual(detected, 'zh_CN');
    }
  });
});
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { isOrgFilename, isOrgUrl } from '../src/utils/org.js';

function walkFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walkFiles(fullPath) : [fullPath];
  });
}

describe('Extension manifest and Org file detection', () => {
  it('defines a working popup and a non-overlapping permission model', () => {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));

    assert.strictEqual(manifest.action.default_popup, 'src/ui/popup/popup.html');
    assert(fs.existsSync(manifest.action.default_popup));
    assert.deepStrictEqual(manifest.host_permissions, ['file:///*']);
    assert.deepStrictEqual(manifest.optional_host_permissions, ['*://*/*']);
    assert.strictEqual(manifest.optional_permissions, undefined);
    assert.strictEqual(manifest.web_accessible_resources, undefined);

    const contentScript = manifest.content_scripts[0];
    assert.deepStrictEqual(contentScript.matches, ['file:///*']);
    assert.deepStrictEqual(contentScript.js, ['src/content/detector.js']);
    assert.doesNotMatch(JSON.stringify(manifest), /\.ord/i);

    const viewerHtml = fs.readFileSync('src/ui/viewer/viewer.html', 'utf8');
    assert.match(viewerHtml, /accept="\.org"/);
    assert.doesNotMatch(viewerHtml, /\.ord/i);
  });

  it('references existing local assets from every extension page', () => {
    const htmlFiles = [
      'src/ui/popup/popup.html',
      'src/ui/viewer/viewer.html',
      'src/ui/options/options.html',
      'src/ui/welcome/welcome.html'
    ];

    for (const htmlFile of htmlFiles) {
      const html = fs.readFileSync(htmlFile, 'utf8');
      const references = Array.from(html.matchAll(/(?:src|href)="([^"]+)"/g), (match) => match[1]);
      for (const reference of references) {
        if (/^(?:https?:|chrome:|#)/.test(reference)) continue;
        const target = path.resolve(path.dirname(htmlFile), reference);
        assert(fs.existsSync(target), `${htmlFile} references missing asset: ${reference}`);
      }
    }
  });

  it('contains no production .ord file support', () => {
    const productionFiles = [
      'manifest.json',
      ...walkFiles('src').filter((file) => /\.(?:ts|js|html|css)$/.test(file))
    ];
    const offenders = productionFiles.filter((file) => /\.ord\b/i.test(fs.readFileSync(file, 'utf8')));
    assert.deepStrictEqual(offenders, []);
  });

  it('recognizes only .org URLs and filenames', () => {
    assert.strictEqual(isOrgUrl('https://example.com/notes.org'), true);
    assert.strictEqual(isOrgUrl('https://example.com/notes.ORG?raw=1#top'), true);
    assert.strictEqual(isOrgUrl('file:///C:/notes/weekly.org'), true);
    assert.strictEqual(isOrgUrl('https://example.com/notes.ord'), false);
    assert.strictEqual(isOrgUrl('https://example.com/notes.org.txt'), false);

    assert.strictEqual(isOrgFilename('weekly.org'), true);
    assert.strictEqual(isOrgFilename('weekly.ORG'), true);
    assert.strictEqual(isOrgFilename('weekly.ord'), false);
    assert.strictEqual(isOrgFilename('weekly.org.txt'), false);
  });
});

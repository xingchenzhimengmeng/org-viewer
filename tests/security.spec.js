import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { sanitizeHtml, isSafeUrl } from '../src/parser/sanitize.js';
import { compileOrg } from '../src/parser/compiler.js';

describe('Security & Sanitization Boundary', () => {
  it('strips <script> tags and inner code entirely', () => {
    const malicious = '<p>Normal text</p><script>alert("pwned")</script><b>Bold text</b>';
    const clean = sanitizeHtml(malicious);

    assert.doesNotMatch(clean, /<script/i);
    assert.doesNotMatch(clean, /alert/i);
    assert.match(clean, /<p>Normal text<\/p>/);
    assert.match(clean, /<b>Bold text<\/b>/);
  });

  it('strips <iframe>, <object>, and <embed> tags', () => {
    const malicious = '<iframe src="https://malicious.com"></iframe><object data="test.swf"></object><embed src="evil.pdf">';
    const clean = sanitizeHtml(malicious);

    assert.doesNotMatch(clean, /<iframe/i);
    assert.doesNotMatch(clean, /<object/i);
    assert.doesNotMatch(clean, /<embed/i);
  });

  it('strips all inline on* event handler attributes', () => {
    const malicious = '<img src="valid.png" onerror="alert(1)" onload="alert(2)" onclick="alert(3)" />';
    const clean = sanitizeHtml(malicious);

    assert.doesNotMatch(clean, /onerror/i);
    assert.doesNotMatch(clean, /onload/i);
    assert.doesNotMatch(clean, /onclick/i);
    assert.match(clean, /src="valid\.png"/);
  });

  it('blocks javascript: and vbscript: URIs in links', () => {
    assert.strictEqual(isSafeUrl('javascript:alert(1)'), false);
    assert.strictEqual(isSafeUrl('JAVASCRIPT:alert(1)'), false);
    assert.strictEqual(isSafeUrl('vbscript:msgbox(1)'), false);
    assert.strictEqual(isSafeUrl('data:text/html,<script>alert(1)</script>'), false);

    assert.strictEqual(isSafeUrl('https://example.com'), true);
    assert.strictEqual(isSafeUrl('http://example.com'), true);
    assert.strictEqual(isSafeUrl('mailto:test@example.com'), true);
    assert.strictEqual(isSafeUrl('file:///C:/notes/test.org'), true);
    assert.strictEqual(isSafeUrl('./img.png'), true);
    assert.strictEqual(isSafeUrl('#section-1'), true);

    const maliciousLink = '<a href="javascript:alert(1)">Click Me</a>';
    const clean = sanitizeHtml(maliciousLink);
    assert.doesNotMatch(clean, /javascript:/i);
  });

  it('adds rel="noopener noreferrer" to external links', () => {
    const raw = '<a href="https://google.com">Search</a>';
    const clean = sanitizeHtml(raw);

    assert.match(clean, /rel="noopener noreferrer"/);
  });

  it('safely handles Org link injection attacks', () => {
    const orgAttack = `
* Attack Vector
Check this link: [[javascript:alert(1)][Malicious Click]]
Image vector: [[http://example.com/test.png" onerror="alert(1)]]
Raw tag test: <script>window.pwned = true;</script>
`;
    const res = compileOrg(orgAttack);

    assert.doesNotMatch(res.html, /javascript:alert/i);
    assert.doesNotMatch(res.html, /<script>/i);
    assert.doesNotMatch(res.html, /onerror=/i);
  });
});
import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { compileOrg } from '../src/parser/compiler.js';
import { parseTodoKeywords, checkTodoKeyword } from '../src/parser/todo.js';

describe('Org-mode Compiler & Parser', () => {
  it('parses headings with correct hierarchy and TOC', () => {
    const fixture = fs.readFileSync('tests/fixtures/01-headings.org', 'utf8');
    const res = compileOrg(fixture);

    assert.strictEqual(res.toc.length, 6);
    assert.strictEqual(res.toc[0].level, 1);
    assert.strictEqual(res.toc[0].title, 'Top Level Heading');
    assert.strictEqual(res.toc[5].level, 6);
    assert.match(res.html, /<h1 class="org-heading"/);
    assert.match(res.html, /<h6 class="org-heading"/);
  });

  it('detects default TODO keywords', () => {
    const fixture = fs.readFileSync('tests/fixtures/02-todo-default.org', 'utf8');
    const res = compileOrg(fixture);

    assert.strictEqual(res.toc[0].todoState, 'TODO');
    assert.strictEqual(res.toc[0].isDone, false);
    assert.strictEqual(res.toc[5].todoState, 'DONE');
    assert.strictEqual(res.toc[5].isDone, true);
    assert.match(res.html, /org-todo org-todo-active">TODO/);
    assert.match(res.html, /org-todo org-todo-done">DONE/);
  });

  it('scans and applies custom #+TODO: declaration', () => {
    const fixture = fs.readFileSync('tests/fixtures/03-todo-custom.org', 'utf8');
    const res = compileOrg(fixture);

    const todoConfig = parseTodoKeywords(fixture);
    assert(todoConfig.activeStates.has('FEEDBACK'));
    assert(todoConfig.activeStates.has('IN-PROGRESS'));
    assert(todoConfig.doneStates.has('RESOLVED'));
    assert(todoConfig.doneStates.has('CLOSED'));

    assert.strictEqual(res.toc[1].todoState, 'FEEDBACK');
    assert.strictEqual(res.toc[1].isDone, false);
    assert.strictEqual(res.toc[3].todoState, 'RESOLVED');
    assert.strictEqual(res.toc[3].isDone, true);
  });

  it('renders priority badges [#A], [#B], [#C]', () => {
    const fixture = fs.readFileSync('tests/fixtures/04-priorities.org', 'utf8');
    const res = compileOrg(fixture);

    assert.match(res.html, /org-priority org-priority-a">\[#A\]/);
    assert.match(res.html, /org-priority org-priority-b">\[#B\]/);
    assert.match(res.html, /org-priority org-priority-c">\[#C\]/);
  });

  it('extracts headline tags', () => {
    const fixture = fs.readFileSync('tests/fixtures/05-tags.org', 'utf8');
    const res = compileOrg(fixture);

    assert.match(res.html, /class="org-tag">:work:</);
    assert.match(res.html, /class="org-tag">:project:</);
    assert.match(res.html, /class="org-tag">:frontend:</);
  });

  it('renders properties drawers as collapsible details', () => {
    const fixture = fs.readFileSync('tests/fixtures/06-drawers.org', 'utf8');
    const res = compileOrg(fixture);

    assert.match(res.html, /<details class="org-drawer">/);
    assert.match(res.html, /<summary class="org-drawer-header">:PROPERTIES:<\/summary>/);
    assert.match(res.html, /:CUSTOM_ID: sec-features/);
  });

  it('renders planning timestamps (SCHEDULED, DEADLINE)', () => {
    const fixture = fs.readFileSync('tests/fixtures/07-planning.org', 'utf8');
    const res = compileOrg(fixture);

    assert.match(res.html, /org-planning org-planning-scheduled/);
    assert.match(res.html, /org-planning org-planning-deadline/);
  });

  it('renders unordered and ordered lists', () => {
    const ulRes = compileOrg(fs.readFileSync('tests/fixtures/08-unordered-list.org', 'utf8'));
    assert.match(ulRes.html, /<ul class="org-ul">/);
    assert.match(ulRes.html, /<li>First item<\/li>/);

    const olRes = compileOrg(fs.readFileSync('tests/fixtures/09-ordered-list.org', 'utf8'));
    assert.match(olRes.html, /<ol class="org-ol">/);
    assert.match(olRes.html, /<li>Step one<\/li>/);
  });

  it('renders description lists', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/10-description-list.org', 'utf8'));
    assert.match(res.html, /<li class="org-desc-item">/);
    assert.match(res.html, /<strong>Emacs<\/strong>: An extensible/);
  });

  it('renders task checkboxes with disabled inputs', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/11-checkboxes.org', 'utf8'));
    assert.match(res.html, /<input\b[^>]*class="org-checkbox"[^>]*disabled[^>]*data-state="unchecked"[^>]*\/>\s*Incomplete/);
    assert.match(res.html, /<input\b[^>]*class="org-checkbox"[^>]*checked[^>]*disabled[^>]*data-state="checked"[^>]*\/>\s*Completed/);
    assert.match(res.html, /<input\b[^>]*class="org-checkbox"[^>]*disabled[^>]*data-state="partial"[^>]*\/>\s*Partially/);
  });

  it('renders tables with header row separation', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/12-table-basic.org', 'utf8'));
    assert.match(res.html, /<table class="org-table">/);
    assert.match(res.html, /<thead>\s*<tr>\s*<th>Language<\/th>/);
    assert.match(res.html, /<tbody>\s*<tr>\s*<td>Org<\/td>/);
  });

  it('syntax highlights code blocks', () => {
    const jsRes = compileOrg(fs.readFileSync('tests/fixtures/14-src-javascript.org', 'utf8'));
    assert.match(jsRes.html, /<div class="org-src-block">/);
    assert.match(jsRes.html, /<span class="hljs-keyword">function<\/span>/);
    assert.match(jsRes.html, /<span class="hljs-title function_">calculateTotal<\/span>/);

    const pyRes = compileOrg(fs.readFileSync('tests/fixtures/15-src-python.org', 'utf8'));
    assert.match(pyRes.html, /<span class="hljs-keyword">def<\/span>/);

    const elispRes = compileOrg(fs.readFileSync('tests/fixtures/16-src-elisp.org', 'utf8'));
    assert.match(elispRes.html, /<span class="hljs-keyword">defun<\/span>/);

    const bashRes = compileOrg(fs.readFileSync('tests/fixtures/17-src-bash.org', 'utf8'));
    assert.match(bashRes.html, /<span class="hljs-keyword">echo<\/span>/);
  });

  it('renders quotes and examples', () => {
    const quoteRes = compileOrg(fs.readFileSync('tests/fixtures/18-quote-block.org', 'utf8'));
    assert.match(quoteRes.html, /<blockquote><p>The best way/);

    const exRes = compileOrg(fs.readFileSync('tests/fixtures/19-example-block.org', 'utf8'));
    assert.match(exRes.html, /<pre class="org-example"><code>Raw example output/);
  });

  it('displays export blocks safely without executing raw HTML', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/20-export-html.org', 'utf8'));
    assert.match(res.html, /<div class="org-export-block"><pre><code>&lt;div class=&quot;custom-widget&quot;&gt;/);
  });

  it('renders bidirectional footnotes', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/22-footnotes.org', 'utf8'));
    assert.match(res.html, /<sup><a href="#fn-1" id="fnref-1" class="org-fnref">\[1\]<\/a><\/sup>/);
    assert.match(res.html, /<section class="org-footnotes">/);
    assert.match(res.html, /<li id="fn-1">/);
    assert.match(res.html, /<a href="#fnref-1" class="org-fn-backlink"/);
  });

  it('renders horizontal rules', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/23-horizontal-rule.org', 'utf8'));
    assert.match(res.html, /<hr class="org-hr" \/>/);
  });

  it('renders inline styles (bold, italic, underline, strike, code)', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/24-inline-styles.org', 'utf8'));
    assert.match(res.html, /<strong>bold<\/strong>/);
    assert.match(res.html, /<em>italic<\/em>/);
    assert.match(res.html, /<u>underlined<\/u>/);
    assert.match(res.html, /<del>strikethrough<\/del>/);
    assert.match(res.html, /<code class="org-code">code<\/code>/);
    assert.match(res.html, /<code class="org-verbatim">verbatim<\/code>/);
  });

  it('formats links and images correctly', () => {
    const webRes = compileOrg(fs.readFileSync('tests/fixtures/25-links-web.org', 'utf8'));
    assert.match(webRes.html, /<a\b[^>]*\bhref="https:\/\/orgmode\.org"/);
    assert.match(webRes.html, /<a\b[^>]*\brel="noopener noreferrer"/);
    assert.match(webRes.html, />Org Mode Official Site<\/a>/);

    const imgRes = compileOrg(fs.readFileSync('tests/fixtures/26-links-images.org', 'utf8'));
    assert.match(imgRes.html, /<figure class="org-image-container"><img src="screenshot\.png" alt="App Screenshot"/);
  });

  it('renders anchors, targets, and Org-roam links', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/27-links-anchors.org', 'utf8'));
    assert.match(res.html, /<span id="my-target" class="org-target"><\/span>/);
    assert.match(res.html, /<a href="#sec-top-level-heading" class="org-internal-link">Top Section<\/a>/);

    const roamRes = compileOrg(fs.readFileSync('tests/fixtures/28-links-roam.org', 'utf8'));
    assert.match(roamRes.html, /<span class="org-roam-link" title="Org-roam: id:12345-67890">My Roam Node<\/span>/);
  });

  it('renders mathematical expressions', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/29-math.org', 'utf8'));
    assert.match(res.html, /<math\b[^>]*>/);
    assert.match(res.html, /<mi>E<\/mi><mo>=<\/mo><mi>m<\/mi><msup><mi>c<\/mi><mrow><mn>2<\/mn><\/mrow><\/msup>/);
    assert.match(res.html, /<mfrac><mrow><mo>−<\/mo><mi>b<\/mi><mo>±<\/mo><msqrt>/);
    assert.match(res.html, /<div class="org-math-block">/);
    assert.match(res.html, /<msubsup><mo>∫<\/mo>/);
  });

  it('renders document metadata header (title, author, date)', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/30-document-metadata.org', 'utf8'));
    assert.strictEqual(res.title, 'Research Paper Draft');
    assert.strictEqual(res.metadata['AUTHOR'], 'Dr. Linus Torvalds');
    assert.match(res.html, /<header class="org-doc-header">/);
    assert.match(res.html, /<h1 class="org-doc-title">Research Paper Draft<\/h1>/);
    assert.match(res.html, /Dr\. Linus Torvalds/);
  });

  it('compiles complex multi-feature notebook correctly', () => {
    const res = compileOrg(fs.readFileSync('tests/fixtures/31-complex-notebook.org', 'utf8'));
    assert.strictEqual(res.title, 'Weekly Engineering Sync');
    assert.strictEqual(res.toc.length, 3);
    assert.match(res.html, /org-todo-done">DONE/);
    assert.match(res.html, /org-todo-active">IN-DEV/);
    assert.match(res.html, /<table class="org-table">/);
  });
});

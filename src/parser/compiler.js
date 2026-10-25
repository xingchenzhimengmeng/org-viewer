/**
 * Org-mode Compiler: Converts raw .org text into structured HTML and TOC outline.
 */
import { parseTodoKeywords, checkTodoKeyword } from './todo.js';
import { sanitizeHtml, isSafeUrl } from './sanitize.js';
import { highlightCode } from './highlighter.js';
import { latexToMathML } from './math.js';
function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
function slugify(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/<[^>]+>/g, '') // remove HTML tags
        .replace(/\[#[A-Z]\]/g, '') // remove priority
        .replace(/[:\/\\?#\[\]@!$&'()*+,;=]/g, '')
        .replace(/\s+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section';
}
/**
 * Format inline markup: bold, italic, code, links, timestamps, math.
 */
export function formatInline(text) {
    if (!text)
        return '';
    // Math spans are stashed first so verbatim/bold/italic passes cannot chew on
    // LaTeX (and vice versa); placeholders are restored after all other passes.
    const mathSpans = [];
    const stashMath = (html) => {
        mathSpans.push(html);
        return `\u0000${mathSpans.length - 1}\u0000`;
    };
    let res = text.replace(/\$\$([^$\n]+)\$\$/g, (_, math) => stashMath(latexToMathML(math, true)));
    res = res.replace(/\$([^$\n]+)\$/g, (_, math) => stashMath(latexToMathML(math, false)));
    res = res.replace(/\\\(([^\n]+?)\\\)/g, (_, math) => stashMath(latexToMathML(math, false)));
    // 1. Links & Images: [[target][description]] or [[target]]
    res = res.replace(/\[\[([^\]]+)\](?:\[([^\]]*)\])?\]/g, (_, target, desc) => {
        let rawTarget = target.trim();
        // Normalize file: prefix (e.g. file:img.png -> img.png)
        if (rawTarget.startsWith('file:') && !rawTarget.startsWith('file:///')) {
            rawTarget = rawTarget.slice(5);
        }
        // If target contains dangerous characters, block it
        if (!isSafeUrl(rawTarget) && !rawTarget.startsWith('*') && !rawTarget.startsWith('#') && !rawTarget.startsWith('id:')) {
            return `<span class="org-unresolved-link" title="Unsafe or invalid link">[Blocked Link]</span>`;
        }
        const rawDesc = desc ? desc.trim() : rawTarget;
        // Check if target is an image
        const isImg = /\.(png|jpe?g|gif|svg|webp|bmp)(?:\?[^\]]*)?$/i.test(rawTarget);
        if (isImg && isSafeUrl(rawTarget)) {
            const alt = desc ? escapeHtml(desc) : 'Image';
            return `<figure class="org-image-container"><img src="${escapeHtml(rawTarget)}" alt="${alt}" loading="lazy" />${desc ? `<figcaption>${escapeHtml(desc)}</figcaption>` : ''}</figure>`;
        }
        // Anchor link: [[*Heading]]
        if (rawTarget.startsWith('*')) {
            const headingTarget = slugify(rawTarget.slice(1));
            return `<a href="#sec-${headingTarget}" class="org-internal-link">${escapeHtml(rawDesc)}</a>`;
        }
        // Custom ID: [[#my-id]]
        if (rawTarget.startsWith('#')) {
            return `<a href="${escapeHtml(rawTarget)}" class="org-internal-link">${escapeHtml(rawDesc)}</a>`;
        }
        // Org-roam ID: [[id:uuid]]
        if (rawTarget.startsWith('id:')) {
            return `<span class="org-roam-link" title="Org-roam: ${escapeHtml(rawTarget)}">${escapeHtml(rawDesc)}</span>`;
        }
        // Normal URL
        if (isSafeUrl(rawTarget)) {
            return `<a href="${escapeHtml(rawTarget)}">${escapeHtml(rawDesc)}</a>`;
        }
        return `<span class="org-unresolved-link" title="Unresolved link">${escapeHtml(rawDesc)}</span>`;
    });
    // 2. Targets: <<target>>
    res = res.replace(/<<([a-zA-Z0-9_\-]+)>>/g, (_, id) => {
        return `<span id="${escapeHtml(id)}" class="org-target"></span>`;
    });
    // 3. Footnote references: [fn:1] or [fn:label]
    res = res.replace(/\[fn:([a-zA-Z0-9_\-]+)\]/g, (_, label) => {
        return `<sup><a href="#fn-${escapeHtml(label)}" id="fnref-${escapeHtml(label)}" class="org-fnref">[${escapeHtml(label)}]</a></sup>`;
    });
    // 4. Timestamps: <2026-10-24 Sat ...> or [2026-10-24 Sat ...]
    res = res.replace(/([<\[])(\d{4}-\d{2}-\d{2}(?:[ \t]+[A-Za-z]+)?(?:[ \t]+\d{1,2}:\d{2}(?:-\d{1,2}:\d{2})?)?)(?:[>\]])/g, (_, bracket, ts) => {
        const isInactive = bracket === '[';
        return `<time class="org-timestamp ${isInactive ? 'org-timestamp-inactive' : 'org-timestamp-active'}">${escapeHtml(ts)}</time>`;
    });
    // 5. Code: ~code~ and =verbatim=
    res = res.replace(/(^|[\s({\[（《【“‘])~([^~\n]+)~([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<code class="org-code">$2</code>$3');
    res = res.replace(/(^|[\s({\[（《【“‘])=([^=\n]+)=([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<code class="org-verbatim">$2</code>$3');
    // 6. Bold: *bold*
    res = res.replace(/(^|[\s({\[（《【“‘])\*([^*\n\s](?:[^*\n]*[^*\n\s])?)\*([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<strong>$2</strong>$3');
    // 7. Italic: /italic/
    res = res.replace(/(^|[\s({\[（《【“‘])\/([^\/\n\s](?:[^\/\n]*[^\/\n\s])?)\/([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<em>$2</em>$3');
    // 8. Underline: _underline_
    res = res.replace(/(^|[\s({\[（《【“‘])_([^_\n\s](?:[^_\n]*[^_\n\s])?)_([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<u>$2</u>$3');
    // 9. Strikethrough: +strike+
    res = res.replace(/(^|[\s({\[（《【“‘])\+([^\+\n\s](?:[^\+\n]*[^\+\n\s])?)\+([)\]}\s.,!?:;'\-）》】”’]|$)/gu, '$1<del>$2</del>$3');
    // 10. Restore stashed MathML
    return res.replace(/\u0000(\d+)\u0000/g, (_, index) => mathSpans[Number(index)]);
}
export function compileOrg(orgText) {
    const todoConfig = parseTodoKeywords(orgText);
    const metadata = {};
    const toc = [];
    const footnotes = new Map();
    const lines = orgText.split(/\r?\n/);
    const out = [];
    let inSrcBlock = false;
    let srcLang = '';
    let srcLines = [];
    let inQuoteBlock = false;
    let quoteLines = [];
    let inExampleBlock = false;
    let exampleLines = [];
    let inExportBlock = false;
    let exportLines = [];
    let inCenterBlock = false;
    let centerLines = [];
    let inCommentBlock = false;
    let inDrawer = false;
    let drawerName = '';
    let drawerLines = [];
    let inTable = false;
    let tableRows = [];
    let tableHasHeader = false;
    let pendingCaption = '';
    let inList = false;
    let listType = 'ul';
    let listItems = [];
    let currentHeadingLevel = 0;
    function closeTable() {
        if (!inTable)
            return;
        if (tableRows.length > 0) {
            out.push('<div class="org-table-wrapper"><table class="org-table">');
            if (pendingCaption) {
                out.push(`<caption class="org-table-caption">${formatInline(pendingCaption)}</caption>`);
                pendingCaption = '';
            }
            if (tableHasHeader && tableRows.length > 0) {
                out.push('<thead><tr>');
                tableRows[0].forEach(cell => {
                    out.push(`<th>${formatInline(cell)}</th>`);
                });
                out.push('</tr></thead>');
                out.push('<tbody>');
                for (let r = 1; r < tableRows.length; r++) {
                    out.push('<tr>');
                    tableRows[r].forEach(cell => {
                        out.push(`<td>${formatInline(cell)}</td>`);
                    });
                    out.push('</tr>');
                }
                out.push('</tbody>');
            }
            else {
                out.push('<tbody>');
                tableRows.forEach(row => {
                    out.push('<tr>');
                    row.forEach(cell => {
                        out.push(`<td>${formatInline(cell)}</td>`);
                    });
                    out.push('</tr>');
                });
                out.push('</tbody>');
            }
            out.push('</table></div>');
        }
        inTable = false;
        tableRows = [];
        tableHasHeader = false;
    }
    function closeList() {
        if (!inList)
            return;
        out.push(`<${listType} class="org-${listType}">`);
        listItems.forEach(item => {
            out.push(item);
        });
        out.push(`</${listType}>`);
        inList = false;
        listItems = [];
    }
    function closeBlocks() {
        closeTable();
        closeList();
    }
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        const trimmed = rawLine.trim();
        // 1. Multi-line block boundaries
        if (/^#\+BEGIN_SRC/i.test(trimmed)) {
            closeBlocks();
            inSrcBlock = true;
            const parts = trimmed.split(/\s+/);
            srcLang = parts[1] || '';
            srcLines = [];
            continue;
        }
        if (/^#\+END_SRC/i.test(trimmed)) {
            inSrcBlock = false;
            const highlighted = highlightCode(srcLines.join('\n'), srcLang);
            const linesHtml = highlighted
                .split('\n')
                .map((lineHtml) => `<span class="org-code-line">${lineHtml}</span>`)
                .join('');
            const captionHtml = pendingCaption
                ? `<div class="org-block-caption">${formatInline(pendingCaption)}</div>`
                : '';
            pendingCaption = '';
            out.push(captionHtml +
                `<div class="org-src-block">` +
                `<div class="org-src-header"><span class="org-src-lang">${escapeHtml(srcLang || 'text')}</span></div>` +
                `<pre><code class="language-${escapeHtml(srcLang || 'text')}">${linesHtml}</code></pre>` +
                `</div>`);
            continue;
        }
        if (inSrcBlock) {
            srcLines.push(rawLine);
            continue;
        }
        if (/^#\+BEGIN_QUOTE/i.test(trimmed)) {
            closeBlocks();
            inQuoteBlock = true;
            quoteLines = [];
            continue;
        }
        if (/^#\+END_QUOTE/i.test(trimmed)) {
            inQuoteBlock = false;
            out.push(`<blockquote><p>${formatInline(quoteLines.join(' '))}</p></blockquote>`);
            continue;
        }
        if (inQuoteBlock) {
            quoteLines.push(trimmed);
            continue;
        }
        if (/^#\+BEGIN_EXAMPLE/i.test(trimmed)) {
            closeBlocks();
            inExampleBlock = true;
            exampleLines = [];
            continue;
        }
        if (/^#\+END_EXAMPLE/i.test(trimmed)) {
            inExampleBlock = false;
            out.push(`<pre class="org-example"><code>${escapeHtml(exampleLines.join('\n'))}</code></pre>`);
            continue;
        }
        if (inExampleBlock) {
            exampleLines.push(rawLine);
            continue;
        }
        if (/^#\+BEGIN_EXPORT/i.test(trimmed)) {
            closeBlocks();
            inExportBlock = true;
            exportLines = [];
            continue;
        }
        if (/^#\+END_EXPORT/i.test(trimmed)) {
            inExportBlock = false;
            // Per spec: display safely as escaped code
            out.push(`<div class="org-export-block"><pre><code>${escapeHtml(exportLines.join('\n'))}</code></pre></div>`);
            continue;
        }
        if (inExportBlock) {
            exportLines.push(rawLine);
            continue;
        }
        if (/^#\+BEGIN_COMMENT/i.test(trimmed)) {
            closeBlocks();
            inCommentBlock = true;
            continue;
        }
        if (/^#\+END_COMMENT/i.test(trimmed)) {
            inCommentBlock = false;
            continue;
        }
        if (inCommentBlock) {
            continue;
        }
        if (/^#\+BEGIN_CENTER/i.test(trimmed)) {
            closeBlocks();
            inCenterBlock = true;
            centerLines = [];
            continue;
        }
        if (/^#\+END_CENTER/i.test(trimmed)) {
            inCenterBlock = false;
            out.push(`<div class="org-center" style="text-align: center;"><p>${formatInline(centerLines.join(' '))}</p></div>`);
            continue;
        }
        if (inCenterBlock) {
            centerLines.push(rawLine);
            continue;
        }
        // Comments: line starting with # followed by whitespace, or solitary #
        if (/^#[ \t]+/.test(rawLine) || rawLine.trim() === '#') {
            continue;
        }
        // Include directives: #+INCLUDE: "..."
        const incMatch = trimmed.match(/^#\+INCLUDE:[ \t]*"?([^"\n]+)"?/i);
        if (incMatch) {
            closeBlocks();
            const incPath = incMatch[1].trim();
            out.push(`<div class="org-include-card"><span class="org-include-badge">&#128196; INCLUDE</span> <code class="org-include-path">${escapeHtml(incPath)}</code></div>`);
            continue;
        }
        // 2. Drawers: :PROPERTIES: ... :END:
        if (/^:[a-zA-Z0-9_\-]+:[ \t]*$/.test(trimmed) && !inDrawer) {
            closeBlocks();
            inDrawer = true;
            drawerName = trimmed;
            drawerLines = [];
            continue;
        }
        if (/^:END:[ \t]*$/i.test(trimmed) && inDrawer) {
            inDrawer = false;
            out.push(`<details class="org-drawer">` +
                `<summary class="org-drawer-header">${escapeHtml(drawerName)}</summary>` +
                `<div class="org-drawer-content"><pre>${escapeHtml(drawerLines.join('\n'))}</pre></div>` +
                `</details>`);
            continue;
        }
        if (inDrawer) {
            drawerLines.push(trimmed);
            continue;
        }
        // 3. Document Metadata: #+TITLE, #+AUTHOR, #+DATE, #+RESULTS
        const metaMatch = trimmed.match(/^#\+([a-zA-Z0-9_\-]+):[ \t]*(.*)$/);
        if (metaMatch) {
            const key = metaMatch[1].toUpperCase();
            const val = metaMatch[2].trim();
            if (key === 'RESULTS') {
                out.push(`<div class="org-results"><span class="org-results-label">RESULTS:</span> ${formatInline(val)}</div>`);
            }
            else if (key === 'CAPTION') {
                pendingCaption = val;
            }
            else {
                metadata[key] = val;
            }
            continue;
        }
        // 4. Horizontal Rule: 5 or more dashes
        if (/^-{5,}[ \t]*$/.test(trimmed)) {
            closeBlocks();
            out.push('<hr class="org-hr" />');
            continue;
        }
        // 5. Headings: * Heading ...
        const headingMatch = rawLine.match(/^(\*{1,6})[ \t]+(.*)$/);
        if (headingMatch) {
            closeBlocks();
            const level = headingMatch[1].length;
            let headingText = headingMatch[2].trim();
            // Close previous sections if needed
            while (currentHeadingLevel >= level) {
                out.push('</div></section>');
                currentHeadingLevel--;
            }
            // Check TODO state
            let todoBadge = '';
            let todoState;
            let isDone;
            const words = headingText.split(/\s+/);
            if (words.length > 0) {
                const check = checkTodoKeyword(words[0], todoConfig);
                if (check.isTodo) {
                    todoState = check.state;
                    isDone = check.isDone;
                    todoBadge = `<span class="org-todo ${isDone ? 'org-todo-done' : 'org-todo-active'}">${escapeHtml(todoState)}</span> `;
                    headingText = headingText.slice(words[0].length).trim();
                }
            }
            // Check Priority: [#A]
            let priorityBadge = '';
            const prioMatch = headingText.match(/^\[#([A-Z])\][ \t]*(.*)$/);
            if (prioMatch) {
                const prio = prioMatch[1];
                priorityBadge = `<span class="org-priority org-priority-${prio.toLowerCase()}">[#${prio}]</span> `;
                headingText = prioMatch[2].trim();
            }
            // Check Tags: :tag1:tag2: at the end
            let tagsHtml = '';
            const tagsMatch = headingText.match(/^(.*?)[ \t]+:([a-zA-Z0-9_\-@#%:]+):[ \t]*$/);
            if (tagsMatch) {
                headingText = tagsMatch[1].trim();
                const tagList = tagsMatch[2].split(':').filter(t => t.length > 0);
                if (tagList.length > 0) {
                    tagsHtml = ` <span class="org-tags">${tagList.map(t => `<span class="org-tag">:${escapeHtml(t)}:</span>`).join('')}</span>`;
                }
            }
            const id = slugify(headingText);
            const sectionId = `sec-${id}-${toc.length + 1}`;
            toc.push({
                id: sectionId,
                level,
                title: headingText,
                todoState,
                isDone
            });
            const formattedHeading = `${todoBadge}${priorityBadge}${formatInline(headingText)}${tagsHtml}`;
            out.push(`<section class="org-section org-level-${level}" data-level="${level}" id="${sectionId}">` +
                `<h${level} class="org-heading" id="heading-${sectionId}">` +
                `<span class="org-fold-toggle" title="Toggle Section" aria-label="Toggle section">` +
                `<svg class="org-fold-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>` +
                `</span>` +
                `<span class="org-heading-content">${formattedHeading}</span>` +
                `</h${level}>` +
                `<div class="org-section-body">`);
            currentHeadingLevel = level;
            continue;
        }
        // 6. Planning Info: SCHEDULED, DEADLINE, CLOSED
        if (/^[ \t]*(?:SCHEDULED|DEADLINE|CLOSED):/i.test(rawLine)) {
            closeBlocks();
            const planningParts = rawLine.match(/(SCHEDULED|DEADLINE|CLOSED):[ \t]*([<\[][^>\]]+[>\]])/gi);
            if (planningParts) {
                out.push('<div class="org-planning-line">');
                planningParts.forEach(p => {
                    const colonIdx = p.indexOf(':');
                    const pType = p.slice(0, colonIdx).trim().toUpperCase();
                    const pTime = p.slice(colonIdx + 1).trim();
                    out.push(`<span class="org-planning org-planning-${pType.toLowerCase()}">` +
                        `<span class="org-planning-label">${escapeHtml(pType)}:</span> ${formatInline(pTime)}` +
                        `</span>`);
                });
                out.push('</div>');
                continue;
            }
        }
        // 7. Tables: | cell | cell |
        if (/^[ \t]*\|/.test(rawLine)) {
            closeList();
            const isDivider = /^[ \t]*\|[\-+|\s]+$/.test(rawLine);
            if (isDivider) {
                if (!inTable) {
                    inTable = true;
                    tableRows = [];
                }
                else if (tableRows.length > 0) {
                    tableHasHeader = true;
                }
                continue;
            }
            inTable = true;
            // Split cells by |
            const cells = rawLine
                .split('|')
                .slice(1, -1)
                .map(c => c.trim());
            tableRows.push(cells);
            continue;
        }
        else {
            closeTable();
        }
        // 8. Footnote definitions: [fn:1] text...
        const fnDefMatch = rawLine.match(/^[ \t]*\[fn:([a-zA-Z0-9_\-]+)\][ \t]+(.*)$/);
        if (fnDefMatch) {
            closeBlocks();
            footnotes.set(fnDefMatch[1], fnDefMatch[2]);
            continue;
        }
        // 9. Lists & Checkboxes
        const listMatch = rawLine.match(/^([ \t]*)([-+*]|\d+[.)])[ \t]+(.*)$/);
        if (listMatch) {
            const marker = listMatch[2];
            let itemContent = listMatch[3];
            const currentListType = /^\d/.test(marker) ? 'ol' : 'ul';
            if (!inList || listType !== currentListType) {
                closeList();
                inList = true;
                listType = currentListType;
            }
            // Check for description list: term :: definition
            const descMatch = itemContent.match(/^(.+?)[ \t]+::[ \t]+(.*)$/);
            if (descMatch) {
                listItems.push(`<li class="org-desc-item">` +
                    `<strong>${formatInline(descMatch[1])}</strong>: ${formatInline(descMatch[2])}` +
                    `</li>`);
                continue;
            }
            // Check for checkboxes: [ ], [X], [-]
            let checkboxHtml = '';
            const boxMatch = itemContent.match(/^\[([ X\-])\][ \t]+(.*)$/);
            if (boxMatch) {
                const state = boxMatch[1];
                const isChecked = state === 'X';
                const isPartial = state === '-';
                checkboxHtml =
                    `<input type="checkbox" class="org-checkbox" ${isChecked ? 'checked' : ''} disabled ` +
                        `data-state="${isPartial ? 'partial' : isChecked ? 'checked' : 'unchecked'}" /> `;
                itemContent = boxMatch[2];
            }
            listItems.push(`<li>${checkboxHtml}${formatInline(itemContent)}</li>`);
            continue;
        }
        else {
            closeList();
        }
        // 10. Math block: \[ ... \], $$...$$, or \begin{equation/matrix...}
        if (/^(\\\[|\$\$|\\begin\{(?:equation|align|gather|matrix|pmatrix|bmatrix|cases)\*?\})/.test(trimmed)) {
            closeBlocks();
            let mathContent = trimmed;
            if (mathContent.startsWith('\\[')) {
                mathContent = mathContent.replace(/^\\\[\s*/, '').replace(/\s*\\\]$/, '');
            }
            else if (mathContent.startsWith('$$')) {
                mathContent = mathContent.replace(/^\$\$\s*/, '').replace(/\s*\$\$$/, '');
            }
            out.push(`<div class="org-math-block">${latexToMathML(mathContent, true)}</div>`);
            continue;
        }
        // 11. Empty lines
        if (trimmed.length === 0) {
            closeBlocks();
            continue;
        }
        // 12. Normal paragraph
        // A lone image link preceded by #+CAPTION becomes a captioned figure.
        const soloImage = trimmed.match(/^\[\[([^\]]+)\](?:\[([^\]]*)\])?\]$/);
        if (soloImage && pendingCaption && !soloImage[2] &&
            /\.(png|jpe?g|gif|svg|webp|bmp)(?:\?[^\]]*)?$/i.test(soloImage[1].trim())) {
            const figure = formatInline(trimmed).replace('</figure>', `<figcaption>${formatInline(pendingCaption)}</figcaption></figure>`);
            pendingCaption = '';
            out.push(figure);
            continue;
        }
        out.push(`<p>${formatInline(rawLine)}</p>`);
    }
    // Close remaining open structures
    closeBlocks();
    while (currentHeadingLevel > 0) {
        out.push('</div></section>');
        currentHeadingLevel--;
    }
    // Append footnotes section if any exist
    if (footnotes.size > 0) {
        out.push('<section class="org-footnotes"><hr class="org-hr" /><h3 class="org-footnotes-title">Footnotes</h3><ol>');
        footnotes.forEach((content, label) => {
            out.push(`<li id="fn-${escapeHtml(label)}">` +
                `<span class="org-fn-content">${formatInline(content)}</span> ` +
                `<a href="#fnref-${escapeHtml(label)}" class="org-fn-backlink" title="Jump back to reference">&#x21a9;&#xfe0e;</a>` +
                `</li>`);
        });
        out.push('</ol></section>');
    }
    // Document title header
    const title = metadata['TITLE'] || (toc.length > 0 ? toc[0].title : 'Org Document');
    let headerHtml = '';
    if (metadata['TITLE'] || metadata['AUTHOR'] || metadata['DATE']) {
        headerHtml = '<header class="org-doc-header">';
        if (metadata['TITLE']) {
            headerHtml += `<h1 class="org-doc-title">${escapeHtml(metadata['TITLE'])}</h1>`;
        }
        const metaItems = [];
        if (metadata['AUTHOR']) {
            metaItems.push(`<span class="org-meta-item org-meta-author"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${escapeHtml(metadata['AUTHOR'])}</span>`);
        }
        if (metadata['DATE']) {
            metaItems.push(`<span class="org-meta-item org-meta-date"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg> ${escapeHtml(metadata['DATE'])}</span>`);
        }
        if (metaItems.length > 0) {
            headerHtml += `<div class="org-doc-meta">${metaItems.join('')}</div>`;
        }
        headerHtml += '</header>';
    }
    const fullHtml = headerHtml + out.join('\n');
    const safeHtml = sanitizeHtml(fullHtml);
    return {
        html: safeHtml,
        toc,
        title,
        metadata
    };
}

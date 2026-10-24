/**
 * Security-focused HTML sanitizer for Org Viewer.
 * Strictly whitelists tags, attributes, and URL protocols.
 * Strips scripts, dangerous elements, event handlers, and javascript: links.
 */

const ALLOWED_TAGS = new Set([
  'html', 'body', 'head', 'title',
  'div', 'section', 'article', 'header', 'footer', 'nav', 'main', 'aside',
  'span', 'p', 'hr', 'br',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'b', 'em', 'i', 'u', 'del', 's', 'code', 'kbd', 'pre', 'sub', 'sup', 'mark',
  'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'blockquote', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
  'a', 'img', 'time',
  'details', 'summary',
  'input', // only checkbox disabled
  'svg', 'polyline', 'path', 'circle', 'line', 'rect', 'polygon',
  // MathML Core elements
  'math', 'mrow', 'mfrac', 'msqrt', 'mroot', 'msup', 'msub', 'msubsup',
  'mi', 'mn', 'mo', 'mtext', 'mspace', 'mtable', 'mtr', 'mtd', 'mover', 'munder', 'munderover'
]);

const ALLOWED_ATTRS: Record<string, Set<string>> = {
  '*': new Set(['class', 'id', 'title', 'aria-label', 'aria-hidden', 'role', 'data-level', 'data-state', 'data-line', 'data-filename']),
  'a': new Set(['href', 'target', 'rel', 'title']),
  'img': new Set(['src', 'alt', 'title', 'width', 'height', 'loading']),
  'input': new Set(['type', 'checked', 'disabled']),
  'th': new Set(['colspan', 'rowspan', 'align', 'style']),
  'td': new Set(['colspan', 'rowspan', 'align', 'style']),
  'time': new Set(['datetime']),
  'details': new Set(['open']),
  'svg': new Set(['width', 'height', 'viewbox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin']),
  'polyline': new Set(['points']),
  'path': new Set(['d']),
  'circle': new Set(['cx', 'cy', 'r']),
  'line': new Set(['x1', 'y1', 'x2', 'y2']),
  'rect': new Set(['x', 'y', 'width', 'height', 'rx', 'ry']),
  // MathML attributes
  'math': new Set(['xmlns', 'display']),
  'mo': new Set(['stretchy', 'fence', 'separator', 'lspace', 'rspace']),
  'mtable': new Set(['columnalign', 'rowalign']),
  'mtd': new Set(['columnalign', 'rowalign']),
  'mtext': new Set(['mathvariant'])
};

const ALLOWED_SCHEMES = /^(https?:|mailto:|file:)/i;
const DISALLOWED_SCHEMES = /^(javascript|vbscript|data):/i;

export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  // Reject if contains quotes or angle brackets (attribute injection prevention)
  if (/["'<>`\s]/.test(trimmed)) {
    return false;
  }
  // Reject dangerous schemes
  if (DISALLOWED_SCHEMES.test(trimmed)) {
    return false;
  }
  // If it contains a colon, it must be an allowed scheme
  if (trimmed.includes(':')) {
    return ALLOWED_SCHEMES.test(trimmed);
  }
  // Otherwise it's a relative URL or anchor (#...)
  return true;
}

export function sanitizeHtml(dirtyHtml: string): string {
  if (!dirtyHtml) return '';

  // 1. Remove dangerous blocks completely (tags + content)
  let cleaned = dirtyHtml.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  cleaned = cleaned.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
  cleaned = cleaned.replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '');
  cleaned = cleaned.replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '');

  // 2. Tokenize and sanitize tags and attributes
  const tagRegex = /<\/?([a-z0-9\-]+)([^>]*)>/gi;

  cleaned = cleaned.replace(tagRegex, (fullMatch, rawTagName, rawAttrs) => {
    const tagName = rawTagName.toLowerCase();

    // If tag is not in whitelist, strip the tag but keep inner text
    if (!ALLOWED_TAGS.has(tagName)) {
      return '';
    }

    // Closing tag
    if (fullMatch.startsWith('</')) {
      return `</${tagName}>`;
    }

    // Process attributes
    const allowedForTag = ALLOWED_ATTRS[tagName] || new Set();
    const allowedUniversal = ALLOWED_ATTRS['*'];

    const attrRegex = /([a-z0-9\-_]+)(?:\s*=\s*(?:'([^']*)'|"([^"]*)"|([^\s>]+)))?/gi;
    let attrMatch: RegExpExecArray | null;
    const sanitizedAttrs: string[] = [];

    while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
      const attrName = attrMatch[1].toLowerCase();
      const attrVal = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';

      // Block all event handlers (onclick, onerror, onload, on*, etc.)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check if attribute is allowed
      if (allowedForTag.has(attrName) || allowedUniversal.has(attrName)) {
        // Additional validation for URLs in href and src
        if (attrName === 'href' || attrName === 'src') {
          if (!isSafeUrl(attrVal)) {
            continue; // drop unsafe URL
          }
          // For external links in <a>, ensure noopener noreferrer
          if (attrName === 'href' && (attrVal.startsWith('http://') || attrVal.startsWith('https://'))) {
            sanitizedAttrs.push('rel="noopener noreferrer"');
          }
        }

        // Additional validation for input checkboxes
        if (tagName === 'input') {
          if (attrName === 'type' && attrVal !== 'checkbox') continue;
          if (attrName === 'disabled' && attrVal !== 'disabled' && attrVal !== '') continue;
        }

        // Boolean attributes (disabled, checked) without value
        if (['disabled', 'checked', 'open'].includes(attrName) && (attrVal === '' || attrVal === attrName)) {
          sanitizedAttrs.push(attrName);
          continue;
        }

        // Escape attribute value quotes
        const escapedVal = attrVal
          .replace(/&/g, '&amp;')
          .replace(/"/g, '&quot;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        sanitizedAttrs.push(`${attrName}="${escapedVal}"`);
      }
    }

    const selfClosing = fullMatch.endsWith('/>') || ['img', 'hr', 'br', 'input'].includes(tagName);
    const attrString = sanitizedAttrs.length > 0 ? ' ' + sanitizedAttrs.join(' ') : '';
    return selfClosing ? `<${tagName}${attrString} />` : `<${tagName}${attrString}>`;
  });

  return cleaned;
}

/**
 * Lightweight, fast, zero-dependency syntax highlighter.
 * Generates standard highlight.js compatible HTML classes (hljs-*).
 */

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

interface LanguageDef {
  keywords: Set<string>;
  builtins?: Set<string>;
  commentSingle?: string;
  commentMultiStart?: string;
  commentMultiEnd?: string;
}

const LANGUAGES: Record<string, LanguageDef> = {
  javascript: {
    keywords: new Set([
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
      'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
      'with', 'yield', 'true', 'false', 'null', 'undefined'
    ]),
    builtins: new Set(['console', 'window', 'document', 'Math', 'JSON', 'Array', 'Object', 'Promise', 'Set', 'Map', 'String', 'Number', 'Boolean']),
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  typescript: {
    keywords: new Set([
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
      'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
      'with', 'yield', 'true', 'false', 'null', 'undefined', 'type', 'interface',
      'enum', 'implements', 'declare', 'namespace', 'readonly', 'as', 'any', 'unknown', 'never'
    ]),
    builtins: new Set(['console', 'window', 'document', 'Math', 'JSON', 'Array', 'Object', 'Promise', 'Set', 'Map', 'Record', 'Partial']),
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  python: {
    keywords: new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
      'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
      'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield'
    ]),
    builtins: new Set(['print', 'len', 'range', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'open', 'type', 'super', 'map', 'filter']),
    commentSingle: '#'
  },
  elisp: {
    keywords: new Set([
      'defun', 'defvar', 'defcustom', 'setq', 'let', 'let*', 'if', 'when', 'unless',
      'cond', 'while', 'dolist', 'dotimes', 'lambda', 'progn', 'prog1', 'quote',
      'provide', 'require', 'interactive', 'save-excursion', 'with-current-buffer',
      'nil', 't', 'car', 'cdr', 'cons', 'list', 'format', 'message'
    ]),
    commentSingle: ';'
  },
  bash: {
    keywords: new Set([
      'if', 'then', 'else', 'elif', 'fi', 'case', 'esac', 'for', 'while', 'until',
      'do', 'done', 'in', 'function', 'select', 'time', 'return', 'exit', 'echo',
      'export', 'local', 'source', 'set', 'unset'
    ]),
    builtins: new Set(['cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'sed', 'awk', 'cat', 'curl', 'git']),
    commentSingle: '#'
  },
  json: {
    keywords: new Set(['true', 'false', 'null'])
  },
  rust: {
    keywords: new Set([
      'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
      'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
      'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
      'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while'
    ]),
    builtins: new Set(['Option', 'Some', 'None', 'Result', 'Ok', 'Err', 'Vec', 'String', 'println', 'format', 'panic']),
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  go: {
    keywords: new Set([
      'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
      'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
      'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var',
      'true', 'false', 'nil'
    ]),
    builtins: new Set(['make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'close', 'panic', 'recover', 'fmt']),
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  sql: {
    keywords: new Set([
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'JOIN',
      'LEFT', 'RIGHT', 'INNER', 'OUTER', 'ON', 'GROUP', 'BY', 'ORDER', 'HAVING',
      'LIMIT', 'OFFSET', 'UNION', 'ALL', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS',
      'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY', 'VALUES'
    ]),
    commentSingle: '--',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  }
};

// Aliases
const ALIASES: Record<string, string> = {
  js: 'javascript',
  ts: 'typescript',
  py: 'python',
  'emacs-lisp': 'elisp',
  lisp: 'elisp',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  rs: 'rust',
  golang: 'go'
};

export function highlightCode(code: string, langName?: string): string {
  if (!langName) {
    return escapeHtml(code);
  }

  const normalized = (ALIASES[langName.toLowerCase()] || langName.toLowerCase()).trim();
  const lang = LANGUAGES[normalized];

  if (!lang) {
    return escapeHtml(code);
  }

  // Tokenize line by line
  const lines = code.split('\n');
  const resultLines: string[] = [];
  let inMultiComment = false;

  for (const line of lines) {
    let out = '';
    let i = 0;
    const len = line.length;

    while (i < len) {
      // Check multi-line comment end
      if (inMultiComment) {
        if (lang.commentMultiEnd && line.startsWith(lang.commentMultiEnd, i)) {
          out += escapeHtml(lang.commentMultiEnd) + '</span>';
          inMultiComment = false;
          i += lang.commentMultiEnd.length;
        } else {
          out += escapeHtml(line[i]);
          i++;
        }
        continue;
      }

      // Check multi-line comment start
      if (lang.commentMultiStart && line.startsWith(lang.commentMultiStart, i)) {
        inMultiComment = true;
        out += '<span class="hljs-comment">' + escapeHtml(lang.commentMultiStart);
        i += lang.commentMultiStart.length;
        continue;
      }

      // Check single-line comment
      if (lang.commentSingle && line.startsWith(lang.commentSingle, i)) {
        out += '<span class="hljs-comment">' + escapeHtml(line.slice(i)) + '</span>';
        i = len;
        break;
      }

      // String literals: "...", '...', `...`
      const char = line[i];
      if (char === '"' || char === "'" || (char === '`' && (normalized === 'javascript' || normalized === 'typescript'))) {
        const quote = char;
        let strEnd = i + 1;
        while (strEnd < len) {
          if (line[strEnd] === '\\') {
            strEnd += 2;
            continue;
          }
          if (line[strEnd] === quote) {
            strEnd++;
            break;
          }
          strEnd++;
        }
        const strContent = line.slice(i, strEnd);
        out += '<span class="hljs-string">' + escapeHtml(strContent) + '</span>';
        i = strEnd;
        continue;
      }

      // Numbers
      if (/\d/.test(char) && (i === 0 || /[\s,([+\-*/=><]/.test(line[i - 1]))) {
        let numEnd = i;
        while (numEnd < len && /[\d.xXa-fA-F_]/.test(line[numEnd])) {
          numEnd++;
        }
        out += '<span class="hljs-number">' + escapeHtml(line.slice(i, numEnd)) + '</span>';
        i = numEnd;
        continue;
      }

      // Identifiers / Words
      if (/[a-zA-Z_$]/.test(char)) {
        let wordEnd = i;
        while (wordEnd < len && /[a-zA-Z0-9_$\-]/.test(line[wordEnd])) {
          wordEnd++;
        }
        const word = line.slice(i, wordEnd);
        const upperWord = word.toUpperCase();

        if (lang.keywords.has(word) || lang.keywords.has(upperWord)) {
          out += '<span class="hljs-keyword">' + escapeHtml(word) + '</span>';
        } else if (lang.builtins && (lang.builtins.has(word) || lang.builtins.has(upperWord))) {
          out += '<span class="hljs-built_in">' + escapeHtml(word) + '</span>';
        } else if (wordEnd < len && line[wordEnd] === '(') {
          out += '<span class="hljs-title function_">' + escapeHtml(word) + '</span>';
        } else {
          out += escapeHtml(word);
        }
        i = wordEnd;
        continue;
      }

      // Default character
      out += escapeHtml(char);
      i++;
    }

    if (inMultiComment) {
      out += '</span>';
    }

    resultLines.push(out);
  }

  return resultLines.join('\n');
}
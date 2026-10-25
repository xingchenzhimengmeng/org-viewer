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
  types?: Set<string>;
  commentSingle?: string;
  commentMultiStart?: string;
  commentMultiEnd?: string;
  /** Words followed by ':' are property/key names (css, yaml). */
  attrBeforeColon?: boolean;
  /** Angle-bracket markup languages (html, xml, svg). */
  tagMarkup?: boolean;
}

const C_FAMILY_COMMENTS = { commentSingle: '//', commentMultiStart: '/*', commentMultiEnd: '*/' };

const LANGUAGES: Record<string, LanguageDef> = {
  javascript: {
    keywords: new Set([
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
      'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
      'with', 'yield', 'true', 'false', 'null', 'undefined', 'of', 'from', 'static', 'get', 'set'
    ]),
    builtins: new Set(['console', 'window', 'document', 'Math', 'JSON', 'Array', 'Object', 'Promise', 'Set', 'Map', 'String', 'Number', 'Boolean', 'fetch', 'setTimeout', 'parseInt', 'parseFloat']),
    types: new Set(['Error', 'TypeError', 'RegExp', 'Date', 'Symbol', 'Iterable', 'HTMLElement']),
    ...C_FAMILY_COMMENTS,
  },
  typescript: {
    keywords: new Set([
      'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue',
      'debugger', 'default', 'delete', 'do', 'else', 'export', 'extends', 'finally',
      'for', 'function', 'if', 'import', 'in', 'instanceof', 'let', 'new', 'return',
      'super', 'switch', 'this', 'throw', 'try', 'typeof', 'var', 'void', 'while',
      'with', 'yield', 'true', 'false', 'null', 'undefined', 'type', 'interface',
      'enum', 'implements', 'declare', 'namespace', 'readonly', 'as', 'any', 'unknown',
      'never', 'satisfies', 'keyof', 'infer', 'is', 'of', 'from', 'static', 'public', 'private', 'protected', 'abstract'
    ]),
    builtins: new Set(['console', 'window', 'document', 'Math', 'JSON', 'Array', 'Object', 'Promise', 'Set', 'Map', 'Record', 'Partial', 'Required', 'Omit', 'Pick']),
    types: new Set(['string', 'number', 'boolean', 'symbol', 'bigint', 'object', 'void', 'Error', 'RegExp', 'Date']),
    ...C_FAMILY_COMMENTS,
  },
  python: {
    keywords: new Set([
      'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break',
      'class', 'continue', 'def', 'del', 'elif', 'else', 'except', 'finally',
      'for', 'from', 'global', 'if', 'import', 'in', 'is', 'lambda', 'nonlocal',
      'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with', 'yield', 'match', 'case'
    ]),
    builtins: new Set(['print', 'len', 'range', 'int', 'str', 'list', 'dict', 'set', 'tuple', 'open', 'type', 'super', 'map', 'filter', 'zip', 'enumerate', 'sorted', 'sum', 'min', 'max', 'abs', 'isinstance', 'self', 'cls']),
    types: new Set(['Exception', 'ValueError', 'TypeError', 'KeyError', 'IndexError', 'Optional', 'List', 'Dict', 'Tuple', 'Set', 'Any', 'Union']),
    commentSingle: '#'
  },
  java: {
    keywords: new Set([
      'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
      'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
      'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
      'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
      'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
      'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
      'null', 'var', 'record', 'sealed', 'permits', 'yield'
    ]),
    builtins: new Set(['System', 'Math', 'Integer', 'Double', 'Boolean', 'Character', 'Thread', 'Runnable', 'Exception', 'Override', 'FunctionalInterface', 'println', 'printf', 'length', 'toString', 'equals', 'hashCode']),
    types: new Set(['String', 'Object', 'List', 'Map', 'Set', 'ArrayList', 'HashMap', 'HashSet', 'Optional', 'Stream', 'Collection', 'Iterable', 'Comparable', 'Long', 'Float', 'Byte', 'Short']),
    ...C_FAMILY_COMMENTS
  },
  c: {
    keywords: new Set([
      'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double',
      'else', 'enum', 'extern', 'float', 'for', 'goto', 'if', 'inline', 'int', 'long',
      'register', 'restrict', 'return', 'short', 'signed', 'sizeof', 'static', 'struct',
      'switch', 'typedef', 'union', 'unsigned', 'void', 'volatile', 'while', 'NULL'
    ]),
    builtins: new Set(['printf', 'scanf', 'malloc', 'free', 'calloc', 'realloc', 'memcpy', 'memmove', 'memset', 'strlen', 'strcmp', 'strcpy', 'strncpy', 'fopen', 'fclose', 'fprintf', 'fscanf', 'fread', 'fwrite', 'exit', 'main']),
    types: new Set(['size_t', 'ptrdiff_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'FILE', 'bool']),
    ...C_FAMILY_COMMENTS
  },
  cpp: {
    keywords: new Set([
      'alignas', 'alignof', 'auto', 'break', 'case', 'catch', 'class', 'const', 'constexpr',
      'const_cast', 'continue', 'decltype', 'default', 'delete', 'do', 'dynamic_cast', 'else',
      'enum', 'explicit', 'export', 'extern', 'final', 'for', 'friend', 'goto', 'if',
      'inline', 'mutable', 'namespace', 'new', 'noexcept', 'nullptr', 'operator', 'override',
      'private', 'protected', 'public', 'register', 'reinterpret_cast', 'return', 'sizeof',
      'static', 'static_assert', 'static_cast', 'struct', 'switch', 'template', 'this',
      'throw', 'try', 'typedef', 'typeid', 'typename', 'union', 'using', 'virtual', 'void',
      'volatile', 'while', 'true', 'false', 'concept', 'requires', 'co_await', 'co_return', 'co_yield'
    ]),
    builtins: new Set(['std', 'cout', 'cin', 'endl', 'cerr', 'move', 'forward', 'swap', 'begin', 'end', 'emplace_back', 'push_back', 'size', 'printf', 'malloc', 'free', 'main']),
    types: new Set(['string', 'vector', 'map', 'set', 'unordered_map', 'unordered_set', 'array', 'pair', 'tuple', 'unique_ptr', 'shared_ptr', 'weak_ptr', 'optional', 'variant', 'span', 'size_t', 'int64_t', 'uint32_t', 'string_view']),
    ...C_FAMILY_COMMENTS
  },
  csharp: {
    keywords: new Set([
      'abstract', 'as', 'base', 'bool', 'break', 'byte', 'case', 'catch', 'char', 'checked',
      'class', 'const', 'continue', 'decimal', 'default', 'delegate', 'do', 'double', 'else',
      'enum', 'event', 'explicit', 'extern', 'false', 'finally', 'fixed', 'float', 'for',
      'foreach', 'goto', 'if', 'implicit', 'in', 'int', 'interface', 'internal', 'is', 'lock',
      'long', 'namespace', 'new', 'null', 'object', 'operator', 'out', 'override', 'params',
      'private', 'protected', 'public', 'readonly', 'record', 'ref', 'return', 'sbyte', 'sealed',
      'short', 'sizeof', 'stackalloc', 'static', 'string', 'struct', 'switch', 'this', 'throw',
      'true', 'try', 'typeof', 'uint', 'ulong', 'unchecked', 'unsafe', 'ushort', 'using', 'var',
      'virtual', 'void', 'volatile', 'while', 'async', 'await', 'yield', 'partial', 'value', 'when'
    ]),
    builtins: new Set(['Console', 'Math', 'Task', 'Enumerable', 'BitConverter', 'Convert', 'Environment', 'GC', 'Activator', 'WriteLine', 'ReadLine']),
    types: new Set(['String', 'Int32', 'Int64', 'Double', 'Boolean', 'Char', 'Object', 'List', 'Dictionary', 'HashSet', 'Queue', 'Stack', 'IEnumerable', 'ICollection', 'IDisposable', 'Task', 'CancellationToken', 'Span', 'Memory']),
    ...C_FAMILY_COMMENTS
  },
  kotlin: {
    keywords: new Set([
      'package', 'import', 'class', 'interface', 'object', 'fun', 'val', 'var', 'vararg',
      'when', 'while', 'for', 'if', 'else', 'return', 'break', 'continue', 'throw', 'try',
      'catch', 'finally', 'in', 'is', 'as', 'typealias', 'constructor', 'init', 'companion',
      'data', 'sealed', 'enum', 'annotation', 'override', 'private', 'protected', 'public',
      'internal', 'abstract', 'final', 'open', 'suspend', 'lateinit', 'by', 'lazy', 'inline',
      'reified', 'out', 'operator', 'infix', 'tailrec', 'true', 'false', 'null', 'it'
    ]),
    builtins: new Set(['println', 'print', 'listOf', 'mapOf', 'setOf', 'mutableListOf', 'mutableMapOf', 'arrayOf', 'require', 'check', 'error', 'run', 'let', 'apply', 'also', 'with']),
    types: new Set(['String', 'Int', 'Long', 'Double', 'Float', 'Boolean', 'Char', 'Unit', 'Any', 'Nothing', 'List', 'Map', 'Set', 'Array', 'Pair', 'Result']),
    ...C_FAMILY_COMMENTS
  },
  go: {
    keywords: new Set([
      'break', 'case', 'chan', 'const', 'continue', 'default', 'defer', 'else',
      'fallthrough', 'for', 'func', 'go', 'goto', 'if', 'import', 'interface',
      'map', 'package', 'range', 'return', 'select', 'struct', 'switch', 'type', 'var',
      'true', 'false', 'nil', 'iota'
    ]),
    builtins: new Set(['make', 'new', 'len', 'cap', 'append', 'copy', 'delete', 'close', 'panic', 'recover', 'print', 'println', 'fmt', 'errorf', 'printf']),
    types: new Set(['string', 'int', 'int64', 'uint8', 'byte', 'rune', 'float64', 'float32', 'bool', 'error', 'any', 'context', 'WaitGroup', 'Mutex']),
    ...C_FAMILY_COMMENTS
  },
  rust: {
    keywords: new Set([
      'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else',
      'enum', 'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop',
      'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
      'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while',
      'box', 'macro_rules', 'lifetime'
    ]),
    builtins: new Set(['println', 'print', 'format', 'panic', 'vec', 'todo', 'unimplemented', 'assert', 'assert_eq', 'dbg', 'write', 'writeln']),
    types: new Set(['Option', 'Some', 'None', 'Result', 'Ok', 'Err', 'Vec', 'String', 'str', 'Box', 'Rc', 'Arc', 'HashMap', 'BTreeMap', 'HashSet', 'i32', 'i64', 'u8', 'u32', 'u64', 'usize', 'isize', 'f32', 'f64', 'bool', 'char']),
    ...C_FAMILY_COMMENTS
  },
  ruby: {
    keywords: new Set([
      'alias', 'and', 'begin', 'break', 'case', 'class', 'def', 'defined?', 'do', 'else',
      'elsif', 'end', 'ensure', 'for', 'if', 'in', 'module', 'next', 'not', 'or', 'redo',
      'rescue', 'retry', 'return', 'self', 'super', 'then', 'undef', 'unless', 'until',
      'when', 'while', 'yield', 'require', 'require_relative', 'include', 'extend', 'attr_accessor',
      'attr_reader', 'attr_writer', 'lambda', 'proc', 'true', 'false', 'nil', 'puts', 'raise'
    ]),
    builtins: new Set(['puts', 'print', 'p', 'pp', 'raise', 'format', 'loop', 'raise', 'gets', 'chomp', 'to_s', 'to_i', 'to_a', 'each', 'map', 'select', 'reject', 'reduce']),
    types: new Set(['Array', 'Hash', 'String', 'Symbol', 'Integer', 'Float', 'Boolean', 'NilClass', 'Object', 'Class', 'Module', 'Struct', 'Enumerable']),
    commentSingle: '#'
  },
  php: {
    keywords: new Set([
      'abstract', 'and', 'array', 'as', 'break', 'callable', 'case', 'catch', 'class',
      'clone', 'const', 'continue', 'declare', 'default', 'do', 'echo', 'else', 'elseif',
      'empty', 'enddeclare', 'endfor', 'endforeach', 'endif', 'endswitch', 'endwhile',
      'extends', 'final', 'finally', 'fn', 'for', 'foreach', 'function', 'global', 'goto',
      'if', 'implements', 'include', 'include_once', 'instanceof', 'insteadof', 'interface',
      'isset', 'list', 'match', 'namespace', 'new', 'or', 'print', 'private', 'protected',
      'public', 'readonly', 'require', 'require_once', 'return', 'static', 'switch', 'throw',
      'trait', 'try', 'unset', 'use', 'var', 'while', 'xor', 'yield', 'true', 'false', 'null'
    ]),
    builtins: new Set(['echo', 'print', 'isset', 'unset', 'empty', 'count', 'array_push', 'array_map', 'array_filter', 'implode', 'explode', 'sprintf', 'strlen', 'strpos', 'json_encode', 'json_decode', 'var_dump']),
    types: new Set(['int', 'float', 'string', 'bool', 'array', 'object', 'callable', 'iterable', 'mixed', 'void', 'never', 'self', 'parent', 'Exception', 'Throwable', 'PDO', 'DateTime']),
    commentSingle: '//',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
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
      'export', 'local', 'source', 'set', 'unset', 'readonly', 'declare', 'shift', 'trap'
    ]),
    builtins: new Set(['cd', 'ls', 'mkdir', 'rm', 'cp', 'mv', 'grep', 'sed', 'awk', 'cat', 'curl', 'git', 'chmod', 'chown', 'find', 'xargs', 'tar', 'ssh', 'scp', 'sudo', 'printf', 'read', 'test']),
    commentSingle: '#',
  },
  sql: {
    keywords: new Set([
      'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'UPDATE', 'DELETE', 'JOIN',
      'LEFT', 'RIGHT', 'INNER', 'OUTER', 'FULL', 'CROSS', 'ON', 'GROUP', 'BY', 'ORDER',
      'HAVING', 'LIMIT', 'OFFSET', 'UNION', 'ALL', 'AS', 'AND', 'OR', 'NOT', 'NULL', 'IS',
      'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'PRIMARY', 'KEY', 'VALUES', 'SET',
      'DISTINCT', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'EXISTS', 'BETWEEN', 'LIKE', 'IN',
      'WITH', 'RECURSIVE', 'RETURNING', 'CONSTRAINT', 'FOREIGN', 'REFERENCES', 'DEFAULT', 'UNIQUE'
    ]),
    builtins: new Set(['COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NOW', 'CURRENT_TIMESTAMP', 'CAST', 'CONVERT', 'SUBSTRING', 'TRIM', 'UPPER', 'LOWER', 'ROUND', 'ABS']),
    types: new Set(['INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'TEXT', 'VARCHAR', 'CHAR', 'BOOLEAN', 'BOOL', 'DATE', 'TIMESTAMP', 'NUMERIC', 'DECIMAL', 'FLOAT', 'DOUBLE', 'JSON', 'JSONB', 'UUID', 'SERIAL']),
    commentSingle: '--',
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  json: {
    keywords: new Set(['true', 'false', 'null']),
    attrBeforeColon: true
  },
  html: {
    keywords: new Set([]),
    commentMultiStart: '<!--',
    commentMultiEnd: '-->',
    tagMarkup: true
  },
  css: {
    keywords: new Set(['important', 'inherit', 'initial', 'unset', 'none', 'auto', 'flex', 'grid', 'block', 'inline', 'absolute', 'relative', 'fixed', 'sticky', 'solid', 'dashed', 'dotted', 'transparent', 'currentColor']),
    builtins: new Set(['rgb', 'rgba', 'hsl', 'hsla', 'calc', 'var', 'url', 'linear-gradient', 'radial-gradient', 'translate', 'scale', 'rotate', 'min', 'max', 'clamp']),
    attrBeforeColon: true,
    commentMultiStart: '/*',
    commentMultiEnd: '*/'
  },
  yaml: {
    keywords: new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']),
    attrBeforeColon: true,
    commentSingle: '#'
  },
};

// Aliases
const ALIASES: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  python3: 'python',
  'emacs-lisp': 'elisp',
  lisp: 'elisp',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  console: 'bash',
  rs: 'rust',
  golang: 'go',
  h: 'c',
  hpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  'c++': 'cpp',
  cs: 'csharp',
  'c#': 'csharp',
  kt: 'kotlin',
  rb: 'ruby',
  yml: 'yaml',
  xml: 'html',
  svg: 'html',
  vue: 'html',
  htm: 'html',
  scss: 'css',
  less: 'css',
  md: 'markdown'
};

const STRING_QUOTES = (normalized: string): Set<string> => {
  const quotes = new Set(['"', "'"]);
  if (normalized === 'javascript' || normalized === 'typescript' || normalized === 'bash') {
    quotes.add('`');
  }
  return quotes;
};

function highlightTag(segment: string): string {
  let out = '';
  // First word after '<' or '</' is the tag name; other words are attributes.
  const re = /(<\/?|\/?>|=)|([a-zA-Z_!][\w:.-]*)|("[^"]*"|'[^']*')|([\s\S])/g;
  let match: RegExpExecArray | null;
  let seenTagName = false;
  while ((match = re.exec(segment)) !== null) {
    if (match[1] !== undefined) {
      out += `<span class="hljs-punctuation">${escapeHtml(match[1])}</span>`;
      if (match[1] === '<' || match[1] === '</') seenTagName = false;
      continue;
    }
    if (match[2] !== undefined) {
      if (!seenTagName) {
        out += `<span class="hljs-keyword">${escapeHtml(match[2])}</span>`;
        seenTagName = true;
      } else {
        out += `<span class="hljs-attr">${escapeHtml(match[2])}</span>`;
      }
      continue;
    }
    if (match[3] !== undefined) {
      out += `<span class="hljs-string">${escapeHtml(match[3])}</span>`;
      continue;
    }
    out += escapeHtml(match[4]);
  }
  return out;
}

export function highlightCode(code: string, langName?: string): string {
  if (!langName) {
    return escapeHtml(code);
  }

  const normalized = (ALIASES[langName.toLowerCase()] || langName.toLowerCase()).trim();
  const lang = LANGUAGES[normalized];

  if (!lang) {
    return escapeHtml(code);
  }

  const quotes = STRING_QUOTES(normalized);

  // Tokenize line by line
  const lines = code.split('\n');
  const resultLines: string[] = [];
  let inMultiComment = false;

  for (const line of lines) {
    let out = '';
    let i = 0;
    const len = line.length;

    if (inMultiComment) {
      out += '<span class="hljs-comment">';
    }

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

      const char = line[i];

      // Markup tags: <div class="x">, </div>, <!DOCTYPE ...>
      if (lang.tagMarkup && char === '<' && /[a-zA-Z\/!]/.test(line[i + 1] || '')) {
        let end = i + 1;
        while (end < len) {
          const c = line[end];
          if (c === '"' || c === "'") {
            const q = c;
            end++;
            while (end < len && line[end] !== q) end++;
          } else if (c === '>') {
            break;
          }
          end++;
        }
        const segment = line.slice(i, Math.min(end + 1, len));
        if (segment.startsWith('<!--')) {
          const close = segment.indexOf('-->');
          if (close === -1) {
            out += '<span class="hljs-comment">' + escapeHtml(segment) + '</span>';
            inMultiComment = true;
          } else {
            out += '<span class="hljs-comment">' + escapeHtml(segment) + '</span>';
          }
        } else {
          out += highlightTag(segment);
        }
        i += segment.length;
        continue;
      }

      // Decorators / annotations / css at-rules: @word
      if (char === '@' && /[a-zA-Z_]/.test(line[i + 1] || '')) {
        let wordEnd = i + 1;
        while (wordEnd < len && /[\w-]/.test(line[wordEnd])) wordEnd++;
        out += '<span class="hljs-meta">@' + escapeHtml(line.slice(i + 1, wordEnd)) + '</span>';
        i = wordEnd;
        continue;
      }

      // String literals
      if (quotes.has(char)) {
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
      if (/\d/.test(char) && (i === 0 || /[\s,([+\-*/=><:]/.test(line[i - 1]))) {
        let numEnd = i;
        while (numEnd < len && /[\d.xXa-fA-F_]/.test(line[numEnd])) {
          numEnd++;
        }
        // css units
        while (numEnd < len && /[a-zA-Z%]/.test(line[numEnd])) numEnd++;
        out += '<span class="hljs-number">' + escapeHtml(line.slice(i, numEnd)) + '</span>';
        i = numEnd;
        continue;
      }

      // Identifiers / Words
      if (/[a-zA-Z_$#-]/.test(char) && !(char === '-' && /[\d]/.test(line[i + 1] || ''))) {
        // Hex colors: #fff, #a1b2c3
        if (char === '#' && /^#[0-9a-fA-F]{3,8}\b/.test(line.slice(i))) {
          const hex = line.slice(i).match(/^#[0-9a-fA-F]{3,8}\b/)![0];
          out += '<span class="hljs-number">' + escapeHtml(hex) + '</span>';
          i += hex.length;
          continue;
        }

        let wordEnd = i;
        while (wordEnd < len && /[a-zA-Z0-9_$#\-]/.test(line[wordEnd])) {
          wordEnd++;
        }
        if (wordEnd === i) wordEnd = i + 1;
        const word = line.slice(i, wordEnd);
        const upperWord = word.toUpperCase();
        const rest = line.slice(wordEnd);

        if (char === '$' && (normalized === 'bash' || normalized === 'php')) {
          out += '<span class="hljs-variable">' + escapeHtml(word) + '</span>';
        } else if (lang.keywords.has(word) || lang.keywords.has(upperWord)) {
          out += '<span class="hljs-keyword">' + escapeHtml(word) + '</span>';
        } else if (lang.types && (lang.types.has(word) || lang.types.has(upperWord))) {
          out += '<span class="hljs-built_in">' + escapeHtml(word) + '</span>';
        } else if (lang.attrBeforeColon && /^\s*:/.test(rest)) {
          out += '<span class="hljs-attr">' + escapeHtml(word) + '</span>';
        } else if (wordEnd < len && line[wordEnd] === '(') {
          out += '<span class="hljs-title function_">' + escapeHtml(word) + '</span>';
        } else if (lang.builtins && (lang.builtins.has(word) || lang.builtins.has(upperWord))) {
          out += '<span class="hljs-built_in">' + escapeHtml(word) + '</span>';
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

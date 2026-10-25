/**
 * Fast, lightweight LaTeX-to-MathML compiler.
 * Translates TeX math expressions into native MathML Core for Chromium browsers.
 * Zero dependencies, zero external fonts, 100% offline.
 */
const GREEK_AND_SYMBOLS = {
    // Lowercase Greek
    alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', varepsilon: 'ε',
    zeta: 'ζ', eta: 'η', theta: 'θ', vartheta: 'ϑ', iota: 'ι', kappa: 'κ',
    lambda: 'λ', mu: 'μ', nu: 'ν', xi: 'ξ', pi: 'π', varpi: 'ϖ',
    rho: 'ρ', varrho: 'ϱ', sigma: 'σ', varsigma: 'ς', tau: 'τ', upsilon: 'υ',
    phi: 'φ', varphi: 'ϕ', chi: 'χ', psi: 'ψ', omega: 'ω',
    // Uppercase Greek
    Gamma: 'Γ', Delta: 'Δ', Theta: 'Θ', Lambda: 'Λ', Xi: 'Ξ',
    Pi: 'Π', Sigma: 'Σ', Upsilon: 'Υ', Phi: 'Φ', Psi: 'Ψ', Omega: 'Ω',
    // Operators & Relations
    pm: '±', mp: '∓', times: '×', div: '÷', cdot: '·', ast: '∗', star: '⋆',
    circ: '∘', bullet: '∙', cap: '∩', cup: '∪', uplus: '⊎', sqcap: '⊓',
    sqcup: '⊔', vee: '∨', wedge: '∧', setminus: '∖', wr: '≀', diamond: '◇',
    leq: '≤', le: '≤', geq: '≥', ge: '≥', neq: '≠', ne: '≠', approx: '≈',
    equiv: '≡', sim: '∼', simeq: '≃', cong: '≅', propto: '∝',
    in: '∈', notin: '∉', ni: '∋', subset: '⊂', supset: '⊃',
    subseteq: '⊆', supseteq: '⊇', sqsubset: '⊏', sqsupset: '⊐',
    sqsubseteq: '⊑', sqsupseteq: '⊒',
    // Logic & Sets
    forall: '∀', exists: '∃', nexists: '∄', emptyset: '∅', empty: '∅',
    neg: '¬', top: '⊤', bot: '⊥',
    // Arrows
    rightarrow: '→', to: '→', leftarrow: '←', gets: '←',
    Rightarrow: '⇒', Leftarrow: '⇐', Leftrightarrow: '⇔', leftrightarrow: '↔',
    mapsto: '↦', hookrightarrow: '↪', hookleftarrow: '↩',
    uparrow: '↑', downarrow: '↓', Uparrow: '⇑', Downarrow: '⇓',
    // Calculus & Analysis
    int: '∫', iint: '∬', iiint: '∭', oint: '∮',
    sum: '∑', prod: '∏', coprod: '∐',
    partial: '∂', nabla: '∇', infty: '∞', prime: '′',
    // Dots & Spaces
    ldots: '…', cdots: '⋯', ddots: '⋱', vdots: '⋮', dots: '…',
    quad: '    ', qquad: '        '
};
// Accents rendered as <mover> with a Unicode accent character.
const ACCENTS = {
    hat: { char: 'ˆ', stretchy: false },
    widehat: { char: 'ˆ', stretchy: true },
    tilde: { char: '˜', stretchy: false },
    widetilde: { char: '˜', stretchy: true },
    bar: { char: '‾', stretchy: true },
    overline: { char: '‾', stretchy: true },
    vec: { char: '→', stretchy: true },
    dot: { char: '˙', stretchy: false },
    ddot: { char: '¨', stretchy: false },
    check: { char: 'ˇ', stretchy: false }
};
const MATH_FUNCS = new Set([
    'sin', 'cos', 'tan', 'arcsin', 'arccos', 'arctan',
    'sinh', 'cosh', 'tanh', 'sec', 'csc', 'cot',
    'log', 'ln', 'lg', 'exp', 'lim', 'sup', 'inf',
    'max', 'min', 'det', 'dim', 'gcd', 'deg', 'hom'
]);
function escapeXml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}
class TeXParser {
    input;
    pos = 0;
    len;
    constructor(input) {
        this.input = input;
        this.len = input.length;
    }
    peek() {
        return this.pos < this.len ? this.input[this.pos] : '';
    }
    skipWhitespace() {
        while (this.pos < this.len && /\s/.test(this.input[this.pos])) {
            this.pos++;
        }
    }
    parseGroup() {
        this.skipWhitespace();
        if (this.peek() === '{') {
            this.pos++; // consume '{'
            let depth = 1;
            let start = this.pos;
            while (this.pos < this.len && depth > 0) {
                if (this.input[this.pos] === '{')
                    depth++;
                else if (this.input[this.pos] === '}')
                    depth--;
                this.pos++;
            }
            const inner = this.input.slice(start, this.pos - 1);
            return new TeXParser(inner).parseAll();
        }
        // Single character/token group
        return this.parseToken();
    }
    parseToken() {
        this.skipWhitespace();
        if (this.pos >= this.len)
            return '';
        const ch = this.input[this.pos];
        // 1. TeX Command \command
        if (ch === '\\') {
            this.pos++;
            let cmd = '';
            if (this.pos < this.len && /[^a-zA-Z]/.test(this.input[this.pos])) {
                // Special character like \{, \}, \\, \;, \,
                cmd = this.input[this.pos++];
            }
            else {
                while (this.pos < this.len && /[a-zA-Z]/.test(this.input[this.pos])) {
                    cmd += this.input[this.pos++];
                }
            }
            // Check fractions \frac{A}{B}
            if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
                const num = this.parseGroup();
                const den = this.parseGroup();
                return `<mfrac><mrow>${num}</mrow><mrow>${den}</mrow></mfrac>`;
            }
            // Accents: \hat{y}, \overline{x}, \vec{v}, ...
            const accent = ACCENTS[cmd];
            if (accent) {
                const base = this.parseGroup();
                const stretchy = accent.stretchy ? ' stretchy="true"' : '';
                return `<mover><mrow>${base}</mrow><mo accent="true"${stretchy}>${accent.char}</mo></mover>`;
            }
            // Check square root \sqrt[n]{x} or \sqrt{x}
            if (cmd === 'sqrt') {
                this.skipWhitespace();
                let index = null;
                if (this.peek() === '[') {
                    this.pos++; // consume '['
                    const start = this.pos;
                    while (this.pos < this.len && this.input[this.pos] !== ']') {
                        this.pos++;
                    }
                    index = this.input.slice(start, this.pos);
                    if (this.peek() === ']')
                        this.pos++;
                }
                const body = this.parseGroup();
                if (index !== null) {
                    const parsedIdx = new TeXParser(index).parseAll();
                    return `<mroot><mrow>${body}</mrow><mrow>${parsedIdx}</mrow></mroot>`;
                }
                return `<msqrt><mrow>${body}</mrow></msqrt>`;
            }
            // Text \text{...} or \mathrm{...}
            if (cmd === 'text' || cmd === 'mathrm' || cmd === 'mathbf' || cmd === 'mathit') {
                this.skipWhitespace();
                if (this.peek() === '{') {
                    this.pos++;
                    const start = this.pos;
                    let depth = 1;
                    while (this.pos < this.len && depth > 0) {
                        if (this.input[this.pos] === '{')
                            depth++;
                        else if (this.input[this.pos] === '}')
                            depth--;
                        this.pos++;
                    }
                    const txt = this.input.slice(start, this.pos - 1);
                    return `<mtext>${escapeXml(txt)}</mtext>`;
                }
            }
            // Delimiters: \left( ... \right)
            if (cmd === 'left') {
                this.skipWhitespace();
                const delim = this.input[this.pos++] || '';
                return `<mo fence="true" stretchy="true">${escapeXml(delim === '.' ? '' : delim)}</mo>`;
            }
            if (cmd === 'right') {
                this.skipWhitespace();
                const delim = this.input[this.pos++] || '';
                return `<mo fence="true" stretchy="true">${escapeXml(delim === '.' ? '' : delim)}</mo>`;
            }
            // Begin / End environments
            if (cmd === 'begin') {
                return this.parseEnvironment();
            }
            // Mathematical functions: \sin, \cos, \ln, etc.
            if (MATH_FUNCS.has(cmd)) {
                return `<mo>${cmd}</mo>`;
            }
            // Greek letters and operators
            if (GREEK_AND_SYMBOLS[cmd]) {
                const symbol = GREEK_AND_SYMBOLS[cmd];
                const isOperator = /^[±∓×÷·∗⋆≤≥≠≈≡∼∈∉⊂⊃⊆⊇∀∃∅¬∫∬∭∮∑∏∐∂∇∞→←⇒⇐⇔↔]$/.test(symbol);
                return isOperator ? `<mo>${symbol}</mo>` : `<mi>${symbol}</mi>`;
            }
            // Escaped characters: \{, \}, \&, \%, \#
            if (cmd === '{' || cmd === '}' || cmd === '&' || cmd === '%' || cmd === '#') {
                return `<mo>${escapeXml(cmd)}</mo>`;
            }
            if (cmd === '\\') {
                return '';
            }
            return `<mi>${escapeXml(cmd)}</mi>`;
        }
        // 2. Numbers
        if (/\d/.test(ch)) {
            let num = '';
            while (this.pos < this.len && /[\d.]/.test(this.input[this.pos])) {
                num += this.input[this.pos++];
            }
            return `<mn>${num}</mn>`;
        }
        // 3. Alphabetic identifiers
        if (/[a-zA-Z]/.test(ch)) {
            this.pos++;
            return `<mi>${ch}</mi>`;
        }
        // 4. Operators and punctuation
        this.pos++;
        if (ch === '+' || ch === '-' || ch === '=' || ch === '<' || ch === '>' || ch === '!' || ch === ':' || ch === '*' || ch === '/') {
            return `<mo>${escapeXml(ch === '-' ? '−' : ch)}</mo>`;
        }
        if (ch === '(' || ch === ')' || ch === '[' || ch === ']' || ch === '|' || ch === ',') {
            return `<mo>${escapeXml(ch)}</mo>`;
        }
        return `<mtext>${escapeXml(ch)}</mtext>`;
    }
    parseEnvironment() {
        this.skipWhitespace();
        let envName = '';
        if (this.peek() === '{') {
            this.pos++;
            const start = this.pos;
            while (this.pos < this.len && this.input[this.pos] !== '}') {
                this.pos++;
            }
            envName = this.input.slice(start, this.pos);
            if (this.peek() === '}')
                this.pos++;
        }
        // Gather content until \end{envName}
        const endTag = `\\end{${envName}}`;
        const endIdx = this.input.indexOf(endTag, this.pos);
        if (endIdx === -1)
            return '';
        const envContent = this.input.slice(this.pos, endIdx);
        this.pos = endIdx + endTag.length;
        // Parse matrix or table rows
        if (envName.includes('matrix') || envName === 'cases') {
            const rows = envContent.split('\\\\').filter(r => r.trim().length > 0);
            let tableHtml = '<mtable>';
            for (const row of rows) {
                tableHtml += '<mtr>';
                const cells = row.split('&');
                for (const cell of cells) {
                    const parsedCell = new TeXParser(cell.trim()).parseAll();
                    tableHtml += `<mtd>${parsedCell}</mtd>`;
                }
                tableHtml += '</mtr>';
            }
            tableHtml += '</mtable>';
            if (envName === 'pmatrix') {
                return `<mo fence="true">(</mo>${tableHtml}<mo fence="true">)</mo>`;
            }
            if (envName === 'bmatrix') {
                return `<mo fence="true">[</mo>${tableHtml}<mo fence="true">]</mo>`;
            }
            if (envName === 'cases') {
                return `<mo fence="true">{</mo>${tableHtml}`;
            }
            return tableHtml;
        }
        return new TeXParser(envContent).parseAll();
    }
    parseAll() {
        let result = '';
        while (this.pos < this.len) {
            this.skipWhitespace();
            if (this.pos >= this.len)
                break;
            const base = this.parseToken();
            if (!base)
                continue;
            this.skipWhitespace();
            let sup = null;
            let sub = null;
            // Handle sub/superscripts in any order: x_1^2 or x^2_1
            while (this.pos < this.len && (this.peek() === '^' || this.peek() === '_')) {
                const op = this.input[this.pos++];
                if (op === '^') {
                    sup = this.parseGroup();
                }
                else if (op === '_') {
                    sub = this.parseGroup();
                }
                this.skipWhitespace();
            }
            if (sub !== null && sup !== null) {
                result += `<msubsup>${base}<mrow>${sub}</mrow><mrow>${sup}</mrow></msubsup>`;
            }
            else if (sub !== null) {
                result += `<msub>${base}<mrow>${sub}</mrow></msub>`;
            }
            else if (sup !== null) {
                result += `<msup>${base}<mrow>${sup}</mrow></msup>`;
            }
            else {
                result += base;
            }
        }
        return result;
    }
}
export function latexToMathML(latex, displayMode = false) {
    const trimmed = latex.trim();
    if (!trimmed)
        return '';
    const parser = new TeXParser(trimmed);
    const mathmlBody = parser.parseAll();
    const displayAttr = displayMode ? ' display="block"' : '';
    return `<math xmlns="http://www.w3.org/1998/Math/MathML"${displayAttr}><mrow>${mathmlBody}</mrow></math>`;
}

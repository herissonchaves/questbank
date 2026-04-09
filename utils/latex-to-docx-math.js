// QuestBank — LaTeX → docx.js Native Math Converter
// Converte expressões LaTeX em objetos Math nativos do Word (OMML)
// para que equações sejam editáveis no Word, não imagens.

window.LatexToDocxMath = (function () {

    // ── Mapa de letras gregas ──
    const GREEK = {
        alpha:'α', beta:'β', gamma:'γ', delta:'δ', epsilon:'ε', varepsilon:'ε',
        zeta:'ζ', eta:'η', theta:'θ', vartheta:'ϑ', iota:'ι', kappa:'κ',
        lambda:'λ', mu:'μ', nu:'ν', xi:'ξ', pi:'π', varpi:'ϖ',
        rho:'ρ', varrho:'ϱ', sigma:'σ', varsigma:'ς', tau:'τ',
        upsilon:'υ', phi:'φ', varphi:'ϕ', chi:'χ', psi:'ψ', omega:'ω',
        Gamma:'Γ', Delta:'Δ', Theta:'Θ', Lambda:'Λ', Xi:'Ξ', Pi:'Π',
        Sigma:'Σ', Upsilon:'Υ', Phi:'Φ', Psi:'Ψ', Omega:'Ω',
    };

    // ── Mapa de símbolos / operadores ──
    const SYMBOLS = {
        times:'×', div:'÷', cdot:'·', pm:'±', mp:'∓',
        leq:'≤', geq:'≥', neq:'≠', approx:'≈', equiv:'≡', sim:'∼',
        ll:'≪', gg:'≫', propto:'∝', perp:'⊥', parallel:'∥',
        infty:'∞', partial:'∂', nabla:'∇', hbar:'ℏ',
        forall:'∀', exists:'∃', in:'∈', notin:'∉',
        subset:'⊂', supset:'⊃', subseteq:'⊆', supseteq:'⊇',
        cup:'∪', cap:'∩', emptyset:'∅', varnothing:'∅',
        rightarrow:'→', leftarrow:'←', Rightarrow:'⇒', Leftarrow:'⇐',
        leftrightarrow:'↔', Leftrightarrow:'⇔',
        uparrow:'↑', downarrow:'↓',
        ldots:'…', cdots:'⋯', vdots:'⋮', ddots:'⋱',
        angle:'∠', degree:'°', circ:'∘',
        star:'⋆', bullet:'•', diamond:'◇',
        neg:'¬', wedge:'∧', vee:'∨', oplus:'⊕', otimes:'⊗',
        ell:'ℓ', Re:'ℜ', Im:'ℑ', aleph:'ℵ',
    };

    // ── Funções nomeadas ──
    const FUNCTIONS = new Set([
        'sin','cos','tan','cot','sec','csc',
        'arcsin','arccos','arctan','arcctg',
        'sinh','cosh','tanh','coth',
        'log','ln','exp','det','dim','ker','hom',
        'lim','limsup','liminf','sup','inf',
        'max','min','arg','gcd','deg',
        'Pr','sen',  // 'sen' é usado em português
    ]);

    // ── Acentos ──
    const ACCENTS = {
        vec:'⃗', hat:'̂', tilde:'̃', dot:'̇', ddot:'̈', bar:'̄', acute:'́', grave:'̀',
    };

    // ═══════════════════════════════════════════════
    //  TOKENIZER
    // ═══════════════════════════════════════════════
    function tokenize(tex) {
        const tokens = [];
        let i = 0;
        while (i < tex.length) {
            const ch = tex[i];
            if (ch === '\\') {
                i++;
                if (i >= tex.length) break;
                // Comandos com letras
                if (/[a-zA-Z]/.test(tex[i])) {
                    let cmd = '';
                    while (i < tex.length && /[a-zA-Z]/.test(tex[i])) cmd += tex[i++];
                    tokens.push({ t: 'CMD', v: cmd });
                } else {
                    // Char escapado: \, \; \! \{ \} \\ etc
                    const esc = tex[i]; i++;
                    if (esc === ',' || esc === ';' || esc === '!' || esc === ' ') {
                        tokens.push({ t: 'TEXT', v: ' ' }); // thin space → space
                    } else if (esc === '\\') {
                        tokens.push({ t: 'NEWLINE' });
                    } else {
                        tokens.push({ t: 'TEXT', v: esc });
                    }
                }
            } else if (ch === '{') { tokens.push({ t: '{' }); i++; }
              else if (ch === '}') { tokens.push({ t: '}' }); i++; }
              else if (ch === '^') { tokens.push({ t: '^' }); i++; }
              else if (ch === '_') { tokens.push({ t: '_' }); i++; }
              else if (ch === '[') { tokens.push({ t: '[' }); i++; }
              else if (ch === ']') { tokens.push({ t: ']' }); i++; }
              else if (ch === '&') { tokens.push({ t: 'TEXT', v: '' }); i++; } // alignment marker → skip
              else if (/\s/.test(ch)) { i++; } // skip whitespace
              else { tokens.push({ t: 'TEXT', v: ch }); i++; }
        }
        return tokens;
    }

    // ═══════════════════════════════════════════════
    //  PARSER  (recursive descent → AST)
    // ═══════════════════════════════════════════════
    function parse(tokens) {
        let pos = 0;
        const peek = () => tokens[pos];
        const advance = () => tokens[pos++];
        const at = (type) => peek() && peek().t === type;

        // Parse conteúdo entre { }
        function parseGroup() {
            if (!at('{')) return [{ n: 'run', v: '' }];
            advance(); // {
            const items = parseExprList('}');
            if (at('}')) advance();
            return items;
        }

        // Próximo token como grupo simples (um char ou {...})
        function parseArgument() {
            if (at('{')) return parseGroup();
            const t = advance();
            if (!t) return [{ n: 'run', v: '' }];
            if (t.t === 'CMD') return resolveCommand(t.v);
            return [{ n: 'run', v: t.v || '' }];
        }

        // Resolve um \comando
        function resolveCommand(cmd) {
            // Letras gregas
            if (GREEK[cmd]) return [{ n: 'run', v: GREEK[cmd] }];

            // Símbolos
            if (SYMBOLS[cmd]) return [{ n: 'run', v: SYMBOLS[cmd] }];

            // Funções nomeadas
            if (FUNCTIONS.has(cmd)) return [{ n: 'func', name: cmd }];

            // \frac{num}{den}
            if (cmd === 'frac' || cmd === 'dfrac' || cmd === 'tfrac') {
                const num = parseGroup();
                const den = parseGroup();
                return [{ n: 'frac', num, den }];
            }

            // \sqrt[n]{x}
            if (cmd === 'sqrt') {
                let degree = null;
                if (at('[')) {
                    advance();
                    degree = parseExprList(']');
                    if (at(']')) advance();
                }
                const body = parseGroup();
                return [{ n: 'radical', body, degree }];
            }

            // \sum, \prod
            if (cmd === 'sum')  return [{ n: 'nary', symbol: '∑' }];
            if (cmd === 'prod') return [{ n: 'nary', symbol: '∏' }];
            if (cmd === 'int')  return [{ n: 'nary', symbol: '∫' }];
            if (cmd === 'iint') return [{ n: 'nary', symbol: '∬' }];
            if (cmd === 'iiint')return [{ n: 'nary', symbol: '∭' }];
            if (cmd === 'oint') return [{ n: 'nary', symbol: '∮' }];
            if (cmd === 'lim')  return [{ n: 'func', name: 'lim' }];

            // \left( ... \right)
            if (cmd === 'left') {
                const openTok = advance();
                const open = openTok ? (openTok.v || openTok.t) : '(';
                const inner = parseExprList(null, true);
                // consumir \right
                if (at('CMD') && peek().v === 'right') {
                    advance(); // \right
                    advance(); // delimitador de fechamento
                }
                const openChar = open === '.' ? '' : open;
                return [{ n: 'run', v: openChar }, ...inner, { n: 'run', v: getClosing(openChar) }];
            }

            // \overline, \underline
            if (cmd === 'overline' || cmd === 'overrightarrow') {
                const body = parseGroup();
                return [{ n: 'overbar', body }];
            }
            if (cmd === 'underline') {
                const body = parseGroup();
                return body; // simplificado
            }

            // Acentos: \vec, \hat, \tilde, etc.
            if (ACCENTS[cmd]) {
                const body = parseGroup();
                // Para Word, combinamos o texto com o acento Unicode
                return [{ n: 'accented', body, accent: ACCENTS[cmd] }];
            }

            // \text{}, \mathrm{}, \textrm{}, \textbf{}
            if (cmd === 'text' || cmd === 'textrm' || cmd === 'mathrm' || cmd === 'mbox') {
                const body = parseGroup();
                return body;
            }
            if (cmd === 'textbf' || cmd === 'mathbf' || cmd === 'boldsymbol' || cmd === 'bf') {
                const body = parseGroup();
                return [{ n: 'bold', body }];
            }

            // \boxed{} — coloca box visual (simplificado)
            if (cmd === 'boxed') {
                const body = parseGroup();
                return [{ n: 'run', v: '[' }, ...body, { n: 'run', v: ']' }];
            }

            // \quad, \qquad — espaços
            if (cmd === 'quad')  return [{ n: 'run', v: '  ' }];
            if (cmd === 'qquad') return [{ n: 'run', v: '    ' }];

            // \Delta, \nabla já foram cobertos por SYMBOLS/GREEK
            // Comandos desconhecidos → texto
            return [{ n: 'run', v: cmd }];
        }

        function getClosing(open) {
            if (open === '(') return ')';
            if (open === '[') return ']';
            if (open === '{') return '}';
            if (open === '|') return '|';
            return ')';
        }

        // Parseia um átomo (um item sem scripts)
        function parseAtom() {
            const t = peek();
            if (!t) return null;

            if (t.t === '{') return parseGroup();

            if (t.t === 'TEXT') {
                advance();
                return [{ n: 'run', v: t.v }];
            }

            if (t.t === 'CMD') {
                advance();
                return resolveCommand(t.v);
            }

            if (t.t === 'NEWLINE') {
                advance();
                return [{ n: 'run', v: ' ' }];
            }

            return null;
        }

        // Parseia átomo + possíveis ^{} e _{}
        function parseMaybeScript() {
            let base = parseAtom();
            if (!base) return null;

            let sup = null, sub = null;
            while (peek() && (peek().t === '^' || peek().t === '_')) {
                if (peek().t === '^') {
                    advance();
                    sup = parseArgument();
                } else {
                    advance();
                    sub = parseArgument();
                }
            }

            if (sup && sub) return [{ n: 'subsup', base, sup, sub }];
            if (sup) return [{ n: 'sup', base, sup }];
            if (sub) return [{ n: 'sub', base, sub }];
            return base;
        }

        // Lista de expressões até encontrar stop token
        function parseExprList(stopToken, stopAtRight) {
            const items = [];
            while (pos < tokens.length) {
                if (stopToken && at(stopToken)) break;
                if (stopAtRight && at('CMD') && peek().v === 'right') break;
                const item = parseMaybeScript();
                if (!item) { advance(); continue; } // skip unrecognized
                items.push(...item);
            }
            return items;
        }

        return parseExprList();
    }

    // ═══════════════════════════════════════════════
    //  AST → docx.js Math Objects
    // ═══════════════════════════════════════════════
    function astToDocx(ast, D) {
        // D = referência ao namespace docx (passado externamente)
        function conv(nodes) {
            if (!nodes || nodes.length === 0) return [new D.MathRun('')];
            const result = [];
            for (const nd of nodes) {
                try {
                    switch (nd.n) {
                        case 'run':
                            result.push(new D.MathRun(nd.v || ''));
                            break;

                        case 'func':
                            // Função nomeada como texto normal em contexto math
                            result.push(new D.MathRun(nd.name));
                            break;

                        case 'bold':
                            // MathRun com bold
                            for (const child of conv(nd.body)) {
                                result.push(child);
                            }
                            break;

                        case 'frac':
                            result.push(new D.MathFraction({
                                numerator: conv(nd.num),
                                denominator: conv(nd.den),
                            }));
                            break;

                        case 'sup':
                            result.push(new D.MathSuperScript({
                                children: conv(nd.base),
                                superScript: conv(nd.sup),
                            }));
                            break;

                        case 'sub':
                            result.push(new D.MathSubScript({
                                children: conv(nd.base),
                                subScript: conv(nd.sub),
                            }));
                            break;

                        case 'subsup':
                            result.push(new D.MathSubSuperScript({
                                children: conv(nd.base),
                                superScript: conv(nd.sup),
                                subScript: conv(nd.sub),
                            }));
                            break;

                        case 'radical': {
                            const opts = { children: conv(nd.body) };
                            if (nd.degree) opts.degree = conv(nd.degree);
                            result.push(new D.MathRadical(opts));
                            break;
                        }

                        case 'nary':
                            // Símbolo nary (∑, ∫, etc) — renderizado como texto math
                            result.push(new D.MathRun(nd.symbol));
                            break;

                        case 'overbar':
                            // Overline — representado com barra sobre o texto
                            // docx.js não tem MathOverbar nativo facilmente,
                            // então combinamos com Unicode combining overline
                            for (const child of conv(nd.body)) {
                                result.push(child);
                            }
                            result.push(new D.MathRun('\u0305')); // combining overline
                            break;

                        case 'accented':
                            // Acento combinante Unicode
                            for (const child of conv(nd.body)) {
                                result.push(child);
                            }
                            if (nd.accent) result.push(new D.MathRun(nd.accent));
                            break;

                        default:
                            result.push(new D.MathRun(nd.v || ''));
                    }
                } catch (e) {
                    console.warn('Math node conversion error:', e, nd);
                    result.push(new D.MathRun(nd.v || nd.name || '?'));
                }
            }
            return result;
        }

        return conv(ast);
    }

    // ═══════════════════════════════════════════════
    //  API PÚBLICA
    // ═══════════════════════════════════════════════

    /**
     * Converte uma string LaTeX em um objeto docx.Math pronto para inserir em Paragraph.
     * @param {string} tex - Expressão LaTeX (sem delimitadores $ ... $)
     * @param {object} D - Namespace docx (window.docx)
     * @returns {object} - Instância de docx.Math com equação nativa
     */
    function convert(tex, D) {
        try {
            const tokens = tokenize(tex.trim());
            const ast = parse(tokens);
            const mathChildren = astToDocx(ast, D);
            return new D.Math({ children: mathChildren });
        } catch (e) {
            console.warn('LatexToDocxMath: falha ao converter, usando texto puro:', e, tex);
            return new D.Math({ children: [new D.MathRun(tex)] });
        }
    }

    /**
     * Verifica se a lib docx possui os componentes Math necessários.
     * @param {object} D - Namespace docx
     * @returns {boolean}
     */
    function isSupported(D) {
        return !!(D && D.Math && D.MathRun && D.MathFraction &&
                  D.MathSuperScript && D.MathSubScript && D.MathRadical);
    }

    return { convert, isSupported };
})();

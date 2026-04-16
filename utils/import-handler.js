// QuestBank — Import Handler
// Validates and imports questions from JSON files
// Supports both objetiva and discursiva question types

const QBImport = {
    REQUIRED_FIELDS: ['id', 'enunciado', 'disciplina', 'topico', 'conteudo', 'assunto', 'tipo', 'dificuldade'],
    VALID_TIPOS: ['objetiva', 'discursiva'],
    VALID_DIFICULDADES: ['facil', 'medio', 'dificil', 'nao_definida'],

    /**
     * Validate a JSON object against QuestBank Import Standard v1.0
     * Returns: { valid, errors[], warnings[], validQuestions[], stats }
     */
    validate(data) {
        const errors = [];
        const warnings = [];

        if (!data || typeof data !== 'object') {
            return { valid: false, errors: ['JSON inválido ou vazio.'], warnings, validQuestions: [], stats: {} };
        }

        if (!data.version) {
            warnings.push('Campo "version" ausente. Assumindo v1.0.');
        }

        if (!Array.isArray(data.questions) || data.questions.length === 0) {
            return {
                valid: false,
                errors: ['O campo "questions" deve ser um array com pelo menos uma questão.'],
                warnings,
                validQuestions: [],
                stats: {},
            };
        }

        const validQuestions = [];
        const seenIds = new Set();

        data.questions.forEach((q, i) => {
            const label = q.id ? `Questão "${q.id}"` : `Questão #${i + 1}`;

            // Check for duplicate IDs within the file
            if (q.id && seenIds.has(q.id)) {
                warnings.push(`${label}: ID duplicado no arquivo. Apenas a primeira ocorrência será importada.`);
                return;
            }
            if (q.id) seenIds.add(q.id);

            // Check required fields
            const missing = this.REQUIRED_FIELDS.filter(f => {
                const val = q[f];
                return val === undefined || val === null || val === '';
            });

            if (missing.length > 0) {
                errors.push(`${label}: campos obrigatórios ausentes — ${missing.join(', ')}`);
                return;
            }

            // Validate tipo
            if (!this.VALID_TIPOS.includes(q.tipo)) {
                errors.push(`${label}: tipo inválido "${q.tipo}". Valores aceitos: ${this.VALID_TIPOS.join(', ')}`);
                return;
            }

            // Validate dificuldade
            if (!this.VALID_DIFICULDADES.includes(q.dificuldade)) {
                errors.push(`${label}: dificuldade inválida "${q.dificuldade}". Valores aceitos: ${this.VALID_DIFICULDADES.join(', ')}`);
                return;
            }

            // Validate alternativas for objetiva
            if (q.tipo === 'objetiva') {
                if (!Array.isArray(q.alternativas) || q.alternativas.length === 0) {
                    errors.push(`${label}: tipo "objetiva" requer campo "alternativas" com pelo menos uma alternativa.`);
                    return;
                }

                if (!q.gabarito) {
                    warnings.push(`${label}: tipo "objetiva" sem campo "gabarito".`);
                }

                if (q.gabarito) {
                    const letras = q.alternativas.map(a => a.letra);
                    if (!letras.includes(q.gabarito)) {
                        warnings.push(`${label}: gabarito "${q.gabarito}" não corresponde a nenhuma alternativa (${letras.join(', ')}).`);
                    }
                }
            }

            // Discursiva: gabarito is optional (can be the expected answer or empty)
            if (q.tipo === 'discursiva' && !q.gabarito) {
                // This is fine — discursive questions may not have a fixed answer
            }

            // banca and ano are optional but recommended
            if (!q.banca) warnings.push(`${label}: campo "banca" ausente.`);
            if (!q.ano) warnings.push(`${label}: campo "ano" ausente.`);

            validQuestions.push(q);
        });

        return {
            valid: errors.length === 0,
            errors,
            warnings,
            validQuestions,
            stats: {
                total: data.questions.length,
                valid: validQuestions.length,
                rejected: data.questions.length - validQuestions.length,
            },
        };
    },

    /**
     * Import validated questions into IndexedDB
     * Returns: { imported, duplicates, total }
     */
    async importToDb(questions) {
        const existingIds = new Set((await db.questions.toArray()).map(q => q.id));
        const toInsert = [];
        let duplicates = 0;

        for (const q of questions) {
            if (existingIds.has(q.id)) {
                duplicates++;
                continue;
            }

            toInsert.push({
                id: q.id,
                enunciado: q.enunciado,
                disciplina: q.disciplina,
                topico: q.topico,
                conteudo: q.conteudo,
                assunto: q.assunto,
                banca: q.banca || '',
                ano: q.ano || '',
                tipo: q.tipo,
                dificuldade: q.dificuldade,
                gabarito: q.gabarito || '',
                alternativas: q.alternativas || [],
                imagens: q.imagens || [],
                resolucao_link: q.resolucao_link || '',
                regiao: q.regiao || '',
                tags: q.tags || [],
                usedInExams: [],
                created_at: new Date().toISOString(),
            });
        }

        if (toInsert.length > 0) {
            await db.questions.bulkAdd(toInsert);
        }

        return { imported: toInsert.length, duplicates, total: questions.length };
    },

    /**
     * Read a File object and parse as JSON
     */
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (err) {
                    reject(new Error('Arquivo não é um JSON válido.'));
                }
            };
            reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
            reader.readAsText(file);
        });
    },

    // -----------------------------------------------------------------
    // Suporte a .tex — delega ao servidor local latex2questbank
    // -----------------------------------------------------------------

    LATEX_SERVER: 'http://127.0.0.1:8765',

    /**
     * Verifica se o servidor LaTeX local está rodando.
     * Retorna { ok, version } ou { ok: false, error }.
     */
    async checkLatexServer() {
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), 1500);
            const res = await fetch(this.LATEX_SERVER + '/health', { signal: ctrl.signal });
            clearTimeout(t);
            if (!res.ok) return { ok: false, error: `status ${res.status}` };
            const data = await res.json();
            return { ok: true, version: data.version || '?' };
        } catch (err) {
            return { ok: false, error: err.message || 'servidor inacessível' };
        }
    },

    /**
     * Lê um arquivo .tex e envia para o servidor local converter em JSON.
     * Retorna os dados no formato QuestBank v1.0 ou lança um Error amigável.
     */
    async readTexFile(file) {
        const text = await file.text();
        let res;
        try {
            res = await fetch(this.LATEX_SERVER + '/convert-tex', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: text,
            });
        } catch (err) {
            throw new Error(
                'Servidor LaTeX não está rodando. Abra um terminal e execute:\n' +
                '   questbank-server\n' +
                '(veja questbank-server/README.md para instalação)'
            );
        }
        const data = await res.json().catch(() => ({ error: 'resposta inválida' }));
        if (!res.ok) {
            const parts = [data.error || 'erro desconhecido'];
            if (data.questao_id) parts.push(`questão: ${data.questao_id}`);
            if (data.line) parts.push(`linha: ${data.line}`);
            throw new Error(parts.join(' — '));
        }
        return data;
    },
};

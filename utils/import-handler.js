// QuestBank — Import Handler
// Validates and imports questions from JSON files
// Supports both objetiva and discursiva question types

const QBImport = {
    REQUIRED_FIELDS: ['enunciado', 'disciplina', 'topico', 'conteudo', 'assunto', 'tipo', 'dificuldade'],
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
        const allQuestions = await db.questions.toArray();
        
        let maxId = 0;
        for (const q of allQuestions) {
            const m1 = String(q.id).match(/^\d+/);
            const m2 = String(q.id).match(/^A(\d+)/);
            if (m1) maxId = Math.max(maxId, parseInt(m1[0], 10));
            if (m2) maxId = Math.max(maxId, parseInt(m2[1], 10));
        }

        const existingEnunciados = new Set(allQuestions.map(q => q.enunciado.trim()));
        const toInsert = [];
        let duplicates = 0;
        let nextId = maxId + 1;
        const idMapping = {};

        for (const q of questions) {
            if (existingEnunciados.has(q.enunciado.trim())) {
                duplicates++;
                continue;
            }
            existingEnunciados.add(q.enunciado.trim());

            let newId;
            let oldId = q.id ? String(q.id).trim() : '';

            // Verifica se é uma questão adaptada e qual o ID de referência dela (regular)
            let isAdapted = false;
            let baseOldId = '';

            if (oldId.includes('auto-')) {
                // Trata logs/pares do parser LaTeX
                if (oldId.startsWith('Aauto-')) {
                    isAdapted = true;
                    baseOldId = 'auto-' + oldId.substring(6);
                }
            } else if (oldId.startsWith('A-')) {
                isAdapted = true;
                baseOldId = oldId.substring(2);
            } else if (oldId.startsWith('A') && !oldId.startsWith('A-')) {
                // Apenas inicia com A (ex: A000052)
                isAdapted = true;
                baseOldId = oldId.substring(1);
            }

            if (isAdapted) {
                // Questão adaptada: vincula à questão regular correspondente
                if (baseOldId && idMapping[baseOldId]) {
                    newId = 'A' + idMapping[baseOldId];
                } else {
                    // Fallback se a regular não foi importada antes (ou falhou validação)
                    newId = 'A' + nextId;
                }
            } else {
                // Questão regular: ignora o ID do arquivo (seja qual for) e usa sequencial do banco
                newId = nextId.toString();
                if (oldId) {
                    idMapping[oldId] = newId; // Salva o novo ID para a adaptada achar
                }
                nextId++;
            }

            toInsert.push({
                id: newId,
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
    // Suporte a .zip (LaTeX + imagens) — delega .tex ao servidor local
    // -----------------------------------------------------------------

    LATEX_SERVER: 'http://127.0.0.1:8765',

    /** Mapa extensão → MIME type para imagens comuns */
    _mimeType(filename) {
        const ext = (filename.split('.').pop() || '').toLowerCase();
        const map = {
            png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
            gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp',
            bmp: 'image/bmp', ico: 'image/x-icon',
        };
        return map[ext] || 'application/octet-stream';
    },

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
     * Lê um arquivo .zip contendo um .tex + imagens.
     * 1. Extrai o .tex e as imagens do zip
     * 2. Envia o .tex ao servidor Python para parsing
     * 3. Substitui {arquivo: "nome.png"} por data URIs base64
     * Retorna os dados no formato QuestBank v1.0.
     */
    async readZipFile(file) {
        if (typeof JSZip === 'undefined') {
            throw new Error('Biblioteca JSZip não encontrada. Verifique o index.html.');
        }

        // 1. Abrir o zip
        const zipData = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(zipData);

        // 2. Localizar o .tex dentro do zip (pode estar na raiz ou em subpasta)
        let texFileName = null;
        let texContent = null;
        const imageFiles = {}; // basename → JSZip entry

        zip.forEach((relativePath, entry) => {
            if (entry.dir) return;
            const basename = relativePath.split('/').pop().toLowerCase();
            if (basename.endsWith('.tex') && !texFileName) {
                texFileName = relativePath;
            }
            // Indexar imagens por basename (case-insensitive)
            const imgExts = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp'];
            if (imgExts.some(ext => basename.endsWith(ext))) {
                imageFiles[basename] = entry;
                // Também indexar sem extensão alterada
                imageFiles[relativePath.split('/').pop().toLowerCase()] = entry;
            }
        });

        if (!texFileName) {
            throw new Error('Nenhum arquivo .tex encontrado dentro do .zip.');
        }

        texContent = await zip.file(texFileName).async('string');

        // 3. Enviar .tex ao servidor para parsing
        let res;
        try {
            res = await fetch(this.LATEX_SERVER + '/convert-tex', {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain; charset=utf-8' },
                body: texContent,
            });
        } catch (err) {
            throw new Error(
                'Servidor LaTeX não está rodando. Abra um terminal e execute:\n' +
                '   python -m latex2questbank\n' +
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

        // 4. Converter imagens referenciadas em base64 data URIs
        if (data.questions && Array.isArray(data.questions)) {
            for (const q of data.questions) {
                if (!q.imagens || !Array.isArray(q.imagens)) continue;
                const resolvedImages = [];
                for (const img of q.imagens) {
                    const arquivo = (img && typeof img === 'object') ? img.arquivo : img;
                    if (!arquivo || typeof arquivo !== 'string') continue;
                    const lookupKey = arquivo.toLowerCase();
                    const entry = imageFiles[lookupKey];
                    if (entry) {
                        const arrayBuf = await entry.async('arraybuffer');
                        const bytes = new Uint8Array(arrayBuf);
                        let binary = '';
                        for (let i = 0; i < bytes.length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const b64 = btoa(binary);
                        const mime = this._mimeType(arquivo);
                        resolvedImages.push(`data:${mime};base64,${b64}`);
                    } else {
                        // Imagem não encontrada no zip — manter referência original como aviso
                        resolvedImages.push(`[IMAGEM NÃO ENCONTRADA: ${arquivo}]`);
                    }
                }
                q.imagens = resolvedImages;
            }
        }

        return data;
    },
};

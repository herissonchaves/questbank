// QuestBank — API Client (substitui Dexie.js)
// Drop-in replacement para o objeto `db` — usa fetch() para chamar o backend REST.
// A interface é compatível com os padrões usados no app (toArray, add, update, delete, etc.)

(function () {
    'use strict';

    const BASE = '/api';

    // ─── Utilitário fetch ──────────────────────────────────────
    async function apiFetch(url, options = {}) {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`API ${options.method || 'GET'} ${url} → ${res.status}: ${text}`);
        }
        return res.json();
    }

    // ─── Cache local de questões ───────────────────────────────
    // O app carrega todas as questões uma vez no boot (loadQuestions).
    // Para operações where/filter que acontecem nas funções de taxonomia,
    // reutilizamos o cache para não fazer múltiplas requests GET /api/questions.
    let _questionsCache = null;

    async function getAllQuestions() {
        if (_questionsCache) return _questionsCache;
        _questionsCache = await apiFetch(`${BASE}/questions`);
        return _questionsCache;
    }

    function invalidateCache() {
        _questionsCache = null;
    }

    // ─── Objeto db (interface compatível com Dexie) ────────────
    const db = {

        // ── questions ────────────────────────────────────────
        questions: {

            // Retorna todas as questões
            async toArray() {
                const qs = await apiFetch(`${BASE}/questions`);
                _questionsCache = qs;          // atualiza cache
                return qs;
            },

            // Retorna uma questão pelo id
            async get(id) {
                try {
                    return await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`);
                } catch (err) {
                    if (err.message.includes('404')) return undefined;
                    throw err;
                }
            },

            // Cria uma questão. Retorna o id.
            async add(question) {
                invalidateCache();
                const r = await apiFetch(`${BASE}/questions`, {
                    method: 'POST',
                    body: JSON.stringify(question),
                });
                return r.id;
            },

            // Cria várias questões de uma vez (importação)
            async bulkAdd(questions) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/bulk`, {
                    method: 'POST',
                    body: JSON.stringify(questions),
                });
            },

            // Atualiza campos de uma questão (merge parcial)
            async update(id, fields) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify(fields),
                });
            },

            // Exclui uma questão
            async delete(id) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                });
            },

            // Exclui várias questões
            async bulkDelete(ids) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/bulk-delete`, {
                    method: 'POST',
                    body: JSON.stringify({ ids }),
                });
            },

            // Filtra questões em memória (compatibilidade com db.questions.filter(fn).toArray())
            filter(fn) {
                return {
                    async toArray() {
                        const all = await getAllQuestions();
                        return all.filter(fn);
                    }
                };
            },

            // Consulta por campo (compatibilidade com db.questions.where(field).equals(val).filter(fn).toArray())
            where(field) {
                return {
                    equals(value) {
                        return {
                            filter(fn) {
                                return {
                                    async toArray() {
                                        const all = await getAllQuestions();
                                        return all.filter(q => q[field] === value && fn(q));
                                    }
                                };
                            },
                            async toArray() {
                                const all = await getAllQuestions();
                                return all.filter(q => q[field] === value);
                            }
                        };
                    }
                };
            },
        },

        // ── exams ────────────────────────────────────────────
        exams: {

            // Retorna todas as provas (mais recente primeiro)
            orderBy(_field) {
                return {
                    reverse() {
                        return {
                            async toArray() {
                                return apiFetch(`${BASE}/exams`);
                            }
                        };
                    }
                };
            },

            // Salva uma prova no histórico. Retorna o id numérico gerado.
            async add(exam) {
                const r = await apiFetch(`${BASE}/exams`, {
                    method: 'POST',
                    body: JSON.stringify(exam),
                });
                return r.id;
            },

            // Exclui uma prova do histórico
            async delete(id) {
                await apiFetch(`${BASE}/exams/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                });
            },
        },

        // ── transaction ──────────────────────────────────────
        // As transações atômicas são tratadas pelos endpoints bulk do backend.
        // Aqui apenas executamos a função sequencialmente.
        // Para operações de taxonomia (bulk-patch), usamos o endpoint dedicado.
        async transaction(_mode, _tables, fn) {
            return fn(db);
        },
    };

    // Expõe `db` globalmente (compatível com o código existente)
    window.db = db;
    window.db._invalidateCache = invalidateCache;

})();

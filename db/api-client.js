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

        questions: {

            async toArray() {
                const qs = await apiFetch(`${BASE}/questions`);
                _questionsCache = qs;
                return qs;
            },

            async get(id) {
                try {
                    return await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`);
                } catch (err) {
                    if (err.message.includes('404')) return undefined;
                    throw err;
                }
            },

            async add(question) {
                invalidateCache();
                const r = await apiFetch(`${BASE}/questions`, {
                    method: 'POST',
                    body: JSON.stringify(question),
                });
                return r.id;
            },

            async bulkAdd(questions) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/bulk`, {
                    method: 'POST',
                    body: JSON.stringify(questions),
                });
            },

            async update(id, fields) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`, {
                    method: 'PATCH',
                    body: JSON.stringify(fields),
                });
            },

            // Atualiza várias questões em uma única chamada (merge parcial).
            // updates: [{ id, ...fields }, ...] — evita N+1 round-trips.
            async bulkPatch(updates) {
                if (!Array.isArray(updates) || updates.length === 0) return;
                invalidateCache();
                await apiFetch(`${BASE}/questions/bulk-patch`, {
                    method: 'POST',
                    body: JSON.stringify({ updates }),
                });
            },

            async delete(id) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                });
            },

            async bulkDelete(ids) {
                invalidateCache();
                await apiFetch(`${BASE}/questions/bulk-delete`, {
                    method: 'POST',
                    body: JSON.stringify({ ids }),
                });
            },

            async clear() {
                invalidateCache();
                await apiFetch(`${BASE}/questions`, { method: 'DELETE' });
            },

            filter(fn) {
                return {
                    async toArray() {
                        const all = await getAllQuestions();
                        return all.filter(fn);
                    }
                };
            },

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

        exams: {

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

            async add(exam) {
                const r = await apiFetch(`${BASE}/exams`, {
                    method: 'POST',
                    body: JSON.stringify(exam),
                });
                return r.id;
            },

            async delete(id) {
                await apiFetch(`${BASE}/exams/${encodeURIComponent(id)}`, {
                    method: 'DELETE',
                });
            },

            async clear() {
                await apiFetch(`${BASE}/exams`, { method: 'DELETE' });
            },

            async bulkAdd(exams) {
                for (const exam of exams) {
                    await apiFetch(`${BASE}/exams`, {
                        method: 'POST',
                        body: JSON.stringify(exam),
                    });
                }
            },
        },

        // Stub para compatibilidade com backup/restore (settings não são usados no backend)
        settings: {
            async clear() { /* no-op */ },
            async bulkAdd(_items) { /* no-op */ },
            async toArray() { return []; },
        },

        // Mantido por compatibilidade com código que escreveu `await db.transaction(...)`.
        // Como cada chamada agora é uma request HTTP independente, esta função apenas
        // executa o callback. Para garantir atomicidade, use os endpoints bulk-*.
        async transaction(_mode, _tables, fn) {
            return fn(db);
        },
    };

    window.db = db;
    window.db._invalidateCache = invalidateCache;

})();

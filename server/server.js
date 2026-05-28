// QuestBank — Backend API
// Node.js + Express + SQLite (better-sqlite3)
// Banco de dados persistente em /data/questbank.db (montado via Docker volume)

'use strict';

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ─── Configuração ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || '/data/questbank.db';

// Garante que o diretório de dados existe
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── Banco de Dados ────────────────────────────────────────────
const db = new Database(DB_PATH);

// Ativa WAL mode para melhor performance em leituras concorrentes.
// synchronous = NORMAL é a combinação canônica com WAL: mantém durabilidade
// prática (sobrevive a crash do app) e é drasticamente mais rápido em escrita.
// busy_timeout protege contra SQLITE_BUSY em rajadas concorrentes.
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

// Cria as tabelas se não existirem
db.exec(`
    CREATE TABLE IF NOT EXISTS questions (
        id   TEXT PRIMARY KEY,
        data TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exams (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        created_at TEXT    NOT NULL,
        data       TEXT    NOT NULL
    );
`);

// ─── Express ───────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));  // questões podem ter imagens em base64

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: DB_PATH });
});

// ═══════════════════════════════════════════════════════════════
//  QUESTIONS
// ═══════════════════════════════════════════════════════════════

// GET /api/questions — retorna todas as questões
app.get('/api/questions', (req, res) => {
    try {
        const rows = db.prepare('SELECT data FROM questions').all();
        const questions = rows.map(r => JSON.parse(r.data));
        res.json(questions);
    } catch (err) {
        console.error('GET /api/questions', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/questions/:id — retorna uma questão
app.get('/api/questions/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT data FROM questions WHERE id = ?').get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Questão não encontrada' });
        res.json(JSON.parse(row.data));
    } catch (err) {
        console.error('GET /api/questions/:id', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/questions — cria uma questão
app.post('/api/questions', (req, res) => {
    try {
        const q = req.body;
        if (!q || !q.id) return res.status(400).json({ error: 'Questão deve ter campo id' });
        db.prepare('INSERT OR REPLACE INTO questions (id, data) VALUES (?, ?)').run(
            String(q.id),
            JSON.stringify(q)
        );
        res.status(201).json({ id: q.id });
    } catch (err) {
        console.error('POST /api/questions', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/questions/bulk — cria várias questões (importação)
app.post('/api/questions/bulk', (req, res) => {
    try {
        const questions = req.body;
        if (!Array.isArray(questions)) return res.status(400).json({ error: 'Esperado array de questões' });

        const insert = db.prepare('INSERT OR REPLACE INTO questions (id, data) VALUES (?, ?)');
        const insertMany = db.transaction((qs) => {
            for (const q of qs) {
                insert.run(String(q.id), JSON.stringify(q));
            }
        });
        insertMany(questions);
        res.status(201).json({ count: questions.length });
    } catch (err) {
        console.error('POST /api/questions/bulk', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/questions/:id — atualiza campos de uma questão (merge)
app.patch('/api/questions/:id', (req, res) => {
    try {
        const row = db.prepare('SELECT data FROM questions WHERE id = ?').get(req.params.id);
        if (!row) return res.status(404).json({ error: 'Questão não encontrada' });

        const existing = JSON.parse(row.data);
        const updated = { ...existing, ...req.body };
        db.prepare('UPDATE questions SET data = ? WHERE id = ?').run(
            JSON.stringify(updated),
            req.params.id
        );
        res.json({ id: req.params.id });
    } catch (err) {
        console.error('PATCH /api/questions/:id', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/questions/bulk-patch — atualiza campos em lote (operações de taxonomia)
app.post('/api/questions/bulk-patch', (req, res) => {
    try {
        const { updates } = req.body; // [{ id, ...fields }, ...]
        if (!Array.isArray(updates)) return res.status(400).json({ error: 'Esperado { updates: [...] }' });

        const getQ = db.prepare('SELECT data FROM questions WHERE id = ?');
        const updateQ = db.prepare('UPDATE questions SET data = ? WHERE id = ?');

        const batchUpdate = db.transaction((upds) => {
            for (const upd of upds) {
                const { id, ...fields } = upd;
                const row = getQ.get(String(id));
                if (!row) continue;
                const existing = JSON.parse(row.data);
                const updated = { ...existing, ...fields };
                updateQ.run(JSON.stringify(updated), String(id));
            }
        });
        batchUpdate(updates);
        res.json({ count: updates.length });
    } catch (err) {
        console.error('POST /api/questions/bulk-patch', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/questions/:id — exclui uma questão
app.delete('/api/questions/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM questions WHERE id = ?').run(req.params.id);
        res.json({ id: req.params.id });
    } catch (err) {
        console.error('DELETE /api/questions/:id', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/questions/bulk-delete — exclui várias questões
app.post('/api/questions/bulk-delete', (req, res) => {
    try {
        const { ids } = req.body;
        if (!Array.isArray(ids)) return res.status(400).json({ error: 'Esperado { ids: [...] }' });

        const deleteOne = db.prepare('DELETE FROM questions WHERE id = ?');
        const deleteMany = db.transaction((idList) => {
            for (const id of idList) deleteOne.run(String(id));
        });
        deleteMany(ids);
        res.json({ count: ids.length });
    } catch (err) {
        console.error('POST /api/questions/bulk-delete', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/questions — apaga TODAS as questões (usado no restore de backup)
app.delete('/api/questions', (req, res) => {
    try {
        const info = db.prepare('DELETE FROM questions').run();
        res.json({ deleted: info.changes });
    } catch (err) {
        console.error('DELETE /api/questions', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/exams — apaga TODOS os exames (usado no restore de backup)
app.delete('/api/exams', (req, res) => {
    try {
        const info = db.prepare('DELETE FROM exams').run();
        res.json({ deleted: info.changes });
    } catch (err) {
        console.error('DELETE /api/exams', err);
        res.status(500).json({ error: err.message });
    }
});

// ═══════════════════════════════════════════════════════════════
//  EXAMS (histórico de provas geradas)
// ═══════════════════════════════════════════════════════════════

// GET /api/exams — retorna todas as provas, mais recente primeiro
app.get('/api/exams', (req, res) => {
    try {
        const rows = db.prepare('SELECT id, data FROM exams ORDER BY created_at DESC').all();
        const exams = rows.map(r => ({ id: r.id, ...JSON.parse(r.data) }));
        res.json(exams);
    } catch (err) {
        console.error('GET /api/exams', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/exams — salva uma prova no histórico, retorna o id gerado
app.post('/api/exams', (req, res) => {
    try {
        const exam = req.body;
        const created_at = exam.created_at || new Date().toISOString();
        const result = db.prepare(
            'INSERT INTO exams (created_at, data) VALUES (?, ?)'
        ).run(created_at, JSON.stringify(exam));
        res.status(201).json({ id: result.lastInsertRowid });
    } catch (err) {
        console.error('POST /api/exams', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/exams/:id — exclui uma prova do histórico
app.delete('/api/exams/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM exams WHERE id = ?').run(req.params.id);
        res.json({ id: req.params.id });
    } catch (err) {
        console.error('DELETE /api/exams/:id', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Start ────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`QuestBank API rodando na porta ${PORT}`);
    console.log(`Banco de dados: ${DB_PATH}`);
});

// ─── Graceful shutdown ────────────────────────────────────────
// Quando o Docker manda SIGTERM (rebuild, restart, deploy), paramos de aceitar
// novas conexões, esperamos as inflight, fechamos o SQLite com checkpoint
// limpo do WAL e só então saímos. Sem isso, transações grandes em curso
// podem deixar o banco em estado inconsistente.
let shuttingDown = false;
function shutdown(signal, exitCode = 0) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(`[shutdown] Sinal recebido: ${signal}. Encerrando...`);

    // Timeout de segurança: se algo travar, força saída em 10s
    const killSwitch = setTimeout(() => {
        console.error('[shutdown] Timeout de 10s atingido — forçando exit(1)');
        process.exit(1);
    }, 10000);
    killSwitch.unref();

    server.close((err) => {
        if (err) {
            console.error('[shutdown] Erro ao fechar servidor HTTP:', err);
            exitCode = 1;
        } else {
            console.log('[shutdown] Servidor HTTP fechado');
        }
        try {
            db.close();
            console.log('[shutdown] SQLite fechado (checkpoint WAL concluído)');
        } catch (e) {
            console.error('[shutdown] Erro ao fechar SQLite:', e);
            exitCode = 1;
        }
        process.exit(exitCode);
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Crashes silenciosos viram um mistério em 24/7. Loga e deixa o Docker
// reiniciar (restart: unless-stopped) — assim aparece nos logs e a gente
// não fica adivinhando por que o container reiniciou.
process.on('uncaughtException', (err) => {
    console.error('[uncaughtException]', err);
    shutdown('uncaughtException', 1);
});

process.on('unhandledRejection', (reason) => {
    console.error('[unhandledRejection]', reason);
    // Não derruba o processo: muitos unhandledRejection vêm de libs e seriam
    // benignos. Mas fica registrado no log para diagnóstico posterior.
});

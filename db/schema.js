// QuestBank — Database Schema (Dexie.js v3)
// IndexedDB with optimized indices for taxonomy + filtering + exam history

const db = new Dexie('QuestBankDB');

// Version 1: original schema
db.version(1).stores({
    questions: 'id, disciplina, topico, conteudo, assunto, banca, ano, tipo, dificuldade, created_at',
    exams: '++id, title, created_at',
    settings: 'key',
});

// Version 2: add usedInExams to questions, improve exams table
db.version(2).stores({
    questions: 'id, disciplina, topico, conteudo, assunto, banca, ano, tipo, dificuldade, regiao, *tags, *usedInExams, created_at',
    exams: '++id, title, created_at',
    settings: 'key',
}).upgrade(tx => {
    // Add usedInExams array to existing questions
    return tx.table('questions').toCollection().modify(q => {
        if (!q.usedInExams) q.usedInExams = [];
        if (!q.regiao) q.regiao = '';
        if (!q.tags) q.tags = [];
    });
});

// Discipline color palette — consistent colors per discipline (light theme)
const DISCIPLINE_COLORS = {
    'Fisica':     { bg: 'bg-blue-50',     text: 'text-blue-700',     border: 'border-blue-200',   dot: 'bg-blue-500' },
    'Quimica':    { bg: 'bg-emerald-50',  text: 'text-emerald-700',  border: 'border-emerald-200', dot: 'bg-emerald-500' },
    'Biologia':   { bg: 'bg-green-50',    text: 'text-green-700',    border: 'border-green-200',   dot: 'bg-green-500' },
    'Matematica': { bg: 'bg-amber-50',    text: 'text-amber-700',    border: 'border-amber-200',   dot: 'bg-amber-500' },
    'Portugues':  { bg: 'bg-rose-50',     text: 'text-rose-700',     border: 'border-rose-200',    dot: 'bg-rose-500' },
    'Historia':   { bg: 'bg-orange-50',   text: 'text-orange-700',   border: 'border-orange-200',  dot: 'bg-orange-500' },
    'Geografia':  { bg: 'bg-teal-50',     text: 'text-teal-700',     border: 'border-teal-200',    dot: 'bg-teal-500' },
    'Filosofia':  { bg: 'bg-purple-50',   text: 'text-purple-700',   border: 'border-purple-200',  dot: 'bg-purple-500' },
    'Sociologia': { bg: 'bg-pink-50',     text: 'text-pink-700',     border: 'border-pink-200',    dot: 'bg-pink-500' },
    'Ingles':     { bg: 'bg-cyan-50',     text: 'text-cyan-700',     border: 'border-cyan-200',    dot: 'bg-cyan-500' },
};

const DIFFICULTY_STYLES = {
    'facil':          { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Fácil',         dot: 'bg-emerald-500' },
    'medio':          { bg: 'bg-amber-50',   text: 'text-amber-700',   label: 'Médio',         dot: 'bg-amber-500' },
    'dificil':        { bg: 'bg-rose-50',    text: 'text-rose-700',    label: 'Difícil',       dot: 'bg-rose-500' },
    'nao_definida':   { bg: 'bg-gray-50',    text: 'text-gray-500',    label: 'Não definida',  dot: 'bg-gray-400' },
};

const TYPE_LABELS = {
    'objetiva':   'Objetiva',
    'discursiva': 'Discursiva',
    'v_f':        'V/F',
    'somatoria':  'Somatória',
};

function getDisciplineColor(disciplina) {
    if (DISCIPLINE_COLORS[disciplina]) return DISCIPLINE_COLORS[disciplina];
    const key = Object.keys(DISCIPLINE_COLORS).find(k =>
        disciplina.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(disciplina.toLowerCase())
    );
    return DISCIPLINE_COLORS[key] || { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500' };
}

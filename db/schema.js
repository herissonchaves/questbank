// QuestBank — Database Schema (Dexie.js v3)
// IndexedDB with optimized indices for taxonomy + filtering

const db = new Dexie('QuestBankDB');

db.version(1).stores({
    // Questions table — main data store
    // Indexed fields enable fast filtering by taxonomy and metadata
    questions: 'id, disciplina, topico, conteudo, assunto, banca, ano, tipo, dificuldade, created_at',

    // Exams table — saved exam configurations
    exams: '++id, title, created_at',

    // Settings table — user preferences (key-value store)
    settings: 'key',
});

// Discipline color palette — consistent colors per discipline
const DISCIPLINE_COLORS = {
    'Fisica':     { bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/30',    dot: 'bg-blue-400' },
    'Quimica':    { bg: 'bg-emerald-500/10',  text: 'text-emerald-400',  border: 'border-emerald-500/30',  dot: 'bg-emerald-400' },
    'Biologia':   { bg: 'bg-green-500/10',    text: 'text-green-400',    border: 'border-green-500/30',    dot: 'bg-green-400' },
    'Matematica': { bg: 'bg-amber-500/10',    text: 'text-amber-400',    border: 'border-amber-500/30',    dot: 'bg-amber-400' },
    'Portugues':  { bg: 'bg-rose-500/10',     text: 'text-rose-400',     border: 'border-rose-500/30',     dot: 'bg-rose-400' },
    'Historia':   { bg: 'bg-orange-500/10',   text: 'text-orange-400',   border: 'border-orange-500/30',   dot: 'bg-orange-400' },
    'Geografia':  { bg: 'bg-teal-500/10',     text: 'text-teal-400',     border: 'border-teal-500/30',     dot: 'bg-teal-400' },
    'Filosofia':  { bg: 'bg-purple-500/10',   text: 'text-purple-400',   border: 'border-purple-500/30',   dot: 'bg-purple-400' },
    'Sociologia': { bg: 'bg-pink-500/10',     text: 'text-pink-400',     border: 'border-pink-500/30',     dot: 'bg-pink-400' },
    'Ingles':     { bg: 'bg-cyan-500/10',     text: 'text-cyan-400',     border: 'border-cyan-500/30',     dot: 'bg-cyan-400' },
};

const DIFFICULTY_STYLES = {
    'facil':   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Fácil',   dot: 'bg-emerald-400' },
    'medio':   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   label: 'Médio',   dot: 'bg-amber-400' },
    'dificil': { bg: 'bg-rose-500/10',     text: 'text-rose-400',     label: 'Difícil', dot: 'bg-rose-400' },
};

const TYPE_LABELS = {
    'objetiva':   'Objetiva',
    'discursiva': 'Discursiva',
    'v_f':        'V/F',
    'somatoria':  'Somatória',
};

function getDisciplineColor(disciplina) {
    // Try exact match, then partial match, then default
    if (DISCIPLINE_COLORS[disciplina]) return DISCIPLINE_COLORS[disciplina];
    const key = Object.keys(DISCIPLINE_COLORS).find(k =>
        disciplina.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(disciplina.toLowerCase())
    );
    return DISCIPLINE_COLORS[key] || { bg: 'bg-indigo-500/10', text: 'text-indigo-400', border: 'border-indigo-500/30', dot: 'bg-indigo-400' };
}

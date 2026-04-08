// QuestBank — Main App Component
// 3-panel layout with state management via useReducer

const { useState, useEffect, useReducer, useMemo, useCallback } = React;

// ─── State Management ───────────────────────────────────────

const initialState = {
    questions: [],
    selectedIds: [],
    activeSubjects: [],
    filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '' },
    modals: { import: false, export: false },
    loading: true,
};

function reducer(state, action) {
    switch (action.type) {
        case 'SET_QUESTIONS':
            return { ...state, questions: action.payload, loading: false };

        case 'TOGGLE_SELECT': {
            const id = action.payload;
            const ids = state.selectedIds.includes(id)
                ? state.selectedIds.filter(i => i !== id)
                : [...state.selectedIds, id];
            return { ...state, selectedIds: ids };
        }

        case 'REMOVE_SELECTED':
            return { ...state, selectedIds: state.selectedIds.filter(i => i !== action.payload) };

        case 'REORDER_SELECTED': {
            const { from, to } = action.payload;
            const ids = [...state.selectedIds];
            const [moved] = ids.splice(from, 1);
            ids.splice(to, 0, moved);
            return { ...state, selectedIds: ids };
        }

        case 'CLEAR_SELECTED':
            return { ...state, selectedIds: [] };

        case 'SET_SUBJECTS':
            return { ...state, activeSubjects: action.payload };

        case 'SET_FILTER':
            return { ...state, filters: { ...state.filters, [action.key]: action.value } };

        case 'CLEAR_FILTERS':
            return { ...state, filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '' } };

        case 'TOGGLE_MODAL':
            return { ...state, modals: { ...state.modals, [action.modal]: !state.modals[action.modal] } };

        default:
            return state;
    }
}

// ─── App Component ──────────────────────────────────────────

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [toast, setToast] = useState(null);

    // Load questions from IndexedDB on mount
    useEffect(() => {
        loadQuestions();
    }, []);

    const loadQuestions = async () => {
        try {
            const questions = await db.questions.toArray();
            dispatch({ type: 'SET_QUESTIONS', payload: questions });
        } catch (err) {
            console.error('Error loading questions:', err);
            dispatch({ type: 'SET_QUESTIONS', payload: [] });
        }
    };

    // Build taxonomy tree from all questions
    const taxonomyTree = useMemo(
        () => QBTaxonomy.buildTree(state.questions),
        [state.questions]
    );

    // Filter questions by subjects + filters
    const filteredQuestions = useMemo(() => {
        return state.questions.filter(q => {
            // Subject filter
            if (!QBTaxonomy.questionMatchesSubjects(q, state.activeSubjects)) return false;

            // Text search
            if (state.filters.search) {
                const term = state.filters.search.toLowerCase();
                if (!q.enunciado.toLowerCase().includes(term) &&
                    !q.id.toLowerCase().includes(term)) return false;
            }

            // Dropdown filters
            if (state.filters.banca && String(q.banca) !== state.filters.banca) return false;
            if (state.filters.ano && String(q.ano) !== state.filters.ano) return false;
            if (state.filters.dificuldade && q.dificuldade !== state.filters.dificuldade) return false;
            if (state.filters.tipo && q.tipo !== state.filters.tipo) return false;

            return true;
        });
    }, [state.questions, state.activeSubjects, state.filters]);

    // Selected questions in order
    const selectedQuestions = useMemo(
        () => state.selectedIds.map(id => state.questions.find(q => q.id === id)).filter(Boolean),
        [state.selectedIds, state.questions]
    );

    // Handlers
    const handleImportComplete = useCallback((result) => {
        loadQuestions();
        showToast(`${result.imported} questões importadas!`, 'success');
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        dispatch({ type: 'SET_FILTER', key, value });
    }, []);

    const handleClearFilters = useCallback(() => {
        dispatch({ type: 'CLEAR_FILTERS' });
    }, []);

    const handleToggleSelect = useCallback((id) => {
        dispatch({ type: 'TOGGLE_SELECT', payload: id });
    }, []);

    const handleReorder = useCallback((from, to) => {
        dispatch({ type: 'REORDER_SELECTED', payload: { from, to } });
    }, []);

    const handleBackupExport = async () => {
        try {
            const stats = await QBExport.exportDatabase();
            showToast(`Backup exportado: ${stats.questions} questões`, 'success');
        } catch (err) {
            showToast('Erro ao exportar backup', 'error');
        }
    };

    const handleBackupImport = async () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.questbank.json,.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            try {
                const result = await QBExport.importDatabase(file);
                await loadQuestions();
                dispatch({ type: 'CLEAR_SELECTED' });
                dispatch({ type: 'SET_SUBJECTS', payload: [] });
                showToast(`Banco restaurado: ${result.questions} questões`, 'success');
            } catch (err) {
                showToast(err.message || 'Erro ao restaurar backup', 'error');
            }
        };
        input.click();
    };

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ─── Render ─────────────────────────────────────────────

    if (state.loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-slate-400">Carregando banco de questões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen">
            {/* ─── Header ─────────────────────────────────── */}
            <header className="flex-shrink-0 glass border-b border-slate-700/40 px-4 py-2.5">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-base">📚</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                QuestBank
                            </h1>
                            <p className="text-[10px] text-slate-500 -mt-0.5">Banco de Questões Offline</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-3 mr-3 text-xs text-slate-500">
                            <span>
                                <b className="text-slate-300">{state.questions.length}</b> questões
                            </span>
                            {state.selectedIds.length > 0 && (
                                <span className="text-indigo-400">
                                    <b>{state.selectedIds.length}</b> selecionadas
                                </span>
                            )}
                        </div>

                        {/* Import */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'import' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-100 transition-all btn-press"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Importar
                        </button>

                        {/* Backup dropdown */}
                        <div className="relative group">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-300 hover:bg-slate-700/60 hover:text-slate-100 transition-all btn-press"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                Backup
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 glass rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                                <button
                                    onClick={handleBackupExport}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Exportar banco
                                </button>
                                <button
                                    onClick={handleBackupImport}
                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700/50 hover:text-slate-100 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Restaurar banco
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ─── Main 3-Panel Layout ────────────────────── */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Subject Tree */}
                <aside className="w-64 flex-shrink-0 glass-light border-r border-slate-700/30 flex flex-col overflow-hidden">
                    <SubjectTree
                        tree={taxonomyTree}
                        activeSubjects={state.activeSubjects}
                        onSubjectsChange={(subjects) => dispatch({ type: 'SET_SUBJECTS', payload: subjects })}
                    />
                </aside>

                {/* Center Panel: Question List */}
                <section className="flex-1 flex flex-col overflow-hidden min-w-0">
                    <QuestionList
                        questions={filteredQuestions}
                        allQuestions={state.questions}
                        selectedIds={state.selectedIds}
                        filters={state.filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onToggleSelect={handleToggleSelect}
                    />
                </section>

                {/* Right Panel: Selected Questions */}
                <aside className="w-72 flex-shrink-0 glass-light border-l border-slate-700/30 flex flex-col overflow-hidden">
                    <SelectedPanel
                        questions={selectedQuestions}
                        onRemove={(id) => dispatch({ type: 'REMOVE_SELECTED', payload: id })}
                        onReorder={handleReorder}
                        onClear={() => dispatch({ type: 'CLEAR_SELECTED' })}
                        onExport={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'export' })}
                    />
                </aside>
            </main>

            {/* ─── Modals ─────────────────────────────────── */}
            <ImportModal
                isOpen={state.modals.import}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'import' })}
                onImport={handleImportComplete}
            />

            <ExportModal
                isOpen={state.modals.export}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'export' })}
                selectedQuestions={selectedQuestions}
            />

            {/* ─── Toast Notification ─────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${
                    toast.type === 'success'
                        ? 'bg-emerald-500/90 text-white'
                        : toast.type === 'error'
                            ? 'bg-rose-500/90 text-white'
                            : 'bg-slate-700/90 text-slate-100'
                }`}>
                    {toast.type === 'success' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.type === 'error' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}
        </div>
    );
};

// ─── Mount App ──────────────────────────────────────────────

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

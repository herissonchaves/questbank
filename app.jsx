// QuestBank — Main App Component
// 3-panel layout with state management via useReducer, white theme

const { useState, useEffect, useReducer, useMemo, useCallback } = React;

// ─── State Management ───────────────────────────────────────

const initialState = {
    questions: [],
    selectedIds: [],
    activeSubjects: [],
    filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '', regiao: '', tag: '', codigo: '' },
    ignoreUsed: false,
    modals: { import: false, export: false, exams: false },
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
            return { ...state, filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '', regiao: '', tag: '', codigo: '' } };

        case 'TOGGLE_IGNORE_USED':
            return { ...state, ignoreUsed: !state.ignoreUsed };

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

    // Filter questions by subjects + filters + ignoreUsed
    const filteredQuestions = useMemo(() => {
        return state.questions.filter(q => {
            // Subject filter
            if (!QBTaxonomy.questionMatchesSubjects(q, state.activeSubjects)) return false;

            // Ignore used questions
            if (state.ignoreUsed && q.usedInExams && q.usedInExams.length > 0) return false;

            // Text search (enunciado, id, tags)
            if (state.filters.search) {
                const term = state.filters.search.toLowerCase();
                const inEnunciado = q.enunciado.toLowerCase().includes(term);
                const inId = q.id.toLowerCase().includes(term);
                const inTags = (q.tags || []).some(t => t.toLowerCase().includes(term));
                if (!inEnunciado && !inId && !inTags) return false;
            }

            // Código filter
            if (state.filters.codigo) {
                const term = state.filters.codigo.toLowerCase();
                if (!q.id.toLowerCase().includes(term)) return false;
            }

            // Dropdown filters
            if (state.filters.banca && String(q.banca) !== state.filters.banca) return false;
            if (state.filters.ano && String(q.ano) !== state.filters.ano) return false;
            if (state.filters.dificuldade && q.dificuldade !== state.filters.dificuldade) return false;
            if (state.filters.tipo && q.tipo !== state.filters.tipo) return false;
            if (state.filters.regiao && q.regiao !== state.filters.regiao) return false;
            if (state.filters.tag && !(q.tags || []).includes(state.filters.tag)) return false;

            return true;
        });
    }, [state.questions, state.activeSubjects, state.filters, state.ignoreUsed]);

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

    const handleToggleIgnoreUsed = useCallback(() => {
        dispatch({ type: 'TOGGLE_IGNORE_USED' });
    }, []);

    const handleExamSaved = useCallback(() => {
        // Refresh questions to update usedInExams tags
        loadQuestions();
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
            <div className="flex-1 flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400">Carregando banco de questões...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* ─── Header ─────────────────────────────────── */}
            <header className="flex-shrink-0 bg-white border-b border-gray-200 px-4 py-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                            <span className="text-base text-white font-bold">Q</span>
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-brand-700">
                                QuestBank
                            </h1>
                            <p className="text-[10px] text-gray-400 -mt-0.5">Banco de Questões</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-3 mr-3 text-xs text-gray-400">
                            <span>
                                <b className="text-gray-700">{state.questions.length}</b> questões
                            </span>
                            {state.selectedIds.length > 0 && (
                                <span className="text-brand-600">
                                    <b>{state.selectedIds.length}</b> selecionadas
                                </span>
                            )}
                        </div>

                        {/* Exams History */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'exams' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            title="Histórico de Provas"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Provas
                        </button>

                        {/* Import */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'import' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Importar
                        </button>

                        {/* Backup dropdown */}
                        <div className="relative group">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                Backup
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                </svg>
                            </button>
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                                <button
                                    onClick={handleBackupExport}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Exportar banco
                                </button>
                                <button
                                    onClick={handleBackupImport}
                                    className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors flex items-center gap-2"
                                >
                                    <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <aside className="w-64 flex-shrink-0 bg-white panel-border-r flex flex-col overflow-hidden">
                    <SubjectTree
                        tree={taxonomyTree}
                        activeSubjects={state.activeSubjects}
                        onSubjectsChange={(subjects) => dispatch({ type: 'SET_SUBJECTS', payload: subjects })}
                    />
                </aside>

                {/* Center Panel: Question List */}
                <section className="flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50/50">
                    <QuestionList
                        questions={filteredQuestions}
                        allQuestions={state.questions}
                        selectedIds={state.selectedIds}
                        filters={state.filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onToggleSelect={handleToggleSelect}
                        ignoreUsed={state.ignoreUsed}
                        onToggleIgnoreUsed={handleToggleIgnoreUsed}
                    />
                </section>

                {/* Right Panel: Selected Questions */}
                <aside className="w-72 flex-shrink-0 bg-white panel-border-l flex flex-col overflow-hidden">
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
                onExamSaved={handleExamSaved}
            />

            <ExamsPanel
                isOpen={state.modals.exams}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'exams' })}
            />

            {/* ─── Toast Notification ─────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${
                    toast.type === 'success'
                        ? 'bg-emerald-500 text-white'
                        : toast.type === 'error'
                            ? 'bg-rose-500 text-white'
                            : 'bg-gray-800 text-white'
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

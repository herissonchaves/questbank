// QuestBank — Main App Component
// 3-panel layout with state management via useReducer, white theme
// Responsive: tabs on mobile, 3-panel on desktop

const { useState, useEffect, useReducer, useMemo, useCallback, useRef } = React;

// ─── State Management ───────────────────────────────────────

const initialState = {
    questions: [],
    selectedIds: [],
    activeSubjects: [],
    filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '', codigo: '', orderByRecent: false, orderById: '', resolucao: '', tag: '' },
    ignoreUsed: false,
    modals: { import: false, export: false, exams: false, stats: false, createQuestion: false, editQuestion: null },
    loading: true,
    mobileTab: 'questions', // 'subjects' | 'questions' | 'selected'
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

        case 'SELECT_ALL_FILTERED': {
            const newIds = action.payload;
            const currentSet = new Set(state.selectedIds);
            const allSelected = newIds.every(id => currentSet.has(id));
            if (allSelected) {
                // Deselect all filtered
                const removeSet = new Set(newIds);
                return { ...state, selectedIds: state.selectedIds.filter(id => !removeSet.has(id)) };
            } else {
                // Select all filtered (deduplicate)
                return { ...state, selectedIds: [...new Set([...state.selectedIds, ...newIds])] };
            }
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

        case 'SHUFFLE_SELECTED': {
            const ids = [...state.selectedIds];
            // Fisher-Yates shuffle
            for (let i = ids.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [ids[i], ids[j]] = [ids[j], ids[i]];
            }
            return { ...state, selectedIds: ids };
        }

        case 'ORDER_BY_DIFFICULTY': {
            const difficultyMap = {};
            state.questions.forEach(q => {
                let rank = 99; // unknown
                const d = (q.dificuldade || '').toLowerCase();
                if (d.includes('fácil') || d.includes('facil') || d.includes('baixa')) rank = 1;
                else if (d.includes('média') || d.includes('media') || d.includes('médio') || d.includes('medio')) rank = 2;
                else if (d.includes('difícil') || d.includes('dificil') || d.includes('alta')) rank = 3;
                difficultyMap[q.id] = rank;
            });
            const ids = [...state.selectedIds].sort((a, b) => {
                const rankA = difficultyMap[a] || 99;
                const rankB = difficultyMap[b] || 99;
                return rankA - rankB; // ascending, easier first
            });
            return { ...state, selectedIds: ids };
        }

        case 'CLEAR_SELECTED':
            return { ...state, selectedIds: [] };

        case 'SET_SUBJECTS':
            return { ...state, activeSubjects: action.payload };

        case 'SET_FILTER':
            return { ...state, filters: { ...state.filters, [action.key]: action.value } };

        case 'CLEAR_FILTERS':
            return { ...state, filters: { search: '', banca: '', ano: '', dificuldade: '', tipo: '', codigo: '', orderByRecent: false, orderById: '', resolucao: '', tag: '' } };

        case 'TOGGLE_IGNORE_USED':
            return { ...state, ignoreUsed: !state.ignoreUsed };

        case 'TOGGLE_MODAL':
            return { ...state, modals: { ...state.modals, [action.modal]: !state.modals[action.modal] } };

        case 'SET_EDIT_QUESTION':
            return { ...state, modals: { ...state.modals, editQuestion: action.payload } };

        case 'SET_MOBILE_TAB':
            return { ...state, mobileTab: action.payload };

        default:
            return state;
    }
}

// ─── App Component ──────────────────────────────────────────

const App = () => {
    const [state, dispatch] = useReducer(reducer, initialState);
    const [toast, setToast] = useState(null);
    const searchRef = useRef(null);

    // Taxonomy Drag & Drop Undo Stack
    const [undoStack, setUndoStack] = useState([]);
    const undoStackRef = useRef(undoStack);
    useEffect(() => { undoStackRef.current = undoStack; }, [undoStack]);

    const handleUndoLastAction = useCallback(async () => {
        if (undoStackRef.current.length === 0) return;
        
        const lastAction = undoStackRef.current[undoStackRef.current.length - 1];
        if (lastAction.type !== 'TAXONOMY_MOVE' && lastAction.type !== 'TAXONOMY_RENAME') return;
        
        const prevStates = lastAction.previousStates;
        try {
            await db.transaction('rw', db.questions, async () => {
                for (const snap of prevStates) {
                    await db.questions.update(snap.id, {
                        disciplina: snap.disciplina,
                        topico: snap.topico,
                        conteudo: snap.conteudo,
                        assunto: snap.assunto
                    });
                }
            });
            
            setUndoStack(prev => prev.slice(0, -1));
            showToast(`Ação desfeita. ${prevStates.length} questões restauradas.`, 'success');
            loadQuestions(); // refresh UI
        } catch (err) {
            console.error('Error undoing action:', err);
            showToast('Erro ao desfazer ação.', 'error');
        }
    }, []);
    const undoRef = useRef(handleUndoLastAction);
    useEffect(() => { undoRef.current = handleUndoLastAction; }, [handleUndoLastAction]);

    useEffect(() => {
        loadQuestions();
    }, []);

    // ─── Keyboard shortcuts ──────────────────────────────────
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F → focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                if (searchRef.current) searchRef.current.focus();
            }
            // Ctrl+Z → undo taxonomy move
            if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
                e.preventDefault();
                undoRef.current();
            }
            // Ctrl+I → open import
            if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_MODAL', modal: 'import' });
            }
            // Ctrl+N → open create question
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                dispatch({ type: 'TOGGLE_MODAL', modal: 'createQuestion' });
            }
            // Escape → close any modal
            if (e.key === 'Escape') {
                if (state.modals.createQuestion) dispatch({ type: 'TOGGLE_MODAL', modal: 'createQuestion' });
                else if (state.modals.import) dispatch({ type: 'TOGGLE_MODAL', modal: 'import' });
                else if (state.modals.export) dispatch({ type: 'TOGGLE_MODAL', modal: 'export' });
                else if (state.modals.exams) dispatch({ type: 'TOGGLE_MODAL', modal: 'exams' });
                else if (state.modals.stats) dispatch({ type: 'TOGGLE_MODAL', modal: 'stats' });
                else if (state.modals.editQuestion) dispatch({ type: 'SET_EDIT_QUESTION', payload: null });
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [state.modals]);

    const handleMoveTaxonomyNode = async (sourcePath, targetPath, sourceLevel) => {
        const sourceParts = sourcePath.split('>');
        const targetParts = targetPath.split('>');
        
        const nodeName = sourceParts[sourceParts.length - 1];
        
        if (window.confirm(`Tem certeza que deseja mover "${nodeName}" para dentro de "${targetParts[targetParts.length-1]}"?\nEssa ação atualizará em lote todas as questões dessa etapa.`)) {
            try {
                const d = sourceParts[0];
                const t = sourceParts[1];
                const c = sourceParts[2];
                const a = sourceParts[3];
                
                let collection = db.questions.where('disciplina').equals(d);
                
                const questionsToUpdate = await collection.filter(q => {
                    if (sourceLevel >= 1 && q.topico !== t) return false;
                    if (sourceLevel >= 2 && q.conteudo !== c) return false;
                    if (sourceLevel >= 3 && q.assunto !== a) return false;
                    return true;
                }).toArray();
                
                if (questionsToUpdate.length === 0) return;
                
                // Save snap for undo
                const previousStates = questionsToUpdate.map(q => ({
                    id: q.id,
                    disciplina: q.disciplina,
                    topico: q.topico,
                    conteudo: q.conteudo,
                    assunto: q.assunto
                }));
                
                await db.transaction('rw', db.questions, async () => {
                    for (const q of questionsToUpdate) {
                        const updates = { disciplina: targetParts[0] || q.disciplina };
                        
                        if (sourceLevel >= 1) updates.topico = sourceLevel === 1 ? nodeName : (targetParts[1] || q.topico);
                        if (sourceLevel >= 2) updates.conteudo = sourceLevel === 2 ? nodeName : (targetParts[2] || q.conteudo);
                        if (sourceLevel >= 3) updates.assunto = sourceLevel === 3 ? nodeName : (targetParts[3] || q.assunto);
                        
                        await db.questions.update(q.id, updates);
                    }
                });
                
                setUndoStack(prev => [...prev, { type: 'TAXONOMY_MOVE', previousStates }]);
                
                showToast(`Sucesso! ${questionsToUpdate.length} questões alteradas. Pressione Ctrl+Z para desfazer.`, 'success');
                loadQuestions();
            } catch (err) {
                console.error(err);
                showToast('Erro ao arrastar categoria.', 'error');
            }
        }
    };

    const handleRenameTaxonomyNode = async (nodePath, newName, level) => {
        const parts = nodePath.split('>');
        const oldName = parts[parts.length - 1];
        const fieldNames = ['disciplina', 'tópico', 'conteúdo', 'assunto'];

        if (oldName === newName) return;

        if (!window.confirm(`Renomear ${fieldNames[level]} de "${oldName}" para "${newName}"?\nTodas as questões associadas serão atualizadas.`)) return;

        try {
            const d = parts[0];
            const t = parts[1];
            const c = parts[2];
            const a = parts[3];

            let collection = db.questions.where('disciplina').equals(d);

            const questionsToUpdate = await collection.filter(q => {
                if (level >= 1 && q.topico !== t) return false;
                if (level >= 2 && q.conteudo !== c) return false;
                if (level >= 3 && q.assunto !== a) return false;
                return true;
            }).toArray();

            if (questionsToUpdate.length === 0) {
                showToast('Nenhuma questão encontrada para renomear.', 'error');
                return;
            }

            // Save snapshot for undo
            const previousStates = questionsToUpdate.map(q => ({
                id: q.id,
                disciplina: q.disciplina,
                topico: q.topico,
                conteudo: q.conteudo,
                assunto: q.assunto
            }));

            const fieldKey = ['disciplina', 'topico', 'conteudo', 'assunto'][level];

            await db.transaction('rw', db.questions, async () => {
                for (const q of questionsToUpdate) {
                    await db.questions.update(q.id, { [fieldKey]: newName });
                }
            });

            setUndoStack(prev => [...prev, { type: 'TAXONOMY_RENAME', previousStates }]);

            showToast(`Renomeado! ${questionsToUpdate.length} questões atualizadas. Ctrl+Z para desfazer.`, 'success');
            loadQuestions();
        } catch (err) {
            console.error('Rename error:', err);
            showToast('Erro ao renomear categoria.', 'error');
        }
    };

    const loadQuestions = async () => {
        try {
            const questions = await db.questions.toArray();
            dispatch({ type: 'SET_QUESTIONS', payload: questions });
        } catch (err) {
            console.error('Error loading questions:', err);
            dispatch({ type: 'SET_QUESTIONS', payload: [] });
        }
    };

    // ─── Adapted Questions Logic ────────────────────────────
    // Build a map: regularId -> adaptedQuestion
    const { adaptedMap, regularQuestions } = useMemo(() => {
        const map = {};
        
        // Pass 1: Assign adapted questions mapped to their regular counterpart's ID
        state.questions.forEach(q => {
            if (String(q.id).startsWith('A-')) {
                const regularId = String(q.id).substring(2); // Extracts "00001" from "A-00001"
                map[regularId] = q;
            }
        });

        // Pass 2: Filter out adapted questions from the regular list
        const regular = state.questions.filter(q => !String(q.id).startsWith('A-'));

        return { adaptedMap: map, regularQuestions: regular };
    }, [state.questions]);

    // Build taxonomy tree from regular questions only (adapted are hidden)
    const taxonomyTree = useMemo(
        () => QBTaxonomy.buildTree(regularQuestions),
        [regularQuestions]
    );

    // O(1) lookup Set for selectedIds
    const selectedIdsSet = useMemo(
        () => new Set(state.selectedIds),
        [state.selectedIds]
    );

    // Filter questions by subjects + filters + ignoreUsed + order by recent (only regular questions)
    const filteredQuestions = useMemo(() => {
        let result = regularQuestions.filter(q => {
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
            
            // Resolução filter
            if (state.filters.resolucao === 'com' && (!q.resolucao_link || q.resolucao_link.trim() === "")) return false;
            if (state.filters.resolucao === 'sem' && q.resolucao_link && q.resolucao_link.trim() !== "") return false;

            // Tag filter
            if (state.filters.tag) {
                const tagTerms = state.filters.tag.toLowerCase().split(/[,\s]+/).filter(Boolean);
                const qTags = (q.tags || []).map(t => t.toLowerCase());
                if (!tagTerms.every(term => qTags.some(t => t.includes(term)))) return false;
            }

            return true;
        });

        if (state.filters.orderByRecent) {
            result = [...result].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            });
        }

        if (state.filters.orderById) {
            result = [...result].sort((a, b) => {
                const parseId = (idStr) => parseInt(String(idStr).replace('A-', ''), 10) || 0;
                const idA = a.id ? parseId(a.id) : 0;
                const idB = b.id ? parseId(b.id) : 0;
                return state.filters.orderById === 'asc' ? idA - idB : idB - idA;
            });
        }

        return result;
    }, [regularQuestions, state.activeSubjects, state.filters, state.ignoreUsed]);

    // Build filtered taxonomy tree for showing filtered counts
    const filteredTaxonomyTree = useMemo(
        () => QBTaxonomy.buildTree(filteredQuestions),
        [filteredQuestions]
    );

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

    const handleSelectAllFiltered = useCallback((ids) => {
        dispatch({ type: 'SELECT_ALL_FILTERED', payload: ids });
    }, []);

    const handleReorder = useCallback((from, to) => {
        dispatch({ type: 'REORDER_SELECTED', payload: { from, to } });
    }, []);

    const handleShuffle = useCallback(() => {
        dispatch({ type: 'SHUFFLE_SELECTED' });
    }, []);

    const handleOrderByDifficulty = useCallback(() => {
        dispatch({ type: 'ORDER_BY_DIFFICULTY' });
    }, []);

    const handleToggleIgnoreUsed = useCallback(() => {
        dispatch({ type: 'TOGGLE_IGNORE_USED' });
    }, []);

    const handleExamSaved = useCallback(() => {
        // Refresh questions to update usedInExams tags
        loadQuestions();
    }, []);

    const handleDeleteQuestion = useCallback(async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta questão? Esta ação não pode ser desfeita.')) return;
        try {
            await db.questions.delete(id);
            // Remove from selection if selected
            dispatch({ type: 'REMOVE_SELECTED', payload: id });
            await loadQuestions();
            showToast('Questão excluída.', 'success');
        } catch (err) {
            showToast('Erro ao excluir questão.', 'error');
        }
    }, []);

    const handleDeleteSelected = useCallback(async () => {
        if (state.selectedIds.length === 0) return;
        if (!confirm(`Tem certeza que deseja excluir as ${state.selectedIds.length} questões selecionadas do banco de dados? Esta ação não pode ser desfeita.`)) return;
        try {
            await db.questions.bulkDelete(state.selectedIds);
            dispatch({ type: 'CLEAR_SELECTED' });
            await loadQuestions();
            showToast(`${state.selectedIds.length} questões excluídas.`, 'success');
        } catch (err) {
            showToast('Erro ao excluir questões.', 'error');
        }
    }, [state.selectedIds]);

    const handleEditQuestion = useCallback((question) => {
        dispatch({ type: 'SET_EDIT_QUESTION', payload: question });
    }, []);

    // Expose edit/delete handlers globally (so QuestionCard can access without deep prop drilling)
    useEffect(() => {
        window._questBankEditQuestion = handleEditQuestion;
        window._questBankDeleteQuestion = handleDeleteQuestion;
        return () => {
            delete window._questBankEditQuestion;
            delete window._questBankDeleteQuestion;
        };
    }, [handleEditQuestion, handleDeleteQuestion]);

    const handleSaveEditQuestion = useCallback(async (updatedQuestion, adaptedQuestion) => {
        try {
            await db.questions.update(updatedQuestion.id, updatedQuestion);

            // Save adapted question if provided (new adapted version from edit modal)
            if (adaptedQuestion) {
                try {
                    await db.questions.add(adaptedQuestion);
                    showToast('Questão atualizada + versão adaptada criada!', 'success');
                } catch (adaptErr) {
                    console.error('Erro ao salvar versão adaptada:', adaptErr);
                    showToast('Questão atualizada, mas erro na versão adaptada.', 'error');
                }
            } else {
                showToast('Questão atualizada!', 'success');
            }

            dispatch({ type: 'SET_EDIT_QUESTION', payload: null });
            await loadQuestions();
        } catch (err) {
            showToast('Erro ao salvar questão.', 'error');
        }
    }, []);

    const handleCreateQuestion = useCallback(async (newQuestion) => {
        try {
            await db.questions.add(newQuestion);
            dispatch({ type: 'TOGGLE_MODAL', modal: 'createQuestion' });
            await loadQuestions();
            showToast('Questão criada com sucesso!', 'success');
        } catch (err) {
            showToast('Erro ao criar questão: ' + (err.message || ''), 'error');
            throw err;
        }
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
        if (!confirm('⚠️ ATENÇÃO: Isso vai SUBSTITUIR todas as questões e provas atuais pelo conteúdo do backup.\n\nDeseja continuar?')) return;

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

    const handleExportIds = async () => {
        try {
            const questions = await db.questions.toArray();
            if (questions.length === 0) {
                showToast('Nenhuma questão no banco de dados.', 'error');
                return;
            }
            const ids = questions.map(q => q.id).join('\n');
            const blob = new Blob([ids], { type: 'text/plain;charset=utf-8' });
            const date = new Date().toISOString().split('T')[0];
            saveAs(blob, `questbank-ids-${date}.txt`);
            showToast(`${questions.length} IDs exportados!`, 'success');
        } catch (err) {
            showToast('Erro ao exportar IDs', 'error');
        }
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
                                <b className="text-gray-700">{regularQuestions.length}</b> questões
                            </span>
                            {state.selectedIds.length > 0 && (
                                <span className="text-brand-600">
                                    <b>{state.selectedIds.length}</b> selecionadas
                                </span>
                            )}
                        </div>

                        {/* Stats dashboard */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'stats' })}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            title="Estatísticas"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            Stats
                        </button>

                        {/* Exams History */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'exams' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            title="Histórico de Provas"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden sm:inline">Provas</span>
                        </button>

                        {/* Create Question */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'createQuestion' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-all btn-press shadow-sm shadow-brand-500/20"
                            title="Nova Questão (Ctrl+N)"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="hidden sm:inline">Nova Questão</span>
                        </button>

                        {/* Import */}
                        <button
                            onClick={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'import' })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            title="Importar Questões (Ctrl+I)"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="hidden sm:inline">Importar</span>
                        </button>

                        {/* Backup dropdown */}
                        <div className="relative group">
                            <button
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-all btn-press"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                </svg>
                                <span className="hidden sm:inline">Backup</span>
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

            {/* ─── Mobile Tab Bar ─────────────────────────── */}
            <div className="lg:hidden flex-shrink-0 bg-white border-b border-gray-200">
                <div className="flex">
                    {[
                        { key: 'subjects', label: '📚 Assuntos', count: Object.keys(taxonomyTree).length },
                        { key: 'questions', label: '📋 Questões', count: filteredQuestions.length },
                        { key: 'selected', label: '✅ Prova', count: state.selectedIds.length },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => dispatch({ type: 'SET_MOBILE_TAB', payload: tab.key })}
                            className={`flex-1 py-2.5 text-xs font-semibold text-center transition-all relative ${state.mobileTab === tab.key
                                    ? 'text-brand-700 bg-brand-50/50'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 text-[10px] px-1.5 py-0.5 rounded-full ${state.mobileTab === tab.key
                                        ? 'bg-brand-100 text-brand-700'
                                        : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {tab.count}
                                </span>
                            )}
                            {state.mobileTab === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-600" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ─── Main 3-Panel Layout ────────────────────── */}
            <main className="flex-1 flex overflow-hidden">
                {/* Left Panel: Subject Tree */}
                <aside className={`w-64 flex-shrink-0 bg-white panel-border-r flex flex-col overflow-hidden ${state.mobileTab === 'subjects' ? '' : 'hidden lg:flex'
                    }`}
                    style={state.mobileTab === 'subjects' ? { width: '100%' } : {}}
                >
                    <SubjectTree
                        tree={taxonomyTree}
                        filteredTree={filteredTaxonomyTree}
                        activeSubjects={state.activeSubjects}
                        onSubjectsChange={(subjects) => dispatch({ type: 'SET_SUBJECTS', payload: subjects })}
                        onMoveNode={handleMoveTaxonomyNode}
                        onRenameNode={handleRenameTaxonomyNode}
                    />
                </aside>

                {/* Center Panel: Question List */}
                <section className={`flex-1 flex flex-col overflow-hidden min-w-0 bg-gray-50/50 ${state.mobileTab === 'questions' ? '' : 'hidden lg:flex'
                    }`}>
                    <QuestionList
                        questions={filteredQuestions}
                        allQuestions={regularQuestions}
                        selectedIds={state.selectedIds}
                        selectedIdsSet={selectedIdsSet}
                        filters={state.filters}
                        onFilterChange={handleFilterChange}
                        onClearFilters={handleClearFilters}
                        onToggleSelect={handleToggleSelect}
                        onSelectAllFiltered={handleSelectAllFiltered}
                        ignoreUsed={state.ignoreUsed}
                        onToggleIgnoreUsed={handleToggleIgnoreUsed}
                        searchRef={searchRef}
                        adaptedMap={adaptedMap}
                    />
                </section>

                {/* Right Panel: Selected Questions */}
                <aside className={`w-72 flex-shrink-0 bg-white panel-border-l flex flex-col overflow-hidden ${state.mobileTab === 'selected' ? '' : 'hidden lg:flex'
                    }`}
                    style={state.mobileTab === 'selected' ? { width: '100%' } : {}}
                >
                    <SelectedPanel
                        questions={selectedQuestions}
                        onRemove={(id) => dispatch({ type: 'REMOVE_SELECTED', payload: id })}
                        onReorder={handleReorder}
                        onShuffle={handleShuffle}
                        onOrderByDifficulty={handleOrderByDifficulty}
                        onClear={() => dispatch({ type: 'CLEAR_SELECTED' })}
                        onDeleteSelected={handleDeleteSelected}
                        onExport={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'export' })}
                    />
                </aside>
            </main>

            {/* ─── Modals ─────────────────────────────────── */}
            <CreateQuestionModal
                isOpen={state.modals.createQuestion}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'createQuestion' })}
                onSave={handleCreateQuestion}
                existingQuestions={state.questions}
                adaptedMap={adaptedMap}
            />

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
                adaptedMap={adaptedMap}
            />

            <ExamsPanel
                isOpen={state.modals.exams}
                onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'exams' })}
                questions={state.questions}
                selectedIdsSet={selectedIdsSet}
                onToggleSelect={handleToggleSelect}
                onToggleSelectAll={handleSelectAllFiltered}
                adaptedMap={adaptedMap}
            />

            {state.modals.stats && (
                <StatsPanel
                    isOpen={state.modals.stats}
                    onClose={() => dispatch({ type: 'TOGGLE_MODAL', modal: 'stats' })}
                    questions={state.questions}
                />
            )}

            {state.modals.editQuestion && (
                <EditQuestionModal
                    question={state.modals.editQuestion}
                    onClose={() => dispatch({ type: 'SET_EDIT_QUESTION', payload: null })}
                    onSave={handleSaveEditQuestion}
                />
            )}

            {/* ─── Toast Notification ─────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 animate-slide-up flex items-center gap-2 px-4 py-3 rounded-xl shadow-2xl text-sm font-medium ${toast.type === 'success'
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

// QuestBank — SelectedPanel Component
// Selected questions for the exam with drag & drop reordering + shuffle

const SelectedPanel = ({ questions, onRemove, onReorder, onShuffle, onShuffleAlternatives, onOrderByDifficulty, onClear, onDeleteSelected, onExport }) => {
    const [dragIndex, setDragIndex] = React.useState(null);
    const [dragOverIndex, setDragOverIndex] = React.useState(null);

    const handleDragStart = (e, index) => {
        setDragIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDragIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e, toIndex) => {
        e.preventDefault();
        const fromIndex = dragIndex;
        setDragIndex(null);
        setDragOverIndex(null);
        if (fromIndex !== null && fromIndex !== toIndex) {
            onReorder(fromIndex, toIndex);
        }
    };

    // Count by type
    const typeCounts = React.useMemo(() => {
        const counts = { objetiva: 0, discursiva: 0, other: 0 };
        questions.forEach(q => {
            if (q.tipo === 'objetiva') counts.objetiva++;
            else if (q.tipo === 'discursiva') counts.discursiva++;
            else counts.other++;
        });
        return counts;
    }, [questions]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Prova
                    </h2>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">
                        {questions.length} {questions.length === 1 ? 'questão' : 'questões'}
                    </span>
                </div>
                {questions.length > 0 && (
                    <div className="flex gap-2 mt-1.5">
                        {typeCounts.objetiva > 0 && (
                            <span className="text-[10px] text-gray-400">{typeCounts.objetiva} obj.</span>
                        )}
                        {typeCounts.discursiva > 0 && (
                            <span className="text-[10px] text-violet-500">{typeCounts.discursiva} disc.</span>
                        )}
                    </div>
                )}
            </div>

            {/* Selected questions list */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
                {questions.map((q, index) => {
                    const colors = getDisciplineColor(q.disciplina);

                    return (
                        <div
                            key={q.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`flex items-center gap-2 p-2.5 rounded-lg bg-white border border-gray-200 hover:border-gray-300 cursor-grab active:cursor-grabbing transition-all duration-150 group ${
                                dragOverIndex === index ? 'border-t-2 border-t-brand-500' : ''
                            }`}
                        >
                            {/* Drag handle */}
                            <div className="flex-shrink-0 text-gray-300 group-hover:text-gray-400 transition-colors">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M7 2a2 2 0 10.001 4.001A2 2 0 007 2zm0 6a2 2 0 10.001 4.001A2 2 0 007 8zm0 6a2 2 0 10.001 4.001A2 2 0 007 14zm6-8a2 2 0 10-.001-4.001A2 2 0 0013 6zm0 2a2 2 0 10.001 4.001A2 2 0 0013 8zm0 6a2 2 0 10.001 4.001A2 2 0 0013 14z" />
                                </svg>
                            </div>

                            {/* Question number */}
                            <span className="flex-shrink-0 w-6 h-6 rounded-md bg-brand-50 text-brand-600 text-[11px] font-bold flex items-center justify-center">
                                {index + 1}
                            </span>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono text-gray-400">{q.id}</span>
                                    <span className={`text-[9px] px-1 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                                        {q.disciplina}
                                    </span>
                                    {q.tipo === 'discursiva' && (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-violet-50 text-violet-600">D</span>
                                    )}
                                </div>
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">
                                    {(q.enunciado || '').replace(/<[^>]*>?/gm, '').substring(0, 60)}...
                                </p>
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={() => onRemove(q.id)}
                                className="flex-shrink-0 w-6 h-6 rounded-md text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                title="Remover"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    );
                })}

                {/* Empty state */}
                {questions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <svg className="w-10 h-10 mb-3 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-xs text-center text-gray-400">Clique "+" nas questões<br/>para montar sua prova</p>
                    </div>
                )}
            </div>

            {/* Footer actions */}
            {questions.length > 0 && (
                <div className="p-3 border-t border-gray-200 space-y-2">
                    {/* Export button */}
                    <button
                        onClick={onExport}
                        className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold transition-all duration-200 btn-press flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Gerar Prova
                    </button>

                    {/* Sort + Shuffle + Clear */}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={onOrderByDifficulty}
                            className="w-full py-2 text-xs font-medium text-brand-600 bg-brand-50 hover:bg-brand-100 rounded-lg transition-all flex items-center justify-center gap-2 border border-brand-100"
                            title="Ordenar: Fácil → Médio → Difícil"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                            </svg>
                            Ordenar por Dificuldade (Fácil → Difícil)
                        </button>

                        <div className="flex items-center gap-2">
                            <div className="relative group flex-1">
                                <button
                                    className="w-full py-1.5 text-xs text-gray-500 hover:text-brand-600 transition-colors flex items-center justify-center gap-1"
                                    title="Opções de embaralhar"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                    </svg>
                                    Embaralhar
                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                                    </svg>
                                </button>
                                <div className="absolute left-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                                    <button
                                        onClick={onShuffle}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                                    >
                                        Ordem das questões
                                    </button>
                                    <button
                                        onClick={onShuffleAlternatives}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-600 hover:bg-gray-50 hover:text-brand-600 transition-colors"
                                    >
                                        Alternativas (objetivas)
                                    </button>
                                </div>
                            </div>
                            <span className="w-px h-4 bg-gray-200" />
                            <button
                                onClick={onClear}
                                className="flex-1 py-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                Limpar
                            </button>
                            <span className="w-px h-4 bg-gray-200" />
                            <button
                                onClick={onDeleteSelected}
                                className="flex-1 py-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-1"
                                title="Excluir do banco"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

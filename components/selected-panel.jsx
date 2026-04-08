// QuestBank — SelectedPanel Component
// Selected questions for the exam with drag & drop reordering

const SelectedPanel = ({ questions, onRemove, onReorder, onClear, onExport }) => {
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
                                    {q.enunciado.substring(0, 60)}...
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
                        Gerar Prova (.docx)
                    </button>

                    {/* Clear all */}
                    <button
                        onClick={onClear}
                        className="w-full py-1.5 text-xs text-gray-400 hover:text-rose-500 transition-colors"
                    >
                        Limpar seleção
                    </button>
                </div>
            )}
        </div>
    );
};

// QuestBank — StatsPanel Component
// Dashboard showing question distribution by discipline, difficulty, type

const StatsPanel = ({ isOpen, onClose, questions }) => {
    if (!isOpen) return null;

    // Compute stats
    const stats = React.useMemo(() => {
        const byDisciplina = {};
        const byDificuldade = {};
        const byTipo = {};
        const byBanca = {};
        const byAno = {};

        questions.forEach(q => {
            byDisciplina[q.disciplina] = (byDisciplina[q.disciplina] || 0) + 1;
            byDificuldade[q.dificuldade] = (byDificuldade[q.dificuldade] || 0) + 1;
            byTipo[q.tipo] = (byTipo[q.tipo] || 0) + 1;
            if (q.banca) byBanca[q.banca] = (byBanca[q.banca] || 0) + 1;
            if (q.ano) byAno[q.ano] = (byAno[q.ano] || 0) + 1;
        });

        return { byDisciplina, byDificuldade, byTipo, byBanca, byAno };
    }, [questions]);

    const maxCount = Math.max(...Object.values(stats.byDisciplina), 1);

    const renderBar = (label, count, colorClass, total) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
            <div key={label} className="flex items-center gap-2">
                <span className="text-xs text-gray-600 w-28 truncate text-right font-medium" title={label}>{label}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                        style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                </div>
                <span className="text-xs text-gray-500 w-10 font-semibold">{count}</span>
            </div>
        );
    };

    const sortedEntries = (obj) => Object.entries(obj).sort(([, a], [, b]) => b - a);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl animate-modal-in border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Estatísticas do Banco</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            <b>{questions.length}</b> questões no banco de dados
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {questions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <p className="text-sm">Nenhuma questão no banco.</p>
                            <p className="text-xs mt-1">Importe questões para ver as estatísticas.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-brand-50 rounded-xl p-3 text-center border border-brand-100">
                                    <p className="text-2xl font-bold text-brand-700">{Object.keys(stats.byDisciplina).length}</p>
                                    <p className="text-[10px] text-brand-600 font-semibold uppercase tracking-wider mt-0.5">Disciplinas</p>
                                </div>
                                <div className="bg-emerald-50 rounded-xl p-3 text-center border border-emerald-100">
                                    <p className="text-2xl font-bold text-emerald-700">{Object.keys(stats.byBanca).length}</p>
                                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider mt-0.5">Bancas</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
                                    <p className="text-2xl font-bold text-amber-700">{Object.keys(stats.byAno).length}</p>
                                    <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider mt-0.5">Anos</p>
                                </div>
                            </div>

                            {/* By Discipline */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Por Disciplina</h4>
                                <div className="space-y-1.5">
                                    {sortedEntries(stats.byDisciplina).map(([label, count]) => {
                                        const colors = getDisciplineColor(label);
                                        return renderBar(label, count, colors.dot.replace('bg-', 'bg-') , questions.length);
                                    })}
                                </div>
                            </div>

                            {/* By Difficulty */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Por Dificuldade</h4>
                                <div className="space-y-1.5">
                                    {sortedEntries(stats.byDificuldade).map(([label, count]) => {
                                        const style = DIFFICULTY_STYLES[label] || {};
                                        const colorClass = style.dot || 'bg-gray-400';
                                        return renderBar(style.label || label, count, colorClass, questions.length);
                                    })}
                                </div>
                            </div>

                            {/* By Type */}
                            <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Por Tipo</h4>
                                <div className="space-y-1.5">
                                    {sortedEntries(stats.byTipo).map(([label, count]) => {
                                        const typeLabel = TYPE_LABELS[label] || label;
                                        const colorClass = label === 'discursiva' ? 'bg-violet-500' :
                                                          label === 'objetiva' ? 'bg-brand-500' :
                                                          label === 'v_f' ? 'bg-teal-500' : 'bg-orange-500';
                                        return renderBar(typeLabel, count, colorClass, questions.length);
                                    })}
                                </div>
                            </div>

                            {/* By Banca */}
                            {Object.keys(stats.byBanca).length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Por Banca</h4>
                                    <div className="space-y-1.5">
                                        {sortedEntries(stats.byBanca).map(([label, count]) =>
                                            renderBar(label, count, 'bg-sky-500', questions.length)
                                        )}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end px-5 py-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

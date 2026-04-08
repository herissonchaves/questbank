// QuestBank — ExportModal Component
// Configure and export exam as JSON

const ExportModal = ({ isOpen, onClose, selectedQuestions }) => {
    const [config, setConfig] = React.useState({
        titulo: '',
        professor: '',
        instituicao: '',
        data: new Date().toISOString().split('T')[0],
        incluir_gabarito: true,
        incluir_resolucao: false,
    });
    const [exported, setExported] = React.useState(false);

    if (!isOpen) return null;

    const handleClose = () => {
        setExported(false);
        onClose();
    };

    const handleExport = () => {
        QBExport.exportExam(selectedQuestions, config);
        setExported(true);
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative glass rounded-2xl w-full max-w-lg shadow-2xl animate-modal-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-700/40">
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">Gerar Prova</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {selectedQuestions.length} {selectedQuestions.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {!exported ? (
                        <>
                            {/* Title */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Título da Prova</label>
                                <input
                                    type="text"
                                    value={config.titulo}
                                    onChange={(e) => updateConfig('titulo', e.target.value)}
                                    placeholder="Ex: Prova de Física - 2º Bimestre"
                                    className="w-full bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Professor + Institution row */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Professor(a)</label>
                                    <input
                                        type="text"
                                        value={config.professor}
                                        onChange={(e) => updateConfig('professor', e.target.value)}
                                        placeholder="Nome"
                                        className="w-full bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Instituição</label>
                                    <input
                                        type="text"
                                        value={config.instituicao}
                                        onChange={(e) => updateConfig('instituicao', e.target.value)}
                                        placeholder="Escola/Colégio"
                                        className="w-full bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 mb-1.5">Data da Prova</label>
                                <input
                                    type="date"
                                    value={config.data}
                                    onChange={(e) => updateConfig('data', e.target.value)}
                                    className="bg-slate-800/50 border border-slate-700/40 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                                />
                            </div>

                            {/* Options */}
                            <div className="flex flex-col gap-2.5 pt-2">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={config.incluir_gabarito}
                                        onChange={(e) => updateConfig('incluir_gabarito', e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                                        Incluir gabarito no JSON
                                    </span>
                                </label>
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={config.incluir_resolucao}
                                        onChange={(e) => updateConfig('incluir_resolucao', e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">
                                        Incluir links de resolução
                                    </span>
                                </label>
                            </div>

                            {/* Discipline summary */}
                            <div className="bg-slate-800/30 rounded-lg p-3 mt-2">
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Resumo</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                        const counts = {};
                                        selectedQuestions.forEach(q => {
                                            counts[q.disciplina] = (counts[q.disciplina] || 0) + 1;
                                        });
                                        return Object.entries(counts).map(([disc, count]) => {
                                            const colors = getDisciplineColor(disc);
                                            return (
                                                <span key={disc} className={`text-[10px] px-2 py-1 rounded-md ${colors.bg} ${colors.text}`}>
                                                    {disc}: {count}
                                                </span>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Success */
                        <div className="text-center py-6">
                            <svg className="w-14 h-14 text-emerald-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-bold text-slate-100">Prova gerada com sucesso!</p>
                            <p className="text-sm text-slate-400 mt-2">
                                O arquivo JSON foi baixado com {selectedQuestions.length} questões.
                            </p>
                            <p className="text-xs text-slate-500 mt-3">
                                Use o script <code className="text-indigo-400">generate-docx.py</code> para converter em Word.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 pb-5">
                    {!exported ? (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={selectedQuestions.length === 0}
                                className="px-5 py-2 text-sm font-semibold rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white transition-all duration-200 btn-press disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Baixar JSON
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={handleClose}
                            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// QuestBank — ExamsPanel Component
// View saved exams/lists history with details

const ExamsPanel = ({ isOpen, onClose, onLoadExam }) => {
    const [exams, setExams] = React.useState([]);
    const [loading, setLoading] = React.useState(true);
    const [expandedId, setExpandedId] = React.useState(null);

    React.useEffect(() => {
        if (isOpen) loadExams();
    }, [isOpen]);

    const loadExams = async () => {
        setLoading(true);
        try {
            const all = await db.exams.orderBy('created_at').reverse().toArray();
            setExams(all);
        } catch (err) {
            console.error('Error loading exams:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (examId, examTitle) => {
        if (!confirm(`Tem certeza que deseja excluir "${examTitle}" do histórico?`)) return;
        try {
            // Remove exam usage tags from questions
            const exam = exams.find(e => e.id === examId);
            if (exam && exam.questionIds) {
                for (const qId of exam.questionIds) {
                    const question = await db.questions.get(qId);
                    if (question && question.usedInExams) {
                        await db.questions.update(qId, {
                            usedInExams: question.usedInExams.filter(t => t !== examTitle),
                        });
                    }
                }
            }
            await db.exams.delete(examId);
            await loadExams();
        } catch (err) {
            console.error('Error deleting exam:', err);
        }
    };

    const handleRedownload = async (exam) => {
        try {
            // Load actual questions from DB
            const questions = [];
            for (const qId of (exam.questionIds || [])) {
                const q = await db.questions.get(qId);
                if (q) questions.push(q);
            }
            if (questions.length === 0) {
                alert('Nenhuma questão encontrada. Elas podem ter sido removidas do banco.');
                return;
            }
            // Re-export using the stored config
            // We'll emit an event that export-modal can handle
            if (onLoadExam) onLoadExam(exam, questions);
        } catch (err) {
            alert('Erro ao recarregar prova.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] shadow-2xl animate-modal-in border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Histórico de Provas/Listas</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{exams.length} {exams.length === 1 ? 'prova salva' : 'provas salvas'}</p>
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
                <div className="flex-1 overflow-y-auto p-5">
                    {loading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}

                    {!loading && exams.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                            <svg className="w-12 h-12 mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm font-medium">Nenhuma prova salva</p>
                            <p className="text-xs mt-1 text-gray-400">As provas aparecem aqui após gerar pela primeira vez</p>
                        </div>
                    )}

                    {!loading && exams.length > 0 && (
                        <div className="space-y-2">
                            {exams.map((exam) => {
                                const isExpanded = expandedId === exam.id;
                                const createdDate = new Date(exam.created_at);
                                const dateStr = createdDate.toLocaleDateString('pt-BR');
                                const timeStr = createdDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                                return (
                                    <div
                                        key={exam.id}
                                        className="border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-all"
                                    >
                                        {/* Exam header */}
                                        <div
                                            className="flex items-center gap-3 p-3.5 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => setExpandedId(isExpanded ? null : exam.id)}
                                        >
                                            <svg
                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                                fill="currentColor" viewBox="0 0 8 8"
                                            >
                                                <path d="M2 0 L6 4 L2 8 Z" />
                                            </svg>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="text-sm font-semibold text-gray-800 truncate">{exam.title}</h4>
                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium flex-shrink-0">
                                                        {exam.questionCount || exam.questionIds?.length || 0} questões
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5">
                                                    <span className="text-[10px] text-gray-400">
                                                        {dateStr} às {timeStr}
                                                    </span>
                                                    {exam.professor && (
                                                        <span className="text-[10px] text-gray-400">
                                                            Prof. {exam.professor}
                                                        </span>
                                                    )}
                                                    {exam.instituicao && (
                                                        <span className="text-[10px] text-gray-400">
                                                            {exam.instituicao}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleRedownload(exam)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                                                    title="Baixar novamente"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(exam.id, exam.title)}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 animate-fade-in border-t border-gray-100">
                                                <div className="mt-3 space-y-2">
                                                    <p className="text-xs text-gray-500">
                                                        <span className="font-semibold">IDs das questões:</span>
                                                    </p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {(exam.questionIds || []).map((qId, i) => (
                                                            <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                                                                {qId}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    {exam.data && (
                                                        <p className="text-xs text-gray-400 mt-2">
                                                            Data da prova: {exam.data.split('-').reverse().join('/')}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

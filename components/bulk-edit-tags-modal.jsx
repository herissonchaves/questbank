const { useState, useEffect } = React;

const BulkEditTagsModal = ({ isOpen, onClose, onSave, selectedQuestions }) => {
    const [tags, setTags] = useState([]);

    useEffect(() => {
        if (isOpen && selectedQuestions.length > 0) {
            const allTags = new Set();
            selectedQuestions.forEach(q => {
                if (q.tags) {
                    q.tags.forEach(t => {
                        // Ignore system tags
                        if (!t.match(/^\d{8}$/) && !t.match(/^A\d{8}$/)) {
                            allTags.add(t);
                        }
                    });
                }
            });
            setTags(Array.from(allTags));
        }
    }, [isOpen, selectedQuestions]);

    if (!isOpen) return null;

    const handleSave = () => {
        // App.jsx handleBulkEditTags currently accepts (actionType, parsedTags).
        // Since we removed 'actionType' UI, we will always pass 'replace' action.
        // That means the tags array will literally overwrite the tags (keeping system tags safe).
        onSave('replace', tags);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-slide-up">
                {/* Header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Editar Tags em Lote</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Modificando tags de <span className="font-bold text-brand-600">{selectedQuestions.length}</span> questões selecionadas
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        Tags
                    </label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[40px] focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all">
                        {tags.map((tag, i) => (
                            <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                #{tag}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setTags(tags.filter((_, idx) => idx !== i));
                                    }}
                                    className="text-indigo-300 hover:text-indigo-600 transition-colors ml-0.5"
                                    title="Remover tag"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                        <input
                            type="text"
                            placeholder={tags.length === 0 ? "Nova tag..." : "Nova tag..."}
                            className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none py-0.5"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ',') {
                                    e.preventDefault();
                                    const val = e.target.value.trim().replace(/,/g, '');
                                    if (val && !tags.includes(val)) {
                                        setTags([...tags, val]);
                                    }
                                    e.target.value = '';
                                } else if (e.key === 'Backspace' && !e.target.value) {
                                    if (tags.length > 0) {
                                        setTags(tags.slice(0, -1));
                                    }
                                }
                            }}
                            onBlur={(e) => {
                                const val = e.target.value.trim().replace(/,/g, '');
                                if (val && !tags.includes(val)) {
                                    setTags([...tags, val]);
                                    e.target.value = '';
                                }
                            }}
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">Pressione Enter ou vírgula para adicionar. Tags internas do sistema são preservadas automaticamente.</p>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm transition-colors"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

window.BulkEditTagsModal = BulkEditTagsModal;

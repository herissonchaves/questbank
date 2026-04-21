const BulkEditTagsModal = ({ isOpen, onClose, onSave, selectedQuestions, allQuestions }) => {
    const [tags, setTags] = React.useState([]);
    const [inputValue, setInputValue] = React.useState('');
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const inputRef = React.useRef(null);
    const suggestionsRef = React.useRef(null);

    // Collect all existing tags from the full question bank (excluding system tags)
    const existingTags = React.useMemo(() => {
        const tagSet = new Set();
        const source = allQuestions || [];
        source.forEach(q => {
            (q.tags || []).forEach(t => {
                if (!t.match(/^\d{8}$/) && !t.match(/^A\d{8}$/)) {
                    tagSet.add(t);
                }
            });
        });
        return Array.from(tagSet).sort((a, b) => a.localeCompare(b));
    }, [allQuestions]);

    // Filtered suggestions based on current input
    const suggestions = React.useMemo(() => {
        if (!inputValue.trim()) return [];
        const lower = inputValue.trim().toLowerCase();
        return existingTags.filter(t =>
            t.toLowerCase().includes(lower) && !tags.includes(t)
        ).slice(0, 8);
    }, [inputValue, existingTags, tags]);

    React.useEffect(() => {
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
            setInputValue('');
            setShowSuggestions(false);
        }
    }, [isOpen, selectedQuestions]);

    if (!isOpen) return null;

    const addTag = (val) => {
        const trimmed = val.trim().replace(/,/g, '');
        if (trimmed && !tags.includes(trimmed)) {
            setTags(prev => [...prev, trimmed]);
        }
        setInputValue('');
        setShowSuggestions(false);
        if (inputRef.current) inputRef.current.focus();
    };

    const handleSave = () => {
        // Commit any pending input value before saving
        if (inputValue.trim()) addTag(inputValue);
        onSave('replace', tags);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            // If there's a suggestion highlighted, pick the first one
            if (suggestions.length > 0 && showSuggestions) {
                addTag(suggestions[0]);
            } else {
                addTag(inputValue);
            }
        } else if (e.key === 'Escape') {
            setShowSuggestions(false);
        } else if (e.key === 'Backspace' && !inputValue) {
            if (tags.length > 0) {
                setTags(prev => prev.slice(0, -1));
            }
        }
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

                    {/* Tag input container */}
                    <div className="relative">
                        <div
                            className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-lg min-h-[40px] focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all cursor-text"
                            onClick={() => inputRef.current && inputRef.current.focus()}
                        >
                            {tags.map((tag, i) => (
                                <span key={i} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                                    #{tag}
                                    <button
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault(); // prevent blur on input
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
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                placeholder={tags.length === 0 ? "Nova tag..." : ""}
                                className="flex-1 min-w-[120px] bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none py-0.5"
                                onChange={(e) => {
                                    setInputValue(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    if (inputValue.trim()) setShowSuggestions(true);
                                }}
                                onBlur={() => {
                                    // Delay so clicking a suggestion registers first
                                    setTimeout(() => setShowSuggestions(false), 150);
                                }}
                            />
                        </div>

                        {/* Autocomplete dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                            <div
                                ref={suggestionsRef}
                                className="absolute z-10 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
                            >
                                <div className="px-2 py-1 border-b border-gray-100">
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Tags existentes</span>
                                </div>
                                {suggestions.map((suggestion, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            addTag(suggestion);
                                        }}
                                        className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors flex items-center gap-2"
                                    >
                                        <svg className="w-3 h-3 text-indigo-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                        </svg>
                                        <span className="font-medium">#{suggestion}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-gray-400 mt-1.5">Pressione Enter ou vírgula para adicionar. Tags internas do sistema são preservadas automaticamente.</p>
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

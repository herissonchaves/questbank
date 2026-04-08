// QuestBank — QuestionList Component
// Scrollable list of QuestionCards with FilterBar and lazy loading

const QuestionList = ({ questions, allQuestions, selectedIds, filters, onFilterChange, onClearFilters, onToggleSelect }) => {
    const [expandedIds, setExpandedIds] = React.useState(new Set());
    const [visibleCount, setVisibleCount] = React.useState(30);
    const listRef = React.useRef(null);

    // Reset visible count when questions change
    React.useEffect(() => {
        setVisibleCount(30);
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    }, [questions.length, filters]);

    const toggleExpand = (id) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Lazy load on scroll
    const handleScroll = React.useCallback(() => {
        if (!listRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        if (scrollHeight - scrollTop - clientHeight < 400) {
            setVisibleCount(prev => Math.min(prev + 20, questions.length));
        }
    }, [questions.length]);

    // Available filter values derived from ALL questions (not filtered)
    const availableValues = React.useMemo(() => ({
        bancas: QBTaxonomy.getUniqueValues(allQuestions, 'banca'),
        anos: QBTaxonomy.getUniqueValues(allQuestions, 'ano').sort((a, b) => b - a),
        dificuldades: QBTaxonomy.getUniqueValues(allQuestions, 'dificuldade'),
        tipos: QBTaxonomy.getUniqueValues(allQuestions, 'tipo'),
    }), [allQuestions]);

    const visibleQuestions = questions.slice(0, visibleCount);
    const hasMore = visibleCount < questions.length;

    return (
        <div className="flex flex-col h-full">
            {/* Filter bar */}
            <FilterBar
                filters={filters}
                availableValues={availableValues}
                onFilterChange={onFilterChange}
                onClearFilters={onClearFilters}
                resultCount={questions.length}
                totalCount={allQuestions.length}
            />

            {/* Question list */}
            <div
                ref={listRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-3 space-y-2"
            >
                {visibleQuestions.map(q => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        isSelected={selectedIds.includes(q.id)}
                        isExpanded={expandedIds.has(q.id)}
                        onToggleExpand={toggleExpand}
                        onToggleSelect={onToggleSelect}
                    />
                ))}

                {/* Load more indicator */}
                {hasMore && (
                    <div className="flex items-center justify-center py-4">
                        <button
                            onClick={() => setVisibleCount(prev => Math.min(prev + 30, questions.length))}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg hover:bg-indigo-500/5 transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Carregar mais ({questions.length - visibleCount} restantes)
                        </button>
                    </div>
                )}

                {/* Empty state — filtered */}
                {questions.length === 0 && allQuestions.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm font-medium">Nenhuma questão encontrada</p>
                        <p className="text-xs mt-1 text-slate-600">Ajuste os filtros ou selecione outros assuntos</p>
                        <button
                            onClick={onClearFilters}
                            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded-lg border border-indigo-500/20 hover:bg-indigo-500/5 transition-all"
                        >
                            Limpar todos os filtros
                        </button>
                    </div>
                )}

                {/* No questions at all */}
                {allQuestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                        <svg className="w-14 h-14 mb-4 opacity-15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium">Banco de questões vazio</p>
                        <p className="text-xs mt-1 text-slate-600">Importe um arquivo JSON para começar</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// QuestBank — QuestionList Component
// Paginated list of QuestionCards with FilterBar, pagination controls

const QuestionList = ({ questions, allQuestions, selectedIds, selectedIdsSet, filters, onFilterChange, onClearFilters, onToggleSelect, onSelectAllFiltered, ignoreUsed, onToggleIgnoreUsed, searchRef }) => {
    const [expandedIds, setExpandedIds] = React.useState(new Set());
    const [currentPage, setCurrentPage] = React.useState(1);
    const listRef = React.useRef(null);
    const ITEMS_PER_PAGE = 10;

    // Reset to page 1 when questions or filters change
    React.useEffect(() => {
        setCurrentPage(1);
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

    // Pagination calculations
    const totalPages = Math.max(1, Math.ceil(questions.length / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, questions.length);
    const visibleQuestions = questions.slice(startIndex, endIndex);

    const goToPage = (page) => {
        const p = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(p);
        if (listRef.current) {
            listRef.current.scrollTop = 0;
        }
    };

    // Generate visible page numbers
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 7;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');

            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);

            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    // Available filter values derived from ALL questions (not filtered)
    const availableValues = React.useMemo(() => ({
        bancas: QBTaxonomy.getUniqueValues(allQuestions, 'banca'),
        anos: QBTaxonomy.getUniqueValues(allQuestions, 'ano').sort((a, b) => b - a),
        dificuldades: QBTaxonomy.getUniqueValues(allQuestions, 'dificuldade'),
        tipos: QBTaxonomy.getUniqueValues(allQuestions, 'tipo'),
        regioes: QBTaxonomy.getUniqueValues(allQuestions, 'regiao'),
        tags: (() => {
            const allTags = new Set();
            allQuestions.forEach(q => {
                (q.tags || []).forEach(t => allTags.add(t));
            });
            return [...allTags].sort();
        })(),
    }), [allQuestions]);

    // Check if all visible filtered questions are selected
    const allFilteredSelected = questions.length > 0 && questions.every(q => selectedIdsSet.has(q.id));

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
                ignoreUsed={ignoreUsed}
                onToggleIgnoreUsed={onToggleIgnoreUsed}
                searchRef={searchRef}
            />

            {/* Select all bar */}
            {questions.length > 0 && (
                <div className="flex items-center justify-between px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                    <button
                        onClick={() => onSelectAllFiltered(questions.map(q => q.id))}
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 transition-colors"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {allFilteredSelected ? 'Desselecionar todas' : `Selecionar todas (${questions.length})`}
                    </button>
                    <span className="text-[10px] text-gray-400">
                        Mostrando {startIndex + 1}–{endIndex} de {questions.length}
                    </span>
                </div>
            )}

            {/* Question list */}
            <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50/50"
            >
                {visibleQuestions.map(q => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        isSelected={selectedIdsSet.has(q.id)}
                        isExpanded={expandedIds.has(q.id)}
                        onToggleExpand={toggleExpand}
                        onToggleSelect={onToggleSelect}
                    />
                ))}

                {/* Empty state — filtered */}
                {questions.length === 0 && allQuestions.length > 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <svg className="w-12 h-12 mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-500">Nenhuma questão encontrada</p>
                        <p className="text-xs mt-1 text-gray-400">Ajuste os filtros ou selecione outros assuntos</p>
                        <button
                            onClick={onClearFilters}
                            className="mt-3 text-xs text-brand-600 hover:text-brand-700 font-medium px-3 py-1.5 rounded-lg border border-brand-200 hover:bg-brand-50 transition-all"
                        >
                            Limpar todos os filtros
                        </button>
                    </div>
                )}

                {/* No questions at all */}
                {allQuestions.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <svg className="w-14 h-14 mb-4 opacity-15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm font-medium text-gray-500">Banco de questões vazio</p>
                        <p className="text-xs mt-1 text-gray-400">Importe um arquivo JSON para começar</p>
                    </div>
                )}
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 px-3 py-2.5 border-t border-gray-200 bg-white flex-shrink-0">
                    {/* Previous */}
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Página anterior"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Page numbers */}
                    {getPageNumbers().map((page, i) => (
                        page === '...' ? (
                            <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                                ···
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => goToPage(page)}
                                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold transition-all ${
                                    currentPage === page
                                        ? 'bg-brand-600 text-white shadow-md shadow-brand-500/25'
                                        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                                }`}
                            >
                                {page}
                            </button>
                        )
                    ))}

                    {/* Next */}
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        title="Próxima página"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
            )}
        </div>
    );
};

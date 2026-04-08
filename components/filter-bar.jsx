// QuestBank — FilterBar Component
// Search + dynamic dropdown filters for banca, ano, dificuldade, tipo

const FilterBar = ({ filters, availableValues, onFilterChange, onClearFilters, resultCount, totalCount }) => {

    const hasActiveFilters = filters.search || filters.banca || filters.ano || filters.dificuldade || filters.tipo;

    return (
        <div className="flex flex-col gap-2 p-3 border-b border-slate-700/40">
            {/* Search */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    placeholder="Buscar no enunciado..."
                    className="w-full bg-slate-800/50 border border-slate-700/40 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                />
                {filters.search && (
                    <button
                        onClick={() => onFilterChange('search', '')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Filter dropdowns */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Banca */}
                <select
                    value={filters.banca}
                    onChange={(e) => onFilterChange('banca', e.target.value)}
                    className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundPosition: "right 6px center", backgroundSize: "14px", backgroundRepeat: "no-repeat", paddingRight: "24px" }}
                >
                    <option value="">Banca</option>
                    {availableValues.bancas.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>

                {/* Ano */}
                <select
                    value={filters.ano}
                    onChange={(e) => onFilterChange('ano', e.target.value)}
                    className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundPosition: "right 6px center", backgroundSize: "14px", backgroundRepeat: "no-repeat", paddingRight: "24px" }}
                >
                    <option value="">Ano</option>
                    {availableValues.anos.map(v => (
                        <option key={v} value={v}>{v}</option>
                    ))}
                </select>

                {/* Dificuldade */}
                <select
                    value={filters.dificuldade}
                    onChange={(e) => onFilterChange('dificuldade', e.target.value)}
                    className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundPosition: "right 6px center", backgroundSize: "14px", backgroundRepeat: "no-repeat", paddingRight: "24px" }}
                >
                    <option value="">Dificuldade</option>
                    {availableValues.dificuldades.map(v => (
                        <option key={v} value={v}>{DIFFICULTY_STYLES[v]?.label || v}</option>
                    ))}
                </select>

                {/* Tipo */}
                <select
                    value={filters.tipo}
                    onChange={(e) => onFilterChange('tipo', e.target.value)}
                    className="bg-slate-800/60 border border-slate-700/40 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 cursor-pointer appearance-none"
                    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='%2394a3b8' viewBox='0 0 20 20'%3E%3Cpath d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z'/%3E%3C/svg%3E\")", backgroundPosition: "right 6px center", backgroundSize: "14px", backgroundRepeat: "no-repeat", paddingRight: "24px" }}
                >
                    <option value="">Tipo</option>
                    {availableValues.tipos.map(v => (
                        <option key={v} value={v}>{TYPE_LABELS[v] || v}</option>
                    ))}
                </select>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <button
                        onClick={onClearFilters}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpar
                    </button>
                )}

                {/* Result count */}
                <span className="ml-auto text-xs text-slate-500">
                    {resultCount === totalCount
                        ? `${totalCount} questões`
                        : `${resultCount} de ${totalCount}`
                    }
                </span>
            </div>
        </div>
    );
};

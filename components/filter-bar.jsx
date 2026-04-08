// QuestBank — FilterBar Component
// Search + dynamic dropdown filters + advanced filters + ignore used toggle

const FilterBar = ({ filters, availableValues, onFilterChange, onClearFilters, resultCount, totalCount, ignoreUsed, onToggleIgnoreUsed, searchRef }) => {

    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const hasActiveFilters = filters.search || filters.banca || filters.ano || filters.dificuldade || filters.tipo || filters.regiao || filters.tag || filters.codigo || ignoreUsed;

    return (
        <div className="flex flex-col gap-2 p-3 border-b border-gray-200">
            {/* Search */}
            <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    ref={searchRef}
                    value={filters.search}
                    onChange={(e) => onFilterChange('search', e.target.value)}
                    placeholder="Buscar no enunciado, código ou tags..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                />
                {filters.search && (
                    <button
                        onClick={() => onFilterChange('search', '')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {/* Basic filter dropdowns */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Banca */}
                <select
                    value={filters.banca}
                    onChange={(e) => onFilterChange('banca', e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
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
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
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
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
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
                    className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                >
                    <option value="">Tipo</option>
                    {availableValues.tipos.map(v => (
                        <option key={v} value={v}>{TYPE_LABELS[v] || v}</option>
                    ))}
                </select>

                {/* Advanced toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                        showAdvanced
                            ? 'bg-brand-50 border-brand-200 text-brand-700'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                    Avançado
                </button>

                {/* Clear filters */}
                {hasActiveFilters && (
                    <button
                        onClick={() => { onClearFilters(); if (ignoreUsed) onToggleIgnoreUsed(); }}
                        className="text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors flex items-center gap-1"
                    >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Limpar
                    </button>
                )}

                {/* Result count */}
                <span className="ml-auto text-xs text-gray-400">
                    {resultCount === totalCount
                        ? `${totalCount} questões`
                        : `${resultCount} de ${totalCount}`
                    }
                </span>
            </div>

            {/* Advanced filters */}
            {showAdvanced && (
                <div className="flex flex-wrap gap-2 items-center pt-1 animate-fade-in">
                    {/* Região */}
                    <select
                        value={filters.regiao || ''}
                        onChange={(e) => onFilterChange('regiao', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                    >
                        <option value="">Região</option>
                        {availableValues.regioes.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>

                    {/* Tag */}
                    <select
                        value={filters.tag || ''}
                        onChange={(e) => onFilterChange('tag', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                    >
                        <option value="">Tag</option>
                        {availableValues.tags.map(v => (
                            <option key={v} value={v}>{v}</option>
                        ))}
                    </select>

                    {/* Código da questão */}
                    <input
                        type="text"
                        value={filters.codigo || ''}
                        onChange={(e) => onFilterChange('codigo', e.target.value)}
                        placeholder="Código (ex: ENEM-2024)"
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all w-40"
                    />

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>

                    {/* Ignore used questions */}
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                        <input
                            type="checkbox"
                            checked={ignoreUsed}
                            onChange={onToggleIgnoreUsed}
                            className="w-3.5 h-3.5 rounded"
                        />
                        <span className="text-xs text-gray-600 group-hover:text-gray-800 font-medium transition-colors">
                            Ignorar já usadas
                        </span>
                    </label>
                </div>
            )}
        </div>
    );
};

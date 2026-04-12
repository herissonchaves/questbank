// QuestBank — FilterBar Component
// Search + dynamic dropdown filters + advanced filters + ignore used toggle

const FilterBar = ({ filters, availableValues, onFilterChange, onClearFilters, resultCount, totalCount, ignoreUsed, onToggleIgnoreUsed, searchRef }) => {

    const [showAdvanced, setShowAdvanced] = React.useState(false);
    const hasActiveFilters = filters.search || filters.banca || filters.ano || filters.dificuldade || filters.tipo || filters.codigo || filters.orderById || ignoreUsed || filters.orderByRecent || filters.resolucao || filters.tag;

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

                {/* Resolução Menu Dropdown */}
                <div className="relative group">
                    <button
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${filters.resolucao
                                ? 'bg-amber-50 border-amber-200 text-amber-700 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        title="Filtrar questões por resolução"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {filters.resolucao === 'com' ? 'Com Resolução' : filters.resolucao === 'sem' ? 'Sem Resolução' : 'Resolução'}
                        <svg className="w-3 h-3 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                        </svg>
                    </button>

                    <div className="absolute left-0 top-full mt-1 w-40 bg-white rounded-lg shadow-xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 py-1">
                        <button
                            onClick={() => onFilterChange('resolucao', 'com')}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${filters.resolucao === 'com' ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${filters.resolucao === 'com' ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                            Com resolução
                        </button>
                        <button
                            onClick={() => onFilterChange('resolucao', 'sem')}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${filters.resolucao === 'sem' ? 'bg-amber-50 text-amber-700 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${filters.resolucao === 'sem' ? 'bg-amber-500' : 'bg-transparent'}`}></div>
                            Sem resolução
                        </button>
                        <div className="h-px bg-gray-100 my-1"></div>
                        <button
                            onClick={() => onFilterChange('resolucao', '')}
                            className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center gap-2 ${filters.resolucao === '' ? 'text-brand-600 font-semibold' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'}`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${filters.resolucao === '' ? 'bg-brand-500' : 'bg-transparent'}`}></div>
                            Todas as questões
                        </button>
                    </div>
                </div>

                {/* Advanced toggle */}
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1 ${showAdvanced
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
                    {/* Order By ID */}
                    <select
                        value={filters.orderById || ''}
                        onChange={(e) => onFilterChange('orderById', e.target.value)}
                        className="bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                    >
                        <option value="">Ordenar ID (Nenhum)</option>
                        <option value="asc">ID Crescente</option>
                        <option value="desc">ID Decrescente</option>
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

                    {/* Order by Recent */}
                    <button
                        onClick={() => onFilterChange('orderByRecent', !filters.orderByRecent)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${filters.orderByRecent
                                ? 'bg-sky-50 border-sky-200 text-sky-700 shadow-sm'
                                : 'bg-gray-50 border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        title="Mostrar questões mais recentes primeiro"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                        </svg>
                        Mais recentes
                    </button>

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

                    {/* Divider */}
                    <div className="w-px h-5 bg-gray-200 mx-1"></div>

                    {/* Tag filter */}
                    <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <input
                            type="text"
                            value={filters.tag || ''}
                            onChange={(e) => onFilterChange('tag', e.target.value)}
                            placeholder="Filtrar por tag..."
                            className={`bg-gray-50 border rounded-lg px-2.5 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all w-36 ${filters.tag ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200'}`}
                        />
                        {filters.tag && (
                            <button
                                onClick={() => onFilterChange('tag', '')}
                                className="text-indigo-400 hover:text-indigo-600 transition-colors"
                                title="Limpar filtro de tag"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

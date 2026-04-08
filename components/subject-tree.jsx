// QuestBank — SubjectTree Component
// Dynamic hierarchical tree with checkboxes, search, and cascading selection

const SubjectTree = ({ tree, activeSubjects, onSubjectsChange }) => {
    const [expanded, setExpanded] = React.useState({});
    const [search, setSearch] = React.useState('');

    // Auto-expand first two levels on mount
    React.useEffect(() => {
        const initial = {};
        Object.keys(tree).forEach(k => {
            initial[k] = true;
            // Also expand level 2
            Object.keys(tree[k].children || {}).forEach(k2 => {
                initial[k + '>' + k2] = true;
            });
        });
        setExpanded(prev => ({ ...prev, ...initial }));
    }, [Object.keys(tree).join(',')]);

    const toggleExpand = (path, e) => {
        if (e) e.stopPropagation();
        setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
    };

    const handleToggle = (path, node, e) => {
        if (e) e.stopPropagation();
        const newSubjects = QBTaxonomy.toggleNode(path, node, activeSubjects);
        onSubjectsChange(newSubjects);
    };

    const clearAll = () => onSubjectsChange([]);

    // Check if a node or any descendant matches the search
    const nodeMatchesSearch = (key, node) => {
        if (!search) return true;
        const term = search.toLowerCase();
        if (key.toLowerCase().includes(term)) return true;
        return Object.entries(node.children || {}).some(([k, v]) => nodeMatchesSearch(k, v));
    };

    const renderNode = (key, node, parentPath, level) => {
        const fullPath = parentPath ? `${parentPath}>${key}` : key;
        const hasChildren = node.children && Object.keys(node.children).length > 0;
        const isExpanded = expanded[fullPath] !== false;
        const state = QBTaxonomy.getNodeState(fullPath, node, activeSubjects);

        if (!nodeMatchesSearch(key, node)) return null;

        const indentClass = level === 0 ? '' : 'ml-3';
        const colors = level === 0 ? getDisciplineColor(key) : null;

        return (
            <div key={fullPath} className={indentClass}>
                <div className="flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-800/60 cursor-pointer group transition-all duration-150">
                    {/* Expand/collapse chevron — only click here to expand */}
                    {hasChildren ? (
                        <button
                            className="w-5 h-5 flex items-center justify-center text-slate-500 group-hover:text-slate-300 transition-transform duration-200 flex-shrink-0 hover:bg-slate-700/50 rounded"
                            style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                            onClick={(e) => toggleExpand(fullPath, e)}
                        >
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
                                <path d="M2 0 L6 4 L2 8 Z" />
                            </svg>
                        </button>
                    ) : (
                        <span className="w-5 flex-shrink-0" />
                    )}

                    {/* Checkbox + Label — click either to toggle selection */}
                    <label
                        className="flex items-center gap-1.5 flex-1 min-w-0 cursor-pointer"
                        onClick={(e) => { e.preventDefault(); handleToggle(fullPath, node, e); }}
                    >
                        <input
                            type="checkbox"
                            checked={state === 'checked'}
                            ref={(el) => { if (el) el.indeterminate = state === 'indeterminate'; }}
                            onChange={() => {}}
                            className="w-3.5 h-3.5 rounded flex-shrink-0 pointer-events-none"
                        />

                        {/* Discipline color dot */}
                        {level === 0 && colors && (
                            <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
                        )}

                        {/* Label */}
                        <span className={`text-sm truncate flex-1 ${
                            level === 0 ? 'font-semibold text-slate-200' :
                            level === 1 ? 'font-medium text-slate-300' :
                            'text-slate-400'
                        } group-hover:text-slate-100 transition-colors`}>
                            {node.label}
                        </span>
                    </label>

                    {/* Count badge */}
                    <span className="text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium">
                        {node.count}
                    </span>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="animate-fade-in">
                        {Object.entries(node.children)
                            .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
                            .map(([childKey, childNode]) =>
                                renderNode(childKey, childNode, fullPath, level + 1)
                            )}
                    </div>
                )}
            </div>
        );
    };

    const hasActiveFilters = activeSubjects.length > 0;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-3 border-b border-slate-700/40">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Assuntos
                    </h2>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                </div>
                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar assunto..."
                        className="w-full bg-slate-800/50 border border-slate-700/40 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Tree */}
            <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                {Object.entries(tree)
                    .sort(([a], [b]) => a.localeCompare(b, 'pt-BR'))
                    .map(([key, node]) => renderNode(key, node, '', 0))
                }
                {Object.keys(tree).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                        <svg className="w-10 h-10 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                        <p className="text-xs text-center">Importe questões para<br/>ver a árvore de assuntos</p>
                    </div>
                )}
            </div>
        </div>
    );
};

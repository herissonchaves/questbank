// QuestBank — SubjectTree Component
// Dynamic hierarchical tree with checkboxes, search, cascading selection, filtered counts (white theme)

const SubjectTree = ({ tree, filteredTree, activeSubjects, onSubjectsChange, onMoveNode }) => {
    const [expanded, setExpanded] = React.useState({});
    const [search, setSearch] = React.useState('');
    const [dragState, setDragState] = React.useState({ isDragging: false, nodePath: null, level: null });
    const [dragOverPath, setDragOverPath] = React.useState(null);

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

    const nodeMatchesSearch = (key, node) => {
        if (!search) return true;
        const term = search.toLowerCase();
        if (key.toLowerCase().includes(term)) return true;
        return Object.entries(node.children || {}).some(([k, v]) => nodeMatchesSearch(k, v));
    };

    // Get filtered count for a node path
    const getFilteredCount = (key, parentPath, level) => {
        if (!filteredTree) return null;
        try {
            if (level === 0) return filteredTree[key]?.count;
            const parts = parentPath ? parentPath.split('>') : [];
            parts.push(key);
            let node = filteredTree;
            for (let i = 0; i < parts.length; i++) {
                if (i === 0) {
                    node = node[parts[i]];
                } else {
                    node = node?.children?.[parts[i]];
                }
                if (!node) return 0;
            }
            return node.count;
        } catch {
            return null;
        }
    };

    const renderNode = (key, node, parentPath, level) => {
        const fullPath = parentPath ? `${parentPath}>${key}` : key;
        const hasChildren = node.children && Object.keys(node.children).length > 0;
        const isExpanded = !!expanded[fullPath];
        const state = QBTaxonomy.getNodeState(fullPath, node, activeSubjects);

        if (!nodeMatchesSearch(key, node)) return null;

        const indentClass = level === 0 ? '' : 'ml-3';
        const colors = level === 0 ? getDisciplineColor(key) : null;

        // Get filtered count
        const filteredCount = getFilteredCount(key, parentPath, level);
        const showFilteredCount = filteredCount !== null && filteredCount !== node.count;

        // Drag and drop logic
        const isHoveringValidLevel = dragState.isDragging && dragState.level === level + 1;
        const isSelfOrDescendant = dragState.nodePath && fullPath.startsWith(dragState.nodePath);
        const isValidDropTarget = isHoveringValidLevel && !isSelfOrDescendant;
        const isDragOver = dragOverPath === fullPath && isValidDropTarget;

        return (
            <div key={fullPath} className={indentClass}>
                <div 
                    className={`flex items-center gap-1.5 py-1 px-2 rounded-lg cursor-pointer group transition-all duration-150 ${
                        isDragOver ? 'bg-brand-100 ring-2 ring-brand-400 border-dashed border border-brand-500' : 'hover:bg-gray-100'
                    } ${dragState.nodePath === fullPath ? 'opacity-40 border-dashed border border-gray-300' : ''}`}
                    draggable={true}
                    onDragStart={(e) => {
                        e.dataTransfer.effectAllowed = 'move';
                        setDragState({ isDragging: true, nodePath: fullPath, level });
                    }}
                    onDragOver={(e) => {
                        if (isValidDropTarget) {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                            if (dragOverPath !== fullPath) setDragOverPath(fullPath);
                        }
                    }}
                    onDragLeave={(e) => {
                        if (dragOverPath === fullPath) setDragOverPath(null);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (isValidDropTarget && onMoveNode) {
                            onMoveNode(dragState.nodePath, fullPath, dragState.level);
                        }
                        setDragOverPath(null);
                        setDragState({ isDragging: false, nodePath: null, level: null });
                    }}
                    onDragEnd={() => {
                        setDragOverPath(null);
                        setDragState({ isDragging: false, nodePath: null, level: null });
                    }}
                >
                    {/* Expand/collapse chevron */}
                    {hasChildren ? (
                        <button
                            className="w-5 h-5 flex items-center justify-center text-gray-400 group-hover:text-gray-600 transition-transform duration-200 flex-shrink-0 hover:bg-gray-200 rounded"
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

                    {/* Checkbox + Label */}
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
                            level === 0 ? 'font-semibold text-gray-800' :
                            level === 1 ? 'font-medium text-gray-700' :
                            'text-gray-600'
                        } group-hover:text-gray-900 transition-colors`}>
                            {node.label}
                        </span>
                    </label>

                    {/* Count badge — shows filtered/total when filters active */}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium ${
                        showFilteredCount ? 'bg-brand-50 text-brand-600' : 'bg-gray-100 text-gray-400'
                    }`}>
                        {showFilteredCount ? `${filteredCount}/${node.count}` : node.count}
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
            <div className="p-3 border-b border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Assuntos
                    </h2>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAll}
                            className="text-[10px] text-brand-600 hover:text-brand-700 font-medium transition-colors"
                        >
                            Limpar
                        </button>
                    )}
                </div>
                {/* Search */}
                <div className="relative">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar assunto..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
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

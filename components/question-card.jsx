// QuestBank — QuestionCard Component
// Expandable card with simplified/full view, add/remove from exam

const QuestionCard = ({ question, isSelected, isExpanded, onToggleExpand, onToggleSelect }) => {
    const q = question;
    const colors = getDisciplineColor(q.disciplina);
    const diff = DIFFICULTY_STYLES[q.dificuldade] || DIFFICULTY_STYLES['medio'];

    return (
        <div
            className={`card-glow rounded-xl border transition-all duration-200 animate-fade-in ${
                isSelected
                    ? 'border-indigo-500/40 bg-indigo-500/5'
                    : 'border-slate-700/30 bg-slate-900/40 hover:border-slate-600/50'
            }`}
        >
            {/* Simplified view (always visible) */}
            <div
                className="flex items-start gap-3 p-3 cursor-pointer"
                onClick={() => onToggleExpand(q.id)}
            >
                {/* Left: expand indicator */}
                <div className="flex-shrink-0 mt-0.5">
                    <svg
                        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        fill="currentColor" viewBox="0 0 8 8"
                    >
                        <path d="M2 0 L6 4 L2 8 Z" />
                    </svg>
                </div>

                {/* Center: info */}
                <div className="flex-1 min-w-0">
                    {/* Top row: badges */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                        {/* ID badge */}
                        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded" title={q.id}>
                            {q.id.length > 12 ? q.id.substring(0, 8) + '…' : q.id}
                        </span>

                        {/* Discipline badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {q.disciplina}
                        </span>

                        {/* Difficulty badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${diff.bg} ${diff.text}`}>
                            {diff.label}
                        </span>

                        {/* Banca + Year */}
                        <span className="text-[10px] text-slate-500">
                            {q.banca} {q.ano}
                        </span>

                        {/* Type */}
                        <span className="text-[10px] text-slate-600">
                            {TYPE_LABELS[q.tipo] || q.tipo}
                        </span>
                    </div>

                    {/* Enunciado preview (2 lines) */}
                    <p className={`text-sm text-slate-300 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {isExpanded ? null : q.enunciado}
                    </p>
                </div>

                {/* Right: add/remove button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(q.id); }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 btn-press ${
                        isSelected
                            ? 'bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30'
                            : 'bg-slate-800/60 text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-400'
                    }`}
                    title={isSelected ? 'Remover da prova' : 'Adicionar à prova'}
                >
                    {isSelected ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Expanded view */}
            {isExpanded && (
                <div className="px-3 pb-3 animate-fade-in border-t border-slate-700/20 mt-0">
                    {/* Full enunciado */}
                    <div className="pt-3 pb-2">
                        <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {q.enunciado}
                        </p>
                    </div>

                    {/* Images */}
                    {q.imagens && q.imagens.length > 0 && (
                        <div className="flex flex-wrap gap-2 my-2">
                            {q.imagens.map((img, i) => (
                                <img
                                    key={i}
                                    src={img}
                                    alt={`Imagem ${i + 1}`}
                                    className="max-w-full max-h-48 rounded-lg border border-slate-700/30"
                                />
                            ))}
                        </div>
                    )}

                    {/* Alternativas */}
                    {q.alternativas && q.alternativas.length > 0 && (
                        <div className="space-y-1.5 my-3">
                            {q.alternativas.map((alt) => {
                                const isCorrect = alt.letra === q.gabarito;
                                return (
                                    <div
                                        key={alt.letra}
                                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            isCorrect
                                                ? 'bg-emerald-500/10 border border-emerald-500/20'
                                                : 'bg-slate-800/30 border border-transparent'
                                        }`}
                                    >
                                        <span className={`font-bold flex-shrink-0 ${
                                            isCorrect ? 'text-emerald-400' : 'text-slate-500'
                                        }`}>
                                            {alt.letra})
                                        </span>
                                        <span className={isCorrect ? 'text-emerald-300' : 'text-slate-400'}>
                                            {alt.texto}
                                        </span>
                                        {isCorrect && (
                                            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Gabarito (for non-objetiva) */}
                    {q.tipo !== 'objetiva' && q.gabarito && (
                        <div className="my-3 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Gabarito:</span>
                            <p className="text-sm text-emerald-300 mt-1">{q.gabarito}</p>
                        </div>
                    )}

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-slate-700/20 mt-2">
                        <MetaItem label="Tópico" value={q.topico} />
                        <MetaItem label="Conteúdo" value={q.conteudo} />
                        <MetaItem label="Assunto" value={q.assunto} />
                        {q.resolucao_link && (
                            <a
                                href={q.resolucao_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                                Resolução
                            </a>
                        )}
                    </div>

                    {/* Tags */}
                    {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {q.tags.map((tag, i) => (
                                <span key={i} className="text-[10px] text-slate-500 bg-slate-800/60 px-1.5 py-0.5 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Small helper for metadata items
const MetaItem = ({ label, value }) => {
    if (!value) return null;
    return (
        <span className="text-[10px] text-slate-500">
            <span className="text-slate-600">{label}:</span> {value}
        </span>
    );
};

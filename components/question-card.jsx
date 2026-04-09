// QuestBank — QuestionCard Component
// Expandable card with simplified/full view, usage tags, edit/delete, HTML support

const QuestionCard = ({ question, isSelected, isExpanded, onToggleExpand, onToggleSelect, onEdit, onDelete }) => {
    const q = question;
    const colors = getDisciplineColor(q.disciplina);
    const diff = DIFFICULTY_STYLES[q.dificuldade] || DIFFICULTY_STYLES['medio'];
    const usedInExams = q.usedInExams || [];
    const isUsed = usedInExams.length > 0;

    const cardRef = React.useRef(null);

    // After render, let KaTeX chew the DOM natively
    React.useEffect(() => {
        if (cardRef.current && window.renderMathInElement) {
            window.renderMathInElement(cardRef.current, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\(', right: '\\)', display: false},
                    {left: '\\[', right: '\\]', display: true}
                ],
                throwOnError: false
            });
        }
    }); // re-run on full expansions

    // Processar [IMAGEM_X] interceptando a string:
    const processInlineImagesAndHtml = (text, truncate = false) => {
        let processedText = text || '';
        
        // Se houver array q.imagens iterar
        if (q.imagens && q.imagens.length > 0) {
            for (let i = 0; i < q.imagens.length; i++) {
                const marker = `\\[IMAGEM_${i}\\]`;
                const regex = new RegExp(marker, 'g');
                // Adicionamos a tag limpa do tailwind com o base64
                processedText = processedText.replace(regex, `<br><img class="max-w-[80%] max-h-48 rounded-lg border border-gray-200 my-2 inline-block shadow-sm" src="${q.imagens[i]}" alt="Imagem inline ${i}" /><br>`);
            }
        }
        
        if (truncate) {
            // strip HTML fully before truncation for stability on the list
            let plainText = processedText.replace(/<[^>]*>?/gm, '');
            return <div className="line-clamp-2" dangerouslySetInnerHTML={{ __html: plainText }}/>;
        }

        return <div dangerouslySetInnerHTML={{ __html: processedText }} />;
    };

    return (
        <div
            ref={cardRef}
            className={`card-hover rounded-xl border transition-all duration-200 animate-fade-in ${
                isSelected
                    ? 'border-brand-400 bg-brand-50/50 shadow-sm shadow-brand-100'
                    : 'border-gray-200 bg-white hover:border-gray-300'
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
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
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
                        <span className="text-[10px] font-mono font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded" title={q.id}>
                            {q.id.length > 12 ? q.id.substring(0, 8) + '...' : q.id}
                        </span>

                        {/* Discipline badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {q.disciplina}
                        </span>

                        {/* Difficulty badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${diff.bg} ${diff.text}`}>
                            {diff.label}
                        </span>

                        {/* Type badge */}
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                            q.tipo === 'discursiva' ? 'bg-violet-50 text-violet-700' : 'bg-gray-50 text-gray-500'
                        }`}>
                            {TYPE_LABELS[q.tipo] || q.tipo}
                        </span>

                        {/* Banca + Year */}
                        <span className="text-[10px] text-gray-400">
                            {q.banca} {q.ano}
                        </span>

                        {/* Used-in badges */}
                        {isUsed && usedInExams.slice(0, 2).map((examName, i) => (
                            <span key={i} className="used-tag" title={`Usada em: ${examName}`}>
                                {examName.length > 15 ? examName.substring(0, 15) + '...' : examName}
                            </span>
                        ))}
                        {usedInExams.length > 2 && (
                            <span className="used-tag">+{usedInExams.length - 2}</span>
                        )}
                    </div>

                    {/* Enunciado preview (2 lines) */}
                    {!isExpanded && (
                        <div className="text-sm text-gray-600 leading-relaxed max-w-full">
                            {processInlineImagesAndHtml(q.enunciado, true)}
                        </div>
                    )}
                </div>

                {/* Right: add/remove button */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(q.id); }}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 btn-press ${
                        isSelected
                            ? 'bg-brand-100 text-brand-600 hover:bg-brand-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-brand-50 hover:text-brand-600'
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
                <div className="px-3 pb-3 animate-fade-in border-t border-gray-100 mt-0 max-w-full overflow-hidden">
                    {/* Full enunciado */}
                    <div className="pt-3 pb-2 text-sm text-gray-800 leading-relaxed break-words whitespace-pre-wrap">
                        {processInlineImagesAndHtml(q.enunciado)}
                    </div>

                    {/* Images fallback (apenas as que não foram consumidas via [IMAGEM_X]) */}
                    {q.imagens && q.imagens.length > 0 && (() => {
                        const fallbackImages = q.imagens.filter((_, i) => !(q.enunciado||'').includes(`[IMAGEM_${i}]`));
                        if(fallbackImages.length === 0) return null;
                        
                        return (
                            <div className="flex flex-wrap gap-2 my-2">
                                {fallbackImages.map((img, i) => (
                                    <img
                                        key={i}
                                        src={img}
                                        alt={`Fallback Imagem`}
                                        className="max-w-[80%] max-h-48 rounded-lg border border-gray-200 shadow-sm"
                                    />
                                ))}
                            </div>
                        )
                    })()}

                    {/* Alternativas (for objetiva/v_f/somatoria) */}
                    {q.alternativas && q.alternativas.length > 0 && (
                        <div className="space-y-1.5 my-3">
                            {q.alternativas.map((alt) => {
                                const isCorrect = alt.letra === q.gabarito;
                                return (
                                    <div
                                        key={alt.letra}
                                        className={`flex items-start gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                            isCorrect
                                                ? 'bg-emerald-50 border border-emerald-200'
                                                : 'bg-gray-50 border border-transparent'
                                        }`}
                                    >
                                        <span className={`font-bold flex-shrink-0 ${
                                            isCorrect ? 'text-emerald-600' : 'text-gray-400'
                                        }`}>
                                            {alt.letra})
                                        </span>
                                        <div className={`flex-1 min-w-0 ${isCorrect ? 'text-emerald-700' : 'text-gray-600'}`}>
                                            {processInlineImagesAndHtml(alt.texto)}
                                        </div>
                                        {isCorrect && (
                                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Gabarito (for discursiva / somatoria without alternativas) */}
                    {q.tipo !== 'objetiva' && q.gabarito && (
                        <div className="my-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Gabarito:</span>
                            <p className="text-sm text-emerald-700 mt-1 whitespace-pre-wrap">{q.gabarito}</p>
                        </div>
                    )}

                    {/* Discursive answer space indicator */}
                    {q.tipo === 'discursiva' && !q.gabarito && (
                        <div className="my-3 px-3 py-2 rounded-lg bg-violet-50 border border-violet-200">
                            <span className="text-xs font-semibold text-violet-600">Questão discursiva</span>
                            <p className="text-xs text-violet-500 mt-0.5">Linhas para resposta serão geradas no Word</p>
                        </div>
                    )}

                    {/* Metadata row */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 border-t border-gray-100 mt-2">
                        <MetaItem label="Tópico" value={q.topico} />
                        <MetaItem label="Conteúdo" value={q.conteudo} />
                        <MetaItem label="Assunto" value={q.assunto} />
                        {q.regiao && <MetaItem label="Região" value={q.regiao} />}
                        {q.resolucao_link && (
                            <a
                                href={q.resolucao_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-brand-600 hover:text-brand-700 flex items-center gap-1"
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
                                <span key={i} className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Used in exams */}
                    {isUsed && (
                        <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t border-gray-100">
                            <span className="text-[10px] text-amber-700 font-semibold mr-1">Usada em:</span>
                            {usedInExams.map((name, i) => (
                                <span key={i} className="used-tag">{name}</span>
                            ))}
                        </div>
                    )}

                    {/* Action buttons (edit / delete) */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                        <button
                            onClick={(e) => { e.stopPropagation(); if (window._questBankEditQuestion) window._questBankEditQuestion(q); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Editar
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); if (window._questBankDeleteQuestion) window._questBankDeleteQuestion(q.id); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium rounded-lg bg-gray-50 border border-gray-200 text-gray-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-all"
                        >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Excluir
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Small helper for metadata items
const MetaItem = ({ label, value }) => {
    if (!value) return null;
    return (
        <span className="text-[10px] text-gray-400">
            <span className="text-gray-500 font-medium">{label}:</span> {value}
        </span>
    );
};

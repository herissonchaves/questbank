// QuestBank — EditQuestionModal Component
// Modal for editing question fields

const EditQuestionModal = ({ question, onClose, onSave }) => {
    const [form, setForm] = React.useState({ ...question });

    if (!question) return null;

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!form.enunciado.trim()) {
            alert('O enunciado não pode estar vazio.');
            return;
        }
        onSave(form);
    };

    const handleAddAlternativa = () => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const nextLetter = letters[form.alternativas?.length || 0] || '?';
        update('alternativas', [...(form.alternativas || []), { letra: nextLetter, texto: '' }]);
    };

    const handleRemoveAlternativa = (idx) => {
        update('alternativas', form.alternativas.filter((_, i) => i !== idx));
    };

    const handleUpdateAlternativa = (idx, field, value) => {
        const alts = [...form.alternativas];
        alts[idx] = { ...alts[idx], [field]: value };
        update('alternativas', alts);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl animate-modal-in border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Editar Questão</h3>
                        <p className="text-xs text-gray-500 mt-0.5 font-mono">{form.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {/* Enunciado */}
                    <div>
                        <div className="flex justify-between items-end mb-1.5">
                            <label className="block text-xs font-semibold text-gray-600">Enunciado</label>
                            <span className="text-[10px] text-brand-600 font-mono bg-brand-50 px-1 rounded">Dica: Use [IMAGEM_0] para posicionar imagens.</span>
                        </div>
                        <textarea
                            value={form.enunciado}
                            onChange={(e) => update('enunciado', e.target.value)}
                            rows={5}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y"
                        />
                    </div>

                    {/* Taxonomy fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Disciplina</label>
                            <input
                                type="text"
                                value={form.disciplina}
                                onChange={(e) => update('disciplina', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tópico</label>
                            <input
                                type="text"
                                value={form.topico}
                                onChange={(e) => update('topico', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Conteúdo</label>
                            <input
                                type="text"
                                value={form.conteudo}
                                onChange={(e) => update('conteudo', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Assunto</label>
                            <input
                                type="text"
                                value={form.assunto}
                                onChange={(e) => update('assunto', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                    </div>

                    {/* Banca, Ano, Tipo, Dificuldade */}
                    <div className="grid grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Banca</label>
                            <input
                                type="text"
                                value={form.banca || ''}
                                onChange={(e) => update('banca', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ano</label>
                            <input
                                type="number"
                                value={form.ano || ''}
                                onChange={(e) => update('ano', parseInt(e.target.value) || '')}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tipo</label>
                            <select
                                value={form.tipo}
                                onChange={(e) => update('tipo', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                            >
                                <option value="objetiva">Objetiva</option>
                                <option value="discursiva">Discursiva</option>
                                <option value="v_f">V/F</option>
                                <option value="somatoria">Somatória</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dificuldade</label>
                            <select
                                value={form.dificuldade}
                                onChange={(e) => update('dificuldade', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                            >
                                <option value="facil">Fácil</option>
                                <option value="medio">Médio</option>
                                <option value="dificil">Difícil</option>
                                <option value="nao_definida">Não definida</option>
                            </select>
                        </div>
                    </div>

                    {/* Gabarito */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Gabarito</label>
                        <input
                            type="text"
                            value={form.gabarito || ''}
                            onChange={(e) => update('gabarito', e.target.value)}
                            placeholder={form.tipo === 'objetiva' ? 'Ex: B' : 'Resposta esperada'}
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        />
                    </div>

                    {/* Alternativas (for objetiva) */}
                    {(form.tipo === 'objetiva' || form.tipo === 'v_f' || form.tipo === 'somatoria') && (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-600">Alternativas</label>
                                <button
                                    onClick={handleAddAlternativa}
                                    className="text-[10px] text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1"
                                >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Adicionar
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(form.alternativas || []).map((alt, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500 w-6 text-center">{alt.letra})</span>
                                        <input
                                            type="text"
                                            value={alt.texto}
                                            onChange={(e) => handleUpdateAlternativa(idx, 'texto', e.target.value)}
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                        />
                                        <button
                                            onClick={() => handleRemoveAlternativa(idx)}
                                            className="w-6 h-6 rounded text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors"
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Tags */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Tags (separadas por vírgula)</label>
                        <input
                            type="text"
                            value={(form.tags || []).join(', ')}
                            onChange={(e) => update('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                            placeholder="Ex: ENEM, cinemática, vestibular"
                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                        />
                    </div>

                    {/* Região */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Região</label>
                            <select
                                value={form.regiao || ''}
                                onChange={(e) => update('regiao', e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                            >
                                <option value="">—</option>
                                <option value="Nacional">Nacional</option>
                                <option value="Sudeste">Sudeste</option>
                                <option value="Sul">Sul</option>
                                <option value="Nordeste">Nordeste</option>
                                <option value="Centro-oeste">Centro-oeste</option>
                                <option value="Norte">Norte</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Link da resolução</label>
                            <input
                                type="text"
                                value={form.resolucao_link || ''}
                                onChange={(e) => update('resolucao_link', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-200 flex-shrink-0">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press shadow-lg shadow-brand-500/20"
                    >
                        Salvar alterações
                    </button>
                </div>
            </div>
        </div>
    );
};

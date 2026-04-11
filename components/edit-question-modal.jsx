// QuestBank — EditQuestionModal Component
// Modal for editing question fields with rich text toolbar
// Supports optional Step 2: creating adapted version for questions that don't have one

const EditQuestionModal = ({ question, onClose, onSave }) => {
    const [form, setForm] = React.useState({ ...question });
    const [step, setStep] = React.useState(1);
    const [includeAdapted, setIncludeAdapted] = React.useState(false);
    const [hasExistingAdapted, setHasExistingAdapted] = React.useState(false);
    const [checkingAdapted, setCheckingAdapted] = React.useState(true);

    // Adapted form state
    const [adaptedForm, setAdaptedForm] = React.useState({
        enunciado: '',
        alternativas: [
            { letra: 'A', texto: '' },
            { letra: 'B', texto: '' },
            { letra: 'C', texto: '' },
        ],
        gabarito: '',
        imagens: [],
    });

    const enunciadoRef = React.useRef(null);
    const alternativasRefs = React.useRef([]);
    const adaptedEnunciadoRef = React.useRef(null);
    const adaptedAlternativasRefs = React.useRef([]);

    if (!question) return null;

    // Check if adapted version already exists
    React.useEffect(() => {
        const checkAdapted = async () => {
            try {
                // Skip check for adapted questions (already start with A)
                if (question.id && question.id.toString().startsWith('A')) {
                    setHasExistingAdapted(true);
                    setCheckingAdapted(false);
                    return;
                }
                const adaptedId = 'A' + question.id;
                const existing = await db.questions.get(adaptedId);
                setHasExistingAdapted(!!existing);
            } catch (e) {
                console.error('Error checking adapted version:', e);
            }
            setCheckingAdapted(false);
        };
        checkAdapted();
    }, [question.id]);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const updateAdapted = (field, value) => {
        setAdaptedForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        if (!form.enunciado.trim()) {
            alert('O enunciado não pode estar vazio.');
            return;
        }

        // Build adapted question if step 2 was filled
        let adaptedQuestion = null;
        if (includeAdapted && adaptedForm.enunciado.trim()) {
            const originalTag = (form.tags || [])[0] || form.id;
            const adaptedTag = 'A' + originalTag;
            adaptedQuestion = {
                id: 'A' + form.id,
                enunciado: adaptedForm.enunciado,
                tipo: form.tipo,
                disciplina: form.disciplina,
                topico: form.topico,
                conteudo: form.conteudo,
                assunto: form.assunto,
                banca: form.banca || '',
                ano: form.ano || '',
                dificuldade: form.dificuldade,
                regiao: form.regiao || '',
                tags: [adaptedTag],
                gabarito: adaptedForm.gabarito || '',
                alternativas: form.tipo === 'objetiva' ? adaptedForm.alternativas : [],
                imagens: adaptedForm.imagens || [],
                resolucao_link: '',
                usedInExams: [],
                created_at: new Date().toISOString(),
            };
        }

        onSave(form, adaptedQuestion);
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

    // Adapted alternativas handlers
    const handleUpdateAdaptedAlternativa = (idx, value) => {
        const alts = [...adaptedForm.alternativas];
        alts[idx] = { ...alts[idx], texto: value };
        updateAdapted('alternativas', alts);
    };

    const handleEquationInsert = () => {
        const eq = prompt('Digite a equacao LaTeX (sem $$):');
        if (eq) document.execCommand('insertHTML', false, '<span>$$' + eq + '$$</span>&nbsp;');
    };

    const handleImageUpload = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (re) => {
                const b64 = re.target.result;
                document.execCommand('insertHTML', false, `<img src="${b64}" style="max-width:300px; max-height:300px; resize:both; overflow:hidden; display:block; margin:10px 0; border:1px dashed #ccc;" />&nbsp;`);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const totalSteps = includeAdapted ? 2 : 1;
    const isAdaptedQuestion = question.id && question.id.toString().startsWith('A');

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
                        <h3 className="text-lg font-bold text-gray-900">
                            {step === 1 ? 'Editar Questão' : 'Criar Versão Adaptada'}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500 font-mono">{form.id}</p>
                            {includeAdapted && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-700">
                                    Passo {step} de {totalSteps}
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Step indicator dots */}
                    {includeAdapted && (
                        <div className="flex items-center gap-2 mr-8">
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 1 ? 'bg-brand-600' : 'bg-gray-200'}`} />
                            <div className="w-6 h-px bg-gray-200" />
                            <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 2 ? 'bg-sky-500' : 'bg-gray-200'}`} />
                        </div>
                    )}
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

                    {/* ========== STEP 1: Edit Original ========== */}
                    {step === 1 && (
                        <React.Fragment>
                            {/* Enunciado */}
                            <div>
                                <div className="flex justify-between items-end mb-1.5">
                                    <label className="block text-xs font-semibold text-gray-600">Enunciado</label>
                                    <span className="text-[10px] text-brand-600 font-mono bg-brand-50 px-1 rounded">Dica: Use [IMAGEM_0] para posicionar imagens.</span>
                                </div>
                                <RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />
                                <VisualEditor
                                    forwardedRef={enunciadoRef}
                                    value={form.enunciado}
                                    onChange={(v) => update('enunciado', v)}
                                    placeholder="Digite o enunciado aqui..."
                                    className="w-full max-h-[400px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
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
                                            <div key={idx} className="flex items-start gap-2">
                                                <span className="text-xs font-bold text-gray-500 w-6 text-center mt-2">{alt.letra})</span>
                                                <div className="flex-1">
                                                    <RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />
                                                    <VisualEditor
                                                        forwardedRef={(el) => alternativasRefs.current[idx] = el}
                                                        value={alt.texto}
                                                        onChange={(v) => handleUpdateAlternativa(idx, 'texto', v)}
                                                        placeholder={`Alternativa ${alt.letra}...`}
                                                        className="w-full max-h-[200px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveAlternativa(idx)}
                                                    className="w-6 h-6 rounded text-gray-300 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-colors mt-2"
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

                            {/* Link de resolução */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Link da resolução
                                </label>
                                <input
                                    type="url"
                                    value={form.resolucao_link || ''}
                                    onChange={(e) => update('resolucao_link', e.target.value)}
                                    placeholder="https://exemplo.com/resolucao..."
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all placeholder:text-gray-400"
                                />
                            </div>

                            {/* Button: Criar versão adaptada (only if no adapted version exists and not an adapted question itself) */}
                            {!checkingAdapted && !hasExistingAdapted && !isAdaptedQuestion && (
                                <div className="pt-2 border-t border-gray-100">
                                    {!includeAdapted ? (
                                        <button
                                            type="button"
                                            onClick={() => setIncludeAdapted(true)}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-sky-200 text-sky-600 hover:bg-sky-50 hover:border-sky-300 transition-all text-sm font-medium"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                            Criar versão adaptada
                                            <span className="text-[10px] text-sky-400 font-normal ml-1">(aluno atípico)</span>
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-between bg-sky-50 rounded-xl px-4 py-2.5 border border-sky-200">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span className="text-sm font-medium text-sky-700">Versão adaptada será criada</span>
                                                <span className="text-[10px] text-sky-500 font-mono bg-sky-100 px-1.5 py-0.5 rounded">ID: A{form.id}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setIncludeAdapted(false)}
                                                className="text-sky-400 hover:text-sky-600 transition-colors"
                                                title="Cancelar versão adaptada"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Show info if adapted already exists */}
                            {!checkingAdapted && hasExistingAdapted && !isAdaptedQuestion && (
                                <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-200">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-sm text-emerald-700">Esta questão já possui versão adaptada</span>
                                    <span className="text-[10px] text-emerald-500 font-mono bg-emerald-100 px-1.5 py-0.5 rounded">ID: A{form.id}</span>
                                </div>
                            )}
                        </React.Fragment>
                    )}

                    {/* ========== STEP 2: Adapted Version ========== */}
                    {step === 2 && (
                        <React.Fragment>
                            <div className="bg-sky-50 border border-sky-200 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h4 className="text-sm font-bold text-sky-800">Versão Adaptada para Aluno Atípico</h4>
                                </div>
                                <p className="text-[11px] text-sky-600 leading-relaxed">
                                    A versão adaptada será salva com <span className="font-mono font-bold bg-sky-100 px-1 rounded">ID: A{form.id}</span>.
                                    Os metadados (disciplina, tópico, etc.) serão herdados da questão original.
                                    Preencha apenas o enunciado e alternativas adaptados.
                                </p>
                            </div>

                            {/* Adapted Enunciado */}
                            <div>
                                <label className="block text-sm font-bold text-gray-800 mb-2">Enunciado Adaptado</label>
                                <RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />
                                <VisualEditor
                                    forwardedRef={adaptedEnunciadoRef}
                                    value={adaptedForm.enunciado}
                                    onChange={(v) => updateAdapted('enunciado', v)}
                                    placeholder="Digite o enunciado adaptado (linguagem simplificada, apoio visual, etc.)..."
                                    className="w-full max-h-[400px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                                />
                            </div>

                            {/* Adapted Alternativas (max 3: A, B, C) */}
                            {form.tipo === 'objetiva' && (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-800">Alternativas Adaptadas (A, B, C)</label>
                                    <p className="text-[11px] text-sky-600">Questões objetivas adaptadas possuem no máximo 3 alternativas.</p>

                                    <div className="space-y-2">
                                        {adaptedForm.alternativas.map((alt, idx) => (
                                            <div key={idx} className="flex items-start gap-2 group">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-1 transition-colors ${
                                                    adaptedForm.gabarito === alt.letra
                                                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {alt.letra}
                                                </div>
                                                <div className="flex-1">
                                                    <RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />
                                                    <VisualEditor
                                                        forwardedRef={(el) => adaptedAlternativasRefs.current[idx] = el}
                                                        value={alt.texto}
                                                        onChange={(v) => handleUpdateAdaptedAlternativa(idx, v)}
                                                        placeholder={`Alternativa ${alt.letra} adaptada...`}
                                                        className="w-full max-h-[200px] overflow-y-auto bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alternativa correta (adaptada)</label>
                                        <select
                                            value={adaptedForm.gabarito}
                                            onChange={(e) => updateAdapted('gabarito', e.target.value)}
                                            className="w-48 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer appearance-none"
                                        >
                                            <option value="">Selecione</option>
                                            {adaptedForm.alternativas.map(alt => (
                                                <option key={alt.letra} value={alt.letra}>Alternativa {alt.letra}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* Discursiva adapted */}
                            {form.tipo === 'discursiva' && (
                                <div>
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Resposta esperada adaptada (opcional)</label>
                                    <textarea
                                        value={adaptedForm.gabarito}
                                        onChange={(e) => updateAdapted('gabarito', e.target.value)}
                                        rows={3}
                                        placeholder="Resposta esperada da versão adaptada..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y placeholder:text-gray-400"
                                    />
                                </div>
                            )}
                        </React.Fragment>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 flex-shrink-0">
                    <div>
                        {includeAdapted && (
                            <p className="text-[10px] text-gray-400">
                                Passo {step} de {totalSteps} — {step === 1 ? 'Editar questão' : 'Versão adaptada'}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <button
                                onClick={() => setStep(1)}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg flex items-center gap-1"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                                Voltar
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
                        >
                            Cancelar
                        </button>
                        {step === 1 && includeAdapted ? (
                            <button
                                onClick={() => {
                                    if (!form.enunciado.trim()) {
                                        alert('O enunciado não pode estar vazio.');
                                        return;
                                    }
                                    setStep(2);
                                }}
                                className="px-5 py-2 text-sm font-semibold rounded-xl bg-sky-500 hover:bg-sky-600 text-white transition-all duration-200 btn-press shadow-lg shadow-sky-500/20 flex items-center gap-1"
                            >
                                Avançar
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                onClick={handleSave}
                                className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press shadow-lg shadow-brand-500/20"
                            >
                                {step === 2 ? 'Salvar tudo' : 'Salvar alterações'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
window.EditQuestionModal = EditQuestionModal;

// QuestBank — CreateQuestionModal Component
// Full-screen modal for creating individual questions
// Inspired by SuperProfessor / Estuda.com UI

// Autocomplete input component
const AutocompleteInput = ({ label, value, onChange, suggestions: items, error, placeholder }) => {
    const [showSuggestions, setShowSuggestions] = React.useState(false);
    const [filtered, setFiltered] = React.useState([]);
    const containerRef = React.useRef(null);

    React.useEffect(() => {
        if (value && items.length > 0) {
            const f = items.filter(s => s.toLowerCase().includes(value.toLowerCase()) && s.toLowerCase() !== value.toLowerCase());
            setFiltered(f.slice(0, 6));
        } else {
            setFiltered([]);
        }
    }, [value, items]);

    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (containerRef.current && !containerRef.current.contains(e.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">{label} <span className="text-rose-400">*</span></label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                placeholder={placeholder || `Digite ${label.toLowerCase()}...`}
                className={`w-full bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${
                    error ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'
                }`}
            />
            {error && <p className="text-[10px] text-rose-500 mt-0.5">{error}</p>}
            {showSuggestions && filtered.length > 0 && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-36 overflow-y-auto">
                    {filtered.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => { onChange(s); setShowSuggestions(false); }}
                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                        >
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const CreateQuestionModal = ({ isOpen, onClose, onSave, existingQuestions }) => {
    const [step, setStep] = React.useState(1);
    const [saving, setSaving] = React.useState(false);

    // Generate unique numeric ID
    const generateId = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    const emptyForm = {
        id: generateId(),
        tipo: 'objetiva',
        enunciado: '',
        textoBase: '',
        showTextoBase: false,
        imagens: [],
        alternativas: [
            { letra: 'A', texto: '' },
            { letra: 'B', texto: '' },
            { letra: 'C', texto: '' },
            { letra: 'D', texto: '' },
            { letra: 'E', texto: '' },
        ],
        gabarito: '',
        discursivaFormato: 'com_linhas', // com_linhas | em_branco
        disciplina: '',
        topico: '',
        conteudo: '',
        assunto: '',
        banca: '',
        ano: '',
        dificuldade: 'nao_definida',
        regiao: '',
        tags: '',
        resolucao_link: '',
    };

    const [form, setForm] = React.useState(emptyForm);
    const [errors, setErrors] = React.useState({});
    const enunciadoRef = React.useRef(null);
    const alternativasRefs = React.useRef([]);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setForm({ ...emptyForm, id: generateId() });
            setStep(1);
            setErrors({});
            setSaving(false);
        }
    }, [isOpen]);

    // Extract unique values from existing questions for autocomplete
    const suggestions = React.useMemo(() => {
        const qs = existingQuestions || [];
        const unique = (field) => [...new Set(qs.map(q => q[field]).filter(Boolean))].sort();
        return {
            disciplina: unique('disciplina'),
            topico: unique('topico'),
            conteudo: unique('conteudo'),
            assunto: unique('assunto'),
            banca: unique('banca'),
        };
    }, [existingQuestions]);

    if (!isOpen) return null;

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
        // Clear error for this field
        if (errors[field]) {
            setErrors(prev => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    const handleTipoChange = (tipo) => {
        update('tipo', tipo);
        if (tipo === 'discursiva') {
            update('gabarito', '');
        }
    };

    const handleAddAlternativa = () => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const nextLetter = letters[form.alternativas.length] || '?';
        update('alternativas', [...form.alternativas, { letra: nextLetter, texto: '' }]);
    };

    const handleRemoveAlternativa = (idx) => {
        if (form.alternativas.length <= 2) return; // Minimum 2 alternatives
        const newAlts = form.alternativas.filter((_, i) => i !== idx);
        // Re-letter
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const relettered = newAlts.map((alt, i) => ({ ...alt, letra: letters[i] || '?' }));
        update('alternativas', relettered);
        // Clear gabarito if removed alternative was the answer
        if (form.gabarito && !relettered.find(a => a.letra === form.gabarito)) {
            update('gabarito', '');
        }
    };

    const handleUpdateAlternativa = (idx, value) => {
        const alts = [...form.alternativas];
        alts[idx] = { ...alts[idx], texto: value };
        update('alternativas', alts);
    };

    const handleImageUpload = (targetType, idx = null) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const base64 = event.target.result;
                setForm(prev => {
                    const newImages = [...(prev.imagens || []), base64];
                    const imageMarker = `[IMAGEM_${newImages.length - 1}]`;
                    let newForm = { ...prev, imagens: newImages };

                    if (targetType === 'enunciado') {
                        const textArea = enunciadoRef.current;
                        if (textArea) {
                            const start = textArea.selectionStart;
                            const end = textArea.selectionEnd;
                            const text = prev.enunciado || '';
                            newForm.enunciado = text.substring(0, start) + imageMarker + text.substring(end);
                            // Setar foco no textArea e mover o cursor para o fim do texto inserido, 
                            // usando setTimeout pq o state só atualiza dps.
                            setTimeout(() => {
                                textArea.focus();
                                textArea.setSelectionRange(start + imageMarker.length, start + imageMarker.length);
                            }, 50);
                        } else {
                            newForm.enunciado = (prev.enunciado || '') + imageMarker;
                        }
                        if(errors.enunciado) delete errors.enunciado; // clean up manual
                    } else if (targetType === 'alternativa' && idx !== null) {
                        const textArea = alternativasRefs.current[idx];
                        const alts = [...prev.alternativas];
                        if (textArea) {
                            const start = textArea.selectionStart;
                            const end = textArea.selectionEnd;
                            const text = alts[idx].texto || '';
                            alts[idx] = { ...alts[idx], texto: text.substring(0, start) + imageMarker + text.substring(end) };
                            setTimeout(() => {
                                textArea.focus();
                                textArea.setSelectionRange(start + imageMarker.length, start + imageMarker.length);
                            }, 50);
                        } else {
                            alts[idx] = { ...alts[idx], texto: (alts[idx].texto || '') + imageMarker };
                        }
                        newForm.alternativas = alts;
                    }
                    return newForm;
                });
            };
            reader.readAsDataURL(file);
        };
        input.click();
    };

    const handleEquationInsert = (targetType, idx = null) => {
        setForm(prev => {
            const eqMarker = ` $$  $$ `;
            const offset = 4; // space before the middle
            let newForm = { ...prev };

            if (targetType === 'enunciado') {
                const textArea = enunciadoRef.current;
                if (textArea) {
                    const start = textArea.selectionStart;
                    const end = textArea.selectionEnd;
                    const text = prev.enunciado || '';
                    newForm.enunciado = text.substring(0, start) + eqMarker + text.substring(end);
                    setTimeout(() => {
                        textArea.focus();
                        textArea.setSelectionRange(start + offset, start + offset);
                    }, 50);
                } else {
                    newForm.enunciado = (prev.enunciado || '') + eqMarker;
                }
                if(errors.enunciado) delete errors.enunciado;
            } else if (targetType === 'alternativa' && idx !== null) {
                const textArea = alternativasRefs.current[idx];
                const alts = [...prev.alternativas];
                if (textArea) {
                    const start = textArea.selectionStart;
                    const end = textArea.selectionEnd;
                    const text = alts[idx].texto || '';
                    alts[idx] = { ...alts[idx], texto: text.substring(0, start) + eqMarker + text.substring(end) };
                    setTimeout(() => {
                        textArea.focus();
                        textArea.setSelectionRange(start + offset, start + offset);
                    }, 50);
                } else {
                    alts[idx] = { ...alts[idx], texto: (alts[idx].texto || '') + eqMarker };
                }
                newForm.alternativas = alts;
            }
            return newForm;
        });
    };

    // Validate Step 1
    const validateStep1 = () => {
        const errs = {};
        if (!form.enunciado.trim()) errs.enunciado = 'O enunciado é obrigatório.';
        if (form.tipo === 'objetiva') {
            const emptyAlts = form.alternativas.filter(a => !a.texto.trim());
            if (emptyAlts.length === form.alternativas.length) {
                errs.alternativas = 'Preencha pelo menos uma alternativa.';
            }
            if (!form.gabarito) errs.gabarito = 'Selecione a alternativa correta.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validate Step 2
    const validateStep2 = () => {
        const errs = {};
        if (!form.disciplina.trim()) errs.disciplina = 'Obrigatório';
        if (!form.topico.trim()) errs.topico = 'Obrigatório';
        if (!form.conteudo.trim()) errs.conteudo = 'Obrigatório';
        if (!form.assunto.trim()) errs.assunto = 'Obrigatório';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (validateStep1()) {
            setStep(2);
            setErrors({});
        }
    };

    const handleBack = () => {
        setStep(1);
        setErrors({});
    };

    const handleSave = async () => {
        if (!validateStep2()) return;
        setSaving(true);
        try {
            await onSave?.(form);
            onClose?.();
        } catch (error) {
            console.error("Failed to save:", error);
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] shadow-2xl animate-modal-in border border-gray-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200 flex-shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Criar Nova Questão</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                form.tipo === 'objetiva'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-violet-50 text-violet-700'
                            }`}>
                                {form.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">#{form.id}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step indicator */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 1 ? 'bg-brand-600' : 'bg-gray-300'}`} />
                            <div className={`w-8 h-0.5 ${step >= 2 ? 'bg-brand-600' : 'bg-gray-200'}`} />
                            <div className={`w-2 h-2 rounded-full transition-colors ${step === 2 ? 'bg-brand-600' : 'bg-gray-300'}`} />
                            <span className="text-[10px] text-gray-400 ml-1">
                                {step === 1 ? 'Conteúdo' : 'Classificação'}
                            </span>
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
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {step === 1 ? (
                        <div className="space-y-5">
                            {/* Formato de resposta */}
                            <div className="flex items-center justify-between">
                                {/* Texto base toggle */}
                                <button
                                    type="button"
                                    onClick={() => update('showTextoBase', !form.showTextoBase)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all btn-press ${
                                        form.showTextoBase
                                            ? 'bg-teal-50 border-teal-200 text-teal-700'
                                            : 'bg-white border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600'
                                    }`}
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    {form.showTextoBase ? 'Remover texto base' : 'Adicionar texto base'}
                                </button>

                                {/* Tipo toggle */}
                                <div className="flex items-center gap-1">
                                    <span className="text-xs text-gray-500 mr-2">Formato de resposta:</span>
                                    <button
                                        type="button"
                                        onClick={() => handleTipoChange('objetiva')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                            form.tipo === 'objetiva'
                                                ? 'bg-brand-50 border-brand-200 text-brand-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className={`inline-block w-3 h-3 rounded-full border-2 mr-1.5 align-middle ${
                                            form.tipo === 'objetiva' ? 'border-brand-600 bg-brand-600' : 'border-gray-300'
                                        }`}>
                                            {form.tipo === 'objetiva' && (
                                                <span className="block w-1.5 h-1.5 bg-white rounded-full mx-auto mt-[1px]" />
                                            )}
                                        </span>
                                        Com Alternativas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleTipoChange('discursiva')}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                                            form.tipo === 'discursiva'
                                                ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm'
                                                : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                        }`}
                                    >
                                        <span className={`inline-block w-3 h-3 rounded-full border-2 mr-1.5 align-middle ${
                                            form.tipo === 'discursiva' ? 'border-violet-600 bg-violet-600' : 'border-gray-300'
                                        }`}>
                                            {form.tipo === 'discursiva' && (
                                                <span className="block w-1.5 h-1.5 bg-white rounded-full mx-auto mt-[1px]" />
                                            )}
                                        </span>
                                        Discursiva
                                    </button>
                                </div>
                            </div>

                            {/* Texto Base (optional) */}
                            {form.showTextoBase && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-bold text-gray-800 mb-2">Texto Base</label>
                                    <textarea
                                        value={form.textoBase}
                                        onChange={(e) => update('textoBase', e.target.value)}
                                        rows={4}
                                        placeholder="Cole aqui o texto de apoio que antecede o enunciado (trecho de livro, artigo, poema, etc.)..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y placeholder:text-gray-400"
                                    />
                                </div>
                            )}

                            {/* Enunciado */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-800">Enunciado</label>
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleEquationInsert('enunciado')}
                                            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-brand-50"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                            Inserir Equação
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleImageUpload('enunciado')}
                                            className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-brand-50"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Inserir Imagem
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    ref={enunciadoRef}
                                    value={form.enunciado}
                                    onChange={(e) => update('enunciado', e.target.value)}
                                    rows={6}
                                    placeholder="Digite o enunciado aqui..."
                                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y placeholder:text-gray-400 ${
                                        errors.enunciado ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.enunciado && (
                                    <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        {errors.enunciado}
                                    </p>
                                )}
                            </div>

                            {/* Alternativas (objetiva) */}
                            {form.tipo === 'objetiva' && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-bold text-gray-800">Alternativas</label>
                                        {form.alternativas.length < 8 && (
                                            <button
                                                type="button"
                                                onClick={handleAddAlternativa}
                                                className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                                Adicionar alternativa
                                            </button>
                                        )}
                                    </div>

                                    {errors.alternativas && (
                                        <p className="text-xs text-rose-500 flex items-center gap-1">
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {errors.alternativas}
                                        </p>
                                    )}

                                    <div className="space-y-2">
                                        {form.alternativas.map((alt, idx) => (
                                            <div key={idx} className="flex items-start gap-2 group">
                                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mt-1 transition-colors ${
                                                    form.gabarito === alt.letra
                                                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-300'
                                                        : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                    {alt.letra}
                                                </div>
                                                <textarea
                                                    ref={(el) => alternativasRefs.current[idx] = el}
                                                    value={alt.texto}
                                                    onChange={(e) => handleUpdateAlternativa(idx, e.target.value)}
                                                    rows={2}
                                                    placeholder={`Digite a alternativa ${alt.letra} aqui...`}
                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-none placeholder:text-gray-400"
                                                />
                                                <div className="flex flex-col gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEquationInsert('alternativa', idx)}
                                                        className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center transition-all bg-gray-50 border border-gray-200"
                                                        title="Inserir equação"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleImageUpload('alternativa', idx)}
                                                        className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 flex items-center justify-center transition-all bg-gray-50 border border-gray-200"
                                                        title="Inserir imagem"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    {form.alternativas.length > 2 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveAlternativa(idx)}
                                                            className="flex-shrink-0 w-7 h-7 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition-all bg-gray-50 border border-gray-200"
                                                            title="Remover alternativa"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Alternativa correta */}
                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alternativa correta</label>
                                        <select
                                            value={form.gabarito}
                                            onChange={(e) => update('gabarito', e.target.value)}
                                            className={`w-48 bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none ${
                                                errors.gabarito ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Selecione</option>
                                            {form.alternativas.map(alt => (
                                                <option key={alt.letra} value={alt.letra}>
                                                    Alternativa {alt.letra}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.gabarito && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.gabarito}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Discursiva options */}
                            {form.tipo === 'discursiva' && (
                                <div className="space-y-4">
                                    {/* Gabarito / resposta esperada */}
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">Resposta esperada (opcional)</label>
                                        <textarea
                                            value={form.gabarito}
                                            onChange={(e) => update('gabarito', e.target.value)}
                                            rows={3}
                                            placeholder="Digite a resposta esperada ou critérios de correção..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y placeholder:text-gray-400"
                                        />
                                    </div>

                                    {/* Formato da questão discursiva */}
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">Formato da Questão Discursiva</label>
                                        <div className="flex items-center gap-3">
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                                                form.discursivaFormato === 'com_linhas'
                                                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="discursivaFormato"
                                                    checked={form.discursivaFormato === 'com_linhas'}
                                                    onChange={() => update('discursivaFormato', 'com_linhas')}
                                                    className="sr-only"
                                                />
                                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                    form.discursivaFormato === 'com_linhas' ? 'border-brand-600' : 'border-gray-300'
                                                }`}>
                                                    {form.discursivaFormato === 'com_linhas' && (
                                                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                                                    )}
                                                </span>
                                                Com linhas
                                            </label>
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                                                form.discursivaFormato === 'em_branco'
                                                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="discursivaFormato"
                                                    checked={form.discursivaFormato === 'em_branco'}
                                                    onChange={() => update('discursivaFormato', 'em_branco')}
                                                    className="sr-only"
                                                />
                                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                                    form.discursivaFormato === 'em_branco' ? 'border-brand-600' : 'border-gray-300'
                                                }`}>
                                                    {form.discursivaFormato === 'em_branco' && (
                                                        <span className="w-2 h-2 rounded-full bg-brand-600" />
                                                    )}
                                                </span>
                                                Em branco
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Step 2: Classificação */
                        <div className="space-y-5">
                            <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3 flex items-center gap-2 text-xs text-brand-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Classifique a questão na hierarquia correta. Campos com <b>*</b> são obrigatórios. As sugestões são baseadas nas questões já existentes.</span>
                            </div>

                            {/* Taxonomia */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Classificação Taxonômica
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <AutocompleteInput
                                        label="Disciplina"
                                        value={form.disciplina}
                                        onChange={(v) => update('disciplina', v)}
                                        suggestions={suggestions.disciplina}
                                        error={errors.disciplina}
                                        placeholder="Ex: Física"
                                    />
                                    <AutocompleteInput
                                        label="Tópico"
                                        value={form.topico}
                                        onChange={(v) => update('topico', v)}
                                        suggestions={suggestions.topico}
                                        error={errors.topico}
                                        placeholder="Ex: Mecânica"
                                    />
                                    <AutocompleteInput
                                        label="Conteúdo"
                                        value={form.conteudo}
                                        onChange={(v) => update('conteudo', v)}
                                        suggestions={suggestions.conteudo}
                                        error={errors.conteudo}
                                        placeholder="Ex: Cinemática"
                                    />
                                    <AutocompleteInput
                                        label="Assunto"
                                        value={form.assunto}
                                        onChange={(v) => update('assunto', v)}
                                        suggestions={suggestions.assunto}
                                        error={errors.assunto}
                                        placeholder="Ex: Lançamento Oblíquo"
                                    />
                                </div>
                            </div>

                            {/* Metadados */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Metadados
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="relative">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Banca</label>
                                        <input
                                            type="text"
                                            value={form.banca}
                                            onChange={(e) => update('banca', e.target.value)}
                                            placeholder="Ex: ENEM"
                                            list="banca-list"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                        />
                                        <datalist id="banca-list">
                                            {suggestions.banca.map((b, i) => (
                                                <option key={i} value={b} />
                                            ))}
                                        </datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ano</label>
                                        <input
                                            type="number"
                                            value={form.ano}
                                            onChange={(e) => update('ano', e.target.value)}
                                            placeholder="Ex: 2025"
                                            min="1990"
                                            max="2099"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dificuldade</label>
                                        <select
                                            value={form.dificuldade}
                                            onChange={(e) => update('dificuldade', e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none"
                                        >
                                            <option value="nao_definida">Não definida</option>
                                            <option value="facil">Fácil</option>
                                            <option value="medio">Médio</option>
                                            <option value="dificil">Difícil</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50/50">
                    <div>
                        {step === 1 && (
                            <p className="text-[10px] text-gray-400">
                                Passo 1 de 2 — Conteúdo da questão
                            </p>
                        )}
                        {step === 2 && (
                            <p className="text-[10px] text-gray-400">
                                Passo 2 de 2 — Classificação e metadados
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 1 ? (
                            <>
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press shadow-lg shadow-brand-500/20 flex items-center gap-1.5"
                                >
                                    Avançar
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={handleBack}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                    Voltar
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all duration-200 btn-press shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                            Salvar Questão
                                        </>
                                    )}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

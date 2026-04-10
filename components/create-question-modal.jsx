// QuestBank — CreateQuestionModal Component
// Full-screen modal for creating individual questions + adapted version
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

const CreateQuestionModal = ({ isOpen, onClose, onSave, existingQuestions, adaptedMap }) => {
    const [step, setStep] = React.useState(1); // 1=content, 2=classification, 3=adapted (optional)
    const [saving, setSaving] = React.useState(false);
    const [includeAdapted, setIncludeAdapted] = React.useState(false);

    // Generate unique numeric ID
    const generateId = () => {
        return Math.floor(10000000 + Math.random() * 90000000).toString();
    };

    const generateTag = () => {
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
        discursivaFormato: 'com_linhas',
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

    const emptyAdaptedForm = {
        enunciado: '',
        imagens: [],
        alternativas: [
            { letra: 'A', texto: '' },
            { letra: 'B', texto: '' },
            { letra: 'C', texto: '' },
        ],
        gabarito: '',
    };

    const [form, setForm] = React.useState(emptyForm);
    const [adaptedForm, setAdaptedForm] = React.useState(emptyAdaptedForm);
    const [errors, setErrors] = React.useState({});
    const [questionTag, setQuestionTag] = React.useState(generateTag());
    const enunciadoRef = React.useRef(null);
    const adaptedEnunciadoRef = React.useRef(null);
    const alternativasRefs = React.useRef([]);
    const adaptedAlternativasRefs = React.useRef([]);

    // Reset form when modal opens
    React.useEffect(() => {
        if (isOpen) {
            const newTag = generateTag();
            setForm({ ...emptyForm, id: generateId() });
            setAdaptedForm({ ...emptyAdaptedForm });
            setQuestionTag(newTag);
            setStep(1);
            setErrors({});
            setSaving(false);
            setIncludeAdapted(false);
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
        if (errors[field]) {
            setErrors(prev => {
                const copy = { ...prev };
                delete copy[field];
                return copy;
            });
        }
    };

    const updateAdapted = (field, value) => {
        setAdaptedForm(prev => ({ ...prev, [field]: value }));
    };

    const handleTipoChange = (tipo) => {
        update('tipo', tipo);
        if (tipo === 'discursiva') {
            update('gabarito', '');
        }
        // Reset adapted form alternatives based on type
        if (tipo === 'objetiva') {
            setAdaptedForm(prev => ({
                ...prev,
                alternativas: [
                    { letra: 'A', texto: '' },
                    { letra: 'B', texto: '' },
                    { letra: 'C', texto: '' },
                ],
                gabarito: '',
            }));
        }
    };

    const handleAddAlternativa = () => {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const nextLetter = letters[form.alternativas.length] || '?';
        update('alternativas', [...form.alternativas, { letra: nextLetter, texto: '' }]);
    };

    const handleRemoveAlternativa = (idx) => {
        if (form.alternativas.length <= 2) return;
        const newAlts = form.alternativas.filter((_, i) => i !== idx);
        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
        const relettered = newAlts.map((alt, i) => ({ ...alt, letra: letters[i] || '?' }));
        update('alternativas', relettered);
        if (form.gabarito && !relettered.find(a => a.letra === form.gabarito)) {
            update('gabarito', '');
        }
    };

    const handleUpdateAlternativa = (idx, value) => {
        const alts = [...form.alternativas];
        alts[idx] = { ...alts[idx], texto: value };
        update('alternativas', alts);
    };

    // Adapted alternativas handlers (max 3: A, B, C)
    const handleUpdateAdaptedAlternativa = (idx, value) => {
        const alts = [...adaptedForm.alternativas];
        alts[idx] = { ...alts[idx], texto: value };
        updateAdapted('alternativas', alts);
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

                if (targetType === 'adapted_enunciado') {
                    setAdaptedForm(prev => {
                        const newImages = [...(prev.imagens || []), base64];
                        const imageMarker = `[IMAGEM_${newImages.length - 1}]`;
                        const textArea = adaptedEnunciadoRef.current;
                        let newEnunciado = prev.enunciado;
                        if (textArea) {
                            const start = textArea.selectionStart;
                            const end = textArea.selectionEnd;
                            newEnunciado = prev.enunciado.substring(0, start) + imageMarker + prev.enunciado.substring(end);
                            setTimeout(() => {
                                textArea.focus();
                                textArea.setSelectionRange(start + imageMarker.length, start + imageMarker.length);
                            }, 50);
                        } else {
                            newEnunciado = prev.enunciado + imageMarker;
                        }
                        return { ...prev, imagens: newImages, enunciado: newEnunciado };
                    });
                    return;
                }

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
                            setTimeout(() => {
                                textArea.focus();
                                textArea.setSelectionRange(start + imageMarker.length, start + imageMarker.length);
                            }, 50);
                        } else {
                            newForm.enunciado = (prev.enunciado || '') + imageMarker;
                        }
                        if(errors.enunciado) delete errors.enunciado;
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
        const eqMarker = ` $$  $$ `;
        const offset = 4;

        if (targetType === 'adapted_enunciado') {
            setAdaptedForm(prev => {
                const textArea = adaptedEnunciadoRef.current;
                let newEnunciado = prev.enunciado;
                if (textArea) {
                    const start = textArea.selectionStart;
                    const end = textArea.selectionEnd;
                    newEnunciado = prev.enunciado.substring(0, start) + eqMarker + prev.enunciado.substring(end);
                    setTimeout(() => {
                        textArea.focus();
                        textArea.setSelectionRange(start + offset, start + offset);
                    }, 50);
                } else {
                    newEnunciado = prev.enunciado + eqMarker;
                }
                return { ...prev, enunciado: newEnunciado };
            });
            return;
        }

        setForm(prev => {
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
        if (!form.enunciado.trim()) errs.enunciado = 'O enunciado e obrigatorio.';
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
        if (!form.disciplina.trim()) errs.disciplina = 'Obrigatorio';
        if (!form.topico.trim()) errs.topico = 'Obrigatorio';
        if (!form.conteudo.trim()) errs.conteudo = 'Obrigatorio';
        if (!form.assunto.trim()) errs.assunto = 'Obrigatorio';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // Validate adapted (Step 3)
    const validateAdapted = () => {
        if (!includeAdapted) return true;
        const errs = {};
        if (!adaptedForm.enunciado.trim()) errs.adaptedEnunciado = 'O enunciado adaptado e obrigatorio.';
        if (form.tipo === 'objetiva') {
            if (!adaptedForm.gabarito) errs.adaptedGabarito = 'Selecione a alternativa correta da versao adaptada.';
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (step === 1 && validateStep1()) {
            setStep(2);
            setErrors({});
        } else if (step === 2 && validateStep2()) {
            if (includeAdapted) {
                setStep(3);
                setErrors({});
            } else {
                handleSave();
            }
        } else if (step === 3 && validateAdapted()) {
            handleSave();
        }
    };

    const handleBack = () => {
        if (step === 3) {
            setStep(2);
        } else if (step === 2) {
            setStep(1);
        }
        setErrors({});
    };

    const handleSave = async () => {
        if (step === 2 && !includeAdapted && !validateStep2()) return;
        if (step === 3 && !validateAdapted()) return;

        setSaving(true);
        try {
            // Parse tags from comma/space string and add the question tag
            const userTags = (form.tags || '').split(/[,\s]+/).filter(Boolean);
            const allTags = [...new Set([...userTags, questionTag])];

            // Build the regular question object
            const regularQuestion = {
                id: form.id,
                enunciado: form.showTextoBase && form.textoBase ? form.textoBase + '\n\n' + form.enunciado : form.enunciado,
                tipo: form.tipo,
                disciplina: form.disciplina.trim(),
                topico: form.topico.trim(),
                conteudo: form.conteudo.trim(),
                assunto: form.assunto.trim(),
                banca: form.banca.trim() || '',
                ano: form.ano ? parseInt(form.ano) : '',
                dificuldade: form.dificuldade,
                regiao: form.regiao || '',
                tags: allTags,
                gabarito: form.gabarito || '',
                alternativas: form.tipo === 'objetiva' ? form.alternativas : [],
                imagens: form.imagens || [],
                resolucao_link: form.resolucao_link || '',
                usedInExams: [],
                created_at: new Date().toISOString(),
            };

            // Build adapted question BEFORE saving (so both save or neither)
            let adaptedQuestion = null;
            if (includeAdapted && adaptedForm.enunciado.trim()) {
                const adaptedTag = 'A' + questionTag;
                adaptedQuestion = {
                    id: 'A' + form.id,
                    enunciado: adaptedForm.enunciado,
                    tipo: form.tipo,
                    disciplina: form.disciplina.trim(),
                    topico: form.topico.trim(),
                    conteudo: form.conteudo.trim(),
                    assunto: form.assunto.trim(),
                    banca: form.banca.trim() || '',
                    ano: form.ano ? parseInt(form.ano) : '',
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

            // Save regular question
            await onSave?.(regularQuestion);

            // Save adapted question after regular succeeds
            if (adaptedQuestion) {
                try {
                    await db.questions.add(adaptedQuestion);
                } catch (e) {
                    console.error('Erro ao salvar questao adaptada:', e);
                }
            }

            onClose?.();
        } catch (error) {
            console.error("Failed to save:", error);
            setSaving(false);
        }
    };

    const totalSteps = includeAdapted ? 3 : 2;

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
                        <h3 className="text-lg font-bold text-gray-900">Criar Nova Questao</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                form.tipo === 'objetiva'
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'bg-violet-50 text-violet-700'
                            }`}>
                                {form.tipo === 'objetiva' ? 'Objetiva' : 'Discursiva'}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">#{form.id}</span>
                            <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">Tag: {questionTag}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Step indicator */}
                        <div className="hidden sm:flex items-center gap-1.5">
                            {[1, 2, 3].slice(0, totalSteps).map((s, i) => (
                                <React.Fragment key={s}>
                                    {i > 0 && <div className={`w-6 h-0.5 ${step >= s ? 'bg-brand-600' : 'bg-gray-200'}`} />}
                                    <div className={`w-2 h-2 rounded-full transition-colors ${step === s ? 'bg-brand-600' : step > s ? 'bg-brand-400' : 'bg-gray-300'}`} />
                                </React.Fragment>
                            ))}
                            <span className="text-[10px] text-gray-400 ml-1">
                                {step === 1 ? 'Conteudo' : step === 2 ? 'Classificacao' : 'Adaptada'}
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
                                            Inserir Equacao
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
                                                        title="Inserir equacao"
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
                                    <div>
                                        <label className="block text-sm font-bold text-gray-800 mb-2">Resposta esperada (opcional)</label>
                                        <textarea
                                            value={form.gabarito}
                                            onChange={(e) => update('gabarito', e.target.value)}
                                            rows={3}
                                            placeholder="Digite a resposta esperada ou criterios de correcao..."
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all resize-y placeholder:text-gray-400"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-2">Formato da Questao Discursiva</label>
                                        <div className="flex items-center gap-3">
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                                                form.discursivaFormato === 'com_linhas'
                                                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}>
                                                <input type="radio" name="discursivaFormato" checked={form.discursivaFormato === 'com_linhas'} onChange={() => update('discursivaFormato', 'com_linhas')} className="sr-only" />
                                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.discursivaFormato === 'com_linhas' ? 'border-brand-600' : 'border-gray-300'}`}>
                                                    {form.discursivaFormato === 'com_linhas' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                                                </span>
                                                Com linhas
                                            </label>
                                            <label className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm ${
                                                form.discursivaFormato === 'em_branco'
                                                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                                            }`}>
                                                <input type="radio" name="discursivaFormato" checked={form.discursivaFormato === 'em_branco'} onChange={() => update('discursivaFormato', 'em_branco')} className="sr-only" />
                                                <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${form.discursivaFormato === 'em_branco' ? 'border-brand-600' : 'border-gray-300'}`}>
                                                    {form.discursivaFormato === 'em_branco' && <span className="w-2 h-2 rounded-full bg-brand-600" />}
                                                </span>
                                                Em branco
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : step === 2 ? (
                        /* Step 2: Classificacao */
                        <div className="space-y-5">
                            <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-3 flex items-center gap-2 text-xs text-brand-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>Classifique a questao na hierarquia correta. Campos com <b>*</b> sao obrigatorios.</span>
                            </div>

                            {/* Taxonomia */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Classificacao Taxonomica
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <AutocompleteInput label="Disciplina" value={form.disciplina} onChange={(v) => update('disciplina', v)} suggestions={suggestions.disciplina} error={errors.disciplina} placeholder="Ex: Fisica" />
                                    <AutocompleteInput label="Topico" value={form.topico} onChange={(v) => update('topico', v)} suggestions={suggestions.topico} error={errors.topico} placeholder="Ex: Mecanica" />
                                    <AutocompleteInput label="Conteudo" value={form.conteudo} onChange={(v) => update('conteudo', v)} suggestions={suggestions.conteudo} error={errors.conteudo} placeholder="Ex: Cinematica" />
                                    <AutocompleteInput label="Assunto" value={form.assunto} onChange={(v) => update('assunto', v)} suggestions={suggestions.assunto} error={errors.assunto} placeholder="Ex: Lancamento Obliquo" />
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
                                        <input type="text" value={form.banca} onChange={(e) => update('banca', e.target.value)} placeholder="Ex: ENEM" list="banca-list" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all" />
                                        <datalist id="banca-list">{suggestions.banca.map((b, i) => (<option key={i} value={b} />))}</datalist>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Ano</label>
                                        <input type="number" value={form.ano} onChange={(e) => update('ano', e.target.value)} placeholder="Ex: 2025" min="1990" max="2099" className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Dificuldade</label>
                                        <select value={form.dificuldade} onChange={(e) => update('dificuldade', e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 cursor-pointer appearance-none">
                                            <option value="nao_definida">Nao definida</option>
                                            <option value="facil">Facil</option>
                                            <option value="medio">Medio</option>
                                            <option value="dificil">Dificil</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Include adapted toggle */}
                            <div className="mt-4 p-4 rounded-xl border-2 border-dashed border-sky-200 bg-sky-50/50">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={includeAdapted}
                                        onChange={(e) => setIncludeAdapted(e.target.checked)}
                                        className="w-5 h-5 rounded"
                                    />
                                    <div>
                                        <span className="text-sm font-semibold text-sky-800 group-hover:text-sky-900 transition-colors">
                                            Adicionar versao adaptada (alunos atipicos)
                                        </span>
                                        <p className="text-[11px] text-sky-600 mt-0.5">
                                            Cria uma copia adaptada com tag A{questionTag}. {form.tipo === 'objetiva' ? 'Objetivas adaptadas tem no maximo 3 alternativas (A, B, C).' : ''}
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    ) : (
                        /* Step 3: Adapted version */
                        <div className="space-y-5">
                            <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex items-center gap-2 text-xs text-sky-700">
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>Versao adaptada para alunos atipicos. Tag: <b className="font-mono">A{questionTag}</b></span>
                            </div>

                            {/* Adapted Enunciado */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-sm font-bold text-gray-800">Enunciado Adaptado</label>
                                    <div className="flex items-center gap-1">
                                        <button type="button" onClick={() => handleEquationInsert('adapted_enunciado')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-brand-50">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                            Equacao
                                        </button>
                                        <button type="button" onClick={() => handleImageUpload('adapted_enunciado')} className="text-xs text-brand-600 hover:text-brand-700 font-semibold flex items-center gap-1 transition-colors px-2 py-1 rounded-md hover:bg-brand-50">
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            Imagem
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    ref={adaptedEnunciadoRef}
                                    value={adaptedForm.enunciado}
                                    onChange={(e) => updateAdapted('enunciado', e.target.value)}
                                    rows={6}
                                    placeholder="Digite o enunciado adaptado (linguagem simplificada, apoio visual, etc.)..."
                                    className={`w-full bg-gray-50 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y placeholder:text-gray-400 ${
                                        errors.adaptedEnunciado ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'
                                    }`}
                                />
                                {errors.adaptedEnunciado && (
                                    <p className="text-xs text-rose-500 mt-1">{errors.adaptedEnunciado}</p>
                                )}
                            </div>

                            {/* Adapted Alternativas (max 3: A, B, C) */}
                            {form.tipo === 'objetiva' && (
                                <div className="space-y-3">
                                    <label className="text-sm font-bold text-gray-800">Alternativas Adaptadas (A, B, C)</label>
                                    <p className="text-[11px] text-sky-600">Questoes objetivas adaptadas possuem no maximo 3 alternativas.</p>

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
                                                <textarea
                                                    ref={(el) => adaptedAlternativasRefs.current[idx] = el}
                                                    value={alt.texto}
                                                    onChange={(e) => handleUpdateAdaptedAlternativa(idx, e.target.value)}
                                                    rows={2}
                                                    placeholder={`Alternativa ${alt.letra} adaptada...`}
                                                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-none placeholder:text-gray-400"
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold text-gray-600 mb-1.5">Alternativa correta (adaptada)</label>
                                        <select
                                            value={adaptedForm.gabarito}
                                            onChange={(e) => updateAdapted('gabarito', e.target.value)}
                                            className={`w-48 bg-gray-50 border rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer appearance-none ${
                                                errors.adaptedGabarito ? 'border-rose-300 bg-rose-50/50' : 'border-gray-200'
                                            }`}
                                        >
                                            <option value="">Selecione</option>
                                            {adaptedForm.alternativas.map(alt => (
                                                <option key={alt.letra} value={alt.letra}>Alternativa {alt.letra}</option>
                                            ))}
                                        </select>
                                        {errors.adaptedGabarito && (
                                            <p className="text-xs text-rose-500 mt-1">{errors.adaptedGabarito}</p>
                                        )}
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
                                        placeholder="Resposta esperada da versao adaptada..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all resize-y placeholder:text-gray-400"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50/50">
                    <div>
                        <p className="text-[10px] text-gray-400">
                            Passo {step} de {totalSteps} — {step === 1 ? 'Conteudo da questao' : step === 2 ? 'Classificacao e metadados' : 'Versao adaptada'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {step === 1 ? (
                            <>
                                <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">Cancelar</button>
                                <button onClick={handleNext} className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press shadow-lg shadow-brand-500/20 flex items-center gap-1.5">
                                    Avancar
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </>
                        ) : step === 2 ? (
                            <>
                                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={saving}
                                    className={`px-5 py-2 text-sm font-semibold rounded-xl text-white transition-all duration-200 btn-press shadow-lg flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        includeAdapted ? 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                                    }`}
                                >
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                                    ) : includeAdapted ? (
                                        <>Avancar para Adaptada <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg></>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Salvar Questao</>
                                    )}
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleBack} className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100 flex items-center gap-1.5">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                    Voltar
                                </button>
                                <button
                                    onClick={handleNext}
                                    disabled={saving}
                                    className="px-5 py-2 text-sm font-semibold rounded-xl bg-sky-600 hover:bg-sky-700 text-white transition-all duration-200 btn-press shadow-lg shadow-sky-500/20 flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Salvando...</>
                                    ) : (
                                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Salvar Questao + Adaptada</>
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

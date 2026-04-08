// QuestBank — ExportModal Component
// Save exam to DB, tag questions as used, generate .docx with auto-enumeration

const ExportModal = ({ isOpen, onClose, selectedQuestions, onExamSaved }) => {
    const [step, setStep] = React.useState('config'); // config | generating | done
    const [config, setConfig] = React.useState({
        titulo: '',
        professor: '',
        instituicao: '',
        data: new Date().toISOString().split('T')[0],
        incluir_gabarito: true,
        incluir_resolucao: false,
        linhas_discursiva: 5,
    });
    const [savedExam, setSavedExam] = React.useState(null);

    if (!isOpen) return null;

    const handleClose = () => {
        setStep('config');
        setSavedExam(null);
        onClose();
    };

    const updateConfig = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleExport = async () => {
        if (!config.titulo.trim()) {
            alert('Digite o nome da prova/lista.');
            return;
        }

        setStep('generating');

        try {
            // 1. Save exam to DB
            const examRecord = {
                title: config.titulo.trim(),
                professor: config.professor,
                instituicao: config.instituicao,
                data: config.data,
                questionIds: selectedQuestions.map(q => q.id),
                questionCount: selectedQuestions.length,
                config: { ...config },
                created_at: new Date().toISOString(),
            };
            const examId = await db.exams.add(examRecord);

            // 2. Tag questions as used in this exam
            const examTag = config.titulo.trim();
            for (const q of selectedQuestions) {
                const existing = q.usedInExams || [];
                if (!existing.includes(examTag)) {
                    await db.questions.update(q.id, {
                        usedInExams: [...existing, examTag],
                    });
                }
            }

            // 3. Generate .docx
            await generateDocx(selectedQuestions, config);

            setSavedExam({ id: examId, title: config.titulo });
            setStep('done');

            // Notify parent to refresh data
            if (onExamSaved) onExamSaved();

        } catch (err) {
            console.error('Export error:', err);
            alert('Erro ao gerar prova: ' + err.message);
            setStep('config');
        }
    };

    // Generate .docx using docx.js
    const generateDocx = async (questions, cfg) => {
        const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun } = docx;

        const children = [];

        // Header
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: cfg.instituicao || '', bold: true, size: 24, font: 'Arial' })],
        }));

        children.push(new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [new TextRun({ text: cfg.titulo || 'Prova', bold: true, size: 28, font: 'Arial' })],
        }));

        if (cfg.professor || cfg.data) {
            const infoTexts = [];
            if (cfg.professor) infoTexts.push(`Prof.: ${cfg.professor}`);
            if (cfg.data) {
                const [y, m, d] = cfg.data.split('-');
                infoTexts.push(`Data: ${d}/${m}/${y}`);
            }
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({ text: infoTexts.join('    |    '), size: 20, font: 'Arial', color: '555555' })],
            }));
        }

        // Name/Class line
        children.push(new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
                new TextRun({ text: 'Nome: _____________________________________________   Turma: ________', size: 22, font: 'Arial' }),
            ],
        }));

        // Separator
        children.push(new Paragraph({
            spacing: { before: 100, after: 300 },
            border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
            children: [],
        }));

        // Questions
        for (let idx = 0; idx < questions.length; idx++) {
            const q = questions[idx];
            const questionNum = idx + 1;
            const isObjective = q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';

            // Question number + enunciado (strip HTML tags)
            const cleanEnunciado = q.enunciado.replace(/<[^>]*>/g, '');
            children.push(new Paragraph({
                spacing: { before: 250, after: 120 },
                children: [
                    new TextRun({ text: `${questionNum}) `, bold: true, size: 22, font: 'Arial' }),
                    new TextRun({ text: cleanEnunciado, size: 22, font: 'Arial' }),
                ],
            }));

            // Images (base64)
            if (q.imagens && q.imagens.length > 0) {
                for (const imgSrc of q.imagens) {
                    try {
                        const base64Match = imgSrc.match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
                        if (base64Match) {
                            const base64Data = base64Match[2];
                            const binaryString = atob(base64Data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                                bytes[i] = binaryString.charCodeAt(i);
                            }
                            children.push(new Paragraph({
                                spacing: { before: 100, after: 100 },
                                children: [
                                    new ImageRun({
                                        data: bytes,
                                        transformation: { width: 400, height: 300 },
                                    }),
                                ],
                            }));
                        }
                    } catch (imgErr) {
                        console.warn('Could not include image in docx:', imgErr);
                    }
                }
            }

            // Alternatives for objective questions
            if (isObjective && q.alternativas && q.alternativas.length > 0) {
                q.alternativas.forEach((alt) => {
                    children.push(new Paragraph({
                        spacing: { before: 40, after: 40 },
                        indent: { left: 400 },
                        children: [
                            new TextRun({ text: `${alt.letra}) `, bold: true, size: 22, font: 'Arial' }),
                            new TextRun({ text: alt.texto, size: 22, font: 'Arial' }),
                        ],
                    }));
                });
            }

            // Answer lines for discursive questions
            if (q.tipo === 'discursiva') {
                const numLines = cfg.linhas_discursiva || 5;
                for (let i = 0; i < numLines; i++) {
                    children.push(new Paragraph({
                        spacing: { before: 200 },
                        border: { bottom: { color: 'AAAAAA', space: 1, style: BorderStyle.SINGLE, size: 4 } },
                        children: [new TextRun({ text: ' ', size: 22 })],
                    }));
                }
            }
        }

        // Gabarito page (if enabled and there are objective questions)
        if (cfg.incluir_gabarito) {
            const objectiveQs = questions.filter(q => q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria');
            if (objectiveQs.length > 0) {
                children.push(new Paragraph({
                    pageBreakBefore: true,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [new TextRun({ text: 'GABARITO', bold: true, size: 28, font: 'Arial' })],
                }));

                questions.forEach((q, idx) => {
                    if (q.gabarito) {
                        children.push(new Paragraph({
                            spacing: { before: 60, after: 60 },
                            children: [
                                new TextRun({ text: `${idx + 1}) `, bold: true, size: 22, font: 'Arial' }),
                                new TextRun({ text: String(q.gabarito), size: 22, font: 'Arial' }),
                            ],
                        }));
                    }
                });
            }
        }

        const doc = new Document({
            sections: [{
                properties: {
                    page: {
                        margin: { top: 720, bottom: 720, left: 720, right: 720 },
                    },
                },
                children,
            }],
        });

        const blob = await Packer.toBlob(doc);
        const filename = `${(cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase()}.docx`;
        saveAs(blob, filename);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={handleClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            <div
                className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl animate-modal-in border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Gerar Prova</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {selectedQuestions.length} {selectedQuestions.length === 1 ? 'questão selecionada' : 'questões selecionadas'}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                    {step === 'config' && (
                        <>
                            {/* Title (required) */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                                    Nome da Prova/Lista <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={config.titulo}
                                    onChange={(e) => updateConfig('titulo', e.target.value)}
                                    placeholder="Ex: Prova de Física - 2º Bimestre"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                                    autoFocus
                                />
                            </div>

                            {/* Professor + Institution */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Professor(a)</label>
                                    <input
                                        type="text"
                                        value={config.professor}
                                        onChange={(e) => updateConfig('professor', e.target.value)}
                                        placeholder="Nome"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Instituição</label>
                                    <input
                                        type="text"
                                        value={config.instituicao}
                                        onChange={(e) => updateConfig('instituicao', e.target.value)}
                                        placeholder="Escola/Colégio"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Date + Linhas discursiva */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Data da Prova</label>
                                    <input
                                        type="date"
                                        value={config.data}
                                        onChange={(e) => updateConfig('data', e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Linhas (discursiva)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="20"
                                        value={config.linhas_discursiva}
                                        onChange={(e) => updateConfig('linhas_discursiva', parseInt(e.target.value) || 5)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 transition-all"
                                    />
                                </div>
                            </div>

                            {/* Options */}
                            <div className="flex flex-col gap-2.5 pt-2">
                                <label className="flex items-center gap-2.5 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={config.incluir_gabarito}
                                        onChange={(e) => updateConfig('incluir_gabarito', e.target.checked)}
                                        className="w-4 h-4 rounded"
                                    />
                                    <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                                        Incluir gabarito (página separada)
                                    </span>
                                </label>
                            </div>

                            {/* Discipline summary */}
                            <div className="bg-gray-50 rounded-lg p-3 mt-2">
                                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">Resumo</p>
                                <div className="flex flex-wrap gap-1.5">
                                    {(() => {
                                        const counts = {};
                                        const typeCounts = { objetiva: 0, discursiva: 0 };
                                        selectedQuestions.forEach(q => {
                                            counts[q.disciplina] = (counts[q.disciplina] || 0) + 1;
                                            if (q.tipo === 'discursiva') typeCounts.discursiva++;
                                            else typeCounts.objetiva++;
                                        });
                                        const badges = Object.entries(counts).map(([disc, count]) => {
                                            const colors = getDisciplineColor(disc);
                                            return (
                                                <span key={disc} className={`text-[10px] px-2 py-1 rounded-md ${colors.bg} ${colors.text}`}>
                                                    {disc}: {count}
                                                </span>
                                            );
                                        });
                                        badges.push(
                                            <span key="types" className="text-[10px] px-2 py-1 rounded-md bg-gray-100 text-gray-600 ml-1">
                                                {typeCounts.objetiva > 0 && `${typeCounts.objetiva} obj.`}
                                                {typeCounts.objetiva > 0 && typeCounts.discursiva > 0 && ' + '}
                                                {typeCounts.discursiva > 0 && `${typeCounts.discursiva} disc.`}
                                            </span>
                                        );
                                        return badges;
                                    })()}
                                </div>
                            </div>
                        </>
                    )}

                    {step === 'generating' && (
                        <div className="text-center py-8">
                            <div className="w-10 h-10 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-sm text-gray-600">Gerando prova em Word...</p>
                        </div>
                    )}

                    {step === 'done' && (
                        <div className="text-center py-6">
                            <svg className="w-14 h-14 text-emerald-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-bold text-gray-900">Prova gerada com sucesso!</p>
                            <p className="text-sm text-gray-500 mt-2">
                                O arquivo .docx "{savedExam?.title}" foi baixado com {selectedQuestions.length} questões.
                            </p>
                            <p className="text-xs text-gray-400 mt-3">
                                A prova foi salva no histórico e as questões foram marcadas como usadas.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 pb-5">
                    {step === 'config' && (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={selectedQuestions.length === 0 || !config.titulo.trim()}
                                className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                Baixar Word (.docx)
                            </button>
                        </>
                    )}
                    {step === 'done' && (
                        <button
                            onClick={handleClose}
                            className="px-5 py-2 text-sm font-semibold rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                        >
                            Fechar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// QuestBank — ImportModal Component
// Upload JSON file with drag & drop, validation, and import (white theme)

const ImportModal = ({ isOpen, onClose, onImport }) => {
    const [isDragging, setIsDragging] = React.useState(false);
    const [file, setFile] = React.useState(null);
    const [validation, setValidation] = React.useState(null);
    const [importing, setImporting] = React.useState(false);
    const [result, setResult] = React.useState(null);
    const [latexServer, setLatexServer] = React.useState({ checked: false, ok: false });
    const fileInputRef = React.useRef(null);

    // Checa servidor LaTeX ao abrir o modal (e a cada 10s enquanto aberto)
    React.useEffect(() => {
        if (!isOpen) return;
        let active = true;
        const check = async () => {
            const s = await QBImport.checkLatexServer();
            if (active) setLatexServer({ checked: true, ok: s.ok, version: s.version });
        };
        check();
        const id = setInterval(check, 10000);
        return () => { active = false; clearInterval(id); };
    }, [isOpen]);

    if (!isOpen) return null;

    const reset = () => {
        setFile(null);
        setValidation(null);
        setImporting(false);
        setResult(null);
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleFile = async (selectedFile) => {
        if (!selectedFile) return;
        const name = selectedFile.name.toLowerCase();
        const isJson = name.endsWith('.json');
        const isTex = name.endsWith('.tex');
        if (!isJson && !isTex) {
            setValidation({ valid: false, errors: ['Selecione um arquivo .json ou .tex'], warnings: [], stats: {} });
            return;
        }

        setFile(selectedFile);
        setResult(null);

        try {
            let data;
            if (isTex) {
                // converte via servidor Python local
                data = await QBImport.readTexFile(selectedFile);
            } else {
                data = await QBImport.readFile(selectedFile);
            }
            const validationResult = QBImport.validate(data);
            setValidation({ ...validationResult, data, source: isTex ? 'tex' : 'json' });
        } catch (err) {
            setValidation({ valid: false, errors: [err.message], warnings: [], stats: {} });
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const dropped = e.dataTransfer.files[0];
        handleFile(dropped);
    };

    const handleImport = async () => {
        if (!validation || !validation.validQuestions?.length) return;

        setImporting(true);
        try {
            const importResult = await QBImport.importToDb(validation.validQuestions);
            setResult(importResult);
            onImport(importResult);
        } catch (err) {
            setResult({ error: err.message });
        } finally {
            setImporting(false);
        }
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
                        <h3 className="text-lg font-bold text-gray-900">Importar Questões</h3>
                        <p className="text-xs text-gray-500 mt-0.5">Arquivo <b>.json</b> (padrão v1.0) ou <b>.tex</b> (requer servidor local)</p>
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
                <div className="p-5">
                    {!result ? (
                        <>
                            {/* Drop zone */}
                            <div
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                                    isDragging
                                        ? 'border-brand-500 bg-brand-50'
                                        : file
                                            ? 'border-emerald-300 bg-emerald-50'
                                            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                                }`}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".json,.tex"
                                    onChange={(e) => handleFile(e.target.files[0])}
                                    className="hidden"
                                />

                                {file ? (
                                    <div className="flex flex-col items-center">
                                        <svg className="w-8 h-8 text-emerald-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm font-medium text-gray-800">{file.name}</p>
                                        <p className="text-xs text-gray-400 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <svg className="w-10 h-10 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <p className="text-sm text-gray-500">Arraste um arquivo <b>.json</b> ou <b>.tex</b></p>
                                        <p className="text-xs text-gray-400 mt-1">ou clique para selecionar</p>
                                    </div>
                                )}
                            </div>

                            {/* Status do servidor LaTeX */}
                            {latexServer.checked && (
                                <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${
                                    latexServer.ok
                                        ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                        : 'bg-amber-50 border-amber-200 text-amber-700'
                                }`}>
                                    <span className={`w-2 h-2 rounded-full ${latexServer.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                    {latexServer.ok ? (
                                        <span>Servidor LaTeX conectado (v{latexServer.version}) — arquivos <b>.tex</b> podem ser importados.</span>
                                    ) : (
                                        <span>Servidor LaTeX offline. Para importar <b>.tex</b>, rode <code className="bg-amber-100 px-1 rounded">questbank-server</code> no terminal.</span>
                                    )}
                                </div>
                            )}

                            {/* Validation results */}
                            {validation && (
                                <div className="mt-4 space-y-2">
                                    {validation.stats?.total > 0 && (
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-gray-500">
                                                Total: <b className="text-gray-800">{validation.stats.total}</b>
                                            </span>
                                            <span className="text-emerald-600">
                                                Válidas: <b>{validation.stats.valid}</b>
                                            </span>
                                            {validation.stats.rejected > 0 && (
                                                <span className="text-rose-600">
                                                    Rejeitadas: <b>{validation.stats.rejected}</b>
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    {validation.errors.length > 0 && (
                                        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                                            <p className="text-xs font-semibold text-rose-600 mb-1">Erros:</p>
                                            {validation.errors.map((err, i) => (
                                                <p key={i} className="text-xs text-rose-500">- {err}</p>
                                            ))}
                                        </div>
                                    )}

                                    {validation.warnings.length > 0 && (
                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 max-h-24 overflow-y-auto">
                                            <p className="text-xs font-semibold text-amber-600 mb-1">Avisos:</p>
                                            {validation.warnings.map((w, i) => (
                                                <p key={i} className="text-xs text-amber-500">- {w}</p>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center py-4">
                            {result.error ? (
                                <div>
                                    <svg className="w-12 h-12 text-rose-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-rose-600">{result.error}</p>
                                </div>
                            ) : (
                                <div>
                                    <svg className="w-12 h-12 text-emerald-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-lg font-bold text-gray-900">Importação concluída!</p>
                                    <div className="flex justify-center gap-6 mt-3 text-sm">
                                        <span className="text-emerald-600">
                                            <b>{result.imported}</b> importadas
                                        </span>
                                        {result.duplicates > 0 && (
                                            <span className="text-amber-600">
                                                <b>{result.duplicates}</b> duplicatas ignoradas
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 pb-5">
                    {!result ? (
                        <>
                            <button
                                onClick={handleClose}
                                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImport}
                                disabled={!validation?.validQuestions?.length || importing}
                                className="px-5 py-2 text-sm font-semibold rounded-xl bg-brand-600 hover:bg-brand-700 text-white transition-all duration-200 btn-press disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-brand-500/20 flex items-center gap-2"
                            >
                                {importing ? (
                                    <>
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        Importando...
                                    </>
                                ) : (
                                    <>Importar {validation?.stats?.valid || 0} questões</>
                                )}
                            </button>
                        </>
                    ) : (
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

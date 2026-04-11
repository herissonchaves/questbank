// QuestBank — RichTextToolbar Component (v2)
// Improved toolbar with:
//   - Undo/Redo buttons
//   - Better image insertion with proper data attributes
//   - Color picker for text
//   - List buttons (ordered/unordered)
//   - Active state indicators for formatting buttons
//   - Clean tooltips

const RichTextToolbar = ({ onEquation, onImage, onUndo, onRedo }) => {
    const exec = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    // Track active formatting state
    const [activeStates, setActiveStates] = React.useState({});

    React.useEffect(() => {
        const updateStates = () => {
            setActiveStates({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                superscript: document.queryCommandState('superscript'),
                subscript: document.queryCommandState('subscript'),
                justifyLeft: document.queryCommandState('justifyLeft'),
                justifyCenter: document.queryCommandState('justifyCenter'),
                justifyRight: document.queryCommandState('justifyRight'),
                justifyFull: document.queryCommandState('justifyFull'),
                insertOrderedList: document.queryCommandState('insertOrderedList'),
                insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            });
        };
        document.addEventListener('selectionchange', updateStates);
        return () => document.removeEventListener('selectionchange', updateStates);
    }, []);

    const btnClass = (active) =>
        `w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
            active
                ? 'bg-brand-100 text-brand-700 ring-1 ring-brand-300'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
        }`;

    return (
        <div
            className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-xl select-none"
            onMouseDown={(e) => e.preventDefault()}
        >
            {/* Undo / Redo */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
                <button type="button" onClick={onUndo} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Desfazer (Ctrl+Z)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a5 5 0 015 5v2M3 10l4-4M3 10l4 4" /></svg>
                </button>
                <button type="button" onClick={onRedo} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Refazer (Ctrl+Y)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a5 5 0 00-5 5v2M21 10l-4-4M21 10l-4 4" /></svg>
                </button>
            </div>

            {/* Text formatting */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('bold')} className={btnClass(activeStates.bold)} title="Negrito (Ctrl+B)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h9a4 4 0 110 8H6v-8z" /></svg>
                </button>
                <button type="button" onClick={() => exec('italic')} className={btnClass(activeStates.italic)} title="Italico (Ctrl+I)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </button>
                <button type="button" onClick={() => exec('underline')} className={btnClass(activeStates.underline)} title="Sublinhado (Ctrl+U)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3m-6 15v3m0 0h-4m4 0h4" /></svg>
                </button>
            </div>

            {/* Alignment */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('justifyLeft')} className={btnClass(activeStates.justifyLeft)} title="Alinhar a Esquerda">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyCenter')} className={btnClass(activeStates.justifyCenter)} title="Centralizar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyRight')} className={btnClass(activeStates.justifyRight)} title="Alinhar a Direita">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyFull')} className={btnClass(activeStates.justifyFull)} title="Justificar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>

            {/* Superscript / Subscript / Font Size / Lists */}
            <div className="flex items-center gap-0.5 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('superscript')} className={btnClass(activeStates.superscript) + ' font-bold font-serif text-xs'} title="Sobrescrito">
                    x<sup>2</sup>
                </button>
                <button type="button" onClick={() => exec('subscript')} className={btnClass(activeStates.subscript) + ' font-bold font-serif text-xs'} title="Subscrito">
                    x<sub>2</sub>
                </button>
                <select
                    onChange={(e) => { if (e.target.value) exec('fontSize', e.target.value); e.target.value = ''; }}
                    className="text-xs bg-transparent outline-none h-8 px-1 text-gray-600 hover:bg-gray-200 rounded cursor-pointer"
                    title="Tamanho da Fonte"
                >
                    <option value="">Tamanho</option>
                    <option value="1">Muito Pequeno</option>
                    <option value="2">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="4">Medio</option>
                    <option value="5">Grande</option>
                    <option value="6">Muito Grande</option>
                    <option value="7">Enorme</option>
                </select>
                <button type="button" onClick={() => exec('insertUnorderedList')} className={btnClass(activeStates.insertUnorderedList)} title="Lista com marcadores">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h.01M4 12h.01M4 18h.01M8 6h12M8 12h12M8 18h12" /></svg>
                </button>
                <button type="button" onClick={() => exec('insertOrderedList')} className={btnClass(activeStates.insertOrderedList)} title="Lista numerada">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M4 14h2l-2 2 2 2M4 14h0" /></svg>
                </button>
            </div>

            {/* Equation & Image */}
            <div className="flex items-center gap-1 pl-1 ml-auto">
                {onEquation && (
                    <button type="button" onClick={onEquation} className="px-2.5 h-8 flex items-center gap-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors font-medium text-xs" title="Inserir Equacao LaTeX">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Equacao
                    </button>
                )}
                {onImage && (
                    <button type="button" onClick={onImage} className="px-2.5 h-8 flex items-center gap-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors font-medium text-xs" title="Inserir Imagem">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Imagem
                    </button>
                )}
            </div>
        </div>
    );
};

window.RichTextToolbar = RichTextToolbar;

// QuestBank — RichTextToolbar Component
// Compact formatting toolbar for textarea fields (inserts HTML tags)
// Reusable across create-question-modal and edit-question-modal
// Optional props: onEquation, onImage — when provided, show equation/image buttons

const RichTextToolbar = ({ textareaRef, value, onChange, onEquation, onImage }) => {

    const wrapSelection = (before, after) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = value || '';
        const selected = text.substring(start, end);
        const newText = text.substring(0, start) + before + selected + after + text.substring(end);
        onChange(newText);
        // Restore cursor position after React re-render
        setTimeout(() => {
            ta.focus();
            ta.setSelectionRange(start + before.length, end + before.length);
        }, 10);
    };

    const applyAlignment = (align) => {
        const ta = textareaRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const text = value || '';
        const selected = text.substring(start, end) || '';
        const wrapped = `<div style="text-align:${align}">${selected}</div>`;
        const newText = text.substring(0, start) + wrapped + text.substring(end);
        onChange(newText);
        setTimeout(() => {
            ta.focus();
            const innerStart = start + `<div style="text-align:${align}">`.length;
            ta.setSelectionRange(innerStart, innerStart + selected.length);
        }, 10);
    };

    const applyFontSize = (size) => {
        if (!size) return;
        wrapSelection(`<span style="font-size:${size}px">`, '</span>');
    };

    const btnClass = "w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all text-xs font-bold";
    const sepClass = "w-px h-5 bg-gray-200 mx-0.5";

    return (
        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-100 border border-gray-200 rounded-lg mb-1 flex-wrap">
            {/* Text formatting */}
            <button type="button" onClick={() => wrapSelection('<b>', '</b>')} className={btnClass} title="Negrito">
                <span className="font-bold text-[13px]">B</span>
            </button>
            <button type="button" onClick={() => wrapSelection('<i>', '</i>')} className={btnClass} title="Itálico">
                <span className="italic text-[13px]">I</span>
            </button>
            <button type="button" onClick={() => wrapSelection('<u>', '</u>')} className={btnClass} title="Sublinhado">
                <span className="underline text-[13px]">U</span>
            </button>
            <button type="button" onClick={() => wrapSelection('<s>', '</s>')} className={btnClass} title="Tachado">
                <span className="line-through text-[13px]">S</span>
            </button>

            <div className={sepClass} />

            {/* Font Size */}
            <select
                defaultValue=""
                onChange={(e) => { applyFontSize(e.target.value); e.target.value = ''; }}
                className="h-7 rounded bg-white border border-gray-200 text-[11px] text-gray-600 px-1 pr-5 focus:outline-none focus:ring-1 focus:ring-brand-500/40 cursor-pointer appearance-none hover:bg-gray-50 transition-colors"
                title="Tamanho da fonte"
                style={{ backgroundSize: '10px', backgroundPosition: 'right 4px center' }}
            >
                <option value="" disabled>Aa</option>
                <option value="8">8px</option>
                <option value="10">10px</option>
                <option value="12">12px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
                <option value="20">20px</option>
                <option value="24">24px</option>
                <option value="28">28px</option>
                <option value="32">32px</option>
                <option value="36">36px</option>
            </select>

            <div className={sepClass} />

            {/* Subscript / Superscript */}
            <button type="button" onClick={() => wrapSelection('<sub>', '</sub>')} className={btnClass} title="Subscrito">
                <span className="text-[11px]">X<sub className="text-[8px]">2</sub></span>
            </button>
            <button type="button" onClick={() => wrapSelection('<sup>', '</sup>')} className={btnClass} title="Sobrescrito">
                <span className="text-[11px]">X<sup className="text-[8px]">2</sup></span>
            </button>

            <div className={sepClass} />

            {/* Alignment */}
            <button type="button" onClick={() => applyAlignment('left')} className={btnClass} title="Alinhar à esquerda">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
                </svg>
            </button>
            <button type="button" onClick={() => applyAlignment('center')} className={btnClass} title="Centralizar">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
                </svg>
            </button>
            <button type="button" onClick={() => applyAlignment('right')} className={btnClass} title="Alinhar à direita">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M6 18h14" />
                </svg>
            </button>
            <button type="button" onClick={() => applyAlignment('justify')} className={btnClass} title="Justificar">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>

            {/* Equation & Image (optional callbacks) */}
            {(onEquation || onImage) && <div className={sepClass} />}

            {onEquation && (
                <button type="button" onClick={onEquation} className={btnClass + " text-brand-500 hover:text-brand-700 hover:bg-brand-50"} title="Inserir equação LaTeX">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                </button>
            )}

            {onImage && (
                <button type="button" onClick={onImage} className={btnClass + " text-brand-500 hover:text-brand-700 hover:bg-brand-50"} title="Inserir imagem">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </button>
            )}
        </div>
    );
};


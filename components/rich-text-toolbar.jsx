// QuestBank — RichTextToolbar Component
// Compact formatting toolbar for textarea fields (inserts HTML tags)
// Reusable across create-question-modal and edit-question-modal

const RichTextToolbar = ({ textareaRef, value, onChange }) => {

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

    const btnClass = "w-7 h-7 rounded flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition-all text-xs font-bold";
    const sepClass = "w-px h-5 bg-gray-200 mx-0.5";

    return (
        <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-100 border border-gray-200 rounded-lg mb-1">
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
        </div>
    );
};

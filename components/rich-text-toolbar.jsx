const RichTextToolbar = ({ onEquation, onImage }) => {
    const exec = (command, value = null) => {
        document.execCommand(command, false, value);
    };

    return (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 border border-b-0 border-gray-200 rounded-t-xl" onMouseDown={(e) => e.preventDefault()}>
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('bold')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Negrito (Ctrl+B)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h8a4 4 0 100-8H6v8zm0 0h9a4 4 0 110 8H6v-8z" /></svg>
                </button>
                <button type="button" onClick={() => exec('italic')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Itálico (Ctrl+I)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </button>
                <button type="button" onClick={() => exec('underline')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Sublinhado (Ctrl+U)">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 3v7a6 6 0 006 6 6 6 0 006-6V3m-6 15v3m0 0h-4m4 0h4" /></svg>
                </button>
            </div>

            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('justifyLeft')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Alinhar à Esquerda">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyCenter')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Centralizar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyRight')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Alinhar à Direita">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M10 12h10M4 18h16" /></svg>
                </button>
                <button type="button" onClick={() => exec('justifyFull')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors" title="Justificar">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                </button>
            </div>
            
            <div className="flex items-center gap-1 pr-2 border-r border-gray-300">
                <button type="button" onClick={() => exec('superscript')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors font-bold font-serif" title="Sobrescrito">
                    x²
                </button>
                <button type="button" onClick={() => exec('subscript')} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-200 transition-colors font-bold font-serif" title="Subscrito">
                    x₂
                </button>
                <select onChange={(e) => { if(e.target.value) exec('fontSize', e.target.value); e.target.value=''; }} className="text-sm bg-transparent outline-none h-8 px-1 text-gray-600 hover:bg-gray-200 rounded cursor-pointer" title="Tamanho da Fonte">
                    <option value="">Tamanho</option>
                    <option value="1">Muito Pequeno</option>
                    <option value="2">Pequeno</option>
                    <option value="3">Normal</option>
                    <option value="4">Médio</option>
                    <option value="5">Grande</option>
                    <option value="6">Muito Grande</option>
                    <option value="7">Enorme</option>
                </select>
            </div>

            <div className="flex items-center gap-1 pl-1 ml-auto">
                {onEquation && (
                    <button type="button" onClick={onEquation} className="px-3 h-8 flex items-center gap-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors font-medium text-sm" title="Inserir Equação LaTeX">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                        Equação
                    </button>
                )}
                {onImage && (
                    <button type="button" onClick={onImage} className="px-3 h-8 flex items-center gap-1.5 rounded-lg text-brand-600 hover:bg-brand-50 transition-colors font-medium text-sm" title="Inserir Imagem">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Imagem
                    </button>
                )}
            </div>
        </div>
    );
};

window.RichTextToolbar = RichTextToolbar;

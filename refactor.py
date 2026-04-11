import re

def refactor_file(f):
    text = open(f, 'r', encoding='utf-8').read()

    text = text.replace('<RichTextToolbar textareaRef={enunciadoRef}', '<RichTextToolbar')
    text = re.sub(
        r'<textarea\s+ref={enunciadoRef}\s+value={form.enunciado}\s+onChange={\(e\) => update\(\'enunciado\', e.target.value\)}\s+rows=\{6\}\s+placeholder="Digite o enunciado da quest.*?"\s+className={`w-full.*?`}\s+/>',
        '<VisualEditor forwardedRef={enunciadoRef} value={form.enunciado} onChange={(v) => update(\'enunciado\', v)} placeholder="Digite o enunciado aqui..." className={`w-full max-h-[400px] overflow-y-auto bg-gray-50/50 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all border-gray-200`} />',
        text, flags=re.DOTALL
    )

    text = text.replace('<RichTextToolbar textareaRef={adaptedEnunciadoRef}', '<RichTextToolbar')
    text = re.sub(
        r'<textarea\s+ref={adaptedEnunciadoRef}.*?value={adaptedForm.enunciado}.*?placeholder="Digite o enunciado adaptado.*?"\s+className={`w-full.*?`}\s+/>',
        '<VisualEditor forwardedRef={adaptedEnunciadoRef} value={adaptedForm.enunciado} onChange={(v) => { if(typeof setAdaptedForm === "function") setAdaptedForm(p => ({...p, enunciado: v})); else updateAdapted("enunciado", v); }} placeholder="Digite o enunciado adaptado aqui..." className={`w-full max-h-[400px] overflow-y-auto bg-sky-50/30 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all border-sky-200/60`} />',
        text, flags=re.DOTALL
    )

    text = re.sub(
        r'<textarea\s+ref={\(el\) => alternativasRefs.current\[idx\] = el}\s+value={alt.texto}\s+onChange={\(e\) => handleUpdateAlternativa\(idx, e.target.value\)}\s+rows=\{2\}\s+placeholder={.*?}\s+className="w-full.*?"\s+/>',
        '<VisualEditor forwardedRef={(el) => alternativasRefs.current[idx] = el} value={alt.texto} onChange={(v) => handleUpdateAlternativa(idx, v)} placeholder={`Digite a alternativa ${alt.letra}...`} className="w-full max-h-[200px] overflow-y-auto bg-gray-50/50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all" />',
        text, flags=re.DOTALL
    )

    text = re.sub(
        r'<textarea\s+ref={\(el\) => adaptedAlternativasRefs.current\[idx\] = el}\s+value={alt.texto}\s+onChange={\(e\) => handleUpdateAdaptedAlternativa\(idx, e.target.value\)}\s+rows=\{2\}\s+placeholder={.*?}\s+className="w-full.*?"\s+/>',
        '<VisualEditor forwardedRef={(el) => adaptedAlternativasRefs.current[idx] = el} value={alt.texto} onChange={(v) => handleUpdateAdaptedAlternativa(idx, v)} placeholder={`Digite a alternativa ${alt.letra}...`} className="w-full max-h-[200px] overflow-y-auto bg-sky-50/30 border border-sky-200/60 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all" />',
        text, flags=re.DOTALL
    )

    text = re.sub(r'<div className="flex flex-col gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">\s*<button.*?title="Inserir equacao".*?</button>\s*<button.*?title="Inserir imagem".*?</button>\s*(.*?)\s*</div>', r'<div className="flex flex-col gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">\n\1\n</div>', text, flags=re.DOTALL)

    text = re.sub(r'const handleEquationInsert = \(field, idx = null\) => \{.*?^\s*};\n', r'''const handleEquationInsert = () => {
        const eq = prompt('Digite a equacao LaTeX (sem $$):');
        if (eq) document.execCommand('insertHTML', false, '<span>$$' + eq + '$$</span>&nbsp;');
    };
''', text, flags=re.DOTALL | re.MULTILINE)

    text = re.sub(r'const handleImageUpload = \(field, idx = null\) => \{.*?^\s*};\n', r'''const handleImageUpload = () => {
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
''', text, flags=re.DOTALL | re.MULTILINE)

    if 'window.' not in text[-50:]:
        basename = f.split('/')[-1].split('.')[0]
        component_name = ''.join(word.title() for word in basename.split('-'))
        text += f'\nwindow.{component_name} = {component_name};\n'

    open(f, 'w', encoding='utf-8').write(text)

refactor_file('components/create-question-modal.jsx')
refactor_file('components/edit-question-modal.jsx')
print("Done!")

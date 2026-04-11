import re

def fix_jsx(f):
    text = open(f, 'r', encoding='utf-8').read()

    # 1. ENUNCIADO
    text = re.sub(
        r'<RichTextToolbar.*?</button>\s*</div>\s*</div>\s*<RichTextToolbar.*?/>',
        '<RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />',
        text, flags=re.DOTALL
    )
    
    # 1.5 The extra buttons are above RichTextToolbar, let's remove them
    text = re.sub(
        r'<div className="flex items-center gap-1">\s*<button type="button" onClick={\(\) => handleEquationInsert\(\'enunciado\'\).*?</button>\s*<button type="button" onClick={\(\) => handleImageUpload\(\'enunciado\'\).*?</button>\s*</div>',
        '',
        text, flags=re.DOTALL
    )
    text = re.sub(
        r'<div className="flex items-center gap-1">\s*<button type="button" onClick={\(\) => handleEquationInsert\(\'adapted_enunciado\'\).*?</button>\s*<button type="button" onClick={\(\) => handleImageUpload\(\'adapted_enunciado\'\).*?</button>\s*</div>',
        '',
        text, flags=re.DOTALL
    )

    # Convert textareas to VisualEditor
    text = re.sub(
        r'<textarea\s*ref=\{enunciadoRef\}\s*value=\{form\.enunciado\}\s*onChange=\{\(e\) => update\(\'enunciado\', e\.target\.value\)\}.*?/>',
        '<VisualEditor forwardedRef={enunciadoRef} value={form.enunciado} onChange={(v) => update(\'enunciado\', v)} placeholder="Digite o enunciado aqui..." className={`w-full max-h-[400px] overflow-y-auto bg-gray-50/50 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all ${errors.enunciado ? "border-rose-300 bg-rose-50/50" : "border-gray-200"}`} />',
        text, flags=re.DOTALL
    )

    text = re.sub(
        r'<textarea\s*ref=\{adaptedEnunciadoRef\}[\s\S]*?className=\{`w-full.*?/>',
        '<VisualEditor forwardedRef={adaptedEnunciadoRef} value={adaptedForm.enunciado} onChange={(v) => { if(typeof setAdaptedForm === "function") setAdaptedForm(p => ({...p, enunciado: v})); else updateAdapted("enunciado", v); }} placeholder="Digite o enunciado adaptado aqui..." className={`w-full max-h-[400px] overflow-y-auto bg-sky-50/30 border rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500 transition-all ${errors.adaptedEnunciado ? "border-rose-300 bg-rose-50/50" : "border-sky-200/60"}`} />',
        text, flags=re.DOTALL
    )

    # 2. ALTERNATIVAS
    text = re.sub(
        r'<RichTextToolbar\s*textareaRef=\{\{ current: alternativasRefs\.current\[idx\] \}\}.*?/>',
        '<RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />',
        text, flags=re.DOTALL
    )

    text = re.sub(
        r'<RichTextToolbar\s*textareaRef=\{\{ current: adaptedAlternativasRefs\.current\[idx\] \}\}.*?/>',
        '<RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />',
        text, flags=re.DOTALL
    )

    text = re.sub(
        r'<textarea\s*ref=\{\(el\) => alternativasRefs\.current\[idx\] = el\}[\s\S]*?/>',
        '',  # We already have <VisualEditor ... /> right after it in the file! I saw it! Wait, let me just remove it!
        text, flags=re.DOTALL
    )
    
    text = re.sub(
        r'<textarea\s*ref=\{\(el\) => adaptedAlternativasRefs\.current\[idx\] = el\}[\s\S]*?/>',
        '',
        text, flags=re.DOTALL
    )

    # Fix the RichTextToolbar props that were incorrectly replaced earlier
    text = re.sub(
        r'<RichTextToolbar value=\{form\.enunciado\} onChange=\{\(v\) => update\(\'enunciado\', v\)\} onEquation=\{\(\) => handleEquationInsert\(\'enunciado\'\)\} onImage=\{\(\) => handleImageUpload\(\'enunciado\'\)\} />',
        '<RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />',
        text, flags=re.DOTALL
    )
    text = re.sub(
        r'<RichTextToolbar value=\{adaptedForm\.enunciado\}.*?/>',
        '<RichTextToolbar onEquation={handleEquationInsert} onImage={handleImageUpload} />',
        text, flags=re.DOTALL
    )

    if 'window.' not in text[-50:]:
        basename = f.split('/')[-1].split('.')[0]
        component_name = ''.join(word.title() for word in basename.split('-'))
        text += f'\nwindow.{component_name} = {component_name};\n'

    open(f, 'w', encoding='utf-8').write(text)

fix_jsx('components/create-question-modal.jsx')
fix_jsx('components/edit-question-modal.jsx')
print("Fixed JSX!")

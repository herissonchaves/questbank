import re

def fix(f):
    text = open(f, 'r', encoding='utf-8').read()

    # 1. Substitute handleEquationInsert
    text = re.sub(
        r'const handleEquationInsert = \(.*?\).*?^\s*};\n',
        '''const handleEquationInsert = () => {
        const eq = prompt('Digite a equacao LaTeX (sem $$):');
        if (eq) document.execCommand('insertHTML', false, '<span>$$' + eq + '$$</span>&nbsp;');
    };\n''',
        text, flags=re.DOTALL | re.MULTILINE
    )

    # 2. Substitute handleImageUpload
    text = re.sub(
        r'const handleImageUpload = \(.*?\).*?^\s*};\n',
        '''const handleImageUpload = () => {
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
    };\n''',
        text, flags=re.DOTALL | re.MULTILINE
    )

    open(f, 'w', encoding='utf-8').write(text)

fix('components/create-question-modal.jsx')
fix('components/edit-question-modal.jsx')
print('Fixed handlers!')

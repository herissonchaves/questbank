// QuestBank — Geradores de Exportação (Word e LaTeX com Parser Math)

window.ExportEngines = {
    // Helper para converter SVG do MathJax para PNG Base64
    async svgToPng(svgElement) {
        return new Promise((resolve) => {
            const svgString = new XMLSerializer().serializeToString(svgElement);
            const cleanSvg = svgString.includes('xmlns="http://www.w3.org/2000/svg"') 
                ? svgString 
                : svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
            const blob = new Blob([cleanSvg], {type: 'image/svg+xml;charset=utf-8'});
            const URL = window.URL || window.webkitURL || window;
            const blobURL = URL.createObjectURL(blob);
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                const scale = 3; // Alta resolução
                canvas.width = image.width * scale;
                canvas.height = image.height * scale;
                const context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(blobURL);
                resolve({
                    data: canvas.toDataURL('image/png'),
                    width: image.width,
                    height: image.height
                });
            };
            image.src = blobURL;
        });
    },

    // Processador de textos mesclados (MathJax + Imagens Inline)
    async processMixedContent(text, imagesArray, TextRun, ImageRun) {
        let cleanText = text.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '');
        const parts = cleanText.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\[IMAGEM_\d+\])/g);
        const runs = [];
        
        const processStrBase64 = (b) => {
            const d = b.split(',')[1];
            const bs = atob(d);
            const arr = new Uint8Array(bs.length);
            for(let i=0; i<bs.length; i++) arr[i] = bs.charCodeAt(i);
            return arr;
        };

        for (const part of parts) {
            if (!part) continue;
            if (part.startsWith('[IMAGEM_')) {
                const match = part.match(/\[IMAGEM_(\d+)\]/);
                if (match && imagesArray && imagesArray[match[1]]) {
                    runs.push(new ImageRun({
                        data: processStrBase64(imagesArray[match[1]]),
                        transformation: { width: 350, height: 250 },
                    }));
                }
            } else if (part.startsWith('$$') || part.startsWith('$')) {
                const isDisplay = part.startsWith('$$');
                const tex = isDisplay ? part.slice(2, -2) : part.slice(1, -1);
                if (window.MathJax && window.MathJaxLoaded) {
                    try {
                        const container = window.MathJax.tex2svg(tex, {display: isDisplay});
                        const svg = container.querySelector('svg');
                        if (svg) {
                            const pngData = await this.svgToPng(svg);
                            runs.push(new ImageRun({
                                data: processStrBase64(pngData.data),
                                transformation: { width: pngData.width*0.3, height: pngData.height*0.3 }
                            }));
                        } else {
                            runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
                        }
                    } catch(e) {
                         runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
                    }
                } else {
                    runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
                }
            } else {
                runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
            }
        }
        return runs;
    },

    // Motor LaTeX
    async generateLatex(questions, cfg) {
        let texDocs = `\\documentclass[12pt]{article}\n\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n\\usepackage{graphicx}\n\\usepackage[margin=2cm]{geometry}\n\n\\begin{document}\n\n\\begin{center}\n    {\\Large \\textbf{${cfg.instituicao || ''}}} \\\\[0.5cm]\n    {\\huge \\textbf{${cfg.titulo || 'Prova'}}} \\\\[0.5cm]\n`;
        if (cfg.professor) texDocs += `    Prof.: ${cfg.professor} \\\\ \n`;
        if (cfg.data) texDocs += `    Data: ${cfg.data} \\\\ \n`;
        texDocs += `\\end{center}\n\\vspace{1cm}\nNome: \\hrulefill \\quad Turma: \\_\\_\\_\n\\vspace{1cm}\n\\hrule\n\\vspace{1cm}\n\n\\begin{enumerate}\n`;

        const zip = new JSZip();
        let imgCounter = 0;

        for (const q of questions) {
            let texto = q.enunciado.replace(/<br\s*\/?>/g, '\\\\').replace(/<[^>]*>/g, '');
            let mapImgToName = {};
            
            if (q.imagens && q.imagens.length > 0) {
                for (let i=0; i<q.imagens.length; i++) {
                    imgCounter++;
                    const imgName = `img_${imgCounter}.png`;
                    mapImgToName[i] = imgName;
                    const base64Data = q.imagens[i].split(',')[1];
                    zip.file(imgName, base64Data, {base64: true});
                }
            }

            texto = texto.replace(/\[IMAGEM_(\d+)\]/g, (match, p1) => {
                const index = parseInt(p1);
                if(mapImgToName[index]) {
                    return `\\begin{center}\n\\includegraphics[width=0.7\\linewidth]{${mapImgToName[index]}}\n\\end{center}`;
                }
                return match;
            });
            texDocs += `\\item ${texto}\n`;

            if (q.imagens && q.imagens.length > 0) {
                for (let i=0; i<q.imagens.length; i++) {
                    if (!texto.includes(mapImgToName[i])) {
                        texDocs += `\\begin{center}\n\\includegraphics[width=0.7\\linewidth]{${mapImgToName[i]}}\n\\end{center}\n`;
                    }
                }
            }

            const isObjective = q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';
            if (isObjective && q.alternativas) {
                texDocs += `\\begin{itemize}\n`;
                for (const alt of q.alternativas) {
                    let altText = alt.texto.replace(/<[^>]*>/g, '');
                    texDocs += `  \\item[${alt.letra})] ${altText}\n`;
                }
                texDocs += `\\end{itemize}\n`;
            } else if (q.tipo === 'discursiva') {
                const numLines = cfg.linhas_discursiva || 5;
                texDocs += `\\vspace{0.5cm}\n`;
                for(let k=0; k<numLines; k++) texDocs += `\\hrulefill \\\\[0.5cm]\n`;
            }
            texDocs += `\\vspace{0.5cm}\n`;
        }

        texDocs += `\\end{enumerate}\n`;
        
        if (cfg.incluir_gabarito) {
            texDocs += `\\newpage\n\\begin{center}{\\Large \\textbf{Gabarito}}\\end{center}\n\\vspace{0.5em}\n\\begin{enumerate}\n`;
            for (const q of questions) {
                texDocs += `\\item ${q.gabarito || '-'}\n`;
            }
            texDocs += `\\end{enumerate}\n`;
        }
        texDocs += `\\end{document}`;

        zip.file('prova.tex', texDocs);
        const content = await zip.generateAsync({type: "blob"});
        saveAs(content, `${(cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase()}_latex.zip`);
    },

    // Motor DOCX
    async generateDocx(questions, cfg) {
        const { Document, Packer, Paragraph, TextRun, AlignmentType, BorderStyle, ImageRun } = docx;
        const children = [];

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
                const parts = cfg.data.split('-');
                if(parts.length === 3) infoTexts.push(`Data: ${parts[2]}/${parts[1]}/${parts[0]}`);
                else infoTexts.push(`Data: ${cfg.data}`);
            }
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
                children: [new TextRun({ text: infoTexts.join('    |    '), size: 20, font: 'Arial', color: '555555' })],
            }));
        }

        children.push(new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [
                new TextRun({ text: 'Nome: _____________________________________________   Turma: ________', size: 22, font: 'Arial' }),
            ],
        }));

        children.push(new Paragraph({
            spacing: { before: 100, after: 300 },
            border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
            children: [],
        }));

        for (let idx = 0; idx < questions.length; idx++) {
            const q = questions[idx];
            const isObjective = q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';

            const enunciadoRuns = await this.processMixedContent(q.enunciado, q.imagens || [], TextRun, ImageRun);
            
            children.push(new Paragraph({
                spacing: { before: 250, after: 120 },
                children: [
                    new TextRun({ text: `${idx + 1}) `, bold: true, size: 22, font: 'Arial' }),
                    ...enunciadoRuns
                ],
            }));

            if (q.imagens && q.imagens.length > 0) {
                for (let i = 0; i < q.imagens.length; i++) {
                    if (!(q.enunciado || '').includes(`[IMAGEM_${i}]`)) {
                        try {
                            const base64Match = q.imagens[i].match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
                            if (base64Match) {
                                const base64Data = base64Match[2];
                                const binaryString = atob(base64Data);
                                const bytes = new Uint8Array(binaryString.length);
                                for (let j = 0; j < binaryString.length; j++) bytes[j] = binaryString.charCodeAt(j);
                                children.push(new Paragraph({
                                    spacing: { before: 100, after: 100 },
                                    children: [new ImageRun({ data: bytes, transformation: { width: 400, height: 300 } })],
                                }));
                            }
                        } catch(e) { }
                    }
                }
            }

            if (isObjective && q.alternativas && q.alternativas.length > 0) {
                for (const alt of q.alternativas) {
                    const altRuns = await this.processMixedContent(alt.texto, q.imagens || [], TextRun, ImageRun);
                    children.push(new Paragraph({
                        spacing: { before: 40, after: 40 },
                        indent: { left: 400 },
                        children: [
                            new TextRun({ text: `${alt.letra}) `, bold: true, size: 22, font: 'Arial' }),
                            ...altRuns
                        ],
                    }));
                }
            }

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

        if (cfg.incluir_gabarito) {
            const objectiveQs = questions.filter(q => q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria');
            if (objectiveQs.length > 0) {
                children.push(new Paragraph({
                    pageBreakBefore: true,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [new TextRun({ text: 'GABARITO', bold: true, size: 28, font: 'Arial' })],
                }));

                questions.forEach((q, i) => {
                    if (q.gabarito) {
                        children.push(new Paragraph({
                            spacing: { before: 60, after: 60 },
                            children: [
                                new TextRun({ text: `${i + 1}) `, bold: true, size: 22, font: 'Arial' }),
                                new TextRun({ text: String(q.gabarito), size: 22, font: 'Arial' }),
                            ],
                        }));
                    }
                });
            }
        }

        const doc = new Document({
            sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children }],
        });

        const blob = await Packer.toBlob(doc);
        const filename = `${(cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase()}.docx`;
        saveAs(blob, filename);
    }
};

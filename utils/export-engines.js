// QuestBank — Geradores de Exportacao (Word e LaTeX com Parser Math)

window.ExportEngines = {
    // Helper para converter SVG do MathJax para PNG Base64
    async svgToPng(svgElement) {
        return new Promise(function(resolve) {
            var svgString = new XMLSerializer().serializeToString(svgElement);
            var cleanSvg = svgString.includes('xmlns="http://www.w3.org/2000/svg"')
                ? svgString
                : svgString.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
            var blob = new Blob([cleanSvg], {type: 'image/svg+xml;charset=utf-8'});
            var urlApi = window.URL || window.webkitURL || window;
            var blobURL = urlApi.createObjectURL(blob);
            var image = new Image();
            image.onload = function() {
                var canvas = document.createElement('canvas');
                var scale = 3;
                canvas.width = image.width * scale;
                canvas.height = image.height * scale;
                var context = canvas.getContext('2d');
                context.drawImage(image, 0, 0, canvas.width, canvas.height);
                urlApi.revokeObjectURL(blobURL);
                resolve({
                    data: canvas.toDataURL('image/png'),
                    width: image.width,
                    height: image.height
                });
            };
            image.src = blobURL;
        });
    },

    // Processador de textos mesclados (Equacoes Nativas + Imagens Inline)
    async processMixedContent(text, imagesArray, TextRun, ImageRun) {
        var cleanText = text.replace(/<br\s*\/?>/g, '\n').replace(/<[^>]*>/g, '');
        var parts = cleanText.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\[IMAGEM_\d+\])/g);
        var runs = [];
        var useNativeMath = window.LatexToDocxMath && window.LatexToDocxMath.isSupported(docx);

        var processStrBase64 = function(b) {
            var d = b.split(',')[1];
            var bs = atob(d);
            var arr = new Uint8Array(bs.length);
            for (var i = 0; i < bs.length; i++) arr[i] = bs.charCodeAt(i);
            return arr;
        };

        for (var pi = 0; pi < parts.length; pi++) {
            var part = parts[pi];
            if (!part) continue;

            if (part.startsWith('[IMAGEM_')) {
                var imgMatch = part.match(/\[IMAGEM_(\d+)\]/);
                if (imgMatch && imagesArray && imagesArray[imgMatch[1]]) {
                    runs.push(new ImageRun({
                        data: processStrBase64(imagesArray[imgMatch[1]]),
                        transformation: { width: 350, height: 250 }
                    }));
                }
            } else if (part.startsWith('$$') || part.startsWith('$')) {
                var isDisplay = part.startsWith('$$');
                var tex = isDisplay ? part.slice(2, -2) : part.slice(1, -1);

                if (useNativeMath) {
                    try {
                        var mathObj = window.LatexToDocxMath.convert(tex, docx);
                        runs.push(mathObj);
                    } catch (e) {
                        console.warn('Fallback para texto na equacao:', tex, e);
                        runs.push(new TextRun({ text: tex, font: 'Cambria Math', size: 22, italics: true }));
                    }
                } else if (window.MathJax && window.MathJaxLoaded) {
                    try {
                        var container = window.MathJax.tex2svg(tex, {display: isDisplay});
                        var svg = container.querySelector('svg');
                        if (svg) {
                            var pngData = await this.svgToPng(svg);
                            runs.push(new ImageRun({
                                data: processStrBase64(pngData.data),
                                transformation: { width: pngData.width * 0.3, height: pngData.height * 0.3 }
                            }));
                        } else {
                            runs.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
                        }
                    } catch (e) {
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
        var title = cfg.titulo || 'Prova';
        var inst = cfg.instituicao || '';
        var t = '\\documentclass[12pt]{article}\n';
        t += '\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n';
        t += '\\usepackage{graphicx}\n\\usepackage[margin=2cm]{geometry}\n\n';
        t += '\\begin{document}\n\n\\begin{center}\n';
        t += '    {\\Large \\textbf{' + inst + '}} \\\\[0.5cm]\n';
        t += '    {\\huge \\textbf{' + title + '}} \\\\[0.5cm]\n';
        if (cfg.professor) t += '    Prof.: ' + cfg.professor + ' \\\\ \n';
        if (cfg.data) t += '    Data: ' + cfg.data + ' \\\\ \n';
        t += '\\end{center}\n\\vspace{1cm}\n';
        t += 'Nome: \\hrulefill \\quad Turma: \\_\\_\\_\n';
        t += '\\vspace{1cm}\n\\hrule\n\\vspace{1cm}\n\n\\begin{enumerate}\n';

        var zip = new JSZip();
        var imgCounter = 0;

        for (var qi = 0; qi < questions.length; qi++) {
            var q = questions[qi];
            var texto = q.enunciado.replace(/<br\s*\/?>/g, '\\\\').replace(/<[^>]*>/g, '');
            var mapImgToName = {};

            if (q.imagens && q.imagens.length > 0) {
                for (var ii = 0; ii < q.imagens.length; ii++) {
                    imgCounter++;
                    var imgName = 'img_' + imgCounter + '.png';
                    mapImgToName[ii] = imgName;
                    var b64 = q.imagens[ii].split(',')[1];
                    zip.file(imgName, b64, {base64: true});
                }
            }

            texto = texto.replace(/\[IMAGEM_(\d+)\]/g, function(match, p1) {
                var index = parseInt(p1);
                if (mapImgToName[index]) {
                    return '\\begin{center}\n\\includegraphics[width=0.7\\linewidth]{' + mapImgToName[index] + '}\n\\end{center}';
                }
                return match;
            });
            t += '\\item ' + texto + '\n';

            if (q.imagens && q.imagens.length > 0) {
                for (var ij = 0; ij < q.imagens.length; ij++) {
                    if (!texto.includes(mapImgToName[ij])) {
                        t += '\\begin{center}\n\\includegraphics[width=0.7\\linewidth]{' + mapImgToName[ij] + '}\n\\end{center}\n';
                    }
                }
            }

            var isObj = q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';
            if (isObj && q.alternativas) {
                t += '\\begin{itemize}\n';
                for (var ai = 0; ai < q.alternativas.length; ai++) {
                    var altTxt = q.alternativas[ai].texto.replace(/<[^>]*>/g, '');
                    t += '  \\item[' + q.alternativas[ai].letra + ')] ' + altTxt + '\n';
                }
                t += '\\end{itemize}\n';
            } else if (q.tipo === 'discursiva') {
                var nl = cfg.linhas_discursiva || 5;
                t += '\\vspace{0.5cm}\n';
                for (var k = 0; k < nl; k++) t += '\\hrulefill \\\\[0.5cm]\n';
            }
            t += '\\vspace{0.5cm}\n';
        }

        t += '\\end{enumerate}\n';
        if (cfg.incluir_gabarito) {
            t += '\\newpage\n\\begin{center}{\\Large \\textbf{Gabarito}}\\end{center}\n';
            t += '\\vspace{0.5em}\n\\begin{enumerate}\n';
            for (var gi = 0; gi < questions.length; gi++) {
                t += '\\item ' + (questions[gi].gabarito || '-') + '\n';
            }
            t += '\\end{enumerate}\n';
        }
        t += '\\end{document}';

        zip.file('prova.tex', t);
        var content = await zip.generateAsync({type: 'blob'});
        var zipName = (cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase() + '_latex.zip';
        saveAs(content, zipName);
    },

    // Motor DOCX
    async generateDocx(questions, cfg) {
        var D = docx;
        var Document = D.Document, Packer = D.Packer, Paragraph = D.Paragraph;
        var TextRun = D.TextRun, AlignmentType = D.AlignmentType;
        var BorderStyle = D.BorderStyle, ImageRun = D.ImageRun;
        var children = [];

        children.push(new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 100 },
            children: [new TextRun({ text: cfg.instituicao || '', bold: true, size: 24, font: 'Arial' })]
        }));
        children.push(new Paragraph({
            alignment: AlignmentType.CENTER, spacing: { after: 100 },
            children: [new TextRun({ text: cfg.titulo || 'Prova', bold: true, size: 28, font: 'Arial' })]
        }));

        if (cfg.professor || cfg.data) {
            var infoTexts = [];
            if (cfg.professor) infoTexts.push('Prof.: ' + cfg.professor);
            if (cfg.data) {
                var dp = cfg.data.split('-');
                if (dp.length === 3) infoTexts.push('Data: ' + dp[2] + '/' + dp[1] + '/' + dp[0]);
                else infoTexts.push('Data: ' + cfg.data);
            }
            children.push(new Paragraph({
                alignment: AlignmentType.CENTER, spacing: { after: 200 },
                children: [new TextRun({ text: infoTexts.join('    |    '), size: 20, font: 'Arial', color: '555555' })]
            }));
        }

        children.push(new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: 'Nome: _____________________________________________   Turma: ________', size: 22, font: 'Arial' })]
        }));
        children.push(new Paragraph({
            spacing: { before: 100, after: 300 },
            border: { bottom: { color: '000000', space: 1, style: BorderStyle.SINGLE, size: 6 } },
            children: []
        }));

        for (var idx = 0; idx < questions.length; idx++) {
            var q = questions[idx];
            var isObj = q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';
            var enunciadoRuns = await this.processMixedContent(q.enunciado, q.imagens || [], TextRun, ImageRun);

            children.push(new Paragraph({
                spacing: { before: 250, after: 120 },
                children: [new TextRun({ text: (idx + 1) + ') ', bold: true, size: 22, font: 'Arial' })].concat(enunciadoRuns)
            }));

            if (q.imagens && q.imagens.length > 0) {
                for (var im = 0; im < q.imagens.length; im++) {
                    if (!(q.enunciado || '').includes('[IMAGEM_' + im + ']')) {
                        try {
                            var b64m = q.imagens[im].match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
                            if (b64m) {
                                var binStr = atob(b64m[2]);
                                var bytes = new Uint8Array(binStr.length);
                                for (var bj = 0; bj < binStr.length; bj++) bytes[bj] = binStr.charCodeAt(bj);
                                children.push(new Paragraph({
                                    spacing: { before: 100, after: 100 },
                                    children: [new ImageRun({ data: bytes, transformation: { width: 400, height: 300 } })]
                                }));
                            }
                        } catch (e) { }
                    }
                }
            }

            if (isObj && q.alternativas && q.alternativas.length > 0) {
                for (var ai = 0; ai < q.alternativas.length; ai++) {
                    var alt = q.alternativas[ai];
                    var altRuns = await this.processMixedContent(alt.texto, q.imagens || [], TextRun, ImageRun);
                    children.push(new Paragraph({
                        spacing: { before: 40, after: 40 }, indent: { left: 400 },
                        children: [new TextRun({ text: alt.letra + ') ', bold: true, size: 22, font: 'Arial' })].concat(altRuns)
                    }));
                }
            }

            if (q.tipo === 'discursiva') {
                var nLines = cfg.linhas_discursiva || 5;
                for (var li = 0; li < nLines; li++) {
                    children.push(new Paragraph({
                        spacing: { before: 200 },
                        border: { bottom: { color: 'AAAAAA', space: 1, style: BorderStyle.SINGLE, size: 4 } },
                        children: [new TextRun({ text: ' ', size: 22 })]
                    }));
                }
            }
        }

        if (cfg.incluir_gabarito) {
            var hasObj = questions.some(function(q) {
                return q.tipo === 'objetiva' || q.tipo === 'v_f' || q.tipo === 'somatoria';
            });
            if (hasObj) {
                children.push(new Paragraph({
                    pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 300 },
                    children: [new TextRun({ text: 'GABARITO', bold: true, size: 28, font: 'Arial' })]
                }));
                for (var gi = 0; gi < questions.length; gi++) {
                    if (questions[gi].gabarito) {
                        children.push(new Paragraph({
                            spacing: { before: 60, after: 60 },
                            children: [
                                new TextRun({ text: (gi + 1) + ') ', bold: true, size: 22, font: 'Arial' }),
                                new TextRun({ text: String(questions[gi].gabarito), size: 22, font: 'Arial' })
                            ]
                        }));
                    }
                }
            }
        }

        var doc = new Document({
            sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: children }]
        });
        var blob = await Packer.toBlob(doc);
        var filename = (cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase() + '.docx';
        saveAs(blob, filename);
    }
};

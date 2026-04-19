// QuestBank — Geradores de Exportacao (Word e LaTeX com Parser Math)
// v2.1 — Fixes: alignment export, font size from <font> tags, paragraph splitting

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

    // Helper: detect alignment from a DOM node's style
    _getAlignment(node) {
        if (!node || !node.style) return null;
        var ta = node.style.textAlign || '';
        if (ta === 'center') return 'CENTER';
        if (ta === 'right') return 'RIGHT';
        if (ta === 'justify') return 'BOTH';
        if (ta === 'left') return 'LEFT';
        // Also check align attribute (older HTML)
        var align = node.getAttribute && node.getAttribute('align');
        if (align === 'center') return 'CENTER';
        if (align === 'right') return 'RIGHT';
        if (align === 'justify') return 'BOTH';
        return null;
    },

    // Helper: get font size from <font size="X"> or style.fontSize
    _getFontSize(node, currentSize) {
        if (!node) return currentSize;
        var tag = node.tagName ? node.tagName.toLowerCase() : '';
        // <font size="X"> — values 1-7 from execCommand('fontSize')
        if (tag === 'font') {
            var sizeAttr = node.getAttribute('size');
            if (sizeAttr) {
                var sizeMap = { '1': 16, '2': 18, '3': 22, '4': 26, '5': 32, '6': 40, '7': 48 };
                return sizeMap[sizeAttr] || currentSize;
            }
        }
        // Inline style fontSize
        if (node.style && node.style.fontSize) {
            var fs = node.style.fontSize;
            // px values
            if (fs.endsWith('px')) {
                var px = parseInt(fs);
                // Convert px to half-points (docx uses half-points): 1pt = 2 half-points, 1px ≈ 0.75pt
                return Math.round(px * 1.5);
            }
            // pt values
            if (fs.endsWith('pt')) {
                return Math.round(parseFloat(fs) * 2);
            }
        }
        return currentSize;
    },

    // Helper: process base64 string to Uint8Array
    _processBase64(b) {
        if (!b) return null;
        var d = b.split(',')[1];
        if (!d) return null;
        var bs = atob(d);
        var arr = new Uint8Array(bs.length);
        for (var i = 0; i < bs.length; i++) arr[i] = bs.charCodeAt(i);
        return arr;
    },

    // ── NEW: Process HTML into paragraph groups with alignment ──
    // Returns: [{ alignment: 'LEFT'|'CENTER'|'RIGHT'|'BOTH'|null, runs: [...] }, ...]
    async processMixedContentWithParagraphs(htmlText, imagesArray, TextRun, ImageRun) {
        var self = this;
        var parser = new DOMParser();
        var doc = parser.parseFromString(htmlText || '', 'text/html');
        var useNativeMath = window.LatexToDocxMath && window.LatexToDocxMath.isSupported(docx);

        // Result: array of paragraph groups
        var paragraphs = [];
        var currentRuns = [];
        var currentAlignment = null;

        var flushParagraph = function(alignment) {
            if (currentRuns.length > 0) {
                paragraphs.push({ alignment: currentAlignment, runs: currentRuns });
                currentRuns = [];
            }
            currentAlignment = alignment || null;
        };

        var processTextNode = async function(text, style) {
            if (text === '') return;

            var parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$|\[IMAGEM_\d+\])/g);
            for (var pi = 0; pi < parts.length; pi++) {
                var part = parts[pi];
                if (!part) continue;

                if (part.startsWith('[IMAGEM_')) {
                    var imgMatch = part.match(/\[IMAGEM_(\d+)\]/);
                    if (imgMatch && imagesArray && imagesArray[imgMatch[1]]) {
                        var b64str = imagesArray[imgMatch[1]];
                        var data = self._processBase64(b64str);
                        if (data) {
                            var imgObj = new Image();
                            if (b64str.startsWith('data:image')) {
                                imgObj.src = b64str;
                            } else {
                                imgObj.src = 'data:image/png;base64,' + (b64str.includes(',') ? b64str.split(',')[1] : b64str);
                            }
                            await new Promise(function(resolve) {
                                imgObj.onload = resolve;
                                imgObj.onerror = resolve;
                            });

                            var w = 100;
                            var h = 100;
                            if (imgObj.naturalWidth) {
                                h = Math.round(w * (imgObj.naturalHeight / imgObj.naturalWidth));
                            } else {
                                h = Math.round(w * 0.7);
                            }

                            currentRuns.push(new ImageRun({
                                data: data,
                                transformation: { width: w, height: h }
                            }));
                        }
                    }
                } else if (part.startsWith('$$') || part.startsWith('$')) {
                    var isDisplay = part.startsWith('$$');
                    var tex = isDisplay ? part.slice(2, -2) : part.slice(1, -1);
                    if (useNativeMath) {
                        try {
                            var mathObj = window.LatexToDocxMath.convert(tex, docx);
                            currentRuns.push(mathObj);
                        } catch (e) {
                            currentRuns.push(new TextRun({ text: tex, font: 'Cambria Math', size: 22, italics: true }));
                        }
                    } else {
                        currentRuns.push(new TextRun({ text: part, font: 'Arial', size: 22 }));
                    }
                } else {
                    currentRuns.push(new TextRun({
                        text: part,
                        font: 'Arial',
                        size: style.size || 22,
                        bold: style.bold,
                        italics: style.italics,
                        underline: style.underline ? {} : undefined,
                        superScript: style.superscript,
                        subScript: style.subscript,
                    }));
                }
            }
        };

        var traverse = async function(node, style, parentAlignment) {
            if (node.nodeType === Node.TEXT_NODE) {
                await processTextNode(node.textContent, style);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                var tag = node.tagName.toLowerCase();

                if (tag === 'br') {
                    currentRuns.push(new TextRun({ break: 1 }));
                    return;
                }

                // Block-level elements: div, p — start new paragraph if they have alignment
                if (tag === 'div' || tag === 'p') {
                    var blockAlign = self._getAlignment(node) || parentAlignment;

                    // If there are runs before this block, flush them
                    if (node.previousSibling && currentRuns.length > 0) {
                        flushParagraph(blockAlign);
                    }
                    // Set alignment for this block
                    currentAlignment = blockAlign;

                    // Process children
                    var newStyle = Object.assign({}, style);
                    newStyle.size = self._getFontSize(node, style.size);

                    for (var i = 0; i < node.childNodes.length; i++) {
                        await traverse(node.childNodes[i], newStyle, blockAlign);
                    }

                    // After block, flush to new paragraph
                    if (currentRuns.length > 0) {
                        flushParagraph(null);
                    }
                    return;
                }

                // Image
                if (tag === 'img') {
                    var src = node.getAttribute('src');
                    if (src && src.startsWith('data:image')) {
                        var imgData = self._processBase64(src);
                        if (imgData) {
                            var width = 350, height = 250;
                            var dw = node.getAttribute('data-width');
                            var dh = node.getAttribute('data-height');
                            if (dw && dh) {
                                width = parseInt(dw);
                                height = parseInt(dh);
                            } else if (node.style && node.style.width && node.style.width.endsWith('px')) {
                                width = parseInt(node.style.width);
                                height = (node.style.height && node.style.height.endsWith('px'))
                                    ? parseInt(node.style.height) : null;
                            } else if (node.getAttribute('width')) {
                                width = parseInt(node.getAttribute('width'));
                                height = node.getAttribute('height') ? parseInt(node.getAttribute('height')) : null;
                            }
                            
                            if (!height || (!width && !height)) {
                                var imgObj = new Image();
                                imgObj.src = src;
                                await new Promise(function(resolve) {
                                    imgObj.onload = resolve;
                                    imgObj.onerror = resolve;
                                });
                                if (width && !height) {
                                    if (imgObj.naturalWidth) {
                                        height = Math.round(width * (imgObj.naturalHeight / imgObj.naturalWidth));
                                    } else {
                                        height = Math.round(width * 0.7);
                                    }
                                } else if (!width && height) {
                                    if (imgObj.naturalHeight) {
                                        width = Math.round(height * (imgObj.naturalWidth / imgObj.naturalHeight));
                                    } else {
                                        width = Math.round(height * 1.4);
                                    }
                                } else {
                                    width = imgObj.naturalWidth || 350;
                                    height = imgObj.naturalHeight || 250;
                                }
                            }

                            if (width > 550) { height = Math.round(height * (550 / width)); width = 550; }
                            if (height > 700) { width = Math.round(width * (700 / height)); height = 700; }
                            currentRuns.push(new ImageRun({
                                data: imgData,
                                transformation: { width: width, height: height }
                            }));
                        }
                    }
                    return;
                }

                // Inline elements: b, i, u, font, sub, sup, span, etc.
                var newStyle = Object.assign({}, style);
                if (tag === 'b' || tag === 'strong') newStyle.bold = true;
                if (tag === 'i' || tag === 'em') newStyle.italics = true;
                if (tag === 'u') newStyle.underline = true;
                if (tag === 'sup') newStyle.superscript = true;
                if (tag === 'sub') newStyle.subscript = true;
                newStyle.size = self._getFontSize(node, style.size);

                // Check for alignment on span/other inline (rare but possible)
                var inlineAlign = self._getAlignment(node);
                if (inlineAlign) currentAlignment = inlineAlign;

                for (var i = 0; i < node.childNodes.length; i++) {
                    await traverse(node.childNodes[i], newStyle, parentAlignment);
                }
            }
        };

        for (var idx = 0; idx < doc.body.childNodes.length; idx++) {
            await traverse(doc.body.childNodes[idx], { size: 22 }, null);
        }

        // Flush any remaining runs
        if (currentRuns.length > 0) {
            paragraphs.push({ alignment: currentAlignment, runs: currentRuns });
        }

        // If no paragraphs were created, return a single empty one
        if (paragraphs.length === 0) {
            paragraphs.push({ alignment: null, runs: [] });
        }

        return paragraphs;
    },

    // ── LEGACY: flat runs (used by alternativas where alignment doesn't matter) ──
    async processMixedContent(htmlText, imagesArray, TextRun, ImageRun) {
        var groups = await this.processMixedContentWithParagraphs(htmlText, imagesArray, TextRun, ImageRun);
        var allRuns = [];
        for (var i = 0; i < groups.length; i++) {
            if (i > 0 && groups[i].runs.length > 0) {
                allRuns.push(new TextRun({ break: 1 }));
            }
            allRuns = allRuns.concat(groups[i].runs);
        }
        return allRuns;
    },

    async htmlToLatex(htmlText, zip, imgCounterRef, imagesArray, globalImgObjRef) {
        var processedText = htmlText || '';
        if (imagesArray && imagesArray.length > 0) {
            processedText = processedText.replace(/\[IMAGEM\]/g, function() {
                var current = globalImgObjRef ? globalImgObjRef.idx++ : 0;
                return '[IMAGEM_' + current + ']';
            });
        }
        var parser = new DOMParser();
        var doc = parser.parseFromString(processedText, 'text/html');
        var tex = '';
        var self = this;

        var traverse = function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent;
                if (imagesArray) {
                    text = text.replace(/\[IMAGEM_(\d+)\]/g, function(match, p1) {
                        var index = parseInt(p1);
                        if (imagesArray[index]) {
                            imgCounterRef.current++;
                            var imgName = 'img_leg_' + imgCounterRef.current + '.png';
                            var b64 = imagesArray[index].split(',')[1];
                            zip.file(imgName, b64, {base64: true});
                            return '\\begin{center}\n\\includegraphics[width=0.7\\linewidth]{' + imgName + '}\n\\end{center}\n';
                        }
                        return match;
                    });
                }
                tex += text;
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                var tag = node.tagName.toLowerCase();
                var pre = '';
                var post = '';

                if (tag === 'b' || tag === 'strong') { pre = '\\textbf{'; post = '}'; }
                else if (tag === 'i' || tag === 'em') { pre = '\\textit{'; post = '}'; }
                else if (tag === 'u') { pre = '\\underline{'; post = '}'; }
                else if (tag === 'br') { tex += '\\\\\n'; return; }
                else if (tag === 'div' || tag === 'p') {
                    if (node.previousSibling) tex += '\n\n';
                    // Handle alignment in LaTeX
                    var align = self._getAlignment(node);
                    if (align === 'CENTER') { pre = '\\begin{center}'; post = '\\end{center}'; }
                    else if (align === 'RIGHT') { pre = '\\begin{flushright}'; post = '\\end{flushright}'; }
                    else if (align === 'BOTH') { /* justify is default in LaTeX */ }
                }
                else if (tag === 'img') {
                    var src = node.getAttribute('src');
                    if (src && src.startsWith('data:image')) {
                        imgCounterRef.current++;
                        var imgName = 'img_inline_' + imgCounterRef.current + '.png';
                        var b64 = src.split(',')[1];
                        zip.file(imgName, b64, {base64: true});
                        var imgWidthCm = '';
                        var dw = node.getAttribute('data-width');
                        if (dw) {
                            var pxW = parseInt(dw);
                            var cmW = pxW / 37.8;
                            var frac = Math.min(1.0, Math.max(0.1, cmW / 17)).toFixed(2);
                            imgWidthCm = 'width=' + frac + '\\linewidth';
                        } else {
                            imgWidthCm = 'width=0.7\\linewidth';
                        }
                        tex += '\\begin{center}\n\\includegraphics[' + imgWidthCm + ']{' + imgName + '}\n\\end{center}\n';
                    }
                    return;
                }
                else if (tag === 'sup') { pre = '\\textsuperscript{'; post = '}'; }
                else if (tag === 'sub') { pre = '\\textsubscript{'; post = '}'; }

                tex += pre;
                for (var i = 0; i < node.childNodes.length; i++) {
                    traverse(node.childNodes[i]);
                }
                tex += post;
            }
        };

        for (var idx = 0; idx < doc.body.childNodes.length; idx++) {
            traverse(doc.body.childNodes[idx]);
        }

        return tex;
    },

    // Motor LaTeX
    async generateLatex(questions, cfg) {
        var title = cfg.titulo || 'Prova';
        var inst = cfg.instituicao || '';
        var t = '\\documentclass[12pt]{article}\n';
        t += '\\usepackage[utf8]{inputenc}\n\\usepackage{amsmath}\n';
        t += '\\usepackage{graphicx}\n\\usepackage[margin=2cm]{geometry}\n';
        t += '\\usepackage{fixltx2e}\n\n'; // for \textsubscript
        t += '\\begin{document}\n\n\\begin{center}\n';
        t += '    {\\Large \\textbf{' + inst + '}} \\\\[0.5cm]\n';
        t += '    {\\huge \\textbf{' + title + '}} \\\\[0.5cm]\n';
        if (cfg.professor) t += '    Prof.: ' + cfg.professor + ' \\\\ \n';
        if (cfg.data) t += '    Data: ' + cfg.data + ' \\\\ \n';
        t += '\\end{center}\n\\vspace{1cm}\n';
        t += 'Nome: \\hrulefill \\quad Turma: \\_\\_\\_\n';
        t += '\\vspace{1cm}\n\\hrule\n\\vspace{1cm}\n\n\\begin{enumerate}\n';

        var zip = new JSZip();
        var imgRef = { current: 0 };

        for (var qi = 0; qi < questions.length; qi++) {
            var q = questions[qi];
            var imgObjRef = { idx: 0 };
            var texto = await this.htmlToLatex(q.enunciado, zip, imgRef, q.imagens, imgObjRef);
            t += '\\item ' + texto + '\n';

            var isObj = q.tipo === 'objetiva';
            if (isObj && q.alternativas) {
                t += '\\begin{itemize}\n';
                for (var ai = 0; ai < q.alternativas.length; ai++) {
                    var altTxt = await this.htmlToLatex(q.alternativas[ai].texto, zip, imgRef, q.imagens, imgObjRef);
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

    // ── Motor DOCX (with alignment support + Word auto-numbering) ──
    async generateDocx(questions, cfg) {
        var D = docx;
        var Document = D.Document, Packer = D.Packer, Paragraph = D.Paragraph;
        var TextRun = D.TextRun, AlignmentType = D.AlignmentType;
        var BorderStyle = D.BorderStyle, ImageRun = D.ImageRun;
        var LevelFormat = D.LevelFormat;
        var children = [];

        // Map alignment strings to docx AlignmentType
        var alignMap = {
            'LEFT': AlignmentType.LEFT,
            'CENTER': AlignmentType.CENTER,
            'RIGHT': AlignmentType.RIGHT,
            'BOTH': AlignmentType.BOTH,
        };

        // ── Build numbering config: questions (decimal) + alternatives (upper letter per question) ──
        var numberingConfig = [
            {
                reference: "question-numbering",
                levels: [{
                    level: 0,
                    format: LevelFormat.DECIMAL,
                    text: "%1.",
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: { indent: { left: 720, hanging: 360 } },
                        run: { font: "Arial", size: 22, bold: false }
                    }
                }]
            }
        ];

        // Each question gets its own alternatives numbering reference (so it restarts A, B, C for each)
        for (var ni = 0; ni < questions.length; ni++) {
            numberingConfig.push({
                reference: "alt-numbering-" + ni,
                levels: [{
                    level: 0,
                    format: LevelFormat.UPPER_LETTER,
                    text: "%1)",
                    alignment: AlignmentType.LEFT,
                    style: {
                        paragraph: { indent: { left: 760, hanging: 360 } },
                        run: { font: "Arial", size: 22, bold: false }
                    }
                }]
            });
        }

        // Gabarito numbering
        numberingConfig.push({
            reference: "gabarito-numbering",
            levels: [{
                level: 0,
                format: LevelFormat.DECIMAL,
                text: "%1.",
                alignment: AlignmentType.LEFT,
                style: {
                    paragraph: { indent: { left: 720, hanging: 360 } },
                    run: { font: "Arial", size: 22, bold: false }
                }
            }]
        });

        // ── No header section — questions start directly ──

        for (var idx = 0; idx < questions.length; idx++) {
            var q = questions[idx];
            var isObj = q.tipo === 'objetiva';
            
            var globalImgIdx = 0;
            var prepHTML = function(html) {
                if (!html) return '';
                return html.replace(/\[IMAGEM\]/g, function() {
                    return '[IMAGEM_' + (globalImgIdx++) + ']';
                });
            };
            
            var enunciadoText = prepHTML(q.enunciado);
            
            var alternativasText = [];
            if (isObj && q.alternativas) {
                for (var ai = 0; ai < q.alternativas.length; ai++) {
                    alternativasText.push(prepHTML(q.alternativas[ai].texto));
                }
            }

            // ── Get paragraph groups with alignment for enunciado ──
            var enunciadoGroups = await this.processMixedContentWithParagraphs(enunciadoText, q.imagens || [], TextRun, ImageRun);

            // First paragraph: uses Word auto-numbering (no manual number prefix)
            var firstGroup = enunciadoGroups[0] || { alignment: null, runs: [] };

            children.push(new Paragraph({
                numbering: { reference: "question-numbering", level: 0 },
                spacing: { before: 250, after: 40 },
                alignment: firstGroup.alignment ? alignMap[firstGroup.alignment] : AlignmentType.BOTH,
                children: firstGroup.runs
            }));

            // Remaining paragraphs (continuation of enunciado with different alignment)
            for (var pg = 1; pg < enunciadoGroups.length; pg++) {
                var group = enunciadoGroups[pg];
                if (group.runs.length > 0) {
                    children.push(new Paragraph({
                        spacing: { before: 40, after: 40 },
                        alignment: group.alignment ? alignMap[group.alignment] : undefined,
                        children: group.runs
                    }));
                }
            }

            // Standalone images from imagens array (not embedded in enunciado or alternativas)
            var getFullText = function() {
                var txt = enunciadoText;
                if (isObj && q.alternativas) {
                    for (var k = 0; k < q.alternativas.length; k++) txt += alternativasText[k];
                }
                return txt;
            };
            var fullQuestionText = getFullText();

            if (q.imagens && q.imagens.length > 0) {
                for (var im = 0; im < q.imagens.length; im++) {
                    if (!fullQuestionText.includes('[IMAGEM_' + im + ']')) {
                        try {
                            var b64m = q.imagens[im].match(/^data:image\/(png|jpeg|jpg|gif);base64,(.+)$/);
                            if (b64m) {
                                var binStr = atob(b64m[2]);
                                var bytes = new Uint8Array(binStr.length);
                                for (var bj = 0; bj < binStr.length; bj++) bytes[bj] = binStr.charCodeAt(bj);
                                children.push(new Paragraph({
                                    spacing: { before: 100, after: 100 },
                                    alignment: AlignmentType.CENTER,
                                    children: [new ImageRun({ data: bytes, transformation: { width: 400, height: 300 } })]
                                }));
                            }
                        } catch (e) { }
                    }
                }
            }

            // Alternativas — Word auto-numbering (upper letter: A), B), C)...)
            if (isObj && q.alternativas && q.alternativas.length > 0) {
                for (var ai = 0; ai < q.alternativas.length; ai++) {
                    var altText = alternativasText[ai];
                    var altRuns = await this.processMixedContent(altText, q.imagens || [], TextRun, ImageRun);
                    children.push(new Paragraph({
                        numbering: { reference: "alt-numbering-" + idx, level: 0 },
                        spacing: { before: 40, after: 40 },
                        children: altRuns
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
                return q.tipo === 'objetiva';
            });
            if (hasObj) {
                children.push(new Paragraph({
                    pageBreakBefore: true, alignment: AlignmentType.CENTER, spacing: { after: 300 },
                    children: [new TextRun({ text: 'GABARITO', bold: true, size: 28, font: 'Arial' })]
                }));
                for (var gi = 0; gi < questions.length; gi++) {
                    if (questions[gi].gabarito) {
                        children.push(new Paragraph({
                            numbering: { reference: "gabarito-numbering", level: 0 },
                            spacing: { before: 60, after: 60 },
                            children: [
                                new TextRun({ text: String(questions[gi].gabarito), size: 22, font: 'Arial' })
                            ]
                        }));
                    }
                }
            }
        }

        var doc = new Document({
            numbering: { config: numberingConfig },
            sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 720, right: 720 } } }, children: children }]
        });
        var blob = await Packer.toBlob(doc);
        var filename = (cfg.titulo || 'prova').replace(/\s+/g, '-').toLowerCase() + '.docx';
        saveAs(blob, filename);
    }
};

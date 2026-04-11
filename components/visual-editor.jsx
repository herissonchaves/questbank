// QuestBank — VisualEditor Component (v2.1)
// Fixes: cursor direction, cursor jumping, proper contentEditable lifecycle
// Features: undo/redo, image resize handles, paste cleanup, dimension persistence

const VisualEditor = ({ value, onChange, placeholder, className, forwardedRef }) => {
    const editorRef = React.useRef(null);
    const lastHtml = React.useRef(value || '');
    const isComposing = React.useRef(false);
    const isMounted = React.useRef(false);
    const isInternalChange = React.useRef(false);

    // ── Custom undo/redo history ──
    const historyStack = React.useRef([value || '']);
    const historyIndex = React.useRef(0);
    const historyTimer = React.useRef(null);
    const isUndoAction = React.useRef(false);

    // Set forwarded ref
    React.useEffect(() => {
        if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
                forwardedRef(editorRef.current);
            } else {
                forwardedRef.current = editorRef.current;
            }
        }
    }, [forwardedRef]);

    // ── MOUNT ONLY: set initial innerHTML once ──
    React.useEffect(() => {
        if (editorRef.current && !isMounted.current) {
            editorRef.current.innerHTML = value || '';
            lastHtml.current = value || '';
            isMounted.current = true;
        }
    }, []);

    // ── Sync from parent ONLY when value was changed externally ──
    // (e.g. form reset, loading saved question, NOT from user typing)
    React.useEffect(() => {
        if (!isMounted.current) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (editorRef.current && value !== lastHtml.current) {
            editorRef.current.innerHTML = value || '';
            lastHtml.current = value || '';
        }
    }, [value]);

    // Push state to custom history (debounced)
    const pushHistory = React.useCallback((html) => {
        if (isUndoAction.current) return;
        clearTimeout(historyTimer.current);
        historyTimer.current = setTimeout(() => {
            const stack = historyStack.current;
            const idx = historyIndex.current;
            if (stack[idx] === html) return;
            historyStack.current = stack.slice(0, idx + 1);
            historyStack.current.push(html);
            if (historyStack.current.length > 50) {
                historyStack.current = historyStack.current.slice(-50);
            }
            historyIndex.current = historyStack.current.length - 1;
        }, 400);
    }, []);

    const customUndo = React.useCallback(() => {
        const idx = historyIndex.current;
        if (idx <= 0) return false;
        isUndoAction.current = true;
        historyIndex.current = idx - 1;
        const html = historyStack.current[historyIndex.current];
        if (editorRef.current) {
            editorRef.current.innerHTML = html;
            lastHtml.current = html;
            isInternalChange.current = true;
            onChange(html);
        }
        try {
            const sel = window.getSelection();
            sel.selectAllChildren(editorRef.current);
            sel.collapseToEnd();
        } catch (e) {}
        requestAnimationFrame(() => { isUndoAction.current = false; });
        return true;
    }, [onChange]);

    const customRedo = React.useCallback(() => {
        const idx = historyIndex.current;
        if (idx >= historyStack.current.length - 1) return false;
        isUndoAction.current = true;
        historyIndex.current = idx + 1;
        const html = historyStack.current[historyIndex.current];
        if (editorRef.current) {
            editorRef.current.innerHTML = html;
            lastHtml.current = html;
            isInternalChange.current = true;
            onChange(html);
        }
        try {
            const sel = window.getSelection();
            sel.selectAllChildren(editorRef.current);
            sel.collapseToEnd();
        } catch (e) {}
        requestAnimationFrame(() => { isUndoAction.current = false; });
        return true;
    }, [onChange]);

    // ── Input handler ──
    const handleInput = React.useCallback(() => {
        if (!editorRef.current || isComposing.current) return;
        let newHtml = editorRef.current.innerHTML;
        if (newHtml === '<br>' || newHtml === '<div><br></div>') newHtml = '';
        if (newHtml !== lastHtml.current) {
            lastHtml.current = newHtml;
            isInternalChange.current = true;
            onChange(newHtml);
            pushHistory(newHtml);
        }
    }, [onChange, pushHistory]);

    // ── Keyboard: Ctrl+Z / Ctrl+Y ──
    const handleKeyDown = React.useCallback((e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
            const before = editorRef.current ? editorRef.current.innerHTML : '';
            requestAnimationFrame(() => {
                const after = editorRef.current ? editorRef.current.innerHTML : '';
                if (before === after) {
                    customUndo();
                } else {
                    lastHtml.current = after;
                    isInternalChange.current = true;
                    onChange(after);
                }
            });
            return;
        }
        if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey) || (e.key === 'Z' && e.shiftKey))) {
            const before = editorRef.current ? editorRef.current.innerHTML : '';
            requestAnimationFrame(() => {
                const after = editorRef.current ? editorRef.current.innerHTML : '';
                if (before === after) {
                    customRedo();
                } else {
                    lastHtml.current = after;
                    isInternalChange.current = true;
                    onChange(after);
                }
            });
            return;
        }
    }, [customUndo, customRedo, onChange]);

    // ── Paste handler ──
    const handlePaste = React.useCallback((e) => {
        e.preventDefault();
        const html = e.clipboardData.getData('text/html');
        const text = e.clipboardData.getData('text/plain');
        if (html) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const clean = sanitizeNode(doc.body);
            document.execCommand('insertHTML', false, clean);
        } else if (text) {
            const escaped = text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
            document.execCommand('insertHTML', false, escaped);
        }
    }, []);

    // ── Placeholder via CSS pseudo-element ──
    const [isEmpty, setIsEmpty] = React.useState(!value);
    const checkEmpty = React.useCallback(() => {
        if (!editorRef.current) return;
        const text = editorRef.current.textContent || '';
        const hasImg = editorRef.current.querySelector('img');
        setIsEmpty(!text.trim() && !hasImg);
    }, []);

    React.useEffect(() => { checkEmpty(); }, [value]);

    // ── Image selection for resize ──
    const [selectedImg, setSelectedImg] = React.useState(null);
    const [resizing, setResizing] = React.useState(false);
    const resizeStart = React.useRef({});

    const handleEditorClick = React.useCallback((e) => {
        checkEmpty();
        const img = e.target.closest('img');
        if (img && editorRef.current && editorRef.current.contains(img)) {
            e.preventDefault();
            setSelectedImg(img);
        } else {
            setSelectedImg(null);
        }
    }, [checkEmpty]);

    React.useEffect(() => {
        const handler = (e) => {
            if (editorRef.current && !editorRef.current.contains(e.target)) {
                setSelectedImg(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Resize handlers ──
    const handleResizeStart = React.useCallback((e, corner) => {
        e.preventDefault();
        e.stopPropagation();
        if (!selectedImg) return;
        const rect = selectedImg.getBoundingClientRect();
        resizeStart.current = {
            x: e.clientX, y: e.clientY,
            w: rect.width, h: rect.height,
            corner,
            aspectRatio: rect.width / rect.height
        };
        setResizing(true);
    }, [selectedImg]);

    React.useEffect(() => {
        if (!resizing || !selectedImg) return;
        const handleMouseMove = (e) => {
            const { x, w, h, corner, aspectRatio } = resizeStart.current;
            let dx = e.clientX - x;
            let newW, newH;
            if (corner === 'se' || corner === 'ne') {
                newW = Math.max(50, w + dx); newH = newW / aspectRatio;
            } else if (corner === 'sw' || corner === 'nw') {
                newW = Math.max(50, w - dx); newH = newW / aspectRatio;
            } else if (corner === 'e') {
                newW = Math.max(50, w + dx); newH = h;
            } else if (corner === 'w') {
                newW = Math.max(50, w - dx); newH = h;
            }
            newW = Math.round(newW);
            newH = Math.round(newH);
            selectedImg.style.width = newW + 'px';
            selectedImg.style.height = newH + 'px';
            selectedImg.style.maxWidth = 'none';
            selectedImg.style.maxHeight = 'none';
            selectedImg.setAttribute('data-width', newW);
            selectedImg.setAttribute('data-height', newH);
        };
        const handleMouseUp = () => {
            setResizing(false);
            if (editorRef.current) {
                const newHtml = editorRef.current.innerHTML;
                lastHtml.current = newHtml;
                isInternalChange.current = true;
                onChange(newHtml);
                pushHistory(newHtml);
            }
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizing, selectedImg, onChange, pushHistory]);

    // ── Delete selected image ──
    React.useEffect(() => {
        if (!selectedImg) return;
        const handler = (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                selectedImg.remove();
                setSelectedImg(null);
                if (editorRef.current) {
                    const newHtml = editorRef.current.innerHTML;
                    lastHtml.current = newHtml;
                    isInternalChange.current = true;
                    onChange(newHtml);
                    pushHistory(newHtml);
                }
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [selectedImg, onChange, pushHistory]);

    // ── Render resize handles ──
    const renderResizeHandles = () => {
        if (!selectedImg || !editorRef.current) return null;
        const editorRect = editorRef.current.getBoundingClientRect();
        const imgRect = selectedImg.getBoundingClientRect();
        const top = imgRect.top - editorRect.top + editorRef.current.scrollTop;
        const left = imgRect.left - editorRect.left + editorRef.current.scrollLeft;
        const width = imgRect.width;
        const height = imgRect.height;
        const hs = 10;

        const handles = [
            { corner: 'nw', style: { top: top - hs/2, left: left - hs/2, cursor: 'nw-resize' } },
            { corner: 'ne', style: { top: top - hs/2, left: left + width - hs/2, cursor: 'ne-resize' } },
            { corner: 'sw', style: { top: top + height - hs/2, left: left - hs/2, cursor: 'sw-resize' } },
            { corner: 'se', style: { top: top + height - hs/2, left: left + width - hs/2, cursor: 'se-resize' } },
            { corner: 'e', style: { top: top + height/2 - hs/2, left: left + width - hs/2, cursor: 'e-resize' } },
            { corner: 'w', style: { top: top + height/2 - hs/2, left: left - hs/2, cursor: 'w-resize' } },
        ];

        return (
            <React.Fragment>
                <div style={{
                    position: 'absolute', top, left, width, height,
                    border: '2px solid #4f46e5', borderRadius: '2px',
                    pointerEvents: 'none', zIndex: 10,
                }} />
                <div style={{
                    position: 'absolute',
                    top: top + height + 4, left: left + width/2,
                    transform: 'translateX(-50%)',
                    background: '#4f46e5', color: '#fff',
                    fontSize: '10px', fontWeight: 600,
                    padding: '1px 6px', borderRadius: '4px',
                    whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 11,
                }}>
                    {Math.round(imgRect.width)} x {Math.round(imgRect.height)}
                </div>
                {handles.map((h) => (
                    <div
                        key={h.corner}
                        onMouseDown={(e) => handleResizeStart(e, h.corner)}
                        style={{
                            position: 'absolute', width: hs, height: hs,
                            background: '#fff', border: '2px solid #4f46e5',
                            borderRadius: '2px', zIndex: 12, ...h.style,
                        }}
                    />
                ))}
            </React.Fragment>
        );
    };

    return (
        <div style={{ position: 'relative' }}>
            <div
                ref={editorRef}
                contentEditable={true}
                suppressContentEditableWarning={true}
                onInput={(e) => { handleInput(); checkEmpty(); }}
                onBlur={(e) => { handleInput(); checkEmpty(); }}
                onKeyDown={handleKeyDown}
                onClick={handleEditorClick}
                onPaste={handlePaste}
                onCompositionStart={() => { isComposing.current = true; }}
                onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
                className={`visual-editor min-h-[120px] ${className || ''}`}
                style={{
                    outline: 'none',
                    overflowY: 'auto',
                    position: 'relative',
                    lineHeight: '1.6',
                    wordBreak: 'break-word',
                    direction: 'ltr',
                    textAlign: 'left',
                    unicodeBidi: 'plaintext',
                }}
                dir="ltr"
                data-placeholder={placeholder || 'Digite aqui...'}
            />
            {/* Placeholder overlay when empty */}
            {isEmpty && (
                <div
                    style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        padding: 'inherit',
                        pointerEvents: 'none',
                        color: '#9ca3af',
                        lineHeight: '1.6',
                    }}
                    className="px-4 py-3 text-sm"
                >
                    {placeholder || 'Digite aqui...'}
                </div>
            )}
            {selectedImg && renderResizeHandles()}
        </div>
    );
};

// ── Sanitize pasted HTML ──
function sanitizeNode(node) {
    const allowedTags = new Set([
        'b', 'strong', 'i', 'em', 'u', 'br', 'p', 'div', 'span',
        'sub', 'sup', 'img', 'a', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th',
        'thead', 'tbody', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    ]);
    const allowedAttrs = new Set([
        'src', 'alt', 'href', 'style', 'class', 'data-width', 'data-height',
        'width', 'height', 'colspan', 'rowspan', 'target',
    ]);
    let html = '';
    for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        if (child.nodeType === Node.TEXT_NODE) {
            html += child.textContent;
        } else if (child.nodeType === Node.ELEMENT_NODE) {
            const tag = child.tagName.toLowerCase();
            if (allowedTags.has(tag)) {
                let attrs = '';
                for (let j = 0; j < child.attributes.length; j++) {
                    const attr = child.attributes[j];
                    if (allowedAttrs.has(attr.name)) {
                        if (attr.name === 'style') {
                            const cleaned = attr.value
                                .replace(/background[^;]*(;|$)/gi, '')
                                .replace(/mso-[^;]*(;|$)/gi, '')
                                .replace(/font-family:[^;]*(;|$)/gi, '')
                                .trim();
                            if (cleaned) attrs += ` style="${cleaned}"`;
                        } else {
                            attrs += ` ${attr.name}="${attr.value}"`;
                        }
                    }
                }
                if (tag === 'br' || tag === 'img') {
                    html += `<${tag}${attrs} />`;
                } else {
                    html += `<${tag}${attrs}>` + sanitizeNode(child) + `</${tag}>`;
                }
            } else {
                html += sanitizeNode(child);
            }
        }
    }
    return html;
}

window.VisualEditor = VisualEditor;

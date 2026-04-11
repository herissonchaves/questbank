const VisualEditor = ({ value, onChange, placeholder, className, forwardedRef }) => {
    const editorRef = React.useRef(null);
    const lastHtml = React.useRef(value || '');

    // Set forwarded ref if provided
    React.useEffect(() => {
        if (forwardedRef) {
            if (typeof forwardedRef === 'function') {
                forwardedRef(editorRef.current);
            } else {
                forwardedRef.current = editorRef.current;
            }
        }
    }, [forwardedRef]);

    React.useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
        lastHtml.current = value || '';
    }, [value]);

    const handleInput = () => {
        if (!editorRef.current) return;
        let newHtml = editorRef.current.innerHTML;

        // Limpeza básica apenas se o html ficar com tags vazias irritantes como <br> no início
        if (newHtml === '<br>') newHtml = '';

        if (newHtml !== lastHtml.current) {
            lastHtml.current = newHtml;
            onChange(newHtml);
        }
    };

    return (
        <div
            ref={editorRef}
            contentEditable={true}
            onInput={handleInput}
            onBlur={handleInput}
            className={`visual-editor min-h-[100px] empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none ${className}`}
            style={{
                outline: 'none',
                overflowY: 'auto'
            }}
            data-placeholder={placeholder}
            dangerouslySetInnerHTML={{ __html: value || '' }}
        />
    );
};

window.VisualEditor = VisualEditor;

// QuestBank — HTML Sanitizer Utility
// Cleans HTML from Word/Office paste artifacts, bad formatting, and ensures safe display
// Used by: question-card (display), visual-editor (paste), edit-question-modal (load)

window.QBHtmlSanitizer = {

    // ── Clean HTML for display in question cards and editor ──
    // Removes Word/Office junk, dangerous styles, normalizes structure
    cleanForDisplay: function(html) {
        if (!html || typeof html !== 'string') return html || '';

        var result = html;

        // 1. Remove Word/Office class names (MsoNormal, MsoListParagraph, etc.)
        result = result.replace(/\s*class\s*=\s*"[^"]*Mso[^"]*"/gi, '');
        result = result.replace(/\s*class\s*=\s*'[^']*Mso[^']*'/gi, '');

        // 2. Remove mso-* style properties (Word-specific)
        result = result.replace(/mso-[^;:"']+:[^;:"']+;?/gi, '');

        // 3. Remove negative text-indent (causes text to be clipped on the left)
        result = result.replace(/text-indent\s*:\s*-[^;]+;?/gi, '');

        // 4. Remove Word-specific margin-left with large values (list paragraph indentation)
        result = result.replace(/margin-left\s*:\s*\d+(\.\d+)?pt\s*;?/gi, '');

        // 5. Clean line-height with percentage values from Word (e.g. line-height:115%)
        result = result.replace(/line-height\s*:\s*\d+(\.\d+)?%\s*;?/gi, '');

        // 6. Remove font-family declarations (let the app control fonts)
        result = result.replace(/font-family\s*:[^;]+;?/gi, '');

        // 7. Normalize font-size from pt to a reasonable format
        // Convert Word-style 12.0pt -> remove (it's default)
        result = result.replace(/font-size\s*:\s*1[0-2](\.\d+)?pt\s*;?/gi, '');

        // 8. Remove background-color and color from Word paste
        result = result.replace(/background-color\s*:\s*[^;]+;?/gi, '');
        result = result.replace(/background\s*:\s*[^;]+;?/gi, '');

        // 9. Clean up empty style attributes
        result = result.replace(/\s*style\s*=\s*"\s*"/gi, '');
        result = result.replace(/\s*style\s*=\s*'\s*'/gi, '');

        // 10. Remove empty class attributes
        result = result.replace(/\s*class\s*=\s*"\s*"/gi, '');

        // 11. Remove Word conditional comments
        result = result.replace(/<!--\[if[^]*?endif\]-->/gi, '');
        result = result.replace(/<!\[if[^]*?<!\[endif\]>/gi, '');

        // 12. Remove <o:p> and similar Office namespace tags
        result = result.replace(/<\/?o:[^>]*>/gi, '');
        result = result.replace(/<\/?w:[^>]*>/gi, '');
        result = result.replace(/<\/?m:[^>]*>/gi, '');

        // 13. Trim excessive whitespace and newlines (from Word paste)
        result = result.replace(/\n\s{2,}/g, '\n');

        // 14. Remove empty paragraphs/divs (but keep <br> as spacers)
        result = result.replace(/<(p|div)[^>]*>\s*<\/(p|div)>/gi, '');

        // 15. Clean up style attribute: remove remaining empty/junk properties
        result = result.replace(/style="([^"]*)"/gi, function(match, styleContent) {
            var cleaned = styleContent
                .replace(/;\s*;/g, ';')   // double semicolons
                .replace(/^\s*;\s*/g, '') // leading semicolons
                .replace(/\s*;\s*$/g, '') // trailing semicolons
                .trim();
            if (!cleaned) return '';
            return 'style="' + cleaned + '"';
        });

        return result;
    },

    // ── Deep clean for paste: also strips more aggressively ──
    cleanForPaste: function(html) {
        if (!html) return '';

        // First apply display cleaning
        var result = window.QBHtmlSanitizer.cleanForDisplay(html);

        // Additional paste-specific cleaning:

        // Strip all class attributes (paste should not bring classes)
        result = result.replace(/\s*class\s*=\s*"[^"]*"/gi, '');
        result = result.replace(/\s*class\s*=\s*'[^']*'/gi, '');

        // Strip color from text (let editor control it)
        result = result.replace(/\bcolor\s*:\s*[^;]+;?/gi, '');

        // Remove zero-width spaces and other invisible chars
        result = result.replace(/[\u200B-\u200D\uFEFF]/g, '');

        // Convert <p> to <div> for consistency with contentEditable behavior
        result = result.replace(/<p(\s|>)/gi, '<div$1');
        result = result.replace(/<\/p>/gi, '</div>');

        return result;
    },

    // ── Clean stored HTML before loading into editor ──
    // Less aggressive than paste — preserves text-align and valid formatting
    cleanForEditor: function(html) {
        if (!html) return '';
        return window.QBHtmlSanitizer.cleanForDisplay(html);
    }
};

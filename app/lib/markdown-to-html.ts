/**
 * Simple markdown-to-HTML converter for mock lesson content.
 * Handles headings, bold, inline code, code blocks, lists, tables,
 * blockquotes, and paragraphs. No external dependencies needed.
 */

/** Convert a markdown string to sanitised HTML */
export function markdownToHtml(md: string): string {
    let html = md;

    // Fenced code blocks: ```lang\n...\n```
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
        const escaped = escapeHtml(code.trimEnd());
        return `<pre><code class="language-${lang || 'text'}">${escaped}</code></pre>`;
    });

    // Inline code: `...`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Headings (### → h3, ## → h2, # → h1)
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold: **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* (but not inside <strong>)
    html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');

    // Blockquotes: > text
    html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

    // Unordered list items: - text
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    // Wrap consecutive <li> in <ul>
    html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');

    // Tables: | col | col | ...
    html = html.replace(
        /((?:\|.+\|\n)+)/g,
        (_match, table: string) => {
            const rows = table.trim().split('\n').filter(r => !r.match(/^\|[\s-|]+\|$/));
            if (rows.length === 0) return '';
            const headerCells = rows[0].split('|').filter(c => c.trim());
            const thead = '<thead><tr>' + headerCells.map(c => `<th>${c.trim()}</th>`).join('') + '</tr></thead>';
            const bodyRows = rows.slice(1).map(r => {
                const cells = r.split('|').filter(c => c.trim());
                return '<tr>' + cells.map(c => `<td>${c.trim()}</td>`).join('') + '</tr>';
            }).join('');
            const tbody = bodyRows ? `<tbody>${bodyRows}</tbody>` : '';
            return `<table>${thead}${tbody}</table>`;
        }
    );

    // Paragraphs: wrap remaining lines that aren't already in a block tag
    const blockTagPattern = /^<(h[1-6]|ul|ol|li|pre|blockquote|table|thead|tbody|tr|th|td)/;
    const lines = html.split('\n');
    const result: string[] = [];
    let inParagraph = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            if (inParagraph) {
                result.push('</p>');
                inParagraph = false;
            }
            continue;
        }
        if (blockTagPattern.test(trimmed)) {
            if (inParagraph) {
                result.push('</p>');
                inParagraph = false;
            }
            result.push(trimmed);
        } else {
            if (!inParagraph) {
                result.push('<p>');
                inParagraph = true;
            }
            result.push(trimmed);
        }
    }
    if (inParagraph) result.push('</p>');

    return result.join('\n');
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

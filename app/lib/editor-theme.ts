import { createTheme } from '@uiw/codemirror-themes';
import { tags as t } from '@lezer/highlight';

export const superteamTheme = createTheme({
    theme: 'dark',
    settings: {
        background: 'transparent',
        backgroundImage: '',
        foreground: '#e2e8f0', // slate-200
        caret: '#14F195', // solana-green
        selection: '#9945FF40', // solana-purple with opacity
        selectionMatch: '#9945FF40',
        lineHighlight: '#ffffff0a',
        gutterBackground: 'transparent',
        gutterForeground: '#64748b', // slate-500
    },
    styles: [
        { tag: t.comment, color: '#64748b', fontStyle: 'italic' },
        { tag: t.variableName, color: '#e2e8f0' },
        { tag: [t.string, t.special(t.brace)], color: '#14F195' }, // green for strings
        { tag: t.number, color: '#f59e0b' }, // amber-500
        { tag: t.bool, color: '#f59e0b' },
        { tag: t.null, color: '#f59e0b' },
        { tag: t.keyword, color: '#9945FF' }, // purple for keywords
        { tag: t.operator, color: '#e2e8f0' },
        { tag: t.className, color: '#38bdf8' }, // sky-400
        { tag: t.definition(t.typeName), color: '#38bdf8' },
        { tag: t.typeName, color: '#38bdf8' },
        { tag: t.angleBracket, color: '#64748b' },
        { tag: t.tagName, color: '#9945FF' },
        { tag: t.attributeName, color: '#38bdf8' },
    ],
});

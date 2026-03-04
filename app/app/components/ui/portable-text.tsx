import { PortableText as PortableTextReact } from '@portabletext/react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

const components = {
    types: {
        code: ({ value }: any) => {
            return (
                <div className="my-6 rounded-lg overflow-hidden border border-white/[0.06] bg-[#0d1117]">
                    {value.filename && (
                        <div className="px-4 py-2 border-b border-white/[0.06] bg-white/[0.02] flex items-center justify-between">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest leading-none">
                                {value.filename}
                            </span>
                            <span className="text-[10px] font-mono text-neon-green/40 uppercase tracking-widest leading-none">
                                {value.language || 'code'}
                            </span>
                        </div>
                    )}
                    <SyntaxHighlighter
                        language={value.language || 'typescript'}
                        style={atomDark}
                        customStyle={{
                            margin: 0,
                            padding: '1.25rem',
                            fontSize: '0.85rem',
                            lineHeight: '1.6',
                            background: 'transparent',
                        }}
                    >
                        {value.code}
                    </SyntaxHighlighter>
                </div>
            )
        },
    },
    block: {
        h1: ({ children }: any) => (
            <h1 className="text-3xl font-black text-white font-mono mt-10 mb-6 flex items-center gap-3">
                <span className="text-neon-green/40">#</span> {children}
            </h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="text-2xl font-black text-white font-mono mt-8 mb-4 flex items-center gap-3">
                <span className="text-neon-green/40">##</span> {children}
            </h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="text-xl font-black text-white font-mono mt-6 mb-3 flex items-center gap-3">
                <span className="text-neon-green/40">###</span> {children}
            </h3>
        ),
        normal: ({ children }: any) => (
            <p className="text-zinc-400 leading-relaxed font-mono mb-4 text-sm">
                {children}
            </p>
        ),
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-2 border-neon-green/30 bg-white/[0.02] pl-6 py-4 my-6 italic text-zinc-400 font-mono">
                {children}
            </blockquote>
        ),
    },
    list: {
        bullet: ({ children }: any) => (
            <ul className="list-none space-y-2 mb-6 font-mono text-sm text-zinc-400">
                {children}
            </ul>
        ),
        number: ({ children }: any) => (
            <ol className="list-none space-y-2 mb-6 font-mono text-sm text-zinc-400 counter-reset-list">
                {children}
            </ol>
        ),
    },
    listItem: {
        bullet: ({ children }: any) => (
            <li className="flex items-start gap-3">
                <span className="text-neon-green mt-1.5 shrink-0 select-none">-</span>
                <span>{children}</span>
            </li>
        ),
        number: ({ children }: any) => (
            <li className="flex items-start gap-3">
                <span className="text-neon-green mt-1.5 shrink-0 select-none font-bold">1.</span>
                <span>{children}</span>
            </li>
        ),
    },
}

export function PortableText({ value }: { value: any }) {
    if (!value) return null
    return <PortableTextReact value={value} components={components} />
}

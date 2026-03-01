'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import Editor from '@monaco-editor/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, RotateCcw, Check, Code } from 'lucide-react';

interface Props {
  starterCode: string;
  solution: string;
  language: 'rust' | 'typescript';
  instructions: string;
  onSuccess?: () => void;
}

/** Solana-specific code snippets for Monaco completions */
const SOLANA_SNIPPETS = {
  rust: [
    { label: 'anchor-program', insertText: 'use anchor_lang::prelude::*;\n\ndeclare_id!("${1:PROGRAM_ID}");\n\n#[program]\npub mod ${2:my_program} {\n    use super::*;\n\n    pub fn ${3:initialize}(ctx: Context<${4:Initialize}>) -> Result<()> {\n        Ok(())\n    }\n}\n\n#[derive(Accounts)]\npub struct ${4:Initialize} {}\n', detail: 'Anchor program scaffold' },
    { label: 'account-struct', insertText: '#[account]\npub struct ${1:MyAccount} {\n    pub authority: Pubkey,\n    pub ${2:data}: ${3:u64},\n}\n', detail: 'Anchor account struct' },
    { label: 'error-code', insertText: '#[error_code]\npub enum ${1:ErrorCode} {\n    #[msg("${2:Description}")]\n    ${3:CustomError},\n}\n', detail: 'Anchor error codes' },
    { label: 'pda-seeds', insertText: 'seeds = [b"${1:seed}", ${2:authority}.key().as_ref()],\nbump,', detail: 'PDA seeds constraint' },
  ],
  typescript: [
    { label: 'connection', insertText: 'const connection = new Connection("${1:https://api.devnet.solana.com}", "confirmed");\n', detail: 'Solana connection' },
    { label: 'get-balance', insertText: 'const balance = await connection.getBalance(${1:publicKey});\nconsole.log(`Balance: ${balance / LAMPORTS_PER_SOL} SOL`);\n', detail: 'Get SOL balance' },
    { label: 'send-tx', insertText: 'const tx = new Transaction().add(\n  SystemProgram.transfer({\n    fromPubkey: ${1:sender}.publicKey,\n    toPubkey: ${2:recipient},\n    lamports: ${3:amount} * LAMPORTS_PER_SOL,\n  })\n);\nconst sig = await sendAndConfirmTransaction(connection, tx, [${1:sender}]);\n', detail: 'Send SOL transaction' },
    { label: 'anchor-setup', insertText: 'const provider = anchor.AnchorProvider.env();\nanchor.setProvider(provider);\nconst program = new anchor.Program(${1:IDL}, ${2:PROGRAM_ID}, provider);\n', detail: 'Anchor client setup' },
  ],
};

export function CodeEditor({
  starterCode,
  solution,
  language,
  instructions,
  onSuccess,
}: Props) {
  const t = useTranslations('lesson');
  const [code, setCode] = useState(starterCode);
  const [output, setOutput] = useState('');
  const [isCorrect, setIsCorrect] = useState(false);

  const handleRun = useCallback(() => {
    const normalized = code.replace(/\s+/g, ' ').trim();
    const normalizedSolution = solution.replace(/\s+/g, ' ').trim();

    if (normalized === normalizedSolution) {
      setOutput('✅ All tests passed!');
      setIsCorrect(true);
      onSuccess?.();
    } else {
      setOutput('❌ Output does not match expected result. Keep trying!');
      setIsCorrect(false);
    }
  }, [code, solution, onSuccess]);

  const handleReset = useCallback(() => {
    setCode(starterCode);
    setOutput('');
    setIsCorrect(false);
  }, [starterCode]);

  const handleEditorMount = useCallback(
    (editor: unknown, monaco: { languages: { registerCompletionItemProvider: (lang: string, provider: { provideCompletionItems: () => { suggestions: Array<{ label: string; kind: number; insertText: string; insertTextRules: number; detail: string }> } }) => void }; CompletionItemKind: { Snippet: number }; CompletionItemInsertTextRule: { InsertAsSnippet: number } }) => {
      const lang = language === 'rust' ? 'rust' : 'typescript';
      const snippets = SOLANA_SNIPPETS[language] || [];

      monaco.languages.registerCompletionItemProvider(lang, {
        provideCompletionItems: () => ({
          suggestions: snippets.map((s) => ({
            label: s.label,
            kind: monaco.CompletionItemKind.Snippet,
            insertText: s.insertText,
            insertTextRules: monaco.CompletionItemInsertTextRule.InsertAsSnippet,
            detail: s.detail,
          })),
        }),
      });

      // Focus the editor
      (editor as { focus: () => void }).focus();
    },
    [language]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code className="h-4 w-4" />
          {t('codeChallenge')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{instructions}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border overflow-hidden">
          <Editor
            height="400px"
            language={language === 'rust' ? 'rust' : 'typescript'}
            theme="vs-dark"
            value={code}
            onChange={(value) => setCode(value ?? '')}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleRun} variant="solana" className="gap-1.5">
            {isCorrect ? <Check className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {t('runCode')}
          </Button>
          <Button onClick={handleReset} variant="outline" className="gap-1.5">
            <RotateCcw className="h-4 w-4" />
            {t('resetCode')}
          </Button>
        </div>

        {output && (
          <div
            className={`p-3 rounded-md text-sm font-mono ${
              isCorrect
                ? 'bg-solana-green/10 text-solana-green border border-solana-green/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}
          >
            {output}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

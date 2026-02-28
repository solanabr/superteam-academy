'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  BookOpen,
  Target,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HintAccordion } from '@/components/challenges/hint-accordion';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChallengeInstructionsProps {
  courseId: string;
  className?: string;
}

interface MockChallenge {
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  description: string;
  expectedBehavior: string[];
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  hints: string[];
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const DIFFICULTY_STYLES = {
  beginner: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  advanced: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
} as const;

function getMockChallenge(_courseId: string): MockChallenge {
  return {
    title: 'Token Transfer with PDA Authority',
    difficulty: 'intermediate',
    description:
      'Implement a Solana program that transfers SPL tokens between two accounts using a Program Derived Address (PDA) as the transfer authority. The PDA should be derived from the program ID and a seed that includes the source account public key.',
    expectedBehavior: [
      'Derive a PDA from the program ID and source account public key',
      'Verify that the PDA is the token authority for the source token account',
      'Execute the SPL token transfer instruction via CPI (Cross-Program Invocation)',
      'Handle cases where the source has insufficient balance',
      'Emit a log message with the transfer amount and accounts involved',
    ],
    examples: [
      {
        input: 'transfer_tokens(source_ata, dest_ata, authority_pda, 1000)',
        output: 'Ok(()) — 1000 tokens transferred from source to destination',
        explanation:
          'The PDA signs the transfer instruction as the authority of the source token account.',
      },
      {
        input: 'transfer_tokens(source_ata, dest_ata, authority_pda, 999999)',
        output: 'Err(TokenError::InsufficientFunds)',
        explanation:
          'When the source account has fewer tokens than the requested amount, the transfer must fail gracefully.',
      },
    ],
    hints: [
      'Use Pubkey::find_program_address with seeds [b"authority", source_wallet.key().as_ref()] to derive the PDA.',
      'For the CPI transfer, use invoke_signed() with the PDA seeds and bump as the signer seeds. Remember to include the bump in your seeds array.',
      'Check the token account balance before transferring using the unpacked token account data. Use spl_token::state::Account::unpack(&source_ata.data.borrow()) to access the amount field.',
    ],
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChallengeInstructions({
  courseId,
  className,
}: ChallengeInstructionsProps) {
  const t = useTranslations('challenge');
  const tc = useTranslations('courses');

  const challenge = useMemo(() => getMockChallenge(courseId), [courseId]);

  return (
    <ScrollArea className={cn('flex flex-col', className)}>
      <div className="flex flex-col gap-6 p-6">
        {/* Title + difficulty */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-xs capitalize',
                DIFFICULTY_STYLES[challenge.difficulty],
              )}
            >
              {tc(challenge.difficulty)}
            </Badge>
          </div>
          <h1 className="text-xl font-bold tracking-tight lg:text-2xl">
            {challenge.title}
          </h1>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4 text-primary" />
            {t('description')}
          </div>
          <p className="text-sm leading-relaxed text-foreground/80">
            {challenge.description}
          </p>
        </div>

        <Separator />

        {/* Expected behavior */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Target className="size-4 text-primary" />
            {t('expected_behavior')}
          </div>
          <ul className="flex flex-col gap-2">
            {challenge.expectedBehavior.map((behavior, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
                <ArrowRight className="mt-1 size-3 shrink-0 text-primary" />
                <span className="text-foreground/80">{behavior}</span>
              </li>
            ))}
          </ul>
        </div>

        <Separator />

        {/* Examples */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="size-4 text-primary" />
            {t('examples')}
          </div>
          {challenge.examples.map((example, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border bg-muted/30"
            >
              {/* Input */}
              <div className="border-b px-4 py-2.5">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('input')}
                </span>
                <code className="text-sm font-mono text-foreground">
                  {example.input}
                </code>
              </div>

              {/* Output */}
              <div className="px-4 py-2.5">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">
                  {t('output')}
                </span>
                <code className="text-sm font-mono text-foreground">
                  {example.output}
                </code>
              </div>

              {/* Explanation */}
              {example.explanation && (
                <div className="border-t bg-muted/50 px-4 py-2.5">
                  <p className="text-xs leading-relaxed text-muted-foreground italic">
                    {example.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Hints */}
        <HintAccordion hints={challenge.hints} />
      </div>
    </ScrollArea>
  );
}

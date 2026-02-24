'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  Lightbulb,
  AlertTriangle,
  Info,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonContentProps {
  courseId: string;
  lessonIndex: number;
  className?: string;
}

interface AdmonitionProps {
  type: 'tip' | 'warning' | 'info';
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Mock lesson data (to be replaced by CMS/API fetch)
// ---------------------------------------------------------------------------

interface MockLesson {
  title: string;
  sections: {
    type: 'text' | 'code' | 'admonition' | 'key-concepts';
    content?: string;
    language?: string;
    admonitionType?: 'tip' | 'warning' | 'info';
    concepts?: string[];
  }[];
}

function getMockLesson(_courseId: string, lessonIndex: number): MockLesson {
  const lessons: MockLesson[] = [
    {
      title: 'Introduction to Solana',
      sections: [
        {
          type: 'text',
          content:
            'Solana is a high-performance blockchain platform designed for decentralized applications and marketplaces. It uses a unique consensus mechanism called Proof of History (PoH) combined with Proof of Stake (PoS).',
        },
        {
          type: 'key-concepts',
          concepts: [
            'Proof of History (PoH) provides a verifiable ordering of events',
            'Transaction throughput of up to 65,000 TPS',
            'Sub-second finality for faster user experiences',
            'Low transaction costs (fractions of a cent)',
          ],
        },
        {
          type: 'text',
          content:
            'Unlike traditional blockchains that rely solely on PoS or PoW, Solana introduces PoH as a cryptographic clock that allows validators to agree on the time and order of events without extensive communication overhead.',
        },
        {
          type: 'admonition',
          admonitionType: 'tip',
          content:
            'Solana programs are stateless — they read and write data to separate accounts. This is fundamentally different from Ethereum smart contracts where state lives inside the contract.',
        },
        {
          type: 'code',
          language: 'rust',
          content: `use solana_program::{
  account_info::AccountInfo,
  entrypoint,
  entrypoint::ProgramResult,
  pubkey::Pubkey,
  msg,
};

entrypoint!(process_instruction);

fn process_instruction(
  program_id: &Pubkey,
  accounts: &[AccountInfo],
  instruction_data: &[u8],
) -> ProgramResult {
  msg!("Hello, Solana!");
  Ok(())
}`,
        },
        {
          type: 'admonition',
          admonitionType: 'warning',
          content:
            'Never hardcode private keys in your code. Always use wallet adapters and environment variables for key management.',
        },
        {
          type: 'text',
          content:
            'In the next section, we will set up your local development environment and deploy your first program to devnet.',
        },
        {
          type: 'admonition',
          admonitionType: 'info',
          content:
            'Solana programs are typically written in Rust using the Anchor framework, which provides helpful macros and abstractions. We will cover Anchor in depth in later lessons.',
        },
      ],
    },
    {
      title: 'Setting Up Your Environment',
      sections: [
        {
          type: 'text',
          content:
            'Before writing Solana programs, you need to install the Solana CLI tools and set up a local development environment.',
        },
        {
          type: 'code',
          language: 'typescript',
          content: `sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

// Verify installation
solana --version

// Configure for devnet
solana config set --url devnet

// Generate a new keypair
solana-keygen new`,
        },
        {
          type: 'key-concepts',
          concepts: [
            'Solana CLI provides tools for deploying and managing programs',
            'Devnet is a free testing network that mirrors mainnet behavior',
            'Keypairs consist of a public key (address) and private key (signer)',
          ],
        },
        {
          type: 'admonition',
          admonitionType: 'tip',
          content:
            'Use `solana airdrop 2` to get free SOL on devnet for testing. You can request up to 2 SOL per airdrop.',
        },
      ],
    },
  ];

  return lessons[lessonIndex % lessons.length] ?? lessons[0]!;
}

// ---------------------------------------------------------------------------
// Admonition subcomponent
// ---------------------------------------------------------------------------

const ADMONITION_CONFIG = {
  tip: {
    icon: Lightbulb,
    label: 'tip',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/5 dark:bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    titleColor: 'text-emerald-700 dark:text-emerald-400',
  },
  warning: {
    icon: AlertTriangle,
    label: 'warning',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5 dark:bg-amber-500/10',
    iconColor: 'text-amber-500',
    titleColor: 'text-amber-700 dark:text-amber-400',
  },
  info: {
    icon: Info,
    label: 'info',
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5 dark:bg-blue-500/10',
    iconColor: 'text-blue-500',
    titleColor: 'text-blue-700 dark:text-blue-400',
  },
} as const;

function Admonition({ type, children }: AdmonitionProps) {
  const t = useTranslations('lesson');
  const config = ADMONITION_CONFIG[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border-l-4 p-4',
        config.border,
        config.bg,
      )}
      role="note"
    >
      <Icon className={cn('mt-0.5 size-5 shrink-0', config.iconColor)} />
      <div className="flex-1 space-y-1">
        <p className={cn('text-sm font-semibold', config.titleColor)}>
          {t(config.label)}
        </p>
        <div className="text-sm leading-relaxed text-foreground/80">
          {children}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Code block subcomponent
// ---------------------------------------------------------------------------

function CodeBlock({ code, language }: { code: string; language: string }) {
  const lines = code.split('\n');

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-200 bg-neutral-50 px-4 py-2 dark:border-neutral-700 dark:bg-neutral-800">
        <span className="text-xs font-medium text-muted-foreground">
          {language}
        </span>
      </div>

      {/* Code content */}
      <div className="overflow-x-auto bg-[#1e1e1e] p-4">
        <pre className="font-mono text-sm leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-8 select-none text-right text-neutral-600">
                {i + 1}
              </span>
              <code className="text-[#d4d4d4]">{line || '\u00A0'}</code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Key concepts subcomponent
// ---------------------------------------------------------------------------

function KeyConcepts({ concepts }: { concepts: string[] }) {
  const t = useTranslations('lesson');

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 dark:bg-primary/10">
      <div className="mb-3 flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <h3 className="text-sm font-semibold text-primary">
          {t('key_concepts')}
        </h3>
      </div>
      <ul className="space-y-2">
        {concepts.map((concept, i) => (
          <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
            <span className="text-foreground/80">{concept}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function LessonContent({
  courseId,
  lessonIndex,
  className,
}: LessonContentProps) {
  const lesson = useMemo(
    () => getMockLesson(courseId, lessonIndex),
    [courseId, lessonIndex],
  );

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      {/* Lesson title */}
      <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
        {lesson.title}
      </h1>

      {/* Render sections */}
      {lesson.sections.map((section, idx) => {
        switch (section.type) {
          case 'text':
            return (
              <p key={idx} className="text-sm leading-relaxed text-foreground/80 lg:text-base">
                {section.content}
              </p>
            );

          case 'code':
            return (
              <CodeBlock
                key={idx}
                code={section.content ?? ''}
                language={section.language ?? 'text'}
              />
            );

          case 'admonition':
            return (
              <Admonition key={idx} type={section.admonitionType ?? 'info'}>
                {section.content}
              </Admonition>
            );

          case 'key-concepts':
            return (
              <KeyConcepts key={idx} concepts={section.concepts ?? []} />
            );

          default:
            return null;
        }
      })}
    </div>
  );
}

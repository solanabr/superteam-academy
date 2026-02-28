'use client';

import { useTranslations } from 'next-intl';
import { Tag } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table';

const TRACK_NAMES: Record<number, string> = {
  0: 'Solana Core',
  1: 'DeFi',
  2: 'NFT',
  3: 'Security',
  4: 'Gaming',
};

const LEVEL_NAMES: Record<number, string> = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced',
};

interface CredentialAttributesProps {
  attributes: Record<string, any>;
  createdAt?: string;
}

interface AttributeRow {
  label: string;
  value: string;
}

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function buildAttributeRows(
  attributes: Record<string, any>,
  createdAt?: string,
): AttributeRow[] {
  const rows: AttributeRow[] = [];

  if (attributes.trackId !== undefined) {
    rows.push({
      label: 'Track',
      value: TRACK_NAMES[attributes.trackId] ?? `Track ${attributes.trackId}`,
    });
  }

  if (attributes.level !== undefined) {
    rows.push({
      label: 'Level',
      value: LEVEL_NAMES[attributes.level] ?? `Level ${attributes.level}`,
    });
  }

  if (attributes.coursesCompleted !== undefined) {
    rows.push({
      label: 'Courses Completed',
      value: String(attributes.coursesCompleted),
    });
  }

  if (attributes.totalXp !== undefined) {
    rows.push({
      label: 'Total XP',
      value: Number(attributes.totalXp).toLocaleString(),
    });
  }

  if (createdAt) {
    rows.push({
      label: 'Issue Date',
      value: formatDate(createdAt),
    });
  }

  return rows;
}

export function CredentialAttributes({
  attributes,
  createdAt,
}: CredentialAttributesProps) {
  const t = useTranslations('credentials');
  const rows = buildAttributeRows(attributes, createdAt);

  if (rows.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Tag className="size-4" />
          {t('attributes')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell className="font-medium text-muted-foreground">
                  {row.label}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

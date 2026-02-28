'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

function ShortcutHint({ label }: { label: string }) {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(typeof navigator !== 'undefined' && /Mac/.test(navigator.userAgent));
  }, []);

  return (
    <Badge
      variant="outline"
      className="text-muted-foreground pointer-events-none select-none px-1.5 py-0 font-mono text-[10px]"
    >
      <kbd className="font-sans">{isMac ? '\u2318' : 'Ctrl+'}</kbd>
      {label}
    </Badge>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (query: string) => void;
  className?: string;
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  const t = useTranslations('courses');
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const [localValue, setLocalValue] = useState(value);

  // Sync external value changes (e.g., filter reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedChange = useCallback(
    (query: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        onChange(query);
      }, 300);
    },
    [onChange],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);
    debouncedChange(next);
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Cmd+K / Ctrl+K keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        placeholder={t('search_placeholder')}
        className="pl-9 pr-20"
      />
      <div className="absolute top-1/2 right-3 flex -translate-y-1/2 items-center gap-1.5">
        {localValue ? (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={handleClear}
            aria-label="Clear search"
          >
            <X className="size-3.5" />
          </Button>
        ) : (
          <ShortcutHint label={t('search_shortcut')} />
        )}
      </div>
    </div>
  );
}

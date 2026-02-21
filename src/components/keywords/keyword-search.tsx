'use client';

import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Zap, Loader2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/use-api';

interface KeywordSearchProps {
  value: string;
  onChange: (value: string) => void;
  onCheck?: () => void;
  placeholder?: string;
  className?: string;
}

export function KeywordSearch({
  value,
  onChange,
  onCheck,
  placeholder = 'Search keywords…',
  className,
}: KeywordSearchProps) {
  const [checkQuery, setCheckQuery] = useState('');
  const { trigger: checkKeyword, loading: checking } = useApiMutation<
    { query: string; country: string; lang: string },
    { taskId: string }
  >('/api/keywords/check');

  const handleCheck = useCallback(async () => {
    const query = checkQuery || value;
    if (!query.trim()) return;
    try {
      await checkKeyword({ query: query.trim(), country: 'RU', lang: 'ru' });
      onCheck?.();
    } catch {
      // handled by hook
    }
  }, [checkQuery, value, checkKeyword, onCheck]);

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1">
          <Input
            value={checkQuery}
            onChange={(e) => setCheckQuery(e.target.value)}
            placeholder="Check keyword…"
            className="w-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCheck();
            }}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCheck}
            disabled={checking || !(checkQuery || value).trim()}
          >
            {checking ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            Check
          </Button>
        </div>
      </div>
    </div>
  );
}

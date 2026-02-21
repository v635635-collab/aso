'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, CheckCircle2, Eye } from 'lucide-react';
import { useApiMutation } from '@/hooks/use-api';

interface PessimizationDetailActionsProps {
  eventId: string;
  currentStatus: string;
  showAnalyzeOnly?: boolean;
}

export function PessimizationDetailActions({
  eventId,
  currentStatus,
  showAnalyzeOnly = false,
}: PessimizationDetailActionsProps) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);

  const { trigger: updateStatus, loading: updating } = useApiMutation<
    { status: string },
    unknown
  >(`/api/pessimizations/${eventId}`, 'PATCH');

  const { trigger: triggerAnalysis } = useApiMutation<
    undefined,
    { jobId: string }
  >(`/api/pessimizations/${eventId}/analyze`);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      await triggerAnalysis();
      await new Promise((r) => setTimeout(r, 2000));
      router.refresh();
    } catch {
      /* toast would go here */
    } finally {
      setAnalyzing(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateStatus({ status });
      router.refresh();
    } catch {
      /* toast would go here */
    }
  };

  if (showAnalyzeOnly) {
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-3.5 w-3.5" />
        )}
        Analyze
      </Button>
    );
  }

  const canResolve = currentStatus !== 'RESOLVED' && currentStatus !== 'ACCEPTED';
  const canAccept = currentStatus !== 'ACCEPTED';

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? (
          <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
        ) : (
          <Sparkles className="mr-2 h-3.5 w-3.5" />
        )}
        Analyze
      </Button>

      {canResolve && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleStatusChange('RESOLVED')}
          disabled={updating}
          className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
        >
          {updating ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
          )}
          Resolve
        </Button>
      )}

      {canAccept && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleStatusChange('ACCEPTED')}
          disabled={updating}
        >
          {updating ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Eye className="mr-2 h-3.5 w-3.5" />
          )}
          Accept
        </Button>
      )}
    </div>
  );
}

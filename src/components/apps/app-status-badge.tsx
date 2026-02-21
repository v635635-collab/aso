import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AppStatus = 'DRAFT' | 'IN_REVIEW' | 'LIVE' | 'SUSPENDED' | 'REMOVED';

const statusConfig: Record<AppStatus, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  IN_REVIEW: { label: 'In Review', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  LIVE: { label: 'Live', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  SUSPENDED: { label: 'Suspended', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  REMOVED: { label: 'Removed', className: 'bg-zinc-700/40 text-zinc-500 border-zinc-600/30' },
};

export function AppStatusBadge({ status }: { status: AppStatus }) {
  const config = statusConfig[status] ?? statusConfig.DRAFT;
  return (
    <Badge variant="outline" className={cn('border text-[11px]', config.className)}>
      {config.label}
    </Badge>
  );
}

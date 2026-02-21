'use client';

import {
  AlertTriangle,
  CheckCircle,
  Info,
  XCircle,
  TrendingDown,
  Zap,
  BarChart3,
  Search,
  AlertOctagon,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    severity: string;
    title: string;
    body: string;
    actionUrl?: string | null;
    actionLabel?: string | null;
    isRead: boolean;
    createdAt: string;
  };
  onMarkRead: (id: string) => void;
  onClick?: (notification: NotificationItemProps['notification']) => void;
}

const typeIcons: Record<string, typeof Info> = {
  PESSIMIZATION_DETECTED: TrendingDown,
  PESSIMIZATION_RESOLVED: CheckCircle,
  CAMPAIGN_COMPLETED: CheckCircle,
  CAMPAIGN_PESSIMIZED: AlertOctagon,
  RESEARCH_COMPLETED: Search,
  RESEARCH_FAILED: XCircle,
  POSITION_ALERT: BarChart3,
  DAILY_DIGEST: Calendar,
  SYSTEM_ALERT: AlertTriangle,
  PUSH_DAY_READY: Zap,
  CRON_JOB_FAILED: XCircle,
};

const severityStyles: Record<string, string> = {
  INFO: 'text-blue-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-orange-500',
  CRITICAL: 'text-red-500',
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function NotificationItem({ notification, onMarkRead, onClick }: NotificationItemProps) {
  const Icon = typeIcons[notification.type] || Info;
  const colorClass = severityStyles[notification.severity] || 'text-muted-foreground';

  function handleClick() {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    onClick?.(notification);
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-accent',
        !notification.isRead && 'bg-accent/50'
      )}
    >
      <div className={cn('mt-0.5 shrink-0', colorClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm leading-tight', !notification.isRead && 'font-semibold')}>
            {notification.title}
          </p>
          {!notification.isRead && (
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{notification.body}</p>
        <p className="mt-1 text-[11px] text-muted-foreground/70">{timeAgo(notification.createdAt)}</p>
      </div>
    </button>
  );
}

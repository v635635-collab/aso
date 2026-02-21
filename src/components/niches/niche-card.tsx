import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/shared/status-badge';
import { Badge } from '@/components/ui/badge';
import { Layers, KeyRound, AppWindow, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NicheCardProps {
  niche: {
    id: string;
    name: string;
    displayName: string;
    description?: string | null;
    totalTraffic: number;
    avgSAP: number;
    avgCompetition: number;
    keywordCount: number;
    riskLevel: string;
    _count?: { keywords: number; apps: number };
  };
  className?: string;
}

export function NicheCard({ niche, className }: NicheCardProps) {
  const kwCount = niche._count?.keywords ?? niche.keywordCount;
  const appCount = niche._count?.apps ?? 0;

  return (
    <Link href={`/niches/${niche.id}`}>
      <Card className={cn('hover:border-primary/50 transition-colors cursor-pointer h-full', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <Layers className="size-4 text-primary" />
              </div>
              <CardTitle className="text-base">{niche.displayName}</CardTitle>
            </div>
            <StatusBadge status={niche.riskLevel} size="sm" />
          </div>
          {niche.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{niche.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <KeyRound className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Keywords:</span>
              <span className="font-medium">{kwCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <AppWindow className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Apps:</span>
              <span className="font-medium">{appCount}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="size-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Traffic:</span>
              <span className="font-medium">{niche.totalTraffic.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="text-[10px] h-5">
                SAP: {niche.avgSAP.toFixed(1)}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

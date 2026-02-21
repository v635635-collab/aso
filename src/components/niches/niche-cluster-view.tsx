'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';

interface ClusterViewProps {
  clusters: Array<{
    id: string;
    name: string;
    displayName: string;
    keywordCount: number;
    description?: string | null;
  }>;
}

export function NicheClusterView({ clusters }: ClusterViewProps) {
  if (clusters.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No sub-niches found. Use the &quot;Cluster Keywords&quot; button to group keywords with AI.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clusters.map((cluster) => (
        <Card key={cluster.id} className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-primary" />
              <CardTitle className="text-sm">{cluster.displayName}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {cluster.description && (
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {cluster.description}
              </p>
            )}
            <Badge variant="secondary" className="text-xs">
              {cluster.keywordCount} keywords
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, TrendingDown } from 'lucide-react';
import { SeverityBadge } from '@/components/pessimizations/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { PositionChangeBadge } from '@/components/positions/position-change-badge';
import { PessimizationDetailActions } from './actions';

interface AffectedKeyword {
  keywordId: string;
  keywordText: string;
  positionBefore: number | null;
  positionAfter: number | null;
  drop: number;
}

export default async function PessimizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const event = await prisma.pessimizationEvent.findUnique({
    where: { id },
    include: {
      app: { select: { id: true, name: true, iconUrl: true, bundleId: true, category: true } },
      campaign: { select: { id: true, name: true, strategy: true, status: true, totalInstalls: true, durationDays: true } },
    },
  });

  if (!event) notFound();

  const analysisJob = await prisma.asyncJob.findFirst({
    where: {
      type: 'PESSIMIZATION_ANALYSIS',
      relatedEntityType: 'PessimizationEvent',
      relatedEntityId: id,
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, createdAt: true },
  });

  const affected = (Array.isArray(event.affectedKeywords) ? event.affectedKeywords : []) as unknown as AffectedKeyword[];

  let recommendations: string[] = [];
  try {
    if (event.aiRecommendation) {
      recommendations = JSON.parse(event.aiRecommendation);
    }
  } catch {
    /* ignore parse errors */
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pessimizations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pessimization Event</h1>
            <SeverityBadge severity={event.severity} />
            <StatusBadge status={event.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {event.app.name} &middot; {event.type.replace(/_/g, ' ')} &middot;{' '}
            {new Date(event.detectedAt).toLocaleString()}
          </p>
        </div>
        <PessimizationDetailActions eventId={id} currentStatus={event.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Affected Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{affected.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Avg Position Drop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {event.avgPositionDrop > 0 ? `-${event.avgPositionDrop.toFixed(1)}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Max Drop</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-400">
              {event.maxPositionDrop > 0 ? `-${event.maxPositionDrop}` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <SeverityBadge severity={event.severity} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Affected Keywords</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Keyword</TableHead>
                <TableHead className="text-right">Before</TableHead>
                <TableHead className="text-right">After</TableHead>
                <TableHead className="text-center">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {affected.map((kw) => (
                <TableRow key={kw.keywordId}>
                  <TableCell className="font-medium">{kw.keywordText}</TableCell>
                  <TableCell className="text-right font-mono">
                    {kw.positionBefore != null ? `#${kw.positionBefore}` : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {kw.positionAfter != null ? `#${kw.positionAfter}` : 'Lost'}
                  </TableCell>
                  <TableCell className="text-center">
                    <PositionChangeBadge change={kw.drop > 900 ? null : -kw.drop} size="sm" />
                  </TableCell>
                </TableRow>
              ))}
              {affected.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-20 text-center text-muted-foreground">
                    No affected keywords data
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {event.campaign && (
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Push Campaign Context</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <dt className="text-muted-foreground">Campaign</dt>
                <dd className="mt-1 font-medium">
                  <Link href={`/apps/${event.app.id}/campaigns`} className="hover:underline">
                    {event.campaign.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Strategy</dt>
                <dd className="mt-1 font-medium">{event.campaign.strategy}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Total Installs</dt>
                <dd className="mt-1 font-medium">{event.campaign.totalInstalls.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Campaign Status</dt>
                <dd className="mt-1"><StatusBadge status={event.campaign.status} size="sm" /></dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}

      <Card className="border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">AI Analysis</CardTitle>
          {(!event.aiAnalysis && !analysisJob) && (
            <PessimizationDetailActions eventId={id} currentStatus={event.status} showAnalyzeOnly />
          )}
          {analysisJob?.status === 'RUNNING' && (
            <span className="text-xs text-muted-foreground animate-pulse">Analyzing...</span>
          )}
        </CardHeader>
        <CardContent>
          {event.aiAnalysis ? (
            <div className="space-y-4">
              {event.rootCause && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Root Cause</h4>
                  <p className="text-sm">{event.rootCause}</p>
                </div>
              )}
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Analysis</h4>
                <p className="text-sm whitespace-pre-wrap">{event.aiAnalysis}</p>
              </div>
              {recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1">Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingDown className="mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No AI analysis yet</p>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Click &quot;Analyze&quot; to trigger AI analysis of this event
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

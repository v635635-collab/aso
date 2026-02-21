import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertTriangle, ShieldAlert } from 'lucide-react';
import { SeverityBadge } from '@/components/pessimizations/severity-badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { PessimizationsFilters } from './filters';

export default async function PessimizationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    severity?: string;
    status?: string;
    appId?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (sp.severity) where.severity = sp.severity;
  if (sp.status) where.status = sp.status;
  if (sp.appId) where.appId = sp.appId;

  const [events, total, apps] = await Promise.all([
    prisma.pessimizationEvent.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { detectedAt: 'desc' },
      include: {
        app: { select: { id: true, name: true, iconUrl: true } },
        campaign: { select: { id: true, name: true } },
      },
    }),
    prisma.pessimizationEvent.count({ where }),
    prisma.app.findMany({
      where: { pessimizations: { some: {} } },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pessimizations</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} event{total !== 1 ? 's' : ''} detected
        </p>
      </div>

      <PessimizationsFilters
        severity={sp.severity ?? ''}
        status={sp.status ?? ''}
        appId={sp.appId ?? ''}
        apps={apps}
      />

      {events.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>App</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead className="text-right">Keywords</TableHead>
                  <TableHead className="text-right">Avg Drop</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Detected</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => {
                  const keywords = Array.isArray(event.affectedKeywords) ? event.affectedKeywords : [];
                  return (
                    <TableRow key={event.id} className="cursor-pointer">
                      <TableCell>
                        <Link
                          href={`/pessimizations/${event.id}`}
                          className="font-medium hover:underline"
                        >
                          {event.app.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {event.type.replace(/_/g, ' ')}
                      </TableCell>
                      <TableCell>
                        <SeverityBadge severity={event.severity} size="sm" />
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {keywords.length}
                      </TableCell>
                      <TableCell className="text-right font-mono text-red-400">
                        {event.avgPositionDrop > 0 ? `-${event.avgPositionDrop.toFixed(1)}` : '—'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={event.status} size="sm" />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {event.campaign?.name ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(event.detectedAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <ShieldAlert className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No pessimization events found</p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              {sp.severity || sp.status || sp.appId
                ? 'Try adjusting your filters'
                : 'Events will appear when position drops are detected'}
            </p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild>
            <Link
              href={`/pessimizations?${new URLSearchParams({
                ...(sp.severity ? { severity: sp.severity } : {}),
                ...(sp.status ? { status: sp.status } : {}),
                ...(sp.appId ? { appId: sp.appId } : {}),
                page: String(page - 1),
              })}`}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
            <Link
              href={`/pessimizations?${new URLSearchParams({
                ...(sp.severity ? { severity: sp.severity } : {}),
                ...(sp.status ? { status: sp.status } : {}),
                ...(sp.appId ? { appId: sp.appId } : {}),
                page: String(page + 1),
              })}`}
            >
              Next
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, LineChart, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function ChangeIndicator({ change }: { change?: number | null }) {
  if (change == null || change === 0) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (change > 0) return <span className="inline-flex items-center gap-0.5 text-red-400"><TrendingDown className="h-3.5 w-3.5" /> +{change}</span>;
  return <span className="inline-flex items-center gap-0.5 text-emerald-400"><TrendingUp className="h-3.5 w-3.5" /> {change}</span>;
}

export default async function AppPositionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; from?: string; to?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 50;

  const app = await prisma.app.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!app) notFound();

  const where: Record<string, unknown> = { appId: id };
  if (sp.from || sp.to) {
    const capturedAt: Record<string, Date> = {};
    if (sp.from) capturedAt.gte = new Date(sp.from);
    if (sp.to) capturedAt.lte = new Date(sp.to);
    where.capturedAt = capturedAt;
  }

  const [snapshots, total] = await Promise.all([
    prisma.positionSnapshot.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { capturedAt: 'desc' },
      include: { keyword: { select: { id: true, text: true, trafficScore: true } } },
    }),
    prisma.positionSnapshot.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/apps/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Position History</h1>
          <p className="text-sm text-muted-foreground">{app.name} &middot; {total} snapshots</p>
        </div>
      </div>

      <Card className="border-border/50 bg-muted/30 p-6">
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <LineChart className="h-5 w-5" />
          <p className="text-sm">Position chart visualization will be rendered here</p>
        </div>
      </Card>

      {snapshots.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Previous</TableHead>
                  <TableHead className="text-center">Change</TableHead>
                  <TableHead className="text-right">Traffic</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshots.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.keyword.text}</TableCell>
                    <TableCell className="text-right font-mono">{s.position ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{s.previousPosition ?? '—'}</TableCell>
                    <TableCell className="text-center"><ChangeIndicator change={s.change} /></TableCell>
                    <TableCell className="text-right">{s.keyword.trafficScore ?? '—'}</TableCell>
                    <TableCell>{s.country}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(s.capturedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <LineChart className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No position history available</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Position snapshots will appear after monitoring begins</p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild>
            <Link href={`/apps/${id}/positions?page=${page - 1}`}>Previous</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
            <Link href={`/apps/${id}/positions?page=${page + 1}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

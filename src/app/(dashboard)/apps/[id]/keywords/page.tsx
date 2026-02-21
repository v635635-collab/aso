import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, KeyRound, TrendingUp, TrendingDown, Minus } from 'lucide-react';

function TrendIcon({ trend }: { trend: string }) {
  switch (trend) {
    case 'RISING': return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
    case 'FALLING': return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
    default: return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  }
}

export default async function AppKeywordsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 50;

  const app = await prisma.app.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!app) notFound();

  const [keywords, total] = await Promise.all([
    prisma.appKeyword.findMany({
      where: { appId: id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ currentPosition: 'asc' }],
      include: {
        keyword: { select: { id: true, text: true, trafficScore: true, sap: true, competition: true } },
      },
    }),
    prisma.appKeyword.count({ where: { appId: id } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/apps/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keywords</h1>
          <p className="text-sm text-muted-foreground">{app.name} &middot; {total} keywords tracked</p>
        </div>
      </div>

      {keywords.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Keyword</TableHead>
                  <TableHead className="text-center">Trend</TableHead>
                  <TableHead className="text-right">Position</TableHead>
                  <TableHead className="text-right">Best</TableHead>
                  <TableHead className="text-right">Traffic</TableHead>
                  <TableHead className="text-right">SAP</TableHead>
                  <TableHead className="text-center">In Title</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {keywords.map((ak) => (
                  <TableRow key={ak.id}>
                    <TableCell className="font-medium">{ak.keyword.text}</TableCell>
                    <TableCell className="text-center"><TrendIcon trend={ak.positionTrend} /></TableCell>
                    <TableCell className="text-right font-mono">{ak.currentPosition ?? '—'}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">{ak.bestPosition ?? '—'}</TableCell>
                    <TableCell className="text-right">{ak.keyword.trafficScore ?? '—'}</TableCell>
                    <TableCell className="text-right">{ak.keyword.sap?.toFixed(1) ?? '—'}</TableCell>
                    <TableCell className="text-center">
                      {ak.isInTitle && <Badge variant="secondary" className="text-[10px]">T</Badge>}
                      {ak.isInSubtitle && <Badge variant="secondary" className="ml-1 text-[10px]">S</Badge>}
                      {!ak.isInTitle && !ak.isInSubtitle && <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{ak.source}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <KeyRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No keywords tracked for this app</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Keywords will appear here once added via research or manually</p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild>
            <Link href={`/apps/${id}/keywords?page=${page - 1}`}>Previous</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
            <Link href={`/apps/${id}/keywords?page=${page + 1}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

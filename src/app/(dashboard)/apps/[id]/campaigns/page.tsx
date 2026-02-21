import { notFound } from 'next/navigation';
import Link from 'next/link';
import prisma from '@/lib/prisma';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ArrowLeft, Rocket } from 'lucide-react';

const campaignStatusStyle: Record<string, string> = {
  DRAFT: 'bg-zinc-500/20 text-zinc-400',
  REVIEW: 'bg-blue-500/20 text-blue-400',
  APPROVED: 'bg-cyan-500/20 text-cyan-400',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  PAUSED: 'bg-yellow-500/20 text-yellow-400',
  COMPLETED: 'bg-purple-500/20 text-purple-400',
  CANCELLED: 'bg-zinc-700/40 text-zinc-500',
  PESSIMIZED: 'bg-red-500/20 text-red-400',
};

export default async function AppCampaignsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 20;

  const app = await prisma.app.findUnique({ where: { id }, select: { id: true, name: true } });
  if (!app) notFound();

  const [campaigns, total] = await Promise.all([
    prisma.pushCampaign.findMany({
      where: { appId: id },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.pushCampaign.count({ where: { appId: id } }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/apps/${id}`}><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Push Campaigns</h1>
          <p className="text-sm text-muted-foreground">{app.name} &middot; {total} campaigns</p>
        </div>
      </div>

      {campaigns.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Strategy</TableHead>
                  <TableHead className="text-right">Budget</TableHead>
                  <TableHead className="text-right">Installs</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`border-transparent text-[11px] ${campaignStatusStyle[c.status] || ''}`}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.strategy}</TableCell>
                    <TableCell className="text-right text-sm">
                      ${c.spentBudget.toFixed(0)} / ${c.totalBudget.toFixed(0)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {c.completedInstalls} / {c.totalInstalls}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.startDate ? new Date(c.startDate).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.endDate ? new Date(c.endDate).toLocaleDateString() : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Rocket className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No push campaigns for this app</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Campaigns will appear here once created</p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} asChild>
            <Link href={`/apps/${id}/campaigns?page=${page - 1}`}>Previous</Link>
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
            <Link href={`/apps/${id}/campaigns?page=${page + 1}`}>Next</Link>
          </Button>
        </div>
      )}
    </div>
  );
}

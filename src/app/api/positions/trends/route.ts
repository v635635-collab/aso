import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { z } from 'zod';

const querySchema = z.object({
  appId: z.string().min(1),
  days: z.coerce.number().min(1).max(365).default(30),
  keywordId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const params = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    const since = new Date();
    since.setDate(since.getDate() - params.days);

    const where: Record<string, unknown> = {
      appId: params.appId,
      capturedAt: { gte: since },
    };
    if (params.keywordId) where.keywordId = params.keywordId;

    const snapshots = await prisma.positionSnapshot.findMany({
      where,
      orderBy: { capturedAt: 'asc' },
      include: { keyword: { select: { id: true, text: true } } },
    });

    const byKeyword = new Map<string, { keyword: string; keywordId: string; points: Array<{ date: string; position: number | null }> }>();

    for (const snap of snapshots) {
      const key = snap.keywordId;
      if (!byKeyword.has(key)) {
        byKeyword.set(key, {
          keyword: snap.keyword.text,
          keywordId: snap.keywordId,
          points: [],
        });
      }
      byKeyword.get(key)!.points.push({
        date: snap.capturedAt.toISOString().slice(0, 10),
        position: snap.position,
      });
    }

    const trends = Array.from(byKeyword.values());

    const avgPositions = trends.map((t) => {
      const positions = t.points.filter((p) => p.position != null).map((p) => p.position!);
      const avg = positions.length > 0 ? positions.reduce((s, p) => s + p, 0) / positions.length : null;
      const latest = t.points[t.points.length - 1]?.position ?? null;
      const earliest = t.points[0]?.position ?? null;
      const change = latest != null && earliest != null ? earliest - latest : null;
      return { keyword: t.keyword, keywordId: t.keywordId, avgPosition: avg, latestPosition: latest, change };
    });

    return apiSuccess({
      trends,
      summary: avgPositions,
      period: { from: since.toISOString(), to: new Date().toISOString(), days: params.days },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

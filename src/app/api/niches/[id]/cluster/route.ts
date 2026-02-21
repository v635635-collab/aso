import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { apiError } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { clusterKeywords } from '@/lib/optimization/niche-clusterer';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const niche = await prisma.niche.findUnique({
      where: { id },
      include: { keywords: { select: { id: true } } },
    });

    if (!niche) return apiError('NOT_FOUND', 'Niche not found', 404);
    if (niche.keywords.length < 3) {
      return apiError('VALIDATION_ERROR', 'Need at least 3 keywords to cluster', 400);
    }

    const job = await prisma.asyncJob.create({
      data: {
        type: 'NICHE_CLUSTER',
        triggeredBy: user.id,
        input: { nicheId: id, keywordIds: niche.keywords.map((k) => k.id) },
        status: 'RUNNING',
        startedAt: new Date(),
        relatedEntityType: 'niche',
        relatedEntityId: id,
      },
    });

    runClusterJob(job.id, id, niche.keywords.map((k) => k.id));

    return NextResponse.json(
      {
        success: true,
        data: { jobId: job.id, status: 'RUNNING' },
      },
      { status: 202 },
    );
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to start clustering', 500);
  }
}

async function runClusterJob(jobId: string, nicheId: string, keywordIds: string[]) {
  try {
    const clusters = await clusterKeywords(keywordIds);

    for (const cluster of clusters) {
      const childNiche = await prisma.niche.upsert({
        where: { name: cluster.name },
        update: {
          displayName: cluster.displayName,
          description: cluster.description,
          parentId: nicheId,
        },
        create: {
          name: cluster.name,
          displayName: cluster.displayName,
          description: cluster.description,
          parentId: nicheId,
        },
      });

      const keywordTexts = cluster.keywords.map((k) => k.toLowerCase().trim());
      await prisma.keyword.updateMany({
        where: {
          nicheId,
          normalizedText: { in: keywordTexts },
        },
        data: { nicheId: childNiche.id },
      });

      const count = await prisma.keyword.count({ where: { nicheId: childNiche.id } });
      await prisma.niche.update({
        where: { id: childNiche.id },
        data: { keywordCount: count },
      });
    }

    await prisma.asyncJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        output: { clusters: clusters.length },
        progress: 100,
        completedAt: new Date(),
      },
    });
  } catch (err) {
    await prisma.asyncJob.update({
      where: { id: jobId },
      data: {
        status: 'FAILED',
        error: err instanceof Error ? err.message : 'Unknown error',
      },
    });
  }
}

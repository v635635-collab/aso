import { NextRequest } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

const appUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  subtitle: z.string().optional().nullable(),
  currentTitle: z.string().optional().nullable(),
  currentSubtitle: z.string().optional().nullable(),
  type: z.enum(['NATIVE', 'WEBVIEW', 'HYBRID']).optional(),
  category: z.string().optional().nullable(),
  subcategory: z.string().optional().nullable(),
  storeUrl: z.string().url().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  status: z.enum(['DRAFT', 'IN_REVIEW', 'LIVE', 'SUSPENDED', 'REMOVED']).optional(),
  locale: z.string().optional(),
  country: z.string().optional(),
  organicDownloads: z.number().int().min(0).optional(),
  categoryRank: z.number().int().min(0).optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  reviewCount: z.number().int().min(0).optional(),
  accountId: z.string().optional(),
  nicheId: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional().nullable(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const app = await prisma.app.findUnique({
      where: { id },
      include: {
        account: { select: { id: true, email: true, teamName: true, status: true } },
        niche: { select: { id: true, name: true, displayName: true } },
        keywords: {
          take: 20,
          orderBy: { currentPosition: 'asc' },
          include: { keyword: { select: { id: true, text: true, trafficScore: true } } },
        },
        pushCampaigns: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, status: true, totalInstalls: true, startDate: true, endDate: true },
        },
        competitors: {
          take: 10,
          include: { competitor: { select: { id: true, name: true, iconUrl: true, rating: true } } },
        },
        _count: {
          select: { keywords: true, pushCampaigns: true, positionSnapshots: true, titleVariants: true, competitors: true },
        },
      },
    });

    if (!app) {
      return apiError('NOT_FOUND', 'App not found', 404);
    }
    return apiSuccess(app);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch app', 500);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = appUpdateSchema.parse(body);

    const app = await prisma.app.update({
      where: { id },
      data,
      include: {
        account: { select: { id: true, email: true, teamName: true } },
        niche: { select: { id: true, name: true, displayName: true } },
      },
    });

    return apiSuccess(app);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return apiError('VALIDATION_ERROR', 'Invalid app data', 400, err.issues);
    }
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2025') {
      return apiError('NOT_FOUND', 'App not found', 404);
    }
    return apiError('INTERNAL_ERROR', 'Failed to update app', 500);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    await prisma.app.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (err) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === 'P2025') {
      return apiError('NOT_FOUND', 'App not found', 404);
    }
    return apiError('INTERNAL_ERROR', 'Failed to delete app', 500);
  }
}

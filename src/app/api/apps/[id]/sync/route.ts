import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const app = await prisma.app.findUnique({ where: { id }, select: { id: true, name: true, appleId: true } });
    if (!app) {
      return apiError('NOT_FOUND', 'App not found', 404);
    }

    console.log(`[SYNC] Triggered sync for app: ${app.name} (${app.appleId}) at ${new Date().toISOString()}`);

    await prisma.app.update({
      where: { id },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ message: 'Sync triggered', appId: id, triggeredAt: new Date().toISOString() });
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to trigger sync', 500);
  }
}

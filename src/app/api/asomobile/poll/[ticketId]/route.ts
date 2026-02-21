import { NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { apiSuccess, apiError } from '@/lib/utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await params;

    const task = await prisma.aSOMobileTask.findUnique({
      where: { ticketId },
    });

    if (!task) {
      return apiError('NOT_FOUND', `Task with ticketId ${ticketId} not found`, 404);
    }

    return apiSuccess(task);
  } catch {
    return apiError('INTERNAL_ERROR', 'Something went wrong', 500);
  }
}

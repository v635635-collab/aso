import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { apiError } from '@/lib/utils';
import { analyzePessimization } from '@/lib/monitoring/pessimization-detector';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getCurrentUser();
    if (!user) return apiError('UNAUTHORIZED', 'Unauthorized', 401);

    const { id } = await params;

    const job = await analyzePessimization(id);

    return NextResponse.json(
      {
        success: true,
        data: { jobId: job.id, status: job.status },
      },
      { status: 202 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return apiError('INTERNAL_ERROR', message, 500);
  }
}

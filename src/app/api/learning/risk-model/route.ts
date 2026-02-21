import { apiSuccess, apiError } from '@/lib/utils';
import { getRiskModel } from '@/lib/learning/risk-model';

export async function GET() {
  try {
    const result = await getRiskModel();
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to fetch risk model', 500);
  }
}

import { apiSuccess, apiError } from '@/lib/utils';
import { generateInsights } from '@/lib/learning/insight-generator';

export async function GET() {
  try {
    const result = await generateInsights();
    return apiSuccess(result);
  } catch {
    return apiError('INTERNAL_ERROR', 'Failed to generate insights', 500);
  }
}

import { withCronWrapper } from '../wrapper';

export async function pessimizationDetectorJob(): Promise<void> {
  await withCronWrapper('pessimization-detector', async () => {
    try {
      const { detectPessimizations } = await import(
        '@/lib/monitoring/pessimization-detector'
      );
      const result = await detectPessimizations();
      return { itemsProcessed: result.detected };
    } catch {
      console.log('[CRON] pessimization-detector: monitoring module not yet available');
      return { itemsProcessed: 0 };
    }
  });
}

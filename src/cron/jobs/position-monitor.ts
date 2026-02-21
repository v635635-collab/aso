import { withCronWrapper } from '../wrapper';

export async function positionMonitorJob(): Promise<void> {
  await withCronWrapper('position-monitor', async () => {
    try {
      const { checkPositions } = await import('@/lib/monitoring/position-checker');
      const result = await checkPositions();
      return { itemsProcessed: result.checked };
    } catch {
      console.log('[CRON] position-monitor: monitoring module not yet available');
      return { itemsProcessed: 0 };
    }
  });
}

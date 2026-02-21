import { withCronWrapper } from '../wrapper';
import { pollPendingTasks } from '@/lib/asomobile/poller';

export async function asomobilePollerJob(): Promise<void> {
  await withCronWrapper('asomobile-poller', async () => {
    const result = await pollPendingTasks();
    return { itemsProcessed: result.processed };
  });
}

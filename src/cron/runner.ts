import cron from 'node-cron';
import { CRON_JOBS } from './index';

for (const [name, config] of CRON_JOBS) {
  cron.schedule(config.schedule, () => {
    config.handler().catch((err: unknown) => {
      process.stderr.write(
        `[CRON] Unhandled error in ${name}: ${err instanceof Error ? err.message : err}\n`,
      );
    });
  });
  process.stdout.write(`[CRON] Registered: ${name} (${config.schedule})\n`);
}

process.stdout.write(`[CRON] ${CRON_JOBS.size} jobs registered\n`);

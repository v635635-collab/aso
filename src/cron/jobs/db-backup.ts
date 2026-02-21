import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs';
import path from 'path';
import { withCronWrapper } from '../wrapper';
import { getSetting } from '@/lib/settings/service';

const execAsync = promisify(exec);
const BACKUP_DIR = process.env.BACKUP_DIR || '/var/backups/aso';

export async function dbBackupJob(): Promise<void> {
  await withCronWrapper('db-backup', async () => {
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not configured');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `aso-backup-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    await execAsync(`pg_dump "${dbUrl}" | gzip > "${filepath}"`);

    const retentionDays =
      ((await getSetting('data.backupRetentionDays')) as number | null) ?? 30;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    let cleaned = 0;

    const files = readdirSync(BACKUP_DIR);
    for (const file of files) {
      if (!file.startsWith('aso-backup-') || !file.endsWith('.sql.gz')) continue;
      const full = path.join(BACKUP_DIR, file);
      const stat = statSync(full);
      if (stat.mtimeMs < cutoff) {
        unlinkSync(full);
        cleaned++;
      }
    }

    console.log('[CRON] db-backup: S3 upload skipped, no credentials');

    return {
      itemsProcessed: 1,
      metadata: { filename, cleanedOldBackups: cleaned },
    };
  });
}

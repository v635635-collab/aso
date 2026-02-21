import { CRON_SCHEDULES } from '@/config/cron-schedule';

export interface CronJobConfig {
  schedule: string;
  handler: () => Promise<void>;
  description: string;
}

export const CRON_JOBS = new Map<string, CronJobConfig>();

import { asomobilePollerJob } from './jobs/asomobile-poller';
import { positionMonitorJob } from './jobs/position-monitor';
import { pessimizationDetectorJob } from './jobs/pessimization-detector';
import { keywordMetricsRefreshJob } from './jobs/keyword-metrics-refresh';
import { appSyncJob } from './jobs/app-sync';
import { nicheRecalculateJob } from './jobs/niche-recalculate';
import { learningUpdateJob } from './jobs/learning-update';
import { researchProcessorJob } from './jobs/research-processor';
import { dailyDigestJob } from './jobs/daily-digest';
import { campaignDailyExecutorJob } from './jobs/campaign-daily-executor';
import { autoTaggerJob } from './jobs/auto-tagger';
import { dbBackupJob } from './jobs/db-backup';
import { notificationDispatcherJob } from './jobs/notification-dispatcher';
import { dataArchiverJob } from './jobs/data-archiver';
import { trendsCollectorJob } from './jobs/trends-collector';
import { trendsAnalyzerJob } from './jobs/trends-analyzer';

const jobMap: Record<string, () => Promise<void>> = {
  'asomobile-poller': asomobilePollerJob,
  'position-monitor': positionMonitorJob,
  'pessimization-detector': pessimizationDetectorJob,
  'keyword-metrics-refresh': keywordMetricsRefreshJob,
  'app-sync': appSyncJob,
  'niche-recalculate': nicheRecalculateJob,
  'learning-update': learningUpdateJob,
  'research-processor': researchProcessorJob,
  'daily-digest': dailyDigestJob,
  'campaign-daily-executor': campaignDailyExecutorJob,
  'auto-tagger': autoTaggerJob,
  'db-backup': dbBackupJob,
  'notification-dispatcher': notificationDispatcherJob,
  'data-archiver': dataArchiverJob,
  'trends-collector': trendsCollectorJob,
  'trends-analyzer': trendsAnalyzerJob,
};

for (const [name, handler] of Object.entries(jobMap)) {
  const config = CRON_SCHEDULES[name];
  if (config) {
    CRON_JOBS.set(name, {
      schedule: config.schedule,
      handler,
      description: config.description,
    });
  }
}

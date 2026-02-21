function esc(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function formatPessimizationAlert(event: {
  appName: string;
  severity: string;
  avgDrop: number;
  affectedCount: number;
  detectedAt: string;
}): string {
  const icon = event.severity === 'CRITICAL' ? '\u{1F534}' : '\u{1F7E0}';
  return [
    `${icon} <b>Pessimization Detected</b>`,
    '',
    `<b>App:</b> ${esc(event.appName)}`,
    `<b>Severity:</b> ${event.severity}`,
    `<b>Avg drop:</b> ${event.avgDrop} positions`,
    `<b>Keywords affected:</b> ${event.affectedCount}`,
    `<b>Detected:</b> ${event.detectedAt}`,
  ].join('\n');
}

export function formatCampaignComplete(campaign: {
  name: string;
  appName: string;
  totalInstalls: number;
  durationDays: number;
  outcome: string;
}): string {
  const icon = campaign.outcome === 'SUCCESS' ? '\u{2705}' : '\u{26A0}\u{FE0F}';
  return [
    `${icon} <b>Campaign Completed</b>`,
    '',
    `<b>Campaign:</b> ${esc(campaign.name)}`,
    `<b>App:</b> ${esc(campaign.appName)}`,
    `<b>Installs:</b> ${campaign.totalInstalls}`,
    `<b>Duration:</b> ${campaign.durationDays} days`,
    `<b>Outcome:</b> ${campaign.outcome}`,
  ].join('\n');
}

export function formatDailyDigest(data: {
  date: string;
  activeApps: number;
  activeCampaigns: number;
  positionChanges: { improved: number; declined: number };
  pessimizations: number;
  topMovers: Array<{ app: string; keyword: string; change: number }>;
}): string {
  const movers = data.topMovers
    .slice(0, 5)
    .map((m) => `  ${m.change > 0 ? '\u{2B06}\u{FE0F}' : '\u{2B07}\u{FE0F}'} ${esc(m.app)} &mdash; "${esc(m.keyword)}" (${m.change > 0 ? '+' : ''}${m.change})`)
    .join('\n');

  return [
    `\u{1F4CA} <b>Daily Digest &mdash; ${esc(data.date)}</b>`,
    '',
    `<b>Active apps:</b> ${data.activeApps}`,
    `<b>Active campaigns:</b> ${data.activeCampaigns}`,
    `<b>Positions:</b> \u{2B06}\u{FE0F} ${data.positionChanges.improved} improved, \u{2B07}\u{FE0F} ${data.positionChanges.declined} declined`,
    `<b>Pessimizations:</b> ${data.pessimizations}`,
    '',
    movers ? `<b>Top movers:</b>\n${movers}` : '<i>No significant movers today</i>',
  ].join('\n');
}

export function formatCronError(jobName: string, error: string): string {
  return [
    `\u{26A0}\u{FE0F} <b>Cron Job Failed</b>`,
    '',
    `<b>Job:</b> ${esc(jobName)}`,
    `<b>Error:</b> <code>${esc(error.slice(0, 500))}</code>`,
    `<b>Time:</b> ${new Date().toISOString()}`,
  ].join('\n');
}

export function formatPushDayReady(campaign: string, day: number, installs: number): string {
  return [
    `\u{1F4F2} <b>Push Day Ready</b>`,
    '',
    `<b>Campaign:</b> ${esc(campaign)}`,
    `<b>Day:</b> ${day}`,
    `<b>Planned installs:</b> ${installs}`,
    '',
    '<i>Awaiting confirmation to execute.</i>',
  ].join('\n');
}

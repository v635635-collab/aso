import type { PushCampaign, PushDailyPlan } from '@prisma/client';

type ExportFormat = 'text' | 'csv' | 'json';

type CampaignWithPlans = PushCampaign & { dailyPlans: PushDailyPlan[] };

export function exportCampaignPlan(campaign: CampaignWithPlans, format: ExportFormat): string {
  const sorted = [...campaign.dailyPlans].sort((a, b) => a.day - b.day);

  switch (format) {
    case 'csv':
      return exportCSV(campaign, sorted);
    case 'json':
      return exportJSON(campaign, sorted);
    default:
      return exportText(campaign, sorted);
  }
}

function exportText(campaign: CampaignWithPlans, plans: PushDailyPlan[]): string {
  const lines: string[] = [
    `=== Push Campaign Plan ===`,
    `Campaign: ${campaign.name}`,
    `Strategy: ${campaign.strategy}`,
    `Duration: ${campaign.durationDays} days`,
    `Total Installs: ${campaign.totalInstalls}`,
    `Budget: $${campaign.totalBudget.toFixed(2)}`,
    `CPI: $${(campaign.costPerInstall || 0).toFixed(2)}`,
    `Country: ${campaign.targetCountry}`,
    `Keywords: ${campaign.targetKeywords.join(', ')}`,
    '',
    'Day | Date       | Installs | Cost',
    '----|------------|----------|--------',
  ];

  for (const plan of plans) {
    const date = new Date(plan.date).toISOString().slice(0, 10);
    const cost = (plan.plannedInstalls * (campaign.costPerInstall || 0)).toFixed(2);
    lines.push(
      `${String(plan.day).padStart(3)} | ${date} | ${String(plan.plannedInstalls).padStart(8)} | $${cost}`
    );
  }

  const totalCost = plans.reduce((s, p) => s + p.plannedInstalls * (campaign.costPerInstall || 0), 0);
  lines.push('');
  lines.push(`Total: ${campaign.totalInstalls} installs, $${totalCost.toFixed(2)}`);

  return lines.join('\n');
}

function exportCSV(campaign: CampaignWithPlans, plans: PushDailyPlan[]): string {
  const header = 'day,date,planned_installs,actual_installs,cost,status';
  const rows = plans.map((p) => {
    const date = new Date(p.date).toISOString().slice(0, 10);
    const cost = (p.plannedInstalls * (campaign.costPerInstall || 0)).toFixed(2);
    return `${p.day},${date},${p.plannedInstalls},${p.actualInstalls},${cost},${p.status}`;
  });
  return [header, ...rows].join('\n');
}

function exportJSON(campaign: CampaignWithPlans, plans: PushDailyPlan[]): string {
  return JSON.stringify({
    campaign: {
      id: campaign.id,
      name: campaign.name,
      strategy: campaign.strategy,
      country: campaign.targetCountry,
      keywords: campaign.targetKeywords,
      durationDays: campaign.durationDays,
      totalInstalls: campaign.totalInstalls,
      totalBudget: campaign.totalBudget,
      costPerInstall: campaign.costPerInstall,
    },
    dailyPlans: plans.map((p) => ({
      day: p.day,
      date: new Date(p.date).toISOString().slice(0, 10),
      plannedInstalls: p.plannedInstalls,
      actualInstalls: p.actualInstalls,
      cost: +(p.plannedInstalls * (campaign.costPerInstall || 0)).toFixed(2),
      status: p.status,
    })),
  }, null, 2);
}

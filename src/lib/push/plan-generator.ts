import prisma from '@/lib/prisma';
import { chatCompletion } from '@/lib/ai/openrouter';
import { getSetting } from '@/lib/settings/service';
import type { AsyncJob, PushStrategy } from '@prisma/client';

interface GeneratePlanParams {
  appId: string;
  targetKeywords: string[];
  strategy: PushStrategy;
  durationDays?: number;
  totalBudget?: number;
  costPerInstall?: number;
}

interface AIPlanResult {
  name: string;
  dailyPlans: { day: number; installs: number }[];
  totalInstalls: number;
  reasoning: string;
  riskAssessment: string;
  budgetAllocation: { totalBudget: number; costPerInstall: number };
}

export async function generatePushPlan(params: GeneratePlanParams): Promise<AsyncJob> {
  const job = await prisma.asyncJob.create({
    data: {
      type: 'GENERATE_PUSH_PLAN',
      status: 'PENDING',
      input: params as unknown as import('@prisma/client').Prisma.InputJsonValue,
      triggeredBy: 'system',
      relatedEntityType: 'App',
      relatedEntityId: params.appId,
    },
  });

  runPlanGeneration(job.id, params).catch((err) =>
    console.error('[PlanGenerator] Background generation failed:', err)
  );

  return job;
}

async function runPlanGeneration(jobId: string, params: GeneratePlanParams) {
  await prisma.asyncJob.update({
    where: { id: jobId },
    data: { status: 'RUNNING', startedAt: new Date(), progress: 10 },
  });

  try {
    const app = await prisma.app.findUnique({
      where: { id: params.appId },
      include: {
        niche: { select: { name: true, displayName: true, riskLevel: true, avgCompetition: true } },
        keywords: {
          include: { keyword: { select: { text: true, trafficScore: true, difficulty: true, sap: true } } },
        },
      },
    });

    if (!app) throw new Error(`App ${params.appId} not found`);

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 20 } });

    const targetKwData = app.keywords
      .filter((ak) => params.targetKeywords.includes(ak.keyword.text))
      .map((ak) => ({
        text: ak.keyword.text,
        traffic: ak.keyword.trafficScore,
        difficulty: ak.keyword.difficulty,
        currentPosition: ak.currentPosition,
      }));

    const learningRecords = await prisma.pushLearningRecord.findMany({
      where: app.niche ? { nicheSlug: app.niche.name } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 40 } });

    const model = ((await getSetting('ai.defaultModel')) as string) || 'openai/gpt-4o';
    const temperature = ((await getSetting('ai.temperature')) as number) || 0.7;
    const maxDailyInstalls = ((await getSetting('push.maxDailyInstalls')) as number) || 500;
    const durationDays = params.durationDays || 14;
    const cpi = params.costPerInstall || 0.15;
    const budget = params.totalBudget || durationDays * 50 * cpi;

    const learningContext = learningRecords.length > 0
      ? `\nPast campaign data for this niche (${learningRecords.length} records):
${learningRecords.slice(0, 5).map((r) =>
  `- Strategy: ${r.pushStrategy}, Daily: ${r.dailyInstalls}, Total: ${r.totalInstalls}, Duration: ${r.durationDays}d, Outcome: ${r.outcome}${r.pessimized ? ` (pessimized day ${r.pessimizationDay})` : ''}`
).join('\n')}`
      : '\nNo prior campaign data for this niche.';

    const prompt = `You are an ASO push campaign planner. Generate an install plan for the following app.

App: ${app.name} (${app.bundleId})
Category: ${app.category || 'Unknown'}
Organic Downloads: ${app.organicDownloads}/day
Category Rank: ${app.categoryRank || 'Unknown'}
Niche: ${app.niche?.displayName || 'Unknown'} (Risk: ${app.niche?.riskLevel || 'Unknown'})

Target keywords:
${targetKwData.map((k) => `- "${k.text}" traffic=${k.traffic} difficulty=${k.difficulty} pos=${k.currentPosition}`).join('\n')}

Strategy: ${params.strategy}
Duration: ${durationDays} days
Budget: $${budget.toFixed(2)}
Max daily installs allowed: ${maxDailyInstalls}
Target CPI: $${cpi.toFixed(2)}
${learningContext}

Strategy guidelines:
- GRADUAL: Slow ramp up over 5-7 days, maintain plateau, taper off. Safest approach.
- AGGRESSIVE: Fast ramp (2-3 days), high plateau, short taper. Higher risk of pessimization.
- CONSERVATIVE: Very slow ramp (7-10 days), low plateau, long duration. Minimal risk.
- CUSTOM: Balance between speed and safety based on keyword difficulty and niche risk.

Return a JSON object with:
{
  "name": "Campaign name (descriptive, short)",
  "dailyPlans": [{"day": 1, "installs": N}, ...],
  "totalInstalls": <sum>,
  "reasoning": "2-3 sentences explaining the plan approach",
  "riskAssessment": "Risk assessment paragraph",
  "budgetAllocation": {"totalBudget": N, "costPerInstall": N}
}

Rules:
- Day 1 always starts low
- Never exceed maxDailyInstalls on any day
- Installs must be whole numbers
- Total cost should be within budget
- Account for keyword difficulty when planning install volume`;

    const response = await chatCompletion(
      [
        { role: 'system', content: 'You are an ASO expert. Return only valid JSON, no markdown fences.' },
        { role: 'user', content: prompt },
      ],
      { model, temperature, maxTokens: 4096 }
    );

    await prisma.asyncJob.update({ where: { id: jobId }, data: { progress: 70 } });

    const content = (response as { choices: { message: { content: string } }[] }).choices?.[0]?.message?.content;
    if (!content) throw new Error('Empty AI response');

    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan: AIPlanResult = JSON.parse(cleaned);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(0, 0, 0, 0);

    const campaign = await prisma.pushCampaign.create({
      data: {
        appId: params.appId,
        name: plan.name,
        status: 'DRAFT',
        strategy: params.strategy,
        targetKeywords: params.targetKeywords,
        targetPositions: {},
        totalBudget: plan.budgetAllocation.totalBudget,
        costPerInstall: plan.budgetAllocation.costPerInstall,
        totalInstalls: plan.totalInstalls,
        durationDays: plan.dailyPlans.length,
        generatedBy: 'ai',
        aiReasoning: `${plan.reasoning}\n\nRisk Assessment:\n${plan.riskAssessment}`,
        startDate,
        endDate: new Date(startDate.getTime() + (plan.dailyPlans.length - 1) * 86400000),
        dailyPlans: {
          create: plan.dailyPlans.map((dp) => ({
            day: dp.day,
            date: new Date(startDate.getTime() + (dp.day - 1) * 86400000),
            plannedInstalls: dp.installs,
            status: 'PENDING',
          })),
        },
      },
      include: { dailyPlans: { orderBy: { day: 'asc' } } },
    });

    await prisma.asyncJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        output: { campaignId: campaign.id, name: campaign.name, totalInstalls: plan.totalInstalls },
        completedAt: new Date(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.asyncJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: message, completedAt: new Date() },
    });
    throw err;
  }
}
